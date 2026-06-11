import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const actorId = (session?.user as any)?.id
    const role = (session?.user as any)?.role
    if (!actorId || !['OWNER', 'EMPLOYEE'].includes(role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId, status, paymentStatus, reason } = body
    if (!bookingId || (!status && !paymentStatus)) {
      return NextResponse.json({ ok: false, error: 'Missing params' }, { status: 400 })
    }

    // Require a reason when certain sensitive changes occur
    if ((status === 'CANCELLED' || status === 'NO_SHOW' || paymentStatus === 'REFUNDED') && (!reason || !reason.trim())) {
      return NextResponse.json({ ok: false, error: 'Reason required for CANCELLED, NO_SHOW, or REFUNDED' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 })

    const updateData: Record<string, any> = {}
    if (status) {
      if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(status)) {
        return NextResponse.json({ ok: false, error: 'Invalid booking status' }, { status: 400 })
      }
      updateData.status = status
    }

    if (paymentStatus) {
      if (!['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'].includes(paymentStatus)) {
        return NextResponse.json({ ok: false, error: 'Invalid payment status' }, { status: 400 })
      }
      updateData.paymentStatus = paymentStatus
      if (paymentStatus === 'PAID') {
        updateData.paidCents = Math.max(booking.paidCents || 0, booking.totalCents)
      }
      if (paymentStatus === 'UNPAID' || paymentStatus === 'REFUNDED') {
        updateData.paidCents = 0
      }
    }

    if (reason && typeof reason === 'string' && reason.trim()) {
      const changeNote = `Status update reason: ${reason.trim()}`
      updateData.notes = booking.notes
        ? `${booking.notes}\n\n${changeNote}`
        : changeNote
    }

    await prisma.booking.update({ where: { id: bookingId }, data: updateData })

    if (status === 'COMPLETED' && booking.userId) {
      try {
        await prisma.user.update({ where: { id: booking.userId }, data: { points: { increment: Math.floor(booking.totalCents / 100) } } })
      } catch (e) {
        console.error('Failed to award points:', e)
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          bookingId: bookingId,
          actorId,
          actorRole: role as any,
          action: 'update_status',
          details: {
            oldStatus: booking.status,
            newStatus: status || booking.status,
            oldPaymentStatus: booking.paymentStatus,
            newPaymentStatus: paymentStatus || booking.paymentStatus,
            reason: reason?.trim() || null,
          },
        },
      })
    } catch (e) {
      console.error('Failed to write audit log (update status):', e)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('updateBookingStatus API error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update status' }, { status: 500 })
  }
}

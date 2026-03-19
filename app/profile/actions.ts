'use server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ─── Cancel Booking ──────────────────────────────────────────────────────────

export async function cancelBooking(bookingId: string, reason?: string) {
	try {
		const session = await getServerSession(authOptions)
		const userId = (session?.user as any)?.id

		if (!userId) {
			return { ok: false, error: 'You must be logged in to cancel a booking' }
		}

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			include: { spa: true, user: true },
		})

		if (!booking) return { ok: false, error: 'Booking not found' }
		if (booking.userId !== userId) return { ok: false, error: 'You can only cancel your own bookings' }
		if (booking.status === 'CANCELLED') return { ok: false, error: 'This booking is already cancelled' }
		if (booking.status === 'COMPLETED' || booking.status === 'NO_SHOW') {
			return { ok: false, error: 'Cannot cancel a completed or no-show booking' }
		}

		const now = new Date()
		const bookingStart = new Date(booking.start)

		// Don't allow cancellation after start time
		if (bookingStart <= now) {
			return { ok: false, error: 'Cannot cancel a booking that has already started' }
		}

		const hoursUntil = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)

		let feeCents = 0
		let refundCents = booking.paidCents

		if (hoursUntil < 12) {
			feeCents = booking.totalCents
			refundCents = 0
		} else if (hoursUntil < 24) {
			feeCents = Math.floor(booking.totalCents * 0.5)
			refundCents = Math.max(0, booking.paidCents - feeCents)
		}
		// else: full refund (feeCents = 0)

		await prisma.$transaction([
			prisma.booking.update({
				where: { id: bookingId },
				data: {
					status: 'CANCELLED',
					paymentStatus:
						refundCents > 0 && booking.paymentStatus === 'PAID'
							? 'REFUNDED'
							: booking.paymentStatus,
				},
			}),
			prisma.cancellation.create({
				data: {
					bookingId,
					reason: reason || 'Customer cancellation',
					feeCents,
				},
			}),
		])

		revalidatePath('/profile')
		revalidatePath('/manager')

		return {
			ok: true,
			feeCents,
			refundCents,
			message:
				refundCents > 0
					? `Booking cancelled. You will be refunded $${(refundCents / 100).toFixed(2)}`
					: feeCents > 0
					? `Booking cancelled. Cancellation fee: $${(feeCents / 100).toFixed(2)}`
					: 'Booking cancelled successfully',
		}
	} catch (error) {
		console.error('Cancel booking error:', error)
		return { ok: false, error: 'Failed to cancel booking' }
	}
}

// ─── Reschedule Booking ──────────────────────────────────────────────────────

const RescheduleInput = z.object({
	bookingId: z.string(),
	newStart: z.string(), // ISO datetime string e.g. "2025-11-05T14:30:00"
})

export async function rescheduleBooking(input: z.infer<typeof RescheduleInput>) {
	try {
		const session = await getServerSession(authOptions)
		const userId = (session?.user as any)?.id

		if (!userId) {
			return { ok: false, error: 'You must be logged in to reschedule a booking' }
		}

		// BUG FIX: original code included `subservice: true` inside the booking
		// findUnique but the `include` object was missing — added it here.
		const booking = await prisma.booking.findUnique({
			where: { id: input.bookingId },
			include: {
				spa: true,
				subservice: true, // ← BUG FIX: was missing; caused runtime crash on booking.subservice.durationMin
			},
		})

		if (!booking) return { ok: false, error: 'Booking not found' }
		if (booking.userId !== userId) return { ok: false, error: 'You can only reschedule your own bookings' }
		if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
			return { ok: false, error: 'Cannot reschedule a cancelled, completed, or no-show booking' }
		}

		// Parse new datetime as local time
		const [datePart, timePart] = input.newStart.split('T')
		const [year, month, day] = datePart.split('-').map(Number)
		const [hours, minutes] = timePart.split(':').map(Number)

		const newStart = new Date(year, month - 1, day, hours, minutes, 0, 0)
		const newEnd = new Date(newStart.getTime() + booking.subservice.durationMin * 60_000)

		if (newStart <= new Date()) {
			return { ok: false, error: 'Cannot reschedule to a past date/time' }
		}

		// Check for conflicts (excluding current booking)
		const overlap = await prisma.booking.findFirst({
			where: {
				id: { not: booking.id },
				spaId: booking.spaId,
				employeeId: booking.employeeId ?? undefined,
				start: { lte: newEnd },
				end: { gte: newStart },
				status: { in: ['PENDING', 'CONFIRMED'] },
			},
		})

		if (overlap) {
			return { ok: false, error: 'This time slot is not available. Please choose another time.' }
		}

		await prisma.booking.update({
			where: { id: input.bookingId },
			data: { start: newStart, end: newEnd },
		})

		revalidatePath('/profile')
		revalidatePath('/manager')

		return {
			ok: true,
			message: 'Booking rescheduled successfully',
			newStart: newStart.toISOString(),
		}
	} catch (error) {
		console.error('Reschedule booking error:', error)
		return { ok: false, error: 'Failed to reschedule booking' }
	}
}

// ─── Customer Stats ──────────────────────────────────────────────────────────

export async function getCustomerStats(userId: string) {
	try {
		const bookings = await prisma.booking.findMany({
			where: { userId },
			include: {
				subservice: { include: { service: true } },
				spa: true,
				employee: true,
			},
		})

		const now = new Date()
		const completedBookings = bookings.filter((b) => b.status === 'COMPLETED')
		// BUG FIX: totalSpent should sum paidCents from paid bookings, not just completed
		const totalSpent = bookings
			.filter((b) => b.paymentStatus === 'PAID' || b.paymentStatus === 'PARTIAL')
			.reduce((sum, b) => sum + b.paidCents, 0)

		// Favorite services
		const serviceCounts = new Map<string, { name: string; count: number }>()
		completedBookings.forEach((b) => {
			const id = b.subservice.serviceId
			const prev = serviceCounts.get(id) || { name: b.subservice.service.name, count: 0 }
			serviceCounts.set(id, { name: prev.name, count: prev.count + 1 })
		})
		const favoriteServices = Array.from(serviceCounts.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 3)

		// Preferred therapists
		const empCounts = new Map<string, { name: string; count: number }>()
		completedBookings.forEach((b) => {
			if (b.employee && b.employeeId) {
				const prev = empCounts.get(b.employeeId) || { name: b.employee.name, count: 0 }
				empCounts.set(b.employeeId, { name: prev.name, count: prev.count + 1 })
			}
		})
		const preferredTherapists = Array.from(empCounts.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 3)

		return {
			ok: true,
			stats: {
				totalBookings: bookings.length,
				completedBookings: completedBookings.length,
				totalSpent,
				favoriteServices,
				preferredTherapists,
				upcomingBookings: bookings.filter(
					(b) => b.start > now && b.status !== 'CANCELLED'
				).length,
			},
		}
	} catch (error) {
		console.error('Get customer stats error:', error)
		return { ok: false, error: 'Failed to fetch customer statistics' }
	}
}

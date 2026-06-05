import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const points = Number(body.points || 0)
    if (!points || points <= 0) return NextResponse.json({ ok: false, error: 'Invalid points' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    if (user.points < points) return NextResponse.json({ ok: false, error: 'Insufficient points' }, { status: 400 })

    const discountCents = points * 100 // 1 point = $1

    await prisma.user.update({ where: { id: userId }, data: { points: { decrement: points } } })

    return NextResponse.json({ ok: true, discountCents, remainingPoints: user.points - points })
  } catch (error) {
    console.error('Redeem points error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to redeem points' }, { status: 500 })
  }
}

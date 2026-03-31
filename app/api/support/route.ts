import { prisma } from '@/lib/prisma'
import { getSession } from 'next-auth/react'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any })
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      include: {
        spa: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Failed to fetch support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any })
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { subject, message, spaId, priority = 'MEDIUM' } = body

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        message,
        spaId,
        priority,
        status: 'OPEN',
      },
      include: {
        spa: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Failed to create support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    )
  }
}

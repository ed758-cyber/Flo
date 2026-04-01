import { prisma } from '@/lib/prisma'
import { getSession } from 'next-auth/react'
import { NextRequest, NextResponse } from 'next/server'
import { SupportStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any })
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        OwnedSpas: {
          select: { id: true },
        },
      },
    })

    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status') || 'OPEN'
    const status = statusParam as SupportStatus

    const spaIds = user.OwnedSpas.map((spa) => spa.id)

    const tickets = await prisma.supportTicket.findMany({
      where: {
        spaId: { in: spaIds },
        status,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
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

import { prisma } from '@/lib/prisma'
import { getSession } from 'next-auth/react'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const spaSlug = searchParams.get('spaSlug')

    if (!spaSlug) {
      return NextResponse.json({ error: 'Spa slug required' }, { status: 400 })
    }

    const spa = await prisma.spa.findUnique({
      where: { slug: spaSlug },
    })

    if (!spa) {
      return NextResponse.json({ error: 'Spa not found' }, { status: 404 })
    }

    const reviews = await prisma.review.findMany({
      where: { spaId: spa.id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
    })
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
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

    const body = await request.json()
    const { spaId, rating, title, comment, bookingId } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const review = await prisma.review.create({
      data: {
        spaId,
        userId: user.id,
        rating,
        title,
        comment,
        bookingId,
        verified: true,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Failed to create review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}

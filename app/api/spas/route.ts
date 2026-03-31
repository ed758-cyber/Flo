import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const spas = await prisma.spa.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        address: true,
        email: true,
        phone: true,
        Reviews: {
          select: {
            rating: true,
          },
        },
      },
    })

    const formattedSpas = spas.map((spa) => ({
      ...spa,
      averageRating:
        spa.Reviews.length > 0
          ? Math.round((spa.Reviews.reduce((sum, r) => sum + r.rating, 0) / spa.Reviews.length) * 10) / 10
          : 0,
      reviewCount: spa.Reviews.length,
      Reviews: undefined,
    }))

    return NextResponse.json(formattedSpas)
  } catch (error) {
    console.error('Failed to fetch spas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spas' },
      { status: 500 }
    )
  }
}

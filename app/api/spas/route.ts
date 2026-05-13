import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function getSpaPriceInfo(subservices: Array<{ priceCents: number }>) {
  if (subservices.length === 0) return { minPriceCents: 0, maxPriceCents: 0 }
  const prices = subservices.map((item) => item.priceCents)
  return {
    minPriceCents: Math.min(...prices),
    maxPriceCents: Math.max(...prices),
  }
}

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
        businessHours: true,
        Services: {
          select: {
            name: true,
          },
        },
        Subservices: {
          select: {
            priceCents: true,
          },
        },
        Reviews: {
          select: {
            rating: true,
          },
        },
      },
    })

    const formattedSpas = spas.map((spa) => {
      const { minPriceCents, maxPriceCents } = getSpaPriceInfo(spa.Subservices)
      const serviceTypes = Array.from(new Set(spa.Services.map((service) => service.name)))
      return {
        id: spa.id,
        name: spa.name,
        slug: spa.slug,
        description: spa.description,
        logoUrl: spa.logoUrl,
        address: spa.address,
        email: spa.email,
        phone: spa.phone,
        businessHours: spa.businessHours,
        minPriceCents,
        maxPriceCents,
        serviceTypes,
        averageRating:
          spa.Reviews.length > 0
            ? Math.round((spa.Reviews.reduce((sum, r) => sum + r.rating, 0) / spa.Reviews.length) * 10) / 10
            : 0,
        reviewCount: spa.Reviews.length,
      }
    })

    return NextResponse.json(formattedSpas)
  } catch (error) {
    console.error('Failed to fetch spas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spas' },
      { status: 500 }
    )
  }
}

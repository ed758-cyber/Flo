import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const spaId = searchParams.get('spaId')
	const subserviceId = searchParams.get('subserviceId')
	const from = searchParams.get('from')
	const to = searchParams.get('to')
	if (!spaId || !subserviceId || !from || !to)
		return NextResponse.json({ error: 'Missing params' }, { status: 400 })

	// TODO: real availability logic
	return NextResponse.json({ slots: [] })
}

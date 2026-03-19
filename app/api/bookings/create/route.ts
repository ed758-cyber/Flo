import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
	try {
		const { spaId, start, end } = await req.json()

		if (!spaId || !start || !end) {
			return new NextResponse('Missing fields', { status: 400 })
		}

		const bookingId = randomUUID()

		// TODO: Replace with your DB create
		// Example (Prisma):
		// const booking = await prisma.booking.create({
		//   data: {
		//     id: bookingId,
		//     spaId,
		//     start: new Date(start),
		//     end: new Date(end),
		//     status: 'PENDING',
		//     paymentStatus: 'UNPAID',
		//     totalCents: 0,
		//   },
		// })

		return NextResponse.json({ ok: true, bookingId })
	} catch (e: any) {
		return new NextResponse(e?.message || 'Server error', { status: 500 })
	}
}

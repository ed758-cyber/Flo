import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	try {
		const { bookingId, newStart, newEnd } = await req.json()

		if (!bookingId || !newStart || !newEnd) {
			return new NextResponse('Missing fields', { status: 400 })
		}

		// TODO: Replace with your DB update
		// مثال (Prisma):
		// await prisma.booking.update({
		//   where: { id: bookingId },
		//   data: { start: new Date(newStart), end: new Date(newEnd) },
		// })

		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return new NextResponse(e?.message || 'Server error', { status: 500 })
	}
}

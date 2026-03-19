import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
	const sig = req.headers.get('stripe-signature') || ''
	let event: Stripe.Event
	const buf = await req.text()

	try {
		event = stripe.webhooks.constructEvent(
			buf,
			sig,
			process.env.STRIPE_WEBHOOK_SECRET!
		)
	} catch (err: any) {
		return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
	}

	if (event.type === 'payment_intent.succeeded') {
		const pi = event.data.object as Stripe.PaymentIntent
		const bookingId = (pi.metadata as any).bookingId
		if (bookingId) {
			await prisma.booking.update({
				where: { id: bookingId },
				data: {
					paymentStatus: 'PAID',
					paidCents: pi.amount,
					status: 'CONFIRMED',
				},
			})
		}
	}

	return NextResponse.json({ received: true })
}

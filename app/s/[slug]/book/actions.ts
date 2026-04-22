'use server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const BookingInput = z.object({
	spaId: z.string(),
	subserviceIds: z.array(z.string()).min(1, 'Select at least one service'),
	employeeId: z.string().optional(),
	start: z.string(),
	paymentMethod: z.enum(['CARD', 'CASH']),
	payType: z.enum(['FULL', 'DEPOSIT']).default('FULL'),
	notes: z.string().optional(),
	consentSignature: z.string().optional(),
	intakeForm: z.record(z.string(), z.string()).optional(),
})

export async function createBooking(input: z.infer<typeof BookingInput>) {
	try {
		const session = await getServerSession(authOptions)
		const userId = (session?.user as any)?.id ?? null

		const spa = await prisma.spa.findUnique({
			where: { id: input.spaId },
			select: {
				id: true,
				requiresBookingConsent: true,
				bookingConsentText: true,
			},
		})
		if (!spa) return { ok: false, error: 'Spa not found' }

		const subservices = await prisma.subservice.findMany({
			where: {
				id: { in: input.subserviceIds },
				spaId: input.spaId,
			},
			include: {
				service: true,
			},
		})
		if (subservices.length !== input.subserviceIds.length) {
			return { ok: false, error: 'One or more selected services are invalid' }
		}

		const orderedSubservices = input.subserviceIds
			.map((id) => subservices.find((sub) => sub.id === id))
			.filter(Boolean)

		if (orderedSubservices.length === 0) {
			return { ok: false, error: 'Select at least one service' }
		}

		// Parse datetime string as local time (avoids UTC timezone shift)
		const [datePart, timePart] = input.start.split('T')
		const [year, month, day] = datePart.split('-').map(Number)
		const [hours, minutes] = timePart.split(':').map(Number)

		const start = new Date(year, month - 1, day, hours, minutes, 0, 0)
		const totalDurationMin = orderedSubservices.reduce(
			(total, sub) => total + sub!.durationMin,
			0,
		)
		const end = new Date(start.getTime() + totalDurationMin * 60_000)
		const totalCents = orderedSubservices.reduce(
			(total, sub) => total + sub!.priceCents,
			0,
		)

		// Validate start is in the future
		if (start <= new Date()) {
			return { ok: false, error: 'Cannot book a time in the past' }
		}

		if (
			spa.requiresBookingConsent &&
			(!input.consentSignature || !input.consentSignature.trim())
		) {
			return {
				ok: false,
				error: 'Please sign the required spa consent form before booking.',
			}
		}

		// Check overlap
		const overlap = await prisma.booking.findFirst({
			where: {
				employeeId: input.employeeId ?? undefined,
				start: { lte: end },
				end: { gte: start },
				spaId: input.spaId,
				status: { in: ['PENDING', 'CONFIRMED'] },
			},
		})
		if (overlap) return { ok: false, error: 'Time slot not available' }

		// BUG FIX: For CARD payments, paidCents should start at 0.
		// We only mark it PAID + set paidCents after Stripe confirms.
		// Setting paidCents = totalCents before payment is premature.
		const booking = await prisma.booking.create({
			data: {
				spaId: input.spaId,
				userId,
				employeeId: input.employeeId,
				subserviceId: orderedSubservices[0]!.id,
				start,
				end,
				// CASH: confirmed immediately, payment collected on site
				// CARD: pending until Stripe webhook confirms
				status: input.paymentMethod === 'CASH' ? 'CONFIRMED' : 'PENDING',
				paymentMethod: input.paymentMethod,
				paymentStatus: 'UNPAID',
				totalCents,
				paidCents: 0, // BUG FIX: always 0 until actually paid
				notes: input.notes?.trim() || null,
				intakeForm: input.intakeForm || undefined,
				customerName: session?.user?.name || null,
				customerEmail: session?.user?.email || null,
				consentAcceptedAt: spa.requiresBookingConsent ? new Date() : null,
				consentSignature:
					spa.requiresBookingConsent && input.consentSignature
						? input.consentSignature.trim()
						: null,
				BookingItems: {
					create: orderedSubservices.map((sub, index) => ({
						subserviceId: sub!.id,
						orderIndex: index,
					})),
				},
			},
		})

		if (input.paymentMethod === 'CARD') {
			// Validate Stripe is configured
			if (
				!process.env.STRIPE_SECRET_KEY ||
				process.env.STRIPE_SECRET_KEY.startsWith('sk_test_xxx') ||
				process.env.STRIPE_SECRET_KEY === ''
			) {
				await prisma.booking.delete({ where: { id: booking.id } })
				return {
					ok: false,
					error: 'Card payment is not available. Please select cash payment instead.',
				}
			}

			try {
				const pi = await stripe.paymentIntents.create({
					amount: totalCents,
					currency: 'usd',
					metadata: { bookingId: booking.id, spaId: booking.spaId },
				})
				await prisma.booking.update({
					where: { id: booking.id },
					data: { stripePiId: pi.id },
				})
				return { ok: true, clientSecret: pi.client_secret, bookingId: booking.id }
			} catch {
				await prisma.booking.delete({ where: { id: booking.id } })
				return {
					ok: false,
					error: 'Card payment failed. Please use cash payment instead.',
				}
			}
		}

		return { ok: true, bookingId: booking.id }
	} catch (error) {
		console.error('Booking error:', error)
		return { ok: false, error: 'An unexpected error occurred. Please try again.' }
	}
}

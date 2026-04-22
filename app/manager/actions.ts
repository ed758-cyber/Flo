'use server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getOwnerSession() {
	const session = await getServerSession(authOptions)
	const userId = (session?.user as any)?.id
	const role = (session?.user as any)?.role
	if (!userId || role !== 'OWNER') return null
	return { userId, role }
}

// ─── Create Booking (manager-side, no Stripe required) ───────────────────────
// BUG FIX: original code called fetch('/api/bookings/create') — a relative URL
// which is invalid in server-side RSC/server-action context. Now uses Prisma directly.

const ManagerBookingInput = z.object({
	spaId: z.string(),
	subserviceIds: z.array(z.string()).min(1, 'Select at least one service'),
	employeeId: z.string().optional(),
	start: z.string(), // "YYYY-MM-DDTHH:mm:00"
	paymentMethod: z.enum(['CARD', 'CASH']),
	customerName: z.string().optional(),
	customerEmail: z.string().email().optional().or(z.literal('')),
	customerPhone: z.string().optional(),
	notes: z.string().optional(),
})

export async function createBooking(
	input: z.infer<typeof ManagerBookingInput>,
) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const sub = await prisma.subservice.findUnique({
			where: { id: input.subserviceIds[0] },
		})
		if (!sub) return { ok: false, error: 'Invalid subservice' }

		const subservices = await prisma.subservice.findMany({
			where: {
				id: { in: input.subserviceIds },
				spaId: input.spaId,
			},
		})
		if (subservices.length !== input.subserviceIds.length) {
			return { ok: false, error: 'One or more selected services are invalid' }
		}

		const orderedSubservices = input.subserviceIds
			.map((id) => subservices.find((item) => item.id === id))
			.filter(Boolean)

		const [datePart, timePart] = input.start.split('T')
		const [year, month, day] = datePart.split('-').map(Number)
		const [hours, minutes] = timePart.split(':').map(Number)
		const start = new Date(year, month - 1, day, hours, minutes, 0, 0)
		const totalDurationMin = orderedSubservices.reduce(
			(total, item) => total + item!.durationMin,
			0,
		)
		const totalCents = orderedSubservices.reduce(
			(total, item) => total + item!.priceCents,
			0,
		)
		const end = new Date(start.getTime() + totalDurationMin * 60_000)

		if (start <= new Date()) {
			return { ok: false, error: 'Cannot book a time in the past' }
		}

		const overlap = await prisma.booking.findFirst({
			where: {
				spaId: input.spaId,
				employeeId: input.employeeId ?? undefined,
				start: { lte: end },
				end: { gte: start },
				status: { in: ['PENDING', 'CONFIRMED'] },
			},
		})
		if (overlap) return { ok: false, error: 'Time slot is already booked' }

		// Try to find or create a user record for walk-in customers
		let userId: string | null = null
		if (input.customerEmail) {
			const existingUser = await prisma.user.findUnique({
				where: { email: input.customerEmail },
			})
			if (existingUser) {
				userId = existingUser.id
			} else if (input.customerName) {
				// Create a lightweight user record for walk-ins
				const newUser = await prisma.user.create({
					data: {
						email: input.customerEmail,
						name: input.customerName,
						role: 'USER',
					},
				})
				userId = newUser.id
			}
		}

		const booking = await prisma.booking.create({
			data: {
				spaId: input.spaId,
				userId,
				employeeId: input.employeeId || null,
				subserviceId: orderedSubservices[0]!.id,
				start,
				end,
				status: 'CONFIRMED',
				paymentMethod: input.paymentMethod,
				paymentStatus: 'UNPAID',
				totalCents,
				paidCents: 0,
				notes: input.notes || null,
				customerName: input.customerName || null,
				customerEmail: input.customerEmail || null,
				customerPhone: input.customerPhone || null,
				BookingItems: {
					create: orderedSubservices.map((item, index) => ({
						subserviceId: item!.id,
						orderIndex: index,
					})),
				},
			},
		})

		revalidatePath('/manager')
		return { ok: true, bookingId: booking.id }
	} catch (error) {
		console.error('Manager createBooking error:', error)
		return { ok: false, error: 'Failed to create booking' }
	}
}

// ─── Reschedule Booking ───────────────────────────────────────────────────────

export async function rescheduleBooking(input: {
	bookingId: string
	newStart: string
}) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const booking = await prisma.booking.findUnique({
			where: { id: input.bookingId },
			include: { BookingItems: { include: { subservice: true } }, subservice: true },
		})
		if (!booking) return { ok: false, error: 'Booking not found' }

		const [datePart, timePart] = input.newStart.split('T')
		const [year, month, day] = datePart.split('-').map(Number)
		const [hours, minutes] = timePart.split(':').map(Number)
		const newStart = new Date(year, month - 1, day, hours, minutes, 0, 0)
		const durationMin =
			booking.BookingItems.length > 0
				? booking.BookingItems.reduce(
					(total, item) => total + item.subservice.durationMin,
					0,
				)
				: booking.subservice.durationMin
		const newEnd = new Date(newStart.getTime() + durationMin * 60_000)

		if (newStart <= new Date()) {
			return { ok: false, error: 'Cannot reschedule to a past time' }
		}

		const overlap = await prisma.booking.findFirst({
			where: {
				id: { not: booking.id },
				spaId: booking.spaId,
				employeeId: booking.employeeId ?? undefined,
				start: { lte: newEnd },
				end: { gte: newStart },
				status: { in: ['PENDING', 'CONFIRMED'] },
			},
		})
		if (overlap) return { ok: false, error: 'That time slot is already taken' }

		await prisma.booking.update({
			where: { id: input.bookingId },
			data: { start: newStart, end: newEnd },
		})

		revalidatePath('/manager')
		return { ok: true, message: 'Booking rescheduled' }
	} catch (error) {
		console.error('Manager rescheduleBooking error:', error)
		return { ok: false, error: 'Failed to reschedule booking' }
	}
}

// ─── Cancel Booking ───────────────────────────────────────────────────────────

export async function cancelBookingManager(bookingId: string, reason?: string) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
		})
		if (!booking) return { ok: false, error: 'Booking not found' }
		if (booking.status === 'CANCELLED')
			return { ok: false, error: 'Already cancelled' }

		await prisma.$transaction([
			prisma.booking.update({
				where: { id: bookingId },
				data: { status: 'CANCELLED' },
			}),
			prisma.cancellation.create({
				data: {
					bookingId,
					reason: reason || 'Manager cancellation',
					feeCents: 0,
				},
			}),
		])

		revalidatePath('/manager')
		return { ok: true, message: 'Booking cancelled' }
	} catch (error) {
		console.error('cancelBookingManager error:', error)
		return { ok: false, error: 'Failed to cancel booking' }
	}
}

// ─── Update Booking Payment ───────────────────────────────────────────────────

export async function markBookingPaid(bookingId: string) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
		})
		if (!booking) return { ok: false, error: 'Booking not found' }

		await prisma.booking.update({
			where: { id: bookingId },
			data: {
				paymentStatus: 'PAID',
				paidCents: booking.totalCents,
				status: 'CONFIRMED',
			},
		})

		revalidatePath('/manager')
		return { ok: true }
	} catch (error) {
		return { ok: false, error: 'Failed to update payment' }
	}
}

// ─── Update Booking Status ────────────────────────────────────────────────────

export async function updateBookingStatus(
	bookingId: string,
	status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED',
) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		await prisma.booking.update({
			where: { id: bookingId },
			data: { status },
		})

		revalidatePath('/manager')
		return { ok: true }
	} catch (error) {
		return { ok: false, error: 'Failed to update status' }
	}
}

// ─── Update Booking Amount ────────────────────────────────────────────────────

export async function updateBookingAmount(
	bookingId: string,
	newTotalCents: number,
	reason: string,
) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
		})
		if (!booking) return { ok: false, error: 'Booking not found' }

		// Update the booking amount
		await prisma.booking.update({
			where: { id: bookingId },
			data: {
				totalCents: newTotalCents,
				// If the booking was already paid, adjust the paid amount to match
				paidCents: booking.paymentStatus === 'PAID' ? newTotalCents : booking.paidCents,
			},
		})

		// Create a note/log entry for the change (we'll use the notes field to track this)
		const changeNote = `Amount changed from $${(booking.totalCents / 100).toFixed(2)} to $${(newTotalCents / 100).toFixed(2)} on ${new Date().toLocaleDateString()} - ${reason}`
		const updatedNotes = booking.notes 
			? `${booking.notes}\n\n${changeNote}`
			: changeNote

		await prisma.booking.update({
			where: { id: bookingId },
			data: { notes: updatedNotes },
		})

		revalidatePath('/manager')
		return { ok: true, message: 'Booking amount updated' }
	} catch (error) {
		console.error('updateBookingAmount error:', error)
		return { ok: false, error: 'Failed to update booking amount' }
	}
}

// ─── Staff (Employee) Management ─────────────────────────────────────────────

const EmployeeInput = z.object({
	spaId: z.string(),
	name: z.string().min(1, 'Name is required'),
	bio: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional().or(z.literal('')),
})

export async function createEmployee(input: z.infer<typeof EmployeeInput>) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		// Verify spa belongs to this owner
		const spa = await prisma.spa.findFirst({
			where: { id: input.spaId, ownerId: auth.userId },
		})
		if (!spa) return { ok: false, error: 'Spa not found or unauthorized' }

		const employee = await prisma.employee.create({
			data: {
				spaId: input.spaId,
				name: input.name,
				bio: input.bio || '',
				phone: input.phone || null,
				email: input.email || null,
				schedule: {},
			},
		})

		revalidatePath('/manager')
		return { ok: true, employee }
	} catch (error) {
		console.error('createEmployee error:', error)
		return { ok: false, error: 'Failed to create staff member' }
	}
}

export async function updateEmployee(
	employeeId: string,
	data: { name?: string; bio?: string; phone?: string; email?: string },
) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		// Verify employee belongs to owner's spa
		const emp = await prisma.employee.findFirst({
			where: { id: employeeId, spa: { ownerId: auth.userId } },
		})
		if (!emp) return { ok: false, error: 'Employee not found or unauthorized' }

		const updated = await prisma.employee.update({
			where: { id: employeeId },
			data: {
				name: data.name ?? emp.name,
				bio: data.bio ?? emp.bio,
				phone: data.phone ?? emp.phone,
				email: data.email ?? emp.email,
			},
		})

		revalidatePath('/manager')
		return { ok: true, employee: updated }
	} catch (error) {
		console.error('updateEmployee error:', error)
		return { ok: false, error: 'Failed to update staff member' }
	}
}

export async function deleteEmployee(employeeId: string) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const emp = await prisma.employee.findFirst({
			where: { id: employeeId, spa: { ownerId: auth.userId } },
		})
		if (!emp) return { ok: false, error: 'Employee not found or unauthorized' }

		// Check for future bookings
		const futureBookings = await prisma.booking.count({
			where: {
				employeeId,
				start: { gte: new Date() },
				status: { in: ['PENDING', 'CONFIRMED'] },
			},
		})
		if (futureBookings > 0) {
			return {
				ok: false,
				error: `Cannot delete: ${futureBookings} upcoming booking(s) assigned to this staff member`,
			}
		}

		await prisma.employee.delete({ where: { id: employeeId } })
		revalidatePath('/manager')
		return { ok: true }
	} catch (error) {
		console.error('deleteEmployee error:', error)
		return { ok: false, error: 'Failed to delete staff member' }
	}
}

// ─── Service Management ───────────────────────────────────────────────────────

export async function createService(
	spaId: string,
	name: string,
	description?: string,
) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const spa = await prisma.spa.findFirst({
			where: { id: spaId, ownerId: auth.userId },
		})
		if (!spa) return { ok: false, error: 'Spa not found or unauthorized' }

		const service = await prisma.service.create({
			data: { spaId, name, description: description || '' },
		})

		revalidatePath('/manager')
		return { ok: true, service }
	} catch (error) {
		return { ok: false, error: 'Failed to create service' }
	}
}

export async function updateService(
	serviceId: string,
	data: { name?: string; description?: string },
) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const service = await prisma.service.findFirst({
			where: { id: serviceId, spa: { ownerId: auth.userId } },
		})
		if (!service) return { ok: false, error: 'Service not found or unauthorized' }

		await prisma.service.update({
			where: { id: serviceId },
			data: {
				name: data.name ?? service.name,
				description: data.description ?? service.description,
			},
		})

		revalidatePath('/manager')
		return { ok: true }
	} catch (error) {
		return { ok: false, error: 'Failed to update service' }
	}
}

export async function deleteService(serviceId: string) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const service = await prisma.service.findFirst({
			where: {
				id: serviceId,
				spa: { ownerId: auth.userId },
			},
			include: {
				Subservices: {
					include: {
						Bookings: {
							where: {
								status: { in: ['PENDING', 'CONFIRMED'] },
								start: { gte: new Date() },
							},
							select: { id: true },
						},
						BookingItems: {
							where: {
								booking: {
									status: { in: ['PENDING', 'CONFIRMED'] },
									start: { gte: new Date() },
								},
							},
							select: { id: true },
						},
					},
				},
			},
		})
		if (!service) return { ok: false, error: 'Service not found or unauthorized' }

		const hasUpcomingBookings = service.Subservices.some(
			(sub) => sub.Bookings.length > 0 || sub.BookingItems.length > 0,
		)
		if (hasUpcomingBookings) {
			return {
				ok: false,
				error: 'Cannot delete a service category with upcoming bookings.',
			}
		}

		await prisma.service.delete({ where: { id: serviceId } })
		revalidatePath('/manager')
		return { ok: true }
	} catch (error) {
		return { ok: false, error: 'Failed to delete service' }
	}
}

export async function createSubservice(input: {
	serviceId: string
	spaId: string
	name: string
	description?: string
	durationMin: number
	priceCents: number
}) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const sub = await prisma.subservice.create({
			data: {
				serviceId: input.serviceId,
				spaId: input.spaId,
				name: input.name,
				description: input.description || '',
				durationMin: input.durationMin,
				priceCents: input.priceCents,
			},
		})

		revalidatePath('/manager')
		return { ok: true, subservice: sub }
	} catch (error) {
		return { ok: false, error: 'Failed to create subservice' }
	}
}

export async function updateSubservice(
	subserviceId: string,
	data: {
		name?: string
		description?: string
		durationMin?: number
		priceCents?: number
	},
) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const subservice = await prisma.subservice.findFirst({
			where: { id: subserviceId, spa: { ownerId: auth.userId } },
		})
		if (!subservice) {
			return { ok: false, error: 'Treatment not found or unauthorized' }
		}

		await prisma.subservice.update({
			where: { id: subserviceId },
			data: {
				name: data.name ?? subservice.name,
				description: data.description ?? subservice.description,
				durationMin: data.durationMin ?? subservice.durationMin,
				priceCents: data.priceCents ?? subservice.priceCents,
			},
		})

		revalidatePath('/manager')
		return { ok: true }
	} catch (error) {
		return { ok: false, error: 'Failed to update treatment' }
	}
}

export async function deleteSubservice(subserviceId: string) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const subservice = await prisma.subservice.findFirst({
			where: { id: subserviceId, spa: { ownerId: auth.userId } },
			include: {
				Bookings: {
					where: {
						status: { in: ['PENDING', 'CONFIRMED'] },
						start: { gte: new Date() },
					},
					select: { id: true },
				},
				BookingItems: {
					where: {
						booking: {
							status: { in: ['PENDING', 'CONFIRMED'] },
							start: { gte: new Date() },
						},
					},
					select: { id: true },
				},
			},
		})
		if (!subservice) return { ok: false, error: 'Treatment not found or unauthorized' }
		if (subservice.Bookings.length > 0 || subservice.BookingItems.length > 0) {
			return {
				ok: false,
				error: 'Cannot delete a treatment with upcoming bookings.',
			}
		}

		await prisma.subservice.delete({ where: { id: subserviceId } })
		revalidatePath('/manager')
		return { ok: true }
	} catch (error) {
		return { ok: false, error: 'Failed to delete subservice' }
	}
}

// ─── Spa Settings ─────────────────────────────────────────────────────────────

export async function updateSpaSettings(
	spaId: string,
	data: {
		name?: string
		description?: string
		address?: string
		phone?: string
		email?: string
		openTime?: string
		closeTime?: string
		requiresBookingConsent?: boolean
		bookingConsentText?: string
	},
) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const spa = await prisma.spa.findFirst({
			where: { id: spaId, ownerId: auth.userId },
		})
		if (!spa) return { ok: false, error: 'Spa not found or unauthorized' }

		await prisma.spa.update({
			where: { id: spaId },
			data,
		})

		revalidatePath('/manager')
		revalidatePath(`/s/${spa.slug}`)
		return { ok: true }
	} catch (error) {
		return { ok: false, error: 'Failed to update spa settings' }
	}
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getSpaAnalytics(spaId: string) {
	try {
		const auth = await getOwnerSession()
		if (!auth) return { ok: false, error: 'Unauthorized' }

		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
		const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

		const [allBookings, monthBookings, lastMonthBookings] = await Promise.all([
			prisma.booking.findMany({
				where: { spaId },
				include: {
					subservice: { include: { service: true } },
					employee: true,
					user: true,
				},
				orderBy: { start: 'desc' },
			}),
			prisma.booking.findMany({
				where: { spaId, start: { gte: startOfMonth } },
			}),
			prisma.booking.findMany({
				where: {
					spaId,
					start: { gte: startOfLastMonth, lte: endOfLastMonth },
					paymentStatus: 'PAID',
				},
			}),
		])

		const paidBookings = allBookings.filter((b) => b.paymentStatus === 'PAID')
		const totalRevenue = paidBookings.reduce((s, b) => s + b.paidCents, 0)
		const monthRevenue = monthBookings
			.filter((b) => b.paymentStatus === 'PAID')
			.reduce((s, b) => s + b.paidCents, 0)
		const lastMonthRevenue = lastMonthBookings.reduce(
			(s, b) => s + b.paidCents,
			0,
		)

		// Top services
		const serviceCounts = new Map<
			string,
			{ name: string; count: number; revenue: number }
		>()
		paidBookings.forEach((b) => {
			const key = b.subservice.serviceId
			const prev = serviceCounts.get(key) || {
				name: b.subservice.service.name,
				count: 0,
				revenue: 0,
			}
			serviceCounts.set(key, {
				name: prev.name,
				count: prev.count + 1,
				revenue: prev.revenue + b.paidCents,
			})
		})
		const topServices = Array.from(serviceCounts.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 5)

		return {
			ok: true,
			analytics: {
				totalRevenue,
				monthRevenue,
				lastMonthRevenue,
				totalBookings: allBookings.length,
				monthBookings: monthBookings.length,
				completedBookings: allBookings.filter((b) => b.status === 'COMPLETED')
					.length,
				cancelledBookings: allBookings.filter((b) => b.status === 'CANCELLED')
					.length,
				topServices,
				recentBookings: allBookings.slice(0, 10),
			},
		}
	} catch (error) {
		console.error('getSpaAnalytics error:', error)
		return { ok: false, error: 'Failed to fetch analytics' }
	}
}
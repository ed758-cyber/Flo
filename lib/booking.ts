type BookingItemLike = {
	id?: string
	subserviceId?: string
	subservice?: {
		id: string
		name: string
		durationMin?: number
		priceCents?: number
		service?: {
			name: string
		} | null
	} | null
}

type BookingLike = {
	subservice?: {
		id: string
		name: string
		durationMin?: number
		priceCents?: number
		service?: {
			name: string
		} | null
	} | null
	BookingItems?: BookingItemLike[] | null
}

export function getBookingItems(booking: BookingLike) {
	if (booking.BookingItems && booking.BookingItems.length > 0) {
		return booking.BookingItems
			.map((item) => item.subservice)
			.filter(Boolean) as NonNullable<BookingItemLike['subservice']>[]
	}

	return booking.subservice ? [booking.subservice] : []
}

export function formatBookingServiceNames(booking: BookingLike) {
	return getBookingItems(booking).map((item) => item.name).join(', ')
}

export function getBookingDurationMin(booking: BookingLike) {
	return getBookingItems(booking).reduce(
		(total, item) => total + (item.durationMin || 0),
		0
	)
}

export function getBookingPrimaryServiceLabel(booking: BookingLike) {
	const items = getBookingItems(booking)
	if (items.length === 0) return ''

	if (items.length === 1) {
		const first = items[0]
		return first.service?.name
			? `${first.service.name} - ${first.name}`
			: first.name
	}

	return `${items.length} services`
}

export function getBookingTotalCents(booking: BookingLike) {
	return getBookingItems(booking).reduce(
		(total, item) => total + (item.priceCents || 0),
		0
	)
}

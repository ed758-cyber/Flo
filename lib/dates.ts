/**
 * Date utilities for handling Saint Lucia timezone (AST, UTC-4)
 * Ensures consistent date handling across the application
 */

/**
 * Format a date for display, treating it as local Saint Lucia time
 * This prevents timezone shift issues when displaying dates from the database
 */
export function formatLocalDate(
	date: Date | string,
	options: Intl.DateTimeFormatOptions = {}
): string {
	const d = typeof date === 'string' ? new Date(date) : date

	// Default options for date formatting
	const defaultOptions: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		...options,
	}

	return d.toLocaleDateString('en-US', defaultOptions)
}

/**
 * Format time for display, treating it as local Saint Lucia time
 */
export function formatLocalTime(
	date: Date | string,
	options: Intl.DateTimeFormatOptions = {}
): string {
	const d = typeof date === 'string' ? new Date(date) : date

	const defaultOptions: Intl.DateTimeFormatOptions = {
		hour: '2-digit',
		minute: '2-digit',
		...options,
	}

	return d.toLocaleTimeString('en-US', defaultOptions)
}

/**
 * Format both date and time
 */
export function formatLocalDateTime(
	date: Date | string,
	dateOptions: Intl.DateTimeFormatOptions = {},
	timeOptions: Intl.DateTimeFormatOptions = {}
): { date: string; time: string } {
	return {
		date: formatLocalDate(date, dateOptions),
		time: formatLocalTime(date, timeOptions),
	}
}

/**
 * Create a date from date and time strings without timezone conversion
 * Used when creating bookings from user input
 * @param dateStr - Format: "2025-11-05"
 * @param timeStr - Format: "14:30"
 * @returns Date object in local timezone
 */
export function createLocalDateTime(dateStr: string, timeStr: string): Date {
	const [year, month, day] = dateStr.split('-').map(Number)
	const [hours, minutes] = timeStr.split(':').map(Number)

	// Create date in local timezone (not UTC)
	return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

/**
 * Format a date string from input (YYYY-MM-DD) for display without timezone shift
 * @param dateStr - Format: "2025-11-05"
 * @param options - Intl.DateTimeFormatOptions
 */
export function formatInputDate(
	dateStr: string,
	options: Intl.DateTimeFormatOptions = {}
): string {
	// Add noon time to prevent timezone shift
	// When a date string like "2025-11-05" is parsed, JavaScript treats it as UTC midnight
	// which can shift to previous day in timezones behind UTC
	// Adding T12:00:00 ensures we stay on the correct day
	const defaultOptions: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		...options,
	}

	return new Date(dateStr + 'T12:00:00').toLocaleDateString(
		'en-US',
		defaultOptions
	)
}

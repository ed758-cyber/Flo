'use client'
import { useState, useMemo, useCallback } from 'react'
import { createBooking } from './actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatInputDate, createLocalDateTime } from '@/lib/dates'

// ─── helpers ────────────────────────────────────────────────────────────────

function generateTimeSlots(startHour = 9, endHour = 18, interval = 30) {
	const slots: string[] = []
	for (let h = startHour; h < endHour; h++) {
		for (let m = 0; m < 60; m += interval) {
			slots.push(
				`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
			)
		}
	}
	return slots
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
]

function isSameDay(a: Date, b: Date) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	)
}

function toDateStr(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Google-Calendar-style date picker ──────────────────────────────────────

interface CalendarPickerProps {
	selectedDate: string          // "YYYY-MM-DD" or ""
	onSelect: (d: string) => void
	bookedSlots: Array<{ start: string; end: string; employeeId: string | null }>
	durationMin: number
	selectedTime: string
	employeeId: string
}

function CalendarPicker({
	selectedDate,
	onSelect,
	bookedSlots,
	durationMin,
	selectedTime,
	employeeId,
}: CalendarPickerProps) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const [viewYear, setViewYear] = useState(today.getFullYear())
	const [viewMonth, setViewMonth] = useState(today.getMonth())

	const firstDay = new Date(viewYear, viewMonth, 1)
	const lastDay = new Date(viewYear, viewMonth + 1, 0)

	// pad start
	const startPad = firstDay.getDay()
	const cells: (Date | null)[] = [
		...Array(startPad).fill(null),
		...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
	]

	// fill to complete last row
	while (cells.length % 7 !== 0) cells.push(null)

	/** Count available time slots on a given date */
	const availableCount = useCallback(
		(d: Date) => {
			const dateStr = toDateStr(d)
			const slots = generateTimeSlots()
			let count = 0
			for (const slot of slots) {
				const start = createLocalDateTime(dateStr, slot)
				const end = new Date(start.getTime() + durationMin * 60_000)
				const conflict = bookedSlots.some((b) => {
					if (employeeId && b.employeeId && b.employeeId !== employeeId) return false
					return start < new Date(b.end) && end > new Date(b.start)
				})
				if (!conflict) count++
			}
			return count
		},
		[bookedSlots, durationMin, employeeId]
	)

	const prevMonth = () => {
		if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
		else setViewMonth(m => m - 1)
	}
	const nextMonth = () => {
		if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
		else setViewMonth(m => m + 1)
	}

	const selectedDateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : null

	return (
		<div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
			{/* Month header */}
			<div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
				<button
					type='button'
					onClick={prevMonth}
					className='p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600'
					aria-label='Previous month'
				>
					<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
					</svg>
				</button>
				<span className='font-semibold text-gray-900 text-lg'>
					{MONTHS[viewMonth]} {viewYear}
				</span>
				<button
					type='button'
					onClick={nextMonth}
					className='p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600'
					aria-label='Next month'
				>
					<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
					</svg>
				</button>
			</div>

			{/* Day-of-week headers */}
			<div className='grid grid-cols-7 border-b border-gray-100'>
				{DAYS.map(d => (
					<div key={d} className='text-center text-xs font-semibold text-gray-500 py-2'>
						{d}
					</div>
				))}
			</div>

			{/* Cells */}
			<div className='grid grid-cols-7'>
				{cells.map((d, i) => {
					if (!d) return <div key={`pad-${i}`} className='aspect-square' />

					const isPast = d < today
					const isToday = isSameDay(d, new Date())
					const isSelected = selectedDateObj ? isSameDay(d, selectedDateObj) : false
					const avail = isPast ? 0 : availableCount(d)
					const hasSlots = avail > 0

					return (
						<button
							key={toDateStr(d)}
							type='button'
							disabled={isPast || !hasSlots}
							onClick={() => onSelect(toDateStr(d))}
							className={`
								relative aspect-square flex flex-col items-center justify-center text-sm font-medium
								transition-all duration-150 rounded-lg m-0.5
								${isPast || !hasSlots
									? 'text-gray-300 cursor-not-allowed'
									: 'hover:bg-warm-50 cursor-pointer text-gray-900'
								}
								${isSelected
									? 'bg-warm-500 text-white hover:bg-warm-600 shadow-md'
									: ''
								}
								${isToday && !isSelected
									? 'ring-2 ring-warm-400 ring-inset'
									: ''
								}
							`}
						>
							<span>{d.getDate()}</span>
							{!isPast && hasSlots && !isSelected && (
								<span className='absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-warm-400' />
							)}
						</button>
					)
				})}
			</div>

			<div className='px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500'>
				<span className='flex items-center gap-1.5'>
					<span className='w-2 h-2 rounded-full bg-warm-400 inline-block' />
					Available
				</span>
				<span className='flex items-center gap-1.5'>
					<span className='w-2 h-2 rounded-full bg-warm-500 inline-block' />
					Selected
				</span>
				<span className='flex items-center gap-1.5'>
					<span className='w-2 h-2 rounded-full bg-gray-200 inline-block' />
					Unavailable
				</span>
			</div>
		</div>
	)
}

// ─── Time slot grid ──────────────────────────────────────────────────────────

interface TimeGridProps {
	date: string
	selectedTime: string
	onSelect: (t: string) => void
	bookedSlots: Array<{ start: string; end: string; employeeId: string | null }>
	durationMin: number
	employeeId: string
}

function TimeGrid({ date, selectedTime, onSelect, bookedSlots, durationMin, employeeId }: TimeGridProps) {
	const slots = generateTimeSlots()

	const isAvailable = (slot: string) => {
		const start = createLocalDateTime(date, slot)
		const end = new Date(start.getTime() + durationMin * 60_000)
		// Don't allow booking in the past
		if (start <= new Date()) return false
		return !bookedSlots.some((b) => {
			if (employeeId && b.employeeId && b.employeeId !== employeeId) return false
			return start < new Date(b.end) && end > new Date(b.start)
		})
	}

	// group by morning / afternoon / evening
	const groups = [
		{ label: 'Morning', icon: '🌅', slots: slots.filter(s => parseInt(s) < 12) },
		{ label: 'Afternoon', icon: '☀️', slots: slots.filter(s => parseInt(s) >= 12 && parseInt(s) < 17) },
		{ label: 'Evening', icon: '🌆', slots: slots.filter(s => parseInt(s) >= 17) },
	]

	const fmt = (s: string) => {
		const [h, m] = s.split(':').map(Number)
		const ampm = h < 12 ? 'AM' : 'PM'
		const h12 = h % 12 || 12
		return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
	}

	return (
		<div className='space-y-5'>
			{groups.map(({ label, icon, slots: groupSlots }) => {
				const available = groupSlots.filter(isAvailable)
				if (available.length === 0 && !groupSlots.some(s => s === selectedTime)) return null
				return (
					<div key={label}>
						<div className='flex items-center gap-2 mb-3'>
							<span className='text-sm'>{icon}</span>
							<span className='text-sm font-semibold text-gray-700'>{label}</span>
							<span className='text-xs text-gray-400'>({available.length} available)</span>
						</div>
						<div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
							{groupSlots.map(slot => {
								const avail = isAvailable(slot)
								const selected = slot === selectedTime
								return (
									<button
										key={slot}
										type='button'
										disabled={!avail}
										onClick={() => avail && onSelect(slot)}
										className={`
											py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150
											${selected
												? 'bg-warm-500 text-white shadow-md scale-105'
												: avail
													? 'bg-warm-50 text-warm-700 border border-warm-200 hover:bg-warm-100 hover:border-warm-300'
													: 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
											}
										`}
									>
										{fmt(slot)}
									</button>
								)
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function BookClient({
	spa,
	preselectedServiceId,
}: {
	spa: any
	preselectedServiceId?: string
}) {
	const router = useRouter()
	const subs = useMemo(() => spa.Services.flatMap((s: any) => s.Subservices), [spa])

	const [subId, setSubId] = useState(preselectedServiceId || subs[0]?.id || '')
	const [employeeId, setEmployeeId] = useState('')
	const [date, setDate] = useState('')
	const [time, setTime] = useState('')
	const [method, setMethod] = useState<'CARD' | 'CASH'>('CASH')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [step, setStep] = useState<1 | 2 | 3>(1) // 1=service, 2=datetime, 3=confirm

	const selectedSub = useMemo(() => subs.find((s: any) => s.id === subId), [subs, subId])

	// Reset time when date changes
	const handleDateSelect = (d: string) => {
		setDate(d)
		setTime('')
	}

	const handleBooking = async () => {
		if (!date || !time) { setError('Please select both date and time'); return }
		setLoading(true)
		setError('')
		try {
			const res = await createBooking({
				spaId: spa.id,
				subserviceId: subId,
				employeeId: employeeId || undefined,
				start: `${date}T${time}:00`,
				paymentMethod: method,
				payType: 'FULL',
			})
			if (res.ok) {
				router.push('/profile')
			} else {
				setError(res.error || 'Failed to create booking')
				setStep(2)
			}
		} catch {
			setError('An error occurred. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const fmtTime = (s: string) => {
		if (!s) return ''
		const [h, m] = s.split(':').map(Number)
		return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
	}

	// Step indicator
	const steps = ['Service', 'Date & Time', 'Confirm']

	return (
		<div className='min-h-screen bg-gradient-to-br from-warm-50 via-nude-50 to-warm-100'>
			{/* Header */}
			<div className='bg-gradient-to-r from-warm-400 to-nude-500 text-white py-10'>
				<div className='max-w-4xl mx-auto px-6'>
					<Link
						href={`/s/${spa.slug}`}
						className='inline-flex items-center gap-2 text-warm-100 hover:text-white mb-4 transition-colors text-sm'
					>
						<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
						</svg>
						Back to {spa.name}
					</Link>
					<h1 className='text-3xl font-bold mb-1'>Book Your Appointment</h1>
					<p className='text-warm-100 text-sm'>at {spa.name}</p>
				</div>
			</div>

			{/* Step bar */}
			<div className='bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm'>
				<div className='max-w-4xl mx-auto px-6 py-3 flex items-center gap-0'>
					{steps.map((s, i) => {
						const n = (i + 1) as 1 | 2 | 3
						const done = step > n
						const active = step === n
						return (
							<div key={s} className='flex items-center flex-1'>
								<button
									type='button'
									onClick={() => { if (done) setStep(n) }}
									disabled={!done}
									className={`flex items-center gap-2 text-sm font-medium transition-colors ${
										active ? 'text-warm-600' : done ? 'text-warm-500 hover:text-warm-700 cursor-pointer' : 'text-gray-400'
									}`}
								>
									<span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
										active ? 'bg-warm-500 border-warm-500 text-white'
										: done ? 'bg-warm-100 border-warm-400 text-warm-600'
										: 'border-gray-300 text-gray-400'
									}`}>
										{done ? (
											<svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
											</svg>
										) : n}
									</span>
									<span className='hidden sm:inline'>{s}</span>
								</button>
								{i < steps.length - 1 && (
									<div className={`flex-1 h-0.5 mx-3 rounded ${done ? 'bg-warm-400' : 'bg-gray-200'}`} />
								)}
							</div>
						)
					})}
				</div>
			</div>

			<div className='max-w-4xl mx-auto px-6 py-8'>

				{/* ── STEP 1: Service ── */}
				{step === 1 && (
					<div className='bg-white rounded-2xl shadow-lg p-8'>
						<h2 className='text-xl font-bold text-gray-900 mb-6'>Choose Your Service</h2>

						<div className='space-y-6'>
							{spa.Services.map((service: any) => (
								<div key={service.id}>
									<h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>
										{service.name}
									</h3>
									<div className='grid sm:grid-cols-2 gap-3'>
										{service.Subservices.map((sub: any) => (
											<button
												key={sub.id}
												type='button'
												onClick={() => setSubId(sub.id)}
												className={`text-left p-4 rounded-xl border-2 transition-all ${
													subId === sub.id
														? 'border-warm-500 bg-warm-50 shadow-md'
														: 'border-gray-200 hover:border-warm-300 hover:bg-gray-50'
												}`}
											>
												<div className='flex items-start justify-between mb-2'>
													<span className='font-semibold text-gray-900'>{sub.name}</span>
													<span className='text-warm-600 font-bold text-lg ml-2'>
														${(sub.priceCents / 100).toFixed(0)}
													</span>
												</div>
												<p className='text-xs text-gray-500 mb-3 line-clamp-2'>{sub.description}</p>
												<div className='flex items-center gap-1.5 text-xs text-gray-600'>
													<svg className='w-3.5 h-3.5 text-warm-500' fill='currentColor' viewBox='0 0 20 20'>
														<path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
													</svg>
													{sub.durationMin} min
												</div>
											</button>
										))}
									</div>
								</div>
							))}
						</div>

						{/* Employee selection */}
						{spa.Employees.length > 0 && (
							<div className='mt-8'>
								<h3 className='text-sm font-semibold text-gray-700 mb-3'>
									Preferred Therapist <span className='text-gray-400 font-normal'>(optional)</span>
								</h3>
								<div className='flex flex-wrap gap-3'>
									<button
										type='button'
										onClick={() => setEmployeeId('')}
										className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
											!employeeId ? 'border-warm-500 bg-warm-50 text-warm-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
										}`}
									>
										No Preference
									</button>
									{spa.Employees.map((emp: any) => (
										<button
											key={emp.id}
											type='button'
											onClick={() => setEmployeeId(emp.id)}
											className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
												employeeId === emp.id
													? 'border-warm-500 bg-warm-50 text-warm-700'
													: 'border-gray-200 text-gray-600 hover:border-gray-300'
											}`}
										>
											<span className='w-6 h-6 rounded-full bg-gradient-to-br from-warm-300 to-nude-400 text-white text-xs flex items-center justify-center font-semibold'>
												{emp.name[0]}
											</span>
											{emp.name}
										</button>
									))}
								</div>
							</div>
						)}

						<div className='mt-8 flex justify-end'>
							<button
								type='button'
								disabled={!subId}
								onClick={() => setStep(2)}
								className='px-8 py-3 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
							>
								Continue
								<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
								</svg>
							</button>
						</div>
					</div>
				)}

				{/* ── STEP 2: Date & Time ── */}
				{step === 2 && (
					<div className='space-y-6'>
						<div className='grid md:grid-cols-5 gap-6'>
							{/* Calendar */}
							<div className='md:col-span-3'>
								<h2 className='text-xl font-bold text-gray-900 mb-4'>Select a Date</h2>
								<CalendarPicker
									selectedDate={date}
									onSelect={handleDateSelect}
									bookedSlots={spa.Bookings}
									durationMin={selectedSub?.durationMin || 60}
									selectedTime={time}
									employeeId={employeeId}
								/>
							</div>

							{/* Time slots */}
							<div className='md:col-span-2'>
								<h2 className='text-xl font-bold text-gray-900 mb-4'>
									{date ? (
										<span>
											{formatInputDate(date, { weekday: 'short', month: 'short', day: 'numeric' })}
										</span>
									) : 'Select a Time'}
								</h2>
								{date ? (
									<div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-5'>
										<TimeGrid
											date={date}
											selectedTime={time}
											onSelect={setTime}
											bookedSlots={spa.Bookings}
											durationMin={selectedSub?.durationMin || 60}
											employeeId={employeeId}
										/>
									</div>
								) : (
									<div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center'>
										<svg className='w-12 h-12 mx-auto text-gray-200 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
										</svg>
										<p className='text-gray-400 text-sm'>Select a date to see available times</p>
									</div>
								)}
							</div>
						</div>

						{error && (
							<div className='p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2'>
								<svg className='w-4 h-4 shrink-0' fill='currentColor' viewBox='0 0 20 20'>
									<path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
								</svg>
								{error}
							</div>
						)}

						<div className='flex gap-3 justify-between'>
							<button type='button' onClick={() => setStep(1)}
								className='px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2'>
								<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
								</svg>
								Back
							</button>
							<button type='button' disabled={!date || !time} onClick={() => setStep(3)}
								className='px-8 py-3 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'>
								Continue
								<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
								</svg>
							</button>
						</div>
					</div>
				)}

				{/* ── STEP 3: Confirm ── */}
				{step === 3 && (
					<div className='bg-white rounded-2xl shadow-lg p-8'>
						<h2 className='text-xl font-bold text-gray-900 mb-6'>Confirm Your Booking</h2>

						{/* Summary card */}
						<div className='bg-gradient-to-br from-warm-50 to-nude-50 rounded-2xl p-6 mb-8 border border-warm-200'>
							<div className='grid sm:grid-cols-2 gap-4'>
								<div className='space-y-3'>
									<div>
										<div className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Spa</div>
										<div className='font-semibold text-gray-900'>{spa.name}</div>
									</div>
									<div>
										<div className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Service</div>
										<div className='font-semibold text-gray-900'>{selectedSub?.name}</div>
										<div className='text-sm text-gray-500'>{selectedSub?.durationMin} minutes</div>
									</div>
									{employeeId && (
										<div>
											<div className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Therapist</div>
											<div className='font-semibold text-gray-900'>
												{spa.Employees.find((e: any) => e.id === employeeId)?.name}
											</div>
										</div>
									)}
								</div>
								<div className='space-y-3'>
									<div>
										<div className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Date</div>
										<div className='font-semibold text-gray-900'>
											{date ? formatInputDate(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
										</div>
									</div>
									<div>
										<div className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Time</div>
										<div className='font-semibold text-gray-900'>{fmtTime(time)}</div>
									</div>
									<div>
										<div className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Total</div>
										<div className='text-2xl font-bold text-warm-600'>
											${selectedSub ? (selectedSub.priceCents / 100).toFixed(2) : '0.00'}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Payment method */}
						<div className='mb-8'>
							<h3 className='text-sm font-semibold text-gray-700 mb-3'>Payment Method</h3>
							<div className='grid sm:grid-cols-2 gap-3'>
								{(['CASH', 'CARD'] as const).map(m => (
									<button
										key={m}
										type='button'
										onClick={() => setMethod(m)}
										className={`p-4 rounded-xl border-2 text-left transition-all ${
											method === m
												? 'border-warm-500 bg-warm-50 shadow-sm'
												: 'border-gray-200 hover:border-gray-300'
										}`}
									>
										<div className='flex items-center gap-3 mb-1'>
											<div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${method === m ? 'border-warm-500' : 'border-gray-300'}`}>
												{method === m && <div className='w-2 h-2 rounded-full bg-warm-500' />}
											</div>
											<span className='font-semibold text-gray-900 text-sm'>
												{m === 'CASH' ? '💵 Cash Payment' : '💳 Card Payment'}
											</span>
										</div>
										<p className='text-xs text-gray-500 ml-7'>
											{m === 'CASH' ? 'Pay when you arrive at the spa' : 'Pay securely online with Stripe'}
										</p>
									</button>
								))}
							</div>
						</div>

						{error && (
							<div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2'>
								<svg className='w-4 h-4 shrink-0' fill='currentColor' viewBox='0 0 20 20'>
									<path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
								</svg>
								{error}
							</div>
						)}

						<div className='flex gap-3 justify-between'>
							<button type='button' onClick={() => setStep(2)}
								className='px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2'>
								<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
								</svg>
								Back
							</button>
							<button
								type='button'
								onClick={handleBooking}
								disabled={loading}
								className='flex-1 max-w-xs px-8 py-3 bg-gradient-to-r from-warm-400 to-nude-400 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100'
							>
								{loading ? (
									<span className='flex items-center justify-center gap-2'>
										<svg className='animate-spin w-4 h-4' fill='none' viewBox='0 0 24 24'>
											<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
											<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
										</svg>
										Processing...
									</span>
								) : 'Confirm Booking'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelBooking, rescheduleBooking } from './actions'

// ─── Cancel Booking ──────────────────────────────────────────────────────────

export function CancelBookingButton({ booking }: { booking: any }) {
	const router = useRouter()
	const [showConfirm, setShowConfirm] = useState(false)
	const [reason, setReason] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [result, setResult] = useState<any>(null)

	const canCancel =
		booking.status !== 'CANCELLED' &&
		booking.status !== 'COMPLETED' &&
		booking.status !== 'NO_SHOW'

	if (!canCancel) return null

	const now = new Date()
	const bookingStart = new Date(booking.start)
	const hoursUntil = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)

	// Don't show button if booking has already started
	if (hoursUntil <= 0) return null

	let policyMessage = ''
	let policyColor = 'bg-green-50 border-green-200 text-green-800'
	if (hoursUntil > 24) {
		policyMessage = '✓ Full refund available (more than 24 hours notice)'
		policyColor = 'bg-green-50 border-green-200 text-green-800'
	} else if (hoursUntil > 12) {
		policyMessage = '⚠ 50% cancellation fee applies (12–24 hours notice)'
		policyColor = 'bg-yellow-50 border-yellow-200 text-yellow-800'
	} else {
		policyMessage = '✗ No refund available (less than 12 hours notice)'
		policyColor = 'bg-red-50 border-red-200 text-red-800'
	}

	const handleCancel = async () => {
		setIsSubmitting(true)
		const res = await cancelBooking(booking.id, reason)
		setResult(res)
		setIsSubmitting(false)

		if (res.ok) {
			// BUG FIX: refresh the page so the booking list updates
			setTimeout(() => {
				setShowConfirm(false)
				setReason('')
				setResult(null)
				router.refresh() // ← BUG FIX: was only closing modal, not refreshing data
			}, 2500)
		}
	}

	return (
		<>
			<button
				onClick={() => setShowConfirm(true)}
				className='px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium'
			>
				Cancel Booking
			</button>

			{showConfirm && (
				<div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
					<div className='bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl'>
						<h3 className='text-xl font-bold text-gray-900 mb-4'>Cancel Booking</h3>

						{result ? (
							<div className={`p-4 rounded-xl mb-4 ${result.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
								<p className='font-medium'>
									{result.ok ? '✓ ' : '✗ '}
									{result.message || result.error}
								</p>
								{result.ok && <p className='text-sm mt-1 opacity-80'>Refreshing your bookings…</p>}
							</div>
						) : (
							<>
								<div className={`mb-4 p-4 border rounded-xl ${policyColor}`}>
									<p className='text-sm font-medium'>{policyMessage}</p>
								</div>

								<div className='mb-6'>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Reason for cancellation <span className='text-gray-400 font-normal'>(optional)</span>
									</label>
									<textarea
										value={reason}
										onChange={(e) => setReason(e.target.value)}
										rows={3}
										placeholder='Let us know why you need to cancel…'
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-400 resize-none'
									/>
								</div>

								<div className='flex gap-3'>
									<button
										onClick={handleCancel}
										disabled={isSubmitting}
										className='flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50'
									>
										{isSubmitting ? (
											<span className='flex items-center justify-center gap-2'>
												<svg className='animate-spin w-4 h-4' fill='none' viewBox='0 0 24 24'>
													<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
													<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
												</svg>
												Cancelling…
											</span>
										) : 'Confirm Cancellation'}
									</button>
									<button
										onClick={() => { setShowConfirm(false); setReason(''); setResult(null) }}
										className='flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors'
									>
										Keep Booking
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</>
	)
}

// ─── Reschedule Booking ──────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa']

function MiniCalendar({
	value,
	onChange,
}: {
	value: string
	onChange: (d: string) => void
}) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const [viewYear, setViewYear] = useState(today.getFullYear())
	const [viewMonth, setViewMonth] = useState(today.getMonth())

	const firstDay = new Date(viewYear, viewMonth, 1)
	const lastDay = new Date(viewYear, viewMonth + 1, 0)
	const pad = firstDay.getDay()
	const cells: (Date | null)[] = [
		...Array(pad).fill(null),
		...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
	]
	while (cells.length % 7 !== 0) cells.push(null)

	const toStr = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

	const selectedObj = value ? new Date(value + 'T12:00:00') : null

	const prevM = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
	const nextM = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }

	return (
		<div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
			<div className='flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50'>
				<button type='button' onClick={prevM} className='p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors'>
					<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
					</svg>
				</button>
				<span className='text-sm font-semibold text-gray-900'>{MONTHS[viewMonth]} {viewYear}</span>
				<button type='button' onClick={nextM} className='p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors'>
					<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
					</svg>
				</button>
			</div>
			<div className='grid grid-cols-7 border-b border-gray-100'>
				{DAYS_SHORT.map(d => (
					<div key={d} className='text-center text-xs font-medium text-gray-400 py-1'>{d}</div>
				))}
			</div>
			<div className='grid grid-cols-7 p-1 gap-0.5'>
				{cells.map((d, i) => {
					if (!d) return <div key={`p${i}`} />
					const isPast = d < today
					const isSelected = selectedObj
						? d.getDate() === selectedObj.getDate() && d.getMonth() === selectedObj.getMonth() && d.getFullYear() === selectedObj.getFullYear()
						: false
					const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
					return (
						<button
							key={toStr(d)}
							type='button'
							disabled={isPast}
							onClick={() => onChange(toStr(d))}
							className={`
								w-7 h-7 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-colors
								${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-warm-100 cursor-pointer text-gray-700'}
								${isSelected ? 'bg-warm-500 text-white hover:bg-warm-600' : ''}
								${isToday && !isSelected ? 'ring-2 ring-warm-400' : ''}
							`}
						>
							{d.getDate()}
						</button>
					)
				})}
			</div>
		</div>
	)
}

export function RescheduleBookingButton({ booking }: { booking: any }) {
	const router = useRouter()
	const [showModal, setShowModal] = useState(false)
	const [newDate, setNewDate] = useState('')
	const [newTime, setNewTime] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [result, setResult] = useState<any>(null)

	const canReschedule =
		booking.status !== 'CANCELLED' &&
		booking.status !== 'COMPLETED' &&
		booking.status !== 'NO_SHOW'

	if (!canReschedule) return null

	// Generate time slots 9am-6pm in 30min increments
	const timeSlots: string[] = []
	for (let h = 9; h < 18; h++) {
		for (let m = 0; m < 60; m += 30) {
			timeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
		}
	}

	const fmtTime = (s: string) => {
		const [h, m] = s.split(':').map(Number)
		return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
	}

	const handleReschedule = async () => {
		if (!newDate || !newTime) {
			setResult({ ok: false, error: 'Please select both date and time' })
			return
		}
		setIsSubmitting(true)
		const res = await rescheduleBooking({
			bookingId: booking.id,
			newStart: `${newDate}T${newTime}:00`,
		})
		setResult(res)
		setIsSubmitting(false)

		if (res.ok) {
			// BUG FIX: refresh the page so the booking list updates
			setTimeout(() => {
				setShowModal(false)
				setNewDate('')
				setNewTime('')
				setResult(null)
				router.refresh() // ← BUG FIX: was only closing modal
			}, 2000)
		}
	}

	const close = () => { setShowModal(false); setResult(null); setNewDate(''); setNewTime('') }

	return (
		<>
			<button
				onClick={() => setShowModal(true)}
				className='px-4 py-2 text-sm text-warm-600 hover:bg-warm-50 rounded-lg transition-colors font-medium'
			>
				Reschedule
			</button>

			{showModal && (
				<div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
					<div className='bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto'>
						<div className='flex items-center justify-between mb-5'>
							<h3 className='text-xl font-bold text-gray-900'>Reschedule Booking</h3>
							<button type='button' onClick={close} className='p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500'>
								<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
								</svg>
							</button>
						</div>

						{/* Current time */}
						<div className='mb-5 p-3 bg-warm-50 rounded-xl border border-warm-200 text-sm'>
							<span className='text-gray-500'>Current: </span>
							<span className='font-medium text-gray-900'>
								{new Date(booking.start).toLocaleDateString('en-US', {
									weekday: 'short', month: 'short', day: 'numeric',
								})}{' '}at{' '}
								{new Date(booking.start).toLocaleTimeString('en-US', {
									hour: 'numeric', minute: '2-digit',
								})}
							</span>
						</div>

						{result && (
							<div className={`p-4 rounded-xl mb-4 ${result.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
								<p className='font-medium text-sm'>
									{result.ok ? '✓ ' : '✗ '}
									{result.message || result.error}
								</p>
							</div>
						)}

						<div className='mb-5'>
							<label className='block text-sm font-semibold text-gray-700 mb-2'>New Date</label>
							<MiniCalendar value={newDate} onChange={(d) => { setNewDate(d); setNewTime('') }} />
						</div>

						{newDate && (
							<div className='mb-6'>
								<label className='block text-sm font-semibold text-gray-700 mb-2'>New Time</label>
								<div className='grid grid-cols-4 gap-2'>
									{timeSlots.map(slot => (
										<button
											key={slot}
											type='button'
											onClick={() => setNewTime(slot)}
											className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
												newTime === slot
													? 'bg-warm-500 text-white shadow-sm'
													: 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-warm-300 hover:bg-warm-50'
											}`}
										>
											{fmtTime(slot)}
										</button>
									))}
								</div>
							</div>
						)}

						<div className='flex gap-3'>
							<button
								onClick={handleReschedule}
								disabled={isSubmitting || !newDate || !newTime}
								className='flex-1 px-4 py-2.5 bg-warm-500 text-white rounded-lg font-semibold hover:bg-warm-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{isSubmitting ? (
									<span className='flex items-center justify-center gap-2'>
										<svg className='animate-spin w-4 h-4' fill='none' viewBox='0 0 24 24'>
											<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
											<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
										</svg>
										Rescheduling…
									</span>
								) : 'Confirm Reschedule'}
							</button>
							<button
								onClick={close}
								className='flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors'
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

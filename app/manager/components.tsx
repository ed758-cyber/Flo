'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
	createBooking,
	rescheduleBooking,
	cancelBookingManager,
	markBookingPaid,
	updateBookingStatus,
	updateBookingAmount,
	createEmployee,
	updateEmployee,
	deleteEmployee,
	createService,
	updateService,
	deleteService,
	createSubservice,
	updateSubservice,
	deleteSubservice,
	updateSpaSettings,
} from './actions'
import { formatBookingServiceNames, getBookingDurationMin } from '@/lib/booking'
import { getFilledIntakeEntries } from '@/lib/intake'

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Modal({
	open,
	onClose,
	title,
	children,
	maxWidth = 'max-w-lg',
}: {
	open: boolean
	onClose: () => void
	title: string
	children: React.ReactNode
	maxWidth?: string
}) {
	if (!open) return null
	return (
		<div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
			<div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
				<div className='flex items-center justify-between px-6 py-4 border-b border-gray-100'>
					<h3 className='text-lg font-bold text-gray-900'>{title}</h3>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500'
					>
						<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
						</svg>
					</button>
				</div>
				<div className='p-6'>{children}</div>
			</div>
		</div>
	)
}

function ResultBanner({ result }: { result: any }) {
	if (!result) return null
	return (
		<div className={`p-3 rounded-xl text-sm font-medium mb-4 ${result.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
			{result.ok ? '✓ ' : '✗ '}{result.message || result.error}
		</div>
	)
}

function Spinner() {
	return (
		<svg className='animate-spin w-4 h-4' fill='none' viewBox='0 0 24 24'>
			<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
			<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
		</svg>
	)
}

// ─── Create Booking Modal (Manager) ──────────────────────────────────────────

export function CreateBookingModal({
	spa,
	open,
	onClose,
}: {
	spa: any
	open: boolean
	onClose: () => void
}) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [result, setResult] = useState<any>(null)
	const [form, setForm] = useState({
		subserviceIds: spa.Services?.[0]?.Subservices?.[0]?.id
			? [spa.Services[0].Subservices[0].id]
			: [],
		employeeId: '',
		date: '',
		time: '',
		paymentMethod: 'CASH' as 'CASH' | 'CARD',
		customerName: '',
		customerEmail: '',
		customerPhone: '',
		notes: '',
	})

	const subs = spa.Services?.flatMap((s: any) => s.Subservices) ?? []
	const selectedSubs = subs.filter((s: any) => form.subserviceIds.includes(s.id))
	const totalCents = selectedSubs.reduce((sum: number, sub: any) => sum + sub.priceCents, 0)
	const totalDuration = selectedSubs.reduce((sum: number, sub: any) => sum + sub.durationMin, 0)

	const timeSlots: string[] = []
	for (let h = 8; h < 20; h++) {
		for (let m = 0; m < 60; m += 30) {
			timeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
		}
	}

	const fmtTime = (s: string) => {
		const [h, m] = s.split(':').map(Number)
		return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
	}

	const today = new Date().toISOString().split('T')[0]
	const toggleSubservice = (subId: string) =>
		setForm((current) => ({
			...current,
			subserviceIds: current.subserviceIds.includes(subId)
				? current.subserviceIds.filter((id) => id !== subId)
				: [...current.subserviceIds, subId],
		}))

	const handleSubmit = () => {
		if (!form.date || !form.time || form.subserviceIds.length === 0) {
			setResult({ ok: false, error: 'Please fill in all required fields' })
			return
		}
		startTransition(async () => {
			const res = await createBooking({
				spaId: spa.id,
				subserviceIds: form.subserviceIds,
				employeeId: form.employeeId || undefined,
				start: `${form.date}T${form.time}:00`,
				paymentMethod: form.paymentMethod,
				customerName: form.customerName || undefined,
				customerEmail: form.customerEmail || undefined,
				customerPhone: form.customerPhone || undefined,
				notes: form.notes || undefined,
			})
			setResult(res)
			if (res.ok) {
				setTimeout(() => {
					onClose()
					setResult(null)
					setForm({
						subserviceIds: subs[0]?.id ? [subs[0].id] : [],
						employeeId: '',
						date: '',
						time: '',
						paymentMethod: 'CASH',
						customerName: '',
						customerEmail: '',
						customerPhone: '',
						notes: '',
					})
					router.refresh()
				}, 1500)
			}
		})
	}

	const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

	return (
		<Modal open={open} onClose={onClose} title='New Booking' maxWidth='max-w-2xl'>
			<ResultBanner result={result} />

			<div className='grid sm:grid-cols-2 gap-4'>
				{/* Service */}
				<div className='sm:col-span-2'>
					<label className='block text-sm font-semibold text-gray-700 mb-2'>Services *</label>
					<div className='space-y-3 max-h-72 overflow-y-auto pr-1'>
						{spa.Services?.map((svc: any) => (
							<div key={svc.id}>
								<div className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
									{svc.name}
								</div>
								<div className='space-y-2'>
									{svc.Subservices?.map((sub: any) => {
										const checked = form.subserviceIds.includes(sub.id)
										return (
											<label
												key={sub.id}
												className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
													checked
														? 'border-warm-400 bg-warm-50'
														: 'border-gray-200 hover:border-warm-200'
												}`}
											>
												<input
													type='checkbox'
													checked={checked}
													onChange={() => toggleSubservice(sub.id)}
													className='mt-1 h-4 w-4 rounded border-gray-300 text-warm-500 focus:ring-warm-400'
												/>
												<div className='flex-1'>
													<div className='flex items-center justify-between gap-3'>
														<span className='font-medium text-gray-900'>{sub.name}</span>
														<span className='text-sm font-semibold text-warm-700'>
															${(sub.priceCents / 100).toFixed(2)}
														</span>
													</div>
													<div className='text-xs text-gray-500 mt-1'>
														{sub.durationMin} min
													</div>
												</div>
											</label>
										)
									})}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Staff */}
				<div>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Staff Member</label>
					<select
						value={form.employeeId}
						onChange={(e) => set('employeeId', e.target.value)}
						className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
					>
						<option value=''>No preference</option>
						{spa.Employees?.map((emp: any) => (
							<option key={emp.id} value={emp.id}>{emp.name}</option>
						))}
					</select>
				</div>

				{/* Payment */}
				<div>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Payment Method</label>
					<select
						value={form.paymentMethod}
						onChange={(e) => set('paymentMethod', e.target.value as any)}
						className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
					>
						<option value='CASH'>Cash</option>
						<option value='CARD'>Card</option>
					</select>
				</div>

				{/* Date */}
				<div>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Date *</label>
					<input
						type='date'
						min={today}
						value={form.date}
						onChange={(e) => set('date', e.target.value)}
						className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
					/>
				</div>

				{/* Time */}
				<div>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Time *</label>
					<select
						value={form.time}
						onChange={(e) => set('time', e.target.value)}
						className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
					>
						<option value=''>Select time…</option>
						{timeSlots.map((t) => (
							<option key={t} value={t}>{fmtTime(t)}</option>
						))}
					</select>
				</div>

				{/* Customer info */}
				<div className='sm:col-span-2 border-t pt-4 mt-1'>
					<p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Customer Info (optional)</p>
					<div className='grid sm:grid-cols-3 gap-3'>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>Name</label>
							<input
								type='text'
								value={form.customerName}
								onChange={(e) => set('customerName', e.target.value)}
								placeholder='Jane Doe'
								className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
							/>
						</div>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>Email</label>
							<input
								type='email'
								value={form.customerEmail}
								onChange={(e) => set('customerEmail', e.target.value)}
								placeholder='jane@email.com'
								className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
							/>
						</div>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>Phone</label>
							<input
								type='tel'
								value={form.customerPhone}
								onChange={(e) => set('customerPhone', e.target.value)}
								placeholder='+1 758 …'
								className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
							/>
						</div>
					</div>
				</div>

				{/* Notes */}
				<div className='sm:col-span-2'>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Notes</label>
					<textarea
						value={form.notes}
						onChange={(e) => set('notes', e.target.value)}
						rows={2}
						placeholder='Any special requests or notes…'
						className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none'
					/>
				</div>
			</div>

			{/* Summary */}
			{selectedSubs.length > 0 && form.date && form.time && (
				<div className='mt-4 p-3 bg-warm-50 rounded-xl border border-warm-200 text-sm'>
					<div className='space-y-1.5'>
						{selectedSubs.map((sub: any) => (
							<div key={sub.id} className='flex justify-between'>
								<span className='text-gray-600'>{sub.name}</span>
								<span className='font-medium text-gray-900'>${(sub.priceCents / 100).toFixed(2)}</span>
							</div>
						))}
					</div>
					<div className='text-gray-500 mt-1'>
						{form.date} at {fmtTime(form.time)} · {totalDuration} min
					</div>
					<div className='flex justify-between mt-2 pt-2 border-t border-warm-200'>
						<span className='font-semibold text-gray-700'>Total</span>
						<span className='font-bold text-warm-700'>${(totalCents / 100).toFixed(2)}</span>
					</div>
				</div>
			)}

			<div className='flex gap-3 mt-6'>
				<button
					onClick={handleSubmit}
					disabled={isPending || !form.date || !form.time || form.subserviceIds.length === 0}
					className='flex-1 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
				>
					{isPending ? <><Spinner /> Saving…</> : 'Create Booking'}
				</button>
				<button onClick={onClose} className='px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors'>
					Cancel
				</button>
			</div>
		</Modal>
	)
}

export function BookingDetailsButton({ booking }: { booking: any }) {
	const [open, setOpen] = useState(false)
	const [showEditAmount, setShowEditAmount] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [result, setResult] = useState<any>(null)
	const [newAmount, setNewAmount] = useState('')
	const [changeReason, setChangeReason] = useState('')
	const router = useRouter()

	const customerName = booking.customerName || booking.user?.name || 'Walk-in'
	const customerEmail = booking.customerEmail || booking.user?.email || ''
	const customerPhone = booking.customerPhone || ''
	const serviceNames = formatBookingServiceNames(booking)
	const intakeEntries = getFilledIntakeEntries(
		booking.intakeForm as Record<string, string> | undefined,
		booking.BookingItems?.length
			? booking.BookingItems.map((item: any) => `${item.subservice.service.name} ${item.subservice.name}`)
			: [serviceNames]
	)

	// Extract amount change history from notes
	const getAmountChangeHistory = () => {
		if (!booking.notes) return []
		const lines = booking.notes.split('\n\n')
		return lines.filter((line: string) => line.includes('Amount changed from'))
	}

	const amountChangeHistory = getAmountChangeHistory()

	const handleEditAmount = () => {
		if (!newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) < 0) {
			setResult({ ok: false, error: 'Please enter a valid amount' })
			return
		}
		if (!changeReason.trim()) {
			setResult({ ok: false, error: 'Please provide a reason for the change' })
			return
		}

		startTransition(async () => {
			const newTotalCents = Math.round(parseFloat(newAmount) * 100)
			const res = await updateBookingAmount(booking.id, newTotalCents, changeReason)
			setResult(res)
			if (res.ok) {
				setTimeout(() => {
					setShowEditAmount(false)
					setResult(null)
					setNewAmount('')
					setChangeReason('')
					router.refresh()
				}, 1500)
			}
		})
	}

	const openEditAmountModal = () => {
		setNewAmount((booking.totalCents / 100).toFixed(2))
		setShowEditAmount(true)
	}

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className='px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors'
			>
				View Details
			</button>

			<Modal open={open} onClose={() => setOpen(false)} title='Booking Details' maxWidth='max-w-2xl'>
				<div className='space-y-6 text-sm'>
					<div className='grid sm:grid-cols-2 gap-4'>
						<div className='rounded-xl border border-gray-200 p-4'>
							<div className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
								Customer
							</div>
							<div className='font-semibold text-gray-900'>{customerName}</div>
							{customerEmail && <div className='text-gray-600 mt-1'>{customerEmail}</div>}
							{customerPhone && <div className='text-gray-600 mt-1'>{customerPhone}</div>}
						</div>
						<div className='rounded-xl border border-gray-200 p-4'>
							<div className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
								Appointment
							</div>
							<div className='font-semibold text-gray-900'>
								{new Date(booking.start).toLocaleDateString('en-US', {
									weekday: 'long',
									month: 'long',
									day: 'numeric',
									year: 'numeric',
								})}
							</div>
							<div className='text-gray-600 mt-1'>
								{new Date(booking.start).toLocaleTimeString('en-US', {
									hour: 'numeric',
									minute: '2-digit',
								})}
								{' - '}
								{new Date(booking.end).toLocaleTimeString('en-US', {
									hour: 'numeric',
									minute: '2-digit',
								})}
							</div>
							<div className='text-gray-600 mt-1'>
								{booking.employee?.name ? `Staff: ${booking.employee.name}` : 'No staff preference'}
							</div>
						</div>
					</div>

					<div className='rounded-xl border border-gray-200 p-4'>
						<div className='flex items-center justify-between gap-4 mb-3'>
							<div className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
								Services
							</div>
							<div className='flex items-center gap-2'>
								<div className='text-sm font-semibold text-warm-700'>
									${(booking.totalCents / 100).toFixed(2)}
								</div>
								<button
									onClick={openEditAmountModal}
									className='p-1 text-gray-400 hover:text-warm-600 transition-colors'
									title='Edit amount'
								>
									<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
									</svg>
								</button>
							</div>
						</div>
						<div className='space-y-2'>
							{booking.BookingItems?.length ? (
								booking.BookingItems.map((item: any) => (
									<div key={item.id} className='flex items-center justify-between'>
										<div>
											<div className='font-medium text-gray-900'>{item.subservice.name}</div>
											<div className='text-xs text-gray-500'>
												{item.subservice.service.name} · {item.subservice.durationMin} min
											</div>
										</div>
										<div className='text-sm font-medium text-gray-700'>
											${(item.subservice.priceCents / 100).toFixed(2)}
										</div>
									</div>
								))
							) : (
								<div className='text-gray-700'>{serviceNames}</div>
							)}
						</div>
						<div className='text-xs text-gray-500 mt-3'>
							Total duration: {getBookingDurationMin(booking)} minutes
						</div>
					</div>

					{/* Amount Change History */}
					{amountChangeHistory.length > 0 && (
						<div className='rounded-xl border border-yellow-200 bg-yellow-50 p-4'>
							<div className='text-xs font-semibold uppercase tracking-wide text-yellow-700 mb-3'>
								Amount Change History
							</div>
							<div className='space-y-2'>
								{amountChangeHistory.map((entry, index) => (
									<div key={index} className='text-xs text-yellow-800 bg-yellow-100 rounded-lg p-2'>
										{entry}
									</div>
								))}
							</div>
							<div className='text-xs text-yellow-600 mt-2'>
								⚠️ These changes are visible to all staff members
							</div>
						</div>
					)}

					<div className='grid sm:grid-cols-2 gap-4'>
						<div className='rounded-xl border border-gray-200 p-4'>
							<div className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
								Customer Notes
							</div>
							<div className='text-gray-700 whitespace-pre-wrap'>
								{booking.notes || 'No notes provided.'}
							</div>
						</div>
						<div className='rounded-xl border border-gray-200 p-4'>
							<div className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
								Liability Form
							</div>
							<div className='text-gray-700'>
								{booking.consentAcceptedAt ? 'Accepted' : 'Not required / not signed'}
							</div>
							{booking.consentSignature && (
								<div className='text-gray-600 mt-1'>
									Signed as: {booking.consentSignature}
								</div>
							)}
						</div>
					</div>

					<div className='rounded-xl border border-gray-200 p-4'>
						<div className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3'>
							Intake Form
						</div>
						{intakeEntries.length > 0 ? (
							<div className='space-y-3'>
								{intakeEntries.map((entry) => (
									<div key={`${entry.sectionTitle}-${entry.label}`} className='rounded-xl bg-gray-50 p-3'>
										<div className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
											{entry.sectionTitle}
										</div>
										<div className='text-sm font-medium text-gray-900 mt-1'>{entry.label}</div>
										<div className='text-sm text-gray-700 mt-1 whitespace-pre-wrap'>{entry.value}</div>
									</div>
								))}
							</div>
						) : (
							<div className='text-sm text-gray-500'>No intake form responses submitted.</div>
						)}
					</div>
				</div>
			</Modal>

			{/* Edit Amount Modal */}
			<Modal open={showEditAmount} onClose={() => setShowEditAmount(false)} title='Edit Booking Amount'>
				<ResultBanner result={result} />
				<div className='space-y-4'>
					<div className='p-3 bg-gray-50 rounded-xl text-sm'>
						<div className='flex justify-between mb-1'>
							<span className='text-gray-500'>Current Amount:</span>
							<span className='font-semibold text-gray-900'>${(booking.totalCents / 100).toFixed(2)}</span>
						</div>
						<div className='flex justify-between'>
							<span className='text-gray-500'>Payment Status:</span>
							<span className={`font-medium ${booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
								{booking.paymentStatus}
							</span>
						</div>
					</div>

					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>New Amount (USD) *</label>
						<div className='relative'>
							<span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>$</span>
							<input
								type='number'
								step='0.01'
								min='0'
								value={newAmount}
								onChange={(e) => setNewAmount(e.target.value)}
								className='w-full border border-gray-300 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
								placeholder='0.00'
							/>
						</div>
					</div>

					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Reason for Change *</label>
						<textarea
							value={changeReason}
							onChange={(e) => setChangeReason(e.target.value)}
							rows={3}
							className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none'
							placeholder='Explain why the amount is being changed (e.g., "Service was not paid", "Discount applied", etc.)'
						/>
						<p className='text-xs text-gray-500 mt-1'>
							This reason will be logged and visible to all staff members.
						</p>
					</div>

					<div className='p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800'>
						<strong>Note:</strong> If this booking is already marked as PAID, the paid amount will be adjusted to match the new total.
					</div>
				</div>

				<div className='flex gap-3 mt-6'>
					<button
						onClick={handleEditAmount}
						disabled={isPending || !newAmount || !changeReason.trim()}
						className='flex-1 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
					>
						{isPending ? <><Spinner /> Saving…</> : 'Update Amount'}
					</button>
					<button
						onClick={() => { setShowEditAmount(false); setResult(null); setNewAmount(''); setChangeReason('') }}
						className='px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors'
					>
						Cancel
					</button>
				</div>
			</Modal>
		</>
	)
}

// ─── Booking Actions (reschedule / cancel / status / paid) ───────────────────

export function BookingActionButtons({ booking }: { booking: any }) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [showReschedule, setShowReschedule] = useState(false)
	const [showCancel, setShowCancel] = useState(false)
	const [result, setResult] = useState<any>(null)
	const [newDate, setNewDate] = useState('')
	const [newTime, setNewTime] = useState('')
	const [cancelReason, setCancelReason] = useState('')
	const [statusValue, setStatusValue] = useState(booking.status)

	const today = new Date().toISOString().split('T')[0]
	const timeSlots: string[] = []
	for (let h = 8; h < 20; h++) {
		for (let m = 0; m < 60; m += 30) {
			timeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
		}
	}
	const fmtTime = (s: string) => {
		const [h, m] = s.split(':').map(Number)
		return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
	}

	const run = (fn: () => Promise<any>) => {
		startTransition(async () => {
			const res = await fn()
			setResult(res)
			if (res.ok) setTimeout(() => { setResult(null); router.refresh() }, 1500)
		})
	}

	return (
		<>
			<div className='space-y-2'>
				<div className='flex flex-wrap items-center gap-1.5'>
					<select
						value={statusValue}
						onChange={(e) => setStatusValue(e.target.value)}
						disabled={isPending}
						className='rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 focus:border-warm-400 focus:outline-none focus:ring-2 focus:ring-warm-200 disabled:opacity-50'
					>
						<option value='PENDING'>Pending</option>
						<option value='CONFIRMED'>Confirmed</option>
						<option value='COMPLETED'>Completed</option>
						<option value='NO_SHOW'>No Show</option>
						<option value='CANCELLED'>Cancelled</option>
					</select>
					<button
						onClick={() =>
							run(() => updateBookingStatus(booking.id, statusValue as any))
						}
						disabled={isPending || statusValue === booking.status}
						className='px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50'
					>
						Update Status
					</button>
					{booking.paymentStatus !== 'PAID' && (
						<button
							onClick={() => run(() => markBookingPaid(booking.id))}
							disabled={isPending}
							className='px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors'
						>
							Mark Paid
						</button>
					)}
					<button
						onClick={() => setShowReschedule(true)}
						className='px-2.5 py-1 text-xs bg-warm-100 text-warm-700 rounded-lg hover:bg-warm-200 font-medium transition-colors'
					>
						Reschedule
					</button>
					<button
						onClick={() => setShowCancel(true)}
						className='px-2.5 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors'
					>
						Cancel
					</button>
				</div>
				<div className='text-[11px] text-gray-500'>
					Current status: <span className='font-medium text-gray-700'>{booking.status}</span>
				</div>
			</div>

			{result && (
				<div className={`mt-1 text-xs font-medium ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
					{result.ok ? '✓ ' : '✗ '}{result.message || result.error}
				</div>
			)}

			{/* Reschedule modal */}
			<Modal open={showReschedule} onClose={() => setShowReschedule(false)} title='Reschedule Booking'>
				<ResultBanner result={result} />
				<div className='space-y-4'>
					<div className='p-3 bg-gray-50 rounded-xl text-sm text-gray-600'>
						<span className='font-medium'>Current: </span>
						{new Date(booking.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
						{new Date(booking.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
					</div>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>New Date</label>
						<input
							type='date'
							min={today}
							value={newDate}
							onChange={(e) => setNewDate(e.target.value)}
							className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
						/>
					</div>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>New Time</label>
						<select
							value={newTime}
							onChange={(e) => setNewTime(e.target.value)}
							className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
						>
							<option value=''>Select time…</option>
							{timeSlots.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
						</select>
					</div>
				</div>
				<div className='flex gap-3 mt-5'>
					<button
						onClick={() => run(async () => {
							const res = await rescheduleBooking({ bookingId: booking.id, newStart: `${newDate}T${newTime}:00` })
							if (res.ok) setTimeout(() => setShowReschedule(false), 1500)
							return res
						})}
						disabled={isPending || !newDate || !newTime}
						className='flex-1 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 disabled:opacity-50 flex items-center justify-center gap-2'
					>
						{isPending ? <><Spinner /> Saving…</> : 'Confirm'}
					</button>
					<button onClick={() => setShowReschedule(false)} className='px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200'>Cancel</button>
				</div>
			</Modal>

			{/* Cancel modal */}
			<Modal open={showCancel} onClose={() => setShowCancel(false)} title='Cancel Booking'>
				<ResultBanner result={result} />
				<div className='space-y-4'>
					<div className='p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800'>
						This will cancel the booking for <span className='font-medium'>{booking.user?.name || 'Guest'}</span>.
					</div>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Reason (optional)</label>
						<textarea
							value={cancelReason}
							onChange={(e) => setCancelReason(e.target.value)}
							rows={2}
							className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none'
							placeholder='Reason for cancellation…'
						/>
					</div>
				</div>
				<div className='flex gap-3 mt-5'>
					<button
						onClick={() => run(async () => {
							const res = await cancelBookingManager(booking.id, cancelReason)
							if (res.ok) setTimeout(() => setShowCancel(false), 1500)
							return res
						})}
						disabled={isPending}
						className='flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2'
					>
						{isPending ? <><Spinner /> Cancelling…</> : 'Confirm Cancel'}
					</button>
					<button onClick={() => setShowCancel(false)} className='px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200'>Back</button>
				</div>
			</Modal>
		</>
	)
}

// ─── Staff Management Panel ───────────────────────────────────────────────────

export function StaffPanel({ spa }: { spa: any }) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [showAdd, setShowAdd] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [result, setResult] = useState<any>(null)
	const [form, setForm] = useState({ name: '', bio: '', phone: '', email: '' })

	const run = (fn: () => Promise<any>, onOk?: () => void) => {
		startTransition(async () => {
			const res = await fn()
			setResult(res)
			if (res.ok) {
				setTimeout(() => { setResult(null); router.refresh(); onOk?.() }, 1200)
			}
		})
	}

	const resetForm = () => setForm({ name: '', bio: '', phone: '', email: '' })

	const startEdit = (emp: any) => {
		setEditingId(emp.id)
		setForm({ name: emp.name, bio: emp.bio || '', phone: emp.phone || '', email: emp.email || '' })
	}

	return (
		<div>
			<div className='flex items-center justify-between mb-4'>
				<h2 className='text-xl font-bold text-gray-900'>Staff Members</h2>
				<button
					onClick={() => { resetForm(); setShowAdd(true) }}
					className='flex items-center gap-2 px-4 py-2 bg-warm-500 text-white rounded-xl text-sm font-semibold hover:bg-warm-600 transition-colors'
				>
					<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
					</svg>
					Add Staff
				</button>
			</div>

			<ResultBanner result={result} />

			{spa.Employees?.length === 0 ? (
				<div className='text-center py-10 text-gray-400'>
					<svg className='w-12 h-12 mx-auto mb-3 text-gray-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' />
					</svg>
					<p className='text-sm'>No staff members yet</p>
				</div>
			) : (
				<div className='space-y-3'>
					{spa.Employees.map((emp: any) => (
						<div key={emp.id} className='bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-4'>
							<div className='flex items-center gap-3 flex-1 min-w-0'>
								<div className='w-10 h-10 rounded-full bg-gradient-to-br from-warm-300 to-nude-400 text-white flex items-center justify-center font-semibold text-sm shrink-0'>
									{emp.name[0].toUpperCase()}
								</div>
								<div className='min-w-0'>
									<div className='font-semibold text-gray-900 truncate'>{emp.name}</div>
									{emp.bio && <div className='text-xs text-gray-500 truncate'>{emp.bio}</div>}
									{(emp.phone || emp.email) && (
										<div className='text-xs text-gray-400 mt-0.5 truncate'>
											{[emp.phone, emp.email].filter(Boolean).join(' · ')}
										</div>
									)}
								</div>
							</div>
							<div className='flex gap-2 shrink-0'>
								<button
									onClick={() => startEdit(emp)}
									className='px-3 py-1.5 text-xs bg-warm-100 text-warm-700 rounded-lg hover:bg-warm-200 font-medium transition-colors'
								>
									Edit
								</button>
								<button
									onClick={() => run(() => deleteEmployee(emp.id))}
									disabled={isPending}
									className='px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors disabled:opacity-50'
								>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add Staff Modal */}
			<Modal open={showAdd} onClose={() => setShowAdd(false)} title='Add Staff Member'>
				<StaffForm
					form={form}
					setForm={setForm}
					onSubmit={() => run(
						() => createEmployee({ spaId: spa.id, ...form }),
						() => { setShowAdd(false); resetForm() }
					)}
					isPending={isPending}
					onCancel={() => setShowAdd(false)}
					submitLabel='Add Staff Member'
				/>
			</Modal>

			{/* Edit Staff Modal */}
			<Modal open={!!editingId} onClose={() => setEditingId(null)} title='Edit Staff Member'>
				<StaffForm
					form={form}
					setForm={setForm}
					onSubmit={() => run(
						() => updateEmployee(editingId!, form),
						() => setEditingId(null)
					)}
					isPending={isPending}
					onCancel={() => setEditingId(null)}
					submitLabel='Save Changes'
				/>
			</Modal>
		</div>
	)
}

function StaffForm({
	form,
	setForm,
	onSubmit,
	isPending,
	onCancel,
	submitLabel,
}: {
	form: any
	setForm: any
	onSubmit: () => void
	isPending: boolean
	onCancel: () => void
	submitLabel: string
}) {
	const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))
	return (
		<div className='space-y-4'>
			<div>
				<label className='block text-sm font-semibold text-gray-700 mb-1'>Name *</label>
				<input
					type='text'
					value={form.name}
					onChange={(e) => set('name', e.target.value)}
					placeholder='Staff member name'
					className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
				/>
			</div>
			<div>
				<label className='block text-sm font-semibold text-gray-700 mb-1'>Bio</label>
				<textarea
					value={form.bio}
					onChange={(e) => set('bio', e.target.value)}
					rows={2}
					placeholder='Short description…'
					className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none'
				/>
			</div>
			<div className='grid grid-cols-2 gap-3'>
				<div>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Phone</label>
					<input
						type='tel'
						value={form.phone}
						onChange={(e) => set('phone', e.target.value)}
						placeholder='+1 758 …'
						className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
					/>
				</div>
				<div>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Email</label>
					<input
						type='email'
						value={form.email}
						onChange={(e) => set('email', e.target.value)}
						placeholder='staff@email.com'
						className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
					/>
				</div>
			</div>
			<div className='flex gap-3 pt-2'>
				<button
					onClick={onSubmit}
					disabled={isPending || !form.name}
					className='flex-1 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 disabled:opacity-50 flex items-center justify-center gap-2'
				>
					{isPending ? <><Spinner /> Saving…</> : submitLabel}
				</button>
				<button onClick={onCancel} className='px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200'>
					Cancel
				</button>
			</div>
		</div>
	)
}

// ─── Services Management Panel ────────────────────────────────────────────────

export function ServicesPanel({ spa }: { spa: any }) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [result, setResult] = useState<any>(null)
	const [showAddService, setShowAddService] = useState(false)
	const [showAddSub, setShowAddSub] = useState<string | null>(null) // serviceId
	const [editingService, setEditingService] = useState<any | null>(null)
	const [editingSubservice, setEditingSubservice] = useState<any | null>(null)
	const [serviceName, setServiceName] = useState('')
	const [serviceDesc, setServiceDesc] = useState('')
	const [subForm, setSubForm] = useState({ name: '', description: '', durationMin: '60', priceCents: '' })

	const run = (fn: () => Promise<any>, onOk?: () => void) => {
		startTransition(async () => {
			const res = await fn()
			setResult(res)
			if (res.ok) setTimeout(() => { setResult(null); router.refresh(); onOk?.() }, 1200)
		})
	}

	return (
		<div>
			<div className='flex items-center justify-between mb-4'>
				<h2 className='text-xl font-bold text-gray-900'>Services</h2>
				<button
					onClick={() => setShowAddService(true)}
					className='flex items-center gap-2 px-4 py-2 bg-warm-500 text-white rounded-xl text-sm font-semibold hover:bg-warm-600 transition-colors'
				>
					<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
					</svg>
					Add Category
				</button>
			</div>

			<ResultBanner result={result} />

			{spa.Services?.length === 0 ? (
				<div className='text-center py-10 text-gray-400 text-sm'>No services yet</div>
			) : (
				<div className='space-y-4'>
					{spa.Services.map((svc: any) => (
						<div key={svc.id} className='bg-gray-50 rounded-xl overflow-hidden'>
							<div className='flex items-center justify-between px-4 py-3 bg-warm-50 border-b border-warm-100'>
								<div>
									<span className='font-semibold text-gray-900'>{svc.name}</span>
									{svc.description && (
										<div className='text-xs text-gray-500 mt-1'>{svc.description}</div>
									)}
								</div>
								<div className='flex items-center gap-3'>
									<button
										onClick={() => { setSubForm({ name: '', description: '', durationMin: '60', priceCents: '' }); setShowAddSub(svc.id) }}
										className='text-xs text-warm-600 hover:text-warm-800 font-medium flex items-center gap-1'
									>
										<svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
										</svg>
										Add Treatment
									</button>
									<button
										onClick={() => setEditingService(svc)}
										className='text-xs text-gray-500 hover:text-gray-700 font-medium'
									>
										Edit
									</button>
									<button
										onClick={() => run(() => deleteService(svc.id))}
										disabled={isPending}
										className='text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40'
									>
										Delete
									</button>
								</div>
							</div>
							<div className='divide-y divide-gray-100'>
								{svc.Subservices?.map((sub: any) => (
									<div key={sub.id} className='flex items-center justify-between px-4 py-3 text-sm'>
										<div>
											<span className='font-medium text-gray-800'>{sub.name}</span>
											<span className='text-gray-400 ml-2'>{sub.durationMin}min</span>
											{sub.description && (
												<div className='text-xs text-gray-500 mt-1'>{sub.description}</div>
											)}
										</div>
										<div className='flex items-center gap-3'>
											<span className='font-semibold text-warm-700'>${(sub.priceCents / 100).toFixed(2)}</span>
											<button
												onClick={() => setEditingSubservice(sub)}
												className='text-gray-400 hover:text-gray-600 transition-colors'
											>
												<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
													<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
												</svg>
											</button>
											<button
												onClick={() => run(() => deleteSubservice(sub.id))}
												disabled={isPending}
												className='text-red-400 hover:text-red-600 transition-colors disabled:opacity-40'
											>
												<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
													<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
												</svg>
											</button>
										</div>
									</div>
								))}
								{svc.Subservices?.length === 0 && (
									<div className='px-4 py-3 text-xs text-gray-400'>No treatments yet — add one above</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add Service Modal */}
			<Modal open={showAddService} onClose={() => setShowAddService(false)} title='Add Service Category'>
				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Category Name *</label>
						<input
							type='text'
							value={serviceName}
							onChange={(e) => setServiceName(e.target.value)}
							placeholder='e.g. Massage, Facial, Body Treatment'
							className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
						/>
					</div>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Description</label>
						<textarea
							value={serviceDesc}
							onChange={(e) => setServiceDesc(e.target.value)}
							rows={2}
							className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none'
						/>
					</div>
					<div className='flex gap-3'>
						<button
							onClick={() => run(() => createService(spa.id, serviceName, serviceDesc), () => { setShowAddService(false); setServiceName(''); setServiceDesc('') })}
							disabled={isPending || !serviceName}
							className='flex-1 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 disabled:opacity-50 flex items-center justify-center gap-2'
						>
							{isPending ? <><Spinner /> Saving…</> : 'Create Category'}
						</button>
						<button onClick={() => setShowAddService(false)} className='px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200'>Cancel</button>
					</div>
				</div>
			</Modal>

			{/* Add Subservice Modal */}
			<Modal open={!!showAddSub} onClose={() => setShowAddSub(null)} title='Add Treatment'>
				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Treatment Name *</label>
						<input type='text' value={subForm.name} onChange={(e) => setSubForm(f => ({ ...f, name: e.target.value }))}
							placeholder='e.g. Deep Tissue Massage'
							className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none' />
					</div>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Description</label>
						<textarea value={subForm.description} onChange={(e) => setSubForm(f => ({ ...f, description: e.target.value }))}
							rows={2} className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none' />
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='block text-sm font-semibold text-gray-700 mb-1'>Duration (min) *</label>
							<input type='number' min='15' step='15' value={subForm.durationMin}
								onChange={(e) => setSubForm(f => ({ ...f, durationMin: e.target.value }))}
								className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none' />
						</div>
						<div>
							<label className='block text-sm font-semibold text-gray-700 mb-1'>Price (USD) *</label>
							<input type='number' min='0' step='0.01' value={subForm.priceCents}
								onChange={(e) => setSubForm(f => ({ ...f, priceCents: e.target.value }))}
								placeholder='e.g. 120'
								className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none' />
						</div>
					</div>
					<div className='flex gap-3'>
						<button
							onClick={() => run(
								() => createSubservice({
									serviceId: showAddSub!,
									spaId: spa.id,
									name: subForm.name,
									description: subForm.description,
									durationMin: parseInt(subForm.durationMin),
									priceCents: Math.round(parseFloat(subForm.priceCents) * 100),
								}),
								() => setShowAddSub(null)
							)}
							disabled={isPending || !subForm.name || !subForm.priceCents}
							className='flex-1 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 disabled:opacity-50 flex items-center justify-center gap-2'
						>
							{isPending ? <><Spinner /> Saving…</> : 'Add Treatment'}
						</button>
						<button onClick={() => setShowAddSub(null)} className='px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200'>Cancel</button>
					</div>
				</div>
			</Modal>

			<Modal open={!!editingService} onClose={() => setEditingService(null)} title='Edit Service Category'>
				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Category Name *</label>
						<input
							type='text'
							value={editingService?.name || ''}
							onChange={(e) => setEditingService((current: any) => ({ ...current, name: e.target.value }))}
							className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
						/>
					</div>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Description</label>
						<textarea
							value={editingService?.description || ''}
							onChange={(e) => setEditingService((current: any) => ({ ...current, description: e.target.value }))}
							rows={2}
							className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none'
						/>
					</div>
					<div className='flex gap-3'>
						<button
							onClick={() => run(
								() => updateService(editingService.id, {
									name: editingService.name,
									description: editingService.description,
								}),
								() => setEditingService(null)
							)}
							disabled={isPending || !editingService?.name}
							className='flex-1 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 disabled:opacity-50 flex items-center justify-center gap-2'
						>
							{isPending ? <><Spinner /> Saving…</> : 'Save Category'}
						</button>
						<button onClick={() => setEditingService(null)} className='px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200'>Cancel</button>
					</div>
				</div>
			</Modal>

			<Modal open={!!editingSubservice} onClose={() => setEditingSubservice(null)} title='Edit Treatment'>
				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Treatment Name *</label>
						<input
							type='text'
							value={editingSubservice?.name || ''}
							onChange={(e) => setEditingSubservice((current: any) => ({ ...current, name: e.target.value }))}
							className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
						/>
					</div>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Description</label>
						<textarea
							value={editingSubservice?.description || ''}
							onChange={(e) => setEditingSubservice((current: any) => ({ ...current, description: e.target.value }))}
							rows={2}
							className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none'
						/>
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='block text-sm font-semibold text-gray-700 mb-1'>Duration (min) *</label>
							<input
								type='number'
								min='15'
								step='15'
								value={editingSubservice?.durationMin || ''}
								onChange={(e) => setEditingSubservice((current: any) => ({ ...current, durationMin: e.target.value }))}
								className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
							/>
						</div>
						<div>
							<label className='block text-sm font-semibold text-gray-700 mb-1'>Price (USD) *</label>
							<input
								type='number'
								min='0'
								step='0.01'
								value={editingSubservice ? (editingSubservice.priceCents / 100).toFixed(2) : ''}
								onChange={(e) => setEditingSubservice((current: any) => ({ ...current, priceCents: Math.round(parseFloat(e.target.value || '0') * 100) }))}
								className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none'
							/>
						</div>
					</div>
					<div className='flex gap-3'>
						<button
							onClick={() => run(
								() => updateSubservice(editingSubservice.id, {
									name: editingSubservice.name,
									description: editingSubservice.description,
									durationMin: parseInt(String(editingSubservice.durationMin), 10),
									priceCents: editingSubservice.priceCents,
								}),
								() => setEditingSubservice(null)
							)}
							disabled={isPending || !editingSubservice?.name}
							className='flex-1 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 disabled:opacity-50 flex items-center justify-center gap-2'
						>
							{isPending ? <><Spinner /> Saving…</> : 'Save Treatment'}
						</button>
						<button onClick={() => setEditingSubservice(null)} className='px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200'>Cancel</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

// ─── Spa Settings Panel ───────────────────────────────────────────────────────

export function SpaSettingsPanel({ spa }: { spa: any }) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [result, setResult] = useState<any>(null)
	const [form, setForm] = useState({
		name: spa.name || '',
		description: spa.description || '',
		address: spa.address || '',
		phone: spa.phone || '',
		email: spa.email || '',
		requiresBookingConsent: Boolean(spa.requiresBookingConsent),
		bookingConsentText:
			spa.bookingConsentText ||
			'I understand the risks associated with this treatment and release the spa from liability except where prohibited by law.',
	})

	const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

	const handleSave = () => {
		startTransition(async () => {
			const res = await updateSpaSettings(spa.id, form)
			setResult(res)
			if (res.ok) setTimeout(() => { setResult(null); router.refresh() }, 1500)
		})
	}

	return (
		<div>
			<h2 className='text-xl font-bold text-gray-900 mb-4'>Spa Settings</h2>
			<ResultBanner result={result} />
			<div className='space-y-4'>
				<div className='grid sm:grid-cols-2 gap-4'>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Spa Name</label>
						<input type='text' value={form.name} onChange={(e) => set('name', e.target.value)}
							className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none' />
					</div>
					<div>
						<label className='block text-sm font-semibold text-gray-700 mb-1'>Phone</label>
						<input type='tel' value={form.phone} onChange={(e) => set('phone', e.target.value)}
							className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none' />
					</div>
				</div>
				<div>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Description</label>
					<textarea value={form.description} onChange={(e) => set('description', e.target.value)}
						rows={3} className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none' />
				</div>
				<div>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Address</label>
					<input type='text' value={form.address} onChange={(e) => set('address', e.target.value)}
						className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none' />
				</div>
				<div>
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Email</label>
					<input type='email' value={form.email} onChange={(e) => set('email', e.target.value)}
						className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 outline-none' />
				</div>
				<div className='rounded-xl border border-gray-200 p-4 space-y-3'>
					<label className='flex items-start gap-3'>
						<input
							type='checkbox'
							checked={form.requiresBookingConsent}
							onChange={(e) => set('requiresBookingConsent', e.target.checked)}
							className='mt-1 h-4 w-4 rounded border-gray-300 text-warm-500 focus:ring-warm-400'
						/>
						<div>
							<div className='text-sm font-semibold text-gray-800'>Require liability form before booking</div>
							<div className='text-xs text-gray-500 mt-1'>
								Customers must sign before confirming an appointment.
							</div>
						</div>
					</label>
					<textarea
						value={form.bookingConsentText}
						onChange={(e) => set('bookingConsentText', e.target.value)}
						rows={4}
						disabled={!form.requiresBookingConsent}
						className='w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-warm-400 outline-none resize-none disabled:bg-gray-50 disabled:text-gray-400'
					/>
				</div>
				<button
					onClick={handleSave}
					disabled={isPending}
					className='px-6 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 disabled:opacity-50 flex items-center gap-2'
				>
					{isPending ? <><Spinner /> Saving…</> : 'Save Settings'}
				</button>
			</div>
		</div>
	)
}

// ─── New Booking Button (wrapper for the modal) ───────────────────────────────

export function NewBookingButton({ spa }: { spa: any }) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className='flex items-center gap-2 px-5 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 transition-colors shadow-sm'
			>
				<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
				</svg>
				New Booking
			</button>
			<CreateBookingModal spa={spa} open={open} onClose={() => setOpen(false)} />
		</>
	)
}

export function ContactButton() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className='flex items-center gap-2 px-5 py-2.5 bg-warm-500 text-white rounded-xl font-semibold hover:bg-warm-600 transition-colors shadow-sm'
			>
				<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
				</svg>
				Contact Support
			</button>
			{open && (
				<div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
					<div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm'>
						<div className='flex items-center justify-between px-6 py-4 border-b border-gray-100'>
							<h3 className='text-lg font-bold text-gray-900'>Contact Flo Support</h3>
							<button
								onClick={() => setOpen(false)}
								className='p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500'
							>
								<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
								</svg>
							</button>
						</div>
						<div className='p-6 space-y-4'>
							<div className='p-4 bg-warm-50 rounded-lg'>
								<p className='text-sm text-gray-500 mb-1'>Phone</p>
								<p className='text-xl font-bold text-warm-600'>+1-888-FLO-HELP</p>
								<p className='text-xs text-gray-500 mt-2'>Available: Monday-Friday, 9AM-6PM</p>
							</div>
							<div className='p-4 bg-warm-50 rounded-lg'>
								<p className='text-sm text-gray-500 mb-1'>Email</p>
								<p className='text-lg font-bold text-warm-600'>support@floapp.com</p>
								<p className='text-xs text-gray-500 mt-2'>We respond within 2 hours</p>
							</div>
							<div className='p-4 bg-warm-50 rounded-lg'>
								<p className='text-sm text-gray-500 mb-1'>Live Chat</p>
								<p className='text-lg font-bold text-warm-600'>24/7 Available</p>
								<p className='text-xs text-gray-500 mt-2'>Click the chat icon in the corner</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

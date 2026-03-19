'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
	createBooking,
	rescheduleBooking,
	cancelBookingManager,
	markBookingPaid,
	updateBookingStatus,
	createEmployee,
	updateEmployee,
	deleteEmployee,
	createService,
	createSubservice,
	deleteSubservice,
	updateSpaSettings,
} from './actions'

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
		subserviceId: spa.Services?.[0]?.Subservices?.[0]?.id || '',
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
	const selectedSub = subs.find((s: any) => s.id === form.subserviceId)

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

	const handleSubmit = () => {
		if (!form.date || !form.time || !form.subserviceId) {
			setResult({ ok: false, error: 'Please fill in all required fields' })
			return
		}
		startTransition(async () => {
			const res = await createBooking({
				spaId: spa.id,
				subserviceId: form.subserviceId,
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
						subserviceId: subs[0]?.id || '',
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
					<label className='block text-sm font-semibold text-gray-700 mb-1'>Service *</label>
					<select
						value={form.subserviceId}
						onChange={(e) => set('subserviceId', e.target.value)}
						className='w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-warm-400 focus:border-transparent outline-none'
					>
						{spa.Services?.map((svc: any) => (
							<optgroup key={svc.id} label={svc.name}>
								{svc.Subservices?.map((sub: any) => (
									<option key={sub.id} value={sub.id}>
										{sub.name} — ${(sub.priceCents / 100).toFixed(0)} · {sub.durationMin}min
									</option>
								))}
							</optgroup>
						))}
					</select>
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
			{selectedSub && form.date && form.time && (
				<div className='mt-4 p-3 bg-warm-50 rounded-xl border border-warm-200 text-sm'>
					<div className='flex justify-between'>
						<span className='text-gray-600'>{selectedSub.name}</span>
						<span className='font-bold text-warm-700'>${(selectedSub.priceCents / 100).toFixed(2)}</span>
					</div>
					<div className='text-gray-500 mt-1'>
						{form.date} at {fmtTime(form.time)} · {selectedSub.durationMin} min
					</div>
				</div>
			)}

			<div className='flex gap-3 mt-6'>
				<button
					onClick={handleSubmit}
					disabled={isPending || !form.date || !form.time}
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

	if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
		return <span className='text-xs text-gray-400 italic'>{booking.status.toLowerCase()}</span>
	}

	return (
		<>
			<div className='flex flex-wrap gap-1.5'>
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
					onClick={() => run(() => updateBookingStatus(booking.id, 'COMPLETED'))}
					disabled={isPending}
					className='px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-colors'
				>
					Complete
				</button>
				<button
					onClick={() => run(() => updateBookingStatus(booking.id, 'NO_SHOW'))}
					disabled={isPending}
					className='px-2.5 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium transition-colors'
				>
					No Show
				</button>
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
								<span className='font-semibold text-gray-900'>{svc.name}</span>
								<button
									onClick={() => { setSubForm({ name: '', description: '', durationMin: '60', priceCents: '' }); setShowAddSub(svc.id) }}
									className='text-xs text-warm-600 hover:text-warm-800 font-medium flex items-center gap-1'
								>
									<svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
									</svg>
									Add Treatment
								</button>
							</div>
							<div className='divide-y divide-gray-100'>
								{svc.Subservices?.map((sub: any) => (
									<div key={sub.id} className='flex items-center justify-between px-4 py-3 text-sm'>
										<div>
											<span className='font-medium text-gray-800'>{sub.name}</span>
											<span className='text-gray-400 ml-2'>{sub.durationMin}min</span>
										</div>
										<div className='flex items-center gap-3'>
											<span className='font-semibold text-warm-700'>${(sub.priceCents / 100).toFixed(2)}</span>
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
	})

	const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

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

// 'use client'
// import { useState, useRef } from 'react'
// import FullCalendar from '@fullcalendar/react'
// import dayGridPlugin from '@fullcalendar/daygrid'
// import timeGridPlugin from '@fullcalendar/timegrid'
// import interactionPlugin from '@fullcalendar/interaction'
// import { rescheduleBooking } from './actions'

// // Color palette for different services/staff
// const COLORS = [
// 	'#f97316', // warm-500
// 	'#ea580c', // warm-600
// 	'#c2410c', // warm-700
// 	'#86473a', // nude-700
// 	'#655146', // nude-800
// 	'#fb923c', // warm-400
// ]

// interface CalendarEvent {
// 	id: string
// 	title: string
// 	start: Date
// 	end: Date
// 	backgroundColor: string
// 	borderColor: string
// 	extendedProps: {
// 		bookingId: string
// 		customerName: string
// 		serviceName: string
// 		employeeName?: string
// 		price: number
// 		status: string
// 		paymentStatus: string
// 	}
// }

// export default function ManagerCalendar({ spa }: { spa: any }) {
// 	const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>(
// 		'timeGridWeek'
// 	)
// 	const [selectedEvent, setSelectedEvent] = useState<any>(null)
// 	const calendarRef = useRef<any>(null)

// 	// Map staff to colors
// 	const employeeColors = new Map<string, string>()
// 	spa.Employees.forEach((emp: any, idx: number) => {
// 		employeeColors.set(emp.id, COLORS[idx % COLORS.length])
// 	})

// 	// Transform bookings to calendar events
// 	const events: CalendarEvent[] = spa.Bookings.filter(
// 		(b: any) => b.status !== 'CANCELLED'
// 	).map((booking: any) => {
// 		const color = booking.employeeId
// 			? employeeColors.get(booking.employeeId) || COLORS[0]
// 			: COLORS[0]

// 		return {
// 			id: booking.id,
// 			title: `${booking.subservice.name}${booking.employee ? ` - ${booking.employee.name}` : ''}`,
// 			start: new Date(booking.start),
// 			end: new Date(booking.end),
// 			backgroundColor: color,
// 			borderColor: color,
// 			extendedProps: {
// 				bookingId: booking.id,
// 				customerName: booking.user?.name || 'Guest',
// 				serviceName: `${booking.subservice.service.name} - ${booking.subservice.name}`,
// 				employeeName: booking.employee?.name,
// 				price: booking.totalCents / 100,
// 				status: booking.status,
// 				paymentStatus: booking.paymentStatus,
// 			},
// 		}
// 	})

// 	// Handle event click
// 	const handleEventClick = (info: any) => {
// 		setSelectedEvent(info.event)
// 	}

// 	// Handle event drag/drop (reschedule)
// 	const handleEventDrop = async (info: any) => {
// 		const newStart = info.event.start
// 		if (!newStart) return

// 		// Format datetime for action
// 		const year = newStart.getFullYear()
// 		const month = String(newStart.getMonth() + 1).padStart(2, '0')
// 		const day = String(newStart.getDate()).padStart(2, '0')
// 		const hours = String(newStart.getHours()).padStart(2, '0')
// 		const minutes = String(newStart.getMinutes()).padStart(2, '0')
// 		const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}:00`

// 		const result = await rescheduleBooking({
// 			bookingId: info.event.id,
// 			newStart: dateTimeString,
// 		})

// 		if (!result.ok) {
// 			// Revert the change
// 			info.revert()
// 			alert(result.error || 'Failed to reschedule')
// 		}
// 	}

// 	return (
// 		<div className='bg-white rounded-2xl shadow-lg p-6'>
// 			{/* Calendar Header */}
// 			<div className='flex items-center justify-between mb-6'>
// 				<h3 className='text-2xl font-bold text-gray-900'>Calendar View</h3>

// 				{/* View Switcher */}
// 				<div className='flex gap-2'>
// 					<button
// 						onClick={() => setView('timeGridDay')}
// 						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
// 							view === 'timeGridDay'
// 								? 'bg-warm-600 text-white'
// 								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
// 						}`}
// 					>
// 						Day
// 					</button>
// 					<button
// 						onClick={() => setView('timeGridWeek')}
// 						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
// 							view === 'timeGridWeek'
// 								? 'bg-warm-600 text-white'
// 								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
// 						}`}
// 					>
// 						Week
// 					</button>
// 					<button
// 						onClick={() => setView('dayGridMonth')}
// 						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
// 							view === 'dayGridMonth'
// 								? 'bg-warm-600 text-white'
// 								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
// 						}`}
// 					>
// 						Month
// 					</button>
// 				</div>
// 			</div>

// 			{/* Legend */}
// 			{spa.Employees.length > 0 && (
// 				<div className='mb-4 flex flex-wrap gap-3'>
// 					{spa.Employees.map((emp: any, idx: number) => (
// 						<div key={emp.id} className='flex items-center gap-2'>
// 							<div
// 								className='w-4 h-4 rounded'
// 								style={{ backgroundColor: COLORS[idx % COLORS.length] }}
// 							/>
// 							<span className='text-sm text-gray-700'>{emp.name}</span>
// 						</div>
// 					))}
// 				</div>
// 			)}

// 			{/* Calendar */}
// 			<div className='calendar-container'>
// 				<FullCalendar
// 					ref={calendarRef}
// 					plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
// 					initialView={view}
// 					headerToolbar={{
// 						left: 'prev,next today',
// 						center: 'title',
// 						right: '',
// 					}}
// 					events={events}
// 					editable={true}
// 					droppable={true}
// 					eventClick={handleEventClick}
// 					eventDrop={handleEventDrop}
// 					slotMinTime='08:00:00'
// 					slotMaxTime='20:00:00'
// 					height='auto'
// 					allDaySlot={false}
// 					nowIndicator={true}
// 					slotDuration='00:30:00'
// 					businessHours={{
// 						daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
// 						startTime: '09:00',
// 						endTime: '18:00',
// 					}}
// 					eventTimeFormat={{
// 						hour: 'numeric',
// 						minute: '2-digit',
// 						meridiem: 'short',
// 					}}
// 				/>
// 			</div>

// 			{/* Event Detail Modal */}
// 			{selectedEvent && (
// 				<div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
// 					<div className='bg-white rounded-2xl p-6 max-w-md w-full'>
// 						<div className='flex items-start justify-between mb-4'>
// 							<h3 className='text-xl font-bold text-gray-900'>
// 								Booking Details
// 							</h3>
// 							<button
// 								onClick={() => setSelectedEvent(null)}
// 								className='text-gray-400 hover:text-gray-600'
// 							>
// 								<svg
// 									className='w-6 h-6'
// 									fill='none'
// 									stroke='currentColor'
// 									viewBox='0 0 24 24'
// 								>
// 									<path
// 										strokeLinecap='round'
// 										strokeLinejoin='round'
// 										strokeWidth={2}
// 										d='M6 18L18 6M6 6l12 12'
// 									/>
// 								</svg>
// 							</button>
// 						</div>

// 						<div className='space-y-3'>
// 							<div>
// 								<div className='text-sm text-gray-500'>Customer</div>
// 								<div className='font-semibold text-gray-900'>
// 									{selectedEvent.extendedProps.customerName}
// 								</div>
// 							</div>

// 							<div>
// 								<div className='text-sm text-gray-500'>Service</div>
// 								<div className='font-semibold text-gray-900'>
// 									{selectedEvent.extendedProps.serviceName}
// 								</div>
// 							</div>

// 							{selectedEvent.extendedProps.employeeName && (
// 								<div>
// 									<div className='text-sm text-gray-500'>Therapist</div>
// 									<div className='font-semibold text-gray-900'>
// 										{selectedEvent.extendedProps.employeeName}
// 									</div>
// 								</div>
// 							)}

// 							<div>
// 								<div className='text-sm text-gray-500'>Date & Time</div>
// 								<div className='font-semibold text-gray-900'>
// 									{selectedEvent.start.toLocaleDateString('en-US', {
// 										weekday: 'long',
// 										month: 'long',
// 										day: 'numeric',
// 										year: 'numeric',
// 									})}{' '}
// 									at{' '}
// 									{selectedEvent.start.toLocaleTimeString('en-US', {
// 										hour: 'numeric',
// 										minute: '2-digit',
// 									})}
// 								</div>
// 							</div>

// 							<div>
// 								<div className='text-sm text-gray-500'>Price</div>
// 								<div className='font-semibold text-gray-900'>
// 									${selectedEvent.extendedProps.price.toFixed(2)}
// 								</div>
// 							</div>

// 							<div className='flex gap-2'>
// 								<div>
// 									<span
// 										className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
// 											selectedEvent.extendedProps.status === 'CONFIRMED'
// 												? 'bg-green-100 text-green-700'
// 												: selectedEvent.extendedProps.status === 'PENDING'
// 												? 'bg-yellow-100 text-yellow-700'
// 												: 'bg-gray-100 text-gray-700'
// 										}`}
// 									>
// 										{selectedEvent.extendedProps.status}
// 									</span>
// 								</div>
// 								<div>
// 									<span
// 										className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
// 											selectedEvent.extendedProps.paymentStatus === 'PAID'
// 												? 'bg-green-100 text-green-700'
// 												: 'bg-orange-100 text-orange-700'
// 										}`}
// 									>
// 										{selectedEvent.extendedProps.paymentStatus}
// 									</span>
// 								</div>
// 							</div>
// 						</div>

// 						<div className='mt-6 text-sm text-gray-500'>
// 							💡 Tip: Drag and drop events on the calendar to reschedule
// 						</div>
// 					</div>
// 				</div>
// 			)}

// 			{/* Custom CSS for FullCalendar */}
// 			<style jsx global>{`
// 				.fc {
// 					font-family: inherit;
// 				}
// 				.fc .fc-button {
// 					background-color: #ea580c;
// 					border-color: #ea580c;
// 					text-transform: capitalize;
// 				}
// 				.fc .fc-button:hover {
// 					background-color: #c2410c;
// 					border-color: #c2410c;
// 				}
// 				.fc .fc-button:disabled {
// 					opacity: 0.5;
// 				}
// 				.fc .fc-button-active {
// 					background-color: #c2410c !important;
// 					border-color: #c2410c !important;
// 				}
// 				.fc-event {
// 					cursor: pointer;
// 					border-radius: 4px;
// 					padding: 2px 4px;
// 					font-size: 0.875rem;
// 				}
// 				.fc-event:hover {
// 					opacity: 0.9;
// 				}
// 				.fc .fc-daygrid-day-number {
// 					color: #374151;
// 					font-weight: 500;
// 				}
// 				.fc .fc-col-header-cell-cushion {
// 					color: #6b7280;
// 					font-weight: 600;
// 					text-transform: uppercase;
// 					font-size: 0.75rem;
// 					letter-spacing: 0.05em;
// 				}
// 				.fc .fc-timegrid-slot-label {
// 					font-size: 0.75rem;
// 					color: #6b7280;
// 				}
// 				.fc-theme-standard td,
// 				.fc-theme-standard th {
// 					border-color: #e5e7eb;
// 				}
// 				.fc .fc-highlight {
// 					background-color: #fef9f7;
// 				}
// 			`}</style>
// 		</div>
// 	)
// }
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, {
	EventResizeDoneArg,
} from '@fullcalendar/interaction'
import type {
	EventClickArg,
	EventInput,
	DateSelectArg,
	EventDropArg,
} from '@fullcalendar/core'
import { createBooking, rescheduleBooking } from './actions'

// Color palette for different services/staff
const COLORS = [
	'#f97316', // warm-500
	'#ea580c', // warm-600
	'#c2410c', // warm-700
	'#86473a', // nude-700
	'#655146', // nude-800
	'#fb923c', // warm-400
]

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

export default function ManagerCalendar({ spa }: { spa: any }) {
	const calendarRef = useRef<FullCalendar | null>(null)

	// Persist view like Google Calendar
	const [view, setView] = useState<CalendarView>(() => {
		if (typeof window === 'undefined') return 'timeGridWeek'
		return (
			(localStorage.getItem('managerCalendarView') as CalendarView) ||
			'timeGridWeek'
		)
	})

	const [selectedEvent, setSelectedEvent] = useState<any>(null)

	// "Create booking" modal state (simple starter)
	const [createDraft, setCreateDraft] = useState<{
		open: boolean
		start: Date | null
		end: Date | null
	}>({ open: false, start: null, end: null })

	// Map staff to colors
	const employeeColors = useMemo(() => {
		const m = new Map<string, string>()
		spa.Employees?.forEach((emp: any, idx: number) => {
			m.set(emp.id, COLORS[idx % COLORS.length])
		})
		return m
	}, [spa.Employees])

	// Transform bookings to calendar events
	const events: EventInput[] = useMemo(() => {
		return (spa.Bookings || [])
			.filter((b: any) => b.status !== 'CANCELLED')
			.map((booking: any) => {
				const color = booking.employeeId
					? employeeColors.get(booking.employeeId) || COLORS[0]
					: COLORS[0]

				return {
					id: booking.id,
					title: `${booking.subservice.name}${
						booking.employee ? ` - ${booking.employee.name}` : ''
					}`,
					start: new Date(booking.start),
					end: new Date(booking.end),
					backgroundColor: color,
					borderColor: color,
					extendedProps: {
						bookingId: booking.id,
						customerName: booking.user?.name || 'Guest',
						serviceName: `${booking.subservice.service.name} - ${booking.subservice.name}`,
						employeeName: booking.employee?.name,
						price: booking.totalCents / 100,
						status: booking.status,
						paymentStatus: booking.paymentStatus,
					},
				}
			})
	}, [spa.Bookings, employeeColors])

	// IMPORTANT: actually change the view when state changes (initialView does NOT update after mount)
	useEffect(() => {
		localStorage.setItem('managerCalendarView', view)
		const api = calendarRef.current?.getApi()
		if (api) api.changeView(view)
	}, [view])

	const handleEventClick = (info: EventClickArg) => {
		setSelectedEvent(info.event)
	}

	// Create by selecting a time range (Google Calendar style)
	const handleDateSelect = (selectInfo: DateSelectArg) => {
		setCreateDraft({
			open: true,
			start: selectInfo.start,
			end: selectInfo.end,
		})
		// clears selection highlight
		selectInfo.view.calendar.unselect()
	}

	const toActionDateTime = (d: Date) => {
		// local datetime string: YYYY-MM-DDTHH:mm:00
		const year = d.getFullYear()
		const month = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		const hours = String(d.getHours()).padStart(2, '0')
		const minutes = String(d.getMinutes()).padStart(2, '0')
		return `${year}-${month}-${day}T${hours}:${minutes}:00`
	}

	// Drag/drop reschedule (move)
	const handleEventDrop = async (info: EventDropArg) => {
		const newStart = info.event.start
		if (!newStart) return

		const result = await rescheduleBooking({
			bookingId: info.event.id,
			newStart: toActionDateTime(newStart),
		})

		if (!result.ok) {
			info.revert()
			alert('error' in result ? result.error : 'Failed to reschedule')
		}
	}

	// Resize (change duration) like Google Calendar
	const handleEventResize = async (info: EventResizeDoneArg) => {
		const newStart = info.event.start
		const newEnd = info.event.end
		if (!newStart || !newEnd) return

		const result = await rescheduleBooking({
			bookingId: info.event.id,
			newStart: toActionDateTime(newStart),
		})

		if (!result.ok) {
			info.revert()
			alert('error' in result ? result.error : 'Failed to update duration')
		}
	}

	const submitCreate = async () => {
		if (!createDraft.start || !createDraft.end) return

		const result = await createBooking({
			spaId: spa.id,
			start: toActionDateTime(createDraft.start),
			// You can add: employeeId, subserviceId, customerId, notes, etc.
		})

		if (!result.ok) {
			alert('error' in result ? result.error : 'Failed to create booking')
			return
		}

		// You likely refetch spa.Bookings from server. For now just close modal.
		setCreateDraft({ open: false, start: null, end: null })
		alert('Created! (Now refetch bookings or revalidate route)')
	}

	return (
		<div className='bg-white rounded-2xl shadow-lg p-6'>
			{/* Calendar Header */}
			<div className='flex items-center justify-between mb-6'>
				<h3 className='text-2xl font-bold text-gray-900'>Calendar View</h3>

				{/* View Switcher */}
				<div className='flex gap-2'>
					<button
						onClick={() => setView('timeGridDay')}
						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
							view === 'timeGridDay'
								? 'bg-warm-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						Day
					</button>
					<button
						onClick={() => setView('timeGridWeek')}
						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
							view === 'timeGridWeek'
								? 'bg-warm-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						Week
					</button>
					<button
						onClick={() => setView('dayGridMonth')}
						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
							view === 'dayGridMonth'
								? 'bg-warm-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						Month
					</button>
				</div>
			</div>

			{/* Legend */}
			{spa.Employees?.length > 0 && (
				<div className='mb-4 flex flex-wrap gap-3'>
					{spa.Employees.map((emp: any, idx: number) => (
						<div key={emp.id} className='flex items-center gap-2'>
							<div
								className='w-4 h-4 rounded'
								style={{ backgroundColor: COLORS[idx % COLORS.length] }}
							/>
							<span className='text-sm text-gray-700'>{emp.name}</span>
						</div>
					))}
				</div>
			)}

			{/* Calendar */}
			<div className='calendar-container'>
				<FullCalendar
					ref={calendarRef as any}
					plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
					initialView={view}
					headerToolbar={{
						left: 'prev,next today',
						center: 'title',
						right: '',
					}}
					events={events}
					editable={true} // enables drag + resize
					eventStartEditable={true}
					eventDurationEditable={true} // resize
					selectable={true} // click+drag to create
					selectMirror={true}
					select={handleDateSelect}
					eventClick={handleEventClick}
					eventDrop={handleEventDrop}
					eventResize={handleEventResize}
					slotMinTime='08:00:00'
					slotMaxTime='20:00:00'
					height='auto'
					allDaySlot={false}
					nowIndicator={true}
					slotDuration='00:30:00'
					businessHours={{
						daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
						startTime: '09:00',
						endTime: '18:00',
					}}
					eventTimeFormat={{
						hour: 'numeric',
						minute: '2-digit',
						meridiem: 'short',
					}}
					// Optional: quick tooltip on hover
					eventDidMount={(arg) => {
						const p = arg.event.extendedProps as any
						arg.el.title = `${p.customerName} • ${p.serviceName}`
					}}
				/>
			</div>

			{/* Create Modal */}
			{createDraft.open && createDraft.start && createDraft.end && (
				<div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
					<div className='bg-white rounded-2xl p-6 max-w-md w-full'>
						<div className='flex items-start justify-between mb-4'>
							<h3 className='text-xl font-bold text-gray-900'>
								Create Booking
							</h3>
							<button
								onClick={() =>
									setCreateDraft({ open: false, start: null, end: null })
								}
								className='text-gray-400 hover:text-gray-600'
							>
								<svg
									className='w-6 h-6'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M6 18L18 6M6 6l12 12'
									/>
								</svg>
							</button>
						</div>

						<div className='space-y-3'>
							<div>
								<div className='text-sm text-gray-500'>Start</div>
								<div className='font-semibold text-gray-900'>
									{createDraft.start.toLocaleString()}
								</div>
							</div>
							<div>
								<div className='text-sm text-gray-500'>End</div>
								<div className='font-semibold text-gray-900'>
									{createDraft.end.toLocaleString()}
								</div>
							</div>

							<div className='text-sm text-gray-500'>
								Add fields here (customer/service/employee). This starter just
								demonstrates wiring.
							</div>

							<button
								onClick={submitCreate}
								className='w-full mt-2 px-4 py-2 rounded-lg bg-warm-600 text-white font-medium hover:bg-warm-700'
							>
								Create
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Event Detail Modal (your existing) */}
			{selectedEvent && (
				<div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
					<div className='bg-white rounded-2xl p-6 max-w-md w-full'>
						<div className='flex items-start justify-between mb-4'>
							<h3 className='text-xl font-bold text-gray-900'>
								Booking Details
							</h3>
							<button
								onClick={() => setSelectedEvent(null)}
								className='text-gray-400 hover:text-gray-600'
							>
								<svg
									className='w-6 h-6'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M6 18L18 6M6 6l12 12'
									/>
								</svg>
							</button>
						</div>

						<div className='space-y-3'>
							<div>
								<div className='text-sm text-gray-500'>Customer</div>
								<div className='font-semibold text-gray-900'>
									{selectedEvent.extendedProps.customerName}
								</div>
							</div>

							<div>
								<div className='text-sm text-gray-500'>Service</div>
								<div className='font-semibold text-gray-900'>
									{selectedEvent.extendedProps.serviceName}
								</div>
							</div>

							{selectedEvent.extendedProps.employeeName && (
								<div>
									<div className='text-sm text-gray-500'>Therapist</div>
									<div className='font-semibold text-gray-900'>
										{selectedEvent.extendedProps.employeeName}
									</div>
								</div>
							)}

							<div>
								<div className='text-sm text-gray-500'>Date & Time</div>
								<div className='font-semibold text-gray-900'>
									{selectedEvent.start.toLocaleDateString('en-US', {
										weekday: 'long',
										month: 'long',
										day: 'numeric',
										year: 'numeric',
									})}{' '}
									at{' '}
									{selectedEvent.start.toLocaleTimeString('en-US', {
										hour: 'numeric',
										minute: '2-digit',
									})}
								</div>
							</div>

							<div>
								<div className='text-sm text-gray-500'>Price</div>
								<div className='font-semibold text-gray-900'>
									${selectedEvent.extendedProps.price.toFixed(2)}
								</div>
							</div>

							<div className='flex gap-2'>
								<span
									className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
										selectedEvent.extendedProps.status === 'CONFIRMED'
											? 'bg-green-100 text-green-700'
											: selectedEvent.extendedProps.status === 'PENDING'
											? 'bg-yellow-100 text-yellow-700'
											: 'bg-gray-100 text-gray-700'
									}`}
								>
									{selectedEvent.extendedProps.status}
								</span>

								<span
									className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
										selectedEvent.extendedProps.paymentStatus === 'PAID'
											? 'bg-green-100 text-green-700'
											: 'bg-orange-100 text-orange-700'
									}`}
								>
									{selectedEvent.extendedProps.paymentStatus}
								</span>
							</div>
						</div>

						<div className='mt-6 text-sm text-gray-500'>
							💡 Tip: Drag to move, resize to change duration, click+drag empty
							space to create
						</div>
					</div>
				</div>
			)}

			{/* Your existing custom FullCalendar CSS */}
			<style jsx global>{`
				.fc {
					font-family: inherit;
				}
				.fc .fc-button {
					background-color: #ea580c;
					border-color: #ea580c;
					text-transform: capitalize;
				}
				.fc .fc-button:hover {
					background-color: #c2410c;
					border-color: #c2410c;
				}
				.fc .fc-button:disabled {
					opacity: 0.5;
				}
				.fc .fc-button-active {
					background-color: #c2410c !important;
					border-color: #c2410c !important;
				}
				.fc-event {
					cursor: pointer;
					border-radius: 4px;
					padding: 2px 4px;
					font-size: 0.875rem;
				}
				.fc-event:hover {
					opacity: 0.9;
				}
				.fc .fc-daygrid-day-number {
					color: #374151;
					font-weight: 500;
				}
				.fc .fc-col-header-cell-cushion {
					color: #6b7280;
					font-weight: 600;
					text-transform: uppercase;
					font-size: 0.75rem;
					letter-spacing: 0.05em;
				}
				.fc .fc-timegrid-slot-label {
					font-size: 0.75rem;
					color: #6b7280;
				}
				.fc-theme-standard td,
				.fc-theme-standard th {
					border-color: #e5e7eb;
				}
				.fc .fc-highlight {
					background-color: #fef9f7;
				}
			`}</style>
		</div>
	)
}

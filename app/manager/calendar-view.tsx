'use client'
import { useState } from 'react'
import ManagerCalendar from './calendar'

export function CalendarViewToggle({ spa }: { spa: any }) {
	const [showCalendar, setShowCalendar] = useState(true)

	return (
		<div>
			{/* View Toggle */}
			<div className='mb-6 flex items-center justify-between'>
				<h3 className='text-xl font-bold text-gray-900'>Bookings Overview</h3>
				<div className='flex gap-2 bg-gray-100 p-1 rounded-lg'>
					<button
						onClick={() => setShowCalendar(true)}
						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
							showCalendar
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-600 hover:text-gray-900'
						}`}
					>
						📅 Calendar View
					</button>
					<button
						onClick={() => setShowCalendar(false)}
						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
							!showCalendar
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-600 hover:text-gray-900'
						}`}
					>
						📋 List View
					</button>
				</div>
			</div>

			{showCalendar ? (
				<ManagerCalendar spa={spa} />
			) : (
				<div className='grid lg:grid-cols-2 gap-6'>
					{/* Today's Schedule */}
					<TodaySchedule spa={spa} />
					{/* Upcoming Bookings */}
					<UpcomingBookings spa={spa} />
				</div>
			)}
		</div>
	)
}

function TodaySchedule({ spa }: { spa: any }) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const tomorrow = new Date(today)
	tomorrow.setDate(tomorrow.getDate() + 1)

	const todayBookings = spa.Bookings.filter(
		(b: any) =>
			new Date(b.start) >= today &&
			new Date(b.start) < tomorrow &&
			b.status !== 'CANCELLED'
	)

	return (
		<div className='bg-white rounded-2xl shadow-lg p-6'>
			<div className='flex items-center justify-between mb-6'>
				<h3 className='text-xl font-bold text-gray-900'>Today's Schedule</h3>
				<span className='px-3 py-1 bg-warm-100 text-warm-700 rounded-full text-sm font-semibold'>
					{todayBookings.length} bookings
				</span>
			</div>

			<div className='space-y-4 max-h-96 overflow-y-auto'>
				{todayBookings.length > 0 ? (
					todayBookings.map((booking: any) => (
						<div
							key={booking.id}
							className='p-4 bg-gradient-to-br from-warm-50 to-nude-50 rounded-xl border border-warm-200'
						>
							<div className='flex items-start justify-between mb-2'>
								<div className='flex-1'>
									<div className='font-semibold text-gray-900'>
										{new Date(booking.start).toLocaleTimeString('en-US', {
											hour: 'numeric',
											minute: '2-digit',
										})}{' '}
										-{' '}
										{new Date(booking.end).toLocaleTimeString('en-US', {
											hour: 'numeric',
											minute: '2-digit',
										})}
									</div>
									<div className='text-sm text-gray-600'>
										{booking.subservice.service.name} - {booking.subservice.name}
									</div>
								</div>
								<span
									className={`px-3 py-1 rounded-full text-xs font-semibold ${
										booking.status === 'CONFIRMED'
											? 'bg-green-100 text-green-700'
											: booking.status === 'PENDING'
											? 'bg-yellow-100 text-yellow-700'
											: 'bg-gray-100 text-gray-700'
									}`}
								>
									{booking.status}
								</span>
							</div>
							<div className='flex items-center gap-4 text-sm text-gray-600'>
								<div className='flex items-center gap-1'>
									<svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
										<path
											fillRule='evenodd'
											d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
											clipRule='evenodd'
										/>
									</svg>
									<span>{booking.user?.name || 'Guest'}</span>
								</div>
								{booking.employee && (
									<div className='flex items-center gap-1'>
										<svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
											<path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' />
										</svg>
										<span>{booking.employee.name}</span>
									</div>
								)}
								<div className='flex items-center gap-1 ml-auto'>
									<span className='font-semibold text-warm-600'>
										${(booking.totalCents / 100).toFixed(0)}
									</span>
									<span
										className={
											booking.paymentStatus === 'PAID'
												? 'text-green-600'
												: 'text-orange-600'
										}
									>
										{booking.paymentStatus === 'PAID' ? '✓' : '○'}
									</span>
								</div>
							</div>
						</div>
					))
				) : (
					<div className='text-center py-8 text-gray-400'>
						<svg
							className='w-16 h-16 mx-auto mb-3'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={1.5}
								d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
							/>
						</svg>
						<p>No bookings scheduled for today</p>
					</div>
				)}
			</div>
		</div>
	)
}

function UpcomingBookings({ spa }: { spa: any }) {
	const upcomingBookings = spa.Bookings.filter(
		(b: any) => new Date(b.start) > new Date() && b.status !== 'CANCELLED'
	).slice(0, 10)

	return (
		<div className='bg-white rounded-2xl shadow-lg p-6'>
			<div className='flex items-center justify-between mb-6'>
				<h3 className='text-xl font-bold text-gray-900'>Upcoming Bookings</h3>
				<span className='px-3 py-1 bg-warm-100 text-warm-700 rounded-full text-sm font-semibold'>
					{upcomingBookings.length} total
				</span>
			</div>

			<div className='space-y-4 max-h-96 overflow-y-auto'>
				{upcomingBookings.map((booking: any) => (
					<div
						key={booking.id}
						className='p-4 bg-gradient-to-br from-warm-50 to-nude-50 rounded-xl border border-warm-200'
					>
						<div className='flex items-start justify-between mb-2'>
							<div className='flex-1'>
								<div className='font-semibold text-gray-900'>
									{new Date(booking.start).toLocaleDateString('en-US', {
										weekday: 'short',
										month: 'short',
										day: 'numeric',
									})}{' '}
									at{' '}
									{new Date(booking.start).toLocaleTimeString('en-US', {
										hour: 'numeric',
										minute: '2-digit',
									})}
								</div>
								<div className='text-sm text-gray-600'>{booking.subservice.name}</div>
							</div>
							<span
								className={`px-3 py-1 rounded-full text-xs font-semibold ${
									booking.status === 'CONFIRMED'
										? 'bg-green-100 text-green-700'
										: booking.status === 'PENDING'
										? 'bg-yellow-100 text-yellow-700'
										: 'bg-gray-100 text-gray-700'
								}`}
							>
								{booking.status}
							</span>
						</div>
						<div className='flex items-center gap-4 text-sm text-gray-600'>
							<div className='flex items-center gap-1'>
								<span>{booking.user?.name || 'Guest'}</span>
							</div>
							{booking.employee && (
								<div className='flex items-center gap-1'>
									<span>• {booking.employee.name}</span>
								</div>
							)}
							<div className='flex items-center gap-1 ml-auto'>
								<span className='font-semibold text-warm-600'>
									${(booking.totalCents / 100).toFixed(0)}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ManagerDashboardPage() {
	const session = await getServerSession(authOptions)

	if (!session?.user) {
		redirect('/auth/sign-in')
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email! },
		include: {
			OwnedSpas: {
				include: {
					Services: {
						include: {
							Subservices: true,
						},
					},
					Employees: true,
					Bookings: {
						include: {
							user: true,
							subservice: {
								include: {
									service: true,
								},
							},
							employee: true,
						},
						orderBy: {
							start: 'desc',
						},
						take: 20,
					},
					_count: {
						select: {
							Bookings: true,
						},
					},
				},
			},
		},
	})

	if (!user) {
		redirect('/auth/sign-in')
	}

	if (user.role !== 'OWNER') {
		redirect('/profile')
	}

	const spa = user.OwnedSpas[0] // For now, use first spa

	if (!spa) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center bg-white p-12 rounded-2xl shadow-lg max-w-md'>
					<svg
						className='w-16 h-16 mx-auto text-gray-300 mb-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
						/>
					</svg>
					<h2 className='text-2xl font-bold text-gray-900 mb-2'>
						No Spa Registered
					</h2>
					<p className='text-gray-600 mb-6'>
						You don't have a spa registered yet.
					</p>
					<Link
						href='/dashboard'
						className='inline-block px-6 py-3 bg-gradient-to-r from-warm-400 to-nude-400 text-white rounded-lg hover:opacity-90 transition-opacity'
					>
						Back to Dashboard
					</Link>
				</div>
			</div>
		)
	}

	const upcomingBookings = spa.Bookings.filter(
		(b) => new Date(b.start) > new Date()
	)
	const todayBookings = upcomingBookings.filter((b) => {
		const today = new Date()
		const bookingDate = new Date(b.start)
		return (
			bookingDate.getDate() === today.getDate() &&
			bookingDate.getMonth() === today.getMonth() &&
			bookingDate.getFullYear() === today.getFullYear()
		)
	})

	const totalRevenue = spa.Bookings.filter(
		(b) => b.paymentStatus === 'PAID'
	).reduce((sum, b) => sum + b.paidCents, 0)

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='max-w-7xl mx-auto px-6 py-8'>
				{/* Header */}
				<div className='bg-gradient-to-r from-warm-400 to-nude-500 rounded-2xl shadow-lg p-8 mb-8 text-white'>
					<div className='flex items-start justify-between'>
						<div>
							<h1 className='text-3xl font-bold mb-2'>{spa.name}</h1>
							<p className='text-warm-100 mb-4'>{spa.description}</p>
							<div className='flex gap-4 text-sm'>
								<div className='flex items-center gap-2'>
									<svg
										className='w-4 h-4'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path
											fillRule='evenodd'
											d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
											clipRule='evenodd'
										/>
									</svg>
									<span>{spa.address}</span>
								</div>
								<div className='flex items-center gap-2'>
									<svg
										className='w-4 h-4'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z' />
									</svg>
									<span>{spa.phone}</span>
								</div>
							</div>
						</div>
						<Link
							href='/dashboard'
							className='px-4 py-2 bg-white text-warm-600 rounded-lg hover:bg-warm-50 transition-colors text-sm font-medium'
						>
							← Dashboard
						</Link>
					</div>
				</div>

				{/* Stats Grid */}
				<div className='grid md:grid-cols-4 gap-6 mb-8'>
					<div className='bg-white rounded-xl shadow p-6'>
						<div className='flex items-center justify-between mb-2'>
							<h3 className='text-sm font-medium text-gray-600'>
								Today's Bookings
							</h3>
							<svg
								className='w-8 h-8 text-warm-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
								/>
							</svg>
						</div>
						<div className='text-3xl font-bold text-gray-900'>
							{todayBookings.length}
						</div>
					</div>

					<div className='bg-white rounded-xl shadow p-6'>
						<div className='flex items-center justify-between mb-2'>
							<h3 className='text-sm font-medium text-gray-600'>
								Total Revenue
							</h3>
							<svg
								className='w-8 h-8 text-warm-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
						</div>
						<div className='text-3xl font-bold text-gray-900'>
							${(totalRevenue / 100).toFixed(0)}
						</div>
					</div>

					<div className='bg-white rounded-xl shadow p-6'>
						<div className='flex items-center justify-between mb-2'>
							<h3 className='text-sm font-medium text-gray-600'>Services</h3>
							<svg
								className='w-8 h-8 text-blue-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
								/>
							</svg>
						</div>
						<div className='text-3xl font-bold text-gray-900'>
							{spa.Services.flatMap((s) => s.Subservices).length}
						</div>
					</div>

					<div className='bg-white rounded-xl shadow p-6'>
						<div className='flex items-center justify-between mb-2'>
							<h3 className='text-sm font-medium text-gray-600'>Staff</h3>
							<svg
								className='w-8 h-8 text-purple-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
								/>
							</svg>
						</div>
						<div className='text-3xl font-bold text-gray-900'>
							{spa.Employees.length}
						</div>
					</div>
				</div>

				<div className='grid lg:grid-cols-2 gap-8'>
					{/* Recent Bookings */}
					<div className='bg-white rounded-xl shadow'>
						<div className='p-6 border-b border-gray-200'>
							<h2 className='text-xl font-bold text-gray-900'>
								Upcoming Bookings
							</h2>
						</div>
						<div className='p-6'>
							{upcomingBookings.length > 0 ? (
								<div className='space-y-4'>
									{upcomingBookings.slice(0, 5).map((booking) => (
										<div
											key={booking.id}
											className='flex items-start justify-between p-4 bg-gray-50 rounded-lg'
										>
											<div className='flex-1'>
												<div className='font-medium text-gray-900 mb-1'>
													{booking.user?.name || 'Guest'}
												</div>
												<div className='text-sm text-gray-600 space-y-1'>
													<div>
														{booking.subservice.service.name} -{' '}
														{booking.subservice.name}
													</div>
													<div className='flex items-center gap-4'>
														<span>
															{new Date(booking.start).toLocaleDateString()}
														</span>
														<span>
															{new Date(booking.start).toLocaleTimeString(
																'en-US',
																{
																	hour: '2-digit',
																	minute: '2-digit',
																}
															)}
														</span>
													</div>
													{booking.employee && (
														<div className='text-xs'>
															With {booking.employee.name}
														</div>
													)}
												</div>
											</div>
											<div className='text-right'>
												<div className='font-semibold text-gray-900'>
													${(booking.totalCents / 100).toFixed(2)}
												</div>
												<div
													className={`text-xs mt-1 px-2 py-1 rounded-full ${
														booking.status === 'CONFIRMED'
															? 'bg-green-100 text-green-800'
															: 'bg-yellow-100 text-yellow-800'
													}`}
												>
													{booking.status}
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className='text-center py-8 text-gray-500'>
									No upcoming bookings
								</div>
							)}
						</div>
					</div>

					{/* Services & Staff */}
					<div className='space-y-8'>
						{/* Services */}
						<div className='bg-white rounded-xl shadow'>
							<div className='p-6 border-b border-gray-200'>
								<h2 className='text-xl font-bold text-gray-900'>Services</h2>
							</div>
							<div className='p-6'>
								<div className='space-y-4'>
									{spa.Services.map((service) => (
										<div key={service.id}>
											<h3 className='font-semibold text-gray-900 mb-2'>
												{service.name}
											</h3>
											<div className='space-y-2 ml-4'>
												{service.Subservices.map((sub) => (
													<div
														key={sub.id}
														className='flex items-center justify-between text-sm'
													>
														<span className='text-gray-600'>{sub.name}</span>
														<span className='font-medium text-gray-900'>
															${(sub.priceCents / 100).toFixed(2)}
														</span>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Staff */}
						<div className='bg-white rounded-xl shadow'>
							<div className='p-6 border-b border-gray-200'>
								<h2 className='text-xl font-bold text-gray-900'>Staff</h2>
							</div>
							<div className='p-6'>
								<div className='space-y-4'>
									{spa.Employees.map((employee) => (
										<div key={employee.id} className='flex items-center gap-3'>
											<div className='h-10 w-10 rounded-full bg-gradient-to-br from-warm-400 to-nude-500 flex items-center justify-center text-white font-medium'>
												{employee.name[0]}
											</div>
											<div className='flex-1'>
												<div className='font-medium text-gray-900'>
													{employee.name}
												</div>
												<div className='text-sm text-gray-500'>
													{employee.bio}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

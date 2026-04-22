import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
	BookingActionButtons,
	BookingDetailsButton,
	NewBookingButton,
	StaffPanel,
	ServicesPanel,
	SpaSettingsPanel,
	ContactButton,
} from './components'
import { formatBookingServiceNames, getBookingDurationMin } from '@/lib/booking'

export default async function ManagerDashboardPage({
	searchParams,
}: {
	searchParams: { tab?: string }
}) {
	const session = await getServerSession(authOptions)
	if (!session?.user) redirect('/auth/sign-in')

	const user = await prisma.user.findUnique({
		where: { email: session.user.email! },
		include: {
			OwnedSpas: {
				include: {
					Services: { include: { Subservices: true } },
					Employees: true,
					Bookings: {
						include: {
							user: true,
							subservice: { include: { service: true } },
							employee: true,
							BookingItems: {
								include: {
									subservice: {
										include: {
											service: true,
										},
									},
								},
								orderBy: { orderIndex: 'asc' },
							},
						},
						orderBy: { start: 'desc' },
					},
				},
			},
		},
	})

	if (!user) redirect('/auth/sign-in')
	if (user.role !== 'OWNER') redirect('/profile')

	const spa = user.OwnedSpas[0]

	if (!spa) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center bg-white p-12 rounded-2xl shadow-lg max-w-md'>
					<h2 className='text-2xl font-bold text-gray-900 mb-2'>No Spa Registered</h2>
					<p className='text-gray-600 mb-6'>You don't have a spa registered yet.</p>
					<Link href='/dashboard' className='inline-block px-6 py-3 bg-gradient-to-r from-warm-400 to-nude-400 text-white rounded-lg hover:opacity-90'>
						Back to Dashboard
					</Link>
				</div>
			</div>
		)
	}

	const activeTab = searchParams.tab || 'bookings'
	const now = new Date()

	const upcomingBookings = spa.Bookings.filter(
		(b) => new Date(b.start) > now && b.status !== 'CANCELLED'
	)
	const pastBookings = spa.Bookings.filter(
		(b) => new Date(b.start) <= now || b.status === 'CANCELLED'
	)
	const todayBookings = upcomingBookings.filter((b) => {
		const d = new Date(b.start)
		return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
	})
	const totalRevenue = spa.Bookings.filter((b) => b.paymentStatus === 'PAID').reduce(
		(sum, b) => sum + b.paidCents, 0
	)
	const pendingPayments = spa.Bookings.filter(
		(b) => b.paymentStatus === 'UNPAID' && b.status !== 'CANCELLED'
	).length
	const totalBookings = spa.Bookings.filter((b) => b.status !== 'CANCELLED').length

	const tabs = [
		{ id: 'bookings', label: 'Bookings', icon: '📅' },
		{ id: 'staff', label: 'Staff', icon: '👥' },
		{ id: 'services', label: 'Services', icon: '💆' },
		{ id: 'settings', label: 'Settings', icon: '⚙️' },
	]

	const statusColor = (s: string) => {
		if (s === 'CONFIRMED') return 'bg-green-100 text-green-800'
		if (s === 'PENDING') return 'bg-yellow-100 text-yellow-800'
		if (s === 'COMPLETED') return 'bg-blue-100 text-blue-800'
		if (s === 'CANCELLED') return 'bg-red-100 text-red-800'
		if (s === 'NO_SHOW') return 'bg-orange-100 text-orange-800'
		return 'bg-gray-100 text-gray-600'
	}

	const payColor = (s: string) => {
		if (s === 'PAID') return 'text-green-700'
		if (s === 'UNPAID') return 'text-red-600'
		if (s === 'PARTIAL') return 'text-yellow-600'
		return 'text-gray-500'
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<div className='bg-gradient-to-r from-warm-400 to-nude-500 text-white'>
				<div className='max-w-7xl mx-auto px-6 py-8'>
					<div className='flex items-start justify-between mb-6'>
						<div>
							<div className='text-warm-100 text-sm mb-1'>Manager Dashboard</div>
							<h1 className='text-3xl font-bold mb-1'>{spa.name}</h1>
							{spa.address && <p className='text-warm-100 text-sm'>{spa.address}</p>}
						</div>
					<div className='flex gap-3'>
						<NewBookingButton spa={spa} />
						<ContactButton />
						<Link
							href='/manager/home'
							className='px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors'
						>
							← Home
						</Link>
					</div>
				</div>
				<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6'>
						{[
							{ label: 'Total Bookings', value: totalBookings, icon: '📅' },
							{ label: 'Total Revenue', value: `$${(totalRevenue / 100).toFixed(0)}`, icon: '💰' },
							{ label: 'Pending Payments', value: pendingPayments, icon: '⏳' },
							{ label: 'Staff Members', value: spa.Employees.length, icon: '👥' },
						].map((stat) => (
							<div key={stat.label} className='bg-white/20 backdrop-blur-sm rounded-xl p-4'>
								<div className='text-xl mb-1'>{stat.icon}</div>
								<div className='text-2xl font-bold'>{stat.value}</div>
								<div className='text-warm-100 text-xs mt-0.5'>{stat.label}</div>
							</div>
						))}
					</div>
				</div>

				{/* Tab bar */}
				<div className='max-w-7xl mx-auto px-6'>
					<div className='flex gap-1'>
						{tabs.map((tab) => (
							<Link
								key={tab.id}
								href={`/manager?tab=${tab.id}`}
								className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
									activeTab === tab.id
										? 'border-white text-white'
										: 'border-transparent text-warm-100 hover:text-white'
								}`}
							>
								<span className='hidden sm:inline'>{tab.icon}</span>
								{tab.label}
							</Link>
						))}
					</div>
				</div>
			</div>

			{/* Tab content */}
			<div className='max-w-7xl mx-auto px-6 py-8'>

				{/* ── Bookings ── */}
				{activeTab === 'bookings' && (
					<div className='space-y-6'>

						{/* Upcoming table */}
						<div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
							<div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
								<h2 className='text-lg font-bold text-gray-900'>Upcoming Bookings</h2>
								<span className='text-sm text-gray-400'>{upcomingBookings.length} upcoming</span>
							</div>
							{upcomingBookings.length === 0 ? (
								<div className='py-16 text-center'>
									<div className='text-4xl mb-3'>📅</div>
									<p className='text-gray-500 font-medium'>No upcoming bookings</p>
									<p className='text-gray-400 text-sm mt-1'>Use the button above to create one</p>
								</div>
							) : (
								<div className='overflow-x-auto'>
									<table className='w-full text-sm'>
										<thead className='bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide'>
											<tr>
												<th className='px-6 py-3 text-left'>Customer</th>
												<th className='px-6 py-3 text-left'>Service</th>
												<th className='px-6 py-3 text-left'>Date & Time</th>
												<th className='px-6 py-3 text-left'>Staff</th>
												<th className='px-6 py-3 text-left'>Amount</th>
												<th className='px-6 py-3 text-left'>Status</th>
												<th className='px-6 py-3 text-left'>Actions</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-100'>
											{upcomingBookings.map((b) => (
												<tr key={b.id} className='hover:bg-gray-50 transition-colors'>
													<td className='px-6 py-4'>
														<div className='font-medium text-gray-900'>{b.user?.name || 'Walk-in'}</div>
														{b.user?.email && <div className='text-xs text-gray-400 truncate max-w-[140px]'>{b.user.email}</div>}
													</td>
													<td className='px-6 py-4'>
														<div className='text-gray-800'>
															{formatBookingServiceNames(b)}
														</div>
														<div className='text-xs text-gray-400'>
															{getBookingDurationMin(b)}min total
														</div>
													</td>
													<td className='px-6 py-4'>
														<div className='text-gray-800 font-medium'>
															{new Date(b.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
														</div>
														<div className='text-xs text-gray-400'>
															{new Date(b.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
															{' – '}
															{new Date(b.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
														</div>
													</td>
													<td className='px-6 py-4 text-gray-600'>{b.employee?.name || <span className='text-gray-300'>—</span>}</td>
													<td className='px-6 py-4'>
														<div className='font-semibold text-gray-900'>${(b.totalCents / 100).toFixed(2)}</div>
														<div className={`text-xs font-medium ${payColor(b.paymentStatus)}`}>{b.paymentStatus}</div>
													</td>
													<td className='px-6 py-4'>
														<span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(b.status)}`}>
															{b.status}
														</span>
													</td>
													<td className='px-6 py-4'>
														<div className='flex flex-col items-start gap-2'>
															<BookingDetailsButton booking={b} />
															<BookingActionButtons booking={b} />
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* History */}
						{pastBookings.length > 0 && (
							<div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
								<div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
									<h2 className='text-lg font-bold text-gray-900'>Booking History</h2>
									<span className='text-sm text-gray-400'>{pastBookings.length} records</span>
								</div>
								<div className='overflow-x-auto'>
									<table className='w-full text-sm'>
										<thead className='bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide'>
											<tr>
												<th className='px-6 py-3 text-left'>Customer</th>
												<th className='px-6 py-3 text-left'>Service</th>
												<th className='px-6 py-3 text-left'>Date</th>
												<th className='px-6 py-3 text-left'>Amount</th>
												<th className='px-6 py-3 text-left'>Status</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-100'>
											{pastBookings.slice(0, 25).map((b) => (
												<tr key={b.id} className='hover:bg-gray-50'>
													<td className='px-6 py-3 text-gray-700'>
														{b.customerName || b.user?.name || 'Walk-in'}
													</td>
													<td className='px-6 py-3 text-gray-600'>{formatBookingServiceNames(b)}</td>
													<td className='px-6 py-3 text-gray-500'>
														{new Date(b.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
													</td>
													<td className='px-6 py-3 font-medium text-gray-700'>${(b.totalCents / 100).toFixed(2)}</td>
													<td className='px-6 py-3'>
														<div className='flex items-center gap-2'>
															<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(b.status)}`}>
																{b.status}
															</span>
															<BookingDetailsButton booking={b} />
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				)}

				{activeTab === 'staff' && (
					<div className='bg-white rounded-2xl shadow-sm p-6'>
						<StaffPanel spa={spa} />
					</div>
				)}

				{activeTab === 'services' && (
					<div className='bg-white rounded-2xl shadow-sm p-6'>
						<ServicesPanel spa={spa} />
					</div>
				)}

				{activeTab === 'settings' && (
					<div className='bg-white rounded-2xl shadow-sm p-6 max-w-2xl'>
						<SpaSettingsPanel spa={spa} />
					</div>
				)}
			</div>
		</div>
	)
}

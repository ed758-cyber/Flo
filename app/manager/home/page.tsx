import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ManagerHomePage() {
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
						},
						orderBy: { start: 'desc' },
						take: 5,
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
					<Link
						href='/dashboard'
						className='inline-block px-6 py-3 bg-gradient-to-r from-warm-400 to-nude-400 text-white rounded-lg hover:opacity-90'
					>
						Back to Dashboard
					</Link>
				</div>
			</div>
		)
	}

	const now = new Date()
	const upcomingBookings = spa.Bookings.filter(
		(b) => new Date(b.start) > now && b.status !== 'CANCELLED'
	)
	const totalRevenue = spa.Bookings.filter((b) => b.paymentStatus === 'PAID').reduce(
		(sum, b) => sum + b.paidCents,
		0
	)

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<div className='bg-gradient-to-r from-warm-400 to-nude-500 text-white'>
				<div className='max-w-6xl mx-auto px-6 py-8'>
					<div className='flex items-center justify-between mb-8'>
						<div>
							<div className='text-warm-100 text-sm mb-2'>Welcome Back</div>
							<h1 className='text-4xl font-bold'>{spa.name}</h1>
						</div>
						<Link
							href='/manager'
							className='px-6 py-3 bg-white text-warm-500 rounded-lg font-semibold hover:bg-warm-50 transition-colors'
						>
							→ Go to Dashboard
						</Link>
					</div>

					{/* Quick Stats */}
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						{[
							{ label: 'Upcoming Bookings', value: upcomingBookings.length, icon: '📅', color: 'bg-blue-500/20' },
							{ label: 'Services', value: spa.Services.length, icon: '💆', color: 'bg-purple-500/20' },
							{ label: 'Staff Members', value: spa.Employees.length, icon: '👥', color: 'bg-green-500/20' },
							{ label: 'Total Revenue', value: `$${(totalRevenue / 100).toFixed(0)}`, icon: '💰', color: 'bg-yellow-500/20' },
						].map((stat) => (
							<div key={stat.label} className={`${stat.color} backdrop-blur-sm rounded-xl p-4`}>
								<div className='text-2xl mb-2'>{stat.icon}</div>
								<div className='text-xl font-bold'>{stat.value}</div>
								<div className='text-warm-100 text-xs mt-1'>{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className='max-w-6xl mx-auto px-6 py-8'>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
					{/* Spa Overview */}
					<div className='md:col-span-2 space-y-6'>
						{/* Spa Information */}
						<div className='bg-white rounded-2xl shadow-sm p-6'>
							<h2 className='text-lg font-bold text-gray-900 mb-4'>Spa Information</h2>
							<div className='space-y-3'>
								<div>
									<p className='text-sm text-gray-500'>Name</p>
									<p className='text-gray-900 font-medium'>{spa.name}</p>
								</div>
								{spa.address && (
									<div>
										<p className='text-sm text-gray-500'>Address</p>
										<p className='text-gray-900 font-medium'>{spa.address}</p>
									</div>
								)}
								{spa.phone && (
									<div>
										<p className='text-sm text-gray-500'>Phone</p>
										<p className='text-gray-900 font-medium'>{spa.phone}</p>
									</div>
								)}
								{spa.email && (
									<div>
										<p className='text-sm text-gray-500'>Email</p>
										<p className='text-gray-900 font-medium'>{spa.email}</p>
									</div>
								)}
							</div>
						</div>

						{/* Services */}
						<div className='bg-white rounded-2xl shadow-sm p-6'>
							<div className='flex items-center justify-between mb-4'>
								<h2 className='text-lg font-bold text-gray-900'>Your Services</h2>
								<span className='text-sm text-gray-500'>{spa.Services.length} services</span>
							</div>
							{spa.Services.length === 0 ? (
								<div className='py-8 text-center text-gray-500'>
									<p>No services added yet</p>
								</div>
							) : (
								<div className='grid grid-cols-2 gap-4'>
									{spa.Services.map((service) => (
										<div key={service.id} className='p-4 border border-gray-200 rounded-lg'>
											<h3 className='font-semibold text-gray-900'>{service.name}</h3>
											<p className='text-sm text-gray-500 mt-1'>{service.Subservices.length} options</p>
											<p className='text-sm text-warm-600 font-medium mt-2'>${(service.basePrice / 100).toFixed(0)}</p>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Sidebar */}
					<div className='space-y-6'>
						{/* Staff */}
						<div className='bg-white rounded-2xl shadow-sm p-6'>
							<h2 className='text-lg font-bold text-gray-900 mb-4'>Staff Team</h2>
							{spa.Employees.length === 0 ? (
								<p className='text-gray-500 text-sm'>No staff members yet</p>
							) : (
								<div className='space-y-3'>
									{spa.Employees.slice(0, 5).map((emp) => (
										<div key={emp.id} className='p-3 bg-gray-50 rounded-lg'>
											<p className='font-medium text-gray-900'>{emp.name || emp.email}</p>
											<p className='text-xs text-gray-500'>{emp.role}</p>
										</div>
									))}
									{spa.Employees.length > 5 && (
										<p className='text-xs text-gray-500 pt-2'>+{spa.Employees.length - 5} more</p>
									)}
								</div>
							)}
						</div>

						{/* Recent Bookings */}
						<div className='bg-white rounded-2xl shadow-sm p-6'>
							<h2 className='text-lg font-bold text-gray-900 mb-4'>Recent Activity</h2>
							{spa.Bookings.length === 0 ? (
								<p className='text-gray-500 text-sm'>No bookings yet</p>
							) : (
								<div className='space-y-3'>
									{spa.Bookings.slice(0, 3).map((booking) => (
										<div key={booking.id} className='p-3 bg-gray-50 rounded-lg'>
											<p className='font-medium text-gray-900 text-sm'>{booking.user?.name}</p>
											<p className='text-xs text-gray-500'>
												{new Date(booking.start).toLocaleDateString()}
											</p>
											<p className={`text-xs font-medium mt-1 ${
												booking.status === 'CONFIRMED' ? 'text-green-600' :
												booking.status === 'PENDING' ? 'text-yellow-600' :
												'text-gray-600'
											}`}>
												{booking.status}
											</p>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

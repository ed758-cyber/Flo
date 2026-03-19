import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function SpaPage({
	params,
}: {
	params: { slug: string }
}) {
	const spa = await prisma.spa.findUnique({
		where: { slug: params.slug },
		include: { Services: { include: { Subservices: true } }, Employees: true },
	})
	if (!spa)
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold text-gray-900 mb-4'>
						Spa Not Found
					</h1>
					<Link
						href='/dashboard'
						className='text-warm-600 hover:text-warm-700 font-medium'
					>
						← Back to Dashboard
					</Link>
				</div>
			</div>
		)

	return (
		<div className='min-h-screen bg-gradient-to-br from-warm-50 via-nude-50 to-warm-100'>
			{/* Hero Section with Image */}
			<div className='relative h-[400px] overflow-hidden'>
				<img
					src={
						spa.coverUrl ||
						'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&h=400&fit=crop'
					}
					alt={spa.name}
					className='w-full h-full object-cover'
				/>
				<div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent'></div>
				<div className='absolute bottom-0 left-0 right-0 p-8'>
					<div className='max-w-7xl mx-auto'>
						<div className='flex items-center gap-2 text-warm-100 mb-3'>
							<svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
								<path
									fillRule='evenodd'
									d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
									clipRule='evenodd'
								/>
							</svg>
							<span className='text-sm'>{spa.address || 'Saint Lucia'}</span>
						</div>
						<h1 className='text-5xl font-bold text-white mb-4'>{spa.name}</h1>
						<p className='text-xl text-warm-100 max-w-3xl'>{spa.description}</p>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-6 py-12'>
				{/* Quick Actions */}
				<div className='mb-12 flex gap-4'>
					<Link
						href={`/s/${spa.slug}/book`}
						className='px-8 py-4 bg-gradient-to-r from-warm-400 to-nude-400 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200'
					>
						Book Appointment
					</Link>
					<Link
						href='/dashboard'
						className='px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors'
					>
						← Browse Spas
					</Link>
				</div>

				{/* Services Section */}
				<div className='mb-12'>
					<div className='mb-8'>
						<h2 className='text-3xl font-bold text-gray-900 mb-2'>
							Our Services
						</h2>
						<p className='text-gray-600'>
							Choose from our premium treatments and packages
						</p>
					</div>

					<div className='grid gap-6'>
						{spa.Services.map((service) => (
							<div
								key={service.id}
								className='bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow'
							>
								<div className='bg-gradient-to-r from-warm-400 to-nude-400 px-6 py-4'>
									<h3 className='text-2xl font-bold text-white'>
										{service.name}
									</h3>
									<p className='text-warm-100 mt-1'>{service.description}</p>
								</div>

								<div className='p-6'>
									<div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
										{service.Subservices.map((subservice) => (
											<Link
												key={subservice.id}
												href={`/s/${spa.slug}/book?service=${subservice.id}`}
												className='bg-gradient-to-br from-warm-50 to-nude-50 rounded-xl p-5 border border-warm-200 hover:border-warm-400 hover:shadow-md transition-all cursor-pointer group'
											>
												<div className='flex items-start justify-between mb-3'>
													<h4 className='font-semibold text-gray-900 text-lg group-hover:text-warm-600 transition-colors'>
														{subservice.name}
													</h4>
													<div className='bg-warm-400 text-white px-3 py-1 rounded-full text-sm font-bold'>
														${(subservice.priceCents / 100).toFixed(0)}
													</div>
												</div>

												<p className='text-gray-600 text-sm mb-3'>
													{subservice.description}
												</p>

												<div className='flex items-center justify-between'>
													<div className='flex items-center gap-2 text-warm-700'>
														<svg
															className='w-4 h-4'
															fill='currentColor'
															viewBox='0 0 20 20'
														>
															<path
																fillRule='evenodd'
																d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
																clipRule='evenodd'
															/>
														</svg>
														<span className='text-sm font-medium'>
															{subservice.durationMin} min
														</span>
													</div>
													<span className='text-xs text-warm-600 font-medium group-hover:translate-x-1 transition-transform'>
														Book →
													</span>
												</div>
											</Link>
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Team Section */}
				<div>
					<div className='mb-8'>
						<h2 className='text-3xl font-bold text-gray-900 mb-2'>
							Meet Our Team
						</h2>
						<p className='text-gray-600'>
							Expert therapists dedicated to your wellness
						</p>
					</div>

					<div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{spa.Employees.map((employee) => (
							<div
								key={employee.id}
								className='bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-200'
							>
								<div className='h-48 bg-gradient-to-br from-warm-300 to-nude-400 relative overflow-hidden'>
									<img
										src={`https://i.pravatar.cc/300?u=${employee.id}`}
										alt={employee.name}
										className='w-full h-full object-cover'
									/>
								</div>

								<div className='p-6'>
									<h3 className='text-xl font-bold text-gray-900 mb-2'>
										{employee.name}
									</h3>
									<p className='text-gray-600 text-sm leading-relaxed mb-4'>
										{employee.bio}
									</p>

									<div className='pt-4 border-t border-gray-100'>
										<div className='text-xs text-gray-500 mb-1'>
											Specialties
										</div>
										<div className='flex flex-wrap gap-2'>
											<span className='px-3 py-1 bg-warm-100 text-warm-700 rounded-full text-xs font-medium'>
												Massage
											</span>
											<span className='px-3 py-1 bg-nude-100 text-nude-700 rounded-full text-xs font-medium'>
												Wellness
											</span>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Bottom CTA */}
				<div className='mt-16 bg-gradient-to-r from-warm-400 to-nude-400 rounded-2xl p-12 text-center shadow-xl'>
					<h2 className='text-3xl font-bold text-white mb-4'>
						Ready to Relax?
					</h2>
					<p className='text-warm-100 text-lg mb-8 max-w-2xl mx-auto'>
						Book your appointment today and experience the ultimate in
						relaxation and wellness.
					</p>
					<Link
						href={`/s/${spa.slug}/book`}
						className='inline-block px-10 py-4 bg-white text-warm-600 rounded-xl font-bold text-lg hover:bg-warm-50 transition-colors shadow-lg'
					>
						Book Now
					</Link>
				</div>
			</div>
		</div>
	)
}

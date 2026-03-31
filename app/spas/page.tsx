import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AllSpasPage() {
	const spas = await prisma.spa.findMany({
		include: {
			Services: {
				include: {
					Subservices: true,
				},
			},
			_count: {
				select: {
					Employees: true,
				},
			},
		},
	})

	return (
		<div className='min-h-screen bg-gradient-to-b from-nude-50 via-white to-warm-50'>
			{/* Header */}
			<div className='bg-gradient-to-br from-warm-900 via-nude-900 to-warm-800 text-white'>
				<div className='max-w-7xl mx-auto px-6 py-16'>
					<Link
						href='/dashboard'
						className='inline-flex items-center gap-2 text-warm-200 hover:text-white text-sm mb-6 transition-colors'
					>
						<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
						</svg>
						Back to Home
					</Link>
					<h1 className='text-4xl sm:text-5xl font-serif font-light mb-3'>
						All Spas
					</h1>
					<p className='text-warm-200 text-lg'>
						{spas.length} premium sanctuaries across Saint Lucia
					</p>
				</div>
			</div>

			{/* Wellness Services Grid */}
			<div className='max-w-7xl mx-auto px-6 py-16'>
				{spas.length > 0 ? (
					<div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
						{spas.map((spa) => (
							<Link
								key={spa.id}
								href={`/s/${spa.slug}`}
								className='group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'
							>
								{/* Card Image */}
								<div className='h-48 relative overflow-hidden'>
									<img
										src={
											spa.coverUrl ||
											'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&h=300&fit=crop'
										}
										alt={spa.name}
										className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
									/>
									<div className='absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity'></div>
									<div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4'>
										<div className='flex items-center gap-2 text-white text-sm'>
											<svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
												<path
													fillRule='evenodd'
													d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
													clipRule='evenodd'
												/>
											</svg>
											<span className='text-xs opacity-90'>
												{spa.address?.split(',')[1] || 'Saint Lucia'}
											</span>
										</div>
									</div>
								</div>

								{/* Card Content */}
								<div className='p-6'>
									<h3 className='text-xl font-bold text-gray-900 mb-2 group-hover:text-warm-600 transition-colors'>
										{spa.name}
									</h3>
									<p className='text-gray-600 text-sm mb-4 line-clamp-2'>
										{spa.description}
									</p>

									{/* Stats */}
									<div className='flex items-center gap-4 text-sm text-gray-500 mb-4'>
										<div className='flex items-center gap-1'>
											<svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
												<path d='M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z' />
											</svg>
											<span>
												{spa.Services.length} service{spa.Services.length !== 1 ? 's' : ''}
											</span>
										</div>
										<div className='flex items-center gap-1'>
											<svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
												<path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
											</svg>
											<span>
												{spa._count.Employees} therapist{spa._count.Employees !== 1 ? 's' : ''}
											</span>
										</div>
									</div>

									{/* Price Range */}
									<div className='mb-4'>
										<div className='text-xs text-gray-500 mb-1'>Starting from</div>
										<div className='text-2xl font-bold text-warm-600'>
											$
											{Math.min(
												...spa.Services.flatMap((s) =>
													s.Subservices.map((ss) => ss.priceCents / 100),
												),
											).toFixed(0)}
										</div>
									</div>

									{/* CTA */}
									<div className='flex items-center justify-between pt-4 border-t border-gray-100'>
										<span className='text-sm font-medium text-warm-600 group-hover:text-warm-700'>
											View Details & Book
										</span>
										<svg
											className='w-5 h-5 text-warm-600 group-hover:translate-x-1 transition-transform'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
										</svg>
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className='text-center py-20 bg-white rounded-2xl shadow'>
						<p className='text-gray-500 text-lg'>No spas available yet.</p>
						<Link href='/dashboard' className='mt-4 inline-block text-warm-600 hover:text-warm-700 font-medium'>
							← Back to Home
						</Link>
					</div>
				)}
			</div>
		</div>
	)
}

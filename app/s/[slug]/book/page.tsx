import { prisma } from '@/lib/prisma'
import BookClient from './ui'
import { redirect } from 'next/navigation'

export default async function BookPage({
	params,
	searchParams,
}: {
	params: { slug: string }
	searchParams: { service?: string }
}) {
	const spa = await prisma.spa.findUnique({
		where: { slug: params.slug },
		include: {
			Services: { include: { Subservices: true } },
			Employees: {
				include: {
					services: {
						include: {
							service: true,
						},
					},
				},
			},
			Bookings: {
				where: {
					status: { in: ['PENDING', 'CONFIRMED'] },
					start: { gte: new Date() },
				},
				select: {
					start: true,
					end: true,
					employeeId: true,
				},
			},
		},
	})
	if (!spa)
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold text-gray-900 mb-4'>
						Spa Not Found
					</h1>
				</div>
			</div>
		)

	return <BookClient spa={spa} preselectedServiceId={searchParams.service} />
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
	const session = await getServerSession(authOptions)
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
			Reviews: {
				select: {
					rating: true,
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

	const userPoints = session?.user?.email
		? (await prisma.user.findUnique({
			where: { email: session.user.email },
			select: { points: true },
		}))?.points ?? 0
		: 0

	const averageRating = spa.Reviews.length
		? Math.round((spa.Reviews.reduce((sum, review) => sum + review.rating, 0) / spa.Reviews.length) * 10) / 10
		: 0
	const reviewCount = spa.Reviews.length

	return (
		<BookClient spa={{ ...spa, averageRating, reviewCount }} preselectedServiceId={searchParams.service} userPoints={userPoints} />
	)
}

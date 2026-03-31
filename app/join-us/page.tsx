'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default function JoinUsPage() {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	if (!isClient) {
		return null
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-warm-50 to-nude-50 flex items-center justify-center p-6'>
			<div className='w-full max-w-2xl'>
				{/* Header */}
				<div className='text-center mb-12'>
					<h1 className='text-5xl md:text-6xl font-light text-gray-900 mb-4 tracking-wider'>
						FLO
					</h1>
					<p className='text-xl text-gray-600 mb-6'>
						Your Wellness Journey Begins Here
					</p>
					<p className='text-gray-500 max-w-md mx-auto'>
						Join our community of spa and wellness enthusiasts. Discover, book,
						and experience the best spa services in Saint Lucia.
					</p>
				</div>

				{/* Options Container */}
				<div className='grid md:grid-cols-2 gap-6'>
					{/* Sign Up Card */}
					<Link
						href='/auth/signup'
						className='group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-warm-300'
					>
						<div className='h-16 w-16 bg-gradient-to-br from-warm-400 to-warm-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
							<svg
								className='w-8 h-8 text-white'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
								/>
							</svg>
						</div>
						<h2 className='text-2xl font-semibold text-gray-900 mb-3'>
							Create Account
						</h2>
						<p className='text-gray-600 mb-6'>
							New to FLO? Sign up to start booking wellness experiences today.
						</p>
						<span className='inline-flex items-center gap-2 text-warm-600 font-semibold group-hover:gap-3 transition-all'>
							Get Started
							<svg
								className='w-5 h-5'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 5l7 7-7 7'
								/>
							</svg>
						</span>
					</Link>

					{/* Sign In Card */}
					<Link
						href='/auth/sign-in'
						className='group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-warm-300'
					>
						<div className='h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
							<svg
								className='w-8 h-8 text-white'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
								/>
							</svg>
						</div>
						<h2 className='text-2xl font-semibold text-gray-900 mb-3'>
							Sign In
						</h2>
						<p className='text-gray-600 mb-6'>
							Already have an account? Sign in to access your bookings and
							profile.
						</p>
						<span className='inline-flex items-center gap-2 text-warm-600 font-semibold group-hover:gap-3 transition-all'>
							Sign In
							<svg
								className='w-5 h-5'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 5l7 7-7 7'
								/>
							</svg>
						</span>
					</Link>
				</div>

				{/* Footer */}
				<div className='text-center mt-12'>
					<p className='text-gray-600'>
						By joining FLO, you agree to our{' '}
						<Link href='#' className='text-warm-600 hover:text-warm-700'>
							Terms of Service
						</Link>
						{' '}and{' '}
						<Link href='#' className='text-warm-600 hover:text-warm-700'>
							Privacy Policy
						</Link>
					</p>
				</div>

				{/* Background Decoration */}
				<div className='fixed top-0 right-0 -z-10 opacity-10'>
					<svg
						className='w-96 h-96 text-warm-600'
						fill='currentColor'
						viewBox='0 0 200 180'
					>
						<path d='M100 150 Q100 100 100 80 Q100 100 100 150' />
						<path d='M100 150 Q85 120 75 80 Q75 60 85 50 Q90 80 100 90 Z' />
						<path d='M100 150 Q115 120 125 80 Q125 60 115 50 Q110 80 100 90 Z' />
					</svg>
				</div>
			</div>
		</div>
	)
}

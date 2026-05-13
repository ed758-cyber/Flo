import '../styles/globals.css'
import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navigation from './components/Navigation'

export const metadata = {
	title: 'BOOKTRIX- Making booking services effortless',
	description: 'Premium booking platform.',
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await getServerSession(authOptions)

	return (
		<html lang='en'>
			<body>
				<div className='min-h-screen bg-gray-50'>
					{session && <Navigation session={session} />}
					<main>{children}</main>
				</div>
			</body>
		</html>
	)
}

import Link from 'next/link'

export default function AdminPage() {
	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='max-w-5xl mx-auto p-8'>
				<div className='bg-white rounded-2xl shadow p-8'>
					<h1 className='text-2xl font-bold mb-4'>Admin — Client Onboarding</h1>
					<p className='text-gray-600 mb-6'>Tools to help Booktrix support new clients.</p>

					<ul className='space-y-3'>
						<li>- Quick spa import</li>
						<li>- Migrate settings</li>
						<li>- Seed demo data</li>
						<li>- Troubleshooting & support links</li>
					</ul>

					<div className='mt-6'>
						<Link href='/' className='text-warm-600 font-medium'>← Back</Link>
					</div>
				</div>
			</div>
		</div>
	)
}

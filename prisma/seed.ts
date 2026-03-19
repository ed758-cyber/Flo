import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
	// Clear existing data
	await prisma.cancellation.deleteMany()
	await prisma.booking.deleteMany()
	await prisma.employee.deleteMany()
	await prisma.subservice.deleteMany()
	await prisma.service.deleteMany()
	await prisma.spa.deleteMany()
	await prisma.user.deleteMany()

	const password = await hash('password123', 10)

	// Create Users
	const owner1 = await prisma.user.create({
		data: {
			email: 'owner@example.com',
			name: 'Maria Johnson',
			hashedPassword: password,
			role: Role.OWNER,
		},
	})

	const owner2 = await prisma.user.create({
		data: {
			email: 'owner2@example.com',
			name: 'David Williams',
			hashedPassword: password,
			role: Role.OWNER,
		},
	})

	const owner3 = await prisma.user.create({
		data: {
			email: 'owner3@example.com',
			name: 'Sarah Chen',
			hashedPassword: password,
			role: Role.OWNER,
		},
	})

	const customer = await prisma.user.create({
		data: {
			email: 'customer@example.com',
			name: 'John Customer',
			hashedPassword: password,
			role: Role.USER,
		},
	})

	// Spa 1: Emerald Bay Spa
	const spa1 = await prisma.spa.create({
		data: {
			ownerId: owner1.id,
			name: 'Emerald Bay Spa',
			slug: 'emerald-bay-spa',
			description: 'Modern wellness retreat in the heart of Saint Lucia.',
			coverUrl:
				'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=400&fit=crop',
			address: '123 Beach Road, Castries, Saint Lucia',
			phone: '+1 758-555-0100',
			email: 'info@emeraldbay.com',
			businessHours: {
				mon: ['09:00-17:00'],
				tue: ['09:00-17:00'],
				wed: ['09:00-17:00'],
				thu: ['09:00-17:00'],
				fri: ['09:00-18:00'],
				sat: ['10:00-16:00'],
				sun: [],
			},
		},
	})

	const massageService1 = await prisma.service.create({
		data: {
			spaId: spa1.id,
			name: 'Massage Therapy',
			description: 'Professional therapeutic massages.',
		},
	})

	const facialService1 = await prisma.service.create({
		data: {
			spaId: spa1.id,
			name: 'Facials',
			description: 'Rejuvenating facial treatments.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa1.id,
				serviceId: massageService1.id,
				name: 'Deep Tissue Massage',
				description: 'Intense pressure to relieve tension',
				durationMin: 60,
				priceCents: 12000,
			},
			{
				spaId: spa1.id,
				serviceId: massageService1.id,
				name: 'Swedish Massage',
				description: 'Gentle, relaxing full-body massage',
				durationMin: 60,
				priceCents: 10000,
			},
			{
				spaId: spa1.id,
				serviceId: massageService1.id,
				name: 'Hot Stone Massage',
				description: 'Heated stones for deep relaxation',
				durationMin: 90,
				priceCents: 15000,
			},
			{
				spaId: spa1.id,
				serviceId: facialService1.id,
				name: 'Classic Facial',
				description: 'Deep cleansing and hydration',
				durationMin: 45,
				priceCents: 8500,
			},
			{
				spaId: spa1.id,
				serviceId: facialService1.id,
				name: 'Anti-Aging Facial',
				description: 'Collagen-boosting treatment',
				durationMin: 60,
				priceCents: 12500,
			},
		],
	})

	await prisma.employee.createMany({
		data: [
			{
				spaId: spa1.id,
				name: 'Ava Thomas',
				bio: 'Senior massage therapist with 10+ years experience',
				schedule: {
					mon: ['09:00-17:00'],
					tue: ['09:00-17:00'],
					wed: ['09:00-17:00'],
				},
			},
			{
				spaId: spa1.id,
				name: 'Noah James',
				bio: 'Deep tissue and sports massage specialist',
				schedule: {
					thu: ['09:00-17:00'],
					fri: ['09:00-18:00'],
					sat: ['10:00-16:00'],
				},
			},
			{
				spaId: spa1.id,
				name: 'Olivia Martinez',
				bio: 'Licensed esthetician and facial expert',
				schedule: {
					mon: ['09:00-17:00'],
					wed: ['09:00-17:00'],
					fri: ['09:00-18:00'],
				},
			},
		],
	})

	// Spa 2: Paradise Wellness Center
	const spa2 = await prisma.spa.create({
		data: {
			ownerId: owner2.id,
			name: 'Paradise Wellness Center',
			slug: 'paradise-wellness',
			description: 'Luxury spa offering holistic treatments and ocean views.',
			coverUrl:
				'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=400&fit=crop&q=80',
			address: '456 Ocean Drive, Soufrière, Saint Lucia',
			phone: '+1 758-555-0200',
			email: 'contact@paradisewellness.com',
			colorPrimary: '#3B82F6',
			businessHours: {
				mon: ['08:00-19:00'],
				tue: ['08:00-19:00'],
				wed: ['08:00-19:00'],
				thu: ['08:00-19:00'],
				fri: ['08:00-20:00'],
				sat: ['09:00-20:00'],
				sun: ['10:00-18:00'],
			},
		},
	})

	const spaService2 = await prisma.service.create({
		data: {
			spaId: spa2.id,
			name: 'Body Treatments',
			description: 'Full body pampering.',
		},
	})

	const yogaService2 = await prisma.service.create({
		data: {
			spaId: spa2.id,
			name: 'Wellness Classes',
			description: 'Yoga and meditation.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa2.id,
				serviceId: spaService2.id,
				name: 'Body Scrub & Wrap',
				description: 'Exfoliation and nourishing wrap',
				durationMin: 75,
				priceCents: 14000,
			},
			{
				spaId: spa2.id,
				serviceId: spaService2.id,
				name: 'Detox Body Treatment',
				description: 'Clay mask and lymphatic drainage',
				durationMin: 90,
				priceCents: 16500,
			},
			{
				spaId: spa2.id,
				serviceId: yogaService2.id,
				name: 'Private Yoga Session',
				description: 'One-on-one yoga instruction',
				durationMin: 60,
				priceCents: 9000,
			},
			{
				spaId: spa2.id,
				serviceId: yogaService2.id,
				name: 'Meditation Class',
				description: 'Guided meditation for relaxation',
				durationMin: 45,
				priceCents: 5000,
			},
		],
	})

	await prisma.employee.createMany({
		data: [
			{
				spaId: spa2.id,
				name: 'Liam Rodriguez',
				bio: 'Certified yoga instructor and wellness coach',
				schedule: {
					mon: ['08:00-19:00'],
					tue: ['08:00-19:00'],
					wed: ['08:00-19:00'],
					thu: ['08:00-19:00'],
				},
			},
			{
				spaId: spa2.id,
				name: 'Emma Wilson',
				bio: 'Body treatment specialist',
				schedule: {
					fri: ['08:00-20:00'],
					sat: ['09:00-20:00'],
					sun: ['10:00-18:00'],
				},
			},
		],
	})

	// Spa 3: Tranquil Touch Spa
	const spa3 = await prisma.spa.create({
		data: {
			ownerId: owner3.id,
			name: 'Tranquil Touch Spa',
			slug: 'tranquil-touch',
			description:
				'Intimate boutique spa specializing in aromatherapy and reflexology.',
			coverUrl:
				'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=400&fit=crop',
			address: '789 Sunset Boulevard, Gros Islet, Saint Lucia',
			phone: '+1 758-555-0300',
			email: 'hello@tranquiltouch.com',
			colorPrimary: '#8B5CF6',
			businessHours: {
				mon: ['10:00-18:00'],
				tue: ['10:00-18:00'],
				wed: ['10:00-18:00'],
				thu: ['10:00-18:00'],
				fri: ['10:00-19:00'],
				sat: ['10:00-17:00'],
				sun: [],
			},
		},
	})

	const aromaService3 = await prisma.service.create({
		data: {
			spaId: spa3.id,
			name: 'Aromatherapy',
			description: 'Essential oil-based treatments.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa3.id,
				serviceId: aromaService3.id,
				name: 'Aromatherapy Massage',
				description: 'Custom essential oil blend massage',
				durationMin: 75,
				priceCents: 13500,
			},
			{
				spaId: spa3.id,
				serviceId: aromaService3.id,
				name: 'Reflexology',
				description: 'Pressure point foot massage',
				durationMin: 45,
				priceCents: 7500,
			},
			{
				spaId: spa3.id,
				serviceId: aromaService3.id,
				name: 'Couples Massage',
				description: 'Side-by-side relaxation for two',
				durationMin: 60,
				priceCents: 22000,
			},
		],
	})

	await prisma.employee.createMany({
		data: [
			{
				spaId: spa3.id,
				name: 'Sophia Anderson',
				bio: 'Certified aromatherapist and reflexologist',
				schedule: {
					mon: ['10:00-18:00'],
					wed: ['10:00-18:00'],
					fri: ['10:00-19:00'],
				},
			},
			{
				spaId: spa3.id,
				name: 'James Brown',
				bio: 'Holistic wellness practitioner',
				schedule: {
					tue: ['10:00-18:00'],
					thu: ['10:00-18:00'],
					sat: ['10:00-17:00'],
				},
			},
		],
	})

	console.log('✅ Seeded successfully!')
	console.log('\n📊 Summary:')
	console.log(`- 4 Users (3 spa owners, 1 customer)`)
	console.log(`- 3 Spas:`)
	console.log(`  • ${spa1.name} (slug: ${spa1.slug})`)
	console.log(`  • ${spa2.name} (slug: ${spa2.slug})`)
	console.log(`  • ${spa3.name} (slug: ${spa3.slug})`)
	console.log(`\n🔑 Login credentials:`)
	console.log(`  Customer:`)
	console.log(`    Email: customer@example.com`)
	console.log(`    Password: password123`)
	console.log(`\n  Spa Owner (Emerald Bay Spa):`)
	console.log(`    Email: owner@example.com`)
	console.log(`    Password: password123`)
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

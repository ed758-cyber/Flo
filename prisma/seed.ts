import 'dotenv/config'
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

	// Spa 4: Serenity Retreat
	const spa4 = await prisma.spa.create({
		data: {
			ownerId: owner1.id,
			name: 'Serenity Retreat',
			slug: 'serenity-retreat',
			description: 'Oceanfront spa with traditional Caribbean treatments.',
			coverUrl:
				'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop',
			address: '321 Caribbean Lane, Rodney Bay, Saint Lucia',
			phone: '+1 758-555-0400',
			email: 'reservations@serenityretreat.com',
			colorPrimary: '#10B981',
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

	const heatService4 = await prisma.service.create({
		data: {
			spaId: spa4.id,
			name: 'Heat Therapies',
			description: 'Sauna and steam treatments.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa4.id,
				serviceId: heatService4.id,
				name: 'Infrared Sauna',
				description: 'Detoxifying heat therapy',
				durationMin: 45,
				priceCents: 8000,
			},
			{
				spaId: spa4.id,
				serviceId: heatService4.id,
				name: 'Steam Room Session',
				description: 'Rejuvenating steam treatment',
				durationMin: 30,
				priceCents: 5500,
			},
		],
	})

	// Spa 5: Tropical Glow Spa
	const spa5 = await prisma.spa.create({
		data: {
			ownerId: owner2.id,
			name: 'Tropical Glow Spa',
			slug: 'tropical-glow',
			description: 'Skin care paradise with natural, organic products.',
			coverUrl:
				'https://images.unsplash.com/photo-1599039810694-deca2fbb8e8c?w=800&h=400&fit=crop',
			address: '654 Wellness Street, Vieux Fort, Saint Lucia',
			phone: '+1 758-555-0500',
			email: 'glow@tropicalspa.com',
			colorPrimary: '#F59E0B',
			businessHours: {
				mon: ['09:00-19:00'],
				tue: ['09:00-19:00'],
				wed: ['09:00-19:00'],
				thu: ['09:00-19:00'],
				fri: ['09:00-20:00'],
				sat: ['10:00-18:00'],
				sun: ['12:00-17:00'],
			},
		},
	})

	const skinService5 = await prisma.service.create({
		data: {
			spaId: spa5.id,
			name: 'Skin Care',
			description: 'Organic facial and body treatments.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa5.id,
				serviceId: skinService5.id,
				name: 'Organic Facial',
				description: 'Natural product facial treatment',
				durationMin: 60,
				priceCents: 11500,
			},
			{
				spaId: spa5.id,
				serviceId: skinService5.id,
				name: 'Acne Treatment',
				description: 'Healing acne and blemish treatment',
				durationMin: 45,
				priceCents: 9500,
			},
		],
	})

	// Spa 6: Rejuvenation Haven
	const spa6 = await prisma.spa.create({
		data: {
			ownerId: owner3.id,
			name: 'Rejuvenation Haven',
			slug: 'rejuvenation-haven',
			description: 'Med spa offering anti-aging and beauty treatments.',
			coverUrl:
				'https://images.unsplash.com/photo-1585747860715-cd4628902046?w=800&h=400&fit=crop',
			address: '987 Beauty Boulevard, Pitons Bay, Saint Lucia',
			phone: '+1 758-555-0600',
			email: 'beauty@rejuvenationhaven.com',
			colorPrimary: '#EC4899',
			businessHours: {
				mon: ['10:00-18:00'],
				tue: ['10:00-18:00'],
				wed: ['10:00-18:00'],
				thu: ['10:00-18:00'],
				fri: ['10:00-19:00'],
				sat: ['09:00-17:00'],
				sun: [],
			},
		},
	})

	const beautyService6 = await prisma.service.create({
		data: {
			spaId: spa6.id,
			name: 'Beauty Treatments',
			description: 'Anti-aging and beauty services.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa6.id,
				serviceId: beautyService6.id,
				name: 'Microdermabrasion',
				description: 'Advanced exfoliation treatment',
				durationMin: 60,
				priceCents: 10000,
			},
			{
				spaId: spa6.id,
				serviceId: beautyService6.id,
				name: 'Chemical Peel',
				description: 'Skin renewal peel treatment',
				durationMin: 45,
				priceCents: 12000,
			},
		],
	})

	// Spa 7: Wellness Oasis
	const spa7 = await prisma.spa.create({
		data: {
			ownerId: owner1.id,
			name: 'Wellness Oasis',
			slug: 'wellness-oasis',
			description: 'Complete wellness center with health consultations.',
			coverUrl:
				'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=800&h=400&fit=crop',
			address: '159 Health Road, Choiseul, Saint Lucia',
			phone: '+1 758-555-0700',
			email: 'wellness@oasiscenter.com',
			colorPrimary: '#06B6D4',
			businessHours: {
				mon: ['08:00-19:00'],
				tue: ['08:00-19:00'],
				wed: ['08:00-19:00'],
				thu: ['08:00-19:00'],
				fri: ['08:00-20:00'],
				sat: ['09:00-18:00'],
				sun: ['10:00-16:00'],
			},
		},
	})

	const wellService7 = await prisma.service.create({
		data: {
			spaId: spa7.id,
			name: 'Wellness Programs',
			description: 'Holistic health programs.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa7.id,
				serviceId: wellService7.id,
				name: 'Health Consultation',
				description: 'Personalized wellness plan',
				durationMin: 60,
				priceCents: 15000,
			},
			{
				spaId: spa7.id,
				serviceId: wellService7.id,
				name: 'Nutrition Coaching',
				description: 'Dietary guidance from experts',
				durationMin: 45,
				priceCents: 12000,
			},
		],
	})

	// Spa 8: Blissful Sanctuary
	const spa8 = await prisma.spa.create({
		data: {
			ownerId: owner2.id,
			name: 'Blissful Sanctuary',
			slug: 'blissful-sanctuary',
			description: 'Luxury spa with holistic healing practices.',
			coverUrl:
				'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&h=400&fit=crop',
			address: '753 Healing Lane, Laborie, Saint Lucia',
			phone: '+1 758-555-0800',
			email: 'bliss@sanctuary.com',
			colorPrimary: '#8B5CF6',
			businessHours: {
				mon: ['09:00-18:00'],
				tue: ['09:00-18:00'],
				wed: ['09:00-18:00'],
				thu: ['09:00-18:00'],
				fri: ['09:00-19:00'],
				sat: ['10:00-17:00'],
				sun: ['11:00-16:00'],
			},
		},
	})

	const holisticService8 = await prisma.service.create({
		data: {
			spaId: spa8.id,
			name: 'Holistic Healing',
			description: 'Energy and chakra balancing.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa8.id,
				serviceId: holisticService8.id,
				name: 'Chakra Balancing',
				description: 'Energy alignment therapy',
				durationMin: 75,
				priceCents: 11000,
			},
			{
				spaId: spa8.id,
				serviceId: holisticService8.id,
				name: 'Crystal Healing',
				description: 'Healing crystal therapy',
				durationMin: 60,
				priceCents: 9500,
			},
		],
	})

	// Spa 9: Coastal Escape Spa
	const spa9 = await prisma.spa.create({
		data: {
			ownerId: owner3.id,
			name: 'Coastal Escape Spa',
			slug: 'coastal-escape',
			description: 'Beachfront spa specializing in water-based treatments.',
			coverUrl:
				'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=400&fit=crop',
			address: '852 Shore Drive, Canaries, Saint Lucia',
			phone: '+1 758-555-0900',
			email: 'escape@coastal.com',
			colorPrimary: '#0EA5E9',
			businessHours: {
				mon: ['08:00-19:00'],
				tue: ['08:00-19:00'],
				wed: ['08:00-19:00'],
				thu: ['08:00-19:00'],
				fri: ['08:00-20:00'],
				sat: ['09:00-19:00'],
				sun: ['10:00-17:00'],
			},
		},
	})

	const waterService9 = await prisma.service.create({
		data: {
			spaId: spa9.id,
			name: 'Water Therapies',
			description: 'Hydrotherapy and aquatic treatments.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa9.id,
				serviceId: waterService9.id,
				name: 'Hydrotherapy Bath',
				description: 'Therapeutic water immersion',
				durationMin: 45,
				priceCents: 10000,
			},
			{
				spaId: spa9.id,
				serviceId: waterService9.id,
				name: 'Salt Water Pool Therapy',
				description: 'Ocean salt therapeutic treatment',
				durationMin: 60,
				priceCents: 9000,
			},
		],
	})

	// Spa 10: Harmony Healing Center
	const spa10 = await prisma.spa.create({
		data: {
			ownerId: owner1.id,
			name: 'Harmony Healing Center',
			slug: 'harmony-healing',
			description: 'Traditional healing practices with modern wellness techniques.',
			coverUrl:
				'https://images.unsplash.com/photo-1562438286-cc2e5674d4d0?w=800&h=400&fit=crop',
			address: '246 Harmony Lane, Dennery, Saint Lucia',
			phone: '+1 758-555-1000',
			email: 'info@harmonyhealing.com',
			colorPrimary: '#14B8A6',
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

	const healService10 = await prisma.service.create({
		data: {
			spaId: spa10.id,
			name: 'Traditional Healing',
			description: 'Ancient healing methodologies.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa10.id,
				serviceId: healService10.id,
				name: 'Herbal Therapy',
				description: 'Natural herbal healing treatments',
				durationMin: 60,
				priceCents: 10500,
			},
			{
				spaId: spa10.id,
				serviceId: healService10.id,
				name: 'Acupressure',
				description: 'Traditional pressure point therapy',
				durationMin: 45,
				priceCents: 8500,
			},
		],
	})

	// Spa 11: Luxe Retreat Spa
	const spa11 = await prisma.spa.create({
		data: {
			ownerId: owner2.id,
			name: 'Luxe Retreat Spa',
			slug: 'luxe-retreat',
			description: 'Premium luxury spa with personalized wellness experiences.',
			coverUrl:
				'https://images.unsplash.com/photo-1599836934472-6f03629e83cd?w=800&h=400&fit=crop',
			address: '369 Luxury Lane, Micoud, Saint Lucia',
			phone: '+1 758-555-1100',
			email: 'concierge@luxeretreat.com',
			colorPrimary: '#D4AF37',
			businessHours: {
				mon: ['09:00-20:00'],
				tue: ['09:00-20:00'],
				wed: ['09:00-20:00'],
				thu: ['09:00-20:00'],
				fri: ['09:00-21:00'],
				sat: ['10:00-21:00'],
				sun: ['11:00-19:00'],
			},
		},
	})

	const luxeService11 = await prisma.service.create({
		data: {
			spaId: spa11.id,
			name: 'Luxury Treatments',
			description: 'Premium spa experiences.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa11.id,
				serviceId: luxeService11.id,
				name: 'Gold Facial',
				description: 'Luxury 24k gold infused facial',
				durationMin: 90,
				priceCents: 25000,
			},
			{
				spaId: spa11.id,
				serviceId: luxeService11.id,
				name: 'Diamond Peel',
				description: 'Premium diamond skin treatment',
				durationMin: 60,
				priceCents: 18000,
			},
		],
	})

	// Spa 12: Pure Nature Spa
	const spa12 = await prisma.spa.create({
		data: {
			ownerId: owner3.id,
			name: 'Pure Nature Spa',
			slug: 'pure-nature',
			description: 'Eco-friendly spa using only natural and organic products.',
			coverUrl:
				'https://images.unsplash.com/photo-1544367567-0d5fccc6bed0?w=800&h=400&fit=crop',
			address: '147 Forest Road, Babonneau, Saint Lucia',
			phone: '+1 758-555-1200',
			email: 'sustainable@purenature.com',
			colorPrimary: '#84CC16',
			businessHours: {
				mon: ['10:00-18:00'],
				tue: ['10:00-18:00'],
				wed: ['10:00-18:00'],
				thu: ['10:00-18:00'],
				fri: ['10:00-19:00'],
				sat: ['09:00-17:00'],
				sun: ['10:00-16:00'],
			},
		},
	})

	const organicService12 = await prisma.service.create({
		data: {
			spaId: spa12.id,
			name: 'Organic Treatments',
			description: 'Natural and sustainable spa services.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa12.id,
				serviceId: organicService12.id,
				name: 'Coconut Oil Massage',
				description: 'Pure coconut oil therapeutic massage',
				durationMin: 60,
				priceCents: 11000,
			},
			{
				spaId: spa12.id,
				serviceId: organicService12.id,
				name: 'Bamboo Massage',
				description: 'Bamboo stick massage therapy',
				durationMin: 75,
				priceCents: 13500,
			},
		],
	})

	// Spa 13: Serenity Springs
	const spa13 = await prisma.spa.create({
		data: {
			ownerId: owner1.id,
			name: 'Serenity Springs',
			slug: 'serenity-springs',
			description: 'Hot spring resort spa with geothermal wellness facilities.',
			coverUrl:
				'https://images.unsplash.com/photo-1576681081293-e937e81a2408?w=800&h=400&fit=crop',
			address: '555 Spring Crest, Mabouya Valley, Saint Lucia',
			phone: '+1 758-555-1300',
			email: 'springs@serenityresort.com',
			colorPrimary: '#F97316',
			businessHours: {
				mon: ['08:00-20:00'],
				tue: ['08:00-20:00'],
				wed: ['08:00-20:00'],
				thu: ['08:00-20:00'],
				fri: ['08:00-21:00'],
				sat: ['08:00-21:00'],
				sun: ['09:00-19:00'],
			},
		},
	})

	const springService13 = await prisma.service.create({
		data: {
			spaId: spa13.id,
			name: 'Thermal Treatments',
			description: 'Hot spring and geothermal services.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa13.id,
				serviceId: springService13.id,
				name: 'Natural Hot Spring Bath',
				description: 'Mineral-rich hot spring immersion',
				durationMin: 45,
				priceCents: 9500,
			},
			{
				spaId: spa13.id,
				serviceId: springService13.id,
				name: 'Mud Wrap',
				description: 'Therapeutic mineral mud treatment',
				durationMin: 75,
				priceCents: 12000,
			},
		],
	})

	// Spa 14: Zenith Wellness Studio
	const spa14 = await prisma.spa.create({
		data: {
			ownerId: owner2.id,
			name: 'Zenith Wellness Studio',
			slug: 'zenith-wellness',
			description: 'Modern wellness studio combining technology with traditional therapy.',
			coverUrl:
				'https://images.unsplash.com/photo-1607432191933-0c6688de566e?w=800&h=400&fit=crop',
			address: '789 Tech Boulevard, Castries, Saint Lucia',
			phone: '+1 758-555-1400',
			email: 'hello@zenithwellness.com',
			colorPrimary: '#06B6D4',
			businessHours: {
				mon: ['07:00-20:00'],
				tue: ['07:00-20:00'],
				wed: ['07:00-20:00'],
				thu: ['07:00-20:00'],
				fri: ['07:00-21:00'],
				sat: ['08:00-19:00'],
				sun: ['09:00-18:00'],
			},
		},
	})

	const techService14 = await prisma.service.create({
		data: {
			spaId: spa14.id,
			name: 'Advanced Wellness',
			description: 'Technology-enhanced therapies.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa14.id,
				serviceId: techService14.id,
				name: 'Cryotherapy',
				description: 'Cold therapy treatment',
				durationMin: 30,
				priceCents: 8000,
			},
			{
				spaId: spa14.id,
				serviceId: techService14.id,
				name: 'Red Light Therapy',
				description: 'Infrared light healing session',
				durationMin: 20,
				priceCents: 7000,
			},
		],
	})

	// Spa 15: Island Paradise Spa
	const spa15 = await prisma.spa.create({
		data: {
			ownerId: owner3.id,
			name: 'Island Paradise Spa',
			slug: 'island-paradise',
			description: 'Tropical island escape spa with Caribbean-inspired treatments.',
			coverUrl:
				'https://images.unsplash.com/photo-1563141209783-cd1f6a67a346?w=800&h=400&fit=crop',
			address: '999 Paradise Beach, Soufrière, Saint Lucia',
			phone: '+1 758-555-1500',
			email: 'paradise@tropicspa.com',
			colorPrimary: '#EC4899',
			businessHours: {
				mon: ['09:00-19:00'],
				tue: ['09:00-19:00'],
				wed: ['09:00-19:00'],
				thu: ['09:00-19:00'],
				fri: ['09:00-20:00'],
				sat: ['10:00-20:00'],
				sun: ['11:00-18:00'],
			},
		},
	})

	const islandService15 = await prisma.service.create({
		data: {
			spaId: spa15.id,
			name: 'Caribbean Treatments',
			description: 'Island-inspired wellness services.',
		},
	})

	await prisma.subservice.createMany({
		data: [
			{
				spaId: spa15.id,
				serviceId: islandService15.id,
				name: 'Plantation Massage',
				description: 'Caribbean-inspired herbal massage',
				durationMin: 75,
				priceCents: 14000,
			},
			{
				spaId: spa15.id,
				serviceId: islandService15.id,
				name: 'Island Body Polish',
				description: 'Tropical fruit and sugar body exfoliation',
				durationMin: 60,
				priceCents: 11500,
			},
		],
	})

	console.log('✅ Seeded successfully!')
	console.log('\n📊 Summary:')
	console.log(`- 4 Users (3 spa owners, 1 customer)`)
	console.log(`- 15 Spas:`)
	console.log(`  • ${spa1.name}`)
	console.log(`  • ${spa2.name}`)
	console.log(`  • ${spa3.name}`)
	console.log(`  • ${spa4.name}`)
	console.log(`  • ${spa5.name}`)
	console.log(`  • ${spa6.name}`)
	console.log(`  • ${spa7.name}`)
	console.log(`  • ${spa8.name}`)
	console.log(`  • ${spa9.name}`)
	console.log(`  • ${spa10.name}`)
	console.log(`  • ${spa11.name}`)
	console.log(`  • ${spa12.name}`)
	console.log(`  • ${spa13.name}`)
	console.log(`  • ${spa14.name}`)
	console.log(`  • ${spa15.name}`)
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

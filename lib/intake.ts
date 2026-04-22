export type IntakeQuestionType = 'text' | 'textarea' | 'yesno' | 'select'

export type IntakeQuestion = {
	id: string
	label: string
	type: IntakeQuestionType
	placeholder?: string
	options?: string[]
}

export type IntakeSection = {
	id: string
	title: string
	description: string
	questions: IntakeQuestion[]
}

const baseSpaSection: IntakeSection = {
	id: 'spa-basics',
	title: 'Spa Intake Basics',
	description: 'Helpful health and preference details for your appointment.',
	questions: [
		{ id: 'allergies', label: 'Allergies or sensitivities', type: 'textarea', placeholder: 'List skin, scent, food, latex, or product allergies.' },
		{ id: 'medical_conditions', label: 'Medical conditions we should know about', type: 'textarea', placeholder: 'Asthma, diabetes, eczema, high blood pressure, recent illness, etc.' },
		{ id: 'medications', label: 'Current medications', type: 'textarea', placeholder: 'Include anything that may affect skin, circulation, or healing.' },
		{ id: 'pregnancy', label: 'Are you pregnant or recently postpartum?', type: 'yesno' },
		{ id: 'recent_surgery', label: 'Recent surgery, injury, or open wounds?', type: 'yesno' },
		{ id: 'emergency_contact', label: 'Emergency contact name and phone', type: 'text', placeholder: 'Jane Doe - (555) 123-4567' },
	],
}

const sectionLibrary: Record<string, IntakeSection> = {
	massage: {
		id: 'massage',
		title: 'Massage & Bodywork',
		description: 'For massage, aromatherapy, body rituals, and therapeutic treatments.',
		questions: [
			{ id: 'pressure_preference', label: 'Preferred pressure level', type: 'select', options: ['Light', 'Medium', 'Firm', 'Unsure'] },
			{ id: 'focus_areas', label: 'Areas needing extra focus', type: 'textarea', placeholder: 'Neck, shoulders, lower back, legs, etc.' },
			{ id: 'areas_to_avoid', label: 'Areas to avoid', type: 'textarea', placeholder: 'Old injuries, tender spots, recent treatments, etc.' },
			{ id: 'circulation_or_varicose', label: 'Circulation issues, clotting history, or varicose veins?', type: 'yesno' },
		],
	},
	skin: {
		id: 'skin',
		title: 'Skin & Facial Care',
		description: 'For facials, peels, wraps, scrubs, and skin-focused services.',
		questions: [
			{ id: 'skin_concerns', label: 'Main skin concerns', type: 'textarea', placeholder: 'Acne, dryness, sensitivity, hyperpigmentation, aging, etc.' },
			{ id: 'active_products', label: 'Using retinol, acids, Accutane, or prescription topicals?', type: 'yesno' },
			{ id: 'recent_skin_treatments', label: 'Recent peels, lasers, waxing, or exfoliation?', type: 'textarea', placeholder: 'Tell us what you had done and when.' },
			{ id: 'skin_reactions', label: 'Known product or fragrance reactions', type: 'textarea', placeholder: 'Describe products or ingredients that cause irritation.' },
		],
	},
	nails: {
		id: 'nails',
		title: 'Nail Services',
		description: 'For manicures, pedicures, gel, acrylic, and nail-art services.',
		questions: [
			{ id: 'nail_conditions', label: 'Nail, foot, or hand conditions to note', type: 'textarea', placeholder: 'Ingrown nails, fungal concerns, cuts, swelling, etc.' },
			{ id: 'gel_or_acrylic_removal', label: 'Do you need gel or acrylic removal today?', type: 'yesno' },
			{ id: 'diabetes_or_circulation', label: 'Diabetes or circulation concerns affecting hands/feet?', type: 'yesno' },
		],
	},
	beauty: {
		id: 'beauty',
		title: 'Hair, Makeup, Brow & Lash',
		description: 'For hair, makeup, brow, and lash appointments.',
		questions: [
			{ id: 'product_sensitivities', label: 'Product sensitivities or cosmetic allergies', type: 'textarea', placeholder: 'Hair dye, glue, fragrance, metals, etc.' },
			{ id: 'recent_chemical_services', label: 'Recent coloring, relaxer, keratin, lash, or brow work?', type: 'textarea', placeholder: 'Tell us what you had done and when.' },
			{ id: 'contact_lenses', label: 'Will you be wearing contact lenses for this service?', type: 'yesno' },
			{ id: 'beauty_goal', label: 'Desired look or outcome', type: 'textarea', placeholder: 'Natural glam, hydration, color correction, volume, etc.' },
		],
	},
	waxing: {
		id: 'waxing',
		title: 'Waxing & Threading',
		description: 'For waxing, threading, and hair-removal services.',
		questions: [
			{ id: 'retinol_or_accutane', label: 'Using retinol, Accutane, or skin-thinning medication?', type: 'yesno' },
			{ id: 'sun_exposure', label: 'Recent tanning, sunburn, or exfoliation in the area?', type: 'yesno' },
			{ id: 'waxing_reactions', label: 'Previous reactions to waxing/threading', type: 'textarea', placeholder: 'Describe redness, lifting, bumps, ingrowns, etc.' },
		],
	},
	wellness: {
		id: 'wellness',
		title: 'Wellness & Classes',
		description: 'For yoga, coaching, meditation, and holistic wellness services.',
		questions: [
			{ id: 'mobility_limitations', label: 'Mobility limits or injuries', type: 'textarea', placeholder: 'Back pain, joint issues, balance concerns, etc.' },
			{ id: 'fitness_comfort', label: 'Current comfort/activity level', type: 'select', options: ['Beginner', 'Moderate', 'Active', 'Prefer gentle guidance'] },
			{ id: 'wellness_goals', label: 'Main wellness goals for this session', type: 'textarea', placeholder: 'Stress relief, flexibility, detox, pain relief, etc.' },
			{ id: 'dietary_restrictions', label: 'Dietary restrictions or nutrition concerns', type: 'textarea', placeholder: 'Only if relevant to this service.' },
		],
	},
}

function getSectionKeysForServiceName(name: string) {
	const normalized = name.toLowerCase()
	const keys = new Set<string>()

	if (
		/(massage|body|aroma|reiki|reflexology|hydro|water|thermal|heat|sauna|steam|mud|wrap|polish|traditional|healing|caribbean|cocoa|herbal)/.test(normalized)
	) {
		keys.add('massage')
	}
	if (/(facial|skin|peel|scrub|wrap|body treatment|body polish)/.test(normalized)) {
		keys.add('skin')
	}
	if (/(nail|mani|pedi|pedicure|manicure|gel|acrylic)/.test(normalized)) {
		keys.add('nails')
	}
	if (/(hair|makeup|brow|lash|blowout|color|bridal|styling|keratin)/.test(normalized)) {
		keys.add('beauty')
	}
	if (/(wax|thread)/.test(normalized)) {
		keys.add('waxing')
	}
	if (/(yoga|meditation|coaching|consultation|nutrition|wellness|chakra|class|stress management)/.test(normalized)) {
		keys.add('wellness')
	}

	if (keys.size === 0) {
		keys.add('massage')
	}

	return Array.from(keys)
}

export function getIntakeSections(serviceNames: string[]) {
	const sections = [baseSpaSection]
	const seen = new Set<string>()

	serviceNames.forEach((name) => {
		getSectionKeysForServiceName(name).forEach((key) => {
			if (seen.has(key)) return
			seen.add(key)
			sections.push(sectionLibrary[key])
		})
	})

	return sections
}

export function getFilledIntakeEntries(
	intakeForm: Record<string, string> | null | undefined,
	serviceNames: string[]
) {
	if (!intakeForm) return []

	return getIntakeSections(serviceNames)
		.flatMap((section) =>
			section.questions.map((question) => ({
				sectionTitle: section.title,
				label: question.label,
				value: intakeForm[question.id]?.trim() || '',
			}))
		)
		.filter((entry) => entry.value)
}

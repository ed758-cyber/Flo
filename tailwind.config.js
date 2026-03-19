/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				nude: {
					50: '#fcfbfa',
					100: '#f9f6f4',
					200: '#f3ede9',
					300: '#e8dcd4',
					400: '#dcc8bc',
					500: '#d0b5a6',
					600: '#b89683',
					700: '#9a7968',
					800: '#7d6254',
					900: '#655146',
				},
				warm: {
					50: '#fef9f7',
					100: '#fdf4f0',
					200: '#fbe8e0',
					300: '#f7d3c4',
					400: '#f1baa3',
					500: '#ea9f82',
					600: '#db8365',
					700: '#c66a50',
					800: '#a45644',
					900: '#86473a',
				},
			},
		},
	},
	plugins: [],
}

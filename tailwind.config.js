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
					50: '#fffaf5',
					100: '#fff1e6',
					200: '#fee9d3',
					300: '#fcd5b6',
					400: '#f2c39b',
					500: '#e8b37f',
					600: '#cf9062',
					700: '#b36f4d',
					800: '#8f5239',
					900: '#6f3f2b',
				},
				warm: {
					50: '#f0fdfa',
					100: '#ccfbf1',
					200: '#99f6e4',
					300: '#5eead4',
					400: '#2dd4bf',
					500: '#14b8a6',
					600: '#0d9488',
					700: '#0f766e',
					800: '#115e59',
					900: '#134e4a',
				},
			},
		},
	},
	plugins: [],
}

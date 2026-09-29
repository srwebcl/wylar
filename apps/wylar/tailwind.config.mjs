/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				// Título de las cabeceras internas (PageHero/Validador): gravedad de
				// diploma/certificado impreso, distinto del Inter que usa el resto
				// del sitio. Autohospedada vía @fontsource-variable/source-serif-4
				// (ver Layout.astro), igual que Inter.
				serif: ['"Source Serif 4 Variable"', 'serif'],
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}

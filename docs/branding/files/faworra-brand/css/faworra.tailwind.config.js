// faworra.tailwind.config.js
// Extend your tailwind.config.ts with this object
// Usage: import faworraConfig from './faworra.tailwind.config.js'

/** @type {import('tailwindcss').Config} */
const faworraConfig = {
	theme: {
		extend: {
			colors: {
				obsidian: "#0A0A0A",
				ivory: "#F8F7F2",
				forest: "#0D3B2E",
				sandsong: "#D4C5A8",
				gray: {
					100: "#F0EFE9",
					200: "#D8D7D0",
					400: "#999891",
					600: "#5A5A56",
					800: "#2C2C2A",
				},
			},
			fontFamily: {
				sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
				mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
			},
			fontSize: {
				label: ["10px", { letterSpacing: "0.10em", fontWeight: "400" }],
				sm: ["12px", { letterSpacing: "0.06em" }],
				base: ["14px", { lineHeight: "1.6" }],
				md: ["16px", { lineHeight: "1.6" }],
				lg: ["20px", {}],
				xl: ["28px", { letterSpacing: "-0.02em" }],
				"2xl": ["36px", { letterSpacing: "-0.02em" }],
				"3xl": ["48px", { letterSpacing: "-0.02em" }],
			},
			borderRadius: {
				none: "0px", // Default — brutalist
				sm: "2px", // Tags only
				md: "4px", // Rare exception
				DEFAULT: "0px",
			},
			borderWidth: {
				DEFAULT: "1px",
			},
			spacing: {
				18: "72px",
				22: "88px",
			},
			boxShadow: {
				none: "none",
				DEFAULT: "none",
			},
		},
	},
};

module.exports = faworraConfig;

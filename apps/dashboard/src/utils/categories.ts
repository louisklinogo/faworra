/**
 * Generate a consistent color from a name using hash function
 * (Midday pattern - copy)
 */
export const COLORS = [
	"#ef4444", // red
	"#f97316", // orange
	"#f59e0b", // amber
	"#eab308", // yellow
	"#84cc16", // lime
	"#22c55e", // green
	"#10b981", // emerald
	"#14b8a6", // teal
	"#06b6d4", // cyan
	"#0ea5e9", // sky
	"#3b82f6", // blue
	"#6366f1", // indigo
	"#8b5cf6", // violet
	"#a855f7", // purple
	"#d946ef", // fuchsia
	"#ec4899", // pink
	"#f43f5e", // rose
];

export function getColorFromName(name: string): string {
	if (!name) {
		return COLORS[0];
	}

	// Simple hash function
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		const char = name.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Use absolute value and modulo to get a valid index
	const index = Math.abs(hash) % COLORS.length;
	return COLORS[index];
}

export function getRandomColor(): string {
	return COLORS[Math.floor(Math.random() * COLORS.length)];
}

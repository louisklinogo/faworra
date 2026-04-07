export type CategoryKind = "income" | "expense";

export interface CategoryDefinition {
	color: string;
	kind: CategoryKind;
	name: string;
	slug: string;
}

export const CATEGORIES: CategoryDefinition[] = [
	{ color: "#0F766E", kind: "income", name: "Sales", slug: "sales" },
	{ color: "#2563EB", kind: "income", name: "Services", slug: "services" },
	{ color: "#7C3AED", kind: "expense", name: "Inventory", slug: "inventory" },
	{ color: "#DC2626", kind: "expense", name: "Operations", slug: "operations" },
	{ color: "#D97706", kind: "expense", name: "Transport", slug: "transport" },
	{ color: "#4B5563", kind: "expense", name: "Utilities", slug: "utilities" },
];

export const getCategoryBySlug = (slug: string) => {
	return CATEGORIES.find((category) => category.slug === slug);
};

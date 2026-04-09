// ─── Types ────────────────────────────────────────────────────────────────────

export type CategoryKind = "income" | "expense";

export interface CategoryDefinition {
	color: string;
	excluded?: boolean; // exclude from reports (e.g., internal transfers)
	kind: CategoryKind;
	name: string;
	parentSlug?: string; // undefined = top-level parent
	slug: string;
	system?: boolean;
}

export interface CategoryHierarchyParent {
	children: CategoryDefinition[];
	color: string;
	excluded: boolean;
	kind: CategoryKind;
	name: string;
	slug: string;
	system: boolean;
}

export type CategoryHierarchy = CategoryHierarchyParent[];

// ─── Color Map ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
	// Revenue
	revenue: "#0F766E",
	income: "#0D9488",
	"product-sales": "#14B8A6",
	"service-revenue": "#2DD4BF",
	"consulting-revenue": "#0891B2",
	"subscription-revenue": "#0EA5E9",
	"interest-income": "#38BDF8",
	"other-income": "#7DD3FC",
	"customer-refunds": "#FB7185",
	"chargebacks-disputes": "#F43F5E",
	// COGS
	"cost-of-goods-sold": "#7C3AED",
	inventory: "#8B5CF6",
	manufacturing: "#A78BFA",
	"shipping-inbound": "#C4B5FD",
	"duties-customs": "#9333EA",
	// Sales & Marketing
	"sales-marketing": "#2563EB",
	marketing: "#3B82F6",
	advertising: "#60A5FA",
	website: "#93C5FD",
	events: "#BFDBFE",
	"promotional-materials": "#1D4ED8",
	// Operations
	operations: "#D97706",
	"office-supplies": "#F59E0B",
	rent: "#FBBF24",
	utilities: "#FCD34D",
	"facilities-expenses": "#FDE68A",
	equipment: "#B45309",
	"internet-and-telephone": "#92400E",
	shipping: "#78350F",
	// Professional Services
	"professional-services": "#059669",
	"professional-services-fees": "#10B981",
	contractors: "#34D399",
	insurance: "#6EE7B7",
	// Human Resources
	"human-resources": "#DC2626",
	salary: "#EF4444",
	training: "#F87171",
	benefits: "#FCA5A5",
	// Travel & Entertainment
	"travel-entertainment": "#DB2777",
	travel: "#EC4899",
	meals: "#F472B6",
	activity: "#F9A8D4",
	// Technology
	technology: "#7C3AED",
	software: "#8B5CF6",
	"non-software-subscriptions": "#A78BFA",
	// Banking & Finance
	"banking-finance": "#4B5563",
	transfer: "#6B7280",
	"credit-card-payment": "#9CA3AF",
	"banking-fees": "#374151",
	"loan-proceeds": "#1F2937",
	"loan-principal-repayment": "#111827",
	"interest-expense": "#030712",
	payouts: "#6B7280",
	"processor-fees": "#9CA3AF",
	fees: "#D1D5DB",
	// Taxes
	taxes: "#92400E",
	"vat-gst-pst-qst-payments": "#B45309",
	"sales-use-tax-payments": "#D97706",
	"income-tax-payments": "#F59E0B",
	"payroll-tax-remittances": "#FBBF24",
	"employer-taxes": "#FCD34D",
	"government-fees": "#FDE68A",
	// Assets
	"assets-capex": "#1E40AF",
	"fixed-assets": "#1D4ED8",
	"prepaid-expenses": "#2563EB",
	// Liabilities
	"liabilities-debt": "#5B21B6",
	leases: "#6D28D9",
	"deferred-revenue": "#7C3AED",
	// Owner / Equity
	"owner-equity": "#065F46",
	"owner-draws": "#047857",
	"capital-investment": "#059669",
	"charitable-donations": "#10B981",
	// System
	system: "#374151",
	uncategorized: "#6B7280",
	other: "#9CA3AF",
	"internal-transfer": "#D1D5DB",
};

function color(slug: string): string {
	return CATEGORY_COLORS[slug] ?? "#6B7280";
}

// ─── Raw Category Definitions ─────────────────────────────────────────────────

const RAW_PARENTS = [
	{
		slug: "revenue",
		name: "Revenue",
		kind: "income" as CategoryKind,
		children: [
			{ slug: "income", name: "Income" },
			{ slug: "product-sales", name: "Product Sales" },
			{ slug: "service-revenue", name: "Service Revenue" },
			{ slug: "consulting-revenue", name: "Consulting Revenue" },
			{ slug: "subscription-revenue", name: "Subscription Revenue" },
			{ slug: "interest-income", name: "Interest Income" },
			{ slug: "other-income", name: "Other Income" },
			{ slug: "customer-refunds", name: "Customer Refunds" },
			{ slug: "chargebacks-disputes", name: "Chargebacks & Disputes" },
		],
	},
	{
		slug: "cost-of-goods-sold",
		name: "Cost of Goods Sold",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "inventory", name: "Inventory" },
			{ slug: "manufacturing", name: "Manufacturing" },
			{ slug: "shipping-inbound", name: "Shipping (Inbound)" },
			{ slug: "duties-customs", name: "Duties & Customs" },
		],
	},
	{
		slug: "sales-marketing",
		name: "Sales & Marketing",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "marketing", name: "Marketing" },
			{ slug: "advertising", name: "Advertising" },
			{ slug: "website", name: "Website" },
			{ slug: "events", name: "Events" },
			{ slug: "promotional-materials", name: "Promotional Materials" },
		],
	},
	{
		slug: "operations",
		name: "Operations",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "office-supplies", name: "Office Supplies" },
			{ slug: "rent", name: "Rent" },
			{ slug: "utilities", name: "Utilities" },
			{ slug: "facilities-expenses", name: "Facilities Expenses" },
			{ slug: "equipment", name: "Equipment" },
			{ slug: "internet-and-telephone", name: "Internet & Telephone" },
			{ slug: "shipping", name: "Shipping" },
		],
	},
	{
		slug: "professional-services",
		name: "Professional Services",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "professional-services-fees", name: "Professional Services Fees" },
			{ slug: "contractors", name: "Contractors" },
			{ slug: "insurance", name: "Insurance" },
		],
	},
	{
		slug: "human-resources",
		name: "Human Resources",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "salary", name: "Salary" },
			{ slug: "training", name: "Training" },
			{ slug: "benefits", name: "Benefits" },
		],
	},
	{
		slug: "travel-entertainment",
		name: "Travel & Entertainment",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "travel", name: "Travel" },
			{ slug: "meals", name: "Meals" },
			{ slug: "activity", name: "Activity" },
		],
	},
	{
		slug: "technology",
		name: "Technology",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "software", name: "Software" },
			{ slug: "non-software-subscriptions", name: "Non-Software Subscriptions" },
		],
	},
	{
		slug: "banking-finance",
		name: "Banking & Finance",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "transfer", name: "Transfer" },
			{ slug: "credit-card-payment", name: "Credit Card Payment", excluded: true },
			{ slug: "banking-fees", name: "Banking Fees" },
			{ slug: "loan-proceeds", name: "Loan Proceeds" },
			{ slug: "loan-principal-repayment", name: "Loan Principal Repayment" },
			{ slug: "interest-expense", name: "Interest Expense" },
			{ slug: "payouts", name: "Payouts" },
			{ slug: "processor-fees", name: "Processor Fees" },
			{ slug: "fees", name: "Fees" },
		],
	},
	{
		slug: "assets-capex",
		name: "Assets",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "fixed-assets", name: "Fixed Assets" },
			{ slug: "prepaid-expenses", name: "Prepaid Expenses" },
		],
	},
	{
		slug: "liabilities-debt",
		name: "Liabilities & Debt",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "leases", name: "Leases" },
			{ slug: "deferred-revenue", name: "Deferred Revenue" },
		],
	},
	{
		slug: "taxes",
		name: "Taxes & Government",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "vat-gst-pst-qst-payments", name: "VAT/GST/PST/QST Payments" },
			{ slug: "sales-use-tax-payments", name: "Sales & Use Tax Payments" },
			{ slug: "income-tax-payments", name: "Income Tax Payments" },
			{ slug: "payroll-tax-remittances", name: "Payroll Tax Remittances" },
			{ slug: "employer-taxes", name: "Employer Taxes" },
			{ slug: "government-fees", name: "Government Fees" },
		],
	},
	{
		slug: "owner-equity",
		name: "Owner / Equity",
		kind: "income" as CategoryKind,
		children: [
			{ slug: "owner-draws", name: "Owner Draws" },
			{ slug: "capital-investment", name: "Capital Investment" },
			{ slug: "charitable-donations", name: "Charitable Donations" },
		],
	},
	{
		slug: "system",
		name: "System",
		kind: "expense" as CategoryKind,
		children: [
			{ slug: "uncategorized", name: "Uncategorized" },
			{ slug: "other", name: "Other" },
			{ slug: "internal-transfer", name: "Internal Transfer", excluded: true },
		],
	},
];

// ─── Exported Categories ──────────────────────────────────────────────────────

export const CATEGORIES: CategoryHierarchy = RAW_PARENTS.map((parent) => ({
	slug: parent.slug,
	name: parent.name,
	kind: parent.kind,
	color: color(parent.slug),
	system: true,
	excluded: false,
	children: parent.children.map((child) => ({
		slug: child.slug,
		name: child.name,
		parentSlug: parent.slug,
		kind: parent.kind,
		color: color(child.slug),
		system: true,
		excluded: "excluded" in child ? (child.excluded ?? false) : false,
	})),
}));

// ─── Flat list (for DB seeding and simple lookups) ────────────────────────────

export const FLAT_CATEGORIES: CategoryDefinition[] = CATEGORIES.flatMap(
	(parent) => [
		{
			slug: parent.slug,
			name: parent.name,
			kind: parent.kind,
			color: parent.color,
			system: true,
			excluded: parent.excluded,
		},
		...parent.children,
	],
);

export const getCategoryBySlug = (slug: string): CategoryDefinition | undefined => {
	return FLAT_CATEGORIES.find((category) => category.slug === slug);
};

export const getCategoriesByKind = (kind: CategoryKind): CategoryHierarchy => {
	return CATEGORIES.filter((parent) => parent.kind === kind);
};

"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Icons } from "@faworra-new/ui/components/icons";
import { format } from "date-fns";
import { formatAccountName } from "@/utils/format";

type FilterKey =
	| "start"
	| "end"
	| "amount_range"
	| "attachments"
	| "recurring"
	| "statuses"
	| "categories"
	| "tags"
	| "accounts"
	| "assignees"
	| "manual"
	| "type";

type FilterValue = {
	start: string;
	end: string;
	amount_range: number[];
	attachments: string;
	recurring: string[];
	statuses: string[];
	categories: string[];
	tags: string[];
	accounts: string[];
	assignees: string[];
	manual: string;
	type: "income" | "expense";
};

interface Props {
	filters: Partial<FilterValue>;
	onRemove: (filters: Record<string, null>) => void;
	categories?: { id: string; name: string; slug?: string | null }[];
	accounts?: { id: string; name: string; currency: string }[];
	members?: { id: string; name: string }[];
	statusFilters?: { id: string; name: string }[];
	attachmentsFilters?: { id: string; name: string }[];
	recurringFilters?: { id: string; name: string }[];
	manualFilters?: { id: string; name: string }[];
	tags?: { id: string; name: string; slug?: string }[];
	amountRange?: [number, number];
}

export function FilterList({
	filters,
	onRemove,
	categories,
	accounts,
	members,
	tags,
	statusFilters,
	attachmentsFilters,
	recurringFilters,
	manualFilters,
	amountRange,
}: Props) {
	const renderFilter = (key: FilterKey, value: FilterValue[FilterKey]) => {
		switch (key) {
			case "start": {
				if (typeof value !== "string") return null;
				const start = new Date(value);
				if (Number.isNaN(start.getTime())) return value;
				if (filters.end) {
					const end = new Date(filters.end);
					if (!Number.isNaN(end.getTime())) {
						return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
					}
				}
				return format(start, "MMM d, yyyy");
			}
			case "amount_range": {
				if (!amountRange) return null;
				return `${(amountRange[0] / 100).toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})} - ${(amountRange[1] / 100).toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})}`;
			}
			case "attachments":
				return attachmentsFilters?.find((filter) => filter.id === value)?.name ?? null;
			case "recurring":
				return Array.isArray(value)
					? value
							.map((slug) => recurringFilters?.find((filter) => filter.id === slug)?.name)
							.filter(Boolean)
							.join(", ")
					: null;
			case "statuses":
				return Array.isArray(value)
					? value
							.map((status) => statusFilters?.find((filter) => filter.id === status)?.name)
							.filter(Boolean)
							.join(", ")
					: null;
			case "categories":
				return Array.isArray(value)
					? value
							.map((slug) => categories?.find((category) => category.slug === slug)?.name)
							.filter(Boolean)
							.join(", ")
					: null;
			case "tags":
				return Array.isArray(value)
					? value
							.map((id) => tags?.find((tag) => tag.id === id || tag.slug === id)?.name)
							.filter(Boolean)
							.join(", ")
					: null;
			case "accounts":
				return Array.isArray(value)
					? value
							.map((id) => {
								const account = accounts?.find((candidate) => candidate.id === id);
								return formatAccountName({
									name: account?.name,
									currency: account?.currency,
								});
							})
							.filter(Boolean)
							.join(", ")
					: null;
			case "assignees":
				return Array.isArray(value)
					? value
							.map((id) => members?.find((member) => member.id === id)?.name)
							.filter(Boolean)
							.join(", ")
					: null;
			case "manual":
				return manualFilters?.find((filter) => filter.id === value)?.name ?? null;
			case "type":
				return value === "income" ? "In" : value === "expense" ? "Out" : null;
			default:
				return null;
		}
	};

	const handleRemove = (key: FilterKey) => {
		if (key === "start" || key === "end") {
			onRemove({ start: null, end: null });
			return;
		}

		onRemove({ [key]: null });
	};

	const entries = Object.entries(filters).filter(
		([key, value]) => value !== null && value !== undefined && key !== "end",
	) as Array<[FilterKey, FilterValue[FilterKey]]>;

	if (!entries.length) {
		return null;
	}

	return (
		<ul className="flex flex-wrap gap-2">
			{entries.map(([key, value]) => {
				const label = renderFilter(key, value);
				if (!label) return null;

				return (
					<li key={key}>
						<Button
							className="group h-9 rounded-none bg-secondary px-2 font-normal text-[#878787] hover:bg-secondary"
							onClick={() => handleRemove(key)}
							variant="ghost"
						>
							<Icons.Clear className="mr-1 h-4 w-0 scale-0 transition-all group-hover:w-4 group-hover:scale-100" />
							<span>{label}</span>
						</Button>
					</li>
				);
			})}
		</ul>
	);
}

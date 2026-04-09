"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@faworra-new/ui/components/select";

export const taxTypes = [
	{
		value: "vat",
		label: "VAT",
		description: "Used in EU, UK, Australia, etc.",
	},
	{
		value: "sales_tax",
		label: "Sales Tax",
		description: "Used in the US and Canada (non-compound).",
	},
	{
		value: "gst",
		label: "GST",
		description: "Used in Australia, New Zealand, Singapore, etc.",
	},
	{
		value: "withholding_tax",
		label: "Withholding Tax",
		description: "Often used in cross-border B2B payments.",
	},
	{
		value: "service_tax",
		label: "Service Tax",
		description: "For niche service-based regions.",
	},
	{
		value: "reverse_charge",
		label: "Reverse Charge",
		description: "For EU cross-border VAT or similar systems.",
	},
	{
		value: "custom_tax",
		label: "Custom Tax",
		description: "For unsupported or internal tax logic.",
	},
];

export function getTaxTypeLabel(taxType: string | null): string {
	if (!taxType) return "-";
	return taxTypes.find((type) => type.value === taxType)?.label ?? taxType;
}

type Props = {
	onChange: (value: string) => void;
	value: string;
};

export function SelectTaxType({ value, onChange }: Props) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select a tax type" />
			</SelectTrigger>
			<SelectContent>
				{taxTypes.map((taxType) => (
					<SelectItem key={taxType.value} value={taxType.value}>
						{taxType.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

"use client";

import { Input } from "@faworra-new/ui/components/input";
import { useState } from "react";

type Props = {
	isNewProduct?: boolean;
	name: string;
	onChange: (value: string) => void;
	onSelect: (vat: number) => void;
	value?: number | null;
};

export function TaxRateInput({
	name,
	onChange,
	onSelect,
	value: defaultValue,
	isNewProduct = true,
}: Props) {
	const [value, setValue] = useState(defaultValue?.toString() ?? "");

	const handleChange = (newValue: string) => {
		// Only allow numbers and decimal point
		const sanitized = newValue.replace(/[^0-9.]/g, "");
		setValue(sanitized);

		if (sanitized === "" || sanitized === ".") {
			onChange("");
			return;
		}

		const numValue = Number.parseFloat(sanitized);
		if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 100) {
			onChange(sanitized);
		}
	};

	const handleBlur = () => {
		if (value === "" || value === ".") {
			onChange("");
			return;
		}

		const numValue = Number.parseFloat(value);
		if (!Number.isNaN(numValue)) {
			const clampedValue = Math.min(Math.max(numValue, 0), 100);
			const roundedValue = Math.round(clampedValue * 100) / 100;
			setValue(roundedValue.toString());
			onSelect(roundedValue);
		}
	};

	return (
		<div className="relative">
			<Input
				placeholder="Tax Rate"
				autoComplete="off"
				value={value}
				onChange={(e) => handleChange(e.target.value)}
				onBlur={handleBlur}
				className="pr-6"
			/>
			<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
				%
			</span>
		</div>
	);
}

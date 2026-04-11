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
				autoComplete="off"
				className="pr-6"
				onBlur={handleBlur}
				onChange={(e) => handleChange(e.target.value)}
				placeholder="Tax Rate"
				value={value}
			/>
			<span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground text-sm">
				%
			</span>
		</div>
	);
}

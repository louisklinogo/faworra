"use client";

import { ComboboxDropdown } from "@faworra-new/ui/components/combobox-dropdown";

interface Props {
	className?: string;
	currencies: string[];
	headless?: boolean;
	onChange: (value: string) => void;
	triggerClassName?: string;
	value?: string;
}

export function SelectCurrency({
	className,
	currencies,
	headless,
	onChange,
	triggerClassName,
	value,
}: Props) {
	const data = currencies.map((currency) => ({
		id: currency.toLowerCase(),
		label: currency,
		value: currency.toUpperCase(),
	}));

	return (
		<ComboboxDropdown
			className={className}
			headless={headless}
			items={data}
			onSelect={(item) => {
				onChange(item.value);
			}}
			placeholder="Select currency"
			searchPlaceholder="Search currencies"
			selectedItem={data.find((item) => item.id === value?.toLowerCase())}
			triggerClassName={triggerClassName}
		/>
	);
}

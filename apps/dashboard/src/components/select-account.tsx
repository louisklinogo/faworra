"use client";

import { ComboboxDropdown } from "@faworra-new/ui/components/combobox-dropdown";
import type { PopoverContent } from "@faworra-new/ui/components/popover";
import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { formatAccountName } from "@/utils/format";
import { TransactionBankAccount } from "./transaction-bank-account";

type SelectedItem = {
	id: string;
	label: string;
	currency: string;
};

type Props = {
	placeholder: string;
	className?: string;
	value?: string;
	onChange: (value: SelectedItem) => void;
	popoverProps?: React.ComponentProps<typeof PopoverContent>;
	modal?: boolean;
};

export function SelectAccount({
	placeholder,
	onChange,
	value,
	popoverProps,
	modal,
}: Props) {
	const trpc = useTRPC();
	const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

	const { data, isLoading } = useQuery(trpc.bankAccounts.list.queryOptions());

	useEffect(() => {
		if (value && data) {
			const found = data.find((d) => d.id === value);

			if (found) {
				setSelectedItem({
					id: found.id,
					label: found.name ?? "",
					currency: found.currency ?? "",
				});
			}
		}
	}, [value, data]);

	if (isLoading) {
		return null;
	}

	return (
		<ComboboxDropdown
			items={
				data?.map((d) => ({
					id: d.id,
					label: d.name ?? "",
					currency: d.currency ?? "",
				})) ?? []
			}
			modal={modal}
			onSelect={(item) => {
				onChange(item);
			}}
			placeholder={placeholder}
			popoverProps={popoverProps}
			renderListItem={({ item }) => {
				return (
					<TransactionBankAccount
						name={formatAccountName({
							name: item.label,
							currency: item.currency,
						})}
					/>
				);
			}}
			renderSelectedItem={(selectedItem) => {
				return (
					<TransactionBankAccount
						name={formatAccountName({
							name: selectedItem.label,
							currency: selectedItem.currency,
						})}
					/>
				);
			}}
			searchPlaceholder="Select account"
			selectedItem={selectedItem ?? undefined}
		/>
	);
}

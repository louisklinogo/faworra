"use client";

import { ComboboxDropdown } from "@/components/ui/combobox-dropdown";
import { uniqueCurrencies } from "@Faworra/location/currencies";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  currencies?: string[];
  headless?: boolean;
  className?: string;
};

export function SelectCurrency({ value, onChange, currencies = uniqueCurrencies, headless, className }: Props) {
  const items = currencies.map((c) => ({ id: c.toLowerCase(), value: c.toUpperCase(), label: c.toUpperCase() }));

  return (
    <ComboboxDropdown
      headless={headless}
      placeholder="Select currency"
      searchPlaceholder="Search currencies"
      items={items}
      className={className}
      popoverProps={{ className: "z-[60]" }}
      selectedItem={items.find((i) => i.id === value?.toLowerCase())}
      onSelect={(item) => onChange(item.value)}
    />
  );
}

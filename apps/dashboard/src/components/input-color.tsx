"use client";

import { Input } from "@faworra-new/ui/components/input";
import { useState } from "react";
import { getColorFromName, getRandomColor } from "@/utils/categories";
import { ColorPicker } from "./color-picker";

type Props = {
	placeholder: string;
	defaultValue?: string;
	defaultColor?: string;
	autoFocus?: boolean;
	onChange: (values: { name: string; color: string }) => void;
};

export function InputColor({
	placeholder,
	defaultValue,
	onChange,
	defaultColor,
	autoFocus,
}: Props) {
	const [color, setColor] = useState(defaultColor ?? getRandomColor());
	const [value, setValue] = useState(defaultValue);

	return (
		<div className="relative">
			<ColorPicker
				onSelect={(newColor) => {
					setColor(newColor);

					if (value) {
						onChange({
							color: newColor,
							name: value,
						});
					}
				}}
				value={color ?? ""}
			/>

			<Input
				autoCapitalize="none"
				autoComplete="off"
				autoCorrect="off"
				autoFocus={autoFocus}
				className="pl-7"
				onChange={(evt) => {
					const newName = evt.target.value;
					const newColor = getColorFromName(newName);

					setColor(newColor);
					setValue(newName);

					if (newColor) {
						onChange({
							color: newColor,
							name: newName,
						});
					}
				}}
				placeholder={placeholder}
				spellCheck="false"
				value={value}
			/>
		</div>
	);
}

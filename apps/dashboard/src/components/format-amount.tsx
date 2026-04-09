"use client";

import { memo } from "react";
import { formatAmount } from "@/utils/format";

type Props = {
  amount: number;
  currency: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  locale?: string;
};

export const FormatAmount = memo(function FormatAmount({
  amount,
  currency,
  maximumFractionDigits,
  minimumFractionDigits,
  locale,
}: Props) {
  return (
    <>
      {formatAmount({
        locale,
        amount,
        currency,
        maximumFractionDigits,
        minimumFractionDigits,
      })}
    </>
  );
});

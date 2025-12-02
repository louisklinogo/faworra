"use client";

import { useQueryStates } from "nuqs";
import { parseAsString, parseAsStringEnum } from "nuqs/server";

const invoiceParamsSchema = {
  type: parseAsStringEnum(["create", "edit", "view", "success"]).withDefault("view"),
  invoiceId: parseAsString,
  orderId: parseAsString,
  selectedCustomerId: parseAsString,
};

type InvoiceParamsState = {
  type: "create" | "edit" | "view" | "success";
  invoiceId: string | null;
  orderId: string | null;
  selectedCustomerId: string | null;
};

export function useInvoiceParams() {
  const [params, setQueryStates] = useQueryStates(invoiceParamsSchema);

  const setParams = (value: Partial<InvoiceParamsState> | null) => {
    if (value === null) {
      return setQueryStates(null);
    }
    return setQueryStates(value as Record<string, string | null>);
  };

  const openCreate = (fromOrderId?: string) =>
    setParams({
      type: "create",
      invoiceId: null,
      orderId: fromOrderId ?? null,
      selectedCustomerId: null,
    });

  const openEdit = (id: string) =>
    setParams({
      type: "edit",
      invoiceId: id,
      orderId: null,
      selectedCustomerId: null,
    });

  const close = () =>
    setParams({
      type: "view",
      invoiceId: null,
      orderId: null,
      selectedCustomerId: null,
    });

  const current: InvoiceParamsState = {
    type: (params.type as InvoiceParamsState["type"]) ?? "view",
    invoiceId: params.invoiceId ?? null,
    orderId: params.orderId ?? null,
    selectedCustomerId: params.selectedCustomerId ?? null,
  };

  const isOpen = current.type === "create" || current.type === "edit";

  return {
    ...current,
    setParams,
    isOpen,
    openCreate,
    openEdit,
    close,
  };
}

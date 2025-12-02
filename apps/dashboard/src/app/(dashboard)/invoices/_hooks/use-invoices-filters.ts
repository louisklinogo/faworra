"use client";

import { parseAsString, useQueryState } from "nuqs";

export function useInvoicesFilters() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [statusesParam, setStatusesParam] = useQueryState("statuses", parseAsString);

  const statuses = statusesParam ? statusesParam.split(",").filter(Boolean) : [];

  const setStatuses = (next: string[] | null) => {
    const value = next && next.length ? next.join(",") : null;
    void setStatusesParam(value);
  };

  return {
    q,
    setQ,
    statuses,
    setStatuses,
  };
}

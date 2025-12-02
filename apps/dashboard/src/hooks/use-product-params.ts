import { parseAsString, useQueryStates } from "nuqs";
import { useCallback } from "react";

// URL params controller for Products (matches TransactionParams pattern)
export function useProductParams() {
  const [params, setParams] = useQueryStates(
    {
      sheet: parseAsString,
      productId: parseAsString,
    },
    { shallow: true },
  );

  const isOpen = params.sheet === "create" || !!params.productId;

  const open = useCallback(
    (options?: { productId?: string }) => {
      if (options?.productId) {
        setParams({ sheet: "edit", productId: options.productId });
      } else {
        setParams({ sheet: "create", productId: null });
      }
    },
    [setParams],
  );

  const close = useCallback(() => {
    setParams({ sheet: null, productId: null });
  }, [setParams]);

  return {
    isOpen,
    sheet: params.sheet,
    productId: params.productId,
    open,
    close,
  };
}

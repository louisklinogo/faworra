"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useProductParams } from "@/hooks/use-product-params";
import { ProductForm } from "./product-form";

export function ProductSheet() {
  const { sheet, close } = useProductParams();

  if (sheet !== "create") return null;

  return (
    <Sheet onOpenChange={(open) => !open && close()} open={sheet === "create"}>
      <SheetContent className="flex flex-col overflow-hidden p-0 sm:max-w-[650px]">
        <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-0">
          <SheetTitle className="text-xl">Create Product</SheetTitle>
        </SheetHeader>
        <ProductForm onSuccess={close} />
      </SheetContent>
    </Sheet>
  );
}

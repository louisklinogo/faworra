"use client";

import { ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { MediaTab } from "./media-tab";
import { OverviewTab } from "./overview-tab";
import { VariantsTab } from "./variants-tab";
import type { RouterOutputs } from "@Faworra/api/trpc/routers/_app";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteProductDialog } from "./delete-product-dialog";
import { useState } from "react";

type Props = {
  productId: string;
  initialData?: RouterOutputs["products"]["details"] | null | undefined;
};

export function ProductDetailsView({ productId, initialData }: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { data: productData, isLoading } = trpc.products.details.useQuery(
    { id: productId },
    {
      staleTime: 30_000,
      initialData: initialData ?? undefined,
    },
  );

  if (isLoading) {
    return <div className="py-6">Loading...</div>;
  }

  if (!productData) {
    return <div>Product not found</div>;
  }

  const { product, variants, media } = productData;

  const utils = trpc.useUtils();
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.products.details.invalidate({ id: productId }),
        utils.products.stats.invalidate(),
        utils.products.topCategories.invalidate(),
      ]);
    },
  });

  return (
    <div className="max-w-6xl xl:max-w-7xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild size="icon" variant="ghost">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold text-2xl">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground text-sm">{product.description}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="More actions" size="sm" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            {product.status === "archived" ? (
              <DropdownMenuItem onSelect={() => updateMutation.mutate({ id: product.id, status: "active" })}>
                Unarchive
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => updateMutation.mutate({ id: product.id, status: "archived" })}>
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => setDeleteDialogOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs className="w-full" defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variants">
            Variants ({variants?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value="overview">
          <OverviewTab product={product} />
        </TabsContent>

        <TabsContent className="mt-6" value="variants">
          <VariantsTab productId={productId} variants={variants || []} />
        </TabsContent>

        <TabsContent className="mt-6" value="media">
          <MediaTab media={media || []} productId={productId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DeleteProductDialog
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        product={product ? { id: product.id, name: product.name } : null}
      />
    </div>
  );
}

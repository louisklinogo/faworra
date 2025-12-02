"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/widgets/carousel";
import { trpc } from "@/lib/trpc/client";
import { ProductsTotalProducts } from "@/components/analytics/products-total-products";
import { ProductsActiveProducts } from "@/components/analytics/products-active-products";
import { ProductsDraftProducts } from "@/components/analytics/products-draft-products";
import { ProductsArchivedProducts } from "@/components/analytics/products-archived-products";
import { ProductsLowStockVariants } from "@/components/analytics/products-low-stock-variants";
import { ProductsOutOfStockVariants } from "@/components/analytics/products-out-of-stock-variants";
import { ProductsTopCategories } from "@/components/analytics/products-top-categories";

type Stats = {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  lowStockVariants: number;
  outOfStockVariants: number;
};

type TopCategory = { slug: string; name: string; color?: string | null; total: number };

export function ProductsAnalyticsCarousel({
  initialStats,
  initialTopCategories,
}: {
  initialStats?: Stats;
  initialTopCategories?: TopCategory[];
}) {
  const commonOpts = {
    staleTime: 30_000,
    refetchOnMount: false as const,
    refetchOnWindowFocus: false as const,
    refetchOnReconnect: false as const,
    retry: false as const,
  };

  const { data: stats, isLoading: statsLoading } = trpc.products.stats.useQuery(undefined, {
    ...commonOpts,
    initialData: initialStats,
  });
  const { data: topCats = [], isLoading: catsLoading } = trpc.products.topCategories.useQuery(
    { limit: 10 },
    { ...commonOpts, initialData: initialTopCategories },
  );

  const [openCats, setOpenCats] = useState(false);
  const { data: allCats = [], isLoading: allCatsLoading } = trpc.products.topCategories.useQuery(
    { limit: 50 },
    { ...commonOpts, enabled: openCats },
  );
  const totalInAll = useMemo(
    () => allCats.reduce((sum: number, r: any) => sum + Number(r.total || 0), 0),
    [allCats],
  );

  return (
    <div className="pt-6">
      <Carousel className="flex flex-col" opts={{ align: "start", containScroll: "trimSnaps", slidesToScroll: "auto" }}>
        <div className="mb-3 flex items-center gap-2 sm:mb-4">
          <div className="ml-auto hidden items-center md:flex">
            <CarouselPrevious className="static top-auto translate-y-0 border-none p-0 hover:bg-transparent" />
            <CarouselNext className="static top-auto translate-y-0 border-none p-0 hover:bg-transparent" />
          </div>
        </div>

        <CarouselContent className="pr-4">
          <CarouselItem className="sm:basis-1/2 lg:basis-1/4">
            <ProductsTotalProducts loading={statsLoading} subtitle="Overview" value={stats?.totalProducts ?? 0} />
          </CarouselItem>
          <CarouselItem className="sm:basis-1/2 lg:basis-1/4">
            <ProductsActiveProducts loading={statsLoading} subtitle="Overview" value={stats?.activeProducts ?? 0} />
          </CarouselItem>
          <CarouselItem className="sm:basis-1/2 lg:basis-1/4">
            <ProductsDraftProducts loading={statsLoading} subtitle="Overview" value={stats?.draftProducts ?? 0} />
          </CarouselItem>
          <CarouselItem className="sm:basis-1/2 lg:basis-1/4">
            <ProductsArchivedProducts loading={statsLoading} subtitle="Overview" value={stats?.archivedProducts ?? 0} />
          </CarouselItem>
          <CarouselItem className="sm:basis-1/2 lg:basis-1/4">
            <ProductsLowStockVariants loading={statsLoading} subtitle="Overview" value={stats?.lowStockVariants ?? 0} />
          </CarouselItem>
          <CarouselItem className="sm:basis-1/2 lg:basis-1/4">
            <ProductsOutOfStockVariants loading={statsLoading} subtitle="Overview" value={stats?.outOfStockVariants ?? 0} />
          </CarouselItem>
          <CarouselItem className="sm:basis-1/2 lg:basis-1/4">
            <ProductsTopCategories loading={catsLoading} onViewAll={() => setOpenCats(true)} rows={topCats} />
          </CarouselItem>
        </CarouselContent>

        {/* Top categories sheet */}
        <Sheet open={openCats} onOpenChange={setOpenCats}>
          <SheetContent className="mr-4 md:mr-6" side="right">
            <SheetHeader>
              <SheetTitle>Top categories</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {allCatsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2">
                      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : allCats.length ? (
                <ul className="space-y-2">
                  {allCats.map((row: any) => {
                    const pct = totalInAll > 0 ? Math.max(0, Math.min(100, (Number(row.total || 0) / totalInAll) * 100)) : 0;
                    return (
                      <li key={row.slug}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: row.color || "#9b9b9b" }} />
                            <span className="truncate">{row.name}</span>
                          </div>
                          <span className="text-muted-foreground text-sm">{row.total}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted/50">
                          <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: row.color || "#9b9b9b" }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-muted-foreground text-sm">No category data</div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </Carousel>
    </div>
  );
}

export default ProductsAnalyticsCarousel;

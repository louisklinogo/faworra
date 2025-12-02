"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type ProductCategoryRow = { slug: string; name: string; color?: string | null; total: number };

export function ProductsTopCategories({ rows = [], loading, onViewAll }: { rows?: ProductCategoryRow[]; loading?: boolean; onViewAll?: () => void }) {
  return (
    <Card className="h-[200px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">Top categories</div>
          {onViewAll ? (
            <button className="text-muted-foreground text-sm" onClick={onViewAll} type="button">
              View all
            </button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pb-[10px]">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1.5">
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-10 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : rows.length ? (
          <ul className="space-y-1.5">
            {rows.slice(0, 5).map((r) => (
              <li key={r.slug} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: r.color || "#9b9b9b" }} />
                  <span className="truncate">{r.name}</span>
                </div>
                <span className="text-muted-foreground text-sm">{r.total}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted-foreground text-sm">No data</div>
        )}
      </CardContent>
    </Card>
  );
}

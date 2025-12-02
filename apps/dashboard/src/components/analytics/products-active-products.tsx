"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductsActiveProducts({ value, subtitle, loading = false }: { value: number; subtitle?: string; loading?: boolean }) {
  return (
    <Card className="h-[200px]">
      <CardHeader className="pb-3">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        ) : (
          <CardTitle className="font-medium text-2xl">{value.toLocaleString()}</CardTitle>
        )}
      </CardHeader>
      <CardContent className="pb-[34px]">
        <div>Active</div>
        <div className="text-muted-foreground text-sm">{subtitle || "Overview"}</div>
      </CardContent>
    </Card>
  );
}

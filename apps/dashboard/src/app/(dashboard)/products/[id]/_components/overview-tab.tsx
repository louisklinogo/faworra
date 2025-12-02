"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeamCurrency } from "@/hooks/use-team-currency";

type Props = {
  product: any;
};

export function OverviewTab({ product }: Props) {
  const _currency = useTeamCurrency();

  const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
    active: "default",
    draft: "secondary",
    archived: "destructive",
  };

  const typeLabels: Record<string, string> = {
    physical: "Physical",
    digital: "Digital",
    service: "Service",
    bundle: "Bundle",
  };

  const fmtDate = (value: unknown): string => {
    const d = value instanceof Date ? value : typeof value === "string" ? new Date(value) : null;
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-medium text-muted-foreground text-sm">Name</div>
            <p className="text-base">{product.name}</p>
          </div>

          {product.description && (
            <div>
              <div className="font-medium text-muted-foreground text-sm">Description</div>
              <p className="text-base">{product.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-muted-foreground text-sm">Status</div>
              <div className="mt-1">
                {(() => {
                  const s = product.status as string;
                  const cls =
                    s === "active"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : s === "draft"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"; // archived
                  return (
                    <Badge className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${cls}`} variant="outline">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Badge>
                  );
                })()}
              </div>
            </div>

            <div>
              <div className="font-medium text-muted-foreground text-sm">Type</div>
              <div className="mt-1">
                {(() => {
                  const t = product.type as string;
                  const cls =
                    t === "physical"
                      ? "bg-sky-100 text-sky-700 border-sky-200"
                      : t === "digital"
                        ? "bg-purple-100 text-purple-700 border-purple-200"
                        : t === "service"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-indigo-100 text-indigo-700 border-indigo-200"; // bundle
                  const label = (typeLabels[t] || t) as string;
                  return (
                    <Badge className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${cls}`} variant="outline">
                      {label}
                    </Badge>
                  );
                })()}
              </div>
            </div>
          </div>

          {product.categorySlug && (
            <div>
              <div className="font-medium text-muted-foreground text-sm">Category</div>
              <p className="text-base">{product.categorySlug}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-medium text-muted-foreground text-sm">Product ID</div>
            <p className="font-mono text-xs">{product.id}</p>
          </div>

          <div>
            <div className="font-medium text-muted-foreground text-sm">Created</div>
            <p className="text-sm">{fmtDate(product.createdAt)}</p>
          </div>

          {product.updatedAt && (
            <div>
              <div className="font-medium text-muted-foreground text-sm">Last Updated</div>
              <p className="text-sm">{fmtDate(product.updatedAt)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

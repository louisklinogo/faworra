import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  helper,
  valueClassName,
  labelIcon,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  valueClassName?: string;
  labelIcon?: ReactNode;
}) {
  return (
    <Card className="h-[200px]">
      <CardHeader className="pb-3">
        <CardTitle className={`font-medium text-2xl ${valueClassName || ""}`}>{value}</CardTitle>
      </CardHeader>
      <CardContent className="pb-[34px]">
        <div className="flex items-center gap-2">
          {labelIcon}
          <span>{label}</span>
        </div>
        {helper ? <div className="text-muted-foreground text-sm">{helper}</div> : null}
      </CardContent>
    </Card>
  );
}

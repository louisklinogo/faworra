import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showSearch?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 5, showSearch = true }: TableSkeletonProps) {
  const headerKeys = Array.from({ length: columns }, (_, i) => `header-${i}`);
  const rowKeys = Array.from({ length: rows }, (_, i) => `row-${i}`);
  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-[300px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[100px]" />
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {headerKeys.map((hk) => (
                <TableHead key={hk}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowKeys.map((rk) => (
              <TableRow key={rk}>
                {headerKeys.map((hk) => (
                  <TableCell key={`cell-${rk}-${hk}`}>
                    <Skeleton className="h-4" style={{ width: `${Math.random() * 60 + 40}%` }} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[200px]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[80px]" />
          <Skeleton className="h-9 w-[80px]" />
        </div>
      </div>
    </div>
  );
}

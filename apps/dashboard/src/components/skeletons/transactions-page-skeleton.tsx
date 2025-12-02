import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TransactionsPageSkeleton() {
  const rows = Array.from({ length: 8 });
  const pills = Array.from({ length: 6 });
  const cards = Array.from({ length: 6 });
  return (
    <div className="flex flex-col gap-6">
      {/* Analytics carousel mimic */}
      <div className="pt-6">
        <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
          <Skeleton className="h-8 w-32" />
          <div className="hidden items-center gap-2 md:flex">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pr-4 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((_, i) => (
            <Card key={i}>
              <div className="p-4">
                <Skeleton className="mb-3 h-4 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 space-y-4">
        <div className="sticky top-0 z-10 hidden grid-cols-[420px,1fr,auto] items-center gap-2 rounded bg-background/95 px-1 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:grid">
          <div className="min-w-0">
            <div className="pointer-events-none h-9 select-none opacity-0" />
          </div>
          <div className="min-w-0" />
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-9 w-[260px]" />
            <Skeleton className="h-9 w-[120px]" />
            <Skeleton className="h-9 w-[140px]" />
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
        </div>

        {/* Filter chips row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {pills.map((_, i) => (
              <Skeleton className="h-8 w-20 rounded-full" key={i} />
            ))}
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Table skeleton approximating sticky select+date and actions */}
      <div className="rounded-lg border">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 sticky left-0 z-10 bg-background" />
              <TableHead className="w-36 sticky z-10 bg-background">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((_, r) => (
              <TableRow key={r}>
                <TableCell className="sticky left-0 z-10 bg-background">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell className="sticky z-10 bg-background">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Skeleton className="h-5 w-10 rounded" />
                    <Skeleton className="h-5 w-12 rounded" />
                    <Skeleton className="h-5 w-8 rounded" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

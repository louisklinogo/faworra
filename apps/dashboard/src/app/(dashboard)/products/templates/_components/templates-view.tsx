"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function TemplatesView() {
  // Stub state — wiring will come later
  const items: any[] = [];
  const query = "";

  return (
    <Card className="border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="sr-only">Product Templates</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-none border px-3 py-2 text-sm md:flex">
              <Icons.Search className="h-4 w-4 text-muted-foreground" />
              <Input
                className="h-6 w-[260px] border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                onChange={() => {}}
                placeholder="Search templates…"
                value={query}
              />
            </div>
            <Button aria-label="Create template" disabled size="icon" title="Create template">
              <Icons.Add className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-muted-foreground text-sm">Coming soon</div>
            <div className="text-muted-foreground text-xs">Define reusable product defaults and variant attributes.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">Name</TableHead>
                    <TableHead className="sticky top-0 w-[140px] bg-background">Type</TableHead>
                    <TableHead className="sticky top-0 w-[120px] bg-background">Status</TableHead>
                    <TableHead className="sticky top-0 w-[120px] bg-background text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((r) => (
                    <TableRow className="hover:bg-muted/50" key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.type}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.status}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-label="Actions" size="icon" variant="ghost">
                              <Icons.MoreHoriz className="size-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem disabled>Archive</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

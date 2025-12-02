"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/currency";
import { getProductMediaUrl } from "@/lib/storage";
import { Image as ImageIcon, MoreHorizontal } from "lucide-react";

export type ProductRow = {
  product: {
    id: string;
    name: string;
    description: string | null;
    status: "active" | "draft" | "archived";
    type: "physical" | "digital" | "service" | "bundle";
    categorySlug: string | null;
  };
  variantsCount: number;
  priceMin: number | null;
  priceMax: number | null;
  stockOnHand: number;
  stockAllocated: number;
  primaryImage: string | null;
};

type ColumnOptions = {
  currencyCode: string;
  onEdit: (row: ProductRow) => void;
  onDuplicate?: (row: ProductRow) => void;
  onArchive?: (row: ProductRow) => void;
  onDelete?: (row: ProductRow) => void;
  categories?: Array<{ slug: string; name: string }>;
};

export function createProductColumns({
  currencyCode,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  categories = [],
}: ColumnOptions): ColumnDef<ProductRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 36,
    },
    {
      accessorKey: "primaryImage",
      header: "",
      size: 64,
      cell: ({ row }) => {
        const imagePath = row.original.primaryImage;
        return (
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded border bg-muted/30">
            {imagePath ? (
              <Image
                alt={row.original.product.name}
                className="h-full w-full object-cover"
                height={48}
                src={getProductMediaUrl(imagePath)}
                width={48}
              />
            ) : (
              <ImageIcon aria-hidden className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "product.name",
      header: "Name",
      cell: ({ row }) => (
        <Link
          className="flex flex-col gap-1 hover:underline"
          href={`/products/${row.original.product.id}`}
        >
          <span className="font-medium">{row.original.product.name}</span>
          {row.original.product.description ? (
            <span className="line-clamp-1 text-muted-foreground text-xs">
              {row.original.product.description}
            </span>
          ) : null}
        </Link>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "variantsCount",
      header: "Variants",
      size: 100,
      cell: ({ row }) => <Badge variant="secondary">{row.original.variantsCount}</Badge>,
    },
    {
      accessorKey: "product.categorySlug",
      header: "Category",
      size: 150,
      cell: ({ row }) => {
        const slug = row.original.product.categorySlug;
        const category = categories.find((c) => c.slug === slug);
        return slug && category ? (
          <Badge variant="secondary">{category.name}</Badge>
        ) : slug ? (
          <Badge variant="secondary">{slug}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      accessorKey: "product.status",
      header: "Status",
      size: 100,
      cell: ({ row }) => {
        const status = row.original.product.status;
        const cls =
          status === "active"
            ? "bg-green-100 text-green-700 border-green-200"
            : status === "draft"
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-slate-100 text-slate-700 border-slate-200"; // archived
        const label = status.charAt(0).toUpperCase() + status.slice(1);
        return <Badge className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${cls}`} variant="outline">{label}</Badge>;
      },
    },
    {
      accessorKey: "priceMin",
      header: "Price Range",
      size: 140,
      cell: ({ row }) => {
        const { priceMin, priceMax } = row.original;
        if (priceMin == null) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        if (priceMin === priceMax || priceMax == null) {
          return <span className="font-medium">{formatCurrency(priceMin)}</span>;
        }
        return (
          <span className="font-medium text-sm">
            {formatCurrency(priceMin)} - {formatCurrency(priceMax)}
          </span>
        );
      },
    },
    {
      accessorKey: "stockOnHand",
      header: "Stock",
      size: 80,
      cell: ({ row }) => {
        const stock = row.original.stockOnHand;
        return (
          <span className={stock === 0 ? "text-destructive" : "text-foreground"}>{stock}</span>
        );
      },
    },
    {
      id: "actions",
      size: 80,
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Row actions" size="sm" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              disabled={!onDuplicate}
              onClick={() => onDuplicate?.(row.original)}
            >
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!onArchive}
              onClick={() => onArchive?.(row.original)}
            >
              {row.original.product.status === "archived" ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              disabled={!onDelete}
              onClick={() => onDelete?.(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

"use client";

import Image from "next/image";
import { Loader2, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc/client";
import { getProductMediaUrl } from "@/lib/storage";
import { createBrowserClient } from "@Faworra/supabase/client";
import { DeleteMediaDialog } from "./delete-media-dialog";
import { RenameMediaAltDialog } from "./rename-media-alt-dialog";

type Props = {
  productId: string;
  media: any[];
};

export function MediaTab({ productId, media = [] }: Props) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<any[]>(media);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ id: string; alt?: string | null } | null>(null);
  
  useEffect(() => {
    setItems(media || []);
  }, [media]);

  // selection helpers
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());
  const selectAll = () =>
    setSelected(new Set(items.filter((i: any) => !i?.isTemp).map((i: any) => i.id)));

  const setPrimaryMutation = trpc.products.setPrimaryMedia.useMutation({
    onError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to set primary image",
      });
    },
  });

  const createMediaMutation = trpc.products.createMedia.useMutation();
  const bulkDeleteMutation = trpc.products.deleteMedia.useMutation();

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      // Plans and optimistic temps with progress
      const plans = acceptedFiles.map((file) => ({
        tempId: `temp-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
        file,
      }));
      const temps = plans.map(({ tempId, file }) => ({
        id: tempId,
        alt: file.name,
        isPrimary: false,
        isTemp: true,
        progress: 0,
        previewUrl: URL.createObjectURL(file),
        sizeBytes: file.size,
      }));
      setItems((cur) => [...temps, ...(cur || [])]);

      for (const { tempId, file } of plans) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("productId", productId);

        const xhr = new XMLHttpRequest();
        const result = await new Promise<{ status: number; body: any }>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
              setItems((cur) => cur.map((it: any) => (it.id === tempId ? { ...it, progress: pct } : it)));
            }
          };
          xhr.onload = () => {
            try {
              const body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
              resolve({ status: xhr.status, body });
            } catch (err) {
              reject(err);
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.open("POST", `${base}/products/uploads`);
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });

        if (result.status < 200 || result.status >= 300) {
          setItems((cur) => cur.map((it: any) => (it.id === tempId ? { ...it, error: true } : it)));
          throw new Error(result.body?.error || "Upload failed");
        }

        setItems((cur) => cur.map((it: any) => (it.id === tempId ? { ...it, progress: 100 } : it)));
        const created = await createMediaMutation.mutateAsync({
          productId,
          path: result.body.path,
          sizeBytes: result.body.size || undefined,
          mimeType: result.body.contentType || undefined,
        });
        setItems((cur) => cur.map((it: any) => (it.id === tempId ? created : it)));
      }

      toast({ description: `${acceptedFiles.length} image${acceptedFiles.length > 1 ? "s" : ""} uploaded` });
      await utils.products.details.invalidate({ id: productId });
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading,
    noClick: true,
  });

  if (items.length === 0) {
    return (
      <div
        {...getRootProps()}
        className={`flex min-h-[120px] items-center justify-center rounded-md border border-dashed px-4 text-center text-sm ${
          isDragActive ? "bg-secondary" : "bg-background"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-muted-foreground">
          Drop your files here, or{" "}
          <button
            className="underline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              open();
            }}
            type="button"
          >
            click to browse
          </button>
          .<br />
          5MB file limit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`flex min-h-[120px] items-center justify-center rounded-md border border-dashed px-4 text-center text-sm ${
          isDragActive ? "bg-secondary" : "bg-background"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-muted-foreground">
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              Drop your files here, or{" "}
              <button
                className="underline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  open();
                }}
                type="button"
              >
                click to browse
              </button>
              .<br />
              5MB file limit.
            </>
          )}
        </p>
      </div>

      {/* Bulk actions — desktop sticky row */}
      <div className="sticky top-0 z-10 hidden items-center justify-between rounded bg-background/95 px-1 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex">
        {selected.size > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{selected.size} selected</span>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90 gap-1"
              onClick={() => setBulkDialogOpen(true)}
              size="sm"
              variant="destructive"
            >
              Delete
            </Button>
            <Button onClick={clearSelection} size="sm" variant="ghost">
              Clear
            </Button>
            <Button onClick={selectAll} size="sm" variant="ghost">
              Select all
            </Button>
          </div>
        ) : (
          <div className="pointer-events-none h-9 select-none opacity-0" />
        )}
      </div>

      {/* Bulk actions — mobile bar */}
      {selected.size > 0 && (
        <div className="mb-2 flex items-center justify-between border-b bg-muted/40 px-4 py-3 sm:hidden">
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm">Bulk edit</span>
            <div className="h-4 w-px bg-border" />
            <span className="text-muted-foreground text-sm">{selected.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-destructive text-white hover:bg-destructive/90 gap-1"
              onClick={() => setBulkDialogOpen(true)}
              size="sm"
              variant="destructive"
            >
              Delete
            </Button>
            <Button onClick={clearSelection} size="sm" variant="ghost">
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Media Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Card className="relative border" key={item.id}>
            {/* Top bar: primary badge + kebab */}
            <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selected.has(item.id)}
                  disabled={Boolean((item as any).isTemp)}
                  onCheckedChange={() => toggleSelect(item.id)}
                />
                {!item.isTemp && item.isPrimary ? (
                  <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">Primary</span>
                ) : null}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Media actions" className="h-7 w-7 rounded-none" disabled={Boolean((item as any).isTemp)} size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <DropdownMenuItem
                    disabled={item.isPrimary || setPrimaryMutation.isPending}
                    onSelect={() => {
                      const prev = items;
                      const mark = (list: any[], id: string) => list.map((x) => ({ ...x, isPrimary: x.id === id }));
                      setItems((cur) => mark(cur, item.id));
                      setPrimaryMutation.mutate(
                        { productId, mediaId: item.id },
                        {
                          onSuccess: () => {
                            utils.products.details.setData({ id: productId }, (d: any) =>
                              d ? { ...d, media: mark(d.media || [], item.id) } : d,
                            );
                            toast({ description: "Primary image updated" });
                          },
                          onError: () => setItems(prev),
                        },
                      );
                    }}
                  >
                    {item.isPrimary ? "Primary" : "Set primary"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setSelectedMedia({ id: item.id, alt: item.alt });
                      setRenameDialogOpen(true);
                    }}
                  >
                    Rename alt
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={() => {
                      setSelectedMedia({ id: item.id, alt: item.alt });
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Image */}
            <div className="relative aspect-square">
              {item.isTemp ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={item.alt || "Uploading"} className="h-full w-full object-cover" src={(item as any).previewUrl} />
              ) : (
                <Image
                  alt={item.alt || "Product image"}
                  className="object-cover"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  src={getProductMediaUrl(item.path)}
                />
              )}

              {/* Upload overlay with progress */}
              {((item as any).isTemp || typeof (item as any).progress === "number") && (
                <div className="absolute inset-0 z-10 flex items-end bg-black/40 p-2">
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between text-xs text-white/90">
                      <span className="line-clamp-1">{item.alt}</span>
                      {typeof (item as any).progress === "number" ? (
                        <span>{Math.max(0, Math.min(100, (item as any).progress))}%</span>
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                    </div>
                    <Progress className="h-1.5 bg-white/20" value={(item as any).progress || 0} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="border-t px-2 py-1 text-xs">
              <div className="truncate" title={item.alt || item.path}>{item.alt || (item.path ? item.path.split("/").pop() : "")}</div>
              <div className="text-muted-foreground">
                {(item.width && item.height ? `${item.width}×${item.height}` : "")}{" "}
                {item.sizeBytes ? `• ${(Number(item.sizeBytes) / 1024).toFixed(0)} KB` : ""}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      <DeleteMediaDialog
        media={selectedMedia}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        productId={productId}
      />
      <RenameMediaAltDialog
        media={selectedMedia}
        onOpenChange={setRenameDialogOpen}
        open={renameDialogOpen}
        productId={productId}
      />

      {/* Bulk Delete Dialog */}
      <AlertDialog onOpenChange={setBulkDialogOpen} open={bulkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} image{selected.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected media. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isBulkDeleting}
              onClick={async () => {
                try {
                  setIsBulkDeleting(true);
                  const ids = Array.from(selected).filter((id) =>
                    (items || []).some((x: any) => x.id === id && !x.isTemp),
                  );
                  let ok = 0;
                  let fail = 0;
                  for (const id of ids) {
                    try {
                      await bulkDeleteMutation.mutateAsync({ productId, mediaId: id });
                      ok++;
                    } catch {
                      fail++;
                    }
                  }
                  await utils.products.details.invalidate({ id: productId });
                  clearSelection();
                  toast({ description: fail ? `Deleted ${ok}, ${fail} failed` : `Deleted ${ok} image${ok === 1 ? "" : "s"}` });
                  setBulkDialogOpen(false);
                } finally {
                  setIsBulkDeleting(false);
                }
              }}
            >
              {isBulkDeleting ? "Deleting..." : `Delete (${selected.size})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

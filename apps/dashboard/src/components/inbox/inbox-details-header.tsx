"use client";

import { format } from "date-fns";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { Download, FileSpreadsheet, FileText, MoreVertical, Tag, User, Clock, FolderArchive, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { InboxMessage } from "@/types/inbox";
import { PlatformIcon } from "@/app/(dashboard)/inbox/conversations/_components/thread-helpers-ui";

type Member = { id: string; fullName?: string | null; email?: string | null };

export function InboxDetailsHeader({
  message,
  onPrev,
  onNext,
  index,
  total,
  members = [],
  onSnoozeCustom,
  onOpenTags,
  onDelete,
  onDownload,
}: {
  message: InboxMessage | null;
  onPrev?: () => void;
  onNext?: () => void;
  index?: number;
  total?: number;
  members?: Member[];
  onSnoozeCustom?: () => void;
  onOpenTags?: () => void;
  onDelete?: () => void;
  onDownload?: (format: "html" | "csv") => void;
}) {
  const utils = trpc.useUtils();
  const updateThread = trpc.communications.threads.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.communications.threadsByStatus.invalidate(),
        utils.communications.ownershipCounts?.invalidate?.(),
      ]);
    },
  });

  if (!message) {
    return (
      <div className="flex items-center justify-center border-b bg-background px-3 py-2 text-sm text-muted-foreground">
        Select a conversation
      </div>
    );
  }

  const threadId = message.id;
  const name = message.customerName || "?";
  const contactLabel = message.platform === "email"
    ? message.emailAddress || message.customerName
    : message.platform === "instagram"
      ? message.instagramHandle || message.phoneNumber || message.customerName
      : message.phoneNumber || message.instagramHandle || message.customerName;

  const platformLabel = message.platform === "whatsapp" ? "WhatsApp" : message.platform === "instagram" ? "Instagram" : "Email";

  const snoozePreset = async (preset: "1h" | "today-4" | "tomorrow-9") => {
    const d = new Date();
    if (preset === "1h") d.setHours(d.getHours() + 1);
    if (preset === "today-4") {
      d.setHours(16, 0, 0, 0);
      if (d < new Date()) d.setDate(d.getDate() + 1);
    }
    if (preset === "tomorrow-9") {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    }
    await updateThread.mutateAsync({ id: threadId, status: "snoozed", snoozedUntil: d.toISOString() });
  };

  const isSnoozed = message.threadStatus === "snoozed";
  const snoozedLabel = message.snoozedUntil
    ? `Snoozed until ${format(new Date(message.snoozedUntil), "MMM d, h:mma")}`
    : "Snoozed until next reply";

  const getInitials = (n: string) =>
    n
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="flex h-14 items-center justify-between gap-3 border-b bg-background px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.customerAvatar} />
          <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-medium leading-tight">{name}</div>
            {isSnoozed && (
              <div className="truncate text-[11px] font-medium text-amber-600">{snoozedLabel}</div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center min-w-0 gap-1">
              <PlatformIcon platform={message.platform} />
              <span className="truncate">{platformLabel}</span>
            </span>
            {contactLabel && contactLabel !== name ? (
              <span className="truncate">{contactLabel}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <Button disabled={!onPrev} onClick={onPrev} size="icon" variant="ghost">
          <MdChevronLeft className="h-4 w-4" />
        </Button>
        <div className="mx-1 min-w-[48px] text-center text-[11px] text-muted-foreground">
          {index && total ? (
            <span>
              {index}/{total}
            </span>
          ) : null}
        </div>
        <Button disabled={!onNext} onClick={onNext} size="icon" variant="ghost">
          <MdChevronRight className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-4 w-px bg-border" />
        <Button aria-label="Resolve" size="icon" variant="ghost" onClick={() => updateThread.mutate({ id: threadId, status: "resolved" })}>
          <FolderArchive className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="More" size="icon" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs"><FolderArchive className="mr-2 h-4 w-4" /> Status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => updateThread.mutate({ id: threadId, status: "open" })}>Open</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateThread.mutate({ id: threadId, status: "pending" })}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateThread.mutate({ id: threadId, status: "resolved" })}>Resolved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => snoozePreset("1h")}>
                  Snoozed (1h)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs"><Clock className="mr-2 h-4 w-4" /> Snooze</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => snoozePreset("1h")}>In 1 hour</DropdownMenuItem>
                <DropdownMenuItem onClick={() => snoozePreset("today-4")}>Today 4pm</DropdownMenuItem>
                <DropdownMenuItem onClick={() => snoozePreset("tomorrow-9")}>Tomorrow 9am</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnoozeCustom?.()}>Custom…</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs"><User className="mr-2 h-4 w-4" /> Assign</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-64 w-56 overflow-y-auto">
                <DropdownMenuItem onClick={() => updateThread.mutate({ id: threadId, assignedUserId: null })}>Unassigned</DropdownMenuItem>
                {members.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => updateThread.mutate({ id: threadId, assignedUserId: m.id })}>
                    {m.fullName || m.email}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={() => onOpenTags?.()}>
              <Tag className="mr-2 h-4 w-4" /> Tags…
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs"><Download className="mr-2 h-4 w-4" /> Transcript</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onDownload?.("html")}>
                  <FileText className="mr-2 h-4 w-4" /> HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload?.("csv")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.()}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

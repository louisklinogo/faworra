"use client";

import { createBrowserClient } from "@Faworra/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import type { RealtimeMessage } from "@/hooks/use-realtime-messages";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { InboxMessage } from "@/types/inbox";
import AssignDialog from "./assign-dialog";
import Composer from "./composer";
import SnoozeDialog from "./snooze-dialog";
import TagsDialog from "./tags-dialog";
import { InboxDetailsHeader } from "./inbox-details-header";
import { useRealtime } from "@/components/realtime/RealtimeProvider";

function stripHtmlTags(value: string) {
  return value
    .replace(/<br\s*\/?>(\s)*/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\u00A0/g, " ")
    .trim();
}

function deriveQuotedText(meta: RealtimeMessage["meta"]): string | null {
  if (!meta) return null;
  if (meta.quotedText && meta.quotedText.trim()) {
    return meta.quotedText.trim();
  }
  if (meta.quotedHtml && meta.quotedHtml.trim()) {
    const stripped = stripHtmlTags(meta.quotedHtml);
    return stripped || null;
  }
  return null;
}

function MessageRecipientRow({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="mb-1 text-xs opacity-80">
      <span className="font-semibold uppercase tracking-wide text-[10px]">{label}:</span>{" "}
      <span className="font-normal normal-case text-xs">{values.join(", ")}</span>
    </div>
  );
}

function QuotedPreview({ text }: { text: string }) {
  return (
    <div className="mb-2 max-h-48 overflow-y-auto rounded-md border border-dashed border-white/20 bg-background/20 px-3 py-2 text-xs opacity-90">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide">
        Quoted message
      </div>
      <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">{text}</pre>
    </div>
  );
}

interface InboxDetailsProps {
  message: InboxMessage | null;
  onPrev?: () => void;
  onNext?: () => void;
  index?: number;
  total?: number;
}

export function InboxDetails({ message, onPrev, onNext, index, total }: InboxDetailsProps) {
  const threadId = message?.id ?? null;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { messages, isLoading } = useRealtimeMessages(threadId);
  // Macros available via other UI; removed from header for compactness
  const [assignOpen, setAssignOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const utils = trpc.useUtils();
  const updateThread = trpc.communications.threads.update.useMutation({
    onSuccess: () => utils.communications.threadsByStatus.invalidate(),
  });
  const updateTags = trpc.communications.threadTags.update.useMutation({
    onSuccess: () => utils.communications.threadsByStatus.invalidate(),
  });
  const deleteThread = trpc.communications.threads.delete.useMutation({
    onSuccess: async () => {
      await utils.communications.threadsByStatus.invalidate();
    },
  });
  const { data: members } = trpc.teams.members.useQuery();
  // Snooze dialog via 's'
  useHotkeys(
    "s",
    (e: KeyboardEvent) => {
      e.preventDefault();
      setSnoozeOpen(true);
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      setSnoozeDefaultAt(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      );
    },
    { enableOnFormTags: true },
    [],
  );
  // Quick assign palette (press 'a')
  useHotkeys(
    "a",
    (e: KeyboardEvent) => {
      e.preventDefault();
      setAssignOpen(true);
    },
    { enableOnFormTags: true },
    [],
  );

  // Quick tags palette (press 't')
  useHotkeys(
    "t",
    (e: KeyboardEvent) => {
      e.preventDefault();
      setTagsOpen(true);
    },
    { enableOnFormTags: true },
    [],
  );
  const { data: allTags } = trpc.tags.list.useQuery();

  const [localTagIds, setLocalTagIds] = useState<string[]>(() => (message?.tags || []).map((t) => t.id));
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [snoozeDefaultAt, setSnoozeDefaultAt] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Sync when selected message changes
  useEffect(() => {
    setLocalTagIds((message?.tags || []).map((t) => t.id));
  }, [message?.assigneeId, message?.tags, message?.threadStatus]);

  // composer extracted

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: Date; messages: typeof messages }[] = [];
    let currentGroup: { date: Date; messages: typeof messages } | null = null;

    for (const msg of messages) {
      if (!(currentGroup && isSameDay(currentGroup.date, msg.createdAt))) {
        currentGroup = { date: msg.createdAt, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    }

    return groups;
  }, [messages]);

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  const accountDisconnected =
    (message?.accountStatus && message.accountStatus !== "connected") || false;

  const contactLabel = message
    ? message.platform === "email"
      ? message.emailAddress || message.customerName
      : message.platform === "instagram"
        ? message.instagramHandle || message.phoneNumber || message.customerName
        : message.phoneNumber || message.instagramHandle || message.customerName
    : null;

  const handleTranscriptDownload = (format: "html" | "csv") => {
    if (!threadId || typeof window === "undefined") return;
    const base = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    const url = `${base.replace(/\/$/, "")}/communications/threads/${threadId}/transcript?format=${format}`;
    window.open(url, "_blank", "noopener");
  };

  // composer extracted

  // Typing indicator presence watcher (Supabase presence)
  const [typingCount, setTypingCount] = useState(0);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const myPresenceKeyRef = useRef<string>("anonymous");
  useEffect(() => {
    if (!threadId) return;
    const supabase = createBrowserClient();
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id || `anon-${Math.random().toString(36).slice(2)}`;
        myPresenceKeyRef.current = uid;
        const channel = supabase.channel(`typing:thread:${threadId}`, {
          config: { presence: { key: uid } },
        });
        typingChannelRef.current = channel;
        const recompute = () => {
          try {
            const state = channel.presenceState();
            let count = 0;
            for (const [key, metas] of Object.entries(state)) {
              if (key === myPresenceKeyRef.current) continue;
              if (Array.isArray(metas) && metas.some((m: any) => m?.typing === true)) count++;
            }
            if (mounted) setTypingCount(count);
          } catch {}
        };
        channel.on("presence", { event: "sync" }, recompute);
        channel.on("presence", { event: "join" }, recompute);
        channel.on("presence", { event: "leave" }, recompute);
        await channel.subscribe();
        // initial
        recompute();
      } catch {}
    })();
    return () => {
      mounted = false;
      try {
        typingChannelRef.current?.unsubscribe();
      } catch {}
      typingChannelRef.current = null;
      setTypingCount(0);
    };
  }, [threadId]);

  // Socket.IO typing events (30s TTL)
  const { socket } = useRealtime();
  useEffect(() => {
    if (!socket || !threadId) return;
    const active = new Map<string, number>();
    let timer: any;
    const prune = () => {
      const now = Date.now();
      for (const [id, exp] of active.entries()) if (exp <= now) active.delete(id);
      setTypingCount((c) => Math.max(c, active.size));
      timer = setTimeout(prune, 2000);
    };
    const onOn = (p: any) => {
      const userId = p?.user?.id as string | undefined;
      const convId = p?.conversation?.id as string | undefined;
      if (!userId || convId !== threadId) return;
      active.set(userId, Date.now() + 30000);
      setTypingCount((c) => Math.max(c, active.size));
    };
    const onOff = (p: any) => {
      const userId = p?.user?.id as string | undefined;
      const convId = p?.conversation?.id as string | undefined;
      if (!userId || convId !== threadId) return;
      active.delete(userId);
      setTypingCount((c) => Math.max(0, active.size));
    };
    socket.on("conversation.typing_on", onOn);
    socket.on("conversation.typing_off", onOff);
    timer = setTimeout(prune, 2000);
    return () => {
      try { socket.off("conversation.typing_on", onOn); } catch {}
      try { socket.off("conversation.typing_off", onOff); } catch {}
      if (timer) clearTimeout(timer);
    };
  }, [socket, threadId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <InboxDetailsHeader
        message={message}
        onPrev={onPrev}
        onNext={onNext}
        index={index}
        total={total}
        members={(members || []) as any}
        onSnoozeCustom={() => {
          setSnoozeOpen(true);
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(9, 0, 0, 0);
          setSnoozeDefaultAt(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
          );
        }}
        onOpenTags={() => setTagsOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onDownload={(fmt) => handleTranscriptDownload(fmt)}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 overscroll-contain p-4" hideScrollbar ref={scrollRef}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div className="space-y-2">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation by sending a message</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMessages.map((group) => (
              <div className="space-y-4" key={group.date.getTime()}>
                {/* Date Separator */}
                <div className="flex items-center justify-center">
                  <div className="rounded-full bg-muted px-3 py-1 text-muted-foreground text-xs">
                    {formatDateSeparator(group.date)}
                  </div>
                </div>

                {/* Messages in this date group */}
                {group.messages.map((msg, msgIndex) => {
                  const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                  const showAvatar = !prevMsg || prevMsg.direction !== msg.direction;
                  const meta = msg.meta;
                  const isOutbound = msg.direction === "out";
                  const ccValues = isOutbound && meta?.cc ? meta.cc : undefined;
                  const bccValues = isOutbound && meta?.bcc ? meta.bcc : undefined;
                const subjectValue = meta?.subject && typeof meta.subject === "string" ? meta.subject.trim() : "";
                  const quotedText = deriveQuotedText(meta);

                  const senderLabel = !isOutbound
                    ? (meta?.senderName && meta.senderName.trim()) || (meta?.senderWaId && `+${meta.senderWaId}`) || null
                    : null;
                  return (
                    <div
                      className={cn(
                        "flex min-w-0 gap-2",
                        msg.direction === "in" ? "justify-start" : "justify-end",
                      )}
                      key={msg.id}
                    >
                      {msg.direction === "in" && showAvatar && (
                        <Avatar className="mt-1 h-8 w-8">
                          <AvatarImage src={message?.customerAvatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(message?.customerName || "?")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {msg.direction === "in" && !showAvatar && <div className="w-8" />}

                    <div
                      className={cn(
                        "max-w-[min(600px,calc(100%-theme(space.24)))] min-w-0 break-words rounded-lg px-4 py-2",
                        msg.direction === "in"
                          ? "bg-muted"
                          : "bg-primary text-primary-foreground",
                      )}
                      >
                        {senderLabel ? (
                          <div className="mb-1 text-[11px] font-medium text-foreground/80">{senderLabel}</div>
                        ) : null}
                        {ccValues && ccValues.length > 0 ? (
                          <MessageRecipientRow label="CC" values={ccValues} />
                        ) : null}
                        {bccValues && bccValues.length > 0 ? (
                          <MessageRecipientRow label="BCC" values={bccValues} />
                        ) : null}
                          {subjectValue ? (
                            <div className="mb-1 text-xs opacity-80">
                              <span className="font-semibold uppercase tracking-wide text-[10px]">Subject:</span>{" "}
                              <span className="font-normal normal-case text-xs">{subjectValue}</span>
                            </div>
                          ) : null}
                        {quotedText ? <QuotedPreview text={quotedText} /> : null}
                        <p className="max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm">
                          {msg.content}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
                          <span>{format(msg.createdAt, "HH:mm")}</span>
                          {msg.direction === "out" && (
                            <span className="ml-1">
                              {msg.readAt ? "✓✓" : msg.deliveredAt ? "✓" : "○"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Typing indicator */}
      {typingCount > 0 && (
        <div className="border-t bg-muted/40 px-4 py-1 text-[11px] text-muted-foreground">
          {typingCount === 1 ? "Someone is typing…" : `${typingCount} people are typing…`}
        </div>
      )}

      {/* Composer */}
      <Composer
        threadId={threadId}
        accountDisconnected={accountDisconnected}
        platform={message?.platform || null}
        contactEmail={message?.emailAddress || null}
      />

      <AssignDialog
        open={assignOpen}
        members={(members || []) as any}
        onAssign={(val) => {
          if (!threadId) return;
          updateThread.mutate({ id: threadId, assignedUserId: val });
        }}
        onClose={() => setAssignOpen(false)}
      />

      <SnoozeDialog
        open={snoozeOpen}
        defaultAt={snoozeDefaultAt}
        onApply={(iso) => {
          if (!threadId) return;
          updateThread.mutate({ id: threadId, status: "snoozed", snoozedUntil: iso });
          setSnoozeOpen(false);
        }}
        onClose={() => setSnoozeOpen(false)}
      />

      <TagsDialog
        open={tagsOpen}
        allTags={(allTags || []) as any}
        values={localTagIds}
        onApply={(ids) => {
          if (!threadId) return;
          updateTags.mutate({ threadId, tagIds: ids });
          setLocalTagIds(ids);
          setTagsOpen(false);
        }}
        onClose={() => setTagsOpen(false)}
      />

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation</DialogTitle>
            <DialogDescription>
              This will permanently delete this conversation and all its messages. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!threadId) return;
                await deleteThread.mutateAsync({ id: threadId });
                setDeleteOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

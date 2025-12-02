"use client";

import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { skipToken } from "@tanstack/react-query";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc/client";
import type { InboxMessage } from "@/types/inbox";
import { CustomerSidebar } from "../customer-sidebar";
import { createBrowserClient } from "@Faworra/supabase/client";
import type { SerializedThreadItem } from "@Faworra/database/serializers/communications";
import { InboxConversationProvider } from "./context";
import { ConversationListPane } from "./conversation-list-pane";
import { ConversationDetailPane } from "./conversation-detail-pane";
import { useRealtime } from "@/components/realtime/RealtimeProvider";

type OwnershipSnapshot = {
  all: number;
  mine: number;
  unassigned: number;
};

export type InboxShellProps = {
  initialThreads?: SerializedThreadItem[];
  initialOwnership?: OwnershipSnapshot | null;
};

export function InboxShell({ initialThreads = [], initialOwnership = null }: InboxShellProps) {
  const [status, setStatus] = useState<"open" | "pending" | "resolved" | "snoozed">("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "whatsapp" | "instagram" | "email">("all");
  const [accountIdFilter, setAccountIdFilter] = useState<string | "all">("all");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "unassigned" | string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [typeFilter, setTypeFilter] = useState<"all" | "unread" | "read" | "snoozed">("all");
  const [selectedIdsSet, setSelectedIdsSet] = useState<Set<string>>(new Set());
  const [bulkTagIds, setBulkTagIds] = useState<string[]>([]);
  const [bulkSnoozeOpen, setBulkSnoozeOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [archiveReadOpen, setArchiveReadOpen] = useState(false);
  const [archiveAllOpen, setArchiveAllOpen] = useState(false);
  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [markAllReadOpen, setMarkAllReadOpen] = useState(false);
  const [listAssignOpen, setListAssignOpen] = useState(false);
  const { toast } = useToast();
  const { socket } = useRealtime();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ open: boolean; x: number; y: number; id: string | null }>({
    open: false,
    x: 0,
    y: 0,
    id: null,
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const appliedViewRef = useRef<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Persist right sidebar state
  useEffect(() => {
    try {
      const raw = localStorage.getItem("inbox:sidebarOpen");
      if (raw === "false") setIsSidebarOpen(false);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("inbox:sidebarOpen", String(isSidebarOpen));
    } catch {}
  }, [isSidebarOpen]);

  // Load tags for filter
  const { data: tagsData } = trpc.tags.list.useQuery(undefined, { staleTime: 60_000 });
  const tagOptions = useMemo(
    () => (tagsData ?? []).map((t) => ({ id: t.id, label: t.name })),
    [tagsData],
  );
  const { data: accounts } = trpc.communications.accounts.useQuery();
  const { data: members } = trpc.teams.members.useQuery();
  const hasHealthIssues = useMemo(
    () => (accounts ?? []).some((a) => a.status !== "connected"),
    [accounts],
  );

  // Debounce search input slightly
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const h = setTimeout(() => setDebouncedQ(searchQuery.trim()), 250);
    return () => clearTimeout(h);
  }, [searchQuery]);

  // Initialize filters from URL on first render
  useEffect(() => {
    const sp = searchParams;
    if (!sp) return;
    const s = sp.get("status");
    const t = sp.get("type");
    const sort = sp.get("sort");
    const ch = sp.get("channel");
    const acc = sp.get("account");
    const asg = sp.get("assignee");
    const tags = sp.get("tags");
    const q = sp.get("q");
    if (s && ["open","pending","resolved","snoozed"].includes(s)) setStatus(s as any);
    if (t && ["all","unread","read","snoozed"].includes(t)) setTypeFilter(t as any);
    if (sort && ["asc","desc"].includes(sort)) setSortOrder(sort as any);
    if (ch && ["whatsapp","instagram","email"].includes(ch)) setPlatformFilter(ch as any);
    if (acc) setAccountIdFilter(acc as any);
    if (asg) setAssigneeFilter(asg as any);
    if (tags) setTagIds(tags.split(",").filter(Boolean));
    if (q) setSearchQuery(q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to URL
  useEffect(() => {
    const p = new URLSearchParams(searchParams?.toString());
    p.set("status", status);
    p.set("type", typeFilter);
    p.set("sort", sortOrder);
    if (platformFilter === "all") p.delete("channel"); else p.set("channel", platformFilter);
    if (accountIdFilter === "all") p.delete("account"); else p.set("account", String(accountIdFilter));
    if (assigneeFilter === "all") p.delete("assignee"); else p.set("assignee", String(assigneeFilter));
    if (tagIds.length === 0) p.delete("tags"); else p.set("tags", tagIds.join(","));
    if (!debouncedQ) p.delete("q"); else p.set("q", debouncedQ);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [status, typeFilter, sortOrder, platformFilter, accountIdFilter, assigneeFilter, tagIds, debouncedQ, router, pathname, searchParams]);

  // Load current user id (for Assign to me)
  useEffect(() => {
    (async () => {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getUser();
        setCurrentUserId(data.user?.id ?? null);
      } catch {}
    })();
  }, []);

  // Use tRPC's suspense infinite query directly to avoid proxy method mismatches
  const threadsInput = useMemo(
    () => ({
      status,
      limit: 50,
      sort: sortOrder,
      channel: platformFilter === "all" ? undefined : platformFilter,
      accountId: accountIdFilter === "all" ? undefined : (accountIdFilter as string),
      assigneeId:
        assigneeFilter === "all"
          ? undefined
          : assigneeFilter === "unassigned"
            ? null
            : (assigneeFilter as string),
      tagIds: tagIds,
      q: debouncedQ || undefined,
    }),
    [status, sortOrder, platformFilter, accountIdFilter, assigneeFilter, tagIds, debouncedQ],
  );

  const canUseInitialData =
    initialThreads.length > 0 &&
    status === "open" &&
    platformFilter === "all" &&
    assigneeFilter === "all" &&
    tagIds.length === 0 &&
    !debouncedQ;

  const computedInitialOwnership: OwnershipSnapshot = initialOwnership ?? {
    all: initialThreads.length,
    mine: 0,
    unassigned: initialThreads.filter((t) => !t.assignedUserId).length,
  };

  const [pages, { fetchNextPage, hasNextPage, isFetchingNextPage }] =
    trpc.communications.threadsByStatus.useSuspenseInfiniteQuery(
      threadsInput,
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
        // TanStack v5 shape for initialData
        initialData: canUseInitialData
          ? {
              pages: [
                {
                  status,
                  items: initialThreads,
                  nextCursor: null,
                  ownership: computedInitialOwnership,
                },
              ],
              pageParams: [null],
            }
          : undefined,
        // Provide initial cursor for the first page
        initialCursor: null,
      },
    );

  const rawThreads = useMemo(
    () => (pages?.pages || []).flatMap((p: any) => p?.items || []),
    [pages],
  );

  const items: InboxMessage[] = useMemo(() => {
    return (rawThreads || []).map((t: any) => {
      const provider = (t.account?.provider || "").toLowerCase();
      const fallbackContact = t.externalContactId ?? "";
      const looksLikeEmail = fallbackContact.includes("@");
      let platform: InboxMessage["platform"];
      if (provider.includes("email") || looksLikeEmail) {
        platform = "email";
      } else if (provider.includes("instagram") || t.instagramContact) {
        platform = "instagram";
      } else {
        platform = "whatsapp";
      }

      const customerName =
        t.whatsappContact?.displayName ||
        t.instagramContact?.displayName ||
        t.instagramContact?.username ||
        t.contact?.name ||
        fallbackContact;

      let phoneNumber: string | undefined;
      let instagramHandle: string | undefined;
      let emailAddress: string | undefined;

      if (platform === "email") {
        emailAddress = fallbackContact || undefined;
      } else if (platform === "instagram") {
        instagramHandle =
          t.instagramContact?.username ||
          t.instagramContact?.displayName ||
          fallbackContact ||
          undefined;
      } else {
        // For WhatsApp, prefer contact phone for 1:1; for groups we keep number hidden (name shows subject)
        const wa = t.contact?.whatsapp || t.whatsappContact?.phone || undefined;
        phoneNumber = wa || undefined;
      }

      let subject: string | undefined;
      let cc: string[] | undefined;
      let bcc: string[] | undefined;
      const lastMetaRaw = t.lastMessageMeta ?? null;
      let metaObj: any = null;
      if (lastMetaRaw) {
        if (typeof lastMetaRaw === "string") {
          try {
            metaObj = JSON.parse(lastMetaRaw);
          } catch {
            metaObj = null;
          }
        } else if (typeof lastMetaRaw === "object") {
          metaObj = lastMetaRaw;
        }
      }
      if (metaObj) {
        if (typeof metaObj.subject === "string" && metaObj.subject.trim()) {
          subject = metaObj.subject.trim();
        }
        if (Array.isArray(metaObj.cc)) {
          const list = metaObj.cc
            .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
            .filter((value: string) => value.length > 0);
          if (list.length) cc = Array.from(new Set(list));
        }
        if (Array.isArray(metaObj.bcc)) {
          const list = metaObj.bcc
            .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
            .filter((value: string) => value.length > 0);
          if (list.length) bcc = Array.from(new Set(list));
        }
      }

      const lastMessageStatus =
        typeof t.lastMessageStatus === "string" && t.lastMessageStatus
          ? t.lastMessageStatus
          : null;

      return {
        id: t.id,
        platform,
        accountStatus: t.account?.status ?? null,
        customerId: t.contact?.id || undefined,
        customerName,
        phoneNumber,
        instagramHandle,
        emailAddress,
        lastMessage: t.lastMessage || "",
        lastMessageTime: t.lastMessageAt ? new Date(t.lastMessageAt) : new Date(),
        lastDirection: t.lastDirection ?? null,
        lastMessageStatus,
        unreadCount: typeof t.unreadCount === "number" ? t.unreadCount : 0,
        status: t.status || "new",
        threadStatus: t.status || "open",
        snoozedUntil: t.snoozedUntil ?? null,
        assigneeId: t.assignedUserId ?? null,
        hasAttachment: false,
        messages: [],
        tags: Array.isArray(t.tags) ? t.tags : [],
        leadId: t.lead?.id ?? null,
        leadStatus: t.lead?.status ?? undefined,
        leadScore: typeof t.lead?.score === "number" ? t.lead.score : undefined,
        leadQualification: t.lead?.qualification ?? undefined,
        subject,
        cc,
        bcc,
      } as InboxMessage;
    });
  }, [rawThreads]);

  const selectedMessage = useMemo(
    () => items.find((m) => m.id === selectedId) || null,
    [items, selectedId],
  );

  // Mark as read when a conversation is opened
  const markRead = trpc.communications.messages.markRead.useMutation({
    async onMutate({ threadId }) {
      await utils.communications.threadsByStatus.cancel(threadsInput);
      const prev = utils.communications.threadsByStatus.getInfiniteData(threadsInput);
      utils.communications.threadsByStatus.setInfiniteData(threadsInput, (data) => {
        if (!data) return data as any;
        return {
          ...data,
          pages: data.pages.map((p) => ({
            ...p,
            items: p.items.map((it: any) =>
              it.id === threadId ? { ...it, unreadCount: 0 } : it,
            ),
          })),
        } as any;
      });
      return { prev } as const;
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.communications.threadsByStatus.setInfiniteData(threadsInput, ctx.prev);
    },
  });
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedId) return;
    setLocallyRead((s) => new Set(s).add(selectedId));
    markRead.mutate({ threadId: selectedId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Select first item when no selection present (avoid setState in render)
  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  // Server-side filtering is applied; use items directly, but adjust unread locally (read/unread overrides)
  const [locallyUnread, setLocallyUnread] = useState<Set<string>>(new Set());
  const filteredMessages = useMemo(() => {
    return items.map((it) => {
      let unread = it.unreadCount || 0;
      if (locallyRead.has(it.id)) unread = 0;
      if (locallyUnread.has(it.id)) unread = Math.max(1, unread);
      return { ...it, unreadCount: unread } as InboxMessage;
    });
  }, [items, locallyRead, locallyUnread]);

  // Apply type filter only; rely on server for sort to avoid conflicts with infinite scroll
  const displayMessages = useMemo(() => {
    let arr = [...filteredMessages];
    // Apply type filter (read/unread/snoozed)
    if (typeFilter === "read") arr = arr.filter((m) => (m.unreadCount || 0) === 0);
    else if (typeFilter === "unread") arr = arr.filter((m) => (m.unreadCount || 0) > 0);
    else if (typeFilter === "snoozed") arr = arr.filter((m) => m.threadStatus === "snoozed");
    return arr;
  }, [filteredMessages, typeFilter]);

  // Realtime: invalidate thread list on conversation updates
  const utils = trpc.useUtils();
  useEffect(() => {
    if (!socket) return;
    const invalidate = () => {
      try { utils.communications.threadsByStatus.invalidate(threadsInput); } catch {}
    };
    const u = () => invalidate();
    socket.on("message.created", u);
    socket.on("message.read", u);
    socket.on("conversation.updated", u);
    socket.on("conversation.status_changed", u);
    socket.on("conversation.read", u);
    socket.on("assignee.changed", u);
    return () => {
      try { socket.off("message.created", u); } catch {}
      try { socket.off("message.read", u); } catch {}
      try { socket.off("conversation.updated", u); } catch {}
      try { socket.off("conversation.status_changed", u); } catch {}
      try { socket.off("conversation.read", u); } catch {}
      try { socket.off("assignee.changed", u); } catch {}
    };
  }, [socket, threadsInput]);

  // Keyboard navigation
  useHotkeys(
    "up",
    (event) => {
      event.preventDefault();
      const currentIndex = displayMessages.findIndex((item) => item.id === selectedId);
      if (currentIndex > 0) {
        setSelectedId(displayMessages[currentIndex - 1].id);
      }
    },
    {
      enableOnFormTags: false,
    },
    [displayMessages, selectedId],
  );

  // Vim-style j/k
  useHotkeys(
    "j",
    (event) => {
      event.preventDefault();
      const currentIndex = displayMessages.findIndex((item) => item.id === selectedId);
      if (currentIndex < displayMessages.length - 1) {
        setSelectedId(displayMessages[currentIndex + 1].id);
      }
    },
    { enableOnFormTags: false },
    [displayMessages, selectedId],
  );
  useHotkeys(
    "k",
    (event) => {
      event.preventDefault();
      const currentIndex = displayMessages.findIndex((item) => item.id === selectedId);
      if (currentIndex > 0) {
        setSelectedId(displayMessages[currentIndex - 1].id);
      }
    },
    { enableOnFormTags: false },
    [displayMessages, selectedId],
  );

  useHotkeys(
    "down",
    (event) => {
      event.preventDefault();
      const currentIndex = displayMessages.findIndex((item) => item.id === selectedId);
      if (currentIndex < displayMessages.length - 1) {
        setSelectedId(displayMessages[currentIndex + 1].id);
      }
    },
    {
      enableOnFormTags: false,
    },
    [displayMessages, selectedId],
  );

  useHotkeys(
    "esc",
    () => {
      setSelectedId(null);
    },
    {
      enableOnFormTags: true,
    },
    [],
  );

  // Focus search with '/'
  useHotkeys(
    "/",
    (event) => {
      event.preventDefault();
      searchInputRef.current?.focus();
    },
    { enableOnFormTags: false },
    [],
  );

  // Toggle sidebar with keyboard
  useHotkeys(
    "ctrl+b,cmd+b",
    (event) => {
      event.preventDefault();
      setIsSidebarOpen((prev) => !prev);
    },
    {
      enableOnFormTags: false,
    },
    [],
  );

  // Apply Saved View from URL (?view=uuid)
  const viewId = searchParams?.get("view") || null;
  const { data: viewData } = trpc.communications.views.byId.useQuery(
    viewId ? { id: viewId } : skipToken,
  );
  // Pick up assignee filter from URL if present (supports values: "all", "unassigned", or user id)
  useEffect(() => {
    const a = searchParams?.get("assignee");
    if (!a) return;
    setAssigneeFilter(a as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  // Pick up type filter from URL (?type=read|unread|snoozed)
  useEffect(() => {
    const t = searchParams?.get("type");
    if (!t) return;
    if (t === "read" || t === "unread" || t === "snoozed" || t === "all") setTypeFilter(t as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  useEffect(() => {
    if (!viewId || !viewData) return;
    if (appliedViewRef.current === viewId) return;
    const f = (viewData.filter || {}) as Partial<{
      status: "open" | "pending" | "resolved" | "snoozed";
      channel: "whatsapp" | "instagram";
      tagIds: string[];
      q: string;
      assigneeId: string | null;
    }>;
    if (f.status) setStatus(f.status);
    if (f.channel) setPlatformFilter(f.channel as any);
    if (Array.isArray(f.tagIds)) setTagIds([...f.tagIds]);
    if (typeof f.q === "string") setSearchQuery(f.q);
    if (f.assigneeId === null) setAssigneeFilter("unassigned");
    else if (typeof f.assigneeId === "string") setAssigneeFilter(f.assigneeId);
    appliedViewRef.current = viewId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewId, viewData]);

  // URL sync for filters
  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString());
    sp.set("status", status);
    if (platformFilter === "all") sp.delete("channel");
    else sp.set("channel", platformFilter);
    if (tagIds.length > 0) sp.set("tags", tagIds.join(","));
    else sp.delete("tags");
    if (debouncedQ) sp.set("q", debouncedQ);
    else sp.delete("q");
    if (assigneeFilter === "all") sp.delete("assignee");
    else sp.set("assignee", assigneeFilter);
    if (typeFilter === "all") sp.delete("type");
    else sp.set("type", typeFilter);
    const url = `${pathname}?${sp.toString()}`;
    router.replace(url, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, platformFilter, tagIds, debouncedQ, assigneeFilter, typeFilter]);

  // Pinned quick views (localStorage-backed)
  const [pinnedViews, setPinnedViews] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("inbox:pinnedViews");
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(arr) ? arr.slice(0, 5) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("inbox:pinnedViews", JSON.stringify(pinnedViews.slice(0, 5)));
    } catch {}
  }, [pinnedViews]);
  const { data: allViews } = trpc.communications.views.list.useQuery();
  const pinnedMeta = useMemo(() => {
    const map = new Map((allViews ?? []).map((v) => [v.id, v]));
    return pinnedViews
      .map((id) => map.get(id))
      .filter((v): v is NonNullable<typeof v> => Boolean(v))
      .slice(0, 5);
  }, [allViews, pinnedViews]);
  const togglePin = (id: string) => {
    setPinnedViews((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur].slice(0, 5)));
  };

  // Save current filters as a view
  const createView = trpc.communications.views.create.useMutation({
    onSuccess: async () => {
      await utils.communications.views.list.invalidate();
    },
  });
  const saveCurrentAsView = async () => {
    const name = window.prompt("Save current filters as view", "My View");
    if (!name || !name.trim()) return;
    const filter: Record<string, unknown> = {
      status,
      channel: platformFilter === "all" ? undefined : platformFilter,
      tagIds,
      q: debouncedQ || undefined,
      assigneeId:
        assigneeFilter === "all"
          ? undefined
          : assigneeFilter === "unassigned"
            ? null
            : (assigneeFilter as string),
    };
    await createView.mutateAsync({ name: name.trim(), filter });
  };

  // Hotkey: resolve selected (e)
  const updateThread = trpc.communications.threads.update.useMutation({
    async onMutate(variables) {
      await utils.communications.threadsByStatus.cancel(threadsInput);
      const prev = utils.communications.threadsByStatus.getInfiniteData(threadsInput);
      const afterAssigneeMatches = (assignedUserId: string | null | undefined) => {
        const f = threadsInput.assigneeId;
        if (f === undefined) return true; // All
        if (f === null) return assignedUserId == null;
        return assignedUserId === f;
      };
      utils.communications.threadsByStatus.setInfiniteData(threadsInput, (data) => {
        if (!data) return data as any;
        return {
          ...data,
          pages: data.pages.map((p) => {
            let items = p.items as any[];
            items = items.map((it) =>
              it.id === variables.id
                ? {
                    ...it,
                    status: variables.status ?? it.status,
                    snoozedUntil:
                      variables.snoozedUntil === undefined
                        ? it.snoozedUntil
                        : variables.snoozedUntil,
                    assignedUserId:
                      variables.assignedUserId === undefined
                        ? it.assigneeId ?? it.assignedUserId ?? null
                        : variables.assignedUserId,
                  }
                : it,
            );
            // Remove if status moves out of current status view
            if (variables.status && variables.status !== threadsInput.status) {
              items = items.filter((it) => it.id !== variables.id);
            }
            // Remove if assignee moves out of current triage filter
            if (variables.assignedUserId !== undefined && !afterAssigneeMatches(variables.assignedUserId)) {
              items = items.filter((it) => it.id !== variables.id);
            }
            return { ...p, items };
          }),
        } as any;
      });
      return { prev } as const;
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.communications.threadsByStatus.setInfiniteData(threadsInput, ctx.prev);
    },
    onSuccess: async () => {
      await utils.communications.ownershipCounts.invalidate();
    },
  });
  const deleteThread = trpc.communications.threads.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.communications.threadsByStatus.invalidate(),
        utils.communications.ownershipCounts.invalidate(),
      ]);
    },
  });
  const deleteThreadsBulk = trpc.communications.threads.bulkDelete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.communications.threadsByStatus.invalidate(),
        utils.communications.ownershipCounts.invalidate(),
      ]);
    },
  });
  const archiveAllRead = trpc.communications.threads.archiveAllRead.useMutation({
    onSuccess: async (data) => {
      toast({ title: "Archived read conversations", description: `${data.count} conversation(s) archived.` });
      await Promise.all([
        utils.communications.threadsByStatus.invalidate(),
        utils.communications.ownershipCounts.invalidate(),
      ]);
    },
  });
  const archiveAll = trpc.communications.threads.archiveAll.useMutation({
    onSuccess: async (data) => {
      toast({ title: "Archived conversations", description: `${data.count} conversation(s) archived.` });
      await Promise.all([
        utils.communications.threadsByStatus.invalidate(),
        utils.communications.ownershipCounts.invalidate(),
      ]);
    },
  });
  const markAllRead = trpc.communications.threads.markAllRead.useMutation({
    onSuccess: async (data) => {
      toast({ title: "Marked as read", description: `${data.count} message(s) marked as read.` });
      await Promise.all([
        utils.communications.threadsByStatus.invalidate(),
        utils.communications.ownershipCounts.invalidate(),
      ]);
    },
  });
  const clearSelection = () => setSelectedIdsSet(new Set());
  const selectAllVisible = () => setSelectedIdsSet(new Set(displayMessages.map((m) => m.id)));
  const bulkResolve = async () => {
    const ids = Array.from(selectedIdsSet);
    if (ids.length === 0) return;
    await Promise.all(ids.map((id) => updateThread.mutateAsync({ id, status: "resolved" })));
    clearSelection();
  };

  const bulkAssignToMe = async () => {
    if (!currentUserId) return;
    const ids = Array.from(selectedIdsSet);
    if (ids.length === 0) return;
    await Promise.all(ids.map((id) => updateThread.mutateAsync({ id, assignedUserId: currentUserId })));
  };

  const bulkApplyTags = async (mode: "add" | "remove") => {
    if (bulkTagIds.length === 0) return;
    const ids = Array.from(selectedIdsSet);
    const map = new Map(items.map((m) => [m.id, new Set((m.tags || []).map((t) => t.id))]));
    const ops = ids.map((id) => {
      const cur = map.get(id) || new Set<string>();
      if (mode === "add") bulkTagIds.forEach((t) => cur.add(t));
      else bulkTagIds.forEach((t) => cur.delete(t));
      return updateThread.mutateAsync({ id, tagIds: Array.from(cur) });
    });
    await Promise.all(ops);
  };

  const snoozePreset = async (when: "1h" | "today-pm" | "tomorrow-9") => {
    const d = new Date();
    if (when === "1h") d.setHours(d.getHours() + 1);
    else if (when === "today-pm") {
      d.setHours(16, 0, 0, 0);
      if (d < new Date()) d.setDate(d.getDate() + 1);
    } else if (when === "tomorrow-9") {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    }
    const iso = d.toISOString();
    const ids = Array.from(selectedIdsSet);
    await Promise.all(ids.map((id) => updateThread.mutateAsync({ id, status: "snoozed", snoozedUntil: iso })));
  };
  useHotkeys(
    "e",
    (event) => {
      event.preventDefault();
      if (selectedId) updateThread.mutate({ id: selectedId, status: "resolved" });
    },
    { enableOnFormTags: true },
    [selectedId],
  );

  // Shortcut: m = assign to me; s = snooze tomorrow 9am
  useHotkeys(
    "m",
    (event) => {
      event.preventDefault();
      if (selectedId && currentUserId) updateThread.mutate({ id: selectedId, assignedUserId: currentUserId });
    },
    { enableOnFormTags: true },
    [selectedId, currentUserId],
  );
  // 's' handled in InboxDetails for snooze dialog

  // Realtime: subscribe to thread updates for current team
  const { data: currentTeam } = trpc.teams.current.useQuery();
  useEffect(() => {
    if (!currentTeam?.teamId) return;
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`threads:team:${currentTeam.teamId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "communication_threads",
          filter: `team_id=eq.${currentTeam.teamId}`,
        },
        (payload: any) => {
          const row = payload?.new;
          if (!row) return;
          utils.communications.threadsByStatus.setInfiniteData(threadsInput, (data: any) => {
            if (!data) return data;
            return {
              ...data,
              pages: (data.pages || []).map((p: any) => ({
                ...p,
                items: (p.items || []).map((it: any) =>
                  it.id === row.id
                    ? {
                        ...it,
                        status: row.status,
                        assignedUserId: row.assigned_user_id ?? null,
                        snoozedUntil: row.snoozed_until ?? null,
                      }
                    : it,
                ),
              })),
            };
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "communication_threads",
          filter: `team_id=eq.${currentTeam.teamId}`,
        },
        (payload: any) => {
          const row = payload?.old;
          if (!row) return;
          const delId = row.id as string;
          utils.communications.threadsByStatus.setInfiniteData(threadsInput, (data: any) => {
            if (!data) return data;
            return {
              ...data,
              pages: (data.pages || []).map((p: any) => ({
                ...p,
                items: (p.items || []).filter((it: any) => it.id !== delId),
              })),
            };
          });
          setSelectedIdsSet((prev) => {
            const next = new Set(prev);
            next.delete(delId);
            return next;
          });
          setSelectedId((cur) => (cur === delId ? null : cur));
        },
      )
      .subscribe();
    const msgs = supabase
      .channel(`messages:team:${currentTeam.teamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "communication_messages", filter: `team_id=eq.${currentTeam.teamId}` },
        (payload: any) => {
          const row = payload?.new;
          if (!row) return;
          const threadId = row.thread_id as string;
          const direction = row.direction as string;
          if (direction !== "in") return;
          utils.communications.threadsByStatus.setInfiniteData(threadsInput, (data: any) => {
            if (!data) return data;
            return {
              ...data,
              pages: (data.pages || []).map((p: any) => ({
                ...p,
                items: (p.items || []).map((it: any) =>
                  it.id === threadId ? { ...it, unreadCount: (it.unreadCount || 0) + 1, lastMessageAt: new Date().toISOString() } : it,
                ),
              })),
            };
          });
        },
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
      msgs.unsubscribe();
    };
  }, [currentTeam?.teamId, utils, threadsInput]);

  // Virtualizer for conversation list
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const bulkMode = selectedIdsSet.size > 0;
  const rowVirtualizer = useVirtualizer({
    count: displayMessages.length,
    getScrollElement: () => viewportRef.current,
    getItemKey: (index) => displayMessages[index]?.id ?? index,
    estimateSize: () => (bulkMode ? 92 : 72),
    measureElement: (el) => el?.getBoundingClientRect().height ?? (bulkMode ? 92 : 72),
    overscan: 8,
  });

  // Ownership counts (based on current filters, before applying ownership triage)
  const { data: ownership } = trpc.communications.ownershipCounts.useQuery(
    {
      status,
      channel: platformFilter === "all" ? undefined : platformFilter,
      accountId: accountIdFilter === "all" ? undefined : (accountIdFilter as string),
      tagIds,
      q: debouncedQ || undefined,
    },
    {
      initialData: canUseInitialData ? computedInitialOwnership : undefined,
    },
  );
  const localMineCount = useMemo(
    () => (currentUserId ? displayMessages.filter((m) => m.assigneeId === currentUserId).length : 0),
    [displayMessages, currentUserId],
  );
  const localUnassignedCount = useMemo(
    () => displayMessages.filter((m) => !m.assigneeId).length,
    [displayMessages],
  );
  const localAllCount = displayMessages.length;
  const mineCount = ownership?.mine ?? localMineCount;
  const unassignedCount = ownership?.unassigned ?? localUnassignedCount;
  const allCount = ownership?.all ?? localAllCount;

  const hasAnyFilter =
    platformFilter !== "all" ||
    tagIds.length > 0 ||
    assigneeFilter !== "all" ||
    Boolean(debouncedQ) ||
    status !== "open";

  const EmptyState = () => {
    // Distinct empty states based on reason
    if (debouncedQ) {
      return (
        <div className="flex flex-col items-center gap-3 p-8 text-center text-muted-foreground text-sm">
          <div>
            No results for <span className="text-foreground">“{debouncedQ}”</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSearchQuery("")}>Clear search</Button>
            <Button size="sm" variant="ghost" onClick={() => { setSearchQuery(""); setPlatformFilter("all"); setTagIds([]); setAssigneeFilter("all"); setStatus("open"); }}>Clear all</Button>
          </div>
        </div>
      );
    }
    if (hasAnyFilter) {
      return (
        <div className="flex flex-col items-center gap-3 p-8 text-center text-muted-foreground text-sm">
          <div>No conversations match your filters</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" onClick={() => { setSearchQuery(""); setPlatformFilter("all"); setTagIds([]); setAssigneeFilter("all"); setStatus("open"); }}>Clear filters</Button>
          </div>
        </div>
      );
    }
    if ((accounts?.length || 0) === 0) {
      return (
        <div className="flex flex-col items-center gap-3 p-8 text-center text-muted-foreground text-sm">
          <div>No channels connected</div>
          <a href="/inbox/settings"><Button size="sm">Connect channel</Button></a>
        </div>
      );
    }
    // Health banner is shown in the page header; avoid duplicating CTA here
    return (
      <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
        <div className="font-medium text-foreground">Inbox zero — you're all caught up</div>
        <div className="text-sm">New conversations will appear here</div>
      </div>
    );
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIdsSet((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // Auto-load next page when scrolled near end
  useEffect(() => {
    const vItems = rowVirtualizer.getVirtualItems();
    if (!vItems || vItems.length === 0) return;
    const last = vItems[vItems.length - 1];
    const nearEnd = last.index >= displayMessages.length - 5;
    if (nearEnd && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), displayMessages.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const contextValue = {
    selectedId,
    setSelectedId,
    filtersOpen,
    setFiltersOpen,
    status,
    setStatus,
    typeFilter,
    setTypeFilter,
    sortOrder,
    setSortOrder,
    platformFilter,
    setPlatformFilter,
    accountIdFilter,
    setAccountIdFilter,
    accounts,
    tagOptions,
    tagIds,
    setTagIds,
    assigneeFilter,
    setAssigneeFilter,
    currentUserId,
    mineCount,
    unassignedCount,
    allCount,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    selectedIdsSet,
    saveCurrentAsView,
    selectAllVisible,
    clearSelection,
    bulkMode,
    members,
    bulkTagIds,
    setBulkTagIds,
    bulkSnoozeOpen,
    setBulkSnoozeOpen,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    archiveReadOpen,
    setArchiveReadOpen,
    archiveAllOpen,
    setArchiveAllOpen,
    markAllReadOpen,
    setMarkAllReadOpen,
    listAssignOpen,
    setListAssignOpen,
    singleDeleteOpen,
    setSingleDeleteOpen,
    singleDeleteId,
    setSingleDeleteId,
    bulkAssignToMe,
    bulkApplyTags,
    bulkResolve,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    rowVirtualizer,
    displayMessages,
    toggleSelect,
    EmptyState,
    archiveAllRead,
    archiveAll,
    markAllRead,
    deleteThreadsBulk,
    deleteThread,
    updateThread,
    markRead,
    debouncedQ,
    setCtxMenu,
    ctxMenu,
    setLocallyRead,
    setLocallyUnread,
    viewportRef,
    selectedMessage,
  };

  return (
    <InboxConversationProvider value={contextValue}>
      <div className="flex h-full min-h-0 min-w-0 w-full overflow-hidden">
        <ConversationListPane />
        <ConversationDetailPane />
        {selectedMessage && (
          <>
            <div className="hidden items-start border-l p-2 md:flex">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => setIsSidebarOpen(!isSidebarOpen)} size="icon" variant="ghost">
                      {isSidebarOpen ? <MdChevronRight className="h-4 w-4" /> : <MdChevronLeft className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle details (Ctrl/Cmd+B)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isSidebarOpen && (
              <CustomerSidebar isOpen={isSidebarOpen} message={selectedMessage} onClose={() => setIsSidebarOpen(false)} />
            )}
            <div className="fixed right-4 bottom-4 z-40 md:hidden">
              <Button className="rounded-full shadow-lg" onClick={() => setIsSidebarOpen(true)} size="icon">
                <MdChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </InboxConversationProvider>
  );
}

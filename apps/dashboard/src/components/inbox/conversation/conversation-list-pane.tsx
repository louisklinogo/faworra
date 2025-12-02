"use client";

import { useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import Link from "next/link";
import { MdBookmarkBorder, MdMoreVert, MdSave, MdSearch, MdTune } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComboboxMulti } from "@/components/ui/combobox-multi";
import { cn } from "@/lib/utils";
import { ConversationVirtualRow } from "../conversation-virtual-row";
import { ThreadCard } from "@/app/(dashboard)/inbox/conversations/_components/thread-card";
import SnoozeDialog from "../snooze-dialog";
import AssignDialog from "../assign-dialog";
import type { InboxMessage } from "@/types/inbox";
import { useInboxConversation } from "./context";
import { InboxBulkActions } from "@/components/inbox/inbox-bulk-actions";

type TagOption = {
  id: string;
  label: string;
};

type ConversationListContext = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  filtersOpen: boolean;
  setFiltersOpen: Dispatch<SetStateAction<boolean>>;
  status: "open" | "pending" | "resolved" | "snoozed";
  setStatus: (value: "open" | "pending" | "resolved" | "snoozed") => void;
  typeFilter: "all" | "unread" | "read" | "snoozed";
  setTypeFilter: (value: "all" | "unread" | "read" | "snoozed") => void;
  sortOrder: "desc" | "asc";
  setSortOrder: (value: "desc" | "asc") => void;
  platformFilter: "all" | "whatsapp" | "instagram" | "email";
  setPlatformFilter: (value: "all" | "whatsapp" | "instagram" | "email") => void;
  accountIdFilter: string | "all";
  setAccountIdFilter: (value: string | "all") => void;
  accounts?: Array<any>;
  tagOptions: TagOption[];
  tagIds: string[];
  setTagIds: (ids: string[]) => void;
  assigneeFilter: "all" | "unassigned" | string;
  setAssigneeFilter: (value: "all" | "unassigned" | string) => void;
  currentUserId: string | null;
  mineCount: number;
  unassignedCount: number;
  allCount: number;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement>;
  selectedIdsSet: Set<string>;
  saveCurrentAsView: () => Promise<void> | void;
  selectAllVisible: () => void;
  clearSelection: () => void;
  bulkMode: boolean;
  members?: Array<any>;
  bulkTagIds: string[];
  setBulkTagIds: (ids: string[]) => void;
  bulkSnoozeOpen: boolean;
  setBulkSnoozeOpen: Dispatch<SetStateAction<boolean>>;
  bulkDeleteOpen: boolean;
  setBulkDeleteOpen: Dispatch<SetStateAction<boolean>>;
  archiveReadOpen: boolean;
  setArchiveReadOpen: Dispatch<SetStateAction<boolean>>;
  archiveAllOpen: boolean;
  setArchiveAllOpen: Dispatch<SetStateAction<boolean>>;
  markAllReadOpen: boolean;
  setMarkAllReadOpen: Dispatch<SetStateAction<boolean>>;
  listAssignOpen: boolean;
  setListAssignOpen: Dispatch<SetStateAction<boolean>>;
  singleDeleteOpen: boolean;
  setSingleDeleteOpen: Dispatch<SetStateAction<boolean>>;
  singleDeleteId: string | null;
  setSingleDeleteId: Dispatch<SetStateAction<string | null>>;
  bulkAssignToMe: () => Promise<void> | void;
  bulkApplyTags: (mode: "add" | "remove") => Promise<void> | void;
  bulkResolve: () => Promise<void> | void;
  fetchNextPage: () => Promise<unknown> | void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  rowVirtualizer: any;
  displayMessages: InboxMessage[];
  toggleSelect: (id: string, checked: boolean) => void;
  EmptyState: React.ComponentType;
  archiveAllRead: any;
  archiveAll: any;
  markAllRead: any;
  deleteThreadsBulk: any;
  deleteThread: any;
  updateThread: any;
  markRead: any;
  debouncedQ: string;
  setCtxMenu: Dispatch<SetStateAction<{ open: boolean; x: number; y: number; id: string | null }>>;
  ctxMenu: { open: boolean; x: number; y: number; id: string | null };
  setLocallyRead: Dispatch<SetStateAction<Set<string>>>;
  setLocallyUnread: Dispatch<SetStateAction<Set<string>>>;
  viewportRef: RefObject<HTMLDivElement>;
};

export function ConversationListPane() {
  const {
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
    saveCurrentAsView,
  } = useInboxConversation<ConversationListContext>();

  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-shrink-0 flex-col overflow-hidden border-r bg-background md:w-[340px] 2xl:w-[412px]",
        selectedId && "hidden md:flex",
      )}
    >
      <div className="flex-shrink-0 space-y-3 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium text-sm">Conversations</h2>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="Display">
                        <MdTune className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Display</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent align="start" className="w-[320px] p-3">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Status</div>
                    <Select onValueChange={(v: any) => setStatus(v)} value={status}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="snoozed">Snoozed</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="text-xs font-medium text-muted-foreground">Type</div>
                    <Select onValueChange={(v: any) => setTypeFilter(v)} value={typeFilter}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="unread">Unread only</SelectItem>
                        <SelectItem value="read">Read only</SelectItem>
                        <SelectItem value="snoozed">Snoozed only</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="text-xs font-medium text-muted-foreground">Sort</div>
                    <Select onValueChange={(v: any) => setSortOrder(v)} value={sortOrder}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest first</SelectItem>
                        <SelectItem value="asc">Oldest first</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="text-xs font-medium text-muted-foreground">Channel</div>
                    <Select onValueChange={(v: any) => setPlatformFilter(v)} value={platformFilter}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="text-xs font-medium text-muted-foreground">Inbox</div>
                    <Select onValueChange={(v: any) => setAccountIdFilter(v)} value={accountIdFilter as any}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All inboxes</SelectItem>
                        {(accounts || []).map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.displayName || `${a.provider} ${a.externalId?.slice(-4) ?? ""}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="text-xs font-medium text-muted-foreground">Tags</div>
                    <ComboboxMulti
                      items={tagOptions}
                      onChange={setTagIds}
                      placeholder="Filter by tags"
                      searchPlaceholder="Search tags..."
                      values={tagIds}
                    />

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPlatformFilter("all");
                          setAccountIdFilter("all");
                          setTagIds([]);
                        }}
                      >
                        Clear
                      </Button>
                      <Button size="sm" onClick={() => setFiltersOpen(false)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Options" size="icon" variant="ghost">
                    <MdMoreVert className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setMarkAllReadOpen(true)}>
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setArchiveReadOpen(true)}>
                    Archive all read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setArchiveAllOpen(true)}>
                    Archive all
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/inbox/views">
                    <Button size="icon" variant="ghost" aria-label="Views">
                      <MdBookmarkBorder className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Views</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Save view" onClick={saveCurrentAsView}>
                    <MdSave className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save current filters as view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <ToggleGroup
            className="rounded-md bg-accent p-1"
            onValueChange={(v) => {
              if (!v) return;
              if (v === "mine") setAssigneeFilter(currentUserId || "all");
              else setAssigneeFilter(v as any);
            }}
            type="single"
            value={
              assigneeFilter === "all"
                ? "all"
                : assigneeFilter === "unassigned"
                  ? "unassigned"
                  : assigneeFilter && currentUserId && assigneeFilter === currentUserId
                    ? "mine"
                    : "all"
            }
          >
            <ToggleGroupItem value="mine">
              <span className="inline-flex items-center gap-1">
                Mine
                <span className="ml-1 rounded-full bg-background px-1 text-[10px] text-muted-foreground">{mineCount}</span>
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem value="unassigned">
              <span className="inline-flex items-center gap-1">
                Unassigned
                <span className="ml-1 rounded-full bg-background px-1 text-[10px] text-muted-foreground">{unassignedCount}</span>
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem value="all">
              <span className="inline-flex items-center gap-1">
                All
                <span className="ml-1 rounded-full bg-background px-1 text-[10px] text-muted-foreground">{allCount}</span>
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
          <div />
        </div>

        <div className="relative">
          <MdSearch className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            ref={searchInputRef}
            value={searchQuery}
          />
        </div>
        <div className="mt-2" />
      </div>

      {selectedIdsSet.size > 0 && (
        <div className="flex-shrink-0 flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-xxs">
          <div className="flex items-center gap-3">
            <Button className="h-7 px-2 whitespace-nowrap hidden md:inline-flex" size="sm" variant="ghost" onClick={selectAllVisible}>
              Select all
            </Button>
            <Button className="h-7 px-2 whitespace-nowrap hidden md:inline-flex" size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
            <div className="flex h-7 items-center gap-2">
              <span className="inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-primary/15 px-1.5 text-xxs font-semibold text-primary border border-primary/20">
                {selectedIdsSet.size}
              </span>
              <span className="text-muted-foreground whitespace-nowrap">selected</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <InboxBulkActions
              ids={Array.from(selectedIdsSet)}
              members={(members || []) as any}
              currentUserId={currentUserId || undefined}
              onSnoozeCustom={() => setBulkSnoozeOpen(true)}
              onOpenTags={() => setTagsDialogOpen(true)}
            />
          </div>
        </div>
      )}

      <div ref={viewportRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="relative px-2 pb-2 pt-3" style={{ height: `${rowVirtualizer.getTotalSize() + 12}px` }}>
          {displayMessages.length === 0 ? (
            <EmptyState />
          ) : (
            rowVirtualizer.getVirtualItems().map((virtualRow: any) => {
              const message = displayMessages[virtualRow.index];
              const isChecked = selectedIdsSet.has(message.id);
              const isSelected = message.id === selectedId;
              const tagToken = (message.tags ?? [])
                .map((t) => `${t.id}:${t.name}`)
                .join("|");
              return (
                <ConversationVirtualRow
                  key={virtualRow.key}
                  virtualRow={virtualRow}
                  virtualizer={rowVirtualizer}
                  dependencies={[
                    message.lastMessage,
                    message.unreadCount,
                    tagToken,
                    message.subject,
                    message.threadStatus,
                    message.lastDirection,
                    message.lastMessageStatus,
                    message.snoozedUntil,
                    message.leadQualification,
                    message.leadScore,
                    bulkMode,
                    isChecked,
                  ]}
                >
                  <div className="px-4 pb-4">
                    <ThreadCard
                      bulkMode={bulkMode}
                      checked={isChecked}
                      isSelected={isSelected}
                      message={message}
                      onCheckedChange={(c) => toggleSelect(message.id, c)}
                      onClick={() => {
                        if (selectedIdsSet.size > 0) {
                          toggleSelect(message.id, !isChecked);
                          return;
                        }
                        setSelectedId(message.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, id: message.id });
                      }}
                    />
                  </div>
                </ConversationVirtualRow>
              );
            })
          )}
        </div>
        {hasNextPage && (
          <div className="px-2 pt-2">
            <Button
              className="w-full"
              disabled={!hasNextPage || isFetchingNextPage}
              onClick={() => fetchNextPage()}
              variant="ghost"
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={archiveReadOpen} onOpenChange={setArchiveReadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive all read</DialogTitle>
            <DialogDescription>
              Archive all read conversations across the current filters. This affects the full result set, not just the loaded page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiveReadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await archiveAllRead.mutateAsync({
                  status,
                  channel: platformFilter === "all" ? undefined : platformFilter,
                  accountId: accountIdFilter === "all" ? undefined : (accountIdFilter as string),
                  assigneeId:
                    assigneeFilter === "all"
                      ? undefined
                      : assigneeFilter === "unassigned"
                        ? null
                        : (assigneeFilter as string),
                  tagIds,
                  q: debouncedQ || undefined,
                });
                setArchiveReadOpen(false);
              }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={markAllReadOpen} onOpenChange={setMarkAllReadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark all as read</DialogTitle>
            <DialogDescription>
              Mark all unread messages as read across the current filters. This affects the full result set, not just the loaded page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMarkAllReadOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={markAllRead.isPending}
              onClick={async () => {
                await markAllRead.mutateAsync({
                  status,
                  channel: platformFilter === "all" ? undefined : platformFilter,
                  accountId: accountIdFilter === "all" ? undefined : (accountIdFilter as string),
                  assigneeId:
                    assigneeFilter === "all"
                      ? undefined
                      : assigneeFilter === "unassigned"
                        ? null
                        : (assigneeFilter as string),
                  tagIds,
                  q: debouncedQ || undefined,
                });
                setMarkAllReadOpen(false);
              }}
            >
              {markAllRead.isPending ? "Working…" : "Mark all as read"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveAllOpen} onOpenChange={setArchiveAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive all</DialogTitle>
            <DialogDescription>
              Archive all conversations across the current filters. This affects the full result set, not just the loaded page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiveAllOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await archiveAll.mutateAsync({
                  status,
                  channel: platformFilter === "all" ? undefined : platformFilter,
                  accountId: accountIdFilter === "all" ? undefined : (accountIdFilter as string),
                  assigneeId:
                    assigneeFilter === "all"
                      ? undefined
                      : assigneeFilter === "unassigned"
                        ? null
                        : (assigneeFilter as string),
                  tagIds,
                  q: debouncedQ || undefined,
                });
                setArchiveAllOpen(false);
              }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SnoozeDialog
        open={bulkSnoozeOpen}
        onApply={async (iso) => {
          const ids = Array.from(selectedIdsSet);
          if (!ids.length) return;
          await Promise.all(
            ids.map((id) => updateThread.mutateAsync({ id, status: "snoozed", snoozedUntil: iso })),
          );
          setBulkSnoozeOpen(false);
        }}
        onClose={() => setBulkSnoozeOpen(false)}
      />

      {/* Tags dialog for compact layouts */}
      <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk tags</DialogTitle>
            <DialogDescription>Select tags to apply or remove for selected conversations.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <ComboboxMulti
              items={tagOptions}
              onChange={setBulkTagIds}
              placeholder="Select tags"
              searchPlaceholder="Search tags..."
              values={bulkTagIds}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTagsDialogOpen(false)}>Close</Button>
            <Button variant="ghost" onClick={async () => { await bulkApplyTags("remove"); setTagsDialogOpen(false); }}>Remove</Button>
            <Button onClick={async () => { await bulkApplyTags("add"); setTagsDialogOpen(false); }}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversations</DialogTitle>
            <DialogDescription>
              Permanently delete the selected {selectedIdsSet.size} conversation(s)? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const ids = Array.from(selectedIdsSet);
                if (!ids.length) return;
                await deleteThreadsBulk.mutateAsync({ ids });
                clearSelection();
                setBulkDeleteOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={singleDeleteOpen} onOpenChange={setSingleDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation</DialogTitle>
            <DialogDescription>
              Permanently delete this conversation and all its messages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSingleDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!singleDeleteId) return;
                await deleteThread.mutateAsync({ id: singleDeleteId });
                if (selectedId === singleDeleteId) setSelectedId(null);
                setSingleDeleteOpen(false);
                setSingleDeleteId(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {ctxMenu.open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCtxMenu((s) => ({ ...s, open: false }))} />
          <div
            className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md"
            style={{ top: Math.max(8, ctxMenu.y), left: Math.max(8, ctxMenu.x) }}
          >
            <button
              className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                if (!ctxMenu.id) return;
                setSelectedId(ctxMenu.id);
                setCtxMenu((s) => ({ ...s, open: false }));
                setListAssignOpen(true);
              }}
            >
              Assign…
            </button>
            <button
              className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!currentUserId}
              onClick={() => {
                if (!ctxMenu.id || !currentUserId) return;
                updateThread.mutate({ id: ctxMenu.id, assignedUserId: currentUserId });
                setCtxMenu((s) => ({ ...s, open: false }));
              }}
            >
              Assign to me
            </button>
            <button
              className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={async () => {
                if (!ctxMenu.id) return;
                await markRead.mutateAsync({ threadId: ctxMenu.id });
                setLocallyRead((s) => {
                  const next = new Set(s);
                  next.add(ctxMenu.id!);
                  return next;
                });
                setLocallyUnread((s) => {
                  const next = new Set(s);
                  next.delete(ctxMenu.id!);
                  return next;
                });
                setCtxMenu((s) => ({ ...s, open: false }));
              }}
            >
              Mark as read
            </button>
            <button
              className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                if (!ctxMenu.id) return;
                setLocallyRead((s) => {
                  const next = new Set(s);
                  next.delete(ctxMenu.id!);
                  return next;
                });
                setLocallyUnread((s) => {
                  const next = new Set(s);
                  next.add(ctxMenu.id!);
                  return next;
                });
                setCtxMenu((s) => ({ ...s, open: false }));
              }}
            >
              Mark as unread
            </button>
            <button
              className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                if (!ctxMenu.id) return;
                setSelectedId(ctxMenu.id);
                setCtxMenu((s) => ({ ...s, open: false }));
                setTimeout(() => {
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "s" } as any));
                }, 0);
              }}
            >
              Snooze…
            </button>
            <button
              className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                if (!ctxMenu.id) return;
                setSelectedId(ctxMenu.id);
                setCtxMenu((s) => ({ ...s, open: false }));
                setTimeout(() => {
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "t" } as any));
                }, 0);
              }}
            >
              Tags…
            </button>
            <button
              className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                if (!ctxMenu.id) return;
                updateThread.mutate({ id: ctxMenu.id, status: "resolved" });
                setCtxMenu((s) => ({ ...s, open: false }));
              }}
            >
              Archive
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm text-destructive hover:bg-accent"
              onClick={() => {
                if (!ctxMenu.id) return;
                setSingleDeleteId(ctxMenu.id);
                setCtxMenu((s) => ({ ...s, open: false }));
                setSingleDeleteOpen(true);
              }}
            >
              Delete…
            </button>
          </div>
        </>
      )}

      <AssignDialog
        open={listAssignOpen}
        members={(members || []) as any}
        onAssign={(uid) => {
          if (!selectedId) return;
          updateThread.mutate({ id: selectedId, assignedUserId: uid });
        }}
        onClose={() => setListAssignOpen(false)}
      />
    </div>
  );
}

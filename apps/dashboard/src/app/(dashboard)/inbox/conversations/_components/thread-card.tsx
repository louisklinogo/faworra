"use client";

import { cn } from "@/lib/utils";
import type { ThreadCardProps } from "./types";
import { ThreadCardHeader } from "./thread-card-header";
import { ThreadCardBody } from "./thread-card-body";
import { ThreadCardFooter } from "./thread-card-footer";
import { conversationTimeLabel } from "./thread-helpers-ui";
import { useInboxConversation } from "@/components/inbox/conversation/context";

export function ThreadCard({
  message,
  isSelected,
  checked,
  bulkMode,
  onClick,
  onCheckedChange,
  onContextMenu,
}: ThreadCardProps) {
  const { accounts } = useInboxConversation<{ accounts?: Array<any> }>();
  const hasMetaRow = ((accounts?.length || 0) > 1) || Boolean(message.assigneeId);
  return (
    <div
      className={cn(
        "group relative flex w-full flex-col gap-3 rounded-md border border-border/80 bg-background p-5 text-[13px] shadow-sm transition-all overflow-hidden",
        // Subtle hover background like Chatwoot; no lift shadow
        "hover:bg-accent/40",
        isSelected && "border-primary/40 bg-primary/5 shadow-lg"
      )}
      role="button"
      tabIndex={0}
      onClick={() => {
        onClick();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      onContextMenu={onContextMenu}
    >
      {/* Top-right: time + unread pill (absolute, like Chatwoot) */}
      {(() => {
        const unread = message.unreadCount > 0 && message.lastDirection !== "out";
        const timestamp = conversationTimeLabel(message.lastMessageTime);
        return (
          <div className={`absolute right-3 ${hasMetaRow ? "top-8" : "top-4"} flex flex-col items-end gap-1 pointer-events-none`}>
            <span className="ml-auto font-normal leading-3 text-[10px] text-muted-foreground">
              {timestamp}
            </span>
            {unread ? (
              <span className="inline-flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-emerald-600 px-[4px] text-[9px] font-semibold text-white shadow-sm">
                {message.unreadCount > 9 ? "9+" : message.unreadCount}
              </span>
            ) : null}
          </div>
        );
      })()}
      <div className="flex items-start justify-between gap-3">
        <ThreadCardHeader
          message={message}
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        />
        {/* Removed top-right hover checkbox; selection handled over avatar overlay */}
      </div>
      <ThreadCardBody message={message} />
      <ThreadCardFooter message={message} />
    </div>
  );
}

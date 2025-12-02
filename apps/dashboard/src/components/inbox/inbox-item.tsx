import { formatDistanceToNow } from "date-fns";
import { Image, Mail } from "lucide-react";
import { RiInstagramFill, RiWhatsappFill } from "react-icons/ri";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { InboxMessage } from "@/types/inbox";

interface InboxItemProps {
  message: InboxMessage;
  isSelected: boolean;
  onClick: () => void;
  // Bulk selection support
  bulkMode?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function PlatformIcon({ platform }: { platform: "whatsapp" | "instagram" | "email" }) {
  const base = "flex items-center justify-center rounded-full bg-muted size-4";
  return (
    <div className={base}>
      {platform === "whatsapp" ? (
        <RiWhatsappFill className="text-muted-foreground" size={10} />
      ) : platform === "instagram" ? (
        <RiInstagramFill className="text-muted-foreground" size={10} />
      ) : (
        <Mail className="text-muted-foreground" size={10} />
      )}
    </div>
  );
}

function getLeadBadge(message: InboxMessage) {
  if (!(message.leadId && message.leadQualification)) return null;
  const base = "text-xs gap-1 rounded-full px-2 py-0.5";
  if (message.leadQualification === "hot") {
    return (
      <Badge className={cn(base, "border-red-200 bg-red-50 text-red-700")} variant="outline">
        HOT {typeof message.leadScore === "number" ? `(${message.leadScore})` : null}
      </Badge>
    );
  }
  if (message.leadQualification === "warm") {
    return (
      <Badge
        className={cn(base, "border-orange-200 bg-orange-50 text-orange-700")}
        variant="outline"
      >
        WARM {typeof message.leadScore === "number" ? `(${message.leadScore})` : null}
      </Badge>
    );
  }
  return (
    <Badge className={cn(base, "border-blue-200 bg-blue-50 text-blue-700")} variant="outline">
      COLD {typeof message.leadScore === "number" ? `(${message.leadScore})` : null}
    </Badge>
  );
}

function getStatusBadge(threadStatus?: "open" | "pending" | "resolved" | "snoozed") {
  if (!threadStatus) return null;
  const map: Record<string, string> = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    resolved: "bg-slate-50 text-slate-700 border-slate-200",
    snoozed: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <Badge
      className={cn("text-xs capitalize rounded-full px-2.5 py-0.5", map[threadStatus])}
      variant="outline"
    >
      {threadStatus}
    </Badge>
  );
}

function DeliveryStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const normalized = status.toLowerCase();
  if (normalized === "sent" || normalized === "delivered") {
    return (
      <Badge className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700" variant="outline">
        {normalized === "delivered" ? "Delivered" : "Sent"}
      </Badge>
    );
  }
  if (normalized === "queued" || normalized === "pending") {
    return (
      <Badge className="text-[10px] border-amber-200 bg-amber-50 text-amber-700" variant="outline">
        {normalized === "queued" ? "Queued" : "Pending"}
      </Badge>
    );
  }
  if (normalized === "bounced") {
    return (
      <Badge className="text-[10px] border-rose-200 bg-rose-50 text-rose-700" variant="outline">
        Bounced
      </Badge>
    );
  }
  if (normalized === "complained" || normalized === "dropped") {
    return (
      <Badge className="text-[10px] border-red-200 bg-red-50 text-red-700" variant="outline">
        {normalized === "complained" ? "Complaint" : "Dropped"}
      </Badge>
    );
  }
  if (normalized === "failed" || normalized === "error") {
    return (
      <Badge className="text-[10px] border-red-200 bg-red-50 text-red-700" variant="outline">
        Failed
      </Badge>
    );
  }
  return null;
}

function SLAIndicator({
  lastDirection,
  snoozedUntil,
  threadStatus,
}: {
  lastDirection?: "in" | "out" | null;
  snoozedUntil?: string | null;
  threadStatus?: "open" | "pending" | "resolved" | "snoozed";
}) {
  if (threadStatus === "snoozed" && snoozedUntil) {
    const d = new Date(snoozedUntil);
    const label = `Snoozed ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return (
      <Badge
        className={cn(
          "text-[10px] rounded-full border-violet-200 bg-violet-50 px-2 py-0.5 text-violet-700",
        )}
        variant="outline"
      >
        {label}
      </Badge>
    );
  }
  if (lastDirection === "in") {
    return (
      <Badge
        className="text-[10px] rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700"
        variant="outline"
      >
        Awaiting reply
      </Badge>
    );
  }
  return null;
}

function TagPills({ tags }: { tags?: { id: string; name: string; color?: string | null }[] }) {
  if (!tags || tags.length === 0) return null;
  const shown = tags.slice(0, 2);
  const extra = tags.length - shown.length;
  return (
    <div className="flex items-center gap-1">
      {shown.map((t) => (
        <Badge key={t.id} className="text-xs rounded-full px-2 py-0.5" variant="outline">
          {t.name}
        </Badge>
      ))}
      {extra > 0 && (
        <Badge className="text-xs rounded-full px-2 py-0.5" variant="outline">
          +{extra}
        </Badge>
      )}
    </div>
  );
}

export function InboxItem({
  message,
  isSelected,
  onClick,
  bulkMode: _bulkMode,
  checked,
  onCheckedChange,
}: InboxItemProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Container hosts nested interactive controls (checkbox, buttons).
    <div
      className={cn(
        "group flex w-full min-w-0 flex-col items-start gap-1.5 rounded-md bg-transparent p-0 text-left text-[13px] transition-colors",
        isSelected && "border border-primary/30 bg-primary/5 shadow-sm",
      )}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Row checkbox (always available for initiating bulk selection) */}
      <div className="mb-1 flex w-full min-w-0 items-center gap-2 px-4 pt-3">
        <Checkbox checked={!!checked} onCheckedChange={(v) => onCheckedChange?.(Boolean(v))} />
        <div className="flex-1" />
      </div>
      {/* Denser Row */}
      <div className="flex w-full min-w-0 items-start gap-2.5 px-4 pb-3 border-b border-border">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-[9px]">
            {(message.customerName || "?")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <PlatformIcon platform={message.platform} />
              <span className="min-w-0 truncate font-medium">{message.customerName}</span>
            </div>
            <div className="whitespace-nowrap text-muted-foreground text-[10px]">
              {formatDistanceToNow(message.lastMessageTime, { addSuffix: true })}
            </div>
          </div>
          {message.subject && (
            <div className="mt-0.5 line-clamp-1 text-[12px] font-medium text-foreground">
              {message.subject}
            </div>
          )}
          <div className="mt-0.5 line-clamp-1 break-words text-muted-foreground text-[12px]">
            {message.hasAttachment && <Image className="mr-1 inline h-3 w-3 align-[-2px]" />}
            {message.lastMessage || "No messages yet"}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
            <div className="flex min-w-0 flex-wrap items-center gap-2 truncate text-muted-foreground">
              {message.phoneNumber && <span className="truncate">{message.phoneNumber}</span>}
              {message.instagramHandle && (
                <span className="truncate">{message.instagramHandle}</span>
              )}
              {message.emailAddress && (
                <span className="truncate">{message.emailAddress}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {message.unreadCount > 0 && message.lastDirection !== "out" ? (
                <div className="flex h-4 min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 font-medium text-[10px] text-primary-foreground">
                  {message.unreadCount}
                </div>
              ) : null}
              {message.platform === "email" && message.lastDirection === "out" ? (
                <DeliveryStatusBadge status={message.lastMessageStatus} />
              ) : null}
              <SLAIndicator
                lastDirection={message.lastDirection}
                snoozedUntil={message.snoozedUntil}
                threadStatus={message.threadStatus}
              />
              <TagPills tags={message.tags} />
              {getLeadBadge(message)}
              {getStatusBadge(message.threadStatus)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

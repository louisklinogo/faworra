import { formatDistanceToNow } from "date-fns";
import { MdEmail } from "react-icons/md";
import { RiInstagramFill, RiWhatsappFill } from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import type { InboxMessage } from "./types";

export function conversationTimeLabel(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function initialsFor(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PlatformIcon({ platform }: { platform: InboxMessage["platform"] }) {
  const base = "flex items-center justify-center rounded-full bg-muted size-4";
  if (platform === "whatsapp") {
    return (
      <div className={base}>
        <RiWhatsappFill className="text-muted-foreground" size={10} />
      </div>
    );
  }
  if (platform === "instagram") {
    return (
      <div className={base}>
        <RiInstagramFill className="text-muted-foreground" size={10} />
      </div>
    );
  }
  return (
    <div className={base}>
      <MdEmail className="text-muted-foreground" size={10} />
    </div>
  );
}

export function LeadBadge({ message }: { message: InboxMessage }) {
  if (!(message.leadId && message.leadQualification)) return null;
  const score = typeof message.leadScore === "number" ? ` (${message.leadScore})` : "";
  const base = "text-xxs gap-1 rounded-full px-2 py-0.5";

  if (message.leadQualification === "hot") {
    return (
      <Badge className={`${base} border-red-200 bg-red-50 text-red-700`} variant="outline">
        HOT{score}
      </Badge>
    );
  }
  if (message.leadQualification === "warm") {
    return (
      <Badge className={`${base} border-orange-200 bg-orange-50 text-orange-700`} variant="outline">
        WARM{score}
      </Badge>
    );
  }
  return (
    <Badge className={`${base} border-blue-200 bg-blue-50 text-blue-700`} variant="outline">
      COLD{score}
    </Badge>
  );
}

export function StatusBadge({ status }: { status?: InboxMessage["threadStatus"] }) {
  if (!status) return null;
  const map: Record<string, string> = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    resolved: "bg-slate-50 text-slate-700 border-slate-200",
    snoozed: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <Badge className={`text-xxs capitalize rounded-full px-2.5 py-0.5 ${map[status] ?? ""}`} variant="outline">
      {status}
    </Badge>
  );
}

export function DeliveryStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const normalized = status.toLowerCase();
  if (normalized === "sent" || normalized === "delivered") {
    return (
      <Badge className="text-xxs border-emerald-200 bg-emerald-50 text-emerald-700" variant="outline">
        {normalized === "delivered" ? "Delivered" : "Sent"}
      </Badge>
    );
  }
  if (normalized === "queued" || normalized === "pending") {
    return (
      <Badge className="text-xxs border-amber-200 bg-amber-50 text-amber-700" variant="outline">
        {normalized === "queued" ? "Queued" : "Pending"}
      </Badge>
    );
  }
  if (normalized === "bounced") {
    return (
      <Badge className="text-xxs border-rose-200 bg-rose-50 text-rose-700" variant="outline">
        Bounced
      </Badge>
    );
  }
  if (normalized === "complained" || normalized === "dropped") {
    return (
      <Badge className="text-xxs border-red-200 bg-red-50 text-red-700" variant="outline">
        {normalized === "complained" ? "Complaint" : "Dropped"}
      </Badge>
    );
  }
  if (normalized === "failed" || normalized === "error") {
    return (
      <Badge className="text-xxs border-red-200 bg-red-50 text-red-700" variant="outline">
        Failed
      </Badge>
    );
  }
  return null;
}

export function SLAIndicator({ message }: { message: InboxMessage }) {
  if (message.threadStatus === "snoozed" && message.snoozedUntil) {
    const d = new Date(message.snoozedUntil);
    const label = `Snoozed ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return (
      <Badge
        className="text-xxs rounded-full border-violet-200 bg-violet-50 px-2 py-0.5 text-violet-700"
        variant="outline"
      >
        {label}
      </Badge>
    );
  }
  if (message.lastDirection === "in") {
    return (
      <Badge
        className="text-xxs rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700"
        variant="outline"
      >
        Awaiting reply
      </Badge>
    );
  }
  return null;
}

export function TagPills({ tags }: { tags?: { id: string; name: string; color?: string | null }[] }) {
  if (!tags || tags.length === 0) return null;
  const shown = tags.slice(0, 2);
  const extra = tags.length - shown.length;
  return (
    <div className="flex items-center gap-1">
      {shown.map((t) => (
        <Badge key={t.id} className="text-xxs rounded-full px-2 py-0.5" variant="outline">
          {t.name}
        </Badge>
      ))}
      {extra > 0 && (
        <Badge className="text-xxs rounded-full px-2 py-0.5" variant="outline">
          +{extra}
        </Badge>
      )}
    </div>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ThreadCardProps } from "./types";
import { PlatformIcon, initialsFor } from "./thread-helpers-ui";
import { useInboxConversation } from "@/components/inbox/conversation/context";
import { cn } from "@/lib/utils";

type ThreadCardHeaderProps = Pick<ThreadCardProps, "message"> & {
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
};

export function ThreadCardHeader({ message, checked, onCheckedChange }: ThreadCardHeaderProps) {
  const name = message.customerName || "Unknown contact";
  const { accounts, members } = useInboxConversation<{ accounts?: Array<any>; members?: Array<any> }>();
  const hasMultipleInboxes = (accounts?.length || 0) > 1;
  const assigneeName = (() => {
    const id = message.assigneeId;
    if (!id || !Array.isArray(members)) return null;
    const m = members.find((x: any) => x.id === id);
    return m?.fullName || m?.email || null;
  })();
  return (
    <div className="flex items-start gap-3">
      <Avatar className="group/avatar relative h-9 w-9">
        {message.customerAvatar ? (
          <AvatarImage alt={name} src={message.customerAvatar} />
        ) : null}
        <AvatarFallback className="text-[11px] uppercase">{initialsFor(name)}</AvatarFallback>
        {/* Channel/inbox badge overlay (parity with Chatwoot) */}
        <div className="absolute bottom-0 right-0 z-20 rounded-full bg-background p-[1px] ring-1 ring-border">
          <PlatformIcon platform={message.platform} />
        </div>
        {/* Selection overlay like Chatwoot */}
        <label
          className={cn(
            "absolute inset-0 z-10 hidden cursor-pointer items-center justify-center rounded-full backdrop-blur-[2px]",
            checked ? "flex" : "group-hover/avatar:flex"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="m-0"
            checked={!!checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </label>
      </Avatar>
      <div className="min-w-0 flex-1 pr-12">
        {(hasMultipleInboxes || assigneeName) && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="min-w-0 flex items-center gap-2">
              {hasMultipleInboxes && (
                <span className="truncate">{message.platform === "whatsapp" ? "WhatsApp" : message.platform === "instagram" ? "Instagram" : "Email"}</span>
              )}
            </div>
            {assigneeName && (
              <span className="flex-shrink-0 truncate">{assigneeName}</span>
            )}
          </div>
        )}
        <div className="mt-0.5 flex items-center gap-2 min-w-0">
          <span className="truncate font-medium text-sm text-foreground">{name}</span>
        </div>
        {message.subject ? (
          <div className="mt-1 line-clamp-1 text-[12px] font-medium text-foreground">
            {message.subject}
          </div>
        ) : null}
      </div>
    </div>
  );
}

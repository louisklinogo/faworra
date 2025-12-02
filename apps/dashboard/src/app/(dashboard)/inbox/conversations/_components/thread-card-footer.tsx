import type { ThreadCardProps } from "./types";
import {
  DeliveryStatusBadge,
  LeadBadge,
  SLAIndicator,
  StatusBadge,
  TagPills,
} from "./thread-helpers-ui";

type ThreadCardFooterProps = Pick<ThreadCardProps, "message">;

export function ThreadCardFooter({ message }: ThreadCardFooterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      {message.platform === "email" && message.lastDirection === "out" ? (
        <DeliveryStatusBadge status={message.lastMessageStatus} />
      ) : null}
      <SLAIndicator message={message} />
      <TagPills tags={message.tags} />
      <LeadBadge message={message} />
      <StatusBadge status={message.threadStatus} />
    </div>
  );
}

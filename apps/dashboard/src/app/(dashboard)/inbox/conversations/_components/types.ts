import type { MouseEvent } from "react";
import type { InboxMessage } from "@/types/inbox";

export type { InboxMessage };

export type ThreadCardProps = {
  message: InboxMessage;
  isSelected: boolean;
  checked: boolean;
  bulkMode?: boolean;
  onClick: () => void;
  onCheckedChange: (checked: boolean) => void;
  onContextMenu: (event: MouseEvent<HTMLDivElement>) => void;
};

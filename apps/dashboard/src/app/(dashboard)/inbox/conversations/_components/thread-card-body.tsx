import { MdImage } from "react-icons/md";
import type { ThreadCardProps } from "./types";

type ThreadCardBodyProps = Pick<ThreadCardProps, "message">;

export function ThreadCardBody({ message }: ThreadCardBodyProps) {
  return (
    <div className="text-muted-foreground text-[12px]">
      <div className="flex items-start gap-2">
        <div className="line-clamp-2 flex-1 break-words leading-relaxed pr-16">
          {message.hasAttachment && (
            <MdImage className="mr-1 inline h-3 w-3 align-[-2px] text-muted-foreground" />
          )}
          {message.lastMessage || "No messages yet"}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pr-16">
        {message.phoneNumber && <span className="truncate">{message.phoneNumber}</span>}
        {message.instagramHandle && <span className="truncate">{message.instagramHandle}</span>}
        {message.emailAddress && <span className="truncate">{message.emailAddress}</span>}
      </div>
    </div>
  );
}

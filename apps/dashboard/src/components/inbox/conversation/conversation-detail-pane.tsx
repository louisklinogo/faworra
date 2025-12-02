"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InboxDetails } from "../inbox-details";
import type { InboxMessage } from "@/types/inbox";
import { useInboxConversation } from "./context";

type ConversationDetailContext = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  displayMessages: InboxMessage[];
  selectedMessage: InboxMessage | null;
};

export function ConversationDetailPane() {
  const { selectedId, setSelectedId, displayMessages, selectedMessage } = useInboxConversation<ConversationDetailContext>();

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col", !selectedId && "hidden md:flex")}> 
      {selectedId ? (
        <>
          <div className="border-b p-2 md:hidden">
            <Button onClick={() => setSelectedId(null)} size="sm" variant="ghost">
              ← Back to conversations
            </Button>
          </div>
          <InboxDetails
            index={displayMessages.findIndex((m) => m.id === selectedId) + 1}
            message={selectedMessage}
            onNext={() => {
              const idx = displayMessages.findIndex((m) => m.id === selectedId);
              if (idx < 0) return;
              if (idx < displayMessages.length - 1) setSelectedId(displayMessages[idx + 1].id);
            }}
            onPrev={() => {
              const idx = displayMessages.findIndex((m) => m.id === selectedId);
              if (idx > 0) setSelectedId(displayMessages[idx - 1].id);
            }}
            total={displayMessages.length}
          />
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="space-y-2 text-center">
            <p className="font-medium text-lg">No conversation selected</p>
            <p className="text-sm">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}

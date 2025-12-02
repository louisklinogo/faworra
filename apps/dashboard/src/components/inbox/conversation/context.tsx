"use client";

import { createContext, useContext } from "react";

const InboxConversationContext = createContext<Record<string, unknown> | null>(null);

export const InboxConversationProvider = InboxConversationContext.Provider;

export function useInboxConversation<T>() {
  const ctx = useContext(InboxConversationContext);
  if (!ctx) {
    throw new Error("useInboxConversation must be used within InboxConversationProvider");
  }
  return ctx as T;
}

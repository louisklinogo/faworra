export type Platform = "whatsapp" | "instagram" | "email";

export type MessageStatus = "new" | "replied" | "pending" | "resolved";

export type MessageType = "text" | "image" | "video" | "document";

export type MessageSender = "customer" | "business";

export interface ConversationMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  type: MessageType;
  attachmentUrl?: string;
  deliveryStatus?: "sent" | "delivered" | "read";
}

export interface InboxMessage {
  id: string;
  platform: Platform;
  // Account connection status for the thread's channel
  accountStatus?: "connected" | "connecting" | "disconnected" | string | null;
  customerId?: string;
  customerName: string;
  customerAvatar?: string;
  phoneNumber?: string;
  instagramHandle?: string;
  emailAddress?: string;
  lastMessage: string;
  lastMessageTime: Date;
  lastDirection?: "in" | "out" | null;
  lastMessageStatus?: string | null;
  unreadCount: number;
  status: MessageStatus;
  // Server thread status (open/pending/resolved/snoozed)
  threadStatus?: "open" | "pending" | "resolved" | "snoozed";
  snoozedUntil?: string | null;
  assigneeId?: string | null;
  hasAttachment: boolean;
  messages: ConversationMessage[];
  tags?: { id: string; name: string; color?: string | null }[];
  // Optional lead info (server-enriched)
  leadId?: string | null;
  leadStatus?: "new" | "interested" | "qualified" | "converted" | "lost";
  leadScore?: number;
  leadQualification?: "hot" | "warm" | "cold";
  subject?: string;
  cc?: string[];
  bcc?: string[];
}

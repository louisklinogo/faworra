import { z } from "zod";

export const DirectionSchema = z.enum(["in", "out"]);
export const MessageTypeSchema = z.enum([
  "text",
  "image",
  "video",
  "audio",
  "document",
  "sticker",
]);

const DateLike = z.union([z.string(), z.date()]);

export const MessagePayloadSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  direction: DirectionSchema,
  type: MessageTypeSchema,
  content: z.string(),
  createdAt: DateLike,
  deliveredAt: DateLike.nullable().optional(),
  readAt: DateLike.nullable().optional(),
  status: z.string().min(1),
  meta: z.unknown().optional(),
});
export type MessagePayload = z.infer<typeof MessagePayloadSchema>;

export const MessageUpdateSchema = z
  .object({ id: z.string().min(1) })
  .and(MessagePayloadSchema.partial());

export const RTEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message.created"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
    message: MessagePayloadSchema,
  }),
  z.object({
    type: z.literal("message.updated"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
    message: MessageUpdateSchema,
  }),
  z.object({
    type: z.literal("message.read"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
  }),
  z.object({
    type: z.literal("conversation.updated"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
    conversation: z.unknown(),
  }),
  z.object({
    type: z.literal("conversation.status_changed"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
    conversation: z.unknown(),
  }),
  z.object({
    type: z.literal("conversation.read"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
    conversation: z.unknown(),
  }),
  z.object({
    type: z.literal("assignee.changed"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
    conversation: z.unknown(),
  }),
  z.object({
    type: z.literal("team.changed"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
    conversation: z.unknown(),
  }),
  z.object({
    type: z.literal("conversation.typing_on"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
    user: z.object({ id: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("conversation.typing_off"),
    teamId: z.string().min(1),
    threadId: z.string().min(1),
    user: z.object({ id: z.string().min(1) }),
  }),
]);

export type RTEvent = z.infer<typeof RTEventSchema>;
export type RTEventType = RTEvent["type"];

export function isRTEvent(input: unknown): input is RTEvent {
  return RTEventSchema.safeParse(input).success;
}

export function parseRTEvent(input: unknown): RTEvent {
  return RTEventSchema.parse(input);
}

export function validateRTEvent(input: unknown): { success: true; data: RTEvent } | { success: false; error: unknown } {
  const res = RTEventSchema.safeParse(input);
  if (res.success) return { success: true, data: res.data };
  return { success: false, error: res.error };
}

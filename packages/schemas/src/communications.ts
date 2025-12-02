import { z } from "zod";

export const SendMessageSchema = z.object({
  externalId: z.string().min(1),
  to: z.string().min(3),
  text: z.string().min(1),
  clientMessageId: z.string().min(1).optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

const MessageSignatureSchema = z
  .object({
    id: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
  })
  .optional();

export const MessageMetaSchema = z
  .object({
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    quotedHtml: z.string().optional(),
    quotedText: z.string().optional(),
    subject: z.string().trim().min(1).max(240).optional(),
    signature: MessageSignatureSchema,
  })
  .optional();
export type MessageMetaInput = z.infer<typeof MessageMetaSchema>;

export const SendThreadTextSchema = z.object({
  text: z.string().min(1),
  clientMessageId: z.string().min(1).optional(),
  meta: MessageMetaSchema,
});
export type SendThreadTextInput = z.infer<typeof SendThreadTextSchema>;

export const SendThreadMediaSchema = z.object({
  mediaPath: z.string().min(1),
  mediaType: z.string().min(1),
  caption: z.string().optional(),
  filename: z.string().optional(),
  clientMessageId: z.string().min(1).optional(),
  meta: MessageMetaSchema,
});
export type SendThreadMediaInput = z.infer<typeof SendThreadMediaSchema>;

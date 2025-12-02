import type { SupabaseClient } from "@supabase/supabase-js";
import type { OutboxJob } from "../services/outbox-helpers";

export type SendContext = {
  supabase: SupabaseClient;
  account: { id: string; provider: string; external_id: string; credentials_encrypted: string | null; display_name: string | null };
};

export type SendResult = { providerMessageId: string | null; msgType: string; threadId: string };

export interface SendProvider {
  name: string; // provider key in DB
  send(ctx: SendContext, job: OutboxJob): Promise<SendResult>;
}

const registry = new Map<string, SendProvider>();

export function registerProvider(p: SendProvider) {
  registry.set(p.name, p);
}

export function getProvider(name: string): SendProvider | undefined {
  return registry.get(name);
}

import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { createJobSupabaseClient } from "../../clients/supabase";

export const syncExchangeRates = schemaTask({
  id: "sync-exchange-rates",
  schema: z.object({ base: z.string(), targets: z.array(z.string()).min(1) }),
  maxDuration: 60,
  run: async ({ base, targets }) => {
    const supabase = createJobSupabaseClient();
    const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(targets.join(","))}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch rates: ${resp.status}`);
    interface RatesResponse { rates?: Record<string, number>; }
    const json = (await resp.json()) as RatesResponse;
    const rates: Record<string, number> = json.rates ?? {};
    const now = new Date().toISOString();
    const rows: Array<{ base: string; target: string; rate: number; updated_at: string }> = Object.entries(rates).map(([target, rate]) => ({ base: base.toUpperCase(), target: String(target).toUpperCase(), rate: Number(rate), updated_at: now }));
    if (rows.length === 0) return { updated: 0 };
    const { error } = await supabase
      .from("exchange_rates")
      .upsert(rows, { onConflict: "base,target" });
    if (error) throw error;
    return { updated: rows.length };
  },
});

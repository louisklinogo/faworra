import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { createJobSupabaseClient } from "../../../clients/supabase";

type TxnRow = {
  id: string;
  amount: number;
  currency: string;
  base_currency: string | null;
};

export const recomputeBaseAmounts = schemaTask({
  id: "recompute-base-amounts",
  schema: z.object({ teamId: z.string().uuid().optional() }),
  maxDuration: 600,
  run: async ({ teamId }) => {
    const supabase = createJobSupabaseClient();
    const pageSize = 1000;
    let totalUpdated = 0;
    let offset = 0;

    while (true) {
      let q = supabase
        .from("transactions")
        .select("id, amount, currency, base_currency")
        .is("base_amount", null)
        .not("base_currency", "is", null)
        .range(offset, offset + pageSize - 1);
      if (teamId) q = q.eq("team_id", teamId);
      const { data: rows, error } = await q;
      if (error) throw error;
      if (!rows || rows.length === 0) break;

      // Build updates with fetched rates
      const updates: Array<{
        id: string;
        base_amount: number | null;
        fx_rate_used: number | null;
        fx_source: string | null;
        fx_at: string | null;
      }> = [];

      for (const r of rows as TxnRow[]) {
        const base = r.base_currency;
        if (!base || base.toUpperCase() === r.currency.toUpperCase()) {
          updates.push({ id: r.id, base_amount: r.amount, fx_rate_used: null, fx_source: null, fx_at: null });
          continue;
        }
        const { data: rateRow } = await supabase
          .from("exchange_rates")
          .select("rate, updated_at")
          .eq("base", r.currency.toUpperCase())
          .eq("target", base.toUpperCase())
          .maybeSingle();
        const rr = (rateRow ?? null) as { rate: number | null; updated_at: string | null } | null;
        const rate = rr?.rate != null ? Number(rr.rate) : null;
        const updatedAt = rr?.updated_at ?? null;
        if (rate && Number.isFinite(rate)) {
          updates.push({
            id: r.id,
            base_amount: Number((Number(r.amount) * rate).toFixed(2)),
            fx_rate_used: rate,
            fx_source: "exchange_rates.table",
            fx_at: updatedAt ?? null,
          });
        } else {
          updates.push({ id: r.id, base_amount: null, fx_rate_used: null, fx_source: null, fx_at: null });
        }
      }

      // Upsert updates in chunks
      const CHUNK = 500;
      for (let i = 0; i < updates.length; i += CHUNK) {
        const chunk = updates.slice(i, i + CHUNK);
        const { error: upErr } = await supabase.from("transactions").upsert(chunk, { onConflict: "id" });
        if (upErr) throw upErr;
        totalUpdated += chunk.length;
      }

      if (rows.length < pageSize) break;
      offset += pageSize;
    }

    return { updated: totalUpdated };
  },
});

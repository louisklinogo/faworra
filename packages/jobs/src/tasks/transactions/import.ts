import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import Papa, { type Parser, type ParseResult } from "papaparse";
import { createJobSupabaseClient } from "../../clients/supabase";

const importSchema = z.object({
  teamId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  currency: z.string().min(3).max(3),
  filePath: z.array(z.string()),
  inverted: z.boolean().optional().default(false),
  mappings: z.object({ amount: z.string(), date: z.string(), description: z.string() }),
});

export const importTransactions = schemaTask({
  id: "import-transactions",
  schema: importSchema,
  maxDuration: 120,
  queue: { concurrencyLimit: 5 },
  run: async ({ teamId, bankAccountId, currency, filePath, mappings, inverted }) => {
    const supabase = createJobSupabaseClient();
    // Resolve team's base currency for FX conversion
    const { data: teamRow } = await supabase
      .from("teams")
      .select("base_currency")
      .eq("id", teamId)
      .maybeSingle();
    const teamBase = (teamRow && typeof teamRow === "object" ? (teamRow as { base_currency: string | null }).base_currency ?? undefined : undefined);
    let fxRate: number | null = null;
    let fxSource: string | null = null;
    let fxAt: string | null = null;
    if (teamBase && teamBase.toUpperCase() !== currency.toUpperCase()) {
      const { data: rateRow } = await supabase
        .from("exchange_rates")
        .select("rate, updated_at")
        .eq("base", currency.toUpperCase())
        .eq("target", teamBase.toUpperCase())
        .maybeSingle();
      if (rateRow && typeof rateRow === "object") {
        const r = (rateRow as { rate: number | null; updated_at: string | null }).rate;
        fxRate = r != null ? Number(r) : null;
        fxAt = (rateRow as { updated_at: string | null }).updated_at ?? null;
        fxSource = fxRate != null ? "exchange_rates.table" : null;
      }
    }
    // If rate missing, fetch on-demand and upsert once
    if (teamBase && teamBase.toUpperCase() !== currency.toUpperCase() && (fxRate == null || !Number.isFinite(fxRate))) {
      try {
        const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(currency.toUpperCase())}&symbols=${encodeURIComponent(teamBase.toUpperCase())}`;
        const resp = await fetch(url);
        if (resp.ok) {
          interface RatesResponse { rates?: Record<string, number> }
          const json = (await resp.json()) as RatesResponse;
          const rate = Number(json.rates?.[teamBase.toUpperCase()]);
          if (Number.isFinite(rate) && rate > 0) {
            const now = new Date().toISOString();
            await supabase
              .from("exchange_rates")
              .upsert({ base: currency.toUpperCase(), target: teamBase.toUpperCase(), rate, updated_at: now }, { onConflict: "base,target" });
            fxRate = rate;
            fxSource = "exchangerate.host";
            fxAt = now;
          }
        }
      } catch {}
    }
    const { data: fileData, error } = await supabase.storage.from("vault").download(filePath.join("/"));
    if (error || !fileData) throw new Error("Failed to download CSV from storage");
    const content = await fileData.text();
    if (!content) throw new Error("Empty CSV content");

    const BATCH_SIZE = 500;
    type InsertTxnRow = {
      team_id: string;
      account_id: string;
      amount: number;
      currency: string;
      base_currency: string | null;
      base_amount: number | null;
      fx_rate_used: number | null;
      fx_source: string | null;
      fx_at: string | null;
      date: string;
      description: string;
      name: string;
      internal_id: string;
      transaction_number: string;
      status: "completed" | "pending" | "failed" | "cancelled";
      manual: boolean;
      type: "payment" | "expense" | "refund" | "adjustment";
      transaction_date: string;
      exclude_from_analytics: boolean;
    };
    const upsertBatch = async (rows: InsertTxnRow[]) => {
      if (!rows.length) return;
      const { error } = await supabase
        .from("transactions")
        .upsert(rows, { onConflict: "internal_id", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;
    };

    function fmtAmount(s: string): number {
      const norm = s.replace(/−/g, "-");
      if (norm.includes(",")) return +norm.replace(/\./g, "").replace(",", ".");
      if (/\.\d{2}$/.test(norm)) return +norm.replace(/\.(?=\d{3})/g, "");
      return +norm;
    }

    const toDateOnly = (s: string): string | undefined => {
      try {
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch {}
      return undefined;
    };

    let buffer: InsertTxnRow[] = [];
    await new Promise<void>((resolve, reject) => {
      type Row = Record<string, string>;
      Papa.parse<Row>(content as string, {
        header: true,
        skipEmptyLines: true,
        worker: false,
        chunk: async (chunk: ParseResult<Row>, parser: Parser) => {
          parser.pause();
          const now = Date.now();
          for (const row of chunk.data) {
            const rawAmount = row[mappings.amount];
            const rawDate = row[mappings.date];
            const desc = row[mappings.description] ?? "";
            if (rawAmount == null || rawDate == null) continue;
            const amountNum = fmtAmount(String(rawAmount));
            if (Number.isNaN(amountNum)) continue;
            const date = toDateOnly(String(rawDate));
            if (!date) continue;
            const signed = inverted ? amountNum * -1 : amountNum;
            const type = signed < 0 ? "expense" : "payment";
            const absAmount = Math.abs(signed);
            const internalId = `imp-${teamId}-${bankAccountId}-${now}-${buffer.length}`;
            const transaction_number = `TX-${now}-${Math.random().toString(36).slice(2, 6)}`;
            const baseCurrencyUpper = teamBase ? teamBase.toUpperCase() : null;
            const base_currency = baseCurrencyUpper;
            const base_amount = baseCurrencyUpper === null
              ? null
              : baseCurrencyUpper === currency.toUpperCase()
                ? absAmount
                : fxRate != null
                  ? Number((absAmount * fxRate).toFixed(2))
                  : null;
            buffer.push({
              team_id: teamId,
              account_id: bankAccountId,
              amount: absAmount,
              currency,
              base_currency: base_currency ?? null,
              base_amount: base_amount ?? null,
              fx_rate_used: base_amount !== null ? fxRate : null,
              fx_source: base_amount !== null ? fxSource : null,
              fx_at: base_amount !== null ? fxAt : null,
              date,
              description: desc,
              name: desc || transaction_number,
              internal_id: internalId,
              transaction_number,
              status: "completed",
              manual: true,
              type,
              transaction_date: new Date().toISOString(),
              exclude_from_analytics: false,
            });
            if (buffer.length >= BATCH_SIZE) {
              await upsertBatch(buffer);
              buffer = [];
            }
          }
          await upsertBatch(buffer);
          buffer = [];
          parser.resume();
        },
        complete: () => resolve(),
        error: (e: Error) => reject(e),
      });
    });
  },
});

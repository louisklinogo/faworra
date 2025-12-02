import type { InferSelectModel } from "drizzle-orm";
import { and, eq, sql } from "drizzle-orm";
import { exchangeRates } from "../schema";
import type { DbClient } from "../client";

type ExchangeRate = InferSelectModel<typeof exchangeRates>;
export async function upsertRates(db: DbClient, base: string, rates: Record<string, number>) {
  const rows = Object.entries(rates).map(([target, rate]) => ({ base, target, rate, updatedAt: new Date() }));
  if (rows.length === 0) return { inserted: 0 };
  await db
    .insert(exchangeRates)
    .values(rows)
    .onConflictDoUpdate({
      target: [exchangeRates.base, exchangeRates.target],
      set: { rate: sql`excluded.rate`, updatedAt: sql`excluded.updated_at` },
    });
  return { inserted: rows.length };
}

export async function getRate(db: DbClient, base: string, target: string): Promise<number | null> {
  if (!base || !target || base.toUpperCase() === target.toUpperCase()) return 1;
  const rows: Array<{ rate: ExchangeRate["rate"] }> = await db
    .select({ rate: exchangeRates.rate })
    .from(exchangeRates)
    .where(and(eq(exchangeRates.base, base.toUpperCase()), eq(exchangeRates.target, target.toUpperCase())))
    .limit(1);
  const r = rows[0]?.rate;
  return r != null ? Number(r) : null;
}

export async function convert(db: DbClient, amount: number, base: string, target: string): Promise<number | null> {
  if (!Number.isFinite(amount)) return null;
  const rate = await getRate(db, base, target);
  if (rate == null) return null;
  return Number((amount * rate).toFixed(2));
}

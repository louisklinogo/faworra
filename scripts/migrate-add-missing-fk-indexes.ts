#!/usr/bin/env bun

import "dotenv/config";
import { Client } from "pg";

type FK = {
  conid: number;
  schema: string;
  table: string;
  conname: string;
  cols: string[];
};

function makeIndexName(table: string, cols: string[]): string {
  const base = `idx_${table}_${cols.join("_")}_fk`;
  if (base.length <= 60) return base;
  const hash = Buffer.from(base).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
  const shortCols = cols.map((c) => c.slice(0, 3)).join("_");
  return `idx_${table.slice(0, 20)}_${shortCols}_fk_${hash}`.slice(0, 60);
}

async function listFks(client: Client): Promise<FK[]> {
  const q = `
    WITH fks AS (
      SELECT con.oid AS conid, con.conname, ns.nspname AS schema, rel.relname AS tbl,
             array_agg(att.attname ORDER BY u.ord) AS cols
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
      JOIN unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord) ON true
      JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = u.attnum
      WHERE con.contype = 'f' AND ns.nspname = 'public'
      GROUP BY con.oid, con.conname, ns.nspname, rel.relname
    )
    SELECT conid, schema, tbl AS table, conname, cols FROM fks ORDER BY schema, tbl, conname;
  `;
  const res = await client.query(q);
  return res.rows.map((r) => {
    let cols: string[] = [];
    if (Array.isArray(r.cols)) cols = r.cols as string[];
    else if (typeof r.cols === "string") {
      const t = (r.cols as string).trim();
      const inner = t.startsWith("{") && t.endsWith("}") ? t.slice(1, -1) : t;
      cols = inner ? inner.split(",").map((s) => s.replace(/^"|"$/g, "")) : [];
    }
    return {
      conid: Number(r.conid),
      schema: r.schema,
      table: r.table,
      conname: r.conname,
      cols,
    } as FK;
  });
}

async function tableIndexes(client: Client, table: string) {
  const q = `
    SELECT ci.relname AS index_name,
           array_agg(a.attname ORDER BY k.ord) FILTER (WHERE a.attname IS NOT NULL) AS cols
    FROM pg_class t
    JOIN pg_namespace ns ON ns.oid = t.relnamespace
    JOIN pg_index i ON i.indrelid = t.oid
    JOIN pg_class ci ON ci.oid = i.indexrelid
    LEFT JOIN unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
    LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
    WHERE ns.nspname = 'public' AND t.relname = $1
    GROUP BY ci.relname
  `;
  const res = await client.query(q, [table]);
  return res.rows as { index_name: string; cols: string[] | null }[];
}

function hasCoveringIndex(indexes: { index_name: string; cols: string[] | null }[], fkCols: string[]) {
  for (const idx of indexes) {
    const cols = idx.cols || [];
    if (!cols.length) continue;
    if (cols.length < fkCols.length) continue;
    let ok = true;
    for (let i = 0; i < fkCols.length; i++) {
      if (cols[i] !== fkCols[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

async function main() {
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ Missing SUPABASE_DB_URL or DATABASE_URL in environment");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const fks = await listFks(client);
    let created = 0;
    for (const fk of fks) {
      const idxs = await tableIndexes(client, fk.table);
      if (hasCoveringIndex(idxs, fk.cols)) {
        console.log(`SKIP ${fk.table}.${fk.conname} -> existing covering index`);
        continue;
      }
      const idxName = makeIndexName(fk.table, fk.cols);
      const colsSql = fk.cols.map((c) => `"${c}"`).join(", ");
      const sql = `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${idxName} ON public."${fk.table}" (${colsSql})`;
      console.log("Applying:", sql);
      try {
        await client.query(sql);
        created++;
      } catch (e) {
        console.error(`Failed to create index for ${fk.table}.${fk.conname}:`, (e as Error).message);
      }
    }
    console.log(`✅ Done. Created ${created} index(es).`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

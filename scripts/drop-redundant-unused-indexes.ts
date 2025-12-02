#!/usr/bin/env bun

import "dotenv/config";
import { Client } from "pg";

type Idx = {
  table: string;
  name: string;
  cols: string[];
  method: string;
  where: string | null;
  scan: number;
};

async function getIndexes(client: Client): Promise<Record<string, Idx[]>> {
  const q = `
    SELECT
      cls.relname AS table,
      idxcls.relname AS name,
      am.amname AS method,
      s.idx_scan AS scan,
      pg_get_expr(i.indpred, i.indrelid) AS where,
      ARRAY(
        SELECT a.attname
        FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        ORDER BY k.ord
      ) AS cols
    FROM pg_index i
    JOIN pg_class idxcls ON idxcls.oid = i.indexrelid
    JOIN pg_am am ON am.oid = idxcls.relam
    JOIN pg_class cls ON cls.oid = i.indrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.indexrelid
    LEFT JOIN pg_constraint c ON c.conindid = i.indexrelid
    WHERE ns.nspname = 'public' AND c.conindid IS NULL
  `;
  const res = await client.query(q);
  const map: Record<string, Idx[]> = {};
  for (const r of res.rows) {
    const x: Idx = {
      table: r.table,
      name: r.name,
      method: r.method,
      scan: Number(r.scan || 0),
      where: r.where || null,
      cols: (r.cols as string[]) || [],
    };
    (map[x.table] ||= []).push(x);
  }
  return map;
}

function sameCols(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function shouldExclude(idx: Idx) {
  // Keep GIN/GiST and trgm/FTS/GIN indexes; keep partial indexes
  if (idx.method !== "btree") return true;
  if (idx.where) return true;
  if (/trgm|fts|gin/i.test(idx.name)) return true;
  return false;
}

async function main() {
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ Missing SUPABASE_DB_URL or DATABASE_URL");
    process.exit(1);
  }
  if (process.env.CONFIRM_DROP_UNUSED !== "1") {
    console.error("❌ Set CONFIRM_DROP_UNUSED=1 to enable drops.");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const byTable = await getIndexes(client);
    const toDrop: { table: string; name: string }[] = [];

    for (const [table, list] of Object.entries(byTable)) {
      // Candidate unused btree indexes
      const unused = list.filter((i) => i.scan === 0 && !shouldExclude(i));
      if (!unused.length) continue;
      for (const idx of unused) {
        // If there is another index on same table with identical columns
        const dup = list.find((j) => j.name !== idx.name && sameCols(j.cols, idx.cols) && j.method === idx.method);
        if (!dup) continue;
        // Prefer keeping fk-named index or any index that has scans
        const keep = /_fk$/.test(dup.name) || dup.scan > 0 || /^idx_/.test(dup.name);
        const dropCandidate = keep ? idx : dup.scan === 0 ? dup : idx;
        if (!toDrop.find((d) => d.name === dropCandidate.name)) toDrop.push({ table, name: dropCandidate.name });
      }
    }

    if (!toDrop.length) {
      console.log("No redundant unused indexes to drop.");
      return;
    }

    for (const d of toDrop) {
      const sql = `DROP INDEX CONCURRENTLY IF EXISTS ${d.name}`;
      console.log("Dropping:", sql);
      try {
        await client.query(sql);
      } catch (e) {
        console.error(`Failed to drop ${d.name}:`, (e as Error).message);
      }
    }
    console.log(`✅ Dropped ${toDrop.length} index(es).`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

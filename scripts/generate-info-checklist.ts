#!/usr/bin/env bun

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

type Row = { name: string; title: string; description: string; detail: string; metadata: string };

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  if (!header) return [];
  const rows: Row[] = [];
  for (const line of lines) {
    const parts: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        parts.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    parts.push(cur);
    const [name, title, , , , description, detail, , metadata] = parts;
    rows.push({ name, title, description, detail, metadata });
  }
  return rows;
}

async function fetchExistingCovering(client: Client, table: string, cols: string[]) {
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
    GROUP BY ci.relname`;
  const res = await client.query(q, [table]);
  for (const r of res.rows) {
    const arr: string[] = r.cols || [];
    if (arr.length < cols.length) continue;
    let ok = true;
    for (let i = 0; i < cols.length; i++) if (arr[i] !== cols[i]) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}

async function main() {
  const csvPath = path.resolve(
    process.cwd(),
    "docs",
    "schema-issues",
    "Supabase Performance Security Info(zvatkstmsyuytbajzuvn).csv",
  );
  const outPath = path.resolve(
    process.cwd(),
    "docs",
    "schema-issues",
    "Supabase Performance Security Info(zvatkstmsyuytbajzuvn).checklist.md",
  );
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(text);

  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  const client = url ? new Client({ connectionString: url }) : null;
  if (client) await client.connect();

  const fkItems: string[] = [];
  const unusedItems: string[] = [];
  for (const r of rows) {
    if (r.name === "unindexed_foreign_keys") {
      try {
        const meta = JSON.parse(r.metadata);
        const table = meta.name as string;
        const con = meta.fkey_name as string;
        // We don't have column names directly; infer from description or fetch from pg
        let done = false;
        if (client) {
          const q = `SELECT array_agg(att.attname ORDER BY u.ord) AS cols
                     FROM pg_constraint con
                     JOIN pg_class rel ON rel.oid = con.conrelid
                     JOIN pg_namespace ns ON ns.oid = rel.relnamespace
                     JOIN unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord) ON true
                     JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = u.attnum
                     WHERE con.contype='f' AND ns.nspname='public' AND rel.relname=$1 AND con.conname=$2
                     GROUP BY rel.relname`;
          const colsRes = await client.query(q, [table, con]);
          const cols = (colsRes.rows[0]?.cols as string[]) || [];
          done = cols.length ? await fetchExistingCovering(client!, table, cols) : false;
        }
        fkItems.push(`- [${done ? "x" : " "}] ${table}.${con}`);
      } catch {
        fkItems.push(`- [ ] ${r.description}`);
      }
    }
  }

  if (client) {
    const unusedQ = `
      SELECT s.relname AS table, s.indexrelname AS index
      FROM pg_stat_user_indexes s
      LEFT JOIN pg_constraint c ON c.conindid = s.indexrelid
      WHERE s.schemaname='public' AND s.idx_scan = 0 AND c.conindid IS NULL
      ORDER BY s.relname, s.indexrelname`;
    const res = await client.query(unusedQ);
    for (const r of res.rows) unusedItems.push(`- [ ] ${r.table}.${r.index}`);
  }

  const md = [
    "# Supabase Advisor — Info Checklist",
    "",
    "## Unindexed foreign keys",
    ...fkItems,
    "",
    "## Unused indexes (candidates; require approval)",
    ...unusedItems,
    "",
    "Notes:",
    "- FK entries are auto-marked done when a covering leading-column index exists.",
    "- Unused indexes are not auto-dropped; use report + explicit allowlist to drop.",
  ].join("\n");

  fs.writeFileSync(outPath, md);
  if (client) await client.end();
  console.log(`✅ Wrote checklist: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env bun

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

function hasUnwrapped(expr: string | null): boolean {
  if (!expr) return false;
  const e = expr;
  const authMatches = e.match(/auth\.[a-z_]+\(\)/gi) || [];
  for (const m of authMatches) {
    const idx = e.indexOf(m);
    const before = e.slice(Math.max(0, idx - 20), idx).toLowerCase();
    if (!/\(\s*select\s*$/i.test(before.trim())) return true;
  }
  const csMatches = e.match(/current_setting\(/gi) || [];
  for (const m of csMatches) {
    const idx = e.indexOf(m);
    const before = e.slice(Math.max(0, idx - 20), idx).toLowerCase();
    if (!/\(\s*select\s*$/i.test(before.trim())) return true;
  }
  return false;
}

async function main() {
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ Missing SUPABASE_DB_URL or DATABASE_URL");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    // 1) RLS initplan
    const polRes = await client.query(`
      SELECT n.nspname AS schema, c.relname AS table, p.polname, p.polcmd,
             pg_get_expr(p.polqual, p.polrelid)      AS using_expr,
             pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'`);
    const initplanIssues = [] as { table: string; policy: string; field: "USING" | "WITH CHECK" }[];
    for (const r of polRes.rows) {
      if (hasUnwrapped(r.using_expr)) initplanIssues.push({ table: r.table, policy: r.polname, field: "USING" });
      if (hasUnwrapped(r.check_expr)) initplanIssues.push({ table: r.table, policy: r.polname, field: "WITH CHECK" });
    }

    // 2) Multiple permissive policies for authenticated on SELECT
    const multiRes = await client.query(`
      SELECT c.relname AS table, COUNT(*) AS cnt
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_roles r ON r.oid = ANY (p.polroles)
      WHERE n.nspname = 'public' AND p.polcmd = 'r' AND p.polpermissive = true AND r.rolname = 'authenticated'
      GROUP BY c.relname HAVING COUNT(*) > 1`);

    // 3) Duplicate indexes (identical method/cols/where)
    const idxRes = await client.query(`
      SELECT t.relname AS table, i.indexrelid,
             ci.relname AS index,
             am.amname AS method,
             pg_get_expr(i.indpred, i.indrelid) AS where,
             ARRAY(
               SELECT a.attname
               FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
               JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
               ORDER BY k.ord
             ) AS cols
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
      JOIN pg_namespace ns ON ns.oid = t.relnamespace
      JOIN pg_class ci ON ci.oid = i.indexrelid
      JOIN pg_am am ON am.oid = ci.relam
      LEFT JOIN pg_constraint c ON c.conindid = i.indexrelid
      WHERE ns.nspname = 'public' AND c.conindid IS NULL`);
    const byTable: Record<string, any[]> = {};
    for (const r of idxRes.rows) {
      if (!Array.isArray(r.cols) && typeof r.cols === "string") {
        const t = (r.cols as string).trim();
        const inner = t.startsWith("{") && t.endsWith("}") ? t.slice(1, -1) : t;
        r.cols = inner ? inner.split(",").map((s: string) => s.replace(/^"|"$/g, "")) : [];
      }
      (byTable[r.table] ||= []).push(r);
    }
    const duplicates: { table: string; a: string; b: string }[] = [];
    for (const [table, arr] of Object.entries(byTable)) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i], b = arr[j];
          const sameMethod = a.method === b.method;
          const sameWhere = (a.where || null) === (b.where || null);
          const aCols: string[] = Array.isArray(a.cols) ? a.cols : [];
          const bCols: string[] = Array.isArray(b.cols) ? b.cols : [];
          const sameCols = aCols.length === bCols.length && aCols.every((v: string, k: number) => v === bCols[k]);
          if (sameMethod && sameWhere && sameCols) duplicates.push({ table, a: a.index, b: b.index });
        }
      }
    }

    const out = [
      "# Advisor Warnings Post-Check",
      "",
      `RLS initplan issues: ${initplanIssues.length}`,
      ...initplanIssues.slice(0, 50).map((x) => `- ${x.table}.${x.policy} (${x.field})`),
      "",
      `Multiple permissive SELECT (authenticated) tables: ${multiRes.rowCount}`,
      ...multiRes.rows.map((r) => `- ${r.table} (cnt=${r.cnt})`),
      "",
      `Duplicate indexes detected: ${duplicates.length}`,
      ...duplicates.slice(0, 50).map((d) => `- ${d.table}: ${d.a} == ${d.b}`),
    ].join("\n");

    const outPath = path.resolve(process.cwd(), "docs", "schema-issues", "Advisor-Warnings-PostCheck.md");
    fs.writeFileSync(outPath, out);
    console.log(`✅ Wrote ${outPath}`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

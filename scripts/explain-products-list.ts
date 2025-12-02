#!/usr/bin/env bun

import "dotenv/config";
import { Client } from "pg";

type Args = {
  teamId: string;
  limit: number;
  cursorUpdatedAt?: string;
  cursorId?: string;
  search?: string;
  category?: string;
  statuses?: string[];
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (name: string) => {
    const idx = argv.findIndex((a) => a === `--${name}`);
    if (idx >= 0) return argv[idx + 1];
    const pref = `--${name}=`;
    const hit = argv.find((a) => a.startsWith(pref));
    return hit ? hit.substring(pref.length) : undefined;
  };

  const teamId = get("team-id") || get("teamId") || "";
  if (!teamId) {
    console.error("Usage: bun scripts/explain-products-list.ts --team-id <uuid> [--limit 50] [--cursor-updated-at <iso>] [--cursor-id <uuid>] [--search <text>] [--category <slug>] [--statuses active,draft]");
    process.exit(1);
  }
  const limit = Number(get("limit") || 50);
  const cursorUpdatedAt = get("cursor-updated-at") || get("cursorUpdatedAt");
  const cursorId = get("cursor-id") || get("cursorId");
  const search = get("search");
  const category = get("category");
  const statusesRaw = get("statuses");
  const statuses = statusesRaw ? statusesRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
  return { teamId, limit, cursorUpdatedAt, cursorId, search, category, statuses };
}

function buildQuery(args: Args) {
  const where: string[] = ["p.team_id = $1::uuid", "p.deleted_at IS NULL"]; // $1 teamId
  const params: any[] = [args.teamId];
  let p = 1;

  if (args.category) {
    p += 1; where.push(`p.category_slug = $${p}`); params.push(args.category);
  }
  if (args.statuses && args.statuses.length) {
    p += 1; where.push(`p.status = ANY($${p}::product_status[])`); params.push(args.statuses);
  }
  if (args.search) {
    p += 1; where.push(`p.search_tsv @@ plainto_tsquery('simple', $${p})`); params.push(args.search);
  }
  if (args.cursorUpdatedAt && args.cursorId) {
    p += 1; const upd = p; params.push(args.cursorUpdatedAt);
    p += 1; const cid = p; params.push(args.cursorId);
    where.push(`(p.updated_at < $${upd}::timestamptz OR (p.updated_at = $${upd}::timestamptz AND p.id < $${cid}::uuid))`);
  }
  p += 1; const limitPos = p; params.push(args.limit);

  const sql = `
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
SELECT
  p.id,
  p.team_id,
  p.name,
  p.updated_at
FROM products p
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS variants_count,
    MIN(price) FILTER (WHERE status = 'active') AS price_min,
    MAX(price) FILTER (WHERE status = 'active') AS price_max
  FROM product_variants pv
  WHERE pv.team_id = p.team_id AND pv.product_id = p.id
) v ON TRUE
LEFT JOIN LATERAL (
  SELECT
    SUM(pi.on_hand) AS stock_on_hand,
    SUM(pi.allocated) AS stock_allocated
  FROM product_inventory pi
  JOIN product_variants pv2 ON pv2.id = pi.variant_id
  WHERE pv2.team_id = p.team_id AND pv2.product_id = p.id
) inv ON TRUE
LEFT JOIN LATERAL (
  SELECT pm2.path AS primary_image
  FROM product_media pm2
  WHERE pm2.team_id = p.team_id AND pm2.product_id = p.id
  ORDER BY pm2.is_primary DESC, COALESCE(pm2.position, 2147483647), pm2.created_at DESC
  LIMIT 1
) pm ON TRUE
WHERE ${where.join(" AND ")}
ORDER BY p.updated_at DESC, p.id DESC
LIMIT $${limitPos}::int`;

  return { sql, params };
}

async function main() {
  const args = parseArgs();
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { sql, params } = buildQuery(args);
    const res = await client.query(sql, params);
    const planJson = res.rows[0]?.["QUERY PLAN"]; // FORMAT JSON returns one row, one col
    const plan = Array.isArray(planJson) ? planJson[0] : planJson;
    // Simple analysis: find index usage and total time
    const text = JSON.stringify(plan);
    const usedIdx = text.includes("idx_products_team_updated_id");
    const totalTimeMatch = text.match(/"Execution Time":\s*(\d+\.?\d*)/);
    const planningTimeMatch = text.match(/"Planning Time":\s*(\d+\.?\d*)/);
    console.log("\n=== EXPLAIN SUMMARY ===");
    console.log(`Index used (idx_products_team_updated_id): ${usedIdx}`);
    if (planningTimeMatch) console.log(`Planning Time: ${planningTimeMatch[1]} ms`);
    if (totalTimeMatch) console.log(`Execution Time: ${totalTimeMatch[1]} ms`);
    console.log("\n=== Full Plan (JSON) ===");
    console.log(JSON.stringify(plan, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

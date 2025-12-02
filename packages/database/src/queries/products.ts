import { and, sql } from "drizzle-orm";
import type { DbClient } from "../client";
import { products } from "../schema";

export type ProductListParams = {
  teamId: string;
  search?: string;
  status?: ("active" | "draft" | "archived")[];
  categorySlug?: string;
  limit?: number;
  cursor?: { updatedAt: Date; id: string } | null;
};

/**
 * List products with aggregated variant price range and total stock across locations.
 */
export async function getProductsEnriched(db: DbClient, params: ProductListParams) {
  const { teamId, search, status, categorySlug, limit = 50, cursor } = params;
  // Build dynamic WHERE conditions using Drizzle SQL fragments
  const whereCond = and(
    sql`p.team_id = ${teamId}`,
    sql`p.deleted_at IS NULL`,
    categorySlug ? sql`p.category_slug = ${categorySlug}` : sql`TRUE`,
    status && status.length ? sql`p.status = ANY(${status})` : sql`TRUE`,
    search ? sql`p.search_tsv @@ plainto_tsquery('simple', ${search})` : sql`TRUE`,
    // Use typed row comparison; avoids duplicate timestamp placeholders and driver quirks
    cursor
      ? sql`(
          p.updated_at < ${sql`${
            (cursor.updatedAt instanceof Date
              ? cursor.updatedAt.toISOString()
              : String(cursor.updatedAt))
          }::timestamptz`} OR (
            p.updated_at = ${sql`${
              (cursor.updatedAt instanceof Date
                ? cursor.updatedAt.toISOString()
                : String(cursor.updatedAt))
            }::timestamptz`} AND p.id < ${sql`${cursor.id}::uuid`}
          )
        )`
      : sql`TRUE`,
  );

  const query = sql`
    SELECT
      p.id,
      p.team_id,
      p.name,
      p.slug,
      p.type,
      p.status,
      p.description,
      p.category_slug,
      p.tags,
      p.attributes,
      p.created_at,
      p.updated_at,
      p.deleted_at,
      COALESCE(v.variants_count, 0) AS variants_count,
      v.price_min,
      v.price_max,
      COALESCE(inv.stock_on_hand, 0) AS stock_on_hand,
      COALESCE(inv.stock_allocated, 0) AS stock_allocated,
      pm.primary_image
    FROM products p
    -- Team-scoped, per-row aggregates using LATERAL joins for better planner choices
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
      SELECT
        pm2.path AS primary_image
      FROM product_media pm2
      WHERE pm2.team_id = p.team_id AND pm2.product_id = p.id
      ORDER BY pm2.is_primary DESC, COALESCE(pm2.position, 2147483647), pm2.created_at DESC
      LIMIT 1
    ) pm ON TRUE
    WHERE ${whereCond}
    ORDER BY p.updated_at DESC, p.id DESC
    LIMIT ${sql`${limit}::int`}
  `;

  const result: any = await (db as any).execute(query);
  const rows: any[] = result?.rows ?? result ?? [];

  return rows.map((r) => ({
    product: {
      id: r.id,
      teamId: r.team_id,
      name: r.name,
      slug: r.slug ?? null,
      type: r.type,
      status: r.status,
      description: r.description ?? null,
      categorySlug: r.category_slug ?? null,
      tags: r.tags ?? [],
      attributes: r.attributes ?? {},
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deletedAt: r.deleted_at ?? null,
    } as any,
    variantsCount: Number(r.variants_count || 0),
    priceMin: r.price_min != null ? Number(r.price_min) : null,
    priceMax: r.price_max != null ? Number(r.price_max) : null,
    stockOnHand: Number(r.stock_on_hand || 0),
    stockAllocated: Number(r.stock_allocated || 0),
    primaryImage: r.primary_image ?? null,
  }));
}

export type ProductStats = {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  lowStockVariants: number;
  outOfStockVariants: number;
  createdInPeriod?: number;
};

export async function getProductStats(
  db: DbClient,
  { teamId, startDate, endDate }: { teamId: string; startDate?: Date; endDate?: Date },
) {
  const startStr = startDate ? startDate.toISOString() : null;
  const endStr = endDate ? endDate.toISOString() : null;

  const [countsRes, stockRes, createdRes] = await Promise.all([
    (db as any).execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE p.deleted_at IS NULL) AS total,
        COUNT(*) FILTER (WHERE p.deleted_at IS NULL AND p.status = 'active') AS active,
        COUNT(*) FILTER (WHERE p.deleted_at IS NULL AND p.status = 'draft') AS draft,
        COUNT(*) FILTER (WHERE p.deleted_at IS NULL AND p.status = 'archived') AS archived
      FROM products p
      WHERE p.team_id = ${teamId}
    `),
    (db as any).execute(sql`
      WITH inv AS (
        SELECT pv.id,
               COALESCE(SUM(pi.on_hand), 0) AS on_hand,
               COALESCE(SUM(pi.safety_stock), 0) AS safety_stock
        FROM product_variants pv
        LEFT JOIN product_inventory pi ON pi.variant_id = pv.id
        WHERE pv.team_id = ${teamId}
        GROUP BY pv.id
      )
      SELECT
        COUNT(*) FILTER (WHERE on_hand <= 0) AS out_of_stock,
        COUNT(*) FILTER (WHERE on_hand > 0 AND on_hand <= safety_stock) AS low_stock
      FROM inv
    `),
    startStr || endStr
      ? (db as any).execute(sql`
          SELECT COUNT(*) AS created
          FROM products p
          WHERE p.team_id = ${teamId}
            AND p.deleted_at IS NULL
            ${startStr ? sql`AND p.created_at >= ${startStr}` : sql``}
            ${endStr ? sql`AND p.created_at <= ${endStr}` : sql``}
        `)
      : Promise.resolve({ rows: [{ created: 0 }] }),
  ]);

  const countsRow: any = countsRes?.rows?.[0] ?? countsRes?.[0] ?? {};
  const stockRow: any = stockRes?.rows?.[0] ?? stockRes?.[0] ?? {};
  const createdRow: any = createdRes?.rows?.[0] ?? createdRes?.[0] ?? {};

  const stats: ProductStats = {
    totalProducts: Number(countsRow.total || 0),
    activeProducts: Number(countsRow.active || 0),
    draftProducts: Number(countsRow.draft || 0),
    archivedProducts: Number(countsRow.archived || 0),
    lowStockVariants: Number(stockRow.low_stock || 0),
    outOfStockVariants: Number(stockRow.out_of_stock || 0),
    createdInPeriod: Number(createdRow.created || 0),
  };
  return stats;
}

export type TopProductCategory = {
  slug: string;
  name: string;
  color?: string | null;
  total: number;
};

export async function getTopProductCategories(
  db: DbClient,
  {
    teamId,
    limit = 10,
    startDate,
    endDate,
  }: { teamId: string; limit?: number; startDate?: Date; endDate?: Date },
) {
  const startStr = startDate ? startDate.toISOString() : null;
  const endStr = endDate ? endDate.toISOString() : null;
  const res: any = await (db as any).execute(sql`
    SELECT
      p.category_slug AS slug,
      COALESCE(pc.name, p.category_slug) AS name,
      pc.color AS color,
      COUNT(*) AS total
    FROM products p
    LEFT JOIN product_categories pc ON pc.team_id = p.team_id AND pc.slug = p.category_slug
    WHERE p.team_id = ${teamId} AND p.deleted_at IS NULL AND p.category_slug IS NOT NULL
      ${startStr ? sql`AND p.created_at >= ${startStr}` : sql``}
      ${endStr ? sql`AND p.created_at <= ${endStr}` : sql``}
    GROUP BY p.category_slug, COALESCE(pc.name, p.category_slug), pc.color
    ORDER BY total DESC
    LIMIT ${sql`${limit}::int`}
  `);
  const rows: any[] = res?.rows ?? res ?? [];
  return rows.map((r) => ({ slug: String(r.slug), name: String(r.name), color: r.color ?? null, total: Number(r.total || 0) })) as TopProductCategory[];
}

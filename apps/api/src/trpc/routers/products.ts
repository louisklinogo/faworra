import { getProductsEnriched } from "@Faworra/database/queries";
import { getProductStats, getTopProductCategories } from "@Faworra/database/queries/products";
import { and, asc, desc, eq, isNull, inArray, productMedia, products, sql } from "@Faworra/database/schema";
import baseLogger from "../../lib/logger";
import { z } from "zod";
import { createTRPCRouter, teamProcedure } from "../init";

const LIMIT_MIN = 1;
const LIMIT_MAX = 100;
const LIMIT_DEFAULT = 50;

export const productsRouter = createTRPCRouter({
  stats: teamProcedure
    .input(
      z
        .object({ startDate: z.string().datetime().optional(), endDate: z.string().datetime().optional() })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const stats = await getProductStats(ctx.db, {
        teamId: ctx.teamId,
        startDate: input?.startDate ? new Date(input.startDate) : undefined,
        endDate: input?.endDate ? new Date(input.endDate) : undefined,
      });
      return stats;
    }),
  topCategories: teamProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10).optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const rows = await getTopProductCategories(ctx.db, {
        teamId: ctx.teamId,
        limit: input?.limit ?? 10,
        startDate: input?.startDate ? new Date(input.startDate) : undefined,
        endDate: input?.endDate ? new Date(input.endDate) : undefined,
      });
      return rows;
    }),
  details: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { products: productsTbl, productVariants, productMedia } = await import("@Faworra/database/schema");
      const productRows = await ctx.db
        .select({
          id: productsTbl.id,
          teamId: productsTbl.teamId,
          name: productsTbl.name,
          status: productsTbl.status,
          type: productsTbl.type,
          categorySlug: productsTbl.categorySlug,
          description: productsTbl.description,
          createdAt: productsTbl.createdAt,
          updatedAt: productsTbl.updatedAt,
        })
        .from(productsTbl)
        .where(
          (await import("@Faworra/database/schema")).and(
            (await import("@Faworra/database/schema")).eq(productsTbl.teamId, ctx.teamId),
            (await import("@Faworra/database/schema")).eq(productsTbl.id, input.id),
            (await import("@Faworra/database/schema")).isNull(productsTbl.deletedAt),
          ),
        )
        .limit(1);
      const product = productRows[0] || null;
      if (!product) {
        return null;
      }

      const variants = await ctx.db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          name: productVariants.name,
          sku: productVariants.sku,
          barcode: productVariants.barcode,
          price: productVariants.price,
          currency: productVariants.currency,
          status: productVariants.status,
          fulfillmentType: productVariants.fulfillmentType,
          stockManaged: productVariants.stockManaged,
          leadTimeDays: productVariants.leadTimeDays,
          updatedAt: productVariants.updatedAt,
        })
        .from(productVariants)
        .where(
          (await import("@Faworra/database/schema")).and(
            (await import("@Faworra/database/schema")).eq(productVariants.teamId, ctx.teamId),
            (await import("@Faworra/database/schema")).eq(productVariants.productId, input.id),
          ),
        );

      const media = await ctx.db
        .select({
          id: productMedia.id,
          productId: productMedia.productId,
          path: productMedia.path,
          alt: productMedia.alt,
          isPrimary: productMedia.isPrimary,
          position: productMedia.position,
        })
        .from(productMedia)
        .where(
          (await import("@Faworra/database/schema")).and(
            (await import("@Faworra/database/schema")).eq(productMedia.productId, input.id),
          ),
        )
        .orderBy((await import("@Faworra/database/schema")).asc(productMedia.position));

      return { product, variants, media } as const;
    }),
  byId: teamProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const rows = await ctx.db
      .select()
      .from(products)
      .where(
        and(eq(products.teamId, ctx.teamId), eq(products.id, input.id), isNull(products.deletedAt)),
      )
      .limit(1);
    return rows[0] || null;
  }),

  create: teamProcedure
    .input(
      z.object({
        name: z.string().min(1),
        status: z.enum(["active", "draft", "archived"]).default("active"),
        type: z.enum(["physical", "service", "digital", "bundle"]).default("physical"),
        categorySlug: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        // Optional default variant
        variant: z
          .object({
            name: z.string().nullable().optional(),
            sku: z.string().nullable().optional(),
            barcode: z.string().nullable().optional(),
            price: z.number().nullable().optional(),
            currency: z.string().nullable().optional(),
            cost: z.number().nullable().optional(),
            stockQuantity: z.number().nullable().optional(),
            fulfillmentType: z
              .enum(["stocked", "dropship", "made_to_order", "preorder"])
              .optional(),
            stockManaged: z.boolean().optional(),
            leadTimeDays: z.number().nullable().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { products: productsTbl, productVariants } = await import("@Faworra/database/schema");

      // Create product
      const [product] = await ctx.db
        .insert(productsTbl)
        .values({
          teamId: ctx.teamId,
          name: input.name,
          status: input.status as any,
          type: input.type as any,
          categorySlug: input.categorySlug ?? null,
          description: input.description ?? null,
        })
        .returning();

      // Create default variant if provided
      let variant = null;
      if (input.variant) {
        const [createdVariant] = await ctx.db
          .insert(productVariants)
          .values({
            teamId: ctx.teamId,
            productId: product.id,
            name: input.variant.name ?? null,
            sku: input.variant.sku ?? null,
            barcode: input.variant.barcode ?? null,
            price: input.variant.price as any,
            currency: input.variant.currency ?? null,
            cost: input.variant.cost as any,
            fulfillmentType: (input.variant.fulfillmentType as any) ?? "stocked",
            stockManaged: input.variant.stockManaged ?? false,
            leadTimeDays: input.variant.leadTimeDays ?? null,
          })
          .returning();
        variant = createdVariant;

        // Create initial inventory record if stock quantity provided
        if (input.variant.stockQuantity != null && input.variant.stockQuantity > 0) {
          const { productInventory, inventoryLocations } = await import("@Faworra/database/schema");

          // Get or create default location
          let location = await ctx.db.query.inventoryLocations.findFirst({
            where: (l, { and, eq }) => and(eq(l.teamId, ctx.teamId), eq(l.name, "Default")),
          });

          if (!location) {
            const [created] = await ctx.db
              .insert(inventoryLocations)
              .values({
                teamId: ctx.teamId,
                name: "Default",
                address: null,
              })
              .returning();
            location = created;
          }

          // Create inventory record
          await ctx.db.insert(productInventory).values({
            teamId: ctx.teamId,
            variantId: variant.id,
            locationId: location.id,
            onHand: input.variant.stockQuantity,
            allocated: 0,
            safetyStock: 0,
          });
        }
      }

      return { id: product.id, product, variant };
    }),

  update: teamProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        status: z.enum(["active", "draft", "archived"]).optional(),
        type: z.enum(["physical", "service", "digital", "bundle"]).optional(),
        categorySlug: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input as any;
      const [row] = await ctx.db
        .update((await import("@Faworra/database/schema")).products)
        .set({ ...data, updatedAt: new Date() })
        .where(
          (await import("@Faworra/database/schema")).and(
            (await import("@Faworra/database/schema")).eq(
              (await import("@Faworra/database/schema")).products.teamId,
              ctx.teamId,
            ),
            (await import("@Faworra/database/schema")).eq(
              (await import("@Faworra/database/schema")).products.id,
              id,
            ),
          ),
        )
        .returning();
      return row;
    }),

  duplicate: teamProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        options: z
          .object({
            nameSuffix: z.string().default(" (Copy)"),
            status: z.enum(["active", "draft", "archived"]).optional(),
            copyMedia: z.boolean().default(true),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { products: p, productVariants: v, productInventory: inv, productMedia: m } =
        await import("@Faworra/database/schema");

      const suffix = input.options?.nameSuffix ?? " (Copy)";
      const targetStatus = input.options?.status ?? "draft";
      const copyMedia = input.options?.copyMedia ?? true;

      return await ctx.db.transaction(async (tx) => {
        // 1) Load source product
        const srcRows = await tx
          .select()
          .from(p)
          .where(
            and(eq(p.teamId, ctx.teamId), eq(p.id, input.id), isNull(p.deletedAt)),
          )
          .limit(1);
        const src = srcRows[0];
        if (!src) return null;

        // 2) Create new product (basic fields)
        const [dst] = await tx
          .insert(p)
          .values({
            teamId: ctx.teamId,
            name: `${src.name}${suffix}`.slice(0, 255),
            status: targetStatus as any,
            type: src.type as any,
            categorySlug: src.categorySlug ?? null,
            description: src.description ?? null,
            tags: src.tags ?? [],
            attributes: src.attributes ?? {},
          })
          .returning();

        // 3) Clone variants
        const variants = await tx
          .select()
          .from(v)
          .where(and(eq(v.teamId, ctx.teamId), eq(v.productId, src.id)));

        const variantIdMap = new Map<string, string>();
        if (variants.length) {
          const newVariantsValues = variants.map((it) => ({
            teamId: ctx.teamId,
            productId: dst.id,
            name: it.name ?? null,
            sku: null, // avoid unique conflicts
            barcode: null, // avoid unique conflicts
            unitOfMeasure: it.unitOfMeasure ?? null,
            packSize: it.packSize as any,
            price: it.price as any,
            currency: it.currency ?? null,
            cost: it.cost as any,
            status: (it.status as any) ?? "active",
            fulfillmentType: (it.fulfillmentType as any) ?? "stocked",
            stockManaged: it.stockManaged ?? true,
            leadTimeDays: it.leadTimeDays ?? null,
            availabilityDate: it.availabilityDate ?? null,
            backorderPolicy: it.backorderPolicy ?? null,
            capacityPerPeriod: it.capacityPerPeriod ?? null,
          }));
          const inserted = await tx.insert(v).values(newVariantsValues).returning();
          for (let i = 0; i < variants.length; i++) {
            variantIdMap.set(variants[i]!.id, inserted[i]!.id);
          }

          // 4) Clone inventory for those variants
          const oldIds = variants.map((x) => x.id);
          if (oldIds.length) {
            const invRows = await tx
              .select()
              .from(inv)
              .where(and(eq(inv.teamId, ctx.teamId), inArray(inv.variantId, oldIds)));
            if (invRows.length) {
              const invValues = invRows.map((r) => ({
                teamId: ctx.teamId,
                variantId: variantIdMap.get(r.variantId)!,
                locationId: r.locationId,
                onHand: r.onHand,
                allocated: r.allocated,
                safetyStock: r.safetyStock,
              }));
              await tx.insert(inv).values(invValues).onConflictDoNothing();
            }
          }
        }

        // 5) Clone media records (DB references only)
        if (copyMedia) {
          const mediaRows = await tx
            .select()
            .from(m)
            .where(and(eq(m.teamId, ctx.teamId), eq(m.productId, src.id)));
          if (mediaRows.length) {
            const mediaValues = mediaRows.map((r) => ({
              teamId: ctx.teamId,
              productId: dst.id,
              variantId: r.variantId ? variantIdMap.get(r.variantId) ?? null : null,
              path: r.path,
              alt: r.alt ?? null,
              isPrimary: r.isPrimary,
              position: r.position ?? null,
              width: r.width ?? null,
              height: r.height ?? null,
              sizeBytes: r.sizeBytes ?? null,
              mimeType: r.mimeType ?? null,
            }));
            await tx.insert(m).values(mediaValues);
          }
        }

        baseLogger.info(
          {
            action: "products.duplicate",
            teamId: ctx.teamId,
            srcId: src.id,
            dstId: dst.id,
            variants: variants.length,
          },
          "products.duplicate:success",
        );
        return { id: dst.id } as const;
      });
    }),

  delete: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update((await import("@Faworra/database/schema")).products)
        .set({ deletedAt: new Date() })
        .where(
          (await import("@Faworra/database/schema")).and(
            (await import("@Faworra/database/schema")).eq(
              (await import("@Faworra/database/schema")).products.teamId,
              ctx.teamId,
            ),
            (await import("@Faworra/database/schema")).eq(
              (await import("@Faworra/database/schema")).products.id,
              input.id,
            ),
          ),
        )
        .returning();
      return row;
    }),

  deleteMedia: teamProcedure
    .input(z.object({ productId: z.string().uuid(), mediaId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { productMedia: mediaTbl } = await import("@Faworra/database/schema");
      await ctx.db
        .delete(mediaTbl)
        .where(
          and(
            eq(mediaTbl.teamId, ctx.teamId),
            eq(mediaTbl.productId, input.productId),
            eq(mediaTbl.id, input.mediaId),
          ),
        );
      return { success: true };
    }),

  setPrimaryMedia: teamProcedure
    .input(z.object({ productId: z.string().uuid(), mediaId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { productMedia: mediaTbl } = await import("@Faworra/database/schema");
      // First, unset all primary flags for this product
      await ctx.db
        .update(mediaTbl)
        .set({ isPrimary: false })
        .where(and(eq(mediaTbl.teamId, ctx.teamId), eq(mediaTbl.productId, input.productId)));

      // Then set the selected media as primary
      await ctx.db
        .update(mediaTbl)
        .set({ isPrimary: true })
        .where(
          and(
            eq(mediaTbl.teamId, ctx.teamId),
            eq(mediaTbl.productId, input.productId),
            eq(mediaTbl.id, input.mediaId),
          ),
        );
      return { success: true };
    }),

  createMedia: teamProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        path: z.string(),
        alt: z.string().optional(),
        isPrimary: z.boolean().default(false),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        sizeBytes: z.number().int().positive().optional(),
        mimeType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const { productMedia: mediaTbl } = await import("@Faworra/database/schema");
      try {
        const row = await ctx.db.transaction(async (tx) => {
          const existing = await tx
            .select({ position: mediaTbl.position })
            .from(mediaTbl)
            .where(eq(mediaTbl.productId, input.productId))
            .orderBy(desc(mediaTbl.position))
            .limit(1);
          const nextPosition = (existing[0]?.position ?? -1) + 1;

          const [created] = await tx
            .insert(mediaTbl)
            .values({
              teamId: ctx.teamId,
              productId: input.productId,
              variantId: input.variantId || null,
              path: input.path,
              alt: input.alt || null,
              isPrimary: false,
              position: nextPosition,
              width: input.width || null,
              height: input.height || null,
              sizeBytes: input.sizeBytes || null,
              mimeType: input.mimeType || null,
            })
            .returning();

          await tx.execute(sql`
            UPDATE product_media AS pm
            SET is_primary = TRUE
            WHERE pm.team_id = ${ctx.teamId} AND pm.id = ${created.id}
              AND NOT EXISTS (
                SELECT 1 FROM product_media x
                WHERE x.team_id = ${ctx.teamId}
                  AND x.product_id = ${input.productId}
                  AND x.is_primary = TRUE
                  AND x.id <> pm.id
              )
          `);

          const [row] = await tx
            .select()
            .from(mediaTbl)
            .where(and(eq(mediaTbl.teamId, ctx.teamId), eq(mediaTbl.id, created.id)));
          return row;
        });
        baseLogger.info(
          {
            productId: input.productId,
            mediaId: (row as any)?.id,
            sizeBytes: input.sizeBytes ?? null,
            mimeType: input.mimeType ?? null,
            durationMs: Date.now() - start,
          },
          "products.createMedia:success",
        );
        return row;
      } catch (err: any) {
        baseLogger.warn(
          {
            productId: input.productId,
            sizeBytes: input.sizeBytes ?? null,
            mimeType: input.mimeType ?? null,
            durationMs: Date.now() - start,
            error: err?.message || String(err),
          },
          "products.createMedia:fail",
        );
        throw err;
      }
    }),
  list: teamProcedure
    .input(
      z
        .object({
          search: z.string().min(1).optional(),
          status: z.array(z.enum(["active", "draft", "archived"])).optional(),
          categorySlug: z.string().optional(),
          limit: z.number().min(LIMIT_MIN).max(LIMIT_MAX).default(LIMIT_DEFAULT),
          cursor: z
            .object({
              updatedAt: z.union([z.date(), z.string()]),
              id: z.string().uuid(),
            })
            .nullish(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const u = input?.cursor?.updatedAt as unknown;
      const updatedAt = u instanceof Date ? u : u ? new Date(u as string) : undefined;

      const rows = await getProductsEnriched(ctx.db, {
        teamId: ctx.teamId,
        search: input?.search,
        status: input?.status,
        categorySlug: input?.categorySlug,
        limit: input?.limit,
        cursor: input?.cursor && updatedAt ? { updatedAt, id: input.cursor.id } : null,
      });

      const last = rows.at(-1);
      const nextCursor = last
        ? {
            updatedAt:
              last.product.updatedAt instanceof Date
                ? last.product.updatedAt.toISOString()
                : (last.product.updatedAt as string),
            id: last.product.id,
          }
        : null;
      return { items: rows, nextCursor };
    }),

  mediaList: teamProcedure
    .input(z.object({ productId: z.string().uuid(), variantId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(productMedia)
        .where(
          and(
            eq(productMedia.teamId, ctx.teamId),
            eq(productMedia.productId, input.productId),
            input.variantId ? eq(productMedia.variantId, input.variantId) : sql`true`,
          ),
        )
        .orderBy(
          desc(productMedia.isPrimary),
          asc(sql`COALESCE(${productMedia.position}, 2147483647)`),
          desc(productMedia.createdAt),
        );
      return rows;
    }),

  mediaAdd: teamProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        path: z.string().min(1),
        alt: z.string().optional(),
        isPrimary: z.boolean().optional(),
        position: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isPrimary) {
        await ctx.db
          .update(productMedia)
          .set({ isPrimary: false })
          .where(
            and(
              eq(productMedia.teamId, ctx.teamId),
              eq(productMedia.productId, input.productId),
              input.variantId ? eq(productMedia.variantId, input.variantId) : sql`true`,
            ),
          );
      }
      const [row] = await ctx.db
        .insert(productMedia)
        .values({
          teamId: ctx.teamId,
          productId: input.productId,
          variantId: input.variantId ?? null,
          path: input.path,
          alt: input.alt ?? null,
          isPrimary: Boolean(input.isPrimary),
          position: input.position ?? null,
        })
        .returning();
      return row;
    }),

  mediaAddMany: teamProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        items: z
          .array(
            z.object({
              variantId: z.string().uuid().optional(),
              path: z.string().min(1),
              alt: z.string().optional(),
              isPrimary: z.boolean().optional(),
              position: z.number().int().optional(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasPrimary = input.items.some((i) => i.isPrimary);
      if (hasPrimary) {
        // If any item is primary for a scope, clear current primary for that scope once
        const variantIds = Array.from(new Set(input.items.map((i) => i.variantId || null)));
        for (const vid of variantIds) {
          await ctx.db
            .update(productMedia)
            .set({ isPrimary: false })
            .where(
              and(
                eq(productMedia.teamId, ctx.teamId),
                eq(productMedia.productId, input.productId),
                vid ? eq(productMedia.variantId, vid) : sql`true`,
              ),
            );
        }
      }
      const values = input.items.map((i) => ({
        teamId: ctx.teamId,
        productId: input.productId,
        variantId: i.variantId ?? null,
        path: i.path,
        alt: i.alt ?? null,
        isPrimary: Boolean(i.isPrimary),
        position: i.position ?? null,
      }));
      const rows = await ctx.db.insert(productMedia).values(values).returning();
      return rows;
    }),

  mediaSetPrimary: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db
        .select()
        .from(productMedia)
        .where(and(eq(productMedia.teamId, ctx.teamId), eq(productMedia.id, input.id)));
      const row = current[0];
      if (!row) {
        return null;
      }
      await ctx.db
        .update(productMedia)
        .set({ isPrimary: false })
        .where(
          and(
            eq(productMedia.teamId, ctx.teamId),
            eq(productMedia.productId, row.productId),
            row.variantId ? eq(productMedia.variantId, row.variantId) : sql`true`,
          ),
        );
      const [updated] = await ctx.db
        .update(productMedia)
        .set({ isPrimary: true })
        .where(and(eq(productMedia.teamId, ctx.teamId), eq(productMedia.id, input.id)))
        .returning();
      return updated;
    }),

  mediaDelete: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(productMedia)
        .where(and(eq(productMedia.teamId, ctx.teamId), eq(productMedia.id, input.id)))
        .returning();
      return deleted;
    }),

  mediaUpdate: teamProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        alt: z.string().optional(),
        position: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(productMedia)
        .set({ alt: input.alt ?? undefined, position: input.position ?? undefined })
        .where(and(eq(productMedia.teamId, ctx.teamId), eq(productMedia.id, input.id)))
        .returning();
      return row;
    }),

  mediaReorder: teamProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        order: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(
      async ({ ctx, input }) =>
        await ctx.db.transaction(async (tx) => {
          const scopeWhere = and(
            eq(productMedia.teamId, ctx.teamId),
            eq(productMedia.productId, input.productId),
            input.variantId ? eq(productMedia.variantId, input.variantId) : sql`true`,
          );
          const rows = await tx
            .select({ id: productMedia.id })
            .from(productMedia)
            .where(scopeWhere)
            .orderBy(
              desc(productMedia.isPrimary),
              asc(sql`COALESCE(${productMedia.position}, 2147483647)`),
              desc(productMedia.createdAt),
            );
          const validSet = new Set(rows.map((r) => r.id));
          const requested = input.order.filter((id) => validSet.has(id));
          const requestedSet = new Set(requested);
          const remaining = rows.map((r) => r.id).filter((id) => !requestedSet.has(id));
          const finalOrder = [...requested, ...remaining];
          for (let i = 0; i < finalOrder.length; i++) {
            await tx
              .update(productMedia)
              .set({ position: i })
              .where(and(eq(productMedia.teamId, ctx.teamId), eq(productMedia.id, finalOrder[i])));
          }
          return { count: finalOrder.length } as const;
        }),
    ),

  variantCreate: teamProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().nullable().optional(),
        sku: z.string().nullable().optional(),
        barcode: z.string().nullable().optional(),
        price: z.number().nullable().optional(),
        currency: z.string().nullable().optional(),
        cost: z.number().nullable().optional(),
        fulfillmentType: z.enum(["stocked", "dropship", "made_to_order", "preorder"]).optional(),
        stockManaged: z.boolean().optional(),
        leadTimeDays: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productVariants } = await import("@Faworra/database/schema");
      const [row] = await ctx.db
        .insert(productVariants)
        .values({
          teamId: ctx.teamId,
          productId: input.productId,
          name: input.name ?? null,
          sku: input.sku ?? null,
          barcode: input.barcode ?? null,
          price: input.price as any,
          currency: input.currency ?? null,
          cost: input.cost as any,
          fulfillmentType: (input.fulfillmentType as any) ?? "stocked",
          stockManaged: input.stockManaged ?? true,
          leadTimeDays: input.leadTimeDays ?? null,
        })
        .returning();
      return row;
    }),

  variantUpdate: teamProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().nullable().optional(),
        sku: z.string().nullable().optional(),
        barcode: z.string().nullable().optional(),
        price: z.number().nullable().optional(),
        currency: z.string().nullable().optional(),
        cost: z.number().nullable().optional(),
        fulfillmentType: z.enum(["stocked", "dropship", "made_to_order", "preorder"]).optional(),
        stockManaged: z.boolean().optional(),
        leadTimeDays: z.number().nullable().optional(),
        status: z.enum(["active", "draft", "archived"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productVariants } = await import("@Faworra/database/schema");
      const { id, ...data } = input as any;
      const [row] = await ctx.db
        .update(productVariants)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(productVariants.teamId, ctx.teamId), eq(productVariants.id, id)))
        .returning();
      return row;
    }),

  variantDelete: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { productVariants } = await import("@Faworra/database/schema");
      const [row] = await ctx.db
        .delete(productVariants)
        .where(and(eq(productVariants.teamId, ctx.teamId), eq(productVariants.id, input.id)))
        .returning();
      return row;
    }),

  variantsByProduct: teamProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { productVariants } = await import("@Faworra/database/schema");
      const rows = await ctx.db
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.teamId, ctx.teamId),
            eq(productVariants.productId, input.productId),
          ),
        );
      return rows;
    }),

  inventoryByVariant: teamProcedure
    .input(z.object({ variantId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { productInventory, inventoryLocations } = await import("@Faworra/database/schema");
      const rows = await ctx.db
        .select({
          locationId: productInventory.locationId,
          onHand: productInventory.onHand,
          allocated: productInventory.allocated,
          safetyStock: productInventory.safetyStock,
          locationName: inventoryLocations.name,
        })
        .from(productInventory)
        .leftJoin(
          inventoryLocations,
          and(
            eq(productInventory.locationId, inventoryLocations.id),
            eq(inventoryLocations.teamId, ctx.teamId),
          ),
        )
        .where(
          and(
            eq(productInventory.teamId, ctx.teamId),
            eq(productInventory.variantId, input.variantId),
          ),
        );
      return rows;
    }),

  inventoryLocations: teamProcedure.query(async ({ ctx }) => {
    const { inventoryLocations } = await import("@Faworra/database/schema");
    const rows = await ctx.db
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.teamId, ctx.teamId));
    return rows;
  }),

  inventoryUpsert: teamProcedure
    .input(
      z.object({
        variantId: z.string().uuid(),
        entries: z.array(
          z.object({
            locationId: z.string().uuid(),
            onHand: z.number().int().nonnegative(),
            allocated: z.number().int().nonnegative().default(0),
            safetyStock: z.number().int().nonnegative().default(0),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productInventory } = await import("@Faworra/database/schema");
      for (const e of input.entries) {
        await ctx.db
          .insert(productInventory)
          .values({
            teamId: ctx.teamId,
            variantId: input.variantId,
            locationId: e.locationId,
            onHand: e.onHand,
            allocated: e.allocated,
            safetyStock: e.safetyStock,
          })
          .onConflictDoUpdate({
            target: [productInventory.variantId, productInventory.locationId],
            set: {
              onHand: e.onHand,
              allocated: e.allocated,
              safetyStock: e.safetyStock,
              updatedAt: new Date(),
            },
          });
      }
      return { ok: true } as const;
    }),
});

export type ProductsRouter = typeof productsRouter;

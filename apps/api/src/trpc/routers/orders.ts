import {
  createOrderWithItems,
  deleteOrder,
  getOrdersWithClients,
  getOrderWithItemsById,
  updateOrderWithItems,
} from "@Faworra/database/queries";
import { z } from "zod";
import { createTRPCRouter, teamProcedure } from "../init";

const LIMIT_MIN = 1;
const LIMIT_MAX = 100;
const LIMIT_DEFAULT = 50;
const IDEMPOTENCY_KEY_MAX = 255;
const SOURCE_MAX = 255;
const CONVERSATION_ID_MAX = 255;

// Validation schemas
const orderItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unit_cost: z.number().min(0),
  total_cost: z.number().min(0),
});

const orderInsertSchema = z.object({
  clientId: z.string().uuid().nullable(),
  // Optional: DB trigger will generate when missing
  orderNumber: z.string().min(1).optional(),
  status: z.enum(["generated", "in_progress", "completed", "cancelled"]).default("generated"),
  items: z.array(orderItemSchema).default([]),
  totalPrice: z.number().min(0).default(0),
  depositAmount: z.number().min(0).default(0),
  balanceAmount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  // Idempotency & audit (optional)
  idempotencyKey: z.string().max(IDEMPOTENCY_KEY_MAX).optional(),
  createdByType: z.enum(["user", "agent", "system"]).optional(),
  createdById: z.string().uuid().optional(),
  source: z.string().max(SOURCE_MAX).optional(),
  conversationId: z.string().max(CONVERSATION_ID_MAX).optional(),
});

const orderUpdateSchema = orderInsertSchema.partial().extend({
  id: z.string().uuid(),
});

export const ordersRouter = createTRPCRouter({
  // List all orders for the current team
  list: teamProcedure
    .input(
      z
        .object({
          limit: z.number().min(LIMIT_MIN).max(LIMIT_MAX).default(LIMIT_DEFAULT),
          cursor: z.object({ createdAt: z.string().nullable(), id: z.string() }).nullish(),
          status: z.enum(["generated", "in_progress", "completed", "cancelled"]).optional(),
          search: z.string().min(1).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const rows = await getOrdersWithClients(ctx.db, {
        teamId: ctx.teamId,
        limit: input?.limit,
        status: input?.status,
        search: input?.search,
        cursor: input?.cursor
          ? {
              createdAt: input.cursor.createdAt ? new Date(input.cursor.createdAt) : null,
              id: input.cursor.id,
            }
          : null,
      });
      const items = rows;
      const last = items.at(-1) as any | undefined;
      const nextCursor = last
        ? {
            createdAt: last?.order?.createdAt || null,
            id: last?.order?.id,
          }
        : null;
      return { items, nextCursor };
    }),

  // Get a single order by ID
  byId: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => await getOrderWithItemsById(ctx.db, input.id, ctx.teamId)),

  // Create a new order
  create: teamProcedure.input(orderInsertSchema).mutation(async ({ ctx, input }) => {
    const { items, ...rest } = input as any;
    const data: any = { ...rest, teamId: ctx.teamId };
    if (rest?.dueDate !== undefined) {
      data.dueDate = rest.dueDate ? new Date(rest.dueDate) : null;
    }
    if (!data.orderNumber) {
      data.orderNumber = undefined; // let DB trigger generate
    }
    const created = await createOrderWithItems(ctx.db, data, items || []);
    // Re-read with items to return DB-calculated totals
    return getOrderWithItemsById(ctx.db, created.id, ctx.teamId);
  }),

  // Update an existing order
  update: teamProcedure.input(orderUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, items, ...rest } = input as any;
    const data: any = { ...rest };
    if (rest?.dueDate !== undefined) {
      data.dueDate = rest.dueDate ? new Date(rest.dueDate) : null;
    }
    const updated = await updateOrderWithItems(ctx.db, id, ctx.teamId, data, items);
    if (!updated) {
      return null;
    }
    return getOrderWithItemsById(ctx.db, id, ctx.teamId);
  }),

  // Delete (soft delete)
  delete: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const res = await deleteOrder(ctx.db, input.id, ctx.teamId);
      return { id: res?.id ?? input.id };
    }),
});

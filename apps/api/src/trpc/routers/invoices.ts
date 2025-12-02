import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { DbClient } from "@Faworra/database/client";
import {
  createInvoiceWithItems,
  deleteInvoice,
  getInvoiceById,
  getInvoiceByTokenWithItems,
  getInvoicePaymentStatus,
  getInvoiceSummary,
  getInvoicesWithOrder,
  getInvoiceWithItems,
  getNextInvoiceNumber,
  getOrderWithItemsById,
  updateInvoice,
  updateInvoiceStatus,
  updateInvoiceWithItems,
} from "@Faworra/database/queries";
import { z } from "zod";
import {
  invoiceTemplates,
  invoices,
  and,
  eq,
  isNull,
  ne,
  orders,
  clients,
  teams,
  communicationAccounts,
  communicationOutbox,
  ilike,
} from "@Faworra/database/schema";
import { createTRPCRouter, publicProcedure, teamProcedure } from "../init";

const LIMIT_MIN = 1;
const LIMIT_MAX = 100;
const LIMIT_DEFAULT = 50;

const invoiceStatusFilterEnum = z.enum([
  "draft",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
]);

const PUBLIC_INVOICE_BASE_URL_ENV_KEYS = [
  "PUBLIC_INVOICE_BASE_URL",
  "NEXT_PUBLIC_INVOICE_PORTAL_URL",
  "NEXT_PUBLIC_APP_URL",
  "APP_URL",
  "DASHBOARD_URL",
];

function normalizeBaseUrl(url?: string | null) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/u, "");
}

function resolvePublicInvoiceBaseUrl() {
  for (const key of PUBLIC_INVOICE_BASE_URL_ENV_KEYS) {
    const normalized = normalizeBaseUrl(process.env[key as keyof NodeJS.ProcessEnv]);
    if (normalized) return normalized;
  }
  return null;
}

function generateInvoiceToken() {
  return randomBytes(24).toString("base64url");
}

async function createUniqueInvoiceToken(db: DbClient) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const token = generateInvoiceToken();
    const [existing] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.token, token))
      .limit(1);
    if (!existing) return token;
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to generate unique invoice token",
  });
}

function buildInvoiceUrl(token: string) {
  const baseUrl = resolvePublicInvoiceBaseUrl();
  return baseUrl ? `${baseUrl}/i/${token}` : null;
}

// Validation schemas
const invoiceItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  total: z.number().min(0, "Total must be positive"),
  orderItemId: z.string().uuid().optional(),
});

const invoiceCreateSchema = z.object({
  orderId: z.string().uuid().nullable().optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  amount: z.number().min(0),
  status: z
    .enum(["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"])
    .default("draft"),
  dueDate: z.string().datetime().nullable().optional(),
  scheduledSendAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  issueDate: z.string().datetime().optional(),
  template: z.record(z.any()).optional(),
  fromDetails: z.record(z.any()).optional(),
  customerDetails: z.record(z.any()).optional(),
  paymentDetails: z.record(z.any()).optional(),
  noteDetails: z.record(z.any()).optional(),
  topBlock: z.record(z.any()).optional(),
  bottomBlock: z.record(z.any()).optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

const invoiceUpdateSchema = z.object({
  id: z.string().uuid(),
  subtotal: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  amount: z.number().min(0).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  scheduledSendAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  issueDate: z.string().datetime().optional(),
  template: z.record(z.any()).optional(),
  fromDetails: z.record(z.any()).optional(),
  customerDetails: z.record(z.any()).optional(),
  paymentDetails: z.record(z.any()).optional(),
  noteDetails: z.record(z.any()).optional(),
  topBlock: z.record(z.any()).optional(),
  bottomBlock: z.record(z.any()).optional(),
  items: z.array(invoiceItemSchema).optional(),
});

export const invoicesRouter = createTRPCRouter({
  // Check if an invoice number already exists (exact match)
  searchInvoiceNumber: teamProcedure
    .input(z.object({ query: z.string().min(1), id: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const { invoices } = await import("@Faworra/database/schema");
      const rows = await ctx.db
        .select({ id: invoices.id })
        .from(invoices)
        .where(
          (await import("@Faworra/database/schema")).and(
            (await import("@Faworra/database/schema")).eq(invoices.teamId, ctx.teamId),
            (await import("@Faworra/database/schema")).eq(invoices.invoiceNumber, input.query),
            (await import("@Faworra/database/schema")).isNull(invoices.deletedAt),
            input.id
              ? (await import("@Faworra/database/schema")).ne(invoices.id, input.id)
              : (await import("@Faworra/database/schema")).sql`true`,
          ),
        )
        .limit(1);
      return Boolean(rows[0]);
    }),
  list: teamProcedure
    .input(
      z
        .object({
          limit: z.number().min(LIMIT_MIN).max(LIMIT_MAX).default(LIMIT_DEFAULT),
          cursor: z.object({ createdAt: z.string().nullable(), id: z.string() }).nullish(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const rows = await getInvoicesWithOrder(ctx.db, {
        teamId: ctx.teamId,
        limit: input?.limit,
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
            createdAt: last?.invoice?.createdAt
              ? new Date(last.invoice.createdAt).toISOString()
              : null,
            id: last?.invoice?.id,
          }
        : null;
      return { items, nextCursor };
    }),

  byId: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => await getInvoiceById(ctx.db, input.id, ctx.teamId)),

  invoiceSummary: teamProcedure
    .input(
      z
        .object({ statuses: z.array(invoiceStatusFilterEnum).optional() })
        .optional(),
    )
    .query(async ({ ctx, input }) =>
      await getInvoiceSummary(ctx.db, {
        teamId: ctx.teamId,
        statuses: input?.statuses,
      }),
    ),

  paymentStatus: teamProcedure.query(async ({ ctx }) =>
    await getInvoicePaymentStatus(ctx.db, ctx.teamId),
  ),

  // Get invoice with line items and payment info
  getWithItems: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => await getInvoiceWithItems(ctx.db, input.id, ctx.teamId)),

  getByToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const result = await getInvoiceByTokenWithItems(ctx.db, input.token);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }
      return result;
    }),

  // Get next invoice number
  getNextNumber: teamProcedure.query(async ({ ctx }) => ({
    invoiceNumber: await getNextInvoiceNumber(ctx.db, ctx.teamId),
  })),

  // Get default settings for new invoice (optionally from order)
  defaultSettings: teamProcedure
    .input(z.object({ orderId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const invoiceNumber = await getNextInvoiceNumber(ctx.db, ctx.teamId);
      let template: Record<string, any> = {};
      try {
        const tplRows = await ctx.db
          .select({ template: invoiceTemplates.template })
          .from(invoiceTemplates)
          .where(eq(invoiceTemplates.teamId, ctx.teamId!))
          .limit(1);
        template = (tplRows[0]?.template as any) ?? {};
      } catch {
        template = {};
      }

      const [teamRow] = await ctx.db
        .select({
          baseCurrency: teams.baseCurrency,
          timezone: teams.timezone,
          locale: teams.locale,
        })
        .from(teams)
        .where(eq(teams.id, ctx.teamId!))
        .limit(1);

      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + 1);

      const currency = template?.currency ?? teamRow?.baseCurrency ?? "GHS";
      const locale = template?.locale ?? ctx.locale ?? teamRow?.locale ?? "en-US";
      const timezone = template?.timezone ?? teamRow?.timezone ?? "UTC";

      const normalizedTemplate = {
        ...template,
        currency,
        locale,
        timezone,
        includeDiscount: template?.includeDiscount ?? false,
        includeDecimals: template?.includeDecimals ?? true,
        includeUnits: template?.includeUnits ?? false,
        includePdf: template?.includePdf ?? true,
        includeTax: template?.includeTax ?? false,
        includeVat: template?.includeVat ?? false,
        includeQr: template?.includeQr ?? true,
      } as Record<string, unknown>;

      // If creating from order, prefill data
      if (input?.orderId) {
        const order = await getOrderWithItemsById(ctx.db, input.orderId, ctx.teamId);
        if (!order) {
          throw new Error("Order not found");
        }

        // Map order items to invoice items
        const items = order.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number.parseFloat(String(item.unitPrice || item.unit_price || 0)),
          total: Number.parseFloat(String(item.total || 0)),
          orderItemId: item.id,
        }));

        const subtotal = Number.parseFloat(String(order.order.totalPrice || 0));

        return {
          invoiceNumber,
          orderId: input.orderId,
          clientId: order.order.clientId,
          clientName: order.client?.name,
          subtotal,
          tax: 0,
          discount: 0,
          amount: subtotal,
          status: "draft" as const,
          issueDate: now.toISOString(),
          dueDate: dueDate.toISOString(),
          notes: order.order.notes || null,
          template: normalizedTemplate,
          items,
        };
      }

      // Default empty invoice
      return {
        invoiceNumber,
        orderId: null,
        clientId: null,
        clientName: null,
        subtotal: 0,
        tax: 0,
        discount: 0,
        amount: 0,
        status: "draft" as const,
        issueDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        notes: null,
        template: normalizedTemplate,
        items: [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
      };
    }),

  updateStatus: teamProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string(),
        paidAt: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      updateInvoiceStatus(
        ctx.db,
        input.id,
        ctx.teamId,
        input.status,
        input.paidAt ? new Date(input.paidAt) : null,
      ),
    ),

  update: teamProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        invoiceNumber: z.string().optional(),
        amount: z.number().optional(),
        status: z.string().optional(),
        dueDate: z.string().datetime().nullable().optional(),
        paidAt: z.string().datetime().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input as any;
      if (rest.invoiceNumber) {
        const dup = await ctx.db
          .select({ id: (await import("@Faworra/database/schema")).invoices.id })
          .from((await import("@Faworra/database/schema")).invoices)
          .where(
            (await import("@Faworra/database/schema")).and(
              (await import("@Faworra/database/schema")).eq((await import("@Faworra/database/schema")).invoices.teamId, ctx.teamId),
              (await import("@Faworra/database/schema")).eq((await import("@Faworra/database/schema")).invoices.invoiceNumber, rest.invoiceNumber),
              (await import("@Faworra/database/schema")).isNull((await import("@Faworra/database/schema")).invoices.deletedAt),
              (await import("@Faworra/database/schema")).ne((await import("@Faworra/database/schema")).invoices.id, id),
            ),
          )
          .limit(1);
        if (dup[0]?.id) {
          throw new Error("Invoice number already exists");
        }
      }
      return await updateInvoice(ctx.db, id, ctx.teamId, rest);
    }),

  // Create invoice with line items
  create: teamProcedure.input(invoiceCreateSchema).mutation(async ({ ctx, input }) => {
    // Team-scoped uniqueness guard for invoice number (ignoring soft-deleted)
    const dup = await ctx.db
      .select({ id: (await import("@Faworra/database/schema")).invoices.id })
      .from((await import("@Faworra/database/schema")).invoices)
      .where(
        (await import("@Faworra/database/schema")).and(
          (await import("@Faworra/database/schema")).eq((await import("@Faworra/database/schema")).invoices.teamId, ctx.teamId),
          (await import("@Faworra/database/schema")).eq((await import("@Faworra/database/schema")).invoices.invoiceNumber, input.invoiceNumber),
          (await import("@Faworra/database/schema")).isNull((await import("@Faworra/database/schema")).invoices.deletedAt),
        ),
      )
      .limit(1);
    if (dup[0]?.id) {
      throw new Error("Invoice number already exists");
    }
    const { items, ...invoiceData } = input;

    const token = await createUniqueInvoiceToken(ctx.db);
    const invoiceUrl = token ? buildInvoiceUrl(token) : null;

    const invoice = await createInvoiceWithItems(
      ctx.db,
      {
        ...invoiceData,
        teamId: ctx.teamId,
        token,
        invoiceUrl,
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString() : null,
        scheduledSendAt: invoiceData.scheduledSendAt
          ? new Date(invoiceData.scheduledSendAt).toISOString()
          : null,
        issueDate: invoiceData.issueDate
          ? new Date(invoiceData.issueDate).toISOString()
          : undefined,
      } as any,
      items.map((item) => ({
        ...item,
        unitPrice: String(item.unitPrice),
        total: String(item.total),
      })),
    );

    return invoice;
  }),

  // Update draft invoice (only if status is draft)
  updateDraft: teamProcedure.input(invoiceUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, items, ...invoiceData } = input;

    const updated = await updateInvoiceWithItems(
      ctx.db,
      id,
      ctx.teamId,
      {
        ...invoiceData,
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString() : undefined,
        scheduledSendAt: invoiceData.scheduledSendAt
          ? new Date(invoiceData.scheduledSendAt).toISOString()
          : undefined,
        issueDate: invoiceData.issueDate
          ? new Date(invoiceData.issueDate).toISOString()
          : undefined,
      } as any,
      items?.map((item) => ({
        ...item,
        unitPrice: String(item.unitPrice),
        total: String(item.total),
      })),
    );

    return updated;
  }),

  // Send invoice (mark as sent, makes it immutable)
  send: teamProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    // Update status immediately
    const updated = await updateInvoice(ctx.db, input.id, ctx.teamId, {
      status: "sent",
      sentAt: new Date().toISOString(),
    } as any);

    // Fetch invoice + order/client minimal fields
    const [inv] = await ctx.db
      .select({
        id: invoices.id,
        teamId: invoices.teamId,
        orderId: invoices.orderId,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        currency: invoices.currency,
        invoiceUrl: invoices.invoiceUrl,
        template: invoices.template,
        token: invoices.token,
      })
      .from(invoices)
      .where(and(eq(invoices.id, input.id), eq(invoices.teamId, ctx.teamId), isNull(invoices.deletedAt)))
      .limit(1);
    if (!inv) return updated;

    let invoiceUrl = inv.invoiceUrl as string | null;
    if (!invoiceUrl && inv.token) {
      invoiceUrl = buildInvoiceUrl(inv.token) ?? null;
      if (invoiceUrl) {
        await ctx.db
          .update(invoices)
          .set({ invoiceUrl, updatedAt: new Date() })
          .where(and(eq(invoices.id, input.id), eq(invoices.teamId, ctx.teamId)));
      }
    }

    let whatsapp: string | null = null;
    if (inv.orderId) {
      const [ord] = await ctx.db
        .select({ clientId: orders.clientId })
        .from(orders)
        .where(and(eq(orders.id, inv.orderId), eq(orders.teamId, ctx.teamId)))
        .limit(1);
      if (ord?.clientId) {
        const [cust] = await ctx.db
          .select({ whatsapp: clients.whatsapp })
          .from(clients)
          .where(and(eq(clients.id, ord.clientId), eq(clients.teamId, ctx.teamId), isNull(clients.deletedAt)))
          .limit(1);
        whatsapp = (cust?.whatsapp as string | null) ?? null;
      }
    }

    const [acc] = await ctx.db
      .select({ id: communicationAccounts.id })
      .from(communicationAccounts)
      .where(
        and(
          eq(communicationAccounts.teamId, ctx.teamId),
          ilike(communicationAccounts.provider, "whatsapp%"),
          eq(communicationAccounts.status, "connected"),
        ),
      )
      .limit(1);

    const tpl: any = (inv.template as any) || {};
    const includePdf = Boolean(tpl.includePdf);
    const sendCopy = Boolean(tpl.sendCopy);

    const amountNum = Number(inv.amount || 0);
    const amountStr = amountNum.toLocaleString();
    const currency = String(inv.currency || "GHS");
    const link = invoiceUrl ? `\nView: ${invoiceUrl}` : "";
    const pdfNote = includePdf && invoiceUrl ? "\n(PDF available via link)" : "";
    const content = `Invoice ${inv.invoiceNumber}\nAmount: ${currency} ${amountStr}${link}${pdfNote}`;

    const enqueue = async (to: string) => {
      await ctx.db.insert(communicationOutbox).values({
        teamId: ctx.teamId,
        accountId: (acc as any)?.id,
        recipient: to,
        content,
        status: "queued",
      } as any);
    };

    try {
      if (whatsapp) await enqueue(whatsapp);
      if (sendCopy) {
        const to = process.env.INVOICE_SEND_COPY_WHATSAPP || process.env.NOTIFY_WHATSAPP;
        if (to) await enqueue(to);
      }
    } catch {}
    return updated;
  }),

  delete: teamProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const res = await deleteInvoice(ctx.db, input.id, ctx.teamId);
      return { id: res?.id ?? input.id };
    }),
});

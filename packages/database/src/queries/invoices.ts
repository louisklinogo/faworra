import { and, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { DbClient } from "../client";
import {
  clients,
  invoiceItems,
  invoices,
  orderItems,
  orders,
  teams,
  transactionAllocations,
} from "../schema";

export async function getInvoicesWithOrder(
  db: DbClient,
  params: {
    teamId: string;
    limit?: number;
    cursor?: { createdAt: Date | null; id: string } | null;
  },
) {
  const { teamId, limit = 50, cursor } = params;

  const baseWhere = and(eq(invoices.teamId, teamId), isNull(invoices.deletedAt));

  return await db
    .select({ invoice: invoices, order: orders, client: clients })
    .from(invoices)
    .leftJoin(orders, eq(invoices.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(
      cursor?.createdAt
        ? and(
            baseWhere,
            or(
              lt(invoices.createdAt, cursor.createdAt),
              and(eq(invoices.createdAt, cursor.createdAt), lt(invoices.id, cursor.id)),
            ),
          )
        : baseWhere,
    )
    .orderBy(desc(invoices.createdAt), desc(invoices.id))
    .limit(limit);
}

export async function getInvoiceById(db: DbClient, id: string, teamId: string) {
  const rows = await db
    .select({ invoice: invoices, order: orders, client: clients })
    .from(invoices)
    .leftJoin(orders, eq(invoices.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(and(eq(invoices.id, id), eq(invoices.teamId, teamId), isNull(invoices.deletedAt)))
    .limit(1);
  return rows[0] || null;
}

/**
 * Get invoice with line items
 */
export async function getInvoiceWithItems(db: DbClient, id: string, teamId: string) {
  // Get invoice with order and client
  const invoice = await getInvoiceById(db, id, teamId);
  if (!invoice) return null;

  // Get invoice items
  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(invoiceItems.createdAt);

  // Calculate amount paid from transaction allocations
  const allocationsResult = await db
    .select({ total: sql<string>`COALESCE(SUM(${transactionAllocations.amount}), 0)` })
    .from(transactionAllocations)
    .where(eq(transactionAllocations.invoiceId, id));

  const amountPaid = Number.parseFloat(allocationsResult[0]?.total || "0");
  const amountDue = Number.parseFloat(String(invoice.invoice.amount)) - amountPaid;

  return {
    ...invoice,
    items,
    amountPaid,
    amountDue,
  };
}

export async function getInvoiceByTokenWithItems(db: DbClient, token: string) {
  const [row] = await db
    .select({ invoice: invoices, order: orders, client: clients, team: teams })
    .from(invoices)
    .leftJoin(orders, eq(invoices.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(teams, eq(invoices.teamId, teams.id))
    .where(and(eq(invoices.token, token), isNull(invoices.deletedAt)))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, row.invoice.id))
    .orderBy(invoiceItems.createdAt);

  const allocationsResult = await db
    .select({ total: sql<string>`COALESCE(SUM(${transactionAllocations.amount}), 0)` })
    .from(transactionAllocations)
    .where(eq(transactionAllocations.invoiceId, row.invoice.id));

  const amountPaid = Number.parseFloat(allocationsResult[0]?.total || "0");
  const amountDue = Number.parseFloat(String(row.invoice.amount)) - amountPaid;

  return {
    invoice: row.invoice,
    order: row.order,
    client: row.client,
    team: row.team,
    items,
    amountPaid,
    amountDue,
  };
}

type InvoiceStatusFilter =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type InvoiceSummaryBreakdown = {
  currency: string;
  originalAmount: number;
  convertedAmount: number;
  count: number;
};

export type InvoiceSummaryResult = {
  totalAmount: number;
  invoiceCount: number;
  currency: string;
  breakdown?: InvoiceSummaryBreakdown[];
};

export async function getInvoiceSummary(
  db: DbClient,
  params: {
    teamId: string;
    statuses?: InvoiceStatusFilter[];
  },
): Promise<InvoiceSummaryResult> {
  const { teamId, statuses } = params;

  const [teamRow] = await db
    .select({ baseCurrency: teams.baseCurrency })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const baseCurrency = teamRow?.baseCurrency ?? "GHS";

  const filters = [eq(invoices.teamId, teamId), isNull(invoices.deletedAt)];
  if (statuses?.length) {
    filters.push(inArray(invoices.status, statuses as any));
  }
  const whereCondition = filters.length === 1 ? filters[0] : and(...filters);

  const rows = await db
    .select({ amount: invoices.amount, currency: invoices.currency })
    .from(invoices)
    .where(whereCondition);

  if (!rows.length) {
    return {
      totalAmount: 0,
      invoiceCount: 0,
      currency: baseCurrency,
    };
  }

  let totalAmount = 0;
  const breakdownMap = new Map<string, InvoiceSummaryBreakdown>();

  for (const row of rows) {
    const amount = Number(row.amount ?? 0) || 0;
    const currency = row.currency ?? baseCurrency;

    totalAmount += currency === baseCurrency ? amount : amount;

    const existing = breakdownMap.get(currency) ?? {
      currency,
      originalAmount: 0,
      convertedAmount: 0,
      count: 0,
    };

    existing.originalAmount += amount;
    existing.convertedAmount += amount;
    existing.count += 1;

    breakdownMap.set(currency, existing);
  }

  const breakdown = Array.from(breakdownMap.values()).map((entry) => ({
    ...entry,
    originalAmount: Math.round(entry.originalAmount * 100) / 100,
    convertedAmount: Math.round(entry.convertedAmount * 100) / 100,
  }));

  breakdown.sort((a, b) => b.originalAmount - a.originalAmount);

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    invoiceCount: rows.length,
    currency: baseCurrency,
    breakdown: breakdown.length > 1 ? breakdown : undefined,
  };
}

export type InvoicePaymentStatusResult = {
  score: number;
  paymentStatus: "good" | "average" | "bad";
};

export async function getInvoicePaymentStatus(
  db: DbClient,
  teamId: string,
): Promise<InvoicePaymentStatusResult> {
  const rows = await db
    .select({ status: invoices.status })
    .from(invoices)
    .where(and(eq(invoices.teamId, teamId), isNull(invoices.deletedAt)));

  if (!rows.length) {
    return { score: 0, paymentStatus: "average" };
  }

  let overdue = 0;
  let paid = 0;
  let partiallyPaid = 0;

  for (const row of rows) {
    const status = String(row.status ?? "");
    if (status === "overdue") overdue += 1;
    if (status === "paid") paid += 1;
    if (status === "partially_paid") partiallyPaid += 1;
  }

  const total = rows.length;
  const overdueRatio = overdue / total;
  const positiveRatio = (paid + partiallyPaid) / total;

  const baseScore = positiveRatio * 7 + (1 - overdueRatio) * 3;
  const score = Math.max(0, Math.min(10, Math.round(baseScore)));

  let paymentStatus: "good" | "average" | "bad";
  if (score >= 7) {
    paymentStatus = "good";
  } else if (score >= 4) {
    paymentStatus = "average";
  } else {
    paymentStatus = "bad";
  }

  return { score, paymentStatus };
}

/**
 * Generate next invoice number for team
 */
export async function getNextInvoiceNumber(db: DbClient, teamId: string): Promise<string> {
  const result = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(and(eq(invoices.teamId, teamId), isNull(invoices.deletedAt)))
    .orderBy(desc(invoices.createdAt))
    .limit(1);

  if (!result[0]) {
    return "INV-001";
  }

  // Extract number from invoice number (e.g., "INV-001" -> 1)
  const lastNumber = result[0].invoiceNumber;
  const match = lastNumber.match(/(\d+)$/);

  if (match) {
    const num = Number.parseInt(match[1], 10) + 1;
    return `INV-${String(num).padStart(3, "0")}`;
  }

  // Fallback
  return `INV-${String(result.length + 1).padStart(3, "0")}`;
}

/**
 * Create invoice (without items - use createInvoiceWithItems for full creation)
 */
export async function createInvoice(db: DbClient, data: typeof invoices.$inferInsert) {
  const res = await db.insert(invoices).values(data).returning();
  return res[0];
}

/**
 * Create invoice with line items (from order or manual)
 */
export async function createInvoiceWithItems(
  db: DbClient,
  invoice: typeof invoices.$inferInsert,
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: string | number;
    total: string | number;
    orderItemId?: string;
  }>,
) {
  // Create invoice
  const [newInvoice] = await db.insert(invoices).values(invoice).returning();

  // Create invoice items
  const invoiceItemsData = items.map((item) => ({
    invoiceId: newInvoice.id,
    orderItemId: item.orderItemId || null,
    name: item.name,
    quantity: item.quantity,
    unitPrice: String(item.unitPrice),
    total: String(item.total),
  }));

  await db.insert(invoiceItems).values(invoiceItemsData);

  return newInvoice;
}

/**
 * Update invoice with items (only if draft)
 */
export async function updateInvoiceWithItems(
  db: DbClient,
  id: string,
  teamId: string,
  invoice: Partial<typeof invoices.$inferInsert>,
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: string | number;
    total: string | number;
  }>,
) {
  // Check if invoice is still editable (draft)
  const existing = await getInvoiceById(db, id, teamId);
  if (!existing || existing.invoice.status !== "draft") {
    throw new Error("Can only update draft invoices");
  }

  // Update invoice
  const [updated] = await db
    .update(invoices)
    .set({ ...invoice, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.teamId, teamId)))
    .returning();

  // Update items if provided
  if (items) {
    // Delete existing items
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

    // Insert new items
    const invoiceItemsData = items.map((item) => ({
      invoiceId: id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      total: String(item.total),
    }));

    await db.insert(invoiceItems).values(invoiceItemsData);
  }

  return updated;
}

export async function updateInvoice(
  db: DbClient,
  id: string,
  teamId: string,
  data: Partial<typeof invoices.$inferInsert>,
) {
  const res = await db
    .update(invoices)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.teamId, teamId)))
    .returning();
  return res[0] || null;
}

export async function updateInvoiceStatus(
  db: DbClient,
  id: string,
  teamId: string,
  status: string,
  paidAt?: Date | null,
) {
  const patch: Partial<typeof invoices.$inferInsert> = { status } as any;
  if (status === "paid" && paidAt) (patch as any).paidAt = paidAt;
  return updateInvoice(db, id, teamId, patch);
}

export async function deleteInvoice(db: DbClient, id: string, teamId: string) {
  const res = await db
    .update(invoices)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.teamId, teamId)))
    .returning();
  return res[0] || null;
}

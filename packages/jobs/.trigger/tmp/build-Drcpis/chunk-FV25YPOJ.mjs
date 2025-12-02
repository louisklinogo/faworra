import {
  createJobSupabaseClient,
  external_exports
} from "./chunk-MXJZGXJH.mjs";
import {
  schemaTask
} from "./chunk-VWLV5ODT.mjs";
import {
  __name,
  init_esm
} from "./chunk-FHYA7B3S.mjs";

// src/tasks/invoice/operations/check-status.ts
init_esm();

// ../../node_modules/.bun/date-fns@4.1.0/node_modules/date-fns/addDays.js
init_esm();

// ../../node_modules/.bun/date-fns@4.1.0/node_modules/date-fns/constructFrom.js
init_esm();

// ../../node_modules/.bun/date-fns@4.1.0/node_modules/date-fns/constants.js
init_esm();
var daysInYear = 365.2425;
var maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1e3;
var minTime = -maxTime;
var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = secondsInDay * daysInYear;
var secondsInMonth = secondsInYear / 12;
var secondsInQuarter = secondsInMonth * 3;
var constructFromSymbol = Symbol.for("constructDateFrom");

// ../../node_modules/.bun/date-fns@4.1.0/node_modules/date-fns/constructFrom.js
function constructFrom(date, value) {
  if (typeof date === "function") return date(value);
  if (date && typeof date === "object" && constructFromSymbol in date)
    return date[constructFromSymbol](value);
  if (date instanceof Date) return new date.constructor(value);
  return new Date(value);
}
__name(constructFrom, "constructFrom");

// ../../node_modules/.bun/date-fns@4.1.0/node_modules/date-fns/toDate.js
init_esm();
function toDate(argument, context) {
  return constructFrom(context || argument, argument);
}
__name(toDate, "toDate");

// ../../node_modules/.bun/date-fns@4.1.0/node_modules/date-fns/addDays.js
function addDays(date, amount, options) {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date, NaN);
  if (!amount) return _date;
  _date.setDate(_date.getDate() + amount);
  return _date;
}
__name(addDays, "addDays");

// ../../node_modules/.bun/date-fns@4.1.0/node_modules/date-fns/subDays.js
init_esm();
function subDays(date, amount, options) {
  return addDays(date, -amount, options);
}
__name(subDays, "subDays");

// src/utils/update-invoice.ts
init_esm();
async function updateInvoiceStatus({
  invoiceId,
  status,
  paid_at
}) {
  const supabase = createJobSupabaseClient();
  await supabase.from("invoices").update({ status, paid_at: paid_at ?? null }).eq("id", invoiceId);
}
__name(updateInvoiceStatus, "updateInvoiceStatus");

// src/tasks/invoice/operations/check-status.ts
var checkInvoiceStatus = schemaTask({
  id: "check-invoice-status",
  schema: external_exports.object({
    invoiceId: external_exports.string().uuid()
  }),
  queue: { concurrencyLimit: 10 },
  run: /* @__PURE__ */ __name(async ({ invoiceId }) => {
    const supabase = createJobSupabaseClient();
    const { data: invoice } = await supabase.from("invoices").select("id, status, due_date, currency, amount, team_id, invoice_number").eq("id", invoiceId).maybeSingle();
    if (!invoice || !invoice.amount || !invoice.currency || !invoice.due_date) {
      return;
    }
    const since = subDays(/* @__PURE__ */ new Date(), 3).toISOString().slice(0, 10);
    const { data: transactions } = await supabase.from("transactions").select("id").eq("team_id", invoice.team_id).eq("amount", invoice.amount).eq("currency", String(invoice.currency).toUpperCase()).gte("date", since).eq("status", "completed");
    if (transactions && transactions.length === 1) {
      await updateInvoiceStatus({ invoiceId, status: "paid", paid_at: (/* @__PURE__ */ new Date()).toISOString() });
      return;
    }
    const isOverdue = new Date(invoice.due_date) < /* @__PURE__ */ new Date();
    if (isOverdue && invoice.status !== "paid" && invoice.status !== "cancelled") {
      await updateInvoiceStatus({ invoiceId, status: "overdue" });
    }
  }, "run")
});

export {
  checkInvoiceStatus
};
//# sourceMappingURL=chunk-FV25YPOJ.mjs.map

// Public API for other packages (API) to trigger tasks
export async function queueSendInvoiceNow(invoiceId: string) {
  const mod = await import("./tasks/invoice/operations/send-invoice");
  return mod.sendInvoiceNow.trigger({ invoiceId });
}

export async function queueSendInvoiceReminder(invoiceId: string) {
  const mod = await import("./tasks/invoice/operations/send-reminder");
  return mod.sendInvoiceReminder.trigger({ invoiceId });
}

// The scheduled sender runs on cron and reads DB scheduled_send_at
export async function registerAllTasks() {
  await import("./init");
}

export async function queueImportTransactions(payload: {
  teamId: string;
  bankAccountId: string;
  currency: string;
  filePath: string[];
  inverted?: boolean;
  mappings: { amount: string; date: string; description: string };
}) {
  const mod = await import("./tasks/transactions/import");
  return mod.importTransactions.trigger(payload);
}

export async function queueSyncExchangeRates(payload: { base: string; targets: string[] }) {
  const mod = await import("./tasks/fx/sync");
  return mod.syncExchangeRates.trigger(payload);
}

export async function queueRecomputeBaseAmounts(payload: { teamId?: string }) {
  const mod = await import("./tasks/fx/repair/recompute-base-amounts");
  return mod.recomputeBaseAmounts.trigger(payload);
}

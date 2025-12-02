/**
 * DEPRECATED: These helpers are no longer used (migrated to Trigger.dev flows).
 * Stubs are kept to avoid compile-time import errors if referenced.
 */
export type InvoiceRow = never;

export async function fetchOpenInvoices(_limit = 0): Promise<InvoiceRow[]> {
  return [] as unknown as InvoiceRow[];
}

export async function getAllocatedAmount(_invoiceId: string): Promise<number> {
  return 0;
}

export async function markInvoiceStatus(_invoiceId: string, _teamId: string, _status: any): Promise<void> {
  return;
}

## Midday ↔ Faworra Invoice Builder Parity Plan

### Context
- Goal: align `apps/dashboard/src/components/invoice-form.tsx` and the `invoice-builder/*` suite with Midday’s builder UX, behaviors, and data integrations while respecting Faworra backend constraints.
- Reference: Midday components under `midday/apps/dashboard/src/components/invoice/*`.

### High-Level Gaps
1. **Layout & Shell** – lacks scrollable invoice surface, header meta stack, preview/status footer, and section ordering used in Midday.
2. **Template Editing** – current `LabelEdit` mutates whole template state; missing granular `invoiceTemplate.upsert` calls and inline content-editable labels.
3. **Line Items** – no `useFieldArray` reordering, product autocomplete with learning, or formatted totals via `calculateLineItemTotal`.
4. **Summary & Totals** – manual subtotal/tax/discount math instead of `calculateTotal` + `AnimatedNumber` pipeline.
5. **Settings & Submit UX** – menu options, icons, TRPC updates, and scheduling workflow diverge; no autosave feedback or preview link.
6. **Content Blocks** – editors (from/customer/payment/note/top/bottom) do not persist template defaults or auto-swap to customer select flows.

### Implementation Steps
1. **Restructure InvoiceForm shell**
   - Wrap body in `ScrollArea`, align sections order, add `Meta`, `Logo`, `Summary`, and footer status identical to Midday.
   - Introduce autosave timestamp + preview link using existing env helpers.
2. **Adopt Midday label & editor pattern**
   - Replace `LabelEdit` usages with `LabelInput` equivalents that call `trpc.invoiceTemplates.upsert` per field.
   - Ensure editors leverage `EditBlock` behavior for fade-in when empty.
3. **Port line items module**
   - Swap to `useFieldArray`-driven list with `Reorder`, `ProductAutocomplete`, `ProductAwareAmountInput`, `QuantityInput`, optional units, and formatted totals.
   - Hook up product learning mutations via TRPC counterparts (or adapt if endpoints differ).
4. **Sync summary logic**
   - Use `calculateTotal` to populate `amount`, `tax`, `vat`, `subtotal`, `discount`; render `FormatAmount`/`AnimatedNumber` outputs.
5. **Mirror settings & submission UX**
   - Rebuild settings menu with Midday’s option set, icons, and mutation strategy.
   - Implement `SubmitButton` scheduling dropdown, calendar/time pickers, delivery type persistence, and schedule cancellation.
6. **Customer & block parity**
   - Align customer selection flow with Midday’s `SelectCustomer`, maintaining URL param interactions and template persistence for block content.
7. **Validation & Autosave**
   - Enforce invoice-number uniqueness checks, restrict autosave to valid states, and display saving/edited text feedback.
8. **QA & Tests**
   - Update affected tests (if any), run dashboard lint/test suites, verify scheduling and product selection flows.

### Open Questions / Checks
- Confirm Faworra TRPC endpoints support per-field template upserts; adjust mutations if backend differs.
- Validate availability of Midday helper modules (`calculateTotal`, `AnimatedNumber`, etc.) inside Faworra workspace or re-implement locally.
- Ensure scheduling feature parity aligns with Faworra job worker semantics.

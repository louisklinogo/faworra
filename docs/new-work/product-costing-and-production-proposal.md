# Faworra Costing & Production — Generic, Configurable Proposal

This document captures a generic, configurable approach to product/service costing and lightweight production tracking that works for African SMBs (e.g., tailoring outsourced or in‑house), and scales to other industries (retail, services, printing, bakery, etc.). It includes wireframes and a proposed schema extension plan.

## Core idea: Cost Profiles

- Team sets a default Cost Profile; each product/variant can override.
- Sections you can enable per profile:
  - Materials (inventory or ad‑hoc lines)
  - Work (Staff per‑hour/per‑piece, Vendor/Contractor services)
  - Overhead (per unit, % of labor, or monthly pool allocation)
  - Jobs (Job Cards) to track actuals per job/batch
- Multi‑currency everywhere: each line item stores its native currency; roll‑ups shown in product currency and team base currency.

---

## Low‑fi Wireframes (generic language)

### 1) 1‑minute Cost Profile Wizard (team default)
```
Step 1 — What do you sell?
[ ] Resale items (buy & sell)   [ ] Services   [ ] Make/Assemble products

Step 2 — How do you calculate cost? (you can change per product)
[ ] Materials/Inventory   [ ] Work (Staff)   [ ] Work (Vendors/Contractors)   [ ] Overhead
[ ] Use Job Cards (track per‑job actuals)

Step 3 — Defaults
Base Currency [GHS▼]    FX Source [Manual | BoG | CBN | Custom]
Overhead Method [Per unit | % of labor | Monthly pool]   Pool: [ 2000 ]
Expected units/month: [ 100 ]
Common Staff Rates:  Role [Sewing]  Rate [30] per [piece▼]  [+ Add]
Common Vendor Services:  Service [Jacket]  Rate [500] per [piece▼]  [+ Add]

Step 4 — Review
Cost Profile “Manufacturing - Hybrid” (Materials + Staff + Vendor + Overhead + Jobs)
[Finish & Set Default]   [Back]
```

### 2) Product → Costing Tab (generic)
```
Product: [Name]  Variant: [—]
[Costing] [Production] [Details]

Cost Profile (this product)
[ Materials ] [ Work ] [ Overhead ] [ Jobs ]
Currency: [Product Currency]    [Recalculate Cost] [Simulate FX/Prices]

Materials (Recipe/BOM - optional)
Item                 Qty/Unit  Unit Cost  Subtotal    [Add]

Work
- Staff (per hour/per piece):   Role     Rate   Basis   Est. Qty   Subtotal   [Add]
- Vendors/Contractors:          Service  Rate   Basis   Est. Qty   Subtotal   [Add]

Overhead
Method: [Per unit | % of labor | Monthly pool]    Value: [  ]

Standard Cost: [X]   Price: [Y]   Margin: [Badge]   Notes/Assumptions
```

### 3) Product → Production Tab (Jobs)
```
[Create Job Card]

Jobs
#     Status        Qty    Due       Cost     Margin   Actions
1042  Completed      5     Fri       4,935    23%      [View]
1043  In‑Progress    2     Mon       —        —        [View] [Complete]
```

### 4) Create Job Card (sections appear per Cost Profile)
```
Create Job
Product/Variant [ ]   Qty [ ]   Due [ ]   Currency [auto]

Materials (optional if enabled)
- Item [ ]   Qty [ ]   @Unit Cost [auto from last purchase]   Subtotal [ ]   [Add]

Work
- Staff:  Role [ ]  Rate [ ]  Basis [hour|piece]  Qty [ ]  Subtotal [ ]   [Add]
- Vendor: Service [ ]  Rate [ ]  Basis [hour|piece]  Qty [ ]  Subtotal [ ]   [Add]

Overhead
Method [Per unit | % of labor | Monthly pool]  Value [ ]

Summary: Materials [ ] + Work [ ] + Overhead [ ] = Total Cost [ ]
[Create Job]  [Cancel]
```

### 5) Job Card Detail (Actuals)
```
Job #[id]  Product [ ]  Qty [ ]  Status [In‑Progress]
[Issue Materials] [Add Work] [Attach] [Complete]

Materials (Actual)
- Item A  Qty  @Unit Cost → Subtotal
- Item B  ...

Work (Actual)
- Staff: Role  Rate  Basis  Qty → Cost
- Vendor: Service  Rate  Basis  Qty → Cost

Overhead (Applied) — method/value summary

Actual Cost: Materials [ ] + Work [ ] + Overhead [ ] = [ ]
Price (if set): [ ] → Margin [badge]
```

### 6) Settings → Cost Profiles & Rates
```
Cost Profiles
- Manufacturing - Hybrid (Default)  [Edit]
  Sections: Materials, Work(Staff+Vendor), Overhead, Jobs

Staff Rate Cards
Role    Rate   Basis (hour|piece)   Seniority Adj?   [Add]

Vendor Services
Service Rate   Basis (hour|piece)   [Add]

Overhead
Method (per unit | % of labor | monthly pool)
Pool amount, expected units/month (for allocation)
```

### 7) Mobile (compact)
- Create Job: product, qty, due; Materials (list+edit), Work (staff/vendor lines), Overhead; Summary; [Create].
- Job Detail: Materials used, Work entries, Overhead, Actual Cost, Margin; actions: Issue/Add/Complete.

---

## Proposed Database Schema (Drizzle-oriented)

Leverage existing tables: `products`, `productVariants` (already has `price`, `cost`, `currency`), `productInventory`, `inventoryLocations`, `transactions`, `exchangeRates`, `documents`.

Two layers are proposed: Minimal (Phase 1) and Extended (Phase 2+).

### Phase 1 — Minimal tables

- cost_profiles (optional; defaults per team; override per product)
  - id (uuid), teamId (uuid), name (text)
  - flags: useMaterials (bool), useWorkStaff (bool), useWorkVendors (bool), useOverhead (bool), useJobs (bool)
  - overheadMethod (enum: per_unit | pct_of_labor | monthly_pool)
  - poolAmount (numeric), expectedUnitsPerMonth (int), baseCurrency (text)

- rate_cards (generic for Staff and Vendors)
  - id (uuid), teamId (uuid), kind (enum: staff | vendor)
  - label (text), basis (enum: hour | piece), rate (numeric), currency (text)
  - modifiers jsonb (e.g., seniority %)

- job_cards
  - id (uuid), teamId (uuid), productId (uuid), variantId (uuid), qtyPlanned (int), dueDate (timestamp)
  - status (enum: planned | in_progress | completed | cancelled)
  - currency (text), notes (text), createdAt/updatedAt (tstz)

- job_materials
  - id (uuid), teamId (uuid), jobId (uuid)
  - componentVariantId (uuid | nullable for ad‑hoc), qty (numeric), unitCost (numeric), currency (text)
  - locationId (uuid, optional), sourceTxId (uuid, optional), createdAt (tstz)

- job_work (unified entries for staff and vendors)
  - id (uuid), teamId (uuid), jobId (uuid)
  - kind (enum: staff | vendor), rateCardId (uuid, optional), label (text)
  - basis (enum: hour | piece), qty (numeric), rate (numeric), currency (text)
  - assigneeUserId (uuid, optional), createdAt (tstz)

- overhead_pools
  - id (uuid), teamId (uuid), method (enum: per_unit | pct_of_labor | monthly_pool)
  - value (numeric), poolAmount (numeric), expectedUnitsPerMonth (int), currency (text)

- bom_templates (optional, per product/variant)
  - id (uuid), teamId (uuid), productId (uuid), variantId (uuid, optional), name (text), version (int), isDefault (bool)

- bom_template_items
  - id (uuid), teamId (uuid), bomId (uuid), componentVariantId (uuid | nullable), qtyPer (numeric), scrapPct (numeric), unit (text), notes (text)

Notes:
- Inventory movements can be implicit initially: deduct on job completion or explicit “issue” action (later can normalize).
- Costs stored in line currency; compute totals in product and base currencies via `exchangeRates`.

### Phase 2+ — Extended tables (optional / for advanced manufacturing)

- operations (id, teamId, name, defaultSetupMin, defaultRunMinPerUnit, workCenterId?)
- work_centers (id, name, capacityPerHour, overheadRatePerHour, currency)
- wo_operations (jobId, operationId, setupMin, runMin, rateRef, actualCost, currency)
- inventory_movements (variantId, locationId, jobId?, type: issue|receipt|adjustment, qty, unitCost, currency, occurredAt)
- costing_snapshots (variantId, standardCost, actualCost, currency, breakdown jsonb, takenAt)
- overhead_policies (id, key, formula jsonb)

---

## API (tRPC) — High level

- costing.profile: create/update/get per team/product
- costing.rollup: compute standard cost from BOM + rates + overhead, write optional snapshot, update `productVariants.cost`
- production.jobs: create/list/update status; detail with materials/work
- production.materials: add/issue/return (optionally link to transactions or inventory locations)
- production.work: add staff/vendor entries; rate lookup
- costing.analytics: simulate FX/price changes; variance/margin alerts

---

## Navigation & IA (Dashboard)

- Product detail → tabs
  - Costing: `/products/[id]?tab=costing` (BOM/recipe, standard cost, simulate)
  - Production: `/products/[id]?tab=production` (Job Cards list, create/complete jobs)
- Global Production module: `/production` (all jobs across products; filters, job details)
- Settings → Costing: `/settings/costing` (Cost Profiles, staff/vendor rate cards, overhead, FX source)
- Orders integration: order item row action “Create Job” on `/orders/[id]` (prefills product/qty)
- Reports/Analytics: `/analytics/costing` (profitability, FX/margin warnings) — optional Phase 2+

Implementation notes (Next.js app layout):
- `apps/dashboard/src/app/(dashboard)/products/[id]/` — add tabbed UI and routes for Costing/Production
- `apps/dashboard/src/app/(dashboard)/production/` — global production list/detail
- `apps/dashboard/src/app/(dashboard)/settings/costing/` — Cost Profiles & Rates pages
- `apps/dashboard/src/app/(dashboard)/orders/[id]/` — “Create Job” action entry point

---

## Rollout Plan

1) Phase 1 (2 sprints)
   - Cost Profiles, Costing tab, Job Cards, Materials/Work/Overhead lines, basic margin and FX display.
2) Phase 2
   - BOM templates, auto‑cost from latest supplier transactions, WhatsApp share, snapshots and simulation.
3) Phase 3
   - Operations/time tracking, overhead policies, inventory movements normalization, variance analytics, anomaly alerts.

---

## Africa SMB Focus

- Mobile‑first, low‑input flows, offline syncing.
- MoMo/bank receipt OCR → infer unit costs for materials.
- FX sources configurable (manual/BoG/CBN/custom); margin warnings when rates move.

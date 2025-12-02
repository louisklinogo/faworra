# Products UX Plan (List + Details)

## Goals
- Improve discoverability, speed, and editing efficiency across Products and Product Details pages.
- Maintain strict parity with Transactions patterns: initialData, sticky toolbars, chips, column visibility, virtualization.

## Scope
- Products list (index)
- Product details ([id]) including Variants, Media
- Supporting child pages (categories, locations, low-stock, bulk editor)

## Phase 1 — Toolbar + Table polish (shipped)
- Sticky 3‑column toolbar (selection summary • spacer • controls)
- Filters: chips + advanced dropdown; Reset shows only when active
- Column visibility (persisted); keyboard nav; CSV export; selection/bulk actions
- Row actions use kebab; colored pills for status/type

## Phase 2 — Details page parity (shipped)
- Left‑aligned, wider container (6xl/7xl)
- Header kebab (Archive/Unarchive/Delete)
- Variants tab toolbar with Add Variant (primary CTA)
- VariantSheet aligned to ProductSheet (width, footer, SubmitButton, stock controls)
- Media uses next/image; Overview pills color‑coded

## Phase 3 — Analytics header (shipped)
- KPI carousel: total, active, draft, archived, low/out‑of‑stock; top categories with sheet
- tRPC: products.stats, products.topCategories; server initialData

## Phase 4 — Variants and inventory UX
- Variants list toolbar: search, sort, column visibility, bulk edit/archive
- Inline quick edit (price/status), “open in side sheet” preview
- Inventory tab: per‑location grid with adjustments; history log

## Phase 5 — Saved views & presets
- Save filters+columns+sort as views; pin default view per role
- Density toggle; column pinning; role‑based presets (Ops vs Sales)

## Phase 6 — Bulk operations
- Bulk price adjust; archive/unarchive; CSV import wizard; duplicate products

## Child Pages
- /products/categories — tree editor with color, slug, description
- /products/locations — inventory locations CRUD (default flag)
- /products/low-stock — dashboard with actions (reorder/export)
- /products/bulk — spreadsheet‑like editor (guarded by role)
- /products/templates — product/variant templates and attributes

## Acceptance Criteria
- All pages use initialData; no mount refetch; virtualization for 50+ rows
- Teams scoped queries; no unscoped DB access; colored pills consistent with Transactions
- Lint/typecheck pass; a11y basics (no label without control; keyboard focus)

## Non‑Goals
- Pricing/discount engine; promos; complex bundles UI (future)

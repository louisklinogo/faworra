 # UI Constitution and Styles
 
 ## Layout
 - Dashboard layout: Sidebar + Header + page content; page content uses left‑aligned container (default width fluid, details pages typically `max-w-6xl xl:max-w-7xl`).
 - Sticky toolbars: 3‑column grid (`grid-cols-[420px,1fr,auto]`), selection summary left; controls right.
 - Spacing: use Tailwind scale; section gaps 4–6; cards `p-4`/`p-6`.
 
 ## Buttons
 - Primary: icon + label for main CTA in context (e.g., “+ New Product”, “Add Variant”).
 - Secondary: outline/ghost for utilities; icon‑only for crowded toolbars (Export, Column visibility, Filter icon).
 - Destructive: `variant="destructive"` only in menus or confirmed actions.
 
 ## Filters
 - Chips row as single source of truth; advanced FilterDropdown for complex filters.
 - Show “Reset” only when filters active.
 - Query params via nuqs; never prefetch initial loads.
 
 ## Tables
 - TanStack Table; virtualization for 50+ rows; sticky select/date/name columns as needed.
 - Row selection with bulk actions; export selected to CSV.
 - Column visibility popover (persist to `localStorage`), stable row keys.
 
 ## Pills / Badges (Color Coding)
 - Transactions: status/type styled with color pills; Products mirror this pattern.
 - Product status:
   - active: green (`bg-green-100 text-green-700 border-green-200`)
   - draft: amber (`bg-amber-100 text-amber-700 border-amber-200`)
   - archived: slate (`bg-slate-100 text-slate-700 border-slate-200`)
 - Product type:
   - physical: sky, digital: purple, service: emerald, bundle: indigo (same pill pattern)
 - Pill shape: rounded‑full, `px-2.5 py-0.5`, `font-medium text-xs`, `variant="outline"`.
 
 ## Sheets
 - Width: creation/edit sheets `sm:max-w-[650px]` unless content demands more.
 - Structure:
   - Header: `SheetHeader` with `SheetTitle`, minimal subtitle.
   - Body: scrollable area `scrollbar-hide flex-1 overflow-y-auto px-6 py-4`.
   - Footer: non‑scrolling `flex-shrink-0 border-t px-6 py-4` with primary `SubmitButton` and Cancel (outline).
 - Close behavior: Cancel closes; onSuccess closes and invalidates queries.
 
 ## Analytics
 - Carousel at top with compact KPI cards; on the right place prev/next controls.
 - “View all” opens side sheet; use same loading skeletons across analytics.
 
 ## Actions Menus
 - Row actions: kebab (MoreHorizontal) with clear item labels; optimistic updates allowed.
 - Page‑level destructive/rare actions (Archive/Delete) in header kebab; primary CTAs live in tab toolbars.
 
 ## Empty/Skeleton States
 - Empty states: concise title/description, primary action, use same sizes in toolbar vs empty card (sm for toolbar; full‑width on mobile empty card).
 - Skeletons: subtle pulse bars matching content layout.
 
 ## Accessibility
 - Do not use `<label>` without a control; use div/span for static labels.
 - Keyboard: Up/Down/Home/End navigation in tables; Space/Enter toggles selection.
 - Icon sizes 16px (`h-4 w-4`) in dense toolbars.
 
 ## Performance Rules
 - Server Components fetch initial data; pass as props to Client Components; disable mount refetch.
 - Infinite queries + cursor pagination; indexes for hot paths.
 
 ## Security & Multi‑tenancy
 - All queries scoped by `team_id`; no client‑provided team id trusted.
 
 ## Component Inventory (reference)
 - Toolbar: SearchInline, FilterDropdown, ColumnVisibility, Export, primary CTA.
 - Tables: TanStack + virtualization; BulkActions; TagsCell (transactions); Products columns.
 - Sheets: ProductSheet, VariantSheet (standardized), TransactionSheet.
 

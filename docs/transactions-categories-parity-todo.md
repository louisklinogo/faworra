# Transactions › Categories Parity – TODO

Goal: Achieve UX parity with Midday for the Transactions › Categories subpage, tailored to our domain and data model.

## P0 – Must-have parity
- [x] Add search filter input to filter categories by name (case-insensitive) and auto-include ancestors of matches.
- [x] Replace inline edit/delete buttons with kebab menu (Edit, Remove), and open edit on row click; ensure expand toggle doesn’t trigger row click.
- [x] Block parent change in Edit when the category has children (clear message instead of failing on save).
- [x] Render tax type with friendly label (VAT/GST/Sales Tax) and format tax rate with “%”.
- [x] Show description tooltip on name (user description; fallback to “No description”).

## P1 – Behavior/consistency
- [x] Analytics: honor category.excluded in spending/stats (join categories and filter excluded; keep uncategorized).
- [x] Default tax type by team country (simple map; Ghana → VAT).
- [x] Color/name input: adopt InputColor-style UX.
- [x] Empty state polish and System badge styling to match Midday.
- [x] Denormalize excludeFromAnalytics on recent transactions (last 18 months) when category.excluded changes (create/update).

## Notes
- Back-end already prevents parent change when children exist and protects from cycles; UI now mirrors that to avoid failed saves.
- Search preserves hierarchy by including ancestors of matches; expansion isn’t required while searching.

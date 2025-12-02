# UI/UX Parity (Midday)

Rules
- Mirror Midday’s UI/UX and component patterns by default (tables, filters, pagination, sheets/dialogs, empty states, spacing/typography).
- Do not improvise without explicit approval. No placeholder UIs.
- Reuse existing components/patterns seen in `midday`; deviations require documented rationale.
- Before implementing, perform a “UI parity check” and reference the closest Midday pages/components.
- Plans must enumerate any new UI actions/links/buttons; do not add unlisted actions.

Data Table Guidelines
- Follow docs/coding-guidelines-data-tables.md for infinite queries, virtualization (50+ rows), real‑time updates, and extracted hooks.

Performance Pattern
- Every page must use the initialData pattern to avoid mount refetch and reduce requests.

# Performance Targets

Targets (post Phase A+B)
- Initial page load: 200–400ms (was 800–1100ms).
- Navigation: 150–250ms (was 600–800ms).
- API: < 100ms (cached).
- Real‑time delivery: < 500ms.
- tRPC cache hit rate: > 80%.
- Network requests: ~50% reduction per page.

Key Optimizations
- All core pages use initialData (zero prefetch waste).
- Auth checks use `React.cache()` for deduplication.
- Team dropdown and similar fetch server‑side.
- Consistent Server → Client data flow; keyset pagination; indexes on hot paths.

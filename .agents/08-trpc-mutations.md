# tRPC Mutations

Pattern
```ts
const utils = trpc.useUtils();
const { mutate, isPending } = trpc.feature.create.useMutation({
  onSuccess: () => utils.feature.list.invalidate(),
});
```

Guidelines
- Always invalidate the relevant queries on success to refresh caches.
- Use optimistic updates for snappy UX; reconcile on server response.
- Show loading states with `isPending`; surface errors clearly.
- Keep selections minimal in router procedures; avoid N+1.
- Apply Zod input validation and return `{ error: string }` on failure.

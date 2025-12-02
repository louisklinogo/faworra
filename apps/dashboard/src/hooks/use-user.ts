import { useTRPC } from "@/trpc/client";

export function useUserQuery() {
  const trpc = useTRPC();
  return trpc.teams.current.useQuery(undefined, {
    staleTime: 60_000,
  });
}

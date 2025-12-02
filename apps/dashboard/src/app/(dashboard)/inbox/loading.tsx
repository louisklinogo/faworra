import { Skeleton } from "@/components/ui/skeleton";

const LIST_SKELETON_KEYS = [
  "list-1",
  "list-2",
  "list-3",
  "list-4",
  "list-5",
  "list-6",
  "list-7",
  "list-8",
] as const;
const MSG_SKELETON_KEYS = ["msg-1", "msg-2", "msg-3", "msg-4", "msg-5"] as const;

export default function InboxLoading() {
  return (
    <main className="p-6">
      <div className="h-[calc(100vh-118px)] overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-[300px]" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 gap-4 overflow-hidden pt-4">
            {/* List */}
            <div className="w-80 space-y-2 overflow-hidden border-r pr-4">
              {LIST_SKELETON_KEYS.map((k) => (
                <div className="flex items-start gap-3 rounded-lg border p-3" key={k}>
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="mb-2 h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="mt-2 h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="rounded-lg border p-6">
                <div className="mb-6 flex items-center gap-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div>
                    <Skeleton className="mb-2 h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>

                <div className="space-y-4">
                  {MSG_SKELETON_KEYS.map((k, i) => (
                    <div
                      className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                      key={k}
                    >
                      <div className="max-w-[70%]">
                        <Skeleton className={`h-16 ${i % 2 === 0 ? "w-64" : "w-48"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

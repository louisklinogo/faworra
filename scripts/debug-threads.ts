import "dotenv/config";
import { db } from "@Faworra/database/client";
import { communicationThreads } from "@Faworra/database/schema";

async function main() {
  const rows = await db
    .select({
      id: communicationThreads.id,
      teamId: communicationThreads.teamId,
      status: communicationThreads.status,
      assignedUserId: communicationThreads.assignedUserId,
      lastMessageAt: communicationThreads.lastMessageAt,
    })
    .from(communicationThreads)
    .limit(20);

  console.log(rows);
}

main().catch((err) => {
  console.error(err);
});

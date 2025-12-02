import "dotenv/config";
import { db } from "@Faworra/database/client";

async function main() {
  const rows = await db.query.users.findMany({
    columns: {
      id: true,
      email: true,
      currentTeamId: true,
      createdAt: true,
      updatedAt: true,
    },
    limit: 5,
  });

  console.log(rows);
}

main().catch((err) => {
  console.error(err);
});

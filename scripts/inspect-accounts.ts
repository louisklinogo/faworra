import "dotenv/config";
import { createServerClient } from "@Faworra/supabase/server";

async function main() {
  const supabase = await createServerClient({ admin: true });
  const { data, error } = await supabase
    .from("communication_accounts")
    .select("id, team_id, provider, external_id, status, credentials_encrypted, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching accounts", error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
});

#!/usr/bin/env bun

import "dotenv/config";
import { Client } from "pg";

/*
  Drops unused indexes listed on stdin or via --indexes=name1,name2 (names only),
  but only when CONFIRM_DROP_UNUSED=1.
  Usage:
    bun scripts/drop-unused-indexes.ts --indexes=idx_a,idx_b
    echo "idx_a\nidx_b" | bun scripts/drop-unused-indexes.ts
*/

function parseArg(flag: string) {
  const v = process.argv.find((a) => a.startsWith(`${flag}=`));
  return v ? v.split("=").slice(1).join("=") : undefined;
}

async function readStdin(): Promise<string> {
  return await new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.resume();
  });
}

async function main() {
  if (process.env.CONFIRM_DROP_UNUSED !== "1") {
    console.error("❌ Set CONFIRM_DROP_UNUSED=1 to enable drops.");
    process.exit(1);
  }
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ Missing SUPABASE_DB_URL or DATABASE_URL");
    process.exit(1);
  }
  let list: string[] = [];
  const arg = parseArg("--indexes");
  if (arg) list = arg.split(",").map((s) => s.trim()).filter(Boolean);
  else {
    const stdin = (await readStdin()).trim();
    if (stdin) list = stdin.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  }
  if (!list.length) {
    console.error("No index names provided.");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    for (const name of list) {
      const sql = `DROP INDEX CONCURRENTLY IF EXISTS ${name}`;
      console.log("Dropping:", sql);
      try {
        await client.query(sql);
      } catch (e) {
        console.error(`Failed to drop ${name}:`, (e as Error).message);
      }
    }
    console.log("✅ Drop complete.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

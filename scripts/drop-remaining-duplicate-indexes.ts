#!/usr/bin/env bun

import "dotenv/config";
import { Client } from "pg";

async function main() {
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ Missing SUPABASE_DB_URL or DATABASE_URL");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const drops = [
      // Keep canonical names; drop redundant duplicates
      "transaction_category_embeddings_vector_idx",
      "idx_product_media_variant_id_fk",
      "idx_product_media_product_id_fk",
    ];
    for (const name of drops) {
      const sql = `DROP INDEX CONCURRENTLY IF EXISTS ${name}`;
      console.log("Dropping:", sql);
      await client.query(sql);
    }
    console.log("✅ Dropped remaining duplicate indexes.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

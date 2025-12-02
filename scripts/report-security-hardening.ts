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
    // Views without security_invoker=true
    const views = await client.query(`
      SELECT c.relname,
             EXISTS (
               SELECT 1 FROM unnest(coalesce(c.reloptions, ARRAY[]::text[])) opt
               WHERE opt ILIKE 'security_invoker=true'
             ) AS is_invoker
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname='public' AND c.relkind IN ('v','m')
    `);
    const nonInvoker = views.rows.filter((r) => !r.is_invoker).map((r) => r.relname);

    // Functions without pinned search_path in public + private
    const funcs = await client.query(`
      SELECT p.oid,
             p.prosecdef AS security_definer,
             p.proname,
             n.nspname,
             pg_get_function_identity_arguments(p.oid) AS args,
             p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname IN ('public','private')
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
        )
    `);
    const missingSearchPath = [] as { name: string; args: string }[];
    const definerFuncs = [] as { name: string; args: string }[];
    for (const f of funcs.rows) {
      const cfg: string[] = f.proconfig || [];
      const hasSearchPath = cfg.some((x) => x.toLowerCase().startsWith("search_path="));
      if (!hasSearchPath) missingSearchPath.push({ name: `${f.nspname}.${f.proname}`, args: f.args });
      if (f.security_definer) definerFuncs.push({ name: `${f.nspname}.${f.proname}`, args: f.args });
    }

    console.log(`Views without security_invoker=true: ${nonInvoker.length}`);
    if (nonInvoker.length) console.log("- "+nonInvoker.join(", "));
    console.log(`Functions without pinned search_path: ${missingSearchPath.length}`);
    if (missingSearchPath.length) console.log("- "+missingSearchPath.slice(0,50).map((x)=>`${x.name}(${x.args})`).join(", "));
    console.log(`Functions with SECURITY DEFINER: ${definerFuncs.length}`);
    if (definerFuncs.length) console.log("- "+definerFuncs.slice(0,50).map((x)=>`${x.name}(${x.args})`).join(", "));
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

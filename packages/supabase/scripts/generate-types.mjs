#!/usr/bin/env node
/**
 * Writes packages/supabase/src/types/db.ts from the hosted Supabase schema.
 * Requires SUPABASE_PROJECT_ID. For private projects, use a logged-in CLI or
 * SUPABASE_ACCESS_TOKEN (see Supabase docs).
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const outPath = join(pkgRoot, "src/types/db.ts");

const projectId = process.env.SUPABASE_PROJECT_ID?.trim();
if (!projectId) {
	console.error(
		"Missing SUPABASE_PROJECT_ID (Supabase Dashboard → Project Settings → General → Reference ID).\n" +
			"Example: SUPABASE_PROJECT_ID=your_ref bun run supabase:types"
	);
	process.exit(1);
}

const banner = `/**
 * Supabase generated \`Database\` types.
 *
 * Regenerate after remote schema changes:
 *   SUPABASE_PROJECT_ID=<ref> bun run supabase:types
 *
 * Drift guard (expected columns on key tables):
 *   bun run verify:supabase-types
 *
 * Source of truth: hosted Postgres / Supabase — keep packages/db migrations aligned.
 */

`;

const cmd = `npx --yes supabase@2.89.1 gen types typescript --project-id "${projectId.replace(/"/g, "")}"`;

let generated;
try {
	generated = execSync(cmd, {
		cwd: pkgRoot,
		encoding: "utf8",
		maxBuffer: 20 * 1024 * 1024,
		stdio: ["ignore", "pipe", "pipe"],
	});
} catch (e) {
	const stderr = e instanceof Error && "stderr" in e ? String(e.stderr) : "";
	console.error(stderr || e);
	console.error(
		"\nIf auth failed: run `npx supabase login` once, or set SUPABASE_ACCESS_TOKEN for CI."
	);
	process.exit(1);
}

writeFileSync(outPath, `${banner}\n${generated.trimStart()}`);
console.log("Wrote", outPath);

#!/usr/bin/env node
/**
 * Lightweight guard so regen'd types are not accidentally stripped of columns
 * that exist in Drizzle migrations (e.g. bank_accounts.error_retries).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "../src/types/db.ts");
const s = readFileSync(dbPath, "utf8");

function extractBankAccountsRowBlock(src) {
	const key = "bank_accounts:";
	const start = src.indexOf(key);
	if (start === -1) {
		return null;
	}
	const rowKey = "Row:";
	const rowStart = src.indexOf(rowKey, start);
	if (rowStart === -1) {
		return null;
	}
	const braceOpen = src.indexOf("{", rowStart);
	if (braceOpen === -1) {
		return null;
	}
	let depth = 0;
	for (let i = braceOpen; i < src.length; i++) {
		const ch = src[i];
		if (ch === "{") {
			depth++;
		}
		if (ch === "}") {
			depth--;
			if (depth === 0) {
				return src.slice(braceOpen, i + 1);
			}
		}
	}
	return null;
}

const rowBlock = extractBankAccountsRowBlock(s);
if (!rowBlock) {
	console.error(
		"verify-supabase-types: could not find bank_accounts.Row block"
	);
	process.exit(1);
}

const required = ["error_retries", "error_details"];
for (const col of required) {
	if (!rowBlock.includes(col)) {
		console.error(
			`verify-supabase-types: bank_accounts.Row missing "${col}" — regen types after applying migrations, or merge manually.\n` +
				"  Run: SUPABASE_PROJECT_ID=<ref> bun run supabase:types"
		);
		process.exit(1);
	}
}

console.log("verify-supabase-types: ok");

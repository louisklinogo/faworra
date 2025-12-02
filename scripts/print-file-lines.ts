#!/usr/bin/env bun
import fs from "fs";
import path from "path";

const file = process.argv[2];
if (!file) {
  console.error("Usage: bun scripts/print-file-lines.ts <absolute-or-relative-path>");
  process.exit(1);
}
const p = path.resolve(process.cwd(), file);
const text = fs.readFileSync(p, "utf8");
const lines = text.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const n = String(i + 1).padStart(4, " ");
  console.log(`${n}: ${lines[i]}`);
}

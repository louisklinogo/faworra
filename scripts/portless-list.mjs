#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

if (process.platform === "win32") {
	console.log(
		"[portless] Portless is currently unsupported on Windows. Dev scripts fall back to localhost ports here."
	);
	process.exit(0);
}

const portlessBin = join(rootDir, "node_modules", ".bin", "portless");
if (!existsSync(portlessBin)) {
	console.error(
		"[portless] Local portless binary not found. Run 'bun install' at the repo root."
	);
	process.exit(1);
}

const child = spawn(portlessBin, ["list"], {
	cwd: rootDir,
	env: process.env,
	stdio: "inherit",
});

child.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
	}
	process.exit(code ?? 0);
});

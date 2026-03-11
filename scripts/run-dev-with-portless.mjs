#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const app = process.argv[2];

const configs = {
	dashboard: {
		fallbackPort: "3001",
		direct: ["bun", "x", "next", "dev", "--port", "3001"],
		portless: ["dashboard.faworra", "bun", "x", "next", "dev"],
		env: {
			NEXT_PUBLIC_SERVER_URL: "http://api.faworra.localhost",
		},
	},
	api: {
		fallbackPort: "3000",
		direct: ["bun", "run", "--hot", "src/index.ts"],
		portless: ["api.faworra", "bun", "run", "--hot", "src/index.ts"],
		env: {
			BETTER_AUTH_URL: "http://api.faworra.localhost",
			POLAR_SUCCESS_URL:
				"http://dashboard.faworra.localhost/success?checkout_id={CHECKOUT_ID}",
			CORS_ORIGIN: "http://dashboard.faworra.localhost",
		},
	},
	docs: {
		fallbackPort: "4000",
		direct: ["bun", "x", "next", "dev", "--port", "4000"],
		portless: ["docs.faworra", "bun", "x", "next", "dev"],
		env: {},
	},
};

const config = configs[app];

if (!config) {
	console.error(
		`[portless] Unknown app '${app}'. Expected dashboard, api, or docs.`
	);
	process.exit(1);
}

const env = { ...process.env };
if (process.platform === "win32") {
	env.PORT ??= config.fallbackPort;
	env.HOST ??= "127.0.0.1";
	for (const [key, value] of Object.entries(config.env)) {
		env[key] ??= value;
	}

	console.warn(
		`[portless] Portless currently supports macOS/Linux. Falling back to localhost:${config.fallbackPort} for ${app} on Windows.`
	);

	const child = spawn(config.direct[0], config.direct.slice(1), {
		cwd: process.cwd(),
		env,
		stdio: "inherit",
	});

	child.on("exit", (code, signal) => {
		if (signal) {
			process.kill(process.pid, signal);
		}
		process.exit(code ?? 0);
	});
} else {
	const portlessBin = join(rootDir, "node_modules", ".bin", "portless");
	if (!existsSync(portlessBin)) {
		console.error(
			"[portless] Local portless binary not found. Run 'bun install' at the repo root."
		);
		process.exit(1);
	}

	const child = spawn(portlessBin, config.portless, {
		cwd: process.cwd(),
		env,
		stdio: "inherit",
	});

	child.on("exit", (code, signal) => {
		if (signal) {
			process.kill(process.pid, signal);
		}
		process.exit(code ?? 0);
	});
}

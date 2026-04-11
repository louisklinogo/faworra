import { createContext } from "@faworra-new/api/context";
import { appRouter } from "@faworra-new/api/routers/index";
import { auth } from "@faworra-new/auth";
import { db } from "@faworra-new/db";
import { env } from "@faworra-new/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { tasks } from "@trigger.dev/sdk";

// Webhook routes (midday parity: /webhook/{provider})
import monoWebhook from "./routes/mono";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ─── Webhook Routes ────────────────────────────────────────────────────────────
// Mono banking provider webhooks
app.route("/webhook/mono", monoWebhook);

// ─── tRPC Routes ───────────────────────────────────────────────────────────────

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	})
);

app.get("/", (c) => {
	return c.text("OK");
});

// ─── Test Routes (Development Only) ─────────────────────────────────────────

/**
 * Test endpoint to trigger bank sync
 * Usage: POST /test/sync-bank with {"connectionId": "uuid"}
 *
 * This bypasses Mono and directly triggers the sync task
 * for testing the Supabase client + Trigger.dev flow
 */
app.post("/test/sync-bank", async (c) => {
	try {
		const body = await c.req.json();
		const { connectionId } = body as { connectionId: string };

		if (!connectionId) {
			return c.json({ error: "connectionId required" }, 400);
		}

		// Verify connection exists
		const connection = await db.query.bankConnections.findFirst({
			where: (bc, { eq }) => eq(bc.id, connectionId),
		});

		if (!connection) {
			return c.json({ error: "Connection not found" }, 404);
		}

		console.log("[test/sync-bank] Triggering sync for connection:", connectionId);

		// Trigger the sync task
		const result = await tasks.trigger("sync-connection", {
			connectionId,
			manualSync: true,
		});

		return c.json({
			success: true,
			taskId: result.id,
			connectionId,
			status: "triggered",
		});
	} catch (error) {
		console.error("[test/sync-bank] Error:", error);
		return c.json(
			{
				error: "Failed to trigger sync",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500
		);
	}
});

/**
 * Get test banking data - useful for verifying seed worked
 */
app.get("/test/banking-data", async (c) => {
	try {
		const connections = await db.query.bankConnections.findMany();
		const accounts = await db.query.bankAccounts.findMany();

		return c.json({
			connections: connections.length,
			accounts: accounts.length,
			data: { connections, accounts },
		});
	} catch (error) {
		return c.json({ error: "Failed to fetch data" }, 500);
	}
});

export default app;

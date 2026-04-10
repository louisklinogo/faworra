import { createContext } from "@faworra-new/api/context";
import { appRouter } from "@faworra-new/api/routers/index";
import { auth } from "@faworra-new/auth";
import { env } from "@faworra-new/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

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

export default app;

import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { Server } from "socket.io";
import { parse } from "url";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "@Faworra/logging";
import { initPresence } from "@Faworra/realtime/presence";
import { RTEventSchema } from "@Faworra/realtime/events";
import { channels } from "@Faworra/realtime";
import { loadRealtimeConfig } from "@Faworra/config";
import type { RTEvent } from "@Faworra/realtime/events";
const logger = createLogger({ enablePretty: process.env.NODE_ENV !== "production" });

// Minimal Socket.IO server with an /events HTTP endpoint to broadcast typed events

const CFG = loadRealtimeConfig();
const PORT = CFG.port;
const REALTIME_INTERNAL_TOKEN = CFG.internalToken || "";

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const { pathname } = parse(req.url || "");
    if (req.method === "GET" && pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (req.method === "POST" && pathname === "/events") {
      const auth = req.headers["authorization"] || "";
      if (!REALTIME_INTERNAL_TOKEN || !auth.startsWith("Bearer ") || auth.slice(7) !== REALTIME_INTERNAL_TOKEN) {
        logger.warn({ msg: "unauthorized /events request" });
        res.writeHead(401); res.end("unauthorized"); return;
      }
      try { (req as any).setEncoding?.("utf8"); } catch {}
      let body = "";
      for await (const chunk of req as any) {
        body += String(chunk ?? "");
      }
      let event: any;
      try {
        const raw = JSON.parse(body);
        event = RTEventSchema.parse(raw);
      } catch (e) {
        logger.warn({ msg: "invalid event payload on /events", err: String((e as any)?.message || e) });
        res.writeHead(400); res.end("invalid event payload"); return;
      }
      logger.info({ msg: "broadcast event", event: { type: event?.type, teamId: event?.teamId, threadId: event?.threadId } });

      // Handler map for event routing
      const handlers: Record<RTEvent["type"], (e: RTEvent) => void> = {
        "message.created": (e) => {
          const room = channels.thread(e.threadId);
          const payload = e.message
            ? { ...e.message, threadId: e.threadId, teamId: e.teamId }
            : { threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted message event", room, teamId: e.teamId });
        },
        "message.updated": (e) => {
          const room = channels.thread(e.threadId);
          const payload = e.message
            ? { ...e.message, threadId: e.threadId, teamId: e.teamId }
            : { threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted message event", room, teamId: e.teamId });
        },
        "message.read": (e) => {
          const room = channels.thread(e.threadId);
          const payload = { threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted message event", room, teamId: e.teamId });
        },
        "conversation.updated": (e) => {
          const room = channels.thread(e.threadId);
          const payload = { conversation: (e as any).conversation ?? { id: e.threadId }, threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted conversation event", room, teamId: e.teamId });
        },
        "conversation.status_changed": (e) => {
          const room = channels.thread(e.threadId);
          const payload = { conversation: (e as any).conversation ?? { id: e.threadId }, threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted conversation event", room, teamId: e.teamId });
        },
        "conversation.read": (e) => {
          const room = channels.thread(e.threadId);
          const payload = { conversation: (e as any).conversation ?? { id: e.threadId }, threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted conversation event", room, teamId: e.teamId });
        },
        "assignee.changed": (e) => {
          const room = channels.thread(e.threadId);
          const payload = { conversation: (e as any).conversation ?? { id: e.threadId }, threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted conversation event", room, teamId: e.teamId });
        },
        "team.changed": (e) => {
          const room = channels.thread(e.threadId);
          const payload = { conversation: (e as any).conversation ?? { id: e.threadId }, threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted conversation event", room, teamId: e.teamId });
        },
        "conversation.typing_on": (e) => {
          const room = channels.thread(e.threadId);
          const payload = { user: (e as any).user, conversation: { id: e.threadId }, threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted typing_on", room, teamId: e.teamId });
        },
        "conversation.typing_off": (e) => {
          const room = channels.thread(e.threadId);
          const payload = { user: (e as any).user, conversation: { id: e.threadId }, threadId: e.threadId, teamId: e.teamId };
          io.to(room).emit(e.type, payload);
          if (e.teamId) io.to(channels.team(e.teamId)).emit(e.type, payload);
          logger.debug({ msg: "emitted typing_off", room, teamId: e.teamId });
        },
      };

      const handler = handlers[event.type as RTEvent["type"]];
      if (handler) handler(event as RTEvent);
      else logger.warn({ msg: "unknown event type", event: { type: (event as any)?.type } });
      res.writeHead(200); res.end("ok");
      return;
    }
    res.writeHead(404); res.end("not found");
  } catch (e: any) {
    logger.error({ msg: "http server error", err: e?.message || String(e) });
    res.writeHead(500); res.end(String(e?.message || e || "error"));
  }
});

const allowedOrigins = CFG.corsOrigins;
const implicitOrigins = [CFG.dashboardUrl, CFG.publicAppUrl].filter(Boolean) as string[];
const origins = allowedOrigins.length ? allowedOrigins : implicitOrigins;
const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // non-browser
      if (process.env.NODE_ENV !== "production") return cb(null, true);
      const ok = origins.some((o) => origin === o || (o && origin.startsWith(o)));
      cb(ok ? null : new Error("CORS blocked"), ok);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let presenceBackendPromise = initPresence();
async function touchPresence(teamId?: string, userId?: string) {
  if (!teamId || !userId) return;
  const b = await presenceBackendPromise;
  await b.touch(teamId, userId);
}

// Optional auth: expect token & teamId in query; verify token with supabase admin
io.use(async (socket, next) => {
  try {
    const { token, teamId } = socket.handshake.auth || socket.handshake.query || ({} as any);
    if (!token) return next();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      logger.debug({ msg: "skip socket auth (missing SUPABASE env)" });
      return next();
    }
    const sb = createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(String(token));
    if (error) {
      logger.debug({ msg: "token verify failed", error: String(error?.message || error) });
      return next();
    }
    const userId = data.user?.id;
    (socket as any).userId = userId;
    if (teamId) (socket as any).teamId = String(teamId);
    touchPresence((socket as any).teamId, userId);
    logger.debug({ msg: "socket authenticated", userId, teamId });
    next();
  } catch (err) {
    logger.debug({ msg: "socket auth error", error: String((err as any)?.message || err) });
    next();
  }
});

io.on("connection", (socket) => {
  const userId = (socket as any).userId as string | undefined;
  const teamId = (socket as any).teamId as string | undefined;
  if (userId) socket.join(`user:${userId}`);
  if (teamId) socket.join(channels.team(teamId));
  touchPresence(teamId, userId);
  logger.info({ msg: "client connected", userId, teamId });

  socket.on("join.thread", (threadId: string) => {
    if (!threadId) return;
    socket.join(channels.thread(threadId));
    logger.debug({ msg: "join.thread", threadId, userId });
  });
  socket.on("leave.thread", (threadId: string) => {
    if (!threadId) return;
    socket.leave(channels.thread(threadId));
    logger.debug({ msg: "leave.thread", threadId, userId });
  });
  socket.on("typing.start", (threadId: string) => {
    if (!threadId || !userId) return;
    socket.to(channels.thread(threadId)).emit("conversation.typing_on", { user: { id: userId }, conversation: { id: threadId } });
    logger.debug({ msg: "typing.start", threadId, userId });
  });
  socket.on("typing.stop", (threadId: string) => {
    if (!threadId || !userId) return;
    socket.to(channels.thread(threadId)).emit("conversation.typing_off", { user: { id: userId }, conversation: { id: threadId } });
    logger.debug({ msg: "typing.stop", threadId, userId });
  });

  socket.on("presence.ping", (_: any) => {
    (async () => {
      await touchPresence(teamId, userId);
      if (!teamId) return;
      try {
        const b = await presenceBackendPromise;
        const ids = await b.list(teamId);
        const users = ids.map((id) => ({ id }));
        io.to(`team:${teamId}`).emit("presence.update", { account_id: teamId, users });
        logger.debug({ msg: "presence.ping", userId, teamId, count: users.length });
      } catch (e) {
        logger.warn({ msg: "presence.list failed", err: String((e as any)?.message || e) });
      }
    })();
  });

  socket.on("disconnect", () => {
    // Presence auto-expires; no explicit removal needed
    logger.info({ msg: "client disconnected", userId, teamId });
  });
});

httpServer.listen(PORT);
logger.info({ msg: "listening", port: PORT });

function shutdown(signal: string) {
  logger.info({ signal }, "realtime shutting down");
  try { io.close(() => {}); } catch {}
  try { httpServer.close(() => process.exit(0)); } catch { process.exit(0); }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

import { createServerClient } from "@Faworra/supabase/server";
import logger from "../logger";
import { startBaileysForAccount } from "../providers/baileys";
import { Registry } from "../providers/registry";
import { rm } from "node:fs/promises";
import path from "node:path";
import { getLockManager } from "@Faworra/realtime/lock";
import { loadWorkerConfig } from "@Faworra/config";

// Distributed lock replaces in‑memory active set for horizontal scalability
// (Key format: account-session:{accountId})

async function clearSessionFiles(accountId: string) {
  const sessionDir = path.join(process.cwd(), "apps", "worker", ".sessions", accountId);
  try {
    await rm(sessionDir, { recursive: true, force: true });
  } catch (err) {
    logger.debug({ err, accountId }, "failed to remove session directory");
  }
}

async function teardownSession(accountId: string, { removeSessionFiles = false } = {}) {
  const sock = Registry.get(accountId);
  if (sock) {
    try {
      if (typeof (sock as any).logout === "function") {
        await (sock as any).logout();
      }
      const ws = (sock as unknown as { ws?: { close?: () => void } }).ws;
      if (ws && typeof ws.close === "function") {
        ws.close();
      }
    } catch (err: any) {
      const message = err?.message ?? "";
      const statusCode = err?.output?.statusCode;
      if (statusCode === 428 || /connection closed/i.test(message)) {
        logger.debug({ err, accountId }, "baileys session already closed");
      } else {
        logger.warn({ err, accountId }, "baileys session teardown error");
      }
    }
    Registry.delete(accountId);
  }
  if (removeSessionFiles) {
    await clearSessionFiles(accountId);
  }
}

export async function tickAccounts() {
  const supabase = await createServerClient({ admin: true });
  const { data, error } = await supabase
    .from("communication_accounts")
    .select("id, provider, external_id, status, team_id")
    .eq("provider", "whatsapp_baileys")
    .in("status", ["connecting", "qr_pending", "connected", "reconnecting", "disconnected"]);

  if (error) {
    logger.error({ err: error }, "failed to query accounts");
    return;
  }

  const fetchedIds = new Set((data ?? []).map((acc) => acc.id));

  for (const acc of data ?? []) {
    if (acc.status === "disconnected") {
      await teardownSession(acc.id, { removeSessionFiles: true });
      continue;
    }
    if (acc.status === "connecting" && Registry.has(acc.id)) {
      await teardownSession(acc.id, { removeSessionFiles: true });
    }
    if (Registry.has(acc.id)) continue;
    if (acc.status === "connecting") {
      await clearSessionFiles(acc.id);
    }
    const lockKey = `account-session:${acc.id}`;
    const lm = await getLockManager();
    const acquired = await lm.acquire(lockKey, 30_000);
    if (!acquired) {
      continue; // another worker/process is handling this account
    }
    (async () => {
      try {
        logger.info({ externalId: acc.external_id, status: acc.status }, "ensuring Baileys session");
        await startBaileysForAccount({
          id: acc.id as string,
          team_id: acc.team_id as string,
          external_id: acc.external_id as string,
          status: acc.status as string,
        });
      } catch (e) {
        logger.error({ err: e, accountId: acc.id }, "start session error");
      } finally {
        try { await lm.release(lockKey); } catch {}
      }
    })();
  }

  for (const [accountId] of Registry.entries()) {
    if (!fetchedIds.has(accountId)) {
      await teardownSession(accountId, { removeSessionFiles: true });
    }
  }
}

let accountsTimer: NodeJS.Timeout | null = null;
export function startAccountsPoller() {
  if (accountsTimer) return;
  const cfg = loadWorkerConfig();
  accountsTimer = setInterval(() => {
    tickAccounts().catch((e) => logger.error({ err: e }, "worker tick error"));
  }, Math.max(500, cfg.accountsPollMs));
}

export async function teardownAllSessions() {
  for (const [accountId] of Registry.entries()) {
    try {
      await (async () => {
        const sock = Registry.get(accountId);
        if (sock && typeof (sock as any).logout === "function") {
          try { await (sock as any).logout(); } catch {}
        }
      })();
    } catch {}
  }
}

export function stopAccountsPoller() {
  if (accountsTimer) {
    clearInterval(accountsTimer);
    accountsTimer = null;
  }
}

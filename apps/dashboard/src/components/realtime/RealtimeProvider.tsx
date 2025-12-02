"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@Faworra/supabase/client";

type SocketLike = {
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, cb: (...args: any[]) => void) => void;
  off: (event: string, cb?: (...args: any[]) => void) => void;
  connect: () => void;
  disconnect: () => void;
};

type Ctx = {
  socket: SocketLike | null;
  joinThread: (threadId: string) => void;
  leaveThread: (threadId: string) => void;
};

const RealtimeContext = createContext<Ctx>({ socket: null, joinThread: () => {}, leaveThread: () => {} });

export function useRealtime() {
  return useContext(RealtimeContext);
}

type Props = { teamId: string; children: React.ReactNode };

export function RealtimeProvider({ teamId, children }: Props) {
  const [socket, setSocket] = useState<SocketLike | null>(null);
  const joinedThreads = useRef<Set<string>>(new Set());

  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const { io } = (await import("socket.io-client")) as any;
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const url = process.env.NEXT_PUBLIC_REALTIME_URL || "http://localhost:3010";
        const s = io(url, { transports: ["websocket"], autoConnect: true, auth: { token, teamId } });
        if (stopped) return;
        setSocket(s);
      } catch {
        // no socket available
      }
    })();
    return () => {
      stopped = true;
      try { (socket as any)?.disconnect?.(); } catch {}
      setSocket(null);
      joinedThreads.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // 20s heartbeat
  useEffect(() => {
    if (!socket) return;
    let timer: any;
    const tick = () => {
      try { socket.emit("presence.ping", { teamId }); } catch {}
      timer = setTimeout(tick, 20000);
    };
    timer = setTimeout(tick, 2000);
    return () => { if (timer) clearTimeout(timer); };
  }, [socket, teamId]);

  const value = useMemo<Ctx>(() => ({
    socket,
    joinThread: (id: string) => {
      if (!socket || !id || joinedThreads.current.has(id)) return;
      try { socket.emit("join.thread", id); joinedThreads.current.add(id); } catch {}
    },
    leaveThread: (id: string) => {
      if (!socket || !id) return;
      try { socket.emit("leave.thread", id); joinedThreads.current.delete(id); } catch {}
    },
  }), [socket]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

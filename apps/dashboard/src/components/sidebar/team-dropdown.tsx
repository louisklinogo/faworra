"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TeamRow = { id: string; name: string | null };

type TeamDropdownProps = {
  isExpanded?: boolean;
  teams?: { team: { id: string; name: string | null } }[];
  currentTeamId?: string;
};

export function TeamDropdown({ isExpanded = false, teams = [], currentTeamId }: TeamDropdownProps) {
  // ✅ OPTIMIZED: Receives teams from Server Component (no client-side fetch!)
  const [current, setCurrent] = useState<string | null>(currentTeamId || null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Transform teams data
  const teamsList: TeamRow[] = useMemo(
    () =>
      teams.map((t) => ({
        id: t.team.id,
        name: t.team.name,
      })),
    [teams],
  );

  const setTeam = async (id: string) => {
    try {
      await fetch(`/api/teams/launch?teamId=${id}`, { method: "POST" });
      setCurrent(id);
      if (typeof window !== "undefined") window.location.reload();
    } catch { }
  };

  const currentTeam = teamsList.find((t) => t.id === current) || teamsList[0] || null;
  const initials = (currentTeam?.name || "TM").slice(0, 2).toUpperCase();

  // Braun "Cartridge" Style: Square, Mechanical border, Hover invert
  const triggerButton = (
    <button className="h-10 w-10 flex items-center justify-center bg-background border border-sidebar-border text-foreground hover:bg-foreground hover:text-background transition-colors outline-none group">
        <span className="font-mono text-xs font-bold tracking-widest">{initials}</span>
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-1">
      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {triggerButton}
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            side="right" 
            sideOffset={12}
            className="rounded-none border-sidebar-border bg-sidebar p-0 min-w-[180px]"
          >
             <div className="px-3 py-2 border-b border-sidebar-border bg-sidebar-accent">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Team Select</span>
             </div>
            {teamsList.map((t) => (
              <DropdownMenuItem 
                key={t.id} 
                onClick={() => setTeam(t.id)}
                className="rounded-none focus:bg-foreground focus:text-background py-2 px-3 font-medium text-xs cursor-pointer"
              >
                {t.name || t.id}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        triggerButton
      )}
    </div>
  );
}

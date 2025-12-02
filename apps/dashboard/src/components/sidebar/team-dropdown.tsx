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
    } catch {}
  };

  const currentTeam = teamsList.find((t) => t.id === current) || teamsList[0] || null;
  const initials = (currentTeam?.name || "TM").slice(0, 2).toUpperCase();

  return (
    <div className="absolute bottom-4 left-[19px] flex items-center gap-3">
      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-[32px] w-[32px] cursor-pointer rounded-none border">
              <AvatarFallback className="rounded-none text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right">
            {teamsList.map((t) => (
              <DropdownMenuItem key={t.id} onClick={() => setTeam(t.id)}>
                {t.name || t.id}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Avatar className="h-[32px] w-[32px] rounded-none border">
          <AvatarFallback className="rounded-none text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}
      {isExpanded && currentTeam?.name && (
        <span className="max-w-[140px] truncate text-primary text-sm">{currentTeam.name}</span>
      )}
    </div>
  );
}

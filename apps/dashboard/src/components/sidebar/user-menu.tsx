"use client";

import { createBrowserClient } from "@Faworra/supabase/client";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitch } from "./theme-switch";

export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (mounted) setEmail(data.user?.email ?? null);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setEmail(null);
  };

  const initials = email ? email.substring(0, 2).toUpperCase() : "G";

  const triggerButton = (
    <button className="h-10 w-10 flex items-center justify-center bg-background border border-sidebar-border text-foreground hover:bg-foreground hover:text-background transition-colors outline-none group">
        <span className="font-mono text-xs font-bold tracking-widest">{initials}</span>
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        side="right" 
        sideOffset={12}
        className="w-[240px] rounded-none border-sidebar-border bg-sidebar p-0"
      >
        <DropdownMenuLabel className="px-3 py-3 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="line-clamp-1 block max-w-[155px] truncate font-sans text-sm font-medium">
                {email ? email.split("@")[0] : "Guest"}
              </span>
              <span className="truncate font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                {email || "Not signed in"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <div className="p-1">
            <DropdownMenuGroup>
            <DropdownMenuItem className="rounded-none focus:bg-sidebar-accent cursor-pointer py-2">Account</DropdownMenuItem>
            <DropdownMenuItem className="rounded-none focus:bg-sidebar-accent cursor-pointer py-2">Support</DropdownMenuItem>
            <DropdownMenuItem className="rounded-none focus:bg-sidebar-accent cursor-pointer py-2">Teams</DropdownMenuItem>
            </DropdownMenuGroup>
        </div>

        <DropdownMenuSeparator className="bg-sidebar-border m-0" />

        <div className="flex flex-row items-center justify-between p-3">
          <p className="text-xs font-medium">Theme</p>
          <ThemeSwitch />
        </div>

        <DropdownMenuSeparator className="bg-sidebar-border m-0" />

        <div className="p-1">
            {email ? (
            <DropdownMenuItem className="rounded-none focus:bg-destructive focus:text-destructive-foreground text-destructive cursor-pointer py-2" onClick={signOut}>
                Sign out
            </DropdownMenuItem>
            ) : (
            <DropdownMenuItem asChild className="rounded-none focus:bg-sidebar-accent cursor-pointer py-2">
                <a href="/login">Sign in</a>
            </DropdownMenuItem>
            )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

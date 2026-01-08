"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_SECTIONS, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { TeamDropdown } from "./team-dropdown";
import { UserMenu } from "./user-menu";

type SidebarProps = {
  teams?: { team: { id: string; name: string | null } }[];
  currentTeamId?: string;
};

export function Sidebar({ teams = [], currentTeamId }: SidebarProps) {
  // Project Dieter: The Sidebar is a fixed "Control Rail".
  // It stays at 80px (w-20). It does not expand.
  // Labels appear as mechanical tooltips.
  // Submenus are accessed via the main view or pop-out drawers (future).
  // For now, it's a strict icon rail.

  const pathname = usePathname();

  return (
    <aside
      className="relative z-40 hidden h-screen w-20 flex-col overflow-hidden bg-sidebar border-r border-sidebar-border md:flex"
    >
      {/* Brand Module */}
      <div className="flex h-20 flex-shrink-0 items-center justify-center border-b border-sidebar-border">
        <Link
          className="flex h-10 w-10 items-center justify-center bg-foreground text-background transition-transform hover:scale-95 active:scale-90"
          href="/"
        >
          {/* Minimalist Geometric Logo - Sharp */}
          <div className="h-3.5 w-3.5 bg-braun-orange" /> 
        </Link>
      </div>

      {/* Navigation Rail */}
      <TooltipProvider delayDuration={100}>
        <ScrollArea className="flex-1 py-6">
          <nav className="w-full px-0 flex flex-col items-center gap-8">
            {NAV_SECTIONS.map((section) => (
              <div className="flex flex-col gap-4 w-full items-center" key={section.title}>
                 {/* Section Separator / Label (Optional, maybe just spacing) */}
                 {/* We can use a small horizontal line or dot to separate sections */}
                 <div className="w-4 h-[1px] bg-sidebar-border" />
                 
                <div className="flex flex-col gap-2 w-full px-3 items-center">
                  {section.items.map((item) => (
                    <SidebarLink
                      active={isLinkActive(item.href, pathname)}
                      item={item}
                      key={item.href}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </TooltipProvider>

      {/* Footer Modules */}
      <div className="flex flex-col items-center gap-4 border-t border-sidebar-border bg-sidebar py-6">
        <TeamDropdown currentTeamId={currentTeamId} teams={teams} />
        <UserMenu />
      </div>
    </aside>
  );
}

function isLinkActive(href: string, pathname: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

type SidebarLinkProps = {
  item: NavItem;
  active: boolean;
};

function SidebarLink({ item, active }: SidebarLinkProps) {
  const Icon = item.icon; 
  const hasChildren = item.children && item.children.length > 0;

  const content = (
    <div
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center transition-all duration-300",
        // Braun Button Style v2:
        // - Inactive: Subtle transparency, matte feel
        // - Active: Solid contrast, mechanical feedback (color + subtle inset shadow implicitly via darker bg)
        active 
            ? "bg-foreground text-background shadow-sm ring-1 ring-inset ring-transparent" 
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hover:scale-105 active:scale-95"
      )}
    >
      <Icon
        className={cn(
          "shrink-0 transition-colors duration-300",
          active ? "text-braun-orange" : "group-hover:text-foreground",
        )}
        active={active}
        width={20}
        height={20}
      />
    </div>
  );

  // If items have children, we use a Dropdown/Flyout menu
  if (hasChildren) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button className="block w-full outline-none">{content}</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                side="right" 
                align="start" 
                sideOffset={12}
                className="rounded-none border-sidebar-border bg-sidebar p-0 min-w-[180px]"
            >
                 {/* Header */}
                 <div className="px-3 py-2 border-b border-sidebar-border bg-sidebar-accent">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {item.title}
                    </span>
                 </div>
                 {/* Links */}
                 <div className="flex flex-col p-1">
                    <DropdownMenuItem asChild className="rounded-none focus:bg-sidebar-accent cursor-pointer py-2 px-3">
                         <Link href={item.href} className="text-xs font-medium w-full">
                            Overview
                         </Link>
                    </DropdownMenuItem>
                    {item.children?.map(child => (
                         <DropdownMenuItem key={child.href} asChild className="rounded-none focus:bg-sidebar-accent cursor-pointer py-2 px-3">
                            <Link href={child.href} className="text-xs font-medium w-full text-muted-foreground focus:text-foreground">
                                {child.title}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                 </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={item.href} className="block w-full">{content}</Link>
      </TooltipTrigger>
      {/* Tooltip looks like a physical label tape: White text on Black, Uppercase, Mono */}
      <TooltipContent 
        className="bg-foreground text-background border-none rounded-none px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest" 
        side="right" 
        sideOffset={12}
      >
        {item.title}
        {item.badge && <span className="ml-2 text-braun-orange">{item.badge}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

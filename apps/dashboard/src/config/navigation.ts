import type { LucideIcon } from "lucide-react";
import {
    SwissIconClients,
    SwissIconDashboard,
    SwissIconInbox,
    SwissIconInvoices,
    SwissIconMeasurements,
    SwissIconOrders,
    SwissIconProducts,
    SwissIconSettings,
    SwissIconTransactions,
    SwissIconVault
} from "@/components/icons/swiss-icons";

// We use "any" here because custom SVG components don't strictly match LucideIcon type,
// but they render identically as (props) => JSX.Element.
// In a strict setup, we'd update the NavItem type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconType = any;

export type NavItem = {
  title: string;
  href: string;
  icon: IconType;
  badge?: string;
  description?: string;
  children?: { title: string; href: string }[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: SwissIconDashboard,
        description: "Business overview",
      },
      {
        title: "Inbox",
        href: "/inbox/conversations",
        icon: SwissIconInbox,
        description: "Messages & notifications",
        children: [{ title: "Settings", href: "/inbox/settings" }],
      },
    ],
  },
  {
    title: "Business",
    items: [
      {
        title: "Transactions",
        href: "/transactions",
        icon: SwissIconTransactions,
        description: "Payments & expenses",
        children: [{ title: "Categories", href: "/transactions/categories" }],
      },
      {
        title: "Orders",
        href: "/orders",
        icon: SwissIconOrders,
        description: "Tailoring orders",
      },
      {
        title: "Invoices",
        href: "/invoices",
        icon: SwissIconInvoices,
        description: "Billing & payments",
      },
      {
        title: "Products",
        href: "/products",
        icon: SwissIconProducts,
        description: "Catalog & inventory",
        children: [
          { title: "Categories", href: "/products/categories" },
          { title: "Templates", href: "/products/templates" },
        ],
      },
      {
        title: "Clients",
        href: "/clients",
        icon: SwissIconClients,
        description: "Customer database",
      },
    ],
  },
  {
    title: "Tailoring",
    items: [
      {
        title: "Measurements",
        href: "/measurements",
        icon: SwissIconMeasurements,
        description: "Client measurements",
      },
      {
        title: "Vault",
        href: "/vault",
        icon: SwissIconVault,
        description: "Documents & files",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: SwissIconSettings,
        description: "App configuration",
        children: [{ title: "Accounts", href: "/settings/accounts" }],
      },
    ],
  },
];

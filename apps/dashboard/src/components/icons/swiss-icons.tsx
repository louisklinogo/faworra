import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

interface SwissIconProps extends SVGProps<SVGSVGElement> {
    className?: string;
    active?: boolean;
}

// FAWORRA CUSTOM ICONS v2
// Philosophy: STRICT SWISS INDUSTRIAL
// - NO rounded corners (stroke-linecap: square, stroke-linejoin: miter)
// - Geometric primitives only (Rect, Line, Circle)
// - Heavy, mechanical stroke (1.5px - 2px)
// - "Boring" but functional.

const IconBase = ({ className, children, active, ...props }: SwissIconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? "2" : "1.5"} // Thicker when active
        strokeLinecap="square" 
        strokeLinejoin="miter" 
        className={cn("h-5 w-5", className)}
        {...props}
    >
        {children}
    </svg>
);

// 1. Dashboard: The Grid
// Pure geometry. 4 sharp squares.
export const SwissIconDashboard = (props: SwissIconProps) => (
    <IconBase {...props}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </IconBase>
);

// 2. Inbox: The Tray
// Sharp angles. No curves.
export const SwissIconInbox = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M4 4h16c1.1 0 0 0 0 0v16c0 0 0 0 0 0H4c-1.1 0 0 0 0 0V4c0 0 0 0 0 0z" stroke="none" /> 
        {/* Re-drawing as paths for sharp corners */}
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 0 0h16a2 2 0 0 0 0 0v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        {/* Simplified Tray */}
        <rect x="2" y="4" width="20" height="16" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <polyline points="2 12 7 12 9 15 15 15 17 12 22 12" fill="white" stroke="none" /> {/* Masking trick? No, let's use lines */}
    </IconBase>
);

// Redoing Inbox to be cleaner geometry
export const SwissIconInboxv2 = (props: SwissIconProps) => (
    <IconBase {...props}>
        <polyline points="4 4 4 20 20 20 20 4" />
        <polyline points="4 12 9 12 11 15 13 15 15 12 20 12" />
    </IconBase>
);

// 3. Transactions: The Card
// Sharp rectangle, magnetic strip.
export const SwissIconTransactions = (props: SwissIconProps) => (
    <IconBase {...props}>
        <rect x="2" y="5" width="20" height="14" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" /> 
    </IconBase>
);

// 4. Orders: The Checklist
// Sharp ticks and lines.
export const SwissIconOrders = (props: SwissIconProps) => (
    <IconBase {...props}>
         <path d="M9 6h11" />
         <path d="M9 12h11" />
         <path d="M9 18h11" />
         <path d="M4 6h2" />
         <path d="M4 12h2" />
         <path d="M4 18h2" />
    </IconBase>
);

// 5. Invoices: The Document
// Folded corner, sharp edges.
export const SwissIconInvoices = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M14 2H6v20h12v-8" />
        <path d="M14 2v8h4l-4-8z" /> {/* Fold */}
    </IconBase>
);
// Retrying Invoice - Traditional Swiss Doc
export const SwissIconInvoicesV2 = (props: SwissIconProps) => (
    <IconBase {...props}>
        <polygon points="14 2 14 8 20 8 20 22 4 22 4 2 14 2" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
    </IconBase>
);


// 6. Products: The Box
// Isometric cube, sharp vertices.
export const SwissIconProducts = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M21 16V8l-9-4l-9 4v8l9 4l9-4z" />
        <path d="M3.27 8l8.73 5l8.73-5" />
        <path d="M12 22v-9" />
    </IconBase>
);

// 7. Clients: The ID Card
// Abstract person on card.
export const SwissIconClients = (props: SwissIconProps) => (
    <IconBase {...props}>
         <rect x="3" y="4" width="18" height="16" />
         <circle cx="12" cy="10" r="3" />
         <path d="M12 14a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6z" /> {/* Actually cut off by rect in usage usually, but here we can just do abstract */}
    </IconBase>
);
// More geometric Clients: "The Team"
export const SwissIconClientsV2 = (props: SwissIconProps) => (
    <IconBase {...props}>
         <rect x="4" y="4" width="16" height="16" />
         <rect x="9" y="9" width="6" height="6" /> {/* Face */}
         <line x1="4" y1="20" x2="20" y2="20" /> {/* Base */}
    </IconBase>
);
// Even simpler: Two sharp rectangles
export const SwissIconClientsV3 = (props: SwissIconProps) => (
     <IconBase {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
     </IconBase>
)
// Let's stick to the V3 but make it sharp
export const SwissIconClientsFinal = (props: SwissIconProps) => (
    <IconBase {...props}>
        <rect x="4" y="4" width="8" height="8" />
        <path d="M4 16h8v4H4z" /> {/* Body */}
        <rect x="14" y="6" width="6" height="6" />
        <path d="M14 16h6v4h-6z" />
    </IconBase>
);


// 8. Measurements: The Graph
// Bar chart or Ruler. Ruler fits "Measurements" better.
export const SwissIconMeasurements = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M2 12h20" />
        <path d="M4 12v-4" />
        <path d="M8 12v-2" />
        <path d="M12 12v-4" />
        <path d="M16 12v-2" />
        <path d="M20 12v-4" />
    </IconBase>
);

// 9. Vault: The Safe
// Heavy box with dial.
export const SwissIconVault = (props: SwissIconProps) => (
    <IconBase {...props}>
        <rect x="3" y="3" width="18" height="18" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="12" x2="14" y2="10" />
    </IconBase>
);

// 10. Settings: The Sliders
// Horizontal sliders.
export const SwissIconSettings = (props: SwissIconProps) => (
    <IconBase {...props}>
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <rect x="1" y="10" width="6" height="4" />
        <rect x="9" y="8" width="6" height="4" />
        <rect x="17" y="12" width="6" height="4" />
    </IconBase>
);

// Utilities
export const SwissIconFolder = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinejoin="miter" />
    </IconBase>
);
// Sharp Folder
export const SwissIconFolderV2 = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M2 4h6l2 3h12v14H2z" />
    </IconBase>
);

export const SwissIconDownload = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M21 15v4H3v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </IconBase>
);

export const SwissIconTrash = (props: SwissIconProps) => (
    <IconBase {...props}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14H5V6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4h6v2" />
    </IconBase>
);

export const SwissIconMoreHorizontal = (props: SwissIconProps) => (
    <IconBase {...props}>
        <rect x="11" y="11" width="2" height="2" />
        <rect x="18" y="11" width="2" height="2" />
        <rect x="4" y="11" width="2" height="2" />
    </IconBase>
);

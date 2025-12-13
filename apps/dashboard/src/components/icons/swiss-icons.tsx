import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

interface SwissIconProps extends SVGProps<SVGSVGElement> {
    className?: string;
}

const IconBase = ({ className, children, ...props }: SwissIconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        className={cn("h-5 w-5", className)}
        {...props}
    >
        {children}
    </svg>
);

export const SwissIconDashboard = (props: SwissIconProps) => (
    <IconBase {...props}>
        <rect width="7" height="7" x="3" y="3" />
        <rect width="7" height="7" x="14" y="3" />
        <rect width="7" height="7" x="14" y="14" />
        <rect width="7" height="7" x="3" y="14" />
    </IconBase>
);

export const SwissIconTransactions = (props: SwissIconProps) => (
    <IconBase {...props}>
        <rect width="14" height="18" x="5" y="3" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
    </IconBase>
);

export const SwissIconInbox = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M4 16h16" />
        <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6" />
        <path d="M22 12h-6l-2 3h-4l-2-3H2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3Z" />
    </IconBase>
);

export const SwissIconOrders = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
    </IconBase>
);

export const SwissIconInvoices = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
    </IconBase>
);

export const SwissIconClients = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </IconBase>
);

export const SwissIconMeasurements = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="m12 14 4-4" />
        <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </IconBase>
);

export const SwissIconVault = (props: SwissIconProps) => (
    <IconBase {...props}>
        <rect width="18" height="11" x="3" y="11" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </IconBase>
);

export const SwissIconSettings = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M20 12h2" />
        <path d="M2 12h2" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m17.66 6.34 1.41-1.41" />
        <path d="m4.93 19.07 1.41-1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="m4.93 4.93 1.41 1.41" />
    </IconBase>
);

export const SwissIconFolder = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </IconBase>
);

export const SwissIconDownload = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
    </IconBase>
);

export const SwissIconTrash = (props: SwissIconProps) => (
    <IconBase {...props}>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </IconBase>
);

export const SwissIconMoreHorizontal = (props: SwissIconProps) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </IconBase>
);

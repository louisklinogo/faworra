import * as React from "react"
import { cn } from "../utils/cn"

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
}

const IconBase = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 20, children, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
        className={cn("shrink-0", className)}
        {...props}
      >
        {children}
      </svg>
    )
  }
)
IconBase.displayName = "IconBase"

// --- Icons (Swiss Industrial - Stamped Style) ---

export const IconDashboard = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="0" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </IconBase>
)

export const IconInbox = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </IconBase>
)

export const IconTransactions = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="2" y="5" width="20" height="14" rx="0" />
    <path d="M2 10h20" />
    <path d="M6 15h2" />
    <path d="M10 15h8" />
  </IconBase>
)

export const IconOrders = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M9 6h12" />
    <path d="M9 12h12" />
    <path d="M9 18h12" />
    <rect x="3" y="4" width="4" height="4" rx="0" />
    <rect x="3" y="10" width="4" height="4" rx="0" />
    <rect x="3" y="16" width="4" height="4" rx="0" />
  </IconBase>
)

export const IconInvoices = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M14 2v4h4" />
    <path d="M15 2H6v18h12V7z" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
  </IconBase>
)

export const IconClients = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconBase>
)

export const IconMeasurements = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M3 3v18h18" />
    <path d="M7 14l3-3 2 2 4-4" />
  </IconBase>
)

export const IconVault = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="2" y="3" width="20" height="14" rx="0" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <circle cx="12" cy="10" r="2" />
  </IconBase>
)

export const IconSettings = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </IconBase>
)

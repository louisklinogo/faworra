# Upgrade to Phosphor Icons

Objective
- Migrate dashboard/UI icons from lucide-react to phosphor-react while preserving the Midday-style look (outline-first, 20px size) and interaction semantics.
- Sidebar already uses Phosphor; extend to the rest of the codebase with minimal churn.

Design decisions
- Library: phosphor-react
- Sizing: `h-5 w-5` (20px) everywhere for consistency
- Weights: `regular` as default; `bold` for active/selected states where emphasis is needed (e.g., nav, tabs)
- Spinners: replace `Loader2` with `CircleNotch` (or `SpinnerGap`) and `animate-spin`

Scope (approx.)
- apps/dashboard and packages/ui primarily; a few imports in other apps.
- Effort: ~3–5h for dashboard + shared UI; ~1–2h for remaining apps; quick visual QA required.

Recommended approach (low-risk)
1) Dependencies
   - If centralizing: add once at workspace root: `bun add -w phosphor-react`
   - Or per package/app where icons are used: `bun add phosphor-react`

2) Optional shim (recommended)
   - Create a central icon shim to decouple vendors and make future swaps trivial, e.g. `packages/ui/src/components/icon.tsx`:
   ```tsx
   import type { ComponentProps } from "react";
   import {
     ArrowDown, ArrowUp, ArrowsUpDown,
     CaretDown, CaretRight, CaretUp,
     Check, Circle, CircleNotch,
     DotsThreeOutline, DotsThreeOutlineVertical,
     Download, DownloadSimple,
     FileText, Gear, Image as ImageIcon,
     MagnifyingGlass, Minus, Notebook, NotePencil,
     Paperclip, PaperPlaneRight, Plus, Receipt, Ruler,
     SlidersHorizontal, Tag, Trash, TrendUp,
     Upload, UploadSimple, Users
   } from "phosphor-react";

   export type IconProps = ComponentProps<typeof Check> & { name: IconName };
   export type IconName =
     | "Check" | "X" | "ChevronDown" | "ChevronUp" | "ChevronRight"
     | "MoreHorizontal" | "MoreVertical" | "Loader"
     | "ArrowDown" | "ArrowUp" | "ArrowUpDown"
     | "ExternalLink" | "SlidersHorizontal" | "DollarSign" | "Package"
     | "Users" | "TrendingUp" | "Ruler" | "ReceiptText" | "NotebookPen"
     | "FileText" | "Download" | "Upload" | "Trash" | "Plus" | "Minus"
     | "Search" | "Settings" | "Tag" | "Image" | "Paperclip" | "Send";

   const map = {
     Check,
     X: Circle, // placeholder if needed — prefer direct imports where X exists
     ChevronDown: CaretDown,
     ChevronUp: CaretUp,
     ChevronRight: CaretRight,
     MoreHorizontal: DotsThreeOutline,
     MoreVertical: DotsThreeOutlineVertical,
     Loader: CircleNotch,
     ArrowDown,
     ArrowUp,
     ArrowUpDown: ArrowsUpDown,
     ExternalLink: ArrowSquareOut,
     SlidersHorizontal,
     DollarSign: CurrencyDollar,
     Package,
     Users,
     TrendingUp: TrendUp,
     Ruler,
     ReceiptText: Receipt,
     NotebookPen: NotePencil,
     FileText,
     Download: DownloadSimple,
     Upload: UploadSimple,
     Trash,
     Plus,
     Minus,
     Search: MagnifyingGlass,
     Settings: Gear,
     Tag,
     Image: ImageIcon,
     Paperclip,
     Send: PaperPlaneRight,
   } as const;

   export function Icon({ name, className, weight = "regular", ...rest }: IconProps) {
     const Cmp = map[name] ?? Check;
     return <Cmp className={className} weight={weight} {...rest} />;
   }
   ```
   - Start by switching leaf components to the shim, then remove lucide imports.

3) Automated replacement (codemod)
   - Grep inventory:
     - Windows PowerShell: `rg -n "from \"lucide-react\"|import .*lucide-react" apps packages`
     - Fallback (PowerShell): `Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern 'lucide-react'`
   - Replace simple one-to-one names; flag mismatches for manual review.

4) Manual touch-ups (non 1:1 names)
   - `MoreHorizontal` → `DotsThreeOutline`
   - `MoreVertical` → `DotsThreeOutlineVertical`
   - `Loader2` → `CircleNotch` + `animate-spin`
   - `ExternalLink` → `ArrowSquareOut`
   - `ArrowUpDown` → `ArrowsUpDown`
   - `ReceiptText` → `Receipt`
   - `NotebookPen` → `NotePencil`
   - `Search` → `MagnifyingGlass`
   - `Settings` → `Gear`
   - Double-check each usage for visual parity and semantics.

5) Build & QA
   - `bun run typecheck && bun run build`
   - Visual sweep on key screens (Dashboard, Clients, Orders, Invoices, Transactions, Vault, Settings)
   - Verify icon sizes (20px), hover/active states, and spinners.

6) Cleanup
   - Remove remaining `lucide-react` imports
   - Uninstall lucide-react in packages/apps where no longer used

7) Commit
   - Commit style: `refactor(icons): migrate to phosphor-react + icon shim`

Common mapping (cheat sheet)
- X → X
- Check → Check
- ChevronDown/Up/Right → CaretDown/Up/Right
- MoreHorizontal → DotsThreeOutline
- MoreVertical → DotsThreeOutlineVertical
- Loader2 → CircleNotch (+ `animate-spin`)
- ArrowDown/Up → ArrowDown/Up
- ArrowUpDown → ArrowsUpDown
- ExternalLink → ArrowSquareOut
- SlidersHorizontal → SlidersHorizontal
- DollarSign → CurrencyDollar
- Package → Package
- Users → Users
- TrendingUp → TrendUp
- Ruler → Ruler
- ReceiptText → Receipt
- NotebookPen → NotePencil
- FileText → FileText
- Download → DownloadSimple
- Upload → UploadSimple
- Trash2 → Trash
- Plus/Minus → Plus/Minus
- Search → MagnifyingGlass
- Settings → Gear
- Tag → Tag
- Image → Image
- Paperclip → Paperclip
- Send → PaperPlaneRight

Notes
- Keep `className="h-5 w-5"` consistently. Phosphor icons honor `className` for size.
- Use `weight="bold"` for active/selected states to match sidebar behavior.
- If any icon is missing in Phosphor or looks off, prefer semantically equivalent, not visually identical.

---

## Migration Agent Prompt (for autonomous codemod)

You are an expert code-migration agent. Task: migrate icons from lucide-react to phosphor-react in this monorepo while preserving visual intent.

Constraints
- Do not alter business logic; only icon imports/usages.
- Use 20px (`h-5 w-5`) size and default `weight="regular"`; if an element already conditions an active state, set `weight="bold"` when active (similar to sidebar).
- Replace spinners: lucide `Loader2` → phosphor `CircleNotch` with `className="h-4 w-4 animate-spin"` (or size matching context).
- Do not touch directories named `midday/`.

Steps
1) Install dependency where missing: `bun add phosphor-react` in each app/package that imports icons.
2) Create an icon shim at `packages/ui/src/components/icon.tsx` (see code above). Export `Icon`.
3) Codemod phase A (safe replacements):
   - Replace `import { X } from "lucide-react"` with `import { X } from "phosphor-react"` for the following names: `X, Check, ArrowDown, ArrowUp, FileText, Users, Ruler, Package, Tag, Paperclip, Plus, Minus, Trash`.
4) Codemod phase B (mapped names):
   - Apply mapping:
     - `ChevronDown`→`CaretDown`, `ChevronUp`→`CaretUp`, `ChevronRight`→`CaretRight`
     - `MoreHorizontal`→`DotsThreeOutline`, `MoreVertical`→`DotsThreeOutlineVertical`
     - `Loader2`→`CircleNotch` (+ add `animate-spin` class where appropriate)
     - `ExternalLink`→`ArrowSquareOut`
     - `ArrowUpDown`→`ArrowsUpDown`
     - `ReceiptText`→`Receipt`, `NotebookPen`→`NotePencil`
     - `Download`→`DownloadSimple`, `Upload`→`UploadSimple`
     - `Search`→`MagnifyingGlass`, `Settings`→`Gear`, `TrendingUp`→`TrendUp`, `DollarSign`→`CurrencyDollar`
5) Codemod phase C (shim adoption):
   - For files with many icon imports or inconsistent names, replace direct imports with `import { Icon } from "@Faworra/ui/components/icon"` and swap usages to `<Icon name="..." />` using the mapping.
6) Apply active-state weight where applicable (e.g., nav/tab items): if `active` boolean is present, render `<Icon weight={active ? "bold" : "regular"} />`.
7) Run `bun run typecheck && bun run build` in each affected app; fix any missing mappings.
8) Visual QA on primary pages; adjust outliers.
9) Remove `lucide-react` from `package.json` where no longer referenced.

Deliverables
- PR with codemods, icon shim, and dependency updates.
- Short QA notes (screens checked, any substitutions made).

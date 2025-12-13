# Faworra Design System: Swiss Industrial

This document outlines the design philosophy and system for Faworra, inspired by the International Typographic Style (Swiss Style) and Dieter Rams' industrial design ethos. It serves as the "source of truth" for all UI/UX decisions.

## Core Philosophy

**"Less but Better"**

Faworra is a precision instrument for business management. The interface should feel like a well-crafted physical tool: reliable, objective, and unobtrusive. We reject decorative elements in favor of clarity, hierarchy, and function.

## 1. Typography

Typography is the primary vehicle for structure and hierarchy.

*   **Primary Font:** `Geist Sans` (Variable). A neo-grotesque sans-serif that is neutral, legible, and objective.
*   **Monospace:** `Geist Mono`. For data, code, and technical details.
*   **Serif (Accent):** `Instrument Serif`. Use *extremely* sparingly, primarily for editorial moments or high-level section headers to create contrast, but do not overuse.

### Hierarchy & Scale
*   **Headings:** High contrast, tight tracking (-2% to -4%). Use weight to differentiate, not just size.
*   **Body:** Neutral weight (400), comfortable reading tracking (0%).
*   **Labels/Captions:** Uppercase, wide tracking (1-2px), smaller size (10-11px).

## 2. Color Palette: Digital Industrial

The palette is monochromatic, mimicking materials like aluminum, steel, and high-quality plastic.

### Neutrals (The Foundation)
*   **Canvas:** `hsl(224 0% 100%)` (White) / `hsl(224 0% 4%)` (Matte Black) - Vast, empty space.
*   **Surface:** `hsl(224 0% 98%)` / `hsl(224 0% 9%)` - Subtle separation for cards/panels.
*   **Border:** `hsl(224 0% 90%)` / `hsl(224 0% 15%)` - Precise, thin lines (1px).

### Functional Accents (Use Sparingly)
*   **Braun Orange:** `#FF4D00` - Primary actions, "Power" state.
*   **Signal Green:** `#00B341` - Success, Active, "Go".
*   **Alert Red:** `#FF0000` - Destructive, Error, "Stop".
*   **Focus Blue:** `#0066FF` - Selection, Focus rings (Digital precision).

*Avoid muddy mid-tones. Go for high contrast: Black on White, White on Black.*

## 3. Layout & Grid

*   **Strict Grid:** All elements must align to a rigid grid system. Use 4px/8px baselines.
*   **Whitespace:** Use whitespace actively to group information. Do not fear empty space; it adds value to the content.
*   **Asymmetry:** Embrace asymmetrical layouts to create dynamic tension and guide the eye.

## 4. Component Styling

### Surfaces & Borders
*   **Radii:**
    *   `sm`: `2px` (Sharp, precise)
    *   `md`: `4px` (Standard)
    *   `lg`: `8px` (Containers)
    *   *Avoid fully rounded "pill" shapes unless it's a specific toggle or status indicator.*
*   **Borders:** 1px solid. No fuzzy shadows. If depth is needed, use a sharp, hard shadow or a high-contrast border.
*   **Glassmorphism:** Avoid blurry, milky glass. Use sharp transparency or solid colors. If transparency is used, it should feel like clear optical glass, not frosted plastic.

### Interactions
*   **States:** Hover, Active, and Focus states must be distinct and immediate.
*   **Animation:** Instant or extremely fast (100ms-200ms). Linear or slight ease-out. No bounce, no wobble. The UI should feel mechanical and snappy.

## 5. Iconography

*   Use a consistent icon set (e.g., Lucide, Phosphor) with a thin stroke width (1.5px or 1px) to match the typography.
*   Icons should be functional labels, not illustrations.

## 6. Comparison with Midday

While Midday serves as a functional reference, Faworra diverges in aesthetic:

| Feature | Midday | Faworra (Swiss Industrial) |
| :--- | :--- | :--- |
| **Vibe** | Modern SaaS, Clean, Friendly | Industrial, Precision, Objective |
| **Typography** | Hedvig Sans/Serif | Geist Sans / Instrument Serif |
| **Corners** | Rounded, Soft | Tighter, Sharper |
| **Depth** | Soft Shadows, Blur | Flat, Borders, Hard Shadows |
| **Color** | Soft Neutrals | High Contrast "Braun" Palette |

## Implementation Checklist

- [ ] Update `tailwind.config.ts` to enforce the new color palette and radii.
- [ ] Refine `globals.css` to remove unused variables and strictly define the "Industrial" theme.
- [ ] Audit components to ensure they use the correct border radii and spacing.
- [ ] Replace generic "Inter" usage with "Geist Sans" throughout the app.

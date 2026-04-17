# Faworra Brand Package — v1.0
## For AI Agent / Developer Handoff

---

### What this is
Complete brand identity package for **Faworra** — a Business Operating System for West African SMEs.
Built in Berlin. Aesthetic direction: **Tech Brutalist Minimal**.

---

### Files in this package

```
faworra-brand/
├── logos/
│   ├── faworra-logo-horizontal-light.svg   → Light background use
│   ├── faworra-logo-horizontal-dark.svg    → Dark background use
│   ├── faworra-logo-horizontal-forest.svg  → Forest green background use
│   ├── faworra-logo-vertical-light.svg     → Stacked lockup, light
│   ├── faworra-icon-light.svg              → Favicon / app icon, light
│   └── faworra-icon-dark.svg              → Favicon / app icon, dark
├── css/
│   ├── faworra-tokens.css                  → Full CSS custom properties + base styles
│   └── faworra.tailwind.config.js          → Tailwind config extension
└── docs/
    └── faworra-brand-guidelines.html       → Visual brand guidelines (open in browser)
```

---

### Core palette

| Token              | Hex       | Usage                              |
|--------------------|-----------|------------------------------------|
| `--color-obsidian` | `#0A0A0A` | Primary BG / all typography        |
| `--color-ivory`    | `#F8F7F2` | Primary surface / paper            |
| `--color-forest`   | `#0D3B2E` | Positive data / live / active nav  |
| `--color-sandsong` | `#D4C5A8` | Secondary accent / earth warmth    |

---

### Typography

- **Sans:** Inter (400, 500 only) — amounts, names, body
- **Mono:** JetBrains Mono — labels, timestamps, IDs, metadata

---

### Critical rules for implementation

1. `border-radius: 0` everywhere. Tags may use `2px` max.
2. Borders are `1px solid` — never `0.5px`.
3. No `box-shadow` anywhere.
4. Forest Green (`#0D3B2E`) = financial positive / live state ONLY. Never decorative.
5. All field labels → mono, uppercase, `letter-spacing: 0.10em`, `font-size: 10px`.
6. All financial values → tabular figures, mono font.
7. Hover = inversion (obsidian ↔ ivory). No color transitions.
8. The green dot in the logo mark is always `#0D3B2E` (or `#D4C5A8` on Forest backgrounds).

---

### How to use `faworra-tokens.css`

```html
<!-- In your HTML head -->
<link rel="stylesheet" href="./css/faworra-tokens.css">
```

```css
/* In your component styles */
.my-card {
  background: var(--color-ivory);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-none);
}

.my-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--color-gray-400);
}
```

### How to use `faworra.tailwind.config.js`

```js
// tailwind.config.ts
import faworraConfig from './css/faworra.tailwind.config.js'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [faworraConfig],
  // your other config...
}
```

Then use in JSX:
```jsx
<div className="bg-ivory border border-obsidian rounded-none">
  <span className="font-mono text-label uppercase tracking-wider text-gray-400">Revenue</span>
  <span className="font-sans text-xl text-forest">₵52,760</span>
</div>
```

---

### Prompt for your AI agent

> You are building UI for Faworra, a Business OS for West African SMEs.
> Aesthetic: Tech Brutalist Minimal — inspired by Vercel/Linear but with West African roots.
>
> Design rules:
> - border-radius: 0 always
> - borders: 1px solid #0A0A0A (never 0.5px)
> - no shadows, no gradients, no blur
> - colors: #0A0A0A (obsidian), #F8F7F2 (ivory), #0D3B2E (forest), #D4C5A8 (sandsong)
> - forest green appears ONLY on positive financial data, live states, active nav
> - typography: Inter (400/500) for content, JetBrains Mono for labels/metadata
> - labels: mono, uppercase, 10px, letter-spacing 0.10em, color #999891
> - hover: invert background/text (obsidian ↔ ivory), 150ms transition, no color
> - currency: ₵ (Ghana Cedi), tabular figures, mono font

---

*Faworra Brand Package — Studio Faworra / Berlin — April 2026*

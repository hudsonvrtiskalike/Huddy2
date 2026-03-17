# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Repository Overview

**WealthKit** is a personal finance dashboard built with React and Vite. It provides three interactive tools:

- **Calculator** — compound interest growth projector with sliders and a live chart
- **Watchlist** — filterable list of stocks/crypto with add/remove support
- **Budget** — monthly income/expense/investing tracker with a quick insight

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | React 18 (functional components + hooks) |
| Bundler     | Vite 5                              |
| Charts      | Recharts 2                          |
| Styling     | Inline styles via a shared `G` theme object |
| Language    | JavaScript (JSX, no TypeScript)     |
| Font        | DM Sans (Google Fonts, loaded at runtime) |

## Directory Structure

```
wealthkit/
├── index.html          # Vite HTML entry point
├── vite.config.js      # Vite config (React plugin)
├── package.json
├── .gitignore
└── src/
    ├── main.jsx        # React root — mounts <App /> into #root
    └── App.jsx         # Entire application (single-file component)
```

> All application logic currently lives in `src/App.jsx`. As the app grows, split components into `src/components/`.

## Project Setup

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Architecture

### Theme

All colors are defined in a single `G` object at the top of `src/App.jsx`:

```js
const G = {
  bg: "#0a0a0f", surface: "#13131f", border: "#1e1e30",
  text: "#e8e8f0", muted: "#555570",
  green: "#00e5a0", blue: "#00b4d8", purple: "#a78bfa", red: "#ff6b6b",
};
```

Always use `G.*` tokens rather than hardcoding hex values.

### Shared Components

- **`Card`** — surface container with rounded corners and border. Accepts a `style` spread for overrides.
- **`Pill`** — small toggle button used for filter tabs. Props: `label`, `active`, `onClick`.

### Feature Components

| Component     | State                                         | Key logic |
|---------------|-----------------------------------------------|-----------|
| `Calculator`  | `start`, `monthly`, `rate`, `years`           | `calcGrowth()` computes year-by-year compound growth |
| `Watchlist`   | `list` (array), `filter`, `adding`, form fields | Add/remove items; filter by `type` ("all" / "stock" / "crypto") |
| `Budget`      | `cats` (array of categories)                  | Sums income, expenses, investing; derives `left` |

### Data

Seed data lives as module-level constants:
- `SEED` — default watchlist items
- `DEFAULT_CATS` — default budget categories

All state is local to each component (no global store). Data resets on page refresh — there is no persistence layer yet.

## Code Conventions

- **Inline styles only** — no CSS files or CSS-in-JS libraries. Use the `G` theme object for all color references.
- **Flat component tree** — helper components (`Row`, `Card`, `Pill`) are defined in the same file; keep them co-located unless reused across multiple files.
- **No TypeScript** — plain `.jsx` files. Add prop validation with PropTypes only if a component's API becomes non-obvious.
- **No global state** — use `useState` locally. Introduce a store (Zustand, Context) only when state genuinely needs to be shared across sibling trees.
- **Formatting** — `fmt()` is the single currency formatter; reuse it for all `$` display values.

## Development Workflow

### Branch Strategy

- Never push directly to `main` or `master`
- Feature branches: `claude/<feature-description>-<session-id>`
- Always push with: `git push -u origin <branch-name>`

### Commit Conventions

```
<type>: <short summary>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

Examples:
- `feat: add localStorage persistence for watchlist`
- `fix: correct compound interest calculation for monthly compounding`
- `refactor: extract Calculator into src/components/Calculator.jsx`

### Making Changes

1. Confirm you are on the correct feature branch
2. Read the file before editing it
3. Keep commits focused — one logical change per commit
4. Run `npm run build` before pushing to catch any build errors (no automated CI yet)

## Potential Next Steps

- **Persistence** — save watchlist and budget to `localStorage`
- **Real prices** — integrate a market data API (e.g. Yahoo Finance, Polygon.io) for live watchlist quotes
- **Split components** — move `Calculator`, `Watchlist`, and `Budget` into `src/components/`
- **Testing** — add Vitest + React Testing Library
- **TypeScript** — migrate to `.tsx` for better IDE support

## AI Assistant Notes

- Keep all color values referenced through `G.*` — never hardcode hex values
- Inline styles are intentional; do not introduce CSS files without discussion
- The app is fully client-side with no backend — do not add server-side code without explicit instruction
- Update this file when adding new dependencies, components, or architectural patterns

# AI rules — Web track (`electric_app/web`)

This document has **two parts**: **Part 1** describes rules for the **electric circuit workshop** browser app in this repo (board, wiring, simulation, electricity visuals). **Part 2** embeds a **general TypeScript, React, and Web AI guide** maintained for this repository (there is no separate external template path for web—unlike Flutter’s `flutter_uiuxpromax` embed). **If anything conflicts**, Part 1 wins—especially **domain architecture**, **simulation purity**, alignment with **`../flutter/`**, and **project-specific** stack choices.

---

## Part 1 — Electric circuit workshop (web)

This document guides AI and human contributors working in **`web/`** on the **electric circuit workshop** browser app: a **wooden bench** metaphor, **sidebar** parts/tools, **pin-to-pin wiring** (SVG paths or Canvas strokes), **simulation** (Phase A connectivity → Phase B polarity → optional Phase C Ohm’s-law lite), and **animated / static “electricity”** feedback on wires and components.

**Product intent** lives in `README.md` in this folder; **keep README and this file aligned** when behavior or stack decisions change.

---

## Role and expertise

You are an expert in **TypeScript**, **React**, and **browser graphics** (SVG first; **Canvas** when justified), with strong experience in:

- Strict typing, predictable state updates, and performance-conscious rendering (avoid unnecessary re-renders).
- Building **interactive diagrams**: hit targets, coordinate spaces, zoom/pan, and layered wire rendering.
- **Accessibility**: `prefers-reduced-motion`, keyboard paths, semantic labels, and not relying on color alone.

Assume the user understands programming but may need **short explanations** of React 18+ patterns (e.g. `useSyncExternalStore`, concurrent features) when they affect correctness.

---

## Interaction with the user

- If a request is **ambiguous**, clarify **React vs Vue** (default here is **React** unless the repo says otherwise), **SVG vs Canvas** for the current slice of work, and whether the change must stay **behavior-compatible** with **`../flutter/`**.
- When adding **npm dependencies**, justify **bundle size**, **maintenance**, and **overlap** with existing stack (e.g. avoid two state managers).
- Prefer **running** `npm run build`, `npm run lint`, and `tsc --noEmit` (or project equivalents) over assuming a clean typecheck.

---

## Domain architecture (non-negotiable concepts)

### Separation: scene state vs simulation vs view

| Layer | Responsibility | Rules |
|-------|----------------|--------|
| **Model / scene** | Placed parts, wires, selection, optional history | **Plain TypeScript types**; updates via explicit actions or reducers; **no JSX** in model modules. |
| **Graph** | Pins as nodes; wires + internal component edges | **Pure builders** from scene state; consumed only by simulation and hit-testing helpers. |
| **Simulation** | Phase A: **closed path** from **+** to **−**, switches as breaks; Phase B: diode/LED direction; Phase C: optional numerics | **Pure functions**: `simulate(scene | graph, config) => SimResult`. **No DOM**, no React imports. |
| **View** | React tree, SVG/Canvas layers, CSS, animation drivers | Reads **SimResult** + mode flags; **does not** reimplement connectivity inside components ad hoc. |

**SimResult** must be rich enough for **electricity visualization** (see `README.md` — *Showing electricity*): per-edge **`isEnergized`**, optional **flow direction**, per-component display states, and whether **Test / power** is active.

### Conventional current and teaching

- Default **animation and arrows** to **conventional current** (**+** → **−**).
- **`prefers-reduced-motion: reduce`:** replace **infinite** dash/gradient motion with **static** energized styling; keep **semantic** state in text/icons/ARIA.

### Alignment with the Flutter track

- **Rules of “working”** and phase ordering should **match** `../flutter/README.md` unless a deliberate divergence is documented in both places.
- **Shared vocabulary** (`PinId`, `WireId`, component kinds) helps porting and documentation.

---

## Recommended stack (when the project is initialized)

| Piece | Default choice | Notes |
|-------|----------------|--------|
| **Bundler** | **Vite** | Fast HMR; good TypeScript defaults. |
| **UI** | **React 18+** with **TypeScript** (`strict: true`) | Functional components + hooks. |
| **Styling** | **CSS Modules** or **Tailwind** (team choice) | Consistent tokens for wire idle/live; avoid inline style churn on hot paths if a CSS class suffices. |
| **SVG** | Primary for **wires** and scalable parts | Animate via `stroke-dashoffset`, filters, or `requestAnimationFrame` phase; see Visualization. |
| **Canvas** | Optional second layer | Use for **many** segments or particle effects; often pair with **SVG overlay** for hit-testing unless you implement full picking in canvas. |
| **Lint** | **ESLint** + **TypeScript-eslint** + **Prettier** | Enforce hooks rules and consistent formatting. |

**Vue** is an acceptable substitute for React only if the repository **standardizes** on it—mirror the same separation rules (pure sim, typed models).

---

## Project layout (recommended)

```
src/
  model/          # types, ids, scene state, reducers
  graph/          # buildGraph(scene), helpers
  sim/            # phaseA.ts, phaseB.ts, index.ts — pure
  ui/
    board/        # Board, grid, transforms, zoom/pan
    palette/      # Parts list, drag sources
    wires/        # SvgWire, layers, hit-testing wrappers
    parts/        # Part glyphs, pin anchors
  hooks/          # useScene, useSimResult (thin)
  app.css / tokens
```

Names are indicative; **keep `sim/` free of React imports.**

---

## TypeScript rules

- Enable **`strict`** and **`noImplicitAny`** (via `strict`); avoid `any`; use **`unknown`** + narrowing at boundaries.
- Prefer **`readonly`** arrays and object types for immutable snapshots where practical.
- Use **discriminated unions** for component kinds and sim failure reasons so **`switch` is exhaustive** with `never` checks.
- **Branded types** for ids (`type PinId = string & { readonly __brand: 'PinId' }`) optional but useful when the graph grows.
- **Avoid** non-null assertions (`!`) unless justified in a one-line comment.

---

## React rules

- **Default to pure presentational components** receiving data via props; lift state to **`useReducer`**, **Context**, or a **small store** (e.g. Zustand) only when needed.
- **`useMemo` / `useCallback`:** use for **referential stability** when passing callbacks to **memoized** children or foreign libraries—not everywhere by default.
- **`React.memo`:** for **expensive** subtrees (e.g. large part lists) when profiling shows benefit.
- **Do not** drive **60fps** animation by **React state updates every frame** for all wires—prefer **CSS animation** on a class, **`requestAnimationFrame`** updating a **ref** + CSS variable or SVG attribute on a **minimal** subtree, or **Canvas** rAF loop.
- **Keys:** stable ids (`wireId`, `partId`) for lists; never index-as-key for dynamic lists.

### Concurrent features

- **Avoid tearing** between sim result and paint: if using external stores, prefer **`useSyncExternalStore`** for subscribing to sim state when integrating non-React stores.

---

## SVG vs Canvas (decision guide)

| Use SVG when | Use Canvas when |
|--------------|-----------------|
| Moderate wire count, DOM **accessibility** matters, **`stroke-dashoffset`** animation is enough | Thousands of segments, **particle** fields, or custom shaders |
| You need **vector-effect** / crisp zoom | You accept **custom hit-testing** or hybrid overlay |
| **Two-layer** wire (glow + stroke) is straightforward | Single rAF paint loop is simpler than huge SVG trees |

**Hybrid:** Canvas **under** for animated glow; **SVG overlay** for **interactive** wire strokes and pins—document hit-testing clearly.

---

## Wiring, coordinates, and interaction

- **Single source of truth** for **board transform** (pan/zoom scale) — typically a matrix or `{ scale, tx, ty }` in state or refs; convert **screen ↔ board** in one utility module.
- **Pin hit targets:** meet **minimum** touch size (e.g. **44×44 px** CSS) using **invisible** circles or padding even if the visual pin is smaller.
- **Wire creation:** explicit modes (click pin A → click pin B) or drag-to-connect; **cancel** with Escape; **delete** wire with clear affordance.
- **Path `d` strings:** memoize from pin positions and bend points; **invalidate** only when geometry changes.

---

## Visualization and animation (electricity)

- **Layered strokes:** glow + crisp line per wire; see `README.md`.
- **CSS:** prefer **`@media (prefers-reduced-motion: reduce)`** to disable **infinite** animations; provide **static** “live” appearance.
- **SVG filters:** watch **performance** on low-end mobile; test with **throttled** CPU in DevTools.
- **Do not** animate **hue** alone to indicate danger vs success—pair with **text** or **icons**.

---

## Simulation implementation rules

- **`sim/`** functions are **deterministic** and **side-effect free** (no `fetch`, no `Date.now()` for logic unless modeling time explicitly).
- **Phase A** covered by **unit tests**: simple graphs, open switch, disconnected nodes.
- **Phase B:** explicit **edge cases** in tests (reverse LED).
- Export a **single** `simulate(...)` or `runPhaseA(...)` API surface used by the UI—avoid **scattered** ad hoc checks in components.

---

## Styling and design tokens

- **CSS variables** or **Tailwind theme** for **wire idle**, **wire live**, **glow**, **board background**, **accent**—avoid hardcoding hex in **every** component.
- **Responsive:** palette may **collapse** to bottom sheet on narrow viewports; board must **not** overflow horizontally without intent.

---

## Network and persistence (future)

- If **save/load** or **share URL** arrives: **validate** JSON with **Zod** or similar; **never** `eval` imported circuit data.

---

## Testing

- **Vitest** (or Jest) for **`sim/`** and **`graph/`** — fast, no DOM.
- **React Testing Library** for **user-visible** behavior: run test, assert **semantics** / text / ARIA.
- **E2E** (Playwright): optional for full drag-and-wire flows once stable.

---

## Linting and formatting

- **ESLint** with **`eslint-plugin-react-hooks`**; **Prettier** for formatting; **typecheck** in CI (`tsc -b` or `vite build`).
- **No** `console.log` in committed code paths intended for production—use a **small logger** or **debug** flag.

---

## Package management

- Prefer **one** lockfile (`package-lock.json` or `pnpm-lock.yaml`); **pin** major versions consciously.
- Run **`npm audit`** / **`pnpm audit`** periodically; **do not** add duplicate packages for the same concern (e.g. two date libraries).

---

## Accessibility

- **Semantic HTML:** `button` for actions, **`nav`** for palette if appropriate, **labels** tied to inputs.
- **Live regions:** announce **simulation result** changes (`role="status"` / `aria-live="polite"`) when Test completes.
- **Keyboard:** Test control and **palette** focus order; **Escape** closes modals and cancels wire-in-progress.
- **Focus visible:** do not remove outlines without a **replacement** focus style.

---

## Security

- **Sanitize** any **user-supplied** text shown in UI (labels, imported names).
- **No** `dangerouslySetInnerHTML` without a **sanitizer** (e.g. DOMPurify) if ever needed.

---

## What to avoid

- **Simulation logic** inside `useEffect` without a clear dependency story—prefer **derived** state from scene + explicit **Run test** action.
- **Re-rendering the full board** on every `requestAnimationFrame` tick.
- **Duplicating** circuit rules between `web/` and `flutter/` without a **spec** or **shared test vectors** (future improvement).
- **Treating** SVG and Canvas **interchangeably** in the same code path without an **abstraction**—leads to inconsistent hit-testing.

---

## Quick reference — files to read first

1. `web/README.md` — vision, phases, electricity visualization, stack notes.
2. This file — Part 1 (project rules) and Part 2 (embedded general TS/React/Web guide).
3. `src/sim/` and `src/model/` (once scaffolded) — source of truth for behavior.

---

## Part 2 — Embedded: TypeScript, React & Web AI rules (general reference)

The content below is the **canonical general-purpose** web stack guide for contributors and AI. It complements Part 1 with tooling, React/TypeScript patterns, styling, testing, and security.

**Precedence:** Part 1 overrides Part 2 where they conflict—for example Part 1 forbids React imports in `sim/`, standardizes **SVG-first** wires for this product, and requires **behavior alignment** with `../flutter/README.md`.

---

# AI rules for TypeScript, React & Web (embedded reference)

You are an expert in **TypeScript**, **modern React** (18+), and **browser
platform APIs**, with strong experience building **accessible**, **performant**
front-end applications. You favor **strict typing**, **predictable data flow**,
and **testable** architecture. You are comfortable with **Vite**, **ESLint**,
**Vitest**, and **SVG** / **Canvas** when graphics are required.

---

## Interaction Guidelines

* **User persona:** Assume the user understands programming but may be new to
  the React ecosystem or to strict TypeScript.
* **Explanations:** When generating code, briefly explain non-obvious TypeScript
  (discriminated unions, narrowing, `satisfies`) or React patterns (effects,
  refs, concurrent rendering) when they matter for correctness.
* **Clarification:** If a request is ambiguous, ask about **browser targets**,
  **state management preference**, and **bundler** (Vite is the default for this
  repo unless stated otherwise).
* **Dependencies:** When suggesting npm packages, explain **bundle impact**,
  **maintenance**, and **overlap** with existing dependencies.
* **Formatting:** Use **Prettier** and project ESLint rules; run **`npm run
  lint`** and **`tsc --noEmit`** (or equivalents) before concluding a task.
* **Fixes:** Prefer `eslint --fix` for auto-fixable issues; resolve TypeScript
  errors at the cause, not with `any`.

---

## Project structure (typical Vite + React + TS)

* **Entry:** `index.html`, `src/main.tsx`, `src/App.tsx`.
* **Source layout:** Prefer **feature folders** or **layered** folders
  (`model/`, `sim/`, `ui/`) as in Part 1 of this repo’s `AGENTS.md`.
* **Public assets:** `public/` for static files; **import** assets from `src/`
  when they should be hashed by the bundler.
* **Environment:** Use `import.meta.env` (Vite) for build-time env; never commit
  secrets.

---

## TypeScript: style and rigor

* **Strict mode:** Enable `"strict": true` in `tsconfig.json`; avoid `any`.
  Use **`unknown`** at boundaries and **narrow** explicitly.
* **Naming:** `PascalCase` for components and types, `camelCase` for values and
  functions, `UPPER_SNAKE` only for true constants.
* **Files:** `PascalCase.tsx` for components; **kebab-case** or **camelCase**
  for utilities—**one convention per repo**, match existing code.
* **Immutability:** Prefer **readonly** props and **readonly** arrays for
  snapshots; use **immutable updates** (spread, `map`, `filter`) for state.
* **Discriminated unions:** Model variants with a **literal `kind` or `type`
  field**; use **`switch`** with **`never`** exhaustiveness checks.
* **Branded types** for ids when confusion would cause bugs:
  `type WireId = string & { readonly __brand: 'WireId' }`.
* **Avoid** `!` non-null assertions unless the justification is obvious in
  context.
* **Effective TypeScript:** Follow
  [TypeScript Do’s and Don’ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
  and team `tsconfig` paths.

---

## React: principles

* **Composition:** Prefer **small components** and **composition** over
  inheritance; avoid **HOCs** unless a library requires them.
* **Hooks:** Follow the **rules of hooks**; list **complete dependency
  arrays**; do not suppress `react-hooks/exhaustive-deps` without a comment
  explaining why.
* **Purity:** **Render** must be **idempotent**; avoid side effects during
  render except where React documents them.
* **Effects:** Use `useEffect` for **synchronization** with the outside world,
  not for **deriving** values from props/state (compute during render or with
  `useMemo` when expensive).
* **Keys:** Stable **`key`** from entity ids for lists; **never** use array
  index for dynamic lists that reorder.
* **Refs:** Use `useRef` for **mutable boxes** and **DOM** handles; avoid
  overusing refs for state that belongs in React state.
* **Concurrent React:** Be aware of **Strict Mode** double-invocation in dev;
  avoid relying on **mount-only** effects without cleanup for subscriptions.
* **Performance:** **Profile first**; apply `memo`, `useMemo`, `useCallback`
  when measurement shows benefit, not by default.

---

## State management

* **Local state:** `useState` / `useReducer` for component-local concerns.
* **Shared state:** **Lift state** or **Context** for moderate sharing; **Zustand**
  / **Jotai** / **Redux** only when complexity warrants—**one** global pattern
  per app.
* **External stores:** If subscribing outside React, prefer **`useSyncExternalStore`**
  to avoid **tearing** under concurrent rendering.
* **Server cache:** If later adding TanStack Query / SWR, keep **server state**
  separate from **editor/scene** state.

---

## Routing

* **React Router** (v6+): declarative routes, loaders where appropriate, nested
  layouts. Part 1 of this repo may use a **single** workshop screen initially.
* **URLs:** Use **path parameters** and **search params** intentionally; avoid
  putting **large** state in the URL without compression/serialization design.

---

## Styling

* **CSS Modules** or **Tailwind**—match the repo; **avoid** inline styles for
  large trees when a **class** or **design token** will do.
* **Design tokens:** **CSS variables** (`:root`) or Tailwind theme for **colors**,
  **spacing**, **radii**—especially **wire idle/live** in this product.
* **Responsive:** **Mobile-first** breakpoints; test **palette** collapse and
  **board** overflow.
* **Dark mode:** If supported, use **`prefers-color-scheme`** or a class on
  `documentElement`; keep **contrast** acceptable for text.

---

## SVG and Canvas

* **SVG:** Prefer for **wires**, **icons**, and **accessible** diagrams; use
  **`stroke-dashoffset`** animation with respect to **`prefers-reduced-motion`**.
* **Canvas:** Use when **particle counts** or **custom shaders** demand it;
  often **combine** with **SVG** or **HTML** overlay for **hit-testing** and
  **a11y**.
* **Performance:** Minimize **DOM node** count for huge SVGs; consider
  **virtualization** or **canvas** for thousands of edges.

---

## Package management

* **One** package manager per repo (**npm**, **pnpm**, or **yarn**); commit
  **lockfile**.
* **Adding:** `npm install <pkg>` or `pnpm add`; prefer **exact** or **caret**
  versions per team policy.
* **Audit:** Run **`npm audit`** regularly; **do not** ignore **high** severity
  in production paths without a plan.
* **Duplicates:** Avoid two libraries for the same job (e.g. two date libs).

---

## Code quality

* **Separation:** **UI** vs **domain** vs **simulation**—simulation stays **pure**
  (see Part 1).
* **Functions:** Short, **single responsibility**; extract **pure helpers** for
  testability.
* **Errors:** Use **`Result`** patterns or **typed errors** at boundaries; do not
  **swallow** errors in `catch` without logging.
* **Async:** **`async`/`await`**; handle **rejection**; use **`AbortSignal`** for
  cancellable fetch when applicable.
* **Logging:** No raw **`console.log`** in production paths; use a **small
  wrapper** that can be stripped or gated by env.

---

## ESLint and Prettier

* **ESLint:** `eslint-plugin-react-hooks`, `@typescript-eslint`, **import**
  ordering if configured.
* **Prettier:** Single source of formatting truth; **do not** fight Prettier in
  review.
* **CI:** Run **`lint`** and **`typecheck`** on every PR.

---

## Testing

* **Unit / integration:** **Vitest** (or Jest) for **pure** `sim/` and `graph/`
  modules—**no** JSDOM required.
* **Component:** **React Testing Library**—assert **behavior** and
  **accessibility**, not implementation details.
* **E2E:** **Playwright** or **Cypress** for drag/wire flows when stable.
* **Patterns:** **Arrange–Act–Assert**; prefer **userEvent** over **fireEvent**
  where RTL recommends it.

---

## Visual design and UX (web)

* **Typography:** Scale from a **modular scale**; respect **user font size**
  settings (`rem`).
* **Motion:** Honor **`prefers-reduced-motion`**; provide **non-motion** cues.
* **Touch targets:** **≥ 44×44 CSS px** for interactive targets (WCAG
  recommendation).
* **Feedback:** **Loading**, **error**, and **success** states for async
  actions.

---

## Performance

* **Bundle:** **Code-split** routes with `React.lazy` + `Suspense` when multiple
  routes exist; analyze with **rollup-plugin-visualizer** if needed.
* **Rendering:** Avoid **unnecessary** parent state updates; **batch** where
  React 18 **automatic batching** helps.
* **Animation:** Prefer **CSS** transforms/opacity for **compositor** work;
  avoid **layout thrashing** (read/write interleaving) in rAF loops.

---

## Documentation

* **Public APIs:** **TSDoc** (`/** */`) for exported functions and types.
* **README:** Keep **feature** READMEs updated when behavior changes.
* **Why comments:** Explain **non-obvious** invariants and **sim**
  simplifications—not what the code obviously does.

---

## Accessibility (a11y)

* **Semantic HTML:** **`button`**, **`nav`**, **`main`**, headings in **order**.
* **ARIA:** Use when HTML **semantics** are insufficient; **avoid** redundant
  `role` on native elements.
* **Keyboard:** **Tab** order, **Escape** to dismiss, **focus trap** in modals.
* **Focus:** **Visible** focus styles; never **`outline: none`** without
  replacement.
* **Live regions:** **`aria-live`** for **dynamic** status (e.g. circuit test
  result)—**polite** by default.

---

## Security

* **XSS:** **Sanitize** HTML if ever rendering user strings to DOM; prefer
  **React text** nodes over **`dangerouslySetInnerHTML`**.
* **Dependencies:** Minimize **supply-chain** risk; **pin** critical build tools.
* **Env:** Never expose **secrets** in client bundles.

---

## Browser support

* **Baseline:** Define **minimum** browsers (e.g. last two Chrome, Firefox,
  Safari, Edge) and test **Safari** for SVG/CSS quirks.
* **Polyfills:** Add only when **data** shows need; Vite + modern targets often
  need none.

---

## API design (internal modules)

* **Narrow exports:** Prefer **named exports**; avoid **default export** soup
  unless a file is truly single-purpose.
* **Pure sim API:** **`simulate(input) => output`**—**no** hidden globals.

---

## Git and collaboration

* **Commits:** **Small**, **focused** commits with messages that explain **why**.
* **PRs:** Describe **behavior** change and **test** plan; screenshots for UI.
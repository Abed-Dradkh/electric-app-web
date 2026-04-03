<<<<<<< HEAD
# Web track — TypeScript + React + SVG (or Canvas)
=======
# Electric circuit workshop — TypeScript + React + SVG (or Canvas)
>>>>>>> e1d5bf1 (updates)

## Vision

Build a **browser-based** app where users see a **workshop-style board** (e.g. wooden background), use a **side panel** of **parts and tools**, **drag** components onto the board, **wire** connectors together, then **test** the circuit and see whether it is **connected and working**—with **animation** along wires when current should flow.

<<<<<<< HEAD
This folder holds the **TypeScript + React** implementation (Vue is an acceptable swap for the UI layer). **SVG** is the default recommendation for **wires** and crisp scaling; **Canvas** is an alternative if we need heavy raster effects or one big paint loop.

Product goals and simulation phases should stay aligned with the `flutter/` README so both tracks teach the same concepts.
=======
The **project root** holds the **TypeScript + React** implementation (Vue is an acceptable swap for the UI layer), with `src/` and tooling at the top level. **SVG** is the default recommendation for **wires** and crisp scaling; **Canvas** is an alternative if we need heavy raster effects or one big paint loop.

**Domain rules** (what “working” means, phase order A → B → optional C) live in this README and `AGENTS.md`; **behavior** should stay consistent with **unit tests** in `sim/` and `graph/` so docs and code do not drift.

---

## Electric brain

The **electric brain** is the **simulation and graph logic** (`sim/` and `graph/`): pure TypeScript that decides **what is connected**, **what is energized**, and **how each part behaves electrically**. It has **no UI**—React reads its output (`SimResult`) and paints wires and parts.

### What it must represent

- **Graph:** Pins are nodes; **wires** and **internal part connections** are edges. Parts declare **pin positions** and **internal topology** (e.g. switch open vs closed, diode direction).
- **Phases:** Same pipeline as elsewhere in this doc—**A** connectivity, **B** polarity-sensitive devices, **C** optional simple numerics.

### Supply: AC first (DC later)

| Focus           | Description                                                                                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Now (AC)**    | The default teaching supply is **AC**: a **two-terminal source** (e.g. **Line (L)** and **Neutral (N)**, or **Live** / **Neutral**). Phase **A** answers: is there a **closed conducting path** from one supply terminal to the other through wires and parts? That is the “circuit complete” story for workshop wiring. |
| **Future (DC)** | A **DC mode** (e.g. battery **+** / **−**) can be added for lessons that emphasize batteries, steady polarity, and DC-only parts. Until then, docs and **palette** should lead with **AC supply**, not a DC battery, as the canonical source.                                                                            |

The UI may still show a **generic “power” or “Test”** action; the **model** knows whether the active supply is AC or (later) DC.

### Parts: roles and what the brain expects

| Part            | In the model                                  | What simulation handles                                                                                                                                 |
| --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AC supply**   | Two terminals **not** shorted inside the part | **Phase A:** path must **enter one terminal and return through the other** via the external circuit; both participate in a closed loop for “energized.” |
| **Wire**        | Edge between pin endpoints                    | Ideal conductor; carries “live” state along the path when the loop is complete.                                                                         |
| **Switch**      | Internal edge present or absent               | **Open:** breaks continuity; **closed:** conducts like a wire.                                                                                          |
| **Bulb / lamp** | Conducting load                               | Glow / level when it sits in an energized loop (per `SimResult`).                                                                                       |
| **LED / diode** | Directed or polarity-aware element            | **Phase B:** conduction or “on” state depends on **orientation** (teaching simplification; not SPICE).                                                  |
| **Resistor**    | (when added)                                  | Optional **Phase C** or visual warmth; still a conducting path for Phase A unless modeled otherwise.                                                    |

Anything not in this table should get an explicit row here before the **electric brain** grows ad hoc rules in React.
>>>>>>> e1d5bf1 (updates)

---

## Product overview

<<<<<<< HEAD
| Area            | What we want                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Board**       | Full-area or framed “bench” surface with a tactile look (wood grain, subtle shadow, optional grid/snap).                                                                                                      |
| **Palette**     | Fixed or collapsible **sidebar** listing components (battery, resistor, LED, bulb, switch, …) and **tools** (wire tool, selection, delete, maybe pan/zoom).                                                   |
| **Placement**   | HTML5 drag-and-drop and/or pointer-driven drag from palette to board coordinates.                                                                                                                             |
| **Connections** | Each part defines **pins** in board space; **wires** are drawn as SVG paths (or canvas strokes) between pin anchors.                                                                                          |
| **Test**        | A button or toggle that runs the **simulator** and refreshes visual state: complete path, open switch, wrong LED orientation, etc.                                                                            |
| **Feedback**    | **Animated** indication of flow on conductors when the model says current runs—e.g. SVG `stroke-dashoffset` animation, moving gradients, or particles along path geometry. See **Showing electricity** below. |
=======
| Area            | What we want                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Board**       | Full-area or framed “bench” surface with a tactile look (wood grain, subtle shadow, optional grid/snap).                                                                                                                                          |
| **Palette**     | Fixed or collapsible **sidebar** listing components (**AC supply**, wire, switch, bulb, LED, resistor, …) and **tools** (wire tool, selection, delete, maybe pan/zoom). **DC battery** is a possible **future** palette item when DC mode exists. |
| **Placement**   | HTML5 drag-and-drop and/or pointer-driven drag from palette to board coordinates.                                                                                                                                                                 |
| **Connections** | Each part defines **pins** in board space; **wires** are drawn as SVG paths (or canvas strokes) between pin anchors.                                                                                                                              |
| **Test**        | A button or toggle that runs the **simulator** and refreshes visual state: complete path, open switch, wrong LED orientation, etc.                                                                                                                |
| **Feedback**    | **Animated** indication of flow on conductors when the model says current runs—e.g. SVG `stroke-dashoffset` animation, moving gradients, or particles along path geometry. See **Showing electricity** below.                                     |
>>>>>>> e1d5bf1 (updates)

---

## Showing electricity (circuit + wires)

Learners cannot see charge moving; the app **visualizes** the model’s idea of **where current flows** so **wires and parts** feel electrically connected. The **simulation** authorizes which segments are “live”; **styling and motion** carry the meaning.

### What the simulation should expose to the UI

Design the sim API so the view is not guessing:

- **Per wire / edge:** `isEnergized` (in the active loop), optional **`flowDirection`** (for arrow or shimmer direction), optional **normalized intensity** if we add simple I/V later.
<<<<<<< HEAD
- **Per component:** e.g. **bulb level**, **LED on / wrong polarity**, **switch closed**, **battery supplying** while test is active.
=======
- **Per component:** e.g. **bulb level**, **LED on / wrong polarity**, **switch closed**, **AC supply active** (terminals energized) while test is active.
>>>>>>> e1d5bf1 (updates)
- **Mode:** whether **Test / power** is on—animations may run only then so the board stays quiet while wiring.

Early phases only need **booleans** per edge; direction can be added when we want directional cues.

### Wires: resting vs energized

- **Resting:** single SVG `<path>` stroke—muted metal or insulated look, no animation.
- **Energized:** same geometry, enhanced read:
  - **Duplicate stroke:** wider, semi-transparent **glow** layer beneath the crisp line (`filter: drop-shadow` or feGaussianBlur in SVG).
  - **Marching ants / dashes:** `stroke-dasharray` + CSS animation on **`stroke-dashoffset`** (or SMIL / JS `requestAnimationFrame`) so dashes travel along the wire.
  - **Gradient along path:** SVG **linearGradient** with animated `gradientTransform`, or canvas **stroke with phase-shifted pattern**—good for a “pulse” traveling down the wire.
  - **Particles:** small circles whose positions are sampled along path length (flatten path to polyline or use `getPointAtLength`)—heavier but very clear.

Use **two layers** per wire if helpful: bottom = glow, top = sharp stroke + dashes, so editing and picking stay predictable.

### Components in the same story

Electricity should read **through** devices, not only along rubber lines:

<<<<<<< HEAD
- **Battery:** terminals or body subtly **active** when supplying (slow pulse, not strobe).
=======
- **AC supply:** terminals or housing subtly **active** when the loop is complete and test is on (slow pulse, not strobe). **DC battery** (future): same idea with **+** / **−** labeling.
>>>>>>> e1d5bf1 (updates)
- **Bulb / lamp:** **glow** or icon state tied to “current through load” in the model.
- **LED:** **light emission** when forward-biased; **off or warning** when reverse or open.
- **Switch:** **gap** clearly breaks flow—wires **downstream** of an open switch stay **idle** in animation.
- **Resistor (later):** optional warm color if we show relative dissipation.

### Direction and pedagogy

<<<<<<< HEAD
- Prefer **conventional current** direction (**+** → **−**) for motion and any arrows so it matches most intro texts.
=======
- **AC (default):** Show flow cues along the **completed path** (e.g. **line → load → neutral** in a simple series). Animation can suggest **alternation** over time or a steady **effective** direction for clarity—pick one product-wide rule and document it.
- **DC (future):** Prefer **conventional current** (**+** → **−**) for motion and arrows where DC mode is active.
>>>>>>> e1d5bf1 (updates)
- Motion-only cues (dashes moving) can replace arrowheads if the UI is crowded.

### When visuals stay “off”

- **While editing** (optional): no flow, or a single global “disconnected” hint.
- **Incomplete loop:** no full loop animation; optional one-shot “no path” feedback is polish.
- **Switch open / diode blocking:** segments past the discontinuity do not animate as live.
- **Accessibility:** respect **`prefers-reduced-motion`**: swap looping dash animation for **static** “live” color or glow; keep meaning available **without** color alone (icons, patterns, labels).

<<<<<<< HEAD
### Web-oriented implementation notes
=======
### Implementation notes (SVG & Canvas)
>>>>>>> e1d5bf1 (updates)

- **SVG:** `<path>` + `vector-effect: non-scaling-stroke` if zoom varies; animate **`stroke-dashoffset`** with CSS or a tiny hook driven by sim state.
- **Canvas:** one frame loop can draw all energized wires with the same phase; good if wire count is huge—at cost of custom hit-testing unless SVG overlay is retained for interaction.
- **Performance:** memoize path `d` strings; avoid React re-rendering every frame—drive animation via CSS on a class toggled by “test active,” or a `requestAnimationFrame` loop that only updates transform/offset.

---

## What we need to implement (capabilities)

No single npm package delivers the whole “electric workbench”; we combine:

1. **Scene state** — Immutable-friendly structures: placed parts, wire list, selection, maybe undo stack.
2. **Interaction** — Pointer events for drag, pin hit-areas, wire creation (click pin A → click pin B, or drag-to-connect pattern).
3. **Graph / net model** — Pins and wires form a **graph** (or netlist) that the simulator consumes. Internal part topology (two-terminal vs multi-pin) must be explicit in data.
4. **Simulation layers**
<<<<<<< HEAD
   - **Phase A:** **Connectivity** — Closed path from source **+** to **−**; switches open/close edges; output which edges are “live.”
   - **Phase B:** **Polarity** — Diode/LED direction; visual “wrong way” or no light.
=======
   - **Phase A:** **Connectivity** — Closed path between **AC supply terminals** (e.g. **L** to **N**); switches open/close edges; output which edges are “live.” **Future DC mode:** same idea with **+** to **−**.
   - **Phase B:** **Polarity** — Diode/LED direction; visual “wrong way” or no light (with teaching simplifications for AC if needed).
>>>>>>> e1d5bf1 (updates)
   - **Phase C (optional):** Numeric **Ohm’s-law** teaching aids for simple networks.
5. **Rendering** — React tree for parts; **SVG `<path>`** for wires (or a `<canvas>` layer); CSS or `requestAnimationFrame` for animation tied to sim state; see **Showing electricity** for layered wires, component glow, and reduced motion.

---

## What to expect (realistic outcomes)

<<<<<<< HEAD
- **First milestone:** Minimal part set, **Phase A** engine in TypeScript, **Test** action, visible **flow animation** on active wire segments when the loop is complete.
=======
- **First milestone:** Minimal part set centered on **AC supply**, **Phase A** engine in TypeScript, **Test** action, visible **flow animation** on active wire segments when the loop is complete.
>>>>>>> e1d5bf1 (updates)
- **Polish:** Tooling UX, delete, clearer messaging, switch and LED rules, responsive layout.
- **Stretch:** Save/load JSON, shareable URL hash, optional embed mode.

We are **not** targeting professional SPICE accuracy in the first iterations; we target **clarity** and **correctness for the simplified rules** we implement.

---

## Stack notes (why this shape)

| Piece          | Role                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| **TypeScript** | Typed models for components, wires, and sim results; safer refactors as rules grow.                                  |
| **React**      | Component tree for palette, board, overlays; state via hooks or a small store if needed.                             |
| **SVG**        | Vector wires, easy **stroke animation**, good accessibility and scaling; DOM hit-testing for pins with care.         |
| **Canvas**     | Optional for performance or unified painting; more manual hit-testing unless hybrid (SVG overlay + canvas underlay). |

Optional accelerators (not required day one): **React Flow** / **Vue Flow**–style **node–edge** libraries can speed up **generic** graphs; we still **customize** nodes to look like parts and encode **our** sim semantics.

---

## Suggested technical direction (when coding starts)

- **Bootstrap:** Vite + React + TypeScript is a common, fast baseline; ESLint + Prettier as you prefer.
- **State:** Start with `useReducer` or small Zustand-style store if prop drilling hurts; keep **simulation** as **pure functions** over the graph for testability.
- **Separation:** `model/` (types + graph), `sim/` (Phase A/B rules), `ui/` (board, palette, wire layer).

---

## Inspiration (not dependencies)

<<<<<<< HEAD
Useful references for **interaction and teaching quality**: **Falstad (CircuitJS)**, **PhET Circuit Construction Kit**, **Tinkercad Circuits**. For **open-source web sim architecture**, browsing repos like **circuitflow** or **CircuitSetu** can inform layering (UI vs engine), not necessarily our exact UI.
=======
Useful references for **interaction and teaching quality**: **Falstad (CircuitJS)**, **PhET Circuit Construction Kit**, **Tinkercad Circuits**. For **open-source browser-based circuit simulators**, browsing repos like **circuitflow** or **CircuitSetu** can inform layering (UI vs engine), not necessarily our exact UI.
>>>>>>> e1d5bf1 (updates)

---

## Current status

- **Stack:** Vite 6 + React 19 + TypeScript (`strict`), ESLint, Prettier, Vitest. Source under `src/` with `model/`, `graph/`, `sim/`, and `ui/` as in `AGENTS.md`.
<<<<<<< HEAD
- **Phase A:** Pure `simulate()` connectivity from battery **+** to **−** over wires and conducting component edges (battery terminals are **not** shorted internally—only the external loop completes the path). Shortest-path edges drive “live” wire styling; open switch removes its internal edge.
=======
- **Phase A:** Pure `simulate()` connectivity between **AC supply** terminals (e.g. **L** / **N**) over wires and conducting component edges (supply terminals are **not** shorted inside the part—only the **external** loop completes the path). Shortest-path edges drive “live” wire styling; open switch removes its internal edge. **DC battery (+ / −)** remains a **future** variant when DC mode is implemented.
>>>>>>> e1d5bf1 (updates)
- **UI:** Palette (add parts), SVG board, pin-to-pin wiring (two clicks), drag to move parts, **Test** toggle, dashed flow animation on energized wires (static live styling when `prefers-reduced-motion: reduce`), `aria-live` status, **Escape** cancels wiring in progress. Double-click a **switch** body to open/close it.

Run locally: `npm install` then `npm run dev`. Checks: `npm run build`, `npm run lint`, `npm test`.

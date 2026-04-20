# NanoSwarm Coronary Clot Simulator - Performance Hardening Plan

Audit date: `2026-04-18`

## Release Position

- Current release status: the project is already `demo-ready now`.
- Current performance status: the only explicit release warning is the non-blocking Vite chunk-size warning for the production bundle.
- Recommended posture: keep this release-focused and low risk. Do not change simulation behavior before demo unless a fix is clearly isolated and easy to verify.

## Most Likely Causes of the Current Vite Chunk-Size Warning

- Single large app entry:
  - `src/app/simulatorApp.ts` imports renderer, replay, schema IO, exports, guided logic, accessibility, safety copy, metrics UI, and preset plumbing into one eager path.
- Heavy Three.js render path in the main bundle:
  - `src/render/ArteryScene.ts` is a substantial scene module and is imported immediately at startup.
- No build chunking strategy in Vite:
  - `vite.config.ts` uses the default Vite config and does not define `manualChunks` or any lazy-loading strategy.
- Export code is eagerly loaded:
  - JSON, CSV, and PNG export modules are all imported into the main app shell even though they are only needed on demand.
- Guided, safety, and accessibility helpers are also bundled eagerly:
  - These are lightweight compared with Three.js, but they still add to the single startup chunk because the app shell imports them all directly.

## Safest Low-Risk Fixes for Bundle Size and Load Performance

### Do Now If We Want One Quick Fix

- Split the export modules behind dynamic import:
  - Lazy-load `src/export/exportJson.ts`, `src/export/exportCsv.ts`, and `src/export/exportPng.ts` only when the user clicks an export or import action.
  - This is low-risk because exports are user-triggered and not required for first paint.
- Add a conservative `manualChunks` strategy in `vite.config.ts`:
  - Put `three` in its own vendor chunk.
  - Keep app code together unless a second obvious split emerges after measuring.
- Leave simulation and renderer behavior unchanged:
  - Avoid touching replay, sim math, or guided flow before demo.

### Keep As-Is For Demo If Time Is Tight

- Accept the current chunk warning as non-blocking.
- Do not refactor `simulatorApp.ts` or `ArteryScene.ts` before demo.
- Focus on demo-machine validation instead of structural changes.

## Safest Low-Risk Runtime Performance Checks for the Demo Machine

- Cold-load check:
  - Open the production build once and confirm first render feels immediate and the UI is responsive before interaction.
- Guided-mode smoothness check:
  - Run the default guided preset once and confirm motion stays visually smooth with no noticeable hitches.
- Replay and scrub check:
  - Replay once, then scrub to a late tick and back to an earlier tick.
  - Confirm the scrub feels responsive enough for live demo use and does not stall the UI.
- Export latency check:
  - Trigger JSON, CSV, and PNG once each and confirm the UI remains responsive.
  - Pay special attention to PNG export because it depends on viewport capture.
- Camera and overlay switch check:
  - Toggle at least one camera and the fluoro overlay during a run and confirm there is no obvious jank.

## Renderer and Export Review Notes

- `src/render/ArteryScene.ts` uses `preserveDrawingBuffer: true` on the main `WebGLRenderer`.
  - This is convenient for `toDataURL()` capture, but it can cost runtime performance on some machines.
  - This should be reviewed after demo unless PNG export feels slow enough to justify a targeted pre-demo check.
- PNG export uses `scene.exportPng()` plus optional footer decoration.
  - This is a sensible release choice, but PNG latency should be measured once on the demo machine.
- Scrub and replay are deterministic and centralized already.
  - The main concern before demo is responsiveness, not correctness.

## What To Do Now vs After Demo

### Do Now

- Run one production-build demo-machine check and record results.
- Decide whether to leave the bundle warning alone or do one quick export lazy-load plus vendor chunk split.
- Measure PNG export latency once.
- Measure scrub responsiveness once with the default preset and one later timeline position.

### Postpone Until After Demo

- Large refactors of `src/app/simulatorApp.ts`.
- Large refactors of `src/render/ArteryScene.ts`.
- Deeper scene decomposition, controller extraction, or aggressive code splitting across guided/accessibility/safety modules.
- Any optimization that changes rendering behavior or simulation timing.
- Optional browser e2e automation and deeper performance instrumentation.

## Short Implementation Checklist

### Bundle Splitting / Lazy Loading

- Check whether export actions can lazy-load `exportJson`, `exportCsv`, and `exportPng` without touching app behavior.
- Add a minimal `manualChunks` rule for `three` only if we want one safe bundle-level fix.
- Rebuild and confirm the warning improves without breaking startup or exports.

### Renderer / Export Performance Review

- Measure guided-mode smoothness in the production build.
- Measure PNG export latency once in the production build.
- If PNG feels slow, inspect whether `preserveDrawingBuffer` is the likely cost before changing anything.

### Scrub / Replay Responsiveness Check

- Run replay from start once.
- Scrub to a late point, then back to a mid point.
- Confirm UI responsiveness stays acceptable on the demo machine.

### Export Latency Check

- Trigger JSON export once.
- Trigger CSV export once.
- Trigger PNG export once and note whether it introduces a visible pause.

## Recommendation

- Recommended action: `do one quick fix first`.
- Best quick fix:
  - Lazy-load the export modules and optionally split `three` into its own vendor chunk.
- Why this is the best middle ground:
  - It directly targets the current chunk warning.
  - It is lower risk than deeper app or renderer refactors.
  - It preserves simulation behavior and demo flow.
- If there is no time for even that:
  - Leave the app as-is for demo and do the runtime checks on the target machine.
- Do not do a deeper pass before demo unless the production build shows real runtime jank on the review machine.

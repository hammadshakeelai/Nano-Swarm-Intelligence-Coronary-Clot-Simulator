# NanoSwarm Coronary Clot Simulator - Release Readiness

Audit date: `2026-04-18`

## Release Status

- Backlog status: `Fully complete` through `SF-003`, based on the current `docs/progress-audit.md` audit.
- Demo/submission status: `Demo-ready now`.
- Release gate status: Core implementation, accessibility verification, and safety-copy auditing are all in place; remaining work is non-blocking polish.

## What Is Complete

- Deterministic replay and scrubbing:
  - Seeded replay, replay reset, and scrub-state restoration are implemented and covered by integration tests.
- Guided mode:
  - Guided mode runs end-to-end with centralized SRS-aligned captions and validated phase coverage.
- Exports:
  - JSON, CSV, and PNG export paths are implemented, deterministic-safe, and covered by export integration tests.
- Accessibility verification:
  - Keyboard access, reduced motion, focus visibility, non-color cues, and the regression checklist are documented and test-backed.
- Safety-copy audit:
  - Disclaimer text, banned wording, approved metric labels, and shipped copy audits are centralized and passing.

## Non-Blocking Items

- Vite chunk-size warning:
  - Production build still reports a non-blocking warning for a main chunk over `500 kB`.
  - Recommended follow-up: split large bundles with manual chunking or lazy-loading.
- Architectural consolidation / technical debt:
  - Major working behavior is still concentrated in `src/app/simulatorApp.ts`, `src/render/ArteryScene.ts`, `src/sim/engine.ts`, and `src/style.css`.
  - This does not block release, but it is the clearest maintainability debt.
- Optional e2e/browser coverage:
  - Unit and integration coverage are strong, but browser-level smoke coverage remains optional follow-on work.
- Performance target hardware validation:
  - A committed target-machine FPS/responsiveness validation record is still missing.
- Visual polish items:
  - Final color tuning, typography refinement, spacing cleanup, and screenshot/demo polish remain optional.

## Demo Checklist

- Choose one stable preset and seed for the demo path.
- Run one full guided sequence and confirm it reaches results cleanly.
- Show replay and timeline scrub behavior to demonstrate determinism.
- Switch camera and overlay once to show presentation controls.
- Verify JSON, CSV, and PNG exports from the current run.
- Open the disclaimer/help surface and confirm the centralized disclaimer appears correctly.

## Final QA Checklist

### Determinism

- Same seed plus same preset reproduces the same run.
- Replay returns to a seed-consistent state.
- Scrubbing to the same time index restores the same simulation state.

### Exports

- JSON round-trip preserves normalized scenario semantics and replay readiness.
- CSV output preserves ordered metrics history.
- PNG export preserves current camera and overlay state without mutating simulation truth.

### Accessibility

- Keyboard shortcuts and keyboard reachability still work as documented.
- Focus visibility remains clear on primary controls.
- Reduced-motion mode preserves meaning while reducing non-essential motion.
- Non-color status cues remain present.
- Accessibility checklist and verification docs are still current.

### Safety Copy

- Disclaimer/help/export surfaces use centralized disclaimer copy.
- Approved primary metric label remains `Simulated Vessel Patency Index (%)`.
- Central safety audit passes with no banned wording in audited shipped strings.

## Submission Recommendation

- Recommended action: `Submit/demo now`.
- Why:
  - The backlog is fully complete.
  - Milestones `M1` through `M5` are complete.
  - Accessibility and safety release gates are documented and implemented.
- If more time is available, fix these first:
  1. Address the Vite chunk-size warning.
  2. Run and record target demo hardware performance validation.
  3. Apply a small visual polish pass for clarity in screenshots and live review.

## Known Warnings

- Current build warning:
  - Vite reports a non-blocking chunk-size warning for the production bundle.
  - This is currently treated as a polish/performance item, not a release blocker.

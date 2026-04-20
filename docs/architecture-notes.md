# NanoSwarm Coronary Clot Simulator - Architecture Notes

## RS-003 Skeleton Alignment

This note documents the repo skeleton created for backlog task `RS-003`.

Top-level structure now present:

- `src/app`
- `src/ui`
- `src/render`
- `src/sim`
- `src/schema`
- `src/presets`
- `src/metrics`
- `src/export`
- `src/accessibility`
- `src/safety`
- `src/styles`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs`

## Intentional Current Differences From The Ideal Modular Layout

The repo is only aligned to the folder skeleton in this task. Working implementation is intentionally still consolidated in a few files so simulator behavior does not change during `RS-003`.

Examples:

- App shell and most UI wiring remain in `src/app/simulatorApp.ts`.
- Main stylesheet remains in `src/style.css`.
- Rendering remains centered in `src/render/ArteryScene.ts`.
- Simulation runtime remains centered in `src/sim/engine.ts`.
- Guided logic, safety copy, and replay helpers already exist, but are not yet fully redistributed into the final ideal nested layout from the backlog.

This is intentional. Later tasks such as `ST-002`, `ST-003`, and `SC-003` can place new modules into the prepared folders without forcing a behavior-changing refactor here.

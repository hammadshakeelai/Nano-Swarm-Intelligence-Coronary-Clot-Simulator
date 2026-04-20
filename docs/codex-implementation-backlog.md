# NanoSwarm Coronary Clot Simulator - Codex-Ready Implementation Backlog

## Source of Truth

This backlog is derived from `NanoSwarm_Coronary_Clot_Simulator_SRS_v2.docx` and uses that SRS as the source of truth for scope, sequencing, acceptance criteria, safety constraints, and validation targets.

Backlog principles taken directly from the SRS:

- Browser-first, pseudo-3D, educational science explainer
- Non-clinical, non-diagnostic, non-predictive framing
- One simplified coronary artery segment with one clot and one swarm
- Deterministic seeded replay required
- Guided mode must complete in 40-60 seconds at default playback speed
- Primary stack is Three.js + TypeScript with Vite browser packaging first
- Performance floor is 30 fps minimum
- Main vessel-opening metric must be named `Simulated Vessel Patency Index (%)`

Implementation assumptions used to remove ambiguity where the SRS leaves room for execution choice:

- Add two built-in presets, because FR-001 requires at least two built-in coronary artery presets.
- Use deterministic re-simulation for timeline scrubbing before adding optional snapshot caching.
- Use a mild coronary curve as the default preset shape.
- Use a rounded capsule glyph as the clean-view swarm placeholder unless design review changes it later.

## Difficulty Scale

- `S`: Small, self-contained, can usually be completed in one Codex turn.
- `M`: Medium, touches a few modules or requires one focused verification pass.
- `L`: Large, spans multiple modules and should be broken down only if a future implementation pass reveals more complexity.

## Milestones

| Milestone | Goal                            | Exit Criteria                                                                                                       | Primary Task IDs                                                           |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `M1`      | Deterministic foundation        | Same seed produces same run; schema validation and JSON round-trip work                                             | `RS-001` to `RS-003`, `ST-001` to `ST-004`, `SC-001` to `SC-003`, `MT-001` |
| `M2`      | Scene and core visuals          | Default artery/clot/swarm scene renders cleanly and supports the required camera set                                | `RD-001` to `RD-006`, `UI-001`, `UI-002`                                   |
| `M3`      | Simulation behavior and metrics | Swarm motion, clot reduction, metrics, and success/failure outcomes behave deterministically and stay within bounds | `SC-004` to `SC-007`, `MT-002`, `MT-003`, `UI-003`                         |
| `M4`      | Guided explainer and controls   | Guided mode runs end-to-end in 40-60 seconds with captions, timeline, keyboard access, and reduced motion           | `UI-004`, `UI-005`, `GD-001` to `GD-004`, `AX-001` to `AX-003`             |
| `M5`      | Exports and safety              | JSON, CSV, and PNG exports work; disclaimer and safe-copy rules are applied and validated                           | `EX-001` to `EX-004`, `AX-004`, `SF-001` to `SF-003`                       |

## Recommended Folder Structure

```text
src/
  app/
    createAppShell.ts
    simulatorController.ts
    appState.ts
  ui/
    header/
    metricsStrip/
    contextInset/
    labPanel/
    timeline/
    common/
  render/
    scene/
      createScene.ts
      cameraController.ts
      resizeManager.ts
    anatomy/
      coronaryPath.ts
      arteryMesh.ts
      heartInsetData.ts
    clot/
      clotMesh.ts
      clotMaterials.ts
    swarm/
      swarmInstancer.ts
      fluoroOverlay.ts
      flowParticles.ts
      fieldCues.ts
  sim/
    core/
      simulationClock.ts
      seededPrng.ts
      phaseMachine.ts
      replayController.ts
    models/
      scenarioRuntime.ts
      clotState.ts
      swarmState.ts
    systems/
      fieldSteering.ts
      localization.ts
      clotUpdate.ts
      outcomeResolver.ts
  schema/
    scenarioTypes.ts
    scenarioSchema.ts
    scenarioNormalizer.ts
    scenarioIO.ts
  presets/
    coronaryDefaultSuccess.json
    coronaryPartialFailure.json
    presetRegistry.ts
  metrics/
    formulas.ts
    metricsStore.ts
    metricsHistory.ts
    metricTooltips.ts
  guided/
    captionScript.ts
    guidedSequence.ts
  export/
    exportJson.ts
    exportCsv.ts
    exportPng.ts
  accessibility/
    keyboardMap.ts
    reducedMotion.ts
    focusStates.css
    qaChecklist.md
  safety/
    disclaimerText.ts
    bannedCopy.ts
    safetyAudit.ts
  styles/
    tokens.css
    app.css
  main.ts
tests/
  unit/
  integration/
  e2e/
docs/
  codex-implementation-backlog.md
  architecture-notes.md
```

## Build Order for Codex

Implement tasks in this exact order:

1. `RS-001`
2. `RS-002`
3. `RS-003`
4. `ST-001`
5. `ST-002`
6. `ST-003`
7. `ST-004`
8. `SC-001`
9. `SC-002`
10. `SC-003`
11. `MT-001`
12. `RD-001`
13. `UI-001`
14. `UI-002`
15. `RD-002`
16. `RD-003`
17. `RD-004`
18. `RD-005`
19. `RD-006`
20. `SC-004`
21. `SC-005`
22. `SC-006`
23. `SC-007`
24. `MT-002`
25. `MT-003`
26. `UI-003`
27. `UI-004`
28. `UI-005`
29. `GD-001`
30. `GD-002`
31. `GD-003`
32. `GD-004`
33. `EX-001`
34. `EX-002`
35. `EX-003`
36. `EX-004`
37. `AX-001`
38. `AX-002`
39. `AX-003`
40. `AX-004`
41. `SF-001`
42. `SF-002`
43. `SF-003`

Notes for execution:

- Do not start rendering tasks before schema, preset, and deterministic-clock tasks are done.
- Do not start guided-mode tasks before the phase machine, timeline plumbing, and camera system exist.
- Do not start export tasks before schema IO, metrics history, and viewport capture hooks exist.
- Run tests after every medium or large task, not only at milestone boundaries.

## 1. Repo Scaffold

### Epic: Project Foundation

| Task ID  | Title                                                          | Purpose                                                                                                       | Input Files                                                    | Output Files                                                                                                                                                 | Acceptance Criteria                                                                                                    | Test Requirements                                                                 | Difficulty |
| -------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- |
| `RS-001` | Initialize Vite + TypeScript + Three.js workspace              | Create the browser-first application scaffold required by the SRS stack decision.                             | `NanoSwarm_Coronary_Clot_Simulator_SRS_v2.docx`                | `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`                                                          | Vite app boots in browser; TypeScript compiles; `three` is installed; build/test scripts exist.                        | Smoke-check `npm run build`; verify browser entry renders without runtime errors. | `S`        |
| `RS-002` | Configure lint, format, and test tooling                       | Establish stable development tooling for incremental Codex work.                                              | `package.json`, `tsconfig.json`                                | `.eslintrc.*`, `.prettierrc*`, `vite.config.ts`, `tests/` bootstrap files, updated `package.json` scripts                                                    | ESLint, Prettier, and Vitest are configured; scripts are documented and runnable.                                      | Run `npm test`; run lint and format checks if configured.                         | `S`        |
| `RS-003` | Create implementation folder skeleton and base shell bootstrap | Make the repo structure align with the SRS work packages and remove file-placement ambiguity for later tasks. | `NanoSwarm_Coronary_Clot_Simulator_SRS_v2.docx`, `src/main.ts` | `src/app/`, `src/ui/`, `src/render/`, `src/sim/`, `src/schema/`, `src/presets/`, `src/metrics/`, `src/export/`, `src/accessibility/`, `src/safety/`, `docs/` | All recommended top-level folders exist; app bootstrap imports compile even if feature modules are still placeholders. | Build must still pass after directory creation and stub exports.                  | `S`        |

## 2. Schema / Types

### Epic: Contracts and Presets

| Task ID  | Title                                                          | Purpose                                                                                       | Input Files                                                     | Output Files                                                                                                                         | Acceptance Criteria                                                                                                              | Test Requirements                                                                            | Difficulty |
| -------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------- |
| `ST-001` | Define public simulation enums and data types                  | Encode the SRS data objects and enums as strongly typed TypeScript contracts.                 | `NanoSwarm_Coronary_Clot_Simulator_SRS_v2.docx`                 | `src/schema/scenarioTypes.ts`, `src/sim/models/clotState.ts`, `src/sim/models/swarmState.ts`, `src/metrics/formulas.ts` type exports | All root config fields, enums, phase names, and metrics records match the SRS contract and naming.                               | Add a compile-only type smoke test or import test.                                           | `S`        |
| `ST-002` | Implement ScenarioConfig validation and normalization          | Enforce schema rules from Section 8 before simulation or import use.                          | `src/schema/scenarioTypes.ts`, SRS Section 8                    | `src/schema/scenarioSchema.ts`, `src/schema/scenarioNormalizer.ts`                                                                   | Required fields, enums, numeric bounds, and unknown-root-field warning behavior are implemented.                                 | Add unit tests for valid config, invalid config, clamp behavior, and unknown-field handling. | `M`        |
| `ST-003` | Create built-in preset files and registry                      | Satisfy FR-001 by shipping at least two coronary presets and a deterministic registry loader. | `src/schema/scenarioTypes.ts`, SRS FR-001 to FR-007             | `src/presets/coronaryDefaultSuccess.json`, `src/presets/coronaryPartialFailure.json`, `src/presets/presetRegistry.ts`                | Registry exposes at least two presets; one preset can reach success and one can end incomplete; presets validate against schema. | Add tests that load and validate each preset.                                                | `S`        |
| `ST-004` | Implement scenario import/export helpers with version handling | Provide the schema-aware IO contract needed by replay, imports, and exports.                  | `src/schema/scenarioSchema.ts`, `src/presets/presetRegistry.ts` | `src/schema/scenarioIO.ts`                                                                                                           | JSON export includes schema version; JSON import validates before use; same config survives round-trip without semantic change.  | Add round-trip tests and version-field tests.                                                | `M`        |

## 3. Simulation Core

### Epic: Deterministic Runtime and Behavior

| Task ID  | Title                                                          | Purpose                                                                                       | Input Files                                                                                   | Output Files                                                                                         | Acceptance Criteria                                                                                                                                                                       | Test Requirements                                                                               | Difficulty |
| -------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| `SC-001` | Implement seeded PRNG service                                  | Provide deterministic randomness for replayable swarm behavior.                               | `src/schema/scenarioTypes.ts`, SRS determinism requirements                                   | `src/sim/core/seededPrng.ts`                                                                         | Same seed yields same pseudo-random sequence; public API is small and reusable across sim systems.                                                                                        | Add unit tests for repeatability and range bounds.                                              | `S`        |
| `SC-002` | Implement fixed timestep simulation clock                      | Guarantee deterministic tick advancement regardless of frame-rate variance.                   | `src/schema/scenarioTypes.ts`, SRS M1 / FR-028 / VAL-001                                      | `src/sim/core/simulationClock.ts`                                                                    | Clock exposes fixed-step tick advancement and elapsed simulated time; default step supports guided 40-60 second pacing work later.                                                        | Add unit tests for accumulator behavior and elapsed-time calculation.                           | `S`        |
| `SC-003` | Implement phase machine and transition guards                  | Encode the SRS phase list and allowed transitions from idle to results.                       | `src/schema/scenarioTypes.ts`, SRS Section 9                                                  | `src/sim/core/phaseMachine.ts`                                                                       | Phase names and legal progression match the SRS; success and partial-failure branches both exist.                                                                                         | Add tests for legal transitions, branch behavior, and replay reset to idle.                     | `M`        |
| `SC-004` | Implement swarm aggregate initialization and tick update state | Create the normalized agent aggregate state used by localization and rendering.               | `src/sim/core/seededPrng.ts`, `src/schema/scenarioTypes.ts`, preset files                     | `src/sim/models/swarmState.ts`, `src/sim/systems/swarmUpdate.ts`                                     | Swarm initializes deterministically from seed and config; visible count drives actual agent aggregate count; agent states support queued, navigating, localizing, and interacting phases. | Add deterministic initialization tests and visible-count tests.                                 | `M`        |
| `SC-005` | Implement field steering and localization logic                | Simulate field-guided navigation and clot-zone accumulation required by FR-019 and FR-020.    | `src/sim/models/swarmState.ts`, `src/schema/scenarioTypes.ts`, SRS FR-008 to FR-017           | `src/sim/systems/fieldSteering.ts`, `src/sim/systems/localization.ts`                                | Field strength changes alignment; direction changes heading; localization ratio increases near the clot under supportive settings.                                                        | Add tests for heading change, localization response, and flow opposition effect.                | `M`        |
| `SC-006` | Implement clot burden hybrid update and outcome resolution     | Apply the SRS erosion and penetration model and decide success vs partial failure.            | `src/sim/systems/localization.ts`, `src/metrics/formulas.ts`, SRS DATA-010                    | `src/sim/systems/clotUpdate.ts`, `src/sim/systems/outcomeResolver.ts`, `src/sim/models/clotState.ts` | Clot burden never drops below 0; occlusion never exceeds bounds; success and incomplete outcomes are both reachable through preset/control combinations.                                  | Add tests for metric bounds, monotonic decrease during success, and incomplete-failure outcome. | `M`        |
| `SC-007` | Implement replay controller and scrub-state restoration        | Support deterministic replay and timeline restore behavior without mutating simulation truth. | `src/sim/core/simulationClock.ts`, `src/sim/core/phaseMachine.ts`, `src/schema/scenarioIO.ts` | `src/sim/core/replayController.ts`, `src/sim/models/scenarioRuntime.ts`                              | Replay resets to seed-consistent state; scrubbing restores the selected time index by deterministic re-simulation; camera changes do not mutate simulation state.                         | Add integration tests for replay identity and scrub restore correctness.                        | `L`        |

## 4. Rendering

### Epic: Scene, Agents, and Camera System

| Task ID  | Title                                                        | Purpose                                                                                           | Input Files                                                           | Output Files                                                                | Acceptance Criteria                                                                                                                                     | Test Requirements                                                                        | Difficulty |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- |
| `RD-001` | Bootstrap Three.js scene lifecycle                           | Create the renderer, scene, resize handling, and browser mount contract.                          | `src/main.ts`, `src/app/createAppShell.ts` or equivalent              | `src/render/scene/createScene.ts`, `src/render/scene/resizeManager.ts`      | Scene mounts into the central viewport; resize updates renderer and camera; no render-loop errors with empty placeholder content.                       | Smoke-check browser render and production build.                                         | `S`        |
| `RD-002` | Render coronary artery preset geometry and framing           | Build the simplified coronary artery segment visual defined by the SRS anatomy scope.             | `src/presets/*.json`, `src/schema/scenarioTypes.ts`                   | `src/render/anatomy/coronaryPath.ts`, `src/render/anatomy/arteryMesh.ts`    | Default artery path is visible, centered, and linked to preset geometry; mild vs straight variants are supported.                                       | Add unit tests for path generation and a manual screenshot QA note.                      | `M`        |
| `RD-003` | Render clot visual states                                    | Make the clot visually transition across compact, eroded, and reopened-channel states.            | `src/sim/models/clotState.ts`, `src/render/anatomy/arteryMesh.ts`     | `src/render/clot/clotMesh.ts`, `src/render/clot/clotMaterials.ts`           | Clot shape/appearance reflects burden and occlusion state; reopened channel becomes visible as clot burden falls.                                       | Manual QA against SRS FR-033; add a small state-mapping unit test if possible.           | `M`        |
| `RD-004` | Render instanced swarm glyphs in clean view                  | Satisfy instanced-rendering requirements with a clear, performant placeholder swarm.              | `src/sim/models/swarmState.ts`, `src/render/scene/createScene.ts`     | `src/render/swarm/swarmInstancer.ts`                                        | Visible agents render via instancing; visible count affects density; clean view glyphs are directional and readable.                                    | Manual density QA plus performance spot-check at default preset.                         | `M`        |
| `RD-005` | Render flow particles and field cues                         | Provide explanatory cues for vessel flow and external field control without dominating the scene. | `src/sim/systems/fieldSteering.ts`, `src/presets/*.json`              | `src/render/swarm/flowParticles.ts`, `src/render/swarm/fieldCues.ts`        | Flow motion and field cues are visible; field direction is readable; debris or secondary effects do not dominate visuals.                               | Manual QA against FR-034 and AT-005.                                                     | `M`        |
| `RD-006` | Implement four camera modes and fluoroscopy overlay renderer | Deliver overview, follow, clot close-up, and fluoro modes required by FR-030 and FR-031.          | `src/render/scene/createScene.ts`, `src/sim/core/replayController.ts` | `src/render/scene/cameraController.ts`, `src/render/swarm/fluoroOverlay.ts` | All four camera modes are distinct; fluoroscopy simplifies agents into bright imaging-like points or clusters; camera switches do not mutate sim state. | Add integration test for camera state immutability; manual visual QA for all four modes. | `L`        |

## 5. UI / Lab Panel

### Epic: Fixed Layout and Controls

| Task ID  | Title                                                                | Purpose                                                                                      | Input Files                                                                              | Output Files                                                                                                                                  | Acceptance Criteria                                                                                                                                                | Test Requirements                                              | Difficulty |
| -------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ---------- |
| `UI-001` | Build the fixed single-screen app shell                              | Create the six-region layout required by UI-001.                                             | `index.html`, `src/main.ts`, SRS Section 3                                               | `src/app/createAppShell.ts`, `src/styles/app.css`                                                                                             | Header, left inset, center viewport, right panel, top metrics strip, and bottom timeline exist in one screen layout on desktop.                                    | Manual layout QA on supported desktop sizes; build must pass.  | `M`        |
| `UI-002` | Implement header, metrics strip, and left heart/context inset        | Deliver app identity, preset/mode access, heart inset, artery highlight, and zoom indicator. | `src/app/createAppShell.ts`, preset registry, metric types                               | `src/ui/header/*`, `src/ui/metricsStrip/*`, `src/ui/contextInset/*`, `src/render/anatomy/heartInsetData.ts`                                   | Header exposes title, mode selector, disclaimer access, and preset selector; top metrics display all required values; left inset highlights artery and zoom state. | Manual UI QA plus a small render smoke test.                   | `M`        |
| `UI-003` | Implement right lab panel scenario, flow, and swarm sections         | Expose all Scenario, Flow, and Swarm controls from UI-002 / FR-001 to FR-017.                | `src/schema/scenarioTypes.ts`, `src/presets/presetRegistry.ts`, sim control API          | `src/ui/labPanel/scenarioSection.ts`, `src/ui/labPanel/flowSection.ts`, `src/ui/labPanel/swarmSection.ts`                                     | Controls are visible at once, update config deterministically, and reflect current values.                                                                         | Add interaction tests for control-to-config binding.           | `M`        |
| `UI-004` | Implement right lab panel field, playback, view, and export sections | Expose the remaining control groups and wire them into scene/sim/export systems.             | `src/ui/labPanel/*`, `src/render/scene/cameraController.ts`, export modules              | `src/ui/labPanel/fieldSection.ts`, `src/ui/labPanel/playbackSection.ts`, `src/ui/labPanel/viewSection.ts`, `src/ui/labPanel/exportSection.ts` | All controls required by UI-002 exist and are wired; play/pause/reset/replay/step work; view controls affect only presentation.                                    | Add interaction tests for playback commands and view toggles.  | `M`        |
| `UI-005` | Implement bottom timeline and scrubber bindings                      | Provide phase display, playback speed, guided captions, and scrubbing behavior.              | `src/sim/core/replayController.ts`, `src/ui/labPanel/playbackSection.ts`, guided modules | `src/ui/timeline/*`                                                                                                                           | Bottom strip shows phase, playback controls, speed, captions, and scrubber; paused/completed runs can scrub to a selected index.                                   | Add integration tests for step behavior and scrub restoration. | `M`        |

## 6. Metrics

### Epic: Metric Formulas and Presentation

| Task ID  | Title                                            | Purpose                                                                      | Input Files                                                   | Output Files                                                   | Acceptance Criteria                                                                                                                             | Test Requirements                                 | Difficulty |
| -------- | ------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------- |
| `MT-001` | Implement metric formulas and bound clamps       | Encode CB, LOC, COORD, SVPI, and elapsed time exactly as defined in the SRS. | `src/schema/scenarioTypes.ts`, SRS DATA-005 to DATA-009       | `src/metrics/formulas.ts`                                      | Metric formulas match SRS names and bounds; SVPI uses the required exponent form; outputs clamp safely.                                         | Add formula tests and bound tests.                | `S`        |
| `MT-002` | Implement metrics store and time-series recorder | Track current metrics and exportable history during deterministic playback.  | `src/metrics/formulas.ts`, `src/sim/core/replayController.ts` | `src/metrics/metricsStore.ts`, `src/metrics/metricsHistory.ts` | Metrics update every tick; ordered history is available for CSV export; same seed produces same metric arrays.                                  | Add deterministic-history tests across long runs. | `M`        |
| `MT-003` | Add metric tooltips and safe metric labels       | Ensure UI copy uses approved names and explanatory tooltip text.             | SRS SAFE-003 to SAFE-004, DATA-005 to DATA-009                | `src/metrics/metricTooltips.ts`, updated UI metric components  | Metrics strip and tooltips use `Simulated Vessel Patency Index (%)` and other approved copy; no banned label such as `Restored Flow %` appears. | Add copy snapshot tests or string assertions.     | `S`        |

## 7. Guided Mode / Captions

### Epic: Guided Explainer Flow

| Task ID  | Title                                                      | Purpose                                                                                   | Input Files                                                                                | Output Files                                                   | Acceptance Criteria                                                                                                   | Test Requirements                                                              | Difficulty |
| -------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| `GD-001` | Author the exact guided caption script from the SRS        | Prevent drift from CAP-001 to CAP-006 and make captions reusable.                         | `NanoSwarm_Coronary_Clot_Simulator_SRS_v2.docx`                                            | `src/guided/captionScript.ts`                                  | Script contains the exact six guided captions from the SRS in correct order and mapped to phases/beats.               | Add string-exact unit tests for caption text.                                  | `S`        |
| `GD-002` | Implement guided sequencing and presentation locks         | Tie captions, playback, camera transitions, and overlay transitions into one guided flow. | `src/guided/captionScript.ts`, `src/render/scene/cameraController.ts`, `src/ui/timeline/*` | `src/guided/guidedSequence.ts`, updated app controller modules | Guided mode runs without user input; guided presentation can lock camera/overlay controls while sequencing is active. | Add integration tests for guided phase-to-caption and phase-to-camera mapping. | `M`        |
| `GD-003` | Enforce default guided runtime and explore-mode separation | Make guided mode finish in 40-60 seconds and keep explore mode manually driven.           | `src/guided/guidedSequence.ts`, `src/sim/core/simulationClock.ts`                          | updated guided and app control modules                         | Default guided preset finishes in 40-60 simulated seconds; explore mode does not force guided camera/caption locks.   | Add duration test and mode-separation test.                                    | `M`        |
| `GD-004` | Validate caption coverage and end-to-end guided flow       | Close the validation gap for AT-004 and VAL-014.                                          | `src/guided/*`, `tests/integration/`                                                       | `tests/integration/guidedMode.test.ts` or equivalent           | Every major guided phase emits a caption; guided mode reaches results end-to-end.                                     | Run automated guided flow test plus manual QA checklist.                       | `M`        |

## 8. Exports

### Epic: Persistence and Output Artifacts

| Task ID  | Title                                                 | Purpose                                                         | Input Files                                                                    | Output Files                                | Acceptance Criteria                                                                                               | Test Requirements                                                            | Difficulty |
| -------- | ----------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- |
| `EX-001` | Implement JSON scenario export/import                 | Support schema-backed scenario persistence and replay recovery. | `src/schema/scenarioIO.ts`, `src/presets/presetRegistry.ts`                    | `src/export/exportJson.ts`                  | Exported JSON is UTF-8, versioned, and valid; imported JSON recreates the same scenario.                          | Add integration tests for export/import identity and invalid JSON rejection. | `M`        |
| `EX-002` | Implement CSV metrics export                          | Provide ordered time-series metrics output for the current run. | `src/metrics/metricsHistory.ts`                                                | `src/export/exportCsv.ts`                   | CSV includes ordered rows with time and all major metrics; encoding is UTF-8 comma-separated.                     | Add CSV shape/content tests and ordered-row assertions.                      | `S`        |
| `EX-003` | Implement PNG viewport snapshot export                | Capture the current camera view at current viewport resolution. | `src/render/scene/createScene.ts`, `src/render/scene/cameraController.ts`      | `src/export/exportPng.ts`                   | PNG reflects the active camera and overlay state and exports without altering simulation state.                   | Add a capture smoke test if feasible and manual visual verification.         | `M`        |
| `EX-004` | Add deterministic export round-trip integration tests | Prove that exports do not break determinism.                    | `src/export/*`, `src/schema/scenarioIO.ts`, `src/sim/core/replayController.ts` | `tests/integration/exportRoundTrip.test.ts` | JSON export/import preserves deterministic replay; CSV rows remain ordered; PNG export does not mutate sim state. | Run full integration suite for AT-006 coverage.                              | `M`        |

## 9. Accessibility

### Epic: Keyboard, Motion, and WCAG-Aware Controls

| Task ID  | Title                                                              | Purpose                                                              | Input Files                                                                       | Output Files                                                              | Acceptance Criteria                                                                                                                           | Test Requirements                                              | Difficulty |
| -------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------- |
| `AX-001` | Implement keyboard reachability and shortcut map                   | Meet UI-004, INT-002, and VAL-013 requirements for keyboard access.  | `src/app/createAppShell.ts`, `src/ui/labPanel/*`, `src/ui/timeline/*`             | `src/accessibility/keyboardMap.ts`, updated UI components                 | All primary controls are reachable with keyboard; play/pause/reset/replay/step and key view actions have documented shortcuts.                | Add keyboard interaction tests and manual tab-order QA.        | `M`        |
| `AX-002` | Implement pause/stop behavior and reduced-motion mode              | Satisfy UI-003 and NFR-010 for moving content control.               | `src/ui/timeline/*`, `src/render/scene/cameraController.ts`, `src/render/swarm/*` | `src/accessibility/reducedMotion.ts`, updated render and playback modules | Moving content can be paused/stopped; reduced-motion mode dampens non-essential motion while preserving simulation meaning.                   | Add tests for motion toggle state and playback pause behavior. | `M`        |
| `AX-003` | Implement focus states, target sizes, contrast, and non-color cues | Make the UI visibly operable and not color-dependent.                | `src/styles/app.css`, UI components, metric components                            | `src/accessibility/focusStates.css`, updated UI styles/components         | Focus states are visible; controls meet minimum target-size intent; critical status is not conveyed by color alone; contrast targets are met. | Manual QA checklist and targeted UI snapshot review.           | `M`        |
| `AX-004` | Add accessibility verification checklist and regression pass       | Turn accessibility into a repeatable completion gate for milestones. | SRS UI-003 to UI-006, NFR-009 to NFR-012                                          | `src/accessibility/qaChecklist.md`, `docs/accessibility-verification.md`  | Checklist covers pause/stop, keyboard reachability, focus visibility, contrast, target sizes, reduced motion, and non-color cues.             | Run checklist manually before milestone sign-off.              | `S`        |

## 10. Safety / Disclaimer Checks

### Epic: Safe Framing and Copy Audit

| Task ID  | Title                                                          | Purpose                                                                            | Input Files                                                                    | Output Files                                                            | Acceptance Criteria                                                                                                                               | Test Requirements                                                         | Difficulty |
| -------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------- |
| `SF-001` | Centralize disclaimer text and banned-copy rules               | Prevent drift from SAFE-001 to SAFE-004 and give Codex one source for safety text. | `NanoSwarm_Coronary_Clot_Simulator_SRS_v2.docx`                                | `src/safety/disclaimerText.ts`, `src/safety/bannedCopy.ts`              | Mandatory disclaimer text matches the SRS exactly; banned words/phrases are listed in code or audit config; approved metric label is centralized. | Add unit tests for exact disclaimer string and banned-copy list presence. | `S`        |
| `SF-002` | Apply disclaimer surfaces across onboarding, help, and exports | Satisfy SAFE-001 placement requirements without ad hoc copy duplication.           | `src/safety/disclaimerText.ts`, `src/export/exportPng.ts`, UI shell modules    | updated `src/ui/header/*`, `src/ui/common/*`, `src/export/exportPng.ts` | Disclaimer appears in onboarding, help/info access, and export footer/info surface where applicable.                                              | Manual QA for each surface and a string assertion test where possible.    | `M`        |
| `SF-003` | Add safe-label and banned-copy audit checks                    | Catch unsafe wording in UI labels, exports, and metric names before release.       | `src/safety/bannedCopy.ts`, `src/metrics/metricTooltips.ts`, UI/export modules | `src/safety/safetyAudit.ts`, `tests/integration/safetyCopy.test.ts`     | No banned wording appears in shipped UI/export strings; `Simulated Vessel Patency Index (%)` is used consistently.                                | Add string-scan integration test and final copy audit checklist.          | `M`        |

## Dependency Summary by Category

Use these dependency rules if tasks are assigned individually to Codex:

- `Schema / Types` depends on `Repo Scaffold`.
- `Simulation Core` depends on `Schema / Types`.
- `Metrics` depends on `Simulation Core`.
- `Rendering` depends on `Schema / Types` and the deterministic time/state contracts from `Simulation Core`.
- `UI / Lab Panel` depends on `Rendering`, `Simulation Core`, and `Metrics`.
- `Guided Mode / Captions` depends on `UI / Lab Panel`, `Rendering`, and `Simulation Core`.
- `Exports` depends on `Schema / Types`, `Metrics`, `Rendering`, and `Guided Mode / Captions` for final output behavior.
- `Accessibility` depends on the UI shell being present.
- `Safety / Disclaimer Checks` should start early for central text definitions, then finish after UI and export surfaces exist.

## Recommended Milestone Exit Checklist

- `M1`: Deterministic tests pass for same-seed replay and schema round-trip.
- `M2`: Scene renders default preset with artery, clot, swarm, and all four cameras.
- `M3`: Metrics remain bounded and at least one success plus one partial-failure preset work.
- `M4`: Guided run completes in 40-60 seconds with full captions, timeline, keyboard support, and reduced motion.
- `M5`: JSON, CSV, and PNG exports work; disclaimer and banned-copy audit pass; build succeeds.

## Open Review Items That Do Not Block the Backlog

- Reference desktop definition for performance validation
- Final color palette and visual tone
- Final swarm glyph style: chevron vs rounded capsule
- Exact coronary preset curve variants beyond the default two built-in presets
- Whether deterministic scrubbing should stay re-simulation based or add optional snapshot caching later

# NanoSwarm Coronary Clot Simulator - Accessibility Verification

Audit date: `2026-04-18`

## Purpose

This document is the human-readable regression-pass companion to `src/accessibility/qaChecklist.md`. Use it before milestone sign-off to confirm the current browser app still satisfies the implemented accessibility baseline from `AX-001`, `AX-002`, and `AX-003`.

## Verified Scope

- Keyboard reachability for playback, replay, reset, step, disclaimer access, and explore-mode presentation controls
- Visible focus states on the primary interactive controls
- Pause or stop control for moving content
- Reduced-motion behavior that preserves simulation meaning
- Non-color status cues for phase, camera, overlay, metrics, and viewport annotations
- Target-size comfort intent for primary controls
- Contrast reminders for current text, border, and focus treatments
- Responsive fallback re-check expectations

## Automated Coverage Already Present

- Keyboard shortcut and keyboard-flow coverage: `tests/integration/keyboardAccess.test.ts`
- Focus-state and non-color cue styling coverage: `tests/unit/focusStates.test.ts`
- Accessibility hook presence in the rendered app shell: `tests/integration/accessibilityVisuals.test.ts`
- Guided and playback regression coverage that supports moving-content verification: `tests/integration/guidedMode.test.ts`

## Manual Regression Pass

### 1. Keyboard Reachability

- Walk the interface with keyboard only and confirm the header controls, lab controls, timeline controls, and disclaimer modal are reachable in a logical order.
- Verify `Space`, `S` or `Right Arrow`, `R`, `Home`, `D`, `Escape`, and explore-only `1` to `4` plus `F` behave as documented.
- Verify shortcuts do not fire while focus is inside form controls.

### 2. Focus Visibility

- Confirm the explicit focus ring is visible on buttons, selects, numeric inputs, toggle rows, sliders, the timeline scrubber, and modal buttons.
- Confirm the ring remains readable on dark panels and inside the modal backdrop.

### 3. Moving Content and Reduced Motion

- Start playback, pause it, single-step it, replay it, and reset it without pointer input.
- Toggle reduced-motion mode and verify the camera and ambient motion reduce while simulation truth, phase progression, and metric meaning remain intact.

### 4. Non-Color Status Cues

- Confirm the viewport badges show phase, camera, and overlay state with text markers, not color only.
- Confirm the injection, clot, and field viewport annotations remain understandable without relying on color.
- Confirm metric cards and outcome states expose textual or badge-based cues beyond hue.

### 5. Target Size and Contrast

- Confirm the primary buttons, select controls, toggles, slider controls, and modal buttons remain comfortable to target at supported desktop widths.
- Re-check text legibility, border visibility, focus rings, and disabled states after any palette or panel-opacity change.

### 6. Responsive Fallback

- Re-check the responsive fallback layout after layout or panel changes.
- Confirm keyboard access, visible focus, and non-color status cues remain intact in the narrower layout.

## Current Verification Status

- Automated accessibility-related tests are present and expected to run in the standard `npm test` suite.
- The accessibility checklist is now specific enough to serve as a milestone sign-off gate for the current app shell.
- No simulator runtime behavior changes are required for this AX-004 completion pass.

## Release Gate

Before release or milestone sign-off:

1. Run `npm test`.
2. Run `npm run build`.
3. Run `npm run lint`.
4. Run the checklist in `src/accessibility/qaChecklist.md`.
5. Update this document if accessibility behavior, shortcuts, layout, or styling changes.

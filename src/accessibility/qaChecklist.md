# Accessibility QA Checklist

Use this checklist before milestone sign-off or release packaging. Record `Pass`, `Needs Follow-Up`, or `N/A` for each item.

## Keyboard Reachability

- Confirm `Tab` and `Shift+Tab` reach the header controls, lab panel controls, timeline controls, and disclaimer modal actions in a logical order.
- Confirm primary playback controls are keyboard operable without pointer use:
  - `Space` play or pause
  - `S` or `Right Arrow` step
  - `R` replay
  - `Home` reset
- Confirm explore-mode presentation controls remain keyboard reachable:
  - `1` to `4` camera selection
  - `F` overlay toggle
- Confirm help and disclosure actions remain keyboard reachable:
  - `D` opens disclaimer or help
  - `Escape` closes the disclaimer modal
- Confirm shortcuts do not fire while focus is inside a text, number, select, or range control.

## Focus Visibility

- Confirm keyboard focus is visibly apparent on primary buttons, select controls, number inputs, toggle rows, range sliders, the timeline scrubber, and modal buttons.
- Confirm the focus ring remains visible against dark panel backgrounds, the viewport panel, and modal surfaces.
- Confirm no primary interactive control relies on browser-default focus that becomes hard to see against the current palette.

## Motion Control

- Confirm moving content can be paused using the UI and the `Space` shortcut.
- Confirm replay, reset, and step remain available while playback is paused.
- Confirm reduced-motion mode can be toggled without breaking simulation meaning.
- Confirm reduced-motion mode dampens non-essential camera or particle motion instead of removing essential state cues.

## Non-Color Status Cues

- Confirm viewport status badges include non-color identifiers for phase, camera, and overlay state.
- Confirm contextual annotations for injection, clot, and field cues remain understandable without color alone.
- Confirm metric cards expose text cues or labels in addition to colored styling.
- Confirm success and partial-failure states include text or badge differences, not only hue changes.

## Target Size Comfort

- Confirm key controls follow the 44px minimum target-size intent:
  - header buttons
  - playback buttons
  - select controls
  - toggle rows
  - timeline scrubber thumb area
  - modal action buttons
- Confirm no small target becomes difficult to activate at common desktop widths or the responsive fallback layout.

## Contrast Review

- Confirm primary text remains legible against all panel backgrounds.
- Confirm borders, focus rings, and disabled states remain visually distinguishable.
- Re-run a visual contrast pass if palette, typography, or panel opacity changes.

## Responsive Re-Check

- Confirm the single-screen desktop layout remains operable at the supported desktop widths.
- Confirm the responsive fallback layout still preserves keyboard reachability, visible focus, target-size comfort, and readable status cues.

## Regression Sign-Off

- Run `npm test`.
- Run `npm run build`.
- Run `npm run lint`.
- Review `docs/accessibility-verification.md` and update the audit date and notes if behavior changed.

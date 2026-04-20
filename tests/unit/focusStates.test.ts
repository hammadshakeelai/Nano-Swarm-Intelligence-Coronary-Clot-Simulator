import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const focusStatesCss = readFileSync(
  "C:\\Users\\HP\\Documents\\GitHub\\Nano Swarm Intelligence Coronary Clot Simulator\\src\\accessibility\\focusStates.css",
  "utf8",
);

describe("focus state styles", () => {
  it("defines visible focus treatment for primary interactive controls", () => {
    expect(focusStatesCss).toContain(".ghost-button:focus-visible");
    expect(focusStatesCss).toContain(".action-button:focus-visible");
    expect(focusStatesCss).toContain(".toggle-row:focus-within");
    expect(focusStatesCss).toContain("#timeline-scrubber:focus-visible");
    expect(focusStatesCss).toContain("outline: 3px solid var(--focus-ring-color);");
  });

  it("encodes target-size intent and contrast-aware control borders", () => {
    expect(focusStatesCss).toContain("min-height: 44px;");
    expect(focusStatesCss).toContain(".select-control select,");
    expect(focusStatesCss).toContain(".number-input,");
    expect(focusStatesCss).toContain("border-color: var(--contrast-line);");
  });

  it("adds non-color status cues for badges, annotations, and outcomes", () => {
    expect(focusStatesCss).toContain('.hud-badge[data-badge-kind="phase"]::before');
    expect(focusStatesCss).toContain('.annotation[data-status-cue="clot"]::before');
    expect(focusStatesCss).toContain('[data-status-tone="success"]::after');
    expect(focusStatesCss).toContain('[data-status-tone="alert"]::after');
  });
});

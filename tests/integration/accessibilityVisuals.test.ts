import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildMetricsStripMarkup } from "../../src/ui/metricsStrip";

const styleCss = readFileSync(
  "C:\\Users\\HP\\Documents\\GitHub\\Nano Swarm Intelligence Coronary Clot Simulator\\src\\style.css",
  "utf8",
);
const appSource = readFileSync(
  "C:\\Users\\HP\\Documents\\GitHub\\Nano Swarm Intelligence Coronary Clot Simulator\\src\\app\\simulatorApp.ts",
  "utf8",
);

describe("accessibility visuals integration", () => {
  it("keeps the dedicated focus-state layer wired into the main stylesheet", () => {
    expect(styleCss).toContain('@import "./accessibility/focusStates.css";');
  });

  it("keeps primary control hooks and status badges present in the app shell", () => {
    expect(appSource).toContain('class="action-button"');
    expect(appSource).toContain('class="ghost-button"');
    expect(appSource).toContain('class="select-input"');
    expect(appSource).toContain('class="toggle-input"');
    expect(appSource).toContain('class="range-input"');
    expect(appSource).toContain('data-badge-kind="phase"');
    expect(appSource).toContain('data-badge-kind="camera"');
    expect(appSource).toContain('data-badge-kind="overlay"');
    expect(appSource).toContain('data-status-cue="injection"');
    expect(appSource).toContain('data-status-cue="clot"');
    expect(appSource).toContain("getPhaseTone(");
  });

  it("renders non-color metric cues in the metrics strip markup", () => {
    const markup = buildMetricsStripMarkup();

    expect(markup).toContain('data-status-cue="Clot"');
    expect(markup).toContain('data-status-cue="Patency"');
    expect(markup).toContain('data-status-cue="Locate"');
    expect(markup).toContain('data-status-cue="Coord"');
    expect(markup).toContain('data-status-cue="Time"');
  });
});

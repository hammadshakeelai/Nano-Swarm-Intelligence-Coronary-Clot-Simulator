import { describe, expect, it } from "vitest";

import { buildMetricsStripMarkup } from "../../src/ui/metricsStrip";

describe("metric label rendering", () => {
  it("renders approved metric labels consistently", () => {
    const markup = buildMetricsStripMarkup();

    expect(markup).toContain("Clot Burden (%)");
    expect(markup).toContain("Simulated Vessel Patency Index (%)");
    expect(markup).toContain("Localization (%)");
    expect(markup).toContain("Coordination Score");
    expect(markup).toContain("Elapsed Sim Time");
  });

  it("does not render banned shorthand labels in the visible strip", () => {
    const markup = buildMetricsStripMarkup();

    expect(markup).not.toContain(">SVPI<");
    expect(markup).not.toContain("Restored Flow %");
  });
});

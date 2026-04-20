import { describe, expect, it } from "vitest";

import {
  METRIC_LABELS,
  METRICS_STRIP_DEFINITIONS,
  METRIC_TOOLTIPS,
  PRIMARY_METRIC_LABEL,
} from "../../src/metrics/metricTooltips";

describe("metric tooltips", () => {
  it("includes the approved primary metric label", () => {
    expect(PRIMARY_METRIC_LABEL).toBe("Simulated Vessel Patency Index (%)");
    expect(METRIC_LABELS.svpiPct).toBe("Simulated Vessel Patency Index (%)");
  });

  it("provides tooltip text for all visible primary metrics", () => {
    for (const definition of METRICS_STRIP_DEFINITIONS) {
      expect(definition.tooltip).toBe(METRIC_TOOLTIPS[definition.id]);
      expect(definition.tooltip.length).toBeGreaterThan(10);
    }
  });

  it("does not use SVPI shorthand in visible metric labels", () => {
    const visibleLabels = METRICS_STRIP_DEFINITIONS.map(
      (definition) => definition.label,
    );

    expect(visibleLabels).not.toContain("SVPI");
    expect(visibleLabels).not.toContain("Restored Flow %");
  });
});

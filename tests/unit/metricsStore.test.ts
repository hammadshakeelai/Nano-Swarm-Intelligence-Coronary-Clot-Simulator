import { describe, expect, it } from "vitest";

import type { MetricsRecord } from "../../src/metrics/formulas";
import {
  createMetricsStore,
  readCurrentMetrics,
  updateMetricsStore,
} from "../../src/metrics/metricsStore";

const INITIAL_METRICS: MetricsRecord = {
  timeSec: 0,
  phase: "idle",
  clotBurdenPct: 100,
  svpiPct: 0,
  localizationPct: 0,
  coordinationScore: 0,
};

describe("metrics store", () => {
  it("tracks the current metric values explicitly", () => {
    const store = createMetricsStore(INITIAL_METRICS);
    const updated = updateMetricsStore(store, {
      ...INITIAL_METRICS,
      timeSec: 12,
      phase: "navigation",
      clotBurdenPct: 84.2,
      svpiPct: 19.4,
      localizationPct: 52.1,
      coordinationScore: 0.71,
    });

    expect(readCurrentMetrics(updated)).toEqual({
      timeSec: 12,
      phase: "navigation",
      clotBurdenPct: 84.2,
      svpiPct: 19.4,
      localizationPct: 52.1,
      coordinationScore: 0.71,
    });
    expect(readCurrentMetrics(store)).toEqual(INITIAL_METRICS);
  });
});

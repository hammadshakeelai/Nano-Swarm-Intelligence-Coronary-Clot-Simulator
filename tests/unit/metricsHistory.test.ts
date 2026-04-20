import { describe, expect, it } from "vitest";

import {
  appendMetricsHistory,
  createMetricsHistory,
  createMetricsHistoryEntry,
  readMetricsHistory,
} from "../../src/metrics/metricsHistory";

describe("metrics history", () => {
  it("appends records in deterministic tick order", () => {
    let history = createMetricsHistory();
    history = appendMetricsHistory(
      history,
      createMetricsHistoryEntry(0, {
        timeSec: 0,
        phase: "idle",
        clotBurdenPct: 100,
        svpiPct: 0,
        localizationPct: 0,
        coordinationScore: 0,
      }),
    );
    history = appendMetricsHistory(
      history,
      createMetricsHistoryEntry(1, {
        timeSec: 1 / 30,
        phase: "context_intro",
        clotBurdenPct: 100,
        svpiPct: 0,
        localizationPct: 0,
        coordinationScore: 0,
      }),
    );

    const entries = readMetricsHistory(history);
    expect(entries.map((entry) => entry.tick)).toEqual([0, 1]);
    expect(entries.map((entry) => entry.phase)).toEqual([
      "idle",
      "context_intro",
    ]);
    expect(entries.map((entry) => entry.timeSec)).toEqual([0, 1 / 30]);
  });
});

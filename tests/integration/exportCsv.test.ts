import { describe, expect, it } from "vitest";

import { exportMetricsHistoryCsv } from "../../src/export/exportCsv";
import { ReplayController, coronaryDefaultPreset } from "../../src/sim";

describe("CSV export integration", () => {
  it("preserves metrics-history row order exactly", () => {
    const replayController = new ReplayController(coronaryDefaultPreset);

    for (let step = 0; step < 12; step += 1) {
      replayController.step();
    }

    const history = replayController.getMetricsHistory();
    const csv = exportMetricsHistoryCsv(history);
    const rows = csv.split("\n");

    expect(rows[0]).toBe(
      "tick,timeSec,phase,clotBurdenPct,svpiPct,localizationPct,coordinationScore",
    );
    expect(rows).toHaveLength(history.length + 1);

    history.forEach((entry, index) => {
      expect(rows[index + 1]).toBe(
        [
          entry.tick,
          entry.timeSec.toFixed(3),
          entry.phase,
          entry.clotBurdenPct.toFixed(3),
          entry.svpiPct.toFixed(3),
          entry.localizationPct.toFixed(3),
          entry.coordinationScore.toFixed(3),
        ].join(","),
      );
    });
  });

  it("produces identical CSV for deterministic runs with the same seed", () => {
    const first = new ReplayController(coronaryDefaultPreset);
    const second = new ReplayController(coronaryDefaultPreset);

    for (let step = 0; step < 24; step += 1) {
      first.step();
      second.step();
    }

    expect(exportMetricsHistoryCsv(first.getMetricsHistory())).toBe(
      exportMetricsHistoryCsv(second.getMetricsHistory()),
    );
  });
});

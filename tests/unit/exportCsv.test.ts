import { describe, expect, it } from "vitest";

import {
  METRICS_CSV_HEADER_COLUMNS,
  createMetricsHistoryCsvBlob,
  exportMetricsHistoryCsv,
} from "../../src/export/exportCsv";
import {
  createMetricsHistory,
  createMetricsHistoryEntry,
} from "../../src/metrics/metricsHistory";

describe("CSV metrics export", () => {
  it("includes the required header columns", () => {
    const csv = exportMetricsHistoryCsv(createMetricsHistory());

    expect(csv.split("\n")[0]).toBe(METRICS_CSV_HEADER_COLUMNS.join(","));
  });

  it("formats rows as comma-separated UTF-8 friendly output", async () => {
    const history = createMetricsHistory([
      createMetricsHistoryEntry(3, {
        timeSec: 3.25,
        phase: "navigation",
        clotBurdenPct: 64.4,
        svpiPct: 29.5,
        localizationPct: 47.2,
        coordinationScore: 0.62,
      }),
    ]);

    const csv = exportMetricsHistoryCsv(history);
    const blob = createMetricsHistoryCsvBlob(history);

    expect(csv).toContain(
      "3,3.250,navigation,64.400,29.500,47.200,0.620",
    );
    expect(blob.type).toBe("text/csv;charset=utf-8");
    await expect(blob.text()).resolves.toBe(csv);
  });

  it("handles empty history cleanly", () => {
    expect(exportMetricsHistoryCsv([])).toBe(METRICS_CSV_HEADER_COLUMNS.join(","));
  });
});

import { describe, expect, it } from "vitest";

import { PRIMARY_METRIC_LABEL } from "../../src/metrics/metricTooltips";
import {
  createSafetyAuditReport,
  getCentralizedSafetyAuditEntries,
} from "../../src/safety/safetyAudit";

describe("safety copy audit", () => {
  it("detects banned phrases if unsafe wording is introduced", () => {
    const report = createSafetyAuditReport([
      ...getCentralizedSafetyAuditEntries(),
      {
        label: "unsafe-example",
        text: "This clinical simulator proves it predicts outcome and treats disease.",
      },
    ]);

    expect(report.findings.map((finding) => finding.bannedPhrase)).toEqual(
      expect.arrayContaining([
        "clinical simulator",
        "proves",
        "predicts outcome",
        "treats",
      ]),
    );
  });

  it("verifies the approved primary metric label is present and exact", () => {
    const report = createSafetyAuditReport(getCentralizedSafetyAuditEntries());

    expect(report.approvedPrimaryMetricLabel).toBe(
      "Simulated Vessel Patency Index (%)",
    );
    expect(report.approvedPrimaryMetricLabel).toBe(PRIMARY_METRIC_LABEL);
    expect(report.approvedPrimaryMetricLabelPresent).toBe(true);
  });

  it("passes the safety audit for centralized shipped UI and export copy", () => {
    const entries = getCentralizedSafetyAuditEntries();
    const report = createSafetyAuditReport(entries);

    expect(entries.map((entry) => entry.label)).toEqual(
      expect.arrayContaining([
        "onboarding-disclaimer:text",
        "help-disclaimer:text",
        "export-png-footer:disclaimer",
        "metric-label:svpiPct",
        "metric-tooltip:svpiPct",
        "keyboard:hint",
        "guided-caption:results",
      ]),
    );
    expect(report.findings).toEqual([]);
    expect(report.approvedPrimaryMetricLabelPresent).toBe(true);
    expect(report.auditedEntryCount).toBe(entries.length);
  });
});

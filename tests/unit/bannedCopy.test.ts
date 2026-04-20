import { describe, expect, it } from "vitest";

import {
  BANNED_WORDING,
  PRIMARY_METRIC_LABEL,
  PRIMARY_METRIC_TOOLTIP,
} from "../../src/safety/bannedCopy";
import {
  PRIMARY_METRIC_LABEL as METRIC_PRIMARY_LABEL,
  PRIMARY_METRIC_TOOLTIP as METRIC_PRIMARY_TOOLTIP,
} from "../../src/metrics/metricTooltips";

describe("banned safety copy", () => {
  it("centralizes the required banned wording list", () => {
    expect(BANNED_WORDING).toEqual(
      expect.arrayContaining([
        "proves",
        "treats",
        "predict outcome",
        "predicts outcome",
        "outcome prediction",
        "surgery replacement",
        "clinical simulator",
        "diagnostic",
        "patient-specific",
        "real blood flow restored",
        "restored flow %",
      ]),
    );
  });

  it("keeps the banned wording list unique to avoid drift", () => {
    expect(new Set(BANNED_WORDING).size).toBe(BANNED_WORDING.length);
  });

  it("re-exports the approved primary metric label and tooltip", () => {
    expect(PRIMARY_METRIC_LABEL).toBe("Simulated Vessel Patency Index (%)");
    expect(PRIMARY_METRIC_LABEL).toBe(METRIC_PRIMARY_LABEL);
    expect(PRIMARY_METRIC_TOOLTIP).toBe(METRIC_PRIMARY_TOOLTIP);
  });
});

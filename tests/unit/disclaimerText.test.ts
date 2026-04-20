import { describe, expect, it } from "vitest";

import {
  DISCLAIMER_TITLE,
  MANDATORY_DISCLAIMER_TEXT,
} from "../../src/safety/disclaimerText";

describe("disclaimer text", () => {
  it("exports the exact centralized disclaimer title and text", () => {
    expect(DISCLAIMER_TITLE).toBe("Educational Disclaimer");
    expect(MANDATORY_DISCLAIMER_TEXT).toBe(
      "This simulator is an educational visualization inspired by preclinical microrobot research. It is not a medical device and must not be used for diagnosis, treatment planning, patient risk estimation, or procedural guidance. All motion, metrics, and scores are simplified, non-patient-specific, and intended only to illustrate scientific concepts.",
    );
  });

  it("keeps the required educational and non-clinical framing", () => {
    expect(MANDATORY_DISCLAIMER_TEXT).toContain("educational visualization");
    expect(MANDATORY_DISCLAIMER_TEXT).toContain("not a medical device");
    expect(MANDATORY_DISCLAIMER_TEXT).toContain("diagnosis");
    expect(MANDATORY_DISCLAIMER_TEXT).toContain("treatment planning");
    expect(MANDATORY_DISCLAIMER_TEXT).toContain("procedural guidance");
    expect(MANDATORY_DISCLAIMER_TEXT).toContain("non-patient-specific");
  });
});

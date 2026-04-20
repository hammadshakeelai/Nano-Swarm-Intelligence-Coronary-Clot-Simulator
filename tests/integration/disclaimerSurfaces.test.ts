import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { CENTRALIZED_DISCLAIMER_COPY } from "../../src/safety/disclaimerText";

const appSource = readFileSync(
  "C:\\Users\\HP\\Documents\\GitHub\\Nano Swarm Intelligence Coronary Clot Simulator\\src\\app\\simulatorApp.ts",
  "utf8",
);

const exportPngSource = readFileSync(
  "C:\\Users\\HP\\Documents\\GitHub\\Nano Swarm Intelligence Coronary Clot Simulator\\src\\export\\exportPng.ts",
  "utf8",
);

describe("disclaimer surfaces", () => {
  it("keeps onboarding and help surfaces wired to the centralized disclaimer source", () => {
    expect(appSource).toContain('import {\n  CENTRALIZED_DISCLAIMER_COPY,\n} from "../safety/disclaimerText";');
    expect(appSource).toContain('id="disclaimer-button"');
    expect(appSource).toContain('id="disclaimer-title">${CENTRALIZED_DISCLAIMER_COPY.title}');
    expect(appSource).toContain("${CENTRALIZED_DISCLAIMER_COPY.text}");
    expect(appSource).toContain("ONBOARDING_DISCLAIMER_KEY");
    expect(appSource).toContain("openDisclaimer();");
  });

  it("keeps the PNG export surface wired to the centralized disclaimer source", () => {
    expect(exportPngSource).toContain(
      'import { CENTRALIZED_DISCLAIMER_COPY } from "../safety/disclaimerText";',
    );
    expect(exportPngSource).toContain(
      "disclaimerText: string = CENTRALIZED_DISCLAIMER_COPY.text",
    );
    expect(exportPngSource).toContain(
      "options.disclaimerText ?? CENTRALIZED_DISCLAIMER_COPY.text",
    );
  });

  it("preserves the exact centralized disclaimer text for all surfaces", () => {
    expect(CENTRALIZED_DISCLAIMER_COPY.title).toBe("Educational Disclaimer");
    expect(CENTRALIZED_DISCLAIMER_COPY.text).toBe(
      "This simulator is an educational visualization inspired by preclinical microrobot research. It is not a medical device and must not be used for diagnosis, treatment planning, patient risk estimation, or procedural guidance. All motion, metrics, and scores are simplified, non-patient-specific, and intended only to illustrate scientific concepts.",
    );
  });
});

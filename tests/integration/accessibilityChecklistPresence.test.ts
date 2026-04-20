import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const qaChecklist = readFileSync(
  "C:\\Users\\HP\\Documents\\GitHub\\Nano Swarm Intelligence Coronary Clot Simulator\\src\\accessibility\\qaChecklist.md",
  "utf8",
);

const verificationDoc = readFileSync(
  "C:\\Users\\HP\\Documents\\GitHub\\Nano Swarm Intelligence Coronary Clot Simulator\\docs\\accessibility-verification.md",
  "utf8",
);

describe("accessibility verification documentation", () => {
  it("keeps the checklist sections needed for milestone sign-off", () => {
    expect(qaChecklist).toContain("## Keyboard Reachability");
    expect(qaChecklist).toContain("## Focus Visibility");
    expect(qaChecklist).toContain("## Motion Control");
    expect(qaChecklist).toContain("## Non-Color Status Cues");
    expect(qaChecklist).toContain("## Target Size Comfort");
    expect(qaChecklist).toContain("## Contrast Review");
    expect(qaChecklist).toContain("## Responsive Re-Check");
    expect(qaChecklist).toContain("## Regression Sign-Off");
  });

  it("keeps the regression document aligned to the checklist scope", () => {
    expect(verificationDoc).toContain("## Verified Scope");
    expect(verificationDoc).toContain("## Automated Coverage Already Present");
    expect(verificationDoc).toContain("## Manual Regression Pass");
    expect(verificationDoc).toContain("## Current Verification Status");
    expect(verificationDoc).toContain("## Release Gate");
    expect(verificationDoc).toContain("keyboard");
    expect(verificationDoc).toContain("reduced-motion");
    expect(verificationDoc).toContain("non-color");
  });
});

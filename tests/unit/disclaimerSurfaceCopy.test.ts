import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  "C:\\Users\\HP\\Documents\\GitHub\\Nano Swarm Intelligence Coronary Clot Simulator\\src\\app\\simulatorApp.ts",
  "utf8",
);

const exportPngSource = readFileSync(
  "C:\\Users\\HP\\Documents\\GitHub\\Nano Swarm Intelligence Coronary Clot Simulator\\src\\export\\exportPng.ts",
  "utf8",
);

describe("disclaimer surface copy usage", () => {
  it("does not inline the full disclaimer copy inside simulatorApp", () => {
    expect(appSource).not.toContain(
      "This simulator is an educational visualization inspired by preclinical microrobot research.",
    );
  });

  it("does not inline the full disclaimer copy inside exportPng", () => {
    expect(exportPngSource).not.toContain(
      "This simulator is an educational visualization inspired by preclinical microrobot research.",
    );
  });
});

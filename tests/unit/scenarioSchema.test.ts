import { afterEach, describe, expect, it, vi } from "vitest";

import { validateScenarioConfig } from "../../src/schema/scenarioSchema";
import { coronaryDefaultPreset } from "../../src/sim";

describe("scenarioSchema", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a valid scenario config", () => {
    const result = validateScenarioConfig(coronaryDefaultPreset);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.config?.scenarioId).toBe(coronaryDefaultPreset.scenarioId);
  });

  it("fails when a required root field is missing", () => {
    const invalidConfig = { ...coronaryDefaultPreset };
    delete (invalidConfig as Partial<typeof coronaryDefaultPreset>).clot;

    const result = validateScenarioConfig(invalidConfig);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      level: "error",
      path: "clot",
      message: "Missing clot object.",
    });
  });

  it("fails when an enum field is invalid", () => {
    const invalidConfig = {
      ...coronaryDefaultPreset,
      view: {
        ...coronaryDefaultPreset.view,
        camera: "sideways",
      },
    };

    const result = validateScenarioConfig(invalidConfig);

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.path === "view.camera")).toBe(
      true,
    );
  });

  it("fails when seed is structurally invalid", () => {
    const invalidConfig = {
      ...coronaryDefaultPreset,
      seed: "bad-seed",
    };

    const result = validateScenarioConfig(invalidConfig);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      level: "error",
      path: "seed",
      message: "Expected a finite number.",
    });
  });

  it("tolerates unknown root fields and emits a warning when requested", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const configWithUnknownField = {
      ...coronaryDefaultPreset,
      extraRootField: "ignored",
    };

    const result = validateScenarioConfig(configWithUnknownField, {
      warnOnUnknownRootFields: true,
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toContainEqual({
      level: "warning",
      path: "extraRootField",
      message: "Unknown root field will be ignored.",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "[ScenarioConfig] Unknown root fields ignored: extraRootField.",
    );
  });
});

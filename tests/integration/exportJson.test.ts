import { describe, expect, it } from "vitest";

import {
  ScenarioIOError,
  exportScenarioJson,
  importScenarioJson,
} from "../../src/export/exportJson";
import { coronaryDefaultPreset } from "../../src/sim";

describe("JSON export/import layer", () => {
  it("exports versioned valid UTF-8 JSON", () => {
    const payload = exportScenarioJson(coronaryDefaultPreset);
    const parsed = JSON.parse(payload) as { version?: string; scenarioId?: string };

    expect(typeof payload).toBe("string");
    expect(parsed.version).toBe("2.0");
    expect(parsed.scenarioId).toBe(coronaryDefaultPreset.scenarioId);
  });

  it("imports a valid scenario successfully", () => {
    const payload = exportScenarioJson(coronaryDefaultPreset);

    expect(importScenarioJson(payload)).toEqual(coronaryDefaultPreset);
  });

  it("fails cleanly on invalid JSON input", () => {
    expect(() => importScenarioJson("{not-valid-json")).toThrowError(
      ScenarioIOError,
    );
    expect(() => importScenarioJson("{not-valid-json")).toThrow(
      "Scenario JSON could not be parsed. Ensure the file is valid UTF-8 JSON.",
    );
  });
});

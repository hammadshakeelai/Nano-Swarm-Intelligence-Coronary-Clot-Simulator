import { describe, expect, it } from "vitest";

import {
  coronaryPresets,
  getDefaultPreset,
  getPresetDefinition,
  listPresets,
  loadPresetById,
} from "../../src/presets/presetRegistry";

describe("presetRegistry", () => {
  it("lists the built-in preset definitions", () => {
    const presets = listPresets();

    expect(presets).toHaveLength(2);
    expect(presets).toBe(coronaryPresets);
    expect(presets.map((preset) => preset.id)).toEqual([
      "lad_basic",
      "lad_partial",
    ]);
  });

  it("returns the default preset definition", () => {
    const preset = getDefaultPreset();

    expect(preset.id).toBe("lad_basic");
    expect(preset.expectedOutcome).toBe("success");
    expect(preset.config.vessel.curveVariant).toBe("mild");
  });

  it("loads presets by id deterministically and returns clones", () => {
    const first = loadPresetById("lad_partial");
    const second = loadPresetById("lad_partial");

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(getPresetDefinition("lad_partial").expectedOutcome).toBe(
      "partial_failure",
    );
  });

  it("keeps preset ids unique", () => {
    const ids = coronaryPresets.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

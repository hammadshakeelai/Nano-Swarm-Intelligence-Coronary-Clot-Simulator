import { describe, expect, it } from "vitest";

import { validateScenarioConfig } from "../../src/schema/scenarioSchema";
import {
  coronaryPresets,
  loadPresetById,
} from "../../src/presets/presetRegistry";

describe("preset validation", () => {
  it("validates every built-in preset against the shared schema", () => {
    for (const preset of coronaryPresets) {
      const result = validateScenarioConfig(preset.config);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.config?.vessel.preset).toBe(preset.id);
    }
  });

  it("keeps the default preset tuned as the success-oriented mild curve case", () => {
    const preset = loadPresetById("lad_basic");

    expect(preset.vessel.curveVariant).toBe("mild");
    expect(preset.scenarioId).toBe("coronary_default_success");
  });

  it("keeps the partial preset tuned as the incomplete-clearance case", () => {
    const preset = loadPresetById("lad_partial");

    expect(preset.vessel.curveVariant).toBe("straight");
    expect(preset.scenarioId).toBe("coronary_partial_failure");
    expect(preset.swarm.effectiveSwarmFactor).toBeLessThan(0.5);
  });
});

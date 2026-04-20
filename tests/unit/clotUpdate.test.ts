import { describe, expect, it } from "vitest";

import type { SwarmState } from "../../src/schema/scenarioTypes";
import { coronaryDefaultPreset } from "../../src/sim";
import { SeededRng } from "../../src/sim/prng";
import {
  createClotState,
  updateClotState,
} from "../../src/sim/systems/clotUpdate";

function createSwarmSummary(
  localizationRatio: number,
  coordinationScore: number,
): Pick<SwarmState, "localizationRatio" | "coordinationScore"> {
  return {
    localizationRatio,
    coordinationScore,
  };
}

describe("clot update", () => {
  it("never drops clot burden below zero", () => {
    let clot = createClotState(coronaryDefaultPreset);
    const supportiveConfig = {
      ...coronaryDefaultPreset,
      clot: {
        ...coronaryDefaultPreset.clot,
        size: 0.2,
      },
      field: {
        ...coronaryDefaultPreset.field,
        strength: 1,
        localizationAssist: 1,
        corkscrewIntensity: 1,
      },
      swarm: {
        ...coronaryDefaultPreset.swarm,
        effectiveSwarmFactor: 1,
        coordinationGain: 1,
      },
    };
    const rng = new SeededRng(11);

    for (let index = 0; index < 5000; index += 1) {
      clot = updateClotState(clot, {
        config: supportiveConfig,
        stepSec: 1 / 30,
        swarmState: createSwarmSummary(1, 1),
        rng,
      }).clot;
    }

    expect(clot.currentBurden).toBeGreaterThanOrEqual(0);
    expect(clot.currentBurden).toBeLessThanOrEqual(1);
  });

  it("keeps occlusion fraction within valid bounds", () => {
    let clot = createClotState(coronaryDefaultPreset);
    const rng = new SeededRng(17);

    for (let index = 0; index < 400; index += 1) {
      clot = updateClotState(clot, {
        config: coronaryDefaultPreset,
        stepSec: 1 / 30,
        swarmState: createSwarmSummary(0.9, 0.85),
        rng,
      }).clot;

      expect(clot.occlusionFraction).toBeGreaterThanOrEqual(0);
      expect(clot.occlusionFraction).toBeLessThanOrEqual(1);
    }
  });

  it("decreases clot burden monotonically under supportive successful conditions", () => {
    const supportiveConfig = {
      ...coronaryDefaultPreset,
      clot: {
        ...coronaryDefaultPreset.clot,
        size: 0.3,
      },
      field: {
        ...coronaryDefaultPreset.field,
        strength: 1,
        localizationAssist: 1,
        corkscrewIntensity: 1,
      },
      swarm: {
        ...coronaryDefaultPreset.swarm,
        effectiveSwarmFactor: 1,
        concentrationFactor: 1,
        coordinationGain: 1,
      },
    };
    const rng = new SeededRng(19);
    let clot = createClotState(supportiveConfig);
    let previousBurden = clot.currentBurden;

    for (let index = 0; index < 120; index += 1) {
      const result = updateClotState(clot, {
        config: supportiveConfig,
        stepSec: 1 / 30,
        swarmState: createSwarmSummary(1, 1),
        rng,
      });
      clot = result.clot;

      expect(clot.currentBurden).toBeLessThanOrEqual(previousBurden);
      previousBurden = clot.currentBurden;
    }
  });
});

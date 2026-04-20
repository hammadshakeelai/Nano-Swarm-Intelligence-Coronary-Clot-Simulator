import { describe, expect, it } from "vitest";

import type { ScenarioConfig, SwarmState } from "../../src/schema/scenarioTypes";
import { coronaryDefaultPreset } from "../../src/sim";
import { SeededRng } from "../../src/sim/prng";
import {
  initializeSwarmState,
  updateSwarmState,
} from "../../src/sim/systems/swarmUpdate";

function runSwarmTicks(config: ScenarioConfig, ticks: number): SwarmState {
  const rng = new SeededRng(config.seed);
  let state = initializeSwarmState(config, rng);

  for (let index = 0; index < ticks; index += 1) {
    state = updateSwarmState(
      state,
      {
        config,
      },
      rng,
    );
  }

  return state;
}

describe("field and localization integration", () => {
  it("increases localization ratio over time under supportive settings", () => {
    const config = {
      ...coronaryDefaultPreset,
      clot: {
        ...coronaryDefaultPreset.clot,
        position: 0.57,
      },
      flow: {
        ...coronaryDefaultPreset.flow,
        speed: 0.2,
      },
      field: {
        ...coronaryDefaultPreset.field,
        strength: 0.95,
        localizationAssist: 0.95,
      },
      swarm: {
        ...coronaryDefaultPreset.swarm,
        concentrationFactor: 0.95,
        effectiveSwarmFactor: 0.85,
      },
    };
    const earlyState = runSwarmTicks(config, 10);
    const lateState = runSwarmTicks(config, 26);

    expect(lateState.localizationRatio).toBeGreaterThan(
      earlyState.localizationRatio,
    );
    expect(lateState.localizedCount).toBeGreaterThan(earlyState.localizedCount);
  });

  it("reduces progress and localization under stronger flow opposition", () => {
    const baseConfig = {
      ...coronaryDefaultPreset,
      clot: {
        ...coronaryDefaultPreset.clot,
        position: 0.57,
      },
      field: {
        ...coronaryDefaultPreset.field,
        strength: 0.95,
        localizationAssist: 0.95,
      },
      swarm: {
        ...coronaryDefaultPreset.swarm,
        concentrationFactor: 0.95,
        effectiveSwarmFactor: 0.85,
      },
    };
    const lowOppositionState = runSwarmTicks(
      {
        ...baseConfig,
        flow: {
          ...baseConfig.flow,
          speed: 0.2,
        },
      },
      25,
    );
    const highOppositionState = runSwarmTicks(
      {
        ...baseConfig,
        flow: {
          ...baseConfig.flow,
          speed: 1,
        },
      },
      25,
    );

    expect(lowOppositionState.centroid.x).toBeGreaterThan(
      highOppositionState.centroid.x,
    );
    expect(lowOppositionState.localizationRatio).toBeGreaterThan(
      highOppositionState.localizationRatio,
    );
  });

  it("preserves deterministic behavior for the same seed and config", () => {
    const config = {
      ...coronaryDefaultPreset,
      clot: {
        ...coronaryDefaultPreset.clot,
        position: 0.42,
      },
      field: {
        ...coronaryDefaultPreset.field,
        strength: 0.88,
        directionDeg: 24,
      },
    };

    expect(runSwarmTicks(config, 45)).toEqual(runSwarmTicks(config, 45));
  });
});

import { describe, expect, it } from "vitest";

import { SWARM_AGENT_STATES } from "../../src/schema/scenarioTypes";
import { SeededRng } from "../../src/sim/prng";
import {
  initializeSwarmState,
  updateSwarmState,
} from "../../src/sim/systems/swarmUpdate";
import { coronaryDefaultPreset } from "../../src/sim";

describe("swarm state", () => {
  it("initializes deterministically for the same seed and config", () => {
    const stateA = initializeSwarmState(coronaryDefaultPreset, 42);
    const stateB = initializeSwarmState(coronaryDefaultPreset, 42);

    expect(stateA).toEqual(stateB);
  });

  it("changes initialized aggregate layout for a different seed", () => {
    const stateA = initializeSwarmState(coronaryDefaultPreset, 42);
    const stateB = initializeSwarmState(coronaryDefaultPreset, 99);

    expect(stateA).not.toEqual(stateB);
  });

  it("uses visibleCount as the actual aggregate count", () => {
    const config = {
      ...coronaryDefaultPreset,
      swarm: {
        ...coronaryDefaultPreset.swarm,
        visibleCount: 128,
      },
    };

    const state = initializeSwarmState(config, config.seed);

    expect(state.agents).toHaveLength(128);
  });

  it("keeps aggregate positions bounded and state labels valid", () => {
    const state = initializeSwarmState(coronaryDefaultPreset, 42);

    for (const agent of state.agents) {
      expect(agent.x).toBeGreaterThanOrEqual(0);
      expect(agent.x).toBeLessThanOrEqual(1);
      expect(agent.y).toBeGreaterThanOrEqual(-0.08);
      expect(agent.y).toBeLessThanOrEqual(0.08);
      expect(agent.z).toBeGreaterThanOrEqual(-0.08);
      expect(agent.z).toBeLessThanOrEqual(0.08);
      expect(SWARM_AGENT_STATES).toContain(agent.state);
    }
  });

  it("updates deterministically over multiple ticks for the same seed and config", () => {
    const rngA = new SeededRng(coronaryDefaultPreset.seed);
    const rngB = new SeededRng(coronaryDefaultPreset.seed);
    let stateA = initializeSwarmState(coronaryDefaultPreset, rngA);
    let stateB = initializeSwarmState(coronaryDefaultPreset, rngB);

    for (let index = 0; index < 25; index += 1) {
      stateA = updateSwarmState(
        stateA,
        {
          config: coronaryDefaultPreset,
        },
        rngA,
      );
      stateB = updateSwarmState(
        stateB,
        {
          config: coronaryDefaultPreset,
        },
        rngB,
      );
    }

    expect(stateA).toEqual(stateB);
  });
});

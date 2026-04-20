import { describe, expect, it } from "vitest";

import type { SwarmAgentAggregate } from "../../src/schema/scenarioTypes";
import { coronaryDefaultPreset } from "../../src/sim";
import { createFieldSteeringContext } from "../../src/sim/systems/fieldSteering";
import {
  applyLocalizationStep,
  summarizeLocalizationState,
} from "../../src/sim/systems/localization";

function createAgent(
  overrides: Partial<SwarmAgentAggregate> = {},
): SwarmAgentAggregate {
  return {
    id: 0,
    x: coronaryDefaultPreset.injection.point,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    heading: 0,
    state: "queued",
    intensity: 0.4,
    ...overrides,
  };
}

describe("localization", () => {
  it("classifies clot-zone agents and summarizes localization ratio", () => {
    const config = {
      ...coronaryDefaultPreset,
      clot: {
        ...coronaryDefaultPreset.clot,
        position: 0.5,
      },
    };
    const steeringContext = createFieldSteeringContext(config);
    const agents = [
      applyLocalizationStep(
        createAgent({ id: 1, x: config.clot.position - 0.07 }),
        config,
        steeringContext,
      ),
      applyLocalizationStep(
        createAgent({ id: 2, x: config.clot.position - 0.01 }),
        config,
        steeringContext,
      ),
      applyLocalizationStep(
        createAgent({ id: 3, x: config.injection.point }),
        config,
        steeringContext,
      ),
    ];

    const summary = summarizeLocalizationState(agents, 1, config);

    expect(summary.localizedCount).toBe(2);
    expect(summary.localizationRatio).toBeCloseTo(2 / 3, 5);
    expect(summary.agents[0]?.state).toBe("localizing");
    expect(summary.agents[1]?.state).toBe("interacting");
    expect(summary.agents[2]?.state).toBe("queued");
  });

  it("accumulates more strongly near the clot under supportive settings", () => {
    const supportiveConfig = {
      ...coronaryDefaultPreset,
      field: {
        ...coronaryDefaultPreset.field,
        localizationAssist: 0.95,
      },
      swarm: {
        ...coronaryDefaultPreset.swarm,
        concentrationFactor: 0.95,
      },
    };
    const adverseConfig = {
      ...coronaryDefaultPreset,
      field: {
        ...coronaryDefaultPreset.field,
        localizationAssist: 0.15,
      },
      swarm: {
        ...coronaryDefaultPreset.swarm,
        concentrationFactor: 0.15,
      },
    };
    const baseAgent = createAgent({
      x: coronaryDefaultPreset.clot.position - 0.09,
      vx: 0.004,
    });

    const supportiveAgent = applyLocalizationStep(
      baseAgent,
      supportiveConfig,
      createFieldSteeringContext(supportiveConfig),
    );
    const adverseAgent = applyLocalizationStep(
      baseAgent,
      adverseConfig,
      createFieldSteeringContext(adverseConfig),
    );

    expect(supportiveAgent.x).toBeGreaterThan(adverseAgent.x);
  });
});

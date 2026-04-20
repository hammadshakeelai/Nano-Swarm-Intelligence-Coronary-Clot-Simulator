import { describe, expect, it } from "vitest";

import type { SwarmAgentAggregate } from "../../src/schema/scenarioTypes";
import { coronaryDefaultPreset } from "../../src/sim";
import { SeededRng } from "../../src/sim/prng";
import {
  applyFieldSteering,
  createFieldSteeringContext,
} from "../../src/sim/systems/fieldSteering";

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

describe("field steering", () => {
  it("aligns agent heading more strongly as field strength increases", () => {
    const baseConfig = {
      ...coronaryDefaultPreset,
      field: {
        ...coronaryDefaultPreset.field,
        directionDeg: 90,
      },
    };
    const lowStrengthConfig = {
      ...baseConfig,
      field: {
        ...baseConfig.field,
        strength: 0.15,
      },
    };
    const highStrengthConfig = {
      ...baseConfig,
      field: {
        ...baseConfig.field,
        strength: 1,
      },
    };
    const targetHeading = Math.PI / 2;

    const lowStrengthAgent = applyFieldSteering(
      createAgent(),
      lowStrengthConfig,
      createFieldSteeringContext(lowStrengthConfig),
      new SeededRng(17),
    );
    const highStrengthAgent = applyFieldSteering(
      createAgent(),
      highStrengthConfig,
      createFieldSteeringContext(highStrengthConfig),
      new SeededRng(17),
    );

    expect(Math.abs(targetHeading - highStrengthAgent.heading)).toBeLessThan(
      Math.abs(targetHeading - lowStrengthAgent.heading),
    );
  });

  it("changes agent heading outcome when field direction changes", () => {
    const positiveDirectionConfig = {
      ...coronaryDefaultPreset,
      field: {
        ...coronaryDefaultPreset.field,
        directionDeg: 90,
      },
    };
    const negativeDirectionConfig = {
      ...coronaryDefaultPreset,
      field: {
        ...coronaryDefaultPreset.field,
        directionDeg: -90,
      },
    };

    const positiveAgent = applyFieldSteering(
      createAgent(),
      positiveDirectionConfig,
      createFieldSteeringContext(positiveDirectionConfig),
      new SeededRng(23),
    );
    const negativeAgent = applyFieldSteering(
      createAgent(),
      negativeDirectionConfig,
      createFieldSteeringContext(negativeDirectionConfig),
      new SeededRng(23),
    );

    expect(positiveAgent.heading).toBeGreaterThan(negativeAgent.heading);
    expect(positiveAgent.vy).toBeGreaterThan(0);
    expect(negativeAgent.vy).toBeLessThan(0);
  });

  it("reduces forward progress under stronger flow opposition", () => {
    const lowFlowConfig = {
      ...coronaryDefaultPreset,
      flow: {
        ...coronaryDefaultPreset.flow,
        speed: 0.2,
      },
    };
    const highFlowConfig = {
      ...coronaryDefaultPreset,
      flow: {
        ...coronaryDefaultPreset.flow,
        speed: 1,
      },
    };

    const lowFlowAgent = applyFieldSteering(
      createAgent(),
      lowFlowConfig,
      createFieldSteeringContext(lowFlowConfig),
      new SeededRng(29),
    );
    const highFlowAgent = applyFieldSteering(
      createAgent(),
      highFlowConfig,
      createFieldSteeringContext(highFlowConfig),
      new SeededRng(29),
    );

    expect(lowFlowAgent.vx).toBeGreaterThan(highFlowAgent.vx);
  });
});

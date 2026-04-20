import { clamp } from "../metrics";
import { SeededRng } from "../prng";
import type { ScenarioConfig, SwarmAgentAggregate } from "../types";

const DEG_TO_RAD = Math.PI / 180;

export interface FieldSteeringContext {
  flowResistance: number;
  steeringGain: number;
  targetHeading: number;
}

export function createFieldSteeringContext(
  config: ScenarioConfig,
): FieldSteeringContext {
  return {
    targetHeading: config.field.directionDeg * DEG_TO_RAD,
    flowResistance: config.flow.speed * 0.25,
    steeringGain: clamp(
      0.05,
      0.3,
      config.field.strength * 0.22 + config.field.localizationAssist * 0.08,
    ),
  };
}

export function applyFieldSteering(
  agent: SwarmAgentAggregate,
  config: ScenarioConfig,
  context: FieldSteeringContext,
  rng: SeededRng,
): SwarmAgentAggregate {
  const nextAgent = { ...agent };
  const noise = rng.nextSigned() * 0.03;

  nextAgent.heading +=
    (context.targetHeading - nextAgent.heading) * context.steeringGain +
    noise * (1 - config.field.strength);

  nextAgent.vx =
    0.006 +
    config.field.strength * 0.004 +
    config.swarm.effectiveSwarmFactor * 0.003 -
    context.flowResistance * 0.002;
  nextAgent.vy =
    Math.sin(nextAgent.heading) *
    0.0015 *
    (0.6 + config.swarm.cohesionGain);
  nextAgent.vz =
    Math.cos(nextAgent.heading) *
    0.001 *
    (0.6 + config.swarm.coordinationGain);

  return nextAgent;
}

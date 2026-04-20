import { clamp, computeCoordination } from "../metrics";
import type {
  ScenarioConfig,
  SwarmAgentAggregate,
  SwarmAgentState,
  SwarmCentroid,
  SwarmState,
} from "../types";
import type { FieldSteeringContext } from "./fieldSteering";

const DEG_TO_RAD = Math.PI / 180;

function cloneAgent(agent: SwarmAgentAggregate): SwarmAgentAggregate {
  return { ...agent };
}

function computeCentroid(agents: readonly SwarmAgentAggregate[]): SwarmCentroid {
  const total = agents.length || 1;

  return agents.reduce(
    (centroid, agent) => {
      centroid.x += agent.x / total;
      centroid.y += agent.y / total;
      centroid.z += agent.z / total;
      return centroid;
    },
    { x: 0, y: 0, z: 0 },
  );
}

export function resolveLocalizedAgentState(
  agent: SwarmAgentAggregate,
  config: ScenarioConfig,
): SwarmAgentState {
  if (agent.x > config.clot.position - 0.08) {
    return agent.x > config.clot.position - 0.02
      ? "interacting"
      : "localizing";
  }

  if (agent.x > config.injection.point + 0.02) {
    return "navigating";
  }

  return "queued";
}

export function applyLocalizationStep(
  agent: SwarmAgentAggregate,
  config: ScenarioConfig,
  steering: FieldSteeringContext,
): SwarmAgentAggregate {
  const nextAgent = { ...agent };
  const clotDistance = Math.max(0, config.clot.position - nextAgent.x);
  const attraction = clamp(
    0,
    1,
    config.field.localizationAssist * 0.7 +
      config.swarm.concentrationFactor * 0.2 -
      steering.flowResistance * clotDistance,
  );

  if (clotDistance < 0.1) {
    nextAgent.vx += attraction * 0.0025;
  }

  nextAgent.x = clamp(0, 1, nextAgent.x + nextAgent.vx);
  nextAgent.y = clamp(-0.08, 0.08, nextAgent.y + nextAgent.vy * 0.5);
  nextAgent.z = clamp(-0.08, 0.08, nextAgent.z + nextAgent.vz * 0.5);
  nextAgent.state = resolveLocalizedAgentState(nextAgent, config);

  return nextAgent;
}

export function summarizeLocalizationState(
  agents: readonly SwarmAgentAggregate[],
  tick: number,
  config: ScenarioConfig,
): SwarmState {
  let localizedCount = 0;
  let alignmentAccumulator = 0;
  let compactnessAccumulator = 0;

  for (const agent of agents) {
    if (agent.state === "localizing" || agent.state === "interacting") {
      localizedCount += 1;
    }

    alignmentAccumulator +=
      1 -
      Math.min(
        1,
        Math.abs(config.field.directionDeg * DEG_TO_RAD - agent.heading) / Math.PI,
      );
    compactnessAccumulator += 1 - Math.min(1, Math.abs(agent.y) / 0.08);
  }

  const total = agents.length || 1;
  const localizationRatio = localizedCount / total;
  const alignmentScore = alignmentAccumulator / total;
  const compactnessScore = compactnessAccumulator / total;

  return {
    agents: agents.map(cloneAgent),
    tick,
    centroid: computeCentroid(agents),
    localizedCount,
    localizationRatio,
    coordinationScore: computeCoordination(alignmentScore, compactnessScore),
    headingDeg: config.field.directionDeg,
    alignmentScore,
    compactnessScore,
  };
}

import { SeededRng } from "../prng";
import type {
  ScenarioConfig,
  SwarmAgentAggregate,
  SwarmState,
} from "../types";
import {
  applyFieldSteering,
  createFieldSteeringContext,
} from "./fieldSteering";
import {
  applyLocalizationStep,
  summarizeLocalizationState,
} from "./localization";

export interface SwarmUpdateContext {
  config: ScenarioConfig;
}

function cloneAgent(agent: SwarmAgentAggregate): SwarmAgentAggregate {
  return { ...agent };
}

export function cloneSwarmState(state: SwarmState): SwarmState {
  return {
    ...state,
    centroid: { ...state.centroid },
    agents: state.agents.map(cloneAgent),
  };
}

export function initializeSwarmState(
  config: ScenarioConfig,
  seedOrRng: number | SeededRng = config.seed,
): SwarmState {
  const rng =
    typeof seedOrRng === "number" ? new SeededRng(seedOrRng) : seedOrRng;
  const agents = Array.from({ length: config.swarm.visibleCount }, (_, index) => ({
    id: index,
    x: config.injection.point + rng.next() * 0.02,
    y: rng.nextSigned() * 0.03,
    z: rng.nextSigned() * 0.02,
    vx: 0,
    vy: 0,
    vz: 0,
    heading: (config.field.directionDeg * Math.PI) / 180,
    state: "queued" as const,
    intensity: 0.3 + rng.next() * 0.2,
  }));

  return {
    agents: agents.map(cloneAgent),
    tick: 0,
    centroid: {
      x:
        agents.reduce((sum, agent) => sum + agent.x, 0) /
        (agents.length || 1),
      y:
        agents.reduce((sum, agent) => sum + agent.y, 0) /
        (agents.length || 1),
      z:
        agents.reduce((sum, agent) => sum + agent.z, 0) /
        (agents.length || 1),
    },
    localizedCount: 0,
    localizationRatio: 0,
    coordinationScore: 0,
    headingDeg: config.field.directionDeg,
    alignmentScore: 0,
    compactnessScore: 0,
  };
}

export function updateSwarmState(
  currentState: SwarmState,
  context: SwarmUpdateContext,
  rng: SeededRng,
): SwarmState {
  const { config } = context;
  const steeringContext = createFieldSteeringContext(config);

  const agents = currentState.agents.map((currentAgent) => {
    const steeredAgent = applyFieldSteering(
      currentAgent,
      config,
      steeringContext,
      rng,
    );
    return applyLocalizationStep(steeredAgent, config, steeringContext);
  });

  return summarizeLocalizationState(agents, currentState.tick + 1, config);
}

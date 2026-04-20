export const SWARM_AGENT_STATES = [
  "queued",
  "navigating",
  "localizing",
  "interacting",
] as const;

export type SwarmAgentState = (typeof SWARM_AGENT_STATES)[number];

export interface SwarmConfig {
  visibleCount: number;
  effectiveSwarmFactor: number;
  concentrationFactor: number;
  cohesionGain: number;
  coordinationGain: number;
}

export interface SwarmAgentAggregate {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  heading: number;
  state: SwarmAgentState;
  intensity: number;
}

export interface SwarmCentroid {
  x: number;
  y: number;
  z: number;
}

export interface SwarmState {
  agents: SwarmAgentAggregate[];
  tick: number;
  centroid: SwarmCentroid;
  localizedCount: number;
  localizationRatio: number;
  coordinationScore: number;
  headingDeg: number;
  alignmentScore: number;
  compactnessScore: number;
}

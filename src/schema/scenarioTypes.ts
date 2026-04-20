import type { ClotConfig, ClotState } from "../sim/models/clotState";
import type {
  SwarmAgentAggregate,
  SwarmConfig,
  SwarmState,
} from "../sim/models/swarmState";

export { CLOT_PHASES } from "../sim/models/clotState";
export { SWARM_AGENT_STATES } from "../sim/models/swarmState";
export type { ClotConfig, ClotPhase, ClotState } from "../sim/models/clotState";
export type {
  SwarmAgentAggregate,
  SwarmAgentState,
  SwarmConfig,
  SwarmState,
} from "../sim/models/swarmState";
export type { SwarmCentroid } from "../sim/models/swarmState";

export const APP_MODES = ["guided", "explore"] as const;
export type AppMode = (typeof APP_MODES)[number];
export type SimulatorMode = AppMode;

export const CAMERA_MODES = [
  "overview",
  "followSwarm",
  "clotCloseup",
  "fluoro",
] as const;
export type CameraMode = (typeof CAMERA_MODES)[number];

export const OVERLAY_MODES = ["clean", "fluoro"] as const;
export type OverlayMode = (typeof OVERLAY_MODES)[number];

export const CURVE_VARIANTS = ["straight", "mild"] as const;
export type CurveVariant = (typeof CURVE_VARIANTS)[number];

export const VESSEL_PRESET_IDS = ["lad_basic", "lad_partial"] as const;
export type VesselPresetId = (typeof VESSEL_PRESET_IDS)[number];

export const SIMULATION_PHASES = [
  "idle",
  "context_intro",
  "vessel_zoom",
  "clot_identified",
  "injection",
  "navigation",
  "localization",
  "clot_interaction",
  "channel_opening",
  "success",
  "partial_failure",
  "results",
] as const;
export type SimulationPhase = (typeof SIMULATION_PHASES)[number];

export const SIMULATION_OUTCOMES = ["success", "partial_failure"] as const;
export type SimulationOutcome = (typeof SIMULATION_OUTCOMES)[number];

export type ScenarioVersion = "2.0";

export interface VesselConfig {
  preset: VesselPresetId;
  diameterScale: number;
  curveVariant: CurveVariant;
}

export interface InjectionConfig {
  point: number;
}

export interface FlowConfig {
  speed: number;
  pulseEnabled: boolean;
}

export interface FieldConfig {
  strength: number;
  directionDeg: number;
  localizationAssist: number;
  corkscrewIntensity: number;
}

export interface ViewConfig {
  camera: CameraMode;
  overlay: OverlayMode;
}

export interface PlaybackConfig {
  speed: number;
}

export interface ScenarioConfig {
  version: ScenarioVersion;
  scenarioId: string;
  mode: AppMode;
  vessel: VesselConfig;
  clot: ClotConfig;
  injection: InjectionConfig;
  flow: FlowConfig;
  swarm: SwarmConfig;
  field: FieldConfig;
  view: ViewConfig;
  playback: PlaybackConfig;
  seed: number;
}

export interface MetricsRecord {
  timeSec: number;
  phase: SimulationPhase;
  clotBurdenPct: number;
  svpiPct: number;
  localizationPct: number;
  coordinationScore: number;
}

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface SimulationSnapshot {
  tick: number;
  timeSec: number;
  phase: SimulationPhase;
  headingDeg: number;
  clot: ClotState;
  metrics: MetricsRecord;
  outcome?: SimulationOutcome | null;
}

export interface SimulationRenderState {
  snapshot: SimulationSnapshot;
  agents: SwarmAgentAggregate[];
  centroid: Vector3Like;
  swarmState?: SwarmState;
}

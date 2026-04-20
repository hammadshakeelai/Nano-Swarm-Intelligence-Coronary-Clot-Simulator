import type { MetricsHistoryEntry } from "../../metrics/metricsHistory";
import type { MetricsRecord } from "../../metrics/formulas";
import type {
  CameraMode,
  OverlayMode,
  ScenarioConfig,
  SimulationRenderState,
} from "../types";

export const REPLAY_RUNTIME_MODES = ["live", "replay", "scrub"] as const;
export type ReplayRuntimeMode = (typeof REPLAY_RUNTIME_MODES)[number];

export const REPLAY_RUNTIME_ACTIONS = [
  "init",
  "step",
  "reset",
  "replay",
  "scrub",
  "view",
] as const;
export type ReplayRuntimeAction = (typeof REPLAY_RUNTIME_ACTIONS)[number];

export interface PresentationViewState {
  camera: CameraMode;
  overlay: OverlayMode;
}

export interface ReplayState {
  mode: ReplayRuntimeMode;
  lastAction: ReplayRuntimeAction;
  requestedTick: number;
  resolvedTick: number;
}

export interface TimelineState {
  currentTick: number;
  totalTicks: number;
}

export interface ScenarioRuntimeMetrics {
  current: MetricsRecord;
  history: MetricsHistoryEntry[];
}

export interface ScenarioRuntime {
  sourceConfig: ScenarioConfig;
  simulation: SimulationRenderState;
  replay: ReplayState;
  timeline: TimelineState;
  metrics: ScenarioRuntimeMetrics;
  presentation: PresentationViewState;
}

export function cloneSimulationRenderState(
  renderState: SimulationRenderState,
): SimulationRenderState {
  return structuredClone(renderState);
}

export function cloneScenarioRuntime(runtime: ScenarioRuntime): ScenarioRuntime {
  return structuredClone(runtime);
}

export function createPresentationViewState(
  config: ScenarioConfig,
): PresentationViewState {
  return {
    camera: config.view.camera,
    overlay: config.view.overlay,
  };
}

export interface ScenarioRuntimeParams {
  sourceConfig: ScenarioConfig;
  simulation: SimulationRenderState;
  replay: ReplayState;
  timeline: TimelineState;
  metrics: ScenarioRuntimeMetrics;
  presentation: PresentationViewState;
}

export function createScenarioRuntime(
  params: ScenarioRuntimeParams,
): ScenarioRuntime {
  return {
    sourceConfig: structuredClone(params.sourceConfig),
    simulation: cloneSimulationRenderState(params.simulation),
    replay: { ...params.replay },
    timeline: { ...params.timeline },
    metrics: structuredClone(params.metrics),
    presentation: { ...params.presentation },
  };
}

import { ReplayController, DEFAULT_MAX_TICKS } from "./core/replayController";
import type { ScenarioRuntime } from "./models/scenarioRuntime";
import type {
  ScenarioConfig,
  SimulationRenderState,
  SimulationSnapshot,
} from "./types";

export interface ReplayTimeline {
  runtime: ScenarioRuntime;
  renderState: SimulationRenderState;
  snapshots: SimulationSnapshot[];
  totalTicks: number;
}

export function estimateTotalTicks(
  config: ScenarioConfig,
  maxTicks = DEFAULT_MAX_TICKS,
): number {
  return new ReplayController(config, { maxTicks }).getTotalTicks();
}

export function collectReplaySnapshots(
  config: ScenarioConfig,
  maxTicks = estimateTotalTicks(config),
): SimulationSnapshot[] {
  return new ReplayController(config, { maxTicks }).collectSnapshots(maxTicks);
}

export function seekRenderState(
  config: ScenarioConfig,
  requestedTick: number,
): ReplayTimeline {
  const controller = new ReplayController(config);
  const runtime = controller.scrubToTick(requestedTick);
  const snapshots = controller.collectSnapshots(runtime.timeline.currentTick);

  return {
    runtime,
    renderState: runtime.simulation,
    snapshots,
    totalTicks: runtime.timeline.totalTicks,
  };
}

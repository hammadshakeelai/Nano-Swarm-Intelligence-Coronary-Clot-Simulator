import {
  appendMetricsHistory,
  createMetricsHistory,
  createMetricsHistoryEntry,
  readMetricsHistory,
  type MetricsHistory,
  type MetricsHistoryEntry,
} from "../../metrics/metricsHistory";
import {
  createMetricsStore,
  readCurrentMetrics,
  updateMetricsStore,
  type MetricsStore,
} from "../../metrics/metricsStore";
import {
  cloneScenarioConfig,
  normalizeScenarioConfig,
} from "../../schema/scenario";
import { CoronarySimulation } from "../engine";
import {
  cloneScenarioRuntime,
  createPresentationViewState,
  createScenarioRuntime,
  type PresentationViewState,
  type ReplayRuntimeAction,
  type ReplayRuntimeMode,
  type ScenarioRuntime,
} from "../models/scenarioRuntime";
import { isTerminalPhase } from "./phaseMachine";
import type {
  ScenarioConfig,
  SimulationRenderState,
  SimulationSnapshot,
} from "../types";

export const DEFAULT_MAX_TICKS = 1800;

export interface ReplayControllerOptions {
  maxTicks?: number;
}

function clampTick(value: number, totalTicks: number): number {
  return Math.min(Math.max(Math.round(value), 0), totalTicks);
}

function estimateScenarioTotalTicks(
  config: ScenarioConfig,
  maxTicks: number,
): number {
  const simulation = new CoronarySimulation(config);
  let totalTicks = 0;

  while (totalTicks < maxTicks) {
    totalTicks += 1;
    if (isTerminalPhase(simulation.step().phase)) {
      break;
    }
  }

  return totalTicks;
}

export class ReplayController {
  readonly maxTicks: number;

  private readonly sourceConfig: ScenarioConfig;
  private readonly totalTicks: number;
  private simulation: CoronarySimulation;
  private metricsStore: MetricsStore;
  private metricsHistory: MetricsHistory;
  private runtime: ScenarioRuntime;

  constructor(config: ScenarioConfig, options: ReplayControllerOptions = {}) {
    this.maxTicks = options.maxTicks ?? DEFAULT_MAX_TICKS;
    this.sourceConfig = normalizeScenarioConfig(cloneScenarioConfig(config));
    this.totalTicks = estimateScenarioTotalTicks(this.sourceConfig, this.maxTicks);
    this.simulation = new CoronarySimulation(this.sourceConfig);
    const initialRenderState = this.simulation.getRenderState();
    const initialMetricsTracking = this.createMetricsTrackingForSimulation(
      this.simulation,
      0,
    );
    this.metricsStore = initialMetricsTracking.store;
    this.metricsHistory = initialMetricsTracking.history;
    this.runtime = createScenarioRuntime({
      sourceConfig: this.sourceConfig,
      simulation: initialRenderState,
      replay: {
        mode: "live",
        lastAction: "init",
        requestedTick: 0,
        resolvedTick: 0,
      },
      timeline: {
        currentTick: 0,
        totalTicks: this.totalTicks,
      },
      metrics: {
        current: readCurrentMetrics(this.metricsStore),
        history: readMetricsHistory(this.metricsHistory),
      },
      presentation: createPresentationViewState(this.sourceConfig),
    });
  }

  private setMetricsTracking(
    store: MetricsStore,
    history: MetricsHistory,
  ): void {
    this.metricsStore = store;
    this.metricsHistory = history;
  }

  private createMetricsTrackingForSimulation(
    simulation: CoronarySimulation,
    targetTick: number,
  ): {
    simulation: CoronarySimulation;
    store: MetricsStore;
    history: MetricsHistory;
  } {
    let history = createMetricsHistory();
    let store = createMetricsStore(simulation.getRenderState().snapshot.metrics);
    history = appendMetricsHistory(
      history,
      createMetricsHistoryEntry(
        simulation.getRenderState().snapshot.tick,
        simulation.getRenderState().snapshot.metrics,
      ),
    );

    for (let index = 0; index < targetTick; index += 1) {
      const snapshot = simulation.step();
      store = updateMetricsStore(store, snapshot.metrics);
      history = appendMetricsHistory(
        history,
        createMetricsHistoryEntry(snapshot.tick, snapshot.metrics),
      );
    }

    return {
      simulation,
      store,
      history,
    };
  }

  private rebuildRuntime(
    mode: ReplayRuntimeMode,
    lastAction: ReplayRuntimeAction,
    requestedTick: number,
  ): void {
    const simulation = this.simulation.getRenderState();
    const resolvedTick = simulation.snapshot.tick;

    this.runtime = createScenarioRuntime({
      sourceConfig: this.sourceConfig,
      simulation,
      replay: {
        mode,
        lastAction,
        requestedTick,
        resolvedTick,
      },
      timeline: {
        currentTick: resolvedTick,
        totalTicks: this.totalTicks,
      },
      metrics: {
        current: readCurrentMetrics(this.metricsStore),
        history: readMetricsHistory(this.metricsHistory),
      },
      presentation: this.runtime?.presentation ?? createPresentationViewState(this.sourceConfig),
    });
  }

  private replaceSimulation(
    simulation: CoronarySimulation,
    mode: ReplayRuntimeMode,
    lastAction: ReplayRuntimeAction,
    requestedTick: number,
    metricsTracking?: {
      store: MetricsStore;
      history: MetricsHistory;
    },
  ): void {
    this.simulation = simulation;
    if (metricsTracking) {
      this.setMetricsTracking(metricsTracking.store, metricsTracking.history);
    } else {
      this.setMetricsTracking(
        createMetricsStore(this.simulation.getRenderState().snapshot.metrics),
        createMetricsHistory([
          createMetricsHistoryEntry(
            this.simulation.getRenderState().snapshot.tick,
            this.simulation.getRenderState().snapshot.metrics,
          ),
        ]),
      );
    }
    this.rebuildRuntime(mode, lastAction, requestedTick);
  }

  private createFreshSimulation(): CoronarySimulation {
    return new CoronarySimulation(this.sourceConfig);
  }

  getRuntime(): ScenarioRuntime {
    return cloneScenarioRuntime(this.runtime);
  }

  getSourceConfig(): ScenarioConfig {
    return cloneScenarioConfig(this.sourceConfig);
  }

  getRenderState(): SimulationRenderState {
    return structuredClone(this.runtime.simulation);
  }

  getTotalTicks(): number {
    return this.totalTicks;
  }

  getCurrentMetrics() {
    return readCurrentMetrics(this.metricsStore);
  }

  getMetricsHistory(): MetricsHistoryEntry[] {
    return readMetricsHistory(this.metricsHistory);
  }

  step(): ScenarioRuntime {
    if (
      this.runtime.timeline.currentTick >= this.totalTicks ||
      isTerminalPhase(this.runtime.simulation.snapshot.phase)
    ) {
      return this.getRuntime();
    }

    const snapshot = this.simulation.step();
    this.metricsStore = updateMetricsStore(this.metricsStore, snapshot.metrics);
    this.metricsHistory = appendMetricsHistory(
      this.metricsHistory,
      createMetricsHistoryEntry(snapshot.tick, snapshot.metrics),
    );
    this.rebuildRuntime("live", "step", this.runtime.timeline.currentTick + 1);
    return this.getRuntime();
  }

  reset(): ScenarioRuntime {
    const simulation = this.createFreshSimulation();
    const metricsTracking = this.createMetricsTrackingForSimulation(simulation, 0);
    this.replaceSimulation(
      metricsTracking.simulation,
      "live",
      "reset",
      0,
      metricsTracking,
    );
    return this.getRuntime();
  }

  replay(): ScenarioRuntime {
    const simulation = this.createFreshSimulation();
    const metricsTracking = this.createMetricsTrackingForSimulation(simulation, 0);
    this.replaceSimulation(
      metricsTracking.simulation,
      "replay",
      "replay",
      0,
      metricsTracking,
    );
    return this.getRuntime();
  }

  scrubToTick(requestedTick: number): ScenarioRuntime {
    const resolvedTick = clampTick(requestedTick, this.totalTicks);
    const metricsTracking = this.createMetricsTrackingForSimulation(
      this.createFreshSimulation(),
      resolvedTick,
    );

    this.replaceSimulation(
      metricsTracking.simulation,
      "scrub",
      "scrub",
      requestedTick,
      metricsTracking,
    );
    return this.getRuntime();
  }

  setPresentationView(
    nextPresentation: Partial<PresentationViewState>,
  ): ScenarioRuntime {
    this.runtime = createScenarioRuntime({
      sourceConfig: this.runtime.sourceConfig,
      simulation: this.runtime.simulation,
      replay: this.runtime.replay,
      timeline: this.runtime.timeline,
      metrics: this.runtime.metrics,
      presentation: {
        ...this.runtime.presentation,
        ...nextPresentation,
      },
    });

    this.runtime.replay.lastAction = "view";
    return this.getRuntime();
  }

  collectSnapshots(maxTicks = this.totalTicks): SimulationSnapshot[] {
    const resolvedTick = clampTick(maxTicks, this.totalTicks);
    const simulation = this.createFreshSimulation();
    const snapshots = [simulation.getRenderState().snapshot];

    while (snapshots.length - 1 < resolvedTick) {
      const snapshot = simulation.step();
      snapshots.push(snapshot);
      if (isTerminalPhase(snapshot.phase)) {
        break;
      }
    }

    return snapshots;
  }

  collectMetricsHistory(maxTicks = this.totalTicks): MetricsHistoryEntry[] {
    const resolvedTick = clampTick(maxTicks, this.totalTicks);
    return readMetricsHistory(
      this.createMetricsTrackingForSimulation(
        this.createFreshSimulation(),
        resolvedTick,
      ).history,
    );
  }
}

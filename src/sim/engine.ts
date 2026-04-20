import { SimulationClock } from "./clock";
import {
  resetPhase,
  resolveNextPhase,
  replayPhase,
} from "./core/phaseMachine";
import { makeMetricsRecord } from "./metrics";
import { SeededRng } from "./prng";
import {
  createClotState,
  updateClotState,
} from "./systems/clotUpdate";
import { resolveSnapshotOutcome } from "./systems/outcomeResolver";
import {
  cloneSwarmState,
  initializeSwarmState,
  updateSwarmState,
} from "./systems/swarmUpdate";
import type {
  ClotState,
  ScenarioConfig,
  SimulationPhase,
  SimulationRenderState,
  SimulationSnapshot,
  SwarmState,
} from "./types";

const DEFAULT_STEP = 1 / 30;

function cloneClot(clot: ClotState): ClotState {
  return { ...clot };
}

export class CoronarySimulation {
  readonly config: ScenarioConfig;
  readonly clock: SimulationClock;
  private rng: SeededRng;
  private swarmState: SwarmState;
  private clot: ClotState;
  private tickCount = 0;
  private elapsed = 0;
  private phase: SimulationPhase = "idle";

  constructor(config: ScenarioConfig) {
    this.config = structuredClone(config);
    this.clock = new SimulationClock(DEFAULT_STEP / config.playback.speed);
    this.rng = new SeededRng(config.seed);
    this.clot = createClotState(this.config);
    this.swarmState = initializeSwarmState(this.config, this.rng);
    this.initializeRuntime();
  }

  private initializeRuntime() {
    this.tickCount = 0;
    this.elapsed = 0;
    this.phase = "idle";
    this.rng = new SeededRng(this.config.seed);
    this.clot = createClotState(this.config);
    this.swarmState = initializeSwarmState(this.config, this.rng);
  }

  private buildSnapshot(): SimulationSnapshot {
    return {
      tick: this.tickCount,
      timeSec: this.elapsed,
      phase: this.phase,
      headingDeg: this.swarmState.headingDeg,
      clot: cloneClot(this.clot),
      outcome: resolveSnapshotOutcome(this.phase, this.elapsed, this.clot),
      metrics: makeMetricsRecord(
        this.elapsed,
        this.phase,
        this.clot.currentBurden,
        this.swarmState.localizationRatio,
        this.swarmState.coordinationScore,
        this.clot.occlusionFraction,
      ),
    };
  }

  getRenderState(): SimulationRenderState {
    const swarmState = cloneSwarmState(this.swarmState);

    return {
      snapshot: this.buildSnapshot(),
      agents: swarmState.agents,
      centroid: { ...swarmState.centroid },
      swarmState,
    };
  }

  step(): SimulationSnapshot {
    this.tickCount += 1;
    this.elapsed = this.tickCount * this.clock.stepSec;
    this.swarmState = updateSwarmState(
      this.swarmState,
      {
        config: this.config,
      },
      this.rng,
    );

    const localizationRatio = this.swarmState.localizationRatio;
    const coordination = this.swarmState.coordinationScore;
    const clotUpdate = updateClotState(this.clot, {
      config: this.config,
      stepSec: this.clock.stepSec,
      swarmState: {
        localizationRatio,
        coordinationScore: coordination,
      },
      rng: this.rng,
    });

    this.clot = clotUpdate.clot;

    this.phase = resolveNextPhase(this.phase, this.elapsed, this.clot);

    return this.buildSnapshot();
  }

  runForTicks(ticks: number): SimulationSnapshot[] {
    return Array.from({ length: ticks }, () => this.step());
  }

  replay(): SimulationSnapshot {
    this.initializeRuntime();
    this.phase = replayPhase("results");
    this.elapsed = 6;
    this.tickCount = Math.round(this.elapsed / this.clock.stepSec);
    this.phase = resolveNextPhase(this.phase, this.elapsed, this.clot);
    return this.buildSnapshot();
  }

  reset(): SimulationSnapshot {
    this.initializeRuntime();
    this.phase = resetPhase("results");
    return this.buildSnapshot();
  }
}

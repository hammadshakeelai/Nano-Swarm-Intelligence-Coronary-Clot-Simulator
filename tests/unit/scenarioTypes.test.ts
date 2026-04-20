import { describe, expect, it } from "vitest";

import {
  APP_MODES,
  CAMERA_MODES,
  CLOT_PHASES,
  CURVE_VARIANTS,
  OVERLAY_MODES,
  SIMULATION_OUTCOMES,
  SIMULATION_PHASES,
  SWARM_AGENT_STATES,
  type MetricsRecord,
  type ScenarioConfig,
} from "../../src/schema/scenarioTypes";
import { coronaryDefaultPreset } from "../../src/sim";

describe("scenarioTypes", () => {
  it("exports the expected public enum-like unions", () => {
    expect(APP_MODES).toEqual(["guided", "explore"]);
    expect(CAMERA_MODES).toEqual([
      "overview",
      "followSwarm",
      "clotCloseup",
      "fluoro",
    ]);
    expect(OVERLAY_MODES).toEqual(["clean", "fluoro"]);
    expect(CURVE_VARIANTS).toEqual(["straight", "mild"]);
    expect(SIMULATION_PHASES).toEqual([
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
    ]);
    expect(SIMULATION_OUTCOMES).toEqual(["success", "partial_failure"]);
    expect(CLOT_PHASES).toEqual([
      "stable",
      "erosion",
      "channel_opening",
      "cleared",
      "incomplete",
    ]);
    expect(SWARM_AGENT_STATES).toEqual([
      "queued",
      "navigating",
      "localizing",
      "interacting",
    ]);
  });

  it("remains compatible with the current runtime contracts", () => {
    const scenarioConfig: ScenarioConfig = coronaryDefaultPreset;
    const metricsRecord: MetricsRecord = {
      timeSec: 0,
      phase: "idle",
      clotBurdenPct: 100,
      svpiPct: 0,
      localizationPct: 0,
      coordinationScore: 0,
    };

    expect(scenarioConfig.mode).toBe("guided");
    expect(metricsRecord.phase).toBe("idle");
  });
});

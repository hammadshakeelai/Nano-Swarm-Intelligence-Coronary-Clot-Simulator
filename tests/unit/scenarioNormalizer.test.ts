import { describe, expect, it } from "vitest";

import { normalizeScenarioConfig } from "../../src/schema/scenarioNormalizer";
import { coronaryDefaultPreset } from "../../src/sim";

describe("scenarioNormalizer", () => {
  it("clamps recoverable normalized and bounded numeric fields", () => {
    const normalized = normalizeScenarioConfig({
      ...coronaryDefaultPreset,
      clot: {
        ...coronaryDefaultPreset.clot,
        size: 2,
        occlusionFraction: -1,
        position: 2,
      },
      flow: {
        ...coronaryDefaultPreset.flow,
        speed: 3,
      },
      swarm: {
        ...coronaryDefaultPreset.swarm,
        visibleCount: 4.2,
        effectiveSwarmFactor: -0.5,
        concentrationFactor: 2,
        cohesionGain: 5,
        coordinationGain: -3,
      },
      field: {
        ...coronaryDefaultPreset.field,
        strength: 2,
        directionDeg: 270,
        localizationAssist: -1,
        corkscrewIntensity: 3,
      },
      playback: {
        speed: 99,
      },
      seed: 9999999999.8,
    });

    expect(normalized.clot.size).toBe(1);
    expect(normalized.clot.occlusionFraction).toBe(0);
    expect(normalized.clot.position).toBe(0.78);
    expect(normalized.flow.speed).toBe(1);
    expect(normalized.swarm.visibleCount).toBe(50);
    expect(normalized.swarm.effectiveSwarmFactor).toBe(0);
    expect(normalized.swarm.concentrationFactor).toBe(1);
    expect(normalized.swarm.cohesionGain).toBe(1);
    expect(normalized.swarm.coordinationGain).toBe(0);
    expect(normalized.field.strength).toBe(1);
    expect(normalized.field.directionDeg).toBe(180);
    expect(normalized.field.localizationAssist).toBe(0);
    expect(normalized.field.corkscrewIntensity).toBe(1);
    expect(normalized.playback.speed).toBe(3);
    expect(normalized.seed).toBe(2147483647);
  });

  it("rounds seed and visibleCount while preserving deterministic-ready bounds", () => {
    const normalized = normalizeScenarioConfig({
      ...coronaryDefaultPreset,
      swarm: {
        ...coronaryDefaultPreset.swarm,
        visibleCount: 123.4,
      },
      seed: 42.7,
    });

    expect(normalized.swarm.visibleCount).toBe(123);
    expect(normalized.seed).toBe(43);
  });

  it("keeps dependent injection bounds safe relative to clot position", () => {
    const normalized = normalizeScenarioConfig({
      ...coronaryDefaultPreset,
      clot: {
        ...coronaryDefaultPreset.clot,
        position: 0.4,
      },
      injection: {
        point: 0.9,
      },
    });

    expect(normalized.injection.point).toBe(0.32);
  });
});

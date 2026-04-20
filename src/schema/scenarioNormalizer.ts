import type { ScenarioConfig } from "./scenarioTypes";

const clamp = (min: number, max: number, value: number): number =>
  Math.min(max, Math.max(min, value));

const clampNormalized = (value: number): number => clamp(0, 1, value);

export function cloneScenarioConfig(config: ScenarioConfig): ScenarioConfig {
  return structuredClone(config);
}

export function normalizeScenarioConfig(config: ScenarioConfig): ScenarioConfig {
  const next = cloneScenarioConfig(config);

  next.version = "2.0";
  next.mode = next.mode === "explore" ? "explore" : "guided";
  next.vessel.preset =
    next.vessel.preset === "lad_partial" ? "lad_partial" : "lad_basic";
  next.vessel.diameterScale = clamp(0.8, 1.25, next.vessel.diameterScale);
  next.vessel.curveVariant =
    next.vessel.curveVariant === "straight" ? "straight" : "mild";

  next.clot.size = clampNormalized(next.clot.size);
  next.clot.position = clamp(0.35, 0.78, next.clot.position);
  next.clot.occlusionFraction = clampNormalized(next.clot.occlusionFraction);

  next.injection.point = clamp(
    0.05,
    Math.max(0.06, next.clot.position - 0.08),
    next.injection.point,
  );

  next.flow.speed = clampNormalized(next.flow.speed);
  next.flow.pulseEnabled = Boolean(next.flow.pulseEnabled);

  next.swarm.visibleCount = Math.round(
    clamp(50, 1000, next.swarm.visibleCount),
  );
  next.swarm.effectiveSwarmFactor = clampNormalized(
    next.swarm.effectiveSwarmFactor,
  );
  next.swarm.concentrationFactor = clampNormalized(
    next.swarm.concentrationFactor,
  );
  next.swarm.cohesionGain = clampNormalized(next.swarm.cohesionGain);
  next.swarm.coordinationGain = clampNormalized(next.swarm.coordinationGain);

  next.field.strength = clampNormalized(next.field.strength);
  next.field.directionDeg = clamp(-180, 180, next.field.directionDeg);
  next.field.localizationAssist = clampNormalized(
    next.field.localizationAssist,
  );
  next.field.corkscrewIntensity = clampNormalized(
    next.field.corkscrewIntensity,
  );

  next.view.camera =
    next.view.camera === "followSwarm" ||
    next.view.camera === "clotCloseup" ||
    next.view.camera === "fluoro"
      ? next.view.camera
      : "overview";
  next.view.overlay = next.view.overlay === "fluoro" ? "fluoro" : "clean";

  next.playback.speed = clamp(0.25, 3, next.playback.speed);
  next.seed = Math.round(clamp(0, 2147483647, next.seed));

  return next;
}

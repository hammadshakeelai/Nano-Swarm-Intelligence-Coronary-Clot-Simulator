import {
  APP_MODES,
  CAMERA_MODES,
  CURVE_VARIANTS,
  OVERLAY_MODES,
  type CameraMode,
  type CurveVariant,
  type OverlayMode,
  type ScenarioConfig,
  type SimulatorMode,
  VESSEL_PRESET_IDS,
  type VesselPresetId,
} from "./scenarioTypes";
import { normalizeScenarioConfig } from "./scenarioNormalizer";

const ROOT_KEYS = [
  "version",
  "scenarioId",
  "mode",
  "vessel",
  "clot",
  "injection",
  "flow",
  "swarm",
  "field",
  "view",
  "playback",
  "seed",
] as const;

type IssueLevel = "error" | "warning";

export interface ScenarioValidationIssue {
  level: IssueLevel;
  path: string;
  message: string;
}

export interface ScenarioValidationResult {
  valid: boolean;
  config: ScenarioConfig | null;
  issues: ScenarioValidationIssue[];
}

export interface ScenarioValidationOptions {
  warnOnUnknownRootFields?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shouldWarnOnUnknownRootFields(
  options?: ScenarioValidationOptions,
): boolean {
  if (typeof options?.warnOnUnknownRootFields === "boolean") {
    return options.warnOnUnknownRootFields;
  }

  return typeof process !== "undefined" && process.env.NODE_ENV === "development";
}

function readNumber(
  value: unknown,
  fallback: number,
  path: string,
  issues: ScenarioValidationIssue[],
): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    issues.push({
      level: "error",
      path,
      message: "Expected a finite number.",
    });
    return fallback;
  }

  return value;
}

function readString<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
  path: string,
  issues: ScenarioValidationIssue[],
): T {
  if (typeof value !== "string") {
    issues.push({
      level: "error",
      path,
      message: `Expected one of: ${allowed.join(", ")}.`,
    });
    return fallback;
  }

  if ((allowed as readonly string[]).includes(value)) {
    return value as T;
  }

  issues.push({
    level: "error",
    path,
    message: `Unsupported value "${value}". Expected one of: ${allowed.join(", ")}.`,
  });
  return fallback;
}

function recordMissingObjectIssue(
  value: unknown,
  path: string,
  issues: ScenarioValidationIssue[],
): Record<string, unknown> {
  if (isRecord(value)) {
    return value;
  }

  issues.push({
    level: "error",
    path,
    message: `Missing ${path} object.`,
  });
  return {};
}

function collectUnknownRootFieldIssues(
  input: Record<string, unknown>,
  issues: ScenarioValidationIssue[],
  options?: ScenarioValidationOptions,
) {
  const unknownRootKeys = Object.keys(input).filter(
    (key) => !(ROOT_KEYS as readonly string[]).includes(key),
  );

  if (unknownRootKeys.length === 0) {
    return;
  }

  for (const key of unknownRootKeys) {
    issues.push({
      level: "warning",
      path: key,
      message: "Unknown root field will be ignored.",
    });
  }

  if (shouldWarnOnUnknownRootFields(options)) {
    console.warn(
      `[ScenarioConfig] Unknown root fields ignored: ${unknownRootKeys.join(
        ", ",
      )}.`,
    );
  }
}

function validateRequiredRootFields(
  input: Record<string, unknown>,
  issues: ScenarioValidationIssue[],
) {
  if (input.version !== "2.0") {
    issues.push({
      level: "error",
      path: "version",
      message:
        input.version === undefined
          ? 'Missing required field "version".'
          : 'Unsupported scenario version. Expected "2.0".',
    });
  }

  if (typeof input.scenarioId !== "string") {
    issues.push({
      level: "error",
      path: "scenarioId",
      message:
        input.scenarioId === undefined
          ? 'Missing required field "scenarioId".'
          : "Scenario ID must be a string.",
    });
  }
}

export function validateScenarioConfig(
  input: unknown,
  options?: ScenarioValidationOptions,
): ScenarioValidationResult {
  const issues: ScenarioValidationIssue[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      config: null,
      issues: [
        {
          level: "error",
          path: "$",
          message: "Scenario JSON must be an object.",
        },
      ],
    };
  }

  collectUnknownRootFieldIssues(input, issues, options);
  validateRequiredRootFields(input, issues);

  const vessel = recordMissingObjectIssue(input.vessel, "vessel", issues);
  const clot = recordMissingObjectIssue(input.clot, "clot", issues);
  const injection = recordMissingObjectIssue(input.injection, "injection", issues);
  const flow = recordMissingObjectIssue(input.flow, "flow", issues);
  const swarm = recordMissingObjectIssue(input.swarm, "swarm", issues);
  const field = recordMissingObjectIssue(input.field, "field", issues);
  const view = recordMissingObjectIssue(input.view, "view", issues);
  const playback = recordMissingObjectIssue(input.playback, "playback", issues);

  const config = normalizeScenarioConfig({
    version: "2.0",
    scenarioId:
      typeof input.scenarioId === "string"
        ? input.scenarioId
        : "imported_scenario",
    mode: readString<SimulatorMode>(
      input.mode,
      APP_MODES,
      "guided",
      "mode",
      issues,
    ),
    vessel: {
      preset: readString<VesselPresetId>(
        vessel.preset,
        VESSEL_PRESET_IDS,
        "lad_basic",
        "vessel.preset",
        issues,
      ),
      diameterScale: readNumber(
        vessel.diameterScale,
        1,
        "vessel.diameterScale",
        issues,
      ),
      curveVariant: readString<CurveVariant>(
        vessel.curveVariant,
        CURVE_VARIANTS,
        "mild",
        "vessel.curveVariant",
        issues,
      ),
    },
    clot: {
      size: readNumber(clot.size, 0.6, "clot.size", issues),
      position: readNumber(clot.position, 0.58, "clot.position", issues),
      occlusionFraction: readNumber(
        clot.occlusionFraction,
        0.68,
        "clot.occlusionFraction",
        issues,
      ),
    },
    injection: {
      point: readNumber(injection.point, 0.18, "injection.point", issues),
    },
    flow: {
      speed: readNumber(flow.speed, 0.85, "flow.speed", issues),
      pulseEnabled:
        typeof flow.pulseEnabled === "boolean" ? flow.pulseEnabled : false,
    },
    swarm: {
      visibleCount: readNumber(
        swarm.visibleCount,
        320,
        "swarm.visibleCount",
        issues,
      ),
      effectiveSwarmFactor: readNumber(
        swarm.effectiveSwarmFactor,
        0.72,
        "swarm.effectiveSwarmFactor",
        issues,
      ),
      concentrationFactor: readNumber(
        swarm.concentrationFactor,
        0.65,
        "swarm.concentrationFactor",
        issues,
      ),
      cohesionGain: readNumber(
        swarm.cohesionGain,
        0.55,
        "swarm.cohesionGain",
        issues,
      ),
      coordinationGain: readNumber(
        swarm.coordinationGain,
        0.6,
        "swarm.coordinationGain",
        issues,
      ),
    },
    field: {
      strength: readNumber(field.strength, 0.7, "field.strength", issues),
      directionDeg: readNumber(
        field.directionDeg,
        18,
        "field.directionDeg",
        issues,
      ),
      localizationAssist: readNumber(
        field.localizationAssist,
        0.75,
        "field.localizationAssist",
        issues,
      ),
      corkscrewIntensity: readNumber(
        field.corkscrewIntensity,
        0.4,
        "field.corkscrewIntensity",
        issues,
      ),
    },
    view: {
      camera: readString<CameraMode>(
        view.camera,
        CAMERA_MODES,
        "overview",
        "view.camera",
        issues,
      ),
      overlay: readString<OverlayMode>(
        view.overlay,
        OVERLAY_MODES,
        "clean",
        "view.overlay",
        issues,
      ),
    },
    playback: {
      speed: readNumber(playback.speed, 1, "playback.speed", issues),
    },
    seed: readNumber(input.seed, 42, "seed", issues),
  });

  return {
    valid: issues.every((issue) => issue.level !== "error"),
    config,
    issues,
  };
}

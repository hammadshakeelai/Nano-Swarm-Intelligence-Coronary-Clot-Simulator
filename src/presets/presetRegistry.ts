import coronaryDefaultSuccessJson from "./coronaryDefaultSuccess.json";
import coronaryPartialFailureJson from "./coronaryPartialFailure.json";

import {
  cloneScenarioConfig,
  validateScenarioConfig,
  type ScenarioValidationIssue,
} from "../schema/scenario";
import type {
  ScenarioConfig,
  SimulationOutcome,
  VesselPresetId,
} from "../schema/scenarioTypes";

export interface CoronaryPresetDefinition {
  id: VesselPresetId;
  label: string;
  description: string;
  expectedOutcome: SimulationOutcome;
  config: ScenarioConfig;
}

const DEFAULT_PRESET_ID: VesselPresetId = "lad_basic";

interface PresetSource {
  id: VesselPresetId;
  label: string;
  description: string;
  expectedOutcome: SimulationOutcome;
  json: unknown;
}

function formatIssues(issues: ScenarioValidationIssue[]): string {
  return issues.map((issue) => `${issue.path}: ${issue.message}`).join(" ");
}

function buildPresetDefinition(source: PresetSource): CoronaryPresetDefinition {
  const validation = validateScenarioConfig(source.json);

  if (!validation.valid || !validation.config) {
    throw new Error(
      `Preset "${source.id}" failed validation. ${formatIssues(validation.issues)}`,
    );
  }

  if (validation.config.vessel.preset !== source.id) {
    throw new Error(
      `Preset "${source.id}" declared vessel preset "${validation.config.vessel.preset}".`,
    );
  }

  return {
    id: source.id,
    label: source.label,
    description: source.description,
    expectedOutcome: source.expectedOutcome,
    config: validation.config,
  };
}

const PRESET_SOURCES: readonly PresetSource[] = [
  {
    id: "lad_basic",
    label: "LAD Basic Success",
    description:
      "Default mild LAD segment with a successful reopening trajectory.",
    expectedOutcome: "success",
    json: coronaryDefaultSuccessJson,
  },
  {
    id: "lad_partial",
    label: "LAD Partial Failure",
    description:
      "Straighter LAD segment with a larger clot and weaker control factors.",
    expectedOutcome: "partial_failure",
    json: coronaryPartialFailureJson,
  },
] as const;

export const coronaryPresets: readonly CoronaryPresetDefinition[] =
  PRESET_SOURCES.map(buildPresetDefinition);

export function listPresets(): readonly CoronaryPresetDefinition[] {
  return coronaryPresets;
}

export function getPresetDefinition(
  presetId: VesselPresetId,
): CoronaryPresetDefinition {
  return (
    coronaryPresets.find((preset) => preset.id === presetId) ??
    getDefaultPreset()
  );
}

export function getDefaultPreset(): CoronaryPresetDefinition {
  const preset = coronaryPresets.find(
    (candidate) => candidate.id === DEFAULT_PRESET_ID,
  );

  if (!preset) {
    throw new Error(`Default preset "${DEFAULT_PRESET_ID}" is not registered.`);
  }

  return preset;
}

export function loadPresetById(presetId: VesselPresetId): ScenarioConfig {
  return cloneScenarioConfig(getPresetDefinition(presetId).config);
}

export function loadDefaultPreset(): ScenarioConfig {
  return cloneScenarioConfig(getDefaultPreset().config);
}

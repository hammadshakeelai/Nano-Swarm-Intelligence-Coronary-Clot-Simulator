import {
  loadDefaultPreset,
  loadPresetById,
} from "../presets/presetRegistry";
import type { ScenarioConfig, VesselPresetId } from "./types";

export type { CoronaryPresetDefinition } from "../presets/presetRegistry";
export {
  coronaryPresets,
  getDefaultPreset,
  getPresetDefinition,
} from "../presets/presetRegistry";

export const coronaryDefaultPreset: ScenarioConfig = loadDefaultPreset();

export const coronaryPartialFailurePreset: ScenarioConfig = loadPresetById(
  "lad_partial",
);

export function createPresetConfig(presetId: VesselPresetId): ScenarioConfig {
  return loadPresetById(presetId);
}

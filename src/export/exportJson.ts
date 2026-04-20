import {
  deserializeScenarioConfig,
  exportScenarioDocument,
  serializeScenarioConfig,
} from "../schema/scenario";
import type {
  ScenarioValidationOptions,
} from "../schema/scenario";
import type { ScenarioConfig } from "../schema/scenarioTypes";

export type { ScenarioValidationOptions } from "../schema/scenario";
export { ScenarioIOError } from "../schema/scenario";

export function exportScenarioJsonDocument(
  config: ScenarioConfig,
): ScenarioConfig {
  return exportScenarioDocument(config);
}

export function exportScenarioJson(config: ScenarioConfig): string {
  return serializeScenarioConfig(config);
}

export function importScenarioJson(
  json: string,
  options?: ScenarioValidationOptions,
): ScenarioConfig {
  return deserializeScenarioConfig(json, options);
}

export function createScenarioJsonBlob(config: ScenarioConfig): Blob {
  return new Blob([exportScenarioJson(config)], {
    type: "application/json;charset=utf-8",
  });
}

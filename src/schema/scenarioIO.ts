import { normalizeScenarioConfig } from "./scenarioNormalizer";
import {
  validateScenarioConfig,
  type ScenarioValidationIssue,
  type ScenarioValidationOptions,
} from "./scenarioSchema";
import type { ScenarioConfig } from "./scenarioTypes";

function formatScenarioIssues(issues: readonly ScenarioValidationIssue[]): string {
  return issues
    .filter((issue) => issue.level === "error")
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join(" ");
}

export class ScenarioIOError extends Error {
  readonly issues: readonly ScenarioValidationIssue[];

  constructor(message: string, issues: readonly ScenarioValidationIssue[] = []) {
    super(message);
    this.name = "ScenarioIOError";
    this.issues = issues;
  }
}

export function exportScenarioDocument(config: ScenarioConfig): ScenarioConfig {
  return normalizeScenarioConfig(config);
}

export function serializeScenarioConfig(config: ScenarioConfig): string {
  return JSON.stringify(exportScenarioDocument(config), null, 2);
}

export function parseScenarioConfigDocument(
  input: unknown,
  options?: ScenarioValidationOptions,
): ScenarioConfig {
  const result = validateScenarioConfig(input, options);

  if (!result.valid || !result.config) {
    throw new ScenarioIOError(
      formatScenarioIssues(result.issues) || "Scenario JSON failed validation.",
      result.issues,
    );
  }

  return result.config;
}

export function deserializeScenarioConfig(
  json: string,
  options?: ScenarioValidationOptions,
): ScenarioConfig {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new ScenarioIOError(
      "Scenario JSON could not be parsed. Ensure the file is valid UTF-8 JSON.",
    );
  }

  return parseScenarioConfigDocument(parsed, options);
}

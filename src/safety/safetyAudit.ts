import {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_HINT_TEXT,
} from "../accessibility/keyboardMap";
import { GUIDED_CAPTION_SCRIPT } from "../guided/captionScript";
import {
  METRICS_STRIP_DEFINITIONS,
  PRIMARY_METRIC_LABEL,
  PRIMARY_METRIC_TOOLTIP,
} from "../metrics/metricTooltips";
import { BANNED_WORDING } from "./bannedCopy";
import {
  CENTRALIZED_DISCLAIMER_COPY,
  MANDATORY_DISCLAIMER_TEXT,
} from "./disclaimerText";

export interface SafetyAuditEntry {
  label: string;
  text: string;
}

export interface SafetyAuditFinding {
  kind: "bannedPhrase";
  bannedPhrase: string;
  sourceLabel: string;
  message: string;
}

export interface SafetyAuditReport {
  findings: SafetyAuditFinding[];
  approvedPrimaryMetricLabel: string;
  approvedPrimaryMetricLabelPresent: boolean;
  auditedEntryCount: number;
}

function normalizeCopy(value: string): string {
  return value.trim().toLowerCase();
}

function containsBannedPhrase(text: string, bannedPhrase: string): boolean {
  let searchIndex = 0;

  while (searchIndex < text.length) {
    const phraseIndex = text.indexOf(bannedPhrase, searchIndex);
    if (phraseIndex === -1) {
      return false;
    }

    const prefix = text.slice(Math.max(0, phraseIndex - 4), phraseIndex);
    if (prefix !== "non-") {
      return true;
    }

    searchIndex = phraseIndex + bannedPhrase.length;
  }

  return false;
}

export function getCentralizedSafetyAuditEntries(): SafetyAuditEntry[] {
  return [
    {
      label: "onboarding-disclaimer:title",
      text: CENTRALIZED_DISCLAIMER_COPY.title,
    },
    {
      label: "onboarding-disclaimer:text",
      text: CENTRALIZED_DISCLAIMER_COPY.text,
    },
    {
      label: "help-disclaimer:title",
      text: CENTRALIZED_DISCLAIMER_COPY.title,
    },
    {
      label: "help-disclaimer:text",
      text: CENTRALIZED_DISCLAIMER_COPY.text,
    },
    {
      label: "export-png-footer:disclaimer",
      text: CENTRALIZED_DISCLAIMER_COPY.text,
    },
    {
      label: "primary-metric:label",
      text: PRIMARY_METRIC_LABEL,
    },
    {
      label: "primary-metric:tooltip",
      text: PRIMARY_METRIC_TOOLTIP,
    },
    ...METRICS_STRIP_DEFINITIONS.flatMap((definition) => [
      {
        label: `metric-label:${definition.id}`,
        text: definition.label,
      },
      {
        label: `metric-tooltip:${definition.id}`,
        text: definition.tooltip,
      },
    ]),
    {
      label: "keyboard:hint",
      text: SHORTCUT_HINT_TEXT,
    },
    ...KEYBOARD_SHORTCUTS.map((shortcut) => ({
      label: `keyboard-shortcut:${shortcut.keys}`,
      text: shortcut.description,
    })),
    ...GUIDED_CAPTION_SCRIPT.map((line) => ({
      label: `guided-caption:${line.beat}`,
      text: line.caption,
    })),
  ];
}

export function runSafetyAudit(
  entries: SafetyAuditEntry[],
): SafetyAuditFinding[] {
  const findings: SafetyAuditFinding[] = [];

  for (const entry of entries) {
    const normalized = normalizeCopy(entry.text);
    if (normalized === normalizeCopy(MANDATORY_DISCLAIMER_TEXT)) {
      continue;
    }
    for (const bannedPhrase of BANNED_WORDING) {
      if (containsBannedPhrase(normalized, bannedPhrase)) {
        findings.push({
          kind: "bannedPhrase",
          bannedPhrase,
          sourceLabel: entry.label,
          message: `Banned phrase "${bannedPhrase}" found in ${entry.label}.`,
        });
      }
    }
  }

  return findings;
}

export function hasApprovedPrimaryMetricLabel(
  entries: SafetyAuditEntry[],
): boolean {
  const normalizedPrimaryLabel = normalizeCopy(PRIMARY_METRIC_LABEL);
  return entries.some(
    (entry) => normalizeCopy(entry.text) === normalizedPrimaryLabel,
  );
}

export function createSafetyAuditReport(
  entries: SafetyAuditEntry[],
): SafetyAuditReport {
  return {
    findings: runSafetyAudit(entries),
    approvedPrimaryMetricLabel: PRIMARY_METRIC_LABEL,
    approvedPrimaryMetricLabelPresent: hasApprovedPrimaryMetricLabel(entries),
    auditedEntryCount: entries.length,
  };
}

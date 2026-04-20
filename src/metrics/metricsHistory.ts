import type { MetricsRecord } from "./formulas";
import { cloneMetricsRecord } from "./metricsStore";

export interface MetricsHistoryEntry extends MetricsRecord {
  tick: number;
}

export interface MetricsHistory {
  entries: MetricsHistoryEntry[];
}

export function createMetricsHistoryEntry(
  tick: number,
  metrics: MetricsRecord,
): MetricsHistoryEntry {
  return {
    tick,
    ...cloneMetricsRecord(metrics),
  };
}

export function cloneMetricsHistoryEntry(
  entry: MetricsHistoryEntry,
): MetricsHistoryEntry {
  return {
    ...entry,
  };
}

export function createMetricsHistory(
  entries: MetricsHistoryEntry[] = [],
): MetricsHistory {
  return {
    entries: entries.map(cloneMetricsHistoryEntry),
  };
}

export function appendMetricsHistory(
  history: MetricsHistory,
  entry: MetricsHistoryEntry,
): MetricsHistory {
  return {
    entries: [...history.entries.map(cloneMetricsHistoryEntry), cloneMetricsHistoryEntry(entry)],
  };
}

export function readMetricsHistory(history: MetricsHistory): MetricsHistoryEntry[] {
  return history.entries.map(cloneMetricsHistoryEntry);
}

export function getLatestMetricsHistoryEntry(
  history: MetricsHistory,
): MetricsHistoryEntry | null {
  const latest = history.entries[history.entries.length - 1];
  return latest ? cloneMetricsHistoryEntry(latest) : null;
}

export function cloneMetricsHistory(history: MetricsHistory): MetricsHistory {
  return createMetricsHistory(readMetricsHistory(history));
}

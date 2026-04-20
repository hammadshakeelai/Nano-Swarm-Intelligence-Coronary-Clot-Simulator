import type { MetricsRecord } from "./formulas";

export interface MetricsStore {
  current: MetricsRecord;
}

export function cloneMetricsRecord(record: MetricsRecord): MetricsRecord {
  return { ...record };
}

export function createMetricsStore(initial: MetricsRecord): MetricsStore {
  return {
    current: cloneMetricsRecord(initial),
  };
}

export function updateMetricsStore(
  _store: MetricsStore,
  next: MetricsRecord,
): MetricsStore {
  return {
    current: cloneMetricsRecord(next),
  };
}

export function readCurrentMetrics(store: MetricsStore): MetricsRecord {
  return cloneMetricsRecord(store.current);
}

export function cloneMetricsStore(store: MetricsStore): MetricsStore {
  return {
    current: readCurrentMetrics(store),
  };
}

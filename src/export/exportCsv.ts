import {
  readMetricsHistory,
  type MetricsHistory,
  type MetricsHistoryEntry,
} from "../metrics/metricsHistory";

export const METRICS_CSV_HEADER_COLUMNS = [
  "tick",
  "timeSec",
  "phase",
  "clotBurdenPct",
  "svpiPct",
  "localizationPct",
  "coordinationScore",
] as const;

export type MetricsCsvHeaderColumn =
  (typeof METRICS_CSV_HEADER_COLUMNS)[number];

function escapeCsvCell(value: string | number): string {
  const text = `${value}`;
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function formatMetricsHistoryEntry(entry: MetricsHistoryEntry): string {
  return [
    entry.tick,
    entry.timeSec.toFixed(3),
    entry.phase,
    entry.clotBurdenPct.toFixed(3),
    entry.svpiPct.toFixed(3),
    entry.localizationPct.toFixed(3),
    entry.coordinationScore.toFixed(3),
  ]
    .map(escapeCsvCell)
    .join(",");
}

function resolveMetricsHistoryEntries(
  history: MetricsHistory | MetricsHistoryEntry[],
): MetricsHistoryEntry[] {
  return Array.isArray(history) ? [...history] : readMetricsHistory(history);
}

export function exportMetricsHistoryCsv(
  history: MetricsHistory | MetricsHistoryEntry[],
): string {
  const entries = resolveMetricsHistoryEntries(history);
  const rows = [METRICS_CSV_HEADER_COLUMNS.join(",")];

  rows.push(...entries.map(formatMetricsHistoryEntry));

  return rows.join("\n");
}

export function createMetricsHistoryCsvBlob(
  history: MetricsHistory | MetricsHistoryEntry[],
): Blob {
  return new Blob([exportMetricsHistoryCsv(history)], {
    type: "text/csv;charset=utf-8",
  });
}

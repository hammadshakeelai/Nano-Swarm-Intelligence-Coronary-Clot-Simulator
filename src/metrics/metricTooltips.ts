import type { MetricRecordKey, MetricsRecord } from "./formulas";

export interface MetricDisplayDefinition {
  id: MetricRecordKey;
  label: string;
  tooltip: string;
}

export const METRIC_LABELS: Record<MetricRecordKey, string> = {
  timeSec: "Elapsed Sim Time",
  phase: "Phase",
  clotBurdenPct: "Clot Burden (%)",
  svpiPct: "Simulated Vessel Patency Index (%)",
  localizationPct: "Localization (%)",
  coordinationScore: "Coordination Score",
};

export const METRIC_TOOLTIPS: Record<MetricRecordKey, string> = {
  timeSec: "Simulation time since the educational run began.",
  phase: "Current named phase in the simulator's educational state flow.",
  clotBurdenPct: "Estimated fraction of the simulated clot still present.",
  svpiPct:
    "Educational index of how open the simulated vessel appears. Not a measured blood-flow value.",
  localizationPct:
    "Share of the visible swarm concentrated near the clot interaction zone.",
  coordinationScore:
    "Educational score for local swarm coherence near the target zone.",
};

export const PRIMARY_METRIC_LABEL = METRIC_LABELS.svpiPct;
export const PRIMARY_METRIC_TOOLTIP = METRIC_TOOLTIPS.svpiPct;

export const METRICS_STRIP_DEFINITIONS: readonly MetricDisplayDefinition[] = [
  {
    id: "clotBurdenPct",
    label: METRIC_LABELS.clotBurdenPct,
    tooltip: METRIC_TOOLTIPS.clotBurdenPct,
  },
  {
    id: "svpiPct",
    label: METRIC_LABELS.svpiPct,
    tooltip: METRIC_TOOLTIPS.svpiPct,
  },
  {
    id: "localizationPct",
    label: METRIC_LABELS.localizationPct,
    tooltip: METRIC_TOOLTIPS.localizationPct,
  },
  {
    id: "coordinationScore",
    label: METRIC_LABELS.coordinationScore,
    tooltip: METRIC_TOOLTIPS.coordinationScore,
  },
  {
    id: "timeSec",
    label: METRIC_LABELS.timeSec,
    tooltip: METRIC_TOOLTIPS.timeSec,
  },
] as const;

export function getMetricDefinition(
  id: keyof MetricsRecord,
): MetricDisplayDefinition | null {
  return (
    METRICS_STRIP_DEFINITIONS.find((definition) => definition.id === id) ?? null
  );
}

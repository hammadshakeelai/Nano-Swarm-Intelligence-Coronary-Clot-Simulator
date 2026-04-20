import {
  METRICS_STRIP_DEFINITIONS,
  type MetricDisplayDefinition,
} from "../../metrics/metricTooltips";

function getMetricCue(definition: MetricDisplayDefinition): string {
  switch (definition.id) {
    case "clotBurdenPct":
      return "Clot";
    case "svpiPct":
      return "Patency";
    case "localizationPct":
      return "Locate";
    case "coordinationScore":
      return "Coord";
    case "timeSec":
      return "Time";
    default:
      return "Metric";
  }
}

function renderMetricCard(
  definition: MetricDisplayDefinition,
  value = "--",
): string {
  return `
    <section class="metric-card" data-status-cue="${getMetricCue(definition)}" title="${definition.tooltip}">
      <span class="metric-label">${definition.label}</span>
      <strong class="metric-value" data-metric="${definition.id}">${value}</strong>
    </section>
  `;
}

export function buildMetricsStripMarkup(): string {
  return METRICS_STRIP_DEFINITIONS.map((definition) =>
    renderMetricCard(definition),
  ).join("");
}

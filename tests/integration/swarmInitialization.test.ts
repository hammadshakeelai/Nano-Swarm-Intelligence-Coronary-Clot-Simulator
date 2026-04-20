import { describe, expect, it } from "vitest";

import { CoronarySimulation, coronaryDefaultPreset } from "../../src/sim";

describe("swarm initialization integration", () => {
  it("exposes deterministic shared swarm state from the engine", () => {
    const simA = new CoronarySimulation(coronaryDefaultPreset);
    const simB = new CoronarySimulation(coronaryDefaultPreset);
    const renderA = simA.getRenderState();
    const renderB = simB.getRenderState();

    expect(renderA.swarmState).toEqual(renderB.swarmState);
    expect(renderA.agents).toEqual(renderA.swarmState?.agents);
    expect(renderA.agents).toHaveLength(
      coronaryDefaultPreset.swarm.visibleCount,
    );
  });

  it("keeps engine swarm updates deterministic over multiple steps", () => {
    const simA = new CoronarySimulation(coronaryDefaultPreset);
    const simB = new CoronarySimulation(coronaryDefaultPreset);

    for (let index = 0; index < 30; index += 1) {
      simA.step();
      simB.step();
    }

    expect(simA.getRenderState().swarmState).toEqual(
      simB.getRenderState().swarmState,
    );
  });
});

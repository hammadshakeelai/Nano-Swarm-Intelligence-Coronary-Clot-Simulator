import { describe, expect, it } from "vitest";

import {
  resolveOutcomeBranch,
  resolveSnapshotOutcome,
  shouldAdvanceToResults,
} from "../../src/sim/systems/outcomeResolver";

describe("outcome resolver", () => {
  it("selects success when clot burden reaches the success threshold", () => {
    expect(
      resolveOutcomeBranch({
        timeSec: 35,
        clotBurden: 0.08,
      }),
    ).toBe("success");
  });

  it("selects partial failure when time exceeds the branch deadline without success", () => {
    expect(
      resolveOutcomeBranch({
        timeSec: 42.1,
        clotBurden: 0.2,
      }),
    ).toBe("partial_failure");
  });

  it("advances success and partial-failure branches to results at the expected times", () => {
    expect(shouldAdvanceToResults("success", 36.1)).toBe(true);
    expect(shouldAdvanceToResults("partial_failure", 45.1)).toBe(true);
    expect(shouldAdvanceToResults("success", 35.9)).toBe(false);
  });

  it("resolves snapshot outcome safely from phase and clot state", () => {
    expect(
      resolveSnapshotOutcome("success", 35, { currentBurden: 0.07 }),
    ).toBe("success");
    expect(
      resolveSnapshotOutcome("partial_failure", 43, { currentBurden: 0.2 }),
    ).toBe("partial_failure");
    expect(
      resolveSnapshotOutcome("results", 46, { currentBurden: 0.2 }),
    ).toBe("partial_failure");
    expect(resolveSnapshotOutcome("navigation", 10, { currentBurden: 1 })).toBe(
      null,
    );
  });
});

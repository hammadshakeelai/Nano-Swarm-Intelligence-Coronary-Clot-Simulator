export class SimulationClock {
  private accumulator = 0;
  private readonly fixedStepSec: number;

  constructor(fixedStepSec = 1 / 30) {
    this.fixedStepSec = fixedStepSec;
  }

  consume(deltaSec: number): number {
    this.accumulator += deltaSec;
    let steps = 0;

    while (this.accumulator >= this.fixedStepSec) {
      this.accumulator -= this.fixedStepSec;
      steps += 1;
    }

    return steps;
  }

  get stepSec(): number {
    return this.fixedStepSec;
  }
}

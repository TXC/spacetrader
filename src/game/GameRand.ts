import { logStackTrace } from './ensure.ts';

export class GameRand {
  declare randHigh: number;
  declare randLow: number;
  declare _seed: number;
  declare _numInvocations: number;
  declare _logStackTrace: boolean;

  constructor(seed: number) {
    this.randHigh = seed;
    this.randLow = seed ^ 0x49616e42;

    // For debugging
    this._seed = seed;
    this._numInvocations = 0;
    this._logStackTrace = false;
  }

  // Return value >= min && value <= max
  randomInt(min: number, max: number) {
    if (this._logStackTrace) {
      logStackTrace();
    }

    this._numInvocations++;

    this.randHigh = ((this.randHigh << 16) + (this.randHigh >> 16) + this.randLow) & 0xffffffff;
    this.randLow = (this.randLow + this.randHigh) & 0xffffffff;
    // The largest value would make n exactly 1 and the result max + 1, once in four billion
    // draws. Using the next value down leaves every other draw as it was.
    const n = Math.min(this.randHigh >>> 0, 0xfffffffe) / 0xffffffff;
    return (min + n * (max - min + 1)) | 0;
  }

  randomIntBelow(max: number) {
    return this.randomInt(0, max - 1);
  }
}

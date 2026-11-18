// Measure code coverage of unit tests by sprinkling probes
export const PROBE_NEXT = 172; // Next unused probe value. `grep pLog . -r | sort -t '(' -k2,2n`
export class ProbeLog {
  declare probeLog: Set<number>;

  constructor() {
    this.probeLog = new Set();
  }

  log(probeNumber: number) {
    this.probeLog.add(probeNumber);
  }

  missingProbes() {
    const result = [];
    for (let i = 0; i < PROBE_NEXT; ++i) {
      if (!this.probeLog.has(i)) {
        result.push(i);
      }
    }

    return result;
  }

  summaryString() {
    const missing = this.missingProbes();
    const perc = Math.floor((this.probeLog.size / PROBE_NEXT) * 1000) / 10;

    const missingStr = missing.length > 0 ? `Missing: ${missing.join(',')}.` : 'Perfect!';
    return `Probe coverage: saw ${this.probeLog.size} / ${PROBE_NEXT} (${perc}%) probes. ${missingStr}`;
  }
}

export const pLog = new ProbeLog();

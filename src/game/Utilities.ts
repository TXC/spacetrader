import { AlertViewController } from './alerts.ts';
import { sanitizedElementID } from './elementId.ts';
import { runtime } from './runtime.ts';

export const DebugMode = {
  Disabled: 0,
  Alert: 1,
  Assert: 2,
} as const;
export type DebugMode = (typeof DebugMode)[keyof typeof DebugMode];

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

export const Utils = {
  symmetricDifference: function <T>(arr1: T[], arr2: T[]) {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    // Find elements in arr1 that are not in arr2
    const diff1 = arr1.filter(item => !set2.has(item));

    // Find elements in arr2 that are not in arr1
    const diff2 = arr2.filter(item => !set1.has(item));

    // Combine the differences
    return [...diff1, ...diff2];
  },

  // any: compares arbitrary values, walking whatever keys they have
  isEqualDeep: function (
    objA: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    objB: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    inequalityHandler?: (s: string) => void,
    keyName?: string
  ): boolean {
    const MAX_DEPTH = 30; // avoid infinite loop due to circular references

    if (!keyName) {
      keyName = 'toplevel';
    }

    if (keyName.split('.').length > MAX_DEPTH) {
      //inequalityHandler("Recursed too deep: " + keyName)
      //return false
      return true;
    }

    if (objA === objB) return true; // Same reference or both null or same primitive value
    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
      inequalityHandler!(`[${keyName}] basic equality ${objA} ; ${objB}`);
      return false;
    }
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) {
      const differentKeys = Utils.symmetricDifference(keysA, keysB);
      inequalityHandler!(
        `[${keyName}] keys length equality objA ${keysA.length} keys ; objB ${keysB.length} keys ; differing keys: ${differentKeys.join(',')}`
      );
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        inequalityHandler!(`[${keyName}] extra key: ` + key);
        return false;
      }

      if (!Utils.isEqualDeep(objA[key], objB[key], inequalityHandler, keyName + '.' + key)) {
        return false; // Recursive comparison for nested objects
      }
    }
    return true;
  },

  // Returns a sanitized id string
  sanitizedElementID,

  logStackTrace: function () {
    const stackTrace = new Error().stack;
    console.log('Log stack trace: ' + stackTrace);
    return stackTrace;
  },

  throwError: function (str: string) {
    throw 'Throw error: ' + str + '\n' + new Error().stack;
  },

  handleFatalError: function (str: string) {
    const stackTrace = Utils.logStackTrace();
    if (runtime.debugMode === DebugMode.Alert) {
      AlertViewController.presentAlertWithDismiss('DEBUG: ' + str + stackTrace);
    } else if (runtime.debugMode === DebugMode.Assert) {
      Utils.throwError(str);
    }
  },

  ensureInteger: function (n: unknown) {
    if (!Number.isInteger(n)) {
      Utils.handleFatalError('ensureInteger failed');
      return false;
    }
    return true;
  },

  ensureNumber: function (n: unknown) {
    if (isNaN(n as number)) {
      Utils.handleFatalError('ensureNumber failed');
      return false;
    }
    return true;
  },

  ensureType: function (b: unknown, typeStr: string) {
    if (b === null || typeof b !== typeStr) {
      Utils.handleFatalError(`ensureType ${typeStr} failed. Got this instead: ${b}`);
      return false;
    }
    return true;
  },

  ensureBool: function (b: unknown) {
    return Utils.ensureType(b, `boolean`);
  },

  ensureArrayOrNull: function (a: unknown, elementType: string) {
    if (a === null) {
      return true;
    }

    let valid = Array.isArray(a);
    if (valid) {
      for (const e of a as unknown[]) {
        if (typeof e !== elementType) {
          valid = false;
          break;
        }
      }
    }

    if (!valid) {
      Utils.handleFatalError('ensureArrayOrNull failed');
      return false;
    }

    return true;
  },

  ensureMapOrNull: function (a: unknown) {
    if (a === null) {
      return true;
    }

    const m = a as { set?: unknown; get?: unknown };
    if (typeof m.set === 'function' && typeof m.get === 'function') {
      return true;
    }

    Utils.handleFatalError('ensureMapOrNull failed');
    return false;
  },

  ensureObjectOrNull: function (o: unknown) {
    if (o === null) {
      return true;
    }
    return Utils.ensureType(o, 'object');
  },

  // Treat an array like an ordered set
  addToOrderedSet: function <T>(arr: T[], item: T) {
    if (!arr.includes(item)) {
      arr.push(item);
    }
  },

  // Commented out because I need to use GameRand to have deterministic behavior
  // Returns a random int less than upperBound
  //randomInt: function(upperBound) {
  //  return Math.floor(Math.random() * Math.floor(upperBound))
  //},

  // https://easings.net/#easeInOutCubic
  // proportionOfTimeElapsed ranges from 0 to 1
  easeInOutCubic: function (proportionOfTimeElapsed: number) {
    const x = proportionOfTimeElapsed;
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  },

  // https://easings.net/#easeInOutSine
  easeInOutSine: function (proportionOfTimeElapsed: number) {
    const x = proportionOfTimeElapsed;
    return -(Math.cos(Math.PI * x) - 1) / 2;
  },

  // Color utilities
};
Object.freeze(Utils);

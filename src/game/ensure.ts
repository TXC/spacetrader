// Checks on values the rules pass around. What a failed check does depends on the debug
// mode: nothing, an alert, or an exception (which is what the tests use).
import { AlertViewController } from './alerts.ts';
import { runtime } from './runtime.ts';

export const DebugMode = {
  Disabled: 0,
  Alert: 1,
  Assert: 2,
} as const;
export type DebugMode = (typeof DebugMode)[keyof typeof DebugMode];

export function logStackTrace() {
  const stackTrace = new Error().stack;
  console.log('Log stack trace: ' + stackTrace);
  return stackTrace;
}

function handleFatalError(str: string) {
  const stackTrace = logStackTrace();
  if (runtime.debugMode === DebugMode.Alert) {
    AlertViewController.presentAlertWithDismiss('DEBUG: ' + str + stackTrace);
  } else if (runtime.debugMode === DebugMode.Assert) {
    throw new Error('Throw error: ' + str);
  }
}

export function ensureInteger(n: unknown) {
  if (!Number.isInteger(n)) {
    handleFatalError('ensureInteger failed');
    return false;
  }
  return true;
}

export function ensureNumber(n: unknown) {
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    handleFatalError('ensureNumber failed');
    return false;
  }
  return true;
}

export function ensureType(b: unknown, typeStr: string) {
  if (b === null || typeof b !== typeStr) {
    handleFatalError(`ensureType ${typeStr} failed. Got this instead: ${b}`);
    return false;
  }
  return true;
}

export function ensureBool(b: unknown) {
  return ensureType(b, `boolean`);
}

export function ensureArrayOrNull(a: unknown, elementType: string) {
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
    handleFatalError('ensureArrayOrNull failed');
    return false;
  }

  return true;
}

export function ensureMapOrNull(a: unknown) {
  if (a === null) {
    return true;
  }

  const m = a as { set?: unknown; get?: unknown };
  if (typeof m.set === 'function' && typeof m.get === 'function') {
    return true;
  }

  handleFatalError('ensureMapOrNull failed');
  return false;
}

export function ensureObjectOrNull(o: unknown) {
  if (o === null) {
    return true;
  }
  return ensureType(o, 'object');
}

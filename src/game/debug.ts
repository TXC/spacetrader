// The debug mode the page runs in, and a way to log where a call came from.
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

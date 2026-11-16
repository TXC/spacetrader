import { useLayoutEffect } from 'react'
import { runtime } from '../game/runtime.ts'

// What the old register...EventListener calls did, for a React element: announce the id
// when the element appears, and record the step in the action log when it is used.
// `eventName` is what goes in the log; `detail` adds to it for sliders and dropdowns.
export function useLogged<E extends { nativeEvent: Event }>(
  id: string,
  eventName: string,
  handler: (event: E) => void,
  detail?: (event: E) => string,
) {
  useLayoutEffect(() => runtime.actionLog.register(id, eventName), [id, eventName])
  return (event: E) => {
    runtime.actionLog.record(id, detail ? `${eventName}|${detail(event)}` : eventName)
    handler(event)
  }
}

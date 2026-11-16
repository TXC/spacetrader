import { useEffect, useState } from 'react'
import { runtime } from '../game/runtime.ts'
import type { Session } from '../game/session.ts'
import { Cheats } from './Cheats.tsx'

// The action log as text, kept up to date as the player acts. Pasting it into a flow test
// replays the same game.
function useActionLog(): string {
  const [text, setText] = useState(() => runtime.actionLog.serializedString())
  useEffect(() => {
    const log = runtime.actionLog
    log.logUpdateHandler = (updated) => setText(updated.serializedString())
    return () => {
      log.logUpdateHandler = null
    }
  }, [])
  return text
}

// Shown below the game when the address ends in ?debug: the action log, a button to copy
// it, and the cheats.
export function DebugPanel({ session }: { session: Session }) {
  const log = useActionLog()
  return (
    <div id="debug">
      <button id="copyActionLog" onClick={() => void navigator.clipboard.writeText(log)}>Copy Action Log</button>
      <br /><br />
      <div id="cheats"><Cheats session={session} /></div>
      <div id="debugLog">{log}</div>
    </div>
  )
}

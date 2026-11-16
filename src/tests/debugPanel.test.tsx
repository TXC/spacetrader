import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { expect, test, vi } from 'vitest'
import { DebugMode } from '../game/Utilities.ts'
import { debugModeFor } from '../startSession.ts'
import { DebugPanel } from '../ui/DebugPanel.tsx'
import './flows/setup.ts'
import { runReplayLog } from './flows/harness.ts'

test('debug mode is on only when the address asks for it', () => {
  expect(debugModeFor('')).toBe(DebugMode.Disabled)
  expect(debugModeFor('?other=1')).toBe(DebugMode.Disabled)
  expect(debugModeFor('?debug')).toBe(DebugMode.Alert)
})

test('the debug panel shows the action log as it grows, and copies it', () => {
  const log = '{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733543535142}'
  const { session } = runReplayLog(log)
  document.getElementById('cheats')!.remove()
  const host = document.body.appendChild(document.createElement('div'))
  const root = createRoot(host)
  const copied = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
  flushSync(() => root.render(<DebugPanel session={session} />))

  host.querySelector<HTMLElement>('#cheat_freeMoney')!.click()

  expect(session.game!.commander.credits).toBe(1000000)
  const shown = host.querySelector('#debugLog')!.textContent!
  expect(JSON.parse(shown).idLog).toEqual(['createCommander', 'cheat_freeMoney'])

  host.querySelector<HTMLElement>('#copyActionLog')!.click()
  expect(copied).toHaveBeenCalledWith(shown)
  flushSync(() => root.unmount())
  host.remove()
  document.body.insertAdjacentHTML('beforeend', '<div id="cheats" class="hidden"></div>')
})

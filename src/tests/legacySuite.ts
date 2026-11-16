import { afterEach, beforeAll, test } from 'vitest'
import { runtime } from '../game/runtime.ts'
import { DebugMode } from '../game/Utilities.ts'
import { AlertViewController } from '../game/alerts.ts'
import { unmountAll } from './support/SpaceTraderGame.ts'
import { UnitTests } from './UnitTests.ts'

// Registers every old UnitTests method starting with `prefix` as a Vitest test,
// with the set-up and clean-up that old/unitTests.html did. Returns the names.
export function registerLegacyTests(prefix: string): string[] {
  const ut = new UnitTests() as unknown as Record<string, () => void>
  const names = Object.getOwnPropertyNames(UnitTests.prototype).filter((n) => n.startsWith(prefix))

  // An error thrown inside a click handler goes to the window, not to the test that clicked.
  // Keep it and fail that test, as old/unitTests.html did.
  let handlerError: unknown = null
  beforeAll(() => {
    document.body.insertAdjacentHTML('beforeend', '<div id="game"></div><div id="cheats" class="hidden"></div>')
    runtime.debugMode = DebugMode.Assert
    window.addEventListener('error', (event) => { handlerError ??= event.error ?? event.message })
  })
  afterEach(() => {
    unmountAll()
    document.getElementById('game')!.innerHTML = ''
    AlertViewController.clearAlerts()
    const error = handlerError
    handlerError = null
    if (error) throw error
  })
  for (const name of names) test(name, () => ut[name]())
  return names
}

import { afterEach, beforeAll, test } from 'vitest'
import { runtime } from '../game/runtime.ts'
import { MADebugMode } from '../game/Utilities.ts'
import { SSSTAlertViewController } from '../legacy-ui/AlertViewController.ts'
import '../legacy-ui/style.css'
import { UnitTests } from './UnitTests.ts'

// Registers every old UnitTests method starting with `prefix` as a Vitest test,
// with the set-up and clean-up that old/unitTests.html did. Returns the names.
export function registerLegacyTests(prefix: string): string[] {
  const ut = new UnitTests() as unknown as Record<string, () => void>
  const names = Object.getOwnPropertyNames(UnitTests.prototype).filter((n) => n.startsWith(prefix))

  beforeAll(() => {
    document.body.insertAdjacentHTML('beforeend', '<div id="game"></div><div id="cheats" class="hidden"></div>')
    runtime.debugMode = MADebugMode.Assert
  })
  afterEach(() => {
    document.getElementById('game')!.innerHTML = ''
    SSSTAlertViewController.clearAlerts()
  })
  for (const name of names) test(name, () => ut[name]())
  return names
}

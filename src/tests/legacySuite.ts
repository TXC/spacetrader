import { afterEach, beforeAll, test } from 'vitest'
import { runtime } from '../game/runtime.ts'
import { DebugMode } from '../game/Utilities.ts'
import { AlertViewController } from '../legacy-ui/AlertViewController.ts'
import '../legacy-ui/style.css'
import { UnitTests } from './UnitTests.ts'

// Registers every old UnitTests method starting with `prefix` as a Vitest test,
// with the set-up and clean-up that old/unitTests.html did. Returns the names.
export function registerLegacyTests(prefix: string): string[] {
  const ut = new UnitTests() as unknown as Record<string, () => void>
  const names = Object.getOwnPropertyNames(UnitTests.prototype).filter((n) => n.startsWith(prefix))

  beforeAll(() => {
    document.body.insertAdjacentHTML('beforeend', '<div id="game"></div><div id="cheats" class="hidden"></div>')
    runtime.debugMode = DebugMode.Assert
  })
  afterEach(() => {
    document.getElementById('game')!.innerHTML = ''
    AlertViewController.clearAlerts()
  })
  for (const name of names) test(name, () => ut[name]())
  return names
}

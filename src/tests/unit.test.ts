import { expect, test } from 'vitest'
import { runtime } from '../game/runtime.ts'
import { MockLocalStorage } from '../game/Utilities.ts'
import { SpaceTraderGame } from '../legacy-ui/main.ts'
import oldSave from './fixtures/old-save.json'
import { registerLegacyTests } from './legacySuite.ts'
import { getAssertionCount } from './UnitTests.ts'

const testNames = registerLegacyTests('test')

// Baseline measured by running old/unitTests.html before the conversion.
test('matches the baseline counts', () => {
  expect(testNames.length).toBe(153)
  expect(getAssertionCount()).toBe(3064)
})

test('a save written by the old code loads', () => {
  const storage = new MockLocalStorage()
  for (const [k, v] of Object.entries(oldSave)) storage.setItem(k, JSON.stringify(v))
  runtime.stLocalStorage = storage
  // main() sets viewController; the old screen code is untyped.
  const stG = new SpaceTraderGame(document.getElementById('game'), true) as SpaceTraderGame & {
    viewController: { _game: { commander: { name: string } } }
  }
  stG.main()
  expect(stG.viewController._game.commander.name).toBe('Jean-Luc')
  expect(document.getElementById('systemLandingDiv')).not.toBeNull()
})

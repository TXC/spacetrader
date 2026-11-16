import { expect, test } from 'vitest'
import { ATTACK_CAPTAIN_NEWS, DESTROY_CAPTAIN_NEWS, EncounterController, EncounterType } from '../game/EncounterController.ts'
import { GameRand } from '../game/GameRand.ts'
import { Opponent, OpponentType } from '../game/Opponent.ts'
import { ReputationScore } from '../game/Commander.ts'
import { runtime } from '../game/runtime.ts'
import { MockLocalStorage } from '../game/Utilities.ts'
import { SpaceTraderGame } from '../legacy-ui/main.ts'
import ahabEncounter from './fixtures/ahab-encounter.json'
import oldSave from './fixtures/old-save.json'
import { registerLegacyTests } from './legacySuite.ts'
import { cellAfter, hasText, rowAfterHeading, textOf } from './support/page.ts'
import { getAssertionCount, UnitTests } from './UnitTests.ts'

const testNames = registerLegacyTests('test')

// 153 tests as in old/unitTests.html. The assertion count was 3064 there; it is 3089 since the
// markup checks were rewritten to check text and structure.
test('matches the baseline counts', () => {
  expect(testNames.length).toBe(153)
  expect(getAssertionCount()).toBe(3089)
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

// The old code threw here: it used a name that never existed for the "Dangerous" reputation.
test('destroying a famous captain raises reputation to at least Dangerous', () => {
  // Replay a recorded game up to the meeting with Captain Ahab, in a well-armed ship.
  const replay = new UnitTests()._runReplayLog(JSON.stringify(ahabEncounter), undefined, undefined)
  const game = replay.spaceTraderGame.viewController._game
  runtime.gameRand = new GameRand(1)
  const before = game.commander.reputationScore

  const captain = Opponent.generateOpponentWithType(OpponentType.FamousCaptain, game)
  captain.ship.damageShieldsByAmount(100000)
  captain.ship.damageHullByAmount(100000)
  const encounter = new EncounterController(EncounterType.FamousCaptainAhabAttack, game, captain)
  // Choosing to attack a captain posts this news item; the kill then replaces it.
  game.addBreakingNewsItem(ATTACK_CAPTAIN_NEWS(encounter.type))
  encounter._executeAction(false, () => {})

  // Every kill also adds a bonus for the size of the destroyed ship.
  const killBonus = 1 + Math.floor(captain.ship.type / 2)
  expect(game.commander.reputationScore).toBe(Math.max(before + 100, ReputationScore.Dangerous) + killBonus)
  expect(game.breakingNews).toContain(DESTROY_CAPTAIN_NEWS(encounter.type))
})

function fixture(html: string): HTMLElement {
  const div = document.createElement('div')
  div.innerHTML = html
  document.body.appendChild(div)
  return div
}

test('textOf reads line breaks as new lines', () => {
  const div = fixture('a<br>b<br><br><h4>c</h4>')
  expect(textOf(div)).toBe('a\nb\n\nc')
  div.remove()
})

test('hasText matches the exact text of a matching element', () => {
  const div = fixture('<table><tr><td>5</td></tr></table>')
  expect(hasText(div, 'td', '5')).toBe(true)
  expect(hasText(div, 'td', '4')).toBe(false)
  div.remove()
})

test('cellAfter and rowAfterHeading find neighbouring table content', () => {
  const div = fixture('<table><tr><th>Picked</th></tr><tr><td><span>Furs</span></td><td>4</td></tr></table>')
  expect(cellAfter(div, 'Furs')).toBe('4')
  expect(cellAfter(div, 'Ore')).toBeNull()
  expect(textOf(rowAfterHeading('Picked')!)).toBe('Furs4')
  div.remove()
})

test('a replayed checkbox change reaches a React screen', () => {
  const log = '{"idLog":["createCommander","Bank"],"eventNameLog":["click","click"],"gameRandSeed":1733543535142}'
  const replay = new UnitTests()._runReplayLog(log, undefined, undefined)
  const game = replay.spaceTraderGame.viewController._game
  const before = game.remindLoans

  replay.replayEvent('remindLoansCheckbox', 'change')

  expect(game.remindLoans).toBe(!before)
  expect((document.getElementById('remindLoansCheckbox') as HTMLInputElement).checked).toBe(!before)
})

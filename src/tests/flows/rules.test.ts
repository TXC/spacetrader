// @ts-nocheck
// Flow tests: each replays a recorded play session by clicking the recorded elements, then
// checks what the player sees and what the game holds. Converted from the original
// project's UnitTests.js; the recordings and expected values are unchanged.
import { test } from 'vitest'
import { GameRand } from '../../game/GameRand.ts'
import { AccessoryType } from '../../game/Accessory.ts'
import { ActionLogger } from '../../game/ActionLogger.ts'
import { ATTACK_POLICE_SCORE, ATTACK_TRADER_SCORE, KILL_PIRATE_SCORE, PoliceRecordScore } from '../../game/Commander.ts'
import { Game, GameEndStatus, RareEvent } from '../../game/Game.ts'
import { PoliticsType } from '../../game/Politics.ts'
import { ShipModel, ShipModelType } from '../../game/Ship.ts'
import { Difficulty, ExperimentQuestStatus, InvasionQuestStatus, JaporiQuestStatus, JarekQuestStatus, MonsterQuestStatus, ReactorQuestStatus, ScarabQuestStatus, SpecialEvent, WildQuestStatus } from '../../game/SolarSystem.types.ts'
import { FABRIC_RIP_PROBABILITY_INITIAL } from '../../game/SpecialEventSpecifier.ts'
import { TechLevel, TradeItemType } from '../../game/TradeItem.types.ts'
import { Utils, MockLocalStorage, pLog } from '../../game/Utilities.ts'
import { runtime } from '../../game/runtime.ts'
import { AlertViewController } from '../../game/alerts.ts'
import { Session } from '../../game/session.ts'
import './setup.ts'
import { ActionLogReplay, assertEqual, assertEqualArrays, assertEqualDeep, assertEqualFloats, assertEqualGames, assertPixelColor, assertTrue, performStressTest, replaySkipEncounters, runReplayLog, serializeAndDeserialize, show } from './harness.ts'
import { cellAfter, hasText, rowAfterHeading, textOf } from '../support/page.ts'


// GameRand

test('randomInt', () => {
  let r = new GameRand(1)
  //              0  1  2  3  4  5  6  7  8  9 10 11
  let observed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let expected = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
  for (let i = 0; i < 100; ++i) {
    let v = r.randomInt(0, 10)
    observed[v] = 1
  }

  assertEqualArrays(observed, expected)
})

// Utils

test('addToOrderedSet', () => {
  let arr = [ShipModelType.Flea, ShipModelType.Firefly];
  Utils.addToOrderedSet(arr, ShipModelType.Flea)
  Utils.addToOrderedSet(arr, ShipModelType.Gnat)
  Utils.addToOrderedSet(arr, ShipModelType.Firefly)
  Utils.addToOrderedSet(arr, ShipModelType.Beetle)
  assertEqualArrays(arr, [ShipModelType.Flea, ShipModelType.Firefly, ShipModelType.Gnat, ShipModelType.Beetle])
})

// @ts-nocheck
// What the flow tests share: starting a game on the page, replaying a recording, and
// the checks. Loosely typed, as the tests are.
import { createElement } from 'react'
import { expect } from 'vitest'
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
import { activate, Session } from '../../game/session.ts'
import { Cheats } from '../../ui/Cheats.tsx'
import { Game as GameScreen } from '../../ui/Game.tsx'
import { ActionLogReplay } from '../support/ActionLogReplay.ts'
import { mountAlertHost } from '../support/mountAlertHost.tsx'
import { mountReact } from '../support/mountReact.ts'

export { ActionLogReplay }

// ---- putting a game on the page ---------------------------------------------------------

// One mounted screen per page element at a time.
const mounted = new Map()

function mount(container, element) {
  // shortcut: some recordings empty the element by hand between two games. React can no
  // longer remove what it drew there, so that screen is left behind; it watches a session
  // that is no longer in use. Upgrade if a test ever needs two live games at once.
  if (container.childNodes.length > 0) mounted.get(container)?.()
  mounted.set(container, mountReact(container, element))
}

// Removes everything the tests put on the page. Called between tests.
export function unmountAll() {
  for (const [container, unmount] of mounted) {
    if (container.childNodes.length > 0) unmount()
  }
  mounted.clear()
}

// Shows a session's game in the page's #game element, with the cheats in #cheats.
export function show(session) {
  activate(session)
  mountAlertHost()
  mount(document.getElementById('game'), createElement(GameScreen, { session }))
  session.start()
  const cheats = document.getElementById('cheats')
  if (runtime.debugMode && cheats) mount(cheats, createElement(Cheats, { session }))
}

// Starts a new game and replays a recording into it. Returns the replay; its `session`
// is the game's session.
export function runReplayLog(replayLog: string, hackHandler?, registerEventHandler?) {
  let gameDiv = document.getElementById("game")
  gameDiv.innerHTML = ''
  AlertViewController.clearAlerts()

  const randSeed = Date.now()
  runtime.gameRand = new GameRand(randSeed)
  runtime.actionLog = new ActionLogger(randSeed)
  runtime.stLocalStorage = new MockLocalStorage()

  if (registerEventHandler) {
    runtime.actionLog.registerEventHandler = registerEventHandler
  }

  const session = new Session()
  session.loadGame = false
  show(session)

  let replay = new ActionLogReplay(replayLog, session, hackHandler)
  replay.replay()

  return replay
}

export function replaySkipEncounters(replay, breakConditionFn /* optional */) {
  let loopCount = 0
  do {
    if (breakConditionFn && breakConditionFn()) {
      break
    }


    let buttons = [ "alertButton_Dismiss",
      "ecButton_Ignore",
      "ecButton_Submit",
      "ecButton_Auto_Flee" ]

    const session = replay.session
    const game = session.game
    if (game.commander.ship.hasIllegalGoods()) {
      buttons = buttons.filter(x => x !== "ecButton_Submit")
    }

    for (let buttonID of buttons) {
      const el = document.getElementById(buttonID)
      if (el) {
        replay.replayEvent(buttonID, "click")
        break
      }
    }

    const systemInfoHeader = document.getElementById('system-info-welcome')
    if (systemInfoHeader) {
      break
    }

    loopCount++
  } while (loopCount < 100)
  assertTrue(loopCount < 100, "Exceeded auto action loop limit")
}

export function serializeAndDeserialize(game) {
  const gsJSONStr = JSON.stringify(game.serializedState())
  const gs = JSON.parse(gsJSONStr)

  const game2 = Game.fromSerializedState(gs)

  return game2
}

export function performStressTest(testName, randSeed, initialLog, numActionsToPerform, avoidGalacticChart, prioritizeBlastOff) {
  // Use a deterministic random number generator that is not the one used by the game (so I can take a log that hit an issue and replay it in index.html)
  const testRand = new GameRand(randSeed)

  // Hook into runtime.actionLog to remember the id of every element registered
  let seenElementIDs = []
  let seenEventNames = []
  const registerEventHandler = (elementID, eventName) => {
    seenElementIDs.push(elementID)
    seenEventNames.push(eventName)
  }

  // Create a game
  const replay = runReplayLog(initialLog, null, registerEventHandler)


  let galacticChartConsecutiveActions = 0

  let i = 0;
  for (i = 0; i < numActionsToPerform; ++i) {
    // Look up every known registered element id in the document
    const liveElementIDs = []
    const liveEventNames = []
    for (let j = 0; j < seenElementIDs.length; ++j) {
      // Prune the ones that are no longer present
      if (document.getElementById(seenElementIDs[j])) {
        liveElementIDs.push(seenElementIDs[j])
        liveEventNames.push(seenEventNames[j])
      }
    }
    seenElementIDs = liveElementIDs
    seenEventNames = liveEventNames


    // Filter element id list down to choose an action to perform: remove cheats, filter everything else if there is an alert shown
    const eligibleElementIDs = []
    const eligibleEventNames = []

    for (let j = 0; j < liveElementIDs.length; ++j) {
      const eID = liveElementIDs[j]
      const eName = liveEventNames[j]

      // Remove cheats
      let shouldFilter = eID.startsWith("cheat_")

      // Remove the end game button
      shouldFilter = shouldFilter || eID === "giveup"

      // If an alert is shown, require that the user acts on it
      const alertEls = document.getElementsByClassName("alert-backdrop")
      const alertElement = alertEls ? alertEls[0] : null
      if (alertElement) {
        const thisEl = document.getElementById(eID)
        shouldFilter = shouldFilter || !alertElement.contains(thisEl)
      }

      // Avoid getting stuck on galactic chart
      if (avoidGalacticChart && galacticChartConsecutiveActions > 2) {
        shouldFilter = shouldFilter || eID.startsWith("galacticChart")
      }

      if (!shouldFilter) {
        eligibleElementIDs.push(eID)
        eligibleEventNames.push(eName)
      }
    }

    // Pick an action, execute it
    let chosenElementID = "warpBlastOff"
    let chosenEventName = "click"
    let pickBlastOff = prioritizeBlastOff && eligibleElementIDs.includes("warpBlastOff") && testRand.randomIntBelow(2) == 1
    if (!pickBlastOff) {
      chosenElementID = "Warp"
      chosenEventName = "click"
      pickBlastOff = prioritizeBlastOff && eligibleElementIDs.includes("Warp") && testRand.randomIntBelow(10) == 1
    }

    if (!pickBlastOff) {
      const chosenIndex = testRand.randomIntBelow(eligibleElementIDs.length)
      chosenElementID = eligibleElementIDs[chosenIndex]
      chosenEventName = eligibleEventNames[chosenIndex]
    }

    // Cash infusion so the test doesn't get stuck with no money for long
    if (i > 0 && i % 800 === 0) {
      chosenElementID = "cheat_freeMoney"
      chosenEventName = "click"
    }

    replay.replayEvent(chosenElementID, chosenEventName)

    if (chosenElementID.startsWith("galacticChart")) {
      galacticChartConsecutiveActions++
    } else {
      galacticChartConsecutiveActions = 0
    }

    // Periodically ensure that serializing/deserializing the game results in an identical game
    if (i > 0 && i % 30 === 0) {
      const session = replay.session
      const game = session.game
      if (game) {
        pLog.log(101)
        let game2 = serializeAndDeserialize(game)
        assertEqualGames(game, game2)
      }
    }
  }

  console.log(`==== Stress test ${testName} completed with ${i} / ${numActionsToPerform} actions ==== \n` + runtime.actionLog.serializedString())
}

// ---- checks -----------------------------------------------------------------------------

export function assertTrue(condition, message) {
  expect(Boolean(condition), message).toBe(true)
}

// Strict equality, as `===`.
export function assertEqual(actual, expected) {
  if (actual !== expected) expect(actual).toBe(expected)
}

export function assertEqualArrays(actual, expected) {
  expect(Array.isArray(actual) && Array.isArray(expected), 'both are arrays').toBe(true)
  expect(actual).toStrictEqual(expected)
}

export function assertEqualFloats(actual, expected, tolerance = 0) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

export function assertEqualDeep(actual, expected) {
  let difference = ''
  const equal = Utils.isEqualDeep(actual, expected, (found) => { difference = found })
  expect(equal, difference).toBe(true)
}

export function assertEqualGames(game1, game2) {
    // Deserialized games don't have a saveBlock. Ignore this property for the purpose of asserting equal.
    const game1SaveBlock = game1._saveBlock
    game1._saveBlock = null

    const game2SaveBlock = game2._saveBlock
    game2._saveBlock = null

    // Cheat-related properties won't be serialized
    const game1ShowSpecialSystems = game1.showSpecialSystems
    delete game1.showSpecialSystems
    const game2ShowSpecialSystems = game2.showSpecialSystems
    delete game2.showSpecialSystems

    const game1ForceRareEvent = game1.forceRareEvent
    delete game1.forceRareEvent
    const game2ForceRareEvent = game2.forceRareEvent
    delete game2.forceRareEvent


    assertEqualDeep(game1, game2)


    game1._saveBlock = game1SaveBlock
    game2._saveBlock = game2SaveBlock

    if (game1ShowSpecialSystems !== undefined) {
      game1.showSpecialSystems = game1ShowSpecialSystems
    }
    if (game2ShowSpecialSystems !== undefined) {
      game2.showSpecialSystems = game2ShowSpecialSystems
    }

    if (game1ForceRareEvent !== undefined) {
      game1.forceRareEvent = game1ForceRareEvent
    }
    if (game2ForceRareEvent !== undefined) {
      game2.forceRareEvent = game2ForceRareEvent
    }
}


export function assertPixelColor(ctx, x, y, color) {
  const data = ctx.getImageData(x, y, 1, 1).data
  assertEqual(Utils.rgbToHex(data[0], data[1], data[2]), color)
}

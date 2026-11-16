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


test('HPView_updates', () => {
  const replayLog = `{"idLog":["createCommander","Commander","ignorePolice","ignorePirates","ignoreTraders","ignoreTradeInOrbit","Bank","borrow__500","Warp","warpNext","warpNext","warpNext","warpNext","warpNext","warpNext","warpNext","warpNext","namedEvent","warpBlastOff","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_No","Ship Yard","fulltank","Warp","warpNext","warpNext","warpNext","cargo_OreBuy_All","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_WaterBuy_All","warpBlastOff","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Ok__I_won_t_","ecButton_Submit","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_WaterSell_All","cargo_FoodSell_All","cargo_OreSell_All","Ship Yard","fulltank","Full_repair","Warp","warpNext","togglePrices_Show_Absolute","togglePrices_Show_Relative","togglePrices_Show_Absolute","togglePrices_Show_Relative","warpNext","warpNext","cargo_FirearmsBuy_All","cargo_MedicineBuy_All","warpBlastOff","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_FirearmsSell_All","Warp","fulltank","Ship Yard","Full_repair","Special","alertButton_No","Sell","Warp","warpNext","Bank","Warp","warpNext","warpNext","cargo_OreBuy_All","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_WaterBuy_All","warpBlastOff","ecButton_Submit","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_OreSell_All","Warp","fulltank","Ship Yard","Full_repair","Bank","borrow__409","Warp","warpNext","warpNext","warpNext","togglePrices_Show_Absolute","togglePrices_Show_Relative","cargo_FirearmsBuy_All","cargo_MedicineBuy_All","warpBlastOff","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_FirearmsSell_All","Ship Yard","fulltank","Full_repair","autoFuelCheckbox","autoRepairCheckbox","Warp","warpNext","warpNext","warpNext","cargo_OreBuy_All","Bank","pay__1000","Sell","Warp","warpBlastOff","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_OreSell_All","Ship Yard","Warp","warpNext","cargo_FirearmsBuy_All","cargo_NarcoticsBuy_All","cargo_MedicineBuy_All","warpBlastOff","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_FirearmsSell_All","cargo_NarcoticsSell_All","cargo_MedicineSell_All","Warp","warpNext","warpNext","warpNext","cargo_OreBuy_All","cargo_FoodBuy_All","warpBlastOff","ecButton_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_FoodSell_All","cargo_OreSell_All","Warp","warpNext","warpNext","warpNext","cargo_FirearmsBuy_All","cargo_NarcoticsBuy_All","cargo_MedicineBuy_All","warpBlastOff","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss"],"eventNameLog":["click","click","change","change","change","change","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tantalos","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732919193563}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  let encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 10 clicks from Tantalos you encounter a pirate Gnat.\n\nYour opponent attacks.")

  const hpBarWidthBefore = document.getElementById(`battle-hpBar-self`).style.width

  replay.replayEvent("ecButton_Flee", "click")

  encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 10 clicks from Tantalos you encounter a pirate Gnat.\n\nYour opponent attacks.\nThe pirate ship missed you.\nThe pirate ship is still following you.")

  const hpBarWidthAfter = document.getElementById(`battle-hpBar-self`).style.width

  assertEqual(hpBarWidthBefore, hpBarWidthAfter)
})

test('giveUp', () => {
  const replayLog = `{"idLog":["createCommander","Commander","giveup","alertButton_Abandon_game"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732590998247}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const endMessage = document.getElementById('end-message').innerText
  assertEqual(endMessage.startsWith("You achieved a score"), true)
  assertTrue(document.getElementById('endgame') !== null, "end game button shows")

  replay.replayEvent("endgame", "click")
  replay.replayEvent("trader", "slider|input|6")
  replay.replayEvent("createCommander", "click")

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Rutia")

  const commander = session.game.commander
  assertEqual(commander.trader, 6)
})

test('dieStartOver', () => {
  const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Attack","alertButton_Attack","ecButton_Auto_Attack","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click"],"gameRandSeed":1732591429497}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const endMessage = document.getElementById('end-message').innerText
  assertEqual(endMessage.startsWith("You achieved a score"), true)
  assertTrue(document.getElementById('endgame') !== null, "end game button shows")

  replay.replayEvent("endgame", "click")
  replay.replayEvent("trader", "slider|input|6")
  replay.replayEvent("createCommander", "click")

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Tantalos")

  const commander = session.game.commander
  assertEqual(commander.trader, 6)

  let highScoringGames = JSON.parse(runtime.stLocalStorage.getItem('highScoringGames')) || {}
  assertEqual(Object.keys(highScoringGames).length, 1)

  replay.replayEvent("Commander", "click")
  replay.replayEvent("showhighscores", "click")
  replay.replayEvent("clearall", "click")
  replay.replayEvent("alertButton_Cancel", "click")

  highScoringGames = JSON.parse(runtime.stLocalStorage.getItem('highScoringGames')) || {}
  assertEqual(Object.keys(highScoringGames).length, 1)

  assertEqual(textOf("highscores"), "Jean-Luc was killed after 1 day, worth $8382 on Normal level. Score: 0.9%.")

  replay.replayEvent("clearall", "click")
  replay.replayEvent("alertButton_Clear_all", "click")

  highScoringGames = JSON.parse(runtime.stLocalStorage.getItem('highScoringGames')) || {}
  assertEqual(Object.keys(highScoringGames).length, 0)

  assertEqual(textOf("highscores"), "None on record")
})

test('autoRepairs_autoFuel', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.credits, 999867)
  assertEqual(commander.ship.hullPercentage(), 1)
  assertEqual(commander.ship.fuel, 14)
})

test('manualRepairs', () => {
  const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732357186711}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.credits, 1000)

  assertEqual(commander.ship.hull, 47)

  replay.replayEvent("Buy_1_repair", "click")

  assertEqual(commander.ship.hull, 48)
  assertEqual(commander.credits, 999)

  replay.replayEvent("5_repairs", "click")

  assertEqual(commander.ship.hull, 53)
  assertEqual(commander.credits, 994)

  replay.replayEvent("Full_repair", "click")

  assertEqual(commander.ship.hull, 100)
  assertEqual(commander.credits, 947)
})

test('manualFuel', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","Warp","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.credits, 1000000)

  assertEqual(commander.ship.fuel, 6)

  replay.replayEvent("buy1unit", "click")

  assertEqual(commander.ship.fuel, 7)
  assertEqual(commander.credits, 1000000 - 2*1)

  replay.replayEvent("buy5units", "click")

  assertEqual(commander.ship.fuel, 12)
  assertEqual(commander.credits, 1000000 - 2*1 - 2*5)

  replay.replayEvent("fulltank", "click")

  assertEqual(commander.ship.fuel, 14)
  assertEqual(commander.credits, 1000000 - 16)
})

test('manualNews', () => {
  const replayLog = `{"idLog":["createCommander","News"],"eventNameLog":["click","click"],"gameRandSeed":1732358737231}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.credits, 1000)

  replay.replayEvent("News", "click")

  assertEqual(commander.credits, 1000)

  let newsStrDiv = document.getElementById('newsStrDiv')
  const expectedNews = "The People's Voice\nCollector in Aldea System Seeks to Purchase Tribbles.\n\nEvidence Suggests Severe Drought in the Rubicum System."
  assertTrue(textOf(newsStrDiv) !== expectedNews, "news not visible yet")

  replay.replayEvent("purchaseNews", "click")

  assertEqual(commander.credits, 997)

  newsStrDiv = document.getElementById('newsStrDiv')
  assertEqual(textOf(newsStrDiv), expectedNews)

  replay.replayEvent("Warp", "click")

  newsStrDiv = document.getElementById('newsStrDiv')
  assertEqual(newsStrDiv, null)

  replay.replayEvent("News", "click")

  assertEqual(commander.credits, 997)

  newsStrDiv = document.getElementById('newsStrDiv')
  assertEqual(textOf(newsStrDiv), expectedNews)
})

test('autoNews', () => {
  const replayLog = `{"idLog":["createCommander","News","autoNewsCheckbox","Sell"],"eventNameLog":["click","click","change","click"],"gameRandSeed":1732358737231}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.credits, 1000)

  replay.replayEvent("News", "click")

  assertEqual(commander.credits, 997)

  let newsStrDiv = document.getElementById('newsStrDiv')
  assertTrue(hasText(newsStrDiv, "h4", "The People's Voice"), "masthead is a heading")
  assertEqual(textOf(newsStrDiv), "The People's Voice\nCollector in Aldea System Seeks to Purchase Tribbles.\n\nEvidence Suggests Severe Drought in the Rubicum System.")

  replay.replayEvent("Warp", "click")

  newsStrDiv = document.getElementById('newsStrDiv')
  assertEqual(newsStrDiv, null)

  replay.replayEvent("News", "click")

  assertEqual(commander.credits, 997)

  newsStrDiv = document.getElementById('newsStrDiv')
  assertTrue(hasText(newsStrDiv, "h4", "The People's Voice"), "masthead is a heading")
  assertEqual(textOf(newsStrDiv), "The People's Voice\nCollector in Aldea System Seeks to Purchase Tribbles.\n\nEvidence Suggests Severe Drought in the Rubicum System.")
})

test('buyShip_debt_upgrade', () => {
  const replayLog = `{"idLog":["createCommander","Bank","borrow__500","Buy","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","cargo_FursSell_All","cargo_FoodSell_All","namedEvent","Buy","cargo_WaterBuy_All","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_FoodBuy_All","cargo_FursBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Equipment","Ship Yard","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Special","alertButton_No","Ship Yard","fulltank","Buy","cargo_MedicineBuy_All","Sell","cargo_MedicineSell_All","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Buy","cargo_GamesBuy_All","Sell","cargo_GamesSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Bank","Ship Yard","buyship_Flea","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Laertes","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Festen","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732872096993}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.credits, 6057)
  assertEqual(ShipModel.shipModelForType(commander.ship.type).name, "Flea")

  replay.replayEvent("cheat_freeMoney", "click")
  replay.replayEvent("Ship Yard", "click")
  replay.replayEvent("buyship_Gnat", "click")

  assertEqual(AlertViewController.currentAlertTitle(), "Before you can buy a new ship or new equipment, you must settle your debts at the bank.")

  replay.replayEvent("alertButton_Dismiss", "click")
  replay.replayEvent("Bank", "click")
  replay.replayEvent("pay__500", "click")

  replay.replayEvent("Ship Yard", "click")
  replay.replayEvent("buyship_Gnat", "click")
  replay.replayEvent("alertButton_Yes", "click")

  assertEqual(commander.credits, 991500)
  assertEqual(ShipModel.shipModelForType(commander.ship.type).name, "Gnat")
})

test('buyShip_debt_downgrade', () => {
  const replayLog = `{"idLog":["createCommander","Bank","borrow__500","Buy","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","cargo_FursSell_All","cargo_FoodSell_All","namedEvent","Buy","cargo_WaterBuy_All","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_FoodBuy_All","cargo_FursBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Equipment","Ship Yard","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Special","alertButton_No","Ship Yard","fulltank","Buy","cargo_MedicineBuy_All","Sell","cargo_MedicineSell_All","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Buy","cargo_GamesBuy_All","Sell","cargo_GamesSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Bank","Ship Yard","buyship_Flea","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Laertes","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Festen","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732872096993}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.credits, 6057)
  assertEqual(ShipModel.shipModelForType(commander.ship.type).name, "Flea")
})

test('escapePod', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","Ship Yard","buy_escape_pod","alertButton_Yes","Warp","warpBlastOff","ecButton_Auto_Attack","alertButton_Attack","ecButton_Auto_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732415003637}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.credits, 997500)
  assertEqual(commander.currentSystem.name, "Lowry")
  assertEqual(ShipModel.shipModelForType(commander.ship.type).name, "Flea")
})

test('autoFlee_withImmediate', () => {
  const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","pilot","createCommander","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss"],"eventNameLog":["slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","click","click","click","click","click","click"],"gameRandSeed":1734495546137}`

  // This auto-flee was immediate ^

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  let encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 13 clicks from Guinifer you encounter a police Hornet.\n\nIt ignores you.")

  replaySkipEncounters(replay)

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Guinifer")
})

test('autoFlee_noImmediates', () => {
  const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","engineer","engineer","engineer","engineer","createCommander","Warp","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734495811559}`

  // ^ this was not immediate

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  let encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 8 clicks from Kaylon you encounter a trader Bumblebee.\n\nIt ignores you.")

  replaySkipEncounters(replay)

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Kaylon")
})

test('autoAttack', () => {
  const replayLog = `{"idLog":["createCommander","namedEvent","cheat_freeMoney","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes"],"eventNameLog":["click","selectPlanetZoomed|Vadera","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733023531445}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  replay.replayEvent("Warp", "click")
  replay.replayEvent("warpBlastOff", "click")
  replay.replayEvent("ecButton_Ignore", "click")


  let encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 17 clicks from Capelle you encounter a police Mosquito.\n\nThe police summon you to submit to an inspection.")

  replay.replayEvent("ecButton_Auto_Attack", "click")
  replay.replayEvent("alertButton_Attack", "click")
  replay.replayEvent("alertButton_Attack", "click")
  replay.replayEvent("ecButton_Auto_Attack", "click")
  assertEqual(AlertViewController.currentAlertTitle(), "You have destroyed your opponent.")
  replay.replayEvent("alertButton_Dismiss", "click")

  encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 14 clicks from Capelle you encounter a pirate Hornet.\n\nYour opponent attacks.")

  replay.replayEvent("ecButton_Auto_Flee", "click")
  replay.replayEvent("alertButton_Dismiss", "click")

  encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 6 clicks from Capelle you encounter a trader Firefly.\n\nIt ignores you.")

  replay.replayEvent("ecButton_Auto_Attack", "click")
  // Opponent escapes
  replay.replayEvent("alertButton_Dismiss", "click")

  encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 1 click from Capelle you encounter a trader Gnat.\n\nIt ignores you.")

  replay.replayEvent("ecButton_Auto_Attack", "click")
  // They surrender and offer to let me plunder
  replay.replayEvent("ecButton_Auto_Attack", "click")
  // They surrender and offer to let me plunder
  replay.replayEvent("ecButton_Auto_Attack", "click")
  // Destroyed
  replay.replayEvent("alertButton_Dismiss", "click")
  replay.replayEvent("alertButton_Pick_it_up_", "click")

  replay.replayEvent("alertButton_Dismiss", "click")

  let systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Capelle")

  replay.replayEvent("Ship Yard", "click")
  replay.replayEvent("fulltank", "click")
  replay.replayEvent("Full_repair", "click")

  replay.replayEvent("Warp", "click")
  replay.replayEvent("warpBlastOff", "click")

  replay.replayEvent("ecButton_Ignore", "click")
  replay.replayEvent("alertButton_Dismiss", "click")

  replay.replayEvent("Warp", "click")
  replay.replayEvent("warpBlastOff", "click")

  replay.replayEvent("ecButton_Auto_Flee", "click")
  replay.replayEvent("alertButton_Dismiss", "click")

  replay.replayEvent("ecButton_Ignore", "click")

  replay.replayEvent("ecButton_Auto_Attack", "click")
  // Escaped
  replay.replayEvent("alertButton_Dismiss", "click")

  replay.replayEvent("ecButton_Ignore", "click")
  replay.replayEvent("ecButton_Auto_Flee", "click")
  replay.replayEvent("alertButton_Dismiss", "click")
  replay.replayEvent("ecButton_Ignore", "click")

  replay.replayEvent("ecButton_Auto_Attack", "click")
  // Escaped
  replay.replayEvent("alertButton_Dismiss", "click")


  // Arrived at destination
  replay.replayEvent("alertButton_Dismiss", "click")

  systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Gemulon")

  assertEqual(commander.policeKills, 1)
  assertEqual(commander.pirateKills, 0)
  assertEqual(commander.traderKills, 1)
})

test('hireMercenary_fireMercenary', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","autoFuelCheckbox","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","Warp","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Bumblebee","alertButton_Yes"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Triacus","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734496062815}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  const creditsBefore = commander.credits
  assertEqual(creditsBefore, 950389)
  assertEqual(commander.ship.crew.length, 0)

  replay.replayEvent("Ship Yard")
  replay.replayEvent("autoFuelCheckbox", "change")
  replay.replayEvent("autoRepairCheckbox", "change")

  replay.replayEvent("For Hire", "click")
  replay.replayEvent("hireFire_Milete", "click")
  const sysName = commander.currentSystem.name
  const mercenaryPrice = 69

  assertEqual(commander.ship.crew.length, 1)

  replay.replayEvent("Commander", "click")
  replay.replayEvent("ignorePirates", "change")
  replay.replayEvent("ignorePolice", "change")
  replay.replayEvent("ignoreTraders", "change")
  replay.replayEvent("ignoreTradeInOrbit", "change")
  replay.replayEvent("Warp", "click")
  replay.replayEvent("warpBlastOff", "click")

  replaySkipEncounters(replay)

  assertEqual(commander.credits, creditsBefore - mercenaryPrice)

  replay.replayEvent("Ship Yard", "click")
  replay.replayEvent("fulltank", "click")
  replay.replayEvent("Full_repair", "click")

  replay.replayEvent("Warp", "click")
  replay.replayEvent("namedEvent", "selectPlanetZoomed|" + sysName)
  replay.replayEvent("warpBlastOff", "click")

  replaySkipEncounters(replay)

  assertEqual(document.getElementById("For Hire"), null)

  // Go to roster, fire him
  replay.replayEvent("Roster", "click")
  replay.replayEvent("hireFire_Milete", "click")

  // for hire button should appear
  assertTrue(document.getElementById("For Hire") !== null, "For hire button reappears")
  const roster = document.getElementById("Roster")
  assertEqual(roster.classList.contains('active'), true)
})

test('mercenary_arrest', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","autoFuelCheckbox","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","Warp","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Bumblebee","alertButton_Yes"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Triacus","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734496062815}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const game = session.game
  const commander = session.game.commander

  const creditsBefore = commander.credits
  assertEqual(creditsBefore, 950389)
  assertEqual(commander.ship.crew.length, 0)

  replay.replayEvent("Ship Yard")
  replay.replayEvent("autoFuelCheckbox", "change")
  replay.replayEvent("autoRepairCheckbox", "change")

  replay.replayEvent("For Hire", "click")
  replay.replayEvent("hireFire_Milete", "click")
  const sysName = commander.currentSystem.name
  const mercenaryPrice = 69

  assertEqual(commander.ship.crew.length, 1)

  replay.replayEvent("Warp", "click")
  replay.replayEvent("warpBlastOff", "click")

  replay.replayEvent("ecButton_Auto_Flee")
  replay.replayEvent("alertButton_Dismiss")
  replay.replayEvent("ecButton_Auto_Flee")
  replay.replayEvent("alertButton_Dismiss")

  replay.replayEvent("ecButton_Attack")
  replay.replayEvent("alertButton_Attack")
  replay.replayEvent("ecButton_Surrender")
  replay.replayEvent("alertButton_Surrender")

  assertEqual(AlertViewController.currentAlertTitle(), "You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $328500.\nYour hired mercenaries have left.")

  replay.replayEvent("alertButton_Dismiss")

  assertEqual(commander.ship.crew.length, 0)

  let game2 = serializeAndDeserialize(game)
  assertEqualGames(game, game2)
  assertEqual(game2.commander.ship.crew.length, 0)
})

test('tradeInOrbit_buy_selectedValue', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Trade","alertButton_Selected"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

  const replay = runReplayLog(replayLog)
  const session = replay.session
  const commander = session.game.commander

  const creditsBeforeTrade = commander.credits

  const alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

  // Disable automatically purchasing fuel since there's no opportunity
  // to check credits after trade but before arrival in this situation
  session.game.autoFuel = false
  session.game.autoRepairs = false

  replay.replayEvent("alertButton_Dismiss", "click")

  const tradeQuantity = 7
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Ore), tradeQuantity)

  const price = 350
  assertEqual(commander.credits, creditsBeforeTrade - tradeQuantity*price)
})

test('tradeInOrbit_buy_all', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Trade","alertButton_All"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

  const replay = runReplayLog(replayLog)
  const session = replay.session
  const commander = session.game.commander

  const creditsBeforeTrade = commander.credits

  const alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

  // Disable automatically purchasing fuel since there's no opportunity
  // to check credits after trade but before arrival in this situation
  session.game.autoFuel = false
  session.game.autoRepairs = false

  replay.replayEvent("alertButton_Dismiss", "click")

  const tradeQuantity = 14
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Ore), tradeQuantity)

  const price = 350
  assertEqual(commander.credits, creditsBeforeTrade - tradeQuantity*price)
})

test('tradeInOrbit_buy_none', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Trade","alertButton_None"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

  const replay = runReplayLog(replayLog)
  const session = replay.session
  const commander = session.game.commander

  const creditsBeforeTrade = commander.credits

  const alertTitleEl = document.getElementById("alertvc-title")
  assertTrue(!alertTitleEl, "no alert showing")

  const tradeQuantity = 0
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Ore), tradeQuantity)

  const price = 350
  assertEqual(commander.credits, creditsBeforeTrade - tradeQuantity*price)
})

test('tradeInOrbit_sell_selectedValue', () => {
  const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","pilot","createCommander","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePirates","ignorePolice","Warp","cargo_WaterBuy_1","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","warpBlastOff","ecButton_Submit","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Trade","alertButton_Selected"],"eventNameLog":["slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","click","click","click","change","change","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734497194511}`

  const replay = runReplayLog(replayLog)
  const session = replay.session
  const commander = session.game.commander

  const creditsBeforeTrade = commander.credits

  const alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

  // Disable automatically purchasing fuel since there's no opportunity
  // to check credits after trade but before arrival in this situation
  session.game.autoFuel = false
  session.game.autoRepairs = false

  replay.replayEvent("alertButton_Dismiss", "click")

  const tradeQuantity = 1
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 3-tradeQuantity)

  assertEqual(commander.credits, creditsBeforeTrade + tradeQuantity*280)
})

test('tradeInOrbit_actionLogCanUpdateSlider', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Trade","tradeslider","alertButton_Selected"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","slider|input|8","click"],"gameRandSeed":1734494396218}`

  const replay = runReplayLog(replayLog)
  const session = replay.session
  const commander = session.game.commander

  const creditsBeforeTrade = commander.credits

  const alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

  // Disable automatically purchasing fuel since there's no opportunity
  // to check credits after trade but before arrival in this situation
  session.game.autoFuel = false

  replay.replayEvent("alertButton_Dismiss", "click")

  const tradeQuantity = 8
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Ore), tradeQuantity)

  assertEqual(commander.credits, creditsBeforeTrade - tradeQuantity*350)
})

test('tradeInOrbit_sell_all', () => {
  const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","pilot","createCommander","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePirates","ignorePolice","Warp","cargo_WaterBuy_1","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","warpBlastOff","ecButton_Submit","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Trade","alertButton_All"],"eventNameLog":["slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","click","click","click","change","change","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734497194511}`

  const replay = runReplayLog(replayLog)
  const session = replay.session
  const commander = session.game.commander

  const creditsBeforeTrade = commander.credits

  const alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

  // Disable automatically purchasing fuel since there's no opportunity
  // to check credits after trade but before arrival in this situation
  session.game.autoFuel = false

  replay.replayEvent("alertButton_Dismiss", "click")

  const tradeQuantity = 3
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 3-tradeQuantity)

  assertEqual(commander.credits, creditsBeforeTrade + tradeQuantity*280)
})

test('tradeInOrbit_sell_none', () => {
  const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","pilot","createCommander","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePirates","ignorePolice","Warp","cargo_WaterBuy_1","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","warpBlastOff","ecButton_Submit","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Trade","alertButton_None"],"eventNameLog":["slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","click","click","click","change","change","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734497194511}`

  const replay = runReplayLog(replayLog)
  const session = replay.session
  const commander = session.game.commander

  const creditsBeforeTrade = commander.credits

  // Disable automatically purchasing fuel since there's no opportunity
  // to check credits after trade but before arrival in this situation
  session.game.autoFuel = false
  session.game.autoRepairs = false

  const tradeQuantity = 0
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 3-tradeQuantity)

  assertEqual(commander.credits, creditsBeforeTrade)
  const alertTitleEl = document.getElementById("alertvc-title")
  assertTrue(!alertTitleEl, "no alert showing")
})

test('destroy_pirate_bounty_bug', () => {
  const replayLog = `{"idLog":["createCommander","namedEvent","cheat_freeMoney","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","Commander","ignoreTradeInOrbit","ignoreTraders","ignorePolice","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","namedEvent","warpBlastOff","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Attack","ecButton_Auto_Attack","ecButton_Plunder","cargo_WaterPlunder_1","alertButton__Plunder_plunderDone","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack"],"eventNameLog":["click","selectPlanetZoomed|Vadera","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","change","click","change","change","click","click","selectPlanetZoomed|Courteney","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","selectPlanetZoomed|Penthara","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zalkon","click","click","selectPlanetZoomed|Odet","click","click"],"gameRandSeed":1733023531445}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(AlertViewController.currentAlertTitle(), "You earned a bounty of $350.")
})

test('destroy_pirate_pick_up_canister', () => {
  const replayLog = `{"idLog":["createCommander","namedEvent","cheat_freeMoney","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePolice","ignoreTraders","ignoreTradeInOrbit","Warp"],"eventNameLog":["click","selectPlanetZoomed|Vadera","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","change","change","change","click"],"gameRandSeed":1733023531445}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.pirateKills, 0)

  replay.replayEvent("namedEvent", "selectPlanetZoomed|Ligon")
  replay.replayEvent("warpBlastOff", "click")

  replay.replayEvent("ecButton_Auto_Attack", "click")
  replay.replayEvent("alertButton_Dismiss", "click")
  replay.replayEvent("alertButton_Dismiss", "click")


  replay.replayEvent("Warp", "click")
  replay.replayEvent("warpBlastOff", "click")

  const policeRecordBefore = commander.policeRecordScore
  const reputationBefore = commander.reputationScore

  let encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 12 clicks from Capelle you encounter a pirate Hornet.\n\nYour opponent attacks.")

  replay.replayEvent("ecButton_Auto_Attack", "click")
  // Offer to plunder
  replay.replayEvent("ecButton_Auto_Attack", "click")

  assertEqual(AlertViewController.currentAlertTitle(), "You earned a bounty of $650.")
  replay.replayEvent("alertButton_Dismiss", "click")

  assertEqual(commander.policeRecordScore, policeRecordBefore+KILL_PIRATE_SCORE)

  encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 8 clicks from Capelle you encounter a pirate Bumblebee.\n\nYour opponent attacks.")


  replay.replayEvent("ecButton_Auto_Attack", "click")
  // Offer to plunder
  replay.replayEvent("ecButton_Auto_Attack", "click")

  assertEqual(AlertViewController.currentAlertTitle(), "You earned a bounty of $600.")
  replay.replayEvent("alertButton_Dismiss", "click")

  const before = commander.ship.tradeItemQuantityForType(TradeItemType.Furs)
  let alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "A canister from the destroyed ship, labelled Furs, drifts within range of your scoops.")

  replay.replayEvent("alertButton_Pick_it_up_", "click")

  const after = commander.ship.tradeItemQuantityForType(TradeItemType.Furs)
  assertEqual(before+1, after)

  assertEqual(commander.policeRecordScore, policeRecordBefore+2*KILL_PIRATE_SCORE)
  assertEqual(commander.pirateKills, 2)
  assertEqual(commander.reputationScore, reputationBefore + 1 + Math.floor(ShipModelType.Hornet/2) + 1 + Math.floor(ShipModelType.Bumblebee/2))

  replay.replayEvent("alertButton_Dismiss", "click")

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Capelle")
})

test('destroy_pirate_let_go_canister', () => {
  const replayLog = `{"idLog":["createCommander","namedEvent","cheat_freeMoney","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePolice","ignoreTraders","ignoreTradeInOrbit","Warp"],"eventNameLog":["click","selectPlanetZoomed|Vadera","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","change","change","change","click"],"gameRandSeed":1733023531445}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const commander = session.game.commander

  assertEqual(commander.pirateKills, 0)

  replay.replayEvent("namedEvent", "selectPlanetZoomed|Ligon")
  replay.replayEvent("warpBlastOff", "click")

  replay.replayEvent("ecButton_Auto_Attack", "click")
  replay.replayEvent("alertButton_Dismiss", "click")
  replay.replayEvent("alertButton_Dismiss", "click")


  replay.replayEvent("Warp", "click")
  replay.replayEvent("warpBlastOff", "click")

  const policeRecordBefore = commander.policeRecordScore
  const reputationBefore = commander.reputationScore

  let encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 12 clicks from Capelle you encounter a pirate Hornet.\n\nYour opponent attacks.")

  replay.replayEvent("ecButton_Auto_Attack", "click")
  // Offer to plunder
  replay.replayEvent("ecButton_Auto_Attack", "click")

  assertEqual(AlertViewController.currentAlertTitle(), "You earned a bounty of $650.")
  replay.replayEvent("alertButton_Dismiss", "click")

  assertEqual(commander.policeRecordScore, policeRecordBefore+KILL_PIRATE_SCORE)

  encounterText = textOf('eVC_dialog')
  assertEqual(encounterText, "At 8 clicks from Capelle you encounter a pirate Bumblebee.\n\nYour opponent attacks.")


  replay.replayEvent("ecButton_Auto_Attack", "click")
  // Offer to plunder
  replay.replayEvent("ecButton_Auto_Attack", "click")

  assertEqual(AlertViewController.currentAlertTitle(), "You earned a bounty of $600.")
  replay.replayEvent("alertButton_Dismiss", "click")

  const before = commander.ship.tradeItemQuantityForType(TradeItemType.Furs)
  let alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "A canister from the destroyed ship, labelled Furs, drifts within range of your scoops.")

  replay.replayEvent("alertButton_Let_it_go", "click")

  const after = commander.ship.tradeItemQuantityForType(TradeItemType.Furs)
  assertEqual(before, after)

  assertEqual(commander.policeRecordScore, policeRecordBefore+2*KILL_PIRATE_SCORE)
  assertEqual(commander.pirateKills, 2)
  assertEqual(commander.reputationScore, reputationBefore + 1 + Math.floor(ShipModelType.Hornet/2) + 1 + Math.floor(ShipModelType.Bumblebee/2))

  replay.replayEvent("alertButton_Dismiss", "click")

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Capelle")
})

test('plunder_dump_litter_nevermind', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","galacticChart_track_121_Andevian","galacticChart_track_121_Andevian","galacticChart_useSingularity_121_Andevian","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Commander","ignorePolice","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669532436}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const game = session.game

  assertEqual(game.commander.litterWarning, false)
  replay.replayEvent("ecButton_Plunder", "click")
  replay.replayEvent("cargo_FursPlunder_1", "click")

  // Erase police record so we get warned about littering
  game.commander.policeRecordScore = PoliceRecordScore.Clean;

  replay.replayEvent("alertButton__Plunder_plunderDump_some_cargo", "click")
  replay.replayEvent("cargo_FursDump_1", "click")

  let alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "Dumping cargo in space is considered littering. If the police track your dumped goods to you it will be reflected on your criminal record. Do you really wish to dump?")

  assertEqual(game.commander.litterWarning, true)

  replay.replayEvent("alertButton_Nevermind_", "click")
  replay.replayEvent("alertButton__Plunder_dumpResume_plundering", "click")
  replay.replayEvent("alertButton__Plunder_plunderDone", "click")


  assertEqual(game.commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 1)
})

test('plunder_dump_litter_yes', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","galacticChart_track_121_Andevian","galacticChart_track_121_Andevian","galacticChart_useSingularity_121_Andevian","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Commander","ignorePolice","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669532436}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const game = session.game
  const commander = game.commander

  replay.replayEvent("ecButton_Plunder", "click")

  // Erase police record so we get warned about littering
  game.commander.policeRecordScore = PoliceRecordScore.Clean;

  let customViewEl = document.getElementById("alertvc-customView-Plunder_plunder")
  assertEqual(cellAfter(customViewEl, "Furs"), "5")

  replay.replayEvent("cargo_FursPlunder_1", "click")

  customViewEl = document.getElementById("alertvc-customView-Plunder_plunder")
  assertEqual(cellAfter(customViewEl, "Furs"), "4")

  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 1)

  replay.replayEvent("alertButton__Plunder_plunderDump_some_cargo", "click")

  assertEqual(commander.litterWarning, false)

  game.difficulty = 10 // force us to lose the die roll about getting caught littering by the police

  replay.replayEvent("cargo_FursDump_1", "click")

  let alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "Dumping cargo in space is considered littering. If the police track your dumped goods to you it will be reflected on your criminal record. Do you really wish to dump?")

  assertEqual(commander.litterWarning, true)

  replay.replayEvent("alertButton_Yes__I_still_want_to", "click")


  customViewEl = document.getElementById("alertvc-customView-Plunder_dump")
  assertEqual(cellAfter(customViewEl, "Furs"), "0")


  replay.replayEvent("alertButton__Plunder_dumpResume_plundering", "click")
  replay.replayEvent("alertButton__Plunder_plunderDone", "click")


  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 0)

  assertEqual(game.breakingNews[0], `Police Trace Orbiting Space Litter to ${commander.name}.`)
})

test('plunder_keep', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","galacticChart_track_121_Andevian","galacticChart_track_121_Andevian","galacticChart_useSingularity_121_Andevian","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Commander","ignorePolice","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669532436}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const game = session.game
  const commander = game.commander

  replay.replayEvent("ecButton_Plunder", "click")

  // Erase police record so we get warned about littering
  game.commander.policeRecordScore = PoliceRecordScore.Clean;

  let customViewEl = document.getElementById("alertvc-customView-Plunder_plunder")
  assertEqual(cellAfter(customViewEl, "Furs"), "5")

  replay.replayEvent("cargo_FursPlunder_1", "click")

  customViewEl = document.getElementById("alertvc-customView-Plunder_plunder")
  assertEqual(cellAfter(customViewEl, "Furs"), "4")

  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 1)

  replay.replayEvent("alertButton__Plunder_plunderDone", "click")

  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 1)
})

test('surrender_pirate_noCargo', () => {
  const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Surrender"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1734497580510}`

  const replay = runReplayLog(replayLog)

  const session = replay.session
  const commander = session.game.commander

  const netWorthBefore = commander.netWorth()
  replay.replayEvent("ecButton_Surrender", "click")

  assertEqual(AlertViewController.currentAlertTitle(), "The pirates are upset that they found no cargo on your ship. To save yourself, you have no choice but to pay them 5% of your current net worth.")

  replay.replayEvent("alertButton_Dismiss", "click")

  assertEqual(commander.netWorth(), netWorthBefore - Math.max(500, Math.floor(netWorthBefore/20)))
})

test('surrender_pirate_cargo', () => {
  const replayLog = `{"idLog":["createCommander","Buy","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_OreBuy_1","cargo_OreBuy_1","cargo_FoodBuy_1","Commander","Chart","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732440726896}`

  const replay = runReplayLog(replayLog)

  const session = replay.session
  const commander = session.game.commander

  const creditsBefore = commander.credits
  replay.replayEvent("ecButton_Surrender", "click")

  assertEqual(AlertViewController.currentAlertTitle(), "The pirates board your ship and transfer as much of your cargo to their own ship as their cargo bays can hold.")

  replay.replayEvent("alertButton_Dismiss", "click")

  assertEqual(commander.credits, creditsBefore)
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Water), 0)
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 0)
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Food), 0)
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Ore), 0)
})

test('surrender_police', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Bank","Buy_Insurance_Policy","alertButton_Dismiss","Ship Yard","buy_escape_pod","alertButton_Yes","Bank","Buy_Insurance_Policy","Warp","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","Ship Yard","fulltank","Warp","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734514049593}`

  const replay = runReplayLog(replayLog)

  const session = replay.session
  const game = session.game

  assertEqual(game.commander.hasInsurance, true)

  let game2 = serializeAndDeserialize(game)
  assertEqualGames(game, game2)
  assertEqual(game2.commander.hasInsurance, true)

  const creditsBefore = game.commander.credits
  replay.replayEvent("ecButton_Surrender", "click")
  replay.replayEvent("alertButton_Surrender", "click")

  assertEqual(AlertViewController.currentAlertTitle(), "You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $332000.\nSince you can't pay your insurance while you're in prison, your insurance contract has been voided.")

  replay.replayEvent("alertButton_Dismiss", "click")

  assertEqual(game.commander.credits, creditsBefore-332000)
  assertEqual(game.commander.hasInsurance, false)

  game2 = serializeAndDeserialize(game)
  assertEqualGames(game, game2)
  assertEqual(game2.commander.credits, creditsBefore-332000)
  assertEqual(game2.commander.hasInsurance, false)

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Rutia")
})

test('surrender_police_cantAffordFine', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Bank","Buy_Insurance_Policy","alertButton_Dismiss","Ship Yard","buy_escape_pod","alertButton_Yes","Bank","Buy_Insurance_Policy","Warp","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","Warp","fulltank","cargo_WaterBuy_1","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734514049593}`

  const replay = runReplayLog(replayLog)

  const session = replay.session
  const commander = session.game.commander

  // Make it so we can't afford fine
  commander.credits = 100

  const creditsBefore = commander.credits
  replay.replayEvent("ecButton_Surrender", "click")
  replay.replayEvent("alertButton_Surrender", "click")

  assertEqual(AlertViewController.currentAlertTitle(), "You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $3000.\nSince you can't pay your insurance while you're in prison, your insurance contract has been voided.\nTo pay your fine, your ship had to be sold at auction. The police have given you a second-hand Flea so you can continue your travels.")

  replay.replayEvent("alertButton_Dismiss", "click")

  assertEqual(commander.credits, 5958)
  assertEqual(commander.hasInsurance, false)

  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Water), 2)
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 3)
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Food), 4)

  assertEqual(commander.ship.gadgets.length, 0)

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Rutia")
})

test('insurance', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Ship Yard","buy_escape_pod","alertButton_Yes","Bank","Buy_Insurance_Policy","Warp","warpBlastOff","ecButton_Auto_Attack","alertButton_Attack","ecButton_Auto_Attack","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734745362815}`

  const replay = runReplayLog(replayLog)

  const session = replay.session
  const game = session.game

  assertEqual(AlertViewController.currentAlertTitle(), `Since your ship was insured, the bank pays you $7374, the total value of the destroyed ship.`);

  replay.replayEvent("alertButton_Dismiss")
  replay.replayEvent("alertButton_Dismiss")

  // starting credits - escape pod cost - 1 day of insurance cost + insurance reward - cost of converting escape pod to flea
  assertEqual(game.commander.credits, 1000000 - 2000 - 18 + 7374 - 500)
})

test('escapePod_debt', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Ship Yard","buy_escape_pod","alertButton_Yes","Bank","Warp","warpBlastOff","ecButton_Auto_Attack","alertButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734745362815}`

  const replay = runReplayLog(replayLog)

  const session = replay.session
  const game = session.game

  game.commander.credits = 5

  replay.replayEvent("ecButton_Auto_Attack")
  replay.replayEvent("alertButton_Dismiss")
  replay.replayEvent("alertButton_Dismiss")

  assertEqual(game.commander.credits, 0)
  assertEqual(game.commander.debt, 500 - 5)
})

test('systemLanding_showForHire', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","autoFuelCheckbox","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","Warp","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Bumblebee","alertButton_Yes"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Triacus","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734496062815}`

  const replay = runReplayLog(replayLog)

  const session = replay.session

  const tableRows = session.rows()
  assertEqual(tableRows.includes("For Hire"), true)
})

test('systemLanding_hideForHire', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","autoFuelCheckbox","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","Warp","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Bumblebee","alertButton_Yes"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Triacus","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734496062815}`

  const replay = runReplayLog(replayLog)

  const session = replay.session

  replay.replayEvent("Warp")
  replay.replayEvent("warpBlastOff")

  replaySkipEncounters(replay)

  const tableRows = session.rows()
  assertEqual(tableRows.includes("For Hire"), false)
})

test('galaxyView_selectWarpTarget', () => {
  const replayLog = `{"idLog":["createCommander","Chart","namedEvent","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanet|Mintaka","click","selectPlanetZoomed|Deneb"],"gameRandSeed":1729657624152}`

  const replay = runReplayLog(replayLog)

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Deneb")
})

test('galaxyView_selectWarpTarget_multipleTimes', () => {
  const replayLog = `{"idLog":["createCommander","Chart","namedEvent","Warp","namedEvent","namedEvent","namedEvent","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Mintaka","click","selectPlanetZoomed|Deneb","selectPlanetZoomed|Campor","selectPlanetZoomed|Thera","selectPlanetZoomed|Penthara"],"gameRandSeed":1729657624152}`

  const replay = runReplayLog(replayLog)

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Penthara")
})

test('galaxyView_systemLanding_selectWarpTarget', () => {
  const replayLog = `{"idLog":["createCommander","namedEvent"],"eventNameLog":["click","selectPlanetZoomed|Acamar"],"gameRandSeed":1730259230075}`

  const replay = runReplayLog(replayLog)

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Acamar")

  const session = replay.session
  assertEqual(session.selection.system.name, "Acamar")
  assertEqual(session.map.selectedSystem.name, "Acamar")
  assertTrue(document.getElementById("Warp").classList.contains("active"))
})

test('galaxyView_systemLanding_showsSystemInfo', () => {
  const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734670179065}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Helena")
  let systemInfoEl = document.getElementById('system-info-text')
  assertEqual(systemInfoEl.innerText, "small post-industrial dictatorship\nravaged by a plague\nnothing special, moderate police, many pirates")

  let galaxyInfoEl = document.getElementById('gv-system-info')
  assertTrue(!galaxyInfoEl, "no galaxy info")


  replay.replayEvent("namedEvent", "selectPlanetZoomed|Xerxes")

  systemInfoEl = document.getElementById('system-info-text')
  assertTrue(!systemInfoEl, "system info el disappeared")

  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "small early industrial confederacy\nunder no particular pressure\nspecial herbs, moderate police, some pirates")


  replay.replayEvent("namedEvent", "selectPlanetZoomed|Ligon")
  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "system details unknown")
})

test('galaxyView_systemLanding_showsSystemInfo_warpTab', () => {
  const replayLog = `{"idLog":["difficultySelect","createCommander","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","fulltank"],"eventNameLog":["select|change|1","click","click","selectPlanetZoomed|Castor","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734668502562}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  let galaxyInfoEl = document.getElementById('gv-system-info')
  assertTrue(!galaxyInfoEl, "no galaxy info")

  const systemInfoEl = document.getElementById('system-info-text')
  assertTrue(!systemInfoEl, "system info el disappeared")

  replay.replayEvent("Warp", "click")

  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "system details unknown")

  replay.replayEvent("warpPrev", "click")

  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "system details unknown")


  replay.replayEvent("warpPrev", "click")

  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "small renaissance feudal state\nunder no particular pressure\nwarlike populace, minimal police, abundant pirates")
})

test('galaxyView_systemLanding_showsSystemInfo_warpTab_lowFuel', () => {
  const replayLog = `{"idLog":["difficultySelect","createCommander","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["select|change|1","click","click","selectPlanetZoomed|Castor","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734668502562}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  replay.replayEvent("Warp", "click")

  let galaxyInfoEl = document.getElementById('gv-system-info')
  assertTrue(!galaxyInfoEl, "no galaxy info")

  const systemInfoEl = document.getElementById('system-info-text')
  assertTrue(!systemInfoEl, "system info el disappeared")

  replay.replayEvent("fulltank", "click")

  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "system details unknown")

  replay.replayEvent("warpNext", "click")

  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "small renaissance feudal state\nunder no particular pressure\nwarlike populace, minimal police, abundant pirates")

  replay.replayEvent("warpNext", "click")

  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "system details unknown")


  replay.replayEvent("warpNext", "click")

  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "system details unknown")


  replay.replayEvent("warpNext", "click")

  galaxyInfoEl = document.getElementById('gv-system-info')
  assertEqual(galaxyInfoEl.innerText, "small renaissance feudal state\nunder no particular pressure\nwarlike populace, minimal police, abundant pirates")
})

test('galaxyView_systemLanding_showsSystemInfo_warpTab_lowFuel_buyFromShipYard', () => {
  const replayLog = `{"idLog":["difficultySelect","createCommander","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["select|change|1","click","click","selectPlanetZoomed|Castor","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734668502562}`

  const replay = runReplayLog(replayLog)
  const session = replay.session

  replay.replayEvent("Warp", "click")

  let galaxyInfoEl = document.getElementById('gv-system-info')
  assertTrue(!galaxyInfoEl, "no galaxy info")

  const systemInfoEl = document.getElementById('system-info-text')
  assertTrue(!systemInfoEl, "system info el disappeared")

  assertEqual(session.map.selectedSystem.name, "Castor")

  replay.replayEvent("Ship Yard", "click")

  replay.replayEvent("fulltank", "click")

  replay.replayEvent("Warp", "click")

  assertEqual(session.map.selectedSystem.name, "Cestus")
})

test('galaxyView_systemLanding_selectSecondWarpTarget', () => {
  const replayLog = `{"idLog":["createCommander","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Acamar"],"gameRandSeed":1730277200899}`

  const replay = runReplayLog(replayLog)

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Acamar")

  const session = replay.session
  assertEqual(session.selection.system.name, "Acamar")
  assertEqual(session.map.selectedSystem.name, "Acamar")
  assertTrue(document.getElementById("Warp").classList.contains("active"))
})

test('galaxyView_systemLanding_cycleAllWarpSystems_includingWormhole_next', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Chart","cheat_freeSingularity","Ship Yard","Chart","namedEvent","galacticChart_useSingularity_1_Campor","alertButton_Warp_","ecButton_Ignore","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Warp"],"eventNameLog":["click","click","change","change","click","click","click","click","selectPlanet|Campor","click","click","click","click","selectPlanetZoomed|Styris","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734686840048}`

  const replay = runReplayLog(replayLog)

  const session = replay.session

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Mordan")
  assertEqual(session.selection.system.name, "Styris")
  assertEqual(session.selection.wormhole, true)
  assertEqual(session.map.selectedSystem.name, "Styris")
  assertEqual(session.map.selectedWormhole, true)
  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Mordan")
  assertEqual(session.map.selectedPlanet.isWormhole, true)


  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Campor")
  assertEqual(session.selection.system.name, "Campor")
  assertEqual(session.selection.wormhole, false)
  assertEqual(session.map.selectedSystem.name, "Campor")
  assertEqual(session.map.selectedWormhole, false)
  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Campor")
  assertEqual(session.map.selectedPlanet.isWormhole, false)


  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Hulst")
  assertEqual(session.selection.system.name, "Hulst")
  assertEqual(session.selection.wormhole, false)
  assertEqual(session.map.selectedSystem.name, "Hulst")
  assertEqual(session.map.selectedWormhole, false)
  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Hulst")
  assertEqual(session.map.selectedPlanet.isWormhole, false)


  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Melina")
  assertEqual(session.selection.system.name, "Melina")
  assertEqual(session.selection.wormhole, false)
  assertEqual(session.map.selectedSystem.name, "Melina")
  assertEqual(session.map.selectedWormhole, false)
  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Melina")
  assertEqual(session.map.selectedPlanet.isWormhole, false)


  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Rhymus")
  assertEqual(session.selection.system.name, "Rhymus")
  assertEqual(session.selection.wormhole, false)
  assertEqual(session.map.selectedSystem.name, "Rhymus")
  assertEqual(session.map.selectedWormhole, false)
  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Rhymus")
  assertEqual(session.map.selectedPlanet.isWormhole, false)


  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Sigma")
  assertEqual(session.selection.system.name, "Sigma")
  assertEqual(session.selection.wormhole, false)
  assertEqual(session.map.selectedSystem.name, "Sigma")
  assertEqual(session.map.selectedWormhole, false)
  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Sigma")
  assertEqual(session.map.selectedPlanet.isWormhole, false)


  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Thera")
  assertEqual(session.selection.system.name, "Thera")
  assertEqual(session.selection.wormhole, false)
  assertEqual(session.map.selectedSystem.name, "Thera")
  assertEqual(session.map.selectedWormhole, false)
  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Thera")
  assertEqual(session.map.selectedPlanet.isWormhole, false)


  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Mordan")
  assertEqual(session.selection.system.name, "Styris")
  assertEqual(session.selection.wormhole, true)
  assertEqual(session.map.selectedSystem.name, "Styris")
  assertEqual(session.map.selectedWormhole, true)
  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Mordan")
  assertEqual(session.map.selectedPlanet.isWormhole, true)
})

test('galaxyView_systemLanding_cycleAllWarpSystems_next', () => {
  const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1730277328255}`

  const replay = runReplayLog(replayLog)

  const session = replay.session

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Vadera")

  assertEqual(session.selection.system.name, "Vadera")
  assertEqual(session.map.selectedSystem.name, "Vadera")

  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Courteney")
  assertEqual(session.selection.system.name, "Courteney")
  assertEqual(session.map.selectedSystem.name, "Courteney")

  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Hulst")
  assertEqual(session.selection.system.name, "Hulst")
  assertEqual(session.map.selectedSystem.name, "Hulst")

  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Vadera")
  assertEqual(session.selection.system.name, "Vadera")
  assertEqual(session.map.selectedSystem.name, "Vadera")

  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Courteney")
  assertEqual(session.selection.system.name, "Courteney")
  assertEqual(session.map.selectedSystem.name, "Courteney")

  replay.replayEvent("warpPrev", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Vadera")
  assertEqual(session.selection.system.name, "Vadera")
  assertEqual(session.map.selectedSystem.name, "Vadera")
})

test('galaxyView_systemLanding_cycleAllWarpSystems_prev', () => {
  const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1730277328255}`

  const replay = runReplayLog(replayLog)

  const session = replay.session

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Vadera")

  assertEqual(session.selection.system.name, "Vadera")
  assertEqual(session.map.selectedSystem.name, "Vadera")

  replay.replayEvent("warpPrev", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Hulst")
  assertEqual(session.selection.system.name, "Hulst")
  assertEqual(session.map.selectedSystem.name, "Hulst")

  replay.replayEvent("warpPrev", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Courteney")
  assertEqual(session.selection.system.name, "Courteney")
  assertEqual(session.map.selectedSystem.name, "Courteney")

  replay.replayEvent("warpPrev", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Vadera")
  assertEqual(session.selection.system.name, "Vadera")
  assertEqual(session.map.selectedSystem.name, "Vadera")

  replay.replayEvent("warpPrev", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Hulst")
  assertEqual(session.selection.system.name, "Hulst")
  assertEqual(session.map.selectedSystem.name, "Hulst")

  replay.replayEvent("warpNext", "click")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Vadera")
  assertEqual(session.selection.system.name, "Vadera")
  assertEqual(session.map.selectedSystem.name, "Vadera")
})

test('galaxyView_systemLanding_selectWarpTarget_outOfRange', () => {
  const replayLog = `{"idLog":["createCommander","namedEvent"],"eventNameLog":["click","selectPlanetZoomed|Tantalos"],"gameRandSeed":1730259708834}`

  const replay = runReplayLog(replayLog)

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton, null)

  const session = replay.session
  assertEqual(session.selection.system.name, "Tantalos")
  assertEqual(session.map.selectedSystem.name, "Tantalos")
  assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")
  assertEqual(document.getElementById("warpMessage").textContent, "Out of range.")
})

test('galaxyView_systemLanding_selectWarpTarget_wormhole_outOfRange', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Chart","cheat_freeSingularity","Ship Yard","Chart","namedEvent","galacticChart_useSingularity_1_Campor","alertButton_Warp_","ecButton_Ignore","alertButton_Dismiss","namedEvent"],"eventNameLog":["click","click","change","change","click","click","click","click","selectPlanet|Campor","click","click","click","click","selectPlanetZoomed|Styris~wormhole"],"gameRandSeed":1734686840048}`

  const replay = runReplayLog(replayLog)

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton, null)

  const session = replay.session
  assertEqual(session.selection.system.name, "Styris")
  assertEqual(session.selection.wormhole, true)
  assertEqual(session.map.selectedSystem.name, "Styris")
  assertEqual(session.map.selectedWormhole, true)
  assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")
  assertEqual(document.getElementById("warpMessage").textContent, "Out of range.")

  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Mordan")
  assertEqual(session.map.selectedPlanet.isWormhole, true)
})

test('galaxyView_systemLanding_selectWarpTarget_wormholeParent_inRange', () => {
  const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Chart","cheat_freeSingularity","Ship Yard","Chart","namedEvent","galacticChart_useSingularity_1_Campor","alertButton_Warp_","ecButton_Ignore","alertButton_Dismiss","namedEvent"],"eventNameLog":["click","click","change","change","click","click","click","click","selectPlanet|Campor","click","click","click","click","selectPlanetZoomed|Styris"],"gameRandSeed":1734686840048}`
  const replay = runReplayLog(replayLog)

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Styris")

  const session = replay.session
  assertEqual(session.selection.system.name, "Styris")
  assertEqual(session.selection.wormhole, false)
  assertEqual(session.map.selectedSystem.name, "Styris")
  assertEqual(session.map.selectedWormhole, false)
  assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")

  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Styris")
  assertEqual(session.map.selectedPlanet.isWormhole, false)
})

test('galaxyView_systemLanding_selectWarpTarget_noSystemsInRange_buyFuel', () => {
  const replayLog = `{"idLog":["difficultySelect","createCommander","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["select|change|1","click","click","selectPlanetZoomed|Castor","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734668502562}`

  const replay = runReplayLog(replayLog)

  replay.replayEvent("Warp", "click")

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton, null)

  const session = replay.session
  assertEqual(session.selection.system, null)
  assertEqual(session.map.selectedSystem.name, "Castor")
  assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")
  assertEqual(document.getElementById("warpMessage").textContent, "No systems within range Fill tank for $14")

  replay.replayEvent("fulltank", "click")

  assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")

  warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Cestus")

  assertEqual(session.selection.system.name, "Cestus")
  assertEqual(session.map.selectedSystem.name, "Cestus")
})

test('galaxyView_systemLanding_chart_selectingInEitherWorks', () => {
  const replayLog = `{"idLog":["createCommander","Chart","namedEvent"],"eventNameLog":["click","click","selectPlanet|Yojimbo"],"gameRandSeed":1730276042104}`

  const replay = runReplayLog(replayLog)

  const session = replay.session

  assertTrue(hasText(rowAfterHeading("Selected System"), "b", "Yojimbo"), "Yojimbo is selected")

  assertTrue(document.getElementById("Chart").classList.contains("active"), "chart is active")
  assertTrue(!document.getElementById("Warp").classList.contains("active"), "warp is not active")

  replay.replayEvent("namedEvent", "selectPlanetZoomed|Kira")

  assertTrue(!document.getElementById("Chart").classList.contains("active"), "chart is not active")
  assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")

  let warpButton = document.getElementById("warpBlastOff")
  assertEqual(warpButton.innerText, "Blast Off to Kira")

  assertEqual(session.selection.system.name, "Kira")
  assertEqual(session.map.selectedSystem.name, "Kira")
})

test('galaxyView_systemLanding_chart_selectingWormhole', () => {
  const replayLog = `{"idLog":["createCommander","Chart","namedEvent"],"eventNameLog":["click","click","selectPlanet|Utopia~wormhole"],"gameRandSeed":1734687673579}`

  const replay = runReplayLog(replayLog)

  const session = replay.session

  assertTrue(hasText(rowAfterHeading("Selected System"), "b", "Pollux"), "Pollux is selected")

  assertTrue(document.getElementById("Chart").classList.contains("active"), "chart is active")
  assertTrue(!document.getElementById("Warp").classList.contains("active"), "warp is not active")

  const chartGalaxyView = runtime.actionLog._namedEvents["selectPlanet"]
  // Force initialization of all the planets
  chartGalaxyView.drawGalaxy(0)
  assertEqual(chartGalaxyView.selectedPlanet.solarSystem.name, "Pollux")
  assertEqual(chartGalaxyView.selectedPlanet.isWormhole, true)
})

test('galaxyView_systemLanding_nonwormhole', () => {
  const replayLog = `{"idLog":["createCommander","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Kira"],"gameRandSeed":1730277328255}`

  const replay = runReplayLog(replayLog)

  const session = replay.session


  assertEqual(session.selection.system.name, "Kira")
  assertEqual(session.selection.wormhole, false)
  assertEqual(session.map.selectedSystem.name, "Kira")
  assertEqual(session.map.selectedWormhole, false)

  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Kira")
  assertEqual(session.map.selectedPlanet.isWormhole, false)
})

test('galaxyView_systemLanding_wormhole_kira', () => {
  const replayLog = `{"idLog":["createCommander","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Yew~wormhole"],"gameRandSeed":1730277328255}`

  const replay = runReplayLog(replayLog)

  const session = replay.session

  assertEqual(session.selection.system.name, "Yew")
  assertEqual(session.selection.wormhole, true)
  assertEqual(session.map.selectedSystem.name, "Yew")
  assertEqual(session.map.selectedWormhole, true)

  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Kira")
  assertEqual(session.map.selectedPlanet.isWormhole, true)
})

test('galaxyView_systemLanding_wormhole', () => {
  const replayLog = `{"idLog":["createCommander","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Kira~wormhole"],"gameRandSeed":1730277328255}`

  const replay = runReplayLog(replayLog)

  const session = replay.session

  assertEqual(session.selection.system.name, "Kira")
  assertEqual(session.selection.wormhole, true)
  assertEqual(session.map.selectedSystem.name, "Kira")
  assertEqual(session.map.selectedWormhole, true)

  // Force initialization of all the planets
  session.map.drawGalaxy(0)
  assertEqual(session.map.selectedPlanet.solarSystem.name, "Lave")
  assertEqual(session.map.selectedPlanet.isWormhole, true)
})

test('useSingularity', () => {
  const replayLog = `{"idLog":["createCommander","Chart","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Othello","alertButton_Not_now","galacticChart_useSingularity_121_Othello","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732588693057}`

  const replay = runReplayLog(replayLog)

  const session = replay.session
  const game = session.game

  assertEqual(game.canSuperWarp, false)

  const systemInfoHeader = document.getElementById('system-info-welcome')
  assertEqual(systemInfoHeader.innerText, "Welcome to Othello")
})

test('policeSummon_nothingIllegal_submit', () => {
  const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","fulltank","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Submit"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","click","click","click"],"gameRandSeed":1734686605552}`

  const replay = runReplayLog(replayLog)

  const session = replay.session
  const commander = session.game.commander


  const alertTitleEl = document.getElementById("alertvc-title")
  assertEqual(alertTitleEl.innerText, "The police find nothing illegal in your cargo holds and apologize for the inconvenience.")


  const origCredits = commander.credits

  replay.replayEvent("alertButton_Dismiss", "click")

  assertEqual(origCredits, commander.credits)
})

test('policeSummon_bribe', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Warp","cargo_FirearmsBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Warp","warpBlastOff"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669204790}`

  const replay = runReplayLog(replayLog)

  const session = replay.session
  const commander = session.game.commander

  const origCredits = commander.credits

  replay.replayEvent("ecButton_Bribe", "click")
  replay.replayEvent("alertButton_Offer_bribe", "click")

  assertEqual(origCredits - 8400, commander.credits)
  assertTrue(!isNaN(commander.debt), "debt is not NaN")
})

test('difficultySelect_replay', () => {
  const replayLog = `{"idLog":["difficultySelect","engineer"],"eventNameLog":["select|change|1","slider|input|6"],"gameRandSeed":1732270077642}`

  const replay = runReplayLog(replayLog)

  assertEqual(document.getElementById("difficultySelect").value, "Easy")

  replay.replayEvent("difficultySelect", "select|change|3")

  assertEqual(document.getElementById("difficultySelect").value, "Hard")
})

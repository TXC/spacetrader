// Flow tests: each replays a recorded play session by clicking the recorded elements, then
// checks what the player sees and what the game holds. Converted from the original
// project's UnitTests.js; the recordings and expected values are unchanged.
import { test } from 'vitest';
import { GameRand } from '../../game/GameRand.ts';
import { ActionLogger } from '../../game/ActionLogger.ts';
import { Game, GameEndStatus } from '../../game/Game.ts';
import { Difficulty, JarekQuestStatus, WildQuestStatus } from '../../game/SolarSystem.types.ts';
import { TradeItemType } from '../../game/TradeItem.types.ts';
import { Utils } from '../../game/Utilities.ts';
import { MockLocalStorage } from '../support/MockLocalStorage.ts';
import { runtime } from '../../game/runtime.ts';
import { AlertViewController } from '../../game/alerts.ts';
import { Session } from '../../game/session.ts';
import {
  ActionLogReplay,
  assertEqual,
  assertEqualGames,
  runReplayLog,
  serializeAndDeserialize,
  show,
  unmountAll,
} from './harness.ts';
import { button } from '../support/page.ts';

test('saveLoad', () => {
  let vc = new Session();

  const randSeed = Date.now();
  runtime.gameRand = new GameRand(randSeed);
  runtime.actionLog = new ActionLogger(randSeed);

  const mockLS = new MockLocalStorage();

  vc.storage = mockLS;

  show(vc);

  assertEqual(mockLS.getItem('games'), null);
  assertEqual(mockLS.getItem('highScoringGames'), null);

  ActionLogReplay.replayEvent('createCommander', 'click', vc);

  // After creating a game, one is saved. No high scoring games are saved.
  let saveGames = JSON.parse(mockLS.getItem('games') ?? 'null') || {};
  assertEqual(Object.keys(saveGames).length, 1);
  assertEqual(mockLS.getItem('highScoringGames'), null);

  // Check that the saved game looks valid
  const gameUniqueID = Object.keys(saveGames)[0];
  Utils.ensureType(gameUniqueID, 'string');

  const sg = Game.fromSerializedState(saveGames[gameUniqueID]);
  assertEqual(sg.commander.name, 'Jean-Luc');
  assertEqual(sg.endStatus, GameEndStatus.None);

  // Clear out the old instance
  unmountAll();

  // Create a new VC and see that it loads the game
  vc = new Session();
  vc.storage = mockLS;

  show(vc);

  assertEqual(vc.game!.uniqueID, gameUniqueID);
  assertEqual(vc.game!.commander.name, 'Jean-Luc');

  // End the game, check that the game moves to the high scoring list and no longer appears in the in progress list
  ActionLogReplay.replayEvent('Commander', 'click', vc);
  ActionLogReplay.replayEvent('giveup', 'click', vc);
  ActionLogReplay.replayEvent('alertButton_Abandon_game', 'click', vc);

  saveGames = JSON.parse(mockLS.getItem('games') ?? 'null') || {};
  assertEqual(Object.keys(saveGames).length, 0);

  const highScoreGames = JSON.parse(mockLS.getItem('highScoringGames') ?? 'null') || {};
  assertEqual(Object.keys(highScoreGames).length, 1);

  // Check that the saved high score game looks valid
  const sg2 = Game.fromSerializedState(highScoreGames[gameUniqueID]);
  assertEqual(sg2.commander.name, 'Jean-Luc');
  assertEqual(sg2.endStatus, GameEndStatus.Retired);
});

test('serializationDeserialization_newGame', () => {
  const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1732421539025}`;

  const replay = runReplayLog(replayLog);
  const session = replay.session;

  const game = session.game!;

  let game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);

  // Spot check some properties
  assertEqual(game2.difficulty, Difficulty.Normal);
  assertEqual(game2.commander.credits, 1000);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');

  // Mercenary
  const kira2 = game2.solarSystems.find(x => x.name === 'Kira')!;
  const crystal2 = kira2.mercenary!;
  assertEqual(crystal2.name, 'Crystal');
  assertEqual(crystal2.pilot, 5);
  assertEqual(crystal2.fighter, 4);
  assertEqual(crystal2.trader, 5);
  assertEqual(crystal2.engineer, 3);

  const kira = game.solarSystems.find(x => x.name === 'Kira')!;
  const crystal = kira.mercenary!;
  game.commander.ship.addCrewMember(crystal);

  game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);

  const kira2b = game2.solarSystems.find(x => x.name === 'Kira')!;
  const crystal2b = kira2b.mercenary!;
  assertEqual(crystal2b.name, 'Crystal');
  assertEqual(crystal2b.pilot, 5);
  assertEqual(crystal2b.fighter, 4);
  assertEqual(crystal2b.trader, 5);
  assertEqual(crystal2b.engineer, 3);

  assertEqual(game2.commander.ship.crew.length, 0);

  // Spot check quests

  game.jarekStatus = JarekQuestStatus.OnBoard;

  game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);
  assertEqual(game2.questListDescription(), `Bring Ambassador Jarek to Devidia.`);

  game.wildStatus = WildQuestStatus.OnBoard;

  game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);
  assertEqual(
    game2.questListDescription(),
    `Bring Ambassador Jarek to Devidia.\nSmuggle Jonathan Wild to Kravat.`
  );

  game.commander.boughtMoon = true;

  game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);
  assertEqual(
    game2.questListDescription(),
    `Bring Ambassador Jarek to Devidia.\nSmuggle Jonathan Wild to Kravat.\nClaim your moon in Utopia.`
  );
});

test('serializationDeserialization', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_showSpecial","Chart","Warp","cargo_WaterBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_OreBuy_1","cargo_OreBuy_1","cargo_GamesBuy_1","cargo_GamesBuy_1"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);
  const session = replay.session;

  const game = session.game!;

  let game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);

  // Spot check some properties
  assertEqual(game2.difficulty, Difficulty.Normal);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Water), 1);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 0);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Food), 2);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Ore), 2);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Games), 2);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Machines), 0);
  assertEqual(game2.commander.credits, 545215);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');

  // Mercenary
  const klaatu2 = game2.solarSystems.find(x => x.name === 'Klaatu')!;
  const draco2 = klaatu2.mercenary!;
  assertEqual(draco2.name, 'Draco');
  assertEqual(draco2.pilot, 5);
  assertEqual(draco2.fighter, 8);
  assertEqual(draco2.trader, 4);
  assertEqual(draco2.engineer, 7);

  const klaatu = game.solarSystems.find(x => x.name === 'Klaatu')!;
  const draco = klaatu.mercenary!;
  game.commander.ship.addCrewMember(draco);

  game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);

  const klaatu2b = game2.solarSystems.find(x => x.name === 'Klaatu')!;
  const draco2b = klaatu2b.mercenary!;
  assertEqual(draco2b.name, 'Draco');
  assertEqual(draco2b.pilot, 5);
  assertEqual(draco2b.fighter, 8);
  assertEqual(draco2b.trader, 4);
  assertEqual(draco2b.engineer, 7);

  assertEqual(game2.commander.ship.crew.length, 1);
  const draco2bShip = game2.commander.ship.crew[0];
  assertEqual(draco2b, draco2bShip);

  // Spot check quests

  game.jarekStatus = JarekQuestStatus.OnBoard;

  game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);
  assertEqual(game2.questListDescription(), `Bring Ambassador Jarek to Devidia.`);

  game.wildStatus = WildQuestStatus.OnBoard;

  game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);
  assertEqual(
    game2.questListDescription(),
    `Bring Ambassador Jarek to Devidia.\nSmuggle Jonathan Wild to Kravat.`
  );

  game.commander.boughtMoon = true;

  game2 = serializeAndDeserialize(game);

  assertEqualGames(game, game2);
  assertEqual(
    game2.questListDescription(),
    `Bring Ambassador Jarek to Devidia.\nSmuggle Jonathan Wild to Kravat.\nClaim your moon in Utopia.`
  );
});

test('auto_attack_interrupt', () => {
  const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`;

  const replay = runReplayLog(replayLog);

  runtime.actionLog.replayInProgressQueueAsyncClosures = true;

  replay.replayEvent('warpBlastOff');
  replay.replayEvent('ecButton_Attack');
  replay.replayEvent('alertButton_Attack');

  replay.replayEvent('ecButton_Auto_Attack');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);

  replay.replayEvent('ecButton_Interrupt');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);

  const closure = runtime.actionLog.asyncClosureQueue!.shift();
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 0);
  closure!();

  assertEqual(button('Interrupt'), null);
  assertEqual(button('Attack') !== null, true);
});

test('auto_attack_flee', () => {
  const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`;

  const replay = runReplayLog(replayLog);

  runtime.actionLog.replayInProgressQueueAsyncClosures = true;

  replay.replayEvent('warpBlastOff');
  replay.replayEvent('ecButton_Attack');
  replay.replayEvent('alertButton_Attack');

  replay.replayEvent('ecButton_Auto_Attack');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);

  replay.replayEvent('ecButton_Flee');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);

  const closure = runtime.actionLog.asyncClosureQueue!.shift();
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 0);
  closure!();

  assertEqual(button('Interrupt'), null);
  assertEqual(button('Attack') !== null, true);
});

test('auto_attack_surrender', () => {
  const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`;

  const replay = runReplayLog(replayLog);

  runtime.actionLog.replayInProgressQueueAsyncClosures = true;

  replay.replayEvent('warpBlastOff');
  replay.replayEvent('ecButton_Attack');
  replay.replayEvent('alertButton_Attack');

  replay.replayEvent('ecButton_Auto_Attack');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);

  replay.replayEvent('ecButton_Surrender');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);

  const closure = runtime.actionLog.asyncClosureQueue!.shift();
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 0);
  closure!();

  assertEqual(button('Interrupt'), null);
  assertEqual(button('Attack') !== null, true);
});

test('auto_attack_auto_flee', () => {
  const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`;

  const replay = runReplayLog(replayLog);

  runtime.actionLog.replayInProgressQueueAsyncClosures = true;

  replay.replayEvent('warpBlastOff');
  replay.replayEvent('ecButton_Attack');
  replay.replayEvent('alertButton_Attack');

  replay.replayEvent('ecButton_Auto_Attack');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);

  replay.replayEvent('ecButton_Auto_Flee');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 2);

  let closure = runtime.actionLog.asyncClosureQueue!.shift();
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);
  closure!();

  assertEqual(button('Interrupt') !== null, true);
  assertEqual(button('Attack') !== null, true);

  closure = runtime.actionLog.asyncClosureQueue!.shift();
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 0);
  closure!();

  assertEqual(AlertViewController.currentAlertTitle(), "You've managed to escape your opponent.");
});

test('auto_flee_interrupt', () => {
  const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`;

  const replay = runReplayLog(replayLog);

  runtime.actionLog.replayInProgressQueueAsyncClosures = true;

  replay.replayEvent('warpBlastOff');
  replay.replayEvent('ecButton_Attack');
  replay.replayEvent('alertButton_Attack');

  replay.replayEvent('ecButton_Auto_Attack');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);

  replay.replayEvent('ecButton_Auto_Flee');
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 2);

  let closure = runtime.actionLog.asyncClosureQueue!.shift();
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);
  closure!();

  assertEqual(button('Interrupt') !== null, true);
  assertEqual(button('Attack') !== null, true);

  replay.replayEvent('ecButton_Interrupt');

  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 1);

  closure = runtime.actionLog.asyncClosureQueue!.shift();
  assertEqual(runtime.actionLog.asyncClosureQueue!.length, 0);
  closure!();

  assertEqual(button('Interrupt'), null);
  assertEqual(button('Flee') !== null, true);

  replay.replayEvent('ecButton_Auto_Flee');
  assertEqual(AlertViewController.currentAlertTitle(), "You've managed to escape your opponent.");
});

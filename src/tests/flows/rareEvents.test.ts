// Flow tests: each replays a recorded play session by clicking the recorded elements, then
// checks what the player sees and what the game holds. Converted from the original
// project's UnitTests.js; the recordings and expected values are unchanged.
import { test } from 'vitest';
import { AccessoryType } from '../../game/Accessory.ts';
import {
  ATTACK_POLICE_SCORE,
  ATTACK_TRADER_SCORE,
  PoliceRecordScore,
} from '../../game/Commander.ts';
import { RareEvent } from '../../game/Game.ts';
import { TradeItemType } from '../../game/TradeItem.types.ts';
import { AlertViewController } from '../../game/alerts.ts';
import './setup.ts';
import {
  assertEqual,
  assertEqualArrays,
  assertEqualGames,
  assertTrue,
  runReplayLog,
  serializeAndDeserialize,
} from './harness.ts';
import {
  button,
  encounterBox,
  hasText,
  hullFrame,
  news,
  textOf,
  welcome,
} from '../support/page.ts';

test('BottleGood_Ignore', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Good_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    "At 20 clicks from Tantalos you encounter a floating bottle.\n\nIt appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!"
  );

  replay.replayEvent('ecButton_Ignore', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 18 clicks from Tantalos you encounter a police Gnat.\n\nIt ignores you.'
  );

  assertEqual(game.commander.pilot, 5);
  assertEqual(game.commander.trader, 5);
  assertEqual(game.commander.engineer, 5);
  assertEqual(game.commander.fighter, 5);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.pilot, 5);
  assertEqual(game2.commander.trader, 5);
  assertEqual(game2.commander.engineer, 5);
  assertEqual(game2.commander.fighter, 5);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('BottleGood_Pass', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Good_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    "At 20 clicks from Tantalos you encounter a floating bottle.\n\nIt appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!"
  );

  replay.replayEvent('ecButton_Drink', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. In the old days, this stuff went for thousands of credits a bottle since people reported significant gains in their abilities after quaffing a bottle. Would you like to drink it?'
  );

  replay.replayEvent('alertButton_I_ll_pass', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 18 clicks from Tantalos you encounter a police Gnat.\n\nIt ignores you.'
  );

  assertEqual(game.commander.pilot, 5);
  assertEqual(game.commander.trader, 5);
  assertEqual(game.commander.engineer, 5);
  assertEqual(game.commander.fighter, 5);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.pilot, 5);
  assertEqual(game2.commander.trader, 5);
  assertEqual(game2.commander.engineer, 5);
  assertEqual(game2.commander.fighter, 5);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('BottleGood_Drink', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Good_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    "At 20 clicks from Tantalos you encounter a floating bottle.\n\nIt appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!"
  );

  assertEqual(hullFrame('self', 'Gnat')!.style.visibility, 'visible');
  assertEqual(hullFrame('enemy', 'Bottle')!.style.visibility, 'hidden');

  replay.replayEvent('ecButton_Drink', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. In the old days, this stuff went for thousands of credits a bottle since people reported significant gains in their abilities after quaffing a bottle. Would you like to drink it?'
  );

  replay.replayEvent('alertButton_Yes__drink_it', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Mmmmm. Captain Marmoset's Amazing Skill Tonic not only fills you with energy, but tastes like a fine single-malt. You feel a slight tingling in your fingertips."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 19 clicks from Tantalos you encounter a police Gnat.\n\nIt ignores you.'
  );

  assertEqual(hullFrame('self', 'Gnat')!.style.visibility, 'visible');
  assertEqual(hullFrame('enemy', 'Gnat')!.style.visibility, 'visible');

  assertEqual(game.commander.pilot, 5);
  assertEqual(game.commander.trader, 5);
  assertEqual(game.commander.engineer, 6);
  assertEqual(game.commander.fighter, 6);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.pilot, 5);
  assertEqual(game2.commander.trader, 5);
  assertEqual(game2.commander.engineer, 6);
  assertEqual(game2.commander.fighter, 6);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('BottleOld_Ignore', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Old_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    "At 20 clicks from Tantalos you encounter a floating bottle.\n\nIt appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!"
  );

  replay.replayEvent('ecButton_Ignore', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 18 clicks from Tantalos you encounter a police Gnat.\n\nIt ignores you.'
  );

  assertEqual(game.commander.pilot, 5);
  assertEqual(game.commander.trader, 5);
  assertEqual(game.commander.engineer, 5);
  assertEqual(game.commander.fighter, 5);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.pilot, 5);
  assertEqual(game2.commander.trader, 5);
  assertEqual(game2.commander.engineer, 5);
  assertEqual(game2.commander.fighter, 5);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('BottleOld_Pass', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Old_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    "At 20 clicks from Tantalos you encounter a floating bottle.\n\nIt appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!"
  );

  replay.replayEvent('ecButton_Drink', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. The "best used by" date stamped on the bottle has become illegible. The tonic might still be good. Then again, it\'s not clear what happens when the Tonic breaks down...'
  );

  replay.replayEvent('alertButton_I_ll_pass', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 18 clicks from Tantalos you encounter a police Gnat.\n\nIt ignores you.'
  );

  assertEqual(game.commander.pilot, 5);
  assertEqual(game.commander.trader, 5);
  assertEqual(game.commander.engineer, 5);
  assertEqual(game.commander.fighter, 5);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.pilot, 5);
  assertEqual(game2.commander.trader, 5);
  assertEqual(game2.commander.engineer, 5);
  assertEqual(game2.commander.fighter, 5);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('BottleOld_Drink', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Old_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    "At 20 clicks from Tantalos you encounter a floating bottle.\n\nIt appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!"
  );

  assertEqual(hullFrame('self', 'Gnat')!.style.visibility, 'visible');
  assertEqual(hullFrame('enemy', 'Bottle')!.style.visibility, 'hidden');

  replay.replayEvent('ecButton_Drink', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. The "best used by" date stamped on the bottle has become illegible. The tonic might still be good. Then again, it\'s not clear what happens when the Tonic breaks down...'
  );

  replay.replayEvent('alertButton_Yes__drink_it', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "While you don't know what it was supposed to taste like, you get the feeling that this dose of tonic was a bit off. This bottle tasted very strange, like slightly salty red wine. You feel a bit dizzy and your teeth itch for a while."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 19 clicks from Tantalos you encounter a police Gnat.\n\nIt ignores you.'
  );

  assertEqual(hullFrame('self', 'Gnat')!.style.visibility, 'visible');
  assertEqual(hullFrame('enemy', 'Gnat')!.style.visibility, 'visible');

  assertEqual(game.commander.pilot, 5);
  assertEqual(game.commander.trader, 5);
  assertEqual(game.commander.engineer, 6);
  assertEqual(game.commander.fighter, 4);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.pilot, 5);
  assertEqual(game2.commander.trader, 5);
  assertEqual(game2.commander.engineer, 6);
  assertEqual(game2.commander.fighter, 4);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('Ahab_notEligible', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Captain_Ahab","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733197780168}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 15 clicks from Japori you encounter a police Firefly.\n\nIt ignores you.'
  );

  assertEqualArrays(game._remainingRareEvents, [RareEvent.CaptainAhab]);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, [RareEvent.CaptainAhab]);
});

test('Ahab_accept', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Ahab","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Ahab.\n\nThe captain requests a brief meeting with you.'
  );

  replay.replayEvent('ecButton_Meet', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Captain Ahab, one of the greatest pilots of all time, is in need of a shield for an upcoming mission. To save the time it would take to land and find a vendor, Ahab is offering to trade you some piloting lessons in exchange for one reflective shield.'
  );

  const pilotBefore = game.commander.pilot;
  assertEqual(game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);

  replay.replayEvent('alertButton_Yes__trade_', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'After a few hours of training with a top expert, you feel your abilities have improved significantly.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  const pilotAfter = game.commander.pilot;
  assertEqual(pilotAfter, pilotBefore + 2);

  assertEqual(game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), false);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), false);
  const pilotAfter2 = game2.commander.pilot;
  assertEqual(pilotAfter2, pilotBefore + 2);
});

test('Ahab_noThanks', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Ahab","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Ahab.\n\nThe captain requests a brief meeting with you.'
  );

  replay.replayEvent('ecButton_Meet', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Captain Ahab, one of the greatest pilots of all time, is in need of a shield for an upcoming mission. To save the time it would take to land and find a vendor, Ahab is offering to trade you some piloting lessons in exchange for one reflective shield.'
  );

  const pilotBefore = game.commander.pilot;
  assertEqual(game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);

  replay.replayEvent('alertButton_No_thanks_', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 13 clicks from Yew you encounter a trader Gnat.\n\nIt ignores you.'
  );

  const pilotAfter = game.commander.pilot;
  assertEqual(pilotAfter, pilotBefore);

  assertEqual(game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);
  const pilotAfter2 = game2.commander.pilot;
  assertEqual(pilotAfter2, pilotBefore);
});

test('Ahab_ignore', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Ahab","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Ahab.\n\nThe captain requests a brief meeting with you.'
  );

  const pilotBefore = game.commander.pilot;
  assertEqual(game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);

  replay.replayEvent('ecButton_Ignore', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 13 clicks from Yew you encounter a trader Gnat.\n\nIt ignores you.'
  );

  const pilotAfter = game.commander.pilot;
  assertEqual(pilotAfter, pilotBefore);

  assertEqual(game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);
  const pilotAfter2 = game2.commander.pilot;
  assertEqual(pilotAfter2, pilotBefore);
});

test('Ahab_attack', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Ahab","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Ahab.\n\nThe captain requests a brief meeting with you.'
  );

  const pilotBefore = game.commander.pilot;
  assertEqual(game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);

  replay.replayEvent('ecButton_Attack', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Famous captains get famous by, among other things, destroying everyone who attacks them. Do you really want to attack?'
  );

  replay.replayEvent('alertButton_Attack', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Ignore', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Ignore', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click'); // arrived

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Yew');

  assertEqualArrays(game._breakingNews, ['Thug Assaults Captain Ahab!']);

  replay.replayEvent('News', 'click');
  replay.replayEvent('purchaseNews', 'click');

  const newsStrDiv = news();
  assertTrue(hasText(newsStrDiv, 'h4', 'The Command'), 'masthead is a heading');
  assertEqual(
    textOf(newsStrDiv),
    'The Command\nThug Assaults Captain Ahab!\n\nNotorious Criminal Jean-Luc Sighted in Yew!\n\nInsurrection Crushed: Rebels Executed!'
  );

  assertEqual(game._breakingNews, null);

  assertEqual(game.commander.policeRecordScore, PoliceRecordScore.Villain + ATTACK_TRADER_SCORE);

  const pilotAfter = game.commander.pilot;
  assertEqual(pilotAfter, pilotBefore);

  assertEqual(game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective), true);
  const pilotAfter2 = game2.commander.pilot;
  assertEqual(pilotAfter2, pilotBefore);
  assertEqual(game2.commander.policeRecordScore, PoliceRecordScore.Villain + ATTACK_TRADER_SCORE);
});

test('Conrad_notEligible', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Captain_Conrad","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733197780168}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 15 clicks from Japori you encounter a police Firefly.\n\nIt ignores you.'
  );

  assertEqualArrays(game._remainingRareEvents, [RareEvent.CaptainConrad]);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, [RareEvent.CaptainConrad]);
});

test('Conrad_accept', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Conrad","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Conrad.\n\nThe captain requests a brief meeting with you.'
  );

  replay.replayEvent('ecButton_Meet', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Captain Conrad, fleet historian and inventor of the modern warp drive, is in need of a laser to test her new shield design. Unfortunately, she's used up her R&D budget for the year. Instead of cash, she'll trade you some engineering lessons in exchange for one military laser."
  );

  const engBefore = game.commander.engineer;

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  replay.replayEvent('alertButton_Yes__trade_', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'After a few hours of training with a top expert, you feel your abilities have improved significantly.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  const engAfter = game.commander.engineer;
  assertEqual(engAfter, engBefore + 2);

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), false);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), false);
  const engAfter2 = game2.commander.engineer;
  assertEqual(engAfter2, engBefore + 2);
});

test('Conrad_noThanks', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Conrad","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Conrad.\n\nThe captain requests a brief meeting with you.'
  );

  replay.replayEvent('ecButton_Meet', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Captain Conrad, fleet historian and inventor of the modern warp drive, is in need of a laser to test her new shield design. Unfortunately, she's used up her R&D budget for the year. Instead of cash, she'll trade you some engineering lessons in exchange for one military laser."
  );

  const engBefore = game.commander.engineer;
  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  replay.replayEvent('alertButton_No_thanks_', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 13 clicks from Yew you encounter a trader Gnat.\n\nIt ignores you.'
  );

  const engAfter = game.commander.engineer;
  assertEqual(engAfter, engBefore);

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);
  const engAfter2 = game2.commander.engineer;
  assertEqual(engAfter2, engBefore);
});

test('Conrad_ignore', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Conrad","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Conrad.\n\nThe captain requests a brief meeting with you.'
  );

  const engBefore = game.commander.engineer;
  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  replay.replayEvent('ecButton_Ignore', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 13 clicks from Yew you encounter a trader Gnat.\n\nIt ignores you.'
  );

  const engAfter = game.commander.engineer;
  assertEqual(engAfter, engBefore);

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);
  const engAfter2 = game2.commander.engineer;
  assertEqual(engAfter2, engBefore);
});

test('Conrad_attack', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Conrad","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Conrad.\n\nThe captain requests a brief meeting with you.'
  );

  const engBefore = game.commander.engineer;
  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  replay.replayEvent('ecButton_Attack', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Famous captains get famous by, among other things, destroying everyone who attacks them. Do you really want to attack?'
  );

  replay.replayEvent('alertButton_Attack', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Ignore', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Ignore', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click'); // arrived

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Yew');

  assertEqualArrays(game._breakingNews, ['Captain Conrad Comes Under Attack By Criminal!']);

  replay.replayEvent('News', 'click');
  replay.replayEvent('purchaseNews', 'click');

  const newsStrDiv = news();
  assertTrue(hasText(newsStrDiv, 'h4', 'The Command'), 'masthead is a heading');
  assertEqual(
    textOf(newsStrDiv),
    'The Command\nCaptain Conrad Comes Under Attack By Criminal!\n\nNotorious Criminal Jean-Luc Sighted in Yew!\n\nInsurrection Crushed: Rebels Executed!'
  );

  assertEqual(game._breakingNews, null);

  assertEqual(game.commander.policeRecordScore, PoliceRecordScore.Villain + ATTACK_TRADER_SCORE);

  const engAfter = game.commander.engineer;
  assertEqual(engAfter, engBefore);

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);
  const engAfter2 = game2.commander.engineer;
  assertEqual(engAfter2, engBefore);
  assertEqual(game2.commander.policeRecordScore, PoliceRecordScore.Villain + ATTACK_TRADER_SCORE);
});

test('Huie_notEligible', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Captain_Huie","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733197780168}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 15 clicks from Japori you encounter a police Firefly.\n\nIt ignores you.'
  );

  assertEqualArrays(game._remainingRareEvents, [RareEvent.CaptainHuie]);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, [RareEvent.CaptainHuie]);
});

test('Huie_accept', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Huie","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Huie.\n\nThe captain requests a brief meeting with you.'
  );

  replay.replayEvent('ecButton_Meet', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Captain Huie, former Trade Commissioner of the Galactic Council, is in need of a laser for an upcoming mission. Huie is known for driving a hard bargain and is offering some secrets of doing business in exchange for one military laser.'
  );

  const tradBefore = game.commander.trader;

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  replay.replayEvent('alertButton_Yes__trade_', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'After a few hours of training with a top expert, you feel your abilities have improved significantly.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  const tradAfter = game.commander.trader;
  assertEqual(tradAfter, tradBefore + 2);

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), false);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), false);
  const tradAfter2 = game2.commander.trader;
  assertEqual(tradAfter2, tradBefore + 2);
});

test('Huie_noThanks', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Huie","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Huie.\n\nThe captain requests a brief meeting with you.'
  );

  replay.replayEvent('ecButton_Meet', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Captain Huie, former Trade Commissioner of the Galactic Council, is in need of a laser for an upcoming mission. Huie is known for driving a hard bargain and is offering some secrets of doing business in exchange for one military laser.'
  );

  const tradBefore = game.commander.trader;
  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  replay.replayEvent('alertButton_No_thanks_', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 13 clicks from Yew you encounter a trader Gnat.\n\nIt ignores you.'
  );

  const tradAfter = game.commander.trader;
  assertEqual(tradAfter, tradBefore);

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);
  const tradAfter2 = game2.commander.trader;
  assertEqual(tradAfter2, tradBefore);
});

test('Huie_ignore', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Huie","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Huie.\n\nThe captain requests a brief meeting with you.'
  );

  const tradBefore = game.commander.trader;
  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  replay.replayEvent('ecButton_Ignore', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 13 clicks from Yew you encounter a trader Gnat.\n\nIt ignores you.'
  );

  const tradAfter = game.commander.trader;
  assertEqual(tradAfter, tradBefore);

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);
  const tradAfter2 = game2.commander.trader;
  assertEqual(tradAfter2, tradBefore);
});

test('Huie_attack', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Huie","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Yew you encounter the famous Captain Huie.\n\nThe captain requests a brief meeting with you.'
  );

  const tradBefore = game.commander.trader;
  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  replay.replayEvent('ecButton_Attack', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Famous captains get famous by, among other things, destroying everyone who attacks them. Do you really want to attack?'
  );

  replay.replayEvent('alertButton_Attack', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Ignore', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Ignore', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click'); // arrived

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Yew');

  assertEqualArrays(game._breakingNews, ['Famed Captain Huie Attacked by Brigand!']);

  replay.replayEvent('News', 'click');
  replay.replayEvent('purchaseNews', 'click');

  const newsStrDiv = news();
  assertTrue(hasText(newsStrDiv, 'h4', 'The Command'), 'masthead is a heading');
  assertEqual(
    textOf(newsStrDiv),
    'The Command\nFamed Captain Huie Attacked by Brigand!\n\nNotorious Criminal Jean-Luc Sighted in Yew!\n\nInsurrection Crushed: Rebels Executed!'
  );

  assertEqual(game._breakingNews, null);

  assertEqual(game.commander.policeRecordScore, PoliceRecordScore.Villain + ATTACK_TRADER_SCORE);

  const tradAfter = game.commander.trader;
  assertEqual(tradAfter, tradBefore);

  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser), true);
  const tradAfter2 = game2.commander.trader;
  assertEqual(tradAfter2, tradBefore);
  assertEqual(game2.commander.policeRecordScore, PoliceRecordScore.Villain + ATTACK_TRADER_SCORE);
});

test('MarieCeleste_ignore', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  for (let i = 0; i < 5; ++i) {
    assertEqual(button('Yield'), null); // Not encountering Customs Police
    replay.replayEvent('ecButton_Ignore', 'click');
  }

  replay.replayEvent('alertButton_Dismiss', 'click');

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Jason');

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('MarieCeleste_boardLeave', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('ecButton_Board', 'click');
  replay.replayEvent('alertButton_Leave_it', 'click');

  for (let i = 0; i < 4; ++i) {
    assertEqual(button('Yield'), null); // Not encountering Customs Police
    replay.replayEvent('ecButton_Ignore', 'click');
  }

  replay.replayEvent('alertButton_Dismiss', 'click');

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Jason');

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('MarieCeleste_boardDontTake', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('ecButton_Board', 'click');
  replay.replayEvent('alertButton_Yes__take_cargo', 'click');
  replay.replayEvent('alertButton__Take_plunderDump_some_cargo', 'click');
  replay.replayEvent('alertButton__Take_dumpResume_plundering', 'click');
  replay.replayEvent('alertButton__Take_plunderDone', 'click');

  for (let i = 0; i < 4; ++i) {
    assertEqual(button('Yield'), null); // Not encountering Customs Police
    replay.replayEvent('ecButton_Ignore', 'click');
  }

  replay.replayEvent('alertButton_Dismiss', 'click');

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Jason');

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('MarieCeleste_boardTakeDumpYield', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('ecButton_Board', 'click');
  replay.replayEvent('alertButton_Yes__take_cargo', 'click');
  replay.replayEvent('cargo_NarcoticsTake_1', 'click');
  replay.replayEvent('alertButton__Take_plunderDump_some_cargo', 'click');
  replay.replayEvent('cargo_NarcoticsDump_1', 'click');
  replay.replayEvent('alertButton_Yes__I_still_want_to', 'click');
  replay.replayEvent('alertButton__Take_dumpResume_plundering', 'click');
  replay.replayEvent('alertButton__Take_plunderDone', 'click');
  replay.replayEvent('ecButton_Submit', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  const policeRecordBefore = game.commander.policeRecordScore;
  const reputationBefore = game.commander.reputationScore;

  for (let i = 0; i < 5; ++i) {
    assertEqual(button('Yield'), null); // Not encountering Customs Police
    replay.replayEvent('ecButton_Ignore', 'click');
  }

  replay.replayEvent('ecButton_Yield', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'The Customs Police find nothing illegal in your cargo holds and apologize for the inconvenience.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click');

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Jason');

  assertEqual(game.commander.policeRecordScore, policeRecordBefore);
  assertEqual(game.commander.reputationScore, reputationBefore);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('MarieCeleste_boardTakeYield', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('ecButton_Board', 'click');
  replay.replayEvent('alertButton_Yes__take_cargo', 'click');
  replay.replayEvent('cargo_NarcoticsTake_1', 'click');
  replay.replayEvent('alertButton__Take_plunderDone', 'click');

  const reputationBefore = game.commander.reputationScore;

  for (let i = 0; i < 4; ++i) {
    assertEqual(button('Yield'), null); // Not encountering Customs Police
    replay.replayEvent('ecButton_Ignore', 'click');
  }

  replay.replayEvent('ecButton_Yield', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'The Customs Police confiscated all of your illegal cargo. For being cooperative, you avoided stronger fines or penalties.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics), 0);

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Jason');

  assertEqual(game.commander.policeRecordScore, PoliceRecordScore.Dubious);
  assertEqual(game.commander.reputationScore, reputationBefore);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('MarieCeleste_boardTakeBribe', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('ecButton_Board', 'click');
  replay.replayEvent('alertButton_Yes__take_cargo', 'click');
  replay.replayEvent('cargo_NarcoticsTake_1', 'click');
  replay.replayEvent('alertButton__Take_plunderDone', 'click');

  for (let i = 0; i < 4; ++i) {
    assertEqual(button('Yield'), null); // Not encountering Customs Police
    replay.replayEvent('ecButton_Ignore', 'click');
  }

  replay.replayEvent('ecButton_Bribe', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "We'd love to take your money, but Space Command already knows you've got illegal goods onboard."
  );
  assertTrue(button('Yield') != null, 'yield option available');

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('MarieCeleste_boardTakeFlee', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('ecButton_Board', 'click');
  replay.replayEvent('alertButton_Yes__take_cargo', 'click');
  replay.replayEvent('cargo_NarcoticsTake_1', 'click');
  replay.replayEvent('alertButton__Take_plunderDone', 'click');

  const reputationBefore = game.commander.reputationScore;

  for (let i = 0; i < 4; ++i) {
    assertEqual(button('Yield'), null); // Not encountering Customs Police
    replay.replayEvent('ecButton_Ignore', 'click');
  }

  replay.replayEvent('ecButton_Auto_Flee', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Are you sure you want to flee? The Customs Police know you have engaged in criminal activity and your police record will reflect this fact.'
  );

  replay.replayEvent('alertButton_Flee', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics), 1);

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Jason');

  assertEqual(game.commander.policeRecordScore, PoliceRecordScore.Criminal);
  assertEqual(game.commander.reputationScore, reputationBefore);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
});

test('MarieCeleste_boardTakeAttack', () => {
  const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('ecButton_Board', 'click');
  replay.replayEvent('alertButton_Yes__take_cargo', 'click');
  replay.replayEvent('cargo_NarcoticsTake_1', 'click');
  replay.replayEvent('alertButton__Take_plunderDone', 'click');

  const reputationBefore = game.commander.reputationScore;

  for (let i = 0; i < 4; ++i) {
    assertEqual(button('Yield'), null); // Not encountering Customs Police
    replay.replayEvent('ecButton_Ignore', 'click');
  }

  replay.replayEvent('ecButton_Attack', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Are you sure you wish to attack the police? This will turn you into a criminal!'
  );

  replay.replayEvent('alertButton_Attack', 'click');

  replay.replayEvent('ecButton_Flee', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics), 1);

  const systemInfoHeader = welcome();
  assertEqual(textOf(systemInfoHeader), 'Welcome to Jason');

  assertEqual(game.commander.policeRecordScore, PoliceRecordScore.Criminal + ATTACK_POLICE_SCORE);
  assertEqual(game.commander.reputationScore, reputationBefore);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqualArrays(game2._remainingRareEvents, []);
});

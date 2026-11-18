// Flow tests: each replays a recorded play session by clicking the recorded elements, then
// checks what the player sees and what the game holds. Converted from the original
// project's UnitTests.js; the recordings and expected values are unchanged.
import { expect, test } from 'vitest';
import { AccessoryType } from '../../game/Accessory.ts';
import { PoliceRecordScore } from '../../game/Commander.ts';
import { GameEndStatus } from '../../game/Game.ts';
import { PoliticsType } from '../../game/Politics.ts';
import { ShipModelType } from '../../game/Ship.ts';
import {
  ExperimentQuestStatus,
  InvasionQuestStatus,
  JaporiQuestStatus,
  JarekQuestStatus,
  MonsterQuestStatus,
  ReactorQuestStatus,
  ScarabQuestStatus,
  SpecialEvent,
  WildQuestStatus,
} from '../../game/SolarSystem.types.ts';
import { FABRIC_RIP_PROBABILITY_INITIAL } from '../../game/SpecialEventSpecifier.ts';
import {
  TechLevel,
  TradeItemType,
  FAKE_QUEST_CARGO,
  FAKE_QUEST_CARGO_REACTOR,
} from '../../game/TradeItem.types.ts';
import { AlertViewController } from '../../game/alerts.ts';
import {
  assertEqual,
  assertEqualArrays,
  assertEqualGames,
  assertTrue,
  replaySkipEncounters,
  runReplayLog,
  serializeAndDeserialize,
} from './harness.ts';
import {
  button,
  encounterBox,
  hasText,
  news,
  openQuests,
  repairs,
  scoreMessage,
  specialCargo,
  systemInfo,
  tableRow,
  textOf,
} from '../support/page.ts';

test('questCount', () => {
  const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1732766875181}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(game.solarSystems.filter(x => x.specialEvent !== SpecialEvent.None).length, 42);
});

test('scarab', () => {
  const replayLog = `{"idLog":["trader","trader","trader","trader","engineer","engineer","engineer","engineer","pilot","pilot","pilot","pilot","fighter","fighter","fighter","fighter","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","namedEvent","namedEvent","namedEvent","galacticChart_useSingularity_121_Adahn","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buyship_Wasp","alertButton_Yes","Equipment","buy_Pulse_laser","alertButton_Yes","buy_Pulse_laser","alertButton_Yes","buy_Pulse_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","cheat_freeSingularity","Chart"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|6","slider|input|7","slider|input|8","slider|input|9","click","click","click","click","click","selectPlanet|Regulas","selectPlanet|Tanuga","selectPlanet|Leda","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734408890090}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  // reputationScore is too low for Special to show up
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.Scarab);
  let specialEl = button('Special');
  assertEqual(specialEl, null);

  replay.replayEvent('cheat_averageReputation', 'click');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Adahn');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  // Shows up now
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.Scarab);
  specialEl = button('Special');
  expect(specialEl).not.toBeNull();

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Captain Renwick developed a new organic hull material for his ship which cannot be damaged except by Pulse lasers. While he was celebrating this success, pirates boarded and stole the craft, which they have named the Scarab. Rumors suggest it's being hidden at the exit to a wormhole. Destroy the ship for a reward!"
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(
    game.questListDescription(),
    'Find and destroy the Scarab (which is hiding near a wormhole).'
  );

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(
    game2.questListDescription(),
    'Find and destroy the Scarab (which is hiding near a wormhole).'
  );

  replay.replayEvent('Chart', 'click');

  replay.replayEvent('galacticChart_useSingularity_121_Davlos', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Khefka you encounter a stolen Scarab.\n\nYour opponent attacks.'
  );

  replay.replayEvent('cheat_fighter15', 'click'); // need more skill to win
  replay.replayEvent('ecButton_Auto_Attack', 'click');

  assertEqual(game.scarabStatus, ScarabQuestStatus.ScarabDestroyed);

  replaySkipEncounters(replay);

  replay.replayEvent('News', 'click');
  replay.replayEvent('purchaseNews', 'click');

  const newsStrDiv = news();
  assertTrue(hasText(newsStrDiv, 'h4', 'The Daily Worker'), 'masthead is a heading');
  assertEqual(
    textOf(newsStrDiv),
    'The Daily Worker\nWormhole Traffic Delayed as Stolen Craft Destroyed.\n\nPlague Spreads! Outlook Grim.\n\nParty: Bold New Future Predicted!'
  );

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Space Corps is indebted to you for destroying the Scarab and the pirates who stole it. As a reward, we can have Captain Renwick upgrade the hull of your ship. Note that his upgrades won't be transferable if you buy a new ship! Come back with the ship you wish to upgrade."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.GetHullUpgraded);
  assertEqual(game.commander.ship.upgradedHull, false);
  assertEqual(game.scarabStatus, ScarabQuestStatus.ScarabDestroyed);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Get your hull upgraded at Khefka.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.GetHullUpgraded);
  assertEqual(game2.commander.ship.upgradedHull, false);
  assertEqual(game2.scarabStatus, ScarabQuestStatus.ScarabDestroyed);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Get your hull upgraded at Khefka.');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_No', 'click');
  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    "The organic hull used in the Scarab is still not ready for day-to-day use. But Captain Renwick can certainly upgrade your hull with some of his retrofit technology. It's light stuff, and won't reduce your ship's range. Should he upgrade your ship?"
  );

  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Technicians spent the day replacing welds and bolts, and adding materials to your ship. When they're done, they tell you your ship should be significantly sturdier."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('Ship Yard', 'click');
  const repairEl = repairs();
  assertEqual(
    textOf(repairEl),
    'Your hull strength is at 100%.\nYour ship has an upgraded hull.\nAutomatically buy repairs upon arrival\n\nBuy an escape pod for $2000'
  );
  assertTrue(
    repairEl!.querySelector('input#autoRepairCheckbox[type="checkbox"]') !== null,
    'auto-repair checkbox shown'
  );
  assertTrue(
    hasText(repairEl, 'label[for="autoRepairCheckbox"]', 'Automatically buy repairs upon arrival'),
    'checkbox has its label'
  );
  assertTrue(
    hasText(repairEl, 'button#buy_escape_pod', 'Buy an escape pod for $2000'),
    'escape pod button shown'
  );

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.upgradedHull, true);
  assertEqual(game.scarabStatus, ScarabQuestStatus.Closed);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.upgradedHull, true);
  assertEqual(game2.scarabStatus, ScarabQuestStatus.Closed);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');

  // Experience some encounters with the upgraded hull
  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replaySkipEncounters(replay);
});

test('scarab_militaryBeamDontWork', () => {
  const replayLog = `{"idLog":["trader","trader","trader","trader","engineer","engineer","engineer","engineer","pilot","pilot","pilot","pilot","fighter","fighter","fighter","fighter","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","namedEvent","namedEvent","namedEvent","galacticChart_useSingularity_121_Adahn","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buyship_Wasp","alertButton_Yes","Equipment","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Beam_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","cheat_freeSingularity","Chart"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|6","slider|input|7","slider|input|8","slider|input|9","click","click","click","click","click","selectPlanet|Regulas","selectPlanet|Tanuga","selectPlanet|Leda","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734408890090}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  // reputationScore is too low for Special to show up
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.Scarab);
  let specialEl = button('Special');
  assertEqual(specialEl, null);

  replay.replayEvent('cheat_averageReputation', 'click');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Adahn');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  // Shows up now
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.Scarab);
  specialEl = button('Special');
  expect(specialEl).not.toBeNull();

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Captain Renwick developed a new organic hull material for his ship which cannot be damaged except by Pulse lasers. While he was celebrating this success, pirates boarded and stole the craft, which they have named the Scarab. Rumors suggest it's being hidden at the exit to a wormhole. Destroy the ship for a reward!"
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(
    game.questListDescription(),
    'Find and destroy the Scarab (which is hiding near a wormhole).'
  );

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(
    game2.questListDescription(),
    'Find and destroy the Scarab (which is hiding near a wormhole).'
  );

  replay.replayEvent('Chart', 'click');

  replay.replayEvent('galacticChart_useSingularity_121_Davlos', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Khefka you encounter a stolen Scarab.\n\nYour opponent attacks.'
  );

  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
  replay.replayEvent('ecButton_Attack', 'click');
  encounterText = textOf(encounterBox());
  expect(encounterText).toContain('You missed the Scarab.');
});

test('ionReactor', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?"
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game.reactorStatus, ReactorQuestStatus.DaysRemaining._20);

  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(game.questListDescription(), 'Deliver the unstable reactor to Nix for Henry Morgan.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.DaysRemaining._20);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix for Henry Morgan.'
  );

  const breakConditionFn = () => {
    const alertTitle = AlertViewController.currentAlertTitle();
    return alertTitle && alertTitle.toLowerCase().includes('reactor');
  };

  const seenAlertTitles = [];

  const expectedFuel = [10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1];

  let loopCycles: number;
  for (
    loopCycles = 0;
    loopCycles < 100 && game.reactorStatus < ReactorQuestStatus.DaysRemaining._1 - 1;
    ++loopCycles
  ) {
    const prevReactorStatus = game.reactorStatus;

    replay.replayEvent('Warp', 'click');
    replay.replayEvent('warpBlastOff', 'click');

    replaySkipEncounters(replay, breakConditionFn);

    const alertTitle = AlertViewController.currentAlertTitle();
    if (alertTitle && [2, 16, 18].includes(game.reactorStatus)) {
      seenAlertTitles.push(alertTitle);
      replay.replayEvent('alertButton_Dismiss', 'click');
    }

    assertEqual(game.reactorStatus, prevReactorStatus + 1);
    const reactorFuelRemaining = expectedFuel[loopCycles];
    assertEqual(
      game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR),
      5 + reactorFuelRemaining
    );
    const baysStr = reactorFuelRemaining === 1 ? 'bay' : 'bays';
    assertEqual(
      game.specialCargoDescription(),
      `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`
    );
    assertEqual(
      game.questListDescription(),
      'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
    );

    game2 = serializeAndDeserialize(game);
    assertEqualGames(game, game2);
    assertEqual(game2.reactorStatus, prevReactorStatus + 1);
    assertEqual(
      game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR),
      5 + reactorFuelRemaining
    );
    assertEqual(
      game2.specialCargoDescription(),
      `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`
    );
    assertEqual(
      game2.questListDescription(),
      'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
    );
  }
  assertEqual(loopCycles, 18);

  const expectedAlertTitles = [
    "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good.",
    "The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation.",
    'The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.',
  ];
  assertEqualArrays(seenAlertTitles, expectedAlertTitles);

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Nix', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Henry Morgan takes delivery of the reactor with great glee. His men immediately set about stabilizing the fuel system. As a reward, Morgan offers you a special, high-powered laser that he designed. Return with an empty weapon slot when you want it installed.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.GetSpecialLaser);
  assertEqual(game.reactorStatus, ReactorQuestStatus.ClosedSaved);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), `Get your special laser at Nix.`);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.GetSpecialLaser);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.ClosedSaved);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), `Get your special laser at Nix.`);

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Morgan's technicians are standing by with something that looks a lot like a military laser -- if you ignore the additional cooling vents and anodized ducts. Do you want them to install Morgan's special laser?"
  );

  replay.replayEvent('alertButton_No', 'click');
  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You have already filled all of your available weapon slots.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('Equipment', 'click');
  replay.replayEvent('sell_Military_laser', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    "You now have Henry Morgan's special laser installed on your ship."
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMorgansLaser), true);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMorgansLaser), true);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('ecButton_Auto_Attack', 'click');
  assertEqual(AlertViewController.currentAlertTitle(), 'You have destroyed your opponent.');
  replay.replayEvent('alertButton_Dismiss', 'click');
});

test('ionReactor_tooLate', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?"
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game.reactorStatus, ReactorQuestStatus.DaysRemaining._20);

  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(game.questListDescription(), 'Deliver the unstable reactor to Nix for Henry Morgan.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.DaysRemaining._20);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix for Henry Morgan.'
  );

  const breakConditionFn = () => {
    const alertTitle = AlertViewController.currentAlertTitle();
    return alertTitle && alertTitle.toLowerCase().includes('reactor');
  };

  const seenAlertTitles = [];

  const expectedFuel = [10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1];

  let loopCycles: number;
  for (
    loopCycles = 0;
    loopCycles < 100 && game.reactorStatus < ReactorQuestStatus.DaysRemaining._1 - 1;
    ++loopCycles
  ) {
    const prevReactorStatus = game.reactorStatus;

    replay.replayEvent('Warp', 'click');
    replay.replayEvent('warpBlastOff', 'click');

    replaySkipEncounters(replay, breakConditionFn);

    const alertTitle = AlertViewController.currentAlertTitle();
    if (alertTitle && [2, 16, 18].includes(game.reactorStatus)) {
      seenAlertTitles.push(alertTitle);
      replay.replayEvent('alertButton_Dismiss', 'click');
    }

    assertEqual(game.reactorStatus, prevReactorStatus + 1);
    const reactorFuelRemaining = expectedFuel[loopCycles];
    assertEqual(
      game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR),
      5 + reactorFuelRemaining
    );
    const baysStr = reactorFuelRemaining === 1 ? 'bay' : 'bays';
    assertEqual(
      game.specialCargoDescription(),
      `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`
    );
    assertEqual(
      game.questListDescription(),
      'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
    );

    game2 = serializeAndDeserialize(game);
    assertEqualGames(game, game2);
    assertEqual(game2.reactorStatus, prevReactorStatus + 1);
    assertEqual(
      game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR),
      5 + reactorFuelRemaining
    );
    assertEqual(
      game2.specialCargoDescription(),
      `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`
    );
    assertEqual(
      game2.questListDescription(),
      'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
    );
  }
  assertEqual(loopCycles, 18);

  const expectedAlertTitles = [
    "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good.",
    "The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation.",
    'The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.',
  ];
  assertEqualArrays(seenAlertTitles, expectedAlertTitles);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay, breakConditionFn);

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Just as you approach the docking bay, the reactor explodes into a huge radioactive fireball!'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.reactorStatus, ReactorQuestStatus.ClosedTooLate);

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You are destroyed along with your ship as a result of the explosion.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  expect(button('End Game and Start Over')).not.toBeNull();
  assertEqual(game.endStatus, GameEndStatus.Killed);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.ClosedTooLate);
  assertEqual(game2.endStatus, GameEndStatus.Killed);
});

test('ionReactor_tooLate_escapePod', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?"
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game.reactorStatus, ReactorQuestStatus.DaysRemaining._20);

  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(game.questListDescription(), 'Deliver the unstable reactor to Nix for Henry Morgan.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.DaysRemaining._20);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix for Henry Morgan.'
  );

  const breakConditionFn = () => {
    const alertTitle = AlertViewController.currentAlertTitle();
    return alertTitle && alertTitle.toLowerCase().includes('reactor');
  };

  const seenAlertTitles = [];

  const expectedFuel = [10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1];

  let loopCycles: number;
  for (
    loopCycles = 0;
    loopCycles < 100 && game.reactorStatus < ReactorQuestStatus.DaysRemaining._1 - 1;
    ++loopCycles
  ) {
    const prevReactorStatus = game.reactorStatus;

    replay.replayEvent('Warp', 'click');
    replay.replayEvent('warpBlastOff', 'click');

    replaySkipEncounters(replay, breakConditionFn);

    const alertTitle = AlertViewController.currentAlertTitle();
    if (alertTitle && [2, 16, 18].includes(game.reactorStatus)) {
      seenAlertTitles.push(alertTitle);
      replay.replayEvent('alertButton_Dismiss', 'click');
    }

    assertEqual(game.reactorStatus, prevReactorStatus + 1);
    const reactorFuelRemaining = expectedFuel[loopCycles];
    assertEqual(
      game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR),
      5 + reactorFuelRemaining
    );
    const baysStr = reactorFuelRemaining === 1 ? 'bay' : 'bays';
    assertEqual(
      game.specialCargoDescription(),
      `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`
    );
    assertEqual(
      game.questListDescription(),
      'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
    );

    game2 = serializeAndDeserialize(game);
    assertEqualGames(game, game2);
    assertEqual(game2.reactorStatus, prevReactorStatus + 1);
    assertEqual(
      game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR),
      5 + reactorFuelRemaining
    );
    assertEqual(
      game2.specialCargoDescription(),
      `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`
    );
    assertEqual(
      game2.questListDescription(),
      'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
    );
  }
  assertEqual(loopCycles, 18);

  const expectedAlertTitles = [
    "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good.",
    "The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation.",
    'The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.',
  ];
  assertEqualArrays(seenAlertTitles, expectedAlertTitles);

  replay.replayEvent('Ship Yard', 'click');

  replay.replayEvent('buy_escape_pod', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay, breakConditionFn);

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Just as you approach the docking bay, the reactor explodes into a huge radioactive fireball!'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.reactorStatus, ReactorQuestStatus.ClosedTooLate);

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Just before the final demise of your ship, your escape pod gets activated and ejects you. After a few days, the Space Corps picks you up and drops you off at a nearby space port.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'In 3 days and with $500, you manage to convert your pod into a Flea.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game.reactorStatus, ReactorQuestStatus.ClosedTooLate);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.ClosedTooLate);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('ionReactor_surrenderToPolice', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?"
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game.reactorStatus, ReactorQuestStatus.DaysRemaining._20);

  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(game.questListDescription(), 'Deliver the unstable reactor to Nix for Henry Morgan.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.DaysRemaining._20);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix for Henry Morgan.'
  );

  const breakConditionFn = () => {
    const encounterTextEl = encounterBox();
    return encounterTextEl && textOf(encounterTextEl).includes('you encounter a police');
  };

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay, breakConditionFn);

  let encounterTextEl = encounterBox();
  expect(textOf(encounterTextEl)).toContain('you encounter a police');

  replay.replayEvent('ecButton_Surrender', 'click');

  assertEqual(AlertViewController.currentAlertTitle(), 'Surrender? Ha! We want your HEAD!');

  // Erase police record so next surrender works
  game.commander.policeRecordScore = PoliceRecordScore.Clean;

  replay.replayEvent('alertButton_Dismiss', 'click');

  replaySkipEncounters(replay, breakConditionFn);

  encounterTextEl = encounterBox();
  expect(textOf(encounterTextEl)).toContain('you encounter a police');

  // Attack the police to gain the option to surrender (otherwise they ignore me)
  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('alertButton_Attack', 'click');

  replay.replayEvent('ecButton_Surrender', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'If you surrender, you will spend some time in prison and will have to pay a hefty fine. Additionally, the police will destroy the Ion Reactor. Are you sure you want to do that?'
  );
  replay.replayEvent('alertButton_Surrender', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    `You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $299000.\nThe police impounded all of the illegal goods you had on board.\nThe police confiscated the Ion Reactor as evidence of your dealings with unsavory characters. The bad news is that you've lost the Ion Reactor. The good news is that you no longer have to worry about managing its depleting fuel store.`
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game.reactorStatus, ReactorQuestStatus.ClosedTooLate);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.ClosedTooLate);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('ionReactor_tribble', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","cheat_freeSingularity","Special","alertButton_Yes","alertButton_Dismiss","Chart","galacticChart_useSingularity_121_Rubicum","alertButton_Warp_","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","Commander"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(
    textOf(specialCargo()),
    '1 cute, furry tribble.\nAn unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    textOf(openQuests()),
    'Get rid of those pesky tribbles.\nDeliver the unstable reactor to Nix for Henry Morgan.'
  );
  assertEqual(
    game.specialCargoDescription(),
    '1 cute, furry tribble.\nAn unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game.questListDescription(),
    'Get rid of those pesky tribbles.\nDeliver the unstable reactor to Nix for Henry Morgan.'
  );
  assertEqual(game.commander.ship.tribbles, 1);

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(
    game2.specialCargoDescription(),
    '1 cute, furry tribble.\nAn unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Get rid of those pesky tribbles.\nDeliver the unstable reactor to Nix for Henry Morgan.'
  );
  assertEqual(game2.commander.ship.tribbles, 1);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  const breakConditionFn = () => {
    const alertTitle = AlertViewController.currentAlertTitle();
    return alertTitle && alertTitle.toLowerCase().includes('tribbles');
  };

  replaySkipEncounters(replay, breakConditionFn);

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'The radiation from the Ion Reactor is deadly to Tribbles. All of the Tribbles on board your ship have died.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game.questListDescription(),
    'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
  );
  assertEqual(game.commander.ship.tribbles, 0);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.tribbles, 0);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
  );
});

test('ionReactor_early', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?"
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game.reactorStatus, ReactorQuestStatus.DaysRemaining._20);

  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(game.questListDescription(), 'Deliver the unstable reactor to Nix for Henry Morgan.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.DaysRemaining._20);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix for Henry Morgan.'
  );

  const breakConditionFn = () => {
    const alertTitle = AlertViewController.currentAlertTitle();
    return alertTitle && alertTitle.toLowerCase().includes('reactor');
  };

  const seenAlertTitles = [];

  const expectedFuel = [10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1];

  let loopCycles: number;
  for (
    loopCycles = 0;
    loopCycles < 100 && game.reactorStatus < ReactorQuestStatus.DaysRemaining._1 - 9;
    ++loopCycles
  ) {
    const prevReactorStatus = game.reactorStatus;

    replay.replayEvent('Warp', 'click');
    replay.replayEvent('warpBlastOff', 'click');

    replaySkipEncounters(replay, breakConditionFn);

    const alertTitle = AlertViewController.currentAlertTitle();
    if (alertTitle && [2, 16, 18].includes(game.reactorStatus)) {
      seenAlertTitles.push(alertTitle);
      replay.replayEvent('alertButton_Dismiss', 'click');
    }

    assertEqual(game.reactorStatus, prevReactorStatus + 1);
    const reactorFuelRemaining = expectedFuel[loopCycles];
    assertEqual(
      game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR),
      5 + reactorFuelRemaining
    );
    const baysStr = reactorFuelRemaining === 1 ? 'bay' : 'bays';
    assertEqual(
      game.specialCargoDescription(),
      `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`
    );
    assertEqual(
      game.questListDescription(),
      'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
    );

    game2 = serializeAndDeserialize(game);
    assertEqualGames(game, game2);
    assertEqual(game2.reactorStatus, prevReactorStatus + 1);
    assertEqual(
      game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR),
      5 + reactorFuelRemaining
    );
    assertEqual(
      game2.specialCargoDescription(),
      `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`
    );
    assertEqual(
      game2.questListDescription(),
      'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
    );
  }
  assertEqual(loopCycles, 10);

  const expectedAlertTitles = [
    "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good.",
    //"The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation.",
    //"The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.",
  ];
  assertEqualArrays(seenAlertTitles, expectedAlertTitles);

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Nix', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Henry Morgan takes delivery of the reactor with great glee. His men immediately set about stabilizing the fuel system. As a reward, Morgan offers you a special, high-powered laser that he designed. Return with an empty weapon slot when you want it installed.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.GetSpecialLaser);
  assertEqual(game.reactorStatus, ReactorQuestStatus.ClosedSaved);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), `Get your special laser at Nix.`);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.GetSpecialLaser);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.ClosedSaved);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), `Get your special laser at Nix.`);

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Morgan's technicians are standing by with something that looks a lot like a military laser -- if you ignore the additional cooling vents and anodized ducts. Do you want them to install Morgan's special laser?"
  );

  replay.replayEvent('alertButton_No', 'click');
  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You have already filled all of your available weapon slots.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('Equipment', 'click');
  replay.replayEvent('sell_Military_laser', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    "You now have Henry Morgan's special laser installed on your ship."
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMorgansLaser), true);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.hasWeaponOfType(AccessoryType.WeaponMorgansLaser), true);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('ecButton_Auto_Attack', 'click');
  assertEqual(AlertViewController.currentAlertTitle(), 'You have destroyed your opponent.');
  replay.replayEvent('alertButton_Dismiss', 'click');
});

test('ionReactor_notEnoughBays', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Buy', 'click');
  replay.replayEvent('cargo_FursBuy_All', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    "You don't have enough empty cargo bays at the moment."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('Sell', 'click');
  replay.replayEvent('cargo_FursSell_All', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game.reactorStatus, ReactorQuestStatus.DaysRemaining._20);

  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(game.questListDescription(), 'Deliver the unstable reactor to Nix for Henry Morgan.');

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.DaysRemaining._20);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix for Henry Morgan.'
  );
});

test('ionReactor_cantBuyShip', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game.reactorStatus, ReactorQuestStatus.DaysRemaining._20);

  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(game.questListDescription(), 'Deliver the unstable reactor to Nix for Henry Morgan.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.DaysRemaining._20);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix for Henry Morgan.'
  );

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Iralius');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('buyship_Termite', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Sorry! We can't take your ship as a trade-in. That Ion Reactor looks dangerous, and we have no way of removing it. Come back when you've gotten rid of it."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.type, ShipModelType.Wasp);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game.questListDescription(),
    'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
  );

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.type, ShipModelType.Wasp);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix before it consumes all of its fuel.'
  );
});

test('ionReactor_destroyedInBattle', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game.reactorStatus, ReactorQuestStatus.DaysRemaining._20);

  assertEqual(
    game.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(game.questListDescription(), 'Deliver the unstable reactor to Nix for Henry Morgan.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 15);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.DaysRemaining._20);
  assertEqual(
    game2.specialCargoDescription(),
    'An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.'
  );
  assertEqual(
    game2.questListDescription(),
    'Deliver the unstable reactor to Nix for Henry Morgan.'
  );

  replay.replayEvent('Equipment', 'click');
  replay.replayEvent('sell_Military_laser', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  replay.replayEvent('sell_Military_laser', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  replay.replayEvent('sell_Military_laser', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  replay.replayEvent('sell_Reflective_shield', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  replay.replayEvent('sell_Reflective_shield', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('buy_escape_pod', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Auto_Attack', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Just before the final demise of your ship, your escape pod gets activated and ejects you. The destruction of your ship is made much more spectacular by the added explosion of the Ion Reactor. After a few days, the Space Corps picks you up and drops you off at a nearby space port.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'In 3 days and with $500, you manage to convert your pod into a Flea.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.type, ShipModelType.Flea);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game.reactorStatus, ReactorQuestStatus.ClosedTooLate);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.type, ShipModelType.Flea);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR), 0);
  assertEqual(game2.reactorStatus, ReactorQuestStatus.ClosedTooLate);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('experiment_early', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('galacticChart_useSingularity_121_Talani', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "While reviewing the plans for Dr. Fehler's new space-warping drive, Dr. Lowenstam discovered a critical error. If you don't go to Daled and stop the experiment within ten days, the space-time continuum itself could be damaged!"
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._10);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 10 days.");

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._10);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(
    game2.questListDescription(),
    "Stop Dr. Fehler's experiment at Daled within 10 days."
  );

  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_track_121_Daled', 'click');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._9);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._9);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._8);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._8);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.");

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('autoFuelCheckbox', 'change');
  replay.replayEvent('autoRepairCheckbox', 'change');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Othello');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._7);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._7);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._6);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._6);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.");

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Upon your warning, Dr. Fehler calls off the experiment. As a reward, you are given a Portable Singularity. This device will, for one time only, instantaneously transport you to any system in the galaxy. The Singularity can be accessed on the Galactic Chart.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.canSuperWarp, true);
  assertEqual(game.experimentStatus, ExperimentQuestStatus.ClosedSaved);
  assertEqual(game.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.canSuperWarp, true);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.ClosedSaved);
  assertEqual(game2.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('experiment_last_day', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('galacticChart_useSingularity_121_Talani', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "While reviewing the plans for Dr. Fehler's new space-warping drive, Dr. Lowenstam discovered a critical error. If you don't go to Daled and stop the experiment within ten days, the space-time continuum itself could be damaged!"
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._10);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 10 days.");

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._10);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(
    game2.questListDescription(),
    "Stop Dr. Fehler's experiment at Daled within 10 days."
  );

  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_track_121_Daled', 'click');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._9);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._9);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._8);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._8);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.");

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('autoFuelCheckbox', 'change');
  replay.replayEvent('autoRepairCheckbox', 'change');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Othello');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._7);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._7);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._6);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._6);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._5);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 5 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._5);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 5 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._4);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 4 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._4);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 4 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._3);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 3 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._3);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 3 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._2);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(
    game.questListDescription(),
    "Stop Dr. Fehler's experiment at Daled by end of tomorrow."
  );

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(
    game2.questListDescription(),
    "Stop Dr. Fehler's experiment at Daled by end of tomorrow."
  );

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._1);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._1);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.");

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Daled', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._1);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._1);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.");

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Upon your warning, Dr. Fehler calls off the experiment. As a reward, you are given a Portable Singularity. This device will, for one time only, instantaneously transport you to any system in the galaxy. The Singularity can be accessed on the Galactic Chart.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.canSuperWarp, true);
  assertEqual(game.experimentStatus, ExperimentQuestStatus.ClosedSaved);
  assertEqual(game.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.canSuperWarp, true);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.ClosedSaved);
  assertEqual(game2.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('experiment_fail', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('galacticChart_useSingularity_121_Talani', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "While reviewing the plans for Dr. Fehler's new space-warping drive, Dr. Lowenstam discovered a critical error. If you don't go to Daled and stop the experiment within ten days, the space-time continuum itself could be damaged!"
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._10);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 10 days.");

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._10);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(
    game2.questListDescription(),
    "Stop Dr. Fehler's experiment at Daled within 10 days."
  );

  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_track_121_Daled', 'click');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._9);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._9);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._8);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._8);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.");

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('autoFuelCheckbox', 'change');
  replay.replayEvent('autoRepairCheckbox', 'change');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Othello');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._7);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._7);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._6);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._6);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._5);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 5 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._5);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 5 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._4);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 4 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._4);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 4 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._3);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 3 days.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._3);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 3 days.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._2);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(
    game.questListDescription(),
    "Stop Dr. Fehler's experiment at Daled by end of tomorrow."
  );

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(
    game2.questListDescription(),
    "Stop Dr. Fehler's experiment at Daled by end of tomorrow."
  );

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.DaysRemaining._1);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.");

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.DaysRemaining._1);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.");

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.experimentStatus, ExperimentQuestStatus.ClosedTooLate);
  assertEqual(game.fabricRipProbability, FABRIC_RIP_PROBABILITY_INITIAL);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.experimentStatus, ExperimentQuestStatus.ClosedTooLate);
  assertEqual(game2.fabricRipProbability, FABRIC_RIP_PROBABILITY_INITIAL);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "The galaxy is abuzz with news of a terrible malfunction in Dr. Fehler's laboratory. Evidently, he was not warned in time and he performed his experiment... with disastrous results! You may not reach your planned destination!"
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  replaySkipEncounters(replay);

  let loopCycles: number;
  for (loopCycles = 0; loopCycles < 100 && game.fabricRipProbability > 0; ++loopCycles) {
    replay.replayEvent('Warp', 'click');
    replay.replayEvent('warpBlastOff', 'click');

    replaySkipEncounters(replay);

    assertEqual(game.experimentStatus, ExperimentQuestStatus.ClosedTooLate);
    assertEqual(game.fabricRipProbability, FABRIC_RIP_PROBABILITY_INITIAL - 2 - loopCycles);
    assertEqual(game.specialCargoDescription(), 'No special items.');
    assertEqual(game.questListDescription(), 'No open quests.');

    game2 = serializeAndDeserialize(game);
    assertEqualGames(game, game2);
    assertEqual(game2.experimentStatus, ExperimentQuestStatus.ClosedTooLate);
    assertEqual(game2.fabricRipProbability, FABRIC_RIP_PROBABILITY_INITIAL - 2 - loopCycles);
    assertEqual(game2.specialCargoDescription(), 'No special items.');
    assertEqual(game2.questListDescription(), 'No open quests.');
  }
  assertEqual(loopCycles, FABRIC_RIP_PROBABILITY_INITIAL - 1);
});

test('monster', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('galacticChart_useSingularity_121_Antedi', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "A space monster has invaded the Acamar system and is disturbing the trade routes. You'll be rewarded handsomely if you manage to destroy it."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.monsterStatus, MonsterQuestStatus.MonsterExists);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Kill the space monster at Acamar.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.monsterStatus, MonsterQuestStatus.MonsterExists);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Kill the space monster at Acamar.');

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Acamar', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  const breakConditionFn = () => {
    const encounterText = textOf(encounterBox());
    return (
      encounterText ===
      'At 1 click from Acamar you encounter the terrifying Space Monster.\n\nYour opponent attacks.'
    );
  };

  replaySkipEncounters(replay, breakConditionFn);

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 1 click from Acamar you encounter the terrifying Space Monster.\n\nYour opponent attacks.'
  );

  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('ecButton_Attack', 'click');

  // Run away

  replaySkipEncounters(replay);

  assertEqual(game.monsterHull, 299);
  assertEqual(game.monsterStatus, MonsterQuestStatus.MonsterExists);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Kill the space monster at Acamar.');
  const specialEl = button('Special');
  assertEqual(specialEl, null);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.monsterHull, 299);
  assertEqual(game2.monsterStatus, MonsterQuestStatus.MonsterExists);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Kill the space monster at Acamar.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay, breakConditionFn);

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 1 click from Acamar you encounter the terrifying Space Monster.\n\nYour opponent attacks.'
  );

  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('ecButton_Attack', 'click');

  // Run away

  replaySkipEncounters(replay);

  assertEqual(game.monsterHull, 196);
  assertEqual(game.monsterStatus, MonsterQuestStatus.MonsterExists);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Kill the space monster at Acamar.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.monsterHull, 196);
  assertEqual(game2.monsterStatus, MonsterQuestStatus.MonsterExists);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Kill the space monster at Acamar.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay, breakConditionFn);

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 1 click from Acamar you encounter the terrifying Space Monster.\n\nYour opponent attacks.'
  );
  assertEqual(game.monsterHull, 215);

  replay.replayEvent('ecButton_Auto_Attack', 'click');

  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  const creditsBefore = game.commander.credits;
  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'We thank you for destroying the space monster that circled our system for so long. Please accept $15000 as reward for your heroic deed.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.credits, creditsBefore + 15000);
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game.monsterStatus, MonsterQuestStatus.ClosedMonsterDestroyed);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.credits, creditsBefore + 15000);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
  assertEqual(game2.monsterStatus, MonsterQuestStatus.ClosedMonsterDestroyed);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('jarek', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('galacticChart_useSingularity_121_Ashen', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'A recent change in the political climate of this solar system has forced ambassador Jarek to flee back to his home system, Devidia. Would you be willing to give him a lift?'
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(AlertViewController.currentAlertTitle(), 'You have taken Ambassador Jarek on board.');

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship._crew[0].name, 'Ambassador Jarek');
  assertEqual(game.commander.ship._crew[0].forQuest, true);
  assertEqual(game.jarekStatus, JarekQuestStatus.OnBoard);
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Bring Ambassador Jarek to Devidia.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship._crew[0].name, 'Ambassador Jarek');
  assertEqual(game2.commander.ship._crew[0].forQuest, true);
  assertEqual(game2.jarekStatus, JarekQuestStatus.OnBoard);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Bring Ambassador Jarek to Devidia.');

  replay.replayEvent('Roster', 'click');

  const crewMember = game.commander.ship.crew[0];
  // We don't show hireFire button

  // He shows up with no cost, no skills
  const personnelRow = tableRow(crewMember.name!);
  assertEqual(textOf(personnelRow!.cells[0]), 'Ambassador Jarek');
  assertTrue(personnelRow!.querySelector('img') !== null, 'roster icon shown');
  assertEqual(personnelRow!.querySelectorAll('button').length, 0);

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Devidia', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  const traderSkillBefore = game.commander.ship.crewTraderSkillIncludingCommander(game.commander);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Ambassador Jarek is very grateful to you for delivering him back to Devidia. As a reward, he gives you an experimental handheld haggling computer, which allows you to gain larger discounts when purchasing goods and equipment.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.jarekStatus, JarekQuestStatus.Closed);
  assertEqual(game.commander.carriesMaxTraderBoost, true);
  assertEqual(game.commander.ship._crew.length, 0);
  assertEqual(
    game.commander.ship.crewTraderSkillIncludingCommander(game.commander),
    traderSkillBefore + 1
  );

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);

  assertEqual(game.specialCargoDescription(), 'A haggling computer.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.jarekStatus, JarekQuestStatus.Closed);
  assertEqual(game2.commander.carriesMaxTraderBoost, true);
  assertEqual(game2.commander.ship._crew.length, 0);
  assertEqual(
    game2.commander.ship.crewTraderSkillIncludingCommander(game.commander),
    traderSkillBefore + 1
  );

  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);

  assertEqual(game2.specialCargoDescription(), 'A haggling computer.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('jarek_arrested', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('galacticChart_useSingularity_121_Ashen', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'A recent change in the political climate of this solar system has forced ambassador Jarek to flee back to his home system, Devidia. Would you be willing to give him a lift?'
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(AlertViewController.currentAlertTitle(), 'You have taken Ambassador Jarek on board.');

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship._crew[0].name, 'Ambassador Jarek');
  assertEqual(game.commander.ship._crew[0].forQuest, true);
  assertEqual(game.jarekStatus, JarekQuestStatus.OnBoard);
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Bring Ambassador Jarek to Devidia.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship._crew[0].name, 'Ambassador Jarek');
  assertEqual(game2.commander.ship._crew[0].forQuest, true);
  assertEqual(game2.jarekStatus, JarekQuestStatus.OnBoard);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Bring Ambassador Jarek to Devidia.');

  replay.replayEvent('Roster', 'click');

  const crewMember = game.commander.ship.crew[0];
  // We don't show hireFire button

  // He shows up with no cost, no skills
  const personnelRow = tableRow(crewMember.name!);
  assertEqual(textOf(personnelRow!.cells[0]), 'Ambassador Jarek');
  assertTrue(personnelRow!.querySelector('img') !== null, 'roster icon shown');
  assertEqual(personnelRow!.querySelectorAll('button').length, 0);

  // Get arrested

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('alertButton_Attack', 'click');
  replay.replayEvent('ecButton_Surrender', 'click');
  replay.replayEvent('alertButton_Surrender', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $300500.\nThe Space Corps decides to give Ambassador Jarek a lift home to Devidia.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.jarekStatus, JarekQuestStatus.Closed);
  assertEqual(game.commander.ship.crew.length, 0);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.jarekStatus, JarekQuestStatus.Closed);
  assertEqual(game2.commander.ship.crew.length, 0);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('jarek_noSlots', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Og","alertButton_Warp_"],"eventNameLog":["click","click","click","click","click","click"],"gameRandSeed":1733910981199}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replaySkipEncounters(replay);

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.AmbassadorJarek);

  let specialEl = button('Special');
  expect(specialEl).not.toBeNull();

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'A recent change in the political climate of this solar system has forced ambassador Jarek to flee back to his home system, Devidia. Would you be willing to give him a lift?'
  );

  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You do not have any crew quarters available for Ambassador Jarek.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.AmbassadorJarek);

  specialEl = button('Special');
  expect(specialEl).not.toBeNull();
});

test('alienArtifact', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Bretel","alertButton_Warp_"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'This alien artifact should be delivered to Professor Berger, who is currently traveling. You can probably find him at a hi-tech solar system. The alien race which produced this artifact seems keen on getting it back, however, and may hinder the carrier. Are you, for a price, willing to deliver it?'
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(game.commander.artifactOnBoard, true);
  assertEqual(game.specialCargoDescription(), 'An alien artifact.');
  assertEqual(
    game.questListDescription(),
    'Deliver the alien artifact to Professor Berger at some hi-tech system.'
  );

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.artifactOnBoard, true);
  assertEqual(game2.specialCargoDescription(), 'An alien artifact.');
  assertEqual(
    game2.questListDescription(),
    'Deliver the alien artifact to Professor Berger at some hi-tech system.'
  );

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');

  replay.replayEvent('galacticChart_useSingularity_121_Krios', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 16 clicks from Krios you encounter an alien Mantis.\n\nYour opponent attacks.'
  );

  replaySkipEncounters(replay);

  const creditsBefore = game.commander.credits;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "This is Professor Berger. I thank you for delivering the alien artifact to me. I hope the aliens weren't too much of a nuisance. I have transferred $20000 to your account, which I assume compensates you for your troubles."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');
  assertEqual(game.commander.artifactOnBoard, false);
  assertEqual(game.commander.credits, creditsBefore + 20000);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
  assertEqual(game2.commander.artifactOnBoard, false);
  assertEqual(game2.commander.credits, creditsBefore + 20000);
});

test('alienArtifact_surrender', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Bretel","alertButton_Warp_"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'This alien artifact should be delivered to Professor Berger, who is currently traveling. You can probably find him at a hi-tech solar system. The alien race which produced this artifact seems keen on getting it back, however, and may hinder the carrier. Are you, for a price, willing to deliver it?'
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(game.commander.artifactOnBoard, true);
  assertEqual(game.specialCargoDescription(), 'An alien artifact.');
  assertEqual(
    game.questListDescription(),
    'Deliver the alien artifact to Professor Berger at some hi-tech system.'
  );

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.artifactOnBoard, true);
  assertEqual(game2.specialCargoDescription(), 'An alien artifact.');
  assertEqual(
    game2.questListDescription(),
    'Deliver the alien artifact to Professor Berger at some hi-tech system.'
  );

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');

  replay.replayEvent('galacticChart_useSingularity_121_Krios', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 16 clicks from Krios you encounter an alien Mantis.\n\nYour opponent attacks.'
  );

  replay.replayEvent('ecButton_Surrender');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'If you surrender to the aliens, they will steal the artifact. Are you sure you wish to do that?'
  );

  replay.replayEvent('alertButton_Surrender');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "The aliens have taken the artifact from you. Well, it's rightfully theirs, so you probably shouldn't complain. You won't receive any reward from Professor Berger, though."
  );

  replay.replayEvent('alertButton_Dismiss');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');
  assertEqual(game.commander.artifactOnBoard, false);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
  assertEqual(game2.commander.artifactOnBoard, false);
});

test('gemulon_alienInvasion_fail', () => {
  const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Largo');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('autoFuelCheckbox', 'change');
  replay.replayEvent('Full_repair', 'click');
  replay.replayEvent('autoRepairCheckbox', 'change');
  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Castor');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 3 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 3 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Japori');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(
    game.questListDescription(),
    'Inform Gemulon about alien invasion by end of tomorrow.'
  );

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(
    game2.questListDescription(),
    'Inform Gemulon about alien invasion by end of tomorrow.'
  );

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Kravat');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion today.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion today.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Vagra');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');
  assertEqual(game.invasionStatus, InvasionQuestStatus.ClosedTooLate);
  const gemulon = game._findSolarSystem('Gemulon')!;
  assertEqual(gemulon.specialEvent, SpecialEvent.GemulonInvaded);
  assertEqual(gemulon.techLevel, TechLevel.PreAgricultural);
  assertEqual(gemulon.politics.type, PoliticsType.Anarchy);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Gemulon');
  replay.replayEvent('warpBlastOff', 'click');

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 20 clicks from Gemulon you encounter an alien Mantis.\n\nYour opponent attacks.'
  );

  replaySkipEncounters(replay);

  const systemInfoEl = systemInfo();
  assertEqual(
    textOf(systemInfoEl),
    'large pre-agricultural anarchist state\nunder no particular pressure\nnothing special, no police, excessive pirates'
  );

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Alas, Gemulon has been invaded by aliens, which has thrown us back to pre-agricultural times. If only we had known the exact coordinates where they first arrived at our system, we might have prevented this tragedy from happening.'
  );
});

test('gemulon_alienInvasion_oneDayLate', () => {
  const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Largo');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('autoFuelCheckbox', 'change');
  replay.replayEvent('Full_repair', 'click');
  replay.replayEvent('autoRepairCheckbox', 'change');
  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Castor');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 3 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 3 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Japori');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(
    game.questListDescription(),
    'Inform Gemulon about alien invasion by end of tomorrow.'
  );

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(
    game2.questListDescription(),
    'Inform Gemulon about alien invasion by end of tomorrow.'
  );

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Kravat');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion today.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion today.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Vagra');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');
  assertEqual(game.invasionStatus, InvasionQuestStatus.ClosedTooLate);
  const gemulon = game._findSolarSystem('Gemulon')!;
  assertEqual(gemulon.specialEvent, SpecialEvent.GemulonInvaded);
  assertEqual(gemulon.techLevel, TechLevel.PreAgricultural);
  assertEqual(gemulon.politics.type, PoliticsType.Anarchy);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');

  // Use singularity so it's the same day

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Gemulon', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  const systemInfoEl = systemInfo();
  assertEqual(
    textOf(systemInfoEl),
    'large pre-agricultural anarchist state\nunder no particular pressure\nnothing special, no police, excessive pirates'
  );

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Alas, Gemulon has been invaded by aliens, which has thrown us back to pre-agricultural times. If only we had known the exact coordinates where they first arrived at our system, we might have prevented this tragedy from happening.'
  );
});

test('gemulon_alienInvasion_arriveLastDay', () => {
  const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Largo');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('autoFuelCheckbox', 'change');
  replay.replayEvent('Full_repair', 'click');
  replay.replayEvent('autoRepairCheckbox', 'change');
  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Castor');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 3 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 3 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Japori');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(
    game.questListDescription(),
    'Inform Gemulon about alien invasion by end of tomorrow.'
  );

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(
    game2.questListDescription(),
    'Inform Gemulon about alien invasion by end of tomorrow.'
  );

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Kravat');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion today.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion today.');

  // Cheat to avoid dying at the hands of the Mantises on the next warp
  game.commander.pilot = 15;

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Gemulon', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion today.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion today.');

  // Save Gemulon

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'This information of the arrival of the alien invasion force allows us to prepare a defense. You have saved our way of life. As a reward, we have a fuel compactor gadget for you, which allows you to travel 18 parsecs with any ship. Return here to get it installed.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Get your fuel compactor at Gemulon.');
  assertEqual(game.invasionStatus, InvasionQuestStatus.ClosedSaved);
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.GetFuelCompactor);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Get your fuel compactor at Gemulon.');
  assertEqual(game2.invasionStatus, InvasionQuestStatus.ClosedSaved);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.GetFuelCompactor);

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Do you wish for us to install the fuel compactor on your current ship?'
  );
  replay.replayEvent('alertButton_No', 'click');
  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Do you wish for us to install the fuel compactor on your current ship?'
  );
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You now have a fuel compactor installed on your ship.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.hasGadgetOfType(AccessoryType.GadgetFuelCompactor), true);
  assertEqual(game.commander.ship.fuelTankCapacity(), 18);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.hasGadgetOfType(AccessoryType.GadgetFuelCompactor), true);
  assertEqual(game2.commander.ship.fuelTankCapacity(), 18);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('gemulon_alienInvasion_arriveEarly', () => {
  const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Largo');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('autoFuelCheckbox', 'change');
  replay.replayEvent('Full_repair', 'click');
  replay.replayEvent('autoRepairCheckbox', 'change');
  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Gemulon', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  // Save Gemulon

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'This information of the arrival of the alien invasion force allows us to prepare a defense. You have saved our way of life. As a reward, we have a fuel compactor gadget for you, which allows you to travel 18 parsecs with any ship. Return here to get it installed.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Get your fuel compactor at Gemulon.');
  assertEqual(game.invasionStatus, InvasionQuestStatus.ClosedSaved);
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.GetFuelCompactor);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Get your fuel compactor at Gemulon.');
  assertEqual(game2.invasionStatus, InvasionQuestStatus.ClosedSaved);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.GetFuelCompactor);

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Do you wish for us to install the fuel compactor on your current ship?'
  );
  replay.replayEvent('alertButton_No', 'click');
  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Do you wish for us to install the fuel compactor on your current ship?'
  );
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You now have a fuel compactor installed on your ship.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.hasGadgetOfType(AccessoryType.GadgetFuelCompactor), true);
  assertEqual(game.commander.ship.fuelTankCapacity(), 18);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.hasGadgetOfType(AccessoryType.GadgetFuelCompactor), true);
  assertEqual(game2.commander.ship.fuelTankCapacity(), 18);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('gemulon_alienInvasion_arriveEarly_noSlots', () => {
  const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 7 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('namedEvent', 'selectPlanetZoomed|Largo');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 6 days.');

  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('fulltank', 'click');
  replay.replayEvent('autoFuelCheckbox', 'change');
  replay.replayEvent('Full_repair', 'click');
  replay.replayEvent('autoRepairCheckbox', 'change');
  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 5 days.');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Gemulon', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  replaySkipEncounters(replay);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Inform Gemulon about alien invasion within 4 days.');

  // Save Gemulon

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'This information of the arrival of the alien invasion force allows us to prepare a defense. You have saved our way of life. As a reward, we have a fuel compactor gadget for you, which allows you to travel 18 parsecs with any ship. Return here to get it installed.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Get your fuel compactor at Gemulon.');
  assertEqual(game.invasionStatus, InvasionQuestStatus.ClosedSaved);
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.GetFuelCompactor);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Get your fuel compactor at Gemulon.');
  assertEqual(game2.invasionStatus, InvasionQuestStatus.ClosedSaved);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.GetFuelCompactor);

  replay.replayEvent('Equipment', 'click');
  replay.replayEvent('buy_5_extra_cargo_bays', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Do you wish for us to install the fuel compactor on your current ship?'
  );
  replay.replayEvent('alertButton_No', 'click');
  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Do you wish for us to install the fuel compactor on your current ship?'
  );
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You have already filled all of your available gadget slots.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Get your fuel compactor at Gemulon.');
  assertEqual(game.invasionStatus, InvasionQuestStatus.ClosedSaved);
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.GetFuelCompactor);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Get your fuel compactor at Gemulon.');
  assertEqual(game2.invasionStatus, InvasionQuestStatus.ClosedSaved);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.GetFuelCompactor);

  replay.replayEvent('Equipment', 'click');
  replay.replayEvent('sell_5_extra_cargo_bays', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Do you wish for us to install the fuel compactor on your current ship?'
  );
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You now have a fuel compactor installed on your ship.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.hasGadgetOfType(AccessoryType.GadgetFuelCompactor), true);
  assertEqual(game.commander.ship.fuelTankCapacity(), 18);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.hasGadgetOfType(AccessoryType.GadgetFuelCompactor), true);
  assertEqual(game2.commander.ship.fuelTankCapacity(), 18);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('cargoForSale', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Ashen","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733734388479}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'A trader in second-hand goods offers you 3 sealed cargo canisters for the sum of $1000. It could be a good deal: they could contain robots. Then again, it might just be water. Do you want the canisters?'
  );

  replay.replayEvent('alertButton_No', 'click');

  let cargoQuantity = [...game.commander.ship._cargo.values()].reduce(
    (acc, value) => acc + value,
    0
  );
  assertEqual(cargoQuantity, 0);

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(AlertViewController.currentAlertTitle(), 'The canisters contain medicine.');

  replay.replayEvent('alertButton_Dismiss', 'click');

  cargoQuantity = [...game.commander.ship._cargo.values()].reduce((acc, value) => acc + value, 0);
  assertEqual(cargoQuantity, 3);
  assertEqual(game.commander.ship.tradeItemQuantityForType(TradeItemType.Medicine), 3);

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  cargoQuantity = [...game2.commander.ship._cargo.values()].reduce((acc, value) => acc + value, 0);
  assertEqual(cargoQuantity, 3);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Medicine), 3);

  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
});

test('wild_cleanRecord', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.TransportWild);
  // Don't have a police record, special doesn't show
  const specialEl = button('Special');
  assertEqual(specialEl, null);
});

test('wild_bribePolice', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Cestus","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","namedEvent","warpBlastOff"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Bretel","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iodine","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Courteney","click"],"gameRandSeed":1733627017971}`;
  const replay = runReplayLog(replayLog);

  replay.replayEvent('ecButton_Bribe', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'These police officers are willing to forego inspection for $10000.'
  );

  replay.replayEvent('alertButton_Offer_bribe', 'click');

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 19 clicks from Courteney you encounter a pirate Bumblebee.\n\nYour opponent attacks.'
  );
});

test('wild_noSlots', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.TransportWild);

  let specialEl = button('Special');
  expect(specialEl).not.toBeNull();

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Law Enforcement is closing in on notorious criminal kingpin Jonathan Wild. He would reward you handsomely for smuggling him home to Kravat. You'd have to avoid capture by the Police on the way. Are you willing to give him a berth?"
  );

  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You do not have any crew quarters available for Jonathan Wild.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.TransportWild);

  specialEl = button('Special');
  expect(specialEl).not.toBeNull();
});

test('wild_noLaser', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Military_laser","alertButton_Yes","sell_Beam_laser","alertButton_Yes","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(
    AlertViewController.currentAlertTitle(),
    `Jonathan Wild refuses to board unless you're armed with a Beam Laser or better. He'd rather take his chances hiding out here on Exo.`
  );

  replay.replayEvent('alertButton_Dismiss', 'click');
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.TransportWild);

  const specialEl = button('Special');
  expect(specialEl).not.toBeNull();
});

test('wild_onBoard', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(AlertViewController.currentAlertTitle(), 'You have taken Jonathan Wild on board.');

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.wildStatus, WildQuestStatus.OnBoard);
  assertEqual(game.commander.ship.crew.length, 1);
  assertEqual(game.commander.ship.crew[0].name, 'Jonathan Wild');
  assertEqual(game.commander.ship.crew[0].forQuest, true);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Smuggle Jonathan Wild to Kravat.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.wildStatus, WildQuestStatus.OnBoard);
  assertEqual(game2.commander.ship.crew.length, 1);
  assertEqual(game2.commander.ship.crew[0].name, 'Jonathan Wild');
  assertEqual(game2.commander.ship.crew[0].forQuest, true);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Smuggle Jonathan Wild to Kravat.');

  replay.replayEvent('Roster', 'click');

  const crewMember = game.commander.ship.crew[0];
  // We don't show hireFire button

  // He shows up with no cost, no skills
  const personnelRow = tableRow(crewMember.name!);
  assertEqual(textOf(personnelRow!.cells[0]), 'Jonathan Wild');
  assertTrue(personnelRow!.querySelector('img') !== null, 'roster icon shown');
  assertEqual(personnelRow!.querySelectorAll('button').length, 0);

  // I need the extra pilot skill to survive the journey to Kravat
  replay.replayEvent('hireFire_Mercedez', 'click');

  // Now deliver him to Kravat
  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Kravat', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');
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
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Jonathan Wild is most grateful to you for spiriting him to safety. As a reward, he has one of his Cyber Criminals hack into the Police Database, and clean up your record. He also offers you the opportunity to take his talented nephew Zeethibal along as a Mercenary with no pay.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.wildStatus, WildQuestStatus.Closed);
  assertEqual(game.commander.ship.crew.length, 2);
  assertEqual(game.commander.ship.crew[0].name, 'Mercedez');
  assertEqual(game.commander.ship.crew[0].forQuest, false);
  assertEqual(game.commander.ship.crew[1].name, 'Zeethibal');
  assertEqual(game.commander.ship.crew[1].forQuest, false);
  assertEqual(game.commander.ship.crew[1].freeMercenaryCost, true);
  assertEqual(game.commander.ship.crew[1].pilot, 8);
  assertEqual(game.commander.ship.crew[1].fighter, 5);
  assertEqual(game.commander.ship.crew[1].trader, 10);
  assertEqual(game.commander.ship.crew[1].engineer, 5);
  assertEqual(game.commander.policeRecordScore, PoliceRecordScore.Clean);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);

  assertEqual(game2.wildStatus, WildQuestStatus.Closed);
  assertEqual(game2.commander.ship.crew.length, 2);
  assertEqual(game2.commander.ship.crew[0].name, 'Mercedez');
  assertEqual(game2.commander.ship.crew[0].forQuest, false);
  assertEqual(game2.commander.ship.crew[1].name, 'Zeethibal');
  assertEqual(game2.commander.ship.crew[1].forQuest, false);
  assertEqual(game2.commander.ship.crew[1].freeMercenaryCost, true);
  assertEqual(game2.commander.ship.crew[1].pilot, 8);
  assertEqual(game2.commander.ship.crew[1].fighter, 5);
  assertEqual(game2.commander.ship.crew[1].trader, 10);
  assertEqual(game2.commander.ship.crew[1].engineer, 5);
  assertEqual(game2.commander.policeRecordScore, PoliceRecordScore.Clean);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
});

test('wild_surrenderToPirate', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(AlertViewController.currentAlertTitle(), 'You have taken Jonathan Wild on board.');

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.wildStatus, WildQuestStatus.OnBoard);
  assertEqual(game.commander.ship.crew.length, 1);
  assertEqual(game.commander.ship.crew[0].name, 'Jonathan Wild');
  assertEqual(game.commander.ship.crew[0].forQuest, true);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Smuggle Jonathan Wild to Kravat.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.wildStatus, WildQuestStatus.OnBoard);
  assertEqual(game2.commander.ship.crew.length, 1);
  assertEqual(game2.commander.ship.crew[0].name, 'Jonathan Wild');
  assertEqual(game2.commander.ship.crew[0].forQuest, true);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Smuggle Jonathan Wild to Kravat.');

  replay.replayEvent('Roster', 'click');

  const crewMember = game.commander.ship.crew[0];
  // We don't show hireFire button

  // He shows up with no cost, no skills
  const personnelRow = tableRow(crewMember.name!);
  assertEqual(textOf(personnelRow!.cells[0]), 'Jonathan Wild');
  assertTrue(personnelRow!.querySelector('img') !== null, 'roster icon shown');
  assertEqual(personnelRow!.querySelectorAll('button').length, 0);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Surrender', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'The pirates are upset that they found no cargo on your ship. To save yourself, you have no choice but to pay them 5% of your current net worth. The pirate captain turns out to be an old associate of Jonathan Wild. He invites Wild to go to Kravat aboard the pirate ship. Wild accepts the offer and thanks you for the ride.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.wildStatus, WildQuestStatus.Closed);
  assertEqual(game.commander.ship.crew.length, 0);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.wildStatus, WildQuestStatus.Closed);
  assertEqual(game2.commander.ship.crew.length, 0);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('wild_surrenderToPolice', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(AlertViewController.currentAlertTitle(), 'You have taken Jonathan Wild on board.');

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.wildStatus, WildQuestStatus.OnBoard);
  assertEqual(game.commander.ship.crew.length, 1);
  assertEqual(game.commander.ship.crew[0].name, 'Jonathan Wild');
  assertEqual(game.commander.ship.crew[0].forQuest, true);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Smuggle Jonathan Wild to Kravat.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.wildStatus, WildQuestStatus.OnBoard);
  assertEqual(game2.commander.ship.crew.length, 1);
  assertEqual(game2.commander.ship.crew[0].name, 'Jonathan Wild');
  assertEqual(game2.commander.ship.crew[0].forQuest, true);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Smuggle Jonathan Wild to Kravat.');

  replay.replayEvent('Roster', 'click');

  const crewMember = game.commander.ship.crew[0];
  // We don't show hireFire button

  // He shows up with no cost, no skills
  const personnelRow = tableRow(crewMember.name!);
  assertEqual(textOf(personnelRow!.cells[0]), 'Jonathan Wild');
  assertTrue(personnelRow!.querySelector('img') !== null, 'roster icon shown');
  assertEqual(personnelRow!.querySelectorAll('button').length, 0);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  replay.replayEvent('ecButton_Surrender', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'If you surrender, you will spend some time in prison and will have to pay a hefty fine. Wild will be arrested, too. Are you sure you want to do that?'
  );

  replay.replayEvent('alertButton_Surrender', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 30 days in prison and a fine of $292950.\nJonathan Wild is arrested and taken away to stand trial.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.wildStatus, WildQuestStatus.Closed);
  assertEqual(game.commander.ship.crew.length, 0);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.wildStatus, WildQuestStatus.Closed);
  assertEqual(game2.commander.ship.crew.length, 0);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('wild_podEscape', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","Equipment","sell_Military_laser","alertButton_Yes","sell_Reflective_shield","alertButton_Yes","sell_Reflective_shield","alertButton_Yes","Ship Yard","buy_escape_pod","alertButton_Yes","Warp","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Jonathan Wild is arrested, and taken away to stand trial.'
  );

  replay.replayEvent('alertButton_Dismiss');
  replay.replayEvent('alertButton_Dismiss');

  assertEqual(game.wildStatus, WildQuestStatus.Closed);
  assertEqual(game.commander.ship.crew.length, 0);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.wildStatus, WildQuestStatus.Closed);
  assertEqual(game2.commander.ship.crew.length, 0);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('wild_sellWeapons', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(AlertViewController.currentAlertTitle(), 'You have taken Jonathan Wild on board.');

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.wildStatus, WildQuestStatus.OnBoard);
  assertEqual(game.commander.ship.crew.length, 1);
  assertEqual(game.commander.ship.crew[0].name, 'Jonathan Wild');
  assertEqual(game.commander.ship.crew[0].forQuest, true);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Smuggle Jonathan Wild to Kravat.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.wildStatus, WildQuestStatus.OnBoard);
  assertEqual(game2.commander.ship.crew.length, 1);
  assertEqual(game2.commander.ship.crew[0].name, 'Jonathan Wild');
  assertEqual(game2.commander.ship.crew[0].forQuest, true);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Smuggle Jonathan Wild to Kravat.');

  replay.replayEvent('Roster', 'click');

  const crewMember = game.commander.ship.crew[0];
  // We don't show hireFire button

  // He shows up with no cost, no skills
  const personnelRow = tableRow(crewMember.name!);
  assertEqual(textOf(personnelRow!.cells[0]), 'Jonathan Wild');
  assertTrue(personnelRow!.querySelector('img') !== null, 'roster icon shown');
  assertEqual(personnelRow!.querySelectorAll('button').length, 0);

  replay.replayEvent('Equipment', 'click');
  replay.replayEvent('sell_Beam_laser', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  replay.replayEvent('sell_Military_laser', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    `Jonathan Wild isn't about to go with you if you're not armed with at least a Beam Laser. He'd rather take his chances hiding out here on Exo.`
  );

  replay.replayEvent('alertButton_Cancel', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('alertButton_He_can_stay_', 'click');

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 18 clicks from Malcoria you encounter a police Firefly.\n\nYour opponent attacks.'
  );

  assertEqual(game.wildStatus, WildQuestStatus.Closed);
  assertEqual(game.commander.ship.crew.length, 0);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.wildStatus, WildQuestStatus.Closed);
  assertEqual(game2.commander.ship.crew.length, 0);

  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('wild_ionReactor', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('cheat_freeSingularity', 'click');
  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Exo', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');
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
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Jonathan Wild doesn't like the looks of that Ion Reactor. He thinks it's too dangerous, and won't get on board."
  );
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.TransportWild);

  const specialEl = button('Special');
  expect(specialEl).not.toBeNull();
});

test('dragonfly_flee', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Quator","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Commander","ignoreTradeInOrbit","ignoreTraders","ignorePolice","ignorePirates","Chart","galacticChart_useSingularity_121_Baratas","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Melina","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Regulas","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Zalkon","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","fulltank","namedEvent","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanet|Regulas","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Kaylon","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zalkon","click"],"gameRandSeed":1733198074014}`;

  runReplayLog(replayLog);

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 1 click from Zalkon you encounter a stolen Dragonfly.\n\nYour opponent attacks.'
  );
});

test('dragonfly', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Quator","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Commander","ignoreTradeInOrbit","ignoreTraders","ignorePolice","ignorePirates","Chart","galacticChart_useSingularity_121_Baratas","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Melina","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Regulas","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanet|Regulas","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(game.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(game.questListDescription(), 'Follow the Dragonfly to Zalkon.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(game2.questListDescription(), 'Follow the Dragonfly to Zalkon.');

  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Zalkon', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 1 click from Zalkon you encounter a stolen Dragonfly.\n\nYour opponent attacks.'
  );

  replay.replayEvent('ecButton_Auto_Attack', 'click');
  assertEqual(AlertViewController.currentAlertTitle(), 'You have destroyed your opponent.');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Hello, Commander. This is Colonel Jackson again. On behalf of the Space Corps, I thank you for your valuable assistance in destroying the Dragonfly. As a reward, we will install one of the experimental shields on your ship. Return here for that when you're ready."
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'Get your Lightning shield at Zalkon.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'Get your Lightning shield at Zalkon.');

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Colonel Jackson here. Do you want us to install a Lightning shield on your current ship?'
  );

  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You have already filled all of your available shield slots.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('Equipment', 'click');
  replay.replayEvent('sell_Reflective_shield', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Colonel Jackson here. Do you want us to install a Lightning shield on your current ship?'
  );

  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You now have one Lightning shield installed on your ship.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.ship.hasShieldOfType(AccessoryType.ShieldLightning), true);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.hasShieldOfType(AccessoryType.ShieldLightning), true);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('japori_lackMedicine', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","namedEvent","galacticChart_useSingularity_1_Japori","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","selectPlanet|Japori","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733564400516}`;

  const replay = runReplayLog(replayLog);

  // Don't have medicine, Special doesn't show
  const specialEl = button('Special');
  assertEqual(specialEl, null);

  replay.replayEvent('News', 'click');
  replay.replayEvent('purchaseNews', 'click');

  const newsStrDiv = news();
  assertTrue(hasText(newsStrDiv, 'h4', 'The Daily Planet'), 'masthead is a heading');
  assertEqual(
    textOf(newsStrDiv),
    'The Daily Planet\nTravelers Claim Sighting of Ship Materializing in Orbit!\n\nCollector in Styris System Seeks to Purchase Tribbles.\n\nNew Rumors of Severe Drought in the Vandor System.'
  );
});

test('japori_noCargoSpace', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Brax","alertButton_Warp_","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","cheat_freeSingularity"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733564700811}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('News', 'click');
  replay.replayEvent('purchaseNews', 'click');

  const newsStrDiv = news();
  assertTrue(hasText(newsStrDiv, 'h4', 'The Loyal Subject'), 'masthead is a heading');
  assertEqual(
    textOf(newsStrDiv),
    'The Loyal Subject\nTravelers Claim Sighting of Ship Materializing in Orbit!\n\nEditorial: We Must Help Japori!\n\nNotice: Cold Weather in the Ligon System.'
  );

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('cargo_WaterBuy_All', 'click');
  assertEqual(game.commander.ship.tradeItemQuantityForType(TradeItemType.Water), 15);

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'A strange disease has invaded the Japori system. We would like you to deliver these ten canisters of special antidote to Japori. Note that, if you accept, ten of your cargo bays will remain in use on your way to Japori. Do you accept this mission?'
  );
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'You must have at least 10 free cargo bays to accept this mission.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('Commander', 'click');
  assertEqual(textOf(specialCargo()), 'A Portable Singularity.');
  assertEqual(game.specialCargoDescription(), 'A Portable Singularity.');
  assertEqual(game.questListDescription(), 'No open quests.');

  const specialEl = button('Special');
  expect(specialEl).not.toBeNull();
});

test('japori_hasMedicine', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Brax","alertButton_Warp_","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","cheat_freeSingularity"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733564700811}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('News', 'click');
  replay.replayEvent('purchaseNews', 'click');

  let newsStrDiv = news();
  assertTrue(hasText(newsStrDiv, 'h4', 'The Loyal Subject'), 'masthead is a heading');
  assertEqual(
    textOf(newsStrDiv),
    'The Loyal Subject\nTravelers Claim Sighting of Ship Materializing in Orbit!\n\nEditorial: We Must Help Japori!\n\nNotice: Cold Weather in the Ligon System.'
  );

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'A strange disease has invaded the Japori system. We would like you to deliver these ten canisters of special antidote to Japori. Note that, if you accept, ten of your cargo bays will remain in use on your way to Japori. Do you accept this mission?'
  );
  replay.replayEvent('alertButton_Yes', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'Ten of your cargo bays now contain antidote for the Japori system.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('Commander', 'click');
  assertEqual(textOf(specialCargo()), '10 bays of antidote.\nA Portable Singularity.');
  assertEqual(game.specialCargoDescription(), '10 bays of antidote.\nA Portable Singularity.');
  assertEqual(game.questListDescription(), 'Deliver antidote to Japori.');

  let specialEl = button('Special');
  assertEqual(specialEl, null);

  replay.replayEvent('Warp', 'click');

  const totalBays = game.commander.ship.totalCargoBays();
  const freeBays = game.commander.ship.freeCargoBays();
  assertEqual(totalBays, 15);
  assertEqual(freeBays, 5);

  replay.replayEvent('cargo_WaterBuy_All', 'click');
  assertEqual(game.commander.ship.tradeItemQuantityForType(TradeItemType.Water), 5);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO), 10);
  assertEqual(game.japoriQuestStatus, JaporiQuestStatus.HasMedicine);

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.totalCargoBays(), 15);
  assertEqual(game2.commander.ship.freeCargoBays(), 0);

  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Water), 5);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO), 10);
  assertEqual(game2.japoriQuestStatus, JaporiQuestStatus.HasMedicine);

  replay.replayEvent('Chart', 'click');
  replay.replayEvent('galacticChart_useSingularity_121_Japori', 'click');
  replay.replayEvent('alertButton_Warp_', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('News', 'click');
  replay.replayEvent('purchaseNews', 'click');

  newsStrDiv = news();
  assertTrue(hasText(newsStrDiv, 'h4', 'General Report'), 'masthead is a heading');
  assertEqual(
    textOf(newsStrDiv),
    'General Report\nTravelers Claim Sighting of Ship Materializing in Orbit!\n\nDisease Antidotes Arrive! Health Officials Optimistic.\n\nCollector in Titan System Seeks to Purchase Tribbles.\n\nWeapons Research Increases Kill-Ratio!'
  );

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "Thank you for delivering the medicine to us. We don't have any money to reward you, but we do have an alien fast-learning machine with which we will increase your skills."
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  specialEl = button('Special');
  assertEqual(specialEl, null);

  assertEqual(game.japoriQuestStatus, JaporiQuestStatus.Closed);
  assertEqual(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO), 0);
  assertEqual(game.commander.pilot, 5);
  assertEqual(game.commander.trader, 6);
  assertEqual(game.commander.engineer, 6);
  assertEqual(game.commander.fighter, 5);

  assertEqual(game.commander.ship.totalCargoBays(), 15);
  assertEqual(game.commander.ship.freeCargoBays(), 10);
  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);

  assertEqual(game2.japoriQuestStatus, JaporiQuestStatus.Closed);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO), 0);
  assertEqual(game2.commander.pilot, 5);
  assertEqual(game2.commander.trader, 6);
  assertEqual(game2.commander.engineer, 6);
  assertEqual(game2.commander.fighter, 5);

  assertEqual(game2.commander.ship.totalCargoBays(), 15);
  assertEqual(game2.commander.ship.freeCargoBays(), 10);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('eraseRecord_accept', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Antedi","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733562860803}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  // Don't have a record yet, special doesn't show
  let specialEl = button('Special');
  assertEqual(specialEl, null);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('buyship_Wasp', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('alertButton_Attack', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  specialEl = button('Special');
  expect(specialEl).not.toBeNull();

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'A hacker conveys to you that he has cracked the passwords to the galaxy-wide police computer network, and that he can erase your police record for the sum of $5000. Do you want him to do that?'
  );

  const creditsBefore = game.commander.credits;
  assertEqual(game.commander.policeRecordScore, -33);

  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'The hacker resets your police record to be clean.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  specialEl = button('Special');
  assertEqual(specialEl, null);

  assertEqual(game.commander.credits, creditsBefore - 5000);
  assertEqual(game.commander.policeRecordScore, PoliceRecordScore.Clean);
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.credits, creditsBefore - 5000);
  assertEqual(game2.commander.policeRecordScore, PoliceRecordScore.Clean);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
});

test('eraseRecord_decline', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Antedi","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733562860803}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  // Don't have a record yet, special doesn't show
  let specialEl = button('Special');
  assertEqual(specialEl, null);

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('Ship Yard', 'click');
  replay.replayEvent('buyship_Wasp', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  replay.replayEvent('Warp', 'click');
  replay.replayEvent('warpBlastOff', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Ignore', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  replay.replayEvent('ecButton_Attack', 'click');
  replay.replayEvent('alertButton_Attack', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('ecButton_Auto_Flee', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');
  replay.replayEvent('alertButton_Dismiss', 'click');

  specialEl = button('Special');
  expect(specialEl).not.toBeNull();

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'A hacker conveys to you that he has cracked the passwords to the galaxy-wide police computer network, and that he can erase your police record for the sum of $5000. Do you want him to do that?'
  );

  const creditsBefore = game.commander.credits;
  assertEqual(game.commander.policeRecordScore, -33);

  replay.replayEvent('alertButton_No', 'click');

  specialEl = button('Special');
  expect(specialEl).not.toBeNull();

  assertEqual(game.commander.credits, creditsBefore);
  assertEqual(game.commander.policeRecordScore, -33);
  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.EraseRecord);

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.credits, creditsBefore);
  assertEqual(game2.commander.policeRecordScore, -33);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.EraseRecord);
});

test('skillIncrease_incidence', () => {
  const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1732766875181}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(
    game.solarSystems.filter(x => x.specialEvent === SpecialEvent.SkillIncrease).length,
    3
  );
});

test('skillIncrease_decline', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Korma","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733546197977}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  const creditsBefore = game.commander.credits;

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "An alien with a fast-learning machine offers to increase one of your skills for the reasonable sum of $3000. You won't be able to pick that skill, though. Do you accept his offer?"
  );

  replay.replayEvent('alertButton_No', 'click');

  assertEqual(game.commander.credits, creditsBefore);
  assertEqual(game.commander.pilot, 5);
  assertEqual(game.commander.trader, 5);
  assertEqual(game.commander.engineer, 5);
  assertEqual(game.commander.fighter, 5);

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.SkillIncrease);

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.credits, creditsBefore);
  assertEqual(game2.commander.pilot, 5);
  assertEqual(game2.commander.trader, 5);
  assertEqual(game2.commander.engineer, 5);
  assertEqual(game2.commander.fighter, 5);

  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.SkillIncrease);
});

test('skillIncrease_accept', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Korma","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733546197977}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('Special', 'click');

  const creditsBefore = game.commander.credits;

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "An alien with a fast-learning machine offers to increase one of your skills for the reasonable sum of $3000. You won't be able to pick that skill, though. Do you accept his offer?"
  );

  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(game.commander.credits, creditsBefore - 3000);
  assertEqual(game.commander.pilot, 5);
  assertEqual(game.commander.trader, 5);
  assertEqual(game.commander.engineer, 6);
  assertEqual(game.commander.fighter, 5);

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.credits, creditsBefore - 3000);
  assertEqual(game2.commander.pilot, 5);
  assertEqual(game2.commander.trader, 5);
  assertEqual(game2.commander.engineer, 6);
  assertEqual(game2.commander.fighter, 5);

  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
});

test('lottery_easy', () => {
  const replayLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|1","click"],"gameRandSeed":1733545440606}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  const creditsBefore = game.commander.credits;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'What luck! While docking in the space port, you receive a message that you won $1000 in a lottery. The prize has been added to your account.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.credits, creditsBefore + 1000);

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.credits, creditsBefore + 1000);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
});

test('lottery_beginner', () => {
  const replayLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|0","click"],"gameRandSeed":1733545440606}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  const creditsBefore = game.commander.credits;

  replay.replayEvent('Special', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'What luck! While docking in the space port, you receive a message that you won $1000 in a lottery. The prize has been added to your account.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(game.commander.credits, creditsBefore + 1000);

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.credits, creditsBefore + 1000);
  assertEqual(game2.commander.currentSystem.specialEvent, SpecialEvent.None);
});

test('lottery_normal_isNotOffered', () => {
  const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733545440606}`;
  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  assertEqual(game.commander.currentSystem.specialEvent, SpecialEvent.None);
});

test('retire', () => {
  const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1734493988106}`;

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  replay.replayEvent('cheat_freeMoney');
  replay.replayEvent('cheat_freeSingularity');

  const target = game.solarSystems.find(x => x.specialEvent === SpecialEvent.MoonForSale)!;

  replay.replayEvent('Chart');
  replay.replayEvent(`galacticChart_useSingularity_121_${target!.name}`);
  replay.replayEvent('alertButton_Warp_');

  replaySkipEncounters(replay);

  replay.replayEvent('Special');
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(game.questListDescription(), 'Claim your moon in Utopia.');

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.questListDescription(), 'Claim your moon in Utopia.');

  replay.replayEvent('cheat_freeSingularity');

  const target2 = game.solarSystems.find(x => x.specialEvent === SpecialEvent.MoonBought)!;

  replay.replayEvent('Chart');
  replay.replayEvent(`galacticChart_useSingularity_121_${target2!.name}`);
  replay.replayEvent('alertButton_Warp_');

  replaySkipEncounters(replay);

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_No', 'click');
  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  const endMessage = textOf(scoreMessage());
  expect(endMessage).toMatch(/^You achieved a score/);
  assertTrue(button('End Game and Start Over') !== null, 'end game button shows');
});

test('tribble', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeSingularity","cheat_showSpecial","cheat_freeMoney","Chart","galacticChart_useSingularity_121_Ashen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","Buy","cargo_FoodBuy_5","Warp","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","alertButton_Dismiss","fulltank","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Buy","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","Warp","cargo_NarcoticsBuy_All","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","alertButton_Dismiss","Sell","Chart","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Helena","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","Sell"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Sefalla","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Deneva","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732873090822}`;

  const replay = runReplayLog(replayLog);
  const session = replay.session;

  const game = session.game!;
  const commander = game.commander;

  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics), 0);
  assertEqual(commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 3);
  assertEqual(commander.ship.tribbles, 2);

  assertEqual(game.specialCargoDescription(), '2 cute, furry tribbles.');
  assertEqual(game.questListDescription(), 'Get rid of those pesky tribbles.');

  let game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  // Spot check some properties
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics), 0);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 3);
  assertEqual(game2.commander.ship.tribbles, 2);
  assertEqual(game2.specialCargoDescription(), '2 cute, furry tribbles.');
  assertEqual(game2.questListDescription(), 'Get rid of those pesky tribbles.');

  replay.replayEvent('Special', 'click');
  assertEqual(
    AlertViewController.currentAlertTitle(),
    'An eccentric alien billionaire wants to buy your collection of tribbles and offers half a credit for each of them. Do you accept his offer?'
  );

  replay.replayEvent('alertButton_No', 'click');

  replay.replayEvent('Special', 'click');
  replay.replayEvent('alertButton_Yes', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'The alien uses advanced technology to beam your whole collection of tribbles to his ship.'
  );
  replay.replayEvent('alertButton_Dismiss', 'click');

  assertEqual(commander.ship.tribbles, 0);

  assertEqual(game.specialCargoDescription(), 'No special items.');
  assertEqual(game.questListDescription(), 'No open quests.');

  game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  // Spot check some properties
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics), 0);
  assertEqual(game2.commander.ship.tradeItemQuantityForType(TradeItemType.Furs), 3);
  assertEqual(game2.commander.ship.tribbles, 0);
  assertEqual(game2.specialCargoDescription(), 'No special items.');
  assertEqual(game2.questListDescription(), 'No open quests.');
});

test('tribble_notEnoughMoney', () => {
  const replayLog = `{"idLog":["createCommander","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rakhar","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734688054944}`;

  const replay = runReplayLog(replayLog);
  const session = replay.session;

  const game = session.game!;

  assertEqual(
    AlertViewController.currentAlertTitle(),
    "You don't have enough cash to accept this offer."
  );
  assertEqual(game.commander.ship.tribbles, 0);

  const game2 = serializeAndDeserialize(game);
  assertEqualGames(game, game2);
  assertEqual(game2.commander.ship.tribbles, 0);
});

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
import type { Ship } from '../../game/Ship.ts';
import { TradeItemType } from '../../game/TradeItem.types.ts';
import { AlertViewController } from '../../game/alerts.ts';
import {
  assertEqual,
  assertEqualArrays,
  assertSurvivesSave,
  assertTrue,
  recording,
  runReplayLog,
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

// A fresh bottle of skill tonic and an old one: what the player is told, and the fighter
// skill after drinking it.
const BOTTLES: [string, { prompt: string; taste: string; fighter: number }][] = [
  [
    'BottleGood',
    {
      prompt:
        'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. In the old days, this stuff went for thousands of credits a bottle since people reported significant gains in their abilities after quaffing a bottle. Would you like to drink it?',
      taste:
        "Mmmmm. Captain Marmoset's Amazing Skill Tonic not only fills you with energy, but tastes like a fine single-malt. You feel a slight tingling in your fingertips.",
      fighter: 6,
    },
  ],
  [
    'BottleOld',
    {
      prompt:
        'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. The "best used by" date stamped on the bottle has become illegible. The tonic might still be good. Then again, it\'s not clear what happens when the Tonic breaks down...',
      taste:
        "While you don't know what it was supposed to taste like, you get the feeling that this dose of tonic was a bit off. This bottle tasted very strange, like slightly salty red wine. You feel a bit dizzy and your teeth itch for a while.",
      fighter: 4,
    },
  ],
];

test.each(BOTTLES)('%s_Ignore', name => {
  const replayLog = recording(name);

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
  assertSurvivesSave(game);
});

test.each(BOTTLES)('%s_Pass', (name, bottle) => {
  const replayLog = recording(name);

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    "At 20 clicks from Tantalos you encounter a floating bottle.\n\nIt appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!"
  );

  replay.replayEvent('ecButton_Drink', 'click');

  assertEqual(AlertViewController.currentAlertTitle(), bottle.prompt);

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
  assertSurvivesSave(game);
});

test.each(BOTTLES)('%s_Drink', (name, bottle) => {
  const replayLog = recording(name);

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

  assertEqual(AlertViewController.currentAlertTitle(), bottle.prompt);

  replay.replayEvent('alertButton_Yes__drink_it', 'click');

  assertEqual(AlertViewController.currentAlertTitle(), bottle.taste);

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
  assertEqual(game.commander.fighter, bottle.fighter);

  assertEqualArrays(game._remainingRareEvents, []);
  assertSurvivesSave(game);
});

// The three famous captains: each teaches one skill in exchange for one piece of equipment.
type Captain = {
  rareEvent: RareEvent;
  skill: 'pilot' | 'engineer' | 'trader';
  hasItem: (ship: Ship) => boolean;
  offer: string;
  attackNews: string;
};
const CAPTAINS: [string, Captain][] = [
  [
    'Ahab',
    {
      rareEvent: RareEvent.CaptainAhab,
      skill: 'pilot',
      hasItem: ship => ship.hasShieldOfType(AccessoryType.ShieldReflective),
      offer:
        'Captain Ahab, one of the greatest pilots of all time, is in need of a shield for an upcoming mission. To save the time it would take to land and find a vendor, Ahab is offering to trade you some piloting lessons in exchange for one reflective shield.',
      attackNews: 'Thug Assaults Captain Ahab!',
    },
  ],
  [
    'Conrad',
    {
      rareEvent: RareEvent.CaptainConrad,
      skill: 'engineer',
      hasItem: ship => ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser),
      offer:
        "Captain Conrad, fleet historian and inventor of the modern warp drive, is in need of a laser to test her new shield design. Unfortunately, she's used up her R&D budget for the year. Instead of cash, she'll trade you some engineering lessons in exchange for one military laser.",
      attackNews: 'Captain Conrad Comes Under Attack By Criminal!',
    },
  ],
  [
    'Huie',
    {
      rareEvent: RareEvent.CaptainHuie,
      skill: 'trader',
      hasItem: ship => ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser),
      offer:
        'Captain Huie, former Trade Commissioner of the Galactic Council, is in need of a laser for an upcoming mission. Huie is known for driving a hard bargain and is offering some secrets of doing business in exchange for one military laser.',
      attackNews: 'Famed Captain Huie Attacked by Brigand!',
    },
  ],
];

test.each(CAPTAINS)('%s_notEligible', (name, captain) => {
  const replayLog = recording(`${name}_notEligible`);

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 15 clicks from Japori you encounter a police Firefly.\n\nIt ignores you.'
  );

  assertEqualArrays(game._remainingRareEvents, [captain.rareEvent]);
  assertSurvivesSave(game);
});

test.each(CAPTAINS)('%s_accept', (name, captain) => {
  const replayLog = recording(name);

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    `At 20 clicks from Yew you encounter the famous Captain ${name}.\n\nThe captain requests a brief meeting with you.`
  );

  replay.replayEvent('ecButton_Meet', 'click');

  assertEqual(AlertViewController.currentAlertTitle(), captain.offer);

  const skillBefore = game.commander[captain.skill];
  assertEqual(captain.hasItem(game.commander.ship), true);

  replay.replayEvent('alertButton_Yes__trade_', 'click');

  assertEqual(
    AlertViewController.currentAlertTitle(),
    'After a few hours of training with a top expert, you feel your abilities have improved significantly.'
  );

  replay.replayEvent('alertButton_Dismiss', 'click');

  const skillAfter = game.commander[captain.skill];
  assertEqual(skillAfter, skillBefore + 2);

  assertEqual(captain.hasItem(game.commander.ship), false);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = assertSurvivesSave(game);
  assertEqual(captain.hasItem(game2.commander.ship), false);
  const skillAfter2 = game2.commander[captain.skill];
  assertEqual(skillAfter2, skillBefore + 2);
});

test.each(CAPTAINS)('%s_noThanks', (name, captain) => {
  const replayLog = recording(name);

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    `At 20 clicks from Yew you encounter the famous Captain ${name}.\n\nThe captain requests a brief meeting with you.`
  );

  replay.replayEvent('ecButton_Meet', 'click');

  assertEqual(AlertViewController.currentAlertTitle(), captain.offer);

  const skillBefore = game.commander[captain.skill];
  assertEqual(captain.hasItem(game.commander.ship), true);

  replay.replayEvent('alertButton_No_thanks_', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 13 clicks from Yew you encounter a trader Gnat.\n\nIt ignores you.'
  );

  const skillAfter = game.commander[captain.skill];
  assertEqual(skillAfter, skillBefore);

  assertEqual(captain.hasItem(game.commander.ship), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = assertSurvivesSave(game);
  assertEqual(captain.hasItem(game2.commander.ship), true);
  const skillAfter2 = game2.commander[captain.skill];
  assertEqual(skillAfter2, skillBefore);
});

test.each(CAPTAINS)('%s_ignore', (name, captain) => {
  const replayLog = recording(name);

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  let encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    `At 20 clicks from Yew you encounter the famous Captain ${name}.\n\nThe captain requests a brief meeting with you.`
  );

  const skillBefore = game.commander[captain.skill];
  assertEqual(captain.hasItem(game.commander.ship), true);

  replay.replayEvent('ecButton_Ignore', 'click');

  encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    'At 13 clicks from Yew you encounter a trader Gnat.\n\nIt ignores you.'
  );

  const skillAfter = game.commander[captain.skill];
  assertEqual(skillAfter, skillBefore);

  assertEqual(captain.hasItem(game.commander.ship), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = assertSurvivesSave(game);
  assertEqual(captain.hasItem(game2.commander.ship), true);
  const skillAfter2 = game2.commander[captain.skill];
  assertEqual(skillAfter2, skillBefore);
});

test.each(CAPTAINS)('%s_attack', (name, captain) => {
  const replayLog = recording(name);

  const replay = runReplayLog(replayLog);

  const session = replay.session;
  const game = session.game!;

  const encounterText = textOf(encounterBox());
  assertEqual(
    encounterText,
    `At 20 clicks from Yew you encounter the famous Captain ${name}.\n\nThe captain requests a brief meeting with you.`
  );

  const skillBefore = game.commander[captain.skill];
  assertEqual(captain.hasItem(game.commander.ship), true);

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

  assertEqualArrays(game._breakingNews, [captain.attackNews]);

  replay.replayEvent('News', 'click');
  replay.replayEvent('purchaseNews', 'click');

  const newsStrDiv = news();
  assertTrue(hasText(newsStrDiv, 'h4', 'The Command'), 'masthead is a heading');
  assertEqual(
    textOf(newsStrDiv),
    `The Command\n${captain.attackNews}\n\nNotorious Criminal Jean-Luc Sighted in Yew!\n\nInsurrection Crushed: Rebels Executed!`
  );

  assertEqual(game._breakingNews, null);

  assertEqual(game.commander.policeRecordScore, PoliceRecordScore.Villain + ATTACK_TRADER_SCORE);

  const skillAfter = game.commander[captain.skill];
  assertEqual(skillAfter, skillBefore);

  assertEqual(captain.hasItem(game.commander.ship), true);

  assertEqualArrays(game._remainingRareEvents, []);
  const game2 = assertSurvivesSave(game);
  assertEqual(captain.hasItem(game2.commander.ship), true);
  const skillAfter2 = game2.commander[captain.skill];
  assertEqual(skillAfter2, skillBefore);
  assertEqual(game2.commander.policeRecordScore, PoliceRecordScore.Villain + ATTACK_TRADER_SCORE);
});

test('MarieCeleste_ignore', () => {
  const replayLog = recording('MarieCeleste');

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
  assertSurvivesSave(game);
});

test('MarieCeleste_boardLeave', () => {
  const replayLog = recording('MarieCeleste');

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
  assertSurvivesSave(game);
});

test('MarieCeleste_boardDontTake', () => {
  const replayLog = recording('MarieCeleste');

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
  assertSurvivesSave(game);
});

test('MarieCeleste_boardTakeDumpYield', () => {
  const replayLog = recording('MarieCeleste');

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
  assertSurvivesSave(game);
});

test('MarieCeleste_boardTakeYield', () => {
  const replayLog = recording('MarieCeleste');

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
  assertSurvivesSave(game);
});

test('MarieCeleste_boardTakeBribe', () => {
  const replayLog = recording('MarieCeleste');

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
  assertSurvivesSave(game);
});

test('MarieCeleste_boardTakeFlee', () => {
  const replayLog = recording('MarieCeleste');

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
  assertSurvivesSave(game);
});

test('MarieCeleste_boardTakeAttack', () => {
  const replayLog = recording('MarieCeleste');

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
  assertSurvivesSave(game);
});

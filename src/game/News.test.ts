import { expect, test, vi } from 'vitest';
import { newGame, topAlert } from '../tests/support/newGame.ts';
import { PoliceRecordScore } from './Commander.ts';
import type { Game } from './Game.ts';
import { News } from './News.ts';
import { runtime } from './runtime.ts';
import {
  DragonflyQuestStatus,
  ExperimentQuestStatus,
  InvasionQuestStatus,
  JaporiQuestStatus,
  JarekQuestStatus,
  MonsterQuestStatus,
  ScarabQuestStatus,
  SpecialEvent,
  WildQuestStatus,
} from './SolarSystem.types.ts';
import { Status } from './TradeItem.types.ts';

// The paper of the commander's current system, one headline per line.
function headlines(game: Game): string[] {
  game.alreadyPaidForNewspaper = true;
  const news = new News(game);
  news.present();
  return news.text()!.split('\n');
}

// A paper in a system with this special event.
function paperWith(event: SpecialEvent, setUp: (game: Game) => void): string[] {
  const game = newGame();
  game.commander.currentSystem.specialEvent = event;
  setUp(game);
  return headlines(game);
}

const E = SpecialEvent;
const quest = {
  japori: (s: number) => (game: Game) => (game.japoriQuestStatus = s),
  scarab: (s: number) => (game: Game) => (game.scarabStatus = s),
  monster: (s: number) => (game: Game) => (game.monsterStatus = s),
  dragonfly: (s: number) => (game: Game) => (game.dragonflyStatus = s),
  invasion: (s: number) => (game: Game) => (game.invasionStatus = s),
  experiment: (s: number) => (game: Game) => (game.experimentStatus = s),
  jarek: (s: number) => (game: Game) => (game.jarekStatus = s),
  wild: (s: number) => (game: Game) => (game.wildStatus = s),
  artifact: (game: Game) => (game.commander.artifactOnBoard = true),
  none: () => {},
};

const specialHeadlines: [string, SpecialEvent, (game: Game) => void][] = [
  ['Editorial: We Must Help Japori!', E.JaporiDisease, quest.japori(JaporiQuestStatus.Open)],
  [
    'Disease Antidotes Arrive! Health Officials Optimistic.',
    E.MedicineDelivery,
    quest.japori(JaporiQuestStatus.HasMedicine),
  ],
  ['Security Scandal: Test Craft Confirmed Stolen.', E.Scarab, quest.none],
  [
    'Wormhole Traffic Delayed as Stolen Craft Destroyed.',
    E.ScarabDestroyed,
    quest.scarab(ScarabQuestStatus.ScarabDestroyed),
  ],
  [
    'Wormhole Travelers Harassed by Unusual Ship!',
    E.ScarabDestroyed,
    quest.scarab(ScarabQuestStatus.ScarabExists),
  ],
  [
    'Hero Slays Space Monster! Parade, Honors Planned for Today.',
    E.MonsterKilled,
    quest.monster(MonsterQuestStatus.ClosedMonsterDestroyed),
  ],
  [
    'Space Monster Threatens Homeworld!',
    E.MonsterKilled,
    quest.monster(MonsterQuestStatus.MonsterExists),
  ],
  ['Experimental Craft Stolen! Critics Demand Security Review.', E.Dragonfly, quest.none],
  [
    'Investigators Report Strange Craft.',
    E.FlyBaratas,
    quest.dragonfly(DragonflyQuestStatus.GoToBaratas),
  ],
  [
    'Rumors Continue: Melina Orbitted by Odd Starcraft.',
    E.FlyMelina,
    quest.dragonfly(DragonflyQuestStatus.GoToMelina),
  ],
  [
    'Strange Ship Observed in Regulas Orbit.',
    E.FlyRegulas,
    quest.dragonfly(DragonflyQuestStatus.GoToRegulas),
  ],
  [
    'Spectacular Display as Stolen Ship Destroyed in Fierce Space Battle.',
    E.DragonflyDestroyed,
    quest.dragonfly(DragonflyQuestStatus.ClosedDragonflyDestroyed),
  ],
  [
    'Unidentified Ship: A Threat to Zalkon?',
    E.DragonflyDestroyed,
    quest.dragonfly(DragonflyQuestStatus.GoToZalkon),
  ],
  [
    'Invasion Imminent! Plans in Place to Repel Hostile Invaders.',
    E.GemulonRescued,
    quest.invasion(InvasionQuestStatus.DaysUntilInvasion._1),
  ],
  [
    'Alien Invasion Devastates Planet!',
    E.GemulonRescued,
    quest.invasion(InvasionQuestStatus.ClosedTooLate),
  ],
  ['Editorial: Who Will Warn Gemulon?', E.AlienInvasion, quest.none],
  [
    'Scientists Cancel High-profile Test! Committee to Investigate Design.',
    E.ExperimentStopped,
    quest.experiment(ExperimentQuestStatus.DaysRemaining._10),
  ],
  ['Huge Explosion Reported at Research Facility.', E.ExperimentNotStopped, quest.none],
  ['Scientist Adds Alien Artifact to Museum Collection.', E.ArtifactDelivered, quest.artifact],
  ['Ambassador Jarek Returns from Crisis.', E.JarekGetsOut, quest.jarek(JarekQuestStatus.OnBoard)],
  [
    'Rumors Suggest Known Criminal J. Wild May Come to Kravat!',
    E.WildGetsOut,
    quest.wild(WildQuestStatus.OnBoard),
  ],
];

test.each(specialHeadlines)('the paper prints "%s"', (headline, event, setUp) => {
  expect(paperWith(event, setUp)).toContain(headline);
});

const allSpecial = specialHeadlines.map(([headline]) => headline);

test.each([
  [
    'Japori once the antidote is aboard',
    E.JaporiDisease,
    quest.japori(JaporiQuestStatus.HasMedicine),
  ],
  ['the antidote before it is aboard', E.MedicineDelivery, quest.none],
  ['the Scarab before it is out', E.ScarabDestroyed, quest.none],
  ['the monster before it is out', E.MonsterKilled, quest.none],
  ['Baratas before the Dragonfly goes there', E.FlyBaratas, quest.none],
  ['Melina before the Dragonfly goes there', E.FlyMelina, quest.none],
  ['Regulas before the Dragonfly goes there', E.FlyRegulas, quest.none],
  ['Zalkon before the Dragonfly goes there', E.DragonflyDestroyed, quest.none],
  ['Gemulon before the invasion is known', E.GemulonRescued, quest.none],
  ['the experiment before it is known', E.ExperimentStopped, quest.none],
  ['the artifact before it is aboard', E.ArtifactDelivered, quest.none],
  ['Jarek before he is aboard', E.JarekGetsOut, quest.none],
  ['Wild before he is aboard', E.WildGetsOut, quest.none],
])('the paper says nothing of %s', (_, event, setUp) => {
  expect(paperWith(event, setUp).filter(line => allSpecial.includes(line))).toEqual([]);
});

test.each([
  ['at war', 'War News: Offensives Continue!', Status.AtWar],
  ['with the plague', 'Plague Spreads! Outlook Grim.', Status.Plague],
  ['in a drought', 'No Rain in Sight', Status.Drought],
  ['in boredom', "Editors: Won't Someone Entertain Us?", Status.Boredom],
  ['in a cold spell', 'Cold Snap Continues!', Status.ColdSpell],
  ['with failed crops', 'Serious Crop Failure! Must We Ration?', Status.CropFailure],
  ['short of workers', 'Jobless Rate at All-Time Low!', Status.LackWorkers],
])('a system %s prints "%s"', (_, headline, status) => {
  const game = newGame();
  game.commander.currentSystem.status = status;

  expect(headlines(game)).toContain(headline);
});

test('a villain is announced by name', () => {
  const game = newGame();
  game.commander.policeRecordScore = PoliceRecordScore.Villain;
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(1);

  expect(headlines(game)).toContain('Notorious Criminal Tester Sighted in Torin!');
});

test('a hero is welcomed by name', () => {
  const game = newGame();
  game.commander.policeRecordScore = PoliceRecordScore.Hero;
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(0);

  expect(headlines(game)).toContain('Locals Welcome Visiting Hero Tester!');
});

// A game whose nearby systems are all quiet, but for what the test sets.
function quietNeighbours() {
  const game = newGame();
  const nearby = game.solarSystemsWithinRange();
  nearby.forEach(system => (system.status = Status.Uneventful));
  return { game, nearby: nearby[0] };
}

test.each([
  ['moon for sale', E.MoonForSale, 'Seller in %s System has Utopian Moon Available.'],
  ['tribble collector', E.BuyTribble, 'Collector in %s System Seeks to Purchase Tribbles.'],
])('a %s nearby is in the paper', (_, event, story) => {
  const { game, nearby } = quietNeighbours();
  nearby.specialEvent = event;

  expect(headlines(game)).toContain(story.replace('%s', nearby.name));
});

test('trouble in a nearby system makes a story on a lucky roll', () => {
  const { game, nearby } = quietNeighbours();
  nearby.status = Status.Drought;
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValue(0);

  expect(headlines(game)).toContain(`Reports of Severe Drought in the ${nearby.name} System.`);
});

test('without a story from nearby, the paper prints one of its own headlines', () => {
  const { game, nearby } = quietNeighbours();
  nearby.status = Status.Drought;
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(99);

  const lines = headlines(game);

  expect(lines.join('\n')).not.toContain(nearby.name);
  expect(game.commander.currentSystem.politics.headlines).toContain(lines.at(-1));
});

test('a paper that cannot be paid for is refused', () => {
  const game = newGame();
  game.commander.credits = 0;

  new News(game).present();

  expect(topAlert().title).toBe(
    "Sorry! A newspaper costs $3 in this system. You don't have enough money!"
  );
  expect(game.alreadyPaidForNewspaper).toBe(false);
});

test('with "always buy the paper" on, the paper is paid for when opened', () => {
  const game = newGame();
  game.autoNews = true;
  const news = new News(game);

  news.present();

  expect(game.commander.credits).toBe(1000 - 3);
  expect(news.text()).not.toBeNull();
});

test('a paper already paid for is not paid for again', () => {
  const game = newGame();
  const news = new News(game);
  news.buy();
  news.buy();

  expect(game.commander.credits).toBe(1000 - 3);
});

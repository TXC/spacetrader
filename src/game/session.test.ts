import { beforeEach, expect, test, vi } from 'vitest';
import { alertStore, AlertViewController } from './alerts.ts';
import { CrewMember } from './CrewMember.ts';
import { Game, GameEndStatus } from './Game.ts';
import { GameRand } from './GameRand.ts';
import { startingSkills } from './NewCommander.ts';
import { runtime } from './runtime.ts';
import { CANNOT_SAVE, SAVE_REMOVED, Session } from './session.ts';
import { MockLocalStorage } from '../tests/support/MockLocalStorage.ts';
import { DebugMode } from './ensure.ts';

let session: Session;
let storage: MockLocalStorage;

beforeEach(() => {
  runtime.debugMode = DebugMode.Assert;
  runtime.gameRand = new GameRand(1);
  AlertViewController.clearAlerts();
  storage = new MockLocalStorage();
  session = new Session();
  session.storage = storage;
  session.start();
});

function saved(key: string): string[] {
  return Object.keys(JSON.parse(storage.getItem(key) ?? '{}'));
}

test('with nothing saved, the game starts at the new-commander screen', () => {
  expect(session.screen).toBe('newCommander');
  expect(session.game).toBeNull();
});

test('creating a commander saves the game and shows the landing screen', () => {
  session.createCommander('Tester', 2, startingSkills());

  expect(session.screen).toBe('landing');
  expect(session.row).toBeNull();
  expect(saved('games')).toEqual([session.game!.uniqueID]);
});

test('a saved game is loaded by the next session', () => {
  session.createCommander('Tester', 2, startingSkills());
  const next = new Session();
  next.storage = storage;

  next.start();

  expect(next.screen).toBe('landing');
  expect(next.game!.uniqueID).toBe(session.game!.uniqueID);
});

test('"For Hire" is offered only while a mercenary here is not in the crew', () => {
  session.createCommander('Tester', 2, startingSkills());
  const game = session.game!;
  const system = game.commander.currentSystem;
  const mercenary = new CrewMember('Hired Hand', 4, 4, 4, 4);

  system.setMercenary(mercenary);
  expect(session.rows()).toContain('For Hire');

  game.commander.ship._crew.push(mercenary);
  expect(session.rows()).not.toContain('For Hire');
});

test('opening a sub-screen tells whoever is watching, once', () => {
  session.createCommander('Tester', 2, startingSkills());
  const listener = vi.fn();
  session.subscribe(listener);

  session.clickRow('Bank');

  expect(session.row).toBe('Bank');
  expect(session.activeRow).toBe('Bank');
  expect(listener).toHaveBeenCalledTimes(1);
});

test('ending the game moves it to the high scores, and continuing starts over', () => {
  session.createCommander('Tester', 2, startingSkills());
  const id = session.game!.uniqueID;

  session.endGame(GameEndStatus.Retired);

  expect(session.screen).toBe('endGame');
  expect(session.game).toBeNull();
  expect(saved('games')).toEqual([]);
  expect(session.highScores(6).map(game => game.uniqueID)).toEqual([id]);

  session.continueAfterEnd();
  expect(session.screen).toBe('newCommander');
});

test('the navigation links are those of the last time the landing screen was shown', () => {
  session.createCommander('Tester', 2, startingSkills());
  const game = session.game!;
  const mercenary = new CrewMember('Hired Hand', 4, 4, 4, 4);
  game.commander.currentSystem.setMercenary(mercenary);
  session.start();
  expect(session.navRows.map(link => link.row)).toContain('For Hire');

  game.commander.ship._crew.push(mercenary);
  session.changed();
  expect(session.navRows.map(link => link.row)).toContain('For Hire');

  session.start();
  expect(session.navRows.map(link => link.row)).not.toContain('For Hire');
});

test('firing the local mercenary puts "For Hire" back at once', () => {
  session.createCommander('Tester', 2, startingSkills());
  const game = session.game!;
  const mercenary = new CrewMember('Hired Hand', 4, 4, 4, 4);
  game.commander.currentSystem.setMercenary(mercenary);
  game.commander.ship._crew.push(mercenary);
  session.start();
  expect(session.navRows.map(link => link.row)).not.toContain('For Hire');

  game.commander.ship._crew.pop();
  session.rosterFired(mercenary);

  expect(session.navRows.map(link => link.row)).toContain('For Hire');
});

// ---- storage that fails, and saved games that cannot be used ----

const alerts = () => alertStore.open.map(alert => alert.title);

// A session reading what is in the shared storage now.
function nextSession(): Session {
  const next = new Session();
  next.storage = storage;
  next.start();
  return next;
}

test('when the browser cannot save, the game goes on and the player is told once', () => {
  storage.setItem = () => {
    throw new Error('The quota has been exceeded.');
  };

  session.createCommander('Tester', 2, startingSkills());
  session.game!.save();

  expect(session.screen).toBe('landing');
  expect(alerts()).toEqual([CANNOT_SAVE]);
});

test('unreadable data under "games" does not stop a new game', () => {
  storage.setItem('games', '{');
  const next = nextSession();
  expect(next.screen).toBe('newCommander');

  next.createCommander('Tester', 2, startingSkills());

  expect(next.screen).toBe('landing');
  expect(saved('games')).toEqual([next.game!.uniqueID]);
});

test('a damaged save is removed, the next one loads, and the player is told', () => {
  session.createCommander('Tester', 2, startingSkills());
  const good = session.game!.uniqueID;
  const games = JSON.parse(storage.getItem('games')!);
  storage.setItem('games', JSON.stringify({ broken: { difficulty: 'hard' }, ...games }));

  const next = nextSession();

  expect(next.game!.uniqueID).toBe(good);
  expect(saved('games')).toEqual([good]);
  expect(alerts()).toEqual([SAVE_REMOVED]);
});

test('a save that passes the check but fails to load is removed too', () => {
  session.createCommander('Tester', 2, startingSkills());
  vi.spyOn(Game, 'fromSerializedState').mockImplementation(() => {
    throw new Error('This save makes no sense to the rules.');
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});

  const next = nextSession();

  expect(next.screen).toBe('newCommander');
  expect(saved('games')).toEqual([]);
  expect(alerts()).toEqual([SAVE_REMOVED]);
});

test('a damaged high-score record is left out and removed', () => {
  session.createCommander('Tester', 2, startingSkills());
  session.endGame(GameEndStatus.Retired);
  const scores = JSON.parse(storage.getItem('highScoringGames')!);
  storage.setItem('highScoringGames', JSON.stringify({ ...scores, broken: { score: 99 } }));

  expect(session.highScores(6).map(state => state.commander.name)).toEqual(['Tester']);
  expect(saved('highScoringGames')).toEqual(Object.keys(scores));
});

import { expect, onTestFinished, test } from 'vitest';
import { Encounter } from '../game/encounter/Encounter.ts';
import { captainFor } from '../game/encounter/captains.ts';
import { fightRound } from '../game/encounter/fight.ts';
import { EncounterType } from '../game/encounter/types.ts';
import type { EncounterListener } from '../game/encounter/types.ts';
import { ActionLogger } from '../game/ActionLogger.ts';
import { GameRand } from '../game/GameRand.ts';
import { Opponent, OpponentType } from '../game/opponent/Opponent.ts';
import { ReputationScore } from '../game/Commander.ts';
import { AlertActionType, alertStore, AlertViewController } from '../game/alerts.ts';
import { runtime } from '../game/runtime.ts';
import { MockLocalStorage } from './support/MockLocalStorage.ts';
import { Session } from '../game/session.ts';
import ahabEncounter from './fixtures/ahab-encounter.json';
import oldSave from './fixtures/old-save.json';
import { runReplayLog, show } from './flows/harness.ts';
import { cellAfter, hasText, rowAfterHeading, textOf } from './support/page.ts';

test('a save written by the old code loads', () => {
  const storage = new MockLocalStorage();
  for (const [k, v] of Object.entries(oldSave)) storage.setItem(k, JSON.stringify(v));
  runtime.stLocalStorage = storage;
  runtime.gameRand = new GameRand(1);
  runtime.actionLog = new ActionLogger(1);
  const session = new Session();
  show(session);
  const { game } = session;
  const saved = Object.values(oldSave.games)[0];
  expect(game!.uniqueID).toBe(saved.uniqueID);
  expect(game!.commander.name).toBe(saved.commander.name);
  expect(game!.commander.days).toBe(saved.commander.days);
  expect(game!.commander.credits).toBe(saved.commander.credits);
  expect(game!.commander.currentSystem.name).toBe(saved.commander.currentSystemName);
  expect(game!.japoriQuestStatus).toBe(saved.japoriQuestStatus);
  expect(game!.commander.ship.type).toBe(saved.commander.ship.type);
  expect(document.getElementById('systemLandingDiv')).not.toBeNull();
});

// The old code threw here: it used a name that never existed for the "Dangerous" reputation.
test('destroying a famous captain raises reputation to at least Dangerous', () => {
  // Replay a recorded game up to the meeting with Captain Ahab, in a well-armed ship.
  const replay = runReplayLog(JSON.stringify(ahabEncounter));
  const game = replay.session.game!;
  runtime.gameRand = new GameRand(1);
  const before = game.commander.reputationScore;

  const captain = Opponent.generateOpponentWithType(OpponentType.FamousCaptain, game);
  captain.ship.damageShieldsByAmount(100000);
  captain.ship.damageHullByAmount(100000);
  const owner = new Proxy({}, { get: () => () => {} }) as EncounterListener;
  const type = EncounterType.FamousCaptainAhabAttack;
  const encounter = new Encounter(type, game, captain, owner);
  // Choosing to attack a captain posts this news item; the kill then replaces it.
  game.addBreakingNewsItem(captainFor(encounter.type).attackNews);
  fightRound(encounter, false, () => {});

  // Every kill also adds a bonus for the size of the destroyed ship.
  const killBonus = 1 + Math.floor(captain.ship.type / 2);
  expect(game.commander.reputationScore).toBe(
    Math.max(before + 100, ReputationScore.Dangerous) + killBonus
  );
  expect(game.breakingNews).toContain(captainFor(encounter.type).destroyNews);
});

function fixture(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
  onTestFinished(() => div.remove());
  return div;
}

test('textOf reads line breaks as new lines', () => {
  const div = fixture('a<br>b<br><br><h4>c</h4>');
  expect(textOf(div)).toBe('a\nb\n\nc');
});

test('textOf reads paragraphs as lines with an empty line between them', () => {
  const div = fixture('<h4>a</h4><p>b</p><p>c</p>');
  expect(textOf(div)).toBe('a\nb\n\nc');
});

test('hasText matches the exact text of a matching element', () => {
  const div = fixture('<table><tr><td>5</td></tr></table>');
  expect(hasText(div, 'td', '5')).toBe(true);
  expect(hasText(div, 'td', '4')).toBe(false);
});

test('cellAfter and rowAfterHeading find neighbouring table content', () => {
  const div = fixture(
    '<table><tr><th>Picked</th></tr><tr><td><span>Furs</span></td><td>4</td></tr></table>'
  );
  expect(cellAfter(div, 'Furs')).toBe('4');
  expect(cellAfter(div, 'Ore')).toBeNull();
  expect(textOf(rowAfterHeading('Picked'))).toBe('Furs4');
});

test('a replayed checkbox change reaches a React screen', () => {
  const log =
    '{"idLog":["createCommander","Bank"],"eventNameLog":["click","click"],"gameRandSeed":1733543535142}';
  const replay = runReplayLog(log);
  const game = replay.session.game!;
  const before = game.remindLoans;

  replay.replayEvent('remindLoansCheckbox', 'change');

  expect(game.remindLoans).toBe(!before);
  expect((document.getElementById('remindLoansCheckbox') as HTMLInputElement).checked).toBe(
    !before
  );
});

test('with two alerts sharing a button id, a click reaches the older one', () => {
  const pressed: string[] = [];
  for (const name of ['older', 'newer']) {
    const alert = new AlertViewController(name);
    alert.addAction('Dismiss', AlertActionType.Default, () => pressed.push(name));
    alert.presentView();
  }

  document.getElementById('alertButton_Dismiss')!.click();

  expect(pressed).toEqual(['older']);
  expect(alertStore.open.map(alert => alert.title)).toEqual(['newer']);
  expect(document.querySelectorAll('dialog').length).toBe(1);
  AlertViewController.clearAlerts();
});

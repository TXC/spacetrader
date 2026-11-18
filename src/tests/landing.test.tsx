import { expect, test } from 'vitest';
import { SpecialEvent } from '../game/SolarSystem.types.ts';
import { runReplayLog } from './flows/harness.ts';
import { landingMap } from './support/landingMap.ts';

const LANDED =
  '{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733543535142}';

// When the landing screen is rebuilt, as after a special event is accepted, the map starts
// afresh on the current system, whatever the player had picked on it before.
test('accepting a special event shows the current system on the map again', () => {
  const replay = runReplayLog(LANDED);
  const game = replay.session.game!;
  const here = game.commander.currentSystem;
  here.specialEvent = SpecialEvent.LotteryWinner;
  const elsewhere = game.solarSystems.find(system => system !== here)!;

  replay.replayEvent('namedEvent', `selectPlanetZoomed|${elsewhere.name}`);
  expect(landingMap().selectedSystem).toBe(elsewhere);

  // The link appears only when the screen is built, so open the event directly.
  replay.session.clickRow('Special');
  replay.replayEvent('alertButton_Dismiss', 'click');

  expect(landingMap().selectedSystem).toBe(here);
});

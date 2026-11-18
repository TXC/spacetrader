// What the flow tests share: starting a game on the page, replaying a recording, and
// the checks.
import { createElement, type ReactNode } from 'react';
import { expect } from 'vitest';
import { GameRand } from '../../game/GameRand.ts';
import { ActionLogger } from '../../game/ActionLogger.ts';
import { Game } from '../../game/Game.ts';
import { Utils, pLog } from '../../game/Utilities.ts';
import { MockLocalStorage } from '../support/MockLocalStorage.ts';
import { runtime } from '../../game/runtime.ts';
import { parseSavedGame } from '../../game/savedGame.ts';
import { AlertViewController } from '../../game/alerts.ts';
import { Session, activate } from '../../game/session.ts';
import { Cheats } from '../../ui/Cheats.tsx';
import { Game as GameScreen } from '../../ui/Game.tsx';
import { ActionLogReplay } from '../support/ActionLogReplay.ts';
import { mountAlertHost } from '../support/mountAlertHost.tsx';
import { mountReact } from '../support/mountReact.ts';
import { welcome } from '../support/page.ts';
import type { GalaxyView } from '../../ui/canvas/GalaxyView.ts';

export { ActionLogReplay };

// ---- putting a game on the page ---------------------------------------------------------

// One mounted screen per page element at a time.
const mounted = new Map<Element, () => void>();

function mount(container: Element, element: ReactNode) {
  mounted.get(container)?.();
  mounted.set(container, mountReact(container, element));
}

// Removes everything the tests put on the page. Called between tests.
export function unmountAll() {
  for (const unmount of mounted.values()) unmount();
  mounted.clear();
}

// Shows a session's game in the page's #game element, with the cheats in #cheats.
export function show(session: Session) {
  activate(session);
  mountAlertHost();
  mount(document.getElementById('game')!, createElement(GameScreen, { session }));
  session.start();
  const cheats = document.getElementById('cheats');
  if (runtime.debugMode && cheats) mount(cheats, createElement(Cheats, { session }));
}

// Starts a new game and replays a recording into it. Returns the replay; its `session`
// is the game's session.
type RegisterHandler = (elementID: string, eventName: string) => void;

export function runReplayLog(replayLog: string, registerEventHandler?: RegisterHandler) {
  unmountAll();
  AlertViewController.clearAlerts();

  const randSeed = Date.now();
  runtime.gameRand = new GameRand(randSeed);
  runtime.actionLog = new ActionLogger(randSeed);
  runtime.stLocalStorage = new MockLocalStorage();

  if (registerEventHandler) {
    runtime.actionLog.registerEventHandler = registerEventHandler;
  }

  const session = new Session();
  session.loadGame = false;
  show(session);

  const replay = new ActionLogReplay(replayLog, session);
  replay.replay();

  return replay;
}

// The map the landing screen is showing, with what is selected on it.
export function mapOf(session: Session): GalaxyView {
  return session.map as GalaxyView;
}

export function replaySkipEncounters(replay: ActionLogReplay, breakConditionFn?: () => unknown) {
  let loopCount = 0;
  do {
    if (breakConditionFn && breakConditionFn()) {
      break;
    }

    let buttons = [
      'alertButton_Dismiss',
      'ecButton_Ignore',
      'ecButton_Submit',
      'ecButton_Auto_Flee',
    ];

    const session = replay.session;
    const game = session.game!;
    if (game.commander.ship.hasIllegalGoods()) {
      buttons = buttons.filter(x => x !== 'ecButton_Submit');
    }

    for (const buttonID of buttons) {
      const el = document.getElementById(buttonID);
      if (el) {
        replay.replayEvent(buttonID, 'click');
        break;
      }
    }

    if (welcome()) {
      break;
    }

    loopCount++;
  } while (loopCount < 100);
  assertTrue(loopCount < 100, 'Exceeded auto action loop limit');
}

export function serializeAndDeserialize(game: Game) {
  const gsJSONStr = JSON.stringify(game.serializedState());
  // Through the same check a real load goes through, so the check is tried on every
  // game the flow tests save.
  const gs = parseSavedGame(JSON.parse(gsJSONStr));
  if (!gs) throw new Error('The saved game did not pass the check.');

  const game2 = Game.fromSerializedState(gs);

  return game2;
}

export function performStressTest(
  testName: string,
  randSeed: number,
  initialLog: string,
  numActionsToPerform: number,
  avoidGalacticChart?: boolean,
  prioritizeBlastOff?: boolean
) {
  // Use a deterministic random number generator that is not the one used by the game (so I can take a log that hit an issue and replay it in index.html)
  const testRand = new GameRand(randSeed);

  // Hook into runtime.actionLog to remember the id of every element registered
  let seenElementIDs: string[] = [];
  let seenEventNames: string[] = [];
  const registerEventHandler: RegisterHandler = (elementID, eventName) => {
    seenElementIDs.push(elementID);
    seenEventNames.push(eventName);
  };

  // Create a game
  const replay = runReplayLog(initialLog, registerEventHandler);

  let galacticChartConsecutiveActions = 0;

  let i: number;
  for (i = 0; i < numActionsToPerform; ++i) {
    // Look up every known registered element id in the document
    const liveElementIDs: string[] = [];
    const liveEventNames: string[] = [];
    for (let j = 0; j < seenElementIDs.length; ++j) {
      // Prune the ones that are no longer present
      if (document.getElementById(seenElementIDs[j])) {
        liveElementIDs.push(seenElementIDs[j]);
        liveEventNames.push(seenEventNames[j]);
      }
    }
    seenElementIDs = liveElementIDs;
    seenEventNames = liveEventNames;

    // Filter element id list down to choose an action to perform: remove cheats, filter everything else if there is an alert shown
    const eligibleElementIDs: string[] = [];
    const eligibleEventNames: string[] = [];

    for (let j = 0; j < liveElementIDs.length; ++j) {
      const eID = liveElementIDs[j];
      const eName = liveEventNames[j];

      // Remove cheats
      let shouldFilter = eID.startsWith('cheat_');

      // Remove the end game button
      shouldFilter = shouldFilter || eID === 'giveup';

      // If an alert is shown, require that the user acts on it
      const alertElement = document.querySelector('dialog');
      if (alertElement) {
        const thisEl = document.getElementById(eID);
        shouldFilter = shouldFilter || !alertElement.contains(thisEl);
      }

      // Avoid getting stuck on galactic chart
      if (avoidGalacticChart && galacticChartConsecutiveActions > 2) {
        shouldFilter = shouldFilter || eID.startsWith('galacticChart');
      }

      if (!shouldFilter) {
        eligibleElementIDs.push(eID);
        eligibleEventNames.push(eName);
      }
    }

    // Pick an action, execute it
    let chosenElementID = 'warpBlastOff';
    let chosenEventName = 'click';
    let pickBlastOff =
      prioritizeBlastOff &&
      eligibleElementIDs.includes('warpBlastOff') &&
      testRand.randomIntBelow(2) == 1;
    if (!pickBlastOff) {
      chosenElementID = 'Warp';
      chosenEventName = 'click';
      pickBlastOff =
        prioritizeBlastOff &&
        eligibleElementIDs.includes('Warp') &&
        testRand.randomIntBelow(10) == 1;
    }

    if (!pickBlastOff) {
      const chosenIndex = testRand.randomIntBelow(eligibleElementIDs.length);
      chosenElementID = eligibleElementIDs[chosenIndex];
      chosenEventName = eligibleEventNames[chosenIndex];
    }

    // Cash infusion so the test doesn't get stuck with no money for long
    if (i > 0 && i % 800 === 0) {
      chosenElementID = 'cheat_freeMoney';
      chosenEventName = 'click';
    }

    replay.replayEvent(chosenElementID, chosenEventName);

    if (chosenElementID.startsWith('galacticChart')) {
      galacticChartConsecutiveActions++;
    } else {
      galacticChartConsecutiveActions = 0;
    }

    // Periodically ensure that serializing/deserializing the game results in an identical game
    if (i > 0 && i % 30 === 0) {
      const session = replay.session;
      const game = session.game;
      if (game) {
        pLog.log(101);
        const game2 = serializeAndDeserialize(game);
        assertEqualGames(game, game2);
      }
    }
  }

  console.log(
    `==== Stress test ${testName} completed with ${i} / ${numActionsToPerform} actions ==== \n` +
      runtime.actionLog.serializedString()
  );
}

// ---- checks -----------------------------------------------------------------------------

export function assertTrue(condition: unknown, message?: string) {
  expect(Boolean(condition), message).toBe(true);
}

// Strict equality, as `===`.
export function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) expect(actual).toBe(expected);
}

export function assertEqualArrays(actual: unknown, expected: unknown) {
  expect(Array.isArray(actual) && Array.isArray(expected), 'both are arrays').toBe(true);
  expect(actual).toStrictEqual(expected);
}

export function assertEqualDeep(actual: unknown, expected: unknown) {
  let difference = '';
  const equal = Utils.isEqualDeep(actual, expected, (found: string) => {
    difference = found;
  });
  expect(equal, difference).toBe(true);
}

// Fields a saved game does not keep: the save hook and the cheats' switches.
const UNSAVED = ['_saveBlock', 'showSpecialSystems', 'forceRareEvent'] as const;

// Compares two games with their unsaved fields set aside, and puts those back after.
export function assertEqualGames(game1: Game, game2: Game) {
  const fields = [game1, game2].map(game => game as unknown as Record<string, unknown>);
  const kept = fields.map(game => UNSAVED.map(key => [key, key in game, game[key]] as const));
  fields.forEach(game => UNSAVED.forEach(key => delete game[key]));
  try {
    assertEqualDeep(game1, game2);
  } finally {
    kept.forEach((entries, i) =>
      entries.forEach(([key, had, value]) => {
        if (had) fields[i][key] = value;
      })
    );
  }
}

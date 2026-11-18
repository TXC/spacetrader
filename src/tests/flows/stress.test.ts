// Flow tests: each replays a recorded play session by clicking the recorded elements, then
// checks what the player sees and what the game holds. Converted from the original
// project's UnitTests.js; the recordings and expected values are unchanged.
import { beforeEach, expect, test } from 'vitest';
import { performStressTest, recording } from './harness.ts';
import fingerprints from './stressFingerprints.json';

// The seed of the random walk. Set STRESS_SEED to walk other paths.
const randSeed = Number(import.meta.env.STRESS_SEED) || 1732183570755; // Date.now() when I wrote this line

// The fingerprint of each walk of the running test, in order.
let walked: string[] = [];
beforeEach(() => {
  walked = [];
});

function walk(...args: Parameters<typeof performStressTest>) {
  walked.push(performStressTest(...args));
}

// stressFingerprints.json holds what each walk left behind when the game was known to be
// right. A difference means the game now does something else. Another seed walks other
// paths, so then there is nothing to compare with.
function expectSameGameAsBefore(name: keyof typeof fingerprints) {
  if (import.meta.env.STRESS_SEED) return;
  expect(walked).toEqual(fingerprints[name]);
}

test('beginnerDifficulty', () => {
  let initialLog = recording('stress_beginnerDifficulty');

  walk('Beginner A', randSeed, initialLog, 200, false, false);
  walk('Beginner B', randSeed, initialLog, 400, true, false);
  walk('Beginner C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_beginnerDifficulty_D');
  walk('Beginner D', randSeed, initialLog, 1500, true, true);

  expectSameGameAsBefore('beginnerDifficulty');
});

test('easyDifficulty', () => {
  let initialLog = recording('stress_easyDifficulty');

  walk('Easy A', randSeed, initialLog, 200, false, false);
  walk('Easy B', randSeed, initialLog, 400, true, false);
  walk('Easy C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_easyDifficulty_D');
  walk('Easy D', randSeed, initialLog, 1500, true, true);

  expectSameGameAsBefore('easyDifficulty');
});

test('normalDifficulty', () => {
  let initialLog = recording('stress_normalDifficulty');

  walk('Normal A', randSeed, initialLog, 200, false, false);
  walk('Normal B', randSeed, initialLog, 400, true, false);
  walk('Normal C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_normalDifficulty_D');

  walk('Normal D', randSeed, initialLog, 1500, true, true);

  expectSameGameAsBefore('normalDifficulty');
});

test('hardDifficulty', () => {
  let initialLog = recording('stress_hardDifficulty');

  walk('Hard A', randSeed, initialLog, 200, false, false);
  walk('Hard B', randSeed, initialLog, 400, true, false);
  walk('Hard C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_hardDifficulty_D');
  walk('Hard D', randSeed, initialLog, 1500, true, true);

  expectSameGameAsBefore('hardDifficulty');
});

test('absurdDifficulty', () => {
  let initialLog = recording('stress_absurdDifficulty');

  walk('Absurd A', randSeed, initialLog, 200, false, false);
  walk('Absurd B', randSeed, initialLog, 400, true, false);
  walk('Absurd C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_absurdDifficulty_D');

  walk('Absurd D', randSeed, initialLog, 1500, true, true);

  expectSameGameAsBefore('absurdDifficulty');
});

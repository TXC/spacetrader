// Flow tests: each replays a recorded play session by clicking the recorded elements, then
// checks what the player sees and what the game holds. Converted from the original
// project's UnitTests.js; the recordings and expected values are unchanged.
import { test } from 'vitest';
import { performStressTest, recording } from './harness.ts';

// The seed of the random walk. Set STRESS_SEED to walk other paths.
const randSeed = Number(import.meta.env.STRESS_SEED) || 1732183570755; // Date.now() when I wrote this line

test('beginnerDifficulty', () => {
  let initialLog = recording('stress_beginnerDifficulty');

  performStressTest('Beginner A', randSeed, initialLog, 200, false, false);
  performStressTest('Beginner B', randSeed, initialLog, 400, true, false);
  performStressTest('Beginner C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_beginnerDifficulty_D');
  performStressTest('Beginner D', randSeed, initialLog, 1500, true, true);
});

test('easyDifficulty', () => {
  let initialLog = recording('stress_easyDifficulty');

  performStressTest('Easy A', randSeed, initialLog, 200, false, false);
  performStressTest('Easy B', randSeed, initialLog, 400, true, false);
  performStressTest('Easy C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_easyDifficulty_D');
  performStressTest('Easy D', randSeed, initialLog, 1500, true, true);
});

test('normalDifficulty', () => {
  let initialLog = recording('stress_normalDifficulty');

  performStressTest('Normal A', randSeed, initialLog, 200, false, false);
  performStressTest('Normal B', randSeed, initialLog, 400, true, false);
  performStressTest('Normal C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_normalDifficulty_D');

  performStressTest('Normal D', randSeed, initialLog, 1500, true, true);
});

test('hardDifficulty', () => {
  let initialLog = recording('stress_hardDifficulty');

  performStressTest('Hard A', randSeed, initialLog, 200, false, false);
  performStressTest('Hard B', randSeed, initialLog, 400, true, false);
  performStressTest('Hard C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_hardDifficulty_D');
  performStressTest('Hard D', randSeed, initialLog, 1500, true, true);
});

test('absurdDifficulty', () => {
  let initialLog = recording('stress_absurdDifficulty');

  performStressTest('Absurd A', randSeed, initialLog, 200, false, false);
  performStressTest('Absurd B', randSeed, initialLog, 400, true, false);
  performStressTest('Absurd C', randSeed, initialLog, 500, true, true);

  initialLog = recording('stress_absurdDifficulty_D');

  performStressTest('Absurd D', randSeed, initialLog, 1500, true, true);
});

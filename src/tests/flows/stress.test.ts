// Flow tests: each replays a recorded play session by clicking the recorded elements, then
// checks what the player sees and what the game holds. Converted from the original
// project's UnitTests.js; the recordings and expected values are unchanged.
import { test } from 'vitest';
import { performStressTest } from './harness.ts';

test('beginnerDifficulty', () => {
  const randSeed = 1732183570755; // Date.now() when I wrote this line
  let initialLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|0","click"],"gameRandSeed":1732326941039}`;

  performStressTest('Beginner A', randSeed, initialLog, 200, false, false);
  performStressTest('Beginner B', randSeed, initialLog, 400, true, false);
  performStressTest('Beginner C', randSeed, initialLog, 500, true, true);

  initialLog = `{"idLog":["difficultySelect","createCommander","Special","alertButton_Dismiss","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod"],"eventNameLog":["select|change|0","click","click","click","click","click","change","change","click"],"gameRandSeed":1732327630785}`;
  performStressTest('Beginner D', randSeed, initialLog, 1500, true, true);
});

test('easyDifficulty', () => {
  const randSeed = 1732183570755; // Date.now() when I wrote this line
  let initialLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|1","click"],"gameRandSeed":1732326941039}`;

  performStressTest('Easy A', randSeed, initialLog, 200, false, false);
  performStressTest('Easy B', randSeed, initialLog, 400, true, false);
  performStressTest('Easy C', randSeed, initialLog, 500, true, true);

  initialLog = `{"idLog":["difficultySelect","createCommander","Special","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","cheat_freeMoney"],"eventNameLog":["select|change|1","click","click","click","click","change","change","click","click"],"gameRandSeed":1732335347505}`;
  performStressTest('Easy D', randSeed, initialLog, 1500, true, true);
});

test('normalDifficulty', () => {
  const randSeed = 1732183570755; // Date.now() when I wrote this line
  let initialLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1732183330034}`;

  performStressTest('Normal A', randSeed, initialLog, 200, false, false);
  performStressTest('Normal B', randSeed, initialLog, 400, true, false);
  performStressTest('Normal C', randSeed, initialLog, 500, true, true);

  initialLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","galacticChart_track_121_Andevian","galacticChart_track_121_Andevian","galacticChart_useSingularity_121_Andevian","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669532436}`;

  performStressTest('Normal D', randSeed, initialLog, 1500, true, true);
});

test('hardDifficulty', () => {
  const randSeed = 1732183570755; // Date.now() when I wrote this line
  let initialLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|3","click"],"gameRandSeed":1732335655620}`;

  performStressTest('Hard A', randSeed, initialLog, 200, false, false);
  performStressTest('Hard B', randSeed, initialLog, 400, true, false);
  performStressTest('Hard C', randSeed, initialLog, 500, true, true);

  initialLog = `{"idLog":["difficultySelect","createCommander","cheat_freeMoney","cheat_freeSingularity","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Chart","galacticChart_useSingularity_121_Guinifer","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Warp"],"eventNameLog":["select|change|3","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669747185}`;
  performStressTest('Hard D', randSeed, initialLog, 1500, true, true);
});

test('absurdDifficulty', () => {
  const randSeed = 1732183570755; // Date.now() when I wrote this line
  let initialLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|4","click"],"gameRandSeed":1732336512130}`;

  performStressTest('Absurd A', randSeed, initialLog, 200, false, false);
  performStressTest('Absurd B', randSeed, initialLog, 400, true, false);
  performStressTest('Absurd C', randSeed, initialLog, 500, true, true);

  initialLog = `{"idLog":["difficultySelect","createCommander","cheat_freeMoney","cheat_freeSingularity","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Chart","galacticChart_useSingularity_121_Umberlee","alertButton_Warp_","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","sell_Targeting_system","alertButton_Yes","buy_Cloaking_device","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Energy_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Warp"],"eventNameLog":["select|change|4","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669932644}`;

  performStressTest('Absurd D', randSeed, initialLog, 1500, true, true);
});

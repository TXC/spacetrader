import { expect, test } from 'vitest';
import { captainFor } from './encounter/captains.ts';
import { EncounterType } from './encounter/types.ts';
import { GameEndStatus } from './Game.types.ts';
import { endStatusText } from './HallOfFame.ts';
import { occurrenceStr } from './Politics.ts';
import {
  Difficulty,
  difficultyName,
  SystemSize,
  systemSizeName,
  DIFFICULTY_COUNT,
} from './SolarSystem.types.ts';
import { named } from './texts.ts';

test('a lookup gives the text for a value and the fallback for anything else', () => {
  const size = named<0 | 1>({ 0: 'small', 1: 'large' }, 'unknown');
  expect([size(0), size(1), size(2), size(-1)]).toEqual(['small', 'large', 'unknown', 'unknown']);
  expect(named<0>({ 0: 'only' })(5)).toBe('');
});

test('difficulty, system size and end status keep their texts', () => {
  expect(difficultyName(Difficulty.Beginner)).toBe('Beginner');
  expect(difficultyName(Difficulty.Absurd)).toBe('Absurd');
  expect(difficultyName(DIFFICULTY_COUNT)).toBe('Unknown');
  expect(systemSizeName(SystemSize.Medium)).toBe('Medium-sized');
  expect(systemSizeName(99)).toBe('Unknown');
  expect(endStatusText(GameEndStatus.None)).toBe('is still playing');
  expect(endStatusText(GameEndStatus.Killed)).toBe('was killed');
  expect(endStatusText(GameEndStatus.Moon)).toBe('claimed a moon');
  expect(endStatusText(GameEndStatus.Retired)).toBe('retired');
});

test('how common something is, in words', () => {
  expect([0, 3, 6, 7, 12, -1].map(occurrenceStr)).toEqual([
    'No',
    'Some',
    'Abundant',
    'Excessive',
    'Excessive',
    'Excessive',
  ]);
});

test('each famous captain encounter knows its captain', () => {
  expect(captainFor(EncounterType.FamousCaptainAhabEncounter).name).toBe('Ahab');
  expect(captainFor(EncounterType.FamousCaptainAhabAttack).attackNews).toBe(
    'Thug Assaults Captain Ahab!'
  );
  expect(captainFor(EncounterType.FamousCaptainConradAttack).name).toBe('Conrad');
  expect(captainFor(EncounterType.FamousCaptainHuieEncounter).name).toBe('Huie');
  expect(captainFor(EncounterType.FamousCaptainHuieAttack).destroyNews).toBe(
    "Citizens Mourn Destruction of Captain Huie's Ship!"
  );
});

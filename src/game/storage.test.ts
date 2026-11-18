import { expect, test } from 'vitest';
import { browserStorage, memoryStorage, readJson, writeJson } from './storage.ts';

test('what is written can be read back', () => {
  const storage = memoryStorage();

  expect(writeJson(storage, 'games', { a: 1 })).toBe(true);
  expect(readJson(storage, 'games')).toEqual({ a: 1 });
});

test('a missing entry and an unreadable one both read as nothing', () => {
  const storage = memoryStorage();
  storage.setItem('games', '{');

  expect(readJson(storage, 'games')).toBeUndefined();
  expect(readJson(storage, 'other')).toBeUndefined();
});

test('a storage that refuses to write is reported, not thrown', () => {
  const full = {
    getItem: () => null,
    setItem: () => {
      throw new Error('The quota has been exceeded.');
    },
  };

  expect(writeJson(full, 'games', {})).toBe(false);
});

test('without a usable browser storage, the game keeps things in memory', () => {
  // These tests run outside a browser, which is the same as storage being blocked.
  const storage = browserStorage();

  storage.setItem('games', '{}');
  expect(storage.getItem('games')).toBe('{}');
});

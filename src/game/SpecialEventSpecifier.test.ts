import { expect, test } from 'vitest';
import { SpecialEvent } from './SolarSystem.types.ts';
import { randomOccurrenceEventTypes, specialEventForType } from './SpecialEventSpecifier.ts';

test('an event is found by its number, and "no event" finds nothing', () => {
  const moon = specialEventForType(SpecialEvent.MoonForSale)!;
  expect(moon.type).toBe(SpecialEvent.MoonForSale);
  expect(moon.name).toBe('Moon for Sale');
  expect(specialEventForType(SpecialEvent.None)).toBeUndefined();
});

test('the randomly placed events keep their order and counts', () => {
  expect(randomOccurrenceEventTypes()).toEqual([
    14, 14, 14, 14, 15, 15, 15, 16, 17, 17, 17, 18, 18, 18, 19, 20, 21, 21, 21, 23, 27, 32, 35,
  ]);
});

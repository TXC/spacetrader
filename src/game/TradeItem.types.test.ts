import { expect, test } from 'vitest';
import {
  isIllegalTradeItem,
  Resource,
  resourceName,
  Status,
  statusDescription,
  TechLevel,
  techLevelName,
  TradeItemType,
  TECH_LEVEL_COUNT,
} from './TradeItem.types.ts';

test('every tech level, status and resource has its text', () => {
  expect(techLevelName(TechLevel.PreAgricultural)).toBe('Pre-Agricultural');
  expect(techLevelName(TechLevel.HighTech)).toBe('High-Tech');
  expect(statusDescription(Status.Uneventful)).toBe('under no particular pressure');
  expect(statusDescription(Status.LackWorkers)).toBe('lacking enough workers');
  expect(resourceName(Resource.None)).toBe('Nothing special');
  expect(resourceName(Resource.Warlike)).toBe('Warlike populace');
  const texts = [
    Object.values(TechLevel).map(techLevelName),
    Object.values(Status).map(statusDescription),
    Object.values(Resource).map(resourceName),
  ];
  for (const list of texts) {
    expect(list).not.toContain('');
    expect(new Set(list).size).toBe(list.length);
  }
});

test('a number that is not a real value has no text', () => {
  expect(techLevelName(TECH_LEVEL_COUNT)).toBe('');
  expect(statusDescription(-1)).toBe('');
  expect(resourceName(99)).toBe('');
});

test('only firearms and narcotics are illegal', () => {
  const illegal = Object.values(TradeItemType).filter(isIllegalTradeItem);
  expect(illegal).toEqual([TradeItemType.Firearms, TradeItemType.Narcotics]);
});

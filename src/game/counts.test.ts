import { expect, test } from 'vitest';
import { RARE_EVENT_COUNT } from './Game.ts';
import { OPPONENT_TYPE_COUNT } from './Opponent.ts';
import { POLITICS_COUNT } from './Politics.ts';
import { SHIP_MODEL_COUNT, ShipModelType } from './Ship.ts';
import { DIFFICULTY_COUNT, SYSTEM_SIZE_COUNT } from './SolarSystem.types.ts';
import { countOf } from './texts.ts';
import {
  FAKE_QUEST_CARGO,
  FAKE_QUEST_CARGO_REACTOR,
  NO_TRADE_ITEM,
  NOT_FOR_SALE,
  RESOURCE_COUNT,
  STATUS_COUNT,
  TECH_LEVEL_COUNT,
  TechLevel,
  TRADE_ITEM_COUNT,
  TradeItemType,
} from './TradeItem.types.ts';

test('a list is counted by its values, so a second name for a value does not count twice', () => {
  expect(countOf({ a: 0, b: 1, best: 1 })).toBe(2);
});

test('every list has as many values as the original game', () => {
  expect({
    TECH_LEVEL_COUNT,
    STATUS_COUNT,
    RESOURCE_COUNT,
    TRADE_ITEM_COUNT,
    DIFFICULTY_COUNT,
    SYSTEM_SIZE_COUNT,
    POLITICS_COUNT,
    SHIP_MODEL_COUNT,
    OPPONENT_TYPE_COUNT,
    RARE_EVENT_COUNT,
  }).toEqual({
    TECH_LEVEL_COUNT: 8,
    STATUS_COUNT: 8,
    RESOURCE_COUNT: 13,
    TRADE_ITEM_COUNT: 10,
    DIFFICULTY_COUNT: 5,
    SYSTEM_SIZE_COUNT: 5,
    POLITICS_COUNT: 17,
    SHIP_MODEL_COUNT: 15,
    OPPONENT_TYPE_COUNT: 10,
    RARE_EVENT_COUNT: 6,
  });
});

test('no list has an entry that is not a real value', () => {
  expect(Object.keys(TechLevel)).not.toContain('Count');
  expect(Object.keys(ShipModelType)).not.toContain('Count');
  expect(Object.values(TradeItemType)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('the values that stand outside the lists keep their numbers, which saved games hold', () => {
  expect(NOT_FOR_SALE).toBe(TECH_LEVEL_COUNT);
  expect([NO_TRADE_ITEM, FAKE_QUEST_CARGO, FAKE_QUEST_CARGO_REACTOR]).toEqual([-1, 11, 12]);
});

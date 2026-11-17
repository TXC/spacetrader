import { expect, test } from 'vitest';
import { GameRand } from './GameRand.ts';
import { politicsForType, PoliticsType, randomPoliticsForTechLevel } from './Politics.ts';
import { runtime } from './runtime.ts';
import { TechLevel, TradeItemType } from './TradeItem.types.ts';

test('every kind of government is in the table under its own number', () => {
  for (let type = 0; type < PoliticsType.Count; type++) {
    expect(politicsForType(type).type).toBe(type);
  }
});

test('a government keeps the values the old game gave it', () => {
  expect(politicsForType(PoliticsType.Anarchy)).toMatchObject({
    name: 'Anarchist State',
    reactionIllegal: 0,
    occurrencePolice: 0,
    occurrencePirates: 7,
    occurrenceTraders: 1,
    minTechLevel: TechLevel.PreAgricultural,
    maxTechLevel: TechLevel.Industrial,
    bribeWillingness: 7,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Food,
  });
});

test('a random government fits the tech level', () => {
  runtime.gameRand = new GameRand(42);
  for (let i = 0; i < 200; i++) {
    const politics = randomPoliticsForTechLevel(TechLevel.PreAgricultural);
    expect(politics.minTechLevel).toBeLessThanOrEqual(TechLevel.PreAgricultural);
  }
});

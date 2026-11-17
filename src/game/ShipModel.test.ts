import { expect, test } from 'vitest';
import { shipModelForType, ShipModelType, SHIP_MODEL_COUNT } from './Ship.ts';
import { TechLevel } from './TradeItem.types.ts';

test('every ship model is in the table under its own number', () => {
  for (let type = 0; type < SHIP_MODEL_COUNT; type++) {
    expect(shipModelForType(type).type).toBe(type);
  }
});

test('a model keeps the values the old game gave it', () => {
  const gnat = shipModelForType(ShipModelType.Gnat);
  expect(gnat).toMatchObject({
    name: 'Gnat',
    cargoBays: 15,
    weaponSlots: 1,
    shieldSlots: 0,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 14,
    minTechLevel: TechLevel.Industrial,
    costOfFuel: 2,
    price: 10000,
    bounty: 50,
    frequency: 28,
    hullStrength: 100,
    police: 0,
    pirates: 0,
    traders: 0,
    repairCosts: 1,
    size: 1,
  });
  expect(gnat.mercenaryQuarters()).toBe(0);
});

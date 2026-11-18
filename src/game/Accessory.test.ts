import { expect, test } from 'vitest';
import {
  accessoryForType,
  AccessoryType,
  Gadget,
  gadgetForType,
  shieldForType,
  weaponForType,
} from './Accessory.ts';
import { TechLevel } from './TradeItem.types.ts';

test('every piece of equipment is in the table under its own number', () => {
  for (let type = AccessoryType.GadgetFirst; type <= AccessoryType.ShieldLast; type++) {
    expect(accessoryForType(type)!.type).toBe(type);
  }
  expect(accessoryForType(AccessoryType.None)).toBeUndefined();
});

test('equipment keeps the values the old game gave it', () => {
  expect(weaponForType(AccessoryType.WeaponBeamLaser)).toMatchObject({
    name: 'Beam laser',
    price: 12500,
    techLevel: TechLevel.PostIndustrial,
    occurrence: 35,
    power: 25,
  });
  expect(shieldForType(AccessoryType.ShieldLightning)).toMatchObject({ price: 45000, power: 350 });
  expect(gadgetForType(AccessoryType.GadgetCloakingDevice)).toMatchObject({ price: 100000 });
});

test('a lookup only finds equipment of its own kind', () => {
  expect(gadgetForType(AccessoryType.WeaponPulseLaser)).toBeUndefined();
  expect(weaponForType(AccessoryType.ShieldEnergy)).toBeUndefined();
  expect(shieldForType(AccessoryType.GadgetFuelCompactor)).toBeUndefined();
});

test('equipment knows its kind and whether it is sold', () => {
  const compactor = gadgetForType(AccessoryType.GadgetFuelCompactor)!;
  expect(compactor).toBeInstanceOf(Gadget);
  expect(compactor.category).toBe('gadget');
  expect(compactor.isBuyable).toBe(false);
  expect(weaponForType(AccessoryType.WeaponMilitaryLaser)!.isBuyable).toBe(true);
  expect(shieldForType(AccessoryType.ShieldEnergy)!.category).toBe('shield');
});

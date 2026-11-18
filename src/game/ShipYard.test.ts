import { expect, test } from 'vitest';
import { newGame, press, topAlert } from '../tests/support/newGame.ts';
import { accessoryForType, AccessoryType } from './Accessory.ts';
import { CrewMember } from './CrewMember.ts';
import type { Game } from './Game.ts';
import { Ship, shipModelForType, ShipModelType } from './Ship.ts';
import { buyShip, priceForModel } from './ShipYard.ts';
import { TradeItemType } from './TradeItem.types.ts';

const { Flea, Gnat, Firefly, Mosquito, Beetle } = ShipModelType;
const { ShieldLightning, GadgetFuelCompactor, WeaponMorgansLaser } = AccessoryType;

// The commander's Gnat is worth $7,500 in trade; a trader of skill 5 pays 95% of a price.
test.each([
  ['a Firefly costs its price less the Gnat', Firefly, () => {}, 23_750 - 7_500],
  ['a Flea pays a credit', Flea, () => {}, 1_900 - 7_500],
  [
    'a Firefly costs more for a Gnat full of tribbles',
    Firefly,
    (game: Game) => (game.commander.ship.tribbles = 10),
    23_750 - 2_500,
  ],
  [
    'a Firefly costs less for a Gnat with cargo',
    Firefly,
    (game: Game) => {
      game.commander['_basePrices']![TradeItemType.Water] = 40;
      game.commander.ship.boughtQuantity(10, TradeItemType.Water, 0);
    },
    23_750 - 7_500 - 400,
  ],
  [
    'a ship the trade-in pays for exactly costs $1',
    Firefly,
    (game: Game) => {
      game.commander['_basePrices']![TradeItemType.Water] = 23_750 - 7_500;
      game.commander.ship.boughtQuantity(1, TradeItemType.Water, 0);
    },
    1,
  ],
])('trading in: %s', (_, model, setUp, price) => {
  const game = newGame();
  setUp(game);

  expect(priceForModel(game, shipModelForType(model))).toBe(price);
});

test('trading in for a smaller ship is offered as a credit', () => {
  const game = newGame();

  buyShip(game, shipModelForType(Flea));
  expect(topAlert().title).toBe(
    'Are you sure you want to trade your Gnat for a Flea for a credit of $5600?'
  );
  press('Yes');

  expect(game.commander.ship.type).toBe(Flea);
  expect(game.commander.credits).toBe(1000 + 5600);
});

// A commander in a Mosquito with all three rare items, and the money for any ship.
function collector(): Game {
  const game = newGame();
  const ship = Ship.create(Mosquito, game.difficulty);
  [ShieldLightning, GadgetFuelCompactor, WeaponMorgansLaser].forEach(type =>
    ship.addAccessoryOfType(type)
  );
  game.commander.ship = ship;
  game.commander.credits = 200_000;
  return game;
}

const twoThirds = (type: number) => Math.floor((accessoryForType(type)!.price * 2) / 3);

test('rare equipment that fits moves to the new ship at two thirds of its price', () => {
  const game = collector();
  const price = priceForModel(game, shipModelForType(Beetle));
  const extra = twoThirds(ShieldLightning) + twoThirds(GadgetFuelCompactor);

  buyShip(game, shipModelForType(Beetle));
  expect(topAlert().title).toContain(
    `To keep your rare equipment, you will need to pay an extra $${extra}. Please note that:\nYou will lose your Morgan's Laser due to insufficient weapon slots.`
  );
  press('Yes');

  const { ship } = game.commander;
  expect(ship.hasShieldOfType(ShieldLightning)).toBe(true);
  expect(ship.hasGadgetOfType(GadgetFuelCompactor)).toBe(true);
  expect(ship.hasWeaponOfType(WeaponMorgansLaser)).toBe(false);
  expect(game.commander.credits).toBe(200_000 - price - extra);
});

test('rare equipment that has no slot on the new ship is lost, and costs nothing', () => {
  const game = collector();

  buyShip(game, shipModelForType(Flea));

  expect(topAlert().title).toMatch(/for a credit of \$\d+\? Please note that:\n/);
  expect(topAlert().title).toContain(
    'You will lose your Lightning shield due to insufficient shield slots.'
  );
  expect(topAlert().title).toContain(
    'You will lose your Fuel Compactor due to insufficient gadget slots.'
  );
  expect(topAlert().title).not.toContain('pay an extra');
});

test('rare equipment that cannot be paid for stops the trade', () => {
  const game = collector();
  game.commander.credits = priceForModel(game, shipModelForType(Firefly));

  buyShip(game, shipModelForType(Firefly));

  expect(topAlert().title).toMatch(
    /^You've got special equipment on board which will cost \$\d+ to move over/
  );
  expect(game.commander.ship.type).toBe(Mosquito);
});

test('a ship without quarters for the crew is not sold', () => {
  const game = newGame();
  game.commander.ship = Ship.create(Beetle, game.difficulty);
  game.commander.ship.addCrewMember(CrewMember.create('Hired Hand', 4, 4, 4, 4));

  buyShip(game, shipModelForType(Gnat));

  expect(topAlert().title).toMatch(/^The new ship you picked doesn't have enough quarters/);
  expect(game.commander.ship.type).toBe(Beetle);
});

test('the crew moves to the new ship', () => {
  const game = newGame();
  game.commander.ship = Ship.create(Beetle, game.difficulty);
  const hand = CrewMember.create('Hired Hand', 4, 4, 4, 4);
  game.commander.ship.addCrewMember(hand);

  buyShip(game, shipModelForType(ShipModelType.Bumblebee));
  press('Yes');

  expect(game.commander.ship.type).toBe(ShipModelType.Bumblebee);
  expect(game.commander.ship.crew).toEqual([hand]);
});

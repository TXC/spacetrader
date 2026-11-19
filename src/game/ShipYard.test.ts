import { expect, test } from 'vitest';
import { dismissAll } from '../tests/support/encounters.ts';
import { newGame, press, topAlert } from '../tests/support/newGame.ts';
import { AccessoryType } from './Accessory.ts';
import { CrewMember } from './CrewMember.ts';
import type { Game } from './Game.ts';
import { Ship, shipModelForType, ShipModelType } from './Ship.ts';
import { buyShip, priceForModel } from './ShipYard.ts';
import { TradeItemType } from './TradeItem.types.ts';

const { Flea, Gnat, Firefly, Mosquito, Beetle, Termite } = ShipModelType;
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
  const ship = Ship.create(Mosquito);
  [ShieldLightning, GadgetFuelCompactor, WeaponMorgansLaser].forEach(type =>
    ship.addAccessoryOfType(type)
  );
  game.commander.ship = ship;
  game.commander.credits = 200_000;
  return game;
}

// The original asks about each rare item in turn and charges a fixed sum for each
// (BuyShipEvent.c:217-371).
test('rare equipment that fits the new ship is moved if the player asks for it', () => {
  const game = collector();
  const price = priceForModel(game, shipModelForType(Beetle));

  buyShip(game, shipModelForType(Beetle));
  expect(dismissAll()).toEqual([
    "If you trade your ship in for a Beetle, you won't be able to transfer your Morgan's Laser because the new ship has insufficient Weapon slots!",
  ]);
  expect(topAlert().title).toBe(
    "I see you have a lightning shield. I'll transfer it to your new ship for 30000 credits."
  );
  press('Do it!');
  expect(topAlert().title).toBe(
    "I see you have a fuel compactor. I'll transfer it to your new ship for 20000 credits."
  );
  press('No thanks');
  expect(topAlert().title).toBe(
    `Are you sure you want to trade your Mosquito for a Beetle for a credit of $${-price}, and transfer your unique equipment to the new ship?`
  );
  press('Yes');

  const { ship } = game.commander;
  expect(ship.hasShieldOfType(ShieldLightning)).toBe(true);
  expect(ship.hasGadgetOfType(GadgetFuelCompactor)).toBe(false);
  expect(ship.hasWeaponOfType(WeaponMorgansLaser)).toBe(false);
  expect(game.commander.credits).toBe(200_000 - price - 30_000);
});

test('rare equipment that has no slot on the new ship is lost, and costs nothing', () => {
  const game = collector();
  const price = priceForModel(game, shipModelForType(Flea));

  buyShip(game, shipModelForType(Flea));
  expect(dismissAll()).toEqual(
    [
      ['Lightning Shield', 'Shield'],
      ['Fuel Compactor', 'Gadget'],
      ["Morgan's Laser", 'Weapon'],
    ].map(
      ([item, kind]) =>
        `If you trade your ship in for a Flea, you won't be able to transfer your ${item} because the new ship has insufficient ${kind} slots!`
    )
  );
  expect(topAlert().title).toBe(
    `Are you sure you want to trade your Mosquito for a Flea for a credit of $${-price}?`
  );
  press('Yes');

  expect(game.commander.credits).toBe(200_000 - price);
});

test('with too little cash for all rare equipment, only what can be paid for is offered', () => {
  const game = collector();
  const price = priceForModel(game, shipModelForType(Termite));
  game.commander.credits = price + 25_000;
  const cannotAfford = (item: string) =>
    `Unfortunately, if you make this trade, you won't be able to afford to transfer your ${item} to the new ship!`;

  buyShip(game, shipModelForType(Termite));
  expect(dismissAll()).toEqual([
    "You won't have enough money to buy this ship and pay the cost to transfer all of your unique equipment. You should choose carefully which items you wish to transfer!",
    cannotAfford('Lightning Shield'),
  ]);
  press('Do it!'); // the fuel compactor, for 20000
  expect(dismissAll()).toEqual([cannotAfford("Morgan's Laser")]);
  press('Yes');

  expect(game.commander.ship.hasGadgetOfType(GadgetFuelCompactor)).toBe(true);
  expect(game.commander.ship.hasShieldOfType(ShieldLightning)).toBe(false);
  expect(game.commander.credits).toBe(5_000);
});

test('a ship without quarters for the crew is not sold', () => {
  const game = newGame();
  game.commander.ship = Ship.create(Beetle);
  game.commander.ship.addCrewMember(CrewMember.create('Hired Hand', 4, 4, 4, 4));

  buyShip(game, shipModelForType(Gnat));

  expect(topAlert().title).toMatch(/^The new ship you picked doesn't have enough quarters/);
  expect(game.commander.ship.type).toBe(Beetle);
});

test('the crew moves to the new ship', () => {
  const game = newGame();
  game.commander.ship = Ship.create(Beetle);
  const hand = CrewMember.create('Hired Hand', 4, 4, 4, 4);
  game.commander.ship.addCrewMember(hand);

  buyShip(game, shipModelForType(ShipModelType.Bumblebee));
  press('Yes');

  expect(game.commander.ship.type).toBe(ShipModelType.Bumblebee);
  expect(game.commander.ship.crew).toEqual([hand]);
});

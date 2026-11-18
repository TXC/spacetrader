import { AccessoryType, gadgetForType, shieldForType, weaponForType } from '../Accessory.ts';
import { MAX_SKILL_LEVEL, PoliceRecordScore } from '../Commander.ts';
import { CrewMember } from '../CrewMember.ts';
import { Ship, shipModelForType, ShipModelType, SHIP_MODEL_COUNT } from '../Ship.ts';
import type { ShipModel } from '../Ship.ts';
import { Difficulty, WildQuestStatus } from '../SolarSystem.types.ts';
import { TradeItemType, TRADE_ITEM_COUNT } from '../TradeItem.types.ts';
import { ensureInteger, ensureType } from '../ensure.ts';
import type { Game } from '../Game.ts';
import { runtime } from '../runtime.ts';
import { Opponent, OpponentType } from './Opponent.ts';

// Builds the opponent met on a trip: its ship, what the ship carries, and its crew.
export function buildOpponent(type: OpponentType, game: Game): Opponent {
  ensureInteger(type);
  ensureType(game, 'object');

  let opponent: Opponent;
  const difficulty = game.commander.difficulty;
  ensureInteger(difficulty);

  if (type === OpponentType.FamousCaptain) {
    opponent = famousCaptain(type);
  } else if (type === OpponentType.Dragonfly) {
    opponent = dragonfly(difficulty);
  } else if (type === OpponentType.Scarab) {
    opponent = scarab(difficulty);
  } else if (type === OpponentType.Monster) {
    opponent = monster(game, difficulty);
  } else if (type === OpponentType.Bottle) {
    opponent = bottle();
  } else {
    opponent = ordinaryOpponent(type, game);
  }

  return opponent;
}

function famousCaptain(type: OpponentType): Opponent {
  const ship = Ship.bestShip();
  return Opponent.captain(
    type,
    MAX_SKILL_LEVEL,
    MAX_SKILL_LEVEL,
    MAX_SKILL_LEVEL,
    MAX_SKILL_LEVEL,
    ship
  );
}

function dragonfly(difficulty: number): Opponent {
  const ship = Ship.create(ShipModelType.Dragonfly);
  ship.addShieldOfType(AccessoryType.ShieldLightning);
  ship.addShieldOfType(AccessoryType.ShieldLightning);
  ship.addShieldOfType(AccessoryType.ShieldLightning);
  ship.addGadgetOfType(AccessoryType.GadgetAutoRepairSystem);
  ship.addGadgetOfType(AccessoryType.GadgetTargetingSystem);
  ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
  ship.addWeaponOfType(AccessoryType.WeaponPulseLaser);
  return Opponent.captain(
    OpponentType.Dragonfly,
    6 + difficulty,
    4 + difficulty,
    6 + difficulty,
    1,
    ship
  );
}

function scarab(difficulty: number): Opponent {
  const ship = Ship.create(ShipModelType.Scarab);
  ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
  ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
  return Opponent.captain(
    OpponentType.Scarab,
    6 + difficulty,
    5 + difficulty,
    6 + difficulty,
    1,
    ship
  );
}

function monster(game: Game, difficulty: number): Opponent {
  const ship = Ship.create(ShipModelType.SpaceMonster);
  const currentHull = ship.hull;
  ship.damageHullByAmount(currentHull - game.monsterHull);
  ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
  ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
  ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
  return Opponent.captain(
    OpponentType.Monster,
    1 + difficulty,
    8 + difficulty,
    8 + difficulty,
    1,
    ship
  );
}

function bottle(): Opponent {
  const ship = Ship.create(ShipModelType.Bottle);
  return Opponent.captain(OpponentType.Bottle, 0, 0, 0, 0, ship);
}

// A trader, a pirate, the police or a Mantis: a ship picked by chance, fitted out by chance.
function ordinaryOpponent(type: OpponentType, game: Game): Opponent {
  let allNarcotics = false;
  if (type === OpponentType.MarieCeleste) {
    type = OpponentType.Trader;
    allNarcotics = true;
  }

  const chosenShipType = chooseShipType(type, game);

  ensureInteger(chosenShipType);
  ensureInteger(game.difficulty);

  const ship = Ship.create(chosenShipType);
  const model = shipModelForType(chosenShipType);

  const tries = equipmentTries(type, game);

  addGadgets(ship, model, game, tries);

  addCargo(ship, type, game, allNarcotics);

  addWeapons(ship, model, game, tries);

  addShields(ship, model, game, tries);

  weakenHull(ship, type);

  addMercenaries(ship, model, game);

  return opponentWithSkills(type, game, ship);
}

function chooseShipType(type: number, game: Game): ShipModelType {
  let tries = 1; // We'll roll a die `tries` times and pick the best roll
  let chosenShipType: number = SHIP_MODEL_COUNT;

  // Police are more likely to be stronger against worse police records
  if (type === OpponentType.Police) {
    if (
      game.commander.policeRecordScore < PoliceRecordScore.Villain &&
      game.wildStatus !== WildQuestStatus.OnBoard
    ) {
      tries = 3;
    } else if (
      game.commander.policeRecordScore < PoliceRecordScore.Psycho ||
      game.wildStatus === WildQuestStatus.OnBoard
    ) {
      tries = 5;
    }
    tries = Math.max(1, tries + game.difficulty - Difficulty.Normal);
  } else if (type === OpponentType.Pirate) {
    // Pirates can smell the money on you!
    tries = 1 + Math.floor(game.commander.netWorth() / 100000);
    tries = Math.max(1, tries + game.difficulty - Difficulty.Normal);
  } else if (type === OpponentType.Mantis) {
    tries = 1 + game.difficulty;
    chosenShipType = ShipModelType.Mantis;
  }

  ensureInteger(tries);
  ensureInteger(chosenShipType);

  if (chosenShipType >= SHIP_MODEL_COUNT) {
    chosenShipType = randomShipType(type, game, tries);
  }

  // The Mantis, or a model drawn above; never the count.
  return chosenShipType as ShipModelType;
}

function randomShipType(type: number, game: Game, tries: number): ShipModelType {
  let chosenShipType: ShipModelType;

  const { possibleShipTypes, totalShipOccurrence } = shipsFor(type, game);

  let shipChoice = 0;
  for (let i = 0; i < tries; ++i) {
    shipChoice = Math.max(shipChoice, runtime.gameRand.randomIntBelow(totalShipOccurrence));
  }

  let frequencySum = 0;
  chosenShipType = possibleShipTypes[0];
  for (const shipType of possibleShipTypes) {
    const model = shipModelForType(shipType);
    frequencySum += model.frequency;
    if (frequencySum >= shipChoice) {
      chosenShipType = shipType;
      break;
    }
  }

  return chosenShipType;
}

// The ships this kind of opponent flies in the commander's system, and how common they
// are together.
function shipsFor(type: number, game: Game) {
  const handicap = Math.max(game.difficulty - Difficulty.Normal, 0);
  let totalShipOccurrence = 0;
  const possibleShipTypes: ShipModelType[] = [
    type === OpponentType.Trader ? ShipModelType.Flea : ShipModelType.Gnat,
  ];

  for (let i = 0; i <= ShipModelType.Best; ++i) {
    const model = shipModelForType(i);
    if (
      type === OpponentType.Police &&
      (model.police < 0 ||
        game.commander.currentSystem.politics.occurrencePolice + handicap < model.police)
    ) {
      continue;
    } else if (
      type === OpponentType.Pirate &&
      (model.pirates < 0 ||
        game.commander.currentSystem.politics.occurrencePirates + handicap < model.pirates)
    ) {
      continue;
    } else if (
      type === OpponentType.Trader &&
      (model.traders < 0 ||
        game.commander.currentSystem.politics.occurrenceTraders + handicap < model.traders)
    ) {
      continue;
    }
    totalShipOccurrence += model.frequency;
    addToOrderedSet(possibleShipTypes, i as ShipModelType);
  }

  return { possibleShipTypes, totalShipOccurrence };
}

// How many times the dice are rolled for each piece of equipment; the best roll counts.
function equipmentTries(type: number, game: Game): number {
  let tries: number;

  if (type === OpponentType.Mantis) {
    tries = 1 + game.difficulty;
  } else {
    tries = Math.max(
      1,
      Math.floor(game.commander.netWorth() / 150000) + game.difficulty - Difficulty.Normal
    );
  }

  ensureInteger(tries);

  return tries;
}

function addGadgets(ship: Ship, model: ShipModel, game: Game, tries: number): void {
  const gadgetSlots = gadgetCount(model, game, tries);

  for (let i = 0; i < gadgetSlots; ++i) {
    let gadgetRoll = 0;
    for (let j = 0; j < tries; ++j) {
      gadgetRoll = Math.max(gadgetRoll, runtime.gameRand.randomIntBelow(100));
    }
    let gadgetFreqSum = 0;
    let addedGadget = false;
    for (
      let gadgetType = AccessoryType.GadgetFirst;
      gadgetType <= AccessoryType.GadgetLastBuyable;
      ++gadgetType
    ) {
      const gadget = gadgetForType(gadgetType)!;
      gadgetFreqSum += gadget.occurrence;
      ensureInteger(gadgetFreqSum);
      if (gadgetFreqSum >= gadgetRoll) {
        if (!ship.hasGadgetOfType(gadgetType)) {
          ship.addGadgetOfType(gadgetType);
          addedGadget = true;
          break;
        }
      }
    }
    if (!addedGadget) {
      ship.addGadgetOfType(AccessoryType.GadgetFiveExtraCargoBays);
    }
  }
}

function gadgetCount(model: ShipModel, game: Game, tries: number): number {
  let gadgetSlots = 0;
  if (model.gadgetSlots > 0) {
    if (game.difficulty <= Difficulty.Hard) {
      gadgetSlots = runtime.gameRand.randomIntBelow(model.gadgetSlots + 1);
      if (gadgetSlots < model.gadgetSlots) {
        if (tries > 4) {
          gadgetSlots++;
        } else if (tries > 2) {
          gadgetSlots += runtime.gameRand.randomIntBelow(2);
        }
      }
    } else {
      gadgetSlots = model.gadgetSlots;
    }
  }

  ensureInteger(gadgetSlots);

  return gadgetSlots;
}

function addCargo(ship: Ship, type: number, game: Game, allNarcotics: boolean): void {
  const totalCargoBays = ship.totalCargoBays();
  ensureInteger(totalCargoBays);

  if (allNarcotics) {
    ship.boughtQuantity(Math.min(totalCargoBays, 5), TradeItemType.Narcotics, 0);
  } else if (type !== OpponentType.Police && totalCargoBays > 5) {
    const amountCargo = cargoAmount(type, game, totalCargoBays);

    let cargoToDistribute = amountCargo;
    ensureInteger(cargoToDistribute);

    while (cargoToDistribute > 0) {
      const itemType = runtime.gameRand.randomIntBelow(TRADE_ITEM_COUNT);
      let amount = 1 + runtime.gameRand.randomIntBelow(1 + TRADE_ITEM_COUNT - itemType); // Give fewer of the better items
      amount = Math.min(cargoToDistribute, amount);

      ship.boughtQuantity(amount, itemType, 0);
      cargoToDistribute -= amount;
    }
  }
}

function cargoAmount(type: number, game: Game, totalCargoBays: number): number {
  let amountCargo = totalCargoBays;

  if (game.difficulty >= Difficulty.Normal) {
    amountCargo = Math.min(15, 3 + runtime.gameRand.randomIntBelow(totalCargoBays - 5));
  }

  if (type === OpponentType.Pirate) {
    if (game.difficulty < Difficulty.Normal) {
      amountCargo = Math.floor((amountCargo * 4) / 5);
    } else {
      amountCargo = Math.floor(amountCargo / game.difficulty);
    }
  }

  amountCargo = Math.max(1, amountCargo);

  return amountCargo;
}

function addWeapons(ship: Ship, model: ShipModel, game: Game, tries: number): void {
  const weaponSlots = weaponCount(model, game, tries);

  for (let i = 0; i < weaponSlots; ++i) {
    const weaponRoll = bestRoll(tries, 100);
    ensureInteger(weaponRoll);

    let weaponFreqSum = 0;
    for (
      let weaponType = AccessoryType.WeaponFirst;
      weaponType <= AccessoryType.WeaponLastBuyable;
      ++weaponType
    ) {
      const weapon = weaponForType(weaponType)!;
      weaponFreqSum += weapon.occurrence;
      ensureInteger(weaponFreqSum);
      if (weaponFreqSum >= weaponRoll) {
        ship.addWeaponOfType(weaponType);
        break;
      }
    }
  }
}

function weaponCount(model: ShipModel, game: Game, tries: number): number {
  let weaponSlots = model.weaponSlots;
  if (model.weaponSlots > 1 && game.difficulty <= Difficulty.Hard) {
    weaponSlots = 1 + runtime.gameRand.randomIntBelow(model.weaponSlots);
    if (weaponSlots < model.weaponSlots) {
      if (tries > 4 && game.difficulty >= Difficulty.Hard) {
        weaponSlots++;
      } else if (tries > 3 || game.difficulty >= Difficulty.Hard) {
        weaponSlots += runtime.gameRand.randomIntBelow(2);
      }
    }
  }

  ensureInteger(weaponSlots);

  return weaponSlots;
}

function addShields(ship: Ship, model: ShipModel, game: Game, tries: number): void {
  const shieldSlots = shieldCount(model, game, tries);

  let totalShieldPower = 0;
  for (let i = 0; i < shieldSlots; ++i) {
    const shieldRoll = bestRoll(tries, 100);
    ensureInteger(shieldRoll);

    let shieldFreqSum = 0;
    for (
      let shieldType = AccessoryType.ShieldFirst;
      shieldType <= AccessoryType.ShieldLastBuyable;
      ++shieldType
    ) {
      const shield = shieldForType(shieldType)!;
      shieldFreqSum += shield.occurrence;
      if (shieldFreqSum >= shieldRoll) {
        ship.addShieldOfType(shieldType);

        const shieldPower = bestRoll(5, shield.power);
        totalShieldPower += shieldPower + 1;
        break;
      }
    }
  }

  ensureInteger(totalShieldPower);

  const damage = ship.currentShieldPower - totalShieldPower;
  ship.damageShieldsByAmount(damage);
}

function shieldCount(model: ShipModel, game: Game, tries: number): number {
  let shieldSlots = model.shieldSlots;
  if (model.shieldSlots > 0 && game.difficulty <= Difficulty.Hard) {
    shieldSlots = runtime.gameRand.randomIntBelow(1 + model.shieldSlots);
    if (shieldSlots < model.shieldSlots) {
      if (tries > 3) {
        shieldSlots++;
      } else if (tries > 1) {
        shieldSlots += runtime.gameRand.randomIntBelow(2);
      }
    }
  }

  ensureInteger(shieldSlots);

  return shieldSlots;
}

function weakenHull(ship: Ship, type: number): void {
  // Shields means there's likely a stronger hull
  if (ship.currentShieldPower > 0 && runtime.gameRand.randomIntBelow(10) <= 7) {
    // Hull is already at full strength
  } else if (type !== OpponentType.Mantis) {
    const hullStrength = bestRoll(5, ship.hull);

    ship.damageHullByAmount(ship.hull - hullStrength);
  }
}

function addMercenaries(ship: Ship, model: ShipModel, game: Game): void {
  let numMercenaries = model.mercenaryQuarters();
  if (game.difficulty <= Difficulty.Hard) {
    numMercenaries = 1 + runtime.gameRand.randomIntBelow(model.mercenaryQuarters());

    if (game.difficulty >= Difficulty.Hard && numMercenaries < model.mercenaryQuarters()) {
      numMercenaries++;
    }
  }

  ensureInteger(numMercenaries);

  for (let i = 0; i < numMercenaries; ++i) {
    const mercenary = CrewMember.create(CrewMember.mercenaryNames()[i]);
    mercenary.randomizeAttributes();
    ship.addCrewMember(mercenary);
  }
}

// The captain's own skills are rolled last.
function opponentWithSkills(type: OpponentType, game: Game, ship: Ship): Opponent {
  const pilot = 1 + runtime.gameRand.randomIntBelow(MAX_SKILL_LEVEL);
  const fighter = 1 + runtime.gameRand.randomIntBelow(MAX_SKILL_LEVEL);
  const trader = 1 + runtime.gameRand.randomIntBelow(MAX_SKILL_LEVEL);
  let engineer = 1 + runtime.gameRand.randomIntBelow(MAX_SKILL_LEVEL);
  if (
    game.commander.currentSystem.name === 'Kravat' &&
    game.wildStatus === WildQuestStatus.OnBoard &&
    runtime.gameRand.randomIntBelow(10) < game.difficulty + 1
  ) {
    engineer = MAX_SKILL_LEVEL;
  }

  return Opponent.captain(type, engineer, pilot, fighter, trader, ship);
}

// Treat an array like an ordered set
export function addToOrderedSet<T>(arr: T[], item: T) {
  if (!arr.includes(item)) {
    arr.push(item);
  }
}

// The highest of `tries` random draws below `max`; 0 when there are no tries.
function bestRoll(tries: number, max: number) {
  let roll = 0;
  for (let i = 0; i < tries; ++i) {
    roll = Math.max(roll, runtime.gameRand.randomIntBelow(max));
  }
  return roll;
}

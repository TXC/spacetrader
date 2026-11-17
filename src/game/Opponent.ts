import { countOf } from './texts.ts';
import type { ValueOf } from './texts.ts';
import { AccessoryType, gadgetForType, shieldForType, weaponForType } from './Accessory.ts';
import { MAX_SKILL_LEVEL, PoliceRecordScore } from './Commander.ts';
import { CrewMember } from './CrewMember.ts';
import { Ship, shipModelForType, ShipModelType, SHIP_MODEL_COUNT } from './Ship.ts';
import { Difficulty, WildQuestStatus } from './SolarSystem.types.ts';
import { TradeItemType, TRADE_ITEM_COUNT } from './TradeItem.types.ts';
import { Utils } from './Utilities.ts';
import type { Game } from './Game.ts';
import { runtime } from './runtime.ts';

export const OpponentType = {
  Police: 0,
  Trader: 1,
  Pirate: 2,
  FamousCaptain: 3,
  Scarab: 4,
  Dragonfly: 5,
  Monster: 6,
  MarieCeleste: 7,
  Bottle: 8,
  Mantis: 9,
} as const;
export type OpponentType = ValueOf<typeof OpponentType>;
export const OPPONENT_TYPE_COUNT = countOf(OpponentType);

export class Opponent extends CrewMember {
  declare type: number;
  declare ship: Ship;

  constructor(
    type: number,
    engineer: number,
    pilot: number,
    fighter: number,
    trader: number,
    ship: Ship
  ) {
    super('opponent', engineer, pilot, fighter, trader);
    Utils.ensureInteger(type);
    this.type = type;
    Utils.ensureType(ship, 'object');
    this.ship = ship;
  }

  static generateOpponentWithType(type: number, game: Game) {
    Utils.ensureInteger(type);
    Utils.ensureType(game, 'object');

    let opponent: Opponent;
    const difficulty = game.commander.difficulty;
    Utils.ensureInteger(difficulty);

    if (type === OpponentType.FamousCaptain) {
      const ship = Ship.bestShipWithDifficulty(difficulty);
      opponent = new Opponent(
        type,
        MAX_SKILL_LEVEL,
        MAX_SKILL_LEVEL,
        MAX_SKILL_LEVEL,
        MAX_SKILL_LEVEL,
        ship
      );
    } else if (type === OpponentType.Dragonfly) {
      const ship = new Ship(ShipModelType.Dragonfly, difficulty);
      ship.addShieldOfType(AccessoryType.ShieldLightning);
      ship.addShieldOfType(AccessoryType.ShieldLightning);
      ship.addShieldOfType(AccessoryType.ShieldLightning);
      ship.addGadgetOfType(AccessoryType.GadgetAutoRepairSystem);
      ship.addGadgetOfType(AccessoryType.GadgetTargetingSystem);
      ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
      ship.addWeaponOfType(AccessoryType.WeaponPulseLaser);
      opponent = new Opponent(
        OpponentType.Dragonfly,
        6 + difficulty,
        4 + difficulty,
        6 + difficulty,
        1,
        ship
      );
    } else if (type === OpponentType.Scarab) {
      const ship = new Ship(ShipModelType.Scarab, difficulty);
      ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
      ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
      opponent = new Opponent(
        OpponentType.Scarab,
        6 + difficulty,
        5 + difficulty,
        6 + difficulty,
        1,
        ship
      );
    } else if (type === OpponentType.Monster) {
      const ship = new Ship(ShipModelType.SpaceMonster, difficulty);
      const currentHull = ship.hull;
      ship.damageHullByAmount(currentHull - game.monsterHull);
      ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
      ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
      ship.addWeaponOfType(AccessoryType.WeaponMilitaryLaser);
      opponent = new Opponent(
        OpponentType.Monster,
        1 + difficulty,
        8 + difficulty,
        8 + difficulty,
        1,
        ship
      );
    } else if (type === OpponentType.Bottle) {
      const ship = new Ship(ShipModelType.Bottle, game.difficulty);
      opponent = new Opponent(OpponentType.Bottle, 0, 0, 0, 0, ship);
    } else {
      let allNarcotics = false;
      if (type === OpponentType.MarieCeleste) {
        type = OpponentType.Trader;
        allNarcotics = true;
      }

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

      Utils.ensureInteger(tries);
      Utils.ensureInteger(chosenShipType);

      if (chosenShipType >= SHIP_MODEL_COUNT) {
        const handicap = Math.max(game.difficulty - Difficulty.Normal, 0);
        let totalShipOccurrence = 0;
        const possibleShipTypes = [
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
          Utils.addToOrderedSet(possibleShipTypes, i);
        }

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
      }

      Utils.ensureInteger(chosenShipType);
      Utils.ensureInteger(game.difficulty);

      const ship = new Ship(chosenShipType, game.difficulty);
      const model = shipModelForType(chosenShipType);

      if (type === OpponentType.Mantis) {
        tries = 1 + game.difficulty;
      } else {
        tries = Math.max(
          1,
          Math.floor(game.commander.netWorth() / 150000) + game.difficulty - Difficulty.Normal
        );
      }

      Utils.ensureInteger(tries);

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

      Utils.ensureInteger(gadgetSlots);

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
          Utils.ensureInteger(gadgetFreqSum);
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

      const totalCargoBays = ship.totalCargoBays();
      Utils.ensureInteger(totalCargoBays);

      if (allNarcotics) {
        ship.boughtQuantity(Math.min(totalCargoBays, 5), TradeItemType.Narcotics, 0);
      } else if (type !== OpponentType.Police && totalCargoBays > 5) {
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

        let cargoToDistribute = amountCargo;
        Utils.ensureInteger(cargoToDistribute);

        while (cargoToDistribute > 0) {
          const itemType = runtime.gameRand.randomIntBelow(TRADE_ITEM_COUNT);
          let amount = 1 + runtime.gameRand.randomIntBelow(1 + TRADE_ITEM_COUNT - itemType); // Give fewer of the better items
          amount = Math.min(cargoToDistribute, amount);

          ship.boughtQuantity(amount, itemType, 0);
          cargoToDistribute -= amount;
        }
      }

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

      Utils.ensureInteger(weaponSlots);

      for (let i = 0; i < weaponSlots; ++i) {
        let weaponRoll = 0;
        weaponRoll = BEST_ROLL(weaponRoll, tries, 100);
        Utils.ensureInteger(weaponRoll);

        let weaponFreqSum = 0;
        for (
          let weaponType = AccessoryType.WeaponFirst;
          weaponType <= AccessoryType.WeaponLastBuyable;
          ++weaponType
        ) {
          const weapon = weaponForType(weaponType)!;
          weaponFreqSum += weapon.occurrence;
          Utils.ensureInteger(weaponFreqSum);
          if (weaponFreqSum >= weaponRoll) {
            ship.addWeaponOfType(weaponType);
            break;
          }
        }
      }

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

      Utils.ensureInteger(shieldSlots);

      let totalShieldPower = 0;
      for (let i = 0; i < shieldSlots; ++i) {
        let shieldRoll = 0;
        shieldRoll = BEST_ROLL(shieldRoll, tries, 100);
        Utils.ensureInteger(shieldRoll);

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

            let shieldPower = 0;
            shieldPower = BEST_ROLL(shieldPower, 5, shield.power);
            totalShieldPower += shieldPower + 1;
            break;
          }
        }
      }

      Utils.ensureInteger(totalShieldPower);

      const damage = ship.currentShieldPower - totalShieldPower;
      ship.damageShieldsByAmount(damage);

      // Shields means there's likely a stronger hull
      if (ship.currentShieldPower > 0 && runtime.gameRand.randomIntBelow(10) <= 7) {
        // Hull is already at full strength
      } else if (type !== OpponentType.Mantis) {
        let hullStrength = 0;
        hullStrength = BEST_ROLL(hullStrength, 5, ship.hull);

        ship.damageHullByAmount(ship.hull - hullStrength);
      }

      let numMercenaries = model.mercenaryQuarters();
      if (game.difficulty <= Difficulty.Hard) {
        numMercenaries = 1 + runtime.gameRand.randomIntBelow(model.mercenaryQuarters());

        if (game.difficulty >= Difficulty.Hard && numMercenaries < model.mercenaryQuarters()) {
          numMercenaries++;
        }
      }

      Utils.ensureInteger(numMercenaries);

      for (let i = 0; i < numMercenaries; ++i) {
        const mercenary = new CrewMember(CrewMember.mercenaryNames()[i]);
        mercenary.randomizeAttributes();
        ship.addCrewMember(mercenary);
      }

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

      opponent = new Opponent(type, engineer, pilot, fighter, trader, ship);
    }

    return opponent;
  }
}

// Utility function to replicate BEST_ROLL macro
export function BEST_ROLL(roll: number, tries: number, max: number) {
  for (let i = 0; i < tries; ++i) {
    roll = Math.max(roll, runtime.gameRand.randomIntBelow(max));
  }
  return roll;
}

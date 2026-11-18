import { expect, test } from 'vitest';
import { encounterWith } from '../../../tests/support/encounters.ts';
import { newGame, press } from '../../../tests/support/newGame.ts';
import { AccessoryType } from '../../Accessory.ts';
import { Opponent, OpponentType } from '../../opponent/Opponent.ts';
import { Difficulty } from '../../SolarSystem.types.ts';
import { EncounterType } from '../types.ts';

const { FamousCaptainAhabEncounter, FamousCaptainConradEncounter } = EncounterType;
const { FamousCaptainHuieEncounter } = EncounterType;
const { ShieldReflective, WeaponMilitaryLaser } = AccessoryType;

const captains = [
  ['Ahab', 'reflective shield', 'pilot', FamousCaptainAhabEncounter, ShieldReflective],
  ['Conrad', 'military laser', 'engineer', FamousCaptainConradEncounter, WeaponMilitaryLaser],
  ['Huie', 'military laser', 'trader', FamousCaptainHuieEncounter, WeaponMilitaryLaser],
] as const;

test.each(
  captains.flatMap(([name, itemName, skill, type, item]) => [
    [name, itemName, skill, 'Normal', 2, type, item, Difficulty.Normal],
    [name, itemName, skill, 'Hard', 1, type, item, Difficulty.Hard],
  ])
)(
  'Captain %s takes the %s and trains %s, at %s by %i',
  (_, __, skill, ___, gain, type, item, difficulty) => {
    const game = newGame(difficulty);
    const { commander } = game;
    commander.ship.addAccessoryOfType(item);
    const captain = Opponent.generateOpponentWithType(OpponentType.FamousCaptain, game);
    const { encounter, listener } = encounterWith(game, type, captain);

    encounter.performAction('Meet');
    press('Yes, trade!');
    press('Dismiss');

    expect(commander[skill]).toBe(5 + gain);
    expect(commander.ship.weapons.length + commander.ship.shields.length).toBe(0);
    expect(listener.continues).toHaveBeenCalledWith(false);
  }
);

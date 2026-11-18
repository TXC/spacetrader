import { AccessoryType } from '../Accessory.ts';
import { MAX_SKILL_LEVEL, PoliceRecordScore } from '../Commander.ts';
import { EncounterType } from '../encounter/types.ts';
import { RareEvent } from '../Game.types.ts';
import { Opponent, OpponentType } from '../opponent/Opponent.ts';
import type { Game } from '../Game.ts';
import { pLog } from '../probes.ts';
import { runtime } from '../runtime.ts';
import type { Meeting } from './Travel.ts';

// No ordinary opponent is met; once in a long while something rare is.
export function rareEventMeeting(game: Game): Meeting {
  let encounterType: EncounterType = EncounterType.None;
  let opponent: Opponent | null = null;

  // Very Rare Random Events:
  // 1. Encounter the abandoned Marie Celeste, which you may loot.
  // 2. Captain Ahab will trade your Reflective Shield for skill points in Piloting.
  // 3. Captain Conrad will trade your Military Laser for skill points in Engineering.
  // 4. Captain Huie will trade your Military Laser for points in Trading.
  // 5. Encounter an expired bottle of Captain Marmoset's Skill Tonic. This will affect skills depending on game difficulty level.
  // 6. Encounter a good bottle of Captain Marmoset's Skill Tonic, which will improve a random skill one or two times, depending on difficulty.

  if (
    game.forceRareEvent || // testing hook
    (game.commander.days > 10 && runtime.gameRand.randomIntBelow(1000) < 5)
  ) {
    const rareEvents = game.remainingRareEvents;
    // With none left, nothing happens.
    if (rareEvents.length > 0) {
      const rareEvent = rareEvents[runtime.gameRand.randomIntBelow(rareEvents.length)];
      ({ encounterType, opponent } = meetingFor(rareEvent, game));
      if (encounterType !== EncounterType.None) {
        game.removeRemainingRareEvent(rareEvent);
      }
    }
  }

  return { encounterType, opponent };
}

// A captain is met only when the commander has what the captain wants and something left
// to learn; otherwise nothing happens and the event stays for another day.
function meetingFor(rareEvent: RareEvent, game: Game): Meeting {
  let encounterType: EncounterType = EncounterType.None;
  let opponent: Opponent | null = null;

  switch (rareEvent) {
    case RareEvent.CaptainAhab:
      if (
        game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective) &&
        game.commander.pilot < MAX_SKILL_LEVEL &&
        game.commander.policeRecordScore > PoliceRecordScore.Criminal
      ) {
        pLog.log(95);
        encounterType = EncounterType.FamousCaptainAhabEncounter;
        opponent = Opponent.generateOpponentWithType(OpponentType.FamousCaptain, game);
      }
      break;

    case RareEvent.CaptainConrad:
      if (
        game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser) &&
        game.commander.engineer < MAX_SKILL_LEVEL &&
        game.commander.policeRecordScore > PoliceRecordScore.Criminal
      ) {
        pLog.log(96);
        encounterType = EncounterType.FamousCaptainConradEncounter;
        opponent = Opponent.generateOpponentWithType(OpponentType.FamousCaptain, game);
      }
      break;

    case RareEvent.CaptainHuie:
      if (
        game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser) &&
        game.commander.trader < MAX_SKILL_LEVEL &&
        game.commander.policeRecordScore > PoliceRecordScore.Criminal
      ) {
        pLog.log(97);
        encounterType = EncounterType.FamousCaptainHuieEncounter;
        opponent = Opponent.generateOpponentWithType(OpponentType.FamousCaptain, game);
      }
      break;

    case RareEvent.MarieCeleste:
      pLog.log(98);
      encounterType = EncounterType.MarieCelesteEncounter;
      opponent = Opponent.generateOpponentWithType(OpponentType.MarieCeleste, game);
      break;

    case RareEvent.BottleOld:
      pLog.log(99);
      encounterType = EncounterType.BottleOld;
      opponent = Opponent.generateOpponentWithType(OpponentType.Bottle, game);
      break;

    case RareEvent.BottleGood:
      pLog.log(100);
      encounterType = EncounterType.BottleGood;
      opponent = Opponent.generateOpponentWithType(OpponentType.Bottle, game);
      break;
  }

  return { encounterType, opponent };
}

import { PoliceRecordScore } from '../Commander.ts';
import { ShipModelType } from '../Ship.ts';
import { captainFor } from './captains.ts';
import {
  EncounterType,
  isAttackEncounter,
  isEncounterWith,
  isFleeEncounter,
  isIgnoreEncounter,
} from './types.ts';
import type { EncounterController } from '../EncounterController.ts';

// The sentences describing the encounter: who is met, what they do, and what happened in
// the last round of a fight.
export function encounterText(encounter: EncounterController): string {
  let text = '';

  text += whoIsMet(encounter);

  text += '\n\n';

  text += whatItDoes(encounter);

  if (encounter._encounterActionUpdate) {
    if (!text.endsWith('\n')) {
      text += '\n';
    }
    text += encounter._encounterActionUpdate;
  }

  return text;
}

function whoIsMet(encounter: EncounterController): string {
  let text = '';

  const clicks = encounter._game.commander.travelClicksRemaining;
  text += `At ${clicks} click${clicks === 1 ? '' : 's'} from ${encounter._game.commander.currentSystem.name} you encounter`;

  if (isEncounterWith(encounter._type, 'Police')) {
    text += ' a police ';
  } else if (isEncounterWith(encounter._type, 'Pirate')) {
    if (encounter._opponent.ship.type === ShipModelType.Mantis) {
      text += ' an alien ';
    } else {
      text += ' a pirate ';
    }
  } else if (isEncounterWith(encounter._type, 'Trader')) {
    text += ' a trader ';
  } else if (
    isEncounterWith(encounter._type, 'Scarab') ||
    isEncounterWith(encounter._type, 'Dragonfly')
  ) {
    text += ' a stolen ';
  } else if (isEncounterWith(encounter._type, 'Monster')) {
    text += ' the terrifying ';
  }

  if (isEncounterWith(encounter._type, 'FamousCaptain')) {
    text += ` the famous Captain ${captainFor(encounter._type).name}.`;
  } else if (encounter._type === EncounterType.PostMarieCelestePoliceEncounter) {
    text += ' the Customs Police.';
  } else if (encounter._type === EncounterType.MarieCelesteEncounter) {
    text += ' a drifting ship.';
  } else if (
    encounter._type === EncounterType.BottleGood ||
    encounter._type === EncounterType.BottleOld
  ) {
    text += ' a floating bottle.';
  } else {
    text += `${encounter._opponent.ship.model.name}.`;
  }

  return text;
}

function whatItDoes(encounter: EncounterController): string {
  let text = '';

  if (encounter._type === EncounterType.PoliceInspection) {
    text += 'The police summon you to submit to an inspection.';
  } else if (
    !encounter._actionTaken &&
    encounter._type === EncounterType.PoliceAttack &&
    encounter._game.commander.policeRecordScore > PoliceRecordScore.Criminal
  ) {
    text += 'The police hail that they want you to surrender.';
  } else if (isFleeEncounter(encounter._type)) {
    text += 'Your opponent is fleeing.';
  } else if (isAttackEncounter(encounter._type)) {
    text += 'Your opponent attacks.';
  } else if (isIgnoreEncounter(encounter._type)) {
    if (
      encounter._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
        encounter._game.commander,
        encounter._opponent
      )
    ) {
      text += "It doesn't notice you.";
    } else {
      text += 'It ignores you.';
    }
  } else if (
    encounter._type === EncounterType.TraderSell ||
    encounter._type === EncounterType.TraderBuy
  ) {
    text += 'You are hailed with an offer to trade goods.';
  } else if (
    encounter._type === EncounterType.TraderSurrender ||
    encounter._type === EncounterType.PirateSurrender
  ) {
    text += 'Your opponent hails to surrender to you.';
  } else if (
    isEncounterWith(encounter._type, 'FamousCaptain') &&
    !isAttackEncounter(encounter._type)
  ) {
    text += 'The captain requests a brief meeting with you.';
  } else if (encounter._type === EncounterType.MarieCelesteEncounter) {
    text += 'The Marie Celeste appears to be completely abandoned.';
  } else if (encounter._type === EncounterType.PostMarieCelestePoliceEncounter) {
    text +=
      'The police hail with a warning, "We know you removed illegal goods from the Marie Celeste. You must give them up at once!"';
  } else if (
    encounter._type === EncounterType.BottleGood ||
    encounter._type === EncounterType.BottleOld
  ) {
    text += "It appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!";
  }

  return text;
}

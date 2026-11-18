import {
  EncounterMode,
  EncounterType,
  isAttackEncounter,
  isAutoMode,
  isEncounterWith,
  isOneOf,
} from './types.ts';
import type { ActionName } from './types.ts';
import type { Encounter } from './Encounter.ts';

// The buttons an encounter offers, in the order they are shown.
export function encounterButtons(encounter: Encounter): ActionName[] {
  const buttons: ActionName[] = [];

  if (isAutoMode(encounter._encounterMode)) {
    buttons.push('Interrupt');
  }

  buttons.push(...buttonsForKind(encounter._type));

  addAutoFor('Attack', buttons);
  addAutoFor('Flee', buttons);

  pruneActionsFor(
    encounter._encounterMode === EncounterMode.AutoFlee
      ? 'Flee'
      : encounter._encounterMode === EncounterMode.AutoAttack
        ? 'Attack'
        : null,
    buttons
  );

  return buttons;
}

function buttonsForKind(type: EncounterType): ActionName[] {
  const buttons: ActionName[] = [];

  if (type === EncounterType.PoliceInspection) {
    buttons.push('Attack', 'Flee', 'Submit', 'Bribe');
  } else if (
    isOneOf(type, EncounterType.PoliceFlee, EncounterType.TraderFlee, EncounterType.PirateFlee)
  ) {
    buttons.push('Attack', 'Ignore');
  } else if (
    isOneOf(
      type,
      EncounterType.PirateAttack,
      EncounterType.PoliceAttack,
      EncounterType.ScarabAttack
    )
  ) {
    buttons.push('Attack', 'Flee', 'Surrender');
  } else if (
    isOneOf(
      type,
      EncounterType.TraderAttack,
      EncounterType.MonsterAttack,
      EncounterType.DragonflyAttack
    ) ||
    (isEncounterWith(type, 'FamousCaptain') && isAttackEncounter(type))
  ) {
    buttons.push('Attack', 'Flee');
  } else if (
    isOneOf(
      type,
      EncounterType.TraderIgnore,
      EncounterType.PoliceIgnore,
      EncounterType.PirateIgnore,
      EncounterType.ScarabIgnore,
      EncounterType.MonsterIgnore,
      EncounterType.DragonflyIgnore
    )
  ) {
    buttons.push('Attack', 'Ignore');
  } else if (isOneOf(type, EncounterType.TraderSurrender, EncounterType.PirateSurrender)) {
    buttons.push('Attack', 'Plunder');
  } else if (isOneOf(type, EncounterType.TraderSell, EncounterType.TraderBuy)) {
    buttons.push('Attack', 'Ignore', 'Trade');
  } else if (isEncounterWith(type, 'FamousCaptain') && !isAttackEncounter(type)) {
    buttons.push('Attack', 'Ignore', 'Meet');
  } else if (type === EncounterType.PostMarieCelestePoliceEncounter) {
    buttons.push('Attack', 'Flee', 'Yield', 'Bribe');
  } else if (type === EncounterType.MarieCelesteEncounter) {
    buttons.push('Board', 'Ignore');
  } else if (isOneOf(type, EncounterType.BottleGood, EncounterType.BottleOld)) {
    buttons.push('Drink', 'Ignore');
  }

  return buttons;
}

function pruneActionsFor(toPrune: string | null, buttons: ActionName[]): void {
  if (!toPrune) {
    return;
  }

  const toRemoveIndexes: number[] = [];
  buttons.forEach((label, idx) => {
    if (label.endsWith(toPrune)) {
      toRemoveIndexes.push(idx);
    }
  });

  for (let i = toRemoveIndexes.length - 1; i >= 0; i--) {
    buttons.splice(toRemoveIndexes[i], 1);
  }
}

function addAutoFor(label: 'Attack' | 'Flee', buttons: ActionName[]): void {
  let addIndex = -1;
  buttons.forEach((buttonLabel, idx) => {
    if (buttonLabel === label) {
      addIndex = idx;
    }
  });

  if (addIndex !== -1) {
    buttons.splice(addIndex + 1, 0, `Auto-${label}`);
  }
}

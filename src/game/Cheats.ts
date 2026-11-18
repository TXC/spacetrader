// The cheats shown in debug mode. The recorded tests use them to set up situations.
import { ReputationScore } from './Commander.ts';
import { sanitizedElementID } from './elementId.ts';
import type { Game } from './Game.ts';
import { RareEvent } from './Game.types.ts';

export type Cheat = { id: string; label: string; apply: (game: Game) => void };

const RARE_EVENT_NAMES = [
  'Marie Celeste',
  'Captain Ahab',
  'Captain Conrad',
  'Captain Huie',
  'Old Bottle',
  'Good Bottle',
];

function rareEventCheats(): Cheat[] {
  return Object.values(RareEvent).map(rareEvent => {
    const label = 'Encounter ' + RARE_EVENT_NAMES[rareEvent];
    return {
      id: 'cheat_' + sanitizedElementID(label),
      label,
      apply: game => {
        game.forceRareEvent = true;
        // This replaces any rare events still waiting to happen.
        game.remainingRareEvents = [rareEvent];
      },
    };
  });
}

export const CHEATS: Cheat[] = [
  {
    id: 'cheat_freeMoney',
    label: 'Free Money',
    apply: game => {
      game.commander.credits = 1000000;
    },
  },
  {
    id: 'cheat_freeSingularity',
    label: 'Free Singularity',
    apply: game => {
      game.canSuperWarp = true;
    },
  },
  {
    id: 'cheat_showSpecial',
    label: 'Show Special',
    apply: game => {
      game.showSpecialSystems = true;
    },
  },
  {
    id: 'cheat_averageReputation',
    label: 'Average reputationScore',
    apply: game => {
      game.commander.reputationScore = ReputationScore.Average;
    },
  },
  {
    id: 'cheat_fighter15',
    label: 'Fighter 15',
    apply: game => {
      game.commander.fighter = 15;
    },
  },
  ...rareEventCheats(),
];

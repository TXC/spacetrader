// The end-of-game message and the hall of fame.
import { AlertActionType, AlertViewController } from './alerts.ts';
import { Game, GameEndStatus } from './Game.ts';
import type { GameState } from './Game.ts';
import { MAX_HIGH_SCORES, session } from './session.ts';
import { difficultyName } from './SolarSystem.types.ts';
import { named } from './texts.ts';
import { pLog } from './probes.ts';

// Where the high scores are kept: the session.
export type Scores = {
  highScores(count: number): GameState[];
  clearHighScores(): void;
};

// How a game ended, to finish "<name> ... after 12 days".
export const endStatusText = named<GameEndStatus>(
  {
    [GameEndStatus.None]: 'is still playing',
    [GameEndStatus.Retired]: 'retired',
    [GameEndStatus.Killed]: 'was killed',
    [GameEndStatus.Moon]: 'claimed a moon',
  },
  'retired'
);

function madeTheList(game: Game, scores: Scores): boolean {
  return scores.highScores(MAX_HIGH_SCORES).some(saved => saved.uniqueID === game.uniqueID);
}

// "You achieved a score of ..." and, when the game is over, whether it made the list.
export function scoreMessage(game: Game, inProgress: boolean, scores: Scores): string {
  const score = game.scorePercentageString();
  if (inProgress) return `You currently have a score of ${score}.\n`;
  pLog.log(62);
  const verdict = madeTheList(game, scores)
    ? 'Congratulations! You have made the high score list!'
    : 'Alas! This is not enough to enter the high score list.';
  return `You achieved a score of ${score}.\n\n${verdict}\n\n`;
}

// The line for one record. The net worth and the score need the rules, so the game is
// rebuilt; a record that cannot be rebuilt has no line.
function entry(saved: GameState): string | null {
  try {
    return entryFor(Game.fromSerializedState(saved));
  } catch {
    return null;
  }
}

function entryFor(game: Game): string {
  const { commander } = game;
  const days = `${commander.days} day${commander.days === 1 ? '' : 's'}`;
  return `${commander.name} ${endStatusText(game.endStatus)} after ${days}, worth $${commander.netWorth()} on ${difficultyName(game.difficulty)} level. Score: ${game.scorePercentageString()}.`;
}

export function hallOfFame(scores: Scores): { text: string; any: boolean } {
  const lines = scores.highScores(MAX_HIGH_SCORES).map(entry);
  const shown = lines.filter(line => line !== null);
  if (shown.length === 0) return { text: 'None on record', any: false };
  return { text: shown.join('\n\n'), any: true };
}

export function askToClear(scores: Scores): void {
  const alert = new AlertViewController("Clear all high scores? This can't be undone.");
  alert.addAction('Clear all', AlertActionType.Destructive, () => {
    pLog.log(93);
    scores.clearHighScores();
    session.changed();
  });
  alert.addAction('Cancel', AlertActionType.Cancel, null);
  alert.presentView();
}

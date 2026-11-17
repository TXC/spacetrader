// The end-of-game message and the hall of fame.
import { AlertActionType, AlertViewController } from './alerts.ts';
import { Game, GameEndStatus } from './Game.ts';
import type { GameState } from './Game.ts';
import { session } from './session.ts';
import { difficultyName } from './SolarSystem.types.ts';
import { named } from './texts.ts';
import { pLog } from './Utilities.ts';

export const MAX_HIGH_SCORES = 6;

// Where the high scores are kept. The old root screen provides this for now.
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

function entry(saved: GameState): string {
  const game = Game.fromSerializedState(saved);
  const { commander } = game;
  const days = `${commander.days} day${commander.days === 1 ? '' : 's'}`;
  return `${commander.name} ${endStatusText(game.endStatus)} after ${days}, worth $${commander.netWorth()} on ${difficultyName(game.difficulty)} level. Score: ${game.scorePercentageString()}.`;
}

export function hallOfFame(scores: Scores): { text: string; any: boolean } {
  const saved = scores.highScores(MAX_HIGH_SCORES);
  if (saved.length === 0) return { text: 'None on record', any: false };
  return { text: saved.map(entry).join('\n\n'), any: true };
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

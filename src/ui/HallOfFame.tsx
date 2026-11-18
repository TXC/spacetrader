import type { Game } from '../game/Game.ts';
import { askToClear, hallOfFame, scoreMessage } from '../game/HallOfFame.ts';
import type { Scores } from '../game/HallOfFame.ts';
import { Lines } from './Lines.tsx';
import { LoggedButton } from './Logged.tsx';
import { useSession } from './useStore.ts';
import styles from './HallOfFame.module.css';
import shared from './shared.module.css';

// `inProgress` is the look from the commander screen; otherwise this is the end of the game.
type Props = { game: Game; inProgress: boolean; scores: Scores; onContinue?: () => void };

export function HallOfFame({ game, inProgress, scores, onContinue }: Props) {
  useSession();
  const fame = hallOfFame(scores);
  return (
    <>
      {!inProgress && <h1 className={shared.centredText}>Game Over</h1>}
      <div id="end-message" className={styles.message}>
        <Lines text={scoreMessage(game, inProgress, scores)} />
      </div>
      {!inProgress && (
        <div className={styles.restart}>
          <LoggedButton
            id="endgame"
            kind="main"
            label="End Game and Start Over"
            onPress={() => onContinue?.()}
          />
        </div>
      )}
      <h3 className={shared.centredText}>Hall of Fame</h3>
      <div id="highscores" className={`${shared.centredBlock} ${shared.centredText}`}>
        <Lines text={fame.text} />
      </div>
      {fame.any && (
        <div className={styles.clear}>
          <LoggedButton id="clearall" label="Clear All" onPress={() => askToClear(scores)} />
        </div>
      )}
    </>
  );
}

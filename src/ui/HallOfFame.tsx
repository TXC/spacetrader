import type { Game } from '../game/Game.ts';
import { askToClear, hallOfFame, scoreMessage } from '../game/HallOfFame.ts';
import type { Scores } from '../game/HallOfFame.ts';
import { Lines } from './Lines.tsx';
import { LoggedButton } from './Logged.tsx';
import { useSession } from './useStore.ts';

// `inProgress` is the look from the commander screen; otherwise this is the end of the game.
type Props = { game: Game; inProgress: boolean; scores: Scores; onContinue?: () => void };

export function HallOfFame({ game, inProgress, scores, onContinue }: Props) {
  useSession();
  const fame = hallOfFame(scores);
  return (
    <>
      {!inProgress && <h1 className="centered">Game Over</h1>}
      <br />
      <div id="end-message" className="centered-div centered">
        <Lines text={scoreMessage(game, inProgress, scores)} />
      </div>
      {!inProgress && (
        <>
          <div className="centered-div">
            <LoggedButton
              id="endgame"
              kind="main"
              label="End Game and Start Over"
              onPress={() => onContinue?.()}
            />
          </div>
          <br />
        </>
      )}
      <h3 className="centered">Hall of Fame</h3>
      <div id="highscores" className="centered-div centered">
        <Lines text={fame.text} />
      </div>
      {fame.any && (
        <>
          <br />
          <div className="centered-div">
            <LoggedButton id="clearall" label="Clear All" onPress={() => askToClear(scores)} />
          </div>
        </>
      )}
    </>
  );
}

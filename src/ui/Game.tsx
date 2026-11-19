import { HallOfFame } from './HallOfFame.tsx';
import { Landing } from './Landing.tsx';
import { NewCommander } from './NewCommander.tsx';
import { useSession } from './useStore.ts';
import './styles/tokens.css';
import './styles/base.css';

// The whole game: a new commander, the planet hub, or the game-over screen.
export function Game() {
  const session = useSession();
  if (session.screen === 'endGame') {
    return (
      <HallOfFame
        game={session.endedGame!}
        inProgress={false}
        scores={session}
        onContinue={session.continueAfterEnd}
      />
    );
  }
  if (session.screen === 'landing') {
    return <Landing game={session.game!} />;
  }
  return <NewCommander />;
}

import type { Session } from '../game/session.ts';
import { HallOfFame } from './HallOfFame.tsx';
import { Landing } from './Landing.tsx';
import { NewCommander } from './NewCommander.tsx';
import { useStore } from './useStore.ts';
import './style.css';

// The whole game: a new commander, the planet hub, or the game-over screen.
export function Game({ session }: { session: Session }) {
  useStore(session);
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
  if (session.screen === 'landing') return <Landing session={session} game={session.game!} />;
  return <NewCommander session={session} />;
}

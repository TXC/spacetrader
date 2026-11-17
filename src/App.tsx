import { runtime } from './game/runtime.ts';
import type { Session } from './game/session.ts';
import { DebugMode } from './game/Utilities.ts';
import { AlertHost } from './ui/AlertHost.tsx';
import { DebugPanel } from './ui/DebugPanel.tsx';
import { Game } from './ui/Game.tsx';

function App({ session }: { session: Session }) {
  return (
    <>
      <div id="game">
        <Game session={session} />
      </div>
      {runtime.debugMode !== DebugMode.Disabled && <DebugPanel session={session} />}
      <AlertHost />
    </>
  );
}

export default App;

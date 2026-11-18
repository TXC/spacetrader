import { runtime } from './game/runtime.ts';
import type { Session } from './game/session.ts';
import { DebugMode } from './game/ensure.ts';
import styles from './App.module.css';
import { AlertHost } from './ui/AlertHost.tsx';
import { DebugPanel } from './ui/DebugPanel.tsx';
import { ErrorBoundary } from './ui/ErrorBoundary.tsx';
import { Game } from './ui/Game.tsx';

function App({ session }: { session: Session }) {
  return (
    <>
      <div id="game" className={styles.game}>
        <ErrorBoundary>
          <Game session={session} />
        </ErrorBoundary>
      </div>
      {runtime.debugMode !== DebugMode.Disabled && <DebugPanel session={session} />}
      <AlertHost />
    </>
  );
}

export default App;

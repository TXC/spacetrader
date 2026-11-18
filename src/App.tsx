import { runtime } from './game/runtime.ts';
import type { Session } from './game/session.ts';
import { DebugMode } from './game/ensure.ts';
import styles from './App.module.css';
import { AlertHost } from './ui/AlertHost.tsx';
import { DebugPanel } from './ui/DebugPanel.tsx';
import { ErrorBoundary } from './ui/ErrorBoundary.tsx';
import { Game } from './ui/Game.tsx';
import { SessionContext } from './ui/useStore.ts';

function App({ session }: { session: Session }) {
  return (
    <SessionContext value={session}>
      <div id="game" className={styles.game}>
        <ErrorBoundary>
          <Game />
        </ErrorBoundary>
      </div>
      {runtime.debugMode !== DebugMode.Disabled && <DebugPanel />}
      <AlertHost />
    </SessionContext>
  );
}

export default App;

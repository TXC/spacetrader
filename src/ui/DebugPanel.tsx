import { useEffect, useState } from 'react';
import { runtime } from '../game/runtime.ts';
import { Cheats } from './Cheats.tsx';
import styles from './DebugPanel.module.css';
import { StateTree } from './StateTree.tsx';
import { useSession } from './useStore.ts';

// The action log as text, kept up to date as the player acts. Pasting it into a flow test
// replays the same game.
function useActionLog(): string {
  const [text, setText] = useState(() => runtime.actionLog.serializedString());
  useEffect(() => {
    const log = runtime.actionLog;
    log.logUpdateHandler = updated => setText(updated.serializedString());
    return () => {
      log.logUpdateHandler = null;
    };
  }, []);
  return text;
}

// A switch in the debug menu. Not a recorded action: it only changes what the panel shows.
function Toggle(props: { id: string; label: string; on: boolean; set: (on: boolean) => void }) {
  return (
    <label>
      <input
        type="checkbox"
        id={props.id}
        checked={props.on}
        onChange={() => props.set(!props.on)}
      />
      {props.label}
    </label>
  );
}

// What a save keeps of the game, as a tree.
function GameState() {
  const { game } = useSession();
  return (
    <div id="gameState" className={styles.section}>
      {game ? <StateTree name="game" value={game.toState()} /> : 'No game yet.'}
    </div>
  );
}

// Shown below the game in debug mode: a menu that turns on the cheats and the game's
// state, and copies the action log, then the action log itself.
export function DebugPanel() {
  const log = useActionLog();
  const [showCheats, setShowCheats] = useState(false);
  const [showGameState, setShowGameState] = useState(false);
  return (
    <div id="debug" className={styles.panel}>
      <button
        id="debugMenuButton"
        className={styles.menuButton}
        popoverTarget="debugMenu"
        aria-label="Debug menu"
      >
        ☰
      </button>
      <div id="debugMenu" className={styles.menu} popover="auto">
        <Toggle id="showCheats" label="Cheats" on={showCheats} set={setShowCheats} />
        <Toggle id="showGameState" label="Game state" on={showGameState} set={setShowGameState} />
        <button id="copyActionLog" onClick={() => void navigator.clipboard.writeText(log)}>
          Copy Action Log
        </button>
      </div>
      {showCheats && (
        <div id="cheats" className={styles.section}>
          <Cheats />
        </div>
      )}
      {showGameState && <GameState />}
      <div id="debugLog">{log}</div>
    </div>
  );
}

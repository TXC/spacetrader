import type { Game } from '../game/Game.ts';
import styles from './BaysCredits.module.css';

// The "Bays: used/total" and cash line at the foot of most station screens.
export function BaysCredits({ game }: { game: Game }) {
  const ship = game.commander.ship;
  const total = ship.totalCargoBays();
  return (
    <div className={styles.line}>
      <span>{`Bays: ${total - ship.freeCargoBays()}/${total}`}</span>
      <span>{`$${game.commander.getCredits()}`}</span>
    </div>
  );
}

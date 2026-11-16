import type { Game } from '../game/Game.ts'

// The "Bays: used/total" and cash line at the foot of most station screens.
export function BaysCredits({ game }: { game: Game }) {
  const ship = game.commander.ship
  const total = ship.totalCargoBays()
  return (
    <div className="bays-credits">
      <span>{`Bays: ${total - ship.freeCargoBays()}/${total}`}</span>
      <span>{`$${game.commander.getCredits()}`}</span>
    </div>
  )
}

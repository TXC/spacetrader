import { CHEATS } from '../game/Cheats.ts'
import type { Session } from '../game/session.ts'
import { LoggedButton } from './Logged.tsx'

// The cheat buttons. A cheat does nothing until there is a game.
export function Cheats({ session }: { session: Session }) {
  return CHEATS.map((cheat) => (
    <LoggedButton key={cheat.id} id={cheat.id} label={cheat.label} onPress={() => session.game && cheat.apply(session.game)} />
  ))
}

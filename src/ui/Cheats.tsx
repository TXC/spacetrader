import { CHEATS } from '../game/Cheats.ts';
import { LoggedButton } from './Logged.tsx';
import { useSession } from './useStore.ts';

// The cheat buttons. A cheat does nothing until there is a game.
export function Cheats() {
  const session = useSession();
  return CHEATS.map(cheat => (
    <LoggedButton
      key={cheat.id}
      id={cheat.id}
      label={cheat.label}
      onPress={() => session.game && cheat.apply(session.game)}
    />
  ));
}

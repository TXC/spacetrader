import type { Game } from '../game/Game.ts';
import type { SolarSystem } from '../game/SolarSystem.ts';
import { fillTank, step, systemsWithinRange } from '../game/Warp.ts';
import { BuySellCargo } from './BuySellCargo.tsx';
import { LoggedButton } from './Logged.tsx';
import { useSession } from './useStore.ts';
import shared from './shared.module.css';

type Props = {
  game: Game;
  selected: SolarSystem | null; // the destination picked so far
  mapSelection: SolarSystem | null; // what is selected on the map
  onSelect: (system: SolarSystem) => void;
  onFuel: () => void;
  onBlastOff: (destination: SolarSystem) => void;
};

function Buttons({
  systems,
  index,
  onSelect,
  onBlastOff,
}: Pick<Props, 'onSelect' | 'onBlastOff'> & { systems: SolarSystem[]; index: number }) {
  const move = (forward: boolean) => () => onSelect(systems[step(index, systems.length, forward)]);
  return (
    <div className={shared.buttonRow}>
      <LoggedButton
        id="warpBlastOff"
        kind="main"
        label={`Blast Off to ${systems[index].name}`}
        onPress={() => onBlastOff(systems[index])}
      />
      <LoggedButton id="warpPrev" label="Prev" onPress={move(false)} />
      <LoggedButton id="warpNext" label="Next" onPress={move(true)} />
    </div>
  );
}

function NothingInRange({ game, onFuel }: Pick<Props, 'game' | 'onFuel'>) {
  const ship = game.commander.ship;
  const price = (ship.fuelTankCapacity() - ship.fuel) * ship.model.costOfFuel;
  const fill = () => {
    fillTank(game);
    onFuel();
  };
  return (
    <h3 id="warpMessage">
      No systems within range{' '}
      <LoggedButton id="fulltank" label={`Fill tank for $${price}`} onPress={fill} />
    </h3>
  );
}

function Message({
  game,
  systems,
  mapSelection,
  onFuel,
}: Pick<Props, 'game' | 'mapSelection' | 'onFuel'> & { systems: SolarSystem[] }) {
  if (systems.length === 0) return <NothingInRange game={game} onFuel={onFuel} />;
  const here = mapSelection === game.commander.currentSystem;
  return <h3 id="warpMessage">{here ? 'Select a destination.' : 'Out of range.'}</h3>;
}

export function Warp({ game, selected, mapSelection, onSelect, onFuel, onBlastOff }: Props) {
  useSession();
  const systems = systemsWithinRange(game);
  const index = selected ? systems.indexOf(selected) : -1;
  const base = index >= 0 ? systems[index] : null;
  return (
    <>
      <h1 className={shared.headerWithButtons}>
        Warp
        {base && (
          <Buttons systems={systems} index={index} onSelect={onSelect} onBlastOff={onBlastOff} />
        )}
      </h1>
      <div id="buyContainerDiv">{base && <BuySellCargo game={game} buy baseSystem={base} />}</div>
      {!base && (
        <Message game={game} systems={systems} mapSelection={mapSelection} onFuel={onFuel} />
      )}
    </>
  );
}

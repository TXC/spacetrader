import { useState } from 'react';
import { flushSync } from 'react-dom';
import { askSingularity, describe, toggleTracking } from '../game/Chart.ts';
import type { Game } from '../game/Game.ts';
import type { SolarSystem } from '../game/SolarSystem.ts';
import { GalaxyMap } from './GalaxyMap.tsx';
import { Lines } from './Lines.tsx';
import { LoggedButton } from './Logged.tsx';
import { useSession } from './useStore.ts';
import shared from './shared.module.css';

type Props = { game: Game; onSingularity: (system: SolarSystem) => void };
// The button ids carry the number of rows in their table, as they always have.
type RowProps = Props & { system: SolarSystem; rows: number };

function Actions({ game, system, rows, onSingularity }: RowProps) {
  const tracked = game.trackedSystem === system;
  const here = system === game.commander.currentSystem;
  return (
    <td style={{ textAlign: 'center' }}>
      <LoggedButton
        key={tracked ? 'untrack' : 'track'}
        id={`galacticChart_track_${rows}_${system.name}`}
        label={tracked ? 'Untrack' : 'Track'}
        onPress={() => toggleTracking(game, system)}
      />
      {game.canSuperWarp && (
        <>
          <br />
          <LoggedButton
            id={`galacticChart_useSingularity_${rows}_${system.name}`}
            label="Use Singularity"
            disabled={here}
            onPress={() => askSingularity(game, system, onSingularity)}
          />
        </>
      )}
    </td>
  );
}

function SystemTable({
  game,
  systems,
  heading,
  onSingularity,
}: Props & { systems: SolarSystem[]; heading: string }) {
  return (
    <table className={shared.tightTable}>
      <tbody>
        <tr>
          <th colSpan={2}>{heading}</th>
        </tr>
        {systems.map(system => (
          <tr key={system.name}>
            <td>
              <b>{system.name}</b>
              <br />
              <Lines text={describe(game, system)} />
            </td>
            <Actions
              game={game}
              system={system}
              rows={systems.length}
              onSingularity={onSingularity}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function GalacticChart({ game, onSingularity }: Props) {
  useSession();
  const [selection, setSelection] = useState({
    system: game.commander.currentSystem,
    wormhole: false,
  });
  // A pick on the map comes from outside React, so draw it at once.
  const select = (system: SolarSystem, wormhole: boolean) =>
    flushSync(() => setSelection({ system, wormhole }));
  const shown = selection.wormhole ? selection.system.wormhole! : selection.system;
  return (
    <>
      <h1>Galactic Chart</h1>
      <GalaxyMap
        game={game}
        zoomed={false}
        selected={selection.system}
        wormhole={selection.wormhole}
        onSelect={select}
      />
      <SystemTable
        game={game}
        systems={[shown]}
        heading="Selected System"
        onSingularity={onSingularity}
      />
      <SystemTable
        game={game}
        systems={game.solarSystems}
        heading="System List"
        onSingularity={onSingularity}
      />
    </>
  );
}

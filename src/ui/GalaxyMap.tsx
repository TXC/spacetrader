import { useLayoutEffect, useRef } from 'react';
import type { Game } from '../game/Game.ts';
import type { SolarSystem } from '../game/SolarSystem.ts';
import { GalaxyView } from './canvas/GalaxyView.ts';
import styles from './GalaxyMap.module.css';
import shared from './shared.module.css';

type Props = {
  game: Game;
  zoomed: boolean;
  // The selection when the map appears. Afterwards the map itself holds the selection.
  selected: SolarSystem | null;
  wormhole: boolean;
  onSelect: (system: SolarSystem, wormhole: boolean) => void;
  // Hands out the drawing object, for whoever needs to steer the map directly.
  viewRef?: (view: GalaxyView | null) => void;
};

// The star map. The drawing is done by GalaxyView on a canvas; this puts it on the page
// and takes it off again.
export function GalaxyMap({ game, zoomed, selected, wormhole, onSelect, viewRef }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ onSelect, viewRef, selected, wormhole });
  useLayoutEffect(() => {
    latest.current = { onSelect, viewRef, selected, wormhole };
  });
  useLayoutEffect(() => {
    const start = latest.current;
    const classes = {
      host: zoomed ? styles.near : styles.whole,
      canvas: shared.canvas,
      info: styles.info,
    };
    const view = new GalaxyView(
      host.current!,
      game,
      start.selected,
      start.wormhole,
      zoomed,
      true,
      classes
    );
    view.delegate = {
      galaxyViewSelectedSolarSystem: (_view, system, viaWormhole) =>
        latest.current.onSelect(system, viaWormhole),
    };
    latest.current.viewRef?.(view);
    return () => {
      view.dispose();
      view.canvasContainer.remove();
      latest.current.viewRef?.(null);
    };
  }, [game, zoomed]);
  return <div ref={host} />;
}

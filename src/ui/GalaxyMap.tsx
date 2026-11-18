import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
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
  // A selection made somewhere else after the map appeared; the map moves to each new one.
  selection?: { system: SolarSystem | null; wormhole: boolean };
  // Hands out the drawing object, for whoever needs to steer the map directly.
  viewRef?: (view: GalaxyView | null) => void;
};

// The star map. The drawing is done by GalaxyView on a canvas; this puts it on the page
// and takes it off again.
export function GalaxyMap({
  game,
  zoomed,
  selected,
  wormhole,
  onSelect,
  selection,
  viewRef,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const drawing = useRef<GalaxyView | null>(null);
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
    drawing.current = view;
    latest.current.viewRef?.(view);
    return () => {
      drawing.current = null;
      view.dispose();
      view.canvasContainer.remove();
      latest.current.viewRef?.(null);
    };
  }, [game, zoomed]);
  useMovedSelection(drawing, selection);
  // The map cannot see the game change under it (fuel bought, a system tracked), and it
  // may be at rest. The screen is drawn again after every such change, so ask then.
  useLayoutEffect(() => drawing.current?.requestDraw());
  return <div ref={host} />;
}

// Moves the map to each selection made after it appeared, but not to the one it found.
function useMovedSelection(drawing: RefObject<GalaxyView | null>, selection: Props['selection']) {
  const moved = useRef(selection);
  useLayoutEffect(() => {
    if (!selection?.system || selection === moved.current) return;
    moved.current = selection;
    drawing.current?.moveSelection(selection.system, selection.wormhole);
  }, [drawing, selection]);
}

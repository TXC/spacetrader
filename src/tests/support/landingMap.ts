// The map the landing screen is showing, with what is selected on it. It is the page's
// only zoomed map, and it takes the replayed clicks on the map under "selectPlanetZoomed".
import { runtime } from '../../game/runtime.ts';
import type { GalaxyView } from '../../ui/canvas/GalaxyView.ts';

export function landingMap(): GalaxyView {
  const map = runtime.actionLog._namedEvents['selectPlanetZoomed'] as GalaxyView | undefined;
  if (!map) throw new Error('The landing screen shows no map.');
  return map;
}

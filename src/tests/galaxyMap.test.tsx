import { flushSync } from 'react-dom';
import { expect, test, vi } from 'vitest';
import type { Game } from '../game/Game.ts';
import type { GalaxyView } from '../ui/canvas/GalaxyView.ts';
import { GalaxyMap } from '../ui/GalaxyMap.tsx';
import './flows/setup.ts';
import { runReplayLog } from './flows/harness.ts';
import { render } from './support/render.tsx';

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

// Puts a map on the page, with the player's system selected so that its ring pulses and
// the map keeps drawing.
function mount() {
  const log = '{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733543535142}';
  const game = runReplayLog(log).session.game!;
  let view: GalaxyView | null = null;
  const keep = (v: GalaxyView | null) => (view = v ?? view);
  const { host, root } = render(map(game, keep));
  const redraw = () => flushSync(() => root.render(map(game, keep)));
  return { host, root, redraw, view: view! as GalaxyView };
}

function map(game: Game, viewRef: (view: GalaxyView | null) => void) {
  return (
    <GalaxyMap
      game={game}
      zoomed={false}
      selected={game.commander.currentSystem}
      wormhole={false}
      onSelect={() => {}}
      viewRef={viewRef}
    />
  );
}

// The old map kept drawing for up to five seconds after it left the page, and never
// stopped listening for changes of size.
test('a map that leaves the page stops drawing and stops listening', async () => {
  const { host, root, view } = mount();
  await nextFrame();
  await nextFrame();
  const draw = vi.spyOn(view, 'drawGalaxy');
  const resize = vi.spyOn(view, 'resizeCanvasIfNeeded');
  await nextFrame();
  expect(draw).toHaveBeenCalled();

  flushSync(() => root.unmount());
  draw.mockClear();
  resize.mockClear();
  await nextFrame();
  await nextFrame();
  window.dispatchEvent(new Event('resize'));

  expect(draw).not.toHaveBeenCalled();
  expect(resize).not.toHaveBeenCalled();
  expect(host.querySelector('canvas')).toBeNull();
});

// A map at rest cannot see the game change, for instance when fuel is bought.
test('a map is asked to draw whenever the screen around it is drawn again', () => {
  const { redraw, view } = mount();
  const asked = vi.spyOn(view, 'requestDraw');
  redraw();
  expect(asked).toHaveBeenCalled();
});

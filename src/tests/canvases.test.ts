// How the two canvases behave: when they draw, what they read from the page, and what
// they leave behind.
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ActionLogger } from '../game/ActionLogger.ts';
import type { Game } from '../game/Game.ts';
import { runtime } from '../game/runtime.ts';
import { GalaxyView } from '../ui/canvas/GalaxyView.ts';
import { TravelProgressView } from '../ui/canvas/TravelProgressView.ts';
import { newGame } from './support/newGame.ts';

let frames: FrameRequestCallback[] = [];
let host: HTMLElement;
let game: Game;

// Runs the frames the views have asked for, as if the browser drew at this time.
function frame(timestamp: number) {
  frames.splice(0).forEach(callback => callback(timestamp));
}

beforeEach(() => {
  frames = [];
  host = document.body.appendChild(document.createElement('div'));
  host.style.cssText = 'width:300px';
  host.insertAdjacentHTML('beforebegin', '<style data-fixed>.fixed{display:block;height:200px}');
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => frames.push(callback));
  game = newGame();
  runtime.actionLog = new ActionLogger(1);
});

afterEach(() => {
  host.remove();
  document.querySelector('style[data-fixed]')?.remove();
});

const classes = { host: 'fixed', canvas: '', info: '' };

function map(selected = game.commander.currentSystem, zoomed = false) {
  return new GalaxyView(host, game, selected, false, zoomed, true, classes);
}

function strip() {
  const [origin, destination] = game.solarSystems;
  return new TravelProgressView(host, game, origin, destination, true, classes);
}

// How many pixels of the canvas are red, the colour of the ring around the selection.
function redPixels() {
  const canvas = host.querySelector('canvas')!;
  const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 200 && data[i + 1] < 60 && data[i + 2] < 60) count++;
  }
  return count;
}

test('the map drawn before its first frame shows the ring around the selection', () => {
  const view = map();
  view.drawGalaxy(0);
  expect(redPixels()).toBeGreaterThan(0);
  view.dispose();
});

test('a target given to the strip before its first frame starts the slide at that frame', () => {
  const view = strip();
  view.setProgress(0.5);
  expect(view.progressAnimationStartTime).toBe(0);
  frame(1000);
  expect(view.progressAnimationStartTime).toBe(1000);
  view.dispose();
});

const listener = () => runtime.actionLog._namedEvents['selectPlanet'];

test('a map that is taken away no longer receives replayed map clicks', () => {
  const view = map();
  expect(listener()).toBe(view);
  view.dispose();
  expect(listener()).toBeUndefined();
});

test('taking an old map away leaves the newer map listening', () => {
  const old = map();
  const newer = map();
  old.dispose();
  expect(listener()).toBe(newer);
  newer.dispose();
});

test('a replayed click on a system that does not exist changes nothing', () => {
  const view = map();
  view.handleNamedEvent('selectPlanet', 'Nowhere');
  expect(view.selectedSystem).toBe(game.commander.currentSystem);
  view.dispose();
});

const canvas = () => host.querySelector('canvas')!;
const views = { map: () => map(), strip: () => strip() };

// Stand-ins for the browser's media queries, by their text, so that a test can fire their
// changes. Only those whose text holds `matching` match.
function mediaQueries(matching = 'nothing') {
  const queries: Record<string, MediaQueryList> = {};
  vi.spyOn(window, 'matchMedia').mockImplementation(media => {
    const query = { media, matches: media.includes(matching) };
    return (queries[media] = Object.assign(new EventTarget(), query) as MediaQueryList);
  });
  return queries;
}

test.for(['map', 'strip'] as const)('the %s follows the size of its container', async kind => {
  vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1);
  const view = views[kind]();
  expect(canvas().width).toBe(300);
  host.style.width = '200px';
  await vi.waitFor(() => expect(canvas().width).toBe(200));
  expect(canvas().style.width).toBe('200px');
  view.dispose();
});

test.for(['map', 'strip'] as const)('the %s stays sharp on a denser screen', kind => {
  const ratio = vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1);
  const queries = mediaQueries();
  const view = views[kind]();
  ratio.mockReturnValue(2);
  queries['(resolution: 1dppx)'].dispatchEvent(new Event('change'));
  expect(canvas().width).toBe(600);
  expect(Object.keys(queries)).toContain('(resolution: 2dppx)');
  view.dispose();
});

test.for(['map', 'strip'] as const)(
  'the %s, once taken away, ignores its container',
  async kind => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1);
    const view = views[kind]();
    view.dispose();
    host.style.width = '200px';
    await new Promise(resolve => setTimeout(resolve, 100));
    frame(1000);
    expect(canvas().width).toBe(300);
  }
);

test.for(['map', 'strip'] as const)('the %s does not measure the page to draw a frame', kind => {
  const view = views[kind]();
  frame(1000);
  const measure = vi.spyOn(Element.prototype, 'getBoundingClientRect');
  [1016, 1032, 1048].forEach(frame);
  expect(measure).not.toHaveBeenCalled();
  view.dispose();
});

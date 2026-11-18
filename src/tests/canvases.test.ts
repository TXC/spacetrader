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
  host.insertAdjacentHTML('beforebegin', '<style data-fixed>.fixed{display:block;height:60px}');
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

// How many pixels of the canvas are pure red, the colour of the ring around the selection.
function redPixels() {
  const canvas = host.querySelector('canvas')!;
  const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 0) count++;
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

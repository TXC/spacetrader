// Pins what the two canvases draw, so that changes to how they draw can be told from
// changes to what they draw.
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ActionLogger } from '../game/ActionLogger.ts';
import type { Game } from '../game/Game.ts';
import { runtime } from '../game/runtime.ts';
import { Ship, ShipModelType } from '../game/Ship.ts';
import { GalaxyView } from '../ui/canvas/GalaxyView.ts';
import { TravelProgressView } from '../ui/canvas/TravelProgressView.ts';
import { newGame } from './support/newGame.ts';

type Label = { text: string; x: number; y: number; font: string; style: string };

let frames: FrameRequestCallback[] = [];
let labels: Label[] = [];
let host: HTMLElement;

// Runs the frames the views have asked for, as if the browser drew at this time.
function frame(timestamp: number) {
  frames.splice(0).forEach(callback => callback(timestamp));
}

// Letter shapes differ between machines, so the labels are pinned as what was asked for
// (text, place, font, colour) and are left out of the pixels.
function recordLabels() {
  const context = CanvasRenderingContext2D.prototype;
  vi.spyOn(context, 'measureText').mockImplementation(
    text => ({ width: text.length * 7 }) as TextMetrics
  );
  vi.spyOn(context, 'fillText').mockImplementation(function (
    this: CanvasRenderingContext2D,
    text,
    x,
    y
  ) {
    const style = `${String(this.fillStyle)} ${this.textAlign} ${this.textBaseline}`;
    labels.push({ text, x, y, font: this.font, style });
  });
}

async function sha(text: string | Uint8ClampedArray<ArrayBuffer>) {
  const bytes = typeof text === 'string' ? new TextEncoder().encode(text) : text;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// What is on the canvas now: its size, its pixels, and the labels of the last frame.
async function picture() {
  const canvas = host.querySelector('canvas')!;
  const context = canvas.getContext('2d')!;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const places = labels.map(({ text, x, y, style }) => [text, x, y, style]);
  return {
    size: `${canvas.width}x${canvas.height}`,
    pixels: (await sha(pixels)).slice(0, 16),
    labels: (await sha(JSON.stringify(places))).slice(0, 16),
    fonts: [...new Set(labels.map(label => label.font))],
  };
}

function page(width: number, height: number, pixelRatio: number) {
  vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(pixelRatio);
  host.style.cssText = `width:${width}px`;
  host.insertAdjacentHTML(
    'beforebegin',
    `<style data-pin>.pinned{display:block;height:${height}px}</style>`
  );
}

function game(): Game {
  const game = newGame();
  runtime.actionLog = new ActionLogger(1);
  return game;
}

beforeEach(() => {
  frames = [];
  labels = [];
  host = document.body.appendChild(document.createElement('div'));
  document.documentElement.style.fontSize = '15px';
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => frames.push(callback));
  recordLabels();
});

afterEach(() => {
  host.remove();
  document.querySelector('style[data-pin]')?.remove();
  document.documentElement.style.fontSize = '';
});

const classes = { host: 'pinned', canvas: '', info: '' };
const FONTS = ['10px Helvetica, Arial, sans-serif'];

// Draws the map half-way through a pulse of the rings, when they are at their largest.
async function mapPicture(view: GalaxyView) {
  frame(1000);
  labels = [];
  frame(1750);
  const result = await picture();
  view.dispose();
  return result;
}

test('the whole galaxy, with a selected and a tracked system', async () => {
  page(360, 200, 2);
  const g = game();
  g.trackedSystem = g.solarSystems.find(s => s !== g.commander.currentSystem)!;
  const view = new GalaxyView(host, g, g.commander.currentSystem, false, false, true, classes);

  expect(await mapPicture(view)).toEqual({
    size: '720x400',
    pixels: '009be935e4dcec90',
    labels: 'ed78f180fda441ab',
    fonts: FONTS,
  });
});

test('the map near the player, with the far end of a wormhole selected', async () => {
  page(300, 150, 1);
  const g = game();
  const system = g.solarSystems.find(s => s.wormhole)!;
  g.commander.setCurrentSystem(system);
  const view = new GalaxyView(host, g, system, true, true, true, classes);

  expect(await mapPicture(view)).toEqual({
    size: '300x150',
    pixels: '75d321dfdef70491',
    labels: 'ca2401a7d0301d84',
    fonts: FONTS,
  });
});

test('the galaxy without names and with nothing selected', async () => {
  page(360, 200, 2);
  const g = game();
  const view = new GalaxyView(host, g, null, false, false, false, classes);

  expect(await mapPicture(view)).toEqual({
    size: '720x400',
    pixels: '88212eea1fa3d14b',
    labels: '4f53cda18c2baa0c',
    fonts: [],
  });
});

function strip(g: Game, visited: boolean) {
  const [origin, destination] = g.solarSystems;
  return new TravelProgressView(host, g, origin, destination, visited, classes);
}

test('the travel strip, with the ship on its way and arrived', async () => {
  page(360, 50, 2);
  const view = strip(game(), false);
  view.setProgress(0.5);

  frame(1000);
  labels = [];
  frame(1100);
  expect(await picture()).toEqual({
    size: '720x100',
    pixels: '90f989effa040037',
    labels: '5f6e4bddef9a47e7',
    fonts: FONTS,
  });

  labels = [];
  frame(1300);
  expect(await picture()).toEqual({
    size: '720x100',
    pixels: 'ad04df39fb5c12b5',
    labels: '5f6e4bddef9a47e7',
    fonts: FONTS,
  });
  view.dispose();
});

test('the travel strip, with a new target after the ship has stopped', async () => {
  page(360, 50, 2);
  const view = strip(game(), true);
  view.setProgress(0.25);
  [1000, 1016, 1300, 1316].forEach(frame);
  view.setProgress(0.75);
  [1332, 1348].forEach(frame);
  labels = [];
  frame(1416);
  expect(await picture()).toEqual({
    size: '720x100',
    pixels: '61b98b5f39c5cd75',
    labels: '5f6e4bddef9a47e7',
    fonts: FONTS,
  });
  view.dispose();
});

// The grasshopper is the one ship with see-through colours.
test('the travel strip, with a see-through ship on a plain screen', async () => {
  page(301, 40, 1);
  const g = game();
  g.commander.ship = new Ship(ShipModelType.Grasshopper);
  const view = strip(g, true);
  view.setProgress(1);

  frame(1000);
  labels = [];
  frame(1250);
  expect(await picture()).toEqual({
    size: '301x40',
    pixels: '31ca6bcc6c9b9bc1',
    labels: '621c817420ad7728',
    fonts: FONTS,
  });
  view.dispose();
});

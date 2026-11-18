import {
  LabelColor,
  labelFont,
  labelSize,
  UnvisitedSystemColor,
  VisitedSystemColor,
} from './GalaxyView.ts';
import { easeInOutCubic } from './easing.ts';
import type { Game } from '../../game/Game.ts';
import type { PCEImage } from '../../game/PCEImage.ts';
import type { SolarSystem } from '../../game/SolarSystem.ts';
import { drawInCanvas } from './pceDrawing.ts';
import { watchSize } from './watchSize.ts';

// Seconds the ship takes to slide to a new position.
export const TRAVEL_PROGRESS_DURATION = 0.2;

export class TravelProgressView {
  game: Game;
  origin: SolarSystem;
  destination: SolarSystem;
  wasVisited: boolean;
  canvasContainer = document.createElement('div');
  canvas = document.createElement('canvas');
  context = this.canvas.getContext('2d')!;
  scale = 1;
  // The size of the container the canvas was last fitted to.
  private width = 0;
  private height = 0;
  // Where the ship last came to rest, and where it is going, from 0 to 1.
  shipProgress = 0;
  shipTargetProgress = 0;
  // When the slide to the target began. Zero: not sliding, or to begin with the next frame.
  progressAnimationStartTime = 0;
  // Zero until the first frame.
  private lastDrawTimestamp = 0;
  // Where the ship was last drawn, from 0 to 1.
  private shipDistance = 0;
  // The ship as it is drawn at this size. Made when first needed.
  private shipBitmap: HTMLCanvasElement | null = null;
  // Read from the page when the canvas is fitted, not while drawing.
  private textHeight = 0;
  private font = '';
  // The frame that has been asked for; zero when there is none.
  private frame = 0;
  private disposed = false;
  private stopWatchingSize = watchSize(this.canvasContainer, () => this.resizeCanvasIfNeeded());

  // Stops the drawing loop and stops listening. Call when the view leaves the page.
  dispose() {
    this.disposed = true;
    this.stopWatchingSize();
  }

  constructor(
    div: HTMLElement,
    game: Game,
    origin: SolarSystem,
    destination: SolarSystem,
    wasVisited: boolean,
    // The class names of the two elements made here; their styles are the caller's.
    classes: { host: string; canvas: string }
  ) {
    this.game = game;
    this.origin = origin;
    this.destination = destination;
    this.wasVisited = wasVisited;

    this.canvasContainer.id = 'travelProgressViewCanvasContainer';
    this.canvasContainer.className = classes.host;
    div.appendChild(this.canvasContainer);

    this.canvas.id = 'travelProgressViewCanvas';
    this.canvas.className = classes.canvas;
    this.canvasContainer.appendChild(this.canvas);
    this.initCanvas();

    this.requestFrame();
  }

  private requestFrame() {
    if (!this.disposed && !this.frame) {
      this.frame = requestAnimationFrame(timestamp => this.animateView(timestamp));
    }
  }

  // Draws, and goes on drawing only while the ship is on its way.
  animateView(timestamp: number) {
    this.frame = 0;
    if (this.disposed) {
      return;
    }
    this.drawView(timestamp);
    if (this.progressAnimationStartTime > 0) {
      this.requestFrame();
    }
  }

  initCanvas(rect = this.canvasContainer.getBoundingClientRect()) {
    this.width = rect.width;
    this.height = rect.height;
    this.scale = window.devicePixelRatio;
    this.textHeight = labelSize();
    this.font = labelFont();
    this.shipBitmap = null;

    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.canvas.width = rect.width * this.scale;
    this.canvas.height = rect.height * this.scale;

    this.context.scale(this.scale, this.scale);
  }

  // Called when the container's size or the screen's pixel density may have changed.
  resizeCanvasIfNeeded() {
    const rect = this.canvasContainer.getBoundingClientRect();
    const fits = this.width === rect.width && this.height === rect.height;
    if (fits && this.scale === window.devicePixelRatio) {
      return;
    }
    this.initCanvas(rect);
    // At once: a canvas is empty after a change of size.
    this.paint();
  }

  planetRadius() {
    const radius = this.canvas.height / this.scale / 3 / 2;
    return radius;
  }

  // Returns the x-coordinate of the center of the solar system
  _solarSystemXOrigin(left: boolean) {
    const radius = this.planetRadius();

    const edgePadding = 2;
    const horizontalPadding = edgePadding + this._textHeight();

    const xOrigin = left
      ? horizontalPadding + radius
      : this.canvas.width / this.scale - horizontalPadding - radius;

    return xOrigin;
  }

  _textHeight() {
    return this.textHeight;
  }

  _drawSolarSystem(s: SolarSystem, left: boolean, visited: boolean) {
    const radius = this.planetRadius();
    const edgePadding = 2;
    const xOrigin = this._solarSystemXOrigin(left);
    const yOrigin = this.canvas.height / this.scale / 2;

    this.context.fillStyle = visited ? VisitedSystemColor : UnvisitedSystemColor;
    this.context.beginPath();
    this.context.arc(xOrigin, yOrigin, radius, 0, Math.PI * 2);
    this.context.fill();

    const nameY = yOrigin + radius + edgePadding + this._textHeight() / 2;
    this.drawName(s.name, xOrigin, nameY, left);
  }

  // The name sits under its system, moved inwards where it would cross the canvas's edge.
  private drawName(sname: string, xOrigin: number, nameY: number, left: boolean) {
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.font = this.font;
    const textMetrics = this.context.measureText(sname);

    const edgePadding = 2;
    const rightEdge = this.canvas.width / this.scale - textMetrics.width - edgePadding;
    let nameX = xOrigin - Math.floor(textMetrics.width / 2);
    nameX = left ? Math.max(edgePadding, nameX) : Math.min(rightEdge, nameX);

    this.context.fillStyle = LabelColor;
    this.context.fillText(sname, nameX + textMetrics.width / 2, nameY);
  }

  drawView(timestamp: number) {
    this.lastDrawTimestamp = timestamp;
    this.shipDistance = this.slide(timestamp);
    this.paint();
  }

  // Where the ship is at this time, from 0 to 1. Ends the slide when its time is up.
  private slide(timestamp: number) {
    if (this.shipTargetProgress !== this.shipProgress && !this.progressAnimationStartTime) {
      this.progressAnimationStartTime = timestamp;
    }
    if (this.progressAnimationStartTime <= 0) {
      this.shipProgress = this.shipTargetProgress;
      return this.shipTargetProgress;
    }

    const animationTimeElapsed = timestamp - this.progressAnimationStartTime;
    const animationPercent = Math.min(1, animationTimeElapsed / (TRAVEL_PROGRESS_DURATION * 1000));
    const distancePercent = easeInOutCubic(animationPercent);
    const shipDistance =
      this.shipProgress + distancePercent * (this.shipTargetProgress - this.shipProgress);

    if (animationPercent >= 1) {
      this.progressAnimationStartTime = 0;
      this.shipProgress = this.shipTargetProgress;
    }
    return shipDistance;
  }

  private paint() {
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      return;
    }

    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this._drawSolarSystem(this.origin, true, true);
    this._drawSolarSystem(this.destination, false, this.wasVisited);
    this.drawShip();
  }

  private drawShip() {
    const shipPCEImage = this.game.commander.ship.model.shipImage;
    const shipScale = Math.max(1, Math.ceil((this.planetRadius() * 2) / shipPCEImage.height));

    const edgePadding = 2;
    const shipXOrigin = this._solarSystemXOrigin(true) + this.planetRadius() + edgePadding;
    const shipXDestination =
      this._solarSystemXOrigin(false) -
      this.planetRadius() -
      edgePadding -
      shipPCEImage.width * shipScale;
    const shipX = Math.floor(shipXOrigin + (shipXDestination - shipXOrigin) * this.shipDistance);
    const shipY = Math.floor(
      (this.canvas.height / this.scale - shipPCEImage.height * shipScale) / 2
    );

    this.shipBitmap ??= this.makeShipBitmap(shipPCEImage, shipScale);
    const { width, height } = this.shipBitmap;
    this.context.drawImage(this.shipBitmap, shipX, shipY, width / this.scale, height / this.scale);
  }

  // The ship in the canvas's own pixels, so that drawing it is one copy.
  private makeShipBitmap(image: PCEImage, shipScale: number) {
    const bitmap = document.createElement('canvas');
    const pixel = shipScale * this.scale;
    bitmap.width = Math.ceil(image.width * pixel);
    bitmap.height = Math.ceil(image.height * pixel);
    drawInCanvas(image, bitmap, pixel);
    return bitmap;
  }

  setProgress(p: number) {
    this.shipTargetProgress = p;
    // While frames are running the slide counts from the last one, as it always has. At
    // rest, and before the first frame, that time is stale or zero: the slide then starts
    // with the next frame.
    this.progressAnimationStartTime = this.frame ? this.lastDrawTimestamp : 0;
    this.requestFrame();
  }
}

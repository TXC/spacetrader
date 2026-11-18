import {
  DEBUG_OVERRIDE_SCALE_TO_1,
  labelSize,
  UnvisitedSystemColor,
  VisitedSystemColor,
} from './GalaxyView.ts';
import type { Game } from '../../game/Game.ts';
import type { SolarSystem } from '../../game/SolarSystem.ts';
import { Utils } from '../../game/Utilities.ts';
import { drawInCanvas } from './pceDrawing.ts';

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
  private lastInvalidationCheckTimestamp = 0;
  // Zero until the first frame.
  private lastDrawTimestamp = 0;
  private disposed = false;
  private onResize = () => this.resizeCanvasIfNeeded();

  // Stops the drawing loop and stops listening. Call when the view leaves the page.
  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
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
    this.initEvents();

    // Excessive to run this the whole time. Consider animating only during progress animation.
    this.startAnimating();
  }

  startAnimating() {
    requestAnimationFrame(timestamp => this.animateView(timestamp));
  }

  animateView(timestamp: number) {
    if (this.disposed) {
      return;
    }
    this.drawView(timestamp);

    // Allow us to get garbage collected if the view is removed from the document
    let shouldContinueAnimating = true;
    if (!this.lastInvalidationCheckTimestamp) {
      this.lastInvalidationCheckTimestamp = timestamp;
    }

    if (timestamp - this.lastInvalidationCheckTimestamp > 5000) {
      shouldContinueAnimating = document.body.contains(this.canvasContainer);
    }

    if (shouldContinueAnimating) {
      requestAnimationFrame(newTimestamp => this.animateView(newTimestamp));
    }
  }

  initCanvas() {
    const rect = this.canvasContainer.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    if (DEBUG_OVERRIDE_SCALE_TO_1) {
      this.scale = 1;
    } else {
      this.scale = window.devicePixelRatio;
    }

    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.canvas.width = rect.width * this.scale;
    this.canvas.height = rect.height * this.scale;

    this.context.scale(this.scale, this.scale);
  }

  resizeCanvasIfNeeded() {
    const rect = this.canvasContainer.getBoundingClientRect();
    if (this.width !== rect.width || this.height !== rect.height) {
      this.initCanvas();
    }
  }

  initEvents() {
    window.addEventListener('resize', this.onResize);
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
    return labelSize();
  }

  _drawSolarSystem(s: SolarSystem, left: boolean, visited: boolean) {
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    const textHeight = this._textHeight();
    this.context.font = `${textHeight}px Helvetica, Arial, san-serif`;

    const sname = s.name;
    const textMetrics = this.context.measureText(sname);

    const radius = this.planetRadius();

    const edgePadding = 2;

    const xOrigin = this._solarSystemXOrigin(left);

    const yOrigin = this.canvas.height / this.scale / 2;

    const color = visited ? VisitedSystemColor : UnvisitedSystemColor;
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.arc(xOrigin, yOrigin, radius, 0, Math.PI * 2);
    this.context.fill();

    const nameY = yOrigin + radius + edgePadding + textHeight / 2;
    let nameX = xOrigin - Math.floor(textMetrics.width / 2);
    if (left) {
      nameX = Math.max(edgePadding, nameX) + textMetrics.width / 2;
    } else {
      nameX =
        Math.min(this.canvas.width / this.scale - textMetrics.width - edgePadding, nameX) +
        textMetrics.width / 2;
    }

    this.context.fillStyle = 'white';
    this.context.fillText(sname, nameX, nameY);
  }

  drawView(timestamp: number) {
    this.lastDrawTimestamp = timestamp;

    if (this.shipTargetProgress > this.shipProgress && !this.progressAnimationStartTime) {
      this.progressAnimationStartTime = timestamp;
    }

    this.resizeCanvasIfNeeded();
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      return;
    }

    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // SolarSystems
    this._drawSolarSystem(this.origin, true, true);
    this._drawSolarSystem(this.destination, false, this.wasVisited);

    // Ship
    let shipDistance = this.shipTargetProgress;

    if (this.progressAnimationStartTime > 0) {
      const animationTimeElapsed = timestamp - this.progressAnimationStartTime;
      let animationPercent = animationTimeElapsed / (TRAVEL_PROGRESS_DURATION * 1000);

      if (animationPercent >= 1) {
        // Animation is complete
        this.progressAnimationStartTime = 0;
        animationPercent = 1;
      }

      const distancePercent = Utils.easeInOutCubic(animationPercent);
      shipDistance =
        this.shipProgress + distancePercent * (this.shipTargetProgress - this.shipProgress);

      if (animationPercent >= 1) {
        this.shipProgress = this.shipTargetProgress;
      }
    } else {
      this.shipProgress = this.shipTargetProgress;
    }

    const shipPCEImage = this.game.commander.ship.model.shipImage;
    const shipScale = Math.max(1, Math.ceil((this.planetRadius() * 2) / shipPCEImage.height));

    const edgePadding = 2;
    const shipXOrigin = this._solarSystemXOrigin(true) + this.planetRadius() + edgePadding;
    const shipXDestination =
      this._solarSystemXOrigin(false) -
      this.planetRadius() -
      edgePadding -
      shipPCEImage.width * shipScale;
    const shipX = Math.floor(shipXOrigin + (shipXDestination - shipXOrigin) * shipDistance);
    const shipY = Math.floor(
      (this.canvas.height / this.scale - shipPCEImage.height * shipScale) / 2
    );

    drawInCanvas(shipPCEImage, this.canvas, shipScale, shipX, shipY);
  }

  setProgress(p: number) {
    this.shipTargetProgress = p;
    this.progressAnimationStartTime = this.lastDrawTimestamp;
  }
}

import { GALAXY_HEIGHT, GALAXY_WIDTH } from '../../game/Game.ts';
import { SpecialEvent } from '../../game/SolarSystem.types.ts';
import type { Game } from '../../game/Game.ts';
import type { SolarSystem } from '../../game/SolarSystem.ts';
import { runtime } from '../../game/runtime.ts';
import { easeInOutSine } from './easing.ts';
import { watchSize } from './watchSize.ts';

type Point = { x: number; y: number };
type Planet = Point & { radius: number; solarSystem: SolarSystem; isWormhole: boolean };
type ScaleFactors = { xScaleFactor: number; yScaleFactor: number };
type Bounds = { xMin: number; xMax: number; yMin: number; yMax: number };

// Whoever shows the map is told when a system is picked.
export type GalaxyViewDelegate = {
  galaxyViewSelectedSolarSystem(view: GalaxyView, system: SolarSystem, wormhole: boolean): void;
};

export const GalaxyViewEdgeBuffer = 23;

export const VisitedSystemColor = '#6699CC';
export const UnvisitedSystemColor = '#414141';
export const WormholeSystemColor = '#FFA500';
export const SpecialSystemColor = '#66CC85';
// The maps are black whatever the page's colours are.
export const LabelColor = 'white';

// The size of the labels drawn on a canvas: two thirds of the page's text size.
export function labelSize(): number {
  return (parseFloat(getComputedStyle(document.documentElement).fontSize) * 2) / 3;
}

export function labelFont(): string {
  return `${labelSize()}px Helvetica, Arial, sans-serif`;
}

export class GalaxyView {
  game: Game;
  zoomed: boolean;
  showNames: boolean;
  infoClass: string;
  planets: Planet[] = [];
  selectedSystem: SolarSystem | null;
  selectedWormhole: boolean;
  selectedPlanet: Planet | null | undefined = null;
  canvasContainer = document.createElement('div');
  canvas = document.createElement('canvas');
  context = this.canvas.getContext('2d')!;
  delegate: GalaxyViewDelegate | null = null;
  scale = 1;
  // The size of the container the canvas was last fitted to.
  private width = 0;
  private height = 0;
  // Zero until the first frame; the rings pulse from then.
  animationStartTime = 0;
  private _prevXYScaleFactors: ScaleFactors | null = null;
  private solarSystemBounds: Bounds | null = null;
  private lastTimestamp = 0;
  // Read from the page when the canvas is fitted, not while drawing.
  private labelFont = '';
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // The frame that has been asked for; zero when there is none.
  private frame = 0;
  private disposed = false;
  private stopWatchingSize = watchSize(this.canvasContainer, () => this.resizeCanvasIfNeeded());
  private onMouseUp = (event: MouseEvent) => this.onInputEnd(event);

  // Stops the drawing loop and stops listening. Call when the map leaves the page.
  dispose() {
    this.disposed = true;
    this.stopWatchingSize();
    this.reducedMotion.removeEventListener('change', this.requestDraw);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    runtime.actionLog.unregisterNamedEventListener(this, this.selectEventName());
  }

  constructor(
    div: HTMLElement,
    game: Game,
    selectedSystem: SolarSystem | null,
    selectedWormhole: boolean,
    zoomed: boolean,
    showNames: boolean,
    // The class names of the elements made here; their styles are the caller's.
    classes: { host: string; canvas: string; info: string }
  ) {
    this.game = game;
    this.zoomed = zoomed;
    this.showNames = showNames;
    this.infoClass = classes.info;
    this.selectedSystem = selectedSystem;
    this.selectedWormhole = selectedWormhole;

    this.canvasContainer.id = zoomed
      ? 'zoomedGalaxyViewCanvasContainer'
      : 'galaxyViewCanvasContainer';
    this.canvasContainer.className = classes.host;
    div.appendChild(this.canvasContainer);

    this.canvas.id = zoomed ? 'zoomedGalaxyViewCanvas' : 'galaxyViewCanvas';
    this.canvas.className = classes.canvas;
    this.canvasContainer.appendChild(this.canvas);
    this.nameCanvas();
    this.initCanvas();
    this.initEvents();

    this.requestDraw();
  }

  // Asks for the map to be drawn at the next frame. The map draws by itself while a ring
  // pulses; this is for the changes it cannot see, such as fuel bought or a system tracked.
  requestDraw = () => {
    if (!this.disposed && !this.frame) {
      this.frame = requestAnimationFrame(timestamp => this.animateGalaxy(timestamp));
    }
  };

  animateGalaxy(timestamp: number) {
    this.frame = 0;
    if (this.disposed) {
      return;
    }
    this.animationStartTime ||= timestamp;
    this.lastTimestamp = timestamp;
    this.drawGalaxy(timestamp);
    if (this.ringsPulse()) {
      this.requestDraw();
    }
  }

  private ringsPulse() {
    const isSet = (system: unknown) => system !== null && system !== undefined;
    const anyRing = isSet(this.selectedPlanet) || isSet(this.game.trackedSystem);
    return anyRing && !this.reducedMotion.matches;
  }

  initCanvas(rect = this.canvasContainer.getBoundingClientRect()) {
    this.width = rect.width;
    this.height = rect.height;
    this.scale = window.devicePixelRatio;
    this.labelFont = labelFont();

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
    this.planets = [];
    this.initCanvas(rect);
    // At once: a canvas is empty after a change of size.
    this.drawGalaxy(this.lastTimestamp);
  }

  // The scale changes when the commander's ship changes to one with a different range.
  private scaleFactorsChanged() {
    const before = this._prevXYScaleFactors;
    const now = this.getXYScaleFactors();
    this._prevXYScaleFactors = now;
    return (
      before !== null &&
      (now.xScaleFactor !== before.xScaleFactor || now.yScaleFactor !== before.yScaleFactor)
    );
  }

  eventHandlerName() {
    return this.zoomed ? 'Zoomed' : '';
  }

  private selectEventName() {
    return 'selectPlanet' + this.eventHandlerName();
  }

  initEvents() {
    this.canvas.addEventListener('mouseup', this.onMouseUp);

    runtime.actionLog.registerNamedEventListener(this, this.selectEventName());
    this.reducedMotion.addEventListener('change', this.requestDraw);
  }

  handleNamedEvent(eventName: string, eventContext: string) {
    if (eventName === this.selectEventName()) {
      const splitContext = eventContext.split('~');
      const systemName = splitContext[0];
      const isWormhole = splitContext.length > 1;

      const s = this.game.solarSystems.find(s => s.name === systemName);
      if (s) {
        this.selectSystem(s, isWormhole);
      }
    }
  }

  onInputEnd(event: MouseEvent) {
    if (!this.delegate) {
      return;
    }

    const pos = this.getEventPosition(event);
    const planet = this.getPlanetAtPosition(pos.x, pos.y);
    if (planet) {
      let s = planet.solarSystem;
      const isWormhole = planet.isWormhole === true;
      if (planet.isWormhole) {
        s = this.game.solarSystems.find(x => x.wormhole === planet.solarSystem)!;
      }

      this.selectSystem(s, isWormhole);

      runtime.actionLog.logNamedEvent(
        this.selectEventName(),
        s.name + (isWormhole ? '~wormhole' : '')
      );
    }
  }

  getEventPosition(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  getPlanetAtPosition(x: number, y: number) {
    let closestDistance = Math.sqrt(
      Math.pow(this.canvas.width / this.scale, 2) + Math.pow(this.canvas.height / this.scale, 2)
    );
    let closestPlanet: Planet | null = null;

    for (const planet of this.planets) {
      const dist = Math.sqrt(Math.pow(planet.x - x, 2) + Math.pow(planet.y - y, 2));

      if (dist < closestDistance) {
        closestDistance = dist;
        closestPlanet = planet;
      }

      // Position is inside planet
      if (dist <= planet.radius) {
        return planet;
      }
    }

    return closestPlanet;
  }

  selectSystem(s: SolarSystem, wormhole: boolean) {
    let planet: Planet | null | undefined = null;

    if (this.planets.length > 0) {
      if (wormhole) {
        planet = this.planets.find(p => p.isWormhole && p.solarSystem === s.wormhole);
      } else {
        planet = this.planets.find(p => !p.isWormhole && p.solarSystem === s);
      }
    }

    this.selectedPlanet = planet;
    this.selectedSystem = s;
    this.selectedWormhole = wormhole;
    if (this.delegate) {
      this.delegate.galaxyViewSelectedSolarSystem(this, s, wormhole);
    }
    this.requestDraw();
    this.nameCanvas();

    if (this.zoomed) {
      this.showSystemInfo(wormhole ? s.wormhole! : s);
    }
  }

  // What a screen reader says for the map, which is otherwise only a picture.
  private nameCanvas() {
    const near = this.selectedSystem;
    const selected = this.selectedWormhole ? near?.wormhole : near;
    this.canvas.setAttribute('role', 'img');
    this.canvas.ariaLabel = selected ? `Star map. Selected: ${selected.name}` : 'Star map';
  }

  private showSystemInfo(realSystem: SolarSystem) {
    let systemInfoEl = document.getElementById('gv-system-info');
    if (!systemInfoEl) {
      systemInfoEl = document.createElement('div');
      systemInfoEl.id = 'gv-system-info';
      this.canvasContainer.appendChild(systemInfoEl);
      systemInfoEl.className = this.infoClass;
      systemInfoEl.dataset.mapInfo = '';
    }

    const resourceText = realSystem.visited
      ? realSystem.systemInfoString()
      : 'system details unknown';
    systemInfoEl.innerText = resourceText;
  }

  planetRadius() {
    const canvasDimension = Math.min(
      this.canvas.height / this.scale / GALAXY_HEIGHT,
      this.canvas.width / this.scale / GALAXY_WIDTH
    );
    const nonZoomedPlanetSize = (300 * canvasDimension) / 150;
    const radius = this.zoomed ? (600 * canvasDimension) / 150 : nonZoomedPlanetSize;
    return radius;
  }

  drawGalaxy(timestamp: number) {
    if (this.scaleFactorsChanged()) {
      this.planets = [];
    }
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      return;
    }

    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.planets.length <= 0) {
      this.buildPlanets();
    }

    this.drawPilotRange();
    this.drawTrackedArrow();
    this.drawPlanets();
    this.drawTrackingRings(timestamp);
    // Draw names last so they are not obscured by any planets
    if (this.showNames) {
      this.drawNames();
    }
  }

  private buildPlanets() {
    const radius = this.planetRadius();
    this.game.solarSystems.forEach(solarSystem => {
      const center = this.getPlanetPosition(solarSystem);
      this.addPlanet({ ...center, radius, solarSystem, isWormhole: false }, solarSystem);

      const wormhole = solarSystem.wormhole;
      if (wormhole) {
        const wormholePadding = Math.floor(radius / 4);
        const x = center.x + 2 * radius + wormholePadding;
        const planet = { x, y: center.y, radius, solarSystem: wormhole, isWormhole: true };
        this.addPlanet(planet, solarSystem);
      }
    });
  }

  // `owner` is the system the planet is selected by: itself, or for the far end of a
  // wormhole the system at the near end.
  private addPlanet(planet: Planet, owner: SolarSystem) {
    this.planets.push(planet);
    if (planet.isWormhole === this.selectedWormhole && owner === this.selectedSystem) {
      this.selectedPlanet = planet;
    }
  }

  private planetColor(planet: Planet) {
    // If showSpecialSystems cheat is enabled
    if (this.game.showSpecialSystems && planet.solarSystem.specialEvent !== SpecialEvent.None) {
      return SpecialSystemColor;
    }
    if (planet.isWormhole) {
      return WormholeSystemColor;
    }
    return planet.solarSystem.visited ? VisitedSystemColor : UnvisitedSystemColor;
  }

  // Draw a circle for every planet
  private drawPlanets() {
    const radius = this.planetRadius();
    this.planets.forEach(planet => {
      this.context.fillStyle = this.planetColor(planet);
      this.context.beginPath();
      this.context.arc(planet.x, planet.y, radius, 0, Math.PI * 2);
      this.context.fill();
    });
  }

  // A system's name goes above it; the far end of a wormhole has its name below.
  private drawNames() {
    const namePadding = Math.floor(this.planetRadius());
    this.context.fillStyle = LabelColor;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.font = this.labelFont;
    this.planets.forEach(planet => {
      const y = planet.isWormhole
        ? planet.y + planet.radius + namePadding
        : planet.y - planet.radius - namePadding;
      this.context.fillText(planet.solarSystem.name, planet.x, y);
    });
  }

  drawTrackingRings(timestamp: number) {
    // With reduced motion the rings stand still, at their smallest.
    const elapsedTime = this.reducedMotion.matches ? 0 : timestamp - this.animationStartTime;

    if (this.selectedPlanet) {
      this.drawTrackingRing(
        { x: this.selectedPlanet.x, y: this.selectedPlanet.y },
        'red',
        elapsedTime
      );
    }

    const selectedSolarSystem =
      this.selectedPlanet && !this.selectedWormhole ? this.selectedPlanet.solarSystem : null;

    if (this.game.trackedSystem && this.game.trackedSystem !== selectedSolarSystem) {
      const center = this.getPlanetPosition(this.game.trackedSystem);
      this.drawTrackingRing(center, 'blue', elapsedTime);
    }
  }

  drawTrackingRing(center: Point, color: string, elapsedTime: number) {
    const animationDurationMS = 1500;
    let animationProportion: number;
    const elapsedAnimationTimeMS = elapsedTime % animationDurationMS;
    if (elapsedAnimationTimeMS <= animationDurationMS / 2) {
      // Grow
      animationProportion = elapsedAnimationTimeMS / (animationDurationMS / 2);
    } else {
      // Shrink
      animationProportion =
        1 - (elapsedAnimationTimeMS - animationDurationMS / 2) / (animationDurationMS / 2);
    }

    const radiusGrowth = 0.2 * easeInOutSine(animationProportion);

    const radius = this.planetRadius() * (1.05 + radiusGrowth);

    this.context.strokeStyle = color;
    this.context.lineWidth = 2;
    this.context.beginPath();
    this.context.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.context.stroke();
  }

  drawPilotRange() {
    const currentSystemCenter = this.getPlanetPosition(this.game.commander.currentSystem);

    const range = this.game.commander.ship.fuel;

    const xyScaleFactors = this.getXYScaleFactors();
    const horizontalRadius = range * xyScaleFactors.xScaleFactor;
    const verticalRadius = range * xyScaleFactors.yScaleFactor;

    this.context.strokeStyle = 'white';
    this.context.lineWidth = 1;

    this.context.beginPath();
    this.context.ellipse(
      currentSystemCenter.x,
      currentSystemCenter.y,
      horizontalRadius,
      verticalRadius,
      0,
      0,
      2 * Math.PI
    );
    this.context.stroke();
  }

  drawTrackedArrow() {
    if (!this.game.trackedSystem || this.game.commander.currentSystem === this.game.trackedSystem) {
      return;
    }

    const currentSystemCenter = this.getPlanetPosition(this.game.commander.currentSystem);
    const trackedSystemCenter = this.getPlanetPosition(this.game.trackedSystem);

    const unitVector = {
      x: trackedSystemCenter.x - currentSystemCenter.x,
      y: trackedSystemCenter.y - currentSystemCenter.y,
    };
    const magnitude = Math.sqrt(this.squaredDistance(currentSystemCenter, trackedSystemCenter));
    unitVector.x /= magnitude;
    unitVector.y /= magnitude;

    const arrowLength = 3 * this.planetRadius();
    const arrowEndPoint = {
      x: currentSystemCenter.x + unitVector.x * arrowLength,
      y: currentSystemCenter.y + unitVector.y * arrowLength,
    };

    // Find the start points: rotate our unit vector 90 degrees both directions then multiply by the radius of the planet
    const clockwiseUnitVector = { x: -unitVector.y, y: unitVector.x };
    const ccwUnitVector = { x: -clockwiseUnitVector.x, y: -clockwiseUnitVector.y };

    const lineWidth = 1;
    const planetEdge = this.planetRadius() * 0.85;
    const start1 = {
      x: currentSystemCenter.x + clockwiseUnitVector.x * planetEdge,
      y: currentSystemCenter.y + clockwiseUnitVector.y * planetEdge,
    };
    const start2 = {
      x: currentSystemCenter.x + ccwUnitVector.x * planetEdge,
      y: currentSystemCenter.y + ccwUnitVector.y * planetEdge,
    };

    this.context.strokeStyle = 'white';
    this.context.lineCap = 'round';
    this.context.lineWidth = lineWidth;

    this.context.beginPath();
    this.context.moveTo(start1.x, start1.y);
    this.context.lineTo(arrowEndPoint.x, arrowEndPoint.y);
    this.context.stroke();

    this.context.beginPath();
    this.context.moveTo(start2.x, start2.y);
    this.context.lineTo(arrowEndPoint.x, arrowEndPoint.y);
    this.context.stroke();
  }

  squaredDistance(p1: Point, p2: Point) {
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  }

  // Returns { xMin, xMax, yMin, yMax } of all solarSystems
  getSolarSystemBounds() {
    if (this.solarSystemBounds) {
      return this.solarSystemBounds;
    }

    const bounds = { xMin: GALAXY_WIDTH, xMax: 0, yMin: GALAXY_HEIGHT, yMax: 0 };
    this.game.solarSystems.forEach(solarSystem => {
      bounds.xMin = Math.min(solarSystem.x, bounds.xMin);
      bounds.xMax = Math.max(solarSystem.x, bounds.xMax);
      bounds.yMin = Math.min(solarSystem.y, bounds.yMin);
      bounds.yMax = Math.max(solarSystem.y, bounds.yMax);
    });

    this.solarSystemBounds = bounds;

    return bounds;
  }

  getPixelEdgeBuffer() {
    const pixelEdgeBuffer = this.zoomed ? 0 : GalaxyViewEdgeBuffer;
    return pixelEdgeBuffer;
  }

  getXYScaleFactors() {
    const solarSystemBounds = this.getSolarSystemBounds();

    const occupiedGalaxyWidth = solarSystemBounds.xMax - solarSystemBounds.xMin;
    const occupiedGalaxyHeight = solarSystemBounds.yMax - solarSystemBounds.yMin;

    const pixelEdgeBuffer = this.getPixelEdgeBuffer();

    const viewRadius = this.game.commander.ship.fuelTankCapacity() * 1.5;
    const viewWidthInGalaxyPoints = this.zoomed ? viewRadius * 2 : occupiedGalaxyWidth;
    const viewHeightInGalaxyPoints = this.zoomed ? viewRadius * 2 : occupiedGalaxyHeight;

    const horizontalScale =
      (this.canvas.width / this.scale - 2 * pixelEdgeBuffer) / viewWidthInGalaxyPoints;
    const verticalScale =
      (this.canvas.height / this.scale - 2 * pixelEdgeBuffer) / viewHeightInGalaxyPoints;

    if (this.zoomed) {
      // Prefer to have a square aspect ratio when zoomed so pilot range is a perfect circle
      const maxScale = Math.min(horizontalScale, verticalScale);
      return { xScaleFactor: maxScale, yScaleFactor: maxScale };
    }

    return { xScaleFactor: horizontalScale, yScaleFactor: verticalScale };
  }

  getPlanetPosition(solarSystem: SolarSystem) {
    const solarSystemBounds = this.getSolarSystemBounds();

    const xyScaleFactors = this.getXYScaleFactors();
    const horizontalScale = xyScaleFactors.xScaleFactor;
    const verticalScale = xyScaleFactors.yScaleFactor;

    const x = solarSystem.x;
    const y = solarSystem.y;

    const drawXOffset = this.zoomed ? 0 : solarSystemBounds.xMin;
    const drawYOffset = this.zoomed ? 0 : solarSystemBounds.yMin;
    let drawX = Math.floor((x - drawXOffset) * horizontalScale);
    let drawY = Math.floor((y - drawYOffset) * verticalScale);

    if (this.zoomed) {
      const centerX = Math.floor(this.game.commander.currentSystem.x * horizontalScale);
      const centerY = Math.floor(this.game.commander.currentSystem.y * verticalScale);

      drawX = drawX - centerX + Math.floor(this.canvas.width / this.scale / 2);
      drawY = drawY - centerY + Math.floor(this.canvas.height / this.scale / 2);
    }

    const pixelEdgeBuffer = this.getPixelEdgeBuffer();
    const retX = drawX + pixelEdgeBuffer;
    const retY = drawY + pixelEdgeBuffer;
    return { x: retX, y: retY };
  }
}

// Leaving a system: what stops you, what it costs, and what changes when you go.
import { AccessoryType } from './Accessory.ts';
import { AlertActionType, AlertViewController } from './alerts.ts';
import type { Game } from './Game.ts';
import { runtime } from './runtime.ts';
import type { SolarSystem } from './SolarSystem.ts';
import { ExperimentQuestStatus, WildQuestStatus } from './SolarSystem.types.ts';
import { FABRIC_RIP_PROBABILITY_INITIAL } from './SpecialEventSpecifier.ts';
import { ensureBool, ensureInteger, ensureType } from './ensure.ts';
import { pLog } from './probes.ts';

export const WARP_START_CLICKS = 21;

// Called when the trip starts, with where it began, where it really goes, and whether the
// commander had been there before.
export type Begin = (origin: SolarSystem, destination: SolarSystem, wasVisited: boolean) => void;

export function systemsWithinRange(game: Game): SolarSystem[] {
  return game.solarSystemsWithinRange().filter(system => system !== game.commander.currentSystem);
}

// Jonathan Wild will not travel in a ship without at least a beam laser.
function wildRefuses(game: Game): boolean {
  if (game.wildStatus !== WildQuestStatus.OnBoard) return false;
  const power = game.commander.ship.weaponPowerBetweenMinMaxInclusive(
    AccessoryType.WeaponBeamLaser,
    AccessoryType.WeaponLast
  );
  if (power <= 0) pLog.log(128);
  return power <= 0;
}

// The cash left after the costs of leaving, and the first cost that cannot be met.
function costOfLeaving(game: Game, destination: SolarSystem) {
  const { commander } = game;
  let credits = commander.credits - commander.ship.mercenaryPricePerDay();
  let shortfall =
    credits < 0
      ? "You don't have enough cash to pay your mercenaries to come on this trip. Fire them or make sure you have enough cash."
      : null;
  if (commander.hasInsurance) {
    credits -= commander.currentInsuranceCost();
    if (!shortfall && credits < 0)
      shortfall =
        "You can't leave if you haven't paid your insurance. If you have no way to pay, you should stop your insurance at the bank.";
  }
  credits -= commander.wormholeTaxToWarpToSystem(destination);
  if (!shortfall && credits < 0)
    shortfall = "You don't have enough money to pay for the wormhole tax.";
  ensureInteger(credits);
  return { credits, shortfall };
}

// Why the commander cannot leave, if anything. Wild comes first, as in the original game,
// so his question is never shown with another refusal's text.
function refusal(
  game: Game,
  origin: SolarSystem,
  wild: boolean,
  viaSingularity: boolean,
  shortfall: string | null
): string | null {
  if (wild) {
    return `Jonathan Wild isn't about to go with you if you're not armed with at least a Beam Laser. He'd rather take his chances hiding out here on ${origin.name}.`;
  }
  if (!viaSingularity && game.commander.debtIsTooLargeToBuy()) {
    return 'Your debt is too large. You are not allowed to leave this system until your debt is lowered.';
  }
  return shortfall;
}

function refuse(text: string, wild: boolean, leaveWildBehind: () => void): void {
  const alert = new AlertViewController(text);
  alert.addAction(wild ? 'Cancel' : 'Darn!', AlertActionType.Default, null);
  if (wild) alert.addAction('He can stay!', AlertActionType.Destructive, leaveWildBehind);
  alert.presentView();
}

// Dr. Fehler's failed experiment can throw the ship off course.
function fabricRip(game: Game): string | null {
  if (
    game.experimentStatus !== ExperimentQuestStatus.ClosedTooLate ||
    game.fabricRipProbability <= 0
  )
    return null;
  if (game.fabricRipProbability === FABRIC_RIP_PROBABILITY_INITIAL) {
    return "The galaxy is abuzz with news of a terrible malfunction in Dr. Fehler's laboratory. Evidently, he was not warned in time and he performed his experiment... with disastrous results! You may not reach your planned destination!";
  }
  if (runtime.gameRand.randomIntBelow(100) < game.fabricRipProbability) {
    return "You have flown through a tear in the timespace continuum caused by Dr. Fehler's failed experiment. You may end up at some other destination!";
  }
  return null;
}

function leaveOrigin(
  game: Game,
  viaSingularity: boolean,
  destination: SolarSystem,
  credits: number
): void {
  const { commander } = game;
  commander.setCredits(credits);
  commander.ship.rechargeShieldPower();
  commander.currentSystem.inventoryReplenishCountdown = game.difficulty + 3;
  const viaWormhole = viaSingularity || commander.currentSystem.wormhole === destination;
  if (!viaWormhole)
    commander.ship.consumeFuelOverDistance(commander.currentSystem.distanceTo(destination));
  commander.arrivedViaWormhole = viaWormhole;
  game.clearBreakingNews();
}

function startTravelling(game: Game, viaSingularity: boolean): void {
  const { commander } = game;
  if (viaSingularity) {
    game.addBreakingNewsItem('Travelers Claim Sighting of Ship Materializing in Orbit!');
  } else {
    commander.payInterest();
    game.timePassed(1);
  }
  commander.travelClicksRemaining = WARP_START_CLICKS;
  commander.raided = false;
  commander.inspected = false;
  commander.litterWarning = false;
  game.healMonster();
}

function checked(game: Game, viaSingularity: boolean, destination: SolarSystem): void {
  ensureType(game, 'object');
  ensureBool(viaSingularity);
  ensureType(destination, 'object');
  ensureInteger(game.commander.credits);
}

// Leaves for `destination`, or says why not. `begin` is called when the trip starts, which
// is after the fabric-rip alert is dismissed if there is one.
export function warp(
  game: Game,
  viaSingularity: boolean,
  destination: SolarSystem,
  begin: Begin
): void {
  checked(game, viaSingularity, destination);
  const origin = game.commander.currentSystem;
  const wild = wildRefuses(game);
  const cost = viaSingularity
    ? { credits: game.commander.credits, shortfall: null }
    : costOfLeaving(game, destination);
  const problem = refusal(game, origin, wild, viaSingularity, cost.shortfall);
  if (problem)
    return refuse(problem, wild, () => leaveWildBehind(game, viaSingularity, destination, begin));

  leaveOrigin(game, viaSingularity, destination, cost.credits);
  const rip = fabricRip(game);
  if (rip) {
    destination = game.solarSystems[runtime.gameRand.randomIntBelow(game.solarSystems.length)];
    ensureType(destination, 'object');
    pLog.log(149);
  }
  startTravelling(game, viaSingularity);
  const wasVisited = destination.visited;
  game.commander.moveTo(destination);
  if (!rip) return begin(origin, destination, wasVisited);
  const alert = new AlertViewController(rip);
  alert.addAction('Dismiss', AlertActionType.Default, () => begin(origin, destination, wasVisited));
  alert.presentView();
}

function leaveWildBehind(
  game: Game,
  viaSingularity: boolean,
  destination: SolarSystem,
  begin: Begin
): void {
  pLog.log(129);
  game.wildStatus = WildQuestStatus.Closed;
  game.commander.ship.removeCrewMemberWithName('Jonathan Wild');
  warp(game, viaSingularity, destination, begin);
}

// Moves the selection one system forward or back along the systems in range, wrapping
// round. The arithmetic is the old screen's, oddities included.
export function step(index: number, count: number, forward: boolean): number {
  if (forward) {
    index += 1;
    if (index >= count) index = Math.min(index - count, count - 1);
    return index;
  }
  index -= 1;
  if (index < 0) index = Math.max(index + count, count - 1);
  return index;
}

// Fills the tank from the warp screen, when nothing is in range.
export function fillTank(game: Game): void {
  game.commander.attemptPurchaseOfFuel(game.commander.ship.fuelTankCapacity());
  game.save();
}

// The galactic chart: the list of systems, tracking one, and the portable singularity.
import { AlertActionType, AlertViewController } from './alerts.ts';
import type { Game } from './Game.ts';
import { session } from './session.ts';
import type { SolarSystem } from './SolarSystem.ts';
import { SpecialEvent, systemSizeName } from './SolarSystem.types.ts';
import { specialEventForType } from './SpecialEventSpecifier.ts';
import { techLevelName } from './TradeItem.types.ts';
import { pLog } from './Utilities.ts';

// Opening the chart sorts the game's own list of systems by name, in place. The rest of
// the game then walks the systems in that order, so this must keep happening.
export function present(game: Game): void {
  game.solarSystems.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

// The lines under a system's name: what it is like and how far away it is.
export function describe(game: Game, system: SolarSystem): string {
  const kind =
    `${systemSizeName(system.size)} ${techLevelName(system.techLevel)} ${system.politics.name}`.toLowerCase();
  const distance = `${system.distanceTo(game.commander.currentSystem)} parsecs`;
  if (!game.showSpecialSystems || system.specialEvent == SpecialEvent.None)
    return `${kind}\n${distance}`;
  const special = specialEventForType(system.specialEvent)!;
  return `${kind}\n${distance}\nSpecial: ${special.name}`;
}

export function toggleTracking(game: Game, system: SolarSystem): void {
  game.trackedSystem = game.trackedSystem === system ? null : system;
  game.save();
  session.changed();
}

export function askSingularity(
  game: Game,
  system: SolarSystem,
  warp: (system: SolarSystem) => void
): void {
  const alert = new AlertViewController(
    `Use your Portable Singularity to warp to ${system.name}? You can only use it once.`
  );
  alert.addAction('Warp!', AlertActionType.Default, () => {
    pLog.log(61);
    game.canSuperWarp = false;
    warp(system);
  });
  alert.addAction('Not now', AlertActionType.Cancel, null);
  alert.presentView();
}

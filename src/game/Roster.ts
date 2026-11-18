// The personnel roster: the commander, the crew, and who is for hire here.
import type { CrewMember } from './CrewMember.ts';
import type { Game } from './Game.ts';
import { session } from './session.ts';

export type RosterKind = 'commander' | 'crew' | 'forHire';
export type RosterSection = {
  title: string;
  kind: RosterKind;
  members: CrewMember[];
  slots: number;
};

export function rosterSections(game: Game): RosterSection[] {
  const ship = game.commander.ship;
  const crew = ship.crew ?? [];
  const mercenary = game.commander.currentSystem.mercenary;
  const forHire = mercenary && !crew.includes(mercenary) ? [mercenary] : [];
  return [
    { title: 'Commander', kind: 'commander', members: [game.commander], slots: 1 },
    { title: 'Crew Quarters', kind: 'crew', members: crew, slots: ship.model.mercenaryQuarters() },
    { title: 'For Hire', kind: 'forHire', members: forHire, slots: forHire.length },
  ];
}

export function canHire(game: Game): boolean {
  const ship = game.commander.ship;
  return ship.model.mercenaryQuarters() > ship.crewCount();
}

// `onFired` runs before the game is saved, as the old screen told its owner at that point.
export function fire(game: Game, member: CrewMember, onFired?: (member: CrewMember) => void): void {
  game.commander.ship.removeCrewMember(member);
  onFired?.(member);
  game.save();
  session.changed();
}

export function hire(game: Game, member: CrewMember): void {
  if (!canHire(game) || game.commander.ship.crew.includes(member)) return;
  game.commander.ship.addCrewMember(member);
  game.save();
  session.changed();
}

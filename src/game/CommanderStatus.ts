// The commander status screen: figures, options, and giving up.
import { AlertActionType, AlertViewController } from './alerts.ts';
import { policeRecordName, reputationName } from './Commander.ts';
import type { Game } from './Game.ts';
import { difficultyName } from './SolarSystem.types.ts';
import { pLog } from './probes.ts';

export type Skill = { name: string; base: number; withCrew: number };

export function skills(game: Game): Skill[] {
  const { commander } = game;
  const ship = commander.ship;
  return [
    {
      name: 'Pilot',
      base: commander.pilot,
      withCrew: ship.crewPilotSkillIncludingCommander(commander),
    },
    {
      name: 'Fighter',
      base: commander.fighter,
      withCrew: ship.crewFighterSkillIncludingCommander(commander),
    },
    {
      name: 'Trader',
      base: commander.trader,
      withCrew: ship.crewTraderSkillIncludingCommander(commander),
    },
    {
      name: 'Engineer',
      base: commander.engineer,
      withCrew: ship.crewEngineerSkillIncludingCommander(commander),
    },
  ];
}

export type Figure = { item: string; value: string; number?: boolean };

export function figures(game: Game): Figure[] {
  const { commander } = game;
  const kills = commander.policeKills + commander.traderKills + commander.pirateKills;
  return [
    { item: 'Time:', value: `${commander.days} days` },
    { item: 'Difficulty:', value: difficultyName(game.difficulty) },
    { item: 'Police Record:', value: policeRecordName(commander.policeRecordScore) },
    { item: 'Reputation:', value: reputationName(commander.reputationScore) },
    { item: 'Kills:', value: `${kills}`, number: true },
    { item: 'Cash:', value: `$${commander.getCredits()}`, number: true },
    { item: 'Debt:', value: `$${commander.getDebt()}`, number: true },
    { item: 'Net Worth:', value: `$${commander.netWorth()}`, number: true },
  ];
}

export type IgnoreOption =
  'alwaysIgnorePirates' | 'alwaysIgnorePolice' | 'alwaysIgnoreTraders' | 'alwaysIgnoreTradeInOrbit';

export function setIgnore(game: Game, option: IgnoreOption, on: boolean): void {
  game[option] = on;
  game.save();
  game.changed();
}

export function setReserveMoney(game: Game, on: boolean): void {
  game.commander.setReserveMoney(on);
  game.save();
  game.changed();
}

export function askToGiveUp(giveUp: () => void): void {
  const alert = new AlertViewController('Give Up?');
  alert.addAction('Abandon game', AlertActionType.Destructive, () => {
    pLog.log(64);
    giveUp();
  });
  alert.addAction('Cancel', AlertActionType.Cancel, null);
  alert.presentView();
}

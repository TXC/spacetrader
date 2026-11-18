import { AlertViewController, alertStore } from '../../game/alerts.ts';
import { Game } from '../../game/Game.ts';
import { GameRand } from '../../game/GameRand.ts';
import { runtime } from '../../game/runtime.ts';
import { DebugMode } from '../../game/ensure.ts';

// A fresh game for a rules test: a fixed galaxy, an average commander, no alerts open.
export function newGame(difficulty = 2): Game {
  runtime.debugMode = DebugMode.Assert;
  runtime.gameRand = new GameRand(1);
  AlertViewController.clearAlerts();
  const game = Game.create(difficulty, {
    name: 'Tester',
    engineer: 5,
    pilot: 5,
    fighter: 5,
    trader: 5,
  });
  game.commander.reserveMoney = false;
  return game;
}

// The alert on top, and a press of one of its buttons.
export const topAlert = () => alertStore.open.at(-1)!;
export function press(title: string): void {
  const alert = topAlert();
  alert.press(alert.actions.find(action => action.title === title)!);
}

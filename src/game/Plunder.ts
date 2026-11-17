// Taking cargo from another ship, and dumping your own to make room.
import {
  AlertActionType,
  AlertPresentationStyle,
  alertStore,
  AlertViewController,
} from './alerts.ts';
import { PoliceRecordScore } from './Commander.ts';
import type { Game } from './Game.ts';
import type { Opponent } from './Opponent.ts';
import { runtime } from './runtime.ts';
import { TradeItem } from './TradeItem.ts';
import { TradeItemType } from './TradeItem.types.ts';

export type PlunderRow = { type: number; name: string; quantity: number };
export type PlunderDelegate = { plunderViewControllerDidFinishPlundering(plunder: Plunder): void };

const LITTERING =
  'Dumping cargo in space is considered littering. If the police track your dumped goods to you it will be reflected on your criminal record. Do you really wish to dump?';

export class Plunder {
  private game: Game;
  private opponent: Opponent;
  private label: string; // "Plunder", or "Take" for an abandoned ship
  private plunderMode = true; // false while dumping
  private taken = false;
  delegate: PlunderDelegate | null = null;

  constructor(game: Game, opponent: Opponent, plunderLabel: string) {
    this.game = game;
    this.opponent = opponent;
    this.label = plunderLabel;
  }

  // Whether anything was taken.
  get plundered(): boolean {
    return this.taken;
  }

  // The word on the buttons: the plunder label, or "Dump".
  get verb(): string {
    return this.plunderMode ? this.label : 'Dump';
  }

  // Opens the alert for the current mode. Switching mode opens a new one.
  presentView(): void {
    const alert = new AlertViewController(
      this.verb,
      this.label + '_' + (this.plunderMode ? 'plunder' : 'dump')
    );
    if (this.plunderMode) {
      alert.addAction('Dump some cargo', AlertActionType.Default, () => this.switchMode(false));
      alert.addAction('Done', AlertActionType.Default, () =>
        this.delegate!.plunderViewControllerDidFinishPlundering(this)
      );
    } else {
      alert.addAction('Resume plundering', AlertActionType.Default, () => this.switchMode(true));
    }
    alert.presentationStyle = AlertPresentationStyle.High;
    alert.content = { kind: 'plunder', plunder: this };
    alert.presentView();
  }

  private switchMode(plunderMode: boolean): void {
    this.plunderMode = plunderMode;
    this.presentView();
  }

  rows(): PlunderRow[] {
    return Array.from({ length: TradeItemType.Count }, (_, type) => ({
      type,
      name: TradeItem.tradeItemForType(type)!.name,
      quantity: this.available(type),
    }));
  }

  bays(): string {
    const ship = this.game.commander.ship;
    const total = ship.totalCargoBays();
    return `Bays: ${total - ship.freeCargoBays()}/${total}`;
  }

  // One of a row's buttons: 1, 5, or everything there is.
  press(type: number, amount: 1 | 5 | 'all'): void {
    const quantity = amount === 'all' ? this.available(type) : amount;
    if (this.plunderMode) this.take(quantity, type);
    else this.dump(quantity, type);
    alertStore.changed();
  }

  private available(type: number): number {
    const ship = this.plunderMode ? this.opponent.ship : this.game.commander.ship;
    return ship.tradeItemQuantityForType(type);
  }

  private take(quantity: number, type: number): void {
    const actual = this.game.commander.ship.boughtQuantity(quantity, type, 0);
    if (actual > 0) {
      this.taken = true;
      this.opponent.ship.soldQuantity(quantity, type);
    }
  }

  // The first dump of a trip asks for confirmation, unless the record is already poor.
  private dump(quantity: number, type: number): void {
    const { commander } = this.game;
    if (commander.litterWarning || commander.policeRecordScore <= PoliceRecordScore.Dubious) {
      return this.executeDump(quantity, type);
    }
    commander.litterWarning = true;
    const alert = new AlertViewController(LITTERING);
    alert.addAction('Yes, I still want to', AlertActionType.Destructive, () => {
      this.executeDump(quantity, type);
      alertStore.changed();
    });
    alert.addAction('Nevermind!', AlertActionType.Cancel, null);
    alert.presentView();
  }

  // The police may trace the litter back to the commander.
  private executeDump(quantity: number, type: number): void {
    const { game } = this;
    if (runtime.gameRand.randomIntBelow(10) < game.difficulty + 1) {
      const score = game.commander.policeRecordScore;
      game.commander.policeRecordScore =
        score > PoliceRecordScore.Dubious ? PoliceRecordScore.Dubious : score - 1;
      game.addBreakingNewsItem(`Police Trace Orbiting Space Litter to ${game.commander.name}.`);
    }
    game.commander.attemptSaleOfItem(type, quantity, true);
  }
}

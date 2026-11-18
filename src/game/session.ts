// The one object the screens watch: the current game, which screen is showing, the map
// selection, and saving and loading. It replaces the old screens' web of delegates.
import { AlertActionType, AlertViewController } from './alerts.ts';
import { present as presentChart } from './Chart.ts';
import { Commander } from './Commander.ts';
import type { CrewMember } from './CrewMember.ts';
import { Game, GameEndStatus } from './Game.ts';
import type { GameEndedStatus, GameState } from './Game.ts';
import { News } from './News.ts';
import { runtime } from './runtime.ts';
import { parseSavedGame } from './savedGame.ts';
import { present as presentShipYard } from './ShipYard.ts';
import type { SolarSystem } from './SolarSystem.ts';
import { SpecialEvent } from './SolarSystem.types.ts';
import { specialEventForType } from './SpecialEventSpecifier.ts';
import type { SpecialEventSpecifier } from './SpecialEventSpecifier.ts';
import { readJson, writeJson } from './storage.ts';
import type { GameStorage } from './storage.ts';
import { Store } from './Store.ts';
import { Travel } from './Travel.ts';
import { pLog } from './probes.ts';
import { systemsWithinRange, warp } from './Warp.ts';

export const MAX_HIGH_SCORES = 6;
const ROWS = [
  'Special',
  'News',
  'For Hire',
  'Buy',
  'Sell',
  'Equipment',
  'Warp',
  'Ship Yard',
  'Bank',
  'Roster',
  'Commander',
  'Chart',
] as const;
export type Row = (typeof ROWS)[number];

// The coverage probes the old landing screen logged for each link.
const ROW_PROBES: Partial<Record<Row, number>> = {
  Chart: 0,
  Buy: 1,
  Sell: 2,
  Warp: 3,
  Equipment: 8,
  'Ship Yard': 9,
  'For Hire': 10,
  Roster: 10,
  News: 11,
  Bank: 12,
  Commander: 13,
};

export type NavRow = { row: Row; icon: string };
export type Skills = { engineer: number; pilot: number; fighter: number; trader: number };
type SavedGames = Record<string, GameState>;

export const CANNOT_SAVE =
  'Your game cannot be saved in this browser right now. You can keep playing, but your progress will be lost when you close the page.';
export const SAVE_REMOVED = 'A saved game could not be read and was removed.';
// The part of the map the session needs: a way to move its selection.
export type MapHandle = { selectSystem(system: SolarSystem, wormhole: boolean): void };

export class Session extends Store {
  game: Game | null = null;
  // The game that just ended, shown on the game-over screen.
  endedGame: Game | null = null;
  screen: 'newCommander' | 'landing' | 'endGame' = 'newCommander';
  loadGame = true;
  // Tests put their own storage here; otherwise the page's storage is used.
  storage: GameStorage | null = null;
  private warnedAboutSaving = false;

  // The landing screen.
  row: Row | null = null; // the sub-screen that is open; none shows the welcome
  // The navigation links as last built. Like the old screen, they are rebuilt when the
  // landing screen is shown and when the local mercenary is fired, not on every change.
  navRows: NavRow[] = [];
  activeRow: Row | null = null; // the highlighted navigation link
  opened = 0; // goes up each time a sub-screen is opened afresh
  presented = 0; // goes up each time the landing screen is rebuilt
  selection: { system: SolarSystem | null; wormhole: boolean } = { system: null, wormhole: false };
  warpSelected: SolarSystem | null = null;
  map: MapHandle | null = null;
  news: News | null = null;
  travel: Travel | null = null;

  // The map tells the session how to reach it when it appears, and that it is gone.
  setMap = (map: MapHandle | null): void => {
    this.map = map;
  };

  // ---- starting, saving and loading -------------------------------------------------

  // Shows the landing screen if there is a game, loading a saved one if allowed.
  start = (): void => {
    this.loadIfNeeded();
    this.endedGame = null;
    this.screen = this.game ? 'landing' : 'newCommander';
    if (this.game) this.presentLanding();
    else pLog.log(66);
    this.changed();
  };

  createCommander = (name: string, difficulty: number, skills: Skills): void => {
    if (this.game) return;
    const commander = new Commander(
      name,
      skills.engineer,
      skills.pilot,
      skills.fighter,
      skills.trader
    );
    commander.setReserveMoney(true);
    commander.setDifficulty(difficulty);
    this.game = new Game(difficulty, commander);
    this.game.setOnSave(this.save);
    this.game.save();
    this.start();
  };

  endGame = (status: GameEndedStatus): void => {
    pLog.log(21);
    pLog.log(70);
    const game = this.game!;
    game.endStatus = status;
    game.save();
    this.endedGame = game;
    this.game = null;
    this.screen = 'endGame';
    this.changed();
  };

  // "End Game and Start Over": back to a saved game if one is left, else a new commander.
  continueAfterEnd = (): void => {
    this.news = null;
    this.selection = { system: null, wormhole: false };
    this.start();
  };

  private get store(): GameStorage {
    return this.storage ?? runtime.stLocalStorage;
  }

  // The saved games under `key` that pass the check. Any that do not are removed from
  // storage; `removed` says whether that happened.
  private read(key: string): { games: SavedGames; removed: boolean } {
    const stored = readJson(this.store, key);
    const entries = stored && typeof stored === 'object' ? Object.entries(stored) : [];
    const games: SavedGames = {};
    for (const [id, value] of entries) {
      const state = parseSavedGame(value);
      if (state) games[id] = state;
    }
    const removed = Object.keys(games).length < entries.length;
    if (removed) this.write(key, games);
    return { games, removed };
  }

  // Storage can be full or switched off. The game goes on; the player is told once.
  private write(key: string, games: SavedGames): void {
    if (writeJson(this.store, key, games) || this.warnedAboutSaving) return;
    this.warnedAboutSaving = true;
    AlertViewController.presentAlertWithDismiss(CANNOT_SAVE);
  }

  // Loads the newest saved game that can be used, and removes the ones that cannot.
  private loadIfNeeded(): void {
    if (this.game || !this.loadGame) return;
    const { games, removed } = this.read('games');
    const unusable = this.loadNewest(games);
    unusable.forEach(id => delete games[id]);
    if (unusable.length > 0) this.write('games', games);
    if (removed || unusable.length > 0) AlertViewController.presentAlertWithDismiss(SAVE_REMOVED);
  }

  // Tries the games newest first until one loads. Returns the ids of those that failed.
  private loadNewest(games: SavedGames): string[] {
    const newestFirst = Object.keys(games).sort(
      (a, b) => Date.parse(String(games[b].lastSave)) - Date.parse(String(games[a].lastSave))
    );
    const failed: string[] = [];
    for (const id of newestFirst) {
      if (this.load(games[id])) break;
      failed.push(id);
    }
    return failed;
  }

  // A save can pass the check and still not make sense to the rules.
  private load(state: GameState): boolean {
    try {
      const game = Game.fromSerializedState(state);
      pLog.log(67);
      game.setOnSave(this.save);
      this.game = game;
      return true;
    } catch (error) {
      console.error('Could not load the saved game.', error);
      return false;
    }
  }

  // A game in progress is kept under "games"; a finished one moves to the high scores.
  private save = (game: Game): void => {
    const { games } = this.read('games');
    if (game.endStatus === GameEndStatus.None) {
      pLog.log(69);
      games[game.uniqueID] = game.serializedState();
    } else {
      delete games[game.uniqueID];
      this.addHighScore(game);
    }
    this.write('games', games);
  };

  private addHighScore(game: Game): void {
    const { games: scores } = this.read('highScoringGames');
    pLog.log(68);
    scores[game.uniqueID] = game.serializedState();
    Session.byScore(scores)
      .slice(MAX_HIGH_SCORES)
      .forEach(id => delete scores[id]);
    this.write('highScoringGames', scores);
  }

  // The ids of the saved games, best score first.
  private static byScore(scores: SavedGames): string[] {
    return Object.keys(scores).sort((a, b) => scores[b].score - scores[a].score);
  }

  highScores = (count: number): GameState[] => {
    const { games: scores } = this.read('highScoringGames');
    return Session.byScore(scores)
      .slice(0, count)
      .map(id => scores[id]);
  };

  clearHighScores = (): void => {
    pLog.log(94);
    this.write('highScoringGames', {});
  };

  // ---- the landing screen ------------------------------------------------------------

  // Rebuilds the landing screen: the welcome text, a fresh map, nothing highlighted.
  private presentLanding(): void {
    this.row = null;
    this.activeRow = null;
    this.travel = null;
    this.presented++;
    // A special event can end the game (buying the moon); then there is nothing to show.
    if (this.game) this.buildNavRows();
  }

  private buildNavRows(): void {
    const shipName = this.game!.commander.ship.model.name;
    this.navRows = this.rows().map(row => ({ row, icon: row === 'Ship Yard' ? shipName : row }));
  }

  // The navigation links on offer in the current system.
  rows = (): Row[] => {
    const game = this.game!;
    const system = game.commander.getCurrentSystem();
    const hidden = new Set<Row>();
    const crew = game.commander.ship.crew;
    if (!system.mercenary || (crew && crew.includes(system.mercenary))) {
      pLog.log(27);
      hidden.add('For Hire');
    }
    const special = specialEventForType(system.getSpecialEvent());
    if (system.getSpecialEvent() === SpecialEvent.None || special?.isHidden(game)) {
      pLog.log(28);
      hidden.add('Special');
    }
    return ROWS.filter(row => !hidden.has(row));
  };

  // A click on a navigation link.
  clickRow = (row: Row): void => {
    this.activeRow = row === 'Special' ? null : row;
    this.openRow(row);
  };

  // Opens a sub-screen afresh, doing first whatever that screen used to do when it drew.
  openRow = (row: Row): void => {
    const game = this.game!;
    this.row = row;
    this.opened++;
    const probe = ROW_PROBES[row];
    if (probe !== undefined) pLog.log(probe);
    if (row === 'Chart') presentChart(game);
    if (row === 'Ship Yard') presentShipYard(game);
    if (row === 'News') (this.news ??= new News(game)).present();
    if (row === 'Special') this.offerSpecial(game);
    if (row === 'Warp' && this.pickWarpDestination(game)) return;
    this.changed();
  };

  // With nothing picked yet, picks the nearest system on the map; the map then reports
  // the pick, which opens the warp screen again. Returns true when that happened.
  private pickWarpDestination(game: Game): boolean {
    if (!this.selection.system) {
      const current = game.commander.currentSystem;
      const nearest = systemsWithinRange(game)[0] ?? null;
      const viaWormhole = !!nearest && current.wormhole === nearest;
      this.selection = { system: viaWormhole ? current : nearest, wormhole: viaWormhole };
      if (this.selection.system) {
        this.map!.selectSystem(this.selection.system, this.selection.wormhole);
        return true;
      }
    }
    this.warpSelected = this.mapSelection();
    return false;
  }

  // The system the map selection stands for: through the wormhole, the far end.
  mapSelection = (): SolarSystem | null => {
    const { system, wormhole } = this.selection;
    return wormhole ? system!.wormhole : system;
  };

  // The player picked a system on the map.
  mapSelected = (system: SolarSystem, wormhole: boolean): void => {
    this.selection = { system, wormhole };
    this.activeRow = 'Warp';
    this.openRow('Warp');
  };

  // Prev and Next on the warp screen move the map's selection.
  warpSelect = (system: SolarSystem): void => {
    const current = this.game!.commander.currentSystem;
    const viaWormhole = current.wormhole === system;
    this.map!.selectSystem(viaWormhole ? current : system, viaWormhole);
  };

  fuelBought = (): void => {
    pLog.log(22);
    this.openRow('Warp');
  };

  blastOff = (destination: SolarSystem): void => {
    this.beginWarp(false, destination);
  };

  // The portable singularity: the warp screen opens with nothing picked, then the jump.
  singularity = (system: SolarSystem): void => {
    pLog.log(23);
    this.row = 'Warp';
    this.opened++;
    this.warpSelected = null;
    this.changed();
    this.beginWarp(true, system);
  };

  private beginWarp(viaSingularity: boolean, destination: SolarSystem): void {
    const game = this.game!;
    warp(game, viaSingularity, destination, (origin, actual, wasVisited) => {
      this.travel = new Travel(game, origin, actual, wasVisited, result => {
        if (result === 'arrived') this.completeWarp();
        else this.endGame(result);
      });
      this.changed();
      this.travel.start();
    });
  }

  private completeWarp(): void {
    this.selection = { system: null, wormhole: false };
    this.game!.save();
    this.presentLanding();
    this.changed();
  }

  // Firing the local mercenary puts "For Hire" back among the links.
  rosterFired = (member: CrewMember): void => {
    if (this.game!.commander.currentSystem.mercenary !== member) return;
    pLog.log(47);
    this.buildNavRows();
  };

  // ---- special events ----------------------------------------------------------------

  private offerSpecial(game: Game): void {
    pLog.log(14);
    const special = specialEventForType(game.commander.getCurrentSystem().getSpecialEvent())!;
    const alert = new AlertViewController(special.prompt);
    const accept = (probe: number) => () => {
      pLog.log(probe);
      this.acceptSpecial(game, special);
    };
    if (special.messageOnly) {
      alert.addAction('Dismiss', AlertActionType.Default, accept(18));
    } else {
      alert.addAction('Yes', AlertActionType.Default, accept(19));
      alert.addAction('No', AlertActionType.Cancel, () => pLog.log(20));
    }
    alert.presentView();
  }

  private acceptSpecial(game: Game, special: SpecialEventSpecifier): void {
    if (game.commander.spendingMoney() < special.price) {
      pLog.log(15);
      return AlertViewController.presentAlertWithDismiss(
        "You don't have enough cash to accept this offer."
      );
    }
    pLog.log(16);
    game.commander.setCredits(game.commander.getCredits() - special.price);
    pLog.log(17);
    special.action(game, { gameDidEndWithStatus: this.endGame });
    game.save();
    this.presentLanding();
    this.changed();
  }
}

// The session in use. Rules call session.changed() after changing the game.
export let session = new Session();

// Makes another session the one in use, for a new game on the page or in a test.
export function activate(next: Session): void {
  session = next;
}

// @ts-nocheck
import { Commander } from '../game/Commander.ts'
import { EndGameViewController } from './EndGameViewController.ts'
import { Game, GameEndStatus } from '../game/Game.ts'
import { NewCommanderViewController } from './NewCommanderViewController.ts'
import { SystemLandingViewController } from './SystemLandingViewController.ts'
import { pLog } from '../game/Utilities.ts'
import { runtime } from '../game/runtime.ts'

export const MaxHighScores = 6;

export const DivIDs = {
    NewCommander: "newCommanderDiv",
    SystemLanding: "systemLandingDiv",
};


export class ViewController {
    [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any -- old untyped code: lets typed files read its properties
    constructor(gameDiv, loadGame) {
      this.gameDiv = gameDiv
      this.loadGame = loadGame
    }

    presentView() {
      console.log("Present view");
      this.gameDiv.innerHTML = '';

      this._loadGameIfNeeded()

      if (this._game) {
        this._presentSystemLandingView()
      } else {
        this._presentNewCommanderView()
      }
    }

    _presentSystemLandingView() {
      if (!this._systemLandingViewController) {
        const slDiv = document.createElement('div');
        slDiv.id = DivIDs.SystemLanding;

        this.gameDiv.appendChild(slDiv);

        this._systemLandingViewController = new SystemLandingViewController(slDiv);

        this._systemLandingViewController.delegate = this;
      }

      this._systemLandingViewController.updateWithGame(this._game);

      this._systemLandingViewController.presentView();
    }

    _presentNewCommanderView() {
      pLog.log(66)

      const ncDiv = document.createElement('div');
      ncDiv.id = DivIDs.NewCommander;

      this.gameDiv.appendChild(ncDiv);

      let ncVC = new NewCommanderViewController(ncDiv);
      ncVC.delegate = this;
      ncVC.presentView();
    }

    _dismissNewCommanderView() {
      let ncD = document.getElementById(DivIDs.NewCommander);
      if (ncD) {
        ncD.remove();
      }
    }

    newCommanderViewControllerDidCreateCommanderWithName(controller, name, difficulty, engineer, pilot, fighter, trader) {
        if (this._game) {
            return;
        }

        let commander = new Commander(name, engineer, pilot, fighter, trader);
        commander.setReserveMoney(true);
        commander.setDifficulty(difficulty);
        this._game = new Game(difficulty, commander);
        this._setSaveBlock();
        console.log("Game:" + this._game);

        this._game.save();

        this._dismissNewCommanderView();

        this._presentSystemLandingView();
    }

    _presentEndGameViewController() {
      this.gameDiv.innerHTML = '';
      const endGameVC = new EndGameViewController(this.gameDiv, this._game, false)
      endGameVC.delegate = this
      endGameVC.presentView()
    }

    // Allow overriding in unit tests
    get localStorage() {
      return this._localStorage ? this._localStorage : runtime.stLocalStorage
    }

    _loadGameIfNeeded() {
      if (this._game || !this.loadGame) {
        return;
      }

      console.log("Loading game...")

      let userDefaults = this.localStorage;

      try {
        const saveGames = JSON.parse(userDefaults.getItem('games'))
        if (saveGames) {
          const saveGamesUUIDs = Object.keys(saveGames)
          if (saveGamesUUIDs.length) {
            console.log("There are " + saveGamesUUIDs.length + " saved games.")
            const serializedGame = saveGames[saveGamesUUIDs[0]]
            if (serializedGame) {
              const game = Game.fromSerializedState(serializedGame)
              if (game) {
                pLog.log(67)
                console.log("Loaded game")
                this._game = game
                this._setSaveBlock();
              }
            }
          }
        }
      } catch (e) {
        console.log("Caught exception in _loadGameIfNeeded. " + e + "\n" + e.stack)
      }
    }

    _setSaveBlock() {
        this._game.setSaveBlock((game) => {
            let userDefaults = this.localStorage; // Use localStorage as a replacement for NSUserDefaults

            let saveGames = JSON.parse(userDefaults.getItem('games')) || {};
            if (!saveGames) {
                saveGames = {};
            }

            if (game.endStatus !== GameEndStatus.None) {
                delete saveGames[game.uniqueID];

                let highScoreGames = JSON.parse(userDefaults.getItem('highScoringGames')) || {};
                if (!highScoreGames) {
                    highScoreGames = {};
                }

                pLog.log(68)
                highScoreGames[game.uniqueID] = game.serializedState();

                let sortedGameGuids = this.constructor.sortedHighScoringGameGUIDs(highScoreGames);

                let countGames = sortedGameGuids.length;
                for (let i = MaxHighScores; i < countGames; ++i) {
                    delete highScoreGames[sortedGameGuids[i]];
                }

                userDefaults.setItem('highScoringGames', JSON.stringify(highScoreGames));
            } else {
                let serializedState = game.serializedState();
                if (serializedState) {
                    pLog.log(69)
                    saveGames[game.uniqueID] = serializedState;
                }
            }

            userDefaults.setItem('games', JSON.stringify(saveGames));
        });
    }

    clearAllHighScoringGames() {
      pLog.log(94)
      const userDefaults = this.localStorage;
      userDefaults.setItem('highScoringGames', JSON.stringify({}));
    }

    static sortedHighScoringGameGUIDs(highScoringGames) {
        const sortedGameGuids = Object.keys(highScoringGames).sort((guid1, guid2) => {
            const game1 = highScoringGames[guid1];
            const game2 = highScoringGames[guid2];

            const score1 = game1.score;
            const score2 = game2.score;

            // Sort backwards so our array is highest score to lowest score
            return score2 - score1;
        });

        return sortedGameGuids;
    }


    // SystemLandingViewControllerDelegate
    systemLandingViewControllerGameDidEndWithStatus(controller, st) {
        pLog.log(70)
        this._game.endStatus = st
        this._game.save();

        this._presentEndGameViewController();

        this._game = null;
    }

    // EndGameViewControllerDelegate
    endGameViewControllerWantsContinue(controller) {
        this._systemLandingViewController = null;

        this.presentView();
    }

    highScoringGamesWithinCount(count) {
      let result = [];

      try {
        const highScoreGames = JSON.parse(this.localStorage.getItem('highScoringGames')) || {};
        const sortedGameGUIDs = ViewController.sortedHighScoringGameGUIDs(highScoreGames);

        const loopCount = Math.min(count, sortedGameGUIDs.length);
        for (let i = 0; i < loopCount; i++) {
          result.push(highScoreGames[sortedGameGUIDs[i]]);
        }
      } catch (e) {
        console.log("Caught exception in highScoringGamesWithinCount. " + e)
      }

      return result;
    }

}

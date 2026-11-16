// @ts-nocheck
import { SSSTViewController } from './SSSTViewController.ts'
import { MAUtils } from '../game/Utilities.ts'
import { runtime } from '../game/runtime.ts'
import './style.css'


export class SpaceTraderGame {
  constructor(gameDiv, loadGame = true) {
    this.gameDiv = gameDiv
    this.loadGame = loadGame
  }

  main() {
    console.log("SpaceTraderGame main")

    this.viewController = new SSSTViewController(this.gameDiv, this.loadGame)
    this.viewController.presentView()

    if (runtime.debugMode) {
      MAUtils.installCheats(document.getElementById('cheats'), this)
    }
  }
}

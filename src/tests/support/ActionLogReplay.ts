// Replays a recorded game by finding each recorded element on the page and using it.
// Only the tests need this, and it works on the page, so it lives with the tests.
import { GameRand } from '../../game/GameRand.ts'
import { runtime } from '../../game/runtime.ts'
import { Utils } from '../../game/Utilities.ts'
import type { SpaceTraderGame } from './SpaceTraderGame.ts'

type HackHandler = (spaceTraderGame: SpaceTraderGame) => void

export class ActionLogReplay {
  declare spaceTraderGame: SpaceTraderGame
  declare _gameRandSeed: number
  declare _idLog: string[]
  declare _eventNameLog: string[]
  declare _hackHandler: HackHandler | undefined

  // hackHandler is an optional function that will be invoked before every
  // replayed event, taking this.spaceTraderGame as an argument.
  constructor(serializedString: string, spaceTraderGame: SpaceTraderGame, hackHandler?: HackHandler) {
    const obj = JSON.parse(serializedString)
    this.spaceTraderGame = spaceTraderGame
    this._gameRandSeed = obj.gameRandSeed
    this._idLog = obj.idLog
    this._eventNameLog = obj.eventNameLog
    this._hackHandler = hackHandler
  }

  replay() {
    console.log("Starting action log replay")
    runtime.actionLog._gameRandSeed = this._gameRandSeed
    runtime.actionLog.replayInProgress = true
    console.log("Replacing runtime.gameRand instance with action log seed")
    runtime.gameRand = new GameRand(this._gameRandSeed)

    const len = this._idLog.length
    console.log(`Replaying ${len} actions...`)
    for (let i = 0; i < len; i++) {
      const elID = this._idLog[i]
      const eventName = this._eventNameLog[i]

      console.log(`Replay[${i}] ${eventName} ${elID}`)
      this.replayEvent(elID, eventName)
    }
    console.log("Finished action log replay")
    runtime.actionLog.replayInProgress = false
  }

  replayEvent(elementID: string, eventName?: string) {
    eventName = eventName ? eventName : "click"
    const replayClass = this.constructor as typeof ActionLogReplay
    replayClass.replayEvent(elementID, eventName, this.spaceTraderGame, this._hackHandler)
  }

  static replayEvent(elementID: string, eventName: string, spaceTraderGame: SpaceTraderGame, hackHandler?: HackHandler) {
    runtime.actionLog.replayInProgress = true // force async to happen immediately from now on

    if (hackHandler) {
      hackHandler(spaceTraderGame)
    }

    if (elementID === "namedEvent") {
      const eventComponents = eventName.split(/\|/);
      const actualEventName = eventComponents[0]
      const eventContext = eventComponents[1]

      const handlerObj = runtime.actionLog._namedEvents[actualEventName]
      handlerObj.handleNamedEvent(actualEventName, eventContext)
      runtime.actionLog.logNamedEvent(actualEventName, eventContext)
    } else {
      // The replayed element can be a button, link, checkbox, slider or select.
      // The log holds strings, which the page converts when they are assigned.
      const element = document.getElementById(elementID) as unknown as {
        value: string, selectedIndex: string, checked: boolean,
        click(): void, dispatchEvent(e: Event): boolean,
      } | null
      if (!element) {
        console.log(`Did not find element for ${elementID}. EventName: ${eventName}`)
        console.log(`Current replayLog: ${runtime.actionLog.serializedString()}`)
      }
      Utils.ensureType(element, "object")

      if (eventName.startsWith("slider")) {
        const eventComponents = eventName.split(/\|/);
        const actualEventName = eventComponents[1]
        const sliderValue = eventComponents[2]
        // React watches the value property, so set it through the browser's own setter,
        // and send an event that bubbles up to where React listens.
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
        setValue.call(element, sliderValue)
        let inputEvent = new Event(actualEventName, { bubbles: true })
        element!.dispatchEvent(inputEvent)
      } else if (eventName.startsWith("select")) {
        const eventComponents = eventName.split(/\|/);
        const actualEventName = eventComponents[1]
        const selectedIndex = eventComponents[2]
        element!.selectedIndex = selectedIndex
        // The event must bubble to reach React, which listens at the top of the page.
        let inputEvent = new Event(actualEventName, { bubbles: true })
        element!.dispatchEvent(inputEvent)
      } else if (eventName === "click") {
        element!.click()
      } else if (eventName === "change") {
        // A real click toggles the box and fires its change event, for old screens and React alike.
        element!.click()
      }
    }
  }
}

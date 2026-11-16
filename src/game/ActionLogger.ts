import { GameRand } from './GameRand.ts'
import { Utils } from './Utilities.ts'
import type { SpaceTraderGame } from '../legacy-ui/main.ts'
import { runtime } from './runtime.ts'

type NamedEventHandler = { handleNamedEvent(eventName: string, eventContext: string): void }
type HackHandler = (spaceTraderGame: SpaceTraderGame) => void

export class ActionLogger {
  declare _gameRandSeed: number
  declare _idLog: string[]
  declare _eventNameLog: string[]
  declare logUpdateHandler: ((log: ActionLogger) => void) | null
  declare registerEventHandler: ((elementID: string, eventName: string) => void) | null
  declare replayInProgress: boolean
  declare replayInProgressQueueAsyncClosures: boolean
  declare asyncClosureQueue: (() => void)[] | null
  declare _namedEvents: Record<string, NamedEventHandler>

  constructor(gameRandSeed: number) {
    this._gameRandSeed = gameRandSeed
    this._idLog = []
    this._eventNameLog = []
    this.logUpdateHandler = null
    this.registerEventHandler = null
    this.replayInProgress = false
    this.replayInProgressQueueAsyncClosures = false
    this.asyncClosureQueue = null
    // The old code uses an array as a name-to-handler dictionary.
    this._namedEvents = [] as unknown as Record<string, NamedEventHandler>
  }

  _logUpdated() {
    if (this.logUpdateHandler) {
      this.logUpdateHandler(this)
    }
  }

  _registerEvent(elementID: string, eventName: string) {
    if (this.registerEventHandler) {
      this.registerEventHandler(elementID, eventName)
    }
  }

  performAsync(handler: () => void, delay: number) {
    if (this.replayInProgressQueueAsyncClosures) {
      if (!this.asyncClosureQueue) {
        this.asyncClosureQueue = []
      }

      this.asyncClosureQueue.push(handler)
    } else if (this.replayInProgress) {
      handler()
    } else {
      setTimeout(() => {
        handler()
      }, delay);
    }
  }

  registerButtonEventListener(button: HTMLElement, eventName: string, handler: () => void) {
    this._registerEvent(button.id, eventName)

    button.addEventListener(eventName, () => {
      console.log("Button invoked: " + button.id + " \"" + button.textContent + "\"")
      if (!button.id) {
        throw "ActionLogger requires button to have unique id"
      }
      this._idLog.push(button.id)
      this._eventNameLog.push(eventName)
      this._logUpdated()
      handler()
    })
  }

  registerAEventListener(a: HTMLElement, eventName: string, handler: (event: Event) => void) {
    this._registerEvent(a.id, eventName)

    a.addEventListener(eventName, (event) => {
      console.log("Link invoked: " + a.id + " \"" + a.textContent + "\"")
      if (!a.id) {
        throw "ActionLogger requires a element to have unique id"
      }
      this._idLog.push(a.id)
      this._eventNameLog.push(eventName)
      this._logUpdated()
      handler(event)
    })
  }

  registerCheckboxEventListener(checkbox: HTMLElement, eventName: string, handler: (event: Event) => void) {
    this._registerEvent(checkbox.id, eventName)

    checkbox.addEventListener(eventName, (event) => {
      console.log("Checkbox invoked: " + checkbox.id)
      if (!checkbox.id) {
        throw "ActionLogger requires checkbox element to have unique id"
      }
      this._idLog.push(checkbox.id)
      this._eventNameLog.push(eventName)
      this._logUpdated()
      handler(event)
    })
  }

  registerSliderEventListener(slider: HTMLInputElement, eventName: string, handler: () => void) {
    this._registerEvent(slider.id, "slider|" + eventName)

    slider.addEventListener(eventName, () => {
      console.log("Slider changed: " + slider.id + " \"" + slider.value + "\"")
      if (!slider.id) {
        throw "ActionLogger requires slider element to have unique id"
      }
      this._idLog.push(slider.id)
      this._eventNameLog.push("slider|" + eventName + "|" + slider.value)
      this._logUpdated()
      handler()
    })
  }

  registerSelectEventListener(select: HTMLSelectElement, eventName: string, handler: () => void) {
    this._registerEvent(select.id, "select|" + eventName)

    select.addEventListener(eventName, () => {
      console.log("Select changed: " + select.id + " \"" + select.selectedIndex + "\"")
      if (!select.id) {
        throw "ActionLogger requires select element to have unique id"
      }
      this._idLog.push(select.id)
      this._eventNameLog.push("select|" + eventName + "|" + select.selectedIndex)
      this._logUpdated()
      handler()
    })
  }

  registerNamedEventListener(handlerObject: NamedEventHandler, eventName: string) {
    console.log("registering named event listener for: " + eventName)
    this._namedEvents[eventName] = handlerObject
  }

  logNamedEvent(eventName: string, eventContext: string | number) {
    // this._registerEvent(...) - not implemented

    this._idLog.push("namedEvent")
    this._eventNameLog.push(eventName + "|" + eventContext)
    this._logUpdated()
  }

  serializedString() {
    return JSON.stringify({
      idLog: this._idLog,
      eventNameLog: this._eventNameLog,
      gameRandSeed: this._gameRandSeed
    })
  }
}

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
        element!.value = sliderValue
        let inputEvent = new Event(actualEventName)
        element!.dispatchEvent(inputEvent)
      } else if (eventName.startsWith("select")) {
        const eventComponents = eventName.split(/\|/);
        const actualEventName = eventComponents[1]
        const selectedIndex = eventComponents[2]
        element!.selectedIndex = selectedIndex
        let inputEvent = new Event(actualEventName)
        element!.dispatchEvent(inputEvent)
      } else if (eventName === "click") {
        element!.click()
      } else if (eventName === "change") {
        element!.checked = !element!.checked
        let changeEvent = new Event('change')
        element!.dispatchEvent(changeEvent)
      }
    }
  }
}

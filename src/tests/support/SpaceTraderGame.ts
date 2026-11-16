// Stand-ins for the old screen objects. The recorded tests read properties such as
// `spaceTraderGame.viewController._game`; these provide those names on top of the
// session, so the recorded tests did not have to change.
import { createElement } from 'react'
import { runtime } from '../../game/runtime.ts'
import type { Game as GameRules } from '../../game/Game.ts'
import { activate, Session } from '../../game/session.ts'
import type { MockLocalStorage } from '../../game/Utilities.ts'
import { Cheats } from '../../ui/Cheats.tsx'
import { Game } from '../../ui/Game.tsx'
import { mountAlertHost } from './mountAlertHost.tsx'
import { mountReact } from './mountReact.ts'

// One mounted screen per page element at a time.
const mounted = new Map<Element, () => void>()

function mount(container: Element, element: ReturnType<typeof createElement>) {
  unmount(container)
  mounted.set(container, mountReact(container, element))
}

function unmount(container: Element) {
  // shortcut: some recorded tests empty the element by hand between two games. React can
  // no longer remove what it drew there, so that screen is simply left behind; it watches
  // a session that is no longer in use. Upgrade when the recorded tests are rewritten.
  if (container.childNodes.length > 0) mounted.get(container)?.()
  mounted.delete(container)
}

// Removes everything the stand-ins put on the page. Call between tests.
export function unmountAll() {
  for (const container of [...mounted.keys()]) unmount(container)
}

export class ViewController {
  session = new Session()
  gameDiv: Element

  constructor(gameDiv: Element, loadGame: boolean) {
    this.gameDiv = gameDiv
    this.session.loadGame = loadGame
  }

  // Null once the game has ended, as before; typed as a game because the tests read it
  // while one is running.
  get _game(): GameRules {
    return this.session.game as GameRules
  }

  get _localStorage() {
    return this.session.storage
  }

  set _localStorage(storage: Storage | MockLocalStorage | null) {
    this.session.storage = storage
  }

  // What the old landing screen object offered the tests.
  get _systemLandingViewController() {
    const session = this.session
    return {
      get _galaxyView() { return session.map },
      get _galaxyViewSystem() { return session.selection.system },
      get _galaxyViewWormhole() { return session.selection.wormhole },
      _tableRows: () => session.rows(),
    }
  }

  presentView() {
    activate(this.session)
    mountAlertHost()
    mount(this.gameDiv, createElement(Game, { session: this.session }))
    this.session.start()
  }
}

export class SpaceTraderGame {
  gameDiv: Element
  loadGame: boolean
  declare viewController: ViewController

  constructor(gameDiv: Element, loadGame = true) {
    this.gameDiv = gameDiv
    this.loadGame = loadGame
  }

  main() {
    this.viewController = new ViewController(this.gameDiv, this.loadGame)
    this.viewController.presentView()
    const cheats = document.getElementById('cheats')
    if (runtime.debugMode && cheats) mount(cheats, createElement(Cheats, { session: this.viewController.session }))
  }
}

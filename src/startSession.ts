import { ActionLogger } from './game/ActionLogger.ts'
import { GameRand } from './game/GameRand.ts'
import { runtime } from './game/runtime.ts'
import { activate, Session } from './game/session.ts'
import { DebugMode } from './game/Utilities.ts'

// Sets up what the game needs and starts it, loading a saved game if there is one.
// Call once, before anything is drawn.
export function startSession(): Session {
  const randSeed = Date.now()
  runtime.debugMode = DebugMode.Disabled
  runtime.gameRand = new GameRand(randSeed)
  runtime.actionLog = new ActionLogger(randSeed)
  runtime.stLocalStorage = localStorage
  const session = new Session()
  activate(session)
  session.start()
  return session
}

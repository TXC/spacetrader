import { ActionLogger } from './game/ActionLogger.ts'
import { GameRand } from './game/GameRand.ts'
import { runtime } from './game/runtime.ts'
import { activate, Session } from './game/session.ts'
import { DebugMode } from './game/Utilities.ts'
import { AlertHost } from './ui/AlertHost.tsx'
import { Game } from './ui/Game.tsx'

// Sets up what the game needs and starts it, loading a saved game if there is one.
function startSession(): Session {
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

// Started once, on first use. React may draw App more than once.
let appSession: Session | null = null

function App() {
  appSession ??= startSession()
  return (
    <>
      <div id="game"><Game session={appSession} /></div>
      <AlertHost />
    </>
  )
}

export default App

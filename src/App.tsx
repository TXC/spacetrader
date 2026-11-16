import { useEffect, useRef } from 'react'
import { MAGameRand } from './game/GameRand.ts'
import { runtime } from './game/runtime.ts'
import { SSSTActionLogger } from './game/SSSTActionLogger.ts'
import { MADebugMode } from './game/Utilities.ts'
import { SpaceTraderGame } from './legacy-ui/main.ts'

// Does what the inline script in old/index.html did.
function startGame(gameDiv: HTMLDivElement) {
  const randSeed = Date.now()
  runtime.debugMode = MADebugMode.Disabled
  runtime.gameRand = new MAGameRand(randSeed)
  runtime.actionLog = new SSSTActionLogger(randSeed)
  runtime.stLocalStorage = localStorage
  new SpaceTraderGame(gameDiv, true).main()
}

function App() {
  const gameDiv = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    // StrictMode runs effects twice in dev; the old screens must only be built once.
    if (started.current || !gameDiv.current) return
    started.current = true
    startGame(gameDiv.current)
  }, [])

  return <div id="game" ref={gameDiv} />
}

export default App

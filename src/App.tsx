import { useEffect, useRef } from 'react'
import { GameRand } from './game/GameRand.ts'
import { runtime } from './game/runtime.ts'
import { ActionLogger } from './game/ActionLogger.ts'
import { DebugMode } from './game/Utilities.ts'
import { SpaceTraderGame } from './legacy-ui/main.ts'

// Does what the inline script in old/index.html did.
function startGame(gameDiv: HTMLDivElement) {
  const randSeed = Date.now()
  runtime.debugMode = DebugMode.Disabled
  runtime.gameRand = new GameRand(randSeed)
  runtime.actionLog = new ActionLogger(randSeed)
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

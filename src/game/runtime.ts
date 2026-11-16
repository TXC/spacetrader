import type { MAGameRand } from './GameRand.ts'
import type { SSSTActionLogger } from './SSSTActionLogger.ts'
import type { SSSTMockLocalStorage } from './Utilities.ts'

// The old pages kept these as globals; the host fills them in before the game starts.
export const runtime = {} as {
  gameRand: MAGameRand
  actionLog: SSSTActionLogger
  stLocalStorage: Storage | SSSTMockLocalStorage
  debugMode: number
}

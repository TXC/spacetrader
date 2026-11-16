import type { MAGameRand } from './GameRand.ts'
import type { SSSTActionLogger } from './ActionLogger.ts'
import type { SSSTMockLocalStorage } from './Utilities.ts'

// The old pages kept these as globals; the host fills them in before the game starts,
// so the object starts empty.
export const runtime = {} as {
  gameRand: MAGameRand
  actionLog: SSSTActionLogger
  stLocalStorage: Storage | SSSTMockLocalStorage
  debugMode: number
}

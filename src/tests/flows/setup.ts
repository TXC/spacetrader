// Set-up and clean-up shared by every test that puts the game on the page. Import it for
// its effect.
import { afterEach, beforeAll } from 'vitest'
import { AlertViewController } from '../../game/alerts.ts'
import { runtime } from '../../game/runtime.ts'
import { DebugMode } from '../../game/Utilities.ts'
import { unmountAll } from './harness.ts'

// An error thrown inside a click handler goes to the window, not to the test that clicked.
// Keep it and fail that test.
let handlerError: unknown = null

beforeAll(() => {
  document.body.insertAdjacentHTML('beforeend', '<div id="game"></div><div id="cheats" class="hidden"></div>')
  runtime.debugMode = DebugMode.Assert
  window.addEventListener('error', (event) => { handlerError ??= event.error ?? event.message })
})

afterEach(() => {
  unmountAll()
  document.getElementById('game')!.innerHTML = ''
  AlertViewController.clearAlerts()
  const error = handlerError
  handlerError = null
  if (error) throw error
})

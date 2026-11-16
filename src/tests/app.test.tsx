import { StrictMode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, test, vi } from 'vitest'
import App from '../App.tsx'
import { SpaceTraderGame } from '../legacy-ui/main.ts'

test('App starts exactly one game under StrictMode', async () => {
  localStorage.clear()
  const main = vi.spyOn(SpaceTraderGame.prototype, 'main')
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  expect(main).toHaveBeenCalledTimes(1)
  expect(document.querySelectorAll('#game').length).toBe(1)
  expect(document.querySelectorAll('#newCommanderDiv').length).toBe(1)
  root.unmount()
  host.remove()
})

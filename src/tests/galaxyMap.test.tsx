import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { expect, test, vi } from 'vitest'
import type { GalaxyView } from '../ui/canvas/GalaxyView.ts'
import { GalaxyMap } from '../ui/GalaxyMap.tsx'
import { registerLegacyTests } from './legacySuite.ts'
import { UnitTests } from './UnitTests.ts'

registerLegacyTests('no_recorded_tests_here')

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

// The old map kept drawing for up to five seconds after it left the page, and never
// stopped listening for window resizes.
test('a map that leaves the page stops drawing and stops listening', async () => {
  const log = '{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733543535142}'
  const game = new UnitTests()._runReplayLog(log, undefined, undefined).spaceTraderGame.viewController._game
  const host = document.body.appendChild(document.createElement('div'))
  const root = createRoot(host)
  let view: GalaxyView | null = null
  const map = <GalaxyMap game={game} zoomed={false} selected={null} wormhole={false} onSelect={() => {}} viewRef={(v) => { view = v ?? view }} />
  flushSync(() => root.render(map))
  const mounted = view!
  await nextFrame()
  await nextFrame()
  const draw = vi.spyOn(mounted, 'drawGalaxy')
  const resize = vi.spyOn(mounted, 'resizeCanvasIfNeeded')
  await nextFrame()
  expect(draw).toHaveBeenCalled()

  flushSync(() => root.unmount())
  draw.mockClear()
  resize.mockClear()
  await nextFrame()
  await nextFrame()
  window.dispatchEvent(new Event('resize'))

  expect(draw).not.toHaveBeenCalled()
  expect(resize).not.toHaveBeenCalled()
  expect(host.querySelector('canvas')).toBeNull()
  host.remove()
})

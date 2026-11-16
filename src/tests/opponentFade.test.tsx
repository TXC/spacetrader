import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import { Ship, ShipModelType } from '../game/Ship.ts'
import { Opponents } from '../ui/Travel.tsx'

afterEach(() => vi.useRealTimers())

// When one opponent follows another, the old ship fades out over two seconds while the
// new one fades in. For the fade to show, the old ship must stay the same element.
test('a departing opponent stays on the page, fading, for two seconds', () => {
  vi.useFakeTimers()
  const host = document.body.appendChild(document.createElement('div'))
  const root = createRoot(host)
  const first = new Ship(ShipModelType.Gnat, 2)
  const second = new Ship(ShipModelType.Firefly, 2)
  flushSync(() => root.render(<Opponents ship={first} />))
  flushSync(() => vi.advanceTimersByTime(20))
  const firstView = host.querySelector('.battle-opponent')!
  expect(firstView.classList.contains('visible')).toBe(true)

  flushSync(() => root.render(<Opponents ship={second} />))

  const views = [...host.querySelectorAll('.battle-opponent')]
  expect(views.length).toBe(2)
  expect(views[0]).toBe(firstView)
  expect(firstView.classList.contains('visible')).toBe(false)

  flushSync(() => vi.advanceTimersByTime(2000))
  expect(host.querySelectorAll('.battle-opponent').length).toBe(1)
  expect(host.querySelector('#battle-hpContainer-enemy-Firefly')).not.toBeNull()
  flushSync(() => root.unmount())
  host.remove()
})

test('two opponents leaving in quick succession are each removed in their own time', () => {
  vi.useFakeTimers()
  const host = document.body.appendChild(document.createElement('div'))
  const root = createRoot(host)
  const ships = [ShipModelType.Gnat, ShipModelType.Firefly, ShipModelType.Mosquito].map((type) => new Ship(type, 2))
  const count = () => host.querySelectorAll('.battle-opponent').length
  flushSync(() => root.render(<Opponents ship={ships[0]} />))
  flushSync(() => root.render(<Opponents ship={ships[1]} />))
  flushSync(() => vi.advanceTimersByTime(1000))
  flushSync(() => root.render(<Opponents ship={ships[2]} />))
  expect(count()).toBe(3)

  flushSync(() => vi.advanceTimersByTime(1000))
  expect(count()).toBe(2)

  flushSync(() => vi.advanceTimersByTime(1000))
  expect(count()).toBe(1)
  flushSync(() => root.unmount())
  host.remove()
})

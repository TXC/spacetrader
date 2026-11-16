import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { expect, test } from 'vitest'
import { Ship, ShipModelType } from '../game/Ship.ts'
import { ShipView } from '../ui/ShipView.tsx'
import '../ui/style.css'

// A bar should slide when the ship is hit, not when the ship first appears.
test('a damaged ship appears with its hull bar already at the right width', () => {
  const ship = new Ship(ShipModelType.Gnat, 2)
  ship.damageHullByAmount(50)
  const host = document.body.appendChild(document.createElement('div'))
  const root = createRoot(host)

  flushSync(() => root.render(<ShipView ship={ship} enemy fade animate />))

  const bar = host.querySelector<HTMLElement>('#battle-hpBar-enemy')!
  expect(bar.style.width).toBe('50%')
  expect(getComputedStyle(bar).width).toBe('50px')
  flushSync(() => root.unmount())
  host.remove()
})

test('after it has appeared, the bar slides to a new width', async () => {
  const ship = new Ship(ShipModelType.Gnat, 2)
  const host = document.body.appendChild(document.createElement('div'))
  const root = createRoot(host)
  flushSync(() => root.render(<ShipView ship={ship} enemy fade animate />))
  const bar = host.querySelector<HTMLElement>('#battle-hpBar-enemy')!
  expect(getComputedStyle(bar).width).toBe('100px')
  await new Promise((resolve) => setTimeout(resolve, 50))

  ship.damageHullByAmount(50)
  flushSync(() => root.render(<ShipView ship={ship} enemy fade animate />))

  expect(bar.style.width).toBe('50%')
  expect(bar.classList.contains('bar-width-transition')).toBe(true)
  expect(getComputedStyle(bar).width).toBe('100px')
  flushSync(() => root.unmount())
  host.remove()
})

test('the bar keeps its proportion when its container changes size', () => {
  const ship = new Ship(ShipModelType.Gnat, 2)
  ship.damageHullByAmount(50)
  const host = document.body.appendChild(document.createElement('div'))
  const root = createRoot(host)
  flushSync(() => root.render(<ShipView ship={ship} enemy fade={false} />))
  const bar = host.querySelector<HTMLElement>('#battle-hpBar-enemy')!

  bar.parentElement!.style.width = '300px'

  expect(getComputedStyle(bar).width).toBe('150px')
  flushSync(() => root.unmount())
  host.remove()
})

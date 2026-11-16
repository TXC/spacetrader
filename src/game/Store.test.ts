import { expect, test, vi } from 'vitest'
import { Store } from './Store.ts'

test('changed() calls each listener once and bumps the version', () => {
  const store = new Store()
  const listener = vi.fn()
  store.subscribe(listener)

  store.changed()

  expect(listener).toHaveBeenCalledTimes(1)
  expect(store.version).toBe(1)
})

test('an unsubscribed listener is not called', () => {
  const store = new Store()
  const listener = vi.fn()
  const unsubscribe = store.subscribe(listener)

  unsubscribe()
  store.changed()

  expect(listener).not.toHaveBeenCalled()
})

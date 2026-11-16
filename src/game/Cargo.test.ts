import { expect, test } from 'vitest'
import { costLabel } from './Cargo.ts'

test('absolute prices have no sign and hide a zero price', () => {
  expect(costLabel(false, 40, 40)).toBe('$40')
  expect(costLabel(false, 0, 0)).toBe('')
})

test('relative prices carry a sign, and show $0 only when the item can be sold', () => {
  expect(costLabel(true, 12, 50)).toBe('+$12')
  expect(costLabel(true, -3, 50)).toBe('-$3')
  expect(costLabel(true, 0, 50)).toBe('$0')
  expect(costLabel(true, 0, 0)).toBe('')
})

import { expect, test } from 'vitest'
import { spendPoints, startingSkills } from './NewCommander.ts'

test('the starting skills use the whole budget', () => {
  expect(spendPoints(startingSkills(), 'pilot')).toEqual({ skills: startingSkills(), remaining: 0 })
})

test('lowering a skill frees points', () => {
  const result = spendPoints({ engineer: 5, pilot: 2, fighter: 5, trader: 5 }, 'pilot')
  expect(result.remaining).toBe(3)
})

test('raising a skill past the budget takes the points from the highest other skill', () => {
  const result = spendPoints({ engineer: 4, pilot: 9, fighter: 5, trader: 6 }, 'pilot')
  expect(result.skills).toEqual({ engineer: 4, pilot: 9, fighter: 5, trader: 2 })
  expect(result.remaining).toBe(0)
})

test('a skill cannot drop below the slider minimum, though the count says it did', () => {
  const result = spendPoints({ engineer: 10, pilot: 10, fighter: 5, trader: 5 }, 'pilot')
  expect(result.skills).toEqual({ engineer: 1, pilot: 10, fighter: 5, trader: 5 })
  expect(result.remaining).toBe(0)
})

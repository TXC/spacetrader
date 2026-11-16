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

test('when a skill is held at the slider minimum, another skill pays the last point', () => {
  const result = spendPoints({ engineer: 10, pilot: 10, fighter: 5, trader: 5 }, 'pilot')
  expect(result.skills).toEqual({ engineer: 1, pilot: 10, fighter: 5, trader: 4 })
  expect(result.remaining).toBe(0)
})

test('a jump from the start to the top never leaves more than the budget spent', () => {
  const result = spendPoints({ engineer: 10, pilot: 5, fighter: 5, trader: 5 }, 'engineer')
  expect(result.skills).toEqual({ engineer: 10, pilot: 4, fighter: 5, trader: 1 })
  expect(result.remaining).toBe(0)
})

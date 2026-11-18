// The new-commander form: sharing skill points between the four skills.
import { MAX_SKILL_LEVEL } from './Commander.ts';
import type { Skills } from './session.ts';

export const SKILL_NAMES = ['engineer', 'pilot', 'fighter', 'trader'] as const;
export type SkillName = (typeof SKILL_NAMES)[number];
export const MAX_POINTS = MAX_SKILL_LEVEL * 2;
export const SKILL_MINIMUM = 1;

export function startingSkills(): Skills {
  const each = Math.floor(MAX_POINTS / 4);
  return { engineer: each, pilot: each, fighter: each, trader: each };
}

// The changed skill first, so another skill pays for any excess; then lowest first, which
// makes the highest skill pay.
function payingOrder(skills: Skills, changed: SkillName): SkillName[] {
  return [...SKILL_NAMES].sort((a, b) => {
    if (a === changed) return -1;
    if (b === changed) return 1;
    return skills[a] !== skills[b] ? skills[a] - skills[b] : a.localeCompare(b);
  });
}

// Brings the total back within the budget after `changed` moved. The old form did this
// twice for every move, and the second pass matters: when the first holds a skill at the
// slider minimum, the total is still one over, and the second takes that point elsewhere.
export function spendPoints(
  skills: Skills,
  changed: SkillName
): { skills: Skills; remaining: number } {
  return onePass(onePass(skills, changed).skills, changed);
}

function onePass(skills: Skills, changed: SkillName): { skills: Skills; remaining: number } {
  const result = { ...skills };
  let total = 0;
  for (const name of payingOrder(skills, changed)) {
    let value = skills[name];
    const excess = total + value - MAX_POINTS;
    if (excess > 0) {
      value -= Math.min(value, excess);
      result[name] = Math.max(SKILL_MINIMUM, value);
    }
    total += value;
  }
  return { skills: result, remaining: MAX_POINTS - total };
}

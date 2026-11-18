import { EncounterType } from './types.ts';

// A famous captain: what the news says when you attack or destroy them, and what they
// offer to trade.
type Captain = { name: string; attackNews: string; destroyNews: string; prompt: string };

const AHAB: Captain = {
  name: 'Ahab',
  attackNews: 'Thug Assaults Captain Ahab!',
  destroyNews: "Destruction of Captain Ahab's Ship Causes Anger!",
  prompt:
    'Captain Ahab, one of the greatest pilots of all time, is in need of a shield for an upcoming mission. To save the time it would take to land and find a vendor, Ahab is offering to trade you some piloting lessons in exchange for one reflective shield.',
};

const CONRAD: Captain = {
  name: 'Conrad',
  attackNews: 'Captain Conrad Comes Under Attack By Criminal!',
  destroyNews: "Captain Conrad's Ship Destroyed by Villain!",
  prompt:
    "Captain Conrad, fleet historian and inventor of the modern warp drive, is in need of a laser to test her new shield design. Unfortunately, she's used up her R&D budget for the year. Instead of cash, she'll trade you some engineering lessons in exchange for one military laser.",
};

const HUIE: Captain = {
  name: 'Huie',
  attackNews: 'Famed Captain Huie Attacked by Brigand!',
  destroyNews: "Citizens Mourn Destruction of Captain Huie's Ship!",
  prompt:
    'Captain Huie, former Trade Commissioner of the Galactic Council, is in need of a laser for an upcoming mission. Huie is known for driving a hard bargain and is offering some secrets of doing business in exchange for one military laser.',
};

const CAPTAINS: Record<number, Captain> = {
  [EncounterType.FamousCaptainAhabEncounter]: AHAB,
  [EncounterType.FamousCaptainAhabAttack]: AHAB,
  [EncounterType.FamousCaptainConradEncounter]: CONRAD,
  [EncounterType.FamousCaptainConradAttack]: CONRAD,
};

// The famous captain met in this encounter. As in the original game, any encounter that is
// not Ahab's or Conrad's is Huie's.
export function captainFor(type: EncounterType): Captain {
  return CAPTAINS[type] ?? HUIE;
}

import type { Encounter } from '../Encounter.ts';

// The commander passes by. Returns whether the automatic action may repeat afterwards.
export function ignore(encounter: Encounter): boolean {
  encounter.listener.continues(false);
  return true;
}

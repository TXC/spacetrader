import type { EncounterController } from '../../EncounterController.ts';

// The commander passes by. Returns whether the automatic action may repeat afterwards.
export function ignore(encounter: EncounterController): boolean {
  encounter.listener.continues(false);
  return true;
}

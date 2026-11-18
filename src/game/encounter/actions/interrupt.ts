import { pLog } from '../../probes.ts';
import type { Encounter } from '../Encounter.ts';

// The commander stops the automatic action. Returns whether it may repeat afterwards; by
// then it is off.
export function interrupt(encounter: Encounter): boolean {
  pLog.log(52);
  encounter._endAutoEncounters();
  encounter.listener.continues(true);
  return true;
}

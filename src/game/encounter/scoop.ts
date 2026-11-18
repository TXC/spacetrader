import { AlertActionType, AlertViewController } from '../alerts.ts';
import { Difficulty } from '../SolarSystem.types.ts';
import { tradeItemForType } from '../TradeItem.ts';
import { TradeItemType, TRADE_ITEM_COUNT } from '../TradeItem.types.ts';
import { runtime } from '../runtime.ts';
import type { Encounter } from './Encounter.ts';

// A canister from the destroyed ship may drift by; the commander can pick it up.
export function scoop(encounter: Encounter, completion: () => void): void {
  let canScoop = encounter._game.commander.ship.freeCargoBays() > 0;
  canScoop =
    canScoop &&
    (encounter._game.difficulty < Difficulty.Normal ||
      runtime.gameRand.randomIntBelow(encounter._game.difficulty) === 1);

  if (canScoop) {
    let itemType = runtime.gameRand.randomIntBelow(TRADE_ITEM_COUNT);
    if (itemType >= TradeItemType.Firearms) {
      itemType = runtime.gameRand.randomIntBelow(TRADE_ITEM_COUNT);
    }

    const alertString = `A canister from the destroyed ship, labelled ${tradeItemForType(itemType).name}, drifts within range of your scoops.`;

    const aC = new AlertViewController(alertString);

    aC.addAction('Pick it up!', AlertActionType.Default, () => {
      encounter._game.commander.ship.boughtQuantity(1, itemType, 0);
      completion();
    });

    aC.addAction('Let it go', AlertActionType.Cancel, () => {
      completion();
    });

    encounter._presentAlertController(aC);

    return;
  }

  completion();
}

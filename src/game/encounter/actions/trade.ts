import { AlertActionType, AlertViewController } from '../../alerts.ts';
import type { SliderContent } from '../../alerts.ts';
import { PoliceRecordScore } from '../../Commander.ts';
import { tradeItemForType } from '../../TradeItem.ts';
import { NO_TRADE_ITEM } from '../../TradeItem.types.ts';
import { runtime } from '../../runtime.ts';
import { EncounterType } from '../types.ts';
import type { Encounter } from '../Encounter.ts';

// What a trader offers, to buy or to sell.
type Offer = {
  itemType: number;
  itemName: string;
  tradePrice: number;
  maxUnits: number;
  comparisonPrice: number;
  // Whether the commander can pay for one unit, when the trader sells.
  canAfford: boolean;
};

// The commander hears the trader's offer. Returns whether the automatic action may repeat
// afterwards.
export function trade(encounter: Encounter): boolean {
  const onlyIllegal = encounter._game.commander.policeRecordScore < PoliceRecordScore.Dubious;
  let offer: Offer = {
    itemType: NO_TRADE_ITEM,
    itemName: '',
    tradePrice: 0,
    maxUnits: 0,
    comparisonPrice: 0,
    canAfford: false,
  };

  if (encounter._type === EncounterType.TraderBuy) {
    offer = offerToBuy(encounter, onlyIllegal);
  } else if (encounter._type === EncounterType.TraderSell) {
    offer = offerToSell(encounter, onlyIllegal);
  }

  if (offer.itemType !== NO_TRADE_ITEM) {
    presentTradeAlert(encounter, offer, encounter._type === EncounterType.TraderSell);
  }
  return true;
}

function offerToBuy(encounter: Encounter, onlyIllegal: boolean): Offer {
  let tradePrice = 0;
  let maxUnits = 0;
  let comparisonPrice = 0;
  let itemName = '';

  const itemType = encounter._game.commander.ship.randomTradeableItemForSystem(
    encounter._game.commander.currentSystem,
    onlyIllegal
  );

  if (itemType !== NO_TRADE_ITEM) {
    tradePrice = encounter._game.commander.sellPriceForItem(itemType);

    if (onlyIllegal) {
      tradePrice *= runtime.gameRand.randomIntBelow(100) <= 45 ? 0.8 : 1.1;
    } else {
      tradePrice *= runtime.gameRand.randomIntBelow(100) <= 10 ? 0.9 : 1.1;
    }
    // The original keeps every step of the price a whole number.
    tradePrice = Math.floor(tradePrice);

    const tradeItem = tradeItemForType(itemType);
    itemName = tradeItem.name;
    tradePrice = Math.floor(tradePrice / tradeItem.roundOffPrice);
    tradePrice = (tradePrice + 1) * tradeItem.roundOffPrice;
    tradePrice = Math.max(tradePrice, tradeItem.minTradePrice);
    tradePrice = Math.min(tradePrice, tradeItem.maxTradePrice);

    // The trader cannot take more than its hold has room for.
    maxUnits = Math.min(
      encounter._game.commander.ship.tradeItemQuantityForType(itemType),
      encounter._opponent.ship.totalCargoBays()
    );
    comparisonPrice = encounter._game.commander.ship.tradeItemAverageBuyingPriceForType(itemType);
  }

  return { itemType, itemName, tradePrice, maxUnits, comparisonPrice, canAfford: true };
}

function offerToSell(encounter: Encounter, onlyIllegal: boolean): Offer {
  let tradePrice = 0;
  let maxUnits = 0;
  const comparisonPrice = 0;
  let itemName = '';

  const itemType = encounter._opponent.ship.randomTradeableItemForSystem(
    encounter._game.commander.currentSystem,
    onlyIllegal
  );

  if (itemType !== NO_TRADE_ITEM) {
    tradePrice = encounter._game.commander.buyPriceForItem(itemType, encounter._game.difficulty);

    if (onlyIllegal) {
      tradePrice *= runtime.gameRand.randomIntBelow(100) <= 45 ? 1.1 : 0.8;
    } else {
      tradePrice *= runtime.gameRand.randomIntBelow(100) <= 10 ? 1.1 : 0.9;
    }
    // The original keeps every step of the price a whole number.
    tradePrice = Math.floor(tradePrice);

    const tradeItem = tradeItemForType(itemType);
    itemName = tradeItem.name;
    tradePrice = Math.floor(tradePrice / tradeItem.roundOffPrice) * tradeItem.roundOffPrice;
    tradePrice = Math.max(tradePrice, tradeItem.minTradePrice);
    tradePrice = Math.min(tradePrice, tradeItem.maxTradePrice);
    const freeCargoBays = encounter._game.commander.ship.freeCargoBays();
    // No more than the trader carries, than fits, and than the commander can pay for.
    maxUnits = Math.min(
      encounter._opponent.ship.tradeItemQuantityForType(itemType),
      freeCargoBays,
      Math.floor(encounter._game.commander.credits / tradePrice)
    );
  }

  const canAfford = tradePrice > 0 && encounter._game.commander.credits >= tradePrice;
  return { itemType, itemName, tradePrice, maxUnits, comparisonPrice, canAfford };
}

function presentTradeAlert(encounter: Encounter, offer: Offer, traderSell: boolean) {
  const { itemType, tradePrice, maxUnits } = offer;
  const { text, needsDismiss, needsAll, needsNone, needsSelected } = tradeQuestion(
    offer,
    traderSell
  );

  const aC = new AlertViewController(text);

  if (needsDismiss) {
    aC.addAction('Dismiss', AlertActionType.Default, () => {
      performTradeWithAmount(encounter, 0, itemType, tradePrice, traderSell);
    });
  }

  if (needsNone) {
    aC.addAction('None', AlertActionType.Default, () => {
      performTradeWithAmount(encounter, 0, itemType, tradePrice, traderSell);
    });
  }

  if (needsSelected) {
    aC.addAction('Selected', AlertActionType.Default, () => {
      const amount = (aC.content as SliderContent).value;
      if (amount > 0) {
        aC.completionHandler = () => {
          presentThanksForTheTrade(() => {
            performTradeWithAmount(encounter, amount, itemType, tradePrice, traderSell);
          });
        };
      } else {
        performTradeWithAmount(encounter, 0, itemType, tradePrice, traderSell);
      }
    });
  }

  if (needsAll) {
    aC.addAction('All', AlertActionType.Default, () => {
      const amount = maxUnits;
      if (amount > 0) {
        aC.completionHandler = () => {
          presentThanksForTheTrade(() => {
            performTradeWithAmount(encounter, amount, itemType, tradePrice, traderSell);
          });
        };
      }
    });
  }

  if (needsSelected) {
    const slider: SliderContent = {
      kind: 'slider',
      id: 'tradeslider',
      min: 0,
      max: maxUnits,
      value: Math.floor(maxUnits / 2),
    };
    aC.content = slider;
  }

  aC.presentView();
}

// What the trader asks, and which answers the commander is given.
function tradeQuestion(offer: Offer, traderSell: boolean) {
  const { itemName, tradePrice, maxUnits, comparisonPrice, canAfford } = offer;
  let needsDismiss: boolean;
  let needsAll = false;
  let needsNone = false;
  let needsSelected = false;

  let text: string;
  if (traderSell) {
    // A full hold still gets the question, with nothing to choose, as in the original.
    text = `The trader wants to sell ${itemName} for $${tradePrice} each. ${!canAfford ? "Unfortunately, you can't afford any." : 'How many do you wish to buy?'}`;

    needsDismiss = !canAfford;
    needsAll = maxUnits > 0;
    needsNone = canAfford;
    needsSelected = canAfford;
  } else {
    if (maxUnits > 0) {
      text = `The trader wants to buy ${itemName} and offers $${tradePrice} each. You paid about $${comparisonPrice}/unit. How many do you wish to sell?`;

      needsDismiss = false;
      needsAll = true;
      needsNone = true;
      needsSelected = true;
    } else {
      text = `The trader wants to buy ${itemName} and offers $${tradePrice} each. Unfortunately, you don't have any.`;

      needsDismiss = true;
    }
  }

  return { text, needsDismiss, needsAll, needsNone, needsSelected };
}

function presentThanksForTheTrade(completion: () => void) {
  const aC = new AlertViewController('Thanks for the trade!');
  aC.addAction('Dismiss', AlertActionType.Default, completion);
  aC.presentView();
}

export function performTradeWithAmount(
  encounter: Encounter,
  amount: number,
  itemType: number,
  tradePrice: number,
  traderSell: boolean
) {
  if (amount > 0) {
    const credits = encounter._game.commander.credits;
    if (traderSell) {
      const actualAmount = encounter._game.commander.ship.boughtQuantity(
        amount,
        itemType,
        tradePrice
      );
      encounter._game.commander.credits = credits - actualAmount * tradePrice;
      encounter._opponent.ship.soldQuantity(actualAmount, itemType);
    } else {
      encounter._game.commander.credits = credits + amount * tradePrice;
      encounter._game.commander.ship.soldQuantity(amount, itemType);
    }
  }

  encounter.listener.continues(false);
}

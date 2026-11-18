import { useState } from 'react';
import { AlertViewController } from '../game/alerts.ts';
import { buyCargo, cargoRows, sellCargo } from '../game/Cargo.ts';
import type { CargoRow, CargoView } from '../game/Cargo.ts';
import type { Game } from '../game/Game.ts';
import type { SolarSystem } from '../game/SolarSystem.ts';
import type { TradeItemType } from '../game/TradeItem.types.ts';
import { BaysCredits } from './BaysCredits.tsx';
import styles from './BuySellCargo.module.css';
import { Icon } from './Icon.tsx';
import { LoggedButton } from './Logged.tsx';
import { useSession } from './useStore.ts';
import shared from './shared.module.css';

type Props = { game: Game; buy: boolean; baseSystem?: SolarSystem };

function trade(game: Game, buy: boolean, type: TradeItemType, quantity: number) {
  if (!buy) sellCargo(game, type, quantity);
  else if (buyCargo(game, type, quantity) === 'debtTooLarge') {
    AlertViewController.presentAlertWithDismiss(
      'Your debt is too large. Nobody will trade with you.'
    );
  }
}

// "Buy 1", "5", "All": only the first button names the action, so three fit on a phone.
function Amounts({ row, onAmount }: { row: CargoRow; onAmount: (quantity: number) => void }) {
  const button = (amount: string, quantity: number) => (
    <LoggedButton
      key={row.verb + amount}
      id={`cargo_${row.name}${row.verb} ${amount}`}
      label={amount === '1' ? `${row.verb} 1` : amount}
      disabled={!row.enabled}
      onPress={() => onAmount(quantity)}
    />
  );
  return (
    <td className={shared.centredText}>
      <div className={shared.buttonGroup}>
        {button('1', 1)}
        {button('5', 5)}
        {button('All', row.quantity)}
      </div>
    </td>
  );
}

function ItemRow({ row, onAmount }: { row: CargoRow; onAmount: (quantity: number) => void }) {
  return (
    <tr>
      <td>
        <Icon name={row.name} className={shared.rowIcon} />
        {row.bold ? <b>{row.name}</b> : <span>{row.name}</span>}
      </td>
      <td className={shared.right}>{row.quantity}</td>
      <td className={shared.right}>{row.cost}</td>
      <Amounts row={row} onAmount={onAmount} />
    </tr>
  );
}

// The column names, for a screen reader.
function Headings({ buy }: { buy: boolean }) {
  return (
    <thead className={styles.unseen}>
      <tr>
        <th scope="col">Item</th>
        <th scope="col">{buy ? 'On sale' : 'In the hold'}</th>
        <th scope="col">Price</th>
        <th scope="col">Amount</th>
      </tr>
    </thead>
  );
}

function PricesHeader({
  system,
  relative,
  toggle,
}: {
  system: SolarSystem;
  relative: boolean;
  toggle: () => void;
}) {
  const label = `Show ${relative ? 'Absolute' : 'Relative'}`;
  return (
    <h4 className={shared.headerWithButtons}>
      {`Average prices on ${system.name} `}
      <div className={shared.buttonRow}>
        <LoggedButton key={label} id={'togglePrices_' + label} label={label} onPress={toggle} />
      </div>
    </h4>
  );
}

export function BuySellCargo({ game, buy, baseSystem }: Props) {
  useSession();
  const [relative, setRelative] = useState(!!baseSystem);
  const view: CargoView = { buy, baseSystem, relative };
  return (
    <>
      {baseSystem ? (
        <PricesHeader
          system={baseSystem}
          relative={relative}
          toggle={() => setRelative(!relative)}
        />
      ) : (
        <h1>{buy ? 'Buy Cargo' : 'Sell Cargo'}</h1>
      )}
      <table className={styles.cargo}>
        <Headings buy={buy} />
        <tbody>
          {cargoRows(game, view).map(row => (
            <ItemRow
              key={row.type}
              row={row}
              onAmount={quantity => trade(game, buy, row.type, quantity)}
            />
          ))}
        </tbody>
      </table>
      <BaysCredits game={game} />
    </>
  );
}

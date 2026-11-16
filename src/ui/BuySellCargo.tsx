import { useState } from 'react'
import { AlertViewController } from '../game/alerts.ts'
import { buyCargo, cargoRows, sellCargo } from '../game/Cargo.ts'
import type { CargoRow, CargoView } from '../game/Cargo.ts'
import type { Game } from '../game/Game.ts'
import { session } from '../game/session.ts'
import type { SolarSystem } from '../game/SolarSystem.ts'
import { BaysCredits } from './BaysCredits.tsx'
import { Icon } from './Icon.tsx'
import { LoggedButton } from './Logged.tsx'
import { useSession } from './useStore.ts'

type Props = { game: Game, buy: boolean, baseSystem?: SolarSystem }

function trade(game: Game, buy: boolean, type: number, quantity: number) {
  if (!buy) sellCargo(game, type, quantity)
  else if (buyCargo(game, type, quantity) === 'debtTooLarge') {
    AlertViewController.presentAlertWithDismiss('Your debt is too large. Nobody will trade with you.')
    return
  }
  session.changed()
}

function Amounts({ row, onAmount }: { row: CargoRow, onAmount: (quantity: number) => void }) {
  const button = (amount: string, quantity: number) => (
    <LoggedButton
      key={row.verb + amount}
      id={`cargo_${row.name}${row.verb} ${amount}`}
      label={`${row.verb} ${amount}`}
      disabled={!row.enabled}
      onPress={() => onAmount(quantity)}
    />
  )
  return <td className="centered-cell">{button('1', 1)}{button('5', 5)}{button('All', row.quantity)}</td>
}

function ItemRow({ row, onAmount }: { row: CargoRow, onAmount: (quantity: number) => void }) {
  return (
    <tr>
      <td><Icon name={row.name} className="table-row-icon" />{row.bold ? <b>{row.name}</b> : <span>{row.name}</span>}</td>
      <td className="right-aligned-cell">{row.quantity}</td>
      <td className="right-aligned-cell">{row.cost}</td>
      <Amounts row={row} onAmount={onAmount} />
    </tr>
  )
}

function PricesHeader({ system, relative, toggle }: { system: SolarSystem, relative: boolean, toggle: () => void }) {
  const label = `Show ${relative ? 'Absolute' : 'Relative'}`
  return (
    <h4 className="header-with-buttons">
      {`Average prices on ${system.getName()} `}
      <div className="button-row"><LoggedButton key={label} id={'togglePrices_' + label} label={label} onPress={toggle} /></div>
    </h4>
  )
}

export function BuySellCargo({ game, buy, baseSystem }: Props) {
  useSession()
  const [relative, setRelative] = useState(!!baseSystem)
  const view: CargoView = { buy, baseSystem, relative }
  return (
    <>
      {baseSystem
        ? <PricesHeader system={baseSystem} relative={relative} toggle={() => setRelative(!relative)} />
        : <h1>{buy ? 'Buy Cargo' : 'Sell Cargo'}</h1>}
      <table className="tight-table"><tbody>
        {cargoRows(game, view).map((row) => (
          <ItemRow key={row.type} row={row} onAmount={(quantity) => trade(game, buy, row.type, quantity)} />
        ))}
      </tbody></table>
      <BaysCredits game={game} />
    </>
  )
}

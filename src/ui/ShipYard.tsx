import type { Game } from '../game/Game.ts'
import type { ShipModel } from '../game/Ship.ts'
import { buyEscapePod, buyFuel, buyRepairs, buyShip, fuelLines, kEscapePodPrice, repairLines, setAutoFuel, setAutoRepairs, shipOffers } from '../game/ShipYard.ts'
import type { ShipOffer } from '../game/ShipYard.ts'
import { BaysCredits } from './BaysCredits.tsx'
import { Lines } from './Lines.tsx'
import { LoggedButton, LoggedCheckbox } from './Logged.tsx'
import { ShipView } from './ShipView.tsx'
import { useSession } from './useStore.ts'

type GameProps = { game: Game }

function Fuel({ game }: GameProps) {
  const { text, needed } = fuelLines(game)
  return (
    <div className="centered-div centered" id="fuelDiv">
      <Lines text={text} /><br />
      {needed > 0 && (
        <>
          <LoggedButton id="buy1unit" label="Buy 1 unit" onPress={() => buyFuel(game, 1)} />
          <LoggedButton id="buy5units" label="5 units" onPress={() => buyFuel(game, 5)} />
          <LoggedButton id="fulltank" label="Full tank" onPress={() => buyFuel(game, 'full')} />
          <br />
        </>
      )}
      <LoggedCheckbox id="autoFuelCheckbox" checked={game.autoFuel} onToggle={(on) => setAutoFuel(game, on)}>Automatically fill tanks upon arrival</LoggedCheckbox>
    </div>
  )
}

function RepairButtons({ game }: GameProps) {
  return (
    <>
      <br />
      <LoggedButton label="Buy 1 repair" onPress={() => buyRepairs(game, 1)} />
      <LoggedButton label="5 repairs" onPress={() => buyRepairs(game, 5)} />
      <LoggedButton label="Full repair" onPress={() => buyRepairs(game, 'full')} />
    </>
  )
}

function EscapePodButton({ game }: GameProps) {
  const label = `Buy an escape pod for $${kEscapePodPrice}`
  const tooPoor = game.commander.credits < kEscapePodPrice
  return <><br /><LoggedButton id="buy_escape_pod" label={label} disabled={tooPoor} onPress={() => buyEscapePod(game)} /></>
}

function Repairs({ game }: GameProps) {
  const { text, needed } = repairLines(game)
  const hasPod = game.commander.hasEscapePod
  return (
    <div id="repairDiv">
      <Lines text={text} />
      {hasPod && <><br />You have an escape pod installed.</>}
      {needed > 0 && <RepairButtons game={game} />}
      <br />
      <LoggedCheckbox id="autoRepairCheckbox" checked={game.autoRepairs} onToggle={(on) => setAutoRepairs(game, on)}>Automatically buy repairs upon arrival</LoggedCheckbox>
      <br />
      {!hasPod && <EscapePodButton game={game} />}
    </div>
  )
}

function count(name: string, x: number) {
  return `${x} ${name}${x === 1 ? '' : 's'}`
}

function details(model: ShipModel): string {
  return [
    count('mercenary quarter', model.mercenaryQuarters()),
    count('gadget slot', model.gadgetSlots),
    count('weapon slot', model.weaponSlots),
    count('shield slot', model.shieldSlots),
    count('cargo bay', model.cargoBays),
    count('fuel tank', model.fuelTanks),
    `${model.hullStrength} hull strength`,
  ].join('\n')
}

function ShipRow({ game, offer }: GameProps & { offer: ShipOffer }) {
  const { model, priceText, canBuy } = offer
  return (
    <tr>
      <td><img className="full-width-img" src={model.shipImage.generatePNG(3)} /><span className="centered-text">{model.name}</span></td>
      <td><Lines text={details(model)} /></td>
      <td className={priceText.includes('$') ? 'right-aligned-cell' : 'centered-cell'}>{priceText}</td>
      <td className="centered-cell"><LoggedButton id={'buyship_' + model.name} label="Buy" disabled={!canBuy} onPress={() => buyShip(game, model)} /></td>
    </tr>
  )
}

function Ships({ game }: GameProps) {
  return (
    <div id="shipsDiv">
      <h3>Ships</h3>
      <table className="tight-table"><tbody>
        <tr><th>Name</th><th>Details</th><th>Cost</th><th /></tr>
        {shipOffers(game).map((offer) => <ShipRow key={offer.model.type} game={game} offer={offer} />)}
      </tbody></table>
      <BaysCredits game={game} />
    </div>
  )
}

export function ShipYard({ game }: GameProps) {
  useSession()
  return (
    <>
      <h1 className="centered-div">Ship Yard</h1>
      <div id="maintenaceDiv">
        <Fuel game={game} />
        <br />
        <div className="shipYardCommanderShip"><ShipView ship={game.commander.ship} enemy={false} fade={false} /></div>
        <Repairs game={game} />
      </div>
      <Ships game={game} />
    </>
  )
}

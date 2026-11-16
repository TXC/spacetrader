import { borrow, borrowable, payBack, setRemindLoans, steps, toggleInsurance } from '../game/Bank.ts'
import { MAX_SAFE_PILOT_INSURANCE_DISCOUNT } from '../game/Commander.ts'
import type { Game } from '../game/Game.ts'
import { session } from '../game/session.ts'
import { AlertViewController } from '../legacy-ui/AlertViewController.ts'
import { BaysCredits } from './BaysCredits.tsx'
import { LoggedButton, LoggedCheckbox } from './Logged.tsx'
import { useSession } from './useStore.ts'

type GameProps = { game: Game }

const NO_POD = "Without an escape pod, insurance isn't useful because you will be killed if your ship is destroyed. Buy one at the Ship Yard."

function Row({ title, amount }: { title: string, amount: string }) {
  return <tr><td>{title}</td><td className="right-aligned-cell">{amount}</td></tr>
}

type StepsProps = { verb: 'Pay back' | 'Borrow', prefix: 'pay_' | 'borrow_', max: number, apply: (amount: number) => void }

function StepButtons({ verb, prefix, max, apply }: StepsProps) {
  const { tiny, medium } = steps(max)
  const act = (amount: number) => () => { apply(amount); session.changed() }
  return (
    <tr><td>
      <LoggedButton label={`${verb} $${tiny}`} onPress={act(tiny)} />
      <LoggedButton id={`${prefix}$${medium}`} label={`$${medium}`} onPress={act(medium)} />
      <LoggedButton id={`${prefix}$${max}`} label={`$${max}`} onPress={act(max)} />
    </td></tr>
  )
}

function Loans({ game }: GameProps) {
  const debt = game.commander.debt
  const credit = borrowable(game.commander)
  return (
    <table className="bankTable" style={{ borderCollapse: 'collapse' }}><tbody>
      <Row title="Current debt:" amount={`$${debt}`} />
      {debt > 0 && <StepButtons verb="Pay back" prefix="pay_" max={debt} apply={(n) => payBack(game, n)} />}
      <Row title="Available credit:" amount={`$${credit}`} />
      {credit > 0 && <StepButtons verb="Borrow" prefix="borrow_" max={credit} apply={(n) => borrow(game, n)} />}
    </tbody></table>
  )
}

function RemindLoans({ game }: GameProps) {
  const toggle = (checked: boolean) => {
    setRemindLoans(game, checked)
    session.changed()
  }
  return <LoggedCheckbox id="remindLoansCheckbox" checked={game.remindLoans} onToggle={toggle}>Remind about loans</LoggedCheckbox>
}

function InsuranceButton({ game }: GameProps) {
  const label = game.commander.hasInsurance ? 'Cancel Insurance Policy' : 'Buy Insurance Policy'
  const press = () => {
    if (toggleInsurance(game) === 'needsEscapePod') AlertViewController.presentAlertWithDismiss(NO_POD)
    session.changed()
  }
  // The key gives the button a fresh identity when its id changes with the label.
  return <LoggedButton key={label} label={label} onPress={press} />
}

function Insurance({ game }: GameProps) {
  const commander = game.commander
  const discount = Math.min(MAX_SAFE_PILOT_INSURANCE_DISCOUNT, commander.noClaim)
  return (
    <>
      <table className="bankTable" style={{ borderCollapse: 'collapse' }}><tbody>
        <Row title="Ship value:" amount={`$${commander.cargoAndShipValuationForInsurance(true)}`} />
        <Row title="Safe pilot discount:" amount={`$${discount}`} />
        <Row title="Cost:" amount={`$${commander.insurancePrice()}/day`} />
      </tbody></table>
      <InsuranceButton game={game} />
    </>
  )
}

export function Bank({ game }: GameProps) {
  useSession()
  return (
    <div className="centered-div">
      <h1 className="centered-div">Bank</h1>
      <h4>Loans</h4>
      <Loans game={game} />
      <RemindLoans game={game} />
      <br /><br />
      <h4>Insurance</h4>
      <Insurance game={game} />
      <br /><br />
      <BaysCredits game={game} />
    </div>
  )
}

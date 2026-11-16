import type { Plunder, PlunderRow } from '../game/Plunder.ts'
import { Icon } from './Icon.tsx'
import { LoggedButton } from './Logged.tsx'

type RowProps = { plunder: Plunder, row: PlunderRow }

function Amounts({ plunder, row }: RowProps) {
  const verb = plunder.verb
  const button = (amount: 1 | 5 | 'all', suffix: string, label: string) => (
    <LoggedButton key={verb + suffix} id={`cargo_${row.name}${verb} ${suffix}`} label={label} disabled={row.quantity <= 0} onPress={() => plunder.press(row.type, amount)} />
  )
  return <td>{button(1, '1', `${verb} 1`)}{button(5, '5', '5')}{button('all', 'All', 'All')}</td>
}

// The cargo table inside the plunder alert.
export function PlunderTable({ plunder }: { plunder: Plunder }) {
  return (
    <>
      <table className="tight-table"><tbody>
        {plunder.rows().map((row) => (
          <tr key={row.type}>
            <td className="left-aligned-cell"><Icon name={row.name} className="table-row-icon" /><span>{row.name}</span></td>
            <td className="right-aligned-cell">{row.quantity}</td>
            <Amounts plunder={plunder} row={row} />
          </tr>
        ))}
      </tbody></table>
      {plunder.bays()}
      <br />
    </>
  )
}

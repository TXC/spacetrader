import { Fragment, useState } from 'react'
import { askToGiveUp, figures, setIgnore, setReserveMoney, skills } from '../game/CommanderStatus.ts'
import type { IgnoreOption } from '../game/CommanderStatus.ts'
import type { Game } from '../game/Game.ts'
import type { Scores } from '../game/HallOfFame.ts'
import { HallOfFame } from './HallOfFame.tsx'
import { Lines } from './Lines.tsx'
import { LoggedButton, LoggedCheckbox } from './Logged.tsx'
import { useSession } from './useStore.ts'

type Props = { game: Game, scores: Scores, onGiveUp: () => void }
type GameProps = { game: Game }

function SkillTable({ game }: GameProps) {
  return (
    <table className="commanderTable"><tbody>
      <tr><th /><th>Skill</th><th>(Plus crew &amp; gadgets)</th></tr>
      {skills(game).map((skill) => <tr key={skill.name}><td>{skill.name}</td><td>{skill.base}</td><td>({skill.withCrew})</td></tr>)}
    </tbody></table>
  )
}

function FigureTable({ game }: GameProps) {
  return (
    <table className="commanderTable"><tbody>
      {figures(game).map((figure) => (
        <tr key={figure.item}><td>{figure.item}</td><td className={figure.number ? 'right-aligned-cell' : undefined}>{figure.value}</td></tr>
      ))}
    </tbody></table>
  )
}

const IGNORE: [id: string, option: IgnoreOption, label: string][] = [
  ['ignorePirates', 'alwaysIgnorePirates', 'Ignore pirates when possible'],
  ['ignorePolice', 'alwaysIgnorePolice', 'Ignore police when possible'],
  ['ignoreTraders', 'alwaysIgnoreTraders', 'Ignore traders when possible'],
  ['ignoreTradeInOrbit', 'alwaysIgnoreTradeInOrbit', 'Ignore offers to trade in orbit'],
]

function Options({ game }: GameProps) {
  return (
    <>
      {IGNORE.map(([id, option, label]) => (
        <Fragment key={id}>
          <LoggedCheckbox id={id} checked={game[option]} onToggle={(on) => setIgnore(game, option, on)}>{label}</LoggedCheckbox>
          <br />
        </Fragment>
      ))}
      <LoggedCheckbox id="reserveMoney" checked={game.commander.getReserveMoney()} onToggle={(on) => setReserveMoney(game, on)}>Reserve money for recurring costs</LoggedCheckbox>
    </>
  )
}

function Status({ game, onGiveUp, showHallOfFame }: GameProps & { onGiveUp: () => void, showHallOfFame: () => void }) {
  return (
    <div className="centered">
      <h1>{game.commander.name}</h1>
      <SkillTable game={game} />
      <br />
      <FigureTable game={game} />
      <br />
      <h4>Special Cargo</h4>
      <div id="cargoListDiv"><Lines text={game.specialCargoDescription()} /></div>
      <br />
      <h4>Open Quests</h4>
      <div id="questListDiv"><Lines text={game.questListDescription()} /></div>
      <br />
      <Options game={game} />
      <br /><br />
      <LoggedButton id="showhighscores" label="Commander Hall of Fame" onPress={showHallOfFame} />
      <br />
      <LoggedButton id="giveup" label="Give Up" onPress={() => askToGiveUp(onGiveUp)} />
    </div>
  )
}

export function CommanderStatus({ game, scores, onGiveUp }: Props) {
  useSession()
  const [hallOfFame, setHallOfFame] = useState(false)
  if (hallOfFame) return <HallOfFame game={game} inProgress scores={scores} />
  return <Status game={game} onGiveUp={onGiveUp} showHallOfFame={() => setHallOfFame(true)} />
}

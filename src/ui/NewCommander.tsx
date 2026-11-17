import { useState } from 'react'
import type { ChangeEvent } from 'react'
import titleImage from '../assets/spacetrader-1000.png'
import { MAX_SKILL_LEVEL } from '../game/Commander.ts'
import { MAX_POINTS, SKILL_MINIMUM, SKILL_NAMES, spendPoints, startingSkills } from '../game/NewCommander.ts'
import type { SkillName } from '../game/NewCommander.ts'
import type { Session } from '../game/session.ts'
import { Difficulty, DIFFICULTY_STR } from '../game/SolarSystem.types.ts'
import { LoggedButton } from './Logged.tsx'
import { useLogged } from './useLogged.ts'

const LABELS: Record<SkillName, string> = { engineer: 'Engineer', pilot: 'Pilot', fighter: 'Fighter', trader: 'Trader' }
const DIFFICULTIES = Array.from({ length: Difficulty.Count }, (_, level) => DIFFICULTY_STR(level))

type Change = ChangeEvent<HTMLInputElement>

function SkillRow({ name, value, onValue }: { name: SkillName, value: number, onValue: (value: number) => void }) {
  const onChange = useLogged(name, 'slider|input', (event: Change) => onValue(Number(event.target.value)), (event) => event.target.value)
  return (
    <tr>
      <td className="skill-label-cell"><span>{LABELS[name]}</span></td>
      <td><input type="range" id={name} min={SKILL_MINIMUM} max={MAX_SKILL_LEVEL} value={value} onChange={onChange} /></td>
      <td className="skill-value-cell"><span id={`${name}Val`}>{value}</span></td>
    </tr>
  )
}

function DifficultyPicker({ level, onLevel }: { level: number, onLevel: (level: number) => void }) {
  const pick = (event: ChangeEvent<HTMLSelectElement>) => onLevel(event.target.selectedIndex)
  const onChange = useLogged('difficultySelect', 'select|change', pick, (event) => String(event.target.selectedIndex))
  return (
    <div className="difficulty">
      <label>Difficulty: </label>
      <select id="difficultySelect" value={DIFFICULTIES[level]} onChange={onChange}>
        {DIFFICULTIES.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
    </div>
  )
}

export function NewCommander({ session }: { session: Session }) {
  const [name, setName] = useState('Jean-Luc')
  const [level, setLevel] = useState<number>(Difficulty.Normal)
  const [points, setPoints] = useState({ skills: startingSkills(), remaining: 0 })
  const move = (skill: SkillName) => (value: number) => setPoints(spendPoints({ ...points.skills, [skill]: value }, skill))
  return (
    <div id="newCommanderDiv">
      <div className="centered">
        <img className="landing-page-icon" src={titleImage} />
        <h1 className="centered-div main-title">Space Trader</h1>
        <h1 className="new-commander-title">New Commander</h1>
        <div>
          <label htmlFor="nameInput">Name: </label>
          <input type="text" id="nameInput" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <DifficultyPicker level={level} onLevel={setLevel} />
        <div className="skill-container">
          <table className="skill-table"><tbody>
            {SKILL_NAMES.map((skill) => <SkillRow key={skill} name={skill} value={points.skills[skill]} onValue={move(skill)} />)}
          </tbody></table>
          <div className="points">Skill Points Remaining: <span id="pointsRemaining">{points.remaining}</span> of {MAX_POINTS}</div>
        </div>
        <LoggedButton id="createCommander" kind="main" label="Begin Adventure" onPress={() => session.createCommander(name, level, points.skills)} />
      </div>
    </div>
  )
}

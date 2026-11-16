import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { sanitizedElementID } from '../game/elementId.ts'
import type { Ship } from '../game/Ship.ts'
import type { Travel } from '../game/Travel.ts'
import { TravelProgressView } from './canvas/TravelProgressView.ts'
import { Icon } from './Icon.tsx'
import { Lines } from './Lines.tsx'
import { LoggedLink } from './Logged.tsx'
import { ShipView } from './ShipView.tsx'
import { useStore } from './useStore.ts'

type Props = { travel: Travel }

// The strip showing the ship moving between the two systems. The drawing is done by
// TravelProgressView on a canvas; the trip tells it directly when the ship moves.
function TravelProgress({ travel }: Props) {
  const host = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const view = new TravelProgressView(host.current!, travel.game, travel.origin, travel.destination, travel.wasVisited)
    view.setProgress(travel.progress)
    const stopWatching = travel.watchProgress((progress) => view.setProgress(progress))
    return () => {
      stopWatching()
      view.dispose()
      view.canvasContainer.remove()
    }
  }, [travel])
  return <div id="travelProgressView" ref={host} />
}

// A number that stays the same for the same ship, to tell ships apart.
const shipKeys = new WeakMap<Ship, number>()
let nextShipKey = 0
function keyFor(ship: Ship): number {
  if (!shipKeys.has(ship)) shipKeys.set(ship, nextShipKey++)
  return shipKeys.get(ship)!
}

// Ships that were the opponent a moment ago. Each stays for two seconds, fading out,
// while its successor fades in.
function useLeaving(ship: Ship | null): Ship[] {
  const [leaving, setLeaving] = useState<Ship[]>([])
  const previous = useRef<Ship | null>(null)
  useLayoutEffect(() => {
    const gone = previous.current
    previous.current = ship
    if (!gone || gone === ship) return
    setLeaving((ships) => [...ships, gone])
    setTimeout(() => setLeaving((ships) => ships.filter((other) => other !== gone)), 2000)
  }, [ship])
  return leaving
}

function Opponents({ ship }: { ship: Ship | null }) {
  const leaving = useLeaving(ship)
  return (
    <div className="crossfade-container">
      {leaving.map((old) => <ShipView key={keyFor(old)} ship={old} enemy fade leaving animate />)}
      {ship && <ShipView key={keyFor(ship)} ship={ship} enemy fade animate />}
    </div>
  )
}

function ActionButtons({ travel, titles }: Props & { titles: string[] }) {
  return (
    <ul className="battleButtons">
      {titles.map((title) => (
        <Fragment key={title}>
          <li className="battle-button-item" />
          <LoggedLink id={sanitizedElementID('ecButton_' + title)} className="battle-button-link" onPress={() => travel.perform(title)}>
            <Icon name={title} className="battle-button-icon" />
            <span>{title}</span>
          </LoggedLink>
        </Fragment>
      ))}
    </ul>
  )
}

function Encounter({ travel }: Props) {
  const encounter = travel.encounter
  return (
    <div id="encounterDiv">
      <div id="battleViewsContainer">
        <div className="crossfade-container"><ShipView ship={travel.game.commander.ship} enemy={false} fade animate /></div>
        <Opponents ship={encounter ? encounter.opponent.ship : null} />
      </div>
      <div id="eVC_dialog"><Lines text={encounter ? encounter.encounterText() : ''} /></div>
      <div id="buttonsDiv"><ActionButtons travel={travel} titles={encounter ? encounter.encounterButtons() : []} /></div>
    </div>
  )
}

// A trip: the progress strip on top, and whatever is met on the way below it.
export function TravelScreen({ travel }: Props) {
  useStore(travel)
  return (
    <>
      <TravelProgress travel={travel} />
      <Encounter travel={travel} />
    </>
  )
}

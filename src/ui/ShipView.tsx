import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Ship } from '../game/Ship.ts'

type Props = {
  ship: Ship
  enemy: boolean
  fade: boolean          // fade in when it appears, as in an encounter
  leaving?: boolean      // fading out, about to be removed
  animate?: boolean      // bars slide to their new width instead of jumping
}

// Sets a bar's width in pixels from its container's measured width.
function sizeBar(container: HTMLElement | null, bar: HTMLElement | null, fraction: number) {
  if (container && bar) bar.style.width = `${fraction * container.getBoundingClientRect().width}px`
}

// True from a moment after the picture is on the page. Fading in starts then.
function useAppeared() {
  const [appeared, setAppeared] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setAppeared(true), 10)
    return () => clearTimeout(timer)
  }, [])
  return appeared
}

// A ship's picture with its hull and shield bars.
export function ShipView({ ship, enemy, fade, leaving, animate }: Props) {
  const hull = useRef<HTMLDivElement>(null)
  const hullBar = useRef<HTMLDivElement>(null)
  const shield = useRef<HTMLDivElement>(null)
  const shieldBar = useRef<HTMLDivElement>(null)
  const appeared = useAppeared()
  useLayoutEffect(() => {
    sizeBar(hull.current, hullBar.current, ship.hullPercentage())
    sizeBar(shield.current, shieldBar.current, ship.shieldPercentage())
  })
  const side = enemy ? 'enemy' : 'self'
  const visible = appeared && !leaving
  // The bars slide when the ship is hit, not when it first appears at its first widths.
  const slide = animate && appeared ? ' bar-width-transition' : ''
  const fading = fade ? ' battle-opponent-crossfade fade-in' : ''
  return (
    <div className={'battle-opponent' + fading + (visible ? ' visible' : '')}>
      <img className={'full-width-img' + (enemy ? ' flipped' : '')} src={ship.model.shipImage.generatePNG(3)} />
      <div ref={hull} className="hp-container" id={`battle-hpContainer-${side}-${ship.model.name}`} style={{ visibility: ship.model.hullStrength === 0 ? 'hidden' : 'visible' }}>
        <div ref={hullBar} className={'hp-bar' + slide} id={`battle-hpBar-${side}`} />
      </div>
      <div ref={shield} className="shield-container" style={{ visibility: ship.hasAnyShield() ? 'visible' : 'hidden' }}>
        <div ref={shieldBar} className={'shield-bar' + slide} />
      </div>
    </div>
  )
}

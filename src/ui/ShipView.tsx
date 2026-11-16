import { useEffect, useState } from 'react'
import type { Ship } from '../game/Ship.ts'

type Props = {
  ship: Ship
  enemy: boolean
  fade: boolean          // fade in when it appears, as in an encounter
  leaving?: boolean      // fading out, about to be removed
  animate?: boolean      // bars slide to their new width instead of jumping
}

// A bar's width as a share of its container. A ship with no hull or no shields at all
// has no meaningful share; its bar is hidden anyway.
function share(fraction: number): string {
  return `${Number.isFinite(fraction) ? fraction * 100 : 0}%`
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
  const appeared = useAppeared()
  const side = enemy ? 'enemy' : 'self'
  const visible = appeared && !leaving
  // The bars slide when the ship is hit, not when it first appears at its first widths.
  const slide = animate && appeared ? ' bar-width-transition' : ''
  const fading = fade ? ' battle-opponent-crossfade fade-in' : ''
  return (
    <div className={'battle-opponent' + fading + (visible ? ' visible' : '')}>
      <img className={'full-width-img' + (enemy ? ' flipped' : '')} src={ship.model.shipImage.generatePNG(3)} />
      <div className="hp-container" id={`battle-hpContainer-${side}-${ship.model.name}`} style={{ visibility: ship.model.hullStrength === 0 ? 'hidden' : 'visible' }}>
        <div className={'hp-bar' + slide} id={`battle-hpBar-${side}`} style={{ width: share(ship.hullPercentage()) }} />
      </div>
      <div className="shield-container" style={{ visibility: ship.hasAnyShield() ? 'visible' : 'hidden' }}>
        <div className={'shield-bar' + slide} style={{ width: share(ship.shieldPercentage()) }} />
      </div>
    </div>
  )
}

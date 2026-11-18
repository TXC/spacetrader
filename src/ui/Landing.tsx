import { Fragment } from 'react';
import type { Game } from '../game/Game.ts';
import { GameEndStatus } from '../game/Game.types.ts';
import type { NavRow } from '../game/session.ts';
import { Bank } from './Bank.tsx';
import { BuySellCargo } from './BuySellCargo.tsx';
import { CommanderStatus } from './CommanderStatus.tsx';
import { Equipment } from './Equipment.tsx';
import { GalacticChart } from './GalacticChart.tsx';
import { GalaxyMap } from './GalaxyMap.tsx';
import { Icon } from './Icon.tsx';
import styles from './Landing.module.css';
import { Lines } from './Lines.tsx';
import { LoggedLink } from './Logged.tsx';
import { News } from './News.tsx';
import { maintainScrollPosition } from './scroll.ts';
import { Roster } from './Roster.tsx';
import { ShipYard } from './ShipYard.tsx';
import { TravelScreen } from './Travel.tsx';
import { useSession } from './useStore.ts';
import { Warp } from './Warp.tsx';
import shared from './shared.module.css';

type Props = { game: Game };

function NavLink({ link }: { link: NavRow }) {
  const session = useSession();
  const { row, icon } = link;
  // Opening a screen changes the page's height; keep the player where they were.
  const open = () => maintainScrollPosition(() => session.clickRow(row));
  return (
    <li>
      <LoggedLink id={row} current={session.activeRow === row} onPress={open}>
        <Icon name={icon} className={row === 'Chart' ? styles.chartIcon : shared.buttonIcon} />
        <span>{row}</span>
      </LoggedLink>
    </li>
  );
}

// The map and the navigation links. Hidden while travelling.
function Options({ game }: Props) {
  const session = useSession();
  return (
    <div id="systemLandingOptionsDiv">
      <GalaxyMap
        key={session.presented}
        game={game}
        zoomed
        selected={game.commander.currentSystem}
        wormhole={false}
        onSelect={session.mapSelected}
        selection={session.selection}
      />
      <ul id="subVCButtonsDiv" className={styles.navigation}>
        {session.navRows.map(link => (
          <NavLink key={link.row} link={link} />
        ))}
      </ul>
    </div>
  );
}

function Welcome({ game }: { game: Game }) {
  const system = game.commander.currentSystem;
  return (
    <>
      <h1 id="system-info-welcome" className={styles.welcome}>
        {'Welcome to ' + system.name}
      </h1>
      <h4 id="system-info-text" className={styles.systemInfo}>
        <Lines text={system.systemInfoString()} />
      </h4>
    </>
  );
}

function SubScreen({ game }: Props) {
  const session = useSession();
  switch (session.row) {
    case null:
      return <Welcome game={game} />;
    case 'Chart':
      return <GalacticChart game={game} onSingularity={session.singularity} />;
    case 'Buy':
      return <BuySellCargo game={game} buy />;
    case 'Sell':
      return <BuySellCargo game={game} buy={false} />;
    case 'Warp':
      return (
        <Warp
          game={game}
          selected={session.warpSelected}
          mapSelection={session.mapSelection()}
          onSelect={session.warpSelect}
          onFuel={session.fuelBought}
          onBlastOff={session.blastOff}
        />
      );
    case 'Equipment':
      return <Equipment game={game} />;
    case 'Ship Yard':
      return <ShipYard game={game} />;
    case 'For Hire':
    case 'Roster':
      return <Roster game={game} onFired={session.rosterFired} />;
    case 'News':
      return <News game={game} news={session.news!} />;
    case 'Bank':
      return <Bank game={game} />;
    case 'Commander':
      return (
        <CommanderStatus
          game={game}
          scores={session}
          onGiveUp={() => session.endGame(GameEndStatus.Retired)}
        />
      );
    default:
      return null;
  }
}

// The planet hub: map, navigation, and the open sub-screen. During a trip only the
// trip is shown.
export function Landing({ game }: Props) {
  const session = useSession();
  const travel = session.travel;
  return (
    <div id="systemLandingDiv" className={styles.landing}>
      {!travel && <Options game={game} />}
      <div id="systemLandingSubContentDiv">
        {travel ? (
          <TravelScreen key={session.opened} travel={travel} />
        ) : (
          <Fragment key={`${session.presented}-${session.opened}`}>
            <SubScreen game={game} />
          </Fragment>
        )}
      </div>
    </div>
  );
}

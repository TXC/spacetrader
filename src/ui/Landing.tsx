import { Fragment } from 'react';
import type { Game } from '../game/Game.ts';
import { GameEndStatus } from '../game/Game.ts';
import type { NavRow, Session } from '../game/session.ts';
import { Bank } from './Bank.tsx';
import { BuySellCargo } from './BuySellCargo.tsx';
import { CommanderStatus } from './CommanderStatus.tsx';
import { Equipment } from './Equipment.tsx';
import { GalacticChart } from './GalacticChart.tsx';
import { GalaxyMap } from './GalaxyMap.tsx';
import { Icon } from './Icon.tsx';
import { Lines } from './Lines.tsx';
import { LoggedLink } from './Logged.tsx';
import { News } from './News.tsx';
import { maintainScrollPosition } from './scroll.ts';
import { Roster } from './Roster.tsx';
import { ShipYard } from './ShipYard.tsx';
import { TravelScreen } from './Travel.tsx';
import { Warp } from './Warp.tsx';
import shared from './shared.module.css';

type Props = { session: Session; game: Game };

function NavLink({ session, link }: { session: Session; link: NavRow }) {
  const { row, icon } = link;
  // Opening a screen changes the page's height; keep the player where they were.
  const open = () => maintainScrollPosition(() => session.clickRow(row));
  return (
    <li className="button-item">
      <LoggedLink
        id={row}
        className={session.activeRow === row ? 'active' : undefined}
        current={session.activeRow === row}
        onPress={open}
      >
        <Icon name={icon} className={row === 'Chart' ? 'button-icon-chart' : shared.buttonIcon} />
        <span>{row}</span>
      </LoggedLink>
    </li>
  );
}

// The map and the navigation links. Hidden while travelling.
function Options({ session, game }: Props) {
  return (
    <div id="systemLandingOptionsDiv">
      <GalaxyMap
        key={session.presented}
        game={game}
        zoomed
        selected={game.commander.currentSystem}
        wormhole={false}
        onSelect={session.mapSelected}
        viewRef={session.setMap}
      />
      <ul id="subVCButtonsDiv" className="systemLandingButtons">
        {session.navRows.map(link => (
          <NavLink key={link.row} session={session} link={link} />
        ))}
      </ul>
    </div>
  );
}

function Welcome({ game }: { game: Game }) {
  const system = game.commander.getCurrentSystem();
  return (
    <>
      <h1 id="system-info-welcome" className={`${shared.centredBlock} system-info-header`}>
        {'Welcome to ' + system.getName()}
      </h1>
      <h4
        id="system-info-text"
        className={`system-info ${shared.centredBlock} ${shared.centredText}`}
      >
        <Lines text={system.systemInfoString()} />
      </h4>
    </>
  );
}

function SubScreen({ session, game }: Props) {
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
export function Landing({ session, game }: Props) {
  const travel = session.travel;
  return (
    <div id="systemLandingDiv">
      {!travel && <Options session={session} game={game} />}
      <div id="systemLandingSubContentDiv">
        {travel ? (
          <TravelScreen key={session.opened} travel={travel} />
        ) : (
          <Fragment key={`${session.presented}-${session.opened}`}>
            <SubScreen session={session} game={game} />
          </Fragment>
        )}
      </div>
    </div>
  );
}

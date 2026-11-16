// @ts-nocheck
import { PCEImageLibrary } from '../game/Images.ts'
import { AlertActionType, AlertViewController } from '../game/alerts.ts'
import { createElement } from 'react'
import { Bank } from '../ui/Bank.tsx'
import { mountReact } from '../ui/mountReact.ts'
import { BuySellCargo } from '../ui/BuySellCargo.tsx'
import { CommanderStatus } from '../ui/CommanderStatus.tsx'
import { GameEndStatus } from '../game/Game.ts'
import { Equipment } from '../ui/Equipment.tsx'
import { present as presentChart } from '../game/Chart.ts'
import { GalacticChart } from '../ui/GalacticChart.tsx'
import { GalaxyView } from '../ui/canvas/GalaxyView.ts'
import { News } from '../game/News.ts'
import { News as NewsScreen } from '../ui/News.tsx'
import { Roster } from '../ui/Roster.tsx'
import { present as presentShipYard } from '../game/ShipYard.ts'
import { ShipYard } from '../ui/ShipYard.tsx'
import { SpecialEvent } from '../game/SolarSystem.types.ts'
import { SpecialEventSpecifier } from '../game/SpecialEventSpecifier.ts'
import { TravelViewController } from './TravelViewController.ts'
import { systemsWithinRange, warp } from '../game/Warp.ts'
import { Warp } from '../ui/Warp.tsx'
import { Utils, pLog } from '../game/Utilities.ts'
import { runtime } from '../game/runtime.ts'

export const systemLandingOptionsDivID = "systemLandingOptionsDiv";

export class SystemLandingViewController {
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any -- old untyped code: lets typed files read its properties
  constructor(div) {
    this.div = div
  }

  updateWithGame(game) {
    console.log("SystemLandingViewController updateWithGame: " + game);
    pLog.log(26)

    if (game === this._game) { return; }

    this._game = game;

    if (!this._game) { return; }

    // Tear down and recreate this view controller's content
    this.presentView();
  }

  _tableRows() {
    const tableRows = ["Special",
                       "News",
                       "For Hire", // Mercenary for Hire
                       "Buy", // Buy Cargo
                       "Sell", // Sell Cargo
                       "Equipment", // Buy and Sell Equipment
                       "Warp",
                       "Ship Yard",
                       "Bank",
                       "Roster", // Personnel Roster
                       "Commander", // Commander Status
                       "Chart",
    ]

    const currentSystemMercenary = this._game.commander.getCurrentSystem().mercenary;
    const crew = this._game.commander.ship.crew;
    if (!currentSystemMercenary || (crew && crew.includes(currentSystemMercenary))) {
      const index = tableRows.indexOf("For Hire");
      if (index !== -1) {
        pLog.log(27)
        tableRows.splice(index, 1);
      }
    }

    const specialEvent = this._game.commander.getCurrentSystem().getSpecialEvent();
    const specialEventTypeToSpecifier = SpecialEventSpecifier.specialEventTypeToSpecifier();
    const shouldHideBlock = specialEventTypeToSpecifier.get(specialEvent) && specialEventTypeToSpecifier.get(specialEvent).shouldHideBlock;

    if (specialEvent === SpecialEvent.None || (shouldHideBlock && shouldHideBlock(this._game))) {
      const index = tableRows.indexOf("Special");
      if (index !== -1) {
        pLog.log(28)
        tableRows.splice(index, 1);
      }
    }

    return tableRows
  }

  _clearedSubContentDiv() {
    const elID = "systemLandingSubContentDiv";
    let contentDiv = document.getElementById(elID);
    if (!contentDiv) {
      contentDiv = document.createElement('div');
      contentDiv.id = elID;
      this.div.appendChild(contentDiv);
    }

    this._removeReact()
    contentDiv.innerHTML = '';

    return contentDiv
  }

  // A sub-screen that is already React is mounted here until this screen is React too.
  _mountReact(contentDiv, element) {
    this._removeReact()
    this._unmountReact = mountReact(contentDiv, element)
  }

  _removeReact() {
    if (this._unmountReact) {
      this._unmountReact()
      this._unmountReact = null
    }
  }

  handleRowClick(row) {
    Utils.maintainScrollPosition(() => {
      this._handleRowClick(row)
    })
  }

  _handleRowClick(row) {
    console.log(`Row clicked: ${row}`);

    const contentDiv = this._clearedSubContentDiv()

    if (row === "Chart") {
      pLog.log(0)
      presentChart(this._game)
      const onSingularity = (solarSystem) => this.galacticChartViewControllerWarpViaSingularity(null, solarSystem)
      this._mountReact(contentDiv, createElement(GalacticChart, { game: this._game, onSingularity }))
    } else if (row === "Buy") {
      pLog.log(1)
      this._mountReact(contentDiv, createElement(BuySellCargo, { game: this._game, buy: true }))
    } else if (row === "Sell") {
      pLog.log(2)
      this._mountReact(contentDiv, createElement(BuySellCargo, { game: this._game, buy: false }))
    } else if (row === "Warp") {
      pLog.log(3)
      if (!this._galaxyViewSystem) {
        pLog.log(4)
        const closeSystems = systemsWithinRange(this._game)
        this._galaxyViewSystem = closeSystems.length > 0 ? closeSystems[0] : null
        this._galaxyViewWormhole = false
        if (this._galaxyViewSystem && this._game.commander.currentSystem.wormhole === this._galaxyViewSystem) {
          pLog.log(5)
          this._galaxyViewSystem = this._game.commander.currentSystem
          this._galaxyViewWormhole = true
        }

        if (this._galaxyViewSystem) {
          pLog.log(6)
          this._galaxyView.selectSystem(this._galaxyViewSystem, this._galaxyViewWormhole)
          return // galaxyView.selectSystem invokes delegate method that will call back into handleRowClick
        }
      }

      pLog.log(7)
      const warpSystem = this._galaxyViewWormhole ? this._galaxyViewSystem.wormhole : this._galaxyViewSystem

      this._mountWarp(contentDiv, warpSystem)
    } else if (row === "Equipment") {
      pLog.log(8)
      this._mountReact(contentDiv, createElement(Equipment, { game: this._game }))
    } else if (row === "Ship Yard") {
      pLog.log(9)
      presentShipYard(this._game)
      this._mountReact(contentDiv, createElement(ShipYard, { game: this._game }))
    } else if (row === "For Hire" || row === "Roster") {
      pLog.log(10)
      const onFired = (crewMember) => this.personnelRosterViewControllerDidFire(null, crewMember)
      this._mountReact(contentDiv, createElement(Roster, { game: this._game, onFired }))
    } else if (row === "News") {
      pLog.log(11)
      // To avoid the news changing between viewings, use one instance
      if (!this._news) {
        this._news = new News(this._game);
      }
      this._news.present()
      this._mountReact(contentDiv, createElement(NewsScreen, { game: this._game, news: this._news }))
    } else if (row === "Bank") {
      pLog.log(12)
      this._mountReact(contentDiv, createElement(Bank, { game: this._game }))
    } else if (row === "Commander") {
      pLog.log(13)
      const scores = {
        highScores: (count) => this.highScoringGamesWithinCount(count),
        clearHighScores: () => this.clearAllHighScoringGames(),
      }
      const onGiveUp = () => this.gameDidEndWithStatus(GameEndStatus.Retired)
      this._mountReact(contentDiv, createElement(CommanderStatus, { game: this._game, scores, onGiveUp }))
    } else if (row === "Special") {
      pLog.log(14)
      const specialEventTypeToSpecifier = SpecialEventSpecifier.specialEventTypeToSpecifier()
      const specialEventType = this._game.commander.getCurrentSystem().getSpecialEvent()
      const specialEventSpecifier = specialEventTypeToSpecifier.get(specialEventType)

      const acceptEventAction = () => {
        if (this._game.commander.spendingMoney() < specialEventSpecifier.price) {
          pLog.log(15)
          AlertViewController.presentAlertWithDismiss("You don't have enough cash to accept this offer.")
        } else {
          pLog.log(16)
          this._game.commander.setCredits(this._game.commander.getCredits() - specialEventSpecifier.price);

          if (specialEventSpecifier.action) {
            pLog.log(17)
            specialEventSpecifier.action(this._game, this);
            this._game.save();
            this.presentView()
          }
        }
      };

      console.log("Special event specifier: " + specialEventSpecifier)
      console.log("Special event name: " + specialEventSpecifier.name)
      console.log("Special event prompt: " + specialEventSpecifier.prompt)

      let aC = new AlertViewController(specialEventSpecifier.prompt)

      if (specialEventSpecifier.messageOnly) {
        aC.addAction("Dismiss", AlertActionType.Default, () => {
          pLog.log(18)
          acceptEventAction();
        })

      } else {
        aC.addAction("Yes", AlertActionType.Default, () => {
          pLog.log(19)
          acceptEventAction();
        })

        aC.addAction("No", AlertActionType.Cancel, () => {
          pLog.log(20)
        })
      }

      aC.presentView()
    }
  }

  presentView() {
    Utils.maintainScrollPosition(() => {
      this._presentView()
    })
  }

  _presentView() {
    // Clear the div
    this._removeReact()
    this.div.innerHTML = '';

    const contentDiv = document.createElement('div');
    contentDiv.id = systemLandingOptionsDivID
    this.div.appendChild(contentDiv);


    const galaxyViewDiv = document.createElement('div');
    contentDiv.appendChild(galaxyViewDiv);
    this._galaxyView = new GalaxyView(galaxyViewDiv, this._game, this._game.commander.currentSystem, false, true, true)
    this._galaxyView.delegate = this

    const subVCButtonsDiv = document.createElement('ul')
    subVCButtonsDiv.id = 'subVCButtonsDiv'
    subVCButtonsDiv.classList.add('systemLandingButtons')
    contentDiv.appendChild(subVCButtonsDiv)

    this._subVCButtons = []
    this._updateSubVCButtons()

    const subContentDiv = this._clearedSubContentDiv()

    const welcomeH = Utils.createElement('h1', { textContent: 'Welcome to ' + this._game.commander.getCurrentSystem().getName() }, subContentDiv);
    welcomeH.id = 'system-info-welcome'
    welcomeH.classList.add('centered-div')
    welcomeH.classList.add('system-info-header')

    const cS = this._game.commander.currentSystem
    const resourceText = cS.systemInfoString()
    const systemInfoEl = document.createElement('h4')
    subContentDiv.appendChild(systemInfoEl)
    systemInfoEl.id = 'system-info-text'
    systemInfoEl.classList.add('system-info')
    systemInfoEl.classList.add('centered-div')
    systemInfoEl.classList.add('centered')
    systemInfoEl.innerText = resourceText
  }

  _updateSubVCButtons() {
    const subVCButtonsDiv = document.getElementById('subVCButtonsDiv')
    if (!subVCButtonsDiv) { return }

    const activeButtons = this._subVCButtons.filter(x => x.classList.contains('active'))
    let activeButtonID = activeButtons.length > 0 ? activeButtons[0].id : null

    subVCButtonsDiv.innerHTML = ''

    const tableRows = this._tableRows();

    tableRows.forEach(row => {
      const button = document.createElement('li')
      button.classList.add('button-item')
      subVCButtonsDiv.appendChild(button)

      const a = document.createElement('a');
      a.id = row;
      a.classList.add('button-link')
      a.href = '#'; // Use # to make the link focusable/clickable without navigating
      this._subVCButtons.push(a)

      const icon = document.createElement('img')
      const iconClass = row === "Chart" ? 'button-icon-chart' : 'button-icon'
      icon.classList.add(iconClass)
      const iconName = row === "Ship Yard" ? this._game.commander.ship.model.name : row
      icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
      a.appendChild(icon)

      const title = document.createElement('span')
      title.textContent = row
      a.appendChild(title)

      button.appendChild(a)

      // Add click event listener
      runtime.actionLog.registerAEventListener(a, 'click', (event) => {
        event.preventDefault(); // Prevent the default link behavior

        this._subVCButtons.forEach(btn => btn.classList.remove('active'))

        if (a.id !== "Special") {
          a.classList.add('active')
        }

        this.handleRowClick(row);
      });

      if (a.id === activeButtonID) {
        a.classList.add('active')
      }

      subVCButtonsDiv.appendChild(a);
    });
  }

  gameDidEndWithStatus(st) {
    pLog.log(21)
    this.delegate.systemLandingViewControllerGameDidEndWithStatus(this, st)
  }

// WarpViewController delegate
  _mountWarp(contentDiv, selected) {
    this._mountReact(contentDiv, createElement(Warp, {
      game: this._game,
      selected,
      mapSelection: this.warpControllerGetGalaxyViewSystem(null),
      onSelect: (system) => this.warpControllerSelectedSystem(null, system),
      onFuel: () => this.warpControllerDidBuyFuel(null),
      onBlastOff: (destination) => this._beginWarp(false, destination),
    }))
  }

  // Leaves for the destination if the rules allow it; the old travel screen then takes
  // over the content area.
  _beginWarp(viaSingularity, destination) {
    warp(this._game, viaSingularity, destination, (origin, actualDestination, wasVisited) => {
      const contentDiv = this._clearedSubContentDiv()
      const travel = new TravelViewController(contentDiv, this._game, origin, actualDestination, wasVisited)
      travel.delegate = {
        travelViewControllerDidComplete: () => this.warpControllerCompletedWarp(null),
        travelViewControllerGameDidEndWithStatus: (tvc, st) => this.warpControllerGameDidEndWithStatus(null, st),
      }
      this.warpControllerWillBeginWarp(null)
      travel.presentView()
    })
  }

  warpControllerGetGalaxyViewSystem(wc) {
    return this._galaxyViewWormhole ? this._galaxyViewSystem.wormhole : this._galaxyViewSystem
  }

  warpControllerSelectedSystem(wc, s) {
    console.log("warp selected system: " + s)
    const isWormhole = this._game.commander.currentSystem.wormhole === s
    const selectedSystem = isWormhole ? this._game.commander.currentSystem : s
    this._galaxyView.selectSystem(selectedSystem, isWormhole)
  }

  warpControllerWillBeginWarp(wc) {
    // Hide the SystemLanding UI since we only want to see the travel UI
    const el = document.getElementById(systemLandingOptionsDivID)
    if (el) {
      el.remove()
    }
  }

  warpControllerCompletedWarp(wc) {
    this._galaxyViewSystem = null
    this._galaxyViewWormhole = false
    this._game.save()
    this.presentView()
  }

  warpControllerGameDidEndWithStatus(wc, st) {
    this.gameDidEndWithStatus(st)
  }

  warpControllerDidBuyFuel(wc) {
    pLog.log(22)
    this.handleRowClick("Warp")
  }


// ShipYardViewController delegate

	shipYardViewControllerDidBuyFuel(syVC) {
    // GalaxyView automatically picks up on the expanded range so no need to forward this callback
	}


// GalacticChartViewController delegate

  galacticChartViewControllerWarpViaSingularity(vc, solarSystem) {
    pLog.log(23)
    const contentDiv = this._clearedSubContentDiv()
    this._mountWarp(contentDiv, null)
    this._beginWarp(true, solarSystem)
  }

// CommanderStatusViewController delegate

  clearAllHighScoringGames() {
    this.delegate.clearAllHighScoringGames()
  }

  highScoringGamesWithinCount(c) {
    return this.delegate.highScoringGamesWithinCount(c)
  }

  endGameViewControllerWantsContinue(vc) {
    pLog.log(23)
    this.delegate.endGameViewControllerWantsContinue(vc)
  }

// PersonnelRosterViewController delegate

  personnelRosterViewControllerDidFire(vc, crewMember) {
    const currentSystemMercenary = this._game.commander.currentSystem.mercenary;
    if (currentSystemMercenary === crewMember) {
      pLog.log(47)
      this._updateSubVCButtons()
    }
  }

// GalaxyView delegate

  galaxyViewSelectedSolarSystem(gv, solarSystem, wormhole) {
    this._galaxyViewSystem = solarSystem
    this._galaxyViewWormhole = wormhole
    this._subVCButtons.forEach(btn => {
      if (btn.id === "Warp") {
        pLog.log(24)
        btn.classList.add('active')
      } else {
        pLog.log(25)
        btn.classList.remove('active')
      }
    })
    this.handleRowClick("Warp")
  }
}

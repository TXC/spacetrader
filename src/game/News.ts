// The newspaper: paying for it, and the headlines.
import { AlertViewController } from './alerts.ts';
import { PoliceRecordScore } from './Commander.ts';
import type { Game } from './Game.ts';
import { runtime } from './runtime.ts';
import { named } from './texts.ts';
import { session } from './session.ts';
import type { SolarSystem } from './SolarSystem.ts';
import {
  DragonflyQuestStatus,
  ExperimentQuestStatus,
  InvasionQuestStatus,
  JaporiQuestStatus,
  JarekQuestStatus,
  MonsterQuestStatus,
  ScarabQuestStatus,
  SpecialEvent,
  WildQuestStatus,
} from './SolarSystem.types.ts';
import { Status, TechLevel } from './TradeItem.types.ts';
import { pLog } from './Utilities.ts';

// One of these lives as long as the landing screen, as the old news screen did: its
// headlines for a system are built once and shown again on the next visit to the screen.
// A system in one of these states has something to report; an uneventful one has not.
type Troubled = Exclude<Status, typeof Status.Count | typeof Status.Uneventful>;

// The headline a system prints about its own state.
const statusHeadline = named<Troubled>({
  [Status.AtWar]: 'War News: Offensives Continue!',
  [Status.Plague]: 'Plague Spreads! Outlook Grim.',
  [Status.Drought]: 'No Rain in Sight',
  [Status.Boredom]: "Editors: Won't Someone Entertain Us?",
  [Status.ColdSpell]: 'Cold Snap Continues!',
  [Status.CropFailure]: 'Serious Crop Failure! Must We Ration?',
  [Status.LackWorkers]: 'Jobless Rate at All-Time Low!',
});

// What other systems' papers call that state, as in "Reports of Severe Drought in the Sol System."
const statusTrouble = named<Troubled>(
  {
    [Status.AtWar]: 'Strife and War',
    [Status.Plague]: 'Plague Outbreaks',
    [Status.Drought]: 'Severe Drought',
    [Status.Boredom]: 'Terrible Boredom',
    [Status.ColdSpell]: 'Cold Weather',
    [Status.CropFailure]: 'Crop Failures',
    [Status.LackWorkers]: 'Labor Shortages',
  },
  'Labor Shortages'
);

export class News {
  private game: Game;
  private cachedNews: string | null = null;
  private cachedSystem: SolarSystem | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  price(): number {
    return this.game.difficulty + 1;
  }

  // What the old screen did each time it was opened, before drawing.
  present(): void {
    const game = this.game;
    if (!game.alreadyPaidForNewspaper) {
      if (game.commander.spendingMoney() < this.price()) {
        AlertViewController.presentAlertWithDismiss(
          `Sorry! A newspaper costs $${this.price()} in this system. You don't have enough money!`
        );
      } else if (game.autoNews) {
        pLog.log(43);
        this.pay();
      }
    }
    if (game.alreadyPaidForNewspaper) this.headlines();
  }

  // The "Pay to read" link.
  buy(): void {
    if (this.game.alreadyPaidForNewspaper) return;
    this.pay();
    this.headlines();
    session.changed();
  }

  private pay(): void {
    const { game } = this;
    game.commander.setCredits(game.commander.getCredits() - this.price());
    game.alreadyPaidForNewspaper = true;
    game.save();
  }

  setAuto(on: boolean): void {
    this.game.autoNews = on;
    this.game.save();
    session.changed();
  }

  masthead(): string {
    const system = this.game.commander.getCurrentSystem();
    const mastheads = system.getPolitics().mastheads;
    return mastheads[system.hashCode() % mastheads.length].replace(/%@/g, system.getName());
  }

  // The headlines to show, one per line, or null when the paper has not been paid for.
  text(): string | null {
    return this.game.alreadyPaidForNewspaper ? this.cachedNews : null;
  }

  // Builds the headlines for the current system, once; the result is kept until the
  // commander is somewhere else. Draws random numbers and clears the breaking news.
  private headlines(): string {
    if (this.cachedNews && this.cachedSystem === this.game.commander.getCurrentSystem()) {
      return this.cachedNews;
    }

    let headlines = '';
    let comma = '';

    const breakingNews = this.game.getBreakingNews() || [];
    for (const item of breakingNews) {
      headlines += comma + item;
      comma = '\n';
    }
    this.game.clearBreakingNews();

    let specialHeadline = null;
    const specialEvent = this.game.commander.getCurrentSystem().getSpecialEvent();
    const japoriQuestStatus = this.game.japoriQuestStatus;
    const scarabStatus = this.game.scarabStatus;
    const monsterStatus = this.game.monsterStatus;
    const dragonflyStatus = this.game.dragonflyStatus;
    const invasionStatus = this.game.invasionStatus;
    const experimentStatus = this.game.experimentStatus;
    const jarekStatus = this.game.jarekStatus;
    const wildStatus = this.game.wildStatus;

    switch (specialEvent) {
      case SpecialEvent.JaporiDisease:
        if (japoriQuestStatus === JaporiQuestStatus.Open) {
          pLog.log(113);
          specialHeadline = 'Editorial: We Must Help Japori!';
        }
        break;
      case SpecialEvent.MedicineDelivery:
        if (japoriQuestStatus === JaporiQuestStatus.HasMedicine) {
          pLog.log(114);
          specialHeadline = 'Disease Antidotes Arrive! Health Officials Optimistic.';
        }
        break;
      case SpecialEvent.Scarab:
        specialHeadline = 'Security Scandal: Test Craft Confirmed Stolen.';
        break;
      case SpecialEvent.ScarabDestroyed:
        if (scarabStatus === ScarabQuestStatus.ScarabDestroyed) {
          specialHeadline = 'Wormhole Traffic Delayed as Stolen Craft Destroyed.';
        } else if (scarabStatus === ScarabQuestStatus.ScarabExists) {
          specialHeadline = 'Wormhole Travelers Harassed by Unusual Ship!';
        }
        break;
      case SpecialEvent.MonsterKilled:
        if (monsterStatus === MonsterQuestStatus.ClosedMonsterDestroyed) {
          specialHeadline = 'Hero Slays Space Monster! Parade, Honors Planned for Today.';
        } else if (monsterStatus === MonsterQuestStatus.MonsterExists) {
          specialHeadline = 'Space Monster Threatens Homeworld!';
        }
        break;
      case SpecialEvent.Dragonfly:
        specialHeadline = 'Experimental Craft Stolen! Critics Demand Security Review.';
        break;
      case SpecialEvent.FlyBaratas:
        if (dragonflyStatus === DragonflyQuestStatus.GoToBaratas) {
          specialHeadline = 'Investigators Report Strange Craft.';
        }
        break;
      case SpecialEvent.FlyMelina:
        if (dragonflyStatus === DragonflyQuestStatus.GoToMelina) {
          specialHeadline = 'Rumors Continue: Melina Orbitted by Odd Starcraft.';
        }
        break;
      case SpecialEvent.FlyRegulas:
        if (dragonflyStatus === DragonflyQuestStatus.GoToRegulas) {
          specialHeadline = 'Strange Ship Observed in Regulas Orbit.';
        }
        break;
      case SpecialEvent.DragonflyDestroyed:
        if (dragonflyStatus === DragonflyQuestStatus.ClosedDragonflyDestroyed) {
          specialHeadline = 'Spectacular Display as Stolen Ship Destroyed in Fierce Space Battle.';
        } else if (dragonflyStatus === DragonflyQuestStatus.GoToZalkon) {
          specialHeadline = 'Unidentified Ship: A Threat to Zalkon?';
        }
        break;
      case SpecialEvent.GemulonRescued:
        if (
          invasionStatus >= InvasionQuestStatus.DaysUntilInvasion._7 &&
          invasionStatus <= InvasionQuestStatus.DaysUntilInvasion._1
        ) {
          specialHeadline = 'Invasion Imminent! Plans in Place to Repel Hostile Invaders.';
        } else if (invasionStatus === InvasionQuestStatus.ClosedTooLate) {
          specialHeadline = 'Alien Invasion Devastates Planet!';
        }
        break;
      case SpecialEvent.AlienInvasion:
        specialHeadline = 'Editorial: Who Will Warn Gemulon?';
        break;
      case SpecialEvent.ExperimentStopped:
        if (
          experimentStatus >= ExperimentQuestStatus.DaysRemaining._10 &&
          experimentStatus <= ExperimentQuestStatus.DaysRemaining._1
        ) {
          specialHeadline = 'Scientists Cancel High-profile Test! Committee to Investigate Design.';
        }
        break;
      case SpecialEvent.ExperimentNotStopped:
        specialHeadline = 'Huge Explosion Reported at Research Facility.';
        break;
      case SpecialEvent.ArtifactDelivered:
        if (this.game.commander.artifactOnBoard) {
          specialHeadline = 'Scientist Adds Alien Artifact to Museum Collection.';
        }
        break;
      case SpecialEvent.JarekGetsOut:
        if (jarekStatus === JarekQuestStatus.OnBoard) {
          specialHeadline = 'Ambassador Jarek Returns from Crisis.';
        }
        break;
      case SpecialEvent.WildGetsOut:
        if (wildStatus === WildQuestStatus.OnBoard) {
          specialHeadline = 'Rumors Suggest Known Criminal J. Wild May Come to Kravat!';
        }
        break;
    }

    if (specialHeadline) {
      headlines += comma + specialHeadline;
      comma = '\n';
    }

    const status = this.game.commander.getCurrentSystem().getStatus();
    const statusStr = statusHeadline(status);
    if (statusStr) {
      headlines += comma + statusStr;
      comma = '\n';
    }

    const policeRecordScore = this.game.commander.policeRecordScore;
    if (policeRecordScore <= PoliceRecordScore.Villain) {
      headlines += comma;

      const villainHeadlines = [
        `Police Warning: ${this.game.commander.name} Will Dock at ${this.game.commander.getCurrentSystem().getName()}!`,
        `Notorious Criminal ${this.game.commander.name} Sighted in ${this.game.commander.getCurrentSystem().getName()}!`,
        `Locals Rally to Deny Spaceport Access to ${this.game.commander.name}!`,
        `Terror Strikes Locals on Arrival of ${this.game.commander.name}!`,
      ];

      headlines += villainHeadlines[runtime.gameRand.randomIntBelow(villainHeadlines.length)];
      comma = '\n';
    } else if (policeRecordScore === PoliceRecordScore.Hero) {
      headlines += comma;

      const heroHeadlines = [
        `Locals Welcome Visiting Hero ${this.game.commander.name}!`,
        `Famed Hero ${this.game.commander.name} to Visit System!`,
        `Large Turnout At Spaceport to Welcome ${this.game.commander.name}!`,
      ];

      headlines += heroHeadlines[runtime.gameRand.randomIntBelow(heroHeadlines.length)];

      comma = '\n';
    }

    // Actually valuable news - more likely to show up in a higher-tech system
    let realNews = false;
    const solarSystemsWithinRange = this.game.solarSystemsWithinRange();

    for (let i = 0; i < solarSystemsWithinRange.length; i++) {
      const solarSystem = solarSystemsWithinRange[i];

      if (solarSystem.getSpecialEvent() === SpecialEvent.MoonForSale) {
        headlines += `${comma}Seller in ${solarSystem.getName()} System has Utopian Moon Available.`;
        comma = '\n';
      } else if (solarSystem.specialEvent === SpecialEvent.BuyTribble) {
        headlines += `${comma}Collector in ${solarSystem.getName()} System Seeks to Purchase Tribbles.`;
        comma = '\n';
      }

      if (solarSystem.status !== Status.Uneventful) {
        if (
          runtime.gameRand.randomIntBelow(100) <=
          (solarSystem.techLevel * 50) / TechLevel.Count + 10 * (5 - this.game.difficulty)
        ) {
          const storyPrefixes = [
            'Reports of',
            'News of',
            'New Rumors of',
            'Sources say',
            'Notice:',
            'Evidence Suggests',
          ];

          headlines += `${comma}${storyPrefixes[runtime.gameRand.randomIntBelow(storyPrefixes.length)]} ${statusTrouble(solarSystem.getStatus())} in the ${solarSystem.getName()} System.`;
          comma = '\n';
          realNews = true;
        }
      }
    }

    if (!realNews) {
      headlines += comma;
      const systemHeadlines = this.game.commander.getCurrentSystem().getPolitics().headlines;
      headlines += systemHeadlines[runtime.gameRand.randomIntBelow(systemHeadlines.length)];
    }

    this.cachedSystem = this.game.commander.getCurrentSystem();
    this.cachedNews = headlines;
    return headlines;
  }
}

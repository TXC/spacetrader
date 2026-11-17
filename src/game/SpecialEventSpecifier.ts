import { AccessoryType } from './Accessory.ts';
import { AlertViewController } from './alerts.ts';
import { PoliceRecordScore, ReputationScore } from './Commander.ts';
import { CrewMember } from './CrewMember.ts';
import { GameEndStatus } from './Game.ts';
import {
  MOON_PRICE,
  REACTOR_BAY_COUNT,
  REACTOR_MAX_FUEL,
  DragonflyQuestStatus,
  ExperimentQuestStatus,
  InvasionQuestStatus,
  JaporiQuestStatus,
  JarekQuestStatus,
  MonsterQuestStatus,
  ReactorQuestStatus,
  ScarabQuestStatus,
  SpecialEvent,
  WildQuestStatus,
} from './SolarSystem.types.ts';
import { TradeItem } from './TradeItem.ts';
import { TradeItemType } from './TradeItem.types.ts';
import { pLog } from './Utilities.ts';
import type { Game } from './Game.ts';
import { runtime } from './runtime.ts';

type ShouldHideBlock = (game: Game) => boolean;
// The second argument lets an event end the game (buying the moon does).
type ActionBlock = (
  game: Game,
  viewController: { gameDidEndWithStatus(status: number): void }
) => void;

export const FABRIC_RIP_PROBABILITY_INITIAL = 25;

export function RESET_CURRENT_SPECIAL(game: Game) {
  game.commander.currentSystem.setSpecialEvent(SpecialEvent.None);
}

export class SpecialEventSpecifier {
  declare static sDictionary: Map<number, SpecialEventSpecifier> | undefined;
  declare static sEvents: SpecialEventSpecifier[] | undefined;
  declare type: number;
  declare name: string;
  declare prompt: string;
  declare shouldHideBlock: ShouldHideBlock;
  declare action: ActionBlock;
  declare price: number;
  declare randomOccurrence: number;
  declare messageOnly: boolean;

  static specialEventTypeToSpecifier() {
    if (!SpecialEventSpecifier.sDictionary) {
      const dict = new Map();
      for (const specifier of SpecialEventSpecifier.specialEvents()) {
        dict.set(specifier.type, specifier);
      }
      SpecialEventSpecifier.sDictionary = dict;
    }
    return SpecialEventSpecifier.sDictionary;
  }

  static randomOccurrenceEventTypes() {
    const result = [];
    for (const specifier of SpecialEventSpecifier.specialEvents()) {
      for (let i = 0; i < specifier.randomOccurrence; ++i) {
        result.push(specifier.type);
      }
    }
    return result;
  }

  constructor(
    type: number,
    name: string,
    prompt: string,
    price: number,
    randomOccurrence: number,
    messageOnly: boolean,
    shouldHideBlock: ShouldHideBlock | null = null,
    actionBlock: ActionBlock | null = null
  ) {
    this.type = type;
    this.name = name;
    this.prompt = prompt;
    this.shouldHideBlock = shouldHideBlock || (() => false);
    this.action =
      actionBlock ||
      (game => {
        RESET_CURRENT_SPECIAL(game);
      });
    this.price = price;
    this.randomOccurrence = randomOccurrence;
    this.messageOnly = messageOnly;
  }

  static specialEvents() {
    if (!SpecialEventSpecifier.sEvents) {
      SpecialEventSpecifier.sEvents = [];

      let specifier: SpecialEventSpecifier;

      specifier = new SpecialEventSpecifier(
        SpecialEvent.DragonflyDestroyed,
        'Dragonfly Destroyed',
        "Hello, Commander. This is Colonel Jackson again. On behalf of the Space Corps, I thank you for your valuable assistance in destroying the Dragonfly. As a reward, we will install one of the experimental shields on your ship. Return here for that when you're ready.",
        0,
        0,
        true,
        game => {
          return game.dragonflyStatus < DragonflyQuestStatus.ClosedDragonflyDestroyed;
        },
        game => {
          pLog.log(115);
          game.commander.currentSystem.setSpecialEvent(SpecialEvent.InstallLightningShield);
        }
      );

      SpecialEventSpecifier.sEvents.push(specifier);

      specifier = new SpecialEventSpecifier(
        SpecialEvent.FlyBaratas,
        'Weird Ship',
        'A small ship of a weird design docked here recently for repairs. The engineer who worked on it said that it had a weak hull, but incredibly strong shields. I heard it took off in the direction of the Melina system.',
        0,
        0,
        true,
        game => {
          return game.dragonflyStatus < DragonflyQuestStatus.GoToBaratas;
        },
        game => {
          pLog.log(116);
          game.dragonflyStatus += 1;
          RESET_CURRENT_SPECIAL(game);
        }
      );

      SpecialEventSpecifier.sEvents.push(specifier);

      specifier = new SpecialEventSpecifier(
        SpecialEvent.FlyMelina,
        'Lightning Ship',
        'A ship with shields that seemed to be like lightning recently fought many other ships in our system. I have never seen anything like it before. After it left, I heard it went to the Regulas system.',
        0,
        0,
        true,
        game => {
          return game.dragonflyStatus < DragonflyQuestStatus.GoToMelina;
        },
        game => {
          pLog.log(117);
          game.dragonflyStatus += 1;
          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      specifier = new SpecialEventSpecifier(
        SpecialEvent.FlyRegulas,
        'Strange Ship',
        'A small ship with shields like I have never seen before was here a few days ago. It destroyed at least ten police ships! Last thing I heard was that it went to the Zalkon system.',
        0,
        0,
        true,
        game => {
          return game.dragonflyStatus < DragonflyQuestStatus.GoToRegulas;
        },
        game => {
          pLog.log(118);
          game.dragonflyStatus += 1;
          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      specifier = new SpecialEventSpecifier(
        SpecialEvent.MonsterKilled,
        'Monster Killed',
        'We thank you for destroying the space monster that circled our system for so long. Please accept $15000 as reward for your heroic deed.',
        -15000,
        0,
        true,
        game => {
          return game.monsterStatus < MonsterQuestStatus.ClosedMonsterDestroyed;
        },
        null // No action block needed
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      specifier = new SpecialEventSpecifier(
        SpecialEvent.MedicineDelivery,
        'Medicine Delivery',
        "Thank you for delivering the medicine to us. We don't have any money to reward you, but we do have an alien fast-learning machine with which we will increase your skills.",
        0,
        0,
        true,
        game => {
          return game.japoriQuestStatus !== JaporiQuestStatus.HasMedicine;
        },
        game => {
          game.japoriQuestStatus = JaporiQuestStatus.Closed;
          game.commander.ship.soldQuantity(10, TradeItemType.FakeQuestCargo);
          game.commander.increaseSkillRandomly();
          game.commander.increaseSkillRandomly();
          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      specifier = new SpecialEventSpecifier(
        SpecialEvent.MoonBought,
        'Retirement',
        'Welcome to the Utopia system. Your own moon is available where you can retire, if you feel inclined to do that. Are you ready to retire and lead a happy, peaceful, and wealthy life?',
        0,
        0,
        false,
        game => {
          return !game.commander.boughtMoon;
        },
        (_game, viewController) => {
          pLog.log(63);
          viewController.gameDidEndWithStatus(GameEndStatus.Moon);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      specifier = new SpecialEventSpecifier(
        SpecialEvent.MoonForSale,
        'Moon for Sale',
        'There is a small but habitable moon for sale in the Utopia system, for the very reasonable sum of half a million credits. If you accept it, you can retire to it and live a peaceful, happy, and wealthy life. Do you wish to buy it?',
        MOON_PRICE,
        4,
        false,
        game => {
          return game.commander.boughtMoon || game.commander.netWorth() < (MOON_PRICE * 4) / 5;
        },
        game => {
          game.commander.boughtMoon = true;
          AlertViewController.presentAlertWithDismiss(
            'You bought a moon in the Utopia system. Go there to claim it.'
          );
          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      specifier = new SpecialEventSpecifier(
        SpecialEvent.SkillIncrease,
        'Skill Increase',
        "An alien with a fast-learning machine offers to increase one of your skills for the reasonable sum of $3000. You won't be able to pick that skill, though. Do you accept his offer?",
        3000,
        3,
        false,
        null,
        game => {
          const skill = game.commander.increaseSkillRandomly();

          AlertViewController.presentAlertWithDismiss(
            `The alien's machine increases your ${skill} skill.`
          );

          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Merchant Prince Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.Tribble,
        'Merchant Prince',
        'A merchant prince offers you a very special and wondrous item for the sum of $1000. Do you accept?',
        1000,
        1,
        false,
        null,
        game => {
          game.commander.ship.tribbles = 1;

          AlertViewController.presentAlertWithDismiss(
            'You are now the proud owner of a little, cute, furry tribble.'
          );

          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Erase Record Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.EraseRecord,
        'Erase Record',
        'A hacker conveys to you that he has cracked the passwords to the galaxy-wide police computer network, and that he can erase your police record for the sum of $5000. Do you want him to do that?',
        5000,
        3,
        false,
        game => {
          return game.commander.policeRecordScore >= PoliceRecordScore.Dubious;
        },
        game => {
          pLog.log(110);
          game.commander.policeRecordScore = PoliceRecordScore.Clean;
          AlertViewController.presentAlertWithDismiss(
            'The hacker resets your police record to be clean.'
          );

          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Tribble Buyer Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.BuyTribble,
        'Tribble Buyer',
        'An eccentric alien billionaire wants to buy your collection of tribbles and offers half a credit for each of them. Do you accept his offer?',
        0,
        3,
        false,
        game => {
          return game.commander.ship.tribbles <= 0;
        },
        game => {
          game.commander.credits =
            game.commander.credits + Math.floor(game.commander.ship.tribbles / 2);
          game.commander.ship.tribbles = 0;

          AlertViewController.presentAlertWithDismiss(
            'The alien uses advanced technology to beam your whole collection of tribbles to his ship.'
          );

          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Space Monster Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.SpaceMonster,
        'Space Monster',
        "A space monster has invaded the Acamar system and is disturbing the trade routes. You'll be rewarded handsomely if you manage to destroy it.",
        0,
        1,
        true,
        game => {
          return game.monsterStatus !== MonsterQuestStatus.Open;
        },
        game => {
          game.monsterStatus = MonsterQuestStatus.MonsterExists;
          RESET_CURRENT_SPECIAL(game);
          pLog.log(144);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Dragonfly Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.Dragonfly,
        'Dragonfly',
        'This is colonel Jackson of the Space Corps. An experimental ship, code-named "Dragonfly", has been stolen. It is equipped with very special, almost indestructible shields. It shouldn\'t fall into the wrong hands and we will reward you if you destroy it. It has last been seen in the Baratas system.',
        0,
        1,
        true,
        game => {
          return game.commander.policeRecordScore < PoliceRecordScore.Dubious;
        },
        game => {
          game.dragonflyStatus = DragonflyQuestStatus.GoToBaratas;
          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Cargo for Sale Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.CargoForSale,
        'Cargo for Sale',
        'A trader in second-hand goods offers you 3 sealed cargo canisters for the sum of $1000. It could be a good deal: they could contain robots. Then again, it might just be water. Do you want the canisters?',
        1000,
        3,
        false,
        game => {
          return game.commander.ship.freeCargoBays() < 3;
        },
        game => {
          const itemType = runtime.gameRand.randomIntBelow(TradeItemType.Count);
          game.commander.ship.boughtQuantity(3, itemType, Math.floor(1000 / 3));

          AlertViewController.presentAlertWithDismiss(
            `The canisters contain ${TradeItem.tradeItemForType(itemType)!.name.toLowerCase()}.`
          );

          RESET_CURRENT_SPECIAL(game);
          pLog.log(130);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Lightning Shield Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.InstallLightningShield,
        'Lightning Shield',
        'Colonel Jackson here. Do you want us to install a Lightning shield on your current ship?',
        0,
        0,
        false,
        null,
        game => {
          let alertString;
          if (game.commander.ship.freeSlotsForAccessoryType(AccessoryType.ShieldLightning) > 0) {
            pLog.log(119);
            game.commander.ship.addAccessoryOfType(AccessoryType.ShieldLightning);
            alertString = 'You now have one Lightning shield installed on your ship.';
            RESET_CURRENT_SPECIAL(game);
          } else {
            pLog.log(120);
            alertString = 'You have already filled all of your available shield slots.';
          }

          AlertViewController.presentAlertWithDismiss(alertString);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Japori Disease Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.JaporiDisease,
        'Japori Disease',
        'A strange disease has invaded the Japori system. We would like you to deliver these ten canisters of special antidote to Japori. Note that, if you accept, ten of your cargo bays will remain in use on your way to Japori. Do you accept this mission?',
        0,
        1,
        false,
        game => {
          return (
            game.commander.policeRecordScore < PoliceRecordScore.Dubious ||
            game.japoriQuestStatus !== JaporiQuestStatus.Open
          );
        },
        game => {
          let alertString;
          if (game.commander.ship.freeCargoBays() < 10) {
            pLog.log(111);
            alertString = 'You must have at least 10 free cargo bays to accept this mission.';
          } else {
            pLog.log(112);
            alertString = 'Ten of your cargo bays now contain antidote for the Japori system.';
            game.commander.ship.boughtQuantity(10, TradeItemType.FakeQuestCargo, 0);
            game.japoriQuestStatus = JaporiQuestStatus.HasMedicine;
            RESET_CURRENT_SPECIAL(game);
          }

          AlertViewController.presentAlertWithDismiss(alertString);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Lottery Winner Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.LotteryWinner,
        'Lottery Winner',
        'What luck! While docking in the space port, you receive a message that you won $1000 in a lottery. The prize has been added to your account.',
        -1000,
        0,
        true,
        null,
        null
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Artifact Delivery Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.ArtifactDelivered,
        'Artifact Delivery',
        "This is Professor Berger. I thank you for delivering the alien artifact to me. I hope the aliens weren't too much of a nuisance. I have transferred $20000 to your account, which I assume compensates you for your troubles.",
        -20000,
        0,
        true,
        game => {
          return !game.commander.artifactOnBoard;
        },
        game => {
          game.commander.artifactOnBoard = false;
          RESET_CURRENT_SPECIAL(game);
          pLog.log(136);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Alien Artifact Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.AlienArtifact,
        'Alien Artifact',
        'This alien artifact should be delivered to Professor Berger, who is currently traveling. You can probably find him at a hi-tech solar system. The alien race which produced this artifact seems keen on getting it back, however, and may hinder the carrier. Are you, for a price, willing to deliver it?',
        0,
        0,
        false,
        game => {
          return game.commander.policeRecordScore < PoliceRecordScore.Dubious;
        },
        game => {
          game.commander.artifactOnBoard = true;
          RESET_CURRENT_SPECIAL(game);
          pLog.log(135);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Ambassador Jarek Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.AmbassadorJarek,
        'Ambassador Jarek',
        'A recent change in the political climate of this solar system has forced ambassador Jarek to flee back to his home system, Devidia. Would you be willing to give him a lift?',
        0,
        1,
        false,
        game => {
          return game.commander.policeRecordScore < PoliceRecordScore.Dubious;
        },
        game => {
          let alertString;
          if (game.commander.ship.crewCount() < game.commander.ship.model.mercenaryQuarters()) {
            const jarek = new CrewMember('Ambassador Jarek');
            jarek.forQuest = true;
            game.commander.ship.addCrewMember(jarek);
            game.jarekStatus = JarekQuestStatus.OnBoard;
            alertString = 'You have taken Ambassador Jarek on board.';

            RESET_CURRENT_SPECIAL(game);
            pLog.log(137);
          } else {
            alertString = 'You do not have any crew quarters available for Ambassador Jarek.';
            pLog.log(138);
          }

          AlertViewController.presentAlertWithDismiss(alertString);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Alien Invasion Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.AlienInvasion,
        'Alien Invasion',
        "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days.",
        0,
        0,
        true,
        null,
        game => {
          game.invasionStatus = InvasionQuestStatus.DaysUntilInvasion._7;
          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Gemulon Invaded Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.GemulonInvaded,
        'Gemulon Invaded',
        'Alas, Gemulon has been invaded by aliens, which has thrown us back to pre-agricultural times. If only we had known the exact coordinates where they first arrived at our system, we might have prevented this tragedy from happening.',
        0,
        0,
        true,
        null,
        null
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Fuel Compactor Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.GetFuelCompactor,
        'Fuel Compactor',
        'Do you wish for us to install the fuel compactor on your current ship?',
        0,
        0,
        false,
        null,
        game => {
          let alertString;
          if (
            game.commander.ship.freeSlotsForAccessoryType(AccessoryType.GadgetFuelCompactor) > 0
          ) {
            game.commander.ship.addAccessoryOfType(AccessoryType.GadgetFuelCompactor);
            alertString = 'You now have a fuel compactor installed on your ship.';
            game.invasionStatus = InvasionQuestStatus.ClosedRewardClaimed;
            RESET_CURRENT_SPECIAL(game);

            pLog.log(131);
          } else {
            alertString = 'You have already filled all of your available gadget slots.';
            pLog.log(132);
          }

          AlertViewController.presentAlertWithDismiss(alertString);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Dangerous Experiment Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.Experiment,
        'Dangerous Experiment',
        "While reviewing the plans for Dr. Fehler's new space-warping drive, Dr. Lowenstam discovered a critical error. If you don't go to Daled and stop the experiment within ten days, the space-time continuum itself could be damaged!",
        0,
        0,
        true,
        game => {
          return game.commander.policeRecordScore < PoliceRecordScore.Dubious;
        },
        game => {
          game.experimentStatus = ExperimentQuestStatus.DaysRemaining._10;
          RESET_CURRENT_SPECIAL(game);
          pLog.log(147);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Jonathan Wild Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.TransportWild,
        'Jonathan Wild',
        "Law Enforcement is closing in on notorious criminal kingpin Jonathan Wild. He would reward you handsomely for smuggling him home to Kravat. You'd have to avoid capture by the Police on the way. Are you willing to give him a berth?",
        0,
        1,
        false,
        game => {
          return game.commander.policeRecordScore >= PoliceRecordScore.Dubious;
        },
        game => {
          let alertString = null;

          if (
            !alertString &&
            game.commander.ship.crewCount() >= game.commander.ship.model.mercenaryQuarters()
          ) {
            pLog.log(121);
            alertString = 'You do not have any crew quarters available for Jonathan Wild.';
          }

          if (
            !alertString &&
            game.commander.ship.weaponPowerBetweenMinMaxInclusive(
              AccessoryType.WeaponBeamLaser,
              AccessoryType.WeaponLast
            ) <= 0
          ) {
            pLog.log(122);
            alertString = `Jonathan Wild refuses to board unless you're armed with a Beam Laser or better. He'd rather take his chances hiding out here on ${game.commander.currentSystem.name}.`;
          }

          if (
            !alertString &&
            game.reactorStatus > ReactorQuestStatus.Open &&
            game.reactorStatus < ReactorQuestStatus.ClosedTooLate
          ) {
            pLog.log(123);
            alertString =
              "Jonathan Wild doesn't like the looks of that Ion Reactor. He thinks it's too dangerous, and won't get on board.";
          }

          if (!alertString) {
            pLog.log(124);
            const wild = new CrewMember('Jonathan Wild');
            wild.forQuest = true;
            game.commander.ship.addCrewMember(wild);
            game.wildStatus = WildQuestStatus.OnBoard;
            alertString = 'You have taken Jonathan Wild on board.';

            RESET_CURRENT_SPECIAL(game);
          }

          AlertViewController.presentAlertWithDismiss(alertString);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Morgan's Reactor Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.GetReactor,
        "Morgan's Reactor",
        "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?",
        0,
        0,
        false,
        game => {
          return (
            game.commander.policeRecordScore >= PoliceRecordScore.Dubious ||
            game.commander.reputationScore < ReputationScore.Average ||
            game.reactorStatus !== ReactorQuestStatus.Open ||
            game.wildStatus === WildQuestStatus.OnBoard
          );
        },
        game => {
          if (game.commander.ship.freeCargoBays() < REACTOR_BAY_COUNT + REACTOR_MAX_FUEL) {
            AlertViewController.presentAlertWithDismiss(
              "You don't have enough empty cargo bays at the moment."
            );
            pLog.log(150);
            return;
          }

          game.commander.ship.boughtQuantity(
            REACTOR_BAY_COUNT + REACTOR_MAX_FUEL,
            TradeItemType.FakeQuestCargoReactor,
            0
          );
          game.reactorStatus = ReactorQuestStatus.DaysRemaining._20;

          AlertViewController.presentAlertWithDismiss(
            'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
          );

          RESET_CURRENT_SPECIAL(game);
          pLog.log(151);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Install Morgan's Laser Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.GetSpecialLaser,
        "Install Morgan's Laser",
        "Morgan's technicians are standing by with something that looks a lot like a military laser -- if you ignore the additional cooling vents and anodized ducts. Do you want them to install Morgan's special laser?",
        0,
        0,
        false,
        null,
        game => {
          let alertString;

          if (game.commander.ship.freeSlotsForAccessoryType(AccessoryType.WeaponMorgansLaser) > 0) {
            game.commander.ship.addAccessoryOfType(AccessoryType.WeaponMorgansLaser);
            alertString = "You now have Henry Morgan's special laser installed on your ship.";
            RESET_CURRENT_SPECIAL(game);
            pLog.log(162);
          } else {
            alertString = 'You have already filled all of your available weapon slots.';
            pLog.log(163);
          }

          AlertViewController.presentAlertWithDismiss(alertString);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Scarab Stolen Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.Scarab,
        'Scarab Stolen',
        "Captain Renwick developed a new organic hull material for his ship which cannot be damaged except by Pulse lasers. While he was celebrating this success, pirates boarded and stole the craft, which they have named the Scarab. Rumors suggest it's being hidden at the exit to a wormhole. Destroy the ship for a reward!",
        0,
        1,
        true,
        game => {
          return (
            game.commander.reputationScore < ReputationScore.Average ||
            game.scarabStatus !== ScarabQuestStatus.Open
          );
        },
        game => {
          game.scarabStatus = ScarabQuestStatus.ScarabExists;
          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Upgrade Hull Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.GetHullUpgraded,
        'Upgrade Hull',
        "The organic hull used in the Scarab is still not ready for day-to-day use. But Captain Renwick can certainly upgrade your hull with some of his retrofit technology. It's light stuff, and won't reduce your ship's range. Should he upgrade your ship?",
        0,
        0,
        false,
        game => {
          return game.scarabStatus !== ScarabQuestStatus.ScarabDestroyed;
        },
        game => {
          game.commander.ship.setUpgradedHull(true);
          game.scarabStatus = ScarabQuestStatus.Closed;
          RESET_CURRENT_SPECIAL(game);

          AlertViewController.presentAlertWithDismiss(
            "Technicians spent the day replacing welds and bolts, and adding materials to your ship. When they're done, they tell you your ship should be significantly sturdier."
          );
          pLog.log(171);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Scarab Destroyed Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.ScarabDestroyed,
        'Scarab Destroyed',
        "Space Corps is indebted to you for destroying the Scarab and the pirates who stole it. As a reward, we can have Captain Renwick upgrade the hull of your ship. Note that his upgrades won't be transferable if you buy a new ship! Come back with the ship you wish to upgrade.",
        0,
        0,
        true,
        game => {
          return game.scarabStatus !== ScarabQuestStatus.ScarabDestroyed;
        },
        game => {
          game.commander.currentSystem.setSpecialEvent(SpecialEvent.GetHullUpgraded);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Reactor Delivered Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.ReactorDelivered,
        'Reactor Delivered',
        'Henry Morgan takes delivery of the reactor with great glee. His men immediately set about stabilizing the fuel system. As a reward, Morgan offers you a special, high-powered laser that he designed. Return with an empty weapon slot when you want it installed.',
        0,
        0,
        true,
        game => {
          return !(
            game.reactorStatus > ReactorQuestStatus.Open &&
            game.reactorStatus < ReactorQuestStatus.ClosedTooLate
          );
        },
        game => {
          game.commander.ship.soldQuantity(
            REACTOR_BAY_COUNT + REACTOR_MAX_FUEL,
            TradeItemType.FakeQuestCargoReactor
          );
          game.commander.currentSystem.setSpecialEvent(SpecialEvent.GetSpecialLaser);
          game.reactorStatus = ReactorQuestStatus.ClosedSaved;
          pLog.log(161);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Jarek Gets Out Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.JarekGetsOut,
        'Jarek Gets Out',
        'Ambassador Jarek is very grateful to you for delivering him back to Devidia. As a reward, he gives you an experimental handheld haggling computer, which allows you to gain larger discounts when purchasing goods and equipment.',
        0,
        0,
        true,
        game => {
          return game.jarekStatus !== JarekQuestStatus.OnBoard;
        },
        game => {
          game.jarekStatus = JarekQuestStatus.Closed;
          game.commander.carriesMaxTraderBoost = true;
          game.commander.ship.removeCrewMemberWithName('Ambassador Jarek');
          RESET_CURRENT_SPECIAL(game);
          pLog.log(139);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Gemulon Rescued Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.GemulonRescued,
        'Gemulon Rescued',
        'This information of the arrival of the alien invasion force allows us to prepare a defense. You have saved our way of life. As a reward, we have a fuel compactor gadget for you, which allows you to travel 18 parsecs with any ship. Return here to get it installed.',
        0,
        0,
        true,
        game => {
          return !(
            game.invasionStatus >= InvasionQuestStatus.DaysUntilInvasion._7 &&
            game.invasionStatus <= InvasionQuestStatus.DaysUntilInvasion._1
          );
        },
        game => {
          game.invasionStatus = InvasionQuestStatus.ClosedSaved;
          game.commander.currentSystem.setSpecialEvent(SpecialEvent.GetFuelCompactor);
          pLog.log(133);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Disaster Averted Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.ExperimentStopped,
        'Disaster Averted',
        'Upon your warning, Dr. Fehler calls off the experiment. As a reward, you are given a Portable Singularity. This device will, for one time only, instantaneously transport you to any system in the galaxy. The Singularity can be accessed on the Galactic Chart.',
        0,
        0,
        true,
        game => {
          return !(
            game.experimentStatus >= ExperimentQuestStatus.DaysRemaining._10 &&
            game.experimentStatus <= ExperimentQuestStatus.DaysRemaining._1
          );
        },
        game => {
          game.experimentStatus = ExperimentQuestStatus.ClosedSaved;
          game.canSuperWarp = true;
          RESET_CURRENT_SPECIAL(game);
          pLog.log(148);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Experiment Failed Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.ExperimentNotStopped,
        'Experiment Failed',
        "Dr. Fehler can't understand why the experiment failed. But the failure has had a dramatic and disastrous effect on the fabric of space-time itself. It seems that Dr. Fehler won't be getting tenure any time soon...and you may have trouble when you warp!",
        0,
        0,
        true,
        null,
        null
      );
      SpecialEventSpecifier.sEvents.push(specifier);

      // Wild Gets Out Event
      specifier = new SpecialEventSpecifier(
        SpecialEvent.WildGetsOut,
        'Wild Gets Out',
        'Jonathan Wild is most grateful to you for spiriting him to safety. As a reward, he has one of his Cyber Criminals hack into the Police Database, and clean up your record. He also offers you the opportunity to take his talented nephew Zeethibal along as a Mercenary with no pay.',
        0,
        0,
        true,
        game => {
          return game.wildStatus !== WildQuestStatus.OnBoard;
        },
        game => {
          game.wildStatus = WildQuestStatus.Closed;
          game.commander.ship.removeCrewMemberWithName('Jonathan Wild');

          // Zeethibal has a 10 in the player's biggest weakness, 8 in the second biggest weakness, 5 for the others
          const ZEETH_SKILL = (index: number) => (index === 0 ? 10 : index === 1 ? 8 : 5);
          const zeeth = new CrewMember(
            'Zeethibal',
            ZEETH_SKILL(game.commander.engineerSkillIndex()),
            ZEETH_SKILL(game.commander.pilotSkillIndex()),
            ZEETH_SKILL(game.commander.fighterSkillIndex()),
            ZEETH_SKILL(game.commander.traderSkillIndex())
          );
          zeeth.freeMercenaryCost = true;

          game.commander.ship.addCrewMember(zeeth);
          game.commander.policeRecordScore = PoliceRecordScore.Clean;

          RESET_CURRENT_SPECIAL(game);
        }
      );
      SpecialEventSpecifier.sEvents.push(specifier);
    }

    return SpecialEventSpecifier.sEvents;
  }
}

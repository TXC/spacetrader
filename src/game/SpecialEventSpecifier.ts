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
import { tradeItemForType } from './TradeItem.ts';
import { FAKE_QUEST_CARGO, FAKE_QUEST_CARGO_REACTOR, TRADE_ITEM_COUNT } from './TradeItem.types.ts';
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

// A special event a system can offer: what it says, what it costs and what it does.
export type SpecialEventSpecifier = {
  type: number;
  name: string;
  prompt: string;
  price: number;
  // How many systems get this event when a new galaxy is made.
  randomOccurrence: number;
  messageOnly: boolean;
  shouldHideBlock: ShouldHideBlock;
  action: ActionBlock;
};

// An event that says nothing else is always shown, and accepting it just clears it.
type Spec = Omit<SpecialEventSpecifier, 'shouldHideBlock' | 'action'> &
  Partial<Pick<SpecialEventSpecifier, 'shouldHideBlock' | 'action'>>;

// The order matters: new galaxies place the random events in this order.
const SPECS: Spec[] = [
  {
    type: SpecialEvent.DragonflyDestroyed,
    name: 'Dragonfly Destroyed',
    prompt:
      "Hello, Commander. This is Colonel Jackson again. On behalf of the Space Corps, I thank you for your valuable assistance in destroying the Dragonfly. As a reward, we will install one of the experimental shields on your ship. Return here for that when you're ready.",
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.dragonflyStatus < DragonflyQuestStatus.ClosedDragonflyDestroyed;
    },
    action: game => {
      pLog.log(115);
      game.commander.currentSystem.setSpecialEvent(SpecialEvent.InstallLightningShield);
    },
  },
  {
    type: SpecialEvent.FlyBaratas,
    name: 'Weird Ship',
    prompt:
      'A small ship of a weird design docked here recently for repairs. The engineer who worked on it said that it had a weak hull, but incredibly strong shields. I heard it took off in the direction of the Melina system.',
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.dragonflyStatus < DragonflyQuestStatus.GoToBaratas;
    },
    action: game => {
      pLog.log(116);
      game.dragonflyStatus += 1;
      RESET_CURRENT_SPECIAL(game);
    },
  },
  {
    type: SpecialEvent.FlyMelina,
    name: 'Lightning Ship',
    prompt:
      'A ship with shields that seemed to be like lightning recently fought many other ships in our system. I have never seen anything like it before. After it left, I heard it went to the Regulas system.',
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.dragonflyStatus < DragonflyQuestStatus.GoToMelina;
    },
    action: game => {
      pLog.log(117);
      game.dragonflyStatus += 1;
      RESET_CURRENT_SPECIAL(game);
    },
  },
  {
    type: SpecialEvent.FlyRegulas,
    name: 'Strange Ship',
    prompt:
      'A small ship with shields like I have never seen before was here a few days ago. It destroyed at least ten police ships! Last thing I heard was that it went to the Zalkon system.',
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.dragonflyStatus < DragonflyQuestStatus.GoToRegulas;
    },
    action: game => {
      pLog.log(118);
      game.dragonflyStatus += 1;
      RESET_CURRENT_SPECIAL(game);
    },
  },
  {
    type: SpecialEvent.MonsterKilled,
    name: 'Monster Killed',
    prompt:
      'We thank you for destroying the space monster that circled our system for so long. Please accept $15000 as reward for your heroic deed.',
    price: -15000,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.monsterStatus < MonsterQuestStatus.ClosedMonsterDestroyed;
    },
  },
  {
    type: SpecialEvent.MedicineDelivery,
    name: 'Medicine Delivery',
    prompt:
      "Thank you for delivering the medicine to us. We don't have any money to reward you, but we do have an alien fast-learning machine with which we will increase your skills.",
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.japoriQuestStatus !== JaporiQuestStatus.HasMedicine;
    },
    action: game => {
      game.japoriQuestStatus = JaporiQuestStatus.Closed;
      game.commander.ship.soldQuantity(10, FAKE_QUEST_CARGO);
      game.commander.increaseSkillRandomly();
      game.commander.increaseSkillRandomly();
      RESET_CURRENT_SPECIAL(game);
    },
  },
  {
    type: SpecialEvent.MoonBought,
    name: 'Retirement',
    prompt:
      'Welcome to the Utopia system. Your own moon is available where you can retire, if you feel inclined to do that. Are you ready to retire and lead a happy, peaceful, and wealthy life?',
    price: 0,
    randomOccurrence: 0,
    messageOnly: false,
    shouldHideBlock: game => {
      return !game.commander.boughtMoon;
    },
    action: (_game, viewController) => {
      pLog.log(63);
      viewController.gameDidEndWithStatus(GameEndStatus.Moon);
    },
  },
  {
    type: SpecialEvent.MoonForSale,
    name: 'Moon for Sale',
    prompt:
      'There is a small but habitable moon for sale in the Utopia system, for the very reasonable sum of half a million credits. If you accept it, you can retire to it and live a peaceful, happy, and wealthy life. Do you wish to buy it?',
    price: MOON_PRICE,
    randomOccurrence: 4,
    messageOnly: false,
    shouldHideBlock: game => {
      return game.commander.boughtMoon || game.commander.netWorth() < (MOON_PRICE * 4) / 5;
    },
    action: game => {
      game.commander.boughtMoon = true;
      AlertViewController.presentAlertWithDismiss(
        'You bought a moon in the Utopia system. Go there to claim it.'
      );
      RESET_CURRENT_SPECIAL(game);
    },
  },
  {
    type: SpecialEvent.SkillIncrease,
    name: 'Skill Increase',
    prompt:
      "An alien with a fast-learning machine offers to increase one of your skills for the reasonable sum of $3000. You won't be able to pick that skill, though. Do you accept his offer?",
    price: 3000,
    randomOccurrence: 3,
    messageOnly: false,
    action: game => {
      const skill = game.commander.increaseSkillRandomly();

      AlertViewController.presentAlertWithDismiss(
        `The alien's machine increases your ${skill} skill.`
      );

      RESET_CURRENT_SPECIAL(game);
    },
  },
  // Merchant Prince Event
  {
    type: SpecialEvent.Tribble,
    name: 'Merchant Prince',
    prompt:
      'A merchant prince offers you a very special and wondrous item for the sum of $1000. Do you accept?',
    price: 1000,
    randomOccurrence: 1,
    messageOnly: false,
    action: game => {
      game.commander.ship.tribbles = 1;

      AlertViewController.presentAlertWithDismiss(
        'You are now the proud owner of a little, cute, furry tribble.'
      );

      RESET_CURRENT_SPECIAL(game);
    },
  },
  // Erase Record Event
  {
    type: SpecialEvent.EraseRecord,
    name: 'Erase Record',
    prompt:
      'A hacker conveys to you that he has cracked the passwords to the galaxy-wide police computer network, and that he can erase your police record for the sum of $5000. Do you want him to do that?',
    price: 5000,
    randomOccurrence: 3,
    messageOnly: false,
    shouldHideBlock: game => {
      return game.commander.policeRecordScore >= PoliceRecordScore.Dubious;
    },
    action: game => {
      pLog.log(110);
      game.commander.policeRecordScore = PoliceRecordScore.Clean;
      AlertViewController.presentAlertWithDismiss(
        'The hacker resets your police record to be clean.'
      );

      RESET_CURRENT_SPECIAL(game);
    },
  },
  // Tribble Buyer Event
  {
    type: SpecialEvent.BuyTribble,
    name: 'Tribble Buyer',
    prompt:
      'An eccentric alien billionaire wants to buy your collection of tribbles and offers half a credit for each of them. Do you accept his offer?',
    price: 0,
    randomOccurrence: 3,
    messageOnly: false,
    shouldHideBlock: game => {
      return game.commander.ship.tribbles <= 0;
    },
    action: game => {
      game.commander.credits =
        game.commander.credits + Math.floor(game.commander.ship.tribbles / 2);
      game.commander.ship.tribbles = 0;

      AlertViewController.presentAlertWithDismiss(
        'The alien uses advanced technology to beam your whole collection of tribbles to his ship.'
      );

      RESET_CURRENT_SPECIAL(game);
    },
  },
  // Space Monster Event
  {
    type: SpecialEvent.SpaceMonster,
    name: 'Space Monster',
    prompt:
      "A space monster has invaded the Acamar system and is disturbing the trade routes. You'll be rewarded handsomely if you manage to destroy it.",
    price: 0,
    randomOccurrence: 1,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.monsterStatus !== MonsterQuestStatus.Open;
    },
    action: game => {
      game.monsterStatus = MonsterQuestStatus.MonsterExists;
      RESET_CURRENT_SPECIAL(game);
      pLog.log(144);
    },
  },
  // Dragonfly Event
  {
    type: SpecialEvent.Dragonfly,
    name: 'Dragonfly',
    prompt:
      'This is colonel Jackson of the Space Corps. An experimental ship, code-named "Dragonfly", has been stolen. It is equipped with very special, almost indestructible shields. It shouldn\'t fall into the wrong hands and we will reward you if you destroy it. It has last been seen in the Baratas system.',
    price: 0,
    randomOccurrence: 1,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.commander.policeRecordScore < PoliceRecordScore.Dubious;
    },
    action: game => {
      game.dragonflyStatus = DragonflyQuestStatus.GoToBaratas;
      RESET_CURRENT_SPECIAL(game);
    },
  },
  // Cargo for Sale Event
  {
    type: SpecialEvent.CargoForSale,
    name: 'Cargo for Sale',
    prompt:
      'A trader in second-hand goods offers you 3 sealed cargo canisters for the sum of $1000. It could be a good deal: they could contain robots. Then again, it might just be water. Do you want the canisters?',
    price: 1000,
    randomOccurrence: 3,
    messageOnly: false,
    shouldHideBlock: game => {
      return game.commander.ship.freeCargoBays() < 3;
    },
    action: game => {
      const itemType = runtime.gameRand.randomIntBelow(TRADE_ITEM_COUNT);
      game.commander.ship.boughtQuantity(3, itemType, Math.floor(1000 / 3));

      AlertViewController.presentAlertWithDismiss(
        `The canisters contain ${tradeItemForType(itemType).name.toLowerCase()}.`
      );

      RESET_CURRENT_SPECIAL(game);
      pLog.log(130);
    },
  },
  // Lightning Shield Event
  {
    type: SpecialEvent.InstallLightningShield,
    name: 'Lightning Shield',
    prompt:
      'Colonel Jackson here. Do you want us to install a Lightning shield on your current ship?',
    price: 0,
    randomOccurrence: 0,
    messageOnly: false,
    action: game => {
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
    },
  },
  // Japori Disease Event
  {
    type: SpecialEvent.JaporiDisease,
    name: 'Japori Disease',
    prompt:
      'A strange disease has invaded the Japori system. We would like you to deliver these ten canisters of special antidote to Japori. Note that, if you accept, ten of your cargo bays will remain in use on your way to Japori. Do you accept this mission?',
    price: 0,
    randomOccurrence: 1,
    messageOnly: false,
    shouldHideBlock: game => {
      return (
        game.commander.policeRecordScore < PoliceRecordScore.Dubious ||
        game.japoriQuestStatus !== JaporiQuestStatus.Open
      );
    },
    action: game => {
      let alertString;
      if (game.commander.ship.freeCargoBays() < 10) {
        pLog.log(111);
        alertString = 'You must have at least 10 free cargo bays to accept this mission.';
      } else {
        pLog.log(112);
        alertString = 'Ten of your cargo bays now contain antidote for the Japori system.';
        game.commander.ship.boughtQuantity(10, FAKE_QUEST_CARGO, 0);
        game.japoriQuestStatus = JaporiQuestStatus.HasMedicine;
        RESET_CURRENT_SPECIAL(game);
      }

      AlertViewController.presentAlertWithDismiss(alertString);
    },
  },
  // Lottery Winner Event
  {
    type: SpecialEvent.LotteryWinner,
    name: 'Lottery Winner',
    prompt:
      'What luck! While docking in the space port, you receive a message that you won $1000 in a lottery. The prize has been added to your account.',
    price: -1000,
    randomOccurrence: 0,
    messageOnly: true,
  },
  // Artifact Delivery Event
  {
    type: SpecialEvent.ArtifactDelivered,
    name: 'Artifact Delivery',
    prompt:
      "This is Professor Berger. I thank you for delivering the alien artifact to me. I hope the aliens weren't too much of a nuisance. I have transferred $20000 to your account, which I assume compensates you for your troubles.",
    price: -20000,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return !game.commander.artifactOnBoard;
    },
    action: game => {
      game.commander.artifactOnBoard = false;
      RESET_CURRENT_SPECIAL(game);
      pLog.log(136);
    },
  },
  // Alien Artifact Event
  {
    type: SpecialEvent.AlienArtifact,
    name: 'Alien Artifact',
    prompt:
      'This alien artifact should be delivered to Professor Berger, who is currently traveling. You can probably find him at a hi-tech solar system. The alien race which produced this artifact seems keen on getting it back, however, and may hinder the carrier. Are you, for a price, willing to deliver it?',
    price: 0,
    randomOccurrence: 0,
    messageOnly: false,
    shouldHideBlock: game => {
      return game.commander.policeRecordScore < PoliceRecordScore.Dubious;
    },
    action: game => {
      game.commander.artifactOnBoard = true;
      RESET_CURRENT_SPECIAL(game);
      pLog.log(135);
    },
  },
  // Ambassador Jarek Event
  {
    type: SpecialEvent.AmbassadorJarek,
    name: 'Ambassador Jarek',
    prompt:
      'A recent change in the political climate of this solar system has forced ambassador Jarek to flee back to his home system, Devidia. Would you be willing to give him a lift?',
    price: 0,
    randomOccurrence: 1,
    messageOnly: false,
    shouldHideBlock: game => {
      return game.commander.policeRecordScore < PoliceRecordScore.Dubious;
    },
    action: game => {
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
    },
  },
  // Alien Invasion Event
  {
    type: SpecialEvent.AlienInvasion,
    name: 'Alien Invasion',
    prompt:
      "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days.",
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    action: game => {
      game.invasionStatus = InvasionQuestStatus.DaysUntilInvasion._7;
      RESET_CURRENT_SPECIAL(game);
    },
  },
  // Gemulon Invaded Event
  {
    type: SpecialEvent.GemulonInvaded,
    name: 'Gemulon Invaded',
    prompt:
      'Alas, Gemulon has been invaded by aliens, which has thrown us back to pre-agricultural times. If only we had known the exact coordinates where they first arrived at our system, we might have prevented this tragedy from happening.',
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
  },
  // Fuel Compactor Event
  {
    type: SpecialEvent.GetFuelCompactor,
    name: 'Fuel Compactor',
    prompt: 'Do you wish for us to install the fuel compactor on your current ship?',
    price: 0,
    randomOccurrence: 0,
    messageOnly: false,
    action: game => {
      let alertString;
      if (game.commander.ship.freeSlotsForAccessoryType(AccessoryType.GadgetFuelCompactor) > 0) {
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
    },
  },
  // Dangerous Experiment Event
  {
    type: SpecialEvent.Experiment,
    name: 'Dangerous Experiment',
    prompt:
      "While reviewing the plans for Dr. Fehler's new space-warping drive, Dr. Lowenstam discovered a critical error. If you don't go to Daled and stop the experiment within ten days, the space-time continuum itself could be damaged!",
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.commander.policeRecordScore < PoliceRecordScore.Dubious;
    },
    action: game => {
      game.experimentStatus = ExperimentQuestStatus.DaysRemaining._10;
      RESET_CURRENT_SPECIAL(game);
      pLog.log(147);
    },
  },
  // Jonathan Wild Event
  {
    type: SpecialEvent.TransportWild,
    name: 'Jonathan Wild',
    prompt:
      "Law Enforcement is closing in on notorious criminal kingpin Jonathan Wild. He would reward you handsomely for smuggling him home to Kravat. You'd have to avoid capture by the Police on the way. Are you willing to give him a berth?",
    price: 0,
    randomOccurrence: 1,
    messageOnly: false,
    shouldHideBlock: game => {
      return game.commander.policeRecordScore >= PoliceRecordScore.Dubious;
    },
    action: game => {
      let alertString = null;

      if (game.commander.ship.crewCount() >= game.commander.ship.model.mercenaryQuarters()) {
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
    },
  },
  // Morgan's Reactor Event
  {
    type: SpecialEvent.GetReactor,
    name: "Morgan's Reactor",
    prompt:
      "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?",
    price: 0,
    randomOccurrence: 0,
    messageOnly: false,
    shouldHideBlock: game => {
      return (
        game.commander.policeRecordScore >= PoliceRecordScore.Dubious ||
        game.commander.reputationScore < ReputationScore.Average ||
        game.reactorStatus !== ReactorQuestStatus.Open ||
        game.wildStatus === WildQuestStatus.OnBoard
      );
    },
    action: game => {
      if (game.commander.ship.freeCargoBays() < REACTOR_BAY_COUNT + REACTOR_MAX_FUEL) {
        AlertViewController.presentAlertWithDismiss(
          "You don't have enough empty cargo bays at the moment."
        );
        pLog.log(150);
        return;
      }

      game.commander.ship.boughtQuantity(
        REACTOR_BAY_COUNT + REACTOR_MAX_FUEL,
        FAKE_QUEST_CARGO_REACTOR,
        0
      );
      game.reactorStatus = ReactorQuestStatus.DaysRemaining._20;

      AlertViewController.presentAlertWithDismiss(
        'Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.'
      );

      RESET_CURRENT_SPECIAL(game);
      pLog.log(151);
    },
  },
  // Install Morgan's Laser Event
  {
    type: SpecialEvent.GetSpecialLaser,
    name: "Install Morgan's Laser",
    prompt:
      "Morgan's technicians are standing by with something that looks a lot like a military laser -- if you ignore the additional cooling vents and anodized ducts. Do you want them to install Morgan's special laser?",
    price: 0,
    randomOccurrence: 0,
    messageOnly: false,
    action: game => {
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
    },
  },
  // Scarab Stolen Event
  {
    type: SpecialEvent.Scarab,
    name: 'Scarab Stolen',
    prompt:
      "Captain Renwick developed a new organic hull material for his ship which cannot be damaged except by Pulse lasers. While he was celebrating this success, pirates boarded and stole the craft, which they have named the Scarab. Rumors suggest it's being hidden at the exit to a wormhole. Destroy the ship for a reward!",
    price: 0,
    randomOccurrence: 1,
    messageOnly: true,
    shouldHideBlock: game => {
      return (
        game.commander.reputationScore < ReputationScore.Average ||
        game.scarabStatus !== ScarabQuestStatus.Open
      );
    },
    action: game => {
      game.scarabStatus = ScarabQuestStatus.ScarabExists;
      RESET_CURRENT_SPECIAL(game);
    },
  },
  // Upgrade Hull Event
  {
    type: SpecialEvent.GetHullUpgraded,
    name: 'Upgrade Hull',
    prompt:
      "The organic hull used in the Scarab is still not ready for day-to-day use. But Captain Renwick can certainly upgrade your hull with some of his retrofit technology. It's light stuff, and won't reduce your ship's range. Should he upgrade your ship?",
    price: 0,
    randomOccurrence: 0,
    messageOnly: false,
    shouldHideBlock: game => {
      return game.scarabStatus !== ScarabQuestStatus.ScarabDestroyed;
    },
    action: game => {
      game.commander.ship.setUpgradedHull(true);
      game.scarabStatus = ScarabQuestStatus.Closed;
      RESET_CURRENT_SPECIAL(game);

      AlertViewController.presentAlertWithDismiss(
        "Technicians spent the day replacing welds and bolts, and adding materials to your ship. When they're done, they tell you your ship should be significantly sturdier."
      );
      pLog.log(171);
    },
  },
  // Scarab Destroyed Event
  {
    type: SpecialEvent.ScarabDestroyed,
    name: 'Scarab Destroyed',
    prompt:
      "Space Corps is indebted to you for destroying the Scarab and the pirates who stole it. As a reward, we can have Captain Renwick upgrade the hull of your ship. Note that his upgrades won't be transferable if you buy a new ship! Come back with the ship you wish to upgrade.",
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.scarabStatus !== ScarabQuestStatus.ScarabDestroyed;
    },
    action: game => {
      game.commander.currentSystem.setSpecialEvent(SpecialEvent.GetHullUpgraded);
    },
  },
  // Reactor Delivered Event
  {
    type: SpecialEvent.ReactorDelivered,
    name: 'Reactor Delivered',
    prompt:
      'Henry Morgan takes delivery of the reactor with great glee. His men immediately set about stabilizing the fuel system. As a reward, Morgan offers you a special, high-powered laser that he designed. Return with an empty weapon slot when you want it installed.',
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return !(
        game.reactorStatus > ReactorQuestStatus.Open &&
        game.reactorStatus < ReactorQuestStatus.ClosedTooLate
      );
    },
    action: game => {
      game.commander.ship.soldQuantity(
        REACTOR_BAY_COUNT + REACTOR_MAX_FUEL,
        FAKE_QUEST_CARGO_REACTOR
      );
      game.commander.currentSystem.setSpecialEvent(SpecialEvent.GetSpecialLaser);
      game.reactorStatus = ReactorQuestStatus.ClosedSaved;
      pLog.log(161);
    },
  },
  // Jarek Gets Out Event
  {
    type: SpecialEvent.JarekGetsOut,
    name: 'Jarek Gets Out',
    prompt:
      'Ambassador Jarek is very grateful to you for delivering him back to Devidia. As a reward, he gives you an experimental handheld haggling computer, which allows you to gain larger discounts when purchasing goods and equipment.',
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.jarekStatus !== JarekQuestStatus.OnBoard;
    },
    action: game => {
      game.jarekStatus = JarekQuestStatus.Closed;
      game.commander.carriesMaxTraderBoost = true;
      game.commander.ship.removeCrewMemberWithName('Ambassador Jarek');
      RESET_CURRENT_SPECIAL(game);
      pLog.log(139);
    },
  },
  // Gemulon Rescued Event
  {
    type: SpecialEvent.GemulonRescued,
    name: 'Gemulon Rescued',
    prompt:
      'This information of the arrival of the alien invasion force allows us to prepare a defense. You have saved our way of life. As a reward, we have a fuel compactor gadget for you, which allows you to travel 18 parsecs with any ship. Return here to get it installed.',
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return !(
        game.invasionStatus >= InvasionQuestStatus.DaysUntilInvasion._7 &&
        game.invasionStatus <= InvasionQuestStatus.DaysUntilInvasion._1
      );
    },
    action: game => {
      game.invasionStatus = InvasionQuestStatus.ClosedSaved;
      game.commander.currentSystem.setSpecialEvent(SpecialEvent.GetFuelCompactor);
      pLog.log(133);
    },
  },
  // Disaster Averted Event
  {
    type: SpecialEvent.ExperimentStopped,
    name: 'Disaster Averted',
    prompt:
      'Upon your warning, Dr. Fehler calls off the experiment. As a reward, you are given a Portable Singularity. This device will, for one time only, instantaneously transport you to any system in the galaxy. The Singularity can be accessed on the Galactic Chart.',
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return !(
        game.experimentStatus >= ExperimentQuestStatus.DaysRemaining._10 &&
        game.experimentStatus <= ExperimentQuestStatus.DaysRemaining._1
      );
    },
    action: game => {
      game.experimentStatus = ExperimentQuestStatus.ClosedSaved;
      game.canSuperWarp = true;
      RESET_CURRENT_SPECIAL(game);
      pLog.log(148);
    },
  },
  // Experiment Failed Event
  {
    type: SpecialEvent.ExperimentNotStopped,
    name: 'Experiment Failed',
    prompt:
      "Dr. Fehler can't understand why the experiment failed. But the failure has had a dramatic and disastrous effect on the fabric of space-time itself. It seems that Dr. Fehler won't be getting tenure any time soon...and you may have trouble when you warp!",
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
  },
  // Wild Gets Out Event
  {
    type: SpecialEvent.WildGetsOut,
    name: 'Wild Gets Out',
    prompt:
      'Jonathan Wild is most grateful to you for spiriting him to safety. As a reward, he has one of his Cyber Criminals hack into the Police Database, and clean up your record. He also offers you the opportunity to take his talented nephew Zeethibal along as a Mercenary with no pay.',
    price: 0,
    randomOccurrence: 0,
    messageOnly: true,
    shouldHideBlock: game => {
      return game.wildStatus !== WildQuestStatus.OnBoard;
    },
    action: game => {
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
    },
  },
];

const EVENTS: SpecialEventSpecifier[] = SPECS.map(spec => ({
  shouldHideBlock: () => false,
  action: RESET_CURRENT_SPECIAL,
  ...spec,
}));

const BY_TYPE = new Map(EVENTS.map(event => [event.type, event]));

// The event with this number, or undefined for "no event".
export function specialEventForType(type: number): SpecialEventSpecifier | undefined {
  return BY_TYPE.get(type);
}

// Each randomly placed event's number, once per system that should get it.
export function randomOccurrenceEventTypes(): number[] {
  return EVENTS.flatMap(event => Array<number>(event.randomOccurrence).fill(event.type));
}

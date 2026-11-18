import { AccessoryType } from './Accessory.ts';
import { AlertActionType, AlertViewController } from './alerts.ts';
import {
  CAUGHT_WITH_WILD_SCORE,
  MAX_SKILL_LEVEL,
  policeRecordMultiplier,
  PoliceRecordScore,
  ReputationScore,
} from './Commander.ts';
import { EncounterController } from './EncounterController.ts';
import { EncounterType } from './encounter/types.ts';
import type { EncounterListener } from './encounter/types.ts';
import { GameEndStatus, RareEvent, RARE_EVENT_COUNT } from './Game.ts';
import { Opponent, OpponentType, OPPONENT_TYPE_COUNT } from './Opponent.ts';
import { MAX_TRIBBLES, Ship, ShipModelType } from './Ship.ts';
import {
  Difficulty,
  DragonflyQuestStatus,
  InvasionQuestStatus,
  JaporiQuestStatus,
  JarekQuestStatus,
  MonsterQuestStatus,
  ReactorQuestStatus,
  ScarabQuestStatus,
  SpecialEvent,
  WildQuestStatus,
} from './SolarSystem.types.ts';
import { TradeItemType } from './TradeItem.types.ts';
import { Store } from './Store.ts';
import type { SolarSystem } from './SolarSystem.ts';
import type { Game, GameEndedStatus } from './Game.ts';
import { ensureArrayOrNull, ensureInteger } from './ensure.ts';
import { pLog } from './probes.ts';
import { runtime } from './runtime.ts';

export const CHANCE_OF_TRADE_IN_ORBIT = 100;

// Whether the commander's options hide this meeting with a trader: "ignore traders" hides
// those that flee or ignore, "ignore trade in orbit" hides offers to buy or sell.
export function hiddenByOptions(encounterType: number, game: Game): boolean {
  const { TraderFlee, TraderIgnore, TraderSell, TraderBuy } = EncounterType;
  const passesBy = encounterType === TraderFlee || encounterType === TraderIgnore;
  const offersTrade = encounterType === TraderSell || encounterType === TraderBuy;
  return (passesBy && game.alwaysIgnoreTraders) || (offersTrade && game.alwaysIgnoreTradeInOrbit);
}

// How a trip ended: the commander arrived, or the game is over.
export type TravelResult = 'arrived' | GameEndedStatus;

// One trip between two systems: what is met on the way, the fights, and the arrival.
// The travel screen watches this and draws what it finds.
export class Travel extends Store implements EncounterListener {
  declare _game: Game;
  declare _origin: SolarSystem;
  declare _destination: SolarSystem;
  declare _destWasVisited: boolean;
  declare _startClicksRemaining: number;
  declare _startedEncounters: boolean;
  declare _needPostMarieCustomsPolice: boolean;
  declare _encounterController: EncounterController | null;
  declare _done: (result: TravelResult) => void;
  // How far along the trip is, from 0 to 1.
  progress = 0;
  private onProgress: ((progress: number) => void) | null = null;

  constructor(
    game: Game,
    origin: SolarSystem,
    destination: SolarSystem,
    wasVisited: boolean,
    done: (result: TravelResult) => void
  ) {
    super();
    this._game = game;
    this._origin = origin;
    this._destination = destination;
    this._destWasVisited = wasVisited;
    this._startClicksRemaining = this._game.commander.travelClicksRemaining;
    this._startedEncounters = false;
    this._needPostMarieCustomsPolice = false;
    this._encounterController = null;
    this._done = done;
  }

  get game() {
    return this._game;
  }
  get origin() {
    return this._origin;
  }
  get destination() {
    return this._destination;
  }
  get wasVisited() {
    return this._destWasVisited;
  }
  get encounter() {
    return this._encounterController;
  }

  // Lets the screen hear about each move as it happens. Returns a function that stops it.
  watchProgress(listener: (progress: number) => void): () => void {
    this.onProgress = listener;
    return () => {
      if (this.onProgress === listener) this.onProgress = null;
    };
  }

  // Begins the trip. Safe to call again; it only starts once.
  start() {
    if (!this._startedEncounters) {
      this._startedEncounters = true;
      this._processEncounters();
    }
  }

  // The player picked one of the encounter's buttons.
  perform(action: string) {
    this._encounterController!.performAction(action);
  }

  _processEncounters() {
    const eventLoopInitialClicks = this._game.commander.travelClicksRemaining;
    let currentClicks = eventLoopInitialClicks;

    currentClicks = Math.max(currentClicks - 1, 0);
    if (currentClicks <= 0) {
      this._game.commander.travelClicksRemaining = currentClicks;
      this._setProgress(1 - (currentClicks * 1.0) / this._startClicksRemaining);
    }

    while (currentClicks > 0) {
      let encounterType: number = EncounterType.None;

      this._game.commander.travelClicksRemaining = currentClicks;
      this._setProgress(1 - (currentClicks * 1.0) / this._startClicksRemaining);

      // Automatic repairs based on engineering skill
      const engineerSkill = this._game.commander.ship.crewEngineerSkillIncludingCommander(
        this._game.commander
      );
      let repairAmount = runtime.gameRand.randomIntBelow(engineerSkill / 2);

      repairAmount = this._game.commander.ship.repairHullByAmount(repairAmount);
      this._game.commander.ship.rechargeShieldPowerByAmount(2 * repairAmount); // Shields are easier to recharge

      let opponentType: number = OPPONENT_TYPE_COUNT;

      if (currentClicks === 1 && this._needPostMarieCustomsPolice) {
        opponentType = OpponentType.Police;
      } else if (
        currentClicks === 1 &&
        this._destination.name === 'Acamar' &&
        this._game.monsterStatus === MonsterQuestStatus.MonsterExists
      ) {
        opponentType = OpponentType.Monster;
      } else if (
        currentClicks === 1 &&
        this._destination.name === 'Zalkon' &&
        this._game.dragonflyStatus === DragonflyQuestStatus.GoToZalkon
      ) {
        opponentType = OpponentType.Dragonfly;
      } else if (
        currentClicks === 20 &&
        this._destination.specialEvent === SpecialEvent.ScarabDestroyed &&
        this._game.scarabStatus === ScarabQuestStatus.ScarabExists &&
        this._game.commander.arrivedViaWormhole
      ) {
        opponentType = OpponentType.Scarab;
        pLog.log(169);
      } else if (
        this._destination.name === 'Gemulon' &&
        this._game.invasionStatus === InvasionQuestStatus.ClosedTooLate
      ) {
        if (runtime.gameRand.randomIntBelow(10) > 4) {
          opponentType = OpponentType.Mantis;
        }
      } else {
        let encounterTest = runtime.gameRand.randomIntBelow(44 - 2 * this._game.difficulty);

        // Fleas have half as many encounters
        if (this._game.commander.ship.type === ShipModelType.Flea) {
          encounterTest *= 2;
        }

        ensureInteger(encounterTest);

        if (
          encounterTest < this._destination.politics.occurrencePirates &&
          !this._game.commander.raided
        ) {
          opponentType = OpponentType.Pirate;
        } else if (
          encounterTest <
          this._destination.politics.occurrencePirates +
            this._destination.politics.occurrencePolice *
              policeRecordMultiplier(this._game.commander.policeRecordScore)
        ) {
          opponentType = OpponentType.Police;
        } else if (
          encounterTest <
          this._destination.politics.occurrencePirates +
            this._destination.politics.occurrencePolice *
              policeRecordMultiplier(this._game.commander.policeRecordScore) +
            this._destination.politics.occurrenceTraders
        ) {
          opponentType = OpponentType.Trader;
        } else {
          // Welcome to Kravat, outlaw!
          if (
            this._game.wildStatus === WildQuestStatus.OnBoard &&
            this._destination.name === 'Kravat'
          ) {
            const diceRoll = runtime.gameRand.randomIntBelow(100);
            if (
              (this._game.difficulty <= Difficulty.Easy && diceRoll < 25) ||
              (this._game.difficulty === Difficulty.Normal && diceRoll < 33) ||
              (this._game.difficulty > Difficulty.Normal && diceRoll < 50)
            ) {
              pLog.log(125);
              opponentType = OpponentType.Police;
            }
          }
        }

        ensureInteger(opponentType);

        if (opponentType >= OPPONENT_TYPE_COUNT) {
          if (this._game.commander.artifactOnBoard && runtime.gameRand.randomIntBelow(20) <= 3) {
            opponentType = OpponentType.Mantis;
          }
        }
      }

      let opponent = null;

      if (opponentType === OpponentType.Police) {
        opponent = Opponent.generateOpponentWithType(opponentType, this._game);

        if (currentClicks === 1 && this._needPostMarieCustomsPolice) {
          encounterType = EncounterType.PostMarieCelestePoliceEncounter;
          this._needPostMarieCustomsPolice = false;
        } else {
          encounterType = EncounterType.PoliceIgnore;
          const policeHaveWeapons = opponent.ship.weapons.length > 0;

          if (
            this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
              this._game.commander,
              opponent
            )
          ) {
            encounterType = EncounterType.PoliceIgnore;
          } else if (this._game.commander.policeRecordScore < PoliceRecordScore.Dubious) {
            // If you're a criminal, the police will try to attack
            if (!policeHaveWeapons) {
              if (
                opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(
                  opponent,
                  this._game.commander
                )
              ) {
                encounterType = EncounterType.PoliceIgnore;
              } else {
                encounterType = EncounterType.PoliceFlee;
              }
            } else if (this._game.commander.reputationScore < ReputationScore.Average) {
              encounterType = EncounterType.PoliceAttack;
            } else if (
              runtime.gameRand.randomIntBelow(ReputationScore.Elite) >
              Math.floor(this._game.commander.reputationScore / (1 + opponent.ship.type))
            ) {
              encounterType = EncounterType.PoliceAttack;
            } else if (
              opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)
            ) {
              encounterType = EncounterType.PoliceIgnore;
            } else {
              encounterType = EncounterType.PoliceFlee;
            }
          } else if (
            this._game.commander.policeRecordScore >= PoliceRecordScore.Dubious &&
            this._game.commander.policeRecordScore < PoliceRecordScore.Clean &&
            !this._game.commander.inspected
          ) {
            // If your reputation is dubious, the police will inspect you
            encounterType = EncounterType.PoliceInspection;
            this._game.commander.inspected = true;
          } else if (this._game.commander.policeRecordScore < PoliceRecordScore.Lawful) {
            // Clean record, infrequent inspections
            if (
              runtime.gameRand.randomIntBelow(12 - this._game.difficulty) < 1 &&
              !this._game.commander.inspected
            ) {
              encounterType = EncounterType.PoliceInspection;
              this._game.commander.inspected = true;
            }
          } else {
            // Lawful trader, very infrequent inspections
            if (runtime.gameRand.randomIntBelow(40) === 1 && !this._game.commander.inspected) {
              encounterType = EncounterType.PoliceInspection;
              this._game.commander.inspected = true;
            }
          }

          // Police aren't intimidated if your ship is weaker
          if (
            encounterType === EncounterType.PoliceFlee &&
            opponent.ship.type > this._game.commander.ship.type
          ) {
            if (
              policeHaveWeapons &&
              this._game.commander.policeRecordScore < PoliceRecordScore.Dubious
            ) {
              encounterType = EncounterType.PoliceAttack;
            } else {
              encounterType = EncounterType.PoliceInspection;
            }
          }

          const noConfrontation =
            encounterType === EncounterType.PoliceFlee ||
            encounterType === EncounterType.PoliceIgnore;

          if (
            noConfrontation &&
            opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)
          ) {
            encounterType = EncounterType.None;
          } else if (noConfrontation && this._game.alwaysIgnorePolice) {
            encounterType = EncounterType.None;
          }
        }
      } else if (opponentType === OpponentType.Pirate || opponentType === OpponentType.Mantis) {
        opponent = Opponent.generateOpponentWithType(opponentType, this._game);

        if (opponentType === OpponentType.Mantis) {
          encounterType = EncounterType.PirateAttack;
        } else if (
          this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
            this._game.commander,
            opponent
          )
        ) {
          encounterType = EncounterType.PirateIgnore;
        } else if (
          opponent.ship.type >= ShipModelType.Grasshopper ||
          opponent.ship.type > this._game.commander.ship.type ||
          runtime.gameRand.randomIntBelow(ReputationScore.Elite) >
            Math.floor((this._game.commander.reputationScore * 4) / (1 + opponent.ship.type))
        ) {
          // Pirates mostly attack but will flee if commander's reputation is too high
          encounterType = EncounterType.PirateAttack;
        } else {
          encounterType = EncounterType.PirateFlee;
        }

        const noConfrontation =
          encounterType === EncounterType.PirateFlee ||
          encounterType === EncounterType.PirateIgnore;

        // If this isn't a confrontation and we can't see the pirate, skip the encounter
        if (
          noConfrontation &&
          opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)
        ) {
          encounterType = EncounterType.None;
        } else if (noConfrontation && this._game.alwaysIgnorePirates) {
          encounterType = EncounterType.None;
        }
      } else if (opponentType === OpponentType.Trader) {
        opponent = Opponent.generateOpponentWithType(opponentType, this._game);
        encounterType = EncounterType.TraderIgnore;

        if (
          this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
            this._game.commander,
            opponent
          )
        ) {
          encounterType = EncounterType.TraderIgnore;
        } else if (this._game.commander.policeRecordScore <= PoliceRecordScore.Criminal) {
          // Traders flee from sketchy commanders
          if (
            runtime.gameRand.randomIntBelow(ReputationScore.Elite) <=
            Math.floor((this._game.commander.reputationScore * 10) / (1 + opponent.ship.type))
          ) {
            if (
              opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)
            ) {
              encounterType = EncounterType.TraderIgnore;
            } else {
              encounterType = EncounterType.TraderFlee;
            }
          }
        }

        if (
          encounterType === EncounterType.TraderIgnore &&
          runtime.gameRand.randomIntBelow(1000) < CHANCE_OF_TRADE_IN_ORBIT
        ) {
          if (
            this._game.commander.ship.freeCargoBays() > 0 &&
            opponent.ship.hasTradeableItemsForSystem(
              this._game.commander.currentSystem,
              this._game.commander.policeRecordScore < PoliceRecordScore.Dubious
            )
          ) {
            encounterType = EncounterType.TraderSell;
          } else if (
            this._game.commander.ship.hasTradeableItemsForSystem(
              this._game.commander.currentSystem,
              this._game.commander.policeRecordScore < PoliceRecordScore.Dubious
            )
          ) {
            encounterType = EncounterType.TraderBuy;
          }
        }

        if (opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)) {
          encounterType = EncounterType.None;
        } else if (hiddenByOptions(encounterType, this._game)) {
          encounterType = EncounterType.None;
        }
      } else if (opponentType === OpponentType.Scarab) {
        opponent = Opponent.generateOpponentWithType(opponentType, this._game);
        encounterType = EncounterType.ScarabAttack;

        if (
          this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
            this._game.commander,
            opponent
          )
        ) {
          encounterType = EncounterType.ScarabIgnore;
        }
      } else if (opponentType === OpponentType.Dragonfly) {
        opponent = Opponent.generateOpponentWithType(opponentType, this._game);
        encounterType = EncounterType.DragonflyAttack;

        if (
          this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
            this._game.commander,
            opponent
          )
        ) {
          encounterType = EncounterType.DragonflyIgnore;
        }
      } else if (opponentType === OpponentType.Monster) {
        opponent = Opponent.generateOpponentWithType(opponentType, this._game);
        encounterType = EncounterType.MonsterAttack;

        if (
          this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
            this._game.commander,
            opponent
          )
        ) {
          encounterType = EncounterType.MonsterIgnore;
        }
      } else {
        // Very Rare Random Events:
        // 1. Encounter the abandoned Marie Celeste, which you may loot.
        // 2. Captain Ahab will trade your Reflective Shield for skill points in Piloting.
        // 3. Captain Conrad will trade your Military Laser for skill points in Engineering.
        // 4. Captain Huie will trade your Military Laser for points in Trading.
        // 5. Encounter an expired bottle of Captain Marmoset's Skill Tonic. This will affect skills depending on game difficulty level.
        // 6. Encounter a good bottle of Captain Marmoset's Skill Tonic, which will improve a random skill one or two times, depending on difficulty.

        if (
          this._game.forceRareEvent || // testing hook
          (this._game.commander.days > 10 && runtime.gameRand.randomIntBelow(1000) < 5)
        ) {
          const rareEvents = this._game.remainingRareEvents;
          ensureArrayOrNull(rareEvents, 'number');

          const index =
            rareEvents.length > 0 ? runtime.gameRand.randomIntBelow(rareEvents.length) : -1;
          const rareEvent = index !== -1 ? rareEvents[index] : RARE_EVENT_COUNT;

          ensureInteger(rareEvent);

          switch (rareEvent) {
            case RareEvent.CaptainAhab:
              if (
                this._game.commander.ship.hasShieldOfType(AccessoryType.ShieldReflective) &&
                this._game.commander.pilot < MAX_SKILL_LEVEL &&
                this._game.commander.policeRecordScore > PoliceRecordScore.Criminal
              ) {
                pLog.log(95);
                encounterType = EncounterType.FamousCaptainAhabEncounter;
                opponent = Opponent.generateOpponentWithType(
                  OpponentType.FamousCaptain,
                  this._game
                );
              }
              break;

            case RareEvent.CaptainConrad:
              if (
                this._game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser) &&
                this._game.commander.engineer < MAX_SKILL_LEVEL &&
                this._game.commander.policeRecordScore > PoliceRecordScore.Criminal
              ) {
                pLog.log(96);
                encounterType = EncounterType.FamousCaptainConradEncounter;
                opponent = Opponent.generateOpponentWithType(
                  OpponentType.FamousCaptain,
                  this._game
                );
              }
              break;

            case RareEvent.CaptainHuie:
              if (
                this._game.commander.ship.hasWeaponOfType(AccessoryType.WeaponMilitaryLaser) &&
                this._game.commander.trader < MAX_SKILL_LEVEL &&
                this._game.commander.policeRecordScore > PoliceRecordScore.Criminal
              ) {
                pLog.log(97);
                encounterType = EncounterType.FamousCaptainHuieEncounter;
                opponent = Opponent.generateOpponentWithType(
                  OpponentType.FamousCaptain,
                  this._game
                );
              }
              break;

            case RareEvent.MarieCeleste:
              pLog.log(98);
              encounterType = EncounterType.MarieCelesteEncounter;
              opponent = Opponent.generateOpponentWithType(OpponentType.MarieCeleste, this._game);
              break;

            case RareEvent.BottleOld:
              pLog.log(99);
              encounterType = EncounterType.BottleOld;
              opponent = Opponent.generateOpponentWithType(OpponentType.Bottle, this._game);
              break;

            case RareEvent.BottleGood:
              pLog.log(100);
              encounterType = EncounterType.BottleGood;
              opponent = Opponent.generateOpponentWithType(OpponentType.Bottle, this._game);
              break;

            default:
              break;
          }

          if (encounterType !== EncounterType.None) {
            this._game.removeRemainingRareEvent(rareEvent);
          }
        }
      }

      if (encounterType !== EncounterType.None && opponent) {
        const encounterController = new EncounterController(
          encounterType,
          this._game,
          opponent,
          this
        );
        this.setEncounterController(encounterController);
        return;
      }

      currentClicks--;
    }

    this._game.handleArrival();

    this._setProgress(1);
    this.setEncounterController(null);

    const alertStrings = [];

    alertStrings.push(
      eventLoopInitialClicks >= this._startClicksRemaining
        ? 'After an uneventful trip, you arrive at your destination.'
        : 'You arrive at your destination.'
    );

    if (this._game.commander.debt >= 75000) {
      alertStrings.push(
        'Your debt is getting too large. Reduce it quickly or your ship will be put on a chain!'
      );
    } else if (
      this._game.commander.debt > 0 &&
      this._game.remindLoans &&
      this._game.commander.days % 5 === 0
    ) {
      alertStrings.push(`You have a debt of $${this._game.commander.debt}.`);
    }

    switch (this._game.reactorStatus) {
      case 2:
        alertStrings.push(
          "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good."
        );
        pLog.log(152);
        break;
      case 16:
        alertStrings.push(
          "The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation."
        );
        pLog.log(153);
        break;
      case 18:
        alertStrings.push(
          'The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.'
        );
        pLog.log(154);
        break;
      case ReactorQuestStatus.DaysRemaining._1: {
        this._game.reactorStatus = ReactorQuestStatus.ClosedTooLate;

        const alerts = [];

        alerts.push(
          'Just as you approach the docking bay, the reactor explodes into a huge radioactive fireball!'
        );
        if (!this._game.commander.hasEscapePod) {
          alerts.push('You are destroyed along with your ship as a result of the explosion.');
        }

        this._promptForStrings(alerts, () => {
          if (this._game.commander.hasEscapePod) {
            this._performPodEscape();
            pLog.log(155);
          } else {
            this._done(GameEndStatus.Killed);
            pLog.log(156);
          }
        });

        return;
      }
    }

    let foodOnBoard = false;
    let currentTribbles = this._game.commander.ship.tribbles;
    ensureInteger(currentTribbles);

    const previousTribbles = currentTribbles;
    const reactorStatus =
      this._game.reactorStatus > ReactorQuestStatus.Open &&
      this._game.reactorStatus < ReactorQuestStatus.ClosedTooLate;

    if (currentTribbles > 0 && reactorStatus) {
      currentTribbles = Math.floor(currentTribbles / 2);
      if (currentTribbles < 10) {
        currentTribbles = 0;
        alertStrings.push(
          'The radiation from the Ion Reactor is deadly to Tribbles. All of the Tribbles on board your ship have died.'
        );
      } else {
        alertStrings.push(
          'The radiation from the Ion Reactor seems to be deadly to Tribbles. Half the Tribbles on board died.'
        );
      }
      pLog.log(157);
    } else if (
      currentTribbles > 0 &&
      this._game.commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics) > 0
    ) {
      currentTribbles = 1 + runtime.gameRand.randomIntBelow(3);
      const amountNarcotics = this._game.commander.ship.tradeItemQuantityForType(
        TradeItemType.Narcotics
      );
      const consumedNarcotics = Math.min(1 + runtime.gameRand.randomIntBelow(3), amountNarcotics);
      this._game.commander.ship.soldQuantity(consumedNarcotics, TradeItemType.Narcotics);
      this._game.commander.ship.boughtQuantity(consumedNarcotics, TradeItemType.Furs, 0);
      alertStrings.push(
        'You find that, instead of narcotics, some of your cargo bays contain only dead tribbles!'
      );
      pLog.log(158);
    } else if (
      currentTribbles > 0 &&
      this._game.commander.ship.tradeItemQuantityForType(TradeItemType.Food) > 0
    ) {
      const amountFood = this._game.commander.ship.tradeItemQuantityForType(TradeItemType.Food);
      currentTribbles += 100 + runtime.gameRand.randomIntBelow(amountFood * 100);
      const foodConsumed = runtime.gameRand.randomIntBelow(amountFood);
      this._game.commander.ship.soldQuantity(foodConsumed, TradeItemType.Food);
      foodOnBoard = true;
      alertStrings.push(
        'You find that, instead of food, some of your cargo bays contain only tribbles!'
      );
      pLog.log(159);
    }

    if (currentTribbles > 0 && currentTribbles < MAX_TRIBBLES) {
      currentTribbles +=
        1 + runtime.gameRand.randomIntBelow(Math.max(1, currentTribbles / (foodOnBoard ? 1 : 2)));
    }

    currentTribbles = Math.min(currentTribbles, MAX_TRIBBLES);
    ensureInteger(currentTribbles);
    this._game.commander.ship.tribbles = currentTribbles;

    if (
      (previousTribbles < 100 && currentTribbles >= 100) ||
      (previousTribbles < 1000 && currentTribbles >= 1000) ||
      (previousTribbles < 10000 && currentTribbles >= 10000) ||
      (previousTribbles < 50000 && currentTribbles >= 50000)
    ) {
      alertStrings.push(
        `Excuse me, but do you realize you have ${currentTribbles >= MAX_TRIBBLES ? 'a dangerous number of' : currentTribbles} tribbles on board your ship?`
      );
    }

    this._game.tribbleMessage = false;

    const engineerSkill = this._game.commander.ship.crewEngineerSkillIncludingCommander(
      this._game.commander
    );
    const repairAmount = runtime.gameRand.randomIntBelow(engineerSkill);
    this._game.commander.ship.repairHullByAmount(repairAmount);

    let failString = '';
    if (this._game.autoFuel) {
      pLog.log(37);
      this._game.commander.attemptPurchaseOfFuel(this._game.commander.ship.fuelTankCapacity());
      if (this._game.commander.ship.fuelTankCapacity() !== this._game.commander.ship.fuel) {
        failString += 'full tanks';
      }
    }

    if (this._game.autoRepairs) {
      pLog.log(38);
      this._game.commander.attemptPurchaseOfRepairs(
        this._game.commander.ship.maximumHullStrength()
      );
      if (this._game.commander.ship.maximumHullStrength() !== this._game.commander.ship.hull) {
        failString += `${failString.length > 0 ? ' or ' : ''}full hull repairs`;
      }
    }

    this._promptForStrings(alertStrings, () => {
      this._done('arrived');

      if (failString.length > 0) {
        const aC = new AlertViewController(`You don't have enough money to buy ${failString}.`);

        aC.addAction('Darn', AlertActionType.Default, null);

        aC.presentView();
      }
    });
  }

  _promptForStrings(alertStrings: string[], completion: () => void) {
    const firstString = alertStrings.length > 0 ? alertStrings[0] : null;

    if (firstString) {
      alertStrings.shift(); // Removes the first element from the array

      const aC = new AlertViewController(firstString);
      aC.addAction('Dismiss', AlertActionType.Default, () => {
        this._promptForStrings(alertStrings, completion);
      });

      aC.presentView();
    } else {
      completion(); // Call the completion handler when the array is empty
    }
  }

  setEncounterController(eC: EncounterController | null) {
    if (eC !== this._encounterController) {
      if (this._encounterController) {
        this._encounterController.invalidate();
      }

      this._encounterController = eC;
    }

    this.changed();
  }

  _setProgress(progress: number) {
    this.progress = progress;
    this.onProgress?.(progress);
  }

  // What the encounter tells the trip.

  plundered(anythingTaken: boolean) {
    const type = this._encounterController?.type;
    if (type === EncounterType.MarieCelesteEncounter && anythingTaken) {
      this._needPostMarieCustomsPolice = true;
    }
  }

  continues(fightGoesOn: boolean) {
    if (fightGoesOn) {
      this.changed();
    } else {
      this.setEncounterController(null);
      this._processEncounters();
    }
  }

  hullChanged() {
    this.changed();
  }

  buttonsChanged() {
    this.changed();
  }

  arrested() {
    this.setEncounterController(null);
    this._done('arrived');
  }

  destroyed() {
    this.setEncounterController(null);

    if (this._game.commander.hasEscapePod) {
      pLog.log(29);
      // The pod lands at the destination, which the trip has not reached yet.
      this._game.handleArrival();
      this._performPodEscape();
    } else {
      pLog.log(30);
      this._done(GameEndStatus.Killed);
    }
  }

  _performPodEscape() {
    const alerts = [];

    let reactorStr = '';
    if (
      this._game.reactorStatus > ReactorQuestStatus.Open &&
      this._game.reactorStatus < ReactorQuestStatus.ClosedTooLate
    ) {
      reactorStr =
        ' The destruction of your ship is made much more spectacular by the added explosion of the Ion Reactor.';
      this._game.reactorStatus = ReactorQuestStatus.ClosedTooLate;
      pLog.log(160);
    }

    alerts.push(
      `Just before the final demise of your ship, your escape pod gets activated and ejects you.${reactorStr} After a few days, the Space Corps picks you up and drops you off at a nearby space port.`
    );

    if (this._game.japoriQuestStatus === JaporiQuestStatus.HasMedicine) {
      this._game.japoriQuestStatus = JaporiQuestStatus.Open;
      alerts.push(
        'The antidote for the Japori system was destroyed with your ship. Fortunately, they probably have some new antidote in the system where you originally got it.'
      );
    }

    if (this._game.commander.artifactOnBoard) {
      this._game.commander.artifactOnBoard = false;
      alerts.push(
        "You couldn't take the artifact with you in the escape pod, so now it's lost in the wreckage. The aliens will probably pick it up there."
      );
    }

    if (this._game.jarekStatus === JarekQuestStatus.OnBoard) {
      alerts.push('The Space Corps decides to give ambassador Jarek a lift home to Devidia.');
      this._game.jarekStatus = JarekQuestStatus.Closed;
    }

    if (this._game.wildStatus === WildQuestStatus.OnBoard) {
      alerts.push('Jonathan Wild is arrested, and taken away to stand trial.');
      this._game.wildStatus = WildQuestStatus.Closed;
      this._game.commander.ship.removeCrewMemberWithName('Jonathan Wild');
      this._game.addBreakingNewsItem('Notorious Criminal Jonathan Wild Arrested!');
      this._game.commander.policeRecordScore =
        this._game.commander.policeRecordScore + CAUGHT_WITH_WILD_SCORE;
      pLog.log(31);
    }

    if (this._game.commander.ship.tribbles > 0) {
      alerts.push('Your tribbles all died in the explosion.');
      this._game.commander.ship.tribbles = 0;
    }

    if (this._game.commander.hasInsurance) {
      const shipValue = this._game.commander.ship.shipValuationForInsurance(true);
      this._game.commander.credits = this._game.commander.credits + shipValue;
      alerts.push(
        `Since your ship was insured, the bank pays you $${shipValue}, the total value of the destroyed ship.`
      );
      pLog.log(32);
    }

    this._game.commander.hasInsurance = false;
    this._game.commander.noClaim = 0;
    this._game.commander.hasEscapePod = false;

    alerts.push('In 3 days and with $500, you manage to convert your pod into a Flea.');

    let credits = this._game.commander.credits;
    credits -= 500;
    if (credits < 0) {
      this._game.commander.debt = this._game.commander.debt - credits;
      credits = 0;
      pLog.log(33);
    }
    this._game.commander.credits = credits;

    this._game.timePassed(3);

    const ship = new Ship(ShipModelType.Flea, this._game.difficulty);
    this._game.commander.ship = ship;

    this._promptForStrings(alerts, () => {
      this._done('arrived');
    });
  }
}

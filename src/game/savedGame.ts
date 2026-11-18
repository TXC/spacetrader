// What a saved game looks like, and the one check a saved game goes through before the
// rest of the code may trust it. The types the game uses for saved state come from this
// description, so the check and the types cannot drift apart.
import * as v from 'valibot';
import { PoliticsType } from './Politics.ts';
import { ShipModelType } from './Ship.ts';
import { Difficulty, SystemSize } from './SolarSystem.types.ts';
import { TechLevel } from './TradeItem.types.ts';

// Raise this when the saved format changes, and teach parseSavedGame the older ones.
export const SAVE_VERSION = 1;

const num = v.pipe(v.number(), v.finite());
const numbers = v.array(num);
const bool = v.boolean();
const text = v.string();

// A number that must be one of a list's values, such as a ship model or a difficulty.
function oneOf(list: Record<string, number>) {
  const allowed = new Set(Object.values(list));
  return v.pipe(
    num,
    v.check(value => allowed.has(value))
  );
}
const difficulty = oneOf(Difficulty);

const CrewMemberSchema = v.strictObject({
  name: text,
  pilot: num,
  fighter: num,
  trader: num,
  engineer: num,
  forQuest: bool,
  carriesMaxTraderBoost: bool,
  freeMercenaryCost: bool,
});

// Cargo and its buying prices are saved as two lists each: the kinds, and the amounts.
const ShipSchema = v.strictObject({
  upgradedHull: bool,
  type: oneOf(ShipModelType),
  difficulty,
  fuel: num,
  hull: num,
  tribbles: num,
  currentShieldPower: num,
  cargoKeys: numbers,
  cargoValues: numbers,
  cargoBuyingPriceKeys: numbers,
  cargoBuyingPriceValues: numbers,
  // Written only when the ship has any.
  weaponTypes: v.optional(numbers),
  shieldTypes: v.optional(numbers),
  gadgetTypes: v.optional(numbers),
  crewMap: v.optional(v.record(text, CrewMemberSchema)),
});

const CommanderSchema = v.strictObject({
  ...CrewMemberSchema.entries,
  credits: num,
  debt: num,
  days: num,
  policeKills: num,
  traderKills: num,
  pirateKills: num,
  policeRecordScore: num,
  reputationScore: num,
  noClaim: num,
  travelClicksRemaining: num,
  difficulty,
  boughtMoon: bool,
  hasEscapePod: bool,
  hasInsurance: bool,
  raided: bool,
  inspected: bool,
  litterWarning: bool,
  artifactOnBoard: bool,
  arrivedViaWormhole: bool,
  reserveMoney: bool,
  currentSystemName: text,
  ship: ShipSchema,
  basePrices: v.optional(numbers),
});

const SolarSystemSchema = v.strictObject({
  name: text,
  techLevel: oneOf(TechLevel),
  status: num,
  specialResource: num,
  size: oneOf(SystemSize),
  specialEvent: num,
  difficulty,
  politicsType: oneOf(PoliticsType),
  x: num,
  y: num,
  inventoryReplenishCountdown: num,
  visited: bool,
  wormholeName: v.optional(text),
  mercenary: v.optional(CrewMemberSchema),
  tradeItemInventory: numbers,
});

const GameSchema = v.strictObject({
  // A save from before versions existed is version 1.
  version: v.optional(v.pipe(num, v.maxValue(SAVE_VERSION)), 1),
  monsterStatus: num,
  dragonflyStatus: num,
  scarabStatus: num,
  japoriQuestStatus: num,
  jarekStatus: num,
  invasionStatus: num,
  experimentStatus: num,
  fabricRipProbability: num,
  wildStatus: num,
  reactorStatus: num,
  difficulty,
  endStatus: num,
  monsterHull: num,
  score: num,
  remindLoans: bool,
  tribbleMessage: bool,
  alreadyPaidForNewspaper: bool,
  alwaysIgnorePirates: bool,
  alwaysIgnorePolice: bool,
  alwaysIgnoreTraders: bool,
  alwaysIgnoreTradeInOrbit: bool,
  autoFuel: bool,
  autoRepairs: bool,
  autoNews: bool,
  canSuperWarp: bool,
  breakingNews: v.optional(v.array(text)),
  commander: CommanderSchema,
  warpSystemName: v.optional(text),
  trackedSystemName: v.optional(text),
  uniqueID: text,
  remainingRareEvents: numbers,
  solarSystems: v.array(SolarSystemSchema),
  // A date while the game is in memory, text once it has been through storage.
  lastSave: v.union([text, v.date()]),
});

export type CrewMemberState = v.InferOutput<typeof CrewMemberSchema>;
export type ShipState = v.InferOutput<typeof ShipSchema>;
export type CommanderState = v.InferOutput<typeof CommanderSchema>;
export type SolarSystemState = v.InferOutput<typeof SolarSystemSchema>;
export type GameState = v.InferOutput<typeof GameSchema>;

// Every system a save names must be one of its own systems.
function namesExist(state: GameState): boolean {
  const systems = new Set(state.solarSystems.map(system => system.name));
  const named = [
    state.commander.currentSystemName,
    state.warpSystemName,
    state.trackedSystemName,
    ...state.solarSystems.map(system => system.wormholeName),
  ];
  return named.every(name => name === undefined || systems.has(name));
}

// Checks something read from storage. Gives back the saved game, or null if it is damaged,
// incomplete, or from a newer version of the game than this one.
export function parseSavedGame(value: unknown): GameState | null {
  const result = v.safeParse(GameSchema, value);
  return result.success && namesExist(result.output) ? result.output : null;
}

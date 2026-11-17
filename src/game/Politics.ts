import { TechLevel, TradeItemType } from './TradeItem.types.ts';
import { runtime } from './runtime.ts';

export const PoliticsType = {
  Anarchy: 0,
  Capitalist: 1,
  Communist: 2,
  Confederacy: 3,
  Corporate: 4,
  Cybernetic: 5,
  Democracy: 6,
  Dictatorship: 7,
  Fascist: 8,
  Feudal: 9,
  Military: 10,
  Monarchy: 11,
  Pacifist: 12,
  Socialist: 13,
  Satori: 14,
  Technocracy: 15,
  Theocracy: 16,

  Count: 17,
} as const;
export type PoliticsType = (typeof PoliticsType)[keyof typeof PoliticsType];

const OCCURRENCE = ['No', 'Minimal', 'Few', 'Some', 'Moderate', 'Many', 'Abundant'];

// How common police, pirates or traders are, in words. Anything above the list is excessive.
export function occurrenceStr(x: number): string {
  return OCCURRENCE[x] ?? 'Excessive';
}

// One kind of government, and how a system ruled by it behaves.
export type Politics = {
  readonly type: PoliticsType;
  readonly name: string;
  readonly mastheads: string[];
  readonly headlines: string[];
  readonly reactionIllegal: number;
  readonly occurrencePolice: number;
  readonly occurrencePirates: number;
  readonly occurrenceTraders: number;
  readonly minTechLevel: TechLevel;
  readonly maxTechLevel: TechLevel;
  readonly bribeWillingness: number;
  readonly drugsTradeable: boolean;
  readonly firearmsTradeable: boolean;
  readonly mostDesiredTradeItem: TradeItemType;
};

type Kind = Exclude<PoliticsType, typeof PoliticsType.Count>;

const POLITICS: Record<Kind, Politics> = {
  [PoliticsType.Anarchy]: {
    type: PoliticsType.Anarchy,
    name: 'Anarchist State',
    mastheads: ['The %@ Arsenal', 'The Grassroot', 'Kick It!'],
    headlines: [
      'Riots, Looting Mar Factional Negotiations.',
      'Communities Seek Consensus.',
      'Successful Bakunin Day Rally!',
      'Major Faction Conflict Expected for the Weekend!',
    ],
    reactionIllegal: 0,
    occurrencePolice: 0,
    occurrencePirates: 7,
    occurrenceTraders: 1,
    minTechLevel: TechLevel.PreAgricultural,
    maxTechLevel: TechLevel.Industrial,
    bribeWillingness: 7,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Food,
  },
  [PoliticsType.Capitalist]: {
    type: PoliticsType.Capitalist,
    name: 'Capitalist State',
    mastheads: ['The Objectivist', 'The %@ Market', 'The Invisible Hand'],
    headlines: [
      'Editorial: Taxes Too High!',
      'Market Indices Read Record Levels!',
      'Corporate Profits Up!',
      'Restrictions on Corporate Freedom Abolished by Courts!',
    ],
    reactionIllegal: 2,
    occurrencePolice: 3,
    occurrencePirates: 2,
    occurrenceTraders: 7,
    minTechLevel: TechLevel.EarlyIndustrial,
    maxTechLevel: TechLevel.HighTech,
    bribeWillingness: 1,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Ore,
  },
  [PoliticsType.Communist]: {
    type: PoliticsType.Communist,
    name: 'Communist State',
    mastheads: ['The Daily Worker', "The People's Voice", 'The %@ Proletariat'],
    headlines: [
      'Party Reports Productivity Increase.',
      'Counter-Revolutionary Bureaucrats Purged from Party!',
      'Party: Bold New Future Predicted!',
      'Politburo Approves New 5-Year Plan!',
    ],
    reactionIllegal: 6,
    occurrencePolice: 6,
    occurrencePirates: 4,
    occurrenceTraders: 4,
    minTechLevel: TechLevel.Agricultural,
    maxTechLevel: TechLevel.Industrial,
    bribeWillingness: 5,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.None,
  },
  [PoliticsType.Confederacy]: {
    type: PoliticsType.Confederacy,
    name: 'Confederacy',
    mastheads: ['Planet News', 'The %@ Times', 'Interstate Update'],
    headlines: [
      'States Dispute Natural Resource Rights!',
      'States Denied Federal Funds over Local Laws!',
      'Southern States Resist Federal Taxation for Capital Projects!',
      'States Request Federal Intervention in Citrus Conflict!',
    ],
    reactionIllegal: 5,
    occurrencePolice: 4,
    occurrencePirates: 3,
    occurrenceTraders: 5,
    minTechLevel: TechLevel.Agricultural,
    maxTechLevel: TechLevel.PostIndustrial,
    bribeWillingness: 3,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Games,
  },
  [PoliticsType.Corporate]: {
    type: PoliticsType.Corporate,
    name: 'Corporate State',
    mastheads: ['%@ Memo', 'News From The Board', 'Status Report'],
    headlines: [
      'Robot Shortages Predicted for Q4.',
      'Profitable Quarter Predicted.',
      'CEO: Corporate Rebranding Progressing.',
      'Advertising Budgets to Increase.',
    ],
    reactionIllegal: 2,
    occurrencePolice: 6,
    occurrencePirates: 2,
    occurrenceTraders: 7,
    minTechLevel: TechLevel.EarlyIndustrial,
    maxTechLevel: TechLevel.HighTech,
    bribeWillingness: 2,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Robots,
  },
  [PoliticsType.Cybernetic]: {
    type: PoliticsType.Cybernetic,
    name: 'Cybernetic State',
    mastheads: ['Pulses', 'Binary Stream', 'The System Clock'],
    headlines: [
      'Olympics: Software Beats Wetware in All Events!',
      'New Network Protocols To Be Deployed.',
      'Storage Banks to be Upgraded!',
      'System Backup Rescheduled.',
    ],
    reactionIllegal: 0,
    occurrencePolice: 7,
    occurrencePirates: 7,
    occurrenceTraders: 5,
    minTechLevel: TechLevel.PostIndustrial,
    maxTechLevel: TechLevel.HighTech,
    bribeWillingness: 0,
    drugsTradeable: false,
    firearmsTradeable: false,
    mostDesiredTradeItem: TradeItemType.Ore,
  },
  [PoliticsType.Democracy]: {
    type: PoliticsType.Democracy,
    name: 'Democracy',
    mastheads: ['The Daily Planet', 'The %@ Majority', 'Unanimity'],
    headlines: [
      'Local Elections on Schedule!',
      'Polls: Voter Satisfaction High!',
      'Campaign Spending Aids Economy!',
      'Police, Politicians Vow Improvements.',
    ],
    reactionIllegal: 4,
    occurrencePolice: 3,
    occurrencePirates: 2,
    occurrenceTraders: 5,
    minTechLevel: TechLevel.Renaissance,
    maxTechLevel: TechLevel.HighTech,
    bribeWillingness: 2,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Games,
  },
  [PoliticsType.Dictatorship]: {
    type: PoliticsType.Dictatorship,
    name: 'Dictatorship',
    mastheads: ['The Command', "Leader's Voice", 'The %@ Mandate'],
    headlines: [
      'New Palace Planned; Taxes Increase.',
      'Future Presents More Opportunities for Sacrifice!',
      'Insurrection Crushed: Rebels Executed!',
      'Police Powers to Increase!',
    ],
    reactionIllegal: 3,
    occurrencePolice: 4,
    occurrencePirates: 5,
    occurrenceTraders: 3,
    minTechLevel: TechLevel.PreAgricultural,
    maxTechLevel: TechLevel.HighTech,
    bribeWillingness: 2,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.None,
  },
  [PoliticsType.Fascist]: {
    type: PoliticsType.Fascist,
    name: 'Fascist State',
    mastheads: ['State Tribune', 'Motherland News', 'Homeland Report'],
    headlines: [
      'Drug Smugglers Sentenced to Death!',
      'Aliens Required to Carry Visible Identification at All Times!',
      'Foreign Sabotage Suspected.',
      'Stricter Immigration Laws Installed.',
    ],
    reactionIllegal: 7,
    occurrencePolice: 7,
    occurrencePirates: 7,
    occurrenceTraders: 1,
    minTechLevel: TechLevel.EarlyIndustrial,
    maxTechLevel: TechLevel.HighTech,
    bribeWillingness: 0,
    drugsTradeable: false,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Machines,
  },
  [PoliticsType.Feudal]: {
    type: PoliticsType.Feudal,
    name: 'Feudal State',
    mastheads: ['News from the Keep', 'The Town Crier', 'The %@ Herald'],
    headlines: [
      "Farmers Drafted to Defend Lord's Castle!",
      'Report: Kingdoms Near Flashpoint!',
      'Baron Ignores Ultimatum!',
      'War of Succession Threatens!',
    ],
    reactionIllegal: 1,
    occurrencePolice: 1,
    occurrencePirates: 6,
    occurrenceTraders: 2,
    minTechLevel: TechLevel.PreAgricultural,
    maxTechLevel: TechLevel.Renaissance,
    bribeWillingness: 6,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Firearms,
  },
  [PoliticsType.Military]: {
    type: PoliticsType.Military,
    name: 'Military State',
    mastheads: ['General Report', '%@ Dispatch', 'The %@ Sentry'],
    headlines: [
      'Court-Martials Up 2% This Year.',
      'Editorial: Why Wait to Invade?',
      'HQ: Invasion Plans Reviewed.',
      'Weapons Research Increases Kill-Ratio!',
    ],
    reactionIllegal: 7,
    occurrencePolice: 7,
    occurrencePirates: 0,
    occurrenceTraders: 6,
    minTechLevel: TechLevel.Medieval,
    maxTechLevel: TechLevel.HighTech,
    bribeWillingness: 0,
    drugsTradeable: false,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Robots,
  },
  [PoliticsType.Monarchy]: {
    type: PoliticsType.Monarchy,
    name: 'Monarchy',
    mastheads: ['Royal Times', 'The Loyal Subject', 'The Fanfare'],
    headlines: [
      'King to Attend Celebrations.',
      "Queen's Birthday Celebration Ends in Riots!",
      'King Commissions New Artworks.',
      'Prince Exiled for Palace Plot!',
    ],
    reactionIllegal: 3,
    occurrencePolice: 4,
    occurrencePirates: 3,
    occurrenceTraders: 4,
    minTechLevel: TechLevel.PreAgricultural,
    maxTechLevel: TechLevel.Industrial,
    bribeWillingness: 4,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Medicine,
  },
  [PoliticsType.Pacifist]: {
    type: PoliticsType.Pacifist,
    name: 'Pacifist State',
    mastheads: ['Pax Humani', 'Principle', 'The %@ Chorus'],
    headlines: [
      'Dialog Averts Eastern Conflict!',
      'Universal Peace: Is it Possible?',
      'Editorial: Life in Harmony.',
      'Polls: Happiness Quotient High!',
    ],
    reactionIllegal: 7,
    occurrencePolice: 2,
    occurrencePirates: 1,
    occurrenceTraders: 5,
    minTechLevel: TechLevel.PreAgricultural,
    maxTechLevel: TechLevel.Renaissance,
    bribeWillingness: 1,
    drugsTradeable: true,
    firearmsTradeable: false,
    mostDesiredTradeItem: TradeItemType.None,
  },
  [PoliticsType.Socialist]: {
    type: PoliticsType.Socialist,
    name: 'Socialist State',
    mastheads: ['All for One', 'Brotherhood', "The People's Syndicate"],
    headlines: [
      'Government Promises Increased Welfare Benefits!',
      'State Denies Food Rationing Required to Prevent Famine.',
      "'Welfare Actually Boosts Economy,' Minister Says.",
      'Hoarder Lynched by Angry Mob!',
    ],
    reactionIllegal: 4,
    occurrencePolice: 2,
    occurrencePirates: 5,
    occurrenceTraders: 3,
    minTechLevel: TechLevel.PreAgricultural,
    maxTechLevel: TechLevel.Industrial,
    bribeWillingness: 6,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.None,
  },
  [PoliticsType.Satori]: {
    type: PoliticsType.Satori,
    name: 'State of Satori',
    mastheads: ['The Daily Koan', 'Haiku', 'One Hand Clapping'],
    headlines: ['Millions at Peace.', 'Sun Rises.', 'Countless Hearts Awaken.', 'Serenity Reigns.'],
    reactionIllegal: 0,
    occurrencePolice: 1,
    occurrencePirates: 1,
    occurrenceTraders: 1,
    minTechLevel: TechLevel.PreAgricultural,
    maxTechLevel: TechLevel.Agricultural,
    bribeWillingness: 0,
    drugsTradeable: false,
    firearmsTradeable: false,
    mostDesiredTradeItem: TradeItemType.None,
  },
  [PoliticsType.Technocracy]: {
    type: PoliticsType.Technocracy,
    name: 'Technocracy',
    mastheads: ['The Future', 'Hardware Dispatch', 'TechNews'],
    headlines: [
      'New Processor Hits 10 ZettaHerz!',
      'Nanobot Output Exceeds Expectation.',
      'Last Human Judge Retires.',
      'Software Bug Causes Mass Confusion.',
    ],
    reactionIllegal: 1,
    occurrencePolice: 6,
    occurrencePirates: 3,
    occurrenceTraders: 6,
    minTechLevel: TechLevel.EarlyIndustrial,
    maxTechLevel: TechLevel.HighTech,
    bribeWillingness: 2,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Water,
  },
  [PoliticsType.Theocracy]: {
    type: PoliticsType.Theocracy,
    name: 'Theocracy',
    mastheads: ['The Spiritual Advisor', 'Church Tidings', 'The Temple Tribune'],
    headlines: [
      'High Priest to Hold Special Services.',
      'Temple Restoration Fund at 81%.',
      'Sacred Texts on Public Display.',
      'Dozen Blasphemers Excommunicated!',
    ],
    reactionIllegal: 5,
    occurrencePolice: 6,
    occurrencePirates: 1,
    occurrenceTraders: 4,
    minTechLevel: TechLevel.PreAgricultural,
    maxTechLevel: TechLevel.EarlyIndustrial,
    bribeWillingness: 0,
    drugsTradeable: true,
    firearmsTradeable: true,
    mostDesiredTradeItem: TradeItemType.Narcotics,
  },
};

// The government with this number, as a saved game stores it.
export function politicsForType(type: number): Politics {
  return POLITICS[type as Kind];
}

// A government picked at random among those that can exist at this tech level.
export function randomPoliticsForTechLevel(techLevel: number): Politics {
  while (true) {
    const politics = politicsForType(runtime.gameRand.randomIntBelow(PoliticsType.Count));
    if (politics.minTechLevel <= techLevel && politics.maxTechLevel >= techLevel) {
      return politics;
    }
  }
}

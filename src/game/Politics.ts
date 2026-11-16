import { TechLevel, TradeItemType } from './TradeItem.types.ts'
import { runtime } from './runtime.ts'

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

    Count: 17
} as const;
export type PoliticsType = (typeof PoliticsType)[keyof typeof PoliticsType];

export function occurrenceStr(x: number) {
    switch (x) {
        case 0: return "No";
        case 1: return "Minimal";
        case 2: return "Few";
        case 3: return "Some";
        case 4: return "Moderate";
        case 5: return "Many";
        case 6: return "Abundant";
        default: return "Excessive";
    }
}


export class Politics {
    static declare sPolitics: Map<number, Politics> | undefined
    declare type: PoliticsType
    declare name: string
    declare mastheads: string[]
    declare headlines: string[]
    declare reactionIllegal: number
    declare occurrencePolice: number
    declare occurrencePirates: number
    declare occurrenceTraders: number
    declare minTechLevel: TechLevel
    declare maxTechLevel: TechLevel
    declare bribeWillingness: number
    declare drugsTradeable: boolean
    declare firearmsTradeable: boolean
    declare mostDesiredTradeItem: TradeItemType

    constructor(type: PoliticsType, name: string, mastheads: string[], headlines: string[], reactionIllegal: number, occurrencePolice: number, occurrencePirates: number, occurrenceTraders: number, minTechLevel: TechLevel, maxTechLevel: TechLevel, bribeWillingness: number, drugsTradeable: boolean, firearmsTradeable: boolean, mostDesiredTradeItem: TradeItemType) {
        this.type = type;
        this.name = name;
        this.mastheads = mastheads;
        this.headlines = headlines;
        this.reactionIllegal = reactionIllegal;
        this.occurrencePolice = occurrencePolice;
        this.occurrencePirates = occurrencePirates;
        this.occurrenceTraders = occurrenceTraders;
        this.minTechLevel = minTechLevel;
        this.maxTechLevel = maxTechLevel;
        this.bribeWillingness = bribeWillingness;
        this.drugsTradeable = drugsTradeable;
        this.firearmsTradeable = firearmsTradeable;
        this.mostDesiredTradeItem = mostDesiredTradeItem;
    }

    static randomPoliticsForTechLevel(techLevel: number) {
        while (true) {
            const politics = Politics.politicsForType(runtime.gameRand.randomIntBelow(PoliticsType.Count))!;
            if (politics.minTechLevel <= techLevel && politics.maxTechLevel >= techLevel) {
                return politics;
            }
        }
    }

    static politicsForType(type: number): Politics | undefined {
        if (!this.sPolitics) {
            this.sPolitics = new Map();
        }

        let politics = this.sPolitics.get(type);

        if (!politics) {
            switch (type) {
                case PoliticsType.Anarchy:
                    politics = new Politics(
                        type,
                        "Anarchist State",
                        ["The %@ Arsenal", "The Grassroot", "Kick It!"],
                        ["Riots, Looting Mar Factional Negotiations.",
                         "Communities Seek Consensus.",
                         "Successful Bakunin Day Rally!",
                         "Major Faction Conflict Expected for the Weekend!"],
                        0,
                        0,
                        7,
                        1,
                        TechLevel.PreAgricultural,
                        TechLevel.Industrial,
                        7,
                        true,
                        true,
                        TradeItemType.Food
                    );
                    break;

                case PoliticsType.Capitalist:
                    politics = new Politics(
                        type,
                        "Capitalist State",
                        ["The Objectivist", "The %@ Market", "The Invisible Hand"],
                        ["Editorial: Taxes Too High!",
                         "Market Indices Read Record Levels!",
                         "Corporate Profits Up!",
                         "Restrictions on Corporate Freedom Abolished by Courts!"],
                        2,
                        3,
                        2,
                        7,
                        TechLevel.EarlyIndustrial,
                        TechLevel.HighTech,
                        1,
                        true,
                        true,
                        TradeItemType.Ore
                    );
                    break;

                case PoliticsType.Communist:
                    politics = new Politics(
                        type,
                        "Communist State",
                        ["The Daily Worker", "The People's Voice", "The %@ Proletariat"],
                        ["Party Reports Productivity Increase.",
                         "Counter-Revolutionary Bureaucrats Purged from Party!",
                         "Party: Bold New Future Predicted!",
                         "Politburo Approves New 5-Year Plan!"],
                        6,
                        6,
                        4,
                        4,
                        TechLevel.Agricultural,
                        TechLevel.Industrial,
                        5,
                        true,
                        true,
                        TradeItemType.None
                    );
                    break;

                case PoliticsType.Confederacy:
                    politics = new Politics(
                        type,
                        "Confederacy",
                        ["Planet News", "The %@ Times", "Interstate Update"],
                        ["States Dispute Natural Resource Rights!",
                         "States Denied Federal Funds over Local Laws!",
                         "Southern States Resist Federal Taxation for Capital Projects!",
                         "States Request Federal Intervention in Citrus Conflict!"],
                        5,
                        4,
                        3,
                        5,
                        TechLevel.Agricultural,
                        TechLevel.PostIndustrial,
                        3,
                        true,
                        true,
                        TradeItemType.Games
                    );
                    break;

                case PoliticsType.Corporate:
                    politics = new Politics(
                        type,
                        "Corporate State",
                        ["%@ Memo", "News From The Board", "Status Report"],
                        ["Robot Shortages Predicted for Q4.",
                         "Profitable Quarter Predicted.",
                         "CEO: Corporate Rebranding Progressing.",
                         "Advertising Budgets to Increase."],
                        2,
                        6,
                        2,
                        7,
                        TechLevel.EarlyIndustrial,
                        TechLevel.HighTech,
                        2,
                        true,
                        true,
                        TradeItemType.Robots
                    );
                    break;

                case PoliticsType.Cybernetic:
                    politics = new Politics(
                        type,
                        "Cybernetic State",
                        ["Pulses", "Binary Stream", "The System Clock"],
                        ["Olympics: Software Beats Wetware in All Events!",
                         "New Network Protocols To Be Deployed.",
                         "Storage Banks to be Upgraded!",
                         "System Backup Rescheduled."],
                        0,
                        7,
                        7,
                        5,
                        TechLevel.PostIndustrial,
                        TechLevel.HighTech,
                        0,
                        false,
                        false,
                        TradeItemType.Ore
                    );
                    break;

                case PoliticsType.Democracy:
                    politics = new Politics(
                        type,
                        "Democracy",
                        ["The Daily Planet", "The %@ Majority", "Unanimity"],
                        ["Local Elections on Schedule!",
                         "Polls: Voter Satisfaction High!",
                         "Campaign Spending Aids Economy!",
                         "Police, Politicians Vow Improvements."],
                        4,
                        3,
                        2,
                        5,
                        TechLevel.Renaissance,
                        TechLevel.HighTech,
                        2,
                        true,
                        true,
                        TradeItemType.Games
                    );
                    break;

                case PoliticsType.Dictatorship:
                    politics = new Politics(
                        type,
                        "Dictatorship",
                        ["The Command", "Leader's Voice", "The %@ Mandate"],
                        ["New Palace Planned; Taxes Increase.",
                         "Future Presents More Opportunities for Sacrifice!",
                         "Insurrection Crushed: Rebels Executed!",
                         "Police Powers to Increase!"],
                        3,
                        4,
                        5,
                        3,
                        TechLevel.PreAgricultural,
                        TechLevel.HighTech,
                        2,
                        true,
                        true,
                        TradeItemType.None
                    );
                    break;

                case PoliticsType.Fascist:
                    politics = new Politics(
                        type,
                        "Fascist State",
                        ["State Tribune", "Motherland News", "Homeland Report"],
                        ["Drug Smugglers Sentenced to Death!",
                         "Aliens Required to Carry Visible Identification at All Times!",
                         "Foreign Sabotage Suspected.",
                         "Stricter Immigration Laws Installed."],
                        7,
                        7,
                        7,
                        1,
                        TechLevel.EarlyIndustrial,
                        TechLevel.HighTech,
                        0,
                        false,
                        true,
                        TradeItemType.Machines
                    );
                    break;

                case PoliticsType.Feudal:
                    politics = new Politics(
                        type,
                        "Feudal State",
                        ["News from the Keep", "The Town Crier", "The %@ Herald"],
                        ["Farmers Drafted to Defend Lord's Castle!",
                         "Report: Kingdoms Near Flashpoint!",
                         "Baron Ignores Ultimatum!",
                         "War of Succession Threatens!"],
                        1,
                        1,
                        6,
                        2,
                        TechLevel.PreAgricultural,
                        TechLevel.Renaissance,
                        6,
                        true,
                        true,
                        TradeItemType.Firearms
                    );
                    break;

                case PoliticsType.Military:
                    politics = new Politics(
                        type,
                        "Military State",
                        ["General Report", "%@ Dispatch", "The %@ Sentry"],
                        ["Court-Martials Up 2% This Year.",
                         "Editorial: Why Wait to Invade?",
                         "HQ: Invasion Plans Reviewed.",
                         "Weapons Research Increases Kill-Ratio!"],
                        7,
                        7,
                        0,
                        6,
                        TechLevel.Medieval,
                        TechLevel.HighTech,
                        0,
                        false,
                        true,
                        TradeItemType.Robots
                    );
                    break;

                case PoliticsType.Monarchy:
                    politics = new Politics(
                        type,
                        "Monarchy",
                        ["Royal Times", "The Loyal Subject", "The Fanfare"],
                        ["King to Attend Celebrations.",
                         "Queen's Birthday Celebration Ends in Riots!",
                         "King Commissions New Artworks.",
                         "Prince Exiled for Palace Plot!"],
                        3,
                        4,
                        3,
                        4,
                        TechLevel.PreAgricultural,
                        TechLevel.Industrial,
                        4,
                        true,
                        true,
                        TradeItemType.Medicine
                    );
                    break;

                case PoliticsType.Pacifist:
                    politics = new Politics(
                        type,
                        "Pacifist State",
                        ["Pax Humani", "Principle", "The %@ Chorus"],
                        ["Dialog Averts Eastern Conflict!",
                         "Universal Peace: Is it Possible?",
                         "Editorial: Life in Harmony.",
                         "Polls: Happiness Quotient High!"],
                        7,
                        2,
                        1,
                        5,
                        TechLevel.PreAgricultural,
                        TechLevel.Renaissance,
                        1,
                        true,
                        false,
                        TradeItemType.None
                    );
                    break;

            case PoliticsType.Socialist:
                politics = new Politics(
                    type,
                    "Socialist State",
                    ["All for One", "Brotherhood", "The People's Syndicate"],
                    ["Government Promises Increased Welfare Benefits!",
                     "State Denies Food Rationing Required to Prevent Famine.",
                     "'Welfare Actually Boosts Economy,' Minister Says.",
                     "Hoarder Lynched by Angry Mob!"],
                    4,
                    2,
                    5,
                    3,
                    TechLevel.PreAgricultural,
                    TechLevel.Industrial,
                    6,
                    true,
                    true,
                    TradeItemType.None
                );
                break;

            case PoliticsType.Satori:
                politics = new Politics(
                    type,
                    "State of Satori",
                    ["The Daily Koan", "Haiku", "One Hand Clapping"],
                    ["Millions at Peace.",
                     "Sun Rises.",
                     "Countless Hearts Awaken.",
                     "Serenity Reigns."],
                    0,
                    1,
                    1,
                    1,
                    TechLevel.PreAgricultural,
                    TechLevel.Agricultural,
                    0,
                    false,
                    false,
                    TradeItemType.None
                );
                break;

            case PoliticsType.Technocracy:
                politics = new Politics(
                    type,
                    "Technocracy",
                    ["The Future", "Hardware Dispatch", "TechNews"],
                    ["New Processor Hits 10 ZettaHerz!",
                     "Nanobot Output Exceeds Expectation.",
                     "Last Human Judge Retires.",
                     "Software Bug Causes Mass Confusion."],
                    1,
                    6,
                    3,
                    6,
                    TechLevel.EarlyIndustrial,
                    TechLevel.HighTech,
                    2,
                    true,
                    true,
                    TradeItemType.Water
                );
                break;

            case PoliticsType.Theocracy:
                politics = new Politics(
                    type,
                    "Theocracy",
                    ["The Spiritual Advisor", "Church Tidings", "The Temple Tribune"],
                    ["High Priest to Hold Special Services.",
                     "Temple Restoration Fund at 81%.",
                     "Sacred Texts on Public Display.",
                     "Dozen Blasphemers Excommunicated!"],
                    5,
                    6,
                    1,
                    4,
                    TechLevel.PreAgricultural,
                    TechLevel.EarlyIndustrial,
                    0,
                    true,
                    true,
                    TradeItemType.Narcotics
                );
                break;

                default:
                    break;
            }

            if (politics) {
                this.sPolitics.set(type, politics);
            }
        }

        return politics;
    }
}

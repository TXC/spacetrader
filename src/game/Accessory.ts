import { TechLevel } from './TradeItem.types.ts'

export const AccessoryType = {
    // Gadgets
    GadgetFiveExtraCargoBays: 0,
    GadgetAutoRepairSystem: 1,
    GadgetNavigationSystem: 2,
    GadgetTargetingSystem: 3,
    GadgetCloakingDevice: 4,
    GadgetFuelCompactor: 5, // Can't be bought

    GadgetFirst: 0,
    GadgetLastBuyable: 4,
    GadgetLast: 5,

    // Weapons
    WeaponPulseLaser: 6,
    WeaponBeamLaser: 7,
    WeaponMilitaryLaser: 8,
    WeaponMorgansLaser: 9, // Can't be bought

    WeaponFirst: 6,
    WeaponLastBuyable: 8,
    WeaponLast: 9,

    // Shields
    ShieldEnergy: 10,
    ShieldReflective: 11,
    ShieldLightning: 12, // Can't be bought

    ShieldFirst: 10,
    ShieldLastBuyable: 11,
    ShieldLast: 12,

    None: 13
} as const;
export type AccessoryType = (typeof AccessoryType)[keyof typeof AccessoryType];

export const COUNT_BUYABLE_ACCESSORIES =
    (AccessoryType.GadgetLastBuyable - AccessoryType.GadgetFirst + 1) +
    (AccessoryType.WeaponLastBuyable - AccessoryType.WeaponFirst + 1) +
    (AccessoryType.ShieldLastBuyable - AccessoryType.ShieldFirst + 1);

export function ACCESSORY_FOR_TYPE(type: number) {
    return Gadget.gadgetForType(type) ||
           Weapon.weaponForType(type) ||
           Shield.shieldForType(type);
}


export class Accessory {
    declare _type: number
    declare _name: string
    declare _price: number
    declare _techLevel: TechLevel
    declare _occurrence: number

    constructor(type: number, name: string, price: number, techLevel: TechLevel, occurrence: number) {
        this._type = type;
        this._name = name;
        this._price = price;
        this._techLevel = techLevel;
        this._occurrence = occurrence;
    }

    get type() {
        return this._type;
    }

    get name() {
        return this._name;
    }

    get price() {
        return this._price;
    }

    get techLevel() {
        return this._techLevel;
    }

    get occurrence() {
        return this._occurrence;
    }

    icon(): string | null {
        return null;
    }

    static accessoryCategory() {
        return "accessory";
    }

    isEqual(object: unknown) {
        if (object instanceof Accessory) {
            return this._type === object.type;
        }
        return this === object;
    }

    hash() {
        return this._type;
    }
}


export class Gadget extends Accessory {
    static declare sItems: Map<number, Gadget> | undefined
    declare _icon: string

    constructor(type: number, name: string, price: number, techLevel: TechLevel, occurrence: number, icon: string) {
        super(type, name, price, techLevel, occurrence);
        this._icon = icon;
    }

    static accessoryCategory() {
        return "gadget";
    }

    static gadgetForType(type: number) {
        if (!this.sItems) {
            this.sItems = new Map();
        }

        let item = this.sItems.get(type);

        if (!item) {
            switch (type) {
                case AccessoryType.GadgetFiveExtraCargoBays:
                    item = new Gadget(type, "5 extra cargo bays", 2500, TechLevel.EarlyIndustrial, 35, "");
                    break;

                case AccessoryType.GadgetAutoRepairSystem:
                    item = new Gadget(type, "Auto-repair system", 7500, TechLevel.Industrial, 20, "");
                    break;

                case AccessoryType.GadgetNavigationSystem:
                    item = new Gadget(type, "Navigation system", 15000, TechLevel.PostIndustrial, 20, "");
                    break;

                case AccessoryType.GadgetTargetingSystem:
                    item = new Gadget(type, "Targeting system", 25000, TechLevel.PostIndustrial, 20, "");
                    break;

                case AccessoryType.GadgetCloakingDevice:
                    item = new Gadget(type, "Cloaking device", 100000, TechLevel.HighTech, 5, "");
                    break;

                case AccessoryType.GadgetFuelCompactor:
                    item = new Gadget(type, "Fuel compactor", 30000, TechLevel.Count, 0, "");
                    break;

                default:
                    break;
            }

            if (item) {
                this.sItems.set(type, item);
            }
        }

        return item;
    }

    icon() {
        return this._icon;
    }

    get isBuyable() {
      return this._type <= AccessoryType.GadgetLastBuyable
    }
}


export class Weapon extends Accessory {
    static declare sItems: Map<number, Weapon> | undefined
    declare _power: number

    constructor(type: number, name: string, price: number, techLevel: TechLevel, occurrence: number, power: number) {
        super(type, name, price, techLevel, occurrence);
        this._power = power;
    }

    get power() {
      return this._power;
    }

    static accessoryCategory() {
        return "weapon";
    }

    static weaponForType(type: number) {
        if (!this.sItems) {
            this.sItems = new Map();
        }

        let item = this.sItems.get(type);

        if (!item) {
            switch (type) {
                case AccessoryType.WeaponPulseLaser:
                    item = new Weapon(type, "Pulse laser", 2000, TechLevel.Industrial, 50, 15);
                    break;

                case AccessoryType.WeaponBeamLaser:
                    item = new Weapon(type, "Beam laser", 12500, TechLevel.PostIndustrial, 35, 25);
                    break;

                case AccessoryType.WeaponMilitaryLaser:
                    item = new Weapon(type, "Military laser", 35000, TechLevel.HighTech, 15, 35);
                    break;

                case AccessoryType.WeaponMorgansLaser:
                    item = new Weapon(type, "Morgan's laser", 50000, TechLevel.Count, 0, 85);
                    break;

                default:
                    break;
            }

            if (item) {
                this.sItems.set(type, item);
            }
        }

        return item;
    }

    get isBuyable() {
      return this._type <= AccessoryType.WeaponLastBuyable
    }

    icon() {
        return "";
    }
}

export class Shield extends Accessory {
    static declare sItems: Map<number, Shield> | undefined
    declare _power: number

    constructor(type: number, name: string, price: number, techLevel: TechLevel, occurrence: number, power: number) {
        super(type, name, price, techLevel, occurrence);
        this._power = power;
    }

    get power() {
      return this._power;
    }

    static accessoryCategory() {
        return "shield";
    }

    static shieldForType(type: number) {
        if (!this.sItems) {
            this.sItems = new Map();
        }

        let item = this.sItems.get(type);

        if (!item) {
            switch (type) {
                case AccessoryType.ShieldEnergy:
                    item = new Shield(type, "Energy shield", 5000, TechLevel.Industrial, 70, 100);
                    break;

                case AccessoryType.ShieldReflective:
                    item = new Shield(type, "Reflective shield", 20000, TechLevel.PostIndustrial, 30, 200);
                    break;

                case AccessoryType.ShieldLightning:
                    item = new Shield(type, "Lightning shield", 45000, TechLevel.Count, 0, 350);
                    break;

                default:
                    break;
            }

            if (item) {
                this.sItems.set(type, item);
            }
        }

        return item;
    }

    get isBuyable() {
      return this._type <= AccessoryType.ShieldLastBuyable
    }

    icon() {
        return "";
    }
}


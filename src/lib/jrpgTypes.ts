export type JobId = 'fighter' | 'monk' | 'thief' | 'white_mage' | 'black_mage' | 'red_mage';

export interface CombatStats {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    str: number;
    agi: number;
    vit: number;
    int: number;
    mnd: number;
    lck: number;
}

export interface Spell {
    id: string;
    name: string;
    mpCost: number;
    type: 'damage' | 'heal' | 'buff';
    element?: 'fire' | 'ice' | 'lit' | 'holy';
    basePower: number;
    targetScope: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies';
    description: string;
}

export interface CombatItem {
    id: string;
    name: string;
    count: number;
    effect: 'heal_hp' | 'heal_mp' | 'revive';
    power: number;
    description: string;
}

export interface Character {
    id: string;
    name: string;
    job: JobId;
    level: number;
    stats: CombatStats;
    isAlive: boolean;
    spriteType: 'fighter' | 'thief' | 'white_mage' | 'black_mage';
    spells: Spell[];
}

export interface Enemy {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    stats: CombatStats;
    isAlive: boolean;
    spriteType: 'imp' | 'pirate' | 'goblin' | 'wolf';
    xpReward: number;
    goldReward: number;
}

export type CombatCommandType = 'fight' | 'magic' | 'drink' | 'item' | 'run';

export interface PendingAction {
    actorId: string;
    command: CombatCommandType;
    targetId: string;
    spell?: Spell;
    item?: CombatItem;
}

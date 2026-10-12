import { SettlementData, TavernData, OpponentData, WorldProgress, PlayerRpgStats, TavernActivityType, HiredCompanion } from '../types';
import { ALL_SETTLEMENTS } from './settlements';
import { createDeck } from './gameLogic';
import { DEFAULT_STARTER_TOY_SOLDIERS } from './toySoldiersData';

import { createTavernOpponents, createDedicatedActivityOpponents } from "./settlements/createTavernOpponents";
export { createTavernOpponents, createDedicatedActivityOpponents };

// All settlements matching the user's uploaded fantasy continent map
export const WORLD_SETTLEMENTS: SettlementData[] = ALL_SETTLEMENTS;

// Persistence helpers
const STORAGE_KEY = 'durak_rpg_world_progress';

export function getXpRequiredForNextLevel(currentLevel: number): number {
    const lvl = Math.max(0, currentLevel);
    if (lvl === 0) return 300;
    // Scaled progressive formula: increasing XP requirements for higher levels
    // Lvl 0->1: 300 XP, Lvl 1->2: 650 XP, Lvl 2->3: 1150 XP, Lvl 3->4: 1800 XP, etc.
    return Math.round(300 + lvl * 200 + Math.pow(lvl, 1.85) * 150);
}

export const DEFAULT_PLAYER_STATS: PlayerRpgStats = {
    level: 0,
    xp: 0,
    xpToNextLevel: 300,
    statPoints: 0,
    baseHp: 100,
    currentHp: 100,
    strength: 15,
    agility: 10,
    equippedWeapon: 'wpn_iron_sword',
    equippedShield: 'shd_wood_buckler',
    equippedArmor: 'arm_tunic',
    inventoryWeapons: ['wpn_iron_sword'],
    inventoryShields: ['shd_wood_buckler'],
    inventoryArmors: ['arm_tunic'],
    armorModifier: 1,
    horseRidingSkill: 2,
    totalBowShots: 0,
    totalRangedShots: 0,
    bowProficiency: 1,
    rangedShootingMod: 1,
    maxSpellPoints: 6,
    currentSpellPoints: 6
};

export const DEFAULT_STARTER_SQUAD: HiredCompanion[] = [
    {
        id: 'starter_infantry_soldier',
        name: 'Богдан Залізняк',
        title: 'Піхотинець-найманець',
        avatar: '⚔️',
        companionClassId: 'swordsman',
        type: 'contender',
        rank: 1,
        difficulty: 'easy',
        flavorQuote: '«Загін готовий виступити на ворога! Тримаємо стрій!»',
        description: 'Загартований воїн у сталевому шоломі-шапелі та стьобаному гамбезоні.',
        hp: 100,
        baseHp: 100,
        armor: 15,
        powerPoints: 10,
        strength: 5,
        agility: 4,
        rewards: {
            gold: 30,
            powerPoints: 10,
            reputation: 5,
            xp: 25
        },
        level: 1,
        xp: 15,
        xpToNextLevel: 100,
        maxAbilityCharges: 2,
        currentAbilityCharges: 2,
        survivalProbability: 95,
        isDead: false
    }
];

export const CURRENT_STATS_VERSION = 3;

export function loadWorldProgress(): WorldProgress {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const savedStats = parsed.playerStats;
            const isLegacy = !parsed.statsVersion || parsed.statsVersion < CURRENT_STATS_VERSION;

            let playerStats: PlayerRpgStats;

            if (isLegacy) {
                // Legacy profiles had overpowered level scaling; reset smoothly to calibrated Level 0
                playerStats = { ...DEFAULT_PLAYER_STATS };
            } else {
                const currentLevel = typeof savedStats?.level === 'number' ? savedStats.level : 0;
                playerStats = {
                    level: currentLevel,
                    xp: typeof savedStats?.xp === 'number' ? savedStats.xp : 0,
                    xpToNextLevel: getXpRequiredForNextLevel(currentLevel),
                    statPoints: typeof savedStats?.statPoints === 'number' ? savedStats.statPoints : 0,
                    baseHp: typeof savedStats?.baseHp === 'number' ? savedStats.baseHp : 100,
                    strength: typeof savedStats?.strength === 'number' ? savedStats.strength : 15,
                    agility: typeof savedStats?.agility === 'number' ? savedStats.agility : 10,
                    equippedWeapon: savedStats?.equippedWeapon,
                    equippedShield: savedStats?.equippedShield,
                    inventoryWeapons: Array.isArray(savedStats?.inventoryWeapons) ? savedStats.inventoryWeapons : [],
                    inventoryShields: Array.isArray(savedStats?.inventoryShields) ? savedStats.inventoryShields : [],
                    totalBowShots: typeof savedStats?.totalBowShots === 'number' ? savedStats.totalBowShots : 0,
                    totalRangedShots: typeof savedStats?.totalRangedShots === 'number' ? savedStats.totalRangedShots : 0,
                    bowProficiency: 1 + Math.floor((typeof savedStats?.totalBowShots === 'number' ? savedStats.totalBowShots : 0) / 60),
                    rangedShootingMod: 1 + Math.floor((typeof savedStats?.totalRangedShots === 'number' ? savedStats.totalRangedShots : 0) / 60)
                };
            }

            const progress: WorldProgress = {
                defeatedOpponentIds: Array.isArray(parsed.defeatedOpponentIds) ? parsed.defeatedOpponentIds : [],
                defeatedBrawlOpponentIds: Array.isArray(parsed.defeatedBrawlOpponentIds) ? parsed.defeatedBrawlOpponentIds : [],
                defeatedActivityOpponents: parsed.defeatedActivityOpponents && typeof parsed.defeatedActivityOpponents === 'object' ? parsed.defeatedActivityOpponents : {},
                opponentVictories: parsed.opponentVictories && typeof parsed.opponentVictories === 'object' ? parsed.opponentVictories : {},
                conqueredTavernIds: Array.isArray(parsed.conqueredTavernIds) ? parsed.conqueredTavernIds : [],
                brawlConqueredTavernIds: Array.isArray(parsed.brawlConqueredTavernIds) ? parsed.brawlConqueredTavernIds : [],
                conqueredActivityTaverns: parsed.conqueredActivityTaverns && typeof parsed.conqueredActivityTaverns === 'object' ? parsed.conqueredActivityTaverns : {},
                visitedSettlementIds: Array.isArray(parsed.visitedSettlementIds) ? parsed.visitedSettlementIds : ['city_rannegrad'],
                playerGold: typeof parsed.playerGold === 'number' ? parsed.playerGold : 100,
                playerReputation: typeof parsed.playerReputation === 'number' ? parsed.playerReputation : 0,
                playerPosition: parsed.playerPosition && typeof parsed.playerPosition.x === 'number' 
                    ? parsed.playerPosition 
                    : { x: 52, y: 37, isMoving: false },
                playerStats,
                statsVersion: CURRENT_STATS_VERSION,
                cardPieces: typeof parsed.cardPieces === 'number' ? parsed.cardPieces : 0,
                craftedCardsCount: parsed.craftedCardsCount && typeof parsed.craftedCardsCount === 'object' ? parsed.craftedCardsCount : {},
                playerRpgCards: Array.isArray(parsed.playerRpgCards) && parsed.playerRpgCards.length > 0
                    ? parsed.playerRpgCards 
                    : createDeck('classic'),
                playerRpgDeck: Array.isArray(parsed.playerRpgDeck) && parsed.playerRpgDeck.length > 0
                    ? parsed.playerRpgDeck 
                    : (Array.isArray(parsed.playerRpgCards) && parsed.playerRpgCards.length > 0 ? parsed.playerRpgCards : createDeck('classic')),
                hiredNpcs: Array.isArray(parsed.hiredNpcs) && parsed.hiredNpcs.length > 0 
                    ? parsed.hiredNpcs 
                    : [...DEFAULT_STARTER_SQUAD],
                hiredNpcIds: Array.isArray(parsed.hiredNpcIds) && parsed.hiredNpcIds.length > 0
                    ? parsed.hiredNpcIds
                    : ['starter_infantry_soldier'],
                npcRelationships: parsed.npcRelationships && typeof parsed.npcRelationships === 'object' ? parsed.npcRelationships : {},
                toySoldiers: Array.isArray(parsed.toySoldiers) && parsed.toySoldiers.length > 0
                    ? parsed.toySoldiers
                    : [...DEFAULT_STARTER_TOY_SOLDIERS],
                toyRepairParts: typeof parsed.toyRepairParts === 'number' ? parsed.toyRepairParts : 0,
                activeQuests: Array.isArray(parsed.activeQuests) ? parsed.activeQuests : [],
                completedQuestIds: Array.isArray(parsed.completedQuestIds) ? parsed.completedQuestIds : [],
                availableNpcQuests: Array.isArray(parsed.availableNpcQuests) ? parsed.availableNpcQuests : []
            };

            if (isLegacy) {
                // Auto-save the migrated profile so localStorage is permanently updated to Level 0
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
                } catch {
                    // ignore
                }
            }

            return progress;
        }
    } catch {
        // fallback
    }

    const initialProgress: WorldProgress = {
        defeatedOpponentIds: [],
        defeatedBrawlOpponentIds: [],
        defeatedActivityOpponents: {},
        opponentVictories: {},
        conqueredTavernIds: [],
        brawlConqueredTavernIds: [],
        conqueredActivityTaverns: {},
        visitedSettlementIds: ['city_rannegrad'],
        playerGold: 100,
        playerReputation: 0,
        playerPosition: { x: 52, y: 37, isMoving: false },
        playerStats: { ...DEFAULT_PLAYER_STATS },
        statsVersion: CURRENT_STATS_VERSION,
        cardPieces: 0,
        craftedCardsCount: {},
        playerRpgCards: createDeck('classic'),
        playerRpgDeck: createDeck('classic'),
        hiredNpcs: [...DEFAULT_STARTER_SQUAD],
        hiredNpcIds: ['starter_infantry_soldier'],
        npcRelationships: {},
        toySoldiers: [...DEFAULT_STARTER_TOY_SOLDIERS],
        activeQuests: [],
        completedQuestIds: [],
        availableNpcQuests: []
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProgress));
    } catch {
        // ignore
    }

    return initialProgress;
}

export function saveWorldProgress(progress: WorldProgress): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
        // ignore
    }
}

export function addPlayerXp(progress: WorldProgress, xpToAdd: number): {
    updatedProgress: WorldProgress;
    didLevelUp: boolean;
    newLevel: number;
    pointsGained: number;
    oldLevel: number;
} {
    const currentStats = progress.playerStats || DEFAULT_PLAYER_STATS;
    let { level, xp, statPoints, baseHp, strength, agility } = currentStats;
    let xpToNextLevel = getXpRequiredForNextLevel(level);
    const oldLevel = level;
    xp += xpToAdd;
    let didLevelUp = false;
    let pointsGained = 0;

    while (xp >= xpToNextLevel) {
        xp -= xpToNextLevel;
        level += 1;
        xpToNextLevel = getXpRequiredForNextLevel(level);
        statPoints += 1; // 1 deliberate point per level for balanced progression
        pointsGained += 1;
        didLevelUp = true;
    }

    const maxSpellPoints = 6 + level * 2;
    const currentSpellPoints = didLevelUp ? maxSpellPoints : (currentStats.currentSpellPoints ?? maxSpellPoints);

    const updatedStats: PlayerRpgStats = {
        ...currentStats,
        level,
        xp,
        xpToNextLevel,
        statPoints,
        baseHp,
        strength,
        agility,
        maxSpellPoints,
        currentSpellPoints
    };

    // When level-up occurs or companions gain XP, restore and scale companion abilities
    const updatedHiredNpcs = progress.hiredNpcs
        ? progress.hiredNpcs.map(npc => {
            if (npc.isDead) return npc;
            let compLvl = npc.level || 1;
            let compXp = (npc.xp || 0) + (xpToAdd > 0 ? Math.floor(xpToAdd * 0.8) : 0);
            let compXpNext = npc.xpToNextLevel || (compLvl * 80);
            let compMaxCharges = npc.maxAbilityCharges || 3;
            let compCurCharges = npc.currentAbilityCharges !== undefined ? npc.currentAbilityCharges : compMaxCharges;
            let compBaseHp = npc.baseHp || 100;
            let compCurHp = npc.hp ?? compBaseHp;
            let didCompLevelUp = false;

            while (compXp >= compXpNext) {
                compXp -= compXpNext;
                compLvl += 1;
                compXpNext = compLvl * 80;
                compMaxCharges = Math.min(6, compMaxCharges + 1);
                compBaseHp += 15;
                compCurHp = compBaseHp;
                didCompLevelUp = true;
            }

            if (didLevelUp || didCompLevelUp) {
                compCurCharges = compMaxCharges; // Restores on level up!
            }

            return {
                ...npc,
                level: compLvl,
                xp: compXp,
                xpToNextLevel: compXpNext,
                maxAbilityCharges: compMaxCharges,
                currentAbilityCharges: compCurCharges,
                baseHp: compBaseHp,
                hp: compCurHp
            };
        })
        : progress.hiredNpcs;

    const updatedProgress: WorldProgress = {
        ...progress,
        playerStats: updatedStats,
        hiredNpcs: updatedHiredNpcs
    };

    saveWorldProgress(updatedProgress);

    return {
        updatedProgress,
        didLevelUp,
        newLevel: level,
        pointsGained,
        oldLevel
    };
}

export function resetPlayerStats(progress: WorldProgress): WorldProgress {
    const updated: WorldProgress = {
        ...progress,
        playerStats: { ...DEFAULT_PLAYER_STATS }
    };
    saveWorldProgress(updated);
    return updated;
}

export function recordRangedShot(
    progress: WorldProgress,
    weaponType: 'bow' | 'other' = 'bow'
): {
    updatedProgress: WorldProgress;
    bowLevelUp: boolean;
    rangedLevelUp: boolean;
    newBowProf: number;
    newRangedMod: number;
} {
    const stats = progress.playerStats || DEFAULT_PLAYER_STATS;
    const oldBowShots = stats.totalBowShots || 0;
    const oldRangedShots = stats.totalRangedShots || 0;

    const newBowShots = weaponType === 'bow' ? oldBowShots + 1 : oldBowShots;
    const newRangedShots = oldRangedShots + 1;

    const oldBowProf = 1 + Math.floor(oldBowShots / 60);
    const newBowProf = 1 + Math.floor(newBowShots / 60);
    const oldRangedMod = 1 + Math.floor(oldRangedShots / 60);
    const newRangedMod = 1 + Math.floor(newRangedShots / 60);

    const updatedStats: PlayerRpgStats = {
        ...stats,
        totalBowShots: newBowShots,
        totalRangedShots: newRangedShots,
        bowProficiency: newBowProf,
        rangedShootingMod: newRangedMod
    };

    const updatedProgress: WorldProgress = {
        ...progress,
        playerStats: updatedStats
    };

    saveWorldProgress(updatedProgress);

    return {
        updatedProgress,
        bowLevelUp: newBowProf > oldBowProf,
        rangedLevelUp: newRangedMod > oldRangedMod,
        newBowProf,
        newRangedMod
    };
}

export function resetWorldProgress(): WorldProgress {
    const initialProgress: WorldProgress = {
        defeatedOpponentIds: [],
        defeatedBrawlOpponentIds: [],
        defeatedActivityOpponents: {},
        opponentVictories: {},
        conqueredTavernIds: [],
        brawlConqueredTavernIds: [],
        conqueredActivityTaverns: {},
        visitedSettlementIds: ['city_rannegrad'],
        playerGold: 100,
        playerReputation: 0,
        playerPosition: { x: 52, y: 37, isMoving: false },
        playerStats: { ...DEFAULT_PLAYER_STATS },
        statsVersion: CURRENT_STATS_VERSION
    };
    saveWorldProgress(initialProgress);
    return initialProgress;
}

export function spendStatPoint(
    progress: WorldProgress,
    stat: 'baseHp' | 'strength' | 'agility'
): WorldProgress {
    const stats = progress.playerStats || DEFAULT_PLAYER_STATS;
    if (stats.statPoints <= 0) return progress;

    const newStats: PlayerRpgStats = {
        ...stats,
        statPoints: stats.statPoints - 1,
        baseHp: stat === 'baseHp' ? stats.baseHp + 10 : stats.baseHp, // +10 HP per stat point
        strength: stat === 'strength' ? stats.strength + 2 : stats.strength, // +2 Strength (+2 HP / +2 damage)
        agility: stat === 'agility' ? stats.agility + 1 : stats.agility // +1 Agility (+1 to d20)
    };

    const updated: WorldProgress = {
        ...progress,
        playerStats: newStats
    };
    saveWorldProgress(updated);
    return updated;
}

const tavernRosterCache = new Map<string, ReturnType<typeof createTavernOpponents>>();

export function ensureTavernOpponents(tavern: TavernData): TavernData {
    if (!tavern) return tavern;
    if (tavern.contenders && tavern.champions && tavern.classicDurakContenders && tavern.dicePokerContenders && tavern.tavernDiceContenders && tavern.checkersContenders) return tavern;

    let generated = tavernRosterCache.get(tavern.id);
    if (!generated) {
        generated = createTavernOpponents(
            tavern.id || 'default_tavern',
            tavern.name || 'Таверна',
            tavern.settlementType || 'village',
            tavern.tierLevel || 1
        );
        tavernRosterCache.set(tavern.id, generated);
    }
    Object.assign(tavern, generated);
    return tavern;
}

const tavernActivityRosterCache = new Map<string, { contenders: OpponentData[]; champions: OpponentData[] }>();

export function getTavernActivityRoster(tavern: TavernData, activityType: TavernActivityType): {
    contenders: OpponentData[];
    champions: OpponentData[];
} {
    if (!tavern) {
        return { contenders: [], champions: [] };
    }
    ensureTavernOpponents(tavern);
    switch (activityType) {
        case 'rpg_cards':
            if (tavern.contenders && tavern.champions) {
                return { contenders: tavern.contenders, champions: tavern.champions };
            }
            break;
        case 'classic_durak_36':
            if (tavern.classicDurakContenders && tavern.classicDurakChampions) {
                return { contenders: tavern.classicDurakContenders, champions: tavern.classicDurakChampions };
            }
            break;
        case 'classic_durak_52':
            if (tavern.extendedDurakContenders && tavern.extendedDurakChampions) {
                return { contenders: tavern.extendedDurakContenders, champions: tavern.extendedDurakChampions };
            }
            break;
        case 'dice_poker':
            if (tavern.dicePokerContenders && tavern.dicePokerChampions) {
                return { contenders: tavern.dicePokerContenders, champions: tavern.dicePokerChampions };
            }
            break;
        case 'tavern_dice':
            if (tavern.tavernDiceContenders && tavern.tavernDiceChampions) {
                return { contenders: tavern.tavernDiceContenders, champions: tavern.tavernDiceChampions };
            }
            break;
        case 'checkers':
            if (tavern.checkersContenders && tavern.checkersChampions) {
                return { contenders: tavern.checkersContenders, champions: tavern.checkersChampions };
            }
            break;
        case 'chess_standard':
            if (tavern.chessStandardContenders && tavern.chessStandardChampions) {
                return { contenders: tavern.chessStandardContenders, champions: tavern.chessStandardChampions };
            }
            break;
        case 'senet':
            if (tavern.senetContenders && tavern.senetChampions) {
                return { contenders: tavern.senetContenders, champions: tavern.senetChampions };
            }
            break;
        case 'ur':
            if (tavern.urContenders && tavern.urChampions) {
                return { contenders: tavern.urContenders, champions: tavern.urChampions };
            }
            break;
        case 'mehen':
            if (tavern.mehenContenders && tavern.mehenChampions) {
                return { contenders: tavern.mehenContenders, champions: tavern.mehenChampions };
            }
            break;
        case 'aseb':
            if (tavern.asebContenders && tavern.asebChampions) {
                return { contenders: tavern.asebContenders, champions: tavern.asebChampions };
            }
            break;
        case 'brawl':
            if (tavern.brawlers && tavern.brawlChampions) {
                return { contenders: tavern.brawlers, champions: tavern.brawlChampions };
            }
            break;
        case 'fencing_sword_shield':
            if (tavern.fencingSwordShieldContenders && tavern.fencingSwordShieldChampions) {
                return { contenders: tavern.fencingSwordShieldContenders, champions: tavern.fencingSwordShieldChampions };
            }
            break;
        case 'fencing_sword_only':
            if (tavern.fencingSwordOnlyContenders && tavern.fencingSwordOnlyChampions) {
                return { contenders: tavern.fencingSwordOnlyContenders, champions: tavern.fencingSwordOnlyChampions };
            }
            break;
        case 'archery':
            if (tavern.archeryContenders && tavern.archeryChampions) {
                return { contenders: tavern.archeryContenders, champions: tavern.archeryChampions };
            }
            break;
        case 'jousting':
            if (tavern.joustingContenders && tavern.joustingChampions) {
                return { contenders: tavern.joustingContenders, champions: tavern.joustingChampions };
            }
            break;
        case 'toy_soldiers':
            if (tavern.toySoldiersContenders && tavern.toySoldiersChampions) {
                return { contenders: tavern.toySoldiersContenders, champions: tavern.toySoldiersChampions };
            }
            break;
    }

    // Dedicated activity roster for all other activities: guarantees each game has its OWN unique opponents & IDs!
    const cacheKey = `${tavern.id || 'default_tavern'}_${activityType}`;
    let dedicated = tavernActivityRosterCache.get(cacheKey);
    if (!dedicated) {
        dedicated = createDedicatedActivityOpponents(
            tavern.id || 'default_tavern',
            activityType,
            tavern.settlementType || 'village',
            tavern.tierLevel || 1
        );
        tavernActivityRosterCache.set(cacheKey, dedicated);
    }
    return dedicated;
}

export const WINS_TO_RETIRE_TO_NPC = 3;

export function getOpponentWinKey(activityType: TavernActivityType, opponentId: string): string {
    return `${activityType}:${opponentId}`;
}

export function getOpponentWinCount(
    progress: WorldProgress,
    opponentId: string,
    activityType: TavernActivityType = 'rpg_cards'
): number {
    const key = getOpponentWinKey(activityType, opponentId);
    if (progress.opponentVictories && typeof progress.opponentVictories[key] === 'number') {
        return progress.opponentVictories[key];
    }
    // Fallback: if previously marked defeated in legacy lists, treat as at least 1 win
    if (activityType === 'rpg_cards' && progress.defeatedOpponentIds?.includes(opponentId)) {
        return 1;
    }
    if (activityType === 'brawl' && progress.defeatedBrawlOpponentIds?.includes(opponentId)) {
        return 1;
    }
    if (progress.defeatedActivityOpponents?.[activityType]?.includes(opponentId)) {
        return 1;
    }
    return 0;
}

export function isOpponentRetiredToNPC(
    progress: WorldProgress,
    opponentId: string,
    activityType: TavernActivityType = 'rpg_cards'
): boolean {
    return getOpponentWinCount(progress, opponentId, activityType) >= WINS_TO_RETIRE_TO_NPC;
}

export function isOpponentDefeated(progress: WorldProgress, opponentId: string): boolean {
    return (progress.defeatedOpponentIds || []).includes(opponentId) || getOpponentWinCount(progress, opponentId, 'rpg_cards') >= 1;
}

export function isBrawlOpponentDefeated(progress: WorldProgress, opponentId: string): boolean {
    return (progress.defeatedBrawlOpponentIds || []).includes(opponentId) || getOpponentWinCount(progress, opponentId, 'brawl') >= 1;
}

export function isActivityOpponentDefeated(
    progress: WorldProgress, 
    opponentId: string, 
    activityType: TavernActivityType
): boolean {
    if (getOpponentWinCount(progress, opponentId, activityType) >= 1) {
        return true;
    }
    if (activityType === 'rpg_cards') {
        return (progress.defeatedActivityOpponents?.['rpg_cards'] || progress.defeatedOpponentIds || []).includes(opponentId);
    }
    if (activityType === 'brawl') {
        return (progress.defeatedActivityOpponents?.['brawl'] || progress.defeatedBrawlOpponentIds || []).includes(opponentId);
    }
    return (progress.defeatedActivityOpponents?.[activityType] || []).includes(opponentId);
}

// Check if opponent is unlocked for any activity
export function isOpponentUnlocked(
    progress: WorldProgress, 
    tavern: TavernData, 
    opponent: OpponentData, 
    isBrawlOrActivity: boolean | TavernActivityType = false
): boolean {
    let activityType: TavernActivityType = 'rpg_cards';
    if (typeof isBrawlOrActivity === 'boolean') {
        activityType = isBrawlOrActivity ? 'brawl' : 'rpg_cards';
    } else {
        activityType = isBrawlOrActivity;
    }

    const { contenders, champions } = getTavernActivityRoster(tavern, activityType);

    const isPassed = (cId: string) => {
        return isActivityOpponentDefeated(progress, cId, activityType) ||
               Boolean(progress.hiredNpcIds && progress.hiredNpcIds.includes(cId)) ||
               Boolean(progress.hiredNpcs && progress.hiredNpcs.some(n => n.id === cId));
    };

    if (opponent.type === 'contender') {
        if (opponent.rank === 1) return true;
        const prev = contenders.find(c => c.rank === opponent.rank - 1);
        if (!prev) return true;
        return isPassed(prev.id);
    } else {
        // Champion tier! Must defeat or hire ALL contenders first
        const allContendersPassed = contenders.every(c => isPassed(c.id));
        if (!allContendersPassed) return false;

        if (opponent.rank === 3) return true;
        if (opponent.rank === 2) {
            const champ3 = champions.find(c => c.rank === 3);
            return champ3 ? isPassed(champ3.id) : false;
        }
        if (opponent.rank === 1) {
            const champ2 = champions.find(c => c.rank === 2);
            return champ2 ? isPassed(champ2.id) : false;
        }
        return false;
    }
}

export function getTavernActivityStatus(
    progress: WorldProgress,
    tavern: TavernData,
    activityType: TavernActivityType
): {
    contendersDefeated: number;
    totalContenders: number;
    championsDefeated: number;
    totalChampions: number;
    isConquered: boolean;
    canFightChampions: boolean;
} {
    const { contenders, champions } = getTavernActivityRoster(tavern, activityType);

    const isPassed = (cId: string) => {
        return isActivityOpponentDefeated(progress, cId, activityType) ||
               Boolean(progress.hiredNpcIds && progress.hiredNpcIds.includes(cId)) ||
               Boolean(progress.hiredNpcs && progress.hiredNpcs.some(n => n.id === cId));
    };

    const contendersDefeated = contenders.filter(c => isPassed(c.id)).length;
    const championsDefeated = champions.filter(c => isPassed(c.id)).length;
    const isConquered = champions.some(c => c.rank === 1 && isPassed(c.id));
    const canFightChampions = contendersDefeated >= contenders.length;

    return {
        contendersDefeated,
        totalContenders: contenders.length,
        championsDefeated,
        totalChampions: champions.length,
        isConquered,
        canFightChampions
    };
}

export function getTavernStatus(progress: WorldProgress, tavern: TavernData): {
    contendersDefeated: number;
    totalContenders: number;
    championsDefeated: number;
    totalChampions: number;
    isConquered: boolean;
    canFightChampions: boolean;
    // Brawler ring status
    brawlersDefeated: number;
    totalBrawlers: number;
    brawlChampionsDefeated: number;
    totalBrawlChampions: number;
    isBrawlConquered: boolean;
    canFightBrawlChampions: boolean;
} {
    const cardStatus = getTavernActivityStatus(progress, tavern, 'rpg_cards');
    const brawlStatus = getTavernActivityStatus(progress, tavern, 'brawl');

    return {
        contendersDefeated: cardStatus.contendersDefeated,
        totalContenders: cardStatus.totalContenders,
        championsDefeated: cardStatus.championsDefeated,
        totalChampions: cardStatus.totalChampions,
        isConquered: cardStatus.isConquered,
        canFightChampions: cardStatus.canFightChampions,
        brawlersDefeated: brawlStatus.contendersDefeated,
        totalBrawlers: brawlStatus.totalContenders,
        brawlChampionsDefeated: brawlStatus.championsDefeated,
        totalBrawlChampions: brawlStatus.totalChampions,
        isBrawlConquered: brawlStatus.isConquered,
        canFightBrawlChampions: brawlStatus.canFightChampions
    };
}

export function getOpponentXpReward(opponent: OpponentData, activityType: string, newWins: number): number {
    if (newWins === 1) return 10;
    if (newWins === 2) return 5;
    return 6;
}

export function recordVictory(
    progress: WorldProgress, 
    opponent: OpponentData, 
    tavern: TavernData,
    isBrawlOrActivity: boolean | TavernActivityType = false
): {
    updatedProgress: WorldProgress;
    isTavernNowConquered: boolean;
    unlockedNextName?: string;
    xpEarned: number;
    didLevelUp: boolean;
    newLevel: number;
    pointsGained: number;
    winsAgainstOpponent: number;
    becameNpc: boolean;
} {
    let activityType: TavernActivityType = 'rpg_cards';
    if (typeof isBrawlOrActivity === 'boolean') {
        activityType = isBrawlOrActivity ? 'brawl' : 'rpg_cards';
    } else {
        activityType = isBrawlOrActivity;
    }

    const { contenders, champions } = getTavernActivityRoster(tavern, activityType);
    let isTavernNowConquered = false;
    let unlockedNextName: string | undefined = undefined;

    // Track 3-win retirement mechanic
    const winKey = getOpponentWinKey(activityType, opponent.id);
    const existingWins = getOpponentWinCount(progress, opponent.id, activityType);
    const newWins = existingWins + 1;
    const becameNpc = newWins >= WINS_TO_RETIRE_TO_NPC && existingWins < WINS_TO_RETIRE_TO_NPC;

    const updatedOpponentVictories: Record<string, number> = {
        ...(progress.opponentVictories || {}),
        [winKey]: newWins
    };

    // 1. Update activity-specific defeated opponents
    const existingActivityDefeated = progress.defeatedActivityOpponents || {};
    const currentActivityList = existingActivityDefeated[activityType] || (
        activityType === 'rpg_cards' ? progress.defeatedOpponentIds :
        activityType === 'brawl' ? (progress.defeatedBrawlOpponentIds || []) : []
    );
    const newActivityList = Array.from(new Set([...currentActivityList, opponent.id]));
    const updatedDefeatedActivityOpponents = {
        ...existingActivityDefeated,
        [activityType]: newActivityList
    };

    // Legacy sync
    let defeatedOpponentIds = progress.defeatedOpponentIds;
    let defeatedBrawlOpponentIds = progress.defeatedBrawlOpponentIds || [];
    let conqueredTavernIds = [...progress.conqueredTavernIds];
    let brawlConqueredTavernIds = [...(progress.brawlConqueredTavernIds || [])];

    if (activityType === 'rpg_cards') {
        defeatedOpponentIds = newActivityList;
    } else if (activityType === 'brawl') {
        defeatedBrawlOpponentIds = newActivityList;
    }

    // 2. Check if tavern was conquered for this activity
    const existingActivityConquered = progress.conqueredActivityTaverns || {};
    const currentConqueredList = existingActivityConquered[activityType] || (
        activityType === 'rpg_cards' ? progress.conqueredTavernIds :
        activityType === 'brawl' ? (progress.brawlConqueredTavernIds || []) : []
    );
    let newConqueredList = [...currentConqueredList];

    if (opponent.type === 'champion' && opponent.rank === 1) {
        if (!newConqueredList.includes(tavern.id)) {
            newConqueredList.push(tavern.id);
            isTavernNowConquered = true;
        }
        if (activityType === 'rpg_cards' && !conqueredTavernIds.includes(tavern.id)) {
            conqueredTavernIds.push(tavern.id);
        }
        if (activityType === 'brawl' && !brawlConqueredTavernIds.includes(tavern.id)) {
            brawlConqueredTavernIds.push(tavern.id);
        }
    }

    const updatedConqueredActivityTaverns = {
        ...existingActivityConquered,
        [activityType]: newConqueredList
    };

    // 3. Determine next unlocked opponent name
    if (opponent.type === 'contender') {
        if (opponent.rank < 8) {
            const next = contenders.find(c => c.rank === opponent.rank + 1);
            if (next) unlockedNextName = `${next.name} (${next.title})`;
        } else {
            const champ3 = champions.find(c => c.rank === 3);
            if (champ3) unlockedNextName = `${champ3.title} — ${champ3.name}!`;
        }
    } else if (opponent.type === 'champion') {
        if (opponent.rank === 3) {
            const champ2 = champions.find(c => c.rank === 2);
            if (champ2) unlockedNextName = `${champ2.title} — ${champ2.name}!`;
        } else if (opponent.rank === 2) {
            const champ1 = champions.find(c => c.rank === 1);
            if (champ1) unlockedNextName = `${champ1.title} — ${champ1.name}!`;
        }
    }

    const xpEarned = getOpponentXpReward(opponent, activityType, newWins);

    const intermediateProgress: WorldProgress = {
        ...progress,
        defeatedOpponentIds,
        defeatedBrawlOpponentIds,
        conqueredTavernIds,
        brawlConqueredTavernIds,
        defeatedActivityOpponents: updatedDefeatedActivityOpponents,
        conqueredActivityTaverns: updatedConqueredActivityTaverns,
        opponentVictories: updatedOpponentVictories,
        playerGold: progress.playerGold + opponent.rewards.gold,
        playerReputation: progress.playerReputation + opponent.rewards.reputation
    };

    const { updatedProgress, didLevelUp, newLevel, pointsGained } = addPlayerXp(intermediateProgress, xpEarned);

    return {
        updatedProgress,
        isTavernNowConquered,
        unlockedNextName,
        xpEarned,
        didLevelUp,
        newLevel,
        pointsGained,
        winsAgainstOpponent: newWins,
        becameNpc
    };
}

export function recordLoss(progress: WorldProgress, isBrawlOrActivity: boolean | TavernActivityType = false): {
    updatedProgress: WorldProgress;
    xpEarned: number;
    didLevelUp: boolean;
    newLevel: number;
    pointsGained: number;
} {
    const isBrawl = isBrawlOrActivity === true || isBrawlOrActivity === 'brawl';
    const xpEarned = isBrawl ? 3 : 2;
    const { updatedProgress, didLevelUp, newLevel, pointsGained } = addPlayerXp(progress, xpEarned);
    return {
        updatedProgress,
        xpEarned,
        didLevelUp,
        newLevel,
        pointsGained
    };
}

export function getRetiredNpcDialogue(
    opponent: OpponentData,
    tavernName: string,
    settlementName: string,
    activityType: TavernActivityType
): { quote: string; loreTip: string; toastQuote: string } {
    const activityNames: Record<TavernActivityType, string> = {
        rpg_cards: 'картярські дуелі',
        brawl: 'кулачні бої',
        classic_durak_36: 'класичного дурня на 36 карт',
        classic_durak_52: 'великого дурня на 52 карти',
        classic_durak_54: 'дурня на 54 карти (з 2 джокерами)',
        classic_durak_56: 'дурня на 56 карт (з 4 джокерами)',
        classic_durak_minor_tarot: 'дурня на 56 Молодших арканів Таро',
        classic_durak_tarot: 'дурня на повну колоду Таро (78 карт)',
        durak_52_2trumps: 'дурня на 52 карти з двома козирями',
        durak_52_2trumps_plus1trump: 'дурня на 52 карти (2 козирі + 1 козирна масть)',
        durak_52_2trumps_plus2trumps: 'дурня на 52 карти (2 козирі + 2 козирні масті)',
        durak_52_2trumps_plus2suits: 'дурня на 52 карти (2 козирі + 2 масті)',
        durak_52_2trumps_plus1suit: 'дурня на 52 карти (2 козирі + 1 масть)',
        durak_52_3trumps: 'дурня на 52 карти (+3 козирі)',
        durak_52_4trumps: 'дурня на 52 карти (+4 козирі)',
        durak_104_2trumps: 'великого дурня на 104 карти (+2 козирі)',
        french_tarot: 'французького таро',
        blackjack: 'бледжек',
        blackjack_dice: 'бледжек на кістках',
        steeplechase: 'перегони з перешкодами',
        flat_horse_race: 'кінні перегони',
        dice_poker: 'покер на кістках',
        tavern_dice: 'тавернські кості',
        coin_flip: 'гру в монетку',
        d20_dice: 'd20 кості',
        potion_roulette: 'рулетку зілля',
        dice_duel: 'двобій на костях',
        dice_duel_tournament: 'турнір двобоїв на костях',
        checkers: 'шашки',
        senet: 'давній сенет',
        ur: 'Королівську гру Ур',
        mehen: 'священний мехен',
        aseb: 'асеб',
        fencing_sword_shield: 'фехтування на мечах та щитах',
        fencing_sword_only: 'фехтування на мечах без щита',
        archery: 'стрільбу з лука',
        jousting: 'лицарський джостинг',
        mounted_archery: 'кінні перегони зі стрільбою',
        chess_standard: 'класичні шахи',
        shatranj: 'перський шатрандж',
        chaturanga: 'давньоіндійську чатурангу',
        chaturaji: 'чатураджі',
        tamerlane: 'шахи Тамерлана',
        courier: 'кур\'єрські шахи',
        capablanca: 'шахи Капабланки',
        carrera: 'шахи Карери',
        grasshopper: 'шахи з коником',
        cheskers: 'шашмати',
        archchess: 'шахи Аркчес',
        archcourier: 'шахи Архкур\'єр',
        senterej: 'ефіопський сентереж',
        al_adli: 'індійські шахи Аль-Адлі',
        sittuyin: 'бірманський сіттуїн',
        makruk: 'тайський макрук',
        shatar: 'монгольський шатар',
        xiangqi: 'китайські сянци',
        janggi: 'корейські чангі',
        heian_shogi: 'давні хеян сьогі',
        sho_shogi: 'японські малі шо сьогі',
        shogi: 'японські шахи сьогі',
        napoleonic: 'класичні наполеонівські шахи (14x14)',
        fide_napoleonic: 'наполеонівські шахи FIDE (8x8)',
        napoleon_ottomans: 'шахи Наполеон і Османи (10x10)',
        bachelor: 'шахи холостяка (Bachelor Chess 7x6)',
        toy_soldiers: 'тактичну гру в солдатики (15x15)',
        army_battle: 'битву армій (16 vs 16)',
        toy_checkers: 'бойові шашки (8x8)',
        toy_checkers_10x10: 'бойові шашки (10x10)',
        toy_checkers_12x12: 'бойові шашки (12x12)',
        toy_checkers_classic: 'шашкові бойові шашки (8x8)',
        toy_pawns: 'бойові пішаки (8x8)',
        toy_pawns_10x10: 'бойові пішаки (10x10)',
        toy_pawns_12x12: 'бойові пішаки (12x12)',
        wizard_battle: 'бій чаклунів',
        wizard_tournament: 'турнір чаклунів (16 магів)',
        magic_pawns: 'магічні бойові пішаки (8x8)',
        magic_pawns_10x10: 'магічні бойові пішаки (10x10)',
        magic_pawns_12x12: 'магічні бойові пішаки (12x12)',
        battle_pawns_6x12: 'битву пішаків 6х12 (мечі та магія)',
        checkers_war: 'армійські шашки (8x8)',
        aranian_checkers_war: 'аранійські армійські шашки (8x8)',
        military_checkers: 'військові шашки (8x8 • 120 бійців)',
        aranian_military_checkers: 'аранійські військові шашки (8x8 • 120 бійців)',
        tavern_labyrinth: 'підземний лабіринт на час',
        tavern_treasure_hunter: 'шукач скарбів (платформер)',
        fantasy_adventure: 'фантастичні пригоди (JRPG бій)',
        rpg_army_checkers: 'рольові армійські шашки (G29)'
    };

    const gameLabel = activityNames[activityType] || 'гру';

    return {
        quote: `О, вітаю, друже! Після тих трьох партій я зрозумів, що ти в ${gameLabel} неперевершений майстер. Тепер я повісив колоду на гвіздок і просто насолоджуюся спокоєм у таверні «${tavernName}».`,
        loreTip: `Шинкар шепотів, що в сусідніх землях ${settlementName} з'явилися нові сильні суперники. Але якщо хочеш просто посидіти біля каміна — сідай поруч, тут тепло й затишно!`,
        toastQuote: `За твою велику майстерність! Хай доля завжди підкидає тобі щасливі комбінації!`
    };
}

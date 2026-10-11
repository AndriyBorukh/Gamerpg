import { Card, Suit, Rank, TablePair, Player, CombatLogEntry, ShopStock } from '../types';
import { 
    createDeck, 
    canBeat, 
    canAttackWithCard, 
    getBestAttackCard,
    getBestDefenseCard,
    getSortedAttackCards,
    getSortedDefenseCards,
    getSortedEmpoweredDefenseCandidates,
    CLASSIC_SUITS,
    EXTENDED_SUITS,
    MINOR_TAROT_SUITS,
    BOT_AVATARS,
    getMinTrumpValue,
    getNextActivePlayerIndex,
    DeckMode,
    getInitialHandSize,
    SENIOR_SUIT,
    getCardValue,
    isInstantSpellCard,
    getRequiredEternalDiscardCount
} from './gameLogic';
import { SHOP_ITEMS } from '../components/ShopModal';
import { createCardFromSmeltingKey } from './smeltingCards';

export interface GameState {
    playerCount: number;
    deckMode: DeckMode;
    players: Player[];
    deck: Card[];
    trumpCards: Card[];
    actualTrumpSuits: Suit[];
    table: TablePair[];
    discardPile: Card[];
    eternalDiscardPile: Card[];
    heroDiscardPile?: Card[];
    heroShardsGained?: number;
    destroyedHeroCardIds?: string[];
    heroCardUpdates?: Record<string, { level: number; experience: number; maxXp: number; condition: number; destroyed?: boolean }>;
    attackerId: number;
    defenderId: number;
    turnPlayerId: number;
    passedPlayers: number[];
    isTaking: boolean;
    isLockedByGrandmaster: boolean;
    nextOutRank: number;
    gameOver: boolean;
    foolPlayerId: number | null;
    isDraw?: boolean;
    extraTurnPlayerId?: number | null;
    extraTurnCount?: number;
    statusBanner?: string | null;
    isPaladinDefenseLocked?: boolean;
    shopStock?: ShopStock;
    combatLog?: CombatLogEntry[];
    activeSmeltingPicker?: { playerId: number } | null;
    prikupDecks?: Record<number, Card[]>;
    turnNumber?: number;
}

export const INITIAL_SHOP_STOCK: ShopStock = {
    weakStrengthBoost: 12,
    strengthBoost: 10,
    strongStrengthBoost: 8,
    spells: 18,
    immortality: 6,
    summonGhost: 12,
    summonSkeletons: 10,
    summonZombies: 8,
    illusionCopy: 9,
    endTurn: 14,
    summonGolem: 9,
    summonAnimatronic: 9,
    summonAutomaton: 9,
    meteorSwarm: 6,
    manaShield: 8,
    chainLightning: 10,
    massDeath: 6,
    deathRay: 8,
    mindHeist: 8,
    conversion: 6,
    holyCathedral: 5,
    northernWind: 6,
    horde: 6,
    undeadLord: 6,
    zombiePlague: 6,
    turnToSkeletons: 6,
    pirateRaid: 6,
    undeadLordSpell: 3,
    grandKonungSpell: 3,
    greatKhanSpell: 3,
    zombieApocalypseSpell: 2,
    invadersSpell: 3,
    stormOfSeasSpell: 3,
    einherjarSpell: 2,
    helArmySpell: 2,
    burnCardSpell: 6,
    burnHandSpell: 4,
    summonVampire: 8,
    summonVampireSpell: 8,
    smeltingLvl1: 6,
    smeltingLvl2: 5,
    smeltingLvl3: 5,
    smeltingLvl4: 5,
    smeltingLvl5: 5,
    smeltingLvl6: 3,
    smeltingLvl7: 3,
    smeltingLvl8: 4,
    resourceReleaseLvl1: 6,
    resourceReleaseLvl2: 5,
    resourceReleaseLvl3: 5,
    resourceReleaseLvl4: 5,
    resourceReleaseLvl5: 5,
    resourceReleaseLvl6: 3,
    resourceReleaseLvl7: 3,
};

export const addLog = (state: GameState, text: string, type: CombatLogEntry['type'] = 'system'): GameState => {
    const timestamp = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: CombatLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        text,
        type,
        timestamp
    };
    return {
        ...state,
        combatLog: [...(state.combatLog || []), newLog]
    };
};

export interface HeroUpdateResult {
    updatedCard: Card;
    destroyed: boolean;
    leveledUp: boolean;
    shardsGained: number;
    logText: string;
}

export function processHeroCardBoutEvent(
    card: Card,
    reason: 'beat_card' | 'unblocked_attack' | 'was_beaten'
): HeroUpdateResult {
    let xpGain = 0;
    let conditionDelta = 0;

    if (reason === 'beat_card') {
        xpGain = 2; // +2 XP за биття карти
    } else if (reason === 'unblocked_attack') {
        xpGain = 10; // +10 XP за невідбитий хід такою картою
    } else if (reason === 'was_beaten') {
        xpGain = 3; // +3 XP якщо побили
        conditionDelta = -1; // -1 очко стану якщо побили
    }

    let currentXp = (card.heroXp ?? 0) + xpGain;
    let currentLevel = card.heroLevel ?? card.value ?? 0;
    let maxXp = card.heroMaxXp ?? ((currentLevel + 1) * 20);
    const maxCondition = card.heroMaxCondition ?? 10;
    const currentCondition = (card.heroCondition ?? 10) + conditionDelta;
    let leveledUp = false;

    while (currentXp >= maxXp && currentLevel < 99) {
        currentXp -= maxXp;
        currentLevel += 1;
        maxXp = (currentLevel + 1) * 20;
        leveledUp = true;
    }

    const cardName = card.heroName || card.rank || 'Геройська карта';

    if (currentCondition <= 0) {
        return {
            updatedCard: {
                ...card,
                heroLevel: currentLevel,
                heroXp: currentXp,
                heroMaxXp: maxXp,
                value: currentLevel,
                heroCondition: 0,
                heroMaxCondition: maxCondition
            },
            destroyed: true,
            leveledUp,
            shardsGained: 2,
            logText: `💔 Геройська карта "${cardName}" отримала +${xpGain} XP, але її стан впав до 0/10 — вона розвалилася на частини (+2 уламки карт 🧩)!`
        };
    }

    let logText = '';
    if (reason === 'beat_card') {
        logText = `🗡️ Геройська карта "${cardName}" побила карту: +2 XP (${currentXp}/${maxXp} XP)!${leveledUp ? ` 🌟 Рівень підвищено до ${currentLevel}!` : ''}`;
    } else if (reason === 'unblocked_attack') {
        logText = `⚔️ Геройська карта "${cardName}" провела невідбитий хід: +10 XP (${currentXp}/${maxXp} XP)!${leveledUp ? ` 🌟 Рівень підвищено до ${currentLevel}!` : ''}`;
    } else if (reason === 'was_beaten') {
        logText = `🛡️ Геройську карту "${cardName}" побито: +3 XP, стан -1 (${currentCondition}/${maxCondition})!${leveledUp ? ` 🌟 Рівень підвищено до ${currentLevel}!` : ''}`;
    }

    return {
        updatedCard: {
            ...card,
            heroLevel: currentLevel,
            heroXp: currentXp,
            heroMaxXp: maxXp,
            value: currentLevel,
            heroCondition: currentCondition,
            heroMaxCondition: maxCondition
        },
        destroyed: false,
        leveledUp,
        shardsGained: 0,
        logText
    };
}

export const generateRandomBonusCard = (): Card => {
    const cardId = Math.floor(Date.now() + Math.random() * 1000000);
    const options = [
        () => ({ id: cardId, suit: '🛡️' as any, rank: 'HR (Герой)' as any, value: 99, isHero: true }),
        () => ({ id: cardId, suit: '🪙' as any, rank: 'GL (Золото)' as any, value: 80, isGold: true }),
        () => ({ id: cardId, suit: '🥈' as any, rank: 'SL (Срібло)' as any, value: 75, isSilver: true }),
        () => ({ id: cardId, suit: '🧪' as any, rank: 'ELX (Еліксир)' as any, value: 10, isHealthElixir: true }),
        () => ({ id: cardId, suit: '🗝️' as any, rank: 'TRSR (Скарб)' as any, value: 11, isTreasure: true }),
        () => ({ id: cardId, suit: '🖤' as any, rank: 'DK (Лицар смерті)' as any, value: 99, isDeathKnight: true }),
        () => ({ id: cardId, suit: '⚔️' as any, rank: 'PL (Паладин)' as any, value: 99, isPaladin: true }),
        () => ({ id: cardId, suit: '🧙‍♂️' as any, rank: 'NC (Некромант)' as any, value: 11, isNecromancer: true }),
        () => ({ id: cardId, suit: '🔮' as any, rank: 'SP (Закляття)' as any, value: 10, isSpell: true }),
        () => ({ id: cardId, suit: '⚡' as any, rank: 'SP (Закляття)' as any, value: 95, isSpell: true, isChainLightning: true }),
        () => ({ id: cardId, suit: '☄️' as any, rank: 'SP (Закляття)' as any, value: 99, isSpell: true, isMeteorSwarm: true }),
        () => ({ id: cardId, suit: '🛡️' as any, rank: 'WAL (Стіна)' as any, value: 80, isWall: true }),
        () => ({ id: cardId, suit: '🏰' as any, rank: 'CST (Замок)' as any, value: 95, isCastle: true }),
        () => ({ id: cardId, suit: '🎰' as any, rank: 'GB (Гравець)' as any, value: 96, isGambler: true }),
        () => ({ id: cardId, suit: '🪤' as any, rank: 'TR (Пастка)' as any, value: 10, isTrap: true }),
        () => ({ id: cardId, suit: '🎩' as any, rank: 'TYC (Магнат)' as any, value: 90, isTycoon: true }),
    ];
    const pick = options[Math.floor(Math.random() * options.length)];
    return pick();
};

export const pickSmeltingCardState = (state: GameState, playerId: number, cardKey: string): GameState => {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return state;

    const chosenCard: Card = createCardFromSmeltingKey(cardKey);

    const updatedPlayers = state.players.map(p => {
        if (p.id === playerId) {
            return {
                ...p,
                hand: [...p.hand, chosenCard!]
            };
        }
        return p;
    });

    const newState: GameState = {
        ...state,
        activeSmeltingPicker: null,
        players: updatedPlayers,
        statusBanner: `✨ ${player.name} обрано карту "${chosenCard.rank}"!`
    };

    return addLog(newState, `✨ ${player.name} отримав обрану карту ${chosenCard.rank}.`, 'spell');
};

export const buyShopItemState = (state: GameState, playerId: number, itemKey: keyof ShopStock): GameState => {
    const currentStock = state.shopStock ? { ...state.shopStock } : { ...INITIAL_SHOP_STOCK };
    const stockAmount = currentStock[itemKey] || 0;
    
    // For human player (playerId === 0), check that stock is available in this shop
    if (playerId === 0 && stockAmount <= 0) return state;

    const itemInfo = SHOP_ITEMS.find(i => i.key === itemKey);
    if (!itemInfo) return state;

    const player = state.players.find(p => p.id === playerId);
    if (!player || player.powerPoints < itemInfo.cost) return state;

    // Only human player (playerId === 0) consumes stock from the opponent's shop stock.
    // Enemy bots have their own separate supply and do NOT deplete the player's shop!
    if (playerId === 0) {
        currentStock[itemKey] = stockAmount - 1;
    }

    let newCard: Card | null = null;
    const cardId = Math.floor(Date.now() + Math.random() * 1000000);

    switch (itemKey) {
        case 'weakStrengthBoost':
            newCard = { id: cardId, suit: '⚡' as any, rank: 'SP (+1 Сила)' as any, value: 90, isSpell: true, isWeakStrengthBoostSpell: true };
            break;
        case 'strengthBoost':
            newCard = { id: cardId, suit: '💪' as any, rank: 'SP (+3 Сила)' as any, value: 92, isSpell: true, isStrengthBoostSpell: true };
            break;
        case 'strongStrengthBoost':
            newCard = { id: cardId, suit: '💥' as any, rank: 'SP (+10 Сила)' as any, value: 95, isSpell: true, isStrongStrengthBoostSpell: true };
            break;
        case 'spells':
            newCard = { id: cardId, suit: '🔮', rank: 'SP (Закляття)', value: 10, isSpell: true };
            break;
        case 'immortality':
            newCard = { id: cardId, suit: '🛡️' as any, rank: 'SP (Закляття)', value: 99, isSpell: true, isImmortalitySpell: true };
            break;
        case 'summonGhost':
            newCard = { id: cardId, suit: '👻' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonGhostSpell: true };
            break;
        case 'summonSkeletons':
            newCard = { id: cardId, suit: '☠️' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonSkeletonsSpell: true };
            break;
        case 'summonZombies':
            newCard = { id: cardId, suit: '🧟' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonZombiesSpell: true };
            break;
        case 'illusionCopy':
            newCard = { id: cardId, suit: '✨', rank: 'SP (Ілюзорна копія)', value: 10, isSpell: true, isIllusionCopySpell: true };
            break;
        case 'endTurn':
            newCard = { id: cardId, suit: '⌛' as any, rank: 'SP (Закляття)', value: 99, isSpell: true, isEndTurnSpell: true };
            break;
        case 'summonGolem':
            newCard = { id: cardId, suit: '🗿' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonGolemSpell: true, isEternalCard: true };
            break;
        case 'summonAnimatronic':
            newCard = { id: cardId, suit: '🤖' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonAnimatronicSpell: true, isEternalCard: true };
            break;
        case 'summonAutomaton':
            newCard = { id: cardId, suit: '⚙️' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonAutomatonSpell: true, isEternalCard: true };
            break;
        case 'meteorSwarm':
            newCard = { id: cardId, suit: '☄️' as any, rank: 'SP (Закляття)', value: 99, isSpell: true, isMeteorSwarm: true };
            break;
        case 'manaShield':
            newCard = { id: cardId, suit: '🛡️' as any, rank: 'SP (Закляття)', value: 99, isSpell: true, isManaShield: true };
            break;
        case 'chainLightning':
            newCard = { id: cardId, suit: '⚡' as any, rank: 'SP (Закляття)', value: 95, isSpell: true, isChainLightning: true };
            break;
        case 'massDeath':
            newCard = { id: cardId, suit: '💀' as any, rank: 'SP (Закляття)', value: 99, isSpell: true, isMassDeath: true };
            break;
        case 'deathRay':
            newCard = { id: cardId, suit: '🔮' as any, rank: 'SP (Закляття)', value: 95, isSpell: true, isDeathRay: true };
            break;
        case 'mindHeist':
            newCard = { id: cardId, suit: '👁️' as any, rank: 'SP (Закляття)', value: 90, isSpell: true, isMindHeist: true };
            break;
        case 'conversion':
            newCard = { id: cardId, suit: '✨' as any, rank: 'SP (Закляття)', value: 92, isSpell: true, isConversion: true };
            break;
        case 'holyCathedral':
            newCard = { id: cardId, suit: '⛪' as any, rank: 'SP (Закляття)', value: 98, isSpell: true, isHolyCathedral: true };
            break;
        case 'northernWind':
            newCard = { id: cardId, suit: '❄️' as any, rank: 'SP (Закляття)', value: 90, isSpell: true, isNorthernWind: true };
            break;
        case 'horde':
            newCard = { id: cardId, suit: '🪓' as any, rank: 'SP (Закляття)', value: 90, isSpell: true, isHorde: true };
            break;
        case 'undeadLord':
            newCard = { id: cardId, suit: '👑' as any, rank: 'SP (Закляття)', value: 95, isSpell: true, isUndeadLord: true };
            break;
        case 'zombiePlague':
            newCard = { id: cardId, suit: '🧟' as any, rank: 'SP (Закляття)', value: 94, isSpell: true, isZombiePlague: true };
            break;
        case 'turnToSkeletons':
            newCard = { id: cardId, suit: '☠️' as any, rank: 'SP (Закляття)', value: 94, isSpell: true, isTurnToSkeletons: true };
            break;
        case 'pirateRaid':
            newCard = { id: cardId, suit: '🏴‍☠️' as any, rank: 'SP (Закляття)', value: 95, isSpell: true, isPirateRaid: true };
            break;
        case 'undeadLordSpell':
            newCard = { id: cardId, suit: '💀' as any, rank: 'SP (Закляття)', value: 96, isSpell: true, isUndeadLordSpell: true };
            break;
        case 'grandKonungSpell':
            newCard = { id: cardId, suit: '❄️' as any, rank: 'SP (Закляття)', value: 96, isSpell: true, isGrandKonungSpell: true };
            break;
        case 'greatKhanSpell':
            newCard = { id: cardId, suit: '🐎' as any, rank: 'SP (Закляття)', value: 96, isSpell: true, isGreatKhanSpell: true };
            break;
        case 'zombieApocalypseSpell':
            newCard = { id: cardId, suit: '🧟' as any, rank: 'SP (Закляття)', value: 97, isSpell: true, isZombieApocalypseSpell: true };
            break;
        case 'invadersSpell':
            newCard = { id: cardId, suit: '⚔️' as any, rank: 'SP (Закляття)', value: 96, isSpell: true, isInvadersSpell: true };
            break;
        case 'stormOfSeasSpell':
            newCard = { id: cardId, suit: '🌊' as any, rank: 'SP (Закляття)', value: 96, isSpell: true, isStormOfSeasSpell: true };
            break;
        case 'einherjarSpell':
            newCard = { id: cardId, suit: '🛡️' as any, rank: 'SP (Закляття)', value: 97, isSpell: true, isEinherjarSpell: true };
            break;
        case 'helArmySpell':
            newCard = { id: cardId, suit: '💀' as any, rank: 'SP (Закляття)', value: 97, isSpell: true, isHelArmySpell: true };
            break;
        case 'burnCardSpell':
            newCard = { id: cardId, suit: '🔥' as any, rank: 'SP (Закляття)', value: 90, isSpell: true, isBurnCardSpell: true };
            break;
        case 'burnHandSpell':
            newCard = { id: cardId, suit: '🧨' as any, rank: 'SP (Закляття)', value: 92, isSpell: true, isBurnHandSpell: true };
            break;
        case 'summonVampire':
            newCard = { id: cardId, suit: '🦇' as any, rank: 'VMP (Вампір)' as any, value: 11, isVampire: true };
            break;
        case 'summonVampireSpell':
            newCard = { id: cardId, suit: '🔮' as any, rank: 'SP (Закляття)', value: 91, isSpell: true, isVampireSpell: true };
            break;
        case 'smeltingLvl1':
            newCard = { id: cardId, suit: '⚒️' as any, rank: 'SP (Переплавлення 1)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 1 };
            break;
        case 'smeltingLvl2':
            newCard = { id: cardId, suit: '⚒️' as any, rank: 'SP (Переплавлення 2)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 2 };
            break;
        case 'smeltingLvl3':
            newCard = { id: cardId, suit: '⚒️' as any, rank: 'SP (Переплавлення 3)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 3 };
            break;
        case 'smeltingLvl4':
            newCard = { id: cardId, suit: '⚒️' as any, rank: 'SP (Переплавлення 4)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 4 };
            break;
        case 'smeltingLvl5':
            newCard = { id: cardId, suit: '⚒️' as any, rank: 'SP (Переплавлення 5)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 5 };
            break;
        case 'smeltingLvl6':
            newCard = { id: cardId, suit: '⚒️' as any, rank: 'SP (Переплавлення 6)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 6 };
            break;
        case 'smeltingLvl7':
            newCard = { id: cardId, suit: '⚒️' as any, rank: 'SP (Переплавлення 7)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 7 };
            break;
        case 'smeltingLvl8':
            newCard = { id: cardId, suit: '⚒️' as any, rank: 'SP (Переплавлення 8)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 8 };
            break;
        case 'resourceReleaseLvl1':
            newCard = { id: cardId, suit: '💎' as any, rank: 'SP (Вивільнення 1)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 1 };
            break;
        case 'resourceReleaseLvl2':
            newCard = { id: cardId, suit: '💎' as any, rank: 'SP (Вивільнення 2)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 2 };
            break;
        case 'resourceReleaseLvl3':
            newCard = { id: cardId, suit: '💎' as any, rank: 'SP (Вивільнення 3)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 3 };
            break;
        case 'resourceReleaseLvl4':
            newCard = { id: cardId, suit: '💎' as any, rank: 'SP (Вивільнення 4)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 4 };
            break;
        case 'resourceReleaseLvl5':
            newCard = { id: cardId, suit: '💎' as any, rank: 'SP (Вивільнення 5)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 5 };
            break;
        case 'resourceReleaseLvl6':
            newCard = { id: cardId, suit: '💎' as any, rank: 'SP (Вивільнення 6)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 6 };
            break;
        case 'resourceReleaseLvl7':
            newCard = { id: cardId, suit: '💎' as any, rank: 'SP (Вивільнення 7)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 7 };
            break;
    }

    const updatedPlayers = state.players.map(p => {
        if (p.id === playerId) {
            return {
                ...p,
                powerPoints: p.powerPoints - itemInfo.cost,
                hand: newCard ? [...p.hand, newCard] : p.hand
            };
        }
        return p;
    });

    const finalState = {
        ...state,
        shopStock: currentStock,
        players: updatedPlayers,
        statusBanner: `🛒 ${player.name} придбав "${itemInfo.name}" за ${itemInfo.cost} ${itemInfo.cost === 1 ? 'очко' : 'очки'} сили!`
    };
    return addLog(finalState, `🛒 ${player.name} придбав "${itemInfo.name}" за ${itemInfo.cost} очок сили.`, 'buy');
};

import { generateRandomName } from './nameGenerator';

function getStableSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export const initGame = (
    count: number, 
    deckMode: DeckMode = 'classic', 
    customPlayers?: Array<{ id: number; name: string; avatar: string; isHuman: boolean }>,
    playerRpgCards?: Card[]
): GameState => {
    const newDeck = createDeck(deckMode);
    
    // Pick two trump cards
    const trumpCard1 = newDeck[newDeck.length - 1];
    const trumpCard2 = newDeck[newDeck.length - 2] || trumpCard1;
    const handSize = getInitialHandSize(deckMode, count);

    const availableSuits = (deckMode === 'extended' ? EXTENDED_SUITS : (deckMode === 'minor_tarot' ? MINOR_TAROT_SUITS : CLASSIC_SUITS)).filter(s => s !== SENIOR_SUIT);

    let s1 = trumpCard1.suit;
    if (['Joker', '🎴', '✨', '♟️', '🎩', '🗡️', SENIOR_SUIT].includes(s1)) {
        s1 = availableSuits[Math.floor(Math.random() * availableSuits.length)];
    }

    let s2 = trumpCard2.suit;
    if (['Joker', '🎴', '✨', '♟️', '🎩', '🗡️', SENIOR_SUIT].includes(s2) || s2 === s1) {
        const remaining = availableSuits.filter(s => s !== s1);
        s2 = remaining[Math.floor(Math.random() * remaining.length)] || s1;
    }

    const actualTrumpSuits: Suit[] = [s1, s2];

    // Build the prikup decks for each player!
    const prikupDecks: Record<number, Card[]> = {};

    // For player 0 (the human): use their customized collection if available, otherwise fallback to standard deckMode
    if (playerRpgCards && playerRpgCards.length > 0 && deckMode !== 'classic54' && deckMode !== 'minor_tarot' && deckMode !== 'classic56') {
        prikupDecks[0] = [...playerRpgCards].sort(() => Math.random() - 0.5);
    } else {
        prikupDecks[0] = createDeck(deckMode);
    }

    // For bot players (IDs > 0): generate a balanced, shuffled deck for each
    for (let i = 1; i < count; i++) {
        prikupDecks[i] = createDeck(deckMode);
    }

    const newPlayers: Player[] = [];
    if (customPlayers && customPlayers.length === count) {
        customPlayers.forEach((cp, idx) => {
            const pId = cp.id ?? idx;
            const dealCount = Math.min(12, prikupDecks[pId].length);
            newPlayers.push({
                id: pId,
                name: cp.name,
                isHuman: cp.isHuman,
                hand: prikupDecks[pId].splice(0, dealCount),
                avatar: cp.avatar,
                powerPoints: 5,
                health: 500,
                armor: 200
            });
        });
    } else {
        // Default local single-player human vs bots
        const dealCount0 = Math.min(12, prikupDecks[0].length);
        newPlayers.push({
            id: 0,
            name: 'Ви',
            isHuman: true,
            hand: prikupDecks[0].splice(0, dealCount0),
            avatar: '👤',
            powerPoints: 5,
            health: 500,
            armor: 200
        });

        for (let i = 1; i < count; i++) {
            const seed = getStableSeed(`bot_${Date.now()}_${i}`);
            const dealCountI = Math.min(12, prikupDecks[i].length);
            newPlayers.push({
                id: i,
                name: generateRandomName('any', 'any', seed),
                isHuman: false,
                hand: prikupDecks[i].splice(0, dealCountI),
                avatar: BOT_AVATARS[(i - 1) % BOT_AVATARS.length],
                powerPoints: 5,
                health: 500,
                armor: 200
            });
        }
    }

    // Deal 3 "Gambler" (Гравець) cards to every player at start of game in mega/extended deck
    if (deckMode === 'extended') {
        newPlayers.forEach((p, pIdx) => {
            for (let g = 0; g < 3; g++) {
                p.hand.push({
                    id: 80000 + pIdx * 10 + g,
                    suit: '🎲',
                    rank: 'GB (Гравець)',
                    value: 96,
                    isGambler: true
                });
            }
        });
    }

    // Find starting player with lowest trump card
    let minTrumpVal = 1000;
    let startAttackerId = 0;

    newPlayers.forEach(p => {
        const minVal = getMinTrumpValue(p.hand, actualTrumpSuits);
        if (minVal < minTrumpVal) {
            minTrumpVal = minVal;
            startAttackerId = p.id;
        }
    });

    if (minTrumpVal === 1000) {
        startAttackerId = Math.floor(Math.random() * count);
    }

    const startDefenderId = getNextActivePlayerIndex(newPlayers, startAttackerId, prikupDecks[0].length, prikupDecks);

    return {
        playerCount: count,
        deckMode,
        players: newPlayers,
        deck: prikupDecks[0], // Synchronized with human's prikup deck!
        trumpCards: [trumpCard1, trumpCard2],
        actualTrumpSuits,
        table: [],
        discardPile: [],
        eternalDiscardPile: [],
        heroDiscardPile: [],
        heroShardsGained: 0,
        destroyedHeroCardIds: [],
        heroCardUpdates: {},
        attackerId: startAttackerId,
        defenderId: startDefenderId,
        turnPlayerId: startAttackerId,
        passedPlayers: [],
        isTaking: false,
        isLockedByGrandmaster: false,
        nextOutRank: 1,
        gameOver: false,
        foolPlayerId: null,
        extraTurnPlayerId: null,
        extraTurnCount: 0,
        turnNumber: 1,
        prikupDecks,
        shopStock: { ...INITIAL_SHOP_STOCK },
        combatLog: [
            {
                id: 'init-1',
                text: `🎮 Почалася нова гра! Режим колоди: ${deckMode === 'extended' ? 'Мега' : (deckMode === 'tarot' ? 'Таро' : (deckMode === 'minor_tarot' ? 'Молодші Аркани Таро (56 карт)' : (deckMode === 'classic56' ? 'Розширена (56 карт)' : (deckMode === 'classic54' ? 'Класичний (54 карти)' : 'RPG Класичний'))))}. Кожен гравець має власну колоду прикупу.`,
                type: 'system',
                timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            },
            {
                id: 'init-2',
                text: `🃏 Активні козирі: ${actualTrumpSuits.join(', ')}. Першим атакує: ${newPlayers.find(p => p.id === startAttackerId)?.name || 'Гравець'}.`,
                type: 'system',
                timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }
        ]
    };
};

export const isCompletelyDestroyedCard = (c: Card): boolean => Boolean(
    c.isHero ||
    c.isDraugr
);

export const refillHandsAfterSpell = (updatedPlayers: Player[], state: GameState, playerIdToSkip: number) => {
    let newDeck = [...state.deck];
    const handSize = getInitialHandSize(state.deckMode, state.playerCount);
    let startDrawIndex = updatedPlayers.findIndex(p => p.id === state.attackerId);
    if (startDrawIndex === -1) startDrawIndex = 0;
    let drawIndex = startDrawIndex;
    let count = 0;

    const newPrikupDecks = state.prikupDecks ? { ...state.prikupDecks } : undefined;

    while (count < updatedPlayers.length) {
        const playerToDraw = updatedPlayers[drawIndex];
        if (playerToDraw && playerToDraw.id !== playerIdToSkip && !playerToDraw.outRank) {
            if (newPrikupDecks && newPrikupDecks[playerToDraw.id]) {
                const pDeck = newPrikupDecks[playerToDraw.id];
                while (playerToDraw.hand.length < handSize && pDeck.length > 0) {
                    playerToDraw.hand.push(pDeck.shift()!);
                }
            } else {
                while (playerToDraw.hand.length < handSize && newDeck.length > 0) {
                    playerToDraw.hand.push(newDeck.shift()!);
                }
            }
        }
        drawIndex = (drawIndex + 1) % updatedPlayers.length;
        count++;
    }

    if (newPrikupDecks && newPrikupDecks[0]) {
        newDeck = newPrikupDecks[0];
    }

    let curOutRank = state.nextOutRank;
    updatedPlayers.forEach(p => {
        const hasCardsToDraw = newPrikupDecks ? ((newPrikupDecks[p.id]?.length || 0) > 0) : (newDeck.length > 0);
        if (!p.outRank && p.hand.length === 0 && !hasCardsToDraw) {
            p.outRank = curOutRank++;
        }
    });

    const nextAttackerId = playerIdToSkip;
    const nextDefenderId = getNextActivePlayerIndex(updatedPlayers, nextAttackerId, newDeck.length, newPrikupDecks);
    const remaining = updatedPlayers.filter(p => !p.outRank && (p.hand.length > 0 || (newPrikupDecks ? ((newPrikupDecks[p.id]?.length || 0) > 0) : (newDeck.length > 0))));

    return {
        newDeck,
        curOutRank,
        nextAttackerId,
        nextDefenderId,
        remaining,
        prikupDecks: newPrikupDecks
    };
};

export const finishBoutState = (state: GameState, action: 'pass' | 'take'): GameState => {
    const newPlayers = state.players.map(p => ({ ...p, hand: [...p.hand] }));
    const defender = newPlayers.find(p => p.id === state.defenderId);
    const tableCards = state.table.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
    const handSize = getInitialHandSize(state.deckMode, state.playerCount);

    const isEternalCard = (c: Card) => Boolean(
        !isCompletelyDestroyedCard(c) && (
            c.isChillTouch || 
            c.isFingerOfDeath || 
            c.isPowerWordKill || 
            c.isAnnihilation || 
            c.isSpell || 
            c.isKnowledge || 
            c.isRage || 
            c.isIllusion || 
            c.isGold || 
            c.isSilver || 
            c.isSkeleton || 
            c.isZombie || 
            c.isGhost || 
            c.isDeathCard || 
            c.isGambler ||
            c.isGolem ||
            c.isAutomaton ||
            c.isAnimatronic ||
            c.isEternalCard ||
            c.isTrap ||
            c.isIllusionCopySpell ||
            c.isImmortalitySpell ||
            c.isEndTurnSpell ||
            c.isSummonGhostSpell ||
            c.isSummonSkeletonsSpell ||
            c.isSummonZombiesSpell ||
            c.isSummonGolemSpell ||
            c.isSummonAnimatronicSpell ||
            c.isSummonAutomatonSpell ||
            c.isWolfSpirit ||
            c.isBearSpirit ||
            c.isWarriorSpirit ||
            c.isHealthElixir ||
            c.isTreasure ||
            c.isTycoon ||
            c.isWall ||
            c.isTower ||
            c.isBastion ||
            c.isCastle ||
            c.isShield ||
            c.isMassDeath ||
            c.isDeathRay ||
            c.isMindHeist ||
            c.isConversion ||
            c.isHolyCathedral ||
            c.isNorthernWind ||
            c.isDrakkar ||
            c.isViking ||
            c.isHorde ||
            c.isHordeCard ||
            c.isUndeadLord ||
            c.isZombiePlague ||
            c.isTurnToSkeletons ||
            c.isPirateRaid ||
            c.isPirate ||
            c.isPirateShip ||
            c.isPirateCrew ||
            c.isRobber ||
            c.isBurglar ||
            c.isVampire
        )
    );

    let newDiscard = [...state.discardPile].filter(c => !isCompletelyDestroyedCard(c));
    let newEternalDiscard = [...(state.eternalDiscardPile || [])].filter(c => !isCompletelyDestroyedCard(c));
    let newHeroDiscard = [...(state.heroDiscardPile || [])].filter(c => !isCompletelyDestroyedCard(c));

    // Check immortality spell for players (returns cards on table to hand on 'pass')
    if (action === 'pass') {
        newPlayers.forEach(p => {
            if (p.immortalityTurns && p.immortalityTurns > 0) {
                state.table.forEach(pair => {
                    if (pair.attackerId === p.id && !isEternalCard(pair.attack)) {
                        p.hand.push(pair.attack);
                    }
                    if (pair.defense && state.defenderId === p.id && !isEternalCard(pair.defense)) {
                        p.hand.push(pair.defense);
                    }
                });
            }
        });
    }

    // Decrement immortality & strength boost turns counter
    newPlayers.forEach(p => {
        if (p.immortalityTurns && p.immortalityTurns > 0) {
            p.immortalityTurns -= 1;
        }
        if (p.strengthBoostTurns && p.strengthBoostTurns > 0) {
            p.strengthBoostTurns -= 1;
            if (p.strengthBoostTurns <= 0) {
                p.strengthBoost = 0;
            }
        }
    });

    let damageAppliedMsg = "";
    let totalBoutHeroShards = 0;
    const boutDestroyedHeroIds: string[] = [];
    const boutHeroLogs: string[] = [];
    const boutHeroUpdates: Record<string, { level: number; experience: number; maxXp: number; condition: number; destroyed?: boolean }> = {
        ...(state.heroCardUpdates || {})
    };

    if (action === 'take' && defender) {
        // Eternal cards NEVER go to defender's hand - they always go to eternal discard!
        // Hero cards NEVER go to defender's hand - they always go to special hero discard (unless destroyed)!
        const cardsToTake: Card[] = [];
        const eternalCards: Card[] = [];

        state.table.forEach(pair => {
            const { attack, defense } = pair;

            // Attack card processing:
            if (attack.isCustomHeroCard) {
                // If defense is present, this attack card was BEATEN!
                // If no defense, this attack card was UNBLOCKED (+10 XP)!
                const reason = defense ? 'was_beaten' : 'unblocked_attack';
                const res = processHeroCardBoutEvent(attack, reason);
                boutHeroLogs.push(res.logText);

                const heroKey = attack.heroCardId || String(attack.id);
                boutHeroUpdates[heroKey] = {
                    level: res.updatedCard.heroLevel ?? 0,
                    experience: res.updatedCard.heroXp ?? 0,
                    maxXp: res.updatedCard.heroMaxXp ?? 20,
                    condition: res.updatedCard.heroCondition ?? 10,
                    destroyed: res.destroyed
                };

                if (res.destroyed) {
                    totalBoutHeroShards += res.shardsGained;
                    boutDestroyedHeroIds.push(heroKey);
                } else {
                    newHeroDiscard.push(res.updatedCard);
                }
            } else if (isEternalCard(attack)) {
                eternalCards.push(attack);
            } else {
                cardsToTake.push(attack);
            }

            // Defense card processing (if present):
            if (defense) {
                if (defense.isCustomHeroCard) {
                    // Defense card beat the attack card (+2 XP)
                    const res = processHeroCardBoutEvent(defense, 'beat_card');
                    boutHeroLogs.push(res.logText);

                    const heroKey = defense.heroCardId || String(defense.id);
                    boutHeroUpdates[heroKey] = {
                        level: res.updatedCard.heroLevel ?? 0,
                        experience: res.updatedCard.heroXp ?? 0,
                        maxXp: res.updatedCard.heroMaxXp ?? 20,
                        condition: res.updatedCard.heroCondition ?? 10,
                        destroyed: res.destroyed
                    };

                    if (res.destroyed) {
                        totalBoutHeroShards += res.shardsGained;
                        boutDestroyedHeroIds.push(heroKey);
                    } else {
                        newHeroDiscard.push(res.updatedCard);
                    }
                } else if (isEternalCard(defense)) {
                    eternalCards.push(defense);
                } else {
                    cardsToTake.push(defense);
                }
            }
        });

        defender.hand.push(...cardsToTake);
        newEternalDiscard.push(...eternalCards);

        // Calculate damage with Armor reduction rule
        const unbeatenCards = state.table.filter(pair => !pair.defense).map(pair => pair.attack);
        const totalDamage = unbeatenCards.reduce((sum, c) => sum + c.value, 0);
        const oldHealth = defender.health ?? 500;
        const oldArmor = defender.armor ?? 200;

        let hpDamage = totalDamage;
        let armorDamage = 0;

        if (oldArmor > 0 && totalDamage > 0) {
            armorDamage = Math.floor(totalDamage / 2);
            hpDamage = totalDamage - armorDamage;
            if (oldArmor < armorDamage) {
                hpDamage += (armorDamage - oldArmor);
                armorDamage = oldArmor;
            }
            defender.armor = Math.max(0, oldArmor - armorDamage);
        }
        defender.health = Math.max(0, oldHealth - hpDamage);
        
        damageAppliedMsg = ` 🩸 ${defender.name} отримав -${hpDamage} HP та -${armorDamage} Захисту (${defender.health}/500 HP, ${defender.armor} Захисту)!`;

        if (defender.health <= 0) {
            defender.isEliminated = true;
            newEternalDiscard.push(...defender.hand);
            defender.hand = [];
            damageAppliedMsg += ` 💀 ${defender.name} вибув з гри (програв)!`;
        }
    } else {
        // Pass / Bito logic:
        let returningToDeck: Card[] = [];

        state.table.forEach(pair => {
            const { attack, defense } = pair;
            
            // Vampire logic:
            if (attack.isVampire && defense) {
                const vampirizedCard: Card = {
                    ...defense,
                    id: Math.floor(Date.now() + Math.random() * 1000000),
                    rank: 'VMP (Вампір)' as any,
                    value: 11,
                    isVampire: true,
                    isEternalCard: true
                };
                newEternalDiscard.push(vampirizedCard);
                newEternalDiscard.push(attack);
                return;
            }

            if (defense && defense.isVampire) {
                const vampirizedCard: Card = {
                    ...attack,
                    id: Math.floor(Date.now() + Math.random() * 1000000),
                    suit: '🦇' as any,
                    rank: 'VMP (Вампір)' as any,
                    value: 11,
                    isVampire: true
                };
                newDiscard.push(vampirizedCard);
                newEternalDiscard.push(defense);
                return;
            }

            const isBeatenByLethal = Boolean(defense && (
                defense.isDeathCard || 
                defense.isGambler || 
                defense.isChillTouch || 
                defense.isFingerOfDeath || 
                defense.isPowerWordKill || 
                defense.isAnnihilation ||
                defense.isTrap ||
                defense.isExecutioner ||
                defense.isAssassin
            ));

            // Attack card processing in pass:
            if (attack.isCustomHeroCard) {
                // In pass/bito, the attack card was beaten by defense (+3 XP, -1 condition)
                const res = processHeroCardBoutEvent(attack, 'was_beaten');
                boutHeroLogs.push(res.logText);

                const heroKey = attack.heroCardId || String(attack.id);
                boutHeroUpdates[heroKey] = {
                    level: res.updatedCard.heroLevel ?? 0,
                    experience: res.updatedCard.heroXp ?? 0,
                    maxXp: res.updatedCard.heroMaxXp ?? 20,
                    condition: res.updatedCard.heroCondition ?? 10,
                    destroyed: res.destroyed
                };

                if (res.destroyed) {
                    totalBoutHeroShards += res.shardsGained;
                    boutDestroyedHeroIds.push(heroKey);
                } else {
                    newHeroDiscard.push(res.updatedCard);
                }
            } else if (isBeatenByLethal || attack.isArcher || attack.isCrossbowman || isEternalCard(attack)) {
                newEternalDiscard.push(attack);
            } else {
                newDiscard.push(attack);
            }

            // Defense card processing in pass:
            if (defense) {
                if (defense.isCustomHeroCard) {
                    // Defense card beat the attack card (+2 XP)
                    const res = processHeroCardBoutEvent(defense, 'beat_card');
                    boutHeroLogs.push(res.logText);

                    const heroKey = defense.heroCardId || String(defense.id);
                    boutHeroUpdates[heroKey] = {
                        level: res.updatedCard.heroLevel ?? 0,
                        experience: res.updatedCard.heroXp ?? 0,
                        maxXp: res.updatedCard.heroMaxXp ?? 20,
                        condition: res.updatedCard.heroCondition ?? 10,
                        destroyed: res.destroyed
                    };

                    if (res.destroyed) {
                        totalBoutHeroShards += res.shardsGained;
                        boutDestroyedHeroIds.push(heroKey);
                    } else {
                        newHeroDiscard.push(res.updatedCard);
                    }
                } else if (defense.isArcher || defense.isCrossbowman) {
                    returningToDeck.push(defense);
                } else if (isEternalCard(defense)) {
                    newEternalDiscard.push(defense);
                } else {
                    newDiscard.push(defense);
                }
            }
        });

        if (returningToDeck.length > 0) {
            state.deck = [...state.deck, ...returningToDeck];
        }
    }

    // Draw cards in turn order starting from main attacker
    let newDeck = [...state.deck];
    let startDrawIndex = newPlayers.findIndex(p => p.id === state.attackerId);
    if (startDrawIndex === -1) startDrawIndex = 0;
    let drawIndex = startDrawIndex;
    let count = 0;

    const newPrikupDecks = state.prikupDecks ? { ...state.prikupDecks } : undefined;

    while (count < newPlayers.length) {
        const playerToDraw = newPlayers[drawIndex];
        if (playerToDraw && !playerToDraw.outRank && !playerToDraw.isEliminated) {
            if (newPrikupDecks && newPrikupDecks[playerToDraw.id]) {
                const pDeck = newPrikupDecks[playerToDraw.id];
                while (playerToDraw.hand.length < handSize && pDeck.length > 0) {
                    playerToDraw.hand.push(pDeck.shift()!);
                }
            } else {
                while (playerToDraw.hand.length < handSize && newDeck.length > 0) {
                    playerToDraw.hand.push(newDeck.shift()!);
                }
            }
        }
        drawIndex = (drawIndex + 1) % newPlayers.length;
        count++;
    }

    if (newPrikupDecks && newPrikupDecks[0]) {
        newDeck = newPrikupDecks[0]; // keeps state.deck in sync with player 0 prikup
    }

    // Update out Ranks for players who finished
    let curOutRank = state.nextOutRank;
    newPlayers.forEach(p => {
        const hasCardsToDraw = newPrikupDecks ? ((newPrikupDecks[p.id]?.length || 0) > 0) : (newDeck.length > 0);
        if (!p.outRank && !p.isEliminated && p.hand.length === 0 && !hasCardsToDraw) {
            p.outRank = curOutRank++;
        }
    });

    // Determine next Attacker and Defender
    let nextAttackerId: number;
    let nextExtraTurnPlayerId = state.extraTurnPlayerId ?? null;
    let nextExtraTurnCount = state.extraTurnCount ?? 0;

    if (nextExtraTurnPlayerId !== null && nextExtraTurnCount > 0) {
        const extraPlayerObj = newPlayers.find(p => p.id === nextExtraTurnPlayerId);
        const hasExtraDraw = newPrikupDecks ? ((newPrikupDecks[nextExtraTurnPlayerId]?.length || 0) > 0) : (newDeck.length > 0);
        if (extraPlayerObj && !extraPlayerObj.outRank && !extraPlayerObj.isEliminated && (extraPlayerObj.hand.length > 0 || hasExtraDraw)) {
            nextAttackerId = nextExtraTurnPlayerId;
            nextExtraTurnCount--;
            if (nextExtraTurnCount <= 0) {
                nextExtraTurnPlayerId = null;
            }
        } else {
            nextExtraTurnPlayerId = null;
            nextExtraTurnCount = 0;
            if (action === 'pass') {
                const defenderObj = newPlayers.find(p => p.id === state.defenderId);
                const hasDefDraw = newPrikupDecks ? ((newPrikupDecks[state.defenderId]?.length || 0) > 0) : (newDeck.length > 0);
                if (defenderObj && !defenderObj.outRank && !defenderObj.isEliminated && (defenderObj.hand.length > 0 || hasDefDraw)) {
                    nextAttackerId = state.defenderId;
                } else {
                    nextAttackerId = getNextActivePlayerIndex(newPlayers, state.defenderId, newDeck.length, newPrikupDecks);
                }
            } else {
                nextAttackerId = getNextActivePlayerIndex(newPlayers, state.defenderId, newDeck.length, newPrikupDecks);
            }
        }
    } else if (action === 'pass') {
        const defenderObj = newPlayers.find(p => p.id === state.defenderId);
        const hasDefDraw = newPrikupDecks ? ((newPrikupDecks[state.defenderId]?.length || 0) > 0) : (newDeck.length > 0);
        if (defenderObj && !defenderObj.outRank && !defenderObj.isEliminated && (defenderObj.hand.length > 0 || hasDefDraw)) {
            nextAttackerId = state.defenderId;
        } else {
            nextAttackerId = getNextActivePlayerIndex(newPlayers, state.defenderId, newDeck.length, newPrikupDecks);
        }
    } else {
        nextAttackerId = getNextActivePlayerIndex(newPlayers, state.defenderId, newDeck.length, newPrikupDecks);
    }

    let nextDefenderId = getNextActivePlayerIndex(newPlayers, nextAttackerId, newDeck.length, newPrikupDecks);

    const currentTurnNumber = state.turnNumber || 1;
    const nextTurnNumber = currentTurnNumber + 1;

    // Hand overload penalty check: >22 cards in hand triggers damage = ((x + y)^2) / (2 * y)
    // x = excess cards above 22, y = player turn number (nextTurnNumber)
    const overloadLogs: string[] = [];
    newPlayers.forEach(p => {
        if (!p.isEliminated && p.hand.length > 22) {
            const x = p.hand.length - 22;
            const y = nextTurnNumber;
            const overloadDamage = Math.max(1, Math.floor(Math.pow(x + y, 2) / (2 * y)));

            const oldHealth = p.health ?? 500;
            const oldArmor = p.armor ?? 200;

            let hpDamage = overloadDamage;
            let armorDamage = 0;

            if (oldArmor > 0 && overloadDamage > 0) {
                armorDamage = Math.floor(overloadDamage / 2);
                hpDamage = overloadDamage - armorDamage;
                if (oldArmor < armorDamage) {
                    hpDamage += (armorDamage - oldArmor);
                    armorDamage = oldArmor;
                }
                p.armor = Math.max(0, oldArmor - armorDamage);
            }
            p.health = Math.max(0, oldHealth - hpDamage);

            overloadLogs.push(`💥 ${p.name}: Перевантаження руки! (${p.hand.length} карт у руці > 22). x=${x} лишніх карт, y=${y} хід. Шкода: -${overloadDamage} (((${x}+${y})²)/(2×${y}) = -${hpDamage} HP, -${armorDamage} Захисту). Залишилось: ${p.health}/500 HP.`);

            if (p.health <= 0) {
                p.isEliminated = true;
                if (p.hand.length > 0) {
                    newEternalDiscard.push(...p.hand);
                    p.hand = [];
                }
            }
        }
    });

    // Eliminate players with HP <= 0 OR no cards remaining (0 hand & 0 prikup)
    newPlayers.forEach(p => {
        const pPrikup = newPrikupDecks ? (newPrikupDecks[p.id] || []) : newDeck;
        const hasCards = p.hand.length > 0 || pPrikup.length > 0;
        const hasHp = (p.health ?? 500) > 0;

        if (!hasCards || !hasHp) {
            if (!p.isEliminated) {
                p.isEliminated = true;
                if (p.hand.length > 0) {
                    newEternalDiscard.push(...p.hand);
                    p.hand = [];
                }
            }
        }
    });

    // Check remaining active players with HP > 0 and cards
    const activeSurvivors = newPlayers.filter(p => !p.isEliminated && (p.health ?? 500) > 0);

    let isGameOver = false;
    let foolId: number | null = null;
    let isDraw = false;

    if (nextTurnNumber >= 140) {
        // Turn 140 reached! Winner is whoever has HP > 0 and cards
        isGameOver = true;
        if (activeSurvivors.length === 0) {
            isDraw = true;
        } else if (activeSurvivors.length === 1) {
            const winner = activeSurvivors[0];
            const loser = newPlayers.find(p => p.id !== winner.id);
            foolId = loser ? loser.id : null;
        } else {
            // Sort by HP descending, then by remaining cards
            activeSurvivors.sort((a, b) => {
                if ((b.health ?? 0) !== (a.health ?? 0)) return (b.health ?? 0) - (a.health ?? 0);
                const aPrikup = newPrikupDecks ? (newPrikupDecks[a.id]?.length || 0) : newDeck.length;
                const bPrikup = newPrikupDecks ? (newPrikupDecks[b.id]?.length || 0) : newDeck.length;
                return (b.hand.length + bPrikup) - (a.hand.length + aPrikup);
            });
            const winner = activeSurvivors[0];
            const loser = newPlayers.find(p => p.id !== winner.id);
            foolId = loser ? loser.id : null;
        }
    } else if (activeSurvivors.length <= 1) {
        isGameOver = true;
        if (activeSurvivors.length === 1) {
            const winner = activeSurvivors[0];
            const loser = newPlayers.find(p => p.id !== winner.id);
            foolId = loser ? loser.id : null;
        } else {
            isDraw = true;
        }
    } else {
        // Ensure nextAttackerId and nextDefenderId are active, living, and not eliminated.
        // If the chosen nextAttackerId has been eliminated, find the next active player.
        let attackerObj = newPlayers.find(p => p.id === nextAttackerId);
        if (!attackerObj || attackerObj.isEliminated || (attackerObj.health ?? 0) <= 0 || attackerObj.outRank) {
            nextAttackerId = getNextActivePlayerIndex(newPlayers, nextAttackerId, newDeck.length, newPrikupDecks);
        }

        // Always re-calculate defender relative to the verified nextAttackerId
        nextDefenderId = getNextActivePlayerIndex(newPlayers, nextAttackerId, newDeck.length, newPrikupDecks);

        const canAnyPlayerAttack = activeSurvivors.some(p => 
            p.hand.some(c => canAttackWithCard(c, [], false, false, state.actualTrumpSuits, SENIOR_SUIT))
        );

        const hasRemainingDraws = newPrikupDecks 
            ? Object.values(newPrikupDecks).some(d => d.length > 0)
            : newDeck.length > 0;

        if (!canAnyPlayerAttack && !hasRemainingDraws) {
            isGameOver = true;
            foolId = null;
            isDraw = true;
        } else {
            const curAttackerObj = newPlayers.find(p => p.id === nextAttackerId);
            const curAttackerCanAttack = curAttackerObj && curAttackerObj.hand.some(c => 
                canAttackWithCard(c, [], false, false, state.actualTrumpSuits, SENIOR_SUIT)
            );

            if (!curAttackerCanAttack && !hasRemainingDraws) {
                const nextCapableAttacker = newPlayers.find(p => !p.outRank && !p.isEliminated && p.hand.some(c => 
                    canAttackWithCard(c, [], false, false, state.actualTrumpSuits, SENIOR_SUIT)
                ));
                if (nextCapableAttacker) {
                    nextAttackerId = nextCapableAttacker.id;
                    // Re-calculate defender for the updated capable attacker
                    nextDefenderId = getNextActivePlayerIndex(newPlayers, nextAttackerId, newDeck.length, newPrikupDecks);
                }
            }
        }
    }

    newDiscard = newDiscard.filter(c => !isCompletelyDestroyedCard(c));
    newEternalDiscard = newEternalDiscard.filter(c => !isCompletelyDestroyedCard(c));
    newHeroDiscard = newHeroDiscard.filter(c => !isCompletelyDestroyedCard(c));

    let finalState: GameState = {
        ...state,
        players: newPlayers,
        deck: newDeck,
        discardPile: newDiscard,
        eternalDiscardPile: newEternalDiscard,
        heroDiscardPile: newHeroDiscard,
        heroShardsGained: (state.heroShardsGained || 0) + totalBoutHeroShards,
        destroyedHeroCardIds: [
            ...(state.destroyedHeroCardIds || []),
            ...boutDestroyedHeroIds
        ],
        heroCardUpdates: boutHeroUpdates,
        attackerId: nextAttackerId,
        defenderId: nextDefenderId,
        turnPlayerId: nextAttackerId,
        table: [],
        passedPlayers: [],
        isTaking: false,
        isLockedByGrandmaster: false,
        isPaladinDefenseLocked: false,
        nextOutRank: curOutRank,
        turnNumber: nextTurnNumber,
        gameOver: isGameOver,
        foolPlayerId: foolId,
        isDraw,
        statusBanner: boutDestroyedHeroIds.length > 0 
            ? `💔 ${boutDestroyedHeroIds.length} геройська карта втратила стан і розвалилася на частини (+${totalBoutHeroShards} уламки карт 🧩)!`
            : (isDraw 
                ? '🤝 Нічия! Жоден гравець не може зробити хід.' 
                : (nextTurnNumber >= 140 
                    ? '⏳ Досягнуто 140-й хід! Переможця визначено за ХП та картами.'
                    : (damageAppliedMsg ? `📥 Забрано карти!${damageAppliedMsg}` : state.statusBanner))),
        extraTurnPlayerId: nextExtraTurnPlayerId,
        extraTurnCount: nextExtraTurnCount,
        prikupDecks: newPrikupDecks
    };

    boutHeroLogs.forEach(msg => {
        finalState = addLog(finalState, msg, 'spell');
    });

    if (action === 'take' && defender) {
        const unbeatenCards = state.table.filter(pair => !pair.defense).map(pair => pair.attack);
        const damage = unbeatenCards.reduce((sum, c) => sum + c.value, 0);
        finalState = addLog(finalState, `📥 ${defender.name} забирає карти зі столу. Шкода: -${damage} HP (${defender.health}/500 HP залишилось).`, 'damage');
        if (defender.isEliminated) {
            finalState = addLog(finalState, `💀 Гравця ${defender.name} еліміновано! Здоров'я впало до 0 HP.`, 'elimination');
        }
    } else {
        finalState = addLog(finalState, `🧹 Бито! Раунд успішно відбито та завершено. Карти йдуть у відбій.`, 'pass');
    }

    overloadLogs.forEach(msg => {
        finalState = addLog(finalState, msg, 'damage');
    });

    newPlayers.forEach(p => {
        const oldP = state.players.find(x => x.id === p.id);
        if (p.outRank && (!oldP || !oldP.outRank)) {
            finalState = addLog(finalState, `🏆 ${p.name} успішно позбувся всіх карт і посів ${p.outRank} місце!`, 'system');
        }
    });

    if (isGameOver) {
        if (isDraw) {
            finalState = addLog(finalState, `🤝 Нічия! Не залишилося активних гравців для продовження.`, 'system');
        } else if (foolId !== null) {
            const foolPlayer = newPlayers.find(p => p.id === foolId);
            finalState = addLog(finalState, `💀 Гра завершена! ${foolPlayer ? foolPlayer.name : 'Гравець'} залишився з картами й зазнав поразки!`, 'system');
        }
    }

    return finalState;
};

export const passTurnState = (state: GameState, passingPlayerId: number): GameState => {
    const nextPassed = Array.from(new Set([...state.passedPlayers, passingPlayerId]));
    const passingPlayer = state.players.find(p => p.id === passingPlayerId);
    const passingPlayerName = passingPlayer ? passingPlayer.name : 'Гравець';

    if (state.table.length === 0) {
        const activePlayers = state.players.filter(p => !p.outRank && !p.isEliminated && p.hand.length > 0);
        
        let passingIndex = state.players.findIndex(p => p.id === passingPlayerId);
        if (passingIndex === -1) passingIndex = 0;
        let nextIndex = (passingIndex + 1) % state.players.length;
        for (let i = 0; i < state.players.length; i++) {
            const p = state.players[nextIndex];
            if (!p.outRank && !p.isEliminated && p.hand.length > 0 && !nextPassed.includes(p.id)) {
                const canAttack = p.hand.some(c => canAttackWithCard(c, [], false, false, state.actualTrumpSuits, SENIOR_SUIT));
                if (canAttack) {
                    const nextDefId = getNextActivePlayerIndex(state.players, p.id, state.deck.length);
                    const resState = {
                        ...state,
                        passedPlayers: nextPassed,
                        attackerId: p.id,
                        defenderId: nextDefId,
                        turnPlayerId: p.id,
                        statusBanner: `⏭️ ${passingPlayerName} не може походити, хід переходить до ${p.name}.`
                    };
                    return addLog(resState, `⏭️ ${passingPlayerName} спасував (немає підходящих карт). Хід перейшов до ${p.name}.`, 'pass');
                }
            }
            nextIndex = (nextIndex + 1) % state.players.length;
        }

        const anyPlayerCanAttack = activePlayers.some(p => 
            p.hand.some(c => canAttackWithCard(c, [], false, false, state.actualTrumpSuits, SENIOR_SUIT))
        );

        if (!anyPlayerCanAttack) {
            const resState = {
                ...state,
                gameOver: true,
                foolPlayerId: null,
                isDraw: true,
                passedPlayers: nextPassed,
                statusBanner: '🤝 Нічия! Жоден гравець не може зробити хід.'
            };
            return addLog(resState, `🤝 Нічия! Жоден активний гравець не має можливих ходів.`, 'system');
        }
    }

    const defender = state.players.find(p => p.id === state.defenderId);
    const initialDefenderHand = defender ? defender.hand.length + state.table.filter(p => p.defense).length : 6;
    const maxAttacks = Math.min(6, initialDefenderHand);

    const attackersList = state.players.filter(p => p.id !== state.defenderId && !p.outRank && !p.isEliminated && p.hand.length > 0);
    const allPassed = attackersList.every(p => nextPassed.includes(p.id));

    if (allPassed || state.table.length >= maxAttacks || attackersList.length === 0 || state.isLockedByGrandmaster) {
        return finishBoutState({ ...state, passedPlayers: nextPassed }, state.isTaking ? 'take' : 'pass');
    }

    let passingIndex = state.players.findIndex(p => p.id === passingPlayerId);
    if (passingIndex === -1) passingIndex = 0;
    let nextIndex = (passingIndex + 1) % state.players.length;
    let foundTurnId = state.turnPlayerId;
    
    for (let i = 0; i < state.players.length; i++) {
        const p = state.players[nextIndex];
        if (p.id !== state.defenderId && !p.outRank && !p.isEliminated && p.hand.length > 0 && !nextPassed.includes(p.id)) {
            foundTurnId = p.id;
            break;
        }
        nextIndex = (nextIndex + 1) % state.players.length;
    }

    if (foundTurnId === state.turnPlayerId) {
        return finishBoutState({ ...state, passedPlayers: nextPassed }, state.isTaking ? 'take' : 'pass');
    }

    const resState = {
        ...state,
        passedPlayers: nextPassed,
        turnPlayerId: foundTurnId
    };
    return addLog(resState, `👉 ${passingPlayerName} спасував. Хід перейшов до ${state.players.find(pl => pl.id === foundTurnId)?.name || 'іншого гравця'}.`, 'pass');
};

export const playCardState = (state: GameState, card: Card, playerId: number, targetCardId?: number): GameState => {
    const player = state.players.find(p => p.id === playerId);
    const playerName = player?.name || 'Гравець';

    // Validate if spell requires cards in eternal discard
    const requiredEternal = getRequiredEternalDiscardCount(card);
    const eternalCount = state.eternalDiscardPile?.length || 0;
    if (requiredEternal > 0 && eternalCount < requiredEternal) {
        const errorState: GameState = {
            ...state,
            statusBanner: `❌ Недостатньо карт у вічному відбої! Потрібно ${requiredEternal}, а є лише ${eternalCount}.`
        };
        return addLog(errorState, `❌ ${playerName} не зміг застосувати "${card.rank}": потрібно ${requiredEternal} карт у вічному відбої (є лише ${eternalCount}).`, 'system');
    }

    // 1. Weak Strength Boost Spell: +1 to next card played (lasts 1 turn)
    if (card.isWeakStrengthBoostSpell) {
        const updatedPlayers = state.players.map(p => p.id === playerId ? { 
            ...p, 
            hand: p.hand.filter(c => c.id !== card.id),
            strengthBoost: (p.strengthBoost || 0) + 1,
            strengthBoostTurns: 1 
        } : p);
        const newEternal = [...(state.eternalDiscardPile || []), card];
        const resState: GameState = {
            ...state,
            players: updatedPlayers,
            eternalDiscardPile: newEternal,
            statusBanner: `🗡️ Слабке підняття сили! Будь-яка наступна карта ${playerName} битиме з силою +1 (триває 1 хід)!`
        };
        return addLog(resState, `🗡️ ${playerName} застосував закляття [Слабке підняття сили]: наступна карта битиме з силою +1 (триває 1 хід)!`, 'spell');
    }

    // 2. Strength Boost Spell: +3 to next card played (lasts 1 turn)
    if (card.isStrengthBoostSpell) {
        const updatedPlayers = state.players.map(p => p.id === playerId ? { 
            ...p, 
            hand: p.hand.filter(c => c.id !== card.id),
            strengthBoost: (p.strengthBoost || 0) + 3,
            strengthBoostTurns: 1 
        } : p);
        const newEternal = [...(state.eternalDiscardPile || []), card];
        const resState: GameState = {
            ...state,
            players: updatedPlayers,
            eternalDiscardPile: newEternal,
            statusBanner: `⚔️ Підняття сили! Будь-яка наступна карта ${playerName} битиме з силою +3 (триває 1 хід)!`
        };
        return addLog(resState, `⚔️ ${playerName} застосував закляття [Підняття сили]: наступна карта битиме з силою +3 (триває 1 хід)!`, 'spell');
    }

    // 3. Strong Strength Boost Spell: +10 to next card played (lasts 1 turn)
    if (card.isStrongStrengthBoostSpell) {
        const updatedPlayers = state.players.map(p => p.id === playerId ? { 
            ...p, 
            hand: p.hand.filter(c => c.id !== card.id),
            strengthBoost: (p.strengthBoost || 0) + 10,
            strengthBoostTurns: 1 
        } : p);
        const newEternal = [...(state.eternalDiscardPile || []), card];
        const resState: GameState = {
            ...state,
            players: updatedPlayers,
            eternalDiscardPile: newEternal,
            statusBanner: `💥 Сильне підняття сили! Будь-яка наступна карта ${playerName} битиме з силою +10 (триває 1 хід)!`
        };
        return addLog(resState, `💥 ${playerName} застосував закляття [Сильне підняття сили]: наступна карта битиме з силою +10 (триває 1 хід)!`, 'spell');
    }

    // If player has an active strength boost, apply it to this card being played and consume the buff!
    if (player && player.strengthBoost && player.strengthBoost > 0 && !isInstantSpellCard(card)) {
        const boost = player.strengthBoost;
        card = {
            ...card,
            strengthBonus: (card.strengthBonus || 0) + boost
        };
        state = {
            ...state,
            players: state.players.map(p => p.id === playerId ? {
                ...p,
                strengthBoost: 0,
                strengthBoostTurns: 0
            } : p)
        };
    }

    let bonusCardsToAdd: Card[] = [];
    let powerPointsDelta = 0;
    let healthDelta = 0;
    let armorDelta = 0;
    let statusMsg: string | null = null;
    let resurrectCard: Card | null = null;
    let empowerWeakestInHand = false;
    let necromancerGhostCard: Card | null = null;

    if (!card.isIllusion) {
        if (card.isCleric) {
            healthDelta += 10;
            if (state.discardPile.length > 0) {
                resurrectCard = state.discardPile[state.discardPile.length - 1];
            }
            statusMsg = `🕊️ Клірик! ${playerName} відновив 10 HP${resurrectCard ? ` та воскресив ${resurrectCard.rank}` : ''}!`;
        }
        if (card.isDoctor || card.isWitchDoctor) {
            healthDelta += 20;
            const title = card.isDoctor ? 'Лікар' : 'Знахар';
            statusMsg = `🩺 ${title}! ${playerName} відновив 20 HP!`;
        }
        if (card.isHealthElixir) {
            healthDelta += 28;
            statusMsg = `🧪 Еліксир здоров'я! ${playerName} відновив 28 HP!`;
        }
        if (card.isTreasure) {
            healthDelta += 20;
            armorDelta += 10;
            powerPointsDelta += 4;
            for (let i = 0; i < 5; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true });
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10 + i), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true });
            }
            statusMsg = `🗝️ Скарб! ${playerName} отримав 5 Золота, 5 Срібла, +4 очка сили, +10 Захисту та +20 HP!`;
        }
        if (card.isWall) {
            armorDelta += 40;
            statusMsg = `🧱 Стіна! ${playerName} отримав +40 Захисту!`;
        }
        if (card.isTower) {
            armorDelta += 20;
            statusMsg = `🏰 Вежа! ${playerName} отримав +20 Захисту!`;
        }
        if (card.isBastion) {
            armorDelta += 80;
            statusMsg = `🛡️ Бастіон! ${playerName} отримав +80 Захисту!`;
        }
        if (card.isCastle) {
            armorDelta += 100;
            statusMsg = `🏰 Замок! ${playerName} отримав +100 Захисту!`;
        }
        if (card.isShield) {
            armorDelta += 4;
            statusMsg = `🛡️ Щит! ${playerName} отримав +4 Захисту!`;
        }
        if (card.isDruid) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: card.suit, rank: 'WLF (Вовк)', value: 8, isWolf: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 2), suit: card.suit, rank: 'WLF (Вовк)', value: 8, isWolf: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 3), suit: card.suit, rank: 'BR_ANM (Ведмідь)', value: 9, isBear: true });
            statusMsg = `🌿 Друїд! ${playerName} закликав 2 Вовків та 1 Ведмедя!`;
        }
        if (card.isShaman) {
            healthDelta += 5;
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 101), suit: '🐺' as any, rank: 'WLF_SP (Дух вовка)', value: 8, isWolfSpirit: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 102), suit: '🐺' as any, rank: 'WLF_SP (Дух вовка)', value: 8, isWolfSpirit: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 103), suit: '🐻' as any, rank: 'BR_SP (Дух ведмедя)', value: 9, isBearSpirit: true });
            for (let i = 0; i < 3; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 200 + i), suit: '⚔️', rank: 'WR_SP (Дух воїна)', value: 10, isWarriorSpirit: true });
            }
            statusMsg = `🪶 Шаман! ${playerName} закликав 2 Духів Вовка, 1 Дух Ведмедя, 3 Духів Воїнів та відновив 5 HP!`;
        }
        if (card.isTycoon) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 301), suit: '🗝️', rank: 'TRSR (Скарб)', value: 11, isTreasure: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 302), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 303), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true });
            statusMsg = `🎩 Магнат! ${playerName} отримав 1 карту Скарбу та 2 карти Золота!`;
        }
        if (card.rank === 'N') {
            for (let i = 0; i < 2; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: card.suit, rank: 'J', value: getCardValue('J', state.deckMode) });
            }
            statusMsg = `🛡️ Лицар! ${playerName} закликав 2 Валетів своєї масті (${card.suit})!`;
        }
        if (card.rank === 'J') {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: card.suit, rank: '10', value: getCardValue('10', state.deckMode) });
            }
            statusMsg = `🗡️ Валет! ${playerName} закликав 4 карти '10' своєї масті (${card.suit})!`;
        }
        if (card.isMerchant) {
            powerPointsDelta += 3;
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 401), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 402), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true });
            statusMsg = `💰 Торговець! ${playerName} отримав 2 карти Золота та +3 очка сили!`;
        }
        if (card.isKnowledge) {
            powerPointsDelta += 1;
            statusMsg = `📖 Знання! ${playerName} отримав +1 очко сили!`;
        }
        if (card.isWarlock) {
            powerPointsDelta += 2;
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🔮', rank: 'SP (Закляття)', value: 10, isSpell: true });
            }
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 5), suit: '🔮', rank: 'SP (Анігіляція)', value: 13, isSpell: true, isAnnihilation: true });
            statusMsg = `🔮 Чаклун! ${playerName} отримав 4 Закляття, 1 закляття Анігіляція та +2 очка сили!`;
        }
        if (card.isMage) {
            powerPointsDelta += 3;
            for (let i = 0; i < 5; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🔮', rank: 'SP (Закляття)', value: 10, isSpell: true });
            }
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 6), suit: '🔮', rank: 'SP (Анігіляція)', value: 13, isSpell: true, isAnnihilation: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10), suit: '📜', rank: 'KN (Знання)', value: 70, isKnowledge: true });
            statusMsg = `🧙‍♂️ Маг! ${playerName} отримав 5 Заклять, 1 закляття Анігіляція, 1 Знання та +3 очка сили!`;
        }
        if (card.isNecromancer) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🔮', rank: 'SP (Чіл тач)', value: 5, isSpell: true, isChillTouch: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 2), suit: '🔮', rank: 'SP (Перст смерті)', value: 11, isSpell: true, isFingerOfDeath: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 3), suit: '🔮', rank: 'SP (Слово сили: Смерть)', value: 99, isSpell: true, isPowerWordKill: true });

            if (state.discardPile.length > 0) {
                const lastDiscarded = state.discardPile[state.discardPile.length - 1];
                necromancerGhostCard = {
                    ...lastDiscarded,
                    id: Math.floor(Date.now() + Math.random() * 1000000 + 4),
                    isGhost: true,
                    isEmpowered: true
                };
                bonusCardsToAdd.push(necromancerGhostCard);
            }
            statusMsg = `🧙‍♂️ Некромант! ${playerName} отримав закляття Чіл тач, Перст смерті, Слово сили: Смерть${necromancerGhostCard ? ' та підняв Привида з відбою' : ''}!`;
        }
        if (card.isWizard) {
            powerPointsDelta += 5;
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🔮', rank: 'SP (Закляття)', value: 10, isSpell: true });
            }
            statusMsg = `🧙‍♂️ Чарівник! ${playerName} отримав 4 Закляття, 2 карти з колоди та +5 очок сили!`;
        }
        if (card.isPrincess) {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: card.suit, rank: 'J', value: getCardValue('J') });
            }
            for (let i = 0; i < 2; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10 + i), suit: card.suit, rank: 'HR (Герой)', value: 99, isHero: true });
            }
            statusMsg = `👑 Принцеса! ${playerName} отримав 4 Лицарі своєї масті (${card.suit}) та 2 Героя!`;
        }
        if (card.isPrince) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: card.suit, rank: 'HR (Герой)', value: 99, isHero: true });
            for (let i = 0; i < 2; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10 + i), suit: card.suit, rank: 'J', value: getCardValue('J') });
            }
            for (let i = 0; i < 2; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 20 + i), suit: card.suit, rank: '10', value: getCardValue('10') });
            }
            statusMsg = `🤴 Принц! ${playerName} отримав 1 Героя, 2 Лицарів та дві '10' своєї масті (${card.suit})!`;
        }
        if (card.rank === 'K') {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: card.suit, rank: 'N', value: getCardValue('N', state.deckMode) });
            }
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10 + i), suit: card.suit, rank: 'J', value: getCardValue('J', state.deckMode) });
            }
            statusMsg = `👑 Король! ${playerName} закликав 4 Лицарів та 4 Валетів своєї масті (${card.suit})!`;
        }
        if (card.rank === 'Q') {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: card.suit, rank: 'N', value: getCardValue('N', state.deckMode) });
            }
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10 + i), suit: card.suit, rank: 'J', value: getCardValue('J', state.deckMode) });
            }
            statusMsg = `👑 Королева! ${playerName} закликала 4 Лицарів та 4 Валетів своєї масті (${card.suit})!`;
        }
        if (card.isKabbalist) {
            for (let i = 0; i < 3; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: card.suit, rank: 'GLM (Голем)', value: 4, isGolem: true, isEternalCard: true });
            }
            statusMsg = `📜 Каббаліст! ${playerName} закликав 3 Големів (сила 4)!`;
        }
        if (card.isInventor) {
            for (let i = 0; i < 3; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: card.suit, rank: 'AUT (Автоматон)', value: 5, isAutomaton: true, isEternalCard: true });
            }
            for (let i = 0; i < 2; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10 + i), suit: card.suit, rank: 'ANM (Аніматронік)', value: 3, isAnimatronic: true, isEternalCard: true });
            }
            statusMsg = `🔧 Винахідник! ${playerName} закликав 3 Автоматонів та 2 Аніматроніків!`;
        }
        if (card.isIllusionist) {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🌌', rank: 'ILL (Ілюзія)', value: 99, isIllusion: true });
            }
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10), suit: '✨', rank: 'SP (Ілюзорна копія)', value: 10, isIllusionCopySpell: true, isSpell: true });
            statusMsg = `🎭 Ілюзіоніст! ${playerName} отримав 4 карти Ілюзії та закляття Ілюзорна копія!`;
        }
        if (card.isIllusionCopySpell) {
            const playerObj = state.players.find(p => p.id === playerId);
            const sourceCard = playerObj?.hand.find(c => c.id !== card.id) || state.table[0]?.attack;
            if (sourceCard) {
                bonusCardsToAdd.push({
                    ...sourceCard,
                    id: Math.floor(Date.now() + Math.random() * 1000000 + 15),
                    isIllusion: true,
                });
                statusMsg = `✨ Ілюзорна копія! ${playerName} створив копію карти ${sourceCard.rank}!`;
            } else {
                statusMsg = `✨ Ілюзорна копія! Немає карт для копіювання.`;
            }
        }
        if (card.isImmortalitySpell) {
            const updatedPlayers = state.players.map(p => p.id === playerId ? { ...p, immortalityTurns: (p.immortalityTurns || 0) + 3 } : p);
            state = { ...state, players: updatedPlayers };
            statusMsg = `🛡️ Безсмертя! Карти ${playerName} на столі повертатимуться в руку при бито (3 ходи)!`;
        }
        if (card.isSummonGhostSpell) {
            const lastDiscard = state.discardPile[state.discardPile.length - 1];
            if (lastDiscard) {
                resurrectCard = { ...lastDiscard, isGhost: true };
                statusMsg = `👻 Виклик привида! ${playerName} закликав Привида (${lastDiscard.rank}) з відбою!`;
            } else {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000), suit: '👻' as any, rank: 'SP (Закляття)', value: 10, isGhost: true, isSpell: true });
                statusMsg = `👻 Виклик привида! ${playerName} закликав Привида!`;
            }
        }
        if (card.isSummonSkeletonsSpell) {
            for (let i = 0; i < 3; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '💀' as any, rank: 'SK (Скелет)', value: 3, isSkeleton: true });
            }
            let newDiscard = [...state.discardPile];
            let newEternal = [...(state.eternalDiscardPile || [])];
            const moved = newDiscard.splice(-3);
            newEternal.push(...moved);
            state = { ...state, discardPile: newDiscard, eternalDiscardPile: newEternal };
            statusMsg = `☠️ Виклик скелетів! ${playerName} перевів 3 карти з відбою у вічний відбій та отримав 3 Скелетів!`;
        }
        if (card.isSummonZombiesSpell) {
            for (let i = 0; i < 3; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🧟' as any, rank: 'ZB (Зомбі)', value: 4, isZombie: true });
            }
            let newDiscard = [...state.discardPile];
            let newEternal = [...(state.eternalDiscardPile || [])];
            const moved = newDiscard.splice(-3);
            newEternal.push(...moved);
            state = { ...state, discardPile: newDiscard, eternalDiscardPile: newEternal };
            statusMsg = `🧟 Виклик зомбі! ${playerName} перевів 3 карти з відбою у вічний відбій та отримав 3 Зомбі!`;
        }
        if (card.isSummonGolemSpell) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000), suit: '🗿' as any, rank: 'GLM (Голем)', value: 4, isGolem: true, isEternalCard: true });
            statusMsg = `🗿 Виклик голема! ${playerName} закликав Голема!`;
        }
        if (card.isSummonAnimatronicSpell) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000), suit: '🤖' as any, rank: 'ANM (Аніматронік)', value: 3, isAnimatronic: true, isEternalCard: true });
            statusMsg = `🤖 Виклик аніматроніка! ${playerName} закликав Аніматроніка!`;
        }
        if (card.isSummonAutomatonSpell) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000), suit: '⚙️' as any, rank: 'AUT (Автоматон)', value: 5, isAutomaton: true, isEternalCard: true });
            statusMsg = `⚙️ Виклик автоматона! ${playerName} закликав Автоматона!`;
        }
        if (card.isMassDeath) {
            let newEternal = [...(state.eternalDiscardPile || []), card];
            state.table.forEach(pair => {
                newEternal.push(pair.attack);
                if (pair.defense) newEternal.push(pair.defense);
            });
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, table: [], eternalDiscardPile: newEternal };
            statusMsg = `💀 Масова смерть! Усі карти зі столу відправлено у вічний відбій, хід завершено!`;
            return finishBoutState(state, 'pass');
        }
        if (card.isDeathRay) {
            if (state.table.length > 0) {
                const targetPair = state.table[state.table.length - 1];
                const clearedTable = state.table.filter((_, idx) => idx !== state.table.length - 1);
                let newEternal = [...(state.eternalDiscardPile || []), card, targetPair.attack];
                if (targetPair.defense) newEternal.push(targetPair.defense);
                const updatedPlayers = state.players.map(p => {
                    if (p.id === playerId) {
                        return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
                    }
                    return p;
                });
                state = { ...state, players: updatedPlayers, table: clearedTable, eternalDiscardPile: newEternal };
                statusMsg = `🔮 Промінь смерті! ${playerName} знищив карту на столі у вічний відбій!`;
            } else {
                const updatedPlayers = state.players.map(p => {
                    if (p.id === playerId) {
                        return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
                    }
                    return p;
                });
                state = { ...state, players: updatedPlayers, eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
                statusMsg = `🔮 Промінь смерті! Стіл порожній. Закляття пішло у вічний відбій.`;
            }
        }
        if (card.isMindHeist) {
            const tableCards = state.table.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
            let newEternal = [...(state.eternalDiscardPile || []), card];
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, hand: [...p.hand.filter(c => c.id !== card.id), ...tableCards] };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, table: [], eternalDiscardPile: newEternal };
            statusMsg = `👁️ Викрадення розуму! ${playerName} забрав карти зі столу у руку без пошкодження та завершив хід!`;
            return finishBoutState(state, 'pass');
        }
        if (card.isConversion) {
            const tableCards = state.table.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
            const convertedCards = tableCards.map((c, idx) => {
                if (idx === 0) {
                    return { ...c, isPriest: true, rank: 'PR (Священик)' as any, value: 8, suit: '✝️' as any };
                }
                return c;
            });
            let newEternal = [...(state.eternalDiscardPile || []), card];
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, hand: [...p.hand.filter(c => c.id !== card.id), ...convertedCards] };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, table: [], eternalDiscardPile: newEternal };
            statusMsg = `✨ Навернення до віри! ${playerName} забрав карти зі столу, навернувши одну в Священника, та завершив хід!`;
            return finishBoutState(state, 'pass');
        }
        if (card.isHolyCathedral) {
            bonusCardsToAdd.push(
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🕊️' as any, rank: 'CL (Клірик)', value: 6, isCleric: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 2), suit: '✝️' as any, rank: 'PR (Священик)', value: 8, isPriest: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 3), suit: '⛪' as any, rank: 'BP (Єпископ)', value: 12, isBishop: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 4), suit: '👑' as any, rank: 'AB (Архієпископ)', value: 15, isArchbishop: true }
            );
            statusMsg = `⛪ Святий собор! ${playerName} отримав Клірика, Священника, Єпископа та Архієпископа й завершив хід!`;
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, hand };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            return finishBoutState(state, 'pass');
        }
        if (card.isNorthernWind) {
            for (let i = 0; i < 3; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '⛵' as any, rank: 'DRK (Драккар)', value: 8, isDrakkar: true });
            }
            statusMsg = `❄️ Вітер з півночі! ${playerName} отримав 3 Драккари й завершив хід!`;
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, hand };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            return finishBoutState(state, 'pass');
        }
        if (card.isGold || card.isSilver) {
            const addRes = card.isGold ? 3 : 1;
            powerPointsDelta += addRes;
            statusMsg = card.isGold 
                ? `🪙 Золото! ${playerName} отримав +3 ресурсів, карта пішла у вічний відбій!`
                : `🥈 Срібло! ${playerName} отримав +1 ресурс, карта пішла у вічний відбій!`;
        }
        if (card.isGoldMine) {
            for (let i = 0; i < 5; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🪙' as any, rank: 'GL (Золото)' as any, value: 80, isGold: true });
            }
            statusMsg = `⛏️ Золота шахта! ${playerName} отримав 5 карт Золота, карта пішла у вічний відбій!`;
        }
        if (card.isSilverMine) {
            for (let i = 0; i < 5; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🥈' as any, rank: 'SL (Срібло)' as any, value: 75, isSilver: true });
            }
            statusMsg = `⛏️ Срібна шахта! ${playerName} отримав 5 карт Срібла, карта пішла у вічний відбій!`;
        }
        if (card.isMiners) {
            const minersRes = (Math.floor(Math.random() * 20) + 1) + (Math.floor(Math.random() * 20) + 1);
            powerPointsDelta += minersRes;
            let msgParts: string[] = [`+${minersRes} ресурсів (2d20)`];
            if (Math.random() < 0.40) {
                for (let i = 0; i < 4; i++) {
                    bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '⛏️' as any, rank: 'GLD_MN (Золота шахта)' as any, value: 80, isGoldMine: true });
                }
                msgParts.push('4 Золоті шахти');
            }
            if (Math.random() < 0.55) {
                for (let i = 0; i < 4; i++) {
                    bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10 + i), suit: '⛏️' as any, rank: 'SLV_MN (Срібна шахта)' as any, value: 75, isSilverMine: true });
                }
                msgParts.push('4 Срібні шахти');
            }
            statusMsg = `⛏️ Шахтарі! ${playerName} здобув: ${msgParts.join(', ')}, карта пішла у вічний відбій!`;
        }
        if (card.isTreasureHunter) {
            const hunterRes = Math.floor(Math.random() * 20) + 1;
            powerPointsDelta += hunterRes;
            let msgParts: string[] = [`+${hunterRes} ресурсів (1d20)`];
            if (Math.random() < 0.40) {
                for (let i = 0; i < 4; i++) {
                    bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🪙' as any, rank: 'GL (Золото)' as any, value: 80, isGold: true });
                }
                msgParts.push('4 Золота');
            }
            if (Math.random() < 0.55) {
                for (let i = 0; i < 4; i++) {
                    bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 10 + i), suit: '🥈' as any, rank: 'SL (Срібло)' as any, value: 75, isSilver: true });
                }
                msgParts.push('4 Срібла');
            }
            if (Math.random() < 0.60) {
                for (let i = 0; i < 4; i++) {
                    bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 20 + i), suit: '🗝️' as any, rank: 'TRSR (Скарб)' as any, value: 11, isTreasure: true });
                }
                msgParts.push('4 Скарби');
            }
            statusMsg = `🧭 Шукач скарбів! ${playerName} знайшов: ${msgParts.join(', ')}, карта пішла у вічний відбій!`;
        }
        if (card.isDrakkar) {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🪓' as any, rank: 'VK (Вікінг)', value: 6, isViking: true });
            }
            statusMsg = `⛵ Драккар! ${playerName} привів 4 вікінгів!`;
        }
        if (card.isViking) {
            bonusCardsToAdd.push(
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 2), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true }
            );
            statusMsg = `🪓 Вікінг! ${playerName} отримав 1 Золото та 1 Срібло!`;
        }
        if (card.isPirate) {
            bonusCardsToAdd.push(
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 2), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 3), suit: '🗝️', rank: 'TRSR (Скарб)', value: 11, isTreasure: true }
            );
            statusMsg = `🏴‍☠️ Пірат! ${playerName} отримав 1 Золото, 1 Срібло та 1 Скарб!`;
        }
        if (card.isRobber) {
            bonusCardsToAdd.push(
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 2), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 3), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 4), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true }
            );
            statusMsg = `🗡️ Розбійник! ${playerName} отримав 1 Золото та 3 Срібла!`;
        }
        if (card.isBurglar) {
            bonusCardsToAdd.push(
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 2), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 3), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 4), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 5), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 6), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true },
                { id: Math.floor(Date.now() + Math.random() * 1000000 + 7), suit: '🗝️', rank: 'TRSR (Скарб)', value: 11, isTreasure: true }
            );
            statusMsg = `💰 Грабіжник! ${playerName} отримав 2 Золота, 4 Срібла та 1 Скарб!`;
        }
        if (card.isHorde) {
            for (let i = 0; i < 3; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🐎' as any, rank: 'HRD (Орда)', value: 8, isHordeCard: true });
            }
            statusMsg = `🪓 Орда! ${playerName} зібрав 3 карти Орди й завершив хід!`;
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, hand };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            return finishBoutState(state, 'pass');
        }
        if (card.isHordeCard) {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🐎' as any, rank: 'HL (Ординець)', value: 10, isHordeling: true });
            }
            statusMsg = `🐎 Орда! ${playerName} викликав 4 ординців та відправив карту у відбій!`;
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, hand };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            return finishBoutState(state, 'pass');
        }
        if (card.isUndeadLord) {
            for (let i = 0; i < 2; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '👻' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonGhostSpell: true });
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i + 10), suit: '🧟' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonZombiesSpell: true });
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i + 20), suit: '☠️' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonSkeletonsSpell: true });
            }
            statusMsg = `👑 Повелитель нежиті! ${playerName} отримав закляття призову нежиті!`;
        }
        if (card.isZombiePlague) {
            const tableCards = state.table.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
            const zombies = tableCards.map((c, idx) => ({
                id: Math.floor(Date.now() + Math.random() * 1000000 + idx),
                suit: '🧟' as any,
                rank: 'ZB (Зомбі)' as any,
                value: 4,
                isZombie: true
            }));
            let newEternal = [...(state.eternalDiscardPile || []), card];
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, hand: [...p.hand.filter(c => c.id !== card.id), ...zombies] };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, table: [], eternalDiscardPile: newEternal };
            statusMsg = `🧟 Зомбі мор! ${playerName} перетворив стіл на зомбі та завершив хід!`;
            return finishBoutState(state, 'pass');
        }
        if (card.isTurnToSkeletons) {
            const tableCards = state.table.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
            const skeletons = tableCards.map((c, idx) => ({
                id: Math.floor(Date.now() + Math.random() * 1000000 + idx),
                suit: '💀' as any,
                rank: 'SK (Скелет)' as any,
                value: 3,
                isSkeleton: true
            }));
            let newEternal = [...(state.eternalDiscardPile || []), card];
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, hand: [...p.hand.filter(c => c.id !== card.id), ...skeletons] };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, table: [], eternalDiscardPile: newEternal };
            statusMsg = `☠️ Перетворити у скелетів! ${playerName} перетворив стіл на скелетів та завершив хід!`;
            return finishBoutState(state, 'pass');
        }
        if (card.isPirateRaid) {
            for (let i = 0; i < 3; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🏴‍☠️' as any, rank: 'PRT_SHIP (Піратський корабель)' as any, value: 7, isPirateShip: true });
            }
            statusMsg = `🏴‍☠️ Піратський набіг! ${playerName} отримав 3 Піратські кораблі й завершив хід!`;
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, hand };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            return finishBoutState(state, 'pass');
        }
        if (card.isPirateShip) {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🏴‍☠️' as any, rank: 'PRT_CREW (Піратський екіпаж)' as any, value: 5, isPirateCrew: true });
            }
            statusMsg = `⛵ Піратський корабель! ${playerName} отримав 4 піратські екіпажі!`;
        }
        if (card.isPirateCrew) {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🗡️' as any, rank: 'PRT (Пірат)' as any, value: 10, isPirate: true });
            }
            statusMsg = `🏴‍☠️ Піратський екіпаж! ${playerName} отримав 4 карти Пірат!`;
        }
        if (card.isUndeadLordSpell) {
            const newPlayer: Player = {
                id: Math.floor(Date.now() + Math.random() * 1000000),
                name: 'Владика Мертвих',
                isHuman: false,
                hand: Array.from({ length: 20 }, (_, i) => ({
                    id: Math.floor(Date.now() + Math.random() * 1000000 + i),
                    suit: ['♠', '♥', '♦', '♣'][i % 4] as Suit,
                    rank: 'DK (Лицар смерті)' as any,
                    value: 10,
                    isDeathKnight: true
                })),
                avatar: '💀',
                powerPoints: 0,
                health: 500,
                armor: 0
            };
            state = { ...state, players: [...state.players, newPlayer], eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            statusMsg = `💀 Владика мертвих! З'явився новий гравець: Владика Мертвих!`;
            state = { ...state, players: state.players.map(p => p.id === playerId ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p) };
        }
        if (card.isGrandKonungSpell) {
            const newPlayer: Player = {
                id: Math.floor(Date.now() + Math.random() * 1000000),
                name: 'Великий Конунг',
                isHuman: false,
                hand: [
                    ...Array.from({ length: 5 }, (_, i) => ({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i),
                        suit: ['♠', '♥', '♦', '♣'][i % 4] as Suit,
                        rank: 'DRK (Драккар)' as any,
                        value: 8,
                        isDrakkar: true
                    })),
                    ...Array.from({ length: 8 }, (_, i) => ({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i + 100),
                        suit: ['♠', '♥', '♦', '♣'][i % 4] as Suit,
                        rank: 'VK (Вікінг)' as any,
                        value: 6,
                        isViking: true
                    }))
                ],
                avatar: '❄️',
                powerPoints: 0,
                health: 500,
                armor: 0
            };
            state = { ...state, players: [...state.players, newPlayer], eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            statusMsg = `❄️ Великий конунг! З'явився новий гравець: Великий Конунг!`;
            state = { ...state, players: state.players.map(p => p.id === playerId ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p) };
        }
        if (card.isGreatKhanSpell) {
            const newPlayer: Player = {
                id: Math.floor(Date.now() + Math.random() * 1000000),
                name: 'Великий Хан',
                isHuman: false,
                hand: Array.from({ length: 10 }, (_, i) => ({
                    id: Math.floor(Date.now() + Math.random() * 1000000 + i),
                    suit: ['♠', '♥', '♦', '♣'][i % 4] as Suit,
                    rank: 'HL (Ординець)' as any,
                    value: 7,
                    isNomad: true
                })),
                avatar: '🐎',
                powerPoints: 0,
                health: 500,
                armor: 0
            };
            state = { ...state, players: [...state.players, newPlayer], eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            statusMsg = `🐎 Великий хан! З'явився новий гравець: Великий Хан!`;
            state = { ...state, players: state.players.map(p => p.id === playerId ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p) };
        }
        if (card.isZombieApocalypseSpell) {
            const player = state.players.find(p => p.id === playerId);
            if (player) {
                const zombies = player.hand.map(c => ({
                    id: Math.floor(Date.now() + Math.random() * 1000000 + c.id),
                    suit: '🧟' as Suit,
                    rank: 'ZB (Зомбі)' as any,
                    value: 4,
                    isZombie: true
                }));
                const newPlayer: Player = {
                    id: Math.floor(Date.now() + Math.random() * 1000000),
                    name: 'Орда зомбі',
                    isHuman: false,
                    hand: zombies,
                    avatar: '🧟',
                    powerPoints: 0,
                    health: 500,
                    armor: 0
                };
                state = { 
                    ...state, 
                    players: [...state.players.map(p => p.id === playerId ? { ...p, hand: [] } : p), newPlayer],
                    eternalDiscardPile: [...(state.eternalDiscardPile || []), card]
                };
                statusMsg = `🧟 Зомбі апокаліпсис! Карти гравця перетворені на Зомбі і передані Орді!`;
            }
        }
        if (card.isInvadersSpell) {
            const newPlayer: Player = {
                id: Math.floor(Date.now() + Math.random() * 1000000),
                name: 'Загарбник',
                isHuman: false,
                hand: [
                    ...Array.from({ length: 5 }, (_, i) => ({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i),
                        suit: ['♠', '♥', '♦', '♣'][Math.floor(Math.random()*4)] as Suit,
                        rank: 'K' as any,
                        value: 13,
                        isKing: true
                    })),
                    ...Array.from({ length: 5 }, (_, i) => ({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i + 100),
                        suit: ['♠', '♥', '♦', '♣'][Math.floor(Math.random()*4)] as Suit,
                        rank: 'J' as any,
                        value: 11,
                        isKnight: true
                    }))
                ],
                avatar: '⚔️',
                powerPoints: 0,
                health: 500,
                armor: 0
            };
            state = { ...state, players: [...state.players, newPlayer], eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            statusMsg = `⚔️ Загарбники! З'явився новий гравець: Загарбник!`;
            state = { ...state, players: state.players.map(p => p.id === playerId ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p) };
        }
        if (card.isStormOfSeasSpell) {
            const newPlayer: Player = {
                id: Math.floor(Date.now() + Math.random() * 1000000),
                name: 'Гроза морів',
                isHuman: false,
                hand: [
                    ...Array.from({ length: 8 }, (_, i) => ({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i),
                        suit: '🏴‍☠️' as Suit,
                        rank: 'PRT_SHIP (Піратський корабель)' as any,
                        value: 7,
                        isPirateShip: true
                    })),
                    ...Array.from({ length: 5 }, (_, i) => ({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i + 100),
                        suit: '🗡️' as Suit,
                        rank: 'PRT (Пірат)' as any,
                        value: 5,
                        isPirate: true
                    }))
                ],
                avatar: '🌊',
                powerPoints: 0,
                health: 500,
                armor: 0
            };
            state = { ...state, players: [...state.players, newPlayer], eternalDiscardPile: [...(state.eternalDiscardPile || []), card] };
            statusMsg = `🌊 Гроза морів! З'явився новий гравець: Гроза морів!`;
            state = { ...state, players: state.players.map(p => p.id === playerId ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p) };
        }
        if (card.isEinherjarSpell) {
            const discardedCards = (state.eternalDiscardPile || []).filter(c => c.id !== card.id);
            let einherjarHand: Card[] = discardedCards.map((c, i) => ({
                id: Math.floor(Date.now() + Math.random() * 1000000 + (c.id || 0) + i),
                suit: (c.suit && !['👻', '💀', '🧟', '🛡️', '⚔️', '🌊', '❄️', '🐎'].includes(c.suit as any)) ? c.suit : (['♠', '♥', '♦', '♣'][i % 4] as Suit),
                rank: 'HR (Герой)' as any,
                value: 10,
                isHero: true
            }));

            const minHeroCount = 10;
            if (einherjarHand.length < minHeroCount) {
                const extraNeeded = minHeroCount - einherjarHand.length;
                for (let i = 0; i < extraNeeded; i++) {
                    einherjarHand.push({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i + 20000),
                        suit: ['♠', '♥', '♦', '♣'][i % 4] as Suit,
                        rank: 'HR (Герой)' as any,
                        value: 10,
                        isHero: true
                    });
                }
            }

            const newPlayer: Player = {
                id: Math.floor(Date.now() + Math.random() * 1000000),
                name: 'Ейнхерії',
                isHuman: false,
                hand: einherjarHand.filter(c => !c.isEinherjarSpell && !c.isHelArmySpell && !c.isUndeadLordSpell && !c.isGrandKonungSpell && !c.isGreatKhanSpell && !c.isZombieApocalypseSpell && !c.isInvadersSpell && !c.isStormOfSeasSpell),
                avatar: '🛡️',
                powerPoints: 0,
                health: 500,
                armor: 0
            };
            state = { ...state, players: [...state.players, newPlayer], eternalDiscardPile: [...(state.eternalDiscardPile || []), card], discardPile: [] };
            statusMsg = `🛡️ Ейнхерії! З'явився новий гравець: Ейнхерії (${einherjarHand.length} Героїв)!`;
            state = { ...state, players: state.players.map(p => p.id === playerId ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p) };
        }
        if (card.isHelArmySpell) {
            const eternalCards = (state.eternalDiscardPile || []).filter(c => c.id !== card.id);
            let draugrHand: Card[] = eternalCards.map((c, i) => ({
                id: Math.floor(Date.now() + Math.random() * 1000000 + (c.id || 0) + i),
                suit: (c.suit && !['👻', '💀', '🧟', '🛡️', '⚔️', '🌊', '❄️', '🐎'].includes(c.suit as any)) ? c.suit : (['♠', '♥', '♦', '♣'][i % 4] as Suit),
                rank: 'DRG (Драугр)' as any,
                value: 8,
                isDraugr: true
            }));

            const minDraugrCount = 10;
            if (draugrHand.length < minDraugrCount) {
                const extraNeeded = minDraugrCount - draugrHand.length;
                for (let i = 0; i < extraNeeded; i++) {
                    draugrHand.push({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i + 10000),
                        suit: ['♠', '♥', '♦', '♣'][i % 4] as Suit,
                        rank: 'DRG (Драугр)' as any,
                        value: 8,
                        isDraugr: true
                    });
                }
            }

            const newPlayer: Player = {
                id: Math.floor(Date.now() + Math.random() * 1000000),
                name: 'Армія Хель',
                isHuman: false,
                hand: draugrHand.filter(c => !c.isHelArmySpell && !c.isEinherjarSpell && !c.isUndeadLordSpell && !c.isGrandKonungSpell && !c.isGreatKhanSpell && !c.isZombieApocalypseSpell && !c.isInvadersSpell && !c.isStormOfSeasSpell),
                avatar: '💀',
                powerPoints: 0,
                health: 500,
                armor: 0
            };
            state = { ...state, players: [...state.players, newPlayer], eternalDiscardPile: [...(state.eternalDiscardPile || []), card], discardPile: [] };
            statusMsg = `💀 Армія Хель! З'явився новий гравець: Армія Хель (${draugrHand.length} Драугрів силі 8)!`;
            state = { ...state, players: state.players.map(p => p.id === playerId ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p) };
        }
        if (card.isBurnCardSpell) {
            const player = state.players.find(p => p.id === playerId);
            const handWithoutSpell = player ? player.hand.filter(c => c.id !== card.id) : [];
            if (player && handWithoutSpell.length > 0) {
                // Find highest value card other than spell card itself
                const highestCard = handWithoutSpell.reduce((prev, current) => ((prev.value || 0) > (current.value || 0)) ? prev : current);
                const updatedHand = player.hand.filter(c => c.id !== highestCard.id);
                state = { 
                    ...state, 
                    players: state.players.map(p => p.id === playerId ? { ...p, hand: updatedHand, powerPoints: p.powerPoints + (highestCard.value || 0) } : p)
                };
                statusMsg = `🔥 Спалено карту ${highestCard.rank} (сила ${highestCard.value || 0})! Отримано +${highestCard.value || 0} очок сили!`;
            } else {
                statusMsg = `🔥 Немає інших карт для спалення!`;
            }
        }
        if (card.isBurnHandSpell) {
            const player = state.players.find(p => p.id === playerId);
            if (player) {
                const otherCards = player.hand.filter(c => c.id !== card.id);
                const burnCount = otherCards.length;
                const pointsGained = otherCards.reduce((sum, c) => sum + (c.value || 0), 0) || burnCount;
                state = { 
                    ...state, 
                    players: state.players.map(p => p.id === playerId ? { ...p, hand: [card], powerPoints: p.powerPoints + pointsGained } : p)
                };
                statusMsg = `🧨 Спалено ${burnCount} карт! Отримано +${pointsGained} очок сили!`;
            }
        }
        if (card.isPirateShip) {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🗡️' as any, rank: 'PRT_CREW (Піратський екіпаж)', value: 5, isPirateCrew: true });
            }
            statusMsg = `🏴‍☠️ Піратський корабель! ${playerName} висадив 4 піратів екіпажу!`;
        }
        if (card.isPirateCrew) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000), suit: '🪙' as any, rank: 'GL (Золото)', value: 80, isGold: true });
            statusMsg = `🗡️ Піратський екіпаж! ${playerName} здобув 1 золото!`;
        }
        if (card.isMeteorSwarm) {
            const updatedPlayers = state.players.map(p => {
                if (p.id !== playerId) {
                    const newArmor = Math.max(0, p.armor - 40);
                    const newHealth = newArmor === 0 ? Math.max(0, p.health - 60) : p.health;
                    return { ...p, armor: newArmor, health: newHealth };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers, table: [] };
            statusMsg = `☄️ Метеоритний дощ! ${playerName} знищив стіл метеором та наніс урон супротивникам!`;
        }
        if (card.isManaShield) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, armor: p.armor + 60 };
                }
                return p;
            });
            state = { ...state, players: updatedPlayers };
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🔮', rank: 'SP (Закляття)', value: 10, isSpell: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 2), suit: '🔮', rank: 'SP (Закляття)', value: 10, isSpell: true });
            statusMsg = `🛡️ Магічний Щит! ${playerName} отримав +60 Захисту та 2 карти заклять!`;
        }
        if (card.isChainLightning) {
            if (state.table.length > 0) {
                const targetPair = state.table[state.table.length - 1];
                const clearedTable = state.table.filter((_, idx) => idx !== state.table.length - 1);
                let newEternal = [...(state.eternalDiscardPile || []), targetPair.attack];
                if (targetPair.defense) newEternal.push(targetPair.defense);
                state = { ...state, table: clearedTable, eternalDiscardPile: newEternal };
                statusMsg = `⚡ Ланцюгова блискавка! ${playerName} знищив карту блискавкою!`;
            } else {
                statusMsg = `⚡ Ланцюгова блискавка! Стіл порожній.`;
            }
        }

        if (card.isSmeltingSpell) {
            const level = card.smeltingLevel || 1;
            let destroyCount = 10;
            if (level === 2 || level === 3 || level === 4 || level === 6) destroyCount = 8;
            else if (level === 5) destroyCount = 6;
            else if (level === 7) destroyCount = 4;
            else if (level === 8) destroyCount = 24;

            let currentEternal = [...(state.eternalDiscardPile || [])];
            const actualDestroyed = Math.min(currentEternal.length, destroyCount);
            const remainingEternal = currentEternal.slice(actualDestroyed);
            state = { ...state, eternalDiscardPile: remainingEternal };

            const playerObj = state.players.find(p => p.id === playerId);

            if (level === 1 || level === 2) {
                bonusCardsToAdd.push(generateRandomBonusCard());
                statusMsg = `⚒️ Переплавлення Lvl ${level}! Знищено ${actualDestroyed} карт з вічного відбою. Отримано 1 випадкову карту!`;
            } else if (level === 3) {
                bonusCardsToAdd.push(generateRandomBonusCard(), generateRandomBonusCard());
                statusMsg = `⚒️ Переплавлення Lvl 3! Знищено ${actualDestroyed} карт з вічного відбою. Отримано 2 випадкові карти!`;
            } else if (level === 4 || level === 5) {
                for (let i = 0; i < 4; i++) bonusCardsToAdd.push(generateRandomBonusCard());
                statusMsg = `⚒️ Переплавлення Lvl ${level}! Знищено ${actualDestroyed} карт з вічного відбою. Отримано 4 випадкові карти!`;
            } else if (level === 6) {
                for (let i = 0; i < 2; i++) {
                    bonusCardsToAdd.push({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i),
                        suit: ['♠', '♥', '♦', '♣'][i % 4] as Suit,
                        rank: 'HR (Герой)' as any,
                        value: 99,
                        isHero: true
                    });
                }
                statusMsg = `⚒️ Переплавлення Lvl 6! Знищено ${actualDestroyed} карт з вічного відбою. Отримано 2 карти Героя!`;
            } else if (level === 7) {
                for (let i = 0; i < 12; i++) {
                    bonusCardsToAdd.push({
                        id: Math.floor(Date.now() + Math.random() * 1000000 + i),
                        suit: '🪙' as any,
                        rank: 'GL (Золото)' as any,
                        value: 80,
                        isGold: true
                    });
                }
                statusMsg = `⚒️ Переплавлення Lvl 7! Знищено ${actualDestroyed} карт з вічного відбою. Отримано 12 карт Золота!`;
            } else if (level === 8) {
                if (playerObj?.isHuman) {
                    state = { ...state, activeSmeltingPicker: { playerId } };
                    statusMsg = `⚒️ Переплавлення Lvl 8! Знищено ${actualDestroyed} карт з вічного відбою. Оберіть карту!`;
                } else {
                    bonusCardsToAdd.push({
                        id: Math.floor(Date.now() + Math.random() * 1000000),
                        suit: '🛡️' as any,
                        rank: 'HR (Герой)' as any,
                        value: 99,
                        isHero: true
                    });
                    statusMsg = `⚒️ Переплавлення Lvl 8! Знищено ${actualDestroyed} карт з вічного відбою. Бот отримав карту Героя!`;
                }
            }
        }

        if (card.isResourceReleaseSpell) {
            const level = card.resourceReleaseLevel || 1;
            let destroyCount = 12;
            if (level === 2) destroyCount = 10;
            else if (level === 3 || level === 4) destroyCount = 8;
            else if (level >= 5) destroyCount = 6;

            let ptsToAdd = 2;
            if (level === 3) ptsToAdd = 2;
            else if (level === 4 || level === 5) ptsToAdd = 4;
            else if (level === 6) ptsToAdd = 5;
            else if (level === 7) ptsToAdd = 6;

            let currentEternal = [...(state.eternalDiscardPile || [])];
            const actualDestroyed = Math.min(currentEternal.length, destroyCount);
            const remainingEternal = currentEternal.slice(actualDestroyed);
            state = { ...state, eternalDiscardPile: remainingEternal };

            powerPointsDelta += ptsToAdd;
            statusMsg = `💎 Вивільнення ресурсів Lvl ${level}! Знищено ${actualDestroyed} карт з вічного відбою. Отримано +${ptsToAdd} очок сили!`;
        }

        if (isInstantSpellCard(card)) {
            if (card.isEndTurnSpell) {
                return finishBoutState(state, 'pass');
            }

            let newDiscard = [...state.discardPile];
            if (resurrectCard) {
                newDiscard = newDiscard.filter(c => c.id !== resurrectCard!.id);
            }

            const newEternalDiscard = [...(state.eternalDiscardPile || []), card];

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    if (bonusCardsToAdd.length > 0) hand = [...hand, ...bonusCardsToAdd];
                    if (resurrectCard) hand = [...hand, resurrectCard];
                    return {
                        ...p,
                        health: Math.min(500, (p.health ?? 500) + healthDelta),
                        armor: (p.armor ?? 200) + armorDelta,
                        powerPoints: p.powerPoints + powerPointsDelta,
                        hand
                    };
                }
                return p;
            });

            return {
                ...state,
                discardPile: newDiscard,
                eternalDiscardPile: newEternalDiscard,
                players: updatedPlayers,
                statusBanner: statusMsg || state.statusBanner
            };
        }

        if (card.isEndTurnSpell) {
            return finishBoutState(state, 'pass');
        }
        if (card.isBarbarian) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🔥', rank: 'RG (Злість)', value: 75, isRage: true });
            statusMsg = `🪓 Варвар! ${playerName} отримав карту Злості!`;
        }
        if (card.isRage) {
            empowerWeakestInHand = true;
            statusMsg = `🔥 Злість! ${playerName} безкоштовно посилив карту козирем!`;
        }
        if (card.isCleric && state.discardPile.length > 0) {
            resurrectCard = state.discardPile[state.discardPile.length - 1];
            statusMsg = `🕊️ Клірик! ${playerName} воскресив карту ${resurrectCard.rank} з відбою!`;
        }

        if (card.isRanger) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🪤' as any, rank: 'TR (Пастка)', value: 10, isTrap: true });
        }
        if (card.isHunter) {
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 1), suit: '🪤' as any, rank: 'TR (Пастка)', value: 10, isTrap: true });
            bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + 2), suit: '🪤' as any, rank: 'TR (Пастка)', value: 10, isTrap: true });
        }
        if (card.isTrapper) {
            for (let i = 0; i < 4; i++) {
                bonusCardsToAdd.push({ id: Math.floor(Date.now() + Math.random() * 1000000 + i), suit: '🪤' as any, rank: 'TR (Пастка)', value: 10, isTrap: true });
            }
        }
    }

    if (playerId === state.defenderId) {
        // -------------------------------------------------------------
        // DEFENDER MOVES
        // -------------------------------------------------------------

        // 1. SAGE (Мудрець)
        if (card.isSage) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
                }
                return p;
            });

            const newTable = [...state.table, { attack: card, attackerId: playerId }];
            const nextDefenderId = getNextActivePlayerIndex(state.players, state.defenderId, state.deck.length);

            return {
                ...state,
                players: updatedPlayers,
                table: newTable,
                attackerId: playerId,
                defenderId: nextDefenderId,
                turnPlayerId: nextDefenderId,
                passedPlayers: [],
                statusBanner: `🧙‍♂️ Мудрець! ${playerName} перевів атаку на наступного гравця!`
            };
        }

        // GOLD & SILVER on defense
        if (card.isGold || card.isSilver) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
                }
                return p;
            });

            const newEternalDiscard = [...(state.eternalDiscardPile || []), card];
            const nextDefenderId = getNextActivePlayerIndex(state.players, state.defenderId, state.deck.length);
            const cardTitle = card.isGold ? 'Золото' : 'Срібло';
            const cardIcon = card.isGold ? '🪙' : '🥈';

            return {
                ...state,
                eternalDiscardPile: newEternalDiscard,
                players: updatedPlayers,
                attackerId: playerId,
                defenderId: nextDefenderId,
                turnPlayerId: nextDefenderId,
                passedPlayers: [],
                statusBanner: `${cardIcon} ${cardTitle}! ${playerName} перевів атаку на наступного гравця, карта пішла у вічний відбій!`
            };
        }

        // KNOWLEDGE on defense
        if (card.isKnowledge) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { 
                        ...p, 
                        powerPoints: p.powerPoints + 1,
                        hand: p.hand.filter(c => c.id !== card.id) 
                    };
                }
                return p;
            });

            const newTable = [...state.table];
            const undefIdx = newTable.findIndex(p => !p.defense);
            if (undefIdx !== -1) {
                newTable[undefIdx] = { ...newTable[undefIdx], defense: card };
            }

            const resState = finishBoutState({
                ...state,
                players: updatedPlayers,
                table: newTable
            }, 'pass');

            return {
                ...resState,
                statusBanner: `📖 Знання! ${playerName} отримав +1 очко сили, карта пішла у вічний відбій!`
            };
        }

        // RAGE on defense
        if (card.isRage) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    const firstNonEmp = hand.find(c => !c.isEmpowered);
                    if (firstNonEmp) {
                        hand = hand.map(c => c.id === firstNonEmp.id ? { ...c, isEmpowered: true } : c);
                    }
                    return { 
                        ...p, 
                        hand 
                    };
                }
                return p;
            });

            const newTable = [...state.table];
            const undefIdx = newTable.findIndex(p => !p.defense);
            if (undefIdx !== -1) {
                newTable[undefIdx] = { ...newTable[undefIdx], defense: card };
            }

            const resState = finishBoutState({
                ...state,
                players: updatedPlayers,
                table: newTable
            }, 'pass');

            return {
                ...resState,
                statusBanner: `🔥 Злість! ${playerName} посилив карту козирем, Злість пішла у вічний відбій!`
            };
        }

        // 2. THIEF (Злодій)
        if (card.isThief) {
            const newTable = [...state.table];
            let stolenCard: Card | null = null;
            const undefIdx = newTable.findIndex(p => !p.defense);
            if (undefIdx !== -1) {
                stolenCard = newTable[undefIdx].attack;
                newTable[undefIdx] = {
                    ...newTable[undefIdx],
                    defense: card
                };
            }

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    const cleanHand = p.hand.filter(c => c.id !== card.id);
                    return { 
                        ...p, 
                        hand: stolenCard ? [...cleanHand, stolenCard] : cleanHand 
                    };
                }
                return p;
            });

            return {
                ...state,
                players: updatedPlayers,
                table: newTable,
                turnPlayerId: state.attackerId,
                isLockedByGrandmaster: true
            };
        }

        // 3. PRIEST (Священик)
        if (card.isPriest) {
            const tableCards = state.table.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
            let newDiscard = [...state.discardPile];
            const returnCount = Math.min(2, newDiscard.length);
            const returnedFromDiscard = newDiscard.splice(newDiscard.length - returnCount, returnCount);
            const newEternalDiscard = [...(state.eternalDiscardPile || []), card];

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    const cleanHand = p.hand.filter(c => c.id !== card.id);
                    return { 
                        ...p, 
                        powerPoints: p.powerPoints + 2,
                        hand: [...cleanHand, ...tableCards, ...returnedFromDiscard] 
                    };
                }
                return p;
            });

            const refill = refillHandsAfterSpell(updatedPlayers, state, playerId);
            let isGameOver = false;
            let foolId: number | null = null;
            if (refill.remaining.length <= 1) {
                isGameOver = true;
                if (refill.remaining.length === 1) foolId = refill.remaining[0].id;
            }

            return {
                ...state,
                players: updatedPlayers,
                deck: refill.newDeck,
                table: [],
                discardPile: newDiscard,
                eternalDiscardPile: newEternalDiscard,
                attackerId: refill.nextAttackerId,
                defenderId: refill.nextDefenderId,
                turnPlayerId: refill.nextAttackerId,
                passedPlayers: [],
                isTaking: false,
                isLockedByGrandmaster: false,
                isPaladinDefenseLocked: false,
                nextOutRank: refill.curOutRank,
                gameOver: isGameOver,
                foolPlayerId: foolId,
                extraTurnPlayerId: null,
                extraTurnCount: 0,
                statusBanner: `⛪ Священик! ${playerName} отримав +2 очка сили, забрав стіл у руку, повернув ${returnedFromDiscard.length} карт(и) з відбою! Священик пішов у вічний відбій. Хід залишається за вами!`,
                prikupDecks: refill.prikupDecks
            };
        }

        // 4. BISHOP (Єпископ)
        if (card.isBishop) {
            const tableCards = state.table.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
            let newDiscard = [...state.discardPile];
            const returnCount = Math.min(3, newDiscard.length);
            const returnedFromDiscard = newDiscard.splice(newDiscard.length - returnCount, returnCount);
            const newEternalDiscard = [...(state.eternalDiscardPile || []), card];

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    const cleanHand = p.hand.filter(c => c.id !== card.id);
                    return { 
                        ...p, 
                        powerPoints: p.powerPoints + 4,
                        hand: [...cleanHand, ...tableCards, ...returnedFromDiscard] 
                    };
                }
                return p;
            });

            const refill = refillHandsAfterSpell(updatedPlayers, state, playerId);
            let isGameOver = false;
            let foolId: number | null = null;
            if (refill.remaining.length <= 1) {
                isGameOver = true;
                if (refill.remaining.length === 1) foolId = refill.remaining[0].id;
            }

            return {
                ...state,
                players: updatedPlayers,
                deck: refill.newDeck,
                table: [],
                discardPile: newDiscard,
                eternalDiscardPile: newEternalDiscard,
                attackerId: refill.nextAttackerId,
                defenderId: refill.nextDefenderId,
                turnPlayerId: refill.nextAttackerId,
                passedPlayers: [],
                isTaking: false,
                isLockedByGrandmaster: false,
                isPaladinDefenseLocked: false,
                nextOutRank: refill.curOutRank,
                gameOver: isGameOver,
                foolPlayerId: foolId,
                extraTurnPlayerId: playerId,
                extraTurnCount: 1,
                statusBanner: `🏛️ Єпископ! ${playerName} отримав +4 очка сили, забрав стіл у руку, повернув ${returnedFromDiscard.length} карт(и) з відбою! Всі інші гравці пропускають хід. Єпископ пішов у вічний відбій.`,
                prikupDecks: refill.prikupDecks
            };
        }

        // 5. ARCHBISHOP (Архієпископ)
        if (card.isArchbishop) {
            const gamblerCard: Card = {
                id: Math.floor(Date.now() + Math.random() * 100000),
                suit: '🎲',
                rank: 'GB (Гравець)',
                value: 96,
                isGambler: true
            };

            const tableCards = state.table.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
            const empoweredTableCards = tableCards.map(c => ({ ...c, isEmpowered: true }));

            let newDiscard = [...state.discardPile];
            const returnCount = Math.min(4, newDiscard.length);
            const returnedFromDiscard = newDiscard.splice(newDiscard.length - returnCount, returnCount);
            const newEternalDiscard = [...(state.eternalDiscardPile || []), card];

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    const cleanHand = p.hand.filter(c => c.id !== card.id);
                    return { 
                        ...p, 
                        powerPoints: p.powerPoints + 6,
                        hand: [...cleanHand, gamblerCard, ...empoweredTableCards, ...returnedFromDiscard] 
                    };
                }
                return p;
            });

            const refill = refillHandsAfterSpell(updatedPlayers, state, playerId);
            let isGameOver = false;
            let foolId: number | null = null;
            if (refill.remaining.length <= 1) {
                isGameOver = true;
                if (refill.remaining.length === 1) foolId = refill.remaining[0].id;
            }

            return {
                ...state,
                players: updatedPlayers,
                deck: refill.newDeck,
                table: [],
                discardPile: newDiscard,
                eternalDiscardPile: newEternalDiscard,
                attackerId: refill.nextAttackerId,
                defenderId: refill.nextDefenderId,
                turnPlayerId: refill.nextAttackerId,
                passedPlayers: [],
                isTaking: false,
                isLockedByGrandmaster: false,
                isPaladinDefenseLocked: false,
                nextOutRank: refill.curOutRank,
                gameOver: isGameOver,
                foolPlayerId: foolId,
                extraTurnPlayerId: playerId,
                extraTurnCount: 1,
                statusBanner: `⛪ Архієпископ! ${playerName} отримав +6 очок сили, карту Гравця, забрав стіл у руку (всі карти стали КОЗИРЯМИ!), повернув ${returnedFromDiscard.length} карт(и) з відбою! Всі інші гравці пропускають хід. Архієпископ пішов у вічний відбій.`,
                prikupDecks: refill.prikupDecks
            };
        }

        // 6. ALCHEMIST (Алхімік)
        if (card.isAlchemist) {
            const trumpSuit = state.actualTrumpSuits[0] || '♠';
            const bonusAce1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 1), suit: trumpSuit, rank: 'A', value: getCardValue('A') };
            const bonusAce2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 2), suit: trumpSuit, rank: 'A', value: getCardValue('A') };
            const bonusGold1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 3), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true };
            const bonusGold2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 4), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true };
            const bonusSilver1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 5), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true };
            const bonusSilver2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 6), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true };

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    const cleanHand = p.hand.filter(c => c.id !== card.id);
                    return { ...p, hand: [...cleanHand, bonusAce1, bonusAce2, bonusGold1, bonusGold2, bonusSilver1, bonusSilver2] };
                }
                return p;
            });

            const newTable = [...state.table];
            const undefIdx = newTable.findIndex(p => !p.defense);
            if (undefIdx !== -1) {
                newTable[undefIdx] = { ...newTable[undefIdx], defense: card };
            }

            const resState = finishBoutState({
                ...state,
                players: updatedPlayers,
                table: newTable
            }, 'pass');

            return {
                ...resState,
                statusBanner: `⚗️ Алхімік! Відбито в Бито, а ${playerName} отримує 2 козирних Тузи, 2 карти Золота та 2 карти Срібла!`
            };
        }

        // 7. DEATH (Смерть)
        if (card.isDeathCard) {
            const tableCards = state.table.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
            const newEternalDiscard = [...(state.eternalDiscardPile || []), ...tableCards, card];

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
                }
                return p;
            });

            const refill = refillHandsAfterSpell(updatedPlayers, state, playerId);
            let isGameOver = false;
            let foolId: number | null = null;
            if (refill.remaining.length <= 1) {
                isGameOver = true;
                if (refill.remaining.length === 1) foolId = refill.remaining[0].id;
            }

            return {
                ...state,
                players: updatedPlayers,
                deck: refill.newDeck,
                table: [],
                discardPile: state.discardPile,
                eternalDiscardPile: newEternalDiscard,
                attackerId: refill.nextAttackerId,
                defenderId: refill.nextDefenderId,
                turnPlayerId: refill.nextAttackerId,
                passedPlayers: [],
                isTaking: false,
                isLockedByGrandmaster: false,
                isPaladinDefenseLocked: false,
                nextOutRank: refill.curOutRank,
                gameOver: isGameOver,
                foolPlayerId: foolId,
                extraTurnPlayerId: playerId,
                extraTurnCount: 1,
                statusBanner: `☠️ Смерть! Карту та Смерть відправлено у ВІЧНИЙ ВІДБІЙ (з якого не можна повернутись)! ${playerName} ходить знову!`,
                prikupDecks: refill.prikupDecks
            };
        }

        // 8. MERCHANT (Торговець)
        if (card.isMerchant) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { 
                        ...p, 
                        powerPoints: p.powerPoints + 3,
                        hand: p.hand.filter(c => c.id !== card.id) 
                    };
                }
                return p;
            });

            const newTable = [...state.table];
            const undefIdx = newTable.findIndex(p => !p.defense);
            if (undefIdx !== -1) {
                newTable[undefIdx] = { ...newTable[undefIdx], defense: card };
            }

            const resState = finishBoutState({
                ...state,
                players: updatedPlayers,
                table: newTable
            }, 'pass');

            return {
                ...resState,
                statusBanner: `💰 Торговець! +3 очка сили та відбито в Бито!`
            };
        }

        // 9. PALADIN or DEATH KNIGHT on defense
        if (card.isPaladin || card.isDeathKnight) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    if (bonusCardsToAdd.length > 0) hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, powerPoints: p.powerPoints + powerPointsDelta, hand };
                }
                return p;
            });

            const newTable = [...state.table];
            const undefIdx = newTable.findIndex(p => !p.defense);
            if (undefIdx !== -1) {
                newTable[undefIdx] = { ...newTable[undefIdx], defense: card };
            }

            const hasRemainingUndefended = newTable.some(p => !p.defense);
            const lockName = card.isDeathKnight ? 'Лицар смерті' : 'Паладин';
            const bannerText = hasRemainingUndefended 
                ? `⚔️ ${lockName}! Карту побито. Потрібно побити ще ${newTable.filter(p => !p.defense).length} карт!` 
                : `⚔️ ${lockName}! Атаку побито — тепер підкидати проти ${playerName} можна ЛИШЕ козирі!`;

            if (!hasRemainingUndefended) {
                const attackers = updatedPlayers.filter(p => p.id !== state.defenderId && !p.outRank && p.hand.length > 0);
                if (attackers.length === 0) {
                    return finishBoutState({
                        ...state,
                        players: updatedPlayers,
                        table: newTable,
                        isPaladinDefenseLocked: true
                    }, 'pass');
                }
                const primaryAttacker = attackers.find(p => p.id === state.attackerId);
                const nextTurn = primaryAttacker ? primaryAttacker.id : attackers[0].id;
                return {
                    ...state,
                    players: updatedPlayers,
                    table: newTable,
                    turnPlayerId: nextTurn,
                    isPaladinDefenseLocked: true,
                    statusBanner: statusMsg || bannerText
                };
            }

            return {
                ...state,
                players: updatedPlayers,
                table: newTable,
                turnPlayerId: state.defenderId,
                isPaladinDefenseLocked: true,
                statusBanner: statusMsg || bannerText
            };
        }

        // 10. General / Wizard / Mage / Warlock / Cleric / Spells / Normal Defense
        let wizardDrawn: Card[] = [];
        let newDeck = [...state.deck];
        const pDeck = (state.prikupDecks && state.prikupDecks[playerId]) ? state.prikupDecks[playerId] : newDeck;
        if (card.isWizard && pDeck.length > 0) {
            wizardDrawn.push(pDeck.shift()!);
            if (pDeck.length > 0) wizardDrawn.push(pDeck.shift()!);
        }

        let newDiscard = [...state.discardPile];
        if (resurrectCard) {
            newDiscard = newDiscard.filter(c => c.id !== resurrectCard!.id);
        }
        if (necromancerGhostCard) {
            newDiscard = newDiscard.slice(0, newDiscard.length - 1);
        }

        const updatedPlayers = state.players.map(p => {
            if (p.id === playerId) {
                let hand = p.hand.filter(c => c.id !== card.id);
                if (bonusCardsToAdd.length > 0) hand = [...hand, ...bonusCardsToAdd];
                if (wizardDrawn.length > 0) hand = [...hand, ...wizardDrawn];
                if (resurrectCard) hand = [...hand, resurrectCard];
                if (empowerWeakestInHand) {
                    const firstNonEmp = hand.find(c => !c.isEmpowered);
                    if (firstNonEmp) {
                        hand = hand.map(c => c.id === firstNonEmp.id ? { ...c, isEmpowered: true } : c);
                    }
                }
                return { 
                    ...p, 
                    health: Math.min(500, (p.health ?? 500) + healthDelta),
                    armor: (p.armor ?? 200) + armorDelta,
                    powerPoints: p.powerPoints + powerPointsDelta,
                    hand 
                };
            }
            return p;
        });

        const newTable = [...state.table];
        const undefIdx = newTable.findIndex(p => !p.defense);
        if (undefIdx !== -1) {
            newTable[undefIdx] = {
                ...newTable[undefIdx],
                defense: card
            };
        }

        const isGrandmasterPlayed = card.isGrandmaster === true;
        const hasRemainingUndefended = newTable.some(p => !p.defense);
        
        let specialDefenseMsg: string | null = null;
        if (card.isChillTouch) {
            specialDefenseMsg = `❄️ Чіл тач! ${playerName} побив карту закляттям у ВІЧНИЙ ВІДБІЙ!`;
        } else if (card.isFingerOfDeath) {
            specialDefenseMsg = `👉 Перст смерті! ${playerName} побив карту закляттям у ВІЧНИЙ ВІДБІЙ!`;
        } else if (card.isPowerWordKill) {
            specialDefenseMsg = `💀 Слово сили: Смерть! ${playerName} побив карту закляттям у ВІЧНИЙ ВІДБІЙ!`;
        } else if (card.isAnnihilation) {
            specialDefenseMsg = `💥 Анігіляція! ${playerName} побив карту закляттям у ВІЧНИЙ ВІДБІЙ!`;
        } else if (card.isGambler) {
            specialDefenseMsg = `🎰 Гравець! ${playerName} побив карту у ВІЧНИЙ ВІДБІЙ!`;
        } else if (card.isGhost) {
            specialDefenseMsg = `👻 Привид! ${playerName} побив карту привидом (піде у вічний відбій)!`;
        } else if (card.isTrap) {
            specialDefenseMsg = `🪤 Пастка! ${playerName} побив карту пасткою у ВІЧНИЙ ВІДБІЙ!`;
        } else if (card.isViking) {
            specialDefenseMsg = `🪓 Вікінг! ${playerName} побив карту та отримав 1 Золото та 1 Срібло!`;
        } else if (card.isPirate) {
            specialDefenseMsg = `🏴‍☠️ Пірат! ${playerName} побив карту та отримав 1 Золото, 1 Срібло та 1 Скарб!`;
        } else if (card.isRobber) {
            specialDefenseMsg = `🗡️ Розбійник! ${playerName} побив карту та отримав 1 Золото і 3 Срібла!`;
        } else if (card.isBurglar) {
            specialDefenseMsg = `💰 Грабіжник! ${playerName} побив карту та отримав 2 Золота, 4 Срібла і 1 Скарб!`;
        } else if (card.isExecutioner) {
            specialDefenseMsg = `⚔️ Кат! ${playerName} побив карту (побиту карту буде відправлено у вічний відбій)!`;
        } else if (card.isAssassin) {
            specialDefenseMsg = `🗡️ Ассасін! ${playerName} побив карту (побиту карту буде відправлено у вічний відбій)!`;
        } else if (card.isArcher) {
            specialDefenseMsg = `🏹 Лучники! ${playerName} побив карту (Лучники повернуться в колоду прикупу)!`;
        } else if (card.isCrossbowman) {
            specialDefenseMsg = `🏹 Арбалетчики! ${playerName} побив карту (Арбалетчики повернуться в колоду прикупу)!`;
        }

        const bannerText = hasRemainingUndefended 
            ? `${playerName} побив карту! На столі залишилося відбити: ${newTable.filter(p => !p.defense).length}` 
            : null;

        const effectiveBanner = specialDefenseMsg || statusMsg || bannerText || state.statusBanner;

        if (!hasRemainingUndefended) {
            const attackers = updatedPlayers.filter(p => p.id !== state.defenderId && !p.outRank && p.hand.length > 0);
            if (attackers.length === 0 || isGrandmasterPlayed) {
                return finishBoutState({
                    ...state,
                    deck: newDeck,
                    discardPile: newDiscard,
                    players: updatedPlayers,
                    table: newTable,
                    isLockedByGrandmaster: state.isLockedByGrandmaster || isGrandmasterPlayed,
                }, 'pass');
            }
            const primaryAttacker = attackers.find(p => p.id === state.attackerId);
            const nextTurn = primaryAttacker ? primaryAttacker.id : attackers[0].id;
            return {
                ...state,
                deck: newDeck,
                discardPile: newDiscard,
                players: updatedPlayers,
                table: newTable,
                turnPlayerId: nextTurn,
                isLockedByGrandmaster: state.isLockedByGrandmaster || isGrandmasterPlayed,
                statusBanner: effectiveBanner
            };
        }

        return {
            ...state,
            deck: newDeck,
            discardPile: newDiscard,
            players: updatedPlayers,
            table: newTable,
            turnPlayerId: state.defenderId,
            isLockedByGrandmaster: state.isLockedByGrandmaster || isGrandmasterPlayed,
            statusBanner: effectiveBanner
        };
    }

        // 1. ALCHEMIST on attack
        if (card.isAlchemist) {
            const trumpSuit = state.actualTrumpSuits[0] || '♠';
            const bonusAce1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 1), suit: trumpSuit, rank: 'A', value: getCardValue('A') };
            const bonusAce2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 2), suit: trumpSuit, rank: 'A', value: getCardValue('A') };
            const bonusGold1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 3), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true };
            const bonusGold2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 4), suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true };
            const bonusSilver1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 5), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true };
            const bonusSilver2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 6), suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true };

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    const cleanHand = p.hand.filter(c => c.id !== card.id);
                    return { ...p, hand: [...cleanHand, bonusAce1, bonusAce2, bonusGold1, bonusGold2, bonusSilver1, bonusSilver2] };
                }
                return p;
            });

            const resState = finishBoutState({
                ...state,
                players: updatedPlayers,
                table: [...state.table, { attack: card, attackerId: playerId }]
            }, 'pass');

            return {
                ...resState,
                statusBanner: `⚗️ Алхімік! Карта пішла у Бито, а ${playerName} отримує 2 козирних Тузи, 2 карти Золота та 2 карти Срібла!`
            };
        }

        // GOLD & SILVER on attack/turn
        if (card.isGold || card.isSilver) {
            const addedPoints = card.isGold ? 3 : 1;
            const cardTitle = card.isGold ? 'Золото' : 'Срібло';
            const cardIcon = card.isGold ? '🪙' : '🥈';

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { 
                        ...p, 
                        powerPoints: p.powerPoints + addedPoints,
                        hand: p.hand.filter(c => c.id !== card.id) 
                    };
                }
                return p;
            });

            const newEternalDiscard = [...(state.eternalDiscardPile || []), card];

            return {
                ...state,
                eternalDiscardPile: newEternalDiscard,
                players: updatedPlayers,
                statusBanner: `${cardIcon} ${cardTitle}! ${playerName} отримав +${addedPoints} ${addedPoints === 1 ? 'очко' : 'очки'} сили, карта пішла у вічний відбій!`
            };
        }

        // KNOWLEDGE on attack/turn
        if (card.isKnowledge) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { 
                        ...p, 
                        powerPoints: p.powerPoints + 1,
                        hand: p.hand.filter(c => c.id !== card.id) 
                    };
                }
                return p;
            });

            const newEternalDiscard = [...(state.eternalDiscardPile || []), card];

            return {
                ...state,
                eternalDiscardPile: newEternalDiscard,
                players: updatedPlayers,
                statusBanner: `📖 Знання! ${playerName} отримав +1 очко сили, карта пішла у вічний відбій!`
            };
        }

        // VAMPIRE SPELL on attack/turn
        if (card.isVampireSpell) {
            const newEternalDiscard = [...(state.eternalDiscardPile || []), card];
            let updatedPlayers = state.players;
            let updatedDiscardPile = [...state.discardPile];
            let targetCardRank = '';

            const player = state.players.find(p => p.id === playerId);
            if (player) {
                if (updatedDiscardPile.length > 0) {
                    let targetCard: Card | undefined;
                    if (targetCardId !== undefined) {
                        targetCard = updatedDiscardPile.find(c => c.id === targetCardId);
                    }
                    if (!targetCard) {
                        // Fallback: last card in discard pile
                        targetCard = updatedDiscardPile[updatedDiscardPile.length - 1];
                    }

                    if (targetCard) {
                        targetCardRank = targetCard.rank;
                        const finalTargetCardId = targetCard.id;

                        // Remove from discard pile
                        updatedDiscardPile = updatedDiscardPile.filter(c => c.id !== finalTargetCardId);

                        // Create the new Vampire card
                        const vampireCard: Card = {
                            id: Math.floor(Date.now() + Math.random() * 1000000),
                            suit: '🦇' as any,
                            rank: 'VMP (Вампір)' as any,
                            value: 11,
                            isVampire: true
                        };

                        updatedPlayers = state.players.map(p => {
                            if (p.id === playerId) {
                                // Remove spell card from hand and add the new Vampire
                                const newHand = p.hand.filter(c => c.id !== card.id);
                                newHand.push(vampireCard);
                                return { ...p, hand: newHand };
                            }
                            return p;
                        });
                    }
                } else {
                    // Discard pile is empty, just remove spell from hand
                    updatedPlayers = state.players.map(p => {
                        if (p.id === playerId) {
                            return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
                        }
                        return p;
                    });
                }
            }

            const statusMsg = targetCardRank 
                ? `🔮 Закляття Вампіра! ${playerName} дістав карту ${targetCardRank} з відбою і перетворив її на нового Вампіра!`
                : `🔮 Закляття Вампіра! ${playerName} застосував силу, але відбій порожній!`;

            return {
                ...state,
                eternalDiscardPile: newEternalDiscard,
                discardPile: updatedDiscardPile,
                players: updatedPlayers,
                statusBanner: statusMsg
            };
        }

        // 2. HUNTSMAN, RANGER, HUNTER, TRAPPER on attack (Spawn 4 Dogs)
        if (card.isHuntsman || card.isRanger || card.isHunter || card.isTrapper) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    if (bonusCardsToAdd.length > 0) hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, powerPoints: p.powerPoints + powerPointsDelta, hand };
                }
                return p;
            });

            const dog1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 10), suit: '🐕', rank: 'DG (Собака)', value: 1, isDog: true };
            const dog2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 20), suit: '🐕', rank: 'DG (Собака)', value: 1, isDog: true };
            const dog3: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 30), suit: '🐕', rank: 'DG (Собака)', value: 1, isDog: true };
            const dog4: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 40), suit: '🐕', rank: 'DG (Собака)', value: 1, isDog: true };

            const spawnedPairs: TablePair[] = [
                { attack: card, attackerId: playerId },
                { attack: dog1, attackerId: playerId },
                { attack: dog2, attackerId: playerId },
                { attack: dog3, attackerId: playerId },
                { attack: dog4, attackerId: playerId }
            ];

            const title = card.isRanger ? 'Ренджер' : (card.isHunter ? 'Мисливець' : (card.isTrapper ? 'Траппер' : 'Псар'));
            const bannerText = `🐺 ${title}! ${playerName} випустив зразом 4 Собак на стіл!`;

            return {
                ...state,
                players: updatedPlayers,
                table: [...state.table, ...spawnedPairs],
                turnPlayerId: state.defenderId,
                statusBanner: statusMsg || bannerText
            };
        }

        // 3. DEATH KNIGHT on attack (Spawns 3 Skeletons)
        if (card.isDeathKnight) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    if (bonusCardsToAdd.length > 0) hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, powerPoints: p.powerPoints + powerPointsDelta, hand };
                }
                return p;
            });

            const sk1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 11), suit: card.suit, rank: 'SK (Скелет)', value: 3, isSkeleton: true };
            const sk2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 12), suit: card.suit, rank: 'SK (Скелет)', value: 3, isSkeleton: true };
            const sk3: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 13), suit: card.suit, rank: 'SK (Скелет)', value: 3, isSkeleton: true };

            const spawnedPairs: TablePair[] = [
                { attack: card, attackerId: playerId },
                { attack: sk1, attackerId: playerId },
                { attack: sk2, attackerId: playerId },
                { attack: sk3, attackerId: playerId }
            ];

            return {
                ...state,
                players: updatedPlayers,
                table: [...state.table, ...spawnedPairs],
                turnPlayerId: state.defenderId,
                statusBanner: `🖤 Лицар смерті! ${playerName} атакував та випустив 3 Скелети на стіл!`
            };
        }

        // 4. NECROMANCER on attack
        if (card.isNecromancer) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    if (bonusCardsToAdd.length > 0) hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, powerPoints: p.powerPoints + powerPointsDelta, hand };
                }
                return p;
            });

            let newDiscard = [...state.discardPile];
            if (necromancerGhostCard) {
                newDiscard = newDiscard.slice(0, newDiscard.length - 1);
            }

            const sk1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 21), suit: card.suit, rank: 'SK (Скелет)', value: 3, isSkeleton: true };
            const sk2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 22), suit: card.suit, rank: 'SK (Скелет)', value: 3, isSkeleton: true };
            const zb1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 23), suit: card.suit, rank: 'ZB (Зомбі)', value: 4, isZombie: true };
            const zb2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 24), suit: card.suit, rank: 'ZB (Зомбі)', value: 4, isZombie: true };

            const spawnedPairs: TablePair[] = [
                { attack: card, attackerId: playerId },
                { attack: sk1, attackerId: playerId },
                { attack: sk2, attackerId: playerId },
                { attack: zb1, attackerId: playerId },
                { attack: zb2, attackerId: playerId }
            ];

            return {
                ...state,
                players: updatedPlayers,
                discardPile: newDiscard,
                table: [...state.table, ...spawnedPairs],
                turnPlayerId: state.defenderId,
                statusBanner: `🧙‍♂️ Некромант! ${playerName} викликав 2 Скелети і 2 Зомбі, отримав закляття Чіл тач, Перст смерті, Слово сили: Смерть${necromancerGhostCard ? ' та підняв Привида з відбою' : ''}!`
            };
        }

        // 5. LEADER / COMMANDER / GENERAL on attack
        if (card.isLeader || card.isCommander || card.isGeneral) {
            const spawnRank: Rank = card.isLeader ? '5' : (card.isCommander ? '7' : '9');
            const spawnVal = card.isLeader ? 5 : (card.isCommander ? 7 : 9);
            const title = card.isLeader ? 'Лідер' : (card.isCommander ? 'Командир' : 'Полководець');

            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    let hand = p.hand.filter(c => c.id !== card.id);
                    if (bonusCardsToAdd.length > 0) hand = [...hand, ...bonusCardsToAdd];
                    return { ...p, powerPoints: p.powerPoints + powerPointsDelta, hand };
                }
                return p;
            });

            const c1: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 31), suit: card.suit, rank: spawnRank, value: spawnVal };
            const c2: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 32), suit: card.suit, rank: spawnRank, value: spawnVal };
            const c3: Card = { id: Math.floor(Date.now() + Math.random() * 100000 + 33), suit: card.suit, rank: spawnRank, value: spawnVal };

            const spawnedPairs: TablePair[] = [
                { attack: card, attackerId: playerId },
                { attack: c1, attackerId: playerId },
                { attack: c2, attackerId: playerId },
                { attack: c3, attackerId: playerId }
            ];

            return {
                ...state,
                players: updatedPlayers,
                table: [...state.table, ...spawnedPairs],
                turnPlayerId: state.defenderId,
                statusBanner: `🎖️ ${title}! ${playerName} атакував та додав 3 карти '${spawnRank}' своєї масті!`
            };
        }

        // 6. PALADIN on attack
        if (card.isPaladin) {
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
                }
                return p;
            });

            return {
                ...state,
                players: updatedPlayers,
                table: [...state.table, { attack: card, attackerId: playerId }],
                turnPlayerId: state.defenderId,
                statusBanner: `⚔️ Паладин! Атаковано Паладином — тепер можна підкидати будь-які карти!`
            };
        }

        // 7. Normal Attack Play
        let wizardDrawn: Card[] = [];
        let newDeck = [...state.deck];
        const pDeck = (state.prikupDecks && state.prikupDecks[playerId]) ? state.prikupDecks[playerId] : newDeck;
        if (card.isWizard && !card.isIllusion && pDeck.length > 0) {
            wizardDrawn.push(pDeck.shift()!);
            if (pDeck.length > 0) wizardDrawn.push(pDeck.shift()!);
        }

        let newDiscard = [...state.discardPile];
        if (resurrectCard) {
            newDiscard = newDiscard.filter(c => c.id !== resurrectCard!.id);
        }
        if (necromancerGhostCard) {
            newDiscard = newDiscard.slice(0, newDiscard.length - 1);
        }

        const updatedPlayers = state.players.map(p => {
            if (p.id === playerId) {
                let hand = p.hand.filter(c => c.id !== card.id);
                if (bonusCardsToAdd.length > 0) hand = [...hand, ...bonusCardsToAdd];
                if (wizardDrawn.length > 0) hand = [...hand, ...wizardDrawn];
                if (resurrectCard) hand = [...hand, resurrectCard];
                if (empowerWeakestInHand) {
                    const firstNonEmp = hand.find(c => !c.isEmpowered);
                    if (firstNonEmp) {
                        hand = hand.map(c => c.id === firstNonEmp.id ? { ...c, isEmpowered: true } : c);
                    }
                }
                return { 
                    ...p, 
                    powerPoints: p.powerPoints + powerPointsDelta,
                    hand 
                };
            }
            return p;
        });

        const newTable = [...state.table, { attack: card, attackerId: playerId }];
        
        let nextTurnId = state.turnPlayerId;
        if (!state.isTaking) {
            nextTurnId = state.defenderId;
        }

        return {
            ...state,
            deck: newDeck,
            discardPile: newDiscard,
            players: updatedPlayers,
            table: newTable,
            turnPlayerId: nextTurnId,
            statusBanner: statusMsg || state.statusBanner
        };
    }


export const playCardAndLog = (state: GameState, card: Card, playerId: number, targetCardId?: number): GameState => {
    const player = state.players.find(p => p.id === playerId);
    const playerName = player ? player.name : 'Гравець';
    
    let logText = "";
    let logType: CombatLogEntry['type'] = 'attack';
    
    if (state.turnPlayerId === state.defenderId) {
        const undefPair = state.table.find(p => !p.defense);
        const cardDisplay = `[${card.rank}${card.suit}]`;
        const targetDisplay = undefPair ? `[${undefPair.attack.rank}${undefPair.attack.suit}]` : '';
        logText = `🛡️ ${playerName} захищається картою ${cardDisplay} проти ${targetDisplay}.`;
        logType = 'defense';
    } else {
        const cardDisplay = `[${card.rank}${card.suit}]`;
        logText = `⚔️ ${playerName} атакує картою ${cardDisplay}.`;
        logType = 'attack';
    }

    if (isInstantSpellCard(card)) {
        logText = `🔮 ${playerName} застосовує закляття [${card.rank}${card.suit}].`;
        logType = 'spell';
    }

    let newState = playCardState(state, card, playerId, targetCardId);
    newState = addLog(newState, logText, logType);
    
    if (newState.statusBanner && newState.statusBanner !== state.statusBanner) {
        if (!newState.statusBanner.includes("побив карту") && !newState.statusBanner.includes("Залишилося відбити")) {
            newState = addLog(newState, newState.statusBanner, 'spell');
        }
    }
    
    return newState;
};

export const takeCardsState = (state: GameState): GameState => {
    const coAttackers = state.players.filter(p => p.id !== state.defenderId && !p.outRank && p.hand.length > 0);
    
    if (coAttackers.length === 0) {
        return finishBoutState({ ...state, isTaking: true }, 'take');
    }

    const primaryAttacker = coAttackers.find(p => p.id === state.attackerId);
    const nextTurnId = primaryAttacker ? primaryAttacker.id : coAttackers[0].id;
    const defender = state.players.find(p => p.id === state.defenderId);
    const defName = defender ? defender.name : 'Захисник';

    const resState = {
        ...state,
        isTaking: true,
        passedPlayers: [],
        turnPlayerId: nextTurnId,
        statusBanner: `📥 ${defName} бере карти! Атакуючі можуть підкинути карти.`
    };
    return addLog(resState, `📥 ${defName} здається й бере карти! Атакуючі мають шанс підкинути карти.`, 'take');
};

export const runBotTurn = (state: GameState): GameState => {
    const turnPlayer = state.players.find(p => p.id === state.turnPlayerId);
    if (!turnPlayer || turnPlayer.isHuman || turnPlayer.outRank || turnPlayer.isEliminated || state.gameOver) {
        return state;
    }

    const tryPlayCard = (currentState: GameState, cardToPlay: Card, playerId: number): GameState | null => {
        const nextState = playCardAndLog(currentState, cardToPlay, playerId);
        if (nextState === currentState) return null;
        if (nextState.statusBanner && nextState.statusBanner.startsWith('❌')) return null;
        return nextState;
    };

    // Bot instant spells check (e.g. Health elixir if low HP, immortality, summon, or endTurn)
    const eternalCount = state.eternalDiscardPile?.length || 0;
    const instantSpells = turnPlayer.hand.filter(c => {
        if (!isInstantSpellCard(c)) return false;
        const req = getRequiredEternalDiscardCount(c);
        if (req > 0 && eternalCount < req) return false;
        return true;
    });
    if (instantSpells.length > 0) {
        const healSpell = instantSpells.find(c => c.isHealthElixir && (turnPlayer.health ?? 500) < 400);
        if (healSpell) {
            const res = tryPlayCard(state, healSpell, turnPlayer.id);
            if (res) return res;
        }
        const boostSpell = instantSpells.find(c => c.isWeakStrengthBoostSpell || c.isStrengthBoostSpell || c.isStrongStrengthBoostSpell);
        if (boostSpell && (!turnPlayer.strengthBoost || turnPlayer.strengthBoost === 0)) {
            const res = tryPlayCard(state, boostSpell, turnPlayer.id);
            if (res) return res;
        }
        const summonSpells = instantSpells.filter(c => c.isSummonGhostSpell || c.isSummonSkeletonsSpell || c.isSummonZombiesSpell || c.isSummonGolemSpell || c.isSummonAnimatronicSpell || c.isSummonAutomatonSpell);
        if (summonSpells.length > 0 && Math.random() < 0.6) {
            for (const summonSpell of summonSpells) {
                const res = tryPlayCard(state, summonSpell, turnPlayer.id);
                if (res) return res;
            }
        }
    }

    // Bot shop buy logic if bot has enough power points
    if (turnPlayer.powerPoints >= 2 && Math.random() < 0.4) {
        const affordable: (keyof ShopStock)[] = [];
        if (turnPlayer.powerPoints >= 4) affordable.push('immortality', 'strongStrengthBoost');
        if (turnPlayer.powerPoints >= 3) affordable.push('summonSkeletons', 'summonZombies');
        if (turnPlayer.powerPoints >= 2) affordable.push('summonGhost', 'strengthBoost');
        if (turnPlayer.powerPoints >= 1) affordable.push('weakStrengthBoost');
        if (turnPlayer.powerPoints >= 2) affordable.push('spells');
        if (affordable.length > 0) {
            const chosen = affordable[Math.floor(Math.random() * affordable.length)];
            return buyShopItemState(state, turnPlayer.id, chosen);
        }
    }

    // If bot is Defender
    if (turnPlayer.id === state.defenderId) {
        const undefPair = state.table.find(p => !p.defense);
        if (undefPair) {
            // 1. Try natural defense cards in priority order
            const defenseCards = getSortedDefenseCards(undefPair.attack, turnPlayer.hand, state.actualTrumpSuits, SENIOR_SUIT, turnPlayer.strengthBoost || 0);
            for (const defCard of defenseCards) {
                const res = tryPlayCard(state, defCard, turnPlayer.id);
                if (res) {
                    return res;
                }
            }
            
            // 2. If natural cards cannot be played/forced, check if bot can empower another candidate card
            if (turnPlayer.powerPoints > 0) {
                const empCandidates = getSortedEmpoweredDefenseCandidates(undefPair.attack, turnPlayer.hand, state.actualTrumpSuits, SENIOR_SUIT);
                for (const c of empCandidates) {
                    const empCard = { ...c, isEmpowered: true };
                    const updatedPlayers = state.players.map(p => {
                        if (p.id === turnPlayer.id) {
                            return {
                                ...p,
                                powerPoints: p.powerPoints - 1,
                                hand: p.hand.map(hc => hc.id === c.id ? empCard : hc)
                            };
                        }
                        return p;
                    });
                    const stateWithEmpower = { ...state, players: updatedPlayers };
                    const res = tryPlayCard(stateWithEmpower, empCard, turnPlayer.id);
                    if (res) {
                        return res;
                    }
                    // If this empowered card fails/cannot be applied, loop continues to pick another card!
                }
            }

            // Cannot beat with any card -> Take cards
            return takeCardsState(state);
        } else {
            // Nothing to defend, pass turn or wait
            return passTurnState(state, turnPlayer.id);
        }
    }

    // If bot is Attacker / Co-attacker
    const defender = state.players.find(p => p.id === state.defenderId);
    const initialDefenderHand = defender ? defender.hand.length + state.table.filter(p => p.defense).length : 6;
    const maxAttacks = Math.min(6, initialDefenderHand);

    if (state.table.length < maxAttacks && !state.isLockedByGrandmaster) {
        const attackCards = getSortedAttackCards(turnPlayer.hand, state.table, state.actualTrumpSuits, state.isLockedByGrandmaster, state.eternalDiscardPile?.length || 0);
        for (const attackCard of attackCards) {
            const res = tryPlayCard(state, attackCard, turnPlayer.id);
            if (res) {
                return res;
            }
            // If this card cannot be played, loop continues to pick another card!
        }
    }

    // No attack possible -> Pass
    return passTurnState(state, turnPlayer.id);
};


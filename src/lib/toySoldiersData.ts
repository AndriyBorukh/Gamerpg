import { ToySoldier, HiredCompanion, ArmySquad, CharacterGender } from '../types';
import { COMPANION_CLASSES } from './companionClasses';

export interface DecompressOptions {
    chosenClassId?: string;
    chosenGender?: CharacterGender;
    chosenName?: string;
    chosenAvatar?: string;
}

export function getGenderedCompanionTitle(classId: string, gender: CharacterGender = 'male'): string {
    const isFemale = gender === 'female';
    switch (classId) {
        case 'paladin': return isFemale ? 'Священна Паладинка Світла' : 'Священний Лицар Світла';
        case 'swordsman': return isFemale ? 'Майстриня Клинка' : 'Майстер Клинка';
        case 'hunter': return isFemale ? 'Влучна Стрільчиня' : 'Влучний Слідопит';
        case 'sniper': return isFemale ? 'Королівська Снайперка' : 'Королівський Снайпер';
        case 'crossbowman': return isFemale ? 'Майстриня Арбалету' : 'Майстер Арбалету';
        case 'ranger': return isFemale ? 'Рейнджерка Лісів' : 'Рейнджер Лісів';
        case 'assassin': return isFemale ? 'Майстриня Тіньового Клинка' : 'Майстер Тіньового Клинка';
        case 'ninja': return isFemale ? 'Тіньова Куноїчі' : 'Ніндзя Тіні';
        case 'thief': return isFemale ? 'Спритна Злодійка' : 'Спритний Злодій';
        case 'elementalist': return isFemale ? 'Володарка Стихій' : 'Володар Стихій';
        case 'sorcerer':
        case 'wizard': return isFemale ? 'Велика Архімагиня' : 'Великий Архімаг';
        case 'pyromancer': return isFemale ? 'Володарка Полум\'я' : 'Володар Полум\'я';
        case 'cryomancer': return isFemale ? 'Крижана Чарівниця' : 'Крижаний Чаклун';
        case 'necromancer': return isFemale ? 'Некромантка Темряви' : 'Некромант Темряви';
        case 'druid': return isFemale ? 'Хранителька Природи' : 'Хранитель Природи';
        case 'shaman': return isFemale ? 'Шаманка Духів' : 'Шаман Духів';
        case 'warlock': return isFemale ? 'Темна Чаклунка' : 'Темний Чаклун';
        case 'priest': return isFemale ? 'Священна Жриця' : 'Священний Жрець';
        case 'guardian': return isFemale ? 'Гвардійка Бастіону' : 'Гвардієць Бастіону';
        case 'shieldbearer': return isFemale ? 'Непохитна Щитоносиця' : 'Непохитний Щитоносець';
        case 'barbarian': return isFemale ? 'Люта Варварка' : 'Лютий Варвар';
        case 'berserker': return isFemale ? 'Шалена Берсеркерка' : 'Шалений Берсерк';
        case 'commander': return isFemale ? 'Командирка Легіону' : 'Командир Легіону';
        case 'tactician': return isFemale ? 'Гросмейстерка Тактики' : 'Гросмейстер Тактики';
        case 'duelist': return isFemale ? 'Неперевершена Дуелянтка' : 'Неперевершений Дуелянт';
        case 'cataphract': return isFemale ? 'Броньована Вершниця' : 'Броньований Катафракт';
        case 'samurai': return isFemale ? 'Благородна Самурайка' : 'Благородний Самурай';
        case 'alchemist': return isFemale ? 'Гранд-майстриня Алхімії' : 'Гранд-майстер Алхімії';
        default: {
            const cDef = COMPANION_CLASSES[classId];
            return cDef ? cDef.name : (isFemale ? 'Славна Воїтелька' : 'Славний Воїн');
        }
    }
}

export function normalizeSoldierType(type?: string): string {
    if (!type) return 'піхотинець';
    const lower = type.toLowerCase();
    if (lower.includes('військов') || lower.includes('military') || lower.includes('120')) return 'військова_шашка_загін';
    if (lower.includes('шашка_загін') || lower.includes('загін') || lower.includes('checkers_squad') || lower.includes('g16') || lower.includes('армійськ')) return 'шашка_загін';
    if (lower.includes('рпг_карт') || lower.includes('rpg_card')) return 'рпг_карти_40';
    if (lower.includes('магічний_пішак') || lower.includes('magic_pawn') || lower.includes('маг_пішак')) return 'магічний_пішак';
    if (lower.includes('шашк') || lower.includes('checker')) return 'шашка';
    if (lower.includes('пішак') || lower.includes('pawn')) return 'пішак';
    if (lower.includes('стрілець') || lower.includes('лучник') || lower.includes('archer')) return 'стрілець';
    if (lower.includes('щит') || lower.includes('списоносець') || lower.includes('defender') || lower.includes('захисник')) return 'щитоносець';
    if (lower.includes('важкий') || lower.includes('лицар') || lower.includes('knight')) return 'важкий_лицар';
    if (lower.includes('гвардієць') || lower.includes('варта') || lower.includes('guard')) return 'гвардієць';
    if (lower.includes('берсерк') || lower.includes('berserk')) return 'берсерк';
    if (lower.includes('маг') || lower.includes('mage') || lower.includes('wizard')) return 'маг';
    if (lower.includes('клірик') || lower.includes('cleric') || lower.includes('священик') || lower.includes('целитель')) return 'клірик';
    if (lower.includes('вершник') || lower.includes('кавалерія') || lower.includes('rider') || lower.includes('кінотник') || lower.includes('кіннотник')) return 'вершник';
    if (lower.includes('арбалет') || lower.includes('crossbow')) return 'арбалетник';
    if (lower.includes('асасин') || lower.includes('шпигун') || lower.includes('ниндзя') || lower.includes('assassin') || lower.includes('ninja')) return 'асасин';
    if (lower.includes('алхімік') || lower.includes('бомбардир') || lower.includes('гренадер') || lower.includes('alchemist') || lower.includes('bomb')) return 'алхімік';
    if (lower.includes('паладин') || lower.includes('чернець') || lower.includes('paladin') || lower.includes('monk')) return 'паладин';
    return 'піхотинець';
}

// Get base max HP based on unit type
export function getSoldierBaseHp(rawType?: string): number {
    const type = normalizeSoldierType(rawType);
    switch (type) {
        case 'стрілець':
        case 'асасин':
            return 2;
        case 'важкий_лицар':
        case 'берсерк':
        case 'паладин':
            return 4;
        case 'піхотинець':
        case 'щитоносець':
        case 'гвардієць':
        case 'маг':
        case 'клірик':
        case 'вершник':
        case 'арбалетник':
        case 'алхімік':
        default:
            return 3;
    }
}

// Calculate effective max HP for a soldier based on base HP and level
export function getSoldierMaxHp(soldier: ToySoldier): number {
    const baseHp = getSoldierBaseHp(soldier.type);
    return baseHp + (soldier.level >= 3 ? 1 : 0);
}

// Base defense modifier from unit type
export function getSoldierBaseDefenseBonus(rawType?: string): number {
    const type = normalizeSoldierType(rawType);
    switch (type) {
        case 'щитоносець':
        case 'важкий_лицар':
        case 'паладин':
            return 1;
        case 'берсерк':
        case 'маг':
        case 'клірик':
        case 'алхімік':
            return -1;
        default:
            return 0;
    }
}

// Total defense bonus (base + level bonus)
export function getSoldierDefenseBonus(soldier: ToySoldier): number {
    const baseDef = getSoldierBaseDefenseBonus(soldier.type);
    return baseDef + (soldier.level >= 2 ? 1 : 0);
}

// Attack roll modifier based on distance & soldier type
export function getSoldierAttackModifier(rawType: string | undefined, distance: number): number | null {
    if (distance < 1 || distance > 3) return null; // out of range
    const type = normalizeSoldierType(rawType);

    // Distance 1 (Melee):
    if (distance === 1) {
        switch (type) {
            case 'стрілець': return -1;
            case 'арбалетник': return -2;
            case 'асасин': return 2;
            case 'алхімік': return -1;
            case 'паладин': return 1;
            case 'гвардієць': return 1;
            case 'берсерк': return 1;
            case 'маг': return -3;
            case 'клірик': return -1;
            default: return 0; // піхотинець, щитоносець, важкий_лицар, вершник
        }
    }

    // Distance 2 (Short Ranged Attack):
    if (distance === 2) {
        switch (type) {
            case 'щитоносець': return null; // немає дальньої атаки
            case 'берсерк': return null; // немає дальньої атаки
            case 'асасин': return null; // немає дальньої атаки
            case 'стрілець': return 1;
            case 'арбалетник': return 2;
            case 'алхімік': return 1;
            case 'паладин': return -1;
            case 'гвардієць': return -1;
            case 'маг': return -2;
            case 'клірик': return -2;
            default: return -1; // піхотинець, важкий_лицар, вершник
        }
    }

    // Distance 3 (Long Ranged Attack):
    if (distance === 3) {
        switch (type) {
            case 'щитоносець': return null; // немає дальньої атаки
            case 'берсерк': return null; // немає дальньої атаки
            case 'асасин': return null; // немає дальньої атаки
            case 'паладин': return null; // немає далекої атаки
            case 'стрілець': return 0;
            case 'арбалетник': return 1;
            case 'алхімік': return 1;
            case 'гвардієць': return -1;
            case 'маг': return -2;
            case 'клірик': return -2;
            default: return -2; // піхотинець, важкий_лицар, вершник
        }
    }

    return null;
}

// Max move distance (cells per turn: 4 for all, 6 for knight, 8 for horseman/cavalry)
export function getSoldierMaxMoveDistance(rawType?: string): number {
    const type = normalizeSoldierType(rawType);
    if (type === 'вершник') return 8;
    if (type === 'важкий_лицар') return 6;
    if (type === 'асасин') return 6;
    if (type === 'паладин') return 5;
    return 4;
}

// Attack roll bonus from level (Level >= 1 gives +1)
export function getSoldierAttackBonus(soldier: ToySoldier): number {
    return soldier.level >= 1 ? 1 : 0;
}

// Distance calculation: Chebyshev distance max(|dx|, |dy|)
export function getGridDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

// Backward compatibility
export function getRangeAttackModifier(distance: number, rawType?: string): number | null {
    return getSoldierAttackModifier(rawType, distance);
}

// Level thresholds for checkers / toy soldiers:
// Рівень 1: 20 XP
// Рівень 2: 40 XP (поріг множиться на 2)
// Рівень 3: 80 XP (поріг множиться на 2)
// Рівень 4: 160 XP (поріг множиться на 2 - готовність до декомпресії)
export function getExpThresholdForLevel(level: number): number {
    if (level <= 0) return 0;
    return 20 * Math.pow(2, level - 1);
}

export function calculateLevelFromExp(experience: number): number {
    if (experience < 20) return 0;
    let lvl = 1;
    while (experience >= getExpThresholdForLevel(lvl + 1)) {
        lvl++;
    }
    return Math.min(4, lvl);
}

export function getNextLevelExpThreshold(currentExp: number): { currentLevel: number; nextLevel: number; nextThreshold: number; expRemaining: number } {
    const currentLevel = calculateLevelFromExp(currentExp);
    if (currentLevel >= 4) {
        return { currentLevel, nextLevel: 4, nextThreshold: 160, expRemaining: 0 };
    }
    const nextLevel = currentLevel + 1;
    const nextThreshold = getExpThresholdForLevel(nextLevel);
    const expRemaining = Math.max(0, nextThreshold - currentExp);
    return { currentLevel, nextLevel, nextThreshold, expRemaining };
}

export function calculateSoldierLevel(experience: number): number {
    return calculateLevelFromExp(experience);
}

// Starter soldiers
export const DEFAULT_STARTER_TOY_SOLDIERS: ToySoldier[] = [
    {
        id: 'toy_recruit_1',
        name: 'Олов\'яний піхотинець',
        avatar: '⚔️',
        level: 0,
        experience: 0,
        deaths: 0,
        maxHp: 3,
        type: 'піхотинець',
        cost: 25
    },
    {
        id: 'toy_recruit_2',
        name: 'Олов\'яний стрілець',
        avatar: '🏹',
        level: 0,
        experience: 0,
        deaths: 0,
        maxHp: 2,
        type: 'стрілець',
        cost: 30
    },
    {
        id: 'toy_recruit_3',
        name: 'Олов\'яний щитоносець',
        avatar: '🛡️',
        level: 0,
        experience: 0,
        deaths: 0,
        maxHp: 3,
        type: 'щитоносець',
        cost: 30
    },
    {
        id: 'toy_recruit_4',
        name: 'Королівський гвардієць',
        avatar: '💂‍♂️',
        level: 0,
        experience: 0,
        deaths: 0,
        maxHp: 3,
        type: 'гвардієць',
        cost: 35
    },
    {
        id: 'toy_recruit_5',
        name: 'Залізний важкий лицар',
        avatar: '🤺',
        level: 0,
        experience: 0,
        deaths: 0,
        maxHp: 4,
        type: 'важкий_лицар',
        cost: 45
    }
];

export const TOY_SHOP_CATALOG: Omit<ToySoldier, 'id' | 'level' | 'experience' | 'deaths'>[] = [
    {
        name: '40 випадкових карт для РПГ дуелей',
        avatar: '🎴📦',
        maxHp: 1,
        type: 'рпг_карти_40',
        cost: 60,
        description: 'Комплект із 40 випадкових бойових карт (числа, фігури, закляття, козирі) для поповнення вашої колоди РПГ дуелей!'
    },
    {
        name: 'Магічний бойовий пішак',
        avatar: '🧙‍♂️♟️',
        maxHp: 2,
        type: 'магічний_пішак',
        cost: 20,
        description: '2 HP • Для Магічних Пішаків 8х8 (потрібно 24 шт). Двобої проходять за правилами Бою Чаклунів! 20 XP = декомпресія!'
    },
    {
        name: 'Набір магічних бойових пішаків (24 шт)',
        avatar: '🧙‍♂️📦',
        maxHp: 2,
        type: 'магічний_пішак_набір',
        cost: 350,
        description: 'Повний комплект з 24 магічних бойових пішаків для чаклунської битви на дошці!'
    },
    {
        name: 'Бойова шашка',
        avatar: '🔴',
        maxHp: 1,
        type: 'шашка',
        cost: 15,
        description: '1 шт • Для бойових шашок 8х8 (потрібно 12 шт). 20 XP = 1-й рівень, поріг подвоюється до 4-го рівня (160 XP = декомпресія у супутника)!'
    },
    {
        name: 'Набір бойових шашок (12 шт)',
        avatar: '🔴📦',
        maxHp: 1,
        type: 'шашка_набір',
        cost: 150,
        description: 'Повний комплект з 12 бойових шашок для моментального старту гри!'
    },
    {
        name: 'Бойовий пішак',
        avatar: '♟️',
        maxHp: 1,
        type: 'пішак',
        cost: 10,
        description: '1 шт • Для бойових пішаків 8х8 (потрібно 24 шт). 20 XP = декомпресія у супутника!'
    },
    {
        name: 'Набір бойових пішаків (24 шт)',
        avatar: '♟️📦',
        maxHp: 1,
        type: 'пішак_набір',
        cost: 200,
        description: 'Повний комплект з 24 бойових пішаків (3 ряди) для старту гри!'
    },
    {
        name: 'Олов\'яний піхотинець',
        avatar: '⚔️',
        maxHp: 3,
        type: 'піхотинець',
        cost: 25,
        description: '3 HP • Дальня атака (-1/-2) • Ближня (0)'
    },
    {
        name: 'Дерев\'яний стрілець',
        avatar: '🏹',
        maxHp: 2,
        type: 'стрілець',
        cost: 30,
        description: '2 HP • Дальня атака (+1/0) • Ближня (-1)'
    },
    {
        name: 'Бронзовий щитоносець',
        avatar: '🛡️',
        maxHp: 3,
        type: 'щитоносець',
        cost: 35,
        description: '3 HP • Захист +1 • Без дальньої атаки'
    },
    {
        name: 'Залізний важкий лицар',
        avatar: '🤺',
        maxHp: 4,
        type: 'важкий_лицар',
        cost: 45,
        description: '4 HP • Захист +1 • Рух 6 кл • Дальня атака (-1/-2)'
    },
    {
        name: 'Королівський гвардієць',
        avatar: '💂‍♂️',
        maxHp: 3,
        type: 'гвардієць',
        cost: 50,
        description: '3 HP • Ближня (+1) • Дальня (-1/-1)'
    },
    {
        name: 'Олов\'яний лютий берсерк',
        avatar: '🪓',
        maxHp: 4,
        type: 'берсерк',
        cost: 50,
        description: '4 HP • Ближня (+1) • Захист -1 • Без дальньої атаки'
    },
    {
        name: 'Міні-маг олов\'яного ордену',
        avatar: '🧙‍♂️',
        maxHp: 3,
        type: 'маг',
        cost: 60,
        description: '3 HP • Захист -1 • Магічний заряд (+1 к атаці, 1р/бій)'
    },
    {
        name: 'Целитель-клірик',
        avatar: '📿',
        maxHp: 3,
        type: 'клірик',
        cost: 55,
        description: '3 HP • Захист -1 • Зцілення (+1 HP союзнику, 1р/бій)'
    },
    {
        name: 'Олов\'яний вершник',
        avatar: '🐎',
        maxHp: 3,
        type: 'вершник',
        cost: 65,
        description: '3 HP • Рух на 8 клітинок! • Дальня (-1/-2)'
    },
    {
        name: 'Важкий олов\'яний арбалетник',
        avatar: '🎯',
        maxHp: 3,
        type: 'арбалетник',
        cost: 45,
        description: '3 HP • Потужний арбалет (+2 на 2 кл, +1 на 3 кл, -2 в ближньому)'
    },
    {
        name: 'Тіньовий авангардний асасин',
        avatar: '🥷',
        maxHp: 2,
        type: 'асасин',
        cost: 55,
        description: '2 HP • Швидкісний рух 6 кл • Смертоносний ніж (+2 в ближньому) • Без дальнього бою'
    },
    {
        name: 'Запальний олов\'яний алхімік',
        avatar: '💣',
        maxHp: 3,
        type: 'алхімік',
        cost: 60,
        description: '3 HP • Захист -1 • Вибухові склянки (+1 на 2 і 3 кл) • Вибуховий заряд (+1 атака, 1р/бій)'
    },
    {
        name: 'Священний олов\'яний паладин',
        avatar: '⚜️',
        maxHp: 4,
        type: 'паладин',
        cost: 70,
        description: '4 HP • Захист +1 • Рух 5 кл • Ближній бій (+1) • Аура щита (+1 захист, 1р/бій)'
    },
    {
        name: 'Армійська Шашка-Загін (12 бійців)',
        avatar: '🔴',
        maxHp: 3,
        type: 'шашка_загін',
        cost: 120,
        description: 'Армійська шашка-загін з 12 бійців для Армійських шашок • 3 HP кожна • Прокачується до 4+ рівня • Тільки для Армійських шашок!'
    },
    {
        name: 'Королівський Арсенал Армійських Шашок (12 загонів)',
        avatar: '👑',
        maxHp: 3,
        type: 'шашка_загін_набір',
        cost: 600,
        description: 'Повний набір з 12 армійських шашок-загонів для Армійських шашок на 8x8 дошці!'
    },
    {
        name: 'Військова Шашка-Загін (120 бійців)',
        avatar: '🛡️',
        maxHp: 1,
        type: 'військова_шашка_загін',
        cost: 150,
        description: 'Військова шашка-загін зі 120 бійців для Військових та Аранійських військових шашок • Битва монет • Перекидання монет на 1-2 рівнях • Декомпресія на 4 рівні!'
    },
    {
        name: 'Легіон Військових Шашок (12 загонів)',
        avatar: '🪙',
        maxHp: 1,
        type: 'військова_шашка_загін_набір',
        cost: 750,
        description: 'Повний легіон з 12 військових шашок-загонів (по 120 бійців у кожному) для Військових та Аранійських військових шашок!'
    }
];

// Helper functions for Army Checkers Squads (Армійські шашки)
export function getCheckersSquadMaxHp(squad: ToySoldier): number {
    let hp = 3; // Base HP
    if (squad.level >= 1) hp += 1;
    if (squad.level >= 3) hp += 1;
    if (squad.level >= 4) hp += 1;
    return hp;
}

export function getCheckersSquadMaxSoldiers(squad: ToySoldier): number {
    let max = 12; // Base capacity
    if (squad.level >= 2) max += 1; // Level 2 grants +1 slot
    return max;
}

export function applySquadExpAndLevelUp(squad: ToySoldier, expGained: number): { updatedSquad: ToySoldier; leveledUp: boolean } {
    const oldLvl = squad.level || 0;
    const newExp = (squad.experience || 0) + expGained;
    const newLvl = calculateLevelFromExp(newExp);

    let soldierHps = squad.soldierHps && squad.soldierHps.length > 0
        ? [...squad.soldierHps]
        : Array(squad.soldiersCount || 12).fill(getCheckersSquadMaxHp({ ...squad, level: oldLvl }));

    if (newLvl > oldLvl) {
        for (let lvl = oldLvl + 1; lvl <= newLvl; lvl++) {
            const newMaxHp = getCheckersSquadMaxHp({ ...squad, level: lvl });
            // Restore +1 HP to all surviving soldiers on level up
            soldierHps = soldierHps.map(hp => Math.min(newMaxHp, hp + 1));

            // Level 2 grants +1 extra soldier slot if squad has space
            if (lvl === 2 && soldierHps.length < getCheckersSquadMaxSoldiers({ ...squad, level: lvl })) {
                soldierHps.push(newMaxHp);
            }
        }
    }

    const leveledUp = newLvl > oldLvl;
    const updatedSquad: ToySoldier = {
        ...squad,
        level: newLvl,
        experience: newExp,
        soldiersCount: soldierHps.length,
        soldierHps
    };

    return { updatedSquad, leveledUp };
}

export function createCheckersSquad(name: string, avatar: string = '🔴', cost: number = 120, idxSuffix: number = 0): ToySoldier {
    const maxSoldiers = 12;
    const baseHp = 3;
    return {
        id: `checkers_squad_${Date.now()}_${idxSuffix}_${Math.floor(Math.random() * 100000)}`,
        name,
        avatar,
        level: 0,
        experience: 0,
        deaths: 0,
        maxHp: baseHp,
        type: 'шашка_загін',
        cost,
        isCheckersSquad: true,
        soldiersCount: maxSoldiers,
        maxSoldiers: maxSoldiers,
        soldierMaxHp: baseHp,
        soldierHps: Array(maxSoldiers).fill(baseHp)
    };
}

export function createStarterCheckersSquads12(prefix: string = 'Гравець'): ToySoldier[] {
    const avatars = ['🔴', '🔵', '🟣', '🟢', '🟡', '🟠', '🔴', '🔵', '🟣', '🟢', '🟡', '🟠'];
    return Array.from({ length: 12 }).map((_, i) => createCheckersSquad(`${prefix} Загін #${i + 1}`, avatars[i % avatars.length], 120, i));
}

export function decompressCheckersSquadToCompanions(squad: ToySoldier, options?: DecompressOptions): HiredCompanion[] {
    const livingCount = squad.soldiersCount ?? (squad.soldierHps?.length || 12);
    const companions: HiredCompanion[] = [];
    const classId = options?.chosenClassId || 'paladin';
    const gender: CharacterGender = options?.chosenGender || squad.gender || 'male';
    const defaultAvatar = gender === 'female' ? '🧝‍♀️' : (squad.avatar || '🔴');
    const avatar = options?.chosenAvatar || defaultAvatar;

    for (let i = 0; i < livingCount; i++) {
        const title = getGenderedCompanionTitle(classId, gender);
        const baseName = options?.chosenName || squad.name;
        const name = livingCount === 1 ? baseName : `${baseName} — ${gender === 'female' ? 'Бійчиня' : 'Боєць'} #${i + 1}`;

        companions.push({
            id: `decompressed_checkers_squad_${squad.id}_${i + 1}_${Date.now()}`,
            name: name,
            title: `${title} (${gender === 'female' ? 'Гвардійка' : 'Гвардієць'})`,
            avatar: avatar,
            gender: gender,
            companionClassId: classId,
            type: 'champion',
            rank: 3,
            difficulty: 'hard',
            flavorQuote: `«Один з уцілілих воїнів славетної армійської шашки-загону ${squad.name}, що пройшов Армійські шашки!»`,
            description: `Декомпресований боєць зі звання Армійської Шашки-Загону (${squad.name}). Загартований у 8x8 битві. Клас: ${COMPANION_CLASSES[classId]?.name || classId}.`,
            hp: 130 + (squad.level * 8),
            baseHp: 130 + (squad.level * 8),
            armor: 24 + squad.level,
            powerPoints: 30,
            strength: 16 + squad.level,
            agility: 14 + squad.level,
            rewards: {
                gold: 100,
                powerPoints: 40,
                reputation: 25,
                xp: 150
            },
            level: Math.max(1, squad.level),
            xp: 0,
            xpToNextLevel: 400,
            maxAbilityCharges: 3,
            currentAbilityCharges: 3,
            survivalProbability: 95,
            isDead: false
        });
    }

    return companions;
}

// Decompress a Level 4 / 20 XP Toy Unit into a real HiredCompanion
export function decompressSoldierToCompanion(soldier: ToySoldier, options?: DecompressOptions): HiredCompanion {
    const companionId = `decompressed_${soldier.id}_${Date.now()}`;
    const type = normalizeSoldierType(soldier.type);

    let defaultClass = 'paladin';
    if (type === 'магічний_пішак') defaultClass = 'sorcerer';
    else if (type === 'арбалетник' || type === 'стрілець') defaultClass = 'hunter';
    else if (type === 'асасин') defaultClass = 'assassin';
    else if (type === 'алхімік') defaultClass = 'alchemist';
    else if (type === 'берсерк') defaultClass = 'berserker';
    else if (type === 'щитоносець') defaultClass = 'shieldbearer';
    else if (type === 'паладин') defaultClass = 'paladin';

    const classId = options?.chosenClassId || defaultClass;
    const gender: CharacterGender = options?.chosenGender || soldier.gender || 'male';
    const title = getGenderedCompanionTitle(classId, gender);
    const defaultAvatar = gender === 'female' ? '🧝‍♀️' : (soldier.avatar || '⚔️');
    const avatar = options?.chosenAvatar || defaultAvatar;
    const name = options?.chosenName || `${soldier.name} (Декомпресований)`;

    // Adapt base stats by class archetypes
    let hp = 145;
    let armor = 28;
    let powerPoints = 35;
    let strength = 20;
    let agility = 16;

    if (['guardian', 'paladin', 'shieldbearer', 'cataphract'].includes(classId)) {
        hp = 160;
        armor = 32;
        strength = 22;
        agility = 14;
    } else if (['hunter', 'sniper', 'crossbowman', 'ranger'].includes(classId)) {
        hp = 135;
        armor = 22;
        strength = 17;
        agility = 24;
    } else if (['assassin', 'ninja', 'thief', 'saboteur'].includes(classId)) {
        hp = 135;
        armor = 20;
        strength = 19;
        agility = 25;
    } else if (['sorcerer', 'wizard', 'elementalist', 'pyromancer', 'cryomancer', 'necromancer', 'druid', 'priest'].includes(classId)) {
        hp = 130;
        armor = 18;
        powerPoints = 55;
        strength = 14;
        agility = 16;
    }

    const classDef = COMPANION_CLASSES[classId];
    const flavor = classDef 
        ? `«${classDef.name}: ${classDef.description} Вміння: ${classDef.abilityName} (${classDef.abilityDescription})»`
        : '«З іграшкової фігурки — до легендарного воїна на полі брані!»';

    return {
        id: companionId,
        name: name,
        title: title,
        avatar: avatar,
        gender: gender,
        companionClassId: classId,
        type: 'champion',
        rank: 4,
        difficulty: 'hard',
        flavorQuote: flavor,
        description: `Колишня іграшка (${soldier.name}), яка накопичила ${soldier.experience} XP і була збільшена майстром декомпресії. Стать: ${gender === 'female' ? 'Жіноча' : 'Чоловіча'}, Клас: ${classDef?.name || classId}.`,
        hp: hp,
        baseHp: hp,
        armor: armor,
        powerPoints: powerPoints,
        strength: strength,
        agility: agility,
        rewards: {
            gold: 120,
            powerPoints: 45,
            reputation: 30,
            xp: 180
        },
        level: 4,
        xp: 0,
        xpToNextLevel: 400,
        maxAbilityCharges: 4,
        currentAbilityCharges: 4,
        survivalProbability: 95,
        isDead: false
    };
}

// -------------------------------------------------------------
// БИТВИ АРМІЙ (ARMY BATTLES) - СИСТЕМА ЗАГОНІВ ПО 5 СОЛДАТІВ
// -------------------------------------------------------------

export function getSquadMaxMoveDistance(type?: string): number {
    switch (type) {
        case 'вершники': return 8;
        case 'лицарі': return 6;
        case 'піхота':
        case 'стрільці':
        case 'щитоносці':
        case 'маги':
        default: return 4;
    }
}

export function getSquadAttackRange(type?: string): number {
    switch (type) {
        case 'стрільці':
        case 'маги': return 3;
        default: return 1; // Melee (adjacent)
    }
}

export function getSquadAttackBonus(squad: ArmySquad): number {
    let bonus = 0;
    if (squad.level >= 1) bonus += 1;
    if (squad.type === 'лицарі') bonus += 1;
    return bonus;
}

export function getSquadDefenseBonus(squad: ArmySquad): number {
    let bonus = 0;
    if (squad.level >= 2) bonus += 1;
    if (squad.type === 'щитоносці') bonus += 1;
    return bonus;
}

// Decompress an Army Squad into companions: returns exactly as many companions as living soldiers remained in the squad (1..5)!
export function decompressSquadToCompanions(squad: ArmySquad, options?: DecompressOptions): HiredCompanion[] {
    const companions: HiredCompanion[] = [];
    const count = Math.max(1, Math.min(5, squad.soldiersCount));
    const squadType = squad.type || 'піхота';

    const rankTitles: Record<string, string[]> = {
        'піхота': ['Сотник Піхоти', 'Ветеран-Десятник', 'Олов\'яний Мечник', 'Боєць Авангарду', 'Сміливий Рядовий'],
        'стрільці': ['Снайпер-Командор', 'Майстер Лучник', 'Королівський Стрілець', 'Влучний Слідопит', 'Пильний Дозорний'],
        'щитоносці': ['Лорд-Бастіон', 'Залізний Щитоносець', 'Непохитний Вартовий', 'Охоронець Лав', 'Стійкий Лаверник'],
        'лицарі': ['Лицар-Командор', 'Залізний Паладин', 'Важкий Мечник', 'Лицар-Ветеран', 'Зброєносець-Лис'],
        'маги': ['Архімаг Ордену', 'Бойовий Заклинач', 'Майстер Стихій', 'Вчений Чарівник', 'Адепт Полум\'я'],
        'вершники': ['Маршал Кавалерії', 'Капітан Вершників', 'Стрімкий Гусар', 'Кінний Розвідник', 'Вершник-Ветеран']
    };

    const companionClasses: Record<string, string> = {
        'піхота': 'paladin',
        'стрільці': 'hunter',
        'щитоносці': 'paladin',
        'лицарі': 'berserk',
        'маги': 'sorcerer',
        'вершники': 'paladin'
    };

    const avatars: Record<string, string[]> = {
        'піхота': ['⚔️', '🗡️', '🛡️', '🪓', '🎖️'],
        'стрільці': ['🏹', '🎯', '🦅', '🏹', '🎯'],
        'щитоносці': ['🛡️', '🏰', '🛡️', '🧱', '🛡️'],
        'лицарі': ['🤺', '⚜️', '⚡', '🤺', '⚔️'],
        'маги': ['🧙‍♂️', '🔮', '✨', '⚡', '🧙‍♂️'],
        'вершники': ['🐎', '🏇', '🐎', '⚡', '🏇']
    };

    const titles = rankTitles[squadType] || rankTitles['піхота'];
    const compClass = options?.chosenClassId || companionClasses[squadType] || 'paladin';
    const compAvatars = avatars[squadType] || avatars['піхота'];
    const gender: CharacterGender = options?.chosenGender || 'male';

    for (let i = 0; i < count; i++) {
        const title = titles[i] || `Воїн ${i + 1}-го рангу`;
        const avatar = options?.chosenAvatar || (gender === 'female' ? '🧝‍♀️' : (compAvatars[i] || squad.avatar));
        const compId = `squad_comp_${squad.id}_${Date.now()}_${i}`;
        const baseName = options?.chosenName || squad.name;
        const name = count === 1 ? baseName : `${baseName}: ${title}`;

        companions.push({
            id: compId,
            name: name,
            title: `${title} (${squad.level}★ рівень)`,
            avatar: avatar,
            gender: gender,
            companionClassId: compClass,
            type: 'champion',
            rank: 4,
            difficulty: 'hard',
            flavorQuote: `«Один із ${count} уцілілих героїв загону ${squad.name}, що пройшов крізь горнило Битви Армій!»`,
            description: `Декомпресований боєць зі славетного армійського загону (${squad.name}). Має ${squad.experience} XP та загартований у боях. Клас: ${COMPANION_CLASSES[compClass]?.name || compClass}.`,
            hp: 140 + (squad.level * 10),
            baseHp: 140 + (squad.level * 10),
            armor: 26 + (squad.level * 2),
            powerPoints: 35,
            strength: 18 + squad.level,
            agility: 15 + squad.level,
            rewards: {
                gold: 150,
                powerPoints: 50,
                reputation: 35,
                xp: 200
            },
            level: Math.max(1, squad.level),
            xp: 0,
            xpToNextLevel: 450,
            maxAbilityCharges: 4,
            currentAbilityCharges: 4,
            survivalProbability: 95,
            isDead: false
        });
    }

    return companions;
}

export const ARMY_SQUAD_CATALOG: {
    name: string;
    avatar: string;
    type: ArmySquad['type'];
    cost: number;
    description: string;
}[] = [
    {
        name: 'Загін олов\'яної піхоти (5 солдатів)',
        avatar: '⚔️',
        type: 'піхота',
        cost: 100,
        description: '5 бійців • Рух 4 кл. • Ближній бій. Кидає до 5 кубиків атаки/захисту!'
    },
    {
        name: 'Загін королівських стрільців (5 солдатів)',
        avatar: '🏹',
        type: 'стрільці',
        cost: 120,
        description: '5 бійців • Рух 4 кл. • Дальня атака 1-3 кл. Кидає до 5 кубиків!'
    },
    {
        name: 'Загін залізних щитоносців (5 солдатів)',
        avatar: '🛡️',
        type: 'щитоносці',
        cost: 130,
        description: '5 бійців • Рух 4 кл. • Захист +1 до найвищого кубика. Непохитна лінія!'
    },
    {
        name: 'Загін важких лицарів (5 солдатів)',
        avatar: '🤺',
        type: 'лицарі',
        cost: 150,
        description: '5 бійців • Рух 6 кл. • Потужний прорив. +1 до найвищого кубика атаки!'
    },
    {
        name: 'Загін бойових магів ордену (5 солдатів)',
        avatar: '🧙‍♂️',
        type: 'маги',
        cost: 160,
        description: '5 бійців • Рух 4 кл. • Магічна дальня атака на 1-3 кл. Ігнорує звичайні щити!'
    },
    {
        name: 'Загін імперської кавалерії (5 солдатів)',
        avatar: '🐎',
        type: 'вершники',
        cost: 170,
        description: '5 бійців • Рух на 8 клітинок! Стрімкий фланговий удар по ворожих лавах.'
    }
];

export function createStarterArmy16Squads(): ArmySquad[] {
    const templates: { name: string; avatar: string; type: ArmySquad['type'] }[] = [
        { name: '1-й Піхотний полк', avatar: '⚔️', type: 'піхота' },
        { name: '2-й Піхотний полк', avatar: '⚔️', type: 'піхота' },
        { name: '3-й Піхотний полк', avatar: '⚔️', type: 'піхота' },
        { name: '4-й Піхотний полк', avatar: '⚔️', type: 'піхота' },
        { name: '1-й Стрілецький загін', avatar: '🏹', type: 'стрільці' },
        { name: '2-й Стрілецький загін', avatar: '🏹', type: 'стрільці' },
        { name: '3-й Стрілецький загін', avatar: '🏹', type: 'стрільці' },
        { name: '4-й Стрілецький загін', avatar: '🏹', type: 'стрільці' },
        { name: '1-й Батальйон Щитоносців', avatar: '🛡️', type: 'щитоносці' },
        { name: '2-й Батальйон Щитоносців', avatar: '🛡️', type: 'щитоносці' },
        { name: '3-й Батальйон Щитоносців', avatar: '🛡️', type: 'щитоносці' },
        { name: 'Орден Залізних Лицарів', avatar: '🤺', type: 'лицарі' },
        { name: 'Лицарі Золотого Сонця', avatar: '🤺', type: 'лицарі' },
        { name: '1-й Кавалерійський Ескадрон', avatar: '🐎', type: 'вершники' },
        { name: '2-й Кавалерійський Ескадрон', avatar: '🐎', type: 'вершники' },
        { name: 'Бойові Маги Сапфірового Ордену', avatar: '🧙‍♂️', type: 'маги' }
    ];

    return templates.map((t, idx) => ({
        id: `army_squad_init_${idx + 1}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: t.name,
        avatar: t.avatar,
        soldiersCount: 5,
        maxSoldiers: 5,
        level: 0,
        experience: 0,
        deaths: 0,
        type: t.type,
        cost: 100
    }));
}

// Helper functions for Military Checkers Squads (Військові шашки-загони по 120 бійців)
export function createMilitarySquad(name: string, avatar: string = '🛡️', cost: number = 150, idxSuffix: number = 0): ToySoldier {
    return {
        id: `military_squad_${Date.now()}_${idxSuffix}_${Math.floor(Math.random() * 100000)}`,
        name,
        avatar,
        level: 0,
        experience: 0,
        deaths: 0,
        maxHp: 1,
        type: 'військова_шашка_загін',
        cost,
        isMilitarySquad: true,
        soldiersCount: 120,
        maxSoldiers: 120,
        soldierMaxHp: 1,
        soldierHps: Array(120).fill(1)
    };
}

export function createStarterMilitarySquads12(prefix: string = 'Гравець'): ToySoldier[] {
    const avatars = ['🛡️', '⚔️', '🪙', '⚜️', '🚩', '🦅', '🛡️', '⚔️', '🪙', '⚜️', '🚩', '🦅'];
    return Array.from({ length: 12 }).map((_, i) => createMilitarySquad(`${prefix} Легіон #${i + 1}`, avatars[i % avatars.length], 150, i));
}

export function getMilitarySquadPerkLabel(level: number): string {
    switch (level) {
        case 0: return 'Рівень 0: Стандартний загін';
        case 1: return 'Рівень 1: 🪙 Перекидання монет атаки';
        case 2: return 'Рівень 2: 🛡️ Перекидання монет захисту';
        case 3: return 'Рівень 3: — (Нічого не відбувається)';
        case 4: return 'Рівень 4: 👑 Можливість декомпресувати в союзників (K = ((кількість солдатів)/10)/2, якщо K < 1 то K = 1)';
        default: return level > 4 ? `Рівень ${level}: Ветеранський загін` : 'Рівень 0: Стандартний';
    }
}

export function applyMilitarySquadExpAndLevelUp(squad: ToySoldier, expGained: number): { updatedSquad: ToySoldier; leveledUp: boolean } {
    const oldLvl = squad.level || 0;
    const newExp = (squad.experience || 0) + expGained;
    const newLvl = calculateLevelFromExp(newExp);

    const leveledUp = newLvl > oldLvl;
    const updatedSquad: ToySoldier = {
        ...squad,
        level: newLvl,
        experience: newExp,
        soldiersCount: squad.soldiersCount ?? 120
    };

    return { updatedSquad, leveledUp };
}

export function getMilitarySquadDecompressionCount(squad: ToySoldier): number {
    const livingCount = squad.soldiersCount ?? 120;
    const raw = (livingCount / 10) / 2;
    const k = raw < 1 ? 1 : Math.floor(raw);
    return Math.max(1, k);
}

export function decompressMilitarySquadToCompanions(squad: ToySoldier, options?: DecompressOptions): HiredCompanion[] {
    const companionCount = getMilitarySquadDecompressionCount(squad);
    const companions: HiredCompanion[] = [];
    const classId = options?.chosenClassId || 'paladin';
    const gender: CharacterGender = options?.chosenGender || squad.gender || 'male';
    const defaultAvatar = gender === 'female' ? '🧝‍♀️' : (squad.avatar || '🛡️');
    const avatar = options?.chosenAvatar || defaultAvatar;

    for (let i = 0; i < companionCount; i++) {
        const title = getGenderedCompanionTitle(classId, gender);
        const baseName = options?.chosenName || squad.name;
        const name = companionCount === 1 ? baseName : `${baseName} — ${gender === 'female' ? 'Командорка' : 'Командор'} #${i + 1}`;

        companions.push({
            id: `decompressed_mil_squad_${squad.id}_${i + 1}_${Date.now()}`,
            name: name,
            title: `${title} (${gender === 'female' ? 'Центуріонка' : 'Центуріон'})`,
            avatar: avatar,
            gender: gender,
            companionClassId: classId,
            type: 'champion',
            rank: 3,
            difficulty: 'hard',
            flavorQuote: `«Один з обраних полководців військової шашки-загону ${squad.name}, загартований у грандіозних битвах монет!»`,
            description: `Декомпресований лицар з військової шашки-загону (${squad.name}). Володіє сталевою бронею та лідерським даром. Клас: ${COMPANION_CLASSES[classId]?.name || classId}.`,
            hp: 140 + (squad.level * 10),
            baseHp: 140 + (squad.level * 10),
            armor: 26 + squad.level * 2,
            powerPoints: 35,
            strength: 18 + squad.level,
            agility: 15 + squad.level,
            rewards: {
                gold: 120,
                powerPoints: 45,
                reputation: 30,
                xp: 180
            },
            level: Math.max(1, squad.level),
            xp: 0,
            xpToNextLevel: 450,
            maxAbilityCharges: 3,
            currentAbilityCharges: 3,
            survivalProbability: 95,
            isDead: false
        });
    }

    return companions;
}

export function getMilitarySquadReplenishCost(squad: ToySoldier): number {
    const current = squad.soldiersCount ?? 120;
    const missing = Math.max(0, 120 - current);
    return Math.ceil(missing / 2);
}


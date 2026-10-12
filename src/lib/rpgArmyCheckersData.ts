import { RpgArmyCheckersSquad, RpgSquadFighter, RpgFighterRole } from '../types';

// XP Thresholds:
// Level 0: 0 XP
// Level 1: 20 XP
// Level 2: 40 XP (threshold doubles)
// Level 3: 80 XP (threshold doubles)
// Level 4: 160 XP (threshold doubles, max level 4)
export function getRpgExpThresholdForLevel(level: number): number {
    if (level <= 0) return 0;
    return 20 * Math.pow(2, level - 1);
}

export function calculateRpgFighterLevel(experience: number): number {
    if (experience < 20) return 0;
    let lvl = 1;
    while (lvl < 4 && experience >= getRpgExpThresholdForLevel(lvl + 1)) {
        lvl++;
    }
    return Math.min(4, lvl);
}

export function getRpgNextLevelExpThreshold(currentExp: number): {
    currentLevel: number;
    nextLevel: number;
    nextThreshold: number;
    expRemaining: number;
} {
    const currentLevel = calculateRpgFighterLevel(currentExp);
    if (currentLevel >= 4) {
        return { currentLevel, nextLevel: 4, nextThreshold: 160, expRemaining: 0 };
    }
    const nextLevel = currentLevel + 1;
    const nextThreshold = getRpgExpThresholdForLevel(nextLevel);
    const expRemaining = Math.max(0, nextThreshold - currentExp);
    return { currentLevel, nextLevel, nextThreshold, expRemaining };
}

// Base stats definition
export function getBaseFighterStats(role: RpgFighterRole): {
    name: string;
    avatar: string;
    maxHp: number;
    maxMp: number;
    damage: number;
    defense: number;
    description: string;
} {
    switch (role) {
        case 'warrior_1':
            return {
                name: 'Воїн I (Мечоносець)',
                avatar: '⚔️',
                maxHp: 32,
                maxMp: 0,
                damage: 8,
                defense: 3,
                description: 'Фронтовий боєць, володіє нищівним ударом мечем.'
            };
        case 'warrior_2':
            return {
                name: 'Воїн II (Щитоносець)',
                avatar: '🛡️',
                maxHp: 36,
                maxMp: 0,
                damage: 7,
                defense: 4,
                description: 'Броньований захисник з важким щитом, тримає стрій.'
            };
        case 'mage':
            return {
                name: 'Бойовий Маг',
                avatar: '🧙‍♂️',
                maxHp: 22,
                maxMp: 20,
                damage: 10,
                defense: 1,
                description: 'Чаклун, володіє бойовою магією: FIRE, LIT, ICE та FIR2!'
            };
        case 'cleric':
            return {
                name: 'Священний Клірик',
                avatar: '✨',
                maxHp: 26,
                maxMp: 16,
                damage: 6,
                defense: 2,
                description: 'Служитель світла, володіє білою магією: CURE, PROT, HOLY та HEAL!'
            };
    }
}

export interface RpgSpell {
    id: string;
    name: string;
    mpCost: number;
    type: 'damage' | 'heal' | 'buff';
    element?: 'fire' | 'lit' | 'ice' | 'holy';
    basePower: number;
    targetScope: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies';
    description: string;
}

export function getRpgFighterSpells(role: RpgFighterRole, level: number = 0): RpgSpell[] {
    if (role === 'cleric') {
        return [
            { id: 'cure', name: 'CURE', mpCost: 4, type: 'heal', basePower: 24 + level * 4, targetScope: 'single_ally', description: 'Лікує 24-34 HP союзнику' },
            { id: 'prot', name: 'PROT', mpCost: 5, type: 'buff', basePower: 6 + level * 2, targetScope: 'single_ally', description: 'Підвищує броню (+6 DEF)' },
            { id: 'holy', name: 'HOLY', mpCost: 10, type: 'damage', element: 'holy', basePower: 26 + level * 5, targetScope: 'single_enemy', description: 'Священний спалах світла' },
            { id: 'heal', name: 'HEAL', mpCost: 12, type: 'heal', basePower: 18 + level * 3, targetScope: 'all_allies', description: 'Масове зцілення всіх союзників' },
        ];
    }
    if (role === 'mage') {
        return [
            { id: 'fire', name: 'FIRE', mpCost: 5, type: 'damage', element: 'fire', basePower: 22 + level * 4, targetScope: 'single_enemy', description: 'Вогняний спалах по ворогу' },
            { id: 'lit', name: 'LIT', mpCost: 5, type: 'damage', element: 'lit', basePower: 24 + level * 4, targetScope: 'single_enemy', description: 'Блискавичний розряд' },
            { id: 'ice', name: 'ICE', mpCost: 5, type: 'damage', element: 'ice', basePower: 22 + level * 4, targetScope: 'single_enemy', description: 'Крижаний осколок' },
            { id: 'fir2', name: 'FIR2', mpCost: 14, type: 'damage', element: 'fire', basePower: 28 + level * 5, targetScope: 'all_enemies', description: 'Хвиля вогню по всіх ворогах!' },
        ];
    }
    return [];
}

export function createRpgFighter(role: RpgFighterRole, squadIndex: number): RpgSquadFighter {
    const base = getBaseFighterStats(role);
    return {
        id: `rpg_f_${squadIndex}_${role}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        role,
        name: base.name,
        level: 0,
        experience: 0,
        maxHp: base.maxHp,
        currentHp: base.maxHp,
        maxMp: base.maxMp,
        currentMp: base.maxMp,
        damage: base.damage,
        defense: base.defense,
        bonusHp: 0,
        bonusDamage: 0,
        bonusDefense: 0,
        statPointsAvailable: 0,
        isDead: false
    };
}

export function createStarterRpgSquads(): RpgArmyCheckersSquad[] {
    const squads: RpgArmyCheckersSquad[] = [];
    const squadNames = [
        '«Авангард Багряного Меча»',
        '«Варта Срібної Вежі»',
        '«Штурмовики Залізного Кулака»',
        '«Крила Нічного Сокола»',
        '«Лицарі Сонячного Променя»',
        '«Гвардія Дубового Гаю»',
        '«Легіонери Північного Вітру»',
        '«Загін Громового Могильника»',
        '«Стрільці та Маги Обсидіану»',
        '«Вартові Вічного Вогню»',
        '«Братство Золотого Лева»',
        '«Цитадель Смарагдового Стягу»'
    ];

    const avatars = ['⚔️', '🛡️', '🧙‍♂️', '⚜️', '🦅', '🦁', '🗡️', '🔥', '👑', '⚡', '🌙', '🌟'];

    for (let i = 0; i < 12; i++) {
        squads.push({
            id: `rpg_squad_${i + 1}`,
            index: i,
            name: `Шашка-Загін #${i + 1}: ${squadNames[i] || 'Спецзагін'}`,
            avatar: avatars[i % avatars.length],
            fighters: [
                createRpgFighter('warrior_1', i),
                createRpgFighter('warrior_2', i),
                createRpgFighter('mage', i),
                createRpgFighter('cleric', i)
            ]
        });
    }

    return squads;
}

export function createEnemyRpgSquads(opponentName: string, difficulty: number = 1): RpgArmyCheckersSquad[] {
    const squads: RpgArmyCheckersSquad[] = [];
    const enemySquadNames = [
        '«Чорні Вовки»',
        '«Багряні Корсари»',
        '«Гвардія Тіней»',
        '«Нічні Розбійники»',
        '«Залізний Орден»',
        '«Штурмовики Хаосу»',
        '«Магічний Легіон»',
        '«Криваві Соколи»',
        '«Орда Степовиків»',
        '«Варта Темного Замку»',
        '«Паладини Мороку»',
        '«Особиста Варта Чемпіона»'
    ];

    const bonusHp = Math.min(12, difficulty * 2);
    const bonusDmg = Math.min(4, Math.floor(difficulty / 2));

    for (let i = 0; i < 12; i++) {
        const f1 = createRpgFighter('warrior_1', i + 100);
        f1.name = `Воїн Найманець I`;
        f1.maxHp += bonusHp;
        f1.currentHp = f1.maxHp;
        f1.damage += bonusDmg;

        const f2 = createRpgFighter('warrior_2', i + 100);
        f2.name = `Воїн Страж II`;
        f2.maxHp += bonusHp + 2;
        f2.currentHp = f2.maxHp;
        f2.damage += bonusDmg;

        const f3 = createRpgFighter('mage', i + 100);
        f3.name = `Темний Заклинатель`;
        f3.maxHp += bonusHp;
        f3.currentHp = f3.maxHp;
        f3.damage += bonusDmg;

        const f4 = createRpgFighter('cleric', i + 100);
        f4.name = `Культист-Цілитель`;
        f4.maxHp += bonusHp;
        f4.currentHp = f4.maxHp;
        f4.damage += bonusDmg;

        squads.push({
            id: `enemy_rpg_squad_${i + 1}`,
            index: i,
            name: `${opponentName}: ${enemySquadNames[i] || `Загін #${i + 1}`}`,
            avatar: '💀',
            fighters: [f1, f2, f3, f4]
        });
    }

    return squads;
}

// User Rule:
// "Якщо боєць помирає під час гри, то він зникає повністю і не може бути відновлений до кінця самої гри.
// Якщо, коли ми виграли, ми можемо в меню з іграшками повернутись, відновити бійця,
// але відновлений боєць буде нульового рівня. Прокачка відбувається від нульового до четвертого рівня."
export function reviveRpgFighter(fighter: RpgSquadFighter): RpgSquadFighter {
    const base = getBaseFighterStats(fighter.role);
    return {
        ...fighter,
        level: 0,
        experience: 0,
        bonusHp: 0,
        bonusDamage: 0,
        bonusDefense: 0,
        statPointsAvailable: 0,
        maxHp: base.maxHp,
        currentHp: base.maxHp,
        maxMp: base.maxMp,
        currentMp: base.maxMp,
        damage: base.damage,
        defense: base.defense,
        isDead: false
    };
}

// Apply stat upgrade
export function upgradeRpgFighterStat(
    fighter: RpgSquadFighter,
    stat: 'hp' | 'damage' | 'defense'
): RpgSquadFighter {
    if ((fighter.statPointsAvailable || 0) <= 0) return fighter;

    const updated = { ...fighter };
    updated.statPointsAvailable = (updated.statPointsAvailable || 0) - 1;

    if (stat === 'hp') {
        const hpBonus = 6;
        updated.bonusHp = (updated.bonusHp || 0) + hpBonus;
        updated.maxHp += hpBonus;
        updated.currentHp += hpBonus;
    } else if (stat === 'damage') {
        const dmgBonus = 2;
        updated.bonusDamage = (updated.bonusDamage || 0) + dmgBonus;
        updated.damage += dmgBonus;
    } else if (stat === 'defense') {
        const defBonus = 1;
        updated.bonusDefense = (updated.bonusDefense || 0) + defBonus;
        updated.defense += defBonus;
    }

    return updated;
}

// Experience gain and leveling
export function addExpToRpgFighter(fighter: RpgSquadFighter, expAmount: number): {
    fighter: RpgSquadFighter;
    leveledUp: boolean;
    levelsGained: number;
} {
    if (fighter.isDead) {
        return { fighter, leveledUp: false, levelsGained: 0 };
    }

    const oldLevel = fighter.level;
    const newExp = fighter.experience + expAmount;
    const newLevel = calculateRpgFighterLevel(newExp);
    const levelsGained = Math.max(0, newLevel - oldLevel);

    const updated = {
        ...fighter,
        experience: newExp,
        level: newLevel
    };

    if (levelsGained > 0) {
        // Automatic stat increment + bonus stat points to spend
        const hpIncrease = levelsGained * 4;
        const dmgIncrease = levelsGained * 1;
        const defIncrease = levelsGained * 1;

        updated.maxHp += hpIncrease;
        updated.currentHp = Math.min(updated.maxHp, updated.currentHp + hpIncrease);
        updated.damage += dmgIncrease;
        updated.defense += defIncrease;

        // Player also receives stat points to customize in the Toy Menu
        updated.statPointsAvailable = (updated.statPointsAvailable || 0) + levelsGained;
    }

    return {
        fighter: updated,
        leveledUp: levelsGained > 0,
        levelsGained
    };
}

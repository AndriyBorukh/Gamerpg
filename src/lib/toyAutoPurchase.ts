import { WorldProgress, ToySoldier, ArmySquad } from '../types';
import { 
    createCheckersSquad, 
    createStarterCheckersSquads12, 
    createMilitarySquad, 
    createStarterMilitarySquads12,
    createStarterArmy16Squads,
    DEFAULT_STARTER_TOY_SOLDIERS
} from './toySoldiersData';
import { saveWorldProgress } from './worldData';
import { playGoldSound } from './soundEffects';

export interface FigurineRequirement {
    activity: string;
    ready: boolean;
    text: string;
    req: string;
    missingCount: number;
    missingCost: number;
    canAfford: boolean;
    missingDescription: string;
}

/**
 * Calculates figurine / checker readiness and auto-purchase cost for any game activity.
 */
export function getFigurineRequirement(activity: string, progress: WorldProgress, boardSize?: number): FigurineRequirement | null {
    const soldiers = progress.toySoldiers || [];
    const playerGold = progress.playerGold || 0;

    const readyPawns = soldiers.filter(s => (s.type === 'пішак' || (s.type?.includes('пішак') && !s.type?.includes('маг'))) && (s.deaths || 0) < 3);
    const readyCheckers = soldiers.filter(s => (s.type === 'шашка' || (s.type?.includes('шашк') && !s.isCheckersSquad && s.type !== 'шашка_загін')) && !s.isCheckersSquad && s.type !== 'шашка_загін' && (s.deaths || 0) < 3);
    const readyCheckersSquads = soldiers.filter(s => (s.isCheckersSquad || s.type === 'шашка_загін') && (s.deaths || 0) < 3);
    const readyMilSquads = soldiers.filter(s => (s.isMilitarySquad || s.type === 'військова_шашка_загін') && (s.deaths || 0) < 3);
    const readyMagic = soldiers.filter(s => (s.type === 'магічний_пішак' || s.type?.includes('маг')) && (s.deaths || 0) < 3);
    const readySoldiers = soldiers.filter(s => (s.deaths || 0) < 3);
    const armySquads = (progress.armySquads || []).filter(sq => (sq.soldiersCount ?? 5) > 0);

    // 1. Battle Pawns 6x12
    if (activity === 'battle_pawns_6x12') {
        const combat = soldiers.filter(s => (s.type === 'пішак' || s.type === 'піхотинець' || !s.type?.includes('маг')) && (s.deaths || 0) < 3);
        const magic = soldiers.filter(s => (s.type === 'магічний_пішак' || s.type?.includes('маг')) && (s.deaths || 0) < 3);
        const missingCombat = Math.max(0, 6 - combat.length);
        const missingMagic = Math.max(0, 6 - magic.length);
        const totalMissing = missingCombat + missingMagic;
        const ready = totalMissing === 0;
        const missingCost = (missingCombat * 10) + (missingMagic * 20);

        let missingDesc = '';
        if (missingCombat > 0 && missingMagic > 0) {
            missingDesc = `${missingCombat} бойових пішаків та ${missingMagic} магічних пішаків`;
        } else if (missingCombat > 0) {
            missingDesc = `${missingCombat} бойових пішаків`;
        } else if (missingMagic > 0) {
            missingDesc = `${missingMagic} магічних пішаків`;
        } else {
            missingDesc = 'Усі фігурки в наявності';
        }

        return {
            activity,
            ready,
            text: `Фігурки: ${combat.length}/6 ⚔️ • ${magic.length}/6 🔮`,
            req: '6 бойових та 6 магічних пішаків',
            missingCount: totalMissing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: missingDesc
        };
    }

    // 2. Toy Checkers (8x8, 10x10, 12x12, classic)
    if (activity === 'toy_checkers' || activity === 'toy_checkers_classic') {
        const target = 12;
        const missing = Math.max(0, target - readyCheckers.length);
        // Bundle of 12 is 150, single is 15
        const missingCost = missing === 12 ? 150 : missing * 15;
        return {
            activity,
            ready: missing === 0,
            text: `Шашки: ${readyCheckers.length}/${target} 🔴`,
            req: `${target} бойових шашок`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} бойових шашок`
        };
    }
    if (activity === 'toy_checkers_10x10') {
        const target = 20;
        const missing = Math.max(0, target - readyCheckers.length);
        const missingCost = missing >= 12 ? (150 + (missing - 12) * 15) : missing * 15;
        return {
            activity,
            ready: missing === 0,
            text: `Шашки: ${readyCheckers.length}/${target} 🔴`,
            req: `${target} бойових шашок`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} бойових шашок`
        };
    }
    if (activity === 'toy_checkers_12x12') {
        const target = 30;
        const missing = Math.max(0, target - readyCheckers.length);
        const packs = Math.floor(missing / 12);
        const remainder = missing % 12;
        const missingCost = packs * 150 + remainder * 15;
        return {
            activity,
            ready: missing === 0,
            text: `Шашки: ${readyCheckers.length}/${target} 🔴`,
            req: `${target} бойових шашок`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} бойових шашок`
        };
    }

    // 3. Combat Pawns (8x8 = 24, 10x10 = 40, 12x12 = 60)
    if (activity === 'toy_pawns') {
        const target = 24;
        const missing = Math.max(0, target - readyPawns.length);
        // Pack of 24 is 200, single is 10
        const missingCost = missing === 24 ? 200 : Math.min(missing * 10, 200);
        return {
            activity,
            ready: missing === 0,
            text: `Пішаки: ${readyPawns.length}/${target} ♟️`,
            req: `${target} бойових пішаків`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} бойових пішаків`
        };
    }
    if (activity === 'toy_pawns_10x10') {
        const target = 40;
        const missing = Math.max(0, target - readyPawns.length);
        const packs = Math.floor(missing / 24);
        const remainder = missing % 24;
        const missingCost = packs * 200 + remainder * 10;
        return {
            activity,
            ready: missing === 0,
            text: `Пішаки: ${readyPawns.length}/${target} ♟️`,
            req: `${target} бойових пішаків`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} бойових пішаків`
        };
    }
    if (activity === 'toy_pawns_12x12') {
        const target = 60;
        const missing = Math.max(0, target - readyPawns.length);
        const packs = Math.floor(missing / 24);
        const remainder = missing % 24;
        const missingCost = packs * 200 + remainder * 10;
        return {
            activity,
            ready: missing === 0,
            text: `Пішаки: ${readyPawns.length}/${target} ♟️`,
            req: `${target} бойових пішаків`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} бойових пішаків`
        };
    }

    // 4. Magic Pawns (8x8 = 24, 10x10 = 40, 12x12 = 60)
    if (activity === 'magic_pawns') {
        const target = 24;
        const missing = Math.max(0, target - readyMagic.length);
        // Pack of 24 is 350, single is 20
        const missingCost = missing === 24 ? 350 : Math.min(missing * 20, 350);
        return {
            activity,
            ready: missing === 0,
            text: `Маг. пішаки: ${readyMagic.length}/${target} 🔮`,
            req: `${target} магічних пішаків`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} магічних пішаків`
        };
    }
    if (activity === 'magic_pawns_10x10') {
        const target = 40;
        const missing = Math.max(0, target - readyMagic.length);
        const packs = Math.floor(missing / 24);
        const remainder = missing % 24;
        const missingCost = packs * 350 + remainder * 20;
        return {
            activity,
            ready: missing === 0,
            text: `Маг. пішаки: ${readyMagic.length}/${target} 🔮`,
            req: `${target} магічних пішаків`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} магічних пішаків`
        };
    }
    if (activity === 'magic_pawns_12x12') {
        const target = 60;
        const missing = Math.max(0, target - readyMagic.length);
        const packs = Math.floor(missing / 24);
        const remainder = missing % 24;
        const missingCost = packs * 350 + remainder * 20;
        return {
            activity,
            ready: missing === 0,
            text: `Маг. пішаки: ${readyMagic.length}/${target} 🔮`,
            req: `${target} магічних пішаків`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} магічних пішаків`
        };
    }

    // 5. Toy Soldiers (5 soldiers)
    if (activity === 'toy_soldiers') {
        const target = 5;
        const missing = Math.max(0, target - readySoldiers.length);
        const missingCost = missing * 25;
        return {
            activity,
            ready: missing === 0,
            text: `Солдатики: ${readySoldiers.length}/${target} 💂‍♂️`,
            req: `${target} солдатиків`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} солдатиків`
        };
    }

    // 6. Army Battle (16 squads)
    if (activity === 'army_battle') {
        const target = 16;
        const missing = Math.max(0, target - armySquads.length);
        // Full legion of 16 is 1200, single squad is 100
        const missingCost = missing === 16 ? 1200 : Math.min(missing * 100, 1200);
        return {
            activity,
            ready: missing === 0,
            text: `Загони: ${armySquads.length}/${target} 🚩`,
            req: `${target} армійських загонів`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} армійських загонів`
        };
    }

    // 7. Checkers War (12 Checkers Squads)
    if (activity === 'checkers_war' || activity === 'aranian_checkers_war') {
        const target = 12;
        const missing = Math.max(0, target - readyCheckersSquads.length);
        // Full box of 12 is 600, single is 120
        const missingCost = missing === 12 ? 600 : Math.min(missing * 120, 600);
        return {
            activity,
            ready: missing === 0,
            text: `Армійські Шашки-Загони: ${readyCheckersSquads.length}/${target} ⚔️🔴`,
            req: `${target} армійських шашок-загонів`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} армійських шашок-загонів`
        };
    }

    // 8. Military Checkers (12 Military Squads of 120 soldiers)
    if (activity === 'military_checkers' || activity === 'aranian_military_checkers') {
        const target = 12;
        const missing = Math.max(0, target - readyMilSquads.length);
        // Legion of 12 is 750, single is 150
        const missingCost = missing === 12 ? 750 : Math.min(missing * 150, 750);
        return {
            activity,
            ready: missing === 0,
            text: `Військові Загони: ${readyMilSquads.length}/${target} 🛡️🪙`,
            req: `${target} військових шашок-загонів`,
            missingCount: missing,
            missingCost,
            canAfford: playerGold >= missingCost,
            missingDescription: `${missing} військових шашок-загонів`
        };
    }

    // 9. RPG Army Checkers (12 RPG Squads with 4 fighters each)
    if (activity === 'rpg_army_checkers') {
        const rpgSquads = progress.rpgArmyCheckersSquads || [];
        const count = rpgSquads.length > 0 ? rpgSquads.length : 12;
        return {
            activity,
            ready: true,
            text: `Рольові Загони: ${count}/12 ⚔️🧙‍♂️`,
            req: `12 рольових шашок-загонів`,
            missingCount: 0,
            missingCost: 0,
            canAfford: true,
            missingDescription: '12 рольових загонів готові до бою'
        };
    }

    return null;
}

export interface AutoPurchaseResult {
    success: boolean;
    updatedProgress?: WorldProgress;
    message: string;
    missingCost: number;
    itemsSummary: string;
}

/**
 * Executes automatic purchase of all missing checkers or figurines for a given activity.
 */
export function executeAutoPurchaseForActivity(activity: string, progress: WorldProgress): AutoPurchaseResult {
    const req = getFigurineRequirement(activity, progress);
    if (!req) {
        return {
            success: false,
            message: 'Для цієї активності не потрібні особливі шашки чи фігурки.',
            missingCost: 0,
            itemsSummary: ''
        };
    }

    if (req.ready) {
        return {
            success: true,
            updatedProgress: progress,
            message: 'Усі необхідні шашки та фігури вже у вашій колекції!',
            missingCost: 0,
            itemsSummary: ''
        };
    }

    if (progress.playerGold < req.missingCost) {
        return {
            success: false,
            message: `Недостатньо золота! Потрібно ${req.missingCost} 🪙, а у вас є ${progress.playerGold} 🪙.`,
            missingCost: req.missingCost,
            itemsSummary: req.missingDescription
        };
    }

    const currentSoldiers = [...(progress.toySoldiers || [])];
    const currentArmySquads = [...(progress.armySquads || [])];
    const newSoldiers: ToySoldier[] = [];
    let newArmySquads: ArmySquad[] = [];
    const cost = req.missingCost;

    const avatars = ['🔴', '🔵', '🟣', '🟢', '🟡', '🟠', '🔴', '🔵', '🟣', '🟢', '🟡', '🟠'];
    const milAvatars = ['🛡️', '⚔️', '🪙', '⚜️', '🚩', '🦅', '🛡️', '⚔️', '🪙', '⚜️', '🚩', '🦅'];

    // Specific creation logic
    if (activity === 'battle_pawns_6x12') {
        const combat = currentSoldiers.filter(s => (s.type === 'пішак' || s.type === 'піхотинець' || !s.type?.includes('маг')) && (s.deaths || 0) < 3);
        const magic = currentSoldiers.filter(s => (s.type === 'магічний_пішак' || s.type?.includes('маг')) && (s.deaths || 0) < 3);
        const missingCombat = Math.max(0, 6 - combat.length);
        const missingMagic = Math.max(0, 6 - magic.length);

        for (let i = 0; i < missingCombat; i++) {
            newSoldiers.push({
                id: `toy_combat_pawn_${Date.now()}_${i}`,
                name: `Бойовий пішак #${combat.length + i + 1}`,
                avatar: '♟️',
                level: 0,
                experience: 0,
                deaths: 0,
                maxHp: 1,
                type: 'пішак',
                cost: 10
            });
        }
        for (let i = 0; i < missingMagic; i++) {
            newSoldiers.push({
                id: `toy_magic_pawn_${Date.now()}_${i}`,
                name: `Магічний бойовий пішак #${magic.length + i + 1}`,
                avatar: '🧙‍♂️♟️',
                level: 0,
                experience: 0,
                deaths: 0,
                maxHp: 2,
                type: 'магічний_пішак',
                cost: 20
            });
        }
    } else if (activity.startsWith('toy_checkers')) {
        const target = activity === 'toy_checkers_12x12' ? 30 : activity === 'toy_checkers_10x10' ? 20 : 12;
        const currentCheckers = currentSoldiers.filter(s => (s.type === 'шашка' || (s.type?.includes('шашк') && !s.isCheckersSquad && s.type !== 'шашка_загін')) && !s.isCheckersSquad && s.type !== 'шашка_загін' && (s.deaths || 0) < 3);
        const missing = Math.max(0, target - currentCheckers.length);

        for (let i = 0; i < missing; i++) {
            newSoldiers.push({
                id: `toy_checker_${Date.now()}_${i}`,
                name: `Бойова шашка #${currentCheckers.length + i + 1}`,
                avatar: '🔴',
                level: 0,
                experience: 0,
                deaths: 0,
                maxHp: 1,
                type: 'шашка',
                cost: 15
            });
        }
    } else if (activity.startsWith('toy_pawns')) {
        const target = activity === 'toy_pawns_12x12' ? 60 : activity === 'toy_pawns_10x10' ? 40 : 24;
        const currentPawns = currentSoldiers.filter(s => (s.type === 'пішак' || (s.type?.includes('пішак') && !s.type?.includes('маг'))) && (s.deaths || 0) < 3);
        const missing = Math.max(0, target - currentPawns.length);

        for (let i = 0; i < missing; i++) {
            newSoldiers.push({
                id: `toy_pawn_${Date.now()}_${i}`,
                name: `Бойовий пішак #${currentPawns.length + i + 1}`,
                avatar: '♟️',
                level: 0,
                experience: 0,
                deaths: 0,
                maxHp: 1,
                type: 'пішак',
                cost: 10
            });
        }
    } else if (activity.startsWith('magic_pawns')) {
        const target = activity === 'magic_pawns_12x12' ? 60 : activity === 'magic_pawns_10x10' ? 40 : 24;
        const currentMagic = currentSoldiers.filter(s => (s.type === 'магічний_пішак' || s.type?.includes('маг')) && (s.deaths || 0) < 3);
        const missing = Math.max(0, target - currentMagic.length);

        for (let i = 0; i < missing; i++) {
            newSoldiers.push({
                id: `toy_mag_pawn_${Date.now()}_${i}`,
                name: `Магічний пішак #${currentMagic.length + i + 1}`,
                avatar: '🧙‍♂️♟️',
                level: 0,
                experience: 0,
                deaths: 0,
                maxHp: 2,
                type: 'магічний_пішак',
                cost: 20
            });
        }
    } else if (activity === 'toy_soldiers') {
        const currentReady = currentSoldiers.filter(s => (s.deaths || 0) < 3);
        const missing = Math.max(0, 5 - currentReady.length);
        const templates = DEFAULT_STARTER_TOY_SOLDIERS;

        for (let i = 0; i < missing; i++) {
            const tmpl = templates[(currentReady.length + i) % templates.length];
            newSoldiers.push({
                id: `toy_soldier_${Date.now()}_${i}`,
                name: `${tmpl.name} #${currentReady.length + i + 1}`,
                avatar: tmpl.avatar,
                level: 0,
                experience: 0,
                deaths: 0,
                maxHp: tmpl.maxHp,
                type: tmpl.type,
                cost: 25
            });
        }
    } else if (activity === 'checkers_war' || activity === 'aranian_checkers_war') {
        const currentCheckersSquads = currentSoldiers.filter(s => (s.isCheckersSquad || s.type === 'шашка_загін') && (s.deaths || 0) < 3);
        const missing = Math.max(0, 12 - currentCheckersSquads.length);

        if (missing === 12 && currentCheckersSquads.length === 0) {
            newSoldiers.push(...createStarterCheckersSquads12('Арсенал'));
        } else {
            for (let i = 0; i < missing; i++) {
                newSoldiers.push(createCheckersSquad(`Арсенал Загін #${currentCheckersSquads.length + i + 1}`, avatars[(currentCheckersSquads.length + i) % avatars.length], 120, i));
            }
        }
    } else if (activity === 'military_checkers' || activity === 'aranian_military_checkers') {
        const currentMil = currentSoldiers.filter(s => (s.isMilitarySquad || s.type === 'військова_шашка_загін') && (s.deaths || 0) < 3);
        const missing = Math.max(0, 12 - currentMil.length);

        if (missing === 12 && currentMil.length === 0) {
            newSoldiers.push(...createStarterMilitarySquads12('Легіон'));
        } else {
            for (let i = 0; i < missing; i++) {
                newSoldiers.push(createMilitarySquad(`Легіон Загін #${currentMil.length + i + 1}`, milAvatars[(currentMil.length + i) % milAvatars.length], 150, i));
            }
        }
    } else if (activity === 'army_battle') {
        const missing = Math.max(0, 16 - currentArmySquads.length);
        if (missing === 16 && currentArmySquads.length === 0) {
            newArmySquads = createStarterArmy16Squads();
        } else {
            const types: ArmySquad['type'][] = ['піхота', 'стрільці', 'щитоносці', 'лицарі', 'маги', 'вершники'];
            const typeNames: Record<string, { name: string; avatar: string }> = {
                'піхота': { name: "Олов'яна піхота", avatar: '⚔️' },
                'стрільці': { name: "Королівські стрільці", avatar: '🏹' },
                'щитоносці': { name: "Залізні щитоносці", avatar: '🛡️' },
                'лицарі': { name: "Важкі лицарі", avatar: '🤺' },
                'маги': { name: "Бойові маги", avatar: '🧙‍♂️' },
                'вершники': { name: "Імперська кавалерія", avatar: '🐎' }
            };

            for (let i = 0; i < missing; i++) {
                const sqType = types[(currentArmySquads.length + i) % types.length];
                const info = typeNames[sqType];
                newArmySquads.push({
                    id: `army_squad_${Date.now()}_${i}`,
                    name: `${info.name} #${currentArmySquads.length + i + 1}`,
                    avatar: info.avatar,
                    type: sqType,
                    soldiersCount: 5,
                    maxSoldiers: 5,
                    level: 0,
                    experience: 0,
                    deaths: 0,
                    cost: 100,
                    description: `5 бійців • Загін для Битви Армій`
                });
            }
        }
    }

    const updatedProgress: WorldProgress = {
        ...progress,
        playerGold: progress.playerGold - cost,
        toySoldiers: [...currentSoldiers, ...newSoldiers],
        armySquads: [...currentArmySquads, ...newArmySquads]
    };

    playGoldSound();
    saveWorldProgress(updatedProgress);

    return {
        success: true,
        updatedProgress,
        message: `✅ Автопокупка успішна! Придбано: ${req.missingDescription} за ${cost} 🪙.`,
        missingCost: cost,
        itemsSummary: req.missingDescription
    };
}

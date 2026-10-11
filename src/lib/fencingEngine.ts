import { CombatZone, FencingStance, BrawlRoundLog } from '../types';

export interface FencingFighter {
    name: string;
    avatar: string;
    currentHp: number;
    maxHp: number;
    strength: number;
    agility: number;
    stance: FencingStance;
}

export interface FencingRoundResolution {
    log: BrawlRoundLog;
    newPlayerHp: number;
    newOppHp: number;
    playerStance: FencingStance;
    oppStance: FencingStance;
}

export const FENCING_HIT_MODIFIERS: Record<CombatZone, number> = {
    head: -2,
    torso: 3,
    legs: 2
};

export const FENCING_STANCE_INFO: Record<FencingStance, {
    name: string;
    shortName: string;
    icon: string;
    damageBonus: number;
    defenseRule: string;
    description: string;
}> = {
    sword_shield: {
        name: 'Меч та щит',
        shortName: 'Меч і Щит',
        icon: '🛡️⚔️',
        damageBonus: 4,
        defenseRule: 'При успішному захисті пошкодження НЕ наносяться (0 HP)',
        description: '+4 до пошкодження. Вгаданий захист повністю блокує випад щитом (0 шкоди)!'
    },
    sword_only: {
        name: 'Меч без щита',
        shortName: 'Дуельний Клинок',
        icon: '⚔️',
        damageBonus: 5,
        defenseRule: 'При успішному захисті отримуєте лише 1/2 пошкодження',
        description: '+5 до пошкодження. При успішному захисті парирування мечем поглинає лише 1/2 шкоди.'
    }
};

export function rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
}

export function resolveFencingRound(
    roundNumber: number,
    player: FencingFighter,
    opp: FencingFighter,
    playerAttackZone: CombatZone,
    playerDefenseZone: CombatZone,
    oppAttackZone: CombatZone,
    oppDefenseZone: CombatZone,
    playerStance: FencingStance,
    oppStance: FencingStance
): FencingRoundResolution {
    // 1. Player Attack on Opponent
    // Rule: 1д20 + параметр спритності гравця + модифікатор попадання > 1д20 + параметр спритності супротивника
    // Hit modifiers: голова -2, тулуб 3, ноги 2
    const playerHitModifier = FENCING_HIT_MODIFIERS[playerAttackZone];
    const playerD20 = rollD20();
    const oppDefenseD20 = rollD20();
    const playerTotal = playerD20 + player.agility + playerHitModifier;
    const oppDefTotal = oppDefenseD20 + opp.agility;
    const playerHit = playerTotal > oppDefTotal;

    let playerDamage = 0;
    const playerBlocked = oppDefenseZone === playerAttackZone;
    const playerHeadHit = playerAttackZone === 'head';

    let oppShieldBlocked = false;
    let oppParryHalfDamage = false;

    if (playerHit) {
        // Base fencing blade damage + stance bonus (+4 for sword_shield, +5 for sword_only)
        const base = Math.max(10, Math.round(14 + player.strength * 0.85 + (Math.random() * 4 - 2)));
        const stanceBonus = playerStance === 'sword_shield' ? 4 : 5;
        let dmg = base + stanceBonus;

        // Head hit critical 4x
        if (playerHeadHit) {
            dmg = dmg * 4;
        }

        // Defense resolution based on opponent's equipment:
        // "меч та щит (+4 до пошкодження, якщо гравець вгадав з захистом пошкодження не наносяться )"
        // "меч без щита (+ 5 до пошкодження захист дає лише 1/2 від пошкодження при успісі)"
        if (playerBlocked) {
            if (oppStance === 'sword_shield') {
                dmg = 0; // 0 damage! Complete shield block
                oppShieldBlocked = true;
            } else {
                dmg = Math.max(1, Math.round(dmg * 0.5)); // 1/2 damage! Sword parry
                oppParryHalfDamage = true;
            }
        }

        playerDamage = dmg;
    }

    const newOppHp = Math.max(0, opp.currentHp - playerDamage);

    // 2. Opponent Attack on Player (if opponent is still conscious)
    const oppHitModifier = FENCING_HIT_MODIFIERS[oppAttackZone];
    const oppD20 = rollD20();
    const playerDefenseD20 = rollD20();
    const oppTotal = oppD20 + opp.agility + oppHitModifier;
    const playerDefTotal = playerDefenseD20 + player.agility;
    const oppHit = oppTotal > playerDefTotal;

    let oppDamage = 0;
    const oppBlocked = playerDefenseZone === oppAttackZone;
    const oppHeadHit = oppAttackZone === 'head';

    let playerShieldBlocked = false;
    let playerParryHalfDamage = false;

    if (oppHit && newOppHp > 0) {
        const base = Math.max(10, Math.round(12 + opp.strength * 0.75 + (Math.random() * 4 - 2)));
        const oppStanceBonus = oppStance === 'sword_shield' ? 4 : 5;
        let dmg = base + oppStanceBonus;

        if (oppHeadHit) {
            dmg = dmg * 4;
        }

        if (oppBlocked) {
            if (playerStance === 'sword_shield') {
                dmg = 0; // Player took 0 damage because of shield!
                playerShieldBlocked = true;
            } else {
                dmg = Math.max(1, Math.round(dmg * 0.5)); // Player took 1/2 damage because of sword parry!
                playerParryHalfDamage = true;
            }
        }

        oppDamage = dmg;
    }

    const newPlayerHp = Math.max(0, player.currentHp - oppDamage);

    // Labels
    const zoneLabels: Record<CombatZone, string> = {
        head: 'голову',
        torso: 'тулуб',
        legs: 'ноги'
    };

    const zoneDefenseLabels: Record<CombatZone, string> = {
        head: 'голови',
        torso: 'тулуба',
        legs: 'ніг'
    };

    const pModStr = playerHitModifier >= 0 ? `+${playerHitModifier}` : `${playerHitModifier}`;
    const oppModStr = oppHitModifier >= 0 ? `+${oppHitModifier}` : `${oppHitModifier}`;
    const pStanceName = FENCING_STANCE_INFO[playerStance].shortName;
    const oppStanceName = FENCING_STANCE_INFO[oppStance].shortName;

    // Construct text narrative log
    const lines: string[] = [];
    lines.push(`⚔️ Раунд ${roundNumber} (Ви: ${pStanceName} | Суперник: ${oppStanceName}):`);

    // Player strike
    if (playerHit) {
        const weaponBonusStr = playerStance === 'sword_shield' ? '+4 [щит]' : '+5 [клинок]';
        if (playerHeadHit) {
            if (oppShieldBlocked) {
                lines.push(`• Ви зробили випад у ГОЛОВУ (1d20: ${playerD20} + Спр: ${player.agility} ${pModStr} = ${playerTotal} > ${oppDefTotal}), але суперник виставив ЩИТ! 🛡️ Пошкодження не наносяться (0 HP)!`);
            } else if (oppParryHalfDamage) {
                lines.push(`• Нищівний удар у ГОЛОВУ (${playerTotal} > ${oppDefTotal})! Суперник парирував мечем без щита (1/2 шкоди): -${playerDamage} HP.`);
            } else {
                lines.push(`• 💥 КРИТИЧНИЙ ВИПАД У ГОЛОВУ! (1d20: ${playerD20} + Спр: ${player.agility} ${pModStr} = ${playerTotal} > ${oppDefTotal}, ${weaponBonusStr}). 4x шкода: -${playerDamage} HP!`);
            }
        } else {
            if (oppShieldBlocked) {
                lines.push(`• Ви поцілили в ${zoneLabels[playerAttackZone]} (${playerTotal} > ${oppDefTotal}), але суперник зустрів удар міцним ЩИТОМ! 🛡️ Пошкодження не наносяться (0 HP)!`);
            } else if (oppParryHalfDamage) {
                lines.push(`• Удар у ${zoneLabels[playerAttackZone]} (${playerTotal} > ${oppDefTotal})! Суперник відбив мечем без щита — захист дає лише 1/2 від пошкодження: -${playerDamage} HP.`);
            } else {
                lines.push(`• Точний випад клинком у ${zoneLabels[playerAttackZone]} (${playerTotal} > ${oppDefTotal}, ${weaponBonusStr})! Нанесено -${playerDamage} HP.`);
            }
        }
    } else {
        lines.push(`• Промах у ${zoneLabels[playerAttackZone]}! 1d20: ${playerD20} + Спр: ${player.agility} ${pModStr} = ${playerTotal} ≤ захисту суперника (${oppDefTotal}).`);
    }

    // Opponent strike
    if (newOppHp > 0) {
        if (oppHit) {
            if (oppHeadHit) {
                if (playerShieldBlocked) {
                    lines.push(`• 🛡️ ВАШ ЩИТ ПОРЯТУВАВ ВАС! Суперник рубав у голову (${oppTotal} > ${playerDefTotal}), але ви закрилися щитом: 0 пошкоджень!`);
                } else if (playerParryHalfDamage) {
                    lines.push(`• ⚔️ Суперник цілив у голову (${oppTotal} > ${playerDefTotal})! Ваш меч без щита парирував удар — ви отримали 1/2 пошкодження: -${oppDamage} HP.`);
                } else {
                    lines.push(`• 🩸 КРИТИЧНИЙ ПРОПУСК У ГОЛОВУ! (${oppTotal} > ${playerDefTotal}) 4x шкода: -${oppDamage} HP!`);
                }
            } else {
                if (playerShieldBlocked) {
                    lines.push(`• 🛡️ БЛИСКУЧИЙ БЛОК ЩИТОМ! Суперник атакував ${zoneLabels[oppAttackZone]} (${oppTotal} > ${playerDefTotal}), але ваш щит повністю поглинув удар: 0 пошкоджень!`);
                } else if (playerParryHalfDamage) {
                    lines.push(`• ⚔️ Парирування мечем! Суперник атакував ${zoneLabels[oppAttackZone]} (${oppTotal} > ${playerDefTotal}). Захист мечем дав 1/2 від пошкодження: -${oppDamage} HP.`);
                } else {
                    lines.push(`• Суперник завдав випаду в ${zoneLabels[oppAttackZone]} (${oppTotal} > ${playerDefTotal}): -${oppDamage} HP.`);
                }
            }
        } else {
            lines.push(`• 💨 Ви блискуче парирували або ухилилися від атаки суперника в ${zoneLabels[oppAttackZone]} (${oppTotal} ≤ ${playerDefTotal}).`);
        }
    } else {
        lines.push(`• 🏆 ПЕРЕМОГА! Клинок суперника вибито з рук, поєдинок завершено вашим тріумфом!`);
    }

    const log: BrawlRoundLog = {
        roundNumber,
        playerAttackZone,
        playerDefenseZone,
        oppAttackZone,
        oppDefenseZone,
        playerD20,
        playerHitModifier,
        playerTotal,
        oppDefenseD20,
        oppDefTotal,
        playerHit,
        playerDamage,
        playerBlocked,
        playerHeadHit,
        oppD20,
        oppHitModifier,
        oppTotal,
        playerDefenseD20,
        playerDefTotal,
        oppHit,
        oppDamage,
        oppBlocked,
        oppHeadHit,
        text: lines.join('\n'),
        playerStance,
        oppStance,
        isShieldBlock: playerShieldBlocked || oppShieldBlocked,
        isParryHalfDamage: playerParryHalfDamage || oppParryHalfDamage
    };

    return {
        log,
        newPlayerHp,
        newOppHp,
        playerStance,
        oppStance
    };
}

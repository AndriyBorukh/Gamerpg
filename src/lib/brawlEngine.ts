import { CombatZone, BrawlRoundLog } from '../types';

export interface BrawlFighter {
    name: string;
    avatar: string;
    title: string;
    baseHp: number;
    strength: number;
    agility: number;
    currentHp: number;
    maxHp: number;
}

// Compute total health according to user formula: "показник здоров'я = базове здоров'я + показник сили"
export function calculateTotalHealth(baseHp: number, strength: number): number {
    return Math.max(10, Math.round(baseHp + strength));
}

// AI choice generator for opponent
export function pickOpponentCombatZones(
    roundNumber: number,
    oppCurrentHp: number,
    oppMaxHp: number,
    playerPreviousAttackZone?: CombatZone
): { attackZone: CombatZone; defenseZone: CombatZone } {
    const zones: CombatZone[] = ['head', 'torso', 'legs'];

    // If opponent is heavily damaged (below 35% HP), they are more likely to protect the head from 4x critical punch
    let defenseZone: CombatZone;
    if (oppCurrentHp / oppMaxHp < 0.35 && Math.random() < 0.6) {
        defenseZone = 'head';
    } else if (playerPreviousAttackZone && Math.random() < 0.45) {
        // AI might anticipate the player repeating their attack zone
        defenseZone = playerPreviousAttackZone;
    } else {
        defenseZone = zones[Math.floor(Math.random() * zones.length)];
    }

    // AI attack zone selection
    const attackZone = zones[Math.floor(Math.random() * zones.length)];

    return { attackZone, defenseZone };
}

export function rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
}

export interface RoundResolution {
    log: BrawlRoundLog;
    newPlayerHp: number;
    newOppHp: number;
}

// Hit modifiers according to rule:
// "голова -2, тулуб 3, ноги 2"
// "1д20 + параметр спритності гравця + модифікатор попадання > 1д20 + параметр спритності супротивника"
export const BRAWL_HIT_MODIFIERS: Record<CombatZone, number> = {
    head: -2,
    torso: 3,
    legs: 2
};

export function resolveBrawlRound(
    roundNumber: number,
    player: BrawlFighter,
    opp: BrawlFighter,
    playerAttackZone: CombatZone,
    playerDefenseZone: CombatZone,
    oppAttackZone: CombatZone,
    oppDefenseZone: CombatZone
): RoundResolution {
    // 1. Player Attack on Opponent
    // Rule: "1д20 + параметр спритності гравця + модифікатор попадання > 1д20 + параметр спритності супротивника"
    const playerHitModifier = BRAWL_HIT_MODIFIERS[playerAttackZone];
    const playerD20 = rollD20();
    const oppDefenseD20 = rollD20();
    const playerTotal = playerD20 + player.agility + playerHitModifier;
    const oppDefTotal = oppDefenseD20 + opp.agility;
    const playerHit = playerTotal > oppDefTotal;

    let playerDamage = 0;
    const playerBlocked = oppDefenseZone === playerAttackZone;
    const playerHeadHit = playerAttackZone === 'head';

    if (playerHit) {
        // Base punch damage based on player's strength
        const base = Math.max(8, Math.round(12 + player.strength * 0.75 + (Math.random() * 4 - 2)));
        
        let dmg = base;
        // Head punch deals quadruple damage: "по голові у випадку попадання надходить почетвірне пошкодження"
        if (playerHeadHit) {
            dmg = dmg * 4;
        }

        // Guessing defense: "якщо гравець/супротивник вгадав з захистом то йому наносять лише чверть пошкодження, якщо ні то повністю"
        if (playerBlocked) {
            dmg = Math.max(1, Math.round(dmg * 0.25));
        }

        playerDamage = dmg;
    }

    const newOppHp = Math.max(0, opp.currentHp - playerDamage);

    // 2. Opponent Attack on Player (if opponent is still conscious or in the exchange)
    const oppHitModifier = BRAWL_HIT_MODIFIERS[oppAttackZone];
    const oppD20 = rollD20();
    const playerDefenseD20 = rollD20();
    const oppTotal = oppD20 + opp.agility + oppHitModifier;
    const playerDefTotal = playerDefenseD20 + player.agility;
    const oppHit = oppTotal > playerDefTotal;

    let oppDamage = 0;
    const oppBlocked = playerDefenseZone === oppAttackZone;
    const oppHeadHit = oppAttackZone === 'head';

    if (oppHit && newOppHp > 0) {
        const base = Math.max(8, Math.round(10 + opp.strength * 0.65 + (Math.random() * 4 - 2)));
        let dmg = base;

        if (oppHeadHit) {
            dmg = dmg * 4;
        }

        if (oppBlocked) {
            dmg = Math.max(1, Math.round(dmg * 0.25));
        }

        oppDamage = dmg;
    }

    const newPlayerHp = Math.max(0, player.currentHp - oppDamage);

    // Human-readable zone labels
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

    // Construct text log
    const lines: string[] = [];
    lines.push(`🥊 Раунд ${roundNumber}:`);
    
    // Player attack narrative
    if (playerHit) {
        if (playerHeadHit) {
            if (playerBlocked) {
                lines.push(`• Влучний удар у ГОЛОВУ (1d20: ${playerD20} + Спр: ${player.agility} ${pModStr} [мод зони] = ${playerTotal} > ${oppDefenseD20}+${opp.agility}=${oppDefTotal}), але суперник встиг закритися блоком! Чверть шкоди (4x × 25%): -${playerDamage} HP.`);
            } else {
                lines.push(`• 💥 КРИТИЧНИЙ НОКАУТУЮЧИЙ УДАР У ГОЛОВУ! (1d20: ${playerD20} + Спр: ${player.agility} ${pModStr} = ${playerTotal} > ${oppDefenseD20}+${opp.agility}=${oppDefTotal}). Почетвірне пошкодження (4x): -${playerDamage} HP!`);
            }
        } else {
            if (playerBlocked) {
                lines.push(`• Ви поцілили в ${zoneLabels[playerAttackZone]} (Кидок: ${playerD20} + Спр: ${player.agility} ${pModStr} = ${playerTotal} > ${oppDefTotal}), але суперник поставив блок ${zoneDefenseLabels[oppDefenseZone]}! Чверть шкоди: -${playerDamage} HP.`);
            } else {
                lines.push(`• Точний удар у ${zoneLabels[playerAttackZone]} (Кидок: ${playerD20} + Спр: ${player.agility} ${pModStr} = ${playerTotal} > ${oppDefTotal})! Нанесено -${playerDamage} HP.`);
            }
        }
    } else {
        lines.push(`• Промах по ${zoneLabels[playerAttackZone]}! Кидок: 1d20 (${playerD20}) + Спр (${player.agility}) ${pModStr} = ${playerTotal} ≤ захисту суперника (${oppDefenseD20}+${opp.agility}=${oppDefTotal}).`);
    }

    // Opponent attack narrative
    if (newOppHp > 0) {
        if (oppHit) {
            if (oppHeadHit) {
                if (oppBlocked) {
                    lines.push(`• 🛡️ Ви вчасно прикрили голову! Суперник влучив (${oppD20}+${opp.agility}${oppModStr}=${oppTotal} > ${playerDefTotal}), але ви прийняли удар на блок (чверть шкоди): -${oppDamage} HP.`);
                } else {
                    lines.push(`• 🩸 НЕБЕЗПЕКА! Суперник пробив прямий у ГОЛОВУ (${oppD20}+${opp.agility}${oppModStr}=${oppTotal} > ${playerDefTotal})! Почетвірне пошкодження (4x): -${oppDamage} HP!`);
                }
            } else {
                if (oppBlocked) {
                    lines.push(`• 🛡️ Вдалий захист! Суперник атакував ${zoneLabels[oppAttackZone]} (${oppTotal} > ${playerDefTotal}), але ви вгадали блок ${zoneDefenseLabels[playerDefenseZone]}: -${oppDamage} HP (25%).`);
                } else {
                    lines.push(`• Суперник завдав удару в ${zoneLabels[oppAttackZone]} (${oppD20}+${opp.agility}${oppModStr}=${oppTotal} > ${playerDefTotal}): -${oppDamage} HP.`);
                }
            }
        } else {
            lines.push(`• 💨 Ви блискуче ухилилися від випаду суперника в ${zoneLabels[oppAttackZone]}! (${oppTotal} ≤ вашого ${playerDefTotal}).`);
        }
    } else {
        lines.push(`• 🏆 НОКАУТ! Суперник впав на долівку та не може продовжити бій!`);
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
        text: lines.join('\n')
    };

    return {
        log,
        newPlayerHp,
        newOppHp
    };
}

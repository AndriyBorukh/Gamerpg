import { Character, Enemy, Spell } from './jrpgTypes';

// Physical damage formula from GDD Section 3.5:
// A = W + STR_eff + B_attack
// D_raw = max(1, A - DEF_eff)
// D = max(1, floor(D_raw * R * M_crit * M_element))
export const calculatePhysicalDamage = (
    attacker: { stats: { str: number; agi: number; lck: number } },
    defender: { stats: { vit: number; agi: number } },
    weaponPower: number = 12
): { damage: number; isCrit: boolean; isHit: boolean } => {
    const attAgi = typeof attacker?.stats?.agi === 'number' && !isNaN(attacker.stats.agi) ? attacker.stats.agi : 8;
    const defAgi = typeof defender?.stats?.agi === 'number' && !isNaN(defender.stats.agi) ? defender.stats.agi : 8;
    
    // Hit check (GDD 3.4)
    const hitRate = Math.min(98, Math.max(5, 80 + Math.floor(attAgi / 2) - Math.floor(defAgi / 2)));
    const hitRoll = Math.random() * 100;
    if (hitRoll > hitRate) {
        return { damage: 0, isCrit: false, isHit: false };
    }

    const str = typeof attacker?.stats?.str === 'number' && !isNaN(attacker.stats.str) ? attacker.stats.str : 8;
    const vit = typeof defender?.stats?.vit === 'number' && !isNaN(defender.stats.vit) ? defender.stats.vit : 6;
    const wPower = typeof weaponPower === 'number' && !isNaN(weaponPower) ? weaponPower : 12;

    const A = wPower + str + 4;
    const DEF = Math.max(1, Math.floor(vit * 0.8));
    const rawDamage = Math.max(1, A - DEF);

    // Random variance R: 0.90 - 1.10
    const R = 0.90 + Math.random() * 0.20;

    // Crit check based on LCK
    const lck = typeof attacker?.stats?.lck === 'number' && !isNaN(attacker.stats.lck) ? attacker.stats.lck : 5;
    const critRate = Math.min(30, Math.max(5, lck * 2));
    const isCrit = (Math.random() * 100) < critRate;
    const critMult = isCrit ? 1.5 : 1.0;

    const damage = Math.max(1, Math.floor(rawDamage * R * critMult));
    return { damage: isNaN(damage) ? 6 : damage, isCrit, isHit: true };
};

// Magic damage formula from GDD Section 3.8:
// D_magic = floor((B_spell + 2 * INT_eff + L) * R)
export const calculateMagicDamage = (
    caster: { stats: { int: number }; level?: number },
    spell: Spell
): { damage: number; isCrit: boolean } => {
    const intVal = typeof caster?.stats?.int === 'number' && !isNaN(caster.stats.int) ? caster.stats.int : 12;
    const lvl = typeof caster?.level === 'number' && !isNaN(caster.level) ? caster.level : 0;
    const basePower = typeof spell?.basePower === 'number' && !isNaN(spell.basePower) ? spell.basePower : 20;

    const rawPower = basePower + 2 * intVal + lvl;
    const R = 0.90 + Math.random() * 0.20;
    const damage = Math.max(1, Math.floor(rawPower * R));
    return { damage: isNaN(damage) ? 15 : damage, isCrit: false };
};

// Healing formula from GDD Section 2.6:
// Heal = BaseHeal + 2 * MND + floor(L / 2)
export const calculateHealing = (
    healer: { stats: { mnd: number }; level?: number },
    spell: Spell
): number => {
    const mndVal = typeof healer?.stats?.mnd === 'number' && !isNaN(healer.stats.mnd) ? healer.stats.mnd : 12;
    const lvl = typeof healer?.level === 'number' && !isNaN(healer.level) ? healer.level : 0;
    const basePower = typeof spell?.basePower === 'number' && !isNaN(spell.basePower) ? spell.basePower : 20;

    const rawHeal = basePower + 2 * mndVal + Math.floor(lvl / 2);
    const R = 0.95 + Math.random() * 0.10;
    const heal = Math.max(10, Math.floor(rawHeal * R));
    return isNaN(heal) ? 20 : heal;
};

// Initiative formula from GDD Section 3.3:
// I = AGI + S_skill + R (0..9)
export const calculateInitiative = (char: { stats: { agi: number } }): number => {
    const agi = typeof char?.stats?.agi === 'number' && !isNaN(char.stats.agi) ? char.stats.agi : 8;
    return agi + Math.floor(Math.random() * 10);
};


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
    // Hit check (GDD 3.4)
    // H_raw = H_weapon (80) + floor(AGI/2) - E_target (defender.agi/2)
    const hitRate = Math.min(98, Math.max(5, 80 + Math.floor(attacker.stats.agi / 2) - Math.floor(defender.stats.agi / 2)));
    const hitRoll = Math.random() * 100;
    if (hitRoll > hitRate) {
        return { damage: 0, isCrit: false, isHit: false };
    }

    const A = weaponPower + attacker.stats.str + 4;
    const DEF = Math.max(1, Math.floor(defender.stats.vit * 0.8));
    const rawDamage = Math.max(1, A - DEF);

    // Random variance R: 0.90 - 1.10
    const R = 0.90 + Math.random() * 0.20;

    // Crit check based on LCK
    const critRate = Math.min(30, Math.max(5, attacker.stats.lck * 2));
    const isCrit = (Math.random() * 100) < critRate;
    const critMult = isCrit ? 1.5 : 1.0;

    const damage = Math.max(1, Math.floor(rawDamage * R * critMult));
    return { damage, isCrit, isHit: true };
};

// Magic damage formula from GDD Section 3.8:
// D_magic = floor((B_spell + 2 * INT_eff + L) * R)
export const calculateMagicDamage = (
    caster: { stats: { int: number }; level: number },
    spell: Spell
): { damage: number; isCrit: boolean } => {
    const rawPower = spell.basePower + 2 * caster.stats.int + caster.level;
    const R = 0.90 + Math.random() * 0.20;
    const damage = Math.max(1, Math.floor(rawPower * R));
    return { damage, isCrit: false };
};

// Healing formula from GDD Section 2.6:
// Heal = BaseHeal + 2 * MND + floor(L / 2)
export const calculateHealing = (
    healer: { stats: { mnd: number }; level: number },
    spell: Spell
): number => {
    const rawHeal = spell.basePower + 2 * healer.stats.mnd + Math.floor(healer.level / 2);
    const R = 0.95 + Math.random() * 0.10;
    return Math.max(10, Math.floor(rawHeal * R));
};

// Initiative formula from GDD Section 3.3:
// I = AGI + S_skill + R (0..9)
export const calculateInitiative = (char: { stats: { agi: number } }): number => {
    return char.stats.agi + Math.floor(Math.random() * 10);
};

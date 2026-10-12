import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MonsterSquad } from '../lib/monsters/wanderingMonsters';
import { WorldProgress, HiredCompanion } from '../types';
import { DEFAULT_PLAYER_STATS, saveWorldProgress } from '../lib/worldData';
import { COMPANION_CLASSES } from '../lib/companionClasses';
import { 
    playSwordClashSound, 
    playShieldBlockSound, 
    playPunchSound, 
    playBowShotSound, 
    playSpellCastSound, 
    playRetroBeepSound,
    playGoldSound,
    playLevelUpSound
} from '../lib/soundEffects';
import { CLASS_SPRITE_MAP, HERO_COMMANDER_SPRITE, BANDIT_MAP_SPRITE } from '../lib/companionSprites';

// Grid Dimensions
const GRID_COLS = 10;
const GRID_ROWS = 7;

// Calculates exactly 2 by 2 tiles area (2 columns wide by 2 rows high, clamped to grid edges)
export const getAoe2x2Tiles = (targetX: number, targetY: number): { x: number; y: number }[] => {
    const startX = Math.max(0, Math.min(GRID_COLS - 2, targetX));
    const startY = Math.max(0, Math.min(GRID_ROWS - 2, targetY));
    const tiles: { x: number; y: number }[] = [];
    for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
            const x = startX + dx;
            const y = startY + dy;
            if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) {
                tiles.push({ x, y });
            }
        }
    }
    return tiles;
};

// Calculates exactly 2 by 3 tiles area (2 columns wide by 3 rows high, clamped to grid edges)
export const getAoe2x3Tiles = (targetX: number, targetY: number): { x: number; y: number }[] => {
    const startX = Math.max(0, Math.min(GRID_COLS - 2, targetX));
    const startY = Math.max(0, Math.min(GRID_ROWS - 3, targetY - 1));
    const tiles: { x: number; y: number }[] = [];
    for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 3; dy++) {
            const x = startX + dx;
            const y = startY + dy;
            if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) {
                tiles.push({ x, y });
            }
        }
    }
    return tiles;
};

// Returns AoE tiles based on spell type (2x2 for Fireball, 2x3 for Arrow Rain)
export const getSpellAoeTiles = (spell: CombatSpell | null, targetX: number, targetY: number): { x: number; y: number }[] => {
    if (!spell) return [];
    const isFireball = spell.element === 'fire' || spell.name.toLowerCase().includes('вогнян') || spell.id.includes('fireball');
    if (isFireball || (spell.aoeWidth === 2 && spell.aoeHeight === 2)) {
        return getAoe2x2Tiles(targetX, targetY);
    }
    return getAoe2x3Tiles(targetX, targetY);
};

export interface CombatSpell {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: string; // e.g. "2 SP" or "1 Заряд"
    pointCost: number; // spell points / ability charges required
    type: 'damage_single' | 'damage_aoe' | 'heal' | 'buff' | 'control' | 'trap' | 'damage_multi';
    power: number;
    range: number;
    hitCount?: number;
    aoeWidth?: number;
    aoeHeight?: number;
    element: 'fire' | 'lightning' | 'holy' | 'shadow' | 'physical';
}

export interface PlacedMine {
    id: string;
    x: number;
    y: number;
    ownerId: string;
    ownerName: string;
    ownerSide: 'player' | 'enemy';
    damage: number;
    radius: number;
}

export interface Combatant {
    id: string;
    name: string;
    title: string;
    side: 'player' | 'enemy';
    isPlayer?: boolean;
    isLeader?: boolean;
    companionClassId?: string;
    avatar: string;
    spriteUrl?: string;
    classType: 'melee' | 'ranged' | 'caster' | 'hybrid';
    hp: number;
    maxHp: number;
    ac: number; // Armor class (lower is harder to hit, like classic D&D, or armor defense: 2 = high armor!)
    strength: number;
    agility: number;
    range: number; // 1 for melee, 5-7 for ranged
    moveSpeed: number; // tiles per turn (usually 3 or 4)
    x: number;
    y: number;
    isDefeated: boolean;
    hasMoved: boolean;
    hasActed: boolean;
    isGuarding: boolean;
    currentPoints: number; // current SP or ability charges
    maxPoints: number; // max SP or charges (restores on level up)
    pointsName: string; // 'SP' or 'Заряди' or 'Енергія'
    spells: CombatSpell[];
    statusEffects: {
        poisonTurns?: number;
        buffDamage?: number;
        buffAc?: number;
    };
    survivalProbability?: number; // Starting chance to survive fatal wounds / being downed (0-100%)
    isDead?: boolean; // Truly dead (failed survival roll)
    isSummon?: boolean;
}

interface ProjectileAnimation {
    id: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    type: 'arrow' | 'fireball' | 'lightning' | 'holy';
}

interface FloatingText {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
}

interface GoldBoxCombatModalProps {
    squad: MonsterSquad;
    progress: WorldProgress;
    preemptiveDamage?: number;
    onUpdateProgress: (updated: WorldProgress) => void;
    onVictory: (rewards: { gold: number; cardPieces: number; xp: number; reputation: number }) => void;
    onDefeat: () => void;
    onFlee: () => void;
    onClose: () => void;
}

// Built-in Player Spells & Skills
const PLAYER_DEFAULT_SPELLS: CombatSpell[] = [
    {
        id: 'spell_fireball',
        name: 'Вогняна Куля',
        description: 'Магічний вибух вогню по площі 2 на 2 тайли (уражає всіх ворогів у зоні 4 клітинок)',
        icon: '🔥',
        cost: '2 SP',
        pointCost: 2,
        type: 'damage_aoe',
        power: 34,
        range: 6,
        aoeWidth: 2,
        aoeHeight: 2,
        element: 'fire'
    },
    {
        id: 'spell_magic_missile',
        name: 'Магічна Стріла',
        description: 'Самонавідний чаклунський снаряд без промаху (18-26 шкоди)',
        icon: '⚡',
        cost: '1 SP',
        pointCost: 1,
        type: 'damage_single',
        power: 22,
        range: 6,
        element: 'lightning'
    },
    {
        id: 'spell_cure_wounds',
        name: 'Святе Зцілення',
        description: 'Відновлює 45-55 здоров\'я персонажу або союзнику',
        icon: '✨',
        cost: '2 SP',
        pointCost: 2,
        type: 'heal',
        power: 45,
        range: 6,
        element: 'holy'
    },
    {
        id: 'spell_shield_of_faith',
        name: 'Непохитна Стійка',
        description: 'Підсилює захист (+5 AC) та поглинає удари на 2 раунди',
        icon: '🛡️',
        cost: '1 SP',
        pointCost: 1,
        type: 'buff',
        power: 5,
        range: 1,
        element: 'holy'
    },
    {
        id: 'spell_battle_cry',
        name: 'Бойовий Клич',
        description: 'Піднімає бойовий дух: +6 до шкоди всього загону',
        icon: '⚔️',
        cost: '1 SP',
        pointCost: 1,
        type: 'buff',
        power: 6,
        range: 8,
        element: 'physical'
    },
    {
        id: 'spell_mine',
        name: 'Міна',
        description: 'Встановлює в клітинці перед собою приховану міну, яку не бачать вороги. При наступанні ворога вибухає по всіх у радіусі 1 кл.',
        icon: '💣',
        cost: '1 SP',
        pointCost: 1,
        type: 'trap',
        power: 45,
        range: 1,
        element: 'physical'
    },
    {
        id: 'spell_flurry_of_blows',
        name: 'Шквал Ударів',
        description: 'Наносить 4 атаки ворогу в межах 1 клітинки підряд (блискавична серія з 4 швидких розрубів)',
        icon: '⚔️',
        cost: '1 SP',
        pointCost: 1,
        type: 'damage_multi',
        power: 14,
        range: 1,
        hitCount: 4,
        element: 'physical'
    },
    {
        id: 'spell_arrow_rain',
        name: 'Град Стріл',
        description: 'Стрілецький залп по площі 2 на 3 тайли (уражає всіх ворогів у зоні 6 клітинок)',
        icon: '🏹',
        cost: '1 SP',
        pointCost: 1,
        type: 'damage_aoe',
        power: 24,
        range: 7,
        aoeWidth: 2,
        aoeHeight: 3,
        element: 'physical'
    },
    {
        id: 'spell_sword_strike',
        name: 'Удар Мечем',
        description: 'Нищівний удар мечем в межах 1 клітинки від воїна — наносить потрійне пошкодження (х3 шкоди)',
        icon: '🗡️',
        cost: '1 SP',
        pointCost: 1,
        type: 'damage_single',
        power: 20,
        range: 1,
        element: 'physical'
    }
];

export const GoldBoxCombatModal: React.FC<GoldBoxCombatModalProps> = ({
    squad,
    progress,
    preemptiveDamage = 0,
    onUpdateProgress,
    onVictory,
    onDefeat,
    onFlee,
    onClose
}) => {
    // Determine Ranged classes
    const isRangedClass = (classId?: string, role?: string): boolean => {
        if (!classId && !role) return false;
        const text = `${classId || ''} ${role || ''}`.toLowerCase();
        return (
            text.includes('hunter') ||
            text.includes('sniper') ||
            text.includes('bow') ||
            text.includes('archer') ||
            text.includes('лук') ||
            text.includes('стріл') ||
            text.includes('арбалет') ||
            text.includes('arbalest') ||
            text.includes('skirmish') ||
            text.includes('thrower') ||
            text.includes('musket') ||
            text.includes('arquebus')
        );
    };

    // Determine Caster classes
    const isCasterClass = (classId?: string, role?: string): boolean => {
        if (!classId && !role) return false;
        const text = `${classId || ''} ${role || ''}`.toLowerCase();
        return (
            text.includes('wizard') ||
            text.includes('mage') ||
            text.includes('pyro') ||
            text.includes('cryo') ||
            text.includes('necro') ||
            text.includes('sorcerer') ||
            text.includes('cleric') ||
            text.includes('priest') ||
            text.includes('shaman') ||
            text.includes('druid') ||
            text.includes('warlock') ||
            text.includes('inquisitor') ||
            text.includes('чаклун') ||
            text.includes('маг') ||
            text.includes('жрець')
        );
    };

    // Build initial combatants list
    const initializeCombatants = (): Combatant[] => {
        const list: Combatant[] = [];

        // 1. Player
        const pStats = progress.playerStats || DEFAULT_PLAYER_STATS;
        const playerMaxHp = (pStats.baseHp || 100) + (pStats.strength || 15);
        const playerHp = pStats.currentHp && pStats.currentHp > 0 ? Math.min(playerMaxHp, pStats.currentHp) : playerMaxHp;
        const hasBowSkill = (pStats.bowProficiency || 0) > 0 || (pStats.totalBowShots || 0) > 0;
        const playerMaxSp = pStats.maxSpellPoints || (6 + (pStats.level || 0) * 2);
        const playerCurSp = pStats.currentSpellPoints !== undefined ? Math.min(playerMaxSp, pStats.currentSpellPoints) : playerMaxSp;
        
        list.push({
            id: 'player_hero',
            name: 'СИР ОЛЬГЕРД',
            title: 'Ватажок Загону',
            side: 'player',
            isPlayer: true,
            isLeader: true,
            avatar: '👑',
            spriteUrl: HERO_COMMANDER_SPRITE,
            classType: hasBowSkill ? 'hybrid' : 'melee',
            hp: playerHp,
            maxHp: playerMaxHp,
            ac: 3, // Excellent knight AC
            strength: pStats.strength || 16,
            agility: pStats.agility || 14,
            range: hasBowSkill ? 5 : 1,
            moveSpeed: 3,
            x: 1,
            y: 3,
            isDefeated: false,
            hasMoved: false,
            hasActed: false,
            isGuarding: false,
            currentPoints: playerCurSp,
            maxPoints: playerMaxSp,
            pointsName: 'SP',
            spells: PLAYER_DEFAULT_SPELLS,
            statusEffects: {}
        });

        // 2. Player Companions (or default squires if none hired)
        const hiredList = (progress.hiredNpcs && progress.hiredNpcs.length > 0 ? progress.hiredNpcs : []).filter(c => !c.isDead);
        if (hiredList.length > 0) {
            hiredList.slice(0, 5).forEach((comp, idx) => {
                const cClass = comp.companionClassId ? COMPANION_CLASSES[comp.companionClassId] : null;
                const ranged = isRangedClass(comp.companionClassId, cClass?.description);
                const caster = isCasterClass(comp.companionClassId, cClass?.description);
                const maxCharges = comp.maxAbilityCharges || 3;
                const curCharges = comp.currentAbilityCharges !== undefined ? Math.min(maxCharges, comp.currentAbilityCharges) : maxCharges;

                const compSpells: CombatSpell[] = [];
                if (cClass) {
                    const isTrap = cClass.id === 'saboteur' || cClass.abilityName === 'Міна' || (cClass.abilityType as string) === 'trap';
                    const isMulti = cClass.id === 'swordsman' || cClass.abilityName === 'Шквал Ударів' || (cClass.abilityType as string) === 'damage_multi';
                    const isHeal = cClass.id === 'priest' || cClass.id === 'cleric' || cClass.abilityName === 'Святе Зцілення' || cClass.abilityName.toLowerCase().includes('зцілення') || (cClass.abilityType as string) === 'heal_player' || (cClass.abilityType as string) === 'heal';
                    const isArrowRain = cClass.id === 'ranger' || cClass.abilityName === 'Град Стріл' || cClass.abilityName.toLowerCase().includes('град');
                    compSpells.push({
                        id: `comp_spell_${comp.id}`,
                        name: cClass.abilityName,
                        description: isArrowRain ? 'Атака ворогів по площі 2 на 3 тайли.' : cClass.abilityDescription,
                        icon: isMulti ? '⚔️' : isTrap ? '💣' : isHeal ? '✨' : isArrowRain ? '🏹' : caster ? '🔮' : ranged ? '🎯' : '💥',
                        cost: '1 Заряд',
                        pointCost: 1,
                        type: isMulti ? 'damage_multi' : isTrap ? 'trap' : isHeal ? 'heal' : isArrowRain ? 'damage_aoe' : cClass.abilityType === 'buff_player' ? 'buff' : cClass.abilityType === 'damage_aoe' ? 'damage_aoe' : 'damage_single',
                        power: cClass.abilityPower || (isTrap ? 45 : isHeal ? 50 : 25),
                        range: isTrap ? 1 : isHeal ? 6 : isArrowRain ? 7 : (ranged || caster ? 6 : 1),
                        hitCount: isMulti ? (cClass.hitCount || 4) : 1,
                        aoeWidth: isArrowRain ? 2 : undefined,
                        aoeHeight: isArrowRain ? 3 : undefined,
                        element: isTrap ? 'physical' : isHeal ? 'holy' : isArrowRain ? 'physical' : (caster ? 'fire' : 'physical')
                    });
                }

                // Add secondary skill
                if (ranged) {
                    compSpells.push({
                        id: `comp_snipe_${comp.id}`,
                        name: 'Снайперський Постріл',
                        description: 'Точний постріл у вразливе місце (+50% шкоди)',
                        icon: '🏹',
                        cost: '1 Заряд',
                        pointCost: 1,
                        type: 'damage_single',
                        power: 35,
                        range: 7,
                        element: 'physical'
                    });
                } else if (caster) {
                    compSpells.push({
                        id: `comp_heal_${comp.id}`,
                        name: 'Магічний Щит',
                        description: 'Тимчасовий бар\'єр для соратника',
                        icon: '🛡️',
                        cost: '1 Заряд',
                        pointCost: 1,
                        type: 'buff',
                        power: 15,
                        range: 4,
                        element: 'holy'
                    });
                }

                const startY = [1, 5, 2, 4, 0][idx % 5];
                const startX = idx >= 2 ? 0 : 1;

                const compMaxHp = Math.max(comp.baseHp || 0, comp.hp || 0, 50);
                const isDownedAtStart = comp.hp !== undefined && comp.hp <= 0;
                const compHp = isDownedAtStart ? 0 : Math.min(compMaxHp, Math.max(1, comp.hp ?? compMaxHp));

                list.push({
                    id: comp.id,
                    name: comp.name.toUpperCase(),
                    title: cClass?.name || 'Супутник',
                    side: 'player',
                    companionClassId: comp.companionClassId,
                    avatar: comp.avatar || (ranged ? '🏹' : caster ? '🧙' : '⚔️'),
                    spriteUrl: CLASS_SPRITE_MAP[comp.companionClassId || 'swordsman'],
                    classType: ranged ? 'ranged' : caster ? 'caster' : 'melee',
                    hp: compHp,
                    maxHp: compMaxHp,
                    ac: ranged ? 5 : caster ? 6 : 4,
                    strength: comp.strength || 12,
                    agility: comp.agility || 13,
                    range: ranged ? 6 : caster ? 5 : 1,
                    moveSpeed: ranged ? 3 : 3,
                    x: startX,
                    y: startY,
                    isDefeated: isDownedAtStart,
                    hasMoved: false,
                    hasActed: false,
                    isGuarding: false,
                    currentPoints: curCharges,
                    maxPoints: maxCharges,
                    pointsName: 'Заряди',
                    spells: compSpells,
                    statusEffects: {},
                    survivalProbability: comp.survivalProbability !== undefined ? comp.survivalProbability : 95,
                    isDead: false,
                    isSummon: comp.isSummon ?? false
                });
            });
        } else {
            // Default party companions so player has a full Gold Box squad!
            list.push({
                id: 'comp_archer_squire',
                name: 'БОГДАН ЛУЧНИК',
                title: 'Королівський Стрілець',
                side: 'player',
                companionClassId: 'hunter',
                avatar: '🏹',
                spriteUrl: '/assets/images/medieval_ranger_archer_1789859220352.jpg',
                classType: 'ranged',
                hp: 45,
                maxHp: 45,
                ac: 5,
                strength: 11,
                agility: 16,
                range: 6,
                moveSpeed: 3,
                x: 1,
                y: 1,
                isDefeated: false,
                hasMoved: false,
                hasActed: false,
                isGuarding: false,
                currentPoints: 3,
                maxPoints: 3,
                pointsName: 'Заряди',
                spells: [
                    {
                        id: 'squire_snipe',
                        name: 'Прицільний Постріл',
                        description: 'Стрілецька атака на велику відстань (28 шкоди)',
                        icon: '🏹',
                        cost: '1 Заряд',
                        pointCost: 1,
                        type: 'damage_single',
                        power: 28,
                        range: 7,
                        element: 'physical'
                    },
                    {
                        id: 'squire_poison_arrow',
                        name: 'Отруйна Стріла',
                        description: 'Завдає 20 шкоди та отруює супротивника',
                        icon: '🧪',
                        cost: '1 Заряд',
                        pointCost: 1,
                        type: 'damage_single',
                        power: 20,
                        range: 6,
                        element: 'physical'
                    },
                    {
                        id: 'squire_arrow_rain',
                        name: 'Град Стріл',
                        description: 'Стрілецький залп по площі 2 на 3 тайли (уражає всіх ворогів у зоні 6 клітинок)',
                        icon: '🏹',
                        cost: '1 Заряд',
                        pointCost: 1,
                        type: 'damage_aoe',
                        power: 24,
                        range: 7,
                        aoeWidth: 2,
                        aoeHeight: 3,
                        element: 'physical'
                    }
                ],
                statusEffects: {}
            });

            list.push({
                id: 'comp_cleric_squire',
                name: 'БРАТ МИХАЙЛО',
                title: 'Капелан Світла',
                side: 'player',
                companionClassId: 'cleric',
                avatar: '🧙',
                spriteUrl: '/assets/images/card_cleric_healer_art_1787957211257.jpg',
                classType: 'caster',
                hp: 55,
                maxHp: 55,
                ac: 4,
                strength: 13,
                agility: 11,
                range: 4,
                moveSpeed: 3,
                x: 0,
                y: 2,
                isDefeated: false,
                hasMoved: false,
                hasActed: false,
                isGuarding: false,
                currentPoints: 3,
                maxPoints: 3,
                pointsName: 'Заряди',
                spells: [
                    {
                        id: 'cleric_heal',
                        name: 'Святе Зцілення',
                        description: 'Відновлює 45-55 HP пораненому персонажу чи союзнику',
                        icon: '✨',
                        cost: '1 Заряд',
                        pointCost: 1,
                        type: 'heal',
                        power: 45,
                        range: 6,
                        element: 'holy'
                    },
                    {
                        id: 'cleric_smite',
                        name: 'Священна Кара',
                        description: 'Промінь святого гніву (25 шкоди)',
                        icon: '⚡',
                        cost: '1 Заряд',
                        pointCost: 1,
                        type: 'damage_single',
                        power: 25,
                        range: 5,
                        element: 'holy'
                    }
                ],
                statusEffects: {}
            });

            list.push({
                id: 'comp_shield_squire',
                name: 'ТАРАС ВАРТОВИЙ',
                title: 'Важкий Піхотинець',
                side: 'player',
                companionClassId: 'guardian',
                avatar: '🛡️',
                spriteUrl: '/assets/images/medieval_heavy_manatarms_1789859236209.jpg',
                classType: 'melee',
                hp: 70,
                maxHp: 70,
                ac: 2,
                strength: 15,
                agility: 9,
                range: 1,
                moveSpeed: 3,
                x: 1,
                y: 5,
                isDefeated: false,
                hasMoved: false,
                hasActed: false,
                isGuarding: false,
                currentPoints: 3,
                maxPoints: 3,
                pointsName: 'Заряди',
                spells: [
                    {
                        id: 'shield_bash',
                        name: 'Удар Щитом',
                        description: 'Оглушає супротивника та завдає 20 шкоди',
                        icon: '🛡️',
                        cost: '1 Заряд',
                        pointCost: 1,
                        type: 'damage_single',
                        power: 20,
                        range: 1,
                        element: 'physical'
                    }
                ],
                statusEffects: {}
            });
        }

        // 3. Enemy Leader (Umber Hulk or squad leader)
        const leaderMaxHp = Math.max(squad.leader.maxHp || 0, squad.leader.baseHp || 0, squad.leader.hp || 0, squad.leader.opponent?.baseHp || 0, squad.leader.opponent?.hp || 0, 70);
        const leaderHp = Math.min(leaderMaxHp, Math.max(15, (squad.leader.hp || leaderMaxHp) - preemptiveDamage));
        const isNecroLeader = `${squad.leader.title} ${squad.leader.name} ${squad.category}`.toLowerCase().includes('некромант') || squad.category === 'undead';
        const leaderIsRanged = isNecroLeader || isRangedClass(undefined, squad.leader.title) || isCasterClass(undefined, squad.leader.title);
        
        list.push({
            id: `enemy_leader_${squad.id}`,
            name: squad.leader.name.toUpperCase(),
            title: squad.leader.title,
            side: 'enemy',
            isLeader: true,
            avatar: (!squad.leader.avatar || squad.leader.avatar.startsWith('/') || squad.leader.avatar.includes('.')) ? '🥷' : squad.leader.avatar,
            spriteUrl: BANDIT_MAP_SPRITE,
            classType: isNecroLeader ? 'caster' : leaderIsRanged ? 'ranged' : 'melee',
            hp: leaderHp,
            maxHp: leaderMaxHp,
            ac: isNecroLeader ? 5 : 2,
            strength: squad.leader.strength || 18,
            agility: squad.leader.agility || 12,
            range: leaderIsRanged ? 6 : 1,
            moveSpeed: 3,
            x: 8,
            y: 3,
            isDefeated: false,
            hasMoved: false,
            hasActed: false,
            isGuarding: false,
            currentPoints: 3,
            maxPoints: 3,
            pointsName: 'Енергія',
            spells: isNecroLeader ? [
                {
                    id: 'enemy_necro_ray',
                    name: 'Некротичний Промінь',
                    description: 'Темний промінь смерті, що завдає 28 шкоди',
                    icon: '🔮',
                    cost: '1 Енергія',
                    pointCost: 1,
                    type: 'damage_single',
                    power: 28,
                    range: 6,
                    element: 'shadow'
                },
                {
                    id: 'enemy_necro_curse',
                    name: 'Прокляття Мертвих',
                    description: 'Хвиля темної магії по площі (22 шкоди)',
                    icon: '💀',
                    cost: '1 Енергія',
                    pointCost: 1,
                    type: 'damage_aoe',
                    power: 22,
                    range: 5,
                    element: 'shadow'
                }
            ] : [
                {
                    id: 'enemy_monster_roar',
                    name: 'Жахливий Рев',
                    description: 'Приголомшує ворогів та зменшує їх захист',
                    icon: '📢',
                    cost: '1 Енергія',
                    pointCost: 1,
                    type: 'damage_aoe',
                    power: 18,
                    range: 4,
                    element: 'physical'
                },
                {
                    id: 'enemy_crush',
                    name: 'Нищівний Удар',
                    description: 'Потужний удар іклами чи кігтями (30 шкоди)',
                    icon: '💀',
                    cost: '1 Енергія',
                    pointCost: 1,
                    type: 'damage_single',
                    power: 30,
                    range: 1,
                    element: 'physical'
                }
            ],
            statusEffects: {}
        });

        // 4. Enemy Allies (up to 14 zombies/skeletons/thugs)
        const validAllies = squad.allies && squad.allies.length > 0
            ? squad.allies.filter(a => !a.isDefeated)
            : [];

        const enemySpawnY = [1, 5, 2, 4, 0, 6, 3, 1, 5, 2, 4, 0, 6, 3];
        validAllies.slice(0, 14).forEach((ally, idx) => {
            const allyRanged = isRangedClass(undefined, `${ally.name} ${ally.role || ally.title || ''}`) || ally.title?.includes('Стрілець') || ally.name.includes('Арбалетник');
            const allyCaster = isCasterClass(undefined, `${ally.name} ${ally.role || ally.title || ''}`);

            const startY = enemySpawnY[idx % enemySpawnY.length];
            const startX = idx < 4 ? 8 : idx < 9 ? 9 : 7;

            const cleanAvatar = (!ally.avatar || ally.avatar.startsWith('/') || ally.avatar.includes('.'))
                ? (allyRanged ? '🏹' : allyCaster ? '🔮' : '🗡️')
                : ally.avatar;

            const allyMaxHp = Math.max(ally.maxHp || 0, ally.baseHp || 0, ally.hp || 0, ally.opponent?.maxHp || 0, ally.opponent?.baseHp || 0, ally.opponent?.hp || 0, 35);
            const allyCurHp = Math.min(allyMaxHp, Math.max(1, ally.hp || allyMaxHp));

            const isZombie = ally.title === 'Зомбі' || ally.name.includes('Зомбі') || ally.avatar === '🧟';
            const isSkeleton = ally.title.includes('Скелет') || ally.name.includes('Скелет') || ally.avatar === '💀';

            const allySpells: CombatSpell[] = isZombie ? [
                {
                    id: `zombie_bite_${idx}`,
                    name: 'Гнилий Удар Зомбі',
                    description: 'Укус отруєного кадавра (22 шкоди)',
                    icon: '🧟',
                    cost: '1 Енергія',
                    pointCost: 1,
                    type: 'damage_single',
                    power: 22,
                    range: 1,
                    element: 'physical'
                }
            ] : isSkeleton ? [
                {
                    id: `skeleton_strike_${idx}`,
                    name: allyRanged ? 'Постріл зі Скелетного Арбалета' : 'Кістлявий Розруб',
                    description: allyRanged ? 'Стрілецька атака кістлявого стрільця (20 шкоди)' : 'Удар іржавим клинком (20 шкоди)',
                    icon: allyRanged ? '🏹' : '💀',
                    cost: '1 Енергія',
                    pointCost: 1,
                    type: 'damage_single',
                    power: 20,
                    range: allyRanged ? 6 : 1,
                    element: 'physical'
                }
            ] : allyCaster ? [
                {
                    id: `enemy_spell_${idx}`,
                    name: 'Стріла Тіні',
                    description: 'Чорна магія (22 шкоди)',
                    icon: '🔮',
                    cost: '1 Енергія',
                    pointCost: 1,
                    type: 'damage_single',
                    power: 22,
                    range: 5,
                    element: 'shadow'
                }
            ] : allyRanged ? [
                {
                    id: `enemy_arrow_${idx}`,
                    name: 'Залп Стріл',
                    description: 'Стрілецький залп',
                    icon: '🏹',
                    cost: '1 Енергія',
                    pointCost: 1,
                    type: 'damage_single',
                    power: 18,
                    range: 6,
                    element: 'physical'
                }
            ] : [];

            list.push({
                id: `enemy_ally_${idx}_${ally.name}`,
                name: ally.name.toUpperCase(),
                title: ally.title || (ally as any).role || 'Розбійник',
                side: 'enemy',
                avatar: cleanAvatar,
                spriteUrl: BANDIT_MAP_SPRITE,
                classType: allyRanged ? 'ranged' : allyCaster ? 'caster' : 'melee',
                hp: allyCurHp,
                maxHp: allyMaxHp,
                ac: allyRanged ? 6 : allyCaster ? 7 : isZombie ? 8 : 5,
                strength: ally.strength || 13,
                agility: ally.agility || 12,
                range: allyRanged ? 6 : allyCaster ? 5 : 1,
                moveSpeed: isZombie ? 2 : 3,
                x: startX,
                y: startY,
                isDefeated: false,
                hasMoved: false,
                hasActed: false,
                isGuarding: false,
                currentPoints: 2,
                maxPoints: 2,
                pointsName: 'Енергія',
                spells: allySpells,
                statusEffects: {}
            });
        });

        return list;
    };

    const [combatants, setCombatants] = useState<Combatant[]>(() => initializeCombatants());
    const [roundNumber, setRoundNumber] = useState<number>(1);
    const [turnOrder, setTurnOrder] = useState<string[]>([]);
    const [activeTurnIndex, setActiveTurnIndex] = useState<number>(0);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [activeMode, setActiveMode] = useState<'idle' | 'move' | 'attack' | 'shoot' | 'cast'>('idle');
    const [selectedSpell, setSelectedSpell] = useState<CombatSpell | null>(null);
    const [combatLog, setCombatLog] = useState<string[]>([
        `*** ПОЧАТОК ТАКТИЧНОГО БОЮ (GOLD BOX) ***`,
        `Загін ${squad.name} проти експедиційного війська Сира Ольгерда!`,
        preemptiveDamage > 0 ? `Засідка завдала ${preemptiveDamage} упереджувальної шкоди вожаку!` : `Сторони зійшлися на полі брані.`
    ]);
    const [projectiles, setProjectiles] = useState<ProjectileAnimation[]>([]);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [placedMines, setPlacedMines] = useState<PlacedMine[]>([]);
    const [detonations, setDetonations] = useState<{ id: string; x: number; y: number }[]>([]);
    const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
    const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
    const [battleOutcome, setBattleOutcome] = useState<'in_progress' | 'victory' | 'defeat'>('in_progress');
    const [autoCombat, setAutoCombat] = useState<boolean>(false);

    const logEndRef = useRef<HTMLDivElement>(null);

    // Obstacle tiles (dungeon pillars or rubble)
    const obstacles = useMemo(() => [
        { x: 4, y: 1 },
        { x: 4, y: 5 },
        { x: 5, y: 3 }
    ], []);

    // Roll Initiative at start of round
    const rollInitiative = useCallback((currentCombatants: Combatant[]) => {
        const alive = currentCombatants.filter(c => !c.isDefeated);
        // Sort by Agility + random 1..10
        const sorted = [...alive].sort((a, b) => {
            const rollA = a.agility + Math.floor(Math.random() * 10);
            const rollB = b.agility + Math.floor(Math.random() * 10);
            return rollB - rollA;
        });
        return sorted.map(c => c.id);
    }, []);

    // Initialize round
    useEffect(() => {
        const order = rollInitiative(combatants);
        setTurnOrder(order);
        setActiveTurnIndex(0);
        // Set default inspect target to enemy leader
        const leader = combatants.find(c => c.side === 'enemy' && c.isLeader);
        if (leader) {
            setSelectedTargetId(leader.id);
        }
    }, []);

    // Scroll combat log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [combatLog]);

    // Active combatant
    const activeCombatantId = turnOrder[activeTurnIndex];
    const activeCombatant = useMemo(() => {
        return combatants.find(c => c.id === activeCombatantId) || null;
    }, [combatants, activeCombatantId]);

    // Inspected combatant (shown in top-right panel like Umber Hulk in screenshot)
    const inspectedCombatant = useMemo(() => {
        if (!selectedTargetId) return activeCombatant;
        return combatants.find(c => c.id === selectedTargetId) || activeCombatant;
    }, [combatants, selectedTargetId, activeCombatant]);

    // Distance calculation (Chebyshev on grid: max of dx, dy)
    const getGridDistance = (x1: number, y1: number, x2: number, y2: number) => {
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    };

    // Range to hovered or inspected target
    const currentHoverRange = useMemo(() => {
        if (!activeCombatant) return 0;
        if (hoveredTile) {
            return getGridDistance(activeCombatant.x, activeCombatant.y, hoveredTile.x, hoveredTile.y);
        }
        if (inspectedCombatant && inspectedCombatant.id !== activeCombatant.id) {
            return getGridDistance(activeCombatant.x, activeCombatant.y, inspectedCombatant.x, inspectedCombatant.y);
        }
        return 0;
    }, [activeCombatant, hoveredTile, inspectedCombatant]);

    // Add float text
    const addFloatingText = (x: number, y: number, text: string, color: string = '#00ff00') => {
        const newId = `float_${Date.now()}_${Math.random()}`;
        setFloatingTexts(prev => [...prev, { id: newId, x, y, text, color }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(f => f.id !== newId));
        }, 1200);
    };

    // Append combat log message
    const appendLog = (msg: string) => {
        setCombatLog(prev => [...prev.slice(-40), msg]);
    };

    // Check Victory / Defeat conditions
    useEffect(() => {
        const livingPlayers = combatants.filter(c => c.side === 'player' && !c.isDefeated);
        const livingEnemies = combatants.filter(c => c.side === 'enemy' && !c.isDefeated);

        if (livingPlayers.length === 0 && battleOutcome === 'in_progress') {
            setBattleOutcome('defeat');
            appendLog('❌ ВЕСЬ ЗАГІН РОЗБИТО... ВАШЕ ВІЙСЬКО ЗАЗНАЛО ПОРАЗКИ!');
            playPunchSound(true, false);
        } else if (livingEnemies.length === 0 && battleOutcome === 'in_progress') {
            setBattleOutcome('victory');
            appendLog('🎉 ПЕРЕМОГА! ВСІ ВОРОГИ ЗНИЩЕНІ АБО ВТЕКЛИ!');
            playLevelUpSound();
            playGoldSound();
        }
    }, [combatants, battleOutcome]);

    // Move to next turn (strictly skips dead/fallen combatants)
    const advanceTurn = useCallback(() => {
        setActiveMode('idle');
        setSelectedSpell(null);

        setCombatants(prevCombatants => {
            const updated = prevCombatants.map(c => {
                if (c.id === activeCombatantId) {
                    return { ...c, hasMoved: false, hasActed: false };
                }
                return c;
            });

            // Find next living unit in turnOrder (strictly !isDefeated && hp > 0)
            let nextIndex = activeTurnIndex + 1;
            let foundNextLiving = false;

            while (nextIndex < turnOrder.length) {
                const nextId = turnOrder[nextIndex];
                const unit = updated.find(c => c.id === nextId);
                if (unit && !unit.isDefeated && unit.hp > 0) {
                    foundNextLiving = true;
                    break;
                }
                nextIndex++;
            }

            if (foundNextLiving) {
                setActiveTurnIndex(nextIndex);
            } else {
                // All living units in current round have acted -> Start New Round!
                const alive = updated.filter(c => !c.isDefeated && c.hp > 0);
                if (alive.length > 0) {
                    setRoundNumber(r => r + 1);
                    appendLog(`--- РАУНД ${roundNumber + 1} РОЗПОЧАТО ---`);
                    const newOrder = rollInitiative(updated);
                    setTurnOrder(newOrder);
                    setActiveTurnIndex(0);
                }
            }

            return updated;
        });
    }, [activeTurnIndex, turnOrder, roundNumber, activeCombatantId, rollInitiative]);

    // Safety check: if current active combatant is defeated or dead, automatically skip to next living unit!
    useEffect(() => {
        if (battleOutcome !== 'in_progress') return;
        if (activeCombatant && (activeCombatant.isDefeated || activeCombatant.hp <= 0)) {
            const living = combatants.filter(c => !c.isDefeated && c.hp > 0);
            if (living.length > 0) {
                advanceTurn();
            }
        }
    }, [activeCombatant, combatants, battleOutcome, advanceTurn]);

    // Validate tile for movement
    const isTileBlocked = (x: number, y: number, excludeId?: string) => {
        if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return true;
        if (obstacles.some(o => o.x === x && o.y === y)) return true;
        return combatants.some(c => !c.isDefeated && c.x === x && c.y === y && c.id !== excludeId);
    };

    // Valid movement tiles for active combatant
    const reachableMoveTiles = useMemo(() => {
        if (!activeCombatant || activeCombatant.hasMoved) return [];
        const speed = activeCombatant.moveSpeed;
        const valid: { x: number; y: number }[] = [];

        for (let dy = -speed; dy <= speed; dy++) {
            for (let dx = -speed; dx <= speed; dx++) {
                const tx = activeCombatant.x + dx;
                const ty = activeCombatant.y + dy;
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                if (dist > 0 && dist <= speed && !isTileBlocked(tx, ty, activeCombatant.id)) {
                    valid.push({ x: tx, y: ty });
                }
            }
        }
        return valid;
    }, [activeCombatant, obstacles, combatants]);

    // Valid attack targets (melee: dist == 1)
    const validMeleeTargets = useMemo(() => {
        if (!activeCombatant || activeCombatant.hasActed) return [];
        const enemySide = activeCombatant.side === 'player' ? 'enemy' : 'player';
        return combatants.filter(c => 
            !c.isDefeated && 
            c.side === enemySide && 
            getGridDistance(activeCombatant.x, activeCombatant.y, c.x, c.y) <= 1
        );
    }, [activeCombatant, combatants]);

    // Valid ranged targets (range: 2..unit.range)
    const validRangedTargets = useMemo(() => {
        if (!activeCombatant || activeCombatant.hasActed) return [];
        const enemySide = activeCombatant.side === 'player' ? 'enemy' : 'player';
        const maxRange = activeCombatant.range > 1 ? activeCombatant.range : 5;
        return combatants.filter(c => 
            !c.isDefeated && 
            c.side === enemySide && 
            getGridDistance(activeCombatant.x, activeCombatant.y, c.x, c.y) <= maxRange
        );
    }, [activeCombatant, combatants]);

    const safeUpdateProgress = useCallback((updated: WorldProgress) => {
        setTimeout(() => {
            onUpdateProgress(updated);
            saveWorldProgress(updated);
        }, 0);
    }, [onUpdateProgress]);

    // Synchronize all party combatants to worldProgress and save to storage
    const syncAllCombatantsToWorldProgress = (currentList?: Combatant[]) => {
        const sourceList = currentList || combatants;
        const playerC = sourceList.find(c => c.isPlayer || c.id === 'player_hero');
        const updatedHired = (progress.hiredNpcs || []).map(npc => {
            const matched = sourceList.find(cb => cb.id === npc.id);
            if (!matched) return npc;
            return {
                ...npc,
                hp: Math.max(0, matched.hp),
                currentAbilityCharges: matched.currentPoints,
                survivalProbability: matched.survivalProbability !== undefined ? matched.survivalProbability : (npc.survivalProbability ?? 95),
                isDead: matched.isDead ?? false
            };
        });

        const updatedProgress: WorldProgress = {
            ...progress,
            playerStats: playerC ? {
                ...progress.playerStats,
                currentHp: Math.max(1, playerC.hp),
                currentSpellPoints: playerC.currentPoints
            } : progress.playerStats,
            hiredNpcs: updatedHired
        };
        safeUpdateProgress(updatedProgress);
        return updatedProgress;
    };

    // Centralized Damage Application and Ally Survival Roll Logic
    const applyDamageToTarget = (targetId: string, damage: number, attackDesc: string) => {
        let targetDied = false;
        let targetDowned = false;

        setCombatants(prev => {
            const nextList = prev.map(c => {
                if (c.id !== targetId) return c;

                // 1. Enemy unit: standard HP reduction
                if (c.side === 'enemy') {
                    const newHp = Math.max(0, c.hp - damage);
                    const defeated = newHp <= 0;
                    if (defeated && !c.isDefeated) {
                        appendLog(`💀 ${c.name} повалено в бою!`);
                        targetDowned = true;
                    }
                    return { ...c, hp: newHp, isDefeated: defeated };
                }

                // 2. Player character hero: standard HP reduction
                if (c.isPlayer || c.id === 'player_hero') {
                    const newHp = Math.max(0, c.hp - damage);
                    const defeated = newHp <= 0;
                    if (defeated && !c.isDefeated) {
                        appendLog(`💀 ${c.name} падає під нищівними ударами ворогів!`);
                        targetDowned = true;
                    }
                    return { ...c, hp: newHp, isDefeated: defeated };
                }

                // 3. Player Summon:
                if (c.isSummon) {
                    const newHp = Math.max(0, c.hp - damage);
                    if (newHp <= 0) {
                        appendLog(`💀 Призвана істота ${c.name} розвіюється і гине!`);
                        targetDied = true;
                        return { ...c, hp: 0, isDefeated: true, isDead: true };
                    }
                    return { ...c, hp: newHp };
                }

                // 4. Player Companion (Hired NPC):
                const curProb = c.survivalProbability !== undefined ? c.survivalProbability : 95;

                // Case A: Companion was standing (hp > 0, !isDefeated) and takes fatal damage ("коли він впав")
                if (!c.isDefeated && c.hp > 0) {
                    const newHp = Math.max(0, c.hp - damage);
                    if (newHp > 0) {
                        return { ...c, hp: newHp };
                    }

                    // HP dropped to 0: Companion falls! Survival check triggered!
                    targetDowned = true;
                    const roll = Math.floor(Math.random() * 100) + 1; // d100 roll
                    if (roll <= curProb) {
                        // SUCCESSFUL ROLL: Miraculously survives, BUT survival chance decreases by 10%!
                        const nextProb = Math.max(0, curProb - 10);
                        appendLog(`💥 ${c.name} зазнає тяжкого поранення (-${damage} HP) та падає на землю!`);
                        appendLog(`🎲 [КИДОК НА ВИЖИВАННЯ]: ${c.name} викидає ${roll} при шансі ${curProb}% — УСПІХ!`);
                        appendLog(`❤️‍🩹 Соратник дивом вцілів, але шанс виживання впав до ${nextProb}%!`);
                        addFloatingText(c.x, c.y, `ВЦІЛІВ! (${nextProb}%)`, '#10b981');
                        playRetroBeepSound(480);
                        return {
                            ...c,
                            hp: 0,
                            isDefeated: true,
                            isDead: false,
                            survivalProbability: nextProb
                        };
                    } else {
                        // FAILED ROLL: Mortal wound, companion dies!
                        targetDied = true;
                        appendLog(`💥 ${c.name} отримує смертельне поранення (-${damage} HP) та падає на землю!`);
                        appendLog(`🎲 [КИДОК НА ВИЖИВАННЯ]: ${c.name} викидає ${roll} при шансі ${curProb}% — ПРОВАЛ! Поранення смертельне!`);
                        appendLog(`☠️ Соратник ${c.name} загинув на полі битви...`);
                        addFloatingText(c.x, c.y, 'ЗАГИНУВ!', '#ef4444');
                        playPunchSound(true, true);
                        return {
                            ...c,
                            hp: 0,
                            isDefeated: true,
                            isDead: true,
                            survivalProbability: curProb
                        };
                    }
                }

                // Case B: Companion was ALREADY DOWNED / FALLEN (isDefeated or hp <= 0) and gets wounded again!
                // "після того, як його поранили, коли він впав"
                if ((c.isDefeated || c.hp <= 0) && !c.isDead) {
                    const roll = Math.floor(Math.random() * 100) + 1;
                    appendLog(`🩸 Поваленого соратника ${c.name} знову поранено на землі! (-${damage} HP)`);
                    if (roll <= curProb) {
                        // SUCCESSFUL ROLL: Survives again, survival chance decreases by another 10%!
                        const nextProb = Math.max(0, curProb - 10);
                        appendLog(`🎲 [КИДОК НА ВИЖИВАННЯ]: ${c.name} витримує рану на землі (кидок ${roll} при ${curProb}% — УСПІХ)!`);
                        appendLog(`⚠️ Тіло слабшає від повторного поранення: шанс виживання впав до ${nextProb}%!`);
                        addFloatingText(c.x, c.y, `ВЦІЛІВ! (${nextProb}%)`, '#f59e0b');
                        playRetroBeepSound(440);
                        return {
                            ...c,
                            survivalProbability: nextProb,
                            isDead: false
                        };
                    } else {
                        // FAILED ROLL: Mortal finishing blow!
                        targetDied = true;
                        appendLog(`🎲 [КИДОК НА ВИЖИВАННЯ]: ${c.name} викидає ${roll} при ${curProb}% — ПРОВАЛ! Добиваючий удар!`);
                        appendLog(`☠️ Поранений на землі ${c.name} загинув від тяжких ран.`);
                        addFloatingText(c.x, c.y, 'ЗАГИНУВ!', '#ef4444');
                        playPunchSound(true, true);
                        return {
                            ...c,
                            isDead: true
                        };
                    }
                }

                return c;
            });

            // Immediately persist updated companion survival & HP state to worldProgress
            if (progress.hiredNpcs && progress.hiredNpcs.length > 0) {
                const updatedHired = progress.hiredNpcs.map(npc => {
                    const matched = nextList.find(cb => cb.id === npc.id);
                    if (matched) {
                        return {
                            ...npc,
                            hp: matched.hp,
                            survivalProbability: matched.survivalProbability !== undefined ? matched.survivalProbability : (npc.survivalProbability ?? 95),
                            isDead: matched.isDead ?? false
                        };
                    }
                    return npc;
                });
                const updatedP: WorldProgress = {
                    ...progress,
                    hiredNpcs: updatedHired
                };
                safeUpdateProgress(updatedP);
            }

            return nextList;
        });

        return { targetDied, targetDowned };
    };

    // Perform Mine Placement
    const handlePlaceMine = (targetX: number, targetY: number, spell: CombatSpell) => {
        if (!activeCombatant || activeCombatant.hasActed) return;

        // Check if combatant has enough points/charges
        const requiredPoints = spell.pointCost || 1;
        if (activeCombatant.currentPoints < requiredPoints) {
            appendLog(`❌ У ${activeCombatant.name} недостатньо ${activeCombatant.pointsName}! Потрібно: ${requiredPoints}, є: ${activeCombatant.currentPoints}.`);
            playPunchSound(false, false);
            return;
        }

        // Bounds and obstacles check
        if (targetX < 0 || targetX >= GRID_COLS || targetY < 0 || targetY >= GRID_ROWS) return;
        if (obstacles.some(o => o.x === targetX && o.y === targetY)) {
            appendLog(`❌ Неможливо встановити міну на перешкоду!`);
            return;
        }

        if (placedMines.some(m => m.x === targetX && m.y === targetY)) {
            appendLog(`⚠️ На клітинці (${targetX}, ${targetY}) вже встановлено міну!`);
            return;
        }

        // Deduct points/charges
        const nextPoints = Math.max(0, activeCombatant.currentPoints - requiredPoints);
        setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, currentPoints: nextPoints } : c));

        // Sync to worldProgress
        if (activeCombatant.isPlayer) {
            safeUpdateProgress({
                ...progress,
                playerStats: {
                    ...progress.playerStats,
                    currentSpellPoints: nextPoints
                }
            });
        } else if (activeCombatant.side === 'player') {
            if (progress.hiredNpcs) {
                safeUpdateProgress({
                    ...progress,
                    hiredNpcs: progress.hiredNpcs.map(npc => 
                        npc.id === activeCombatant.id ? { ...npc, currentAbilityCharges: nextPoints } : npc
                    )
                });
            }
        }

        const newMine: PlacedMine = {
            id: `mine_${Date.now()}_${Math.random()}`,
            x: targetX,
            y: targetY,
            ownerId: activeCombatant.id,
            ownerName: activeCombatant.name,
            ownerSide: activeCombatant.side,
            damage: spell.power || 45,
            radius: 1
        };

        setPlacedMines(prev => [...prev, newMine]);
        playRetroBeepSound(680);
        addFloatingText(targetX, targetY, '💣 МІНА!', '#f59e0b');
        appendLog(`💣 ${activeCombatant.name} непомітно встановлює приховану міну на клітинку (${targetX}, ${targetY})! Вороги її не бачать і не здогадуються про пастку.`);

        // Mark action used
        setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, hasActed: true } : c));
        setActiveMode('idle');
        setSelectedSpell(null);
    };

    // Perform Movement & Detonate Traps
    const handleMoveToTile = (targetX: number, targetY: number) => {
        if (!activeCombatant || activeCombatant.hasMoved) return;
        const isReachable = reachableMoveTiles.some(t => t.x === targetX && t.y === targetY);
        if (!isReachable) return;

        playRetroBeepSound(520);
        appendLog(`-> ${activeCombatant.name} переміщується на позицію (${targetX}, ${targetY}).`);

        // Check if unit stepped on an enemy trap/mine
        const triggeredMine = placedMines.find(m => m.x === targetX && m.y === targetY && m.ownerSide !== activeCombatant.side);

        if (triggeredMine) {
            // Remove the detonated mine
            setPlacedMines(prev => prev.filter(m => m.id !== triggeredMine.id));

            // Detonation shockwave
            const detId = `det_${Date.now()}`;
            setDetonations(prev => [...prev, { id: detId, x: targetX, y: targetY }]);
            setTimeout(() => {
                setDetonations(prev => prev.filter(d => d.id !== detId));
            }, 900);

            playPunchSound(true, false);
            playSpellCastSound('fire');

            // Move active combatant first
            setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, x: targetX, y: targetY, hasMoved: true } : c));

            // Apply 1-tile AoE explosion damage to ALL characters in range 1 (including downed allies lying on the ground)
            const baseMineDmg = triggeredMine.damage || 45;
            const victims: string[] = [];

            const victimsInRadius = combatants.filter(c => {
                if (c.isDead) return false;
                const currentPos = c.id === activeCombatant.id ? { x: targetX, y: targetY } : { x: c.x, y: c.y };
                return getGridDistance(currentPos.x, currentPos.y, targetX, targetY) <= 1;
            });

            victimsInRadius.forEach(victim => {
                const variance = Math.floor(Math.random() * 9) - 4;
                const dmg = Math.max(12, baseMineDmg + variance);
                const pos = victim.id === activeCombatant.id ? { x: targetX, y: targetY } : { x: victim.x, y: victim.y };
                victims.push(`${victim.name} (-${dmg} HP)`);
                addFloatingText(pos.x, pos.y, `💥 -${dmg} HP`, '#ef4444');
                applyDamageToTarget(victim.id, dmg, 'вибух міни');
            });

            addFloatingText(targetX, targetY, '💥 БУХ! ДЕТОНАЦІЯ!', '#f97316');
            appendLog(`💥💥💥 ПРИХОВАНА МІНА ДЕТОНУВАЛА! ${activeCombatant.name} наступає на міну на (${targetX}, ${targetY})!`);
            if (victims.length > 0) {
                appendLog(`🔥 Вибухова хвиля (радіус 1 клітинка) уразила: ${victims.join(', ')}.`);
            }
        } else {
            setCombatants(prev => prev.map(c => {
                if (c.id === activeCombatant.id) {
                    return { ...c, x: targetX, y: targetY, hasMoved: true };
                }
                return c;
            }));
        }

        setActiveMode('idle');
    };

    // Perform Melee Attack
    const handleMeleeAttack = (target: Combatant) => {
        if (!activeCombatant || activeCombatant.hasActed) return;
        const dist = getGridDistance(activeCombatant.x, activeCombatant.y, target.x, target.y);
        if (dist > 1) {
            appendLog(`❌ Ціль надто далеко для ближнього бою!`);
            return;
        }

        setSelectedTargetId(target.id);
        playRetroBeepSound(400);

        // Attack roll: d20 + Agility
        const roll = Math.floor(Math.random() * 20) + 1;
        const isTargetDowned = target.isDefeated && !target.isDead;
        const hitThreshold = isTargetDowned ? 4 : (target.ac * 2 + 8); // Downed target lying prone is much easier to hit
        const totalAttack = roll + Math.floor(activeCombatant.agility / 2);

        const isCrit = roll === 20;
        const isHit = totalAttack >= hitThreshold || isCrit;

        if (!isTargetDowned && target.isGuarding && Math.random() < 0.45) {
            // Shield Block!
            playShieldBlockSound();
            appendLog(`🛡️ ${target.name} БЛОКУЄ ЩИТОМ удар від ${activeCombatant.name}!`);
            addFloatingText(target.x, target.y, 'БЛОК ЩИТОМ!', '#38bdf8');
        } else if (isHit) {
            playSwordClashSound(isCrit, false);
            // Damage formula: base strength roll + weapon with x3 sword strike multiplier in 1 tile range!
            const rawBaseDmg = Math.floor(activeCombatant.strength * 0.8) + Math.floor(Math.random() * 8) + 4;
            const baseDmg = rawBaseDmg * 3;
            const finalDmg = isCrit ? Math.floor(baseDmg * 1.8) : baseDmg;

            const attackDesc = isTargetDowned ? 'удар по поваленому' : 'удар мечем';
            appendLog(`⚔️ ${activeCombatant.name} завдає УДАР МЕЧЕМ ${isTargetDowned ? 'по поваленому на землі' : '(х3 шкоди в межах 1 кл.)'}: ${finalDmg} шкоди по ${target.name}! ${isCrit ? '(КРИТИЧНИЙ РОЗРУБ!)' : ''}`);
            addFloatingText(target.x, target.y, `-${finalDmg} HP (x3)`, isCrit ? '#fbbf24' : '#ef4444');

            applyDamageToTarget(target.id, finalDmg, attackDesc);
        } else {
            playPunchSound(false, false);
            appendLog(`💨 ${activeCombatant.name} промахується по ${target.name}! (Кубик: ${roll})`);
            addFloatingText(target.x, target.y, 'ПРОМАХ!', '#9ca3af');
        }

        // Mark action used
        setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, hasActed: true } : c));
        setActiveMode('idle');
    };

    // Perform Ranged Attack (Shoot Bow / Crossbow)
    const handleRangedShoot = (target: Combatant) => {
        if (!activeCombatant || activeCombatant.hasActed) return;
        const maxRange = activeCombatant.range > 1 ? activeCombatant.range : 6;
        const dist = getGridDistance(activeCombatant.x, activeCombatant.y, target.x, target.y);
        if (dist > maxRange) {
            appendLog(`❌ Ціль поза радіусом стрільби! (Радіус: ${maxRange}, Дистанція: ${dist})`);
            return;
        }

        setSelectedTargetId(target.id);
        playBowShotSound();

        // Trigger arrow projectile animation
        const projId = `proj_${Date.now()}`;
        setProjectiles(prev => [...prev, {
            id: projId,
            startX: activeCombatant.x,
            startY: activeCombatant.y,
            targetX: target.x,
            targetY: target.y,
            type: 'arrow'
        }]);

        setTimeout(() => {
            setProjectiles(prev => prev.filter(p => p.id !== projId));

            // Ranged Hit Calculation
            const roll = Math.floor(Math.random() * 20) + 1;
            const distancePenalty = dist >= 5 ? 2 : 0;
            const hitScore = roll + Math.floor(activeCombatant.agility / 2) - distancePenalty;
            const targetAcScore = target.ac * 2 + 7;

            const isCrit = roll === 20;
            const isHit = hitScore >= targetAcScore || isCrit;

            if (isHit) {
                playSwordClashSound(isCrit, false);
                const baseDmg = Math.floor(activeCombatant.agility * 0.9) + Math.floor(Math.random() * 10) + 6;
                const finalDmg = isCrit ? Math.floor(baseDmg * 1.7) : baseDmg;

                appendLog(`🏹 ${activeCombatant.name} робить постріл... ВЛУЧАННЯ! ${finalDmg} шкоди по ${target.name}!`);
                addFloatingText(target.x, target.y, `🎯 -${finalDmg} HP`, isCrit ? '#fbbf24' : '#ef4444');

                applyDamageToTarget(target.id, finalDmg, 'постріл з лука');
            } else {
                playPunchSound(false, false);
                appendLog(`💨 Стріла ${activeCombatant.name} пролетіла мимо ${target.name}!`);
                addFloatingText(target.x, target.y, 'МИМО!', '#9ca3af');
            }

            // Mark action used
            setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, hasActed: true } : c));
            setActiveMode('idle');
        }, 320);
    };

    // Perform Area-of-Effect Spell (e.g. Град Стріл - 2x3 tiles)
    const handleCastAoeSpell = (spell: CombatSpell, targetX: number, targetY: number) => {
        if (!activeCombatant || activeCombatant.hasActed) return;

        // Check if combatant has enough points/charges
        const requiredPoints = spell.pointCost || 1;
        if (activeCombatant.currentPoints < requiredPoints) {
            appendLog(`❌ У ${activeCombatant.name} недостатньо ${activeCombatant.pointsName}! Потрібно: ${requiredPoints}, є: ${activeCombatant.currentPoints}. (Відновлюється при підвищенні рівня)`);
            playPunchSound(false, false);
            return;
        }

        const dist = getGridDistance(activeCombatant.x, activeCombatant.y, targetX, targetY);
        if (dist > spell.range) {
            appendLog(`❌ Закляття ${spell.name} не дістає до цілі! (Дальність: ${spell.range} кл., дистанція: ${dist})`);
            return;
        }

        // Deduct points/charges
        const nextPoints = Math.max(0, activeCombatant.currentPoints - requiredPoints);
        setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, currentPoints: nextPoints } : c));

        // Sync to worldProgress
        if (activeCombatant.isPlayer) {
            safeUpdateProgress({
                ...progress,
                playerStats: {
                    ...progress.playerStats,
                    currentSpellPoints: nextPoints
                }
            });
        } else if (activeCombatant.side === 'player') {
            if (progress.hiredNpcs) {
                safeUpdateProgress({
                    ...progress,
                    hiredNpcs: progress.hiredNpcs.map(npc => 
                        npc.id === activeCombatant.id ? { ...npc, currentAbilityCharges: nextPoints } : npc
                    )
                });
            }
        }

        const isFireball = spell.element === 'fire' || spell.name.toLowerCase().includes('вогнян') || spell.id.includes('fireball');
        
        if (isFireball) {
            playSpellCastSound('fire');
        } else {
            playBowShotSound();
        }

        // Calculate affected tiles (2x2 for Fireball, 2x3 for Arrow Rain)
        const affectedTiles = getSpellAoeTiles(spell, targetX, targetY);
        const areaLabel = isFireball ? '2 на 2 тайли (4 клітинки)' : '2 на 3 тайли (6 клітинок)';

        // Animate multiple projectiles across the AoE area
        const projIds = affectedTiles.map((t, idx) => `aoe_proj_${Date.now()}_${idx}`);
        setProjectiles(prev => [
            ...prev,
            ...affectedTiles.map((t, idx) => ({
                id: projIds[idx],
                startX: activeCombatant.x,
                startY: activeCombatant.y,
                targetX: t.x,
                targetY: t.y,
                type: isFireball ? 'fireball' : 'arrow'
            }))
        ]);

        appendLog(`${isFireball ? '🔥💥' : '🏹🌧️'} ${activeCombatant.name} застосовує «${spell.name}»! ${isFireball ? 'Вогняний вибух' : 'Злива стріл'} накриває площу ${areaLabel}! (-${requiredPoints} ${activeCombatant.pointsName})`);

        setTimeout(() => {
            setProjectiles(prev => prev.filter(p => !projIds.includes(p.id)));

            const targetSide = activeCombatant.side === 'player' ? 'enemy' : 'player';
            const hitTargets = combatants.filter(c => 
                !c.isDead &&
                affectedTiles.some(t => t.x === c.x && t.y === c.y) &&
                (c.side === targetSide || (c.side === 'player' && c.isDefeated))
            );

            if (hitTargets.length === 0) {
                appendLog(`💨 «${spell.name}» вразило площу ${areaLabel}, але цілей у зоні ураження не виявилося.`);
            } else {
                let totalDmg = 0;

                hitTargets.forEach(victim => {
                    const roll = Math.floor(Math.random() * 20) + 1;
                    const isCrit = roll === 20;
                    const baseDmg = spell.power + Math.floor(Math.random() * 8);
                    const finalDmg = isCrit 
                        ? Math.floor(baseDmg * 1.5) 
                        : Math.max(6, baseDmg - Math.floor(victim.ac * 0.7));
                    totalDmg += finalDmg;

                    addFloatingText(victim.x, victim.y, `-${finalDmg} HP`, isFireball ? '#ef4444' : '#f59e0b');
                    appendLog(`${isFireball ? '🔥' : '🎯'} ${spell.name} уражає ${victim.name}: -${finalDmg} шкоди${isCrit ? ' (КРИТИЧНО!)' : ''}!`);
                    applyDamageToTarget(victim.id, finalDmg, spell.name);
                });

                if (isFireball) {
                    playSpellCastSound('fire');
                } else {
                    playSwordClashSound(false, true);
                }

                appendLog(`💥 «${spell.name}» завдало сумарно -${totalDmg} шкоди по ${hitTargets.length} цілях у зоні ${areaLabel}!`);
            }

            setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, hasActed: true } : c));
            setActiveMode('idle');
            setSelectedSpell(null);
        }, 400);
    };

    // Perform Spell / Skill Cast (Consumes Attack Action and Spell/Ability Points!)
    const handleCastSpell = (spell: CombatSpell, target: Combatant) => {
        if (!activeCombatant || activeCombatant.hasActed) return;

        // If AoE spell like Fireball (2x2) or Hail of Arrows (2x3), execute AoE
        if (spell.type === 'damage_aoe' || spell.name.toLowerCase().includes('град') || spell.name.toLowerCase().includes('вогнян') || spell.id.includes('fireball')) {
            handleCastAoeSpell(spell, target.x, target.y);
            return;
        }

        // Check if combatant has enough points/charges
        const requiredPoints = spell.pointCost || 1;
        if (activeCombatant.currentPoints < requiredPoints) {
            appendLog(`❌ У ${activeCombatant.name} недостатньо ${activeCombatant.pointsName}! Потрібно: ${requiredPoints}, є: ${activeCombatant.currentPoints}. (Відновлюється при підвищенні рівня)`);
            playPunchSound(false, false);
            return;
        }

        const dist = getGridDistance(activeCombatant.x, activeCombatant.y, target.x, target.y);
        if (dist > spell.range) {
            appendLog(`❌ Закляття ${spell.name} не дістає до цілі! (Дальність: ${spell.range} кл., дистанція: ${dist})`);
            return;
        }

        // Deduct points/charges
        const nextPoints = Math.max(0, activeCombatant.currentPoints - requiredPoints);
        setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, currentPoints: nextPoints } : c));

        // Sync to worldProgress
        if (activeCombatant.isPlayer) {
            safeUpdateProgress({
                ...progress,
                playerStats: {
                    ...progress.playerStats,
                    currentSpellPoints: nextPoints
                }
            });
        } else if (activeCombatant.side === 'player') {
            if (progress.hiredNpcs) {
                safeUpdateProgress({
                    ...progress,
                    hiredNpcs: progress.hiredNpcs.map(npc => 
                        npc.id === activeCombatant.id ? { ...npc, currentAbilityCharges: nextPoints } : npc
                    )
                });
            }
        }

        setSelectedTargetId(target.id);
        playSpellCastSound(spell.element === 'holy' ? 'heal' : spell.element === 'lightning' ? 'lightning' : 'fire');

        // Spell projectile/visual
        const projId = `spell_${Date.now()}`;
        setProjectiles(prev => [...prev, {
            id: projId,
            startX: activeCombatant.x,
            startY: activeCombatant.y,
            targetX: target.x,
            targetY: target.y,
            type: spell.element === 'holy' ? 'holy' : spell.element === 'lightning' ? 'lightning' : 'fireball'
        }]);

        setTimeout(() => {
            setProjectiles(prev => prev.filter(p => p.id !== projId));

            if (spell.type === 'heal' || spell.name.toLowerCase().includes('зцілення')) {
                const healAmount = spell.power + Math.floor(Math.random() * 10);
                const isTargetPlayer = target.isPlayer || target.id === 'player_hero';
                const wasDowned = target.isDefeated;

                if (wasDowned) {
                    appendLog(`✨ ${activeCombatant.name} застосовує божественне закляття "${spell.name}" на поваленого ${target.name}: соратник повертається до тями та підводиться на ноги! (+${healAmount} HP)`);
                    addFloatingText(target.x, target.y, `ПІДВІВСЯ! +${healAmount} HP`, '#4ade80');
                } else {
                    appendLog(`✨ ${activeCombatant.name} застосовує божественне закляття "${spell.name}" на ${target.name}: зцілено +${healAmount} HP! (-${requiredPoints} ${activeCombatant.pointsName})`);
                    addFloatingText(target.x, target.y, `+${healAmount} HP`, '#4ade80');
                }

                setCombatants(prev => {
                    const nextList = prev.map(c => {
                        if (c.id === target.id) {
                            return { ...c, hp: Math.min(c.maxHp, c.hp + healAmount), isDefeated: false };
                        }
                        return c;
                    });

                    // Immediately persist healed HP to progress.hiredNpcs
                    if (progress.hiredNpcs) {
                        const updatedHired = progress.hiredNpcs.map(npc => {
                            if (npc.id === target.id) {
                                const newHp = Math.min(npc.baseHp || 100, (npc.hp || 0) + healAmount);
                                return { ...npc, hp: newHp, isDead: false };
                            }
                            return npc;
                        });
                        const updatedP: WorldProgress = {
                            ...progress,
                            hiredNpcs: updatedHired
                        };
                        safeUpdateProgress(updatedP);
                    }

                    return nextList;
                });

                // Immediately sync healed HP if target is the player character
                if (isTargetPlayer) {
                    const finalHp = Math.min(target.maxHp, target.hp + healAmount);
                    safeUpdateProgress({
                        ...progress,
                        playerStats: {
                            ...progress.playerStats,
                            currentHp: finalHp
                        }
                    });
                }
            } else if (spell.type === 'buff') {
                appendLog(`🛡️ ${activeCombatant.name} накладає захисне закляття "${spell.name}" на ${target.name}! (-${requiredPoints} ${activeCombatant.pointsName})`);
                addFloatingText(target.x, target.y, `БАФФ!`, '#38bdf8');
                setCombatants(prev => prev.map(c => {
                    if (c.id === target.id) {
                        return { 
                            ...c, 
                            ac: Math.max(0, c.ac - 2), // Improves AC
                            isGuarding: true 
                        };
                    }
                    return c;
                }));
            } else if (spell.type === 'damage_multi' || spell.name.toLowerCase().includes('шквал')) {
                // Multi-attack: strikes land step by step, one after another sequentially!
                const attackCount = spell.hitCount || 4;
                let currentTargetHp = target.hp;
                let totalDealt = 0;
                let hitsLanded = 0;
                let currentStrike = 1;

                appendLog(`⚔️⚔️⚔️ ${activeCombatant.name} застосовує «${spell.name}» проти ${target.name}! Починається серія із ${attackCount} послідовних ударів один за одним! (-${requiredPoints} ${activeCombatant.pointsName})`);

                const executeSingleStrike = () => {
                    if (currentStrike > attackCount || currentTargetHp <= 0) {
                        appendLog(`💥 «${spell.name}» завершено: завдано ${hitsLanded}/${currentStrike - 1} влучань! Сумарна шкода: -${totalDealt} HP!`);
                        setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, hasActed: true } : c));
                        setActiveMode('idle');
                        setSelectedSpell(null);
                        return;
                    }

                    const strikeIdx = currentStrike;
                    currentStrike++;

                    const roll = Math.floor(Math.random() * 20) + 1;
                    const hitThreshold = target.ac * 2 + 7;
                    const totalAttack = roll + Math.floor(activeCombatant.agility / 2);
                    const isCrit = roll === 20;
                    const isHit = totalAttack >= hitThreshold || isCrit;

                    if (target.isGuarding && Math.random() < 0.35) {
                        const blockedDmg = Math.max(2, Math.floor((spell.power * 0.5 + Math.random() * 4) * 0.4));
                        currentTargetHp = Math.max(0, currentTargetHp - blockedDmg);
                        totalDealt += blockedDmg;
                        hitsLanded++;
                        playShieldBlockSound();
                        appendLog(`🛡️ [Удар ${strikeIdx}/${attackCount}] ${target.name} блокує частину удару: -${blockedDmg} HP.`);
                        addFloatingText(target.x, target.y, `[${strikeIdx}/${attackCount}] БЛОК -${blockedDmg}`, '#38bdf8');
                        applyDamageToTarget(target.id, blockedDmg, 'шквал ударів (блок)');
                    } else if (isHit) {
                        const baseHitDmg = Math.max(4, Math.floor(spell.power * 0.75 + (activeCombatant.strength * 0.25) + Math.random() * 5));
                        const finalHitDmg = isCrit ? Math.floor(baseHitDmg * 1.6) : baseHitDmg;
                        currentTargetHp = Math.max(0, currentTargetHp - finalHitDmg);
                        totalDealt += finalHitDmg;
                        hitsLanded++;
                        playSwordClashSound(isCrit, false);
                        appendLog(`⚔️ [Удар ${strikeIdx}/${attackCount}] ВЛУЧАННЯ! Завдано ${finalHitDmg} шкоди${isCrit ? ' (КРИТИЧНИЙ РОЗРУБ!)' : ''}!`);
                        addFloatingText(target.x, target.y, `[${strikeIdx}/${attackCount}] -${finalHitDmg} HP`, isCrit ? '#fbbf24' : '#ef4444');
                        applyDamageToTarget(target.id, finalHitDmg, 'шквал ударів');
                    } else {
                        playPunchSound(false, false);
                        appendLog(`💨 [Удар ${strikeIdx}/${attackCount}] Промах (кубик d20: ${roll}).`);
                        addFloatingText(target.x, target.y, `[${strikeIdx}/${attackCount}] ПРОМАХ!`, '#9ca3af');
                    }

                    // Schedule next strike in 280ms
                    setTimeout(executeSingleStrike, 280);
                };

                // Trigger first strike immediately
                executeSingleStrike();
                return;
            } else if (spell.id === 'spell_sword_strike' || spell.name.toLowerCase().includes('удар мечем')) {
                // Sword strike within 1 tile of warrior deals x3 damage
                const rawDmg = spell.power + Math.floor(activeCombatant.strength * 0.8) + Math.floor(Math.random() * 8) + 4;
                const finalDmg = rawDmg * 3;
                playSwordClashSound(true, false);
                appendLog(`⚔️💥 ${activeCombatant.name} завдає нищівний «${spell.name}» (потрійна шкода х3 у межах 1 клітинки) по ${target.name}: -${finalDmg} HP! (-${requiredPoints} ${activeCombatant.pointsName})`);
                addFloatingText(target.x, target.y, `x3: -${finalDmg} HP`, '#f59e0b');

                applyDamageToTarget(target.id, finalDmg, spell.name);
            } else {
                // Damage spell
                const spellDmg = spell.power + Math.floor(Math.random() * 12);
                appendLog(`🔮 ${activeCombatant.name} випускає "${spell.name}" у ${target.name}! Завдано ${spellDmg} шкоди! (-${requiredPoints} ${activeCombatant.pointsName})`);
                addFloatingText(target.x, target.y, `💥 -${spellDmg}`, '#f43f5e');

                applyDamageToTarget(target.id, spellDmg, spell.name);
            }

            // Mark action used (instead of normal attack)
            setCombatants(prev => prev.map(c => c.id === activeCombatant.id ? { ...c, hasActed: true } : c));
            setActiveMode('idle');
            setSelectedSpell(null);
        }, 400);
    };

    // Guard Action
    const handleGuardAction = () => {
        if (!activeCombatant || activeCombatant.hasActed) return;
        playShieldBlockSound();
        appendLog(`🛡️ ${activeCombatant.name} стає у глухий захист (підвищений шанс блокування та кращий AC)!`);
        addFloatingText(activeCombatant.x, activeCombatant.y, 'ЗАХИСТ!', '#38bdf8');

        setCombatants(prev => prev.map(c => {
            if (c.id === activeCombatant.id) {
                return { ...c, isGuarding: true, hasActed: true };
            }
            return c;
        }));
        setActiveMode('idle');
    };

    // AI Turn Execution (for enemies and auto-combat companions)
    useEffect(() => {
        if (!activeCombatant || activeCombatant.isDefeated || activeCombatant.hp <= 0 || battleOutcome !== 'in_progress') return;

        const isAiTurn = activeCombatant.side === 'enemy' || autoCombat;
        if (!isAiTurn) return;

        setIsAiProcessing(true);
        const timer = setTimeout(() => {
            const targets = combatants.filter(c => !c.isDefeated && c.side !== activeCombatant.side);
            if (targets.length === 0) {
                advanceTurn();
                setIsAiProcessing(false);
                return;
            }

            // Pick closest target
            let closest = targets[0];
            let minDist = getGridDistance(activeCombatant.x, activeCombatant.y, closest.x, closest.y);
            for (const t of targets) {
                const d = getGridDistance(activeCombatant.x, activeCombatant.y, t.x, t.y);
                if (d < minDist) {
                    minDist = d;
                    closest = t;
                }
            }

            // AI Decision logic:
            // 1. If unit has healing spell and allies (especially player character) are wounded -> Heal!
            const healSpell = activeCombatant.spells.find(s => 
                (s.type === 'heal' || s.name.toLowerCase().includes('зцілення')) && 
                (s.pointCost || 1) <= activeCombatant.currentPoints
            );
            if (!activeCombatant.hasActed && healSpell) {
                const woundedAllies = combatants.filter(c => 
                    !c.isDefeated && 
                    c.side === activeCombatant.side && 
                    c.hp < c.maxHp &&
                    getGridDistance(activeCombatant.x, activeCombatant.y, c.x, c.y) <= healSpell.range
                );
                if (woundedAllies.length > 0) {
                    // Prioritize player character if wounded!
                    const playerChar = woundedAllies.find(c => c.isPlayer || c.id === 'player_hero');
                    const healTarget = playerChar || woundedAllies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
                    handleCastSpell(healSpell, healTarget);
                    setTimeout(() => {
                        advanceTurn();
                        setIsAiProcessing(false);
                    }, 500);
                    return;
                }
            }

            // 2. If unit has AoE spell (like Град Стріл) and enemies are clustered -> Cast AoE over 2x3 tiles!
            const aoeSpell = activeCombatant.spells.find(s => 
                (s.type === 'damage_aoe' || s.name.toLowerCase().includes('град')) && 
                (s.pointCost || 1) <= activeCombatant.currentPoints
            );
            if (!activeCombatant.hasActed && aoeSpell && targets.length > 0) {
                let bestTarget = targets[0];
                let maxHits = 0;
                targets.forEach(t => {
                    if (getGridDistance(activeCombatant.x, activeCombatant.y, t.x, t.y) <= aoeSpell.range) {
                        const aoe = getAoe2x3Tiles(t.x, t.y);
                        const hits = targets.filter(e => aoe.some(tile => tile.x === e.x && tile.y === e.y)).length;
                        if (hits > maxHits) {
                            maxHits = hits;
                            bestTarget = t;
                        }
                    }
                });

                if (maxHits > 0 && Math.random() < 0.7) {
                    handleCastAoeSpell(aoeSpell, bestTarget.x, bestTarget.y);
                    setTimeout(() => {
                        advanceTurn();
                        setIsAiProcessing(false);
                    }, 500);
                    return;
                }
            }

            // 3. If caster/has single-target damage spell and enough points -> cast damage spell on closest enemy!
            const damageSpell = activeCombatant.spells.find(s => 
                s.type !== 'heal' && 
                s.type !== 'damage_aoe' &&
                !s.name.toLowerCase().includes('зцілення') && 
                !s.name.toLowerCase().includes('град') &&
                (s.pointCost || 1) <= activeCombatant.currentPoints
            );
            if (!activeCombatant.hasActed && damageSpell && Math.random() < 0.5) {
                if (minDist <= damageSpell.range) {
                    handleCastSpell(damageSpell, closest);
                    setTimeout(() => {
                        advanceTurn();
                        setIsAiProcessing(false);
                    }, 500);
                    return;
                }
            }

            // 2. If ranged class and in range -> Shoot!
            if (!activeCombatant.hasActed && activeCombatant.range > 1 && minDist <= activeCombatant.range) {
                handleRangedShoot(closest);
                setTimeout(() => {
                    advanceTurn();
                    setIsAiProcessing(false);
                }, 500);
                return;
            }

            // 3. If melee and adjacent -> Attack standing enemy or downed ally!
            if (!activeCombatant.hasActed && minDist <= 1) {
                handleMeleeAttack(closest);
                setTimeout(() => {
                    advanceTurn();
                    setIsAiProcessing(false);
                }, 500);
                return;
            }

            // Check for adjacent fallen player ally that enemy might strike on the ground
            if (!activeCombatant.hasActed && activeCombatant.side === 'enemy') {
                const adjacentFallenAlly = combatants.find(c => 
                    c.side === 'player' && 
                    (c.isDefeated || c.hp <= 0) && 
                    !c.isDead && 
                    getGridDistance(activeCombatant.x, activeCombatant.y, c.x, c.y) <= 1
                );
                if (adjacentFallenAlly && (minDist > 1 || Math.random() < 0.35)) {
                    appendLog(`⚔️ ${activeCombatant.name} завдає добиваючий удар по поваленому ${adjacentFallenAlly.name} на землі!`);
                    handleMeleeAttack(adjacentFallenAlly);
                    setTimeout(() => {
                        advanceTurn();
                        setIsAiProcessing(false);
                    }, 500);
                    return;
                }
            }

            // 4. Otherwise, move closer to closest target!
            if (!activeCombatant.hasMoved) {
                let bestTile = { x: activeCombatant.x, y: activeCombatant.y };
                let bestDist = minDist;

                reachableMoveTiles.forEach(tile => {
                    const d = getGridDistance(tile.x, tile.y, closest.x, closest.y);
                    if (d < bestDist) {
                        bestDist = d;
                        bestTile = tile;
                    }
                });

                if (bestTile.x !== activeCombatant.x || bestTile.y !== activeCombatant.y) {
                    handleMoveToTile(bestTile.x, bestTile.y);
                }

                // Try attack after moving if now adjacent
                const distAfterMove = getGridDistance(bestTile.x, bestTile.y, closest.x, closest.y);
                if (distAfterMove <= 1 && !activeCombatant.hasActed) {
                    setTimeout(() => {
                        handleMeleeAttack(closest);
                        setTimeout(() => {
                            advanceTurn();
                            setIsAiProcessing(false);
                        }, 400);
                    }, 300);
                    return;
                }
            }

            // Finish turn
            setTimeout(() => {
                advanceTurn();
                setIsAiProcessing(false);
            }, 400);
        }, 550);

        return () => clearTimeout(timer);
    }, [activeCombatant, autoCombat, battleOutcome, reachableMoveTiles, advanceTurn]);

    // Keyboard Shortcuts (Gold Box authentic!)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isAiProcessing || battleOutcome !== 'in_progress') return;
            const key = e.key.toLowerCase();

            if (key === 'm') {
                setActiveMode(prev => prev === 'move' ? 'idle' : 'move');
                playRetroBeepSound(480);
            } else if (key === 'a') {
                setActiveMode(prev => prev === 'attack' ? 'idle' : 'attack');
                playRetroBeepSound(480);
            } else if (key === 's') {
                setActiveMode(prev => prev === 'shoot' ? 'idle' : 'shoot');
                playRetroBeepSound(480);
            } else if (key === 'c') {
                setActiveMode(prev => prev === 'cast' ? 'idle' : 'cast');
                playRetroBeepSound(480);
            } else if (key === 'g') {
                handleGuardAction();
            } else if (key === 'p' || key === ' ') {
                advanceTurn();
                playRetroBeepSound(400);
            } else if (key === 'escape') {
                setActiveMode('idle');
                setSelectedSpell(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAiProcessing, battleOutcome, advanceTurn, handleGuardAction]);

    // Complete Victory Handler
    const handleCollectVictory = () => {
        syncAllCombatantsToWorldProgress();
        onVictory(squad.rewards);
    };

    // Retreat/Flee Handler
    const handleFleeCombat = () => {
        syncAllCombatantsToWorldProgress();
        onFlee();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-1 sm:p-3 select-none overflow-hidden font-mono">
            {/* SSI Gold Box Outer Wooden Border Frame */}
            <div 
                className="relative w-full max-w-5xl h-[94vh] max-h-[740px] flex flex-col rounded-lg overflow-hidden shadow-2xl border-[10px] border-[#5a3311]"
                style={{
                    boxShadow: '0 0 40px rgba(0,0,0,0.95), inset 0 0 15px #2b1404',
                    background: '#0a0a0a'
                }}
            >
                {/* Wood Corner Rivets (SSI Style) */}
                <div className="absolute top-0 left-0 w-4 h-4 bg-[#b4823e] border border-[#422206] z-40 rounded-sm shadow-inner" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-[#b4823e] border border-[#422206] z-40 rounded-sm shadow-inner" />
                <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#b4823e] border border-[#422206] z-40 rounded-sm shadow-inner" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#b4823e] border border-[#422206] z-40 rounded-sm shadow-inner" />

                {/* Header Banner */}
                <div className="h-8 bg-[#3d210b] border-b-2 border-[#824f1c] flex items-center justify-between px-3 text-xs tracking-widest text-[#f5d061] shrink-0">
                    <div className="font-bold flex items-center gap-2">
                        <span className="text-amber-400">⚔️</span>
                        <span>GOLD BOX TACTICAL ENGINE</span>
                        <span className="text-[#a8824b] text-[10px]">| РАУНД {roundNumber}</span>
                    </div>

                    {/* Initiative Turn Bar */}
                    <div className="flex items-center gap-1 overflow-x-auto max-w-[45%] py-0.5">
                        {turnOrder.map((id, idx) => {
                            const c = combatants.find(unit => unit.id === id);
                            if (!c || c.isDefeated || c.hp <= 0) return null;
                            const isActive = idx === activeTurnIndex;
                            return (
                                    <div 
                                        key={id}
                                        title={`${c.name} (${c.hp}/${c.maxHp} HP)`}
                                        className={`px-1.5 py-0.5 text-[10px] rounded border transition-all cursor-pointer ${
                                            isActive 
                                                ? 'bg-amber-400 text-black border-white font-bold scale-110 shadow'
                                                : c.side === 'player'
                                                    ? 'bg-[#1b3a24] text-[#86efac] border-[#22c55e]/40'
                                                    : 'bg-[#451010] text-[#fca5a5] border-[#ef4444]/40'
                                        }`}
                                        onClick={() => setSelectedTargetId(c.id)}
                                    >
                                        {(!c.avatar || c.avatar.startsWith('/') || c.avatar.includes('.')) ? '🥷' : c.avatar} {c.name.slice(0, 4)}
                                    </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAutoCombat(prev => !prev)}
                            className={`px-2 py-0.5 text-[10px] rounded border font-bold ${
                                autoCombat 
                                    ? 'bg-green-700 text-green-100 border-green-400' 
                                    : 'bg-stone-800 text-stone-300 border-stone-600 hover:bg-stone-700'
                            }`}
                        >
                            {autoCombat ? 'АВТО: УВІМК' : 'АВТО: ВИМК'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-2 py-0.5 text-[10px] bg-red-950 hover:bg-red-800 text-red-200 border border-red-700 rounded font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Main Middle Split: Left = Battlefield Arena, Right = Gold Box Stats Panel */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 border-b-2 border-[#5a3311]">
                    {/* Left: Isometric Tactical Grid Arena */}
                    <div className="flex-1 relative bg-[#1c120a] overflow-hidden flex items-center justify-center p-2 border-r-2 border-[#5a3311]">
                        {/* Dungeon Stone Texture / Floor */}
                        <div 
                            className="w-full h-full max-w-[620px] aspect-[10/7] relative rounded border-4 border-[#41240c] shadow-inner"
                            style={{
                                background: 'radial-gradient(circle at center, #2e1d0f 0%, #150b05 100%)',
                            }}
                        >
                            {/* Grid Tiles */}
                            <div 
                                className="w-full h-full grid"
                                style={{
                                    gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                                    gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
                                }}
                            >
                                {Array.from({ length: GRID_ROWS }).map((_, rIdx) =>
                                    Array.from({ length: GRID_COLS }).map((_, cIdx) => {
                                        const isObstacle = obstacles.some(o => o.x === cIdx && o.y === rIdx);
                                        const livingOccupant = combatants.find(c => !c.isDefeated && c.x === cIdx && c.y === rIdx);
                                        const fallenOccupant = combatants.find(c => c.isDefeated && c.x === cIdx && c.y === rIdx);
                                        const occupant = livingOccupant || fallenOccupant;
                                        const isMoveTarget = activeMode === 'move' && reachableMoveTiles.some(t => t.x === cIdx && t.y === rIdx);
                                        const isAttackTarget = activeMode === 'attack' && validMeleeTargets.some(t => t.x === cIdx && t.y === rIdx);
                                        const isShootTarget = activeMode === 'shoot' && validRangedTargets.some(t => t.x === cIdx && t.y === rIdx);
                                        
                                        const isTrapSpell = selectedSpell && (selectedSpell.type === 'trap' || selectedSpell.name.toLowerCase().includes('мін'));
                                        const isHealSpell = selectedSpell && (selectedSpell.type === 'heal' || selectedSpell.name.toLowerCase().includes('зцілення'));
                                        const isAoeSpell = selectedSpell && (selectedSpell.type === 'damage_aoe' || selectedSpell.name.toLowerCase().includes('град') || selectedSpell.name.toLowerCase().includes('вогнян') || selectedSpell.id.includes('fireball'));
                                        const isTrapPlacementTarget = activeMode === 'cast' && isTrapSpell && (
                                            getGridDistance(activeCombatant?.x || 0, activeCombatant?.y || 0, cIdx, rIdx) === 1 && !isObstacle
                                        );

                                        // Valid target tile for AoE (within range)
                                        const isAoeTargetTile = activeMode === 'cast' && isAoeSpell && (
                                            getGridDistance(activeCombatant?.x || 0, activeCombatant?.y || 0, cIdx, rIdx) <= selectedSpell.range
                                        );

                                        // Tile is part of the AoE area hovered by player (2x2 for Fireball, 2x3 for Arrow Rain)
                                        const isInsideHoveredAoe = activeMode === 'cast' && isAoeSpell && hoveredTile && 
                                            getGridDistance(activeCombatant?.x || 0, activeCombatant?.y || 0, hoveredTile.x, hoveredTile.y) <= selectedSpell.range &&
                                            getSpellAoeTiles(selectedSpell, hoveredTile.x, hoveredTile.y).some(t => t.x === cIdx && t.y === rIdx);

                                        const isSpellTarget = activeMode === 'cast' && selectedSpell && !isTrapSpell && !isAoeSpell && occupant && (
                                            (isHealSpell || selectedSpell.type === 'heal')
                                                ? (occupant.side === activeCombatant?.side && (!occupant.isDefeated || !occupant.isDead))
                                                : selectedSpell.type === 'buff'
                                                    ? (occupant.side === activeCombatant?.side && !occupant.isDefeated)
                                                    : (occupant.side !== activeCombatant?.side && !occupant.isDefeated)
                                        ) && getGridDistance(activeCombatant?.x || 0, activeCombatant?.y || 0, cIdx, rIdx) <= selectedSpell.range;

                                        const isActiveUnitTile = activeCombatant && activeCombatant.x === cIdx && activeCombatant.y === rIdx;
                                        const isInspectedTile = inspectedCombatant && inspectedCombatant.x === cIdx && inspectedCombatant.y === rIdx;

                                        return (
                                            <div
                                                key={`tile_${cIdx}_${rIdx}`}
                                                onMouseEnter={() => setHoveredTile({ x: cIdx, y: rIdx })}
                                                onMouseLeave={() => setHoveredTile(null)}
                                                onClick={() => {
                                                    if (occupant) {
                                                        setSelectedTargetId(occupant.id);
                                                    }
                                                    if (isMoveTarget) {
                                                        handleMoveToTile(cIdx, rIdx);
                                                    } else if (isAttackTarget && livingOccupant) {
                                                        handleMeleeAttack(livingOccupant);
                                                    } else if (isShootTarget && livingOccupant) {
                                                        handleRangedShoot(livingOccupant);
                                                    } else if (isTrapPlacementTarget && selectedSpell) {
                                                        handlePlaceMine(cIdx, rIdx, selectedSpell);
                                                    } else if (isAoeTargetTile && selectedSpell) {
                                                        handleCastAoeSpell(selectedSpell, cIdx, rIdx);
                                                    } else if (isSpellTarget && occupant && selectedSpell) {
                                                        handleCastSpell(selectedSpell, occupant);
                                                    }
                                                }}
                                                className={`relative border border-[#482810]/40 flex items-center justify-center transition-colors cursor-pointer ${
                                                    (cIdx + rIdx) % 2 === 0 ? 'bg-[#221308]/40' : 'bg-[#180d05]/40'
                                                } ${
                                                    isMoveTarget 
                                                        ? 'bg-cyan-600/30 border-cyan-400/80 animate-pulse' 
                                                        : isAttackTarget 
                                                            ? 'bg-red-600/30 border-red-400 animate-pulse' 
                                                            : isShootTarget
                                                                ? 'bg-amber-600/30 border-amber-400 animate-pulse'
                                                                : isTrapPlacementTarget
                                                                    ? 'bg-amber-600/40 border-amber-400 animate-pulse'
                                                                    : isInsideHoveredAoe
                                                                        ? (selectedSpell?.element === 'fire' || selectedSpell?.name.toLowerCase().includes('вогнян'))
                                                                            ? 'bg-red-600/50 border-orange-400 ring-2 ring-red-500 shadow-red-900/70 shadow-lg animate-pulse z-20'
                                                                            : 'bg-amber-500/50 border-amber-300 ring-2 ring-amber-400 shadow-amber-900/60 shadow-lg animate-pulse z-20'
                                                                        : isAoeTargetTile
                                                                            ? 'border-amber-700/60 hover:bg-amber-900/30'
                                                                            : isSpellTarget
                                                                                ? isHealSpell
                                                                                    ? 'bg-emerald-600/40 border-emerald-400 ring-2 ring-emerald-300 animate-pulse'
                                                                                    : 'bg-purple-600/40 border-purple-400 animate-pulse'
                                                                                : ''
                                                } ${
                                                    isActiveUnitTile ? 'ring-2 ring-yellow-400/80 z-20' : ''
                                                } ${
                                                    isInspectedTile ? 'ring-1 ring-green-400 z-10' : ''
                                                }`}
                                            >
                                                {/* Grid Coordinate Watermark */}
                                                <span className="absolute top-0.5 left-0.5 text-[8px] text-[#4d2f17] select-none opacity-40">
                                                    {cIdx},{rIdx}
                                                </span>

                                                {/* AoE Reticle Indicator (🔥 for 2x2 Fireball, 🏹 for 2x3 Arrow Rain) */}
                                                {isInsideHoveredAoe && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
                                                        <span className="text-xs drop-shadow animate-bounce">
                                                            {(selectedSpell?.element === 'fire' || selectedSpell?.name.toLowerCase().includes('вогнян')) ? '🔥' : '🏹'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Placed Stealth Mines on this Tile (Visible to player team only) */}
                                                {placedMines.filter(m => m.x === cIdx && m.y === rIdx && m.ownerSide === 'player').map(m => (
                                                    <div 
                                                        key={m.id}
                                                        title="💣 Прихована міна (Невидима для ворогів. Детонація: 1 кл.)"
                                                        className="absolute bottom-0.5 right-0.5 z-15 flex items-center justify-center pointer-events-none"
                                                    >
                                                        <div className="relative flex items-center justify-center">
                                                            <span className="text-xs drop-shadow-[0_0_6px_rgba(245,158,11,0.9)] animate-bounce">
                                                                💣
                                                            </span>
                                                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Trap Placement Reticle Indicator */}
                                                {isTrapPlacementTarget && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                        <span className="text-sm animate-pulse opacity-90 drop-shadow-[0_0_8px_rgba(245,158,11,1)]">
                                                            💣
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Dungeon Pillar Obstacle */}
                                                {isObstacle && (
                                                    <div className="w-4/5 h-4/5 bg-[#3a2717] border-2 border-[#664326] rounded-sm flex items-center justify-center text-xs shadow-md">
                                                        🏛️
                                                    </div>
                                                )}

                                                {/* Unit Sprite */}
                                                {livingOccupant ? (
                                                    <div className="relative flex flex-col items-center justify-center w-full h-full p-0.5">
                                                        {/* Unit Avatar / Sprite */}
                                                        <div 
                                                            className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center shadow transition-transform overflow-hidden ${
                                                                livingOccupant.side === 'player' ? 'border border-blue-500/60' : 'border border-red-500/60'
                                                            } ${
                                                                isActiveUnitTile ? 'scale-110 shadow-yellow-500/50 shadow-lg' : ''
                                                            }`}
                                                            style={{
                                                                background: livingOccupant.side === 'player' 
                                                                    ? 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' 
                                                                    : 'linear-gradient(135deg, #7f1d1d 0%, #180909 100%)'
                                                            }}
                                                        >
                                                            {livingOccupant.spriteUrl ? (
                                                                <img 
                                                                    src={livingOccupant.spriteUrl} 
                                                                    alt={livingOccupant.name} 
                                                                    className="w-full h-full object-contain p-0.5"
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                            ) : livingOccupant.avatar && (livingOccupant.avatar.startsWith('/') || livingOccupant.avatar.includes('.')) ? (
                                                                <img 
                                                                    src={livingOccupant.avatar} 
                                                                    alt={livingOccupant.name} 
                                                                    className="w-full h-full object-contain p-0.5"
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                            ) : (
                                                                <span className="text-xl select-none">
                                                                    {livingOccupant.avatar}
                                                                </span>
                                                            )}

                                                            {/* Ranged / Caster Indicator Icon */}
                                                            {livingOccupant.classType === 'ranged' && (
                                                                <span className="absolute -bottom-1 -right-1 bg-amber-950 text-[10px] rounded-full border border-amber-400 px-0.5 leading-none">
                                                                    🏹
                                                                </span>
                                                            )}
                                                            {livingOccupant.classType === 'caster' && (
                                                                <span className="absolute -bottom-1 -right-1 bg-purple-950 text-[10px] rounded-full border border-purple-400 px-0.5 leading-none">
                                                                    🔮
                                                                </span>
                                                            )}
                                                            {livingOccupant.isGuarding && (
                                                                <span className="absolute -top-1 -left-1 bg-cyan-950 text-[10px] rounded-full border border-cyan-400 px-0.5 leading-none">
                                                                    🛡️
                                                                </span>
                                                            )}
                                                            {fallenOccupant && (
                                                                <span className="absolute -bottom-1 -left-1 text-[9px] bg-black/80 rounded-full px-0.5 leading-none border border-stone-600" title="Під ногами лежить тіло">
                                                                    {fallenOccupant.isDead ? '🪦' : '❤️‍🩹'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Overhead Mini HP Bar */}
                                                        <div className="w-4/5 h-1.5 bg-black/80 rounded-full border border-stone-600 overflow-hidden mt-0.5">
                                                            <div 
                                                                className={`h-full ${
                                                                    livingOccupant.side === 'player' ? 'bg-green-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${Math.max(0, Math.min(100, (livingOccupant.hp / livingOccupant.maxHp) * 100))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : fallenOccupant ? (
                                                    fallenOccupant.isDead ? (
                                                        /* Deceased Combatant Tombstone / Corpse */
                                                        <div 
                                                            className="relative flex flex-col items-center justify-center w-full h-full p-0.5 opacity-60"
                                                            title={`Загиблий: ${fallenOccupant.name}`}
                                                        >
                                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-stone-900 border border-stone-700 flex items-center justify-center shadow">
                                                                <span className="text-base select-none">🪦</span>
                                                            </div>
                                                            <span className="text-[8px] text-stone-400 font-bold truncate max-w-full leading-tight mt-0.5">
                                                                {fallenOccupant.name.slice(0, 6)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        /* Downed Wounded Companion Awaiting Revival */
                                                        <div 
                                                            className="relative flex flex-col items-center justify-center w-full h-full p-0.5 animate-pulse"
                                                            title={`Повалений соратник: ${fallenOccupant.name} (Шанс виживання: ${fallenOccupant.survivalProbability ?? 95}%). Застосуйте закляття зцілення!`}
                                                        >
                                                            <div 
                                                                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center shadow-lg border-2 border-amber-500/90 ring-1 ring-red-500/70 overflow-hidden"
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #451a03 0%, #1f0904 100%)'
                                                                }}
                                                            >
                                                                {fallenOccupant.spriteUrl ? (
                                                                    <img 
                                                                        src={fallenOccupant.spriteUrl} 
                                                                        alt={fallenOccupant.name} 
                                                                        className="w-full h-full object-contain p-0.5 opacity-60 grayscale-[60%] rotate-12"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : fallenOccupant.avatar && (fallenOccupant.avatar.startsWith('/') || fallenOccupant.avatar.includes('.')) ? (
                                                                    <img 
                                                                        src={fallenOccupant.avatar} 
                                                                        alt={fallenOccupant.name} 
                                                                        className="w-full h-full object-contain p-0.5 opacity-60 grayscale-[60%] rotate-12"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <span className="text-base select-none opacity-60 grayscale-[60%] rotate-12">
                                                                        {fallenOccupant.avatar || '🛡️'}
                                                                    </span>
                                                                )}
                                                                <span className="absolute inset-0 flex items-center justify-center text-xs drop-shadow">
                                                                    ❤️‍🩹
                                                                </span>
                                                                <span className="absolute -top-1 -right-1 bg-amber-950 text-[8px] text-amber-200 rounded px-0.5 border border-amber-500 font-bold leading-none shadow">
                                                                    {fallenOccupant.survivalProbability ?? 95}%
                                                                </span>
                                                            </div>
                                                            <span className="text-[8px] text-amber-300 font-black truncate max-w-full leading-tight drop-shadow mt-0.5">
                                                                ВПАВ
                                                            </span>
                                                        </div>
                                                    )
                                                ) : null}

                                                {/* Target Reticle Crosshair */}
                                                {(isAttackTarget || isShootTarget || isSpellTarget) && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="w-5 h-5 border-2 border-red-500 rounded-full animate-ping opacity-75" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Flying Projectiles Layer */}
                            {projectiles.map(p => (
                                <motion.div
                                    key={p.id}
                                    initial={{ 
                                        left: `${(p.startX + 0.5) * (100 / GRID_COLS)}%`, 
                                        top: `${(p.startY + 0.5) * (100 / GRID_ROWS)}%` 
                                    }}
                                    animate={{ 
                                        left: `${(p.targetX + 0.5) * (100 / GRID_COLS)}%`, 
                                        top: `${(p.targetY + 0.5) * (100 / GRID_ROWS)}%` 
                                    }}
                                    transition={{ duration: 0.3, ease: 'linear' }}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                                >
                                    {p.type === 'arrow' ? (
                                        <div className="text-amber-300 font-bold text-lg drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]">
                                            🏹 ➔
                                        </div>
                                    ) : p.type === 'fireball' ? (
                                        <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-yellow-200 animate-spin drop-shadow-[0_0_12px_rgba(239,68,68,1)] flex items-center justify-center text-xs">
                                            🔥
                                        </div>
                                    ) : p.type === 'lightning' ? (
                                        <div className="text-cyan-300 font-bold text-lg drop-shadow-[0_0_8px_rgba(34,211,238,1)]">
                                            ⚡
                                        </div>
                                    ) : (
                                        <div className="text-yellow-200 font-bold text-lg drop-shadow-[0_0_8px_rgba(254,240,138,1)]">
                                            ✨
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Detonation Explosions Shockwave */}
                            {detonations.map(d => (
                                <motion.div
                                    key={d.id}
                                    initial={{ scale: 0.2, opacity: 1 }}
                                    animate={{ scale: 2.8, opacity: 0 }}
                                    transition={{ duration: 0.85, ease: 'easeOut' }}
                                    className="absolute pointer-events-none z-50 rounded-full bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 border-4 border-yellow-200 shadow-[0_0_40px_rgba(239,68,68,1)] flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        left: `${(d.x + 0.5) * (100 / GRID_COLS)}%`,
                                        top: `${(d.y + 0.5) * (100 / GRID_ROWS)}%`,
                                        width: `${(100 / GRID_COLS) * 3}%`,
                                        height: `${(100 / GRID_ROWS) * 3}%`,
                                    }}
                                >
                                    <span className="text-3xl animate-spin">💥</span>
                                </motion.div>
                            ))}

                            {/* Floating Combat Damage Numbers */}
                            {floatingTexts.map(f => (
                                <motion.div
                                    key={f.id}
                                    initial={{ 
                                        left: `${(f.x + 0.5) * (100 / GRID_COLS)}%`, 
                                        top: `${(f.y + 0.3) * (100 / GRID_ROWS)}%`,
                                        opacity: 1,
                                        scale: 0.8
                                    }}
                                    animate={{ 
                                        top: `${(f.y - 0.2) * (100 / GRID_ROWS)}%`,
                                        opacity: 0,
                                        scale: 1.2
                                    }}
                                    transition={{ duration: 1.1, ease: 'easeOut' }}
                                    className="absolute -translate-x-1/2 font-black text-sm pointer-events-none z-40 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                                    style={{ color: f.color }}
                                >
                                    {f.text}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Authentic SSI Gold Box Character & Target Info Panel */}
                    <div className="w-full md:w-72 bg-[#0c0c0c] p-3 flex flex-col justify-between overflow-y-auto border-t-2 md:border-t-0 border-[#5a3311]">
                        {/* Top: Inspected Target (Matches Screenshot: UMBER HULK / HITPOINTS / AC) */}
                        <div className="bg-[#050505] border-2 border-[#4a2e15] p-2.5 rounded shadow-inner mb-2">
                            <div className="text-[#f5d061] font-bold text-sm tracking-wider uppercase border-b border-[#3b2411] pb-1 flex items-center justify-between">
                                <span>{inspectedCombatant?.name || 'ЦІЛЬ НЕ ОБРАНА'}</span>
                                <span className="text-xs text-stone-400">
                                    {(!inspectedCombatant?.avatar || inspectedCombatant.avatar.startsWith('/') || inspectedCombatant.avatar.includes('.')) ? '🥷' : inspectedCombatant.avatar}
                                </span>
                            </div>

                            {inspectedCombatant ? (
                                <div className="mt-2 space-y-1.5 text-xs text-[#00ff00]">
                                    <div className="flex justify-between font-bold text-sm text-[#33ff33]">
                                        <span>HITPOINTS:</span>
                                        <span>
                                            {inspectedCombatant.isDefeated && !inspectedCombatant.isDead
                                                ? `0 / ${inspectedCombatant.maxHp} (НЕПРИТОМНИЙ)`
                                                : `${inspectedCombatant.hp} / ${inspectedCombatant.maxHp}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-sm text-[#33ff33]">
                                        <span>AC (БРОНЯ):</span>
                                        <span>{inspectedCombatant.ac}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-sm text-yellow-300">
                                        <span>{inspectedCombatant.pointsName || 'ОЧКИ'}:</span>
                                        <span>{inspectedCombatant.currentPoints} / {inspectedCombatant.maxPoints}</span>
                                    </div>
                                    <div className="flex justify-between text-stone-300 text-[11px] pt-1 border-t border-stone-800">
                                        <span className="text-stone-400">КЛАС:</span>
                                        <span className="uppercase text-amber-200">{inspectedCombatant.title}</span>
                                    </div>
                                    <div className="flex justify-between text-stone-300 text-[11px]">
                                        <span className="text-stone-400">ТИП БОЮ:</span>
                                        <span className="text-cyan-300 uppercase">
                                            {inspectedCombatant.classType === 'ranged' ? 'СТРІЛЕЦЬ 🏹' : inspectedCombatant.classType === 'caster' ? 'МАГ / ЧАКЛУН 🔮' : 'БЛИЖНІЙ БІЙ ⚔️'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-stone-300 text-[11px]">
                                        <span className="text-stone-400">СИЛА / СПРИТНІСТЬ:</span>
                                        <span>{inspectedCombatant.strength} / {inspectedCombatant.agility}</span>
                                    </div>
                                    <div className="flex justify-between text-stone-300 text-[11px]">
                                        <span className="text-stone-400">ДАЛЬНІСТЬ АТАКИ:</span>
                                        <span>{inspectedCombatant.range} кл.</span>
                                    </div>
                                    <div className="flex justify-between text-stone-300 text-[11px]">
                                        <span className="text-stone-400">СТАТУС:</span>
                                        <span className={inspectedCombatant.isDead ? 'text-red-500 font-bold' : inspectedCombatant.isDefeated ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                                            {inspectedCombatant.isDead 
                                                ? '☠️ ЗАГИНУВ У БОЮ' 
                                                : inspectedCombatant.isDefeated 
                                                    ? `❤️‍🩹 ВПАВ / ПОРАНЕНИЙ (${inspectedCombatant.survivalProbability ?? 95}%)` 
                                                    : inspectedCombatant.isGuarding 
                                                        ? '🛡️ У ЗАХИСТІ' 
                                                        : '⚔️ ГОТОВИЙ'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-stone-500 text-xs py-4 text-center">
                                    Клікніть на бійця на полі для огляду
                                </div>
                            )}
                        </div>

                        {/* Middle: Active Turn Combatant Status */}
                        <div className="bg-[#140e09] border border-[#523318] p-2 rounded text-xs space-y-1 mb-2">
                            <div className="text-amber-400 font-bold text-[11px] uppercase flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <span>ХОДИТЬ:</span>
                                    <span className="text-white">{activeCombatant?.name}</span>
                                </div>
                                {activeCombatant && (
                                    <span className="text-yellow-400 font-mono text-[10px] bg-black/60 px-1.5 py-0.5 rounded border border-yellow-700/50">
                                        {activeCombatant.pointsName}: {activeCombatant.currentPoints}/{activeCombatant.maxPoints}
                                    </span>
                                )}
                            </div>
                            <div className="text-stone-400 text-[10px] flex justify-between">
                                <span>ДІЇ В РАУНДІ:</span>
                                <span className="text-amber-200">
                                    {activeCombatant?.hasMoved ? 'Рух ✕' : 'Рух ✓'} | {activeCombatant?.hasActed ? 'Атака ✕' : 'Атака ✓'}
                                </span>
                            </div>
                        </div>

                        {/* Bottom: Retro Combat Scrolling Log */}
                        <div className="flex-1 bg-[#050505] border border-[#2d1b0d] p-2 rounded flex flex-col min-h-[110px] max-h-[160px] overflow-y-auto text-[11px] text-[#33ff33] space-y-1">
                            <div className="text-[10px] text-amber-500 font-bold border-b border-stone-800 pb-0.5">
                                БОЙОВИЙ ЖУРНАЛ:
                            </div>
                            {combatLog.slice(-15).map((log, idx) => (
                                <div key={idx} className="leading-tight">
                                    {log}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>

                {/* Spell / Skill Selection Flyout Bar (When [CAST] is active) */}
                <AnimatePresence>
                    {activeMode === 'cast' && activeCombatant && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-[#211105] border-t-2 border-b-2 border-amber-600/80 px-3 py-2 shrink-0 z-30"
                        >
                            <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-amber-300">
                                        ✨ ЗАКЛЯТТЯ ТА СКІЛИ (ЗАМІСТЬ АТАКИ):
                                    </span>
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-yellow-300 font-bold">
                                        Запас: {activeCombatant.currentPoints} / {activeCombatant.maxPoints} {activeCombatant.pointsName}
                                    </span>
                                    <span className="text-[10px] text-stone-400 hidden sm:inline">
                                        (Очки відновлюються при підвищенні рівня)
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setActiveMode('idle');
                                        setSelectedSpell(null);
                                    }}
                                    className="text-[10px] text-stone-400 hover:text-white px-2 py-0.5 bg-stone-800 rounded"
                                >
                                    Скасувати (ESC)
                                </button>
                            </div>

                            <div className="flex gap-2 overflow-x-auto py-1">
                                {activeCombatant.spells && activeCombatant.spells.length > 0 ? (
                                    activeCombatant.spells.map(spell => {
                                        const reqPoints = spell.pointCost || 1;
                                        const hasEnough = activeCombatant.currentPoints >= reqPoints;
                                        return (
                                            <button
                                                key={spell.id}
                                                disabled={!hasEnough}
                                                onClick={() => {
                                                    if (!hasEnough) return;
                                                    setSelectedSpell(spell);
                                                    playRetroBeepSound(600);
                                                    appendLog(`🔮 Обрано "${spell.name}". Оберіть ціль на полі (Дальність: ${spell.range} кл., Вартість: ${reqPoints} ${activeCombatant.pointsName})`);
                                                }}
                                                className={`px-2.5 py-1.5 rounded border text-xs text-left shrink-0 transition flex flex-col gap-0.5 ${
                                                    selectedSpell?.id === spell.id
                                                        ? 'bg-amber-500 text-black border-white font-bold scale-105 shadow-md'
                                                        : hasEnough
                                                            ? 'bg-[#3b1d09] text-amber-100 border-[#7c4417] hover:bg-[#52290d]'
                                                            : 'bg-[#201510] text-stone-500 border-stone-800 opacity-60 cursor-not-allowed'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 font-bold">
                                                    <div className="flex items-center gap-1">
                                                        <span>{spell.icon}</span>
                                                        <span>{spell.name}</span>
                                                    </div>
                                                    <span className={`text-[10px] px-1 rounded ${
                                                        hasEnough ? 'bg-amber-900/80 text-amber-300' : 'bg-red-950 text-red-400'
                                                    }`}>
                                                        {spell.cost || `${reqPoints} ${activeCombatant.pointsName}`}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] opacity-80">{spell.description}</span>
                                                {!hasEnough && (
                                                    <span className="text-[9px] text-red-400 font-bold">
                                                        Недостатньо {activeCombatant.pointsName}!
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-xs text-stone-400 italic py-1">
                                        У цього бійця немає активних заклять.
                                    </div>
                                )}
                            </div>

                            {selectedSpell && (selectedSpell.type === 'trap' || selectedSpell.name.toLowerCase().includes('мін')) && (
                                <div className="mt-1.5 pt-1.5 border-t border-[#603512] flex items-center gap-2 flex-wrap text-xs">
                                    <span className="text-amber-200">
                                        🎯 Клікніть сусідню клітинку на сітці або встановіть прямо перед персонажем:
                                    </span>
                                    {(() => {
                                        const frontX = activeCombatant.side === 'player' ? Math.min(GRID_COLS - 1, activeCombatant.x + 1) : Math.max(0, activeCombatant.x - 1);
                                        const frontY = activeCombatant.y;
                                        const isFrontValid = !obstacles.some(o => o.x === frontX && o.y === frontY);
                                        return (
                                            <button
                                                disabled={!isFrontValid}
                                                onClick={() => handlePlaceMine(frontX, frontY, selectedSpell)}
                                                className={`px-2 py-1 rounded font-bold text-xs flex items-center gap-1.5 shadow transition ${
                                                    isFrontValid 
                                                        ? 'bg-amber-500 hover:bg-amber-400 text-black border border-yellow-200 cursor-pointer animate-pulse' 
                                                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                                }`}
                                            >
                                                <span>💣</span>
                                                <span>Встановити в клітинку перед собою ({frontX}, {frontY})</span>
                                            </button>
                                        );
                                    })()}
                                </div>
                            )}

                            {selectedSpell && (selectedSpell.type === 'heal' || selectedSpell.name.toLowerCase().includes('зцілення')) && (
                                <div className="mt-1.5 pt-1.5 border-t border-[#603512] flex items-center gap-2 flex-wrap text-xs">
                                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                                        <span>✨</span>
                                        <span>Клікніть бійця на полі або оберіть ціль для зцілення:</span>
                                    </span>
                                    {(() => {
                                        const playerChar = combatants.find(c => !c.isDefeated && (c.isPlayer || c.id === 'player_hero'));
                                        const isPlayerInRange = playerChar && getGridDistance(activeCombatant.x, activeCombatant.y, playerChar.x, playerChar.y) <= selectedSpell.range;
                                        const playerNeedsHeal = playerChar && playerChar.hp < playerChar.maxHp;
                                        return (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {playerChar && (
                                                    <button
                                                        disabled={!isPlayerInRange}
                                                        onClick={() => handleCastSpell(selectedSpell, playerChar)}
                                                        className={`px-3 py-1 rounded font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer ${
                                                            !isPlayerInRange
                                                                ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                                                : playerNeedsHeal
                                                                    ? 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white border border-emerald-300 animate-pulse shadow-emerald-900/50'
                                                                    : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500'
                                                        }`}
                                                        title={`Зцілити персонажа Сира Ольгерда (+${selectedSpell.power} HP)`}
                                                    >
                                                        <span>👑</span>
                                                        <span>ЗЦІЛИТИ ПЕРСОНАЖА ({playerChar.hp}/{playerChar.maxHp} HP)</span>
                                                        {playerNeedsHeal ? (
                                                            <span className="bg-red-950 text-red-200 border border-red-500/60 px-1 py-0.2 rounded text-[10px]">
                                                                -{playerChar.maxHp - playerChar.hp} HP
                                                            </span>
                                                        ) : (
                                                            <span className="text-green-300 text-[10px]">ПОВНЕ HP</span>
                                                        )}
                                                    </button>
                                                )}
                                                {combatants
                                                    .filter(c => c.side === activeCombatant.side && !c.isPlayer && c.id !== 'player_hero' && (c.hp < c.maxHp || (c.isDefeated && !c.isDead)))
                                                    .map(ally => {
                                                        const inRange = getGridDistance(activeCombatant.x, activeCombatant.y, ally.x, ally.y) <= selectedSpell.range;
                                                        const isDowned = ally.isDefeated && !ally.isDead;
                                                        return (
                                                            <button
                                                                key={ally.id}
                                                                disabled={!inRange}
                                                                onClick={() => handleCastSpell(selectedSpell, ally)}
                                                                className={`px-2 py-1 rounded text-xs flex items-center gap-1 border cursor-pointer ${
                                                                    !inRange
                                                                        ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                                                                        : isDowned
                                                                            ? 'bg-amber-900/90 hover:bg-amber-800 text-amber-200 border-amber-400 font-bold animate-pulse'
                                                                            : 'bg-[#1e3a1e] hover:bg-[#2e5a2e] text-green-200 border-green-600'
                                                                }`}
                                                            >
                                                                <span>{isDowned ? '❤️‍🩹' : (ally.avatar || '🛡️')}</span>
                                                                <span>{isDowned ? `ПІДВЕСТИ: ${ally.name} (${ally.survivalProbability ?? 95}%)` : `${ally.name} (${ally.hp}/${ally.maxHp})`}</span>
                                                            </button>
                                                        );
                                                    })
                                                }
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {selectedSpell && (selectedSpell.type === 'damage_aoe' || selectedSpell.name.toLowerCase().includes('град')) && (
                                <div className="mt-1.5 pt-1.5 border-t border-[#603512] flex items-center gap-2 flex-wrap text-xs">
                                    <span className="text-amber-300 font-bold flex items-center gap-1">
                                        <span>🏹</span>
                                        <span>ГРАД СТРІЛ (Площа 2 на 3 тайли): Клікніть на будь-яку клітинку поля бою в радіусі {selectedSpell.range} кл. — злива стріл накриє зону 2×3 (6 клітинок)!</span>
                                    </span>
                                    {(() => {
                                        const livingEnemies = combatants.filter(c => !c.isDefeated && c.side !== activeCombatant.side);
                                        const clusters = livingEnemies
                                            .filter(e => getGridDistance(activeCombatant.x, activeCombatant.y, e.x, e.y) <= selectedSpell.range)
                                            .map(e => {
                                                const aoe = getAoe2x3Tiles(e.x, e.y);
                                                const hitCount = livingEnemies.filter(o => aoe.some(t => t.x === o.x && t.y === o.y)).length;
                                                return { enemy: e, hitCount };
                                            })
                                            .sort((a, b) => b.hitCount - a.hitCount);

                                        const bestCluster = clusters[0];
                                        if (!bestCluster) return null;

                                        return (
                                            <button
                                                onClick={() => handleCastAoeSpell(selectedSpell, bestCluster.enemy.x, bestCluster.enemy.y)}
                                                className="px-3 py-1 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xs rounded border border-yellow-300 shadow cursor-pointer flex items-center gap-1.5 animate-pulse"
                                                title="Залп по найбільшому скупченню ворогів у зоні 2 на 3"
                                            >
                                                <span>🎯</span>
                                                <span>ЗАЛП ПО СКУПЧЕННЮ ({bestCluster.enemy.name}, {bestCluster.hitCount} вор. у зоні 2×3)</span>
                                            </button>
                                        );
                                    })()}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Control & Status Command Bar (Matches Screenshot) */}
                <div className="bg-[#1b0e06] p-2.5 border-t-2 border-[#5a3311] flex flex-wrap items-center justify-between gap-2 shrink-0">
                    {/* Range Indicator (RANGE = 3) */}
                    <div className="text-[#33ff33] font-bold text-sm tracking-wider flex items-center gap-3">
                        <span className="bg-black/70 px-2 py-1 rounded border border-green-800">
                            RANGE = {currentHoverRange}
                        </span>
                        <span className="text-[11px] text-stone-400 hidden sm:inline">
                            (КЛІКНІТЬ АБО НАТИСНІТЬ КЛАВІШІ ДЛЯ ДІЙ)
                        </span>
                    </div>

                    {/* Action Command Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* [M] MOVE */}
                        <button
                            disabled={isAiProcessing || activeCombatant?.hasMoved || activeCombatant?.side !== 'player'}
                            onClick={() => {
                                setActiveMode(prev => prev === 'move' ? 'idle' : 'move');
                                playRetroBeepSound(450);
                            }}
                            className={`px-2.5 py-1.5 text-xs font-bold rounded border transition ${
                                activeMode === 'move'
                                    ? 'bg-cyan-500 text-black border-white shadow'
                                    : 'bg-[#3d2410] hover:bg-[#5c3719] text-cyan-200 border-cyan-800/60 disabled:opacity-40'
                            }`}
                            title="Рухатися по сітці (Клавіша M)"
                        >
                            [M] РУХ
                        </button>

                        {/* [A] ATTACK (Melee) */}
                        <button
                            disabled={isAiProcessing || activeCombatant?.hasActed || activeCombatant?.side !== 'player'}
                            onClick={() => {
                                setActiveMode(prev => prev === 'attack' ? 'idle' : 'attack');
                                playRetroBeepSound(450);
                            }}
                            className={`px-2.5 py-1.5 text-xs font-bold rounded border transition ${
                                activeMode === 'attack'
                                    ? 'bg-red-500 text-black border-white shadow'
                                    : 'bg-[#3d2410] hover:bg-[#5c3719] text-red-200 border-red-800/60 disabled:opacity-40'
                            }`}
                            title="Ближній бій мечем у сусідню клітинку (радіус: 1 клітинка, потрійна шкода х3) (Клавіша A)"
                        >
                            [A] УДАР МЕЧЕМ ⚔️ (1 кл.)
                        </button>

                        {/* [S] SHOOT (Ranged Archery) */}
                        <button
                            disabled={
                                isAiProcessing || 
                                activeCombatant?.hasActed || 
                                activeCombatant?.side !== 'player' ||
                                (activeCombatant?.classType !== 'ranged' && activeCombatant?.classType !== 'hybrid')
                            }
                            onClick={() => {
                                setActiveMode(prev => prev === 'shoot' ? 'idle' : 'shoot');
                                playRetroBeepSound(500);
                            }}
                            className={`px-2.5 py-1.5 text-xs font-bold rounded border transition ${
                                activeMode === 'shoot'
                                    ? 'bg-amber-500 text-black border-white shadow'
                                    : 'bg-[#3d2410] hover:bg-[#5c3719] text-amber-200 border-amber-800/60 disabled:opacity-30'
                            }`}
                            title="Стрілецька атака з лука / арбалета на відстань (Клавіша S)"
                        >
                            [S] СТРІЛЬБА 🏹
                        </button>

                        {/* [C] CAST / SKILLS (Dedicated Menu Item, Replaces Attack) */}
                        <button
                            disabled={isAiProcessing || activeCombatant?.hasActed || activeCombatant?.side !== 'player'}
                            onClick={() => {
                                setActiveMode(prev => prev === 'cast' ? 'idle' : 'cast');
                                playRetroBeepSound(550);
                            }}
                            className={`px-2.5 py-1.5 text-xs font-bold rounded border transition ${
                                activeMode === 'cast'
                                    ? 'bg-purple-500 text-black border-white shadow'
                                    : 'bg-[#3d2410] hover:bg-[#5c3719] text-purple-200 border-purple-800/60 disabled:opacity-40'
                            }`}
                            title="Закляття та скіли — застосовуються замість атаки (Клавіша C)"
                        >
                            [C] ЗАКЛЯТТЯ / СКІЛИ ✨
                        </button>

                        {/* [G] GUARD */}
                        <button
                            disabled={isAiProcessing || activeCombatant?.hasActed || activeCombatant?.side !== 'player'}
                            onClick={handleGuardAction}
                            className="px-2.5 py-1.5 text-xs font-bold rounded border bg-[#3d2410] hover:bg-[#5c3719] text-blue-200 border-blue-800/60 disabled:opacity-40 transition"
                            title="Глухий захист щитом (Клавіша G)"
                        >
                            [G] ЗАХИСТ 🛡️
                        </button>

                        {/* [P] PASS / END TURN */}
                        <button
                            disabled={isAiProcessing || activeCombatant?.side !== 'player'}
                            onClick={advanceTurn}
                            className="px-2.5 py-1.5 text-xs font-bold rounded border bg-[#38200d] hover:bg-[#522f13] text-stone-200 border-stone-600 disabled:opacity-40 transition"
                            title="Завершити хід бійця (Клавіша P або ПРОБІЛ)"
                        >
                            [P] ПАС ❯
                        </button>

                        {/* FLEE / EXIT */}
                        <button
                            onClick={handleFleeCombat}
                            className="px-2 py-1.5 text-xs font-bold rounded border bg-red-950/80 hover:bg-red-800 text-red-300 border-red-800 transition"
                            title="Відступити з поля бою"
                        >
                            ВТЕЧА
                        </button>
                    </div>
                </div>

                {/* Victory Modal Overlay */}
                {battleOutcome === 'victory' && (
                    <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-[#1f1107] border-4 border-[#ffd700] rounded-lg p-6 shadow-2xl text-center space-y-4">
                            <div className="text-3xl font-black text-[#ffd700] tracking-wider uppercase drop-shadow">
                                🎉 СЛАВНА ПЕРЕМОГА!
                            </div>
                            <div className="text-sm text-stone-300">
                                Загін <span className="text-amber-300 font-bold">{squad.name}</span> повністю розбитий та розсіяний!
                            </div>

                            <div className="bg-black/60 border border-amber-600/60 p-4 rounded text-left space-y-2 text-xs">
                                <div className="text-amber-400 font-bold text-sm border-b border-stone-800 pb-1">
                                    ТРОФЕЇ ТА ЗДОБИЧ:
                                </div>
                                <div className="flex justify-between text-yellow-300 font-bold">
                                    <span>💰 ЗОЛОТО:</span>
                                    <span>+{squad.rewards.gold} кр.</span>
                                </div>
                                <div className="flex justify-between text-purple-300 font-bold">
                                    <span>🃏 УЛАМКИ КАРТ:</span>
                                    <span>+{squad.rewards.cardPieces} шт.</span>
                                </div>
                                <div className="flex justify-between text-emerald-300 font-bold">
                                    <span>⭐ ДОСВІД (XP):</span>
                                    <span>+{squad.rewards.xp} XP</span>
                                </div>
                                <div className="flex justify-between text-blue-300 font-bold">
                                    <span>👑 РЕПУТАЦІЯ:</span>
                                    <span>+{squad.rewards.reputation}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCollectVictory}
                                className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-sm tracking-wider uppercase rounded shadow-lg transition hover:scale-105"
                            >
                                ЗАБРАТИ ЗДОБИЧ ТА ПРОДОВЖИТИ
                            </button>
                        </div>
                    </div>
                )}

                {/* Defeat Modal Overlay */}
                {battleOutcome === 'defeat' && (
                    <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-[#240a0a] border-4 border-red-700 rounded-lg p-6 shadow-2xl text-center space-y-4">
                            <div className="text-3xl font-black text-red-500 tracking-wider uppercase drop-shadow">
                                💀 ПОРАЗКА...
                            </div>
                            <div className="text-sm text-stone-300">
                                Усі захисники пали в нерівному бою. Пораненого Сира Ольгерда винесли з поля битви...
                            </div>
                            <button
                                onClick={() => {
                                    syncAllCombatantsToWorldProgress();
                                    onDefeat();
                                }}
                                className="w-full py-3 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-black text-sm tracking-wider uppercase rounded shadow-lg transition hover:scale-105"
                            >
                                ВІДСТУПИТИ ДО ШПИТАЛЮ
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

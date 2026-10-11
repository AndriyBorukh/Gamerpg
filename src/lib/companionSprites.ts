// Utility for managing medieval soldier sprites for the protagonist's squad and companions
// Matching the authentic Battle Brothers / medieval mercenary 2D RPG sprite aesthetic
import { CharacterGender } from '../types';
import { getGenderForName } from './nameGenerator';

import femaleCommanderImg from '../assets/images/female_knight_commander_1790592700229.jpg';
import femaleInfantryImg from '../assets/images/female_infantry_soldier_1790592715849.jpg';
import femaleRangerImg from '../assets/images/female_ranger_archer_1790592732628.jpg';
import femaleHeavyImg from '../assets/images/female_heavy_paladin_1790592746474.jpg';
import femaleMageImg from '../assets/images/female_mage_sorceress_1790592762285.jpg';
import femaleAssassinImg from '../assets/images/female_assassin_rogue_1790592794004.jpg';

export const HERO_COMMANDER_SPRITE = '/assets/images/knight_hero_commander_1789859209062.jpg';
export const INFANTRY_SOLDIER_SPRITE = '/assets/images/medieval_infantry_soldier_1789859194861.jpg';
export const RANGER_ARCHER_SPRITE = '/assets/images/medieval_ranger_archer_1789859220352.jpg';
export const HEAVY_MANATARMS_SPRITE = '/assets/images/medieval_heavy_manatarms_1789859236209.jpg';
export const MAP_SOLDIER_SPRITE = '/assets/images/map_soldier_sprite_cropped.png';
export const MAP_SOLDIER_RAW_SPRITE = '/assets/images/map_soldier_sprite_1789859623533.jpg';
export const BANDIT_MAP_SPRITE = '/assets/images/bandit_map_sprite_transparent.png';

export const FEMALE_HERO_COMMANDER_SPRITE = femaleCommanderImg;
export const FEMALE_INFANTRY_SOLDIER_SPRITE = femaleInfantryImg;
export const FEMALE_RANGER_ARCHER_SPRITE = femaleRangerImg;
export const FEMALE_HEAVY_PALADIN_SPRITE = femaleHeavyImg;
export const FEMALE_MAGE_SPRITE = femaleMageImg;
export const FEMALE_ASSASSIN_SPRITE = femaleAssassinImg;

export const FEMALE_AVATAR_EMOJIS = [
    '🧝‍♀️', '🧙‍♀️', '🦹‍♀️', '🧚', '👩', '👸', '👩‍🦰', '👩‍🦳', '👩‍🎤', '👩‍🌾', '👩‍🔬', '👩‍🎓', '🧕', '💃'
];

export function isCharacterFemale(character: {
    name?: string;
    avatar?: string;
    gender?: CharacterGender;
}): boolean {
    if (character.gender === 'female') return true;
    if (character.gender === 'male') return false;

    // Check by name if available
    if (character.name) {
        const nameGender = getGenderForName(character.name);
        if (nameGender === 'female') return true;
        if (nameGender === 'male') {
            // Male name: only override if explicit female emoji is chosen
            if (character.avatar && FEMALE_AVATAR_EMOJIS.includes(character.avatar)) {
                return true;
            }
            return false;
        }
    }

    // Fallback: only check strictly female avatar emojis
    if (character.avatar && FEMALE_AVATAR_EMOJIS.includes(character.avatar)) {
        return true;
    }

    return false;
}

export const CLASS_SPRITE_MAP: Record<string, string> = {
    // ⚔️ Infantry / Melee Soldiers (Default kettle hat & gambeson mercenary)
    swordsman: INFANTRY_SOLDIER_SPRITE,
    pikeman: INFANTRY_SOLDIER_SPRITE,
    duelist: INFANTRY_SOLDIER_SPRITE,
    wandering_knight: INFANTRY_SOLDIER_SPRITE,
    banner_bearer: INFANTRY_SOLDIER_SPRITE,
    adventurer: INFANTRY_SOLDIER_SPRITE,
    bandit: BANDIT_MAP_SPRITE,
    rogue: BANDIT_MAP_SPRITE,
    thug: BANDIT_MAP_SPRITE,
    executioner: INFANTRY_SOLDIER_SPRITE,
    warrior: INFANTRY_SOLDIER_SPRITE,
    contender: INFANTRY_SOLDIER_SPRITE,

    // 🛡️ Heavy Armored / Shieldbearers
    guardian: HEAVY_MANATARMS_SPRITE,
    shieldbearer: HEAVY_MANATARMS_SPRITE,
    cataphract: HEAVY_MANATARMS_SPRITE,
    paladin: HEAVY_MANATARMS_SPRITE,
    holy_knight: HEAVY_MANATARMS_SPRITE,

    // 🏹 Ranged / Archers / Scouts
    hunter: RANGER_ARCHER_SPRITE,
    sniper: RANGER_ARCHER_SPRITE,
    crossbowman: RANGER_ARCHER_SPRITE,
    skirmisher: RANGER_ARCHER_SPRITE,
    ranger: RANGER_ARCHER_SPRITE,
    musketeer: RANGER_ARCHER_SPRITE,
    arquebusier: RANGER_ARCHER_SPRITE,
    thrower: RANGER_ARCHER_SPRITE,
    archer: RANGER_ARCHER_SPRITE,

    // Other Archetypes
    barbarian: '/assets/images/card_barbarian_warrior_art_1787957196198.jpg',
    berserker: '/assets/images/card_barbarian_warrior_art_1787957196198.jpg',
    assassin: '/assets/images/card_assassin_thief_art_1787957185780.jpg',
    ninja: '/assets/images/card_assassin_thief_art_1787957185780.jpg',
    thief: '/assets/images/card_assassin_thief_art_1787957185780.jpg',
    spy: '/assets/images/card_assassin_thief_art_1787957185780.jpg',
    priest: '/assets/images/card_cleric_healer_art_1787957211257.jpg',
    exorcist: '/assets/images/card_cleric_healer_art_1787957211257.jpg',
    inquisitor: '/assets/images/card_cleric_healer_art_1787957211257.jpg',
    druid: '/assets/images/card_shaman_druid_art_1787957132833.jpg',
    shaman: '/assets/images/card_shaman_druid_art_1787957132833.jpg',
    elementalist: '/assets/images/card_wizard_art_1787956829955.jpg',
    pyromancer: '/assets/images/card_wizard_art_1787956829955.jpg',
    cryomancer: '/assets/images/card_wizard_art_1787956829955.jpg',
    necromancer: '/assets/images/card_necromancer_art_1787957120928.jpg',
    undead: '/assets/images/card_death_knight_1787956814001.jpg',
    commander: HERO_COMMANDER_SPRITE
};

export const FEMALE_CLASS_SPRITE_MAP: Record<string, string> = {
    // ⚔️ Melee / Infantry / Swords
    swordsman: FEMALE_INFANTRY_SOLDIER_SPRITE,
    pikeman: FEMALE_INFANTRY_SOLDIER_SPRITE,
    duelist: FEMALE_INFANTRY_SOLDIER_SPRITE,
    wandering_knight: FEMALE_INFANTRY_SOLDIER_SPRITE,
    banner_bearer: FEMALE_INFANTRY_SOLDIER_SPRITE,
    adventurer: FEMALE_INFANTRY_SOLDIER_SPRITE,
    bandit: FEMALE_ASSASSIN_SPRITE,
    rogue: FEMALE_ASSASSIN_SPRITE,
    thug: FEMALE_INFANTRY_SOLDIER_SPRITE,
    executioner: FEMALE_INFANTRY_SOLDIER_SPRITE,
    warrior: FEMALE_INFANTRY_SOLDIER_SPRITE,
    contender: FEMALE_INFANTRY_SOLDIER_SPRITE,
    піхота: FEMALE_INFANTRY_SOLDIER_SPRITE,

    // 🛡️ Heavy Armored / Shieldbearers / Paladins
    guardian: FEMALE_HEAVY_PALADIN_SPRITE,
    shieldbearer: FEMALE_HEAVY_PALADIN_SPRITE,
    cataphract: FEMALE_HEAVY_PALADIN_SPRITE,
    paladin: FEMALE_HEAVY_PALADIN_SPRITE,
    holy_knight: FEMALE_HEAVY_PALADIN_SPRITE,
    лицарі: FEMALE_HEAVY_PALADIN_SPRITE,
    щитоносці: FEMALE_HEAVY_PALADIN_SPRITE,

    // 🏹 Ranged / Archers / Scouts
    hunter: FEMALE_RANGER_ARCHER_SPRITE,
    sniper: FEMALE_RANGER_ARCHER_SPRITE,
    crossbowman: FEMALE_RANGER_ARCHER_SPRITE,
    skirmisher: FEMALE_RANGER_ARCHER_SPRITE,
    ranger: FEMALE_RANGER_ARCHER_SPRITE,
    musketeer: FEMALE_RANGER_ARCHER_SPRITE,
    arquebusier: FEMALE_RANGER_ARCHER_SPRITE,
    thrower: FEMALE_RANGER_ARCHER_SPRITE,
    archer: FEMALE_RANGER_ARCHER_SPRITE,
    стрільці: FEMALE_RANGER_ARCHER_SPRITE,
    вершники: FEMALE_HEAVY_PALADIN_SPRITE,

    // 🔮 Arcane / Magic / Mages
    elementalist: FEMALE_MAGE_SPRITE,
    pyromancer: FEMALE_MAGE_SPRITE,
    cryomancer: FEMALE_MAGE_SPRITE,
    wizard: FEMALE_MAGE_SPRITE,
    mage: FEMALE_MAGE_SPRITE,
    sorceress: FEMALE_MAGE_SPRITE,
    witch: FEMALE_MAGE_SPRITE,
    druid: FEMALE_MAGE_SPRITE,
    shaman: FEMALE_MAGE_SPRITE,
    priest: FEMALE_HEAVY_PALADIN_SPRITE,
    cleric: FEMALE_HEAVY_PALADIN_SPRITE,
    exorcist: FEMALE_HEAVY_PALADIN_SPRITE,
    inquisitor: FEMALE_HEAVY_PALADIN_SPRITE,
    necromancer: FEMALE_MAGE_SPRITE,
    маги: FEMALE_MAGE_SPRITE,

    // 🗡️ Stealth / Rogues
    assassin: FEMALE_ASSASSIN_SPRITE,
    ninja: FEMALE_ASSASSIN_SPRITE,
    thief: FEMALE_ASSASSIN_SPRITE,
    spy: FEMALE_ASSASSIN_SPRITE,
    barbarian: FEMALE_INFANTRY_SOLDIER_SPRITE,
    berserker: FEMALE_INFANTRY_SOLDIER_SPRITE,

    commander: FEMALE_HERO_COMMANDER_SPRITE
};

/**
 * Returns the appropriate full-body soldier sprite URL for a given companion or class,
 * taking gender into account.
 */
export function getCompanionSprite(companion: {
    companionClassId?: string;
    isSummon?: boolean;
    isDead?: boolean;
    avatar?: string;
    gender?: CharacterGender;
    type?: string;
    name?: string;
}): string {
    const isFemale = isCharacterFemale(companion);

    if (isFemale) {
        if (companion.companionClassId && FEMALE_CLASS_SPRITE_MAP[companion.companionClassId]) {
            return FEMALE_CLASS_SPRITE_MAP[companion.companionClassId];
        }
        if (companion.type && FEMALE_CLASS_SPRITE_MAP[companion.type]) {
            return FEMALE_CLASS_SPRITE_MAP[companion.type];
        }
        return FEMALE_INFANTRY_SOLDIER_SPRITE;
    }

    if (companion.companionClassId && CLASS_SPRITE_MAP[companion.companionClassId]) {
        return CLASS_SPRITE_MAP[companion.companionClassId];
    }
    if (companion.type && CLASS_SPRITE_MAP[companion.type]) {
        return CLASS_SPRITE_MAP[companion.type];
    }
    // Default medieval mercenary infantry soldier
    return INFANTRY_SOLDIER_SPRITE;
}

export function getHeroCommanderSprite(gender?: CharacterGender): string {
    return gender === 'female' ? FEMALE_HERO_COMMANDER_SPRITE : HERO_COMMANDER_SPRITE;
}

export function getCharacterBattlePortrait(character: {
    name?: string;
    avatar?: string;
    gender?: CharacterGender;
    companionClassId?: string;
    type?: string;
}): string {
    return getCompanionSprite(character);
}

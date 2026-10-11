export type CharacterGender = 'male' | 'female';

export type Suit = 
    | '♠' | '♥' | '♦' | '♣' 
    | '★' | '☾' | '🍁' | '⚡' | '💧' | '🌸' 
    | '🔮' | '🛡️' | '⚔️' | '🗝️' | '📜' | '🧭' | '⏳' | '⚖️' 
    | '👑' | '💎' | '🔥' | '🌊' | '🌪️' | '🌱' | '🪐' | '🌌' 
    | '🎴' | '✨' | '♟️' | '🎩' | '🗡️' | '🎲' | '🧪' | '🐕' | '🪙' | '🥈' | '⛏️' | 'Joker'
    | '🪄' | '🍷';

export type Rank = 
    | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' 
    | 'J' | 'N' | 'Q' | 'K' | 'A' 
    | 'P (Паж)' | 'KN (Лицар)' | 'Q (Королева)' | 'K (Король)' | 'A (Туз)' 
    | 'M (Магістр)' | 'GM (Гросмейстер)' | 'SH (Шулер)' | 'TH (Злодій)' | 'SG (Мудрець)' | 'MC (Найманець)' | 'GB (Гравець)' | 'PR (Священик)' | 'BP (Єпископ)' | 'AB (Архієпископ)' | 'PL (Паладин)' | 'AL (Алхімік)' | 'HM (Псар)' | 'DG (Собака)'
    | 'DK (Лицар смерті)' | 'SK (Скелет)' | 'NC (Некромант)' | 'ZB (Зомбі)' | 'DTH (Смерть)' | 'MR (Торговець)' | 'HR (Герой)' | 'WL (Чаклун)' | 'SP (Закляття)' | 'SP (Чіл тач)' | 'SP (Перст смерті)' | 'SP (Слово сили: Смерть)' | 'SP (Анігіляція)' | 'MG (Маг)' | 'KN (Знання)' | 'WZ (Чарівник)' | 'IL (Ілюзіоніст)' | 'ILL (Ілюзія)' | 'BR (Варвар)' | 'RG (Злість)' | 'CL (Клірик)' | 'RN (Ренджер)' | 'HN (Мисливець)' | 'TP (Траппер)' | 'TR (Пастка)' | 'LD (Лідер)' | 'CM (Командир)' | 'GN (Полководець)' | 'GL (Золото)' | 'SL (Срібло)'
    | 'PC (Принцеса)' | 'PRN (Принц)' | 'KB (Каббаліст)' | 'GLM (Голем)' | 'INV (Винахідник)' | 'AUT (Автоматон)' | 'ANM (Аніматронік)' | 'SP (Ілюзорна копія)'
    | 'PRT (Пірат)' | 'TRSR (Скарб)' | 'ELX (Еліксир)' | 'RBR (Розбійник)' | 'BRG (Грабіжник)' | 'DOC (Лікар)' | 'WDC (Знахар)' | 'DRD (Друїд)' | 'SHM (Шаман)' | 'WLF (Вовк)' | 'BR_ANM (Ведмідь)' | 'WLF_SP (Дух вовка)' | 'BR_SP (Дух ведмедя)' | 'WR_SP (Дух воїна)' | 'WAL (Стіна)' | 'TWR (Вежа)' | 'BST (Бастіон)' | 'CST (Замок)' | 'SHD (Щит)' | 'EXC (Кат)' | 'ASN (Ассасін)' | 'ARC (Лучники)' | 'CRB (Арбалетчики)' | 'TYC (Магнат)'
    | 'DRK (Драккар)' | 'VK (Вікінг)' | 'HRD (Орда)' | 'HL (Ординець)' | 'PRT_SHIP (Піратський корабель)' | 'PRT_CREW (Піратський екіпаж)' | 'GLD_MN (Золота шахта)' | 'SLV_MN (Срібна шахта)' | 'MNR (Шахтарі)' | 'TRSR_HNT (Шукач скарбів)'
    | '0 (Шут)' | 'I (Маг)' | 'II (Жриця)' | 'III (Імператриця)' | 'IV (Імператор)' 
    | 'V (Іерофант)' | 'VI (Закохані)' | 'VII (Колісниця)' | 'VIII (Справедливість)' | 'IX (Відлючник)' 
    | 'X (Фортуна)' | 'XI (Сила)' | 'XII (Повішений)' | 'XIII (Смерть)' | 'XIV (Поміркованість)' 
    | 'XV (Диявол)' | 'XVI (Вежа)' | 'XVII (Зірка)' | 'XVIII (Місяць)' | 'XIX (Сонце)' 
    | 'XX (Суд)' | 'XXI (Світ)'
    | 'Black Joker' | 'Red Joker' | 'White Joker' | 'Gold Joker';


export interface Card {
    id: number;
    suit: Suit;
    rank: Rank;
    value: number;
    isMagister?: boolean;
    isGrandmaster?: boolean;
    isSharper?: boolean;
    isThief?: boolean;
    isSage?: boolean;
    isMercenary?: boolean;
    isGambler?: boolean;
    isPriest?: boolean;
    isBishop?: boolean;
    isArchbishop?: boolean;
    isPaladin?: boolean;
    isAlchemist?: boolean;
    isHuntsman?: boolean;
    isDog?: boolean;
    isEmpowered?: boolean;
    // New cards & Spells
    isDeathKnight?: boolean;
    isSkeleton?: boolean;
    isDraugr?: boolean;
    isNecromancer?: boolean;
    isZombie?: boolean;
    isDeathCard?: boolean;
    isMerchant?: boolean;
    isHero?: boolean;
    isWarlock?: boolean;
    isSpell?: boolean;
    isChillTouch?: boolean;
    isFingerOfDeath?: boolean;
    isPowerWordKill?: boolean;
    isAnnihilation?: boolean;
    isGhost?: boolean;
    isMage?: boolean;
    isKnowledge?: boolean;
    isWizard?: boolean;
    isIllusionist?: boolean;
    isIllusion?: boolean;
    isBarbarian?: boolean;
    isRage?: boolean;
    isCleric?: boolean;
    isRanger?: boolean;
    isHunter?: boolean;
    isTrapper?: boolean;
    isTrap?: boolean;
    isLeader?: boolean;
    isCommander?: boolean;
    isGeneral?: boolean;
    isGold?: boolean;
    isSilver?: boolean;
    isGoldMine?: boolean;
    isSilverMine?: boolean;
    isMiners?: boolean;
    isTreasureHunter?: boolean;
    // New deck cards & summons
    isPrincess?: boolean;
    isPrince?: boolean;
    isKabbalist?: boolean;
    isGolem?: boolean;
    isInventor?: boolean;
    isAutomaton?: boolean;
    isAnimatronic?: boolean;
    isEternalCard?: boolean;
    isIllusionCopySpell?: boolean;
    isImmortalitySpell?: boolean;
    isEndTurnSpell?: boolean;
    isSummonGhostSpell?: boolean;
    isSummonSkeletonsSpell?: boolean;
    isSummonZombiesSpell?: boolean;
    isSummonGolemSpell?: boolean;
    isSummonAnimatronicSpell?: boolean;
    isSummonAutomatonSpell?: boolean;
    isMeteorSwarm?: boolean;
    isManaShield?: boolean;
    isChainLightning?: boolean;
    isMassDeath?: boolean;
    isDeathRay?: boolean;
    isMindHeist?: boolean;
    isConversion?: boolean;
    isHolyCathedral?: boolean;
    isNorthernWind?: boolean;
    isDrakkar?: boolean;
    isViking?: boolean;
    isHorde?: boolean;
    isHordeCard?: boolean;
    isHordeling?: boolean;
    isUndeadLord?: boolean;
    isZombiePlague?: boolean;
    isTurnToSkeletons?: boolean;
    isPirateRaid?: boolean;
    isPirateShip?: boolean;
    isPirateCrew?: boolean;
    isUndeadLordSpell?: boolean;
    isGrandKonungSpell?: boolean;
    isGreatKhanSpell?: boolean;
    isZombieApocalypseSpell?: boolean;
    isInvadersSpell?: boolean;
    isStormOfSeasSpell?: boolean;
    isEinherjarSpell?: boolean;
    isHelArmySpell?: boolean;
    isVampire?: boolean;
    isVampireSpell?: boolean;
    isVampireHunter?: boolean;
    isBurnCardSpell?: boolean;
    isBurnHandSpell?: boolean;
    isSmeltingSpell?: boolean;
    smeltingLevel?: number;
    isResourceReleaseSpell?: boolean;
    resourceReleaseLevel?: number;
    isNomad?: boolean;
    isKing?: boolean;
    isKnight?: boolean;
    isPirate?: boolean;
    isTreasure?: boolean;
    isHealthElixir?: boolean;
    isRobber?: boolean;
    isBurglar?: boolean;
    isDoctor?: boolean;
    isWitchDoctor?: boolean;
    isDruid?: boolean;
    isShaman?: boolean;
    isWolf?: boolean;
    isBear?: boolean;
    isWolfSpirit?: boolean;
    isBearSpirit?: boolean;
    isWarriorSpirit?: boolean;
    isWall?: boolean;
    isTower?: boolean;
    isBastion?: boolean;
    isCastle?: boolean;
    isShield?: boolean;
    isExecutioner?: boolean;
    isAssassin?: boolean;
    isArcher?: boolean;
    isCrossbowman?: boolean;
    isTycoon?: boolean;
    isCustomHeroCard?: boolean;
    heroCardId?: string;
    heroLevel?: number;
    heroXp?: number;
    heroMaxXp?: number;
    heroCondition?: number;
    heroMaxCondition?: number;
    heroName?: string;
    heroAvatar?: string;
    isWeakStrengthBoostSpell?: boolean;
    isStrengthBoostSpell?: boolean;
    isStrongStrengthBoostSpell?: boolean;
    strengthBonus?: number;
}

export interface CustomHeroCard {
    id: string;
    name: string;
    avatar: string;
    suit: Suit;
    level: number; // 0 to 99
    experience: number;
    maxXp: number;
    condition?: number; // 0 to 10 (total 10)
    maxCondition?: number; // 10
    isCustomHeroCard: true;
    createdAt: string;
}

export interface TablePair {
    attack: Card;
    attackerId: number;
    defense?: Card;
}

export interface Player {
    id: number;
    name: string;
    isHuman: boolean;
    hand: Card[];
    outRank?: number; // Order in which player finished (1st place, 2nd, etc.)
    avatar: string;
    powerPoints: number;
    immortalityTurns?: number; // Turns remaining for Immortality spell
    health: number; // Health of the player (starts at 500)
    armor: number; // Protection points (starts at 200)
    isEliminated?: boolean; // Whether the player is eliminated
    strengthBoost?: number; // Active strength boost for next played card (+1, +3, +10)
    strengthBoostTurns?: number; // Duration in turns (1)
}

export interface ShopStock {
    weakStrengthBoost: number; // 12 available
    strengthBoost: number; // 10 available
    strongStrengthBoost: number; // 8 available
    spells: number; // 18 available
    immortality: number; // 6 available
    summonGhost: number; // 12 available
    summonSkeletons: number; // 10 available
    summonZombies: number; // 8 available
    illusionCopy: number; // 9 available
    endTurn: number; // 14 available
    summonGolem: number; // 9 available
    summonAnimatronic: number; // 9 available
    summonAutomaton: number; // 9 available
    meteorSwarm: number; // 6 available
    manaShield: number; // 8 available
    chainLightning: number; // 10 available
    massDeath: number; // 6 available
    deathRay: number; // 8 available
    mindHeist: number; // 8 available
    conversion: number; // 6 available
    holyCathedral: number; // 5 available
    northernWind: number; // 6 available
    horde: number; // 6 available
    undeadLord: number; // 6 available
    zombiePlague: number; // 6 available
    turnToSkeletons: number; // 6 available
    pirateRaid: number; // 6 available
    undeadLordSpell: number; // 6 available
    grandKonungSpell: number; // 6 available
    greatKhanSpell: number; // 6 available
    zombieApocalypseSpell: number; // 6 available
    invadersSpell: number; // 6 available
    stormOfSeasSpell: number; // 6 available
    einherjarSpell: number; // 6 available
    helArmySpell: number; // 6 available
    burnCardSpell: number; // 6 available
    burnHandSpell: number; // 6 available
    summonVampire: number; // 8 available
    summonVampireSpell: number; // 8 available
    smeltingLvl1: number; // 6 available
    smeltingLvl2: number; // 5 available
    smeltingLvl3: number; // 5 available
    smeltingLvl4: number; // 5 available
    smeltingLvl5: number; // 5 available
    smeltingLvl6: number; // 3 available
    smeltingLvl7: number; // 3 available
    smeltingLvl8: number; // 4 available
    resourceReleaseLvl1: number; // 6 available
    resourceReleaseLvl2: number; // 5 available
    resourceReleaseLvl3: number; // 5 available
    resourceReleaseLvl4: number; // 5 available
    resourceReleaseLvl5: number; // 5 available
    resourceReleaseLvl6: number; // 3 available
    resourceReleaseLvl7: number; // 3 available
}

export interface CombatLogEntry {
    id: string;
    text: string;
    type?: 'attack' | 'defense' | 'spell' | 'take' | 'pass' | 'elimination' | 'system' | 'damage' | 'buy';
    timestamp: string;
}

export type SettlementType = 'city' | 'castle' | 'village' | 'hamlet' | 'ruins' | 'graveyard';

export type WeaponCategory = 'melee' | 'ranged';
export type WeaponSubtype = 'sword' | 'axe' | 'mace' | 'dagger' | 'spear' | 'halberd' | 'staff' | 'bow' | 'crossbow' | 'sling';

export interface WeaponItem {
    id: string;
    name: string;
    category: WeaponCategory;
    weaponSubtype: WeaponSubtype;
    type: 'sword' | 'axe' | 'mace' | 'dagger' | 'rapier' | 'greatsword' | 'spear' | 'halberd' | 'flail' | 'scimitar' | 'morningstar' | 'staff' | 'bow' | 'crossbow' | 'sling';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    icon: string;
    cost: number;
    description: string;
    damageBonus: number; // Flat bonus added to hit damage
    agilityBonus: number; // Bonus to d20 attack rolls
    critChanceBonus: number; // Extra crit chance (e.g. 0.05 = +5%)
    range?: number; // Tactical grid distance (1 for melee, 2 for spears/halberds, 5-8 for ranged)
    flavorQuote: string;
    specialPerk?: string;
}

export interface ShieldItem {
    id: string;
    name: string;
    type: 'buckler' | 'round' | 'kite' | 'tower' | 'heater' | 'pavise' | 'dragon';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    icon: string;
    cost: number;
    description: string;
    blockBonus: number; // Bonus to defense / block roll (+d20 defense)
    damageReduction: number; // Flat reduction on damage taken
    hpBonus: number; // Extra health given to player
    parryCounterChance: number; // Chance to completely deflect and counter
    flavorQuote: string;
    specialPerk?: string;
}

export interface ArmorItem {
    id: string;
    name: string;
    type: 'cloth' | 'leather' | 'chainmail' | 'scale' | 'plate';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    icon: string;
    cost: number;
    description: string;
    armorModifier: number; // The armor modifier used in jousting and combat formulas (default 1)
    hpBonus: number;
    flavorQuote: string;
    specialPerk?: string;
}

export interface OpponentData {
    id: string;
    name: string;
    title: string;
    avatar: string;
    gender?: CharacterGender;
    quote?: string;
    type: 'contender' | 'champion';
    rank: number; // 1..8 for contenders, 3, 2, 1 for champions
    difficulty: 'easy' | 'normal' | 'hard' | 'expert' | 'master';
    flavorQuote: string;
    description: string;
    hp: number;
    armor: number;
    powerPoints: number;
    // Brawl Stats
    baseHp: number;
    strength: number;
    agility: number;
    rewards: {
        gold: number;
        powerPoints: number;
        reputation: number;
        xp?: number;
    };
    isDefeated?: boolean;
}

export type CombatZone = 'head' | 'torso' | 'legs';

export type FencingStance = 'sword_shield' | 'sword_only';

export interface BrawlRoundLog {
    roundNumber: number;
    playerAttackZone: CombatZone;
    playerDefenseZone: CombatZone;
    oppAttackZone: CombatZone;
    oppDefenseZone: CombatZone;
    playerD20: number;
    playerHitModifier?: number;
    playerTotal: number;
    oppDefenseD20: number;
    oppDefTotal: number;
    playerHit: boolean;
    playerDamage: number;
    playerBlocked: boolean;
    playerHeadHit: boolean;
    oppD20: number;
    oppHitModifier?: number;
    oppTotal: number;
    playerDefenseD20: number;
    playerDefTotal: number;
    oppHit: boolean;
    oppDamage: number;
    oppBlocked: boolean;
    oppHeadHit: boolean;
    text: string;
    // Fencing specific properties
    playerStance?: FencingStance;
    oppStance?: FencingStance;
    isShieldBlock?: boolean;
    isParryHalfDamage?: boolean;
}

export interface PlayerRpgStats {
    gender?: CharacterGender;
    level: number;
    xp: number;
    xpToNextLevel: number;
    statPoints: number;
    baseHp: number;
    currentHp?: number;
    strength: number;
    agility: number;
    equippedWeapon?: string; // melee / primary weapon id
    equippedRangedWeapon?: string; // ranged weapon id (bow, crossbow, sling)
    equippedShield?: string; // shield id
    equippedArmor?: string; // armor id
    inventoryWeapons?: string[]; // array of owned weapon ids
    inventoryShields?: string[]; // array of owned shield ids
    inventoryArmors?: string[]; // array of owned armor ids
    armorModifier?: number; // armor modifier (defaults to 1)
    horseRidingSkill?: number; // riding skill / modifier
    totalBowShots?: number; // Total shots fired with a bow
    totalRangedShots?: number; // Total shots fired with any ranged weapon
    bowProficiency?: number; // Bow mastery level (+1 every 60 bow shots)
    rangedShootingMod?: number; // Ranged modifier (+1 every 60 ranged shots)
    regenPoints?: number; // Food regeneration points (for sleeping)
    maxSpellPoints?: number; // Maximum spell/skill points
    currentSpellPoints?: number; // Current spell/skill points (restored on level up & rest)
}

export type TavernActivityType = 
    | 'rpg_cards'
    | 'classic_durak_36'
    | 'classic_durak_52'
    | 'classic_durak_54'
    | 'classic_durak_56'
    | 'classic_durak_minor_tarot'
    | 'classic_durak_tarot'
    | 'durak_52_2trumps'
    | 'durak_52_2trumps_plus1trump'
    | 'durak_52_2trumps_plus2trumps'
    | 'durak_52_2trumps_plus2suits'
    | 'durak_52_2trumps_plus1suit'
    | 'durak_52_3trumps'
    | 'durak_52_4trumps'
    | 'durak_104_2trumps'
    | 'french_tarot'
    | 'blackjack'
    | 'blackjack_dice'
    | 'steeplechase'
    | 'flat_horse_race'
    | 'mounted_archery'
    | 'dice_poker'
    | 'tavern_dice'
    | 'checkers'
    | 'senet'
    | 'ur'
    | 'mehen'
    | 'aseb'
    | 'chess_standard'
    | 'shatranj'
    | 'chaturanga'
    | 'chaturaji'
    | 'tamerlane'
    | 'courier'
    | 'capablanca'
    | 'carrera'
    | 'grasshopper'
    | 'cheskers'
    | 'archchess'
    | 'archcourier'
    | 'senterej'
    | 'al_adli'
    | 'sittuyin'
    | 'makruk'
    | 'shatar'
    | 'xiangqi'
    | 'janggi'
    | 'heian_shogi'
    | 'sho_shogi'
    | 'shogi'
    | 'napoleonic'
    | 'fide_napoleonic'
    | 'napoleon_ottomans'
    | 'bachelor'
    | 'coin_flip'
    | 'd20_dice'
    | 'potion_roulette'
    | 'dice_duel'
    | 'dice_duel_tournament'
    | 'brawl'
    | 'fencing_sword_shield'
    | 'fencing_sword_only'
    | 'archery'
    | 'jousting'
    | 'toy_soldiers'
    | 'toy_checkers'
    | 'toy_checkers_10x10'
    | 'toy_checkers_12x12'
    | 'toy_checkers_classic'
    | 'toy_pawns'
    | 'toy_pawns_10x10'
    | 'toy_pawns_12x12'
    | 'wizard_battle'
    | 'wizard_tournament'
    | 'magic_pawns'
    | 'magic_pawns_10x10'
    | 'magic_pawns_12x12'
    | 'battle_pawns_6x12'
    | 'army_battle'
    | 'checkers_war'
    | 'aranian_checkers_war'
    | 'military_checkers'
    | 'aranian_military_checkers'
    | 'tavern_labyrinth'
    | 'tavern_treasure_hunter'
    | 'fantasy_adventure';

export interface ToySoldier {
    id: string;
    name: string;
    avatar: string;
    gender?: CharacterGender;
    level: number; // 0 (base), 1 (+1 atk), 2 (+1 def), 3 (+1 maxHp -> 4), 4 (ready for decompression into companion)
    experience: number; // +1 per winning match where soldier survived. Every 10 XP = +1 Level
    deaths: number; // times defeated in battle. If >= 3 (pawns/checkers) or >= 4 (soldiers), soldier breaks/shatters ("розвалюється")
    maxHp: number; // base 3, lvl 3+ is 4
    hp?: number; // current HP (for magic pawns, persists after combat)
    type?: string;
    description?: string;
    price?: number;
    cost?: number;
    repairsCount?: number; // times repaired (max 1 lifetime repair per figurine!)
    // Checkers Squad fields
    isCheckersSquad?: boolean;
    isMilitarySquad?: boolean; // 120 soldiers coin battle checkers squad
    soldiersCount?: number; // count of living soldier checkers in squad (starts at 12 or 120)
    maxSoldiers?: number; // capacity (12 or 120)
    soldierHps?: number[]; // array of current HP values for each living soldier in squad
    soldierMaxHp?: number; // max HP per soldier (3 at lvl 0, 4 at lvl 1, 5 at lvl 3, 6 at lvl 4)
}

export interface ArmySquad {
    id: string;
    name: string;
    avatar: string;
    soldiersCount: number; // 1..5 living soldiers in the squad (starts at 5)
    maxSoldiers: number; // always 5
    level: number; // 0..4 (every 10 XP = +1 level, max 4 for decompression)
    experience: number; // XP gained from surviving battles & winning
    deaths: number; // times defeated (wiped out)
    type: 'піхота' | 'стрільці' | 'щитоносці' | 'лицарі' | 'маги' | 'вершники';
    description?: string;
    cost: number;
    repairsCount?: number;
}

export interface TavernData {
    id: string;
    name: string;
    sign: string;
    description: string;
    keeperName: string;
    atmosphere: string;
    settlementType?: 'city' | 'village' | 'hamlet' | 'castle' | 'ruins' | 'graveyard';
    tierLevel?: number;
    contenders?: OpponentData[]; // RPG Card contenders
    champions?: OpponentData[]; // RPG Card champions
    classicDurakContenders?: OpponentData[]; // Classic 36 card contenders
    classicDurakChampions?: OpponentData[]; // Classic 36 card champions
    extendedDurakContenders?: OpponentData[]; // Extended 52 card contenders
    extendedDurakChampions?: OpponentData[]; // Extended 52 card champions
    dicePokerContenders?: OpponentData[]; // Dice poker contenders
    dicePokerChampions?: OpponentData[]; // Dice poker champions
    tavernDiceContenders?: OpponentData[]; // Simple dice contenders
    tavernDiceChampions?: OpponentData[]; // Simple dice champions
    toySoldiersContenders?: OpponentData[]; // Toy soldiers contenders
    toySoldiersChampions?: OpponentData[]; // Toy soldiers champions
    checkersContenders?: OpponentData[]; // Checkers contenders
    checkersChampions?: OpponentData[]; // Checkers champions
    senetContenders?: OpponentData[]; // Senet contenders
    senetChampions?: OpponentData[]; // Senet champions
    urContenders?: OpponentData[]; // Royal Game of Ur contenders
    urChampions?: OpponentData[]; // Royal Game of Ur champions
    mehenContenders?: OpponentData[]; // Mehen serpent contenders
    mehenChampions?: OpponentData[]; // Mehen serpent champions
    asebContenders?: OpponentData[]; // Aseb 20 squares contenders
    asebChampions?: OpponentData[]; // Aseb 20 squares champions
    chessStandardContenders?: OpponentData[]; // Standard chess contenders
    chessStandardChampions?: OpponentData[]; // Standard chess champions
    shatranjContenders?: OpponentData[]; // Shatranj contenders
    shatranjChampions?: OpponentData[]; // Shatranj champions
    chaturangaContenders?: OpponentData[]; // Chaturanga contenders
    chaturangaChampions?: OpponentData[]; // Chaturanga champions
    chaturajiContenders?: OpponentData[]; // Chaturaji contenders
    chaturajiChampions?: OpponentData[]; // Chaturaji champions
    tamerlaneContenders?: OpponentData[]; // Tamerlane chess contenders
    tamerlaneChampions?: OpponentData[]; // Tamerlane chess champions
    courierContenders?: OpponentData[]; // Courier chess contenders
    courierChampions?: OpponentData[]; // Courier chess champions
    capablancaContenders?: OpponentData[]; // Capablanca chess contenders
    capablancaChampions?: OpponentData[]; // Capablanca chess champions
    carreraContenders?: OpponentData[]; // Carrera chess contenders
    carreraChampions?: OpponentData[]; // Carrera chess champions
    grasshopperContenders?: OpponentData[]; // Grasshopper chess contenders
    grasshopperChampions?: OpponentData[]; // Grasshopper chess champions
    brawlers?: OpponentData[]; // Fist brawlers
    brawlChampions?: OpponentData[]; // Fist champions
    fencingSwordShieldContenders?: OpponentData[]; // Fencing sword & shield contenders
    fencingSwordShieldChampions?: OpponentData[]; // Fencing sword & shield champions
    fencingSwordOnlyContenders?: OpponentData[]; // Fencing sword only contenders
    fencingSwordOnlyChampions?: OpponentData[]; // Fencing sword only champions
    fencingContenders?: OpponentData[]; // Legacy fallback
    fencingChampions?: OpponentData[]; // Legacy fallback
    archeryContenders?: OpponentData[]; // Archery competition contenders
    archeryChampions?: OpponentData[]; // Archery competition champions
    joustingContenders?: OpponentData[]; // Jousting contenders
    joustingChampions?: OpponentData[]; // Jousting champions
    armyBattleContenders?: OpponentData[]; // Army battle contenders
    armyBattleChampions?: OpponentData[]; // Army battle champions
    checkersWarContenders?: OpponentData[]; // Checkers war contenders
    checkersWarChampions?: OpponentData[]; // Checkers war champions
}

export interface SettlementData {
    id: string;
    name: string;
    type: SettlementType;
    region: string;
    x: number; // percentage 0..100 on map
    y: number; // percentage 0..100 on map
    description: string;
    taverns: TavernData[]; // 4 for city, 2 for village, 1 for hamlet
}

export interface WorldPlayerPosition {
    x: number;
    y: number;
    targetX?: number;
    targetY?: number;
    isMoving?: boolean;
}

export type CompanionAbilityType = 'damage_single' | 'damage_aoe' | 'summon' | 'raise_undead' | 'buff_player' | 'trap' | 'damage_multi' | 'heal_player' | 'heal';

export interface CompanionClassDef {
    id: string;
    name: string;
    description: string;
    abilityName: string;
    abilityDescription: string;
    abilityType: CompanionAbilityType;
    abilityPower: number;
    hitCount?: number;
    summonTemplate?: Partial<OpponentData>;
}

export interface HiredCompanion extends OpponentData {
    companionClassId: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    maxAbilityCharges: number;
    currentAbilityCharges: number;
    survivalProbability: number;
    isDead: boolean;
    isSummon?: boolean;
    equippedWeapon?: string; // melee / primary weapon id
    equippedRangedWeapon?: string; // ranged weapon id (bow, crossbow, sling)
    isGuardingCaravan?: boolean; // currently assigned to escort a trade caravan
    currentCaravanId?: string; // ID of the caravan being escorted
    restingInTavernSettlementId?: string; // Settlement where the companion is resting after caravan return
    guardRewardEarned?: number; // Gold earned on caravan mission
}

export interface TradeCaravanGuard {
    id: string;
    name: string;
    avatar: string;
    title: string;
    gender?: CharacterGender;
    companionId?: string;
    isPlayerCompanion?: boolean;
    hp: number;
    maxHp: number;
    armor: number;
    strength: number;
    rewardGold: number;
    rewardXp: number;
}

export interface TradeCaravanCargo {
    categoryId: string;
    categoryName: string;
    goodId: string;
    goodName: string;
    icon: string;
    units: number;
    unitName: string;
    investedGold: number;
    buyPrice: number;
    targetSellPrice: number;
    isPlayerGood?: boolean;
}

export interface CaravanCombatState {
    opponentSquadName: string;
    opponentType: 'bandits' | 'monsters' | 'cultists' | 'raiders';
    opponentIcon: string;
    opponentHp: number;
    opponentMaxHp: number;
    opponentArmor: number;
    opponentStrength: number;
    caravanHp: number;
    caravanMaxHp: number;
    round: number;
    combatLogs: string[];
    isResolved: boolean;
    isGuardsVictorious?: boolean;
}

export interface TradeCaravan {
    id: string;
    name: string;
    originCityId: string;
    originCityName: string;
    originPos: { x: number; y: number };
    destinationCityId: string;
    destinationCityName: string;
    destinationPos: { x: number; y: number };
    currentPos: { x: number; y: number };
    goods: TradeCaravanCargo[];
    status: 'traveling_to_destination' | 'trading_at_destination' | 'returning_to_origin' | 'in_combat' | 'completed' | 'plundered';
    progress: number; // 0 to 1 along current leg
    phase: 'outbound' | 'inbound';
    guards: TradeCaravanGuard[];
    caravanHp: number;
    maxCaravanHp: number;
    combatState?: CaravanCombatState | null;
    combatHistoryLogs: string[];
    totalInvestedGold: number;
    totalExpectedProfit: number;
    playerPayoutGold: number;
    playerPayoutXp: number;
    isPlayerCaravan: boolean;
    speed: number;
    createdTimestamp: number;
}

export interface WorldProgress {
    defeatedOpponentIds: string[]; // Legacy / RPG Card opponents defeated
    defeatedBrawlOpponentIds?: string[]; // Brawl opponents defeated
    defeatedActivityOpponents?: Partial<Record<TavernActivityType, string[]>>; // Defeated opponents by activity
    opponentVictories?: Record<string, number>; // Wins count by `${activityType}:${opponentId}` (after 3 wins, opponent retires to NPC)
    conqueredTavernIds: string[]; // Taverns conquered in RPG cards
    brawlConqueredTavernIds?: string[]; // Taverns conquered in fist fights
    conqueredActivityTaverns?: Partial<Record<TavernActivityType, string[]>>; // Conquered taverns by activity
    visitedSettlementIds: string[];
    playerGold: number;
    playerReputation: number;
    playerPosition: WorldPlayerPosition;
    playerStats: PlayerRpgStats;
    statsVersion?: number;
    cardPieces?: number; // Pieces of cards collected from tearing eternal discard
    craftedCardsCount?: Record<string, Record<string, number>>; // Tracking crafting limits per settlement: { settlementId: { "Rank:Suit": count } }
    playerRpgCards?: Card[]; // Persistent collection of cards the player owns for the RPG duels
    playerRpgDeck?: Card[]; // Persistent selected active deck of cards for the RPG duels
    opponentSpellShops?: Record<string, ShopStock>; // Persistent spell shop stock per opponent: { [opponentId]: ShopStock }
    shopRefreshTokens?: number; // Tokens to refresh an opponent's spell shop stock (won 1x on 1st victory per opponent)
    rpgShopTokensAwardedOpponentIds?: string[]; // Opponents for which the 1st victory shop refresh token was awarded
    npcRelationships?: Record<string, number>; // Relationship attitude scores with NPCs (0-100)
    hiredNpcIds?: string[]; // IDs of NPCs hired into the squad
    hiredNpcs?: HiredCompanion[]; // Full stats and details of hired NPCs
    toySoldiers?: ToySoldier[]; // Player's collection of toy soldiers for the 15x15 tactical game
    toyRepairParts?: number; // Repair parts collected from recycling worn figurines (8 parts = 1 full repair of any figurine)
    armySquads?: ArmySquad[]; // Player's army squads for Grand Army Battles (16 squads needed for battle, 5 soldiers each)
    guildInvestments?: any[]; // Active investments & commodity holdings in city merchant guilds
    guildReputation?: number; // Guild reputation points (levels up rank from Apprentice to Grand Magnate)
    guildTotalProfit?: number; // Total gold profits earned from trade and dividends
    tradeTurnSeed?: number; // Global step seed for market trends and caravan progress
    activeCaravans?: TradeCaravan[]; // Roaming trade caravans on the world map
    completedCaravansHistory?: TradeCaravan[]; // Log of completed caravans
    activeQuests?: Quest[]; // Quests accepted and being tracked by the player
    completedQuestIds?: string[]; // IDs of completed and rewarded quests
    availableNpcQuests?: Quest[]; // Quests generated and currently available from NPCs
    trackedQuestId?: string; // ID of the currently focused quest
    trackedObjectiveId?: string; // ID of the specific active objective tracked on world map
    blankCardsCount?: number; // Blank cards crafted from discarded cards (4 discarded = 1 blank card)
    unmergedDiscardCount?: number; // Counter of discarded cards awaiting merger
    customHeroCards?: CustomHeroCard[]; // Player's created Hero Cards
}

export type QuestType = 
    | 'monster_hunt'      // Полювання на загін монстрів
    | 'delivery'          // Доставка вантажу чи листа до іншого поселення
    | 'duel_champion'     // Перемога над суперником/чемпіоном у таверні
    | 'visit_settlement'  // Розвідка поселення, руїн чи кургану
    | 'collect_resources' // Збір ресурсів чи уламків карт
    | 'minigame_win'      // Перемога в тавернських іграх
    | 'custom';           // Авторський квест, створений вручну

export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'heroic';

export interface QuestReward {
    gold: number;
    xp: number;
    reputation: number;
    cardPieces?: number;
    itemRewardName?: string;
    itemRewardIcon?: string;
}

export type QuestObjectiveType = 
    | 'kill_monster'         // Здолати загін монстрів (певного типу або будь-яких)
    | 'visit_settlement'     // Дістатися до поселення, руїн або замку
    | 'win_duel'             // Перемогти суперника в карти / бій
    | 'win_minigame'         // Виграти в конкретну або будь-яку гру
    | 'collect_card_pieces'  // Зібрати певну кількість уламків карт
    | 'deliver_cargo'        // Доставити депешу або припаси до місця
    | 'talk_to_npc'          // Поговорити з НПЦ в таверні
    | 'custom';              // Довільна ціль

export interface QuestObjective {
    id: string;
    text: string;                             // Опис завдання для гравця
    type: QuestObjectiveType;
    currentCount: number;
    requiredCount: number;
    isCompleted: boolean;
    isOptional?: boolean;                     // Додаткова ціль (не обов'язкова для здачі квесту)
    bonusReward?: Partial<QuestReward>;       // Окремий бонус за виконання додаткової цілі
    targetCoords?: { x: number; y: number };  // Координати точки на світовій мапі
    targetSettlementId?: string;
    targetSettlementName?: string;
    targetMonsterName?: string;
    targetMonsterCategory?: string;
    targetOpponentId?: string;
    targetOpponentName?: string;
    targetActivityType?: TavernActivityType;
}

export interface QuestTarget {
    settlementId?: string;
    settlementName?: string;
    tavernId?: string;
    tavernName?: string;
    monsterSquadId?: string;
    monsterCategory?: string;
    monsterName?: string;
    opponentId?: string;
    opponentName?: string;
    activityType?: TavernActivityType;
    activityName?: string;
    targetCoords?: { x: number; y: number };
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    type: QuestType;
    difficulty: QuestDifficulty;
    giverName: string;
    giverTitle: string;
    giverAvatar: string;
    giverLocationName: string;
    giverSettlementId?: string;
    objectives: QuestObjective[];              // Система детальних цілей квесту
    target: QuestTarget;                       // Основна ціль (для швидкого доступу та зворотної сумісності)
    requiredCount: number;
    currentCount: number;
    reward: QuestReward;
    status: 'available' | 'active' | 'completed' | 'reward_claimed';
    isCustom?: boolean;
    createdAt: number;
    trackedObjectiveId?: string;               // Обрана ціль для відстеження на мапі
}

export interface ManualObjectiveInput {
    id?: string;
    text: string;
    type?: QuestObjectiveType;
    requiredCount?: number;
    isOptional?: boolean;
    targetSettlementId?: string;
    targetMonsterName?: string;
    targetActivityType?: TavernActivityType;
    bonusGold?: number;
    bonusXp?: number;
}

export interface ManualQuestInput {
    title: string;
    description: string;
    type?: QuestType;
    difficulty?: QuestDifficulty;
    giverName?: string;
    giverTitle?: string;
    giverAvatar?: string;
    giverLocationName?: string;
    targetSettlementId?: string;
    targetSettlementName?: string;
    targetMonsterName?: string;
    targetActivityName?: string;
    requiredCount?: number;
    goldReward?: number;
    xpReward?: number;
    reputationReward?: number;
    cardPiecesReward?: number;
    itemRewardName?: string;
    objectives?: ManualObjectiveInput[];
}

export interface ActiveDuelContext {
    settlementId: string;
    settlementName: string;
    tavernId: string;
    tavernName: string;
    opponent: OpponentData;
    activityType?: TavernActivityType;
}


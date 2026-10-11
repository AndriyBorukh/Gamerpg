import { motion } from 'motion/react';
import { Card } from '../types';

// Medieval high-fantasy pixel-art character artworks matching the requested style
import knightArt from '../assets/images/pixel_knight_art_1788209852025.jpg';
import deathKnightArt from '../assets/images/pixel_death_knight_1788209864646.jpg';
import wizardArt from '../assets/images/pixel_wizard_art_1788209875218.jpg';
import cardBackImg from '../assets/images/card_back_medieval_1787956785602.jpg';
import kingArt from '../assets/images/pixel_king_art_1788209885525.jpg';
import queenArt from '../assets/images/pixel_queen_art_1788209897960.jpg';
import jackArt from '../assets/images/pixel_jack_art_1788209909193.jpg';
import aceArt from '../assets/images/pixel_ace_art_1788209920589.jpg';
import jokerArt from '../assets/images/pixel_joker_art_1788209933852.jpg';
import necromancerArt from '../assets/images/pixel_necromancer_1788209947583.jpg';
import shamanDruidArt from '../assets/images/pixel_shaman_druid_1788209959706.jpg';
import merchantArt from '../assets/images/pixel_merchant_1788209970941.jpg';
import castleDefenseArt from '../assets/images/pixel_castle_defense_1788209982745.jpg';
import rangerArcherArt from '../assets/images/pixel_ranger_archer_1788209997668.jpg';
import assassinThiefArt from '../assets/images/pixel_assassin_thief_1788210010307.jpg';
import barbarianWarriorArt from '../assets/images/pixel_barbarian_warrior_1788210020025.jpg';
import clericHealerArt from '../assets/images/pixel_cleric_healer_1788210033427.jpg';
import commanderLeaderArt from '../assets/images/pixel_commander_leader_1788210046612.jpg';
import elixirArt from '../assets/images/pixel_elixir_art_1788210057884.jpg';
import goldMineArt from '../assets/images/gold_mine_art_1789462481835.jpg';
import silverMineArt from '../assets/images/silver_mine_art_1789462494504.jpg';
import archerEightArt from '../assets/images/pixel_archer_eight_1791239688206.jpg';
import halberdSevenArt from '../assets/images/pixel_halberd_seven_1791239704260.jpg';
import footmanSixArt from '../assets/images/pixel_footman_six_1791239675642.jpg';
import crossbowFiveArt from '../assets/images/pixel_crossbow_five_1791239717802.jpg';
import scoutFourArt from '../assets/images/pixel_scout_four_1791239731417.jpg';
import guardThreeArt from '../assets/images/pixel_guard_three_1791239742834.jpg';
import militiaTwoArt from '../assets/images/pixel_militia_two_1791239761957.jpg';
import warDogArt from '../assets/images/war_dog_art_1791240102725.jpg';
import shieldArt from '../assets/images/medieval_shield_art_1791240275438.jpg';
import golemArt from '../assets/images/stone_golem_art_1791279469852.jpg';
import pirateShipArt from '../assets/images/pirate_ship_art_1791298146717.jpg';

interface CardViewProps {
    card?: Card;
    hidden?: boolean;
    onClick?: () => void;
    layoutId?: string;
    className?: string;
}

// Ornate Heraldic Sun Sigil matching the reference card image
const SunSigil = ({ className = "w-4 h-4 text-amber-700/80" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <circle cx="50" cy="45" r="16" fill="currentColor" fillOpacity="0.85" />
        <circle cx="50" cy="45" r="20" fill="none" stroke="currentColor" strokeWidth="2.5" />
        {/* Sun rays */}
        <path d="M50 15 L50 21 M50 69 L50 75 M20 45 L26 45 M74 45 L80 45 M29 24 L33 28 M67 62 L71 66 M29 66 L33 62 M67 28 L71 24" 
              stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 7 L50 15 M50 75 L50 83 M12 45 L20 45 M80 45 L88 45 M23 18 L29 24 M71 66 L77 72 M23 72 L29 66 M71 24 L77 18" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Heraldic Base Cross */}
        <path d="M47 80 L53 80 L52 94 L58 98 L42 98 L48 94 Z" fill="currentColor" />
    </svg>
);

// Ornate Corner Filigree Bracket for authentic medieval parchment borders
const CornerFiligree = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const transform = {
        tl: '',
        tr: 'scale-x-[-1]',
        bl: 'scale-y-[-1]',
        br: 'scale-[-1]'
    }[position];

    return (
        <svg viewBox="0 0 40 40" className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800/60 pointer-events-none ${transform}`} fill="none" stroke="currentColor">
            <path d="M 4 36 L 4 10 C 4 6 6 4 10 4 L 36 4" strokeWidth="1.5" />
            <path d="M 8 36 L 8 14 C 8 10 10 8 14 8 L 36 8" strokeWidth="0.8" strokeDasharray="2 1" />
            <path d="M 4 4 L 14 14 M 4 12 Q 12 12 12 4 M 14 8 Q 18 18 8 14" strokeWidth="0.75" />
            <circle cx="11" cy="11" r="1.5" fill="currentColor" />
        </svg>
    );
};

export const CardView = ({ card, hidden, onClick, layoutId, className = '' }: CardViewProps) => {
    if (hidden || !card) {
        return (
            <motion.div 
                layoutId={layoutId}
                onClick={onClick}
                className={`w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-xl border-[1.5px] border-[#9c783e] shadow-xl flex items-center justify-center relative select-none overflow-hidden bg-[#181a29] ${className}`}
            >
                <img 
                    src={cardBackImg} 
                    alt="Card Back" 
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute inset-1 border border-[#d4af37]/60 rounded-lg pointer-events-none" />
            </motion.div>
        );
    }

    const getSuitColorClass = (suit: string, rank?: string) => {
        if (rank === 'Red Joker') return 'text-[#8b1d1d]';
        if (rank === 'Black Joker') return 'text-[#1c1917]';
        if (rank === 'White Joker') return 'text-[#f8fafc]';
        if (rank === 'Gold Joker') return 'text-[#d97706]';
        if (rank === 'DTH (Смерть)') return 'text-[#1c1917] font-extrabold';
        if (rank === 'DK (Лицар смерті)') return 'text-[#3b124d] font-black';
        if (rank === 'SK (Скелет)') return 'text-[#44403c] font-bold';
        if (rank === 'NC (Некромант)') return 'text-[#4c1d95] font-bold';
        if (rank === 'ZB (Зомбі)') return 'text-[#14532d] font-bold';
        if (rank === 'MR (Торговець)') return 'text-[#92400e] font-bold';
        if (rank === 'GL (Золото)') return 'text-[#b45309] font-black';
        if (rank === 'SL (Срібло)') return 'text-[#475569] font-bold';
        if (rank === 'HR (Герой)') return 'text-[#b45309] font-black';
        if (rank === 'WL (Чаклун)') return 'text-[#3730a3] font-bold';
        if (rank === 'SP (Закляття)') return 'text-[#0e7490] font-semibold';
        if (rank === 'MG (Маг)') return 'text-[#1d4ed8] font-bold';
        if (rank === 'KN (Знання)') return 'text-[#854d0e] font-medium';
        if (rank === 'WZ (Чарівник)') return 'text-[#86198f] font-bold';
        if (rank === 'IL (Ілюзіоніст)') return 'text-[#be185d] font-bold';
        if (rank === 'ILL (Ілюзія)') return 'text-[#7e22ce] font-bold';
        if (rank === 'BR (Варвар)') return 'text-[#991b1b] font-black';
        if (rank === 'RG (Злість)') return 'text-[#be123c] font-black';
        if (rank === 'CL (Клірик)') return 'text-[#0369a1] font-bold';
        if (rank === 'RN (Ренджер)') return 'text-[#15803d] font-bold';
        if (rank === 'HN (Мисливець)') return 'text-[#3f6212] font-bold';
        if (rank === 'TP (Траппер)') return 'text-[#713f12] font-bold';
        if (rank === 'TR (Пастка)') return 'text-[#57534e] font-semibold';
        if (rank === 'LD (Лідер)') return 'text-[#1e3a8a] font-black';
        if (rank === 'CM (Командир)') return 'text-[#312e81] font-black';
        if (rank === 'GN (Полководець)') return 'text-[#7f1d1d] font-black';
        if (rank === 'M (Магістр)') return 'text-[#6b21a8]';
        if (rank === 'GM (Гросмейстер)') return 'text-[#92400e]';
        if (rank === 'SH (Шулер)') return 'text-[#047857]';
        if (rank === 'TH (Злодій)') return 'text-[#334155]';
        if (rank === 'SG (Мудрець)') return 'text-[#0284c7]';
        if (rank === 'MC (Найманець)') return 'text-[#991b1b]';
        if (rank === 'GB (Гравець)') return 'text-[#4338ca]';
        if (rank === 'PR (Священик)') return 'text-[#854d0e]';
        if (rank === 'BP (Єпископ)') return 'text-[#6b21a8]';
        if (rank === 'AB (Архієпископ)') return 'text-[#b45309] font-extrabold';
        if (rank === 'PL (Паладин)') return 'text-[#b45309] font-extrabold';
        if (rank === 'AL (Алхімік)') return 'text-[#0f766e]';
        if (rank === 'HM (Псар)') return 'text-[#78350f]';
        if (rank === 'DG (Собака)') return 'text-[#57534e]';
        if (suit === '🎴') return 'text-[#581c87]';
        switch (suit) {
            case '♥':
            case '♦':
                return 'text-[#991b1b]';
            case '♠':
            case '♣':
                return 'text-[#1c1917]';
            case '★':
                return 'text-[#b45309]';
            case '☾':
                return 'text-[#312e81]';
            case '🍁':
                return 'text-[#15803d]';
            case '⚡':
                return 'text-[#d97706]';
            case '💧':
                return 'text-[#0284c7]';
            case '🌸':
                return 'text-[#db2777]';
            case '🔮': case '🛡️': case '⚔️': case '🗝️':
                return 'text-[#6b21a8]';
            case '📜': case '🧭': case '⏳': case '⚖️':
                return 'text-[#854d0e]';
            case '👑':
                return 'text-[#b45309] font-extrabold';
            case '💎': case '🔥': case '🌊':
                return 'text-[#1d4ed8]';
            case '🌪️': case '🌱': case '🪐': case '🌌':
                return 'text-[#0f766e]';
            case '🧪':
                return 'text-[#0d9488]';
            case '🐕':
                return 'text-[#78350f]';
            default:
                return 'text-[#1c1917]';
        }
    };

    const colorClass = getSuitColorClass(card.suit, card.rank);
    const displaySuit = card.suit === 'Joker' ? '🃏' : ((card.suit as string) === '💀' ? '☠️' : card.suit);
    const isTarot = card.suit === '🎴';
    
    let displayRank = card.rank === 'Black Joker' || card.rank === 'Red Joker' || card.rank === 'White Joker' || card.rank === 'Gold Joker' ? 'JK' : (isTarot ? card.rank.split(' ')[0] : card.rank);
    if (card.isMagister) displayRank = 'M';
    if (card.isGrandmaster) displayRank = 'GM';
    if (card.isSharper) displayRank = 'SH';
    if (card.isThief) displayRank = 'TH';
    if (card.isSage) displayRank = 'SG';
    if (card.isMercenary) displayRank = 'MC';
    if (card.isGambler) displayRank = 'GB';
    if (card.isPriest) displayRank = 'PR';
    if (card.isBishop) displayRank = 'BP';
    if (card.isArchbishop) displayRank = 'AB';
    if (card.isPaladin) displayRank = 'PL';
    if (card.isAlchemist) displayRank = 'AL';
    if (card.isHuntsman) displayRank = 'HM';
    if (card.isDog) displayRank = '🐕';
    if (card.isDeathKnight) displayRank = 'DK';
    if (card.isSkeleton) displayRank = 'SK';
    if (card.isNecromancer) displayRank = 'NC';
    if (card.isZombie) displayRank = 'ZB';
    if (card.isDeathCard) displayRank = '☠️';
    if (card.isMerchant) displayRank = 'MR';
    if (card.isHero) displayRank = 'HR';
    if (card.isWarlock) displayRank = 'WL';
    if (card.isSpell) displayRank = 'SP';
    if (card.isMage) displayRank = 'MG';
    if (card.isKnowledge) displayRank = 'KN';
    if (card.isWizard) displayRank = 'WZ';
    if (card.isIllusionist) displayRank = 'IL';
    if (card.isIllusion && card.rank === 'ILL (Ілюзія)') displayRank = 'ILL';
    if (card.isBarbarian) displayRank = 'BR';
    if (card.isRage) displayRank = 'RG';
    if (card.isCleric) displayRank = 'CL';
    if (card.isRanger) displayRank = 'RN';
    if (card.isHunter) displayRank = 'HN';
    if (card.isTrapper) displayRank = 'TP';
    if (card.isTrap) displayRank = 'TR';
    if (card.isLeader) displayRank = 'LD';
    if (card.isCommander) displayRank = 'CM';
    if (card.isGeneral) displayRank = 'GN';
    if (card.isGold) displayRank = 'GL';
    if (card.isSilver) displayRank = 'SL';
    if (card.isChillTouch) displayRank = 'CT';
    if (card.isFingerOfDeath) displayRank = 'FD';
    if (card.isPowerWordKill) displayRank = 'PW';
    if (card.isAnnihilation) displayRank = 'AN';
    if (card.isMeteorSwarm) displayRank = 'MET';
    if (card.isManaShield) displayRank = 'MSH';
    if (card.isChainLightning) displayRank = 'LGT';
    if (card.isMassDeath) displayRank = 'MSD';
    if (card.isDeathRay) displayRank = 'DRY';
    if (card.isMindHeist) displayRank = 'MHS';
    if (card.isConversion) displayRank = 'CNV';
    if (card.isHolyCathedral) displayRank = 'CAT';
    if (card.isNorthernWind) displayRank = 'NW';
    if (card.isDrakkar) displayRank = 'DRK';
    if (card.isDraugr) displayRank = 'DRG';
    if (card.isViking) displayRank = 'VK';
    if (card.isHorde || card.isHordeCard) displayRank = 'HRD';
    if (card.isHordeling) displayRank = 'HL';
    if (card.isUndeadLord) displayRank = 'ULD';
    if (card.isZombiePlague) displayRank = 'ZPL';
    if (card.isTurnToSkeletons) displayRank = 'TSK';
    if (card.isPirateRaid) displayRank = 'PRD';
    if (card.isPirateShip) displayRank = 'PSH';
    if (card.isPirateCrew) displayRank = 'PCR';
    if (card.isGhost) displayRank = `👻${card.rank}`;
    if (card.isTycoon) displayRank = 'MGN';
    if (card.isPirate) displayRank = 'PRT';
    if (card.isTreasure) displayRank = 'TRSR';
    if (card.isHealthElixir) displayRank = 'ELX';
    if (card.isRobber) displayRank = 'RBR';
    if (card.isBurglar) displayRank = 'BRG';
    if (card.isDoctor) displayRank = 'DOC';
    if (card.isWitchDoctor) displayRank = 'WDC';
    if (card.isDruid) displayRank = 'DRD';
    if (card.isShaman) displayRank = 'SHM';
    if (card.isWolf) displayRank = 'WLF';
    if (card.isBear) displayRank = 'BR';
    if (card.isWolfSpirit) displayRank = 'WSP';
    if (card.isBearSpirit) displayRank = 'BSP';
    if (card.isWarriorSpirit) displayRank = 'WR';
    if (card.isWall) displayRank = 'WAL';
    if (card.isTower) displayRank = 'TWR';
    if (card.isBastion) displayRank = 'BST';
    if (card.isCastle) displayRank = 'CST';
    if (card.isShield) displayRank = 'SHD';
    if (card.isExecutioner) displayRank = 'EXC';
    if (card.isAssassin) displayRank = 'ASN';
    if (card.isArcher) displayRank = 'ARC';
    if (card.isCrossbowman) displayRank = 'CRB';
    if (card.isUndeadLordSpell) displayRank = 'UL';
    if (card.isGrandKonungSpell) displayRank = 'GK';
    if (card.isGreatKhanSpell) displayRank = 'GK';
    if (card.isZombieApocalypseSpell) displayRank = 'ZA';
    if (card.isInvadersSpell) displayRank = 'INV';
    if (card.isStormOfSeasSpell) displayRank = 'SOS';
    if (card.isEinherjarSpell) displayRank = 'EIN';
    if (card.isHelArmySpell) displayRank = 'HEL';
    if (card.isBurnCardSpell) displayRank = 'BRN';
    if (card.isBurnHandSpell) displayRank = 'BRNH';
    if (card.isGoldMine) displayRank = 'GMN';
    if (card.isSilverMine) displayRank = 'SMN';
    if (card.isMiners) displayRank = 'MNR';

    // Human illustrations for noble cards or special RPG cards
    const isNoble = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'N', 'Q', 'K', 'A'].includes(card.rank) || 
        card.isCustomHeroCard ||
        card.isMagister || card.isGrandmaster || card.isSharper || card.isThief || card.isSage || card.isMercenary || 
        card.isGambler || card.isPriest || card.isBishop || card.isArchbishop || card.isPaladin || card.isAlchemist || 
        card.isHuntsman || card.isDog || card.isDeathKnight || card.isSkeleton || card.isNecromancer || card.isZombie || 
        card.isDeathCard || card.isMerchant || card.isHero || card.isWarlock || card.isSpell || card.isMage || 
        card.isKnowledge || card.isWizard || card.isIllusionist || card.isIllusion || card.isBarbarian || card.isRage || 
        card.isCleric || card.isRanger || card.isHunter || card.isTrapper || card.isTrap || card.isLeader || 
        card.isCommander || card.isGeneral || card.isGold || card.isSilver || card.isChillTouch || card.isFingerOfDeath ||
        card.isPowerWordKill || card.isAnnihilation || card.isGhost || card.isPrincess || card.isPrince || card.isKabbalist ||
        card.isGolem || card.isInventor || card.isAutomaton || card.isAnimatronic || card.isIllusionCopySpell || card.isImmortalitySpell ||
        card.isSummonGhostSpell || card.isSummonSkeletonsSpell || card.isSummonZombiesSpell || card.isEndTurnSpell ||
        card.isSummonGolemSpell || card.isSummonAnimatronicSpell || card.isSummonAutomatonSpell ||
        card.isTycoon || card.isPirate || card.isTreasure || card.isHealthElixir || card.isRobber || card.isBurglar ||
        card.isDoctor || card.isWitchDoctor || card.isDruid || card.isShaman || card.isWolf || card.isBear ||
        card.isWolfSpirit || card.isBearSpirit || card.isWarriorSpirit || card.isWall || card.isTower || card.isBastion ||
        card.isCastle || card.isShield || card.isExecutioner || card.isAssassin || card.isArcher || card.isCrossbowman ||
        card.isMassDeath || card.isDeathRay || card.isMindHeist || card.isConversion || card.isHolyCathedral ||
        card.isNorthernWind || card.isDrakkar || card.isViking || card.isHorde || card.isHordeCard || card.isHordeling ||
        card.isUndeadLord || card.isZombiePlague || card.isTurnToSkeletons || card.isPirateRaid || card.isPirateShip || card.isPirateCrew ||
        card.isUndeadLordSpell || card.isGrandKonungSpell || card.isGreatKhanSpell || card.isZombieApocalypseSpell || card.isInvadersSpell || 
        card.isStormOfSeasSpell || card.isEinherjarSpell || card.isHelArmySpell || card.isBurnCardSpell || card.isBurnHandSpell ||
        card.isGoldMine || card.isSilverMine || card.isMiners;

    // Check if card has full custom realistic character portrait art
    const getCustomArtwork = () => {
        if (card.isGoldMine) return goldMineArt;
        if (card.isSilverMine) return silverMineArt;
        if (card.isMiners) return goldMineArt;

        // High Ranking Special Characters
        if (card.isDeathKnight || card.isDeathCard) return deathKnightArt;
        if (card.isNecromancer || card.isSkeleton || card.isZombie || card.isDraugr) return necromancerArt;
        if (card.isWizard || card.isWarlock || card.isMage || card.isMagister || card.isKabbalist) return wizardArt;
        if (card.isShaman || card.isDruid || card.isWolfSpirit || card.isBearSpirit) return shamanDruidArt;
        if (card.isMerchant || card.isTycoon || card.isTreasure || card.isGold || card.isSharper || card.isGambler) return merchantArt;
        if (card.isShield || (card.suit === '🛡️' && card.rank === 'SHD (Щит)')) return shieldArt;
        if (card.isGolem || card.rank === 'GLM (Голем)') return golemArt;
        if (card.isWall || card.isTower || card.isBastion || card.isCastle || card.isAutomaton) return castleDefenseArt;
        if (card.isRanger || card.isHunter || card.isTrapper || card.isArcher || card.isCrossbowman || card.isHuntsman) return rangerArcherArt;
        if (card.isAssassin || card.isThief || card.isRobber || card.isBurglar || card.isExecutioner || card.isPirate) return assassinThiefArt;
        if (card.isPirateShip || card.rank === 'PRT_SHIP (Піратський корабель)') return pirateShipArt;
        if (card.isBarbarian || card.isRage || card.isMercenary || card.isWarriorSpirit || card.isHordeling) return barbarianWarriorArt;
        if (card.isHealthElixir) return elixirArt;
        if (card.isCleric || card.isPriest || card.isBishop || card.isArchbishop || card.isDoctor || card.isWitchDoctor) return clericHealerArt;
        if (card.isLeader || card.isCommander || card.isGeneral) return commanderLeaderArt;
        if (card.rank === 'Black Joker' || card.rank === 'Red Joker' || card.suit === 'Joker' || card.isIllusionist) return jokerArt;
        
        // Canine & Beast Characters
        if (card.isDog || card.suit === '🐕' || card.rank === 'DG (Собака)' || card.isWolf) return warDogArt;

        // Standard Face Cards & Court Ranks
        if (card.rank === 'K' || card.isPrince || card.isGrandmaster) return kingArt;
        if (card.rank === 'Q' || card.isPrincess) return queenArt;
        if (card.rank === 'J' || card.rank === 'N' || card.isPaladin || card.isHero) return knightArt;
        if (card.rank === 'A') return aceArt;
        if (card.rank === '10' || card.rank === '9') return jackArt;

        // Cards less than 9: authentic medieval pixel-art portraits
        const rankStr = String(card.rank);
        const rankNum = parseInt(rankStr, 10);
        const isNotSpecial = !card.isSpell && !card.isCustomHeroCard;
        if (rankStr === '8' || rankNum === 8 || (isNotSpecial && card.value === 8)) return archerEightArt;
        if (rankStr === '7' || rankNum === 7 || (isNotSpecial && card.value === 7)) return halberdSevenArt;
        if (rankStr === '6' || rankNum === 6 || (isNotSpecial && card.value === 6)) return footmanSixArt;
        if (rankStr === '5' || rankNum === 5 || (isNotSpecial && card.value === 5)) return crossbowFiveArt;
        if (rankStr === '4' || rankNum === 4 || (isNotSpecial && card.value === 4)) return scoutFourArt;
        if (rankStr === '3' || rankNum === 3 || (isNotSpecial && card.value === 3)) return guardThreeArt;
        if (rankStr === '2' || rankNum === 2 || (isNotSpecial && card.value === 2)) return militiaTwoArt;
        if (rankStr === '1' || rankNum === 1 || (isNotSpecial && card.value === 1)) return militiaTwoArt;
        if (rankStr === '0' || rankNum === 0 || (isNotSpecial && card.value === 0)) return militiaTwoArt;

        return null;
    };

    const customArtwork = getCustomArtwork();
    
    const getNoblePortraitData = (rank: string) => {
        if (card.isPrincess) {
            return {
                icon: '👸',
                label: 'Принцеса',
                bgGradient: 'from-pink-100 via-rose-50 to-purple-200',
                borderColor: 'border-pink-500/80',
                badge: '4J+2HR'
            };
        }
        if (card.isHordeling) {
            return {
                icon: '🐎',
                label: 'Ординець',
                bgGradient: 'from-amber-200 via-orange-100 to-amber-300',
                borderColor: 'border-amber-700/80',
                badge: '10'
            };
        }
        if (card.isPrince) {
            return {
                icon: '🤴',
                label: 'Принц',
                bgGradient: 'from-blue-100 via-indigo-50 to-purple-200',
                borderColor: 'border-blue-500/80',
                badge: '1HR+2J'
            };
        }
        if (card.isKabbalist) {
            return {
                icon: '📜',
                label: 'Каббаліст',
                bgGradient: 'from-amber-100 via-stone-100 to-amber-200',
                borderColor: 'border-amber-600/80',
                badge: '3GLM'
            };
        }
        if (card.isGolem) {
            return {
                icon: '🗿',
                label: 'Голем',
                bgGradient: 'from-stone-200 via-neutral-100 to-stone-300',
                borderColor: 'border-stone-600/80',
                badge: '🗿4'
            };
        }
        if (card.isInventor) {
            return {
                icon: '🔧',
                label: 'Винахідник',
                bgGradient: 'from-cyan-100 via-slate-100 to-amber-100',
                borderColor: 'border-cyan-700/80',
                badge: 'AUT+ANM'
            };
        }
        if (card.isAutomaton) {
            return {
                icon: '⚙️',
                label: 'Автоматон',
                bgGradient: 'from-slate-200 via-zinc-100 to-amber-200',
                borderColor: 'border-slate-600/80',
                badge: '⚙️5'
            };
        }
        if (card.isAnimatronic) {
            return {
                icon: '🤖',
                label: 'Аніматронік',
                bgGradient: 'from-zinc-200 via-slate-100 to-purple-100',
                borderColor: 'border-zinc-600/80',
                badge: '🤖3'
            };
        }
        if (card.isIllusionCopySpell) {
            return {
                icon: '✨',
                label: 'Копія',
                bgGradient: 'from-purple-100 via-pink-50 to-indigo-200',
                borderColor: 'border-purple-500/80',
                badge: '✨'
            };
        }
        if (card.isImmortalitySpell) {
            return {
                icon: '🛡️',
                label: 'Безсмертя',
                bgGradient: 'from-amber-100 via-yellow-50 to-emerald-100',
                borderColor: 'border-amber-500/80',
                badge: '🛡️'
            };
        }
        if (card.isSummonGhostSpell) {
            return {
                icon: '👻',
                label: 'Виклик привида',
                bgGradient: 'from-teal-100 via-cyan-50 to-blue-100',
                borderColor: 'border-teal-500/80',
                badge: '👻'
            };
        }
        if (card.isSummonSkeletonsSpell) {
            return {
                icon: '☠️',
                label: 'Виклик скелетів',
                bgGradient: 'from-stone-200 via-zinc-100 to-neutral-300',
                borderColor: 'border-stone-600/80',
                badge: '3SK'
            };
        }
        if (card.isSummonZombiesSpell) {
            return {
                icon: '🧟',
                label: 'Виклик зомбі',
                bgGradient: 'from-emerald-200 via-teal-100 to-stone-200',
                borderColor: 'border-emerald-700/80',
                badge: '3ZB'
            };
        }
        if (card.isEndTurnSpell) {
            return {
                icon: '⌛',
                label: 'Закінчити хід',
                bgGradient: 'from-indigo-100 via-purple-50 to-slate-200',
                borderColor: 'border-indigo-500/80',
                badge: '⌛'
            };
        }
        if (card.isGhost) {
            return {
                icon: '👻',
                label: 'Привид',
                bgGradient: 'from-teal-100 via-cyan-50 to-slate-200',
                borderColor: 'border-teal-500/80',
                badge: '👻'
            };
        }
        if (card.isChillTouch) {
            return {
                icon: '❄️',
                label: 'Чіл тач',
                bgGradient: 'from-cyan-100 via-sky-50 to-blue-200',
                borderColor: 'border-cyan-600/80',
                badge: '❄️<6'
            };
        }
        if (card.isFingerOfDeath) {
            return {
                icon: '👉',
                label: 'Перст смерті',
                bgGradient: 'from-purple-200 via-rose-100 to-amber-100',
                borderColor: 'border-purple-600/80',
                badge: '👉≤J'
            };
        }
        if (card.isPowerWordKill) {
            return {
                icon: '💀',
                label: 'Слово смерті',
                bgGradient: 'from-zinc-300 via-stone-200 to-red-200',
                borderColor: 'border-stone-800',
                badge: '💀ALL'
            };
        }
        if (card.isAnnihilation) {
            return {
                icon: '💥',
                label: 'Анігіляція',
                bgGradient: 'from-orange-200 via-red-100 to-purple-200',
                borderColor: 'border-red-600/80',
                badge: '💥≤K'
            };
        }
        if (card.isGold) {
            return {
                icon: '🪙',
                label: 'Золото',
                bgGradient: 'from-amber-200 via-yellow-100 to-amber-300',
                borderColor: 'border-amber-500',
                badge: '+3'
            };
        }
        if (card.isSilver) {
            return {
                icon: '🥈',
                label: 'Срібло',
                bgGradient: 'from-slate-200 via-zinc-100 to-slate-300',
                borderColor: 'border-slate-400',
                badge: '+1'
            };
        }
        if (card.isLeader) {
            return {
                icon: '🎖️',
                label: 'Лідер',
                bgGradient: 'from-blue-200 via-indigo-100 to-blue-300',
                borderColor: 'border-blue-600/80',
                badge: '3x5'
            };
        }
        if (card.isCommander) {
            return {
                icon: '🏅',
                label: 'Командир',
                bgGradient: 'from-indigo-200 via-purple-100 to-indigo-300',
                borderColor: 'border-indigo-600/80',
                badge: '3x7'
            };
        }
        if (card.isGeneral) {
            return {
                icon: '👑',
                label: 'Полководець',
                bgGradient: 'from-red-200 via-rose-100 to-amber-200',
                borderColor: 'border-red-600/80',
                badge: '3x9'
            };
        }
        if (card.isRanger) {
            return {
                icon: '🏹',
                label: 'Ренджер',
                bgGradient: 'from-emerald-100 via-green-50 to-teal-100',
                borderColor: 'border-emerald-600/80',
                badge: '4🐕+1🪤'
            };
        }
        if (card.isHunter) {
            return {
                icon: '🎯',
                label: 'Мисливець',
                bgGradient: 'from-lime-100 via-emerald-50 to-yellow-100',
                borderColor: 'border-lime-700/80',
                badge: '4🐕+2🪤'
            };
        }
        if (card.isTrapper) {
            return {
                icon: '⛓️',
                label: 'Траппер',
                bgGradient: 'from-yellow-100 via-amber-50 to-stone-200',
                borderColor: 'border-yellow-700/80',
                badge: '4🐕+4🪤'
            };
        }
        if (card.isTrap) {
            return {
                icon: '🪤',
                label: 'Пастка',
                bgGradient: 'from-stone-200 via-zinc-100 to-stone-300',
                borderColor: 'border-stone-500',
                badge: '≤10'
            };
        }
        if (card.isCleric) {
            return {
                icon: '🕊️',
                label: 'Клірик',
                bgGradient: 'from-sky-100 via-blue-50 to-indigo-100',
                borderColor: 'border-sky-500/80',
                badge: '+10HP'
            };
        }
        if (card.isBarbarian) {
            return {
                icon: '🪓',
                label: 'Варвар',
                bgGradient: 'from-red-200 via-orange-100 to-amber-200',
                borderColor: 'border-red-600/80',
                badge: '10'
            };
        }
        if (card.isRage) {
            return {
                icon: '🔥',
                label: 'Злість',
                bgGradient: 'from-rose-200 via-red-100 to-orange-200',
                borderColor: 'border-rose-500',
                badge: '🔥'
            };
        }
        if (card.isIllusionist) {
            return {
                icon: '🎭',
                label: 'Ілюзіоніст',
                bgGradient: 'from-pink-100 via-purple-50 to-indigo-100',
                borderColor: 'border-pink-500/80',
                badge: '4ILL'
            };
        }
        if (card.isIllusion) {
            return {
                icon: '🌌',
                label: 'Ілюзія',
                bgGradient: 'from-purple-100 via-indigo-50 to-blue-100',
                borderColor: 'border-purple-400',
                badge: '🌌'
            };
        }
        if (card.isWizard) {
            return {
                icon: '🧙‍♂️',
                label: 'Чарівник',
                bgGradient: 'from-fuchsia-100 via-purple-50 to-indigo-100',
                borderColor: 'border-fuchsia-600/80',
                badge: '4SP+2🎴'
            };
        }
        if (card.isKnowledge) {
            return {
                icon: '📖',
                label: 'Знання',
                bgGradient: 'from-amber-100 via-orange-50 to-yellow-100',
                borderColor: 'border-amber-600/80',
                badge: '+1⚡'
            };
        }
        if (card.isMage) {
            return {
                icon: '🧙‍♂️',
                label: 'Маг',
                bgGradient: 'from-blue-100 via-indigo-50 to-sky-100',
                borderColor: 'border-blue-600/80',
                badge: '5SP+AN'
            };
        }
        if (card.isWarlock) {
            return {
                icon: '🔮',
                label: 'Чаклун',
                bgGradient: 'from-indigo-100 via-purple-50 to-blue-100',
                borderColor: 'border-indigo-600/80',
                badge: '4SP+AN'
            };
        }
        if (card.isDeathCard) {
            return {
                icon: '☠️',
                label: 'Смерть',
                bgGradient: 'from-neutral-900 via-stone-800 to-black text-amber-100',
                borderColor: 'border-amber-500',
                badge: '☠️'
            };
        }
        if (card.isDeathKnight) {
            return {
                icon: '🖤',
                label: 'Лицар смерті',
                bgGradient: 'from-purple-950 via-slate-900 to-black text-purple-200',
                borderColor: 'border-purple-500',
                badge: '99'
            };
        }
        if (card.isSkeleton) {
            return {
                icon: '🦴',
                label: 'Скелет',
                bgGradient: 'from-stone-200 via-neutral-100 to-stone-300',
                borderColor: 'border-stone-400',
                badge: '3'
            };
        }
        if (card.isNecromancer) {
            return {
                icon: '🧙‍♂️',
                label: 'Некромант',
                bgGradient: 'from-purple-200 via-indigo-100 to-slate-200',
                borderColor: 'border-purple-700/80',
                badge: '2SK+2ZB'
            };
        }
        if (card.isZombie) {
            return {
                icon: '🧟',
                label: 'Зомбі',
                bgGradient: 'from-emerald-200 via-teal-100 to-stone-200',
                borderColor: 'border-emerald-600',
                badge: '4'
            };
        }
        if (card.isTycoon) {
            return {
                icon: '🎩',
                label: 'Магнат',
                bgGradient: 'from-amber-200 via-yellow-100 to-amber-300',
                borderColor: 'border-amber-600/80',
                badge: '1TR+2GL'
            };
        }
        if (card.isMerchant) {
            return {
                icon: '💰',
                label: 'Торговець',
                bgGradient: 'from-amber-100 via-yellow-50 to-amber-200',
                borderColor: 'border-amber-600/80',
                badge: '2GL+3⚡'
            };
        }
        if (card.isBearSpirit) {
            return {
                icon: '🐻',
                label: 'Дух ведмедя',
                bgGradient: 'from-cyan-100 via-teal-50 to-indigo-100',
                borderColor: 'border-teal-500/80',
                badge: '👻9'
            };
        }
        if (card.isWolfSpirit) {
            return {
                icon: '🐺',
                label: 'Дух вовка',
                bgGradient: 'from-sky-100 via-cyan-50 to-blue-100',
                borderColor: 'border-sky-500/80',
                badge: '👻8'
            };
        }
        if (card.isWarriorSpirit) {
            return {
                icon: '⚔️',
                label: 'Дух воїна',
                bgGradient: 'from-indigo-100 via-purple-50 to-blue-100',
                borderColor: 'border-indigo-500/80',
                badge: '👻10'
            };
        }
        if (card.isShaman) {
            return {
                icon: '🪶',
                label: 'Шаман',
                bgGradient: 'from-amber-100 via-orange-50 to-amber-200',
                borderColor: 'border-amber-700/80',
                badge: '🪶'
            };
        }
        if (card.isDruid) {
            return {
                icon: '🌿',
                label: 'Друїд',
                bgGradient: 'from-emerald-100 via-green-50 to-teal-100',
                borderColor: 'border-emerald-700/80',
                badge: '🌿'
            };
        }
        if (card.isHero) {
            return {
                icon: '🦸‍♂️',
                label: 'Герой',
                bgGradient: 'from-amber-200 via-yellow-100 to-amber-300',
                borderColor: 'border-amber-500',
                badge: '👑'
            };
        }
        if (card.isPaladin) {
            return {
                icon: '⚔️',
                label: 'Паладин',
                bgGradient: 'from-amber-200 via-yellow-50 to-amber-300',
                borderColor: 'border-amber-600',
                badge: '⚔️'
            };
        }
        if (card.isAlchemist) {
            return {
                icon: '⚗️',
                label: 'Алхімік',
                bgGradient: 'from-teal-100 via-emerald-50 to-cyan-100',
                borderColor: 'border-teal-600/80',
                badge: '2A+2GL'
            };
        }
        if (card.isHuntsman) {
            return {
                icon: '🐺',
                label: 'Псар',
                bgGradient: 'from-amber-100 via-orange-50 to-stone-200',
                borderColor: 'border-amber-700/80',
                badge: '4🐕'
            };
        }
        if (card.isDog) {
            return {
                icon: '🐕',
                label: 'Бойовий пес',
                bgGradient: 'from-amber-200 via-orange-100 to-amber-300',
                borderColor: 'border-amber-700/80',
                badge: '1'
            };
        }
        if (card.isWall) {
            return {
                icon: '🧱',
                label: 'Стіна',
                bgGradient: 'from-stone-200 via-neutral-100 to-stone-300',
                borderColor: 'border-stone-600/80',
                badge: '+40🛡️'
            };
        }
        if (card.isTower) {
            return {
                icon: '🏰',
                label: 'Вежа',
                bgGradient: 'from-slate-200 via-zinc-100 to-slate-300',
                borderColor: 'border-slate-600/80',
                badge: '+20🛡️'
            };
        }
        if (card.isBastion) {
            return {
                icon: '🛡️',
                label: 'Бастіон',
                bgGradient: 'from-amber-100 via-stone-100 to-amber-200',
                borderColor: 'border-amber-600/80',
                badge: '+80🛡️'
            };
        }
        if (card.isCastle) {
            return {
                icon: '🏰',
                label: 'Замок',
                bgGradient: 'from-yellow-100 via-amber-50 to-yellow-200',
                borderColor: 'border-yellow-600/80',
                badge: '+100🛡️'
            };
        }
        if (card.isShield) {
            return {
                icon: '🛡️',
                label: 'Щит',
                bgGradient: 'from-blue-100 via-slate-50 to-indigo-100',
                borderColor: 'border-blue-600/80',
                badge: '+4🛡️'
            };
        }
        if (card.isTreasure) {
            return {
                icon: '🗝️',
                label: 'Скарб',
                bgGradient: 'from-amber-200 via-yellow-100 to-amber-300',
                borderColor: 'border-amber-500',
                badge: 'TRSR'
            };
        }
        if (card.isHealthElixir) {
            return {
                icon: '🧪',
                label: 'Еліксир',
                bgGradient: 'from-teal-100 via-emerald-50 to-cyan-100',
                borderColor: 'border-teal-500',
                badge: '+28HP'
            };
        }
        if (card.isPirate) {
            return {
                icon: '🏴‍☠️',
                label: 'Пірат',
                bgGradient: 'from-slate-300 via-zinc-200 to-slate-400',
                borderColor: 'border-slate-700',
                badge: 'PRT'
            };
        }
        if (card.isRobber) {
            return {
                icon: '🗡️',
                label: 'Розбійник',
                bgGradient: 'from-stone-200 via-amber-100 to-stone-300',
                borderColor: 'border-stone-600',
                badge: 'RBR'
            };
        }
        if (card.isBurglar) {
            return {
                icon: '💰',
                label: 'Грабіжник',
                bgGradient: 'from-amber-100 via-yellow-100 to-amber-200',
                borderColor: 'border-amber-600',
                badge: 'BRG'
            };
        }
        if (card.isDoctor) {
            return {
                icon: '🩺',
                label: 'Лікар',
                bgGradient: 'from-rose-100 via-red-50 to-emerald-100',
                borderColor: 'border-rose-400',
                badge: '+20HP'
            };
        }
        if (card.isWitchDoctor) {
            return {
                icon: '🩺',
                label: 'Знахар',
                bgGradient: 'from-emerald-100 via-teal-50 to-amber-100',
                borderColor: 'border-emerald-600',
                badge: '+20HP'
            };
        }
        if (card.isWolf) {
            return {
                icon: '🐺',
                label: 'Вовк',
                bgGradient: 'from-slate-200 via-zinc-100 to-slate-300',
                borderColor: 'border-slate-500',
                badge: '8'
            };
        }
        if (card.isBear) {
            return {
                icon: '🐻',
                label: 'Ведмідь',
                bgGradient: 'from-amber-200 via-stone-100 to-amber-300',
                borderColor: 'border-amber-700',
                badge: '9'
            };
        }
        if (card.isExecutioner) {
            return {
                icon: '⚔️',
                label: 'Кат',
                bgGradient: 'from-red-200 via-stone-200 to-black/20',
                borderColor: 'border-red-700',
                badge: 'EXC'
            };
        }
        if (card.isAssassin) {
            return {
                icon: '🗡️',
                label: 'Ассасін',
                bgGradient: 'from-neutral-300 via-stone-200 to-neutral-400',
                borderColor: 'border-stone-800',
                badge: 'ASN'
            };
        }
        if (card.isArcher) {
            return {
                icon: '🏹',
                label: 'Лучники',
                bgGradient: 'from-emerald-100 via-green-50 to-amber-100',
                borderColor: 'border-emerald-600',
                badge: 'ARC'
            };
        }
        if (card.isCrossbowman) {
            return {
                icon: '🏹',
                label: 'Арбалетники',
                bgGradient: 'from-amber-100 via-stone-100 to-amber-200',
                borderColor: 'border-amber-700',
                badge: 'CRB'
            };
        }
        if (card.isMagister) {
            return {
                icon: '🧙‍♂️',
                label: 'Магістр',
                bgGradient: 'from-purple-200 via-indigo-100 to-blue-200',
                borderColor: 'border-purple-600',
                badge: 'M'
            };
        }
        if (card.isGrandmaster) {
            return {
                icon: '♟️',
                label: 'Гросмейстер',
                bgGradient: 'from-amber-200 via-yellow-100 to-amber-300',
                borderColor: 'border-amber-600',
                badge: 'GM'
            };
        }
        if (card.isSharper) {
            return {
                icon: '🎩',
                label: 'Шулер',
                bgGradient: 'from-emerald-200 via-teal-100 to-emerald-300',
                borderColor: 'border-emerald-600',
                badge: 'SH'
            };
        }
        if (card.isThief) {
            return {
                icon: '🗡️',
                label: 'Злодій',
                bgGradient: 'from-slate-200 via-zinc-100 to-slate-300',
                borderColor: 'border-slate-600',
                badge: 'TH'
            };
        }
        if (card.isSage) {
            return {
                icon: '📜',
                label: 'Мудрець',
                bgGradient: 'from-sky-200 via-blue-100 to-indigo-200',
                borderColor: 'border-sky-600',
                badge: 'SG'
            };
        }
        if (card.isMercenary) {
            return {
                icon: '⚔️',
                label: 'Найманець',
                bgGradient: 'from-red-200 via-orange-100 to-red-300',
                borderColor: 'border-red-600',
                badge: 'MC'
            };
        }
        if (card.isGambler) {
            return {
                icon: '🎰',
                label: 'Гравець',
                bgGradient: 'from-indigo-200 via-purple-100 to-indigo-300',
                borderColor: 'border-indigo-600',
                badge: 'GB'
            };
        }
        if (card.isPriest) {
            return {
                icon: '⛪',
                label: 'Священик',
                bgGradient: 'from-amber-100 via-yellow-50 to-amber-200',
                borderColor: 'border-amber-600',
                badge: 'PR'
            };
        }
        if (card.isBishop) {
            return {
                icon: '🏛️',
                label: 'Єпископ',
                bgGradient: 'from-purple-200 via-fuchsia-100 to-purple-300',
                borderColor: 'border-purple-600',
                badge: 'BP'
            };
        }
        if (card.isArchbishop) {
            return {
                icon: '⛪',
                label: 'Архієпископ',
                bgGradient: 'from-amber-200 via-yellow-100 to-amber-300',
                borderColor: 'border-amber-500',
                badge: 'AB'
            };
        }
        // Level-specific Smelting Spells
        if (card.isSmeltingSpell) {
            const level = card.smeltingLevel || 1;
            const smeltingVisuals: Record<number, { icon: string; label: string; bgGradient: string; borderColor: string; badge: string }> = {
                1: { icon: '⚒️', label: 'Переплавлення I', bgGradient: 'from-amber-200 via-orange-100 to-amber-300', borderColor: 'border-amber-600', badge: 'Lvl 1' },
                2: { icon: '🔨', label: 'Переплавлення II', bgGradient: 'from-stone-300 via-zinc-200 to-amber-200', borderColor: 'border-amber-700', badge: 'Lvl 2' },
                3: { icon: '⚙️', label: 'Переплавлення III', bgGradient: 'from-orange-200 via-amber-100 to-yellow-200', borderColor: 'border-orange-600', badge: 'Lvl 3' },
                4: { icon: '🌋', label: 'Переплавлення IV', bgGradient: 'from-orange-300 via-red-200 to-amber-300', borderColor: 'border-red-600', badge: 'Lvl 4' },
                5: { icon: '♨️', label: 'Переплавлення V', bgGradient: 'from-red-300 via-rose-200 to-amber-300', borderColor: 'border-rose-600', badge: 'Lvl 5' },
                6: { icon: '⚔️', label: 'Переплавлення VI (Герої)', bgGradient: 'from-purple-300 via-fuchsia-200 to-amber-300', borderColor: 'border-purple-600', badge: 'Lvl 6' },
                7: { icon: '🪙', label: 'Переплавлення VII (Золото)', bgGradient: 'from-yellow-300 via-amber-200 to-yellow-400', borderColor: 'border-amber-500', badge: 'Lvl 7' },
                8: { icon: '👑', label: 'Переплавлення VIII (Обрана)', bgGradient: 'from-amber-400 via-orange-300 to-purple-400', borderColor: 'border-amber-400 font-bold', badge: 'Lvl 8' }
            };
            return smeltingVisuals[level] || { icon: '⚒️', label: `Переплавлення ${level}`, bgGradient: 'from-amber-200 via-orange-100 to-red-200', borderColor: 'border-amber-600', badge: `Lvl${level}` };
        }

        // Level-specific Resource Release Spells
        if (card.isResourceReleaseSpell) {
            const level = card.resourceReleaseLevel || 1;
            const resourceVisuals: Record<number, { icon: string; label: string; bgGradient: string; borderColor: string; badge: string }> = {
                1: { icon: '💎', label: 'Вивільнення I (+2⚡)', bgGradient: 'from-blue-200 via-sky-100 to-cyan-200', borderColor: 'border-blue-500', badge: '+2⚡' },
                2: { icon: '🔷', label: 'Вивільнення II (+2⚡)', bgGradient: 'from-cyan-200 via-blue-100 to-teal-200', borderColor: 'border-cyan-600', badge: '+2⚡' },
                3: { icon: '💠', label: 'Вивільнення III (+2⚡)', bgGradient: 'from-teal-200 via-emerald-100 to-blue-200', borderColor: 'border-teal-600', badge: '+2⚡' },
                4: { icon: '🌌', label: 'Вивільнення IV (+4⚡)', bgGradient: 'from-indigo-200 via-purple-100 to-blue-200', borderColor: 'border-indigo-600', badge: '+4⚡' },
                5: { icon: '🔮', label: 'Вивільнення V (+4⚡)', bgGradient: 'from-purple-200 via-fuchsia-100 to-indigo-200', borderColor: 'border-purple-600', badge: '+4⚡' },
                6: { icon: '🌟', label: 'Вивільнення VI (+5⚡)', bgGradient: 'from-fuchsia-200 via-pink-100 to-purple-300', borderColor: 'border-fuchsia-600', badge: '+5⚡' },
                7: { icon: '⚡', label: 'Вивільнення VII (+6⚡)', bgGradient: 'from-amber-300 via-yellow-200 to-cyan-300', borderColor: 'border-amber-500', badge: '+6⚡' }
            };
            return resourceVisuals[level] || { icon: '💎', label: `Вивільнення ${level}`, bgGradient: 'from-blue-200 via-indigo-100 to-cyan-200', borderColor: 'border-blue-600', badge: `Lvl${level}` };
        }

        // Individual Spells Visuals
        if (card.isChillTouch) return { icon: '❄️', label: 'Чіл тач', bgGradient: 'from-cyan-100 via-blue-50 to-indigo-100', borderColor: 'border-cyan-500', badge: '<6' };
        if (card.isFingerOfDeath) return { icon: '👉', label: 'Перст смерті', bgGradient: 'from-purple-200 via-stone-200 to-slate-300', borderColor: 'border-purple-600', badge: '≤J' };
        if (card.isPowerWordKill) return { icon: '💀', label: 'Слово сили', bgGradient: 'from-slate-900 via-purple-950 to-black text-purple-200', borderColor: 'border-purple-500', badge: 'KILL' };
        if (card.isAnnihilation) return { icon: '💥', label: 'Анігіляція', bgGradient: 'from-red-200 via-orange-100 to-amber-200', borderColor: 'border-red-600', badge: '≤K' };
        if (card.isMeteorSwarm) return { icon: '☄️', label: 'Метеоритний дощ', bgGradient: 'from-orange-300 via-red-200 to-amber-300', borderColor: 'border-orange-600', badge: '☄️' };
        if (card.isManaShield) return { icon: '🛡️', label: 'Магічний Щит', bgGradient: 'from-sky-200 via-blue-100 to-cyan-200', borderColor: 'border-sky-500', badge: '+60🛡️' };
        if (card.isChainLightning) return { icon: '⚡', label: 'Ланцюгова блискавка', bgGradient: 'from-yellow-200 via-amber-100 to-orange-200', borderColor: 'border-yellow-600', badge: '⚡' };
        if (card.isMassDeath) return { icon: '💀', label: 'Масова смерть', bgGradient: 'from-purple-900 via-black to-slate-900 text-purple-200', borderColor: 'border-purple-500', badge: 'ALL💀' };
        if (card.isDeathRay) return { icon: '🔮', label: 'Промінь смерті', bgGradient: 'from-indigo-300 via-purple-200 to-slate-300', borderColor: 'border-indigo-600', badge: 'RAY' };
        if (card.isMindHeist) return { icon: '👁️', label: 'Викрадення розуму', bgGradient: 'from-violet-200 via-purple-100 to-indigo-200', borderColor: 'border-violet-600', badge: '👁️' };
        if (card.isConversion) return { icon: '✨', label: 'Навернення', bgGradient: 'from-amber-100 via-yellow-50 to-orange-100', borderColor: 'border-amber-500', badge: '✨' };
        if (card.isHolyCathedral) return { icon: '⛪', label: 'Святий собор', bgGradient: 'from-amber-200 via-yellow-100 to-amber-300', borderColor: 'border-amber-500', badge: '⛪' };
        if (card.isNorthernWind) return { icon: '❄️', label: 'Вітер з півночі', bgGradient: 'from-cyan-100 via-sky-50 to-blue-100', borderColor: 'border-cyan-500', badge: '❄️' };
        if (card.isHorde) return { icon: '🪓', label: 'Орда', bgGradient: 'from-amber-200 via-red-100 to-orange-200', borderColor: 'border-amber-600', badge: '🪓' };
        if (card.isUndeadLord) return { icon: '👑', label: 'Повелитель нежиті', bgGradient: 'from-purple-900 via-slate-800 to-black text-purple-200', borderColor: 'border-purple-500', badge: '👑' };
        if (card.isZombiePlague) return { icon: '🧟', label: 'Зомбі мор', bgGradient: 'from-emerald-200 via-teal-100 to-stone-200', borderColor: 'border-emerald-600', badge: '🧟' };
        if (card.isTurnToSkeletons) return { icon: '☠️', label: 'У скелетів', bgGradient: 'from-stone-300 via-neutral-200 to-stone-400', borderColor: 'border-stone-500', badge: '☠️' };
        if (card.isPirateShip || card.rank === 'PRT_SHIP (Піратський корабель)') return { icon: '⛵', label: 'Піратський корабель', bgGradient: 'from-slate-700 via-sky-900 to-black text-amber-200', borderColor: 'border-amber-600', badge: '7' };
        if (card.isPirateRaid) return { icon: '🏴‍☠️', label: 'Піратський набіг', bgGradient: 'from-slate-300 via-zinc-200 to-slate-400', borderColor: 'border-slate-600', badge: '🏴‍☠️' };
        if (card.isUndeadLordSpell) return { icon: '💀', label: 'Владика мертвих', bgGradient: 'from-purple-950 via-black to-slate-900 text-purple-200', borderColor: 'border-purple-500', badge: 'DK20' };
        if (card.isGrandKonungSpell) return { icon: '❄️', label: 'Великий конунг', bgGradient: 'from-sky-200 via-blue-100 to-cyan-200', borderColor: 'border-sky-600', badge: 'KONUNG' };
        if (card.isCustomHeroCard) {
            const levelVal = card.heroLevel ?? card.value ?? 0;
            const cond = card.heroCondition ?? 10;
            return {
                icon: card.heroAvatar || '⚔️',
                label: card.heroName || 'Герой',
                bgGradient: cond <= 3 ? 'from-[#3a1818] via-[#2a1212] to-[#1a0b0b]' : 'from-[#3a2818] via-[#2a1d12] to-[#1a120b]',
                borderColor: cond <= 3 ? 'border-rose-500' : (cond <= 6 ? 'border-amber-500' : 'border-amber-400'),
                badge: `L${levelVal}`
            };
        }

        if (card.isGreatKhanSpell) return { icon: '🐎', label: 'Великий хан', bgGradient: 'from-amber-200 via-orange-100 to-yellow-200', borderColor: 'border-amber-600', badge: 'KHAN' };
        if (card.isZombieApocalypseSpell) return { icon: '🧟', label: 'Зомбі апокаліпсис', bgGradient: 'from-emerald-300 via-teal-200 to-stone-300', borderColor: 'border-emerald-700', badge: 'ZOMB' };
        if (card.isInvadersSpell) return { icon: '⚔️', label: 'Загарбники', bgGradient: 'from-red-200 via-rose-100 to-amber-200', borderColor: 'border-red-600', badge: 'INV' };
        if (card.isStormOfSeasSpell) return { icon: '🌊', label: 'Гроза морів', bgGradient: 'from-blue-300 via-cyan-200 to-sky-300', borderColor: 'border-blue-600', badge: 'SEA' };
        if (card.isEinherjarSpell) return { icon: '🛡️', label: 'Ейнхерії', bgGradient: 'from-amber-300 via-yellow-200 to-amber-400', borderColor: 'border-amber-500', badge: 'HERO' };
        if (card.isHelArmySpell) return { icon: '💀', label: 'Армія Хель', bgGradient: 'from-stone-900 via-slate-800 to-black text-amber-200', borderColor: 'border-amber-500', badge: 'HEL' };
        if (card.isWeakStrengthBoostSpell) return { icon: '🗡️', label: 'Слабке підняття', bgGradient: 'from-amber-200 via-orange-100 to-yellow-200', borderColor: 'border-amber-500', badge: '+1⚔️' };
        if (card.isStrengthBoostSpell) return { icon: '⚔️', label: 'Підняття сили', bgGradient: 'from-orange-200 via-amber-100 to-red-100', borderColor: 'border-orange-600', badge: '+3⚔️' };
        if (card.isStrongStrengthBoostSpell) return { icon: '💥', label: 'Сильне підняття', bgGradient: 'from-red-300 via-rose-200 to-amber-300', borderColor: 'border-red-600', badge: '+10⚔️' };
        if (card.isBurnCardSpell) return { icon: '🔥', label: 'Спалити карту', bgGradient: 'from-orange-200 via-red-100 to-amber-200', borderColor: 'border-orange-500', badge: '🔥' };
        if (card.isBurnHandSpell) return { icon: '🧨', label: 'Спалити карти', bgGradient: 'from-red-300 via-orange-200 to-red-400', borderColor: 'border-red-600', badge: '🧨' };
        if (card.isSummonGhostSpell) return { icon: '👻', label: 'Приклик привида', bgGradient: 'from-indigo-100 via-purple-50 to-blue-100', borderColor: 'border-indigo-400', badge: '👻' };
        if (card.isSummonSkeletonsSpell) return { icon: '☠️', label: 'Приклик скелетів', bgGradient: 'from-stone-200 via-neutral-100 to-stone-300', borderColor: 'border-stone-400', badge: '☠️' };
        if (card.isSummonZombiesSpell) return { icon: '🧟', label: 'Приклик зомбі', bgGradient: 'from-emerald-100 via-teal-50 to-green-100', borderColor: 'border-emerald-500', badge: '🧟' };
        if (card.isSummonGolemSpell) return { icon: '🗿', label: 'Створення голема', bgGradient: 'from-stone-300 via-zinc-200 to-stone-400', borderColor: 'border-stone-500', badge: '🗿' };
        if (card.isSummonAnimatronicSpell) return { icon: '🤖', label: 'Аніматронік', bgGradient: 'from-purple-200 via-indigo-100 to-slate-200', borderColor: 'border-purple-500', badge: '🤖' };
        if (card.isSummonAutomatonSpell) return { icon: '⚙️', label: 'Автоматон', bgGradient: 'from-amber-100 via-stone-100 to-amber-200', borderColor: 'border-amber-600', badge: '⚙️' };
        if (card.isIllusionCopySpell) return { icon: '✨', label: 'Ілюзорна копія', bgGradient: 'from-fuchsia-100 via-pink-50 to-purple-100', borderColor: 'border-fuchsia-400', badge: 'COPY' };
        if (card.isImmortalitySpell) return { icon: '🛡️', label: 'Безсмертя', bgGradient: 'from-amber-200 via-yellow-100 to-amber-300', borderColor: 'border-amber-500', badge: '🛡️3' };
        if (card.isEndTurnSpell) return { icon: '⌛', label: 'Завершити хід', bgGradient: 'from-blue-100 via-indigo-50 to-sky-100', borderColor: 'border-blue-400', badge: 'END' };

        // Fallback for any other spell
        if (card.isSpell) {
            return {
                icon: '🔮',
                label: 'Закляття',
                bgGradient: 'from-cyan-100 via-teal-50 to-blue-100',
                borderColor: 'border-cyan-500',
                badge: 'SP'
            };
        }

        switch (rank) {
            case '10':
                return {
                    icon: '🛡️',
                    label: 'Десятник',
                    bgGradient: 'from-cyan-100 via-sky-50 to-blue-200',
                    borderColor: 'border-cyan-600/70',
                    badge: '10'
                };
            case '9':
                return {
                    icon: '🏹',
                    label: 'Стрілець',
                    bgGradient: 'from-green-100 via-emerald-50 to-teal-100',
                    borderColor: 'border-green-600/70',
                    badge: '9'
                };
            case '8':
                return {
                    icon: '🏹',
                    label: 'Лучник',
                    bgGradient: 'from-emerald-100 via-green-50 to-teal-100',
                    borderColor: 'border-emerald-600/70',
                    badge: '8'
                };
            case '7':
                return {
                    icon: '🪓',
                    label: 'Алебардник',
                    bgGradient: 'from-amber-100 via-stone-50 to-amber-200',
                    borderColor: 'border-amber-700/70',
                    badge: '7'
                };
            case '6':
                return {
                    icon: '⚔️',
                    label: 'Піхотинець',
                    bgGradient: 'from-slate-100 via-zinc-50 to-stone-200',
                    borderColor: 'border-slate-600/70',
                    badge: '6'
                };
            case '5':
                return {
                    icon: '🎯',
                    label: 'Арбалетник',
                    bgGradient: 'from-teal-100 via-cyan-50 to-emerald-100',
                    borderColor: 'border-teal-600/70',
                    badge: '5'
                };
            case '4':
                return {
                    icon: '🗡️',
                    label: 'Розвідник',
                    bgGradient: 'from-lime-100 via-emerald-50 to-green-100',
                    borderColor: 'border-lime-600/70',
                    badge: '4'
                };
            case '3':
                return {
                    icon: '🛡️',
                    label: 'Вартовий',
                    bgGradient: 'from-blue-100 via-indigo-50 to-slate-200',
                    borderColor: 'border-blue-600/70',
                    badge: '3'
                };
            case '2':
                return {
                    icon: '🌾',
                    label: 'Ополченець',
                    bgGradient: 'from-yellow-100 via-amber-50 to-orange-100',
                    borderColor: 'border-yellow-700/70',
                    badge: '2'
                };
            case '1':
                return {
                    icon: '🗡️',
                    label: 'Рекрут',
                    bgGradient: 'from-stone-100 via-neutral-50 to-stone-200',
                    borderColor: 'border-stone-600/70',
                    badge: '1'
                };
            case '0':
                return {
                    icon: '🃏',
                    label: 'Шут',
                    bgGradient: 'from-purple-100 via-pink-50 to-amber-100',
                    borderColor: 'border-purple-600/70',
                    badge: '0'
                };
            case 'J':
                return {
                    icon: '🗡️',
                    label: 'Валет',
                    bgGradient: 'from-amber-100 via-orange-50 to-amber-200',
                    borderColor: 'border-amber-600/70',
                    badge: '11'
                };
            case 'N':
                return {
                    icon: '🛡️',
                    label: 'Лицар',
                    bgGradient: 'from-indigo-100 via-slate-100 to-amber-100',
                    borderColor: 'border-indigo-600/70',
                    badge: '11'
                };
            case 'Q':
                return {
                    icon: '👸',
                    label: 'Дама',
                    bgGradient: 'from-rose-100 via-pink-50 to-purple-100',
                    borderColor: 'border-rose-500/70',
                    badge: '12'
                };
            case 'K':
                return {
                    icon: '🤴',
                    label: 'Король',
                    bgGradient: 'from-amber-200 via-yellow-100 to-amber-300',
                    borderColor: 'border-amber-600/80',
                    badge: '13'
                };
            case 'A':
                return {
                    icon: '👑',
                    label: 'Туз',
                    bgGradient: 'from-amber-300 via-yellow-200 to-amber-400',
                    borderColor: 'border-amber-500',
                    badge: '14'
                };
            default:
                return null;
        }
    };

    const getCardTitle = () => {
        let baseTitle = "";

        if (card.isDeathKnight) baseTitle = "🖤 Лицар смерті (Сила 99): Нападає з величезною силою та закликає 3 Скелети. При захисті блокує підкидання — підкидати можна лише козирями!";
        else if (card.isSkeleton) baseTitle = "🦴 Скелет (Сила 3): Нежить-невольник. Потрапляючи у відбій, згорає у вічний відбій.";
        else if (card.isDraugr) baseTitle = "💀 Драугр (Сила 8): Мрець-воїн з царства Хельheim. При відбої повністю знищується (3-й тип відбою: видаляється з гри без сліду).";
        else if (card.isHero) baseTitle = "🛡️ Ейнхерій (Сила 10): Могутній воїн з Вальгалли. При відбої повністю знищується (3-й тип відбою: видаляється з гри без сліду).";
        else if (card.isZombie) baseTitle = "🧟 Зомбі (Сила 4): Ходячий мрець. Потрапляючи у відбій, згорає у вічний відбій.";
        else if (card.isNecromancer) baseTitle = "🧙‍♂️ Некромант: При ході закликає 2 Скелети і 2 Зомбі, дає 3 закляття смерті та піднімає Привида з відбою!";
        else if (card.isGhost) baseTitle = "👻 Привид (Сила козиря): Воскрешена духом карта. Після використання йде у вічний відбій.";
        else if (card.isDeathCard) baseTitle = "☠️ Смерть: Знищує будь-яку карту у вічний відбій. Супротивник негайно втрачає можливість підкидати та пропускає хід!";
        else if (card.isChillTouch) baseTitle = "❄️ Чіл тач: Закляття! Б'є карти нижче 6 (2-5, Собаки) у вічний відбій!";
        else if (card.isFingerOfDeath) baseTitle = "👉 Перст смерті: Закляття! Б'є карти від Вальта і нижче у вічний відбій!";
        else if (card.isPowerWordKill) baseTitle = "💀 Слово сили: Смерть: Закляття! Знищує абсолютно будь-яку карту у вічний відбій!";
        else if (card.isAnnihilation) baseTitle = "💥 Анігіляція: Закляття! Знищує будь-яку карту від Короля і нижче у вічний відбій!";
        else if (card.isTycoon) baseTitle = "🎩 Магнат: При ході дає 1 карту Скарбу та 2 карти Золота! Одразу йде у вічний відбій.";
        else if (card.isMerchant) baseTitle = "💰 Торговець: При ході дає 2 карти Золота, +3 очка сили та одразу йде у вічний відбій.";
        else if (card.isTreasure) baseTitle = "🗝️ Скарб: Дає 5 Золота, 5 Срібла, +4 очка сили, +10 Захисту (Armor), +20 HP та йде у вічний відбій.";
        else if (card.isHealthElixir) baseTitle = "🧪 Еліксир здоров'я: Відновлює +28 HP і йде у вічний відбій.";
        else if (card.isDoctor) baseTitle = "🩺 Лікар: Відновлює +20 HP та додає 1 Еліксир здоров'я у руку!";
        else if (card.isWitchDoctor) baseTitle = "🩺 Знахар: Відновлює +20 HP та додає 1 Еліксир здоров'я у руку!";
        else if (card.isDruid) baseTitle = "🌿 Друїд: При ході закликає 2 Вовків та 1 Ведмедя у руку!";
        else if (card.isShaman) baseTitle = "🪶 Шаман: Закликає 2 Духи Вовка, 1 Дух Ведмедя, 3 Духи Воїнів та відновлює +5 HP!";
        else if (card.isBearSpirit) baseTitle = "🐻 Дух ведмедя (Сила 9): Призваний дух. Потрапляючи у відбій, згорає у вічний відбій.";
        else if (card.isWolfSpirit) baseTitle = "🐺 Дух вовка (Сила 8): Призваний дух. Потрапляючи у відбій, згорає у вічний відбій.";
        else if (card.isWarriorSpirit) baseTitle = "⚔️ Дух воїна (Сила 10): Призваний дух. Потрапляючи у відбій, згорає у вічний відбій.";
        else if (card.isWolf) baseTitle = "🐺 Вовк (Сила 8): Спритний лісовий хижак.";
        else if (card.isBear) baseTitle = "🐻 Ведмідь (Сила 9): Могутній лісовий велетень.";
        else if (card.isWall) baseTitle = "🧱 Стіна: Зміцнює захист — надає +40 Захисту (Armor) і йде у вічний відбій.";
        else if (card.isTower) baseTitle = "🏰 Вежа: Зміцнює захист — надає +20 Захисту (Armor) і йде у вічний відбій.";
        else if (card.isBastion) baseTitle = "🛡️ Бастіон: Могутнє укриття — надає +80 Захисту (Armor) і йде у вічний відбій.";
        else if (card.isCastle) baseTitle = "🏰 Замок: Непорушна фортеця — надає +100 Захисту (Armor) і йде у вічний відбій.";
        else if (card.isShield) baseTitle = "🛡️ Щит: Надає +4 Захисту (Armor) і йде у вічний відбій.";
        else if (card.isPirate) baseTitle = "🏴‍☠️ Пірат (Сила Вальта): При успішному відбитті забирає здобич — 1 Золото, 1 Срібло та 1 Скарб!";
        else if (card.isRobber) baseTitle = "🗡️ Розбійник (Сила 10): При успішному відбитті забирає трофеї — 1 Золото та 3 Срібла!";
        else if (card.isBurglar) baseTitle = "💰 Грабіжник (Сила 9): При успішному відбитті здобуває 2 Золота, 4 Срібла та 1 Скарб!";
        else if (card.isExecutioner) baseTitle = "⚔️ Кат (Сила 10): При відбитті карти відправляє побиту карту у вічний відбій!";
        else if (card.isAssassin) baseTitle = "🗡️ Ассасін (Сила 9): Нападає та відбиває підступно — побита карта відправляється у вічний відбій!";
        else if (card.isArcher) baseTitle = "🏹 Лучники (Сила 8): Далекобійні воїни. При відбитті карти повертаються назад у колоду прикупу!";
        else if (card.isCrossbowman) baseTitle = "🏹 Арбалетчики (Сила 10): Влучні стрільці. При відбитті карти повертаються назад у колоду прикупу!";
        else if (card.isGold) baseTitle = "🪙 Золото: При ході дає +3 очка сили. При захисті переводить атаку на іншого гравця і згорає у вічний відбій!";
        else if (card.isSilver) baseTitle = "🥈 Срібло: При ході дає +1 очко сили. При захисті переводить атаку на іншого гравця і згорає у вічний відбій!";
        else if (card.isHero) baseTitle = "🦸‍♂️ Герой: Атакує та відбиває з силою козирного Туза!";
        else if (card.isWarlock) baseTitle = "🔮 Чаклун: Дає 4 Закляття, 1 Анігіляцію та +2 очка сили!";
        else if (card.isMassDeath) baseTitle = "💀 Масова смерть: Знищує всі карти на столі у вічний відбій!";
        else if (card.isDeathRay) baseTitle = "🔮 Промінь смерті: Потужний промінь, що знищує будь-яку карту у вічний відбій!";
        else if (card.isMindHeist) baseTitle = "👁️ Викрадення розуму: Похищає карту у суперника!";
        else if (card.isConversion) baseTitle = "✨ Навернення: Перетворює карту суперника на вашу масть!";
        else if (card.isHolyCathedral) baseTitle = "⛪ Святий собор: Відновлює здоров'я та захист!";
        else if (card.isNorthernWind) baseTitle = "❄️ Вітер з півночі: Заморожує карти суперника!";
        else if (card.isHordeling) baseTitle = "🐎 Ординець (Сила 10): Степний воїн. Б'є карти на столі силою до 10 та залишається на столі до кінця ходу!";
        else if (card.isHorde) baseTitle = "🪓 Орда: Прикликає орду воїнів на стіл!";
        else if (card.isUndeadLord) baseTitle = "👑 Повелитель нежиті: Воскрешає армію мертвих!";
        else if (card.isZombiePlague) baseTitle = "🧟 Зомбі мор: Поширює зараження зомбі серед карт!";
        else if (card.isTurnToSkeletons) baseTitle = "☠️ У скелетів: Перетворює карти на Скелетів!";
        else if (card.isPirateShip || card.rank === 'PRT_SHIP (Піратський корабель)') baseTitle = "⛵ Піратський корабель (Сила 7): Грізний бойовий галеон! При розіграші прикликає 4 Піратські екіпажі!";
        else if (card.isPirateRaid) baseTitle = "🏴‍☠️ Піратський набіг: Грабує супротивників!";
        else if (card.isUndeadLordSpell) baseTitle = "💀 Владика мертвих: Закляття! Прикликає Лицаря Смерті (сила 20) та 3 Скелетів у руку!";
        else if (card.isGrandKonungSpell) baseTitle = "❄️ Великий конунг: Закляття! Закликає 2 Ейнхеріїв та 2 Драугрів у руку!";
        else if (card.isGreatKhanSpell) baseTitle = "🐎 Великий хан: Закляття! Прикликає 4 воїнів Орди!";
        else if (card.isZombieApocalypseSpell) baseTitle = "🧟 Зомбі апокаліпсис: Закляття! Заповнює руку Зомбі!";
        else if (card.isInvadersSpell) baseTitle = "⚔️ Загарбники: Закляття! Закликає загарбників!";
        else if (card.isStormOfSeasSpell) baseTitle = "🌊 Гроза морів: Закляття! Викликає шторм!";
        else if (card.isEinherjarSpell) baseTitle = "🛡️ Ейнхерії: Закляття! Закликає 2 Ейнхеріїв (сила 10) у руку!";
        else if (card.isCustomHeroCard) {
            const lvl = card.heroLevel ?? card.value ?? 0;
            const xp = card.heroXp ?? 0;
            const maxXp = card.heroMaxXp ?? ((lvl + 1) * 20);
            const cond = card.heroCondition ?? 10;
            const maxCond = card.heroMaxCondition ?? 10;
            baseTitle = `⭐ ${card.heroName || 'Герой'} (Рівень ${lvl}, Сила ${lvl}): Стан ${cond}/${maxCond} | Досвід ${xp}/${maxXp} XP. Б'є карти рівні або менші за силу (${lvl}). +2 XP за биття карти, +10 XP за невідбитий хід, +3 XP та -1 стану якщо побили. При 0/10 стану розвалюється на 2 уламки карт!`;
        }
        else if (card.isWeakStrengthBoostSpell) baseTitle = "🗡️ Слабке підняття сили: Будь-яка наступна карта битиме з силою +1 (триває 1 хід)";
        else if (card.isStrengthBoostSpell) baseTitle = "⚔️ Підняття сили: Будь-яка наступна карта битиме з силою +3 (триває 1 хід)";
        else if (card.isStrongStrengthBoostSpell) baseTitle = "💥 Сильне підняття сили: Будь-яка наступна карта битиме з силою +10 (триває 1 хід)";
        else if (card.isHelArmySpell) baseTitle = "💀 Армія Хель: Закляття! Закликає 3 Драугрів у руку!";
        else if (card.isBurnCardSpell) baseTitle = "🔥 Спалити карту: Спалює 1 вибрану карту!";
        else if (card.isBurnHandSpell) baseTitle = "🧨 Спалити карти: Спалює декілька карт у руці!";
        else if (card.isMeteorSwarm) baseTitle = "☄️ Метеоритний дощ: Закляття! Знищує всі карти на столі у вічний відбій та наносить урон супротивникам!";
        else if (card.isManaShield) baseTitle = "🛡️ Магічний Щит: Закляття! Додає +60 Захисту (Armor) та дає 2 магічні карти у руку!";
        else if (card.isChainLightning) baseTitle = "⚡ Ланцюгова блискавка: Закляття! Знищує карту на столі та повертає ініціативу з бонусом сили!";
        else if (card.isSmeltingSpell) {
            const level = card.smeltingLevel || 1;
            const textMap: Record<number, string> = {
                1: "⚒️ Переплавлення I: Знищує 10 карт з вічного відбою -> +1 випадкова карта.",
                2: "🔨 Переплавлення II: Знищує 8 карт з вічного відбою -> +1 випадкова карта.",
                3: "⚙️ Переплавлення III: Знищує 8 карт з вічного відбою -> +2 випадкові карти.",
                4: "🌋 Переплавлення IV: Знищує 8 карт з вічного відбою -> +4 випадкові карти.",
                5: "♨️ Переплавлення V: Знищує 6 карт з вічного відбою -> +4 випадкові карти.",
                6: "⚔️ Переплавлення VI: Знищує 8 карт з вічного відбою -> +2 карти Героя.",
                7: "🪙 Переплавлення VII: Знищує 4 карти з вічного відбою -> +12 карт Золота.",
                8: "👑 Переплавлення VIII: Знищує 24 карти з вічного відбою -> +1 обрана карта на вибір!"
            };
            baseTitle = textMap[level] || `⚒️ Переплавлення (Рівень ${level})`;
        }
        else if (card.isResourceReleaseSpell) {
            const level = card.resourceReleaseLevel || 1;
            const textMap: Record<number, string> = {
                1: "💎 Вивільнення ресурсів I: Знищує 12 карт з вічного відбою -> +2 очка сили.",
                2: "🔷 Вивільнення ресурсів II: Знищує 10 карт з вічного відбою -> +2 очка сили.",
                3: "💠 Вивільнення ресурсів III: Знищує 8 карт з вічного відбою -> +2 очка сили.",
                4: "🌌 Вивільнення ресурсів IV: Знищує 8 карт з вічного відбою -> +4 очка сили.",
                5: "🔮 Вивільнення ресурсів V: Знищує 6 карт з вічного відбою -> +4 очка сили.",
                6: "🌟 Вивільнення ресурсів VI: Знищує 6 карт з вічного відбою -> +5 очок сили.",
                7: "⚡ Вивільнення ресурсів VII: Знищує 6 карт з вічного відбою -> +6 очок сили."
            };
            baseTitle = textMap[level] || `💎 Вивільнення ресурсів (Рівень ${level})`;
        }
        else if (card.isSpell) baseTitle = "✨ Закляття: Магічний сувій. Б'є будь-яку карту нижче Вальта у вічний відбій!";
        else if (card.isMage) baseTitle = "🧙‍♂️ Маг: Дає 5 Заклять, 1 Анігіляцію, 1 Знання та +3 очка сили!";
        else if (card.isKnowledge) baseTitle = "📖 Знання: Дає +1 очко сили та одразу згорає у вічний відбій.";
        else if (card.isWizard) baseTitle = "🧙‍♂️ Чарівник: Дає 4 Закляття, бере 2 карти з колоди та дає +5 очок сили!";
        else if (card.isIllusionist) baseTitle = "🎭 Ілюзіоніст: Дає 4 карти Ілюзії!";
        else if (card.isIllusion) baseTitle = "🌌 Ілюзія: Беззахисна фантомна карта. Б'ється будь-якою картою і згорає у вічний відбій.";
        else if (card.isBarbarian) baseTitle = "🪓 Варвар (Сила 10): Атакує з силою 10 (потребує 7+ для відбиття) та дає 1 карту Злості!";
        else if (card.isRage) baseTitle = "🔥 Злість: Перетворює карту в руці на Козир та одразу згорає у вічний відбій!";
        else if (card.isCleric) baseTitle = "🕊️ Клірик: Відновлює +10 HP та воскрешає останню карту зі звичайного відбою!";
        else if (card.isRanger) baseTitle = "🏹 Ренджер: Викликає 4 Собак (сила 1) та дає 1 Пастку!";
        else if (card.isHunter) baseTitle = "🎯 Мисливець: Викликає 4 Собак (сила 1) та дає 2 Пастки!";
        else if (card.isTrapper) baseTitle = "⛓️ Траппер: Викликає 4 Собак (сила 1) та дає 4 Пастки!";
        else if (card.isTrap) baseTitle = "🪤 Пастка: Б'є карти силою 10 і нижче у вічний відбій!";
        else if (card.isLeader) baseTitle = "🎖️ Лідер: При атаці викликає 3 додаткові карти '5' своєї масті!";
        else if (card.isCommander) baseTitle = "🏅 Командир: При атаці викликає 3 додаткові карти '7' своєї масті!";
        else if (card.isGeneral) baseTitle = "👑 Полководець: При атаці викликає 3 додаткові карти '9' своєї масті!";
        else if (card.isArchbishop) baseTitle = "⛪ Архієпископ: Дає +6 очок сили, робить карти столу козирями, повертає 4 карти з відбою та змушує всіх пропустити хід!";
        else if (card.isBishop) baseTitle = "🏛️ Єпископ: Дає +4 очка сили, відбиває карту, повертає 3 карти з відбою та змушує всіх пропустити хід!";
        else if (card.isPriest) baseTitle = "⛪ Священик: Дає +2 очка сили, повертає 2 карти з відбою та забирає стіл у руку!";
        else if (card.isPaladin) baseTitle = "⚔️ Паладин: Святий воїн. При атаці знімає обмеження підкидання. При захисті б'є будь-яку карту!";
        else if (card.isAlchemist) baseTitle = "⚗️ Алхімік: Дає 2 козирних Тузи, 2 Золота та 2 Срібла, після чого йде у відбій!";
        else if (card.isHuntsman) baseTitle = "🐺 Псар: При атаці випускає 4 Собаки (сила 1)!";
        else if (card.isDog) baseTitle = "🐕 Бойовий пес (Сила 1): Вірний бойовий собака у броні. Атакує укусом, у відбої згорає у вічний відбій.";
        else if (card.isGambler) baseTitle = "🎰 Гравець: Б'є будь-яку карту і відправляє її разом із собою у вічний відбій.";
        else if (card.isMercenary) baseTitle = "⚔️ Найманець: Б'є будь-яку карту своєї масті та козирі, нижчі за козирного 10.";
        else if (card.isGrandmaster) baseTitle = "♟️ Гросмейстер: Б'є карту та блокує підкидання іншими гравцями.";
        else if (card.isMagister) baseTitle = "🧙‍♂️ Магістр: Абсолютний захисник. Б'є будь-яку карту на столі.";
        else if (card.isThief) baseTitle = "🗡️ Злодій: Б'є карту та блокує подальші атаки у цьому ході.";
        else if (card.isSage) baseTitle = "📜 Мудрець: Універсальна захисна карта високої мудрості.";
        else if (card.isSharper) baseTitle = "🎩 Шулер: Карта обходу захисту та перегрупування.";
        else if (card.isPrincess) baseTitle = "👸 Принцеса: Високородна карта. Відновлює +15 HP при розіграші!";
        else if (card.isPrince) baseTitle = "🤴 Принц: Спадкоємець престолу. Викликає 2 Валетів при розіграші!";
        else if (card.isKabbalist) baseTitle = "📜 Каббаліст: Містик. Дає 2 випадкові закляття!";
        else if (card.isGolem) baseTitle = "🗿 Голем (Сила 15): Кам'яний страж. Надає +30 Захисту (Armor)!";
        else if (card.isInventor) baseTitle = "⚙️ Винахідник: Створює 1 Автоматона або Аніматроніка!";
        else if (card.isAutomaton) baseTitle = "🤖 Автоматон (Сила 12): Сталевий механічний воїн.";
        else if (card.isAnimatronic) baseTitle = "🦊 Аніматронік (Сила 11): Механізований хижак.";
        else if (card.isSummonGhostSpell) baseTitle = "✨ Закляття: Прикликає Привида на стіл!";
        else if (card.isSummonSkeletonsSpell) baseTitle = "✨ Закляття: Прикликає 2 Скелетів!";
        else if (card.isSummonZombiesSpell) baseTitle = "✨ Закляття: Прикликає 2 Зомбі!";
        else if (card.isSummonGolemSpell) baseTitle = "✨ Закляття: Створює Голема!";
        else if (card.isSummonAnimatronicSpell) baseTitle = "✨ Закляття: Створює Аніматроніка!";
        else if (card.isSummonAutomatonSpell) baseTitle = "✨ Закляття: Створює Автоматона!";
        else if (card.isIllusionCopySpell) baseTitle = "✨ Закляття: Створює Ілюзорну копію своєї карти!";
        else if (card.isImmortalitySpell) baseTitle = "✨ Закляття: Надає тимчасове безсмертя та захист!";
        else if (card.isEndTurnSpell) baseTitle = "✨ Закляття: Завершує хід та відправляє карти у відбій!";
        else if (card.isSmeltingSpell) {
            const level = card.smeltingLevel || 1;
            const textMap: Record<number, string> = {
                1: "⚒️ Переплавлення (Рівень 1): Знищує 10 карт з вічного відбою та дає 1 випадкову карту.",
                2: "⚒️ Переплавлення (Рівень 2): Знищує 8 карт з вічного відбою та дає 1 випадкову карту.",
                3: "⚒️ Переплавлення (Рівень 3): Знищує 8 карт з вічного відбою та дає 2 випадкові карти.",
                4: "⚒️ Переплавлення (Рівень 4): Знищує 8 карт з вічного відбою та дає 4 випадкові карти.",
                5: "⚒️ Переплавлення (Рівень 5): Знищує 6 карт з вічного відбою та дає 4 випадкові карти.",
                6: "⚒️ Переплавлення (Рівень 6): Знищує 8 карт з вічного відбою та дає 2 карти Героя.",
                7: "⚒️ Переплавлення (Рівень 7): Знищує 4 карти з вічного відбою та дає 12 карт Золота.",
                8: "⚒️ Переплавлення (Рівень 8): Знищує 24 карти з вічного відбою та дає 1 будь-яку карту на вибір!"
            };
            baseTitle = textMap[level] || `⚒️ Переплавлення (Рівень ${level})`;
        }
        else if (card.isResourceReleaseSpell) {
            const level = card.resourceReleaseLevel || 1;
            const textMap: Record<number, string> = {
                1: "💎 Вивільнення ресурсів (Рівень 1): Знищує 12 карт з вічного відбою та дає +2 очка сили.",
                2: "💎 Вивільнення ресурсів (Рівень 2): Знищує 10 карт з вічного відбою та дає +2 очка сили.",
                3: "💎 Вивільнення ресурсів (Рівень 3): Знищує 8 карт з вічного відбою та дає +2 очка сили.",
                4: "💎 Вивільнення ресурсів (Рівень 4): Знищує 8 карт з вічного відбою та дає +4 очка сили.",
                5: "💎 Вивільнення ресурсів (Рівень 5): Знищує 6 карт з вічного відбою та дає +4 очка сили.",
                6: "💎 Вивільнення ресурсів (Рівень 6): Знищує 6 карт з вічного відбою та дає +5 очок сили.",
                7: "💎 Вивільнення ресурсів (Рівень 7): Знищує 6 карт з вічного відбою та дає +6 очок сили."
            };
            baseTitle = textMap[level] || `💎 Вивільнення ресурсів (Рівень ${level})`;
        }
        else {
            const suitName = card.suit === '♠' ? 'Піка' : card.suit === '♣' ? 'Хреста' : card.suit === '♥' ? 'Чирва' : card.suit === '♦' ? 'Бубна' : card.suit;
            if (card.rank === 'A') baseTitle = `👑 Туз ${suitName}: Найвища базова карта масті (Сила 14). Б'є всі звичайні карти цієї масті.`;
            else if (card.rank === 'K') baseTitle = `🤴 Король ${suitName}: Старша карта масті (Сила 13).`;
            else if (card.rank === 'Q') baseTitle = `👸 Дама ${suitName}: Старша карта масті (Сила 12).`;
            else if (card.rank === 'J') baseTitle = `🗡️ Валет ${suitName}: Фігурна карта (Сила 11).`;
            else if (card.rank === 'N') baseTitle = `🛡️ Лицар ${suitName}: Лицарська карта. При ході закликає 2 Валетів та 4 '10'.`;
            else if (card.rank === '10') baseTitle = `🛡️ Десятник ${suitName} (Сила 10): Старший воїн.`;
            else if (card.rank === '9') baseTitle = `🏹 Стрілець ${suitName} (Сила 9): Влучний стрілець.`;
            else if (card.rank === '8') baseTitle = `🏹 Лучник ${suitName} (Сила 8): Королівський лучник.`;
            else if (card.rank === '7') baseTitle = `🪓 Алебардник ${suitName} (Сила 7): Важкий піхотинець з алебардою.`;
            else if (card.rank === '6') baseTitle = `⚔️ Піхотинець ${suitName} (Сила 6): Лінійний солдат гвардії.`;
            else if (card.rank === '5') baseTitle = `🎯 Арбалетник ${suitName} (Сила 5): Стрілець з бронебійним арбалетом.`;
            else if (card.rank === '4') baseTitle = `🗡️ Розвідник ${suitName} (Сила 4): Швидкий розвідник авангарду.`;
            else if (card.rank === '3') baseTitle = `🛡️ Вартовий ${suitName} (Сила 3): Вартовий замку та стін.`;
            else if (card.rank === '2') baseTitle = `🌾 Ополченець ${suitName} (Сила 2): Міський ополченець з вилами та щитом.`;
            else if (card.rank === '1') baseTitle = `🗡️ Рекрут ${suitName} (Сила 1): Новобранець.`;
            else if (card.rank === '0') baseTitle = `🃏 Шут ${suitName} (Сила 0): Блазень.`;
            else if (['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'].includes(card.rank)) {
                baseTitle = `🔮 Козирне Таро (${card.rank}): Старший Аркан! Має силу козиря (${card.value ?? ''}).`;
            } else {
                baseTitle = `🎴 Карта ${card.rank} ${suitName}: Базова карта (Сила: ${card.value ?? 0}).`;
            }
        }

        if (card.strengthBonus && card.strengthBonus > 0) {
            baseTitle = `[⚔️ Бонус сили +${card.strengthBonus}] ${baseTitle}`;
        }

        if (card.isEmpowered) {
            return `⚡ Посилена карта (Надано силу козиря!)\n${baseTitle}`;
        }
        return baseTitle;
    };

    return (
        <motion.div 
            layoutId={layoutId}
            onClick={onClick}
            title={getCardTitle()}
            className={`w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-xl border-[1.5px] border-[#9c783e] shadow-lg flex flex-col justify-between p-1 select-none relative overflow-hidden bg-[#faf4e6] ${colorClass} ${
                card.isEmpowered ? 'ring-2 ring-amber-400 border-amber-500 shadow-amber-300/60' : ''
            } ${className}`}
            style={{
                backgroundImage: 'radial-gradient(ellipse at 50% 30%, #fefcf7 0%, #faf3e3 55%, #eeddb8 100%)',
            }}
        >
            {/* Ornate Inner Double Frame */}
            <div className="absolute inset-[3px] border border-[#a88242]/40 rounded-lg pointer-events-none z-10" />
            <div className="absolute inset-[5px] border border-[#c5a059]/25 rounded-[7px] pointer-events-none z-10" />

            {/* Corner Filigree Ornaments */}
            <div className="absolute top-0.5 left-0.5 z-10"><CornerFiligree position="tl" /></div>
            <div className="absolute top-0.5 right-0.5 z-10"><CornerFiligree position="tr" /></div>
            <div className="absolute bottom-0.5 left-0.5 z-10"><CornerFiligree position="bl" /></div>
            <div className="absolute bottom-0.5 right-0.5 z-10"><CornerFiligree position="br" /></div>

            {/* Top Right Solar Sigil / Heraldic Cross Emblem */}
            <div className="absolute top-1 right-1 z-10 opacity-75">
                <SunSigil className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#925c19]" />
            </div>

            {/* Top Left Index / Medallion */}
            <div className="flex justify-between items-start w-full relative z-20 pl-0.5 pt-0.5">
                <div className="flex flex-col items-center leading-none">
                    <span className="text-[11px] sm:text-xs md:text-sm font-cinzel font-black tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                        {displayRank}
                    </span>
                    <span className="text-[9px] sm:text-[11px] md:text-xs leading-none drop-shadow-sm -mt-0.5">
                        {displaySuit}
                    </span>
                </div>
            </div>

            {/* Center Area: Pixel Art Character Art or Ornate Heraldic Medallion */}
            {customArtwork ? (
                <div className="absolute inset-[6px] z-0 overflow-hidden rounded-md flex items-center justify-center bg-black/10 border border-[#b8860b]/30">
                    <img 
                        src={customArtwork} 
                        alt="Card Artwork" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center opacity-95 hover:opacity-100 transition-opacity drop-shadow-sm"
                        style={{ imageRendering: 'auto' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140c06]/60 via-transparent to-[#140c06]/20 pointer-events-none" />
                </div>
            ) : isNoble ? (() => {
                const portrait = getNoblePortraitData(card.rank);
                return (
                    <div className="self-center flex flex-col items-center justify-center my-auto relative z-10">
                        {portrait ? (
                            <div className="flex flex-col items-center">
                                {/* Medieval Oval Medallion Frame */}
                                <div className={`w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full border-[1.5px] ${portrait.borderColor} shadow-md flex items-center justify-center text-base sm:text-lg md:text-2xl relative overflow-visible bg-gradient-to-tr ${portrait.bgGradient} ring-1 ring-amber-700/30`}>
                                    <span className="drop-shadow-md transform hover:scale-110 transition-transform">
                                        {portrait.icon}
                                    </span>
                                    {/* Stat / Role Badge */}
                                    <span className="absolute -top-1 -left-1 text-[8px] sm:text-[10px] bg-[#291d10] text-[#f7e4a8] font-cinzel font-bold rounded-full min-w-3.5 h-3.5 px-0.5 flex items-center justify-center shadow-md border border-[#c5a059]/60">
                                        {portrait.badge}
                                    </span>
                                    {/* Suit Pip */}
                                    <span className="absolute -bottom-1 -right-1 text-[9px] sm:text-xs bg-[#fdfaf3] text-[#332211] rounded-full px-0.5 shadow-md border border-[#b89047]/60">
                                        {displaySuit}
                                    </span>
                                </div>
                                {/* Ukrainian Character Banner Name */}
                                <div className="mt-0.5 max-w-[56px] sm:max-w-[72px] md:max-w-[84px] text-center">
                                    <span className="text-[7.5px] sm:text-[9px] md:text-[10px] font-cinzel font-bold text-[#442c11] leading-tight block truncate uppercase tracking-tighter bg-[#f0e2be]/70 px-1 rounded-sm border border-[#c5a059]/30">
                                        {portrait.label}
                                    </span>
                                </div>
                                {card.isCustomHeroCard && (
                                    <div className="mt-0.5 text-center">
                                        <span className={`text-[6.5px] sm:text-[7.5px] font-bold px-1 py-0.2 rounded-sm border ${((card.heroCondition ?? 10) <= 3) ? 'bg-rose-950/90 text-rose-200 border-rose-500' : 'bg-[#1a120b]/90 text-amber-200 border-amber-600/50'}`}>
                                            🛡️ {card.heroCondition ?? 10}/10
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                );
            })() : isTarot ? (
                <div className="self-center flex flex-col items-center justify-center text-center px-0.5 my-auto relative z-10">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-purple-800/40 bg-purple-100/60 flex items-center justify-center shadow-inner mb-0.5">
                        <span className="text-base sm:text-xl drop-shadow-sm">🔮</span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-cinzel font-bold leading-tight text-[#4c1d95] line-clamp-2 uppercase">
                        {card.rank.includes('(') ? card.rank.split('(')[1].replace(')', '') : card.rank}
                    </span>
                </div>
            ) : (
                /* Regular Number Card: Heraldic Pip arrangement with subtle filigree pattern */
                <div className="self-center flex flex-col items-center justify-center my-auto relative z-10">
                    <div className="text-2xl sm:text-3xl md:text-4xl drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] transform hover:scale-105 transition-transform">
                        {displaySuit}
                    </div>
                </div>
            )}

            {/* Bottom Right Index / Inset */}
            <div className="flex justify-between items-end w-full relative z-20 pr-0.5 pb-0.5 rotate-180">
                <div className="flex flex-col items-center leading-none">
                    <span className="text-[11px] sm:text-xs md:text-sm font-cinzel font-black tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                        {displayRank}
                    </span>
                    <span className="text-[9px] sm:text-[11px] md:text-xs leading-none drop-shadow-sm -mt-0.5">
                        {displaySuit}
                    </span>
                </div>
            </div>

            {/* Empowered Overlay Badge */}
            {card.isEmpowered && (
                <div className="absolute inset-x-0 bottom-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-[#1a0f02] font-cinzel font-black text-[8px] sm:text-[9px] py-0.5 text-center shadow-lg z-30 uppercase tracking-widest border-y border-amber-200/90">
                    ⚡ КОЗИР
                </div>
            )}

            {/* Active Strength Bonus Badge */}
            {card.strengthBonus && card.strengthBonus > 0 && !card.isEmpowered && (
                <div className="absolute inset-x-0 bottom-1 bg-gradient-to-r from-red-800 via-amber-600 to-red-800 text-white font-cinzel font-black text-[7.5px] sm:text-[8.5px] py-0.5 text-center shadow-lg z-30 uppercase tracking-wider border-y border-yellow-300/80 animate-pulse">
                    ⚔️ +{card.strengthBonus} СИЛА
                </div>
            )}
        </motion.div>
    );
};

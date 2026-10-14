import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData, WorldProgress, RpgArmyCheckersSquad, RpgSquadFighter } from '../types';
import { 
    createStarterRpgSquads, 
    createEnemyRpgSquads, 
    addExpToRpgFighter,
    calculateRpgFighterLevel,
    getRpgNextLevelExpThreshold,
    getBaseFighterStats,
    getRpgFighterSpells,
    RpgSpell
} from '../lib/rpgArmyCheckersData';
import { 
    calculatePhysicalDamage, 
    calculateMagicDamage, 
    calculateHealing, 
    calculateInitiative 
} from '../lib/jrpgCombatEngine';
import { 
    playSwordClashSound, 
    playSparkleSound, 
    playPunchSound, 
    playGoldSound, 
    playLevelUpSound 
} from '../lib/soundEffects';
import { 
    X, 
    Swords, 
    Crown, 
    Shield, 
    Sparkles, 
    Heart, 
    Zap, 
    AlertTriangle, 
    Trophy, 
    ShoppingBag, 
    HelpCircle,
    RotateCcw
} from 'lucide-react';

interface RpgArmyCheckersModalProps {
    isOpen: boolean;
    onClose: () => void;
    opponent: OpponentData;
    tavernName: string;
    progress: WorldProgress;
    onUpdateProgress: (updated: WorldProgress) => void;
    onVictory: (updated: WorldProgress) => void;
    onDefeat: (updated: WorldProgress) => void;
    onOpenToyShop?: () => void;
}

// Strategic checker board piece representation
interface StrategicPiece {
    id: string;
    side: 'player' | 'ai';
    row: number;
    col: number;
    isKing: boolean;
    squad: RpgArmyCheckersSquad;
}

// Combat Item Interface
interface CombatItem {
    id: string;
    name: string;
    count: number;
    effect: 'heal_hp' | 'heal_mp';
    power: number;
    description: string;
}

// Combatant in Tactical Battle (G29 Fantasy Adventure)
interface TacticalCombatant {
    id: string;
    name: string;
    role: 'warrior_1' | 'warrior_2' | 'mage' | 'cleric';
    spriteType: 'fighter' | 'thief' | 'white_mage' | 'black_mage' | 'imp' | 'guardian';
    isEnemy: boolean;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    damage: number;
    defense: number;
    isAlive: boolean;
    spells: RpgSpell[];
    stats: {
        str: number;
        agi: number;
        vit: number;
        int: number;
        mnd: number;
        lck: number;
    };
    originalFighterRef?: RpgSquadFighter;
}

// Queued Hero Action
interface QueuedHeroAction {
    actorId: string;
    type: 'fight' | 'magic' | 'drink' | 'item' | 'run';
    targetId: string;
    spell?: RpgSpell;
    item?: CombatItem;
}

// -----------------------------------------------------------------------
// 8-bit Hero Sprites (adapted from FantasyAdventureModal)
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// 8-bit Hero Sprites (matching NES Final Fantasy / G29 Fantasy Adventure)
const PixelImpSprite = ({ isAttacking, isHit, isDead }: { isAttacking?: boolean; isHit?: boolean; isDead?: boolean }) => {
    return (
        <div className={`w-12 h-14 flex items-center justify-center text-3xl select-none ${isAttacking ? 'scale-125' : ''} ${isHit ? 'brightness-150 animate-pulse' : ''} ${isDead ? 'opacity-40' : ''}`}>
            👿
        </div>
    );
};

// -----------------------------------------------------------------------
// Guardian Sprite Assets & Component (Authentic Animated Sprite from /guardian/)
// -----------------------------------------------------------------------
const GUARDIAN_IDLE_SRC = '/assets/guardian/guardian.png';

const GUARDIAN_FIGHT_FRAMES = [
    '/assets/guardian/guardianfight/frame_001.png',
    '/assets/guardian/guardianfight/frame_002.png',
    '/assets/guardian/guardianfight/frame_003.png',
    '/assets/guardian/guardianfight/frame_004.png'
];

const GUARDIAN_WOUND_FRAMES = [
    '/assets/guardian/guardianWound/frame_001.png',
    '/assets/guardian/guardianWound/frame_002.png'
];

const GUARDIAN_DEATH_FRAMES = [
    '/assets/guardian/guardianDeath/frame_001.png',
    '/assets/guardian/guardianDeath/frame_002.png',
    '/assets/guardian/guardianDeath/frame_003.png',
    '/assets/guardian/guardianDeath/frame_004.png'
];

const ALL_GUARDIAN_FRAMES = [
    GUARDIAN_IDLE_SRC,
    ...GUARDIAN_FIGHT_FRAMES,
    ...GUARDIAN_WOUND_FRAMES,
    ...GUARDIAN_DEATH_FRAMES
];

export const GuardianSprite: React.FC<{
    isAttacking?: boolean;
    isHit?: boolean;
    isDead?: boolean;
    isEnemy?: boolean;
    className?: string;
}> = ({ 
    isAttacking = false, 
    isHit = false, 
    isDead = false, 
    isEnemy = false,
    className = ''
}) => {
    const [fightFrame, setFightFrame] = useState(0);
    const [woundFrame, setWoundFrame] = useState(0);
    const [deathFrame, setDeathFrame] = useState(isDead ? 3 : 0);

    // Preload all frames on mount
    useEffect(() => {
        ALL_GUARDIAN_FRAMES.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    // Fight animation cycle (4 frames, ~120ms per frame)
    useEffect(() => {
        if (!isAttacking) {
            setFightFrame(0);
            return;
        }
        setFightFrame(0);
        const t1 = setTimeout(() => setFightFrame(1), 120);
        const t2 = setTimeout(() => setFightFrame(2), 240);
        const t3 = setTimeout(() => setFightFrame(3), 360);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [isAttacking]);

    // Wound animation cycle (2 frames alternating while isHit is active)
    useEffect(() => {
        if (!isHit) {
            setWoundFrame(0);
            return;
        }
        setWoundFrame(0);
        const interval = setInterval(() => {
            setWoundFrame(prev => (prev === 0 ? 1 : 0));
        }, 130);
        return () => clearInterval(interval);
    }, [isHit]);

    // Death animation cycle (4 frames falling to the ground)
    useEffect(() => {
        if (!isDead) {
            setDeathFrame(0);
            return;
        }
        const t1 = setTimeout(() => setDeathFrame(1), 120);
        const t2 = setTimeout(() => setDeathFrame(2), 240);
        const t3 = setTimeout(() => setDeathFrame(3), 360);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [isDead]);

    let currentSrc = GUARDIAN_IDLE_SRC;
    if (isDead) {
        currentSrc = GUARDIAN_DEATH_FRAMES[deathFrame] || GUARDIAN_DEATH_FRAMES[3];
    } else if (isHit) {
        currentSrc = GUARDIAN_WOUND_FRAMES[woundFrame] || GUARDIAN_WOUND_FRAMES[0];
    } else if (isAttacking) {
        currentSrc = GUARDIAN_FIGHT_FRAMES[fightFrame] || GUARDIAN_FIGHT_FRAMES[0];
    }

    // Direction and positioning:
    // Enemies are on the left side (x=0) and should face right (towards heroes) -> scale-x-[-1]
    // Heroes are on the right side (x=max) and should face left (towards enemies) -> no flip needed (or vice versa if natural faces right)
    const directionClass = isEnemy ? '' : 'scale-x-[-1]';
    const lungeClass = isAttacking 
        ? isEnemy 
            ? 'translate-x-8 scale-110 drop-shadow-[0_0_12px_#ff4444]' 
            : '-translate-x-8 scale-110 drop-shadow-[0_0_12px_#ffffff]'
        : '';
    const hitClass = isHit 
        ? isEnemy 
            ? '-translate-x-2 brightness-150 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]' 
            : 'translate-x-2 brightness-150 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]' 
        : '';
    const deadClass = isDead ? 'opacity-70 scale-95' : '';

    return (
        <div className={`relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition-transform duration-200 ${directionClass} ${lungeClass} ${hitClass} ${deadClass} ${className}`}>
            <img 
                src={currentSrc} 
                alt="Гвардієць" 
                className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] pointer-events-none select-none"
            />
        </div>
    );
};

// -----------------------------------------------------------------------
const PixelHeroSprite = ({ 
    type, 
    isAttacking = false, 
    isHit = false, 
    isDead = false,
    isEnemy = false
}: { 
    type: 'fighter' | 'thief' | 'white_mage' | 'black_mage' | 'imp' | 'guardian'; 
    isAttacking?: boolean; 
    isHit?: boolean; 
    isDead?: boolean; 
    isEnemy?: boolean;
}) => {
    if (type === 'guardian') {
        return (
            <GuardianSprite 
                isAttacking={isAttacking} 
                isHit={isHit} 
                isDead={isDead} 
                isEnemy={isEnemy} 
            />
        );
    }

    if (isDead) {
        return (
            <div className="w-12 h-14 flex items-center justify-center opacity-60">
                <span className="text-2xl">🪦</span>
            </div>
        );
    }

    if (type === 'imp') {
        return <PixelImpSprite isAttacking={isAttacking} isHit={isHit} isDead={isDead} />;
    }

    const directionClass = isEnemy ? '' : 'scale-x-[-1]';
    const lungeClass = isAttacking 
        ? isEnemy ? 'translate-x-8 scale-110 drop-shadow-[0_0_8px_#ff4444]' : '-translate-x-8 scale-110 drop-shadow-[0_0_8px_#ffffff]'
        : '';

    return (
        <div className={`relative w-12 h-14 transition-all duration-200 ${directionClass} ${lungeClass} ${
            isHit ? 'brightness-150 translate-x-2 bg-red-600/30 rounded' : ''
        }`}>
            {type === 'fighter' && (
                <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" shapeRendering="crispEdges">
                    <rect x="8" y="2" width="7" height="4" fill="#a02010" />
                    <rect x="9" y="3" width="5" height="3" fill="#e03020" />
                    <rect x="9" y="6" width="5" height="4" fill="#fcd0a1" />
                    <rect x="12" y="7" width="1" height="1" fill="#000" />
                    <rect x="8" y="10" width="8" height="8" fill="#c02010" />
                    <rect x="9" y="11" width="6" height="6" fill="#f03828" />
                    <rect x="7" y="11" width="2" height="4" fill="#801008" />
                    <rect x="4" y="8" width="2" height="12" fill="#d0d8e8" />
                    <rect x="3" y="14" width="4" height="2" fill="#e8c040" />
                    <rect x="4" y="16" width="2" height="3" fill="#503020" />
                    <rect x="9" y="18" width="3" height="8" fill="#901008" />
                    <rect x="13" y="18" width="3" height="8" fill="#901008" />
                    <rect x="8" y="24" width="4" height="3" fill="#402010" />
                    <rect x="13" y="24" width="4" height="3" fill="#402010" />
                </svg>
            )}

            {type === 'thief' && (
                <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" shapeRendering="crispEdges">
                    <rect x="8" y="2" width="7" height="4" fill="#50a0d0" />
                    <rect x="8" y="4" width="7" height="2" fill="#70c0f0" />
                    <rect x="9" y="6" width="5" height="4" fill="#fcd0a1" />
                    <rect x="12" y="7" width="1" height="1" fill="#000" />
                    <rect x="8" y="10" width="8" height="8" fill="#3080b0" />
                    <rect x="9" y="11" width="6" height="6" fill="#4aa0d8" />
                    <rect x="8" y="15" width="8" height="2" fill="#f0d040" />
                    <rect x="9" y="18" width="3" height="8" fill="#205080" />
                    <rect x="13" y="18" width="3" height="8" fill="#205080" />
                    <rect x="8" y="24" width="4" height="3" fill="#303030" />
                    <rect x="13" y="24" width="4" height="3" fill="#303030" />
                </svg>
            )}

            {type === 'white_mage' && (
                <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" shapeRendering="crispEdges">
                    <rect x="8" y="2" width="8" height="8" fill="#ffffff" />
                    <rect x="7" y="3" width="2" height="7" fill="#e82020" />
                    <rect x="15" y="3" width="2" height="7" fill="#e82020" />
                    <rect x="10" y="5" width="4" height="4" fill="#fcd0a1" />
                    <rect x="12" y="6" width="1" height="1" fill="#000" />
                    <rect x="7" y="10" width="10" height="14" fill="#ffffff" />
                    <rect x="8" y="12" width="8" height="10" fill="#f4f4f4" />
                    <rect x="7" y="20" width="2" height="3" fill="#e82020" />
                    <rect x="11" y="20" width="2" height="3" fill="#e82020" />
                    <rect x="15" y="20" width="2" height="3" fill="#e82020" />
                    <rect x="4" y="6" width="2" height="20" fill="#b07040" />
                    <circle cx="5" cy="6" r="2" fill="#ffd040" />
                </svg>
            )}

            {type === 'black_mage' && (
                <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" shapeRendering="crispEdges">
                    <polygon points="12,1 7,8 17,8" fill="#e0b820" />
                    <rect x="6" y="7" width="12" height="2" fill="#f8d830" />
                    <rect x="8" y="9" width="8" height="5" fill="#181820" />
                    <rect x="10" y="10" width="2" height="1" fill="#fff840" />
                    <rect x="14" y="10" width="2" height="1" fill="#fff840" />
                    <rect x="7" y="14" width="10" height="11" fill="#2040b0" />
                    <rect x="8" y="15" width="8" height="9" fill="#3060d8" />
                    <rect x="4" y="8" width="2" height="18" fill="#805030" />
                    <circle cx="5" cy="8" r="2" fill="#ff4020" />
                </svg>
            )}
        </div>
    );
};

export function RpgArmyCheckersModal({
    isOpen,
    onClose,
    opponent,
    tavernName,
    progress,
    onUpdateProgress,
    onVictory,
    onDefeat,
    onOpenToyShop
}: RpgArmyCheckersModalProps) {
    if (!isOpen) return null;

    // Check if player has RPG squads in progress; if not, create starter set
    const playerInitialSquads = useRef<RpgArmyCheckersSquad[]>(() => {
        if (progress.rpgArmyCheckersSquads && progress.rpgArmyCheckersSquads.length === 12) {
            const starter = createStarterRpgSquads();
            return progress.rpgArmyCheckersSquads.map((sq, sqIdx) => {
                const baseSquad = starter[sqIdx] || starter[0];
                const fighters = (sq.fighters && sq.fighters.length === 4)
                    ? sq.fighters.map((f, fIdx) => {
                        const fallbackF = baseSquad.fighters[fIdx] || baseSquad.fighters[0];
                        const baseStats = getBaseFighterStats(f.role || fallbackF.role);
                        const maxHp = typeof f.maxHp === 'number' && !isNaN(f.maxHp) && f.maxHp > 0 ? f.maxHp : baseStats.maxHp;
                        const curHp = typeof f.currentHp === 'number' && !isNaN(f.currentHp) ? f.currentHp : maxHp;
                        return {
                            ...fallbackF,
                            ...f,
                            role: f.role || fallbackF.role,
                            level: typeof f.level === 'number' && !isNaN(f.level) ? f.level : 0,
                            experience: typeof f.experience === 'number' && !isNaN(f.experience) ? f.experience : 0,
                            maxHp,
                            currentHp: curHp,
                            maxMp: typeof f.maxMp === 'number' && !isNaN(f.maxMp) ? f.maxMp : baseStats.maxMp,
                            currentMp: typeof f.currentMp === 'number' && !isNaN(f.currentMp) ? f.currentMp : baseStats.maxMp,
                            damage: typeof f.damage === 'number' && !isNaN(f.damage) ? f.damage : baseStats.damage,
                            defense: typeof f.defense === 'number' && !isNaN(f.defense) ? f.defense : baseStats.defense,
                            bonusHp: typeof f.bonusHp === 'number' && !isNaN(f.bonusHp) ? f.bonusHp : 0,
                            bonusDamage: typeof f.bonusDamage === 'number' && !isNaN(f.bonusDamage) ? f.bonusDamage : 0,
                            bonusDefense: typeof f.bonusDefense === 'number' && !isNaN(f.bonusDefense) ? f.bonusDefense : 0,
                            statPointsAvailable: typeof f.statPointsAvailable === 'number' && !isNaN(f.statPointsAvailable) ? f.statPointsAvailable : 0,
                            isDead: Boolean(f.isDead)
                        };
                    })
                    : baseSquad.fighters;

                return {
                    ...baseSquad,
                    ...sq,
                    fighters
                };
            });
        }
        return createStarterRpgSquads();
    }).current();

    // Strategic Board Pieces
    const [pieces, setPieces] = useState<StrategicPiece[]>(() => {
        const boardPieces: StrategicPiece[] = [];
        const enemySquads = createEnemyRpgSquads(opponent.name, opponent.difficulty || 1);

        // AI pieces: rows 0, 1, 2 on dark squares (r + c is odd)
        let aiIdx = 0;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1 && aiIdx < 12) {
                    boardPieces.push({
                        id: `ai_${aiIdx}`,
                        side: 'ai',
                        row: r,
                        col: c,
                        isKing: false,
                        squad: enemySquads[aiIdx] || enemySquads[0]
                    });
                    aiIdx++;
                }
            }
        }

        // Player pieces: rows 5, 6, 7 on dark squares (r + c is odd)
        let playerIdx = 0;
        for (let r = 5; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1 && playerIdx < 12) {
                    boardPieces.push({
                        id: `player_${playerIdx}`,
                        side: 'player',
                        row: r,
                        col: c,
                        isKing: false,
                        squad: playerInitialSquads[playerIdx] || playerInitialSquads[0]
                    });
                    playerIdx++;
                }
            }
        }

        return boardPieces;
    });

    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [currentTurn, setCurrentTurn] = useState<'player' | 'ai'>('player');
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
    const [combatLog, setCombatLog] = useState<string[]>([
        '⚔️ Розпочато «Рольові армійські шашки»! 12 загонів на 8х8 дошці.',
        'ℹ️ Кожен загін має 4 бійців: 2 воїни, 1 маг і 1 клірик. Загиблі під час бою вибувають до кінця гри!'
    ]);

    // Active Tactical G29 Fantasy Adventure Battle State
    interface ActiveBattleState {
        attackerPieceId: string;
        defenderPieceId: string;
        targetRow: number;
        targetCol: number;
        isJump: boolean;
        attackerSquad: RpgArmyCheckersSquad;
        defenderSquad: RpgArmyCheckersSquad;
        attackerSide: 'player' | 'ai';
        // Party & Enemies
        party: TacticalCombatant[];
        enemies: TacticalCombatant[];
        items: CombatItem[];
        // Combat Flow (matching FantasyAdventureModal)
        combatPhase: 'command' | 'resolving' | 'victory' | 'defeat';
        activeHeroIdx: number;
        pendingCommands: QueuedHeroAction[];
        menuView: 'main' | 'target_enemy' | 'magic' | 'item' | 'target_ally';
        mainCursor: 'fight' | 'run' | 'magic' | 'drink' | 'item';
        selectedEnemyTargetIdx: number;
        selectedSpell: RpgSpell | null;
        selectedItem: CombatItem | null;
        // Visuals
        logTargetName: string;
        logAction: string;
        logResult: string;
        attackingHeroId: string | null;
        attackingEnemyId: string | null;
        hitHeroId: string | null;
        hitEnemyId: string | null;
        floatingDamage: { id: string; text: string; isEnemy: boolean } | null;
    }

    const [activeBattle, setActiveBattle] = useState<ActiveBattleState | null>(null);

    // Add message to global log
    const addLog = (msg: string) => {
        setCombatLog(prev => [msg, ...prev].slice(0, 30));
    };

    // Calculate valid moves on checkers board
    const getValidMovesForPiece = (piece: StrategicPiece, allPieces: StrategicPiece[]) => {
        const moves: { r: number; c: number; isJump: boolean; victimPiece?: StrategicPiece }[] = [];
        const forwardDir = piece.side === 'player' ? -1 : 1;
        const dirs = piece.isKing 
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] 
            : [[forwardDir, -1], [forwardDir, 1]];

        dirs.forEach(([dr, dc]) => {
            const nr = piece.row + dr;
            const nc = piece.col + dc;

            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const occ = allPieces.find(p => p.row === nr && p.col === nc);
                if (!occ) {
                    moves.push({ r: nr, c: nc, isJump: false });
                } else if (occ.side !== piece.side) {
                    // Check jump capture
                    const jnr = nr + dr;
                    const jnc = nc + dc;
                    if (jnr >= 0 && jnr < 8 && jnc >= 0 && jnc < 8) {
                        const jumpOcc = allPieces.find(p => p.row === jnr && p.col === jnc);
                        if (!jumpOcc) {
                            moves.push({ r: jnr, c: jnc, isJump: true, victimPiece: occ });
                        }
                    }
                }
            }
        });

        // Mandatory jump rule: if ANY jump is possible for this piece, prioritize jumps
        const jumps = moves.filter(m => m.isJump);
        if (jumps.length > 0) return jumps;

        return moves;
    };

    // -------------------------------------------------------------------
    // START TACTICAL G29 BATTLE (Turn-based NES Final Fantasy 1 style)
    // -------------------------------------------------------------------
    const startTacticalBattle = (
        attacker: StrategicPiece, 
        defender: StrategicPiece, 
        targetRow: number, 
        targetCol: number, 
        isJump: boolean
    ) => {
        playSwordClashSound();
        addLog(`⚔️ Бій G29! «${attacker.squad.name}» атакує «${defender.squad.name}»!`);

        const isPlayerAttacking = attacker.side === 'player';
        const playerSquad = isPlayerAttacking ? attacker.squad : defender.squad;
        const enemySquad = isPlayerAttacking ? defender.squad : attacker.squad;

        // Build 4 Heroes from player squad (Warrior 1, Warrior 2, Cleric, Mage)
        const party: TacticalCombatant[] = (playerSquad.fighters || []).map((fighter, idx) => {
            const role = fighter.role || (idx === 0 ? 'warrior_1' : idx === 1 ? 'warrior_2' : idx === 2 ? 'mage' : 'cleric');
            const baseStats = getBaseFighterStats(role);
            const level = typeof fighter.level === 'number' && !isNaN(fighter.level) ? fighter.level : 0;
            const spells = getRpgFighterSpells(role, level);

            let spriteType: 'fighter' | 'thief' | 'white_mage' | 'black_mage' | 'guardian' = 'fighter';
            if (role === 'warrior_2' || fighter.name.toLowerCase().includes('гварді') || fighter.name.toLowerCase().includes('guard')) {
                spriteType = 'guardian';
            } else if (role === 'cleric') {
                spriteType = 'white_mage';
            } else if (role === 'mage') {
                spriteType = 'black_mage';
            }

            const maxHp = typeof fighter.maxHp === 'number' && !isNaN(fighter.maxHp) && fighter.maxHp > 0 ? fighter.maxHp : baseStats.maxHp;
            const curHp = typeof fighter.currentHp === 'number' && !isNaN(fighter.currentHp) ? Math.min(maxHp, fighter.currentHp) : maxHp;
            const isAlive = !fighter.isDead && curHp > 0;

            const maxMp = typeof fighter.maxMp === 'number' && !isNaN(fighter.maxMp) ? fighter.maxMp : (role === 'mage' ? 20 : role === 'cleric' ? 16 : 0);
            const mp = typeof fighter.currentMp === 'number' && !isNaN(fighter.currentMp) ? Math.min(maxMp, fighter.currentMp) : maxMp;

            const damage = typeof fighter.damage === 'number' && !isNaN(fighter.damage) ? fighter.damage : baseStats.damage;
            const defense = typeof fighter.defense === 'number' && !isNaN(fighter.defense) ? fighter.defense : baseStats.defense;

            return {
                id: fighter.id || `p_fighter_${idx}`,
                name: (fighter.name || baseStats.name).split(' ')[0] || `ГЕРОЙ ${idx + 1}`,
                role,
                spriteType,
                isEnemy: false,
                hp: curHp,
                maxHp,
                mp,
                maxMp,
                damage,
                defense,
                isAlive,
                spells,
                stats: {
                    str: role.startsWith('warrior') ? 12 + level * 2 : 4,
                    agi: role === 'warrior_2' ? 11 + level : 8 + level,
                    vit: role.startsWith('warrior') ? 10 + level * 2 : 6,
                    int: role === 'mage' ? 15 + level * 3 : 4,
                    mnd: role === 'cleric' ? 14 + level * 3 : 4,
                    lck: 7 + level
                },
                originalFighterRef: fighter
            };
        });

        // Build 4 Enemies from enemy squad (2 Warriors, 1 Mage, 1 Cleric)
        const enemies: TacticalCombatant[] = (enemySquad.fighters || []).map((fighter, idx) => {
            const role = fighter.role || (idx === 0 ? 'warrior_1' : idx === 1 ? 'warrior_2' : idx === 2 ? 'mage' : 'cleric');
            const baseStats = getBaseFighterStats(role);
            const level = typeof fighter.level === 'number' && !isNaN(fighter.level) ? fighter.level : 0;
            const spells = getRpgFighterSpells(role, level);

            let spriteType: 'fighter' | 'thief' | 'white_mage' | 'black_mage' | 'guardian' = 'fighter';
            if (role === 'warrior_2' || fighter.name.toLowerCase().includes('гварді') || fighter.name.toLowerCase().includes('guard')) {
                spriteType = 'guardian';
            } else if (role === 'cleric') {
                spriteType = 'white_mage';
            } else if (role === 'mage') {
                spriteType = 'black_mage';
            }

            const maxHp = typeof fighter.maxHp === 'number' && !isNaN(fighter.maxHp) && fighter.maxHp > 0 ? fighter.maxHp : baseStats.maxHp;
            const curHp = typeof fighter.currentHp === 'number' && !isNaN(fighter.currentHp) ? Math.min(maxHp, fighter.currentHp) : maxHp;
            const isAlive = !fighter.isDead && curHp > 0;

            const maxMp = typeof fighter.maxMp === 'number' && !isNaN(fighter.maxMp) ? fighter.maxMp : (role === 'mage' ? 20 : role === 'cleric' ? 16 : 0);
            const mp = typeof fighter.currentMp === 'number' && !isNaN(fighter.currentMp) ? Math.min(maxMp, fighter.currentMp) : maxMp;

            const damage = typeof fighter.damage === 'number' && !isNaN(fighter.damage) ? fighter.damage : baseStats.damage;
            const defense = typeof fighter.defense === 'number' && !isNaN(fighter.defense) ? fighter.defense : baseStats.defense;

            let name = fighter.name || baseStats.name;
            if (!name || name.startsWith('rpg_')) {
                if (role === 'warrior_1') name = 'ВОЇН МЕЧ I';
                else if (role === 'warrior_2') name = 'ВОЇН ЩИТ II';
                else if (role === 'mage') name = 'ТЕМНИЙ МАГ';
                else if (role === 'cleric') name = 'ТЕМНИЙ КЛІРИК';
            }

            return {
                id: fighter.id || `e_fighter_${idx}`,
                name,
                role,
                spriteType,
                isEnemy: true,
                hp: curHp,
                maxHp,
                mp,
                maxMp,
                damage,
                defense,
                isAlive,
                spells,
                stats: {
                    str: role.startsWith('warrior') ? 10 + level * 2 : 4,
                    agi: 8 + level,
                    vit: 7 + level,
                    int: role === 'mage' ? 13 + level * 2 : 3,
                    mnd: role === 'cleric' ? 12 + level * 2 : 3,
                    lck: 5
                },
                originalFighterRef: fighter
            };
        });

        const items: CombatItem[] = [
            { id: 'potion', name: 'POTION', count: 3, effect: 'heal_hp', power: 40, description: 'Лікує 40 HP союзнику' },
            { id: 'hi_pot', name: 'HI-POT', count: 1, effect: 'heal_hp', power: 100, description: 'Лікує 100 HP союзнику' },
            { id: 'ether', name: 'ETHER', count: 2, effect: 'heal_mp', power: 15, description: 'Відновлює 15 MP' }
        ];

        // Find first alive hero idx
        let firstAliveIdx = party.findIndex(p => p.isAlive);
        if (firstAliveIdx === -1) firstAliveIdx = 0;

        setActiveBattle({
            attackerPieceId: attacker.id,
            defenderPieceId: defender.id,
            targetRow,
            targetCol,
            isJump,
            attackerSquad: JSON.parse(JSON.stringify(attacker.squad)),
            defenderSquad: JSON.parse(JSON.stringify(defender.squad)),
            attackerSide: attacker.side,
            party,
            enemies,
            items,
            combatPhase: 'command',
            activeHeroIdx: firstAliveIdx,
            pendingCommands: [],
            menuView: 'main',
            mainCursor: 'fight',
            selectedEnemyTargetIdx: 0,
            selectedSpell: null,
            selectedItem: null,
            logTargetName: party[firstAliveIdx]?.name || '—',
            logAction: 'ГОТОВИЙ ДО БОЮ',
            logResult: `HP ${party[firstAliveIdx]?.hp || 0}`,
            attackingHeroId: null,
            attackingEnemyId: null,
            hitHeroId: null,
            hitEnemyId: null,
            floatingDamage: null
        });
    };

    // -------------------------------------------------------------------
    // G29 COMBAT COMMAND DISPATCH & SELECTION
    // -------------------------------------------------------------------
    const handleSelectMainCommand = (command: 'fight' | 'run' | 'magic' | 'drink' | 'item') => {
        if (!activeBattle || activeBattle.combatPhase !== 'command') return;
        const currentHero = activeBattle.party[activeBattle.activeHeroIdx];
        if (!currentHero) return;

        setActiveBattle(prev => prev ? { ...prev, mainCursor: command } : null);

        if (command === 'fight') {
            playSwordClashSound(false, false);
            const livingEnemies = activeBattle.enemies.filter(e => e.isAlive);
            if (livingEnemies.length === 0) return;
            setActiveBattle(prev => prev ? {
                ...prev,
                menuView: 'target_enemy',
                selectedEnemyTargetIdx: 0,
                logTargetName: livingEnemies[0].name,
                logAction: `${currentHero.name} АТАКА`,
                logResult: 'ОБЕРІТЬ ВОРОГА'
            } : null);
        } else if (command === 'magic') {
            playSparkleSound();
            if (currentHero.spells.length === 0) {
                // Warriors don't have spells!
                setActiveBattle(prev => prev ? {
                    ...prev,
                    logTargetName: currentHero.name,
                    logAction: 'НЕМАЄ МАГІЇ',
                    logResult: 'ОБЕРІТЬ ІНШЕ'
                } : null);
                return;
            }
            setActiveBattle(prev => prev ? {
                ...prev,
                menuView: 'magic',
                selectedSpell: null,
                logTargetName: currentHero.name,
                logAction: 'ЗАКЛИНАННЯ',
                logResult: `MP ${currentHero.mp}/${currentHero.maxMp}`
            } : null);
        } else if (command === 'drink' || command === 'item') {
            playSparkleSound();
            setActiveBattle(prev => prev ? {
                ...prev,
                menuView: 'item',
                selectedItem: null,
                logTargetName: currentHero.name,
                logAction: 'ІНВЕНТАР',
                logResult: 'ОБЕРІТЬ ЗІЛЛЯ'
            } : null);
        } else if (command === 'run') {
            // Flee attempt
            setActiveBattle(prev => prev ? {
                ...prev,
                logTargetName: currentHero.name,
                logAction: 'ВІДСТУП...',
                logResult: 'НЕМОЖЛИВО'
            } : null);
        }
    };

    // Confirm enemy target for physical attack or single-target spell
    const confirmEnemyTarget = (enemyId: string) => {
        if (!activeBattle) return;
        playSwordClashSound(false, false);
        const currentHero = activeBattle.party[activeBattle.activeHeroIdx];
        const newPending = [
            ...activeBattle.pendingCommands,
            {
                actorId: currentHero.id,
                type: activeBattle.selectedSpell ? 'magic' as const : 'fight' as const,
                targetId: enemyId,
                spell: activeBattle.selectedSpell || undefined,
                item: activeBattle.selectedItem || undefined
            }
        ];

        setActiveBattle(prev => prev ? {
            ...prev,
            pendingCommands: newPending,
            menuView: 'main',
            selectedSpell: null,
            selectedItem: null
        } : null);

        advanceToNextHeroOrExecute(newPending);
    };

    // Confirm ally target for heal / potion
    const confirmAllyTarget = (allyId: string) => {
        if (!activeBattle) return;
        playSparkleSound();
        const currentHero = activeBattle.party[activeBattle.activeHeroIdx];
        const newPending = [
            ...activeBattle.pendingCommands,
            {
                actorId: currentHero.id,
                type: activeBattle.selectedSpell ? 'magic' as const : 'drink' as const,
                targetId: allyId,
                spell: activeBattle.selectedSpell || undefined,
                item: activeBattle.selectedItem || undefined
            }
        ];

        setActiveBattle(prev => prev ? {
            ...prev,
            pendingCommands: newPending,
            menuView: 'main',
            selectedSpell: null,
            selectedItem: null
        } : null);

        advanceToNextHeroOrExecute(newPending);
    };

    // Advance to next living hero or trigger full round execution
    const advanceToNextHeroOrExecute = (currentPending: QueuedHeroAction[]) => {
        if (!activeBattle) return;
        let nextIdx = activeBattle.activeHeroIdx + 1;
        while (nextIdx < activeBattle.party.length && !activeBattle.party[nextIdx].isAlive) {
            nextIdx++;
        }

        if (nextIdx < activeBattle.party.length) {
            setActiveBattle(prev => prev ? {
                ...prev,
                activeHeroIdx: nextIdx,
                logTargetName: prev.party[nextIdx].name,
                logAction: 'ГОТОВИЙ',
                logResult: `HP ${prev.party[nextIdx].hp}`
            } : null);
        } else {
            // All living heroes made their choices -> EXECUTE FULL ROUND!
            setActiveBattle(prev => prev ? {
                ...prev,
                combatPhase: 'resolving'
            } : null);
            executeInterleavedRound(currentPending);
        }
    };

    // Quick auto-battle option (queues all living heroes immediately)
    const handleAutoBattleRound = () => {
        if (!activeBattle || activeBattle.combatPhase !== 'command') return;
        playSwordClashSound(false, false);
        const livingHeroList = activeBattle.party.filter(p => p.isAlive);
        const livingEnemyList = activeBattle.enemies.filter(e => e.isAlive);
        if (livingEnemyList.length === 0 || livingHeroList.length === 0) return;

        const autoCommands: QueuedHeroAction[] = livingHeroList.map((hero, idx) => ({
            actorId: hero.id,
            type: 'fight',
            targetId: livingEnemyList[idx % livingEnemyList.length].id
        }));

        setActiveBattle(prev => prev ? {
            ...prev,
            pendingCommands: autoCommands,
            combatPhase: 'resolving'
        } : null);

        executeInterleavedRound(autoCommands);
    };

    // Undo previous hero command
    const handleCancelPreviousHero = () => {
        if (!activeBattle || activeBattle.pendingCommands.length === 0) return;
        const newPending = [...activeBattle.pendingCommands];
        newPending.pop();

        let prevIdx = activeBattle.activeHeroIdx - 1;
        while (prevIdx >= 0 && !activeBattle.party[prevIdx].isAlive) {
            prevIdx--;
        }
        if (prevIdx >= 0) {
            setActiveBattle(prev => prev ? {
                ...prev,
                pendingCommands: newPending,
                activeHeroIdx: prevIdx,
                menuView: 'main'
            } : null);
        }
    };

    // -------------------------------------------------------------------
    // FULL INTERLEAVED ROUND EXECUTION (HEROES + ENEMIES INTERLEAVED)
    // -------------------------------------------------------------------
    const executeInterleavedRound = async (heroActions: QueuedHeroAction[]) => {
        if (!activeBattle) return;

        let currentParty = [...activeBattle.party];
        let currentEnemies = [...activeBattle.enemies];
        let currentItems = [...activeBattle.items];

        interface TurnOrder {
            isEnemy: boolean;
            id: string;
            initiative: number;
            heroAction?: QueuedHeroAction;
        }

        const queue: TurnOrder[] = [];

        // Add living heroes who queued actions
        for (const act of heroActions) {
            const hero = currentParty.find(p => p.id === act.actorId && p.isAlive);
            if (hero) {
                queue.push({
                    isEnemy: false,
                    id: hero.id,
                    initiative: calculateInitiative(hero),
                    heroAction: act
                });
            }
        }

        // Add living enemies
        for (const enemy of currentEnemies) {
            if (enemy.isAlive) {
                queue.push({
                    isEnemy: true,
                    id: enemy.id,
                    initiative: calculateInitiative(enemy)
                });
            }
        }

        // Sort descending by initiative (Fastest acts first!)
        queue.sort((a, b) => b.initiative - a.initiative);

        setActiveBattle(prev => prev ? {
            ...prev,
            logTargetName: 'БІЙ',
            logAction: 'РАУНД РОЗПОЧАТО',
            logResult: 'СУТИЧКА!'
        } : null);
        await new Promise(r => setTimeout(r, 400));

        // Process queue
        for (const turnItem of queue) {
            // Check victory / defeat
            if (currentEnemies.every(e => !e.isAlive || e.hp <= 0)) {
                handleTacticalVictory(currentParty, currentEnemies);
                return;
            }
            if (currentParty.every(p => !p.isAlive || p.hp <= 0)) {
                handleTacticalDefeat(currentParty, currentEnemies);
                return;
            }

            if (!turnItem.isEnemy && turnItem.heroAction) {
                // --- HERO TURN ---
                const act = turnItem.heroAction;
                const hero = currentParty.find(p => p.id === act.actorId && p.isAlive);
                if (!hero) continue;

                setActiveBattle(prev => prev ? { ...prev, attackingHeroId: hero.id } : null);

                if (act.type === 'fight') {
                    let target = currentEnemies.find(e => e.id === act.targetId && e.isAlive) || currentEnemies.find(e => e.isAlive);
                    if (target) {
                        const hitRes = calculatePhysicalDamage(hero, target, hero.damage);
                        playSwordClashSound(hitRes.isCrit, false);

                        if (hitRes.isHit) {
                            target.hp = Math.max(0, target.hp - hitRes.damage);
                            target.isAlive = target.hp > 0;
                        }

                        currentEnemies = [...currentEnemies];
                        setActiveBattle(prev => prev ? {
                            ...prev,
                            enemies: currentEnemies,
                            hitEnemyId: target.id,
                            logTargetName: target.name,
                            logAction: `${hero.name} АТАКА`,
                            logResult: hitRes.isHit ? (hitRes.isCrit ? `${hitRes.damage} КРИТ!` : `${hitRes.damage} УДАР`) : 'ПРОМАХ!',
                            floatingDamage: { id: target.id, text: hitRes.isHit ? `${hitRes.damage}` : 'MISS', isEnemy: true }
                        } : null);

                        if (currentEnemies.every(e => !e.isAlive || e.hp <= 0)) {
                            await new Promise(r => setTimeout(r, 450));
                            handleTacticalVictory(currentParty, currentEnemies);
                            return;
                        }
                    }
                } else if (act.type === 'magic' && act.spell) {
                    const spell = act.spell;
                    hero.mp = Math.max(0, hero.mp - spell.mpCost);
                    currentParty = [...currentParty];

                    if (spell.type === 'heal') {
                        if (spell.targetScope === 'all_allies') {
                            playSparkleSound();
                            let healVal = 0;
                            currentParty.forEach(ally => {
                                if (ally.isAlive) {
                                    const h = calculateHealing(hero as any, spell as any);
                                    ally.hp = Math.min(ally.maxHp, ally.hp + h);
                                    healVal += h;
                                }
                            });
                            setActiveBattle(prev => prev ? {
                                ...prev,
                                party: currentParty,
                                logTargetName: 'ВСІ СОЮЗНИКИ',
                                logAction: `${hero.name} CASTS ${spell.name}`,
                                logResult: `+${healVal} HP ВСІМ`,
                                floatingDamage: { id: hero.id, text: `+${healVal}`, isEnemy: false }
                            } : null);
                        } else {
                            const targetAlly = currentParty.find(p => p.id === act.targetId) || hero;
                            const healVal = calculateHealing(hero as any, spell as any);
                            playSparkleSound();
                            targetAlly.hp = Math.min(targetAlly.maxHp, targetAlly.hp + healVal);
                            targetAlly.isAlive = true;
                            setActiveBattle(prev => prev ? {
                                ...prev,
                                party: currentParty,
                                logTargetName: targetAlly.name,
                                logAction: `${hero.name} CASTS ${spell.name}`,
                                logResult: `+${healVal} HP`,
                                floatingDamage: { id: targetAlly.id, text: `+${healVal}`, isEnemy: false }
                            } : null);
                        }
                    } else if (spell.targetScope === 'all_enemies') {
                        playSparkleSound();
                        let totalDmg = 0;
                        currentEnemies.forEach(e => {
                            if (e.isAlive) {
                                const magRes = calculateMagicDamage(hero as any, spell as any);
                                e.hp = Math.max(0, e.hp - magRes.damage);
                                e.isAlive = e.hp > 0;
                                totalDmg += magRes.damage;
                            }
                        });
                        currentEnemies = [...currentEnemies];
                        setActiveBattle(prev => prev ? {
                            ...prev,
                            enemies: currentEnemies,
                            party: currentParty,
                            logTargetName: 'ВСІ ВОРОГИ',
                            logAction: `${hero.name} CASTS ${spell.name}`,
                            logResult: `${totalDmg} ВОГОНЬ!`,
                            floatingDamage: { id: currentEnemies.find(e => e.isAlive)?.id || '', text: `${totalDmg}`, isEnemy: true }
                        } : null);

                        if (currentEnemies.every(e => !e.isAlive || e.hp <= 0)) {
                            await new Promise(r => setTimeout(r, 450));
                            handleTacticalVictory(currentParty, currentEnemies);
                            return;
                        }
                    } else {
                        // Single enemy damage spell (FIRE, LIT, ICE, HOLY)
                        let target = currentEnemies.find(e => e.id === act.targetId && e.isAlive) || currentEnemies.find(e => e.isAlive);
                        if (target) {
                            const magRes = calculateMagicDamage(hero as any, spell as any);
                            playSparkleSound();
                            target.hp = Math.max(0, target.hp - magRes.damage);
                            target.isAlive = target.hp > 0;
                            currentEnemies = [...currentEnemies];
                            setActiveBattle(prev => prev ? {
                                ...prev,
                                enemies: currentEnemies,
                                party: currentParty,
                                hitEnemyId: target.id,
                                logTargetName: target.name,
                                logAction: `${hero.name} CASTS ${spell.name}`,
                                logResult: `${magRes.damage} МАГІЯ`,
                                floatingDamage: { id: target.id, text: `${magRes.damage}`, isEnemy: true }
                            } : null);

                            if (currentEnemies.every(e => !e.isAlive || e.hp <= 0)) {
                                await new Promise(r => setTimeout(r, 450));
                                handleTacticalVictory(currentParty, currentEnemies);
                                return;
                            }
                        }
                    }
                } else if ((act.type === 'drink' || act.type === 'item') && act.item) {
                    const item = act.item;
                    const targetAlly = currentParty.find(p => p.id === act.targetId) || hero;
                    playSparkleSound();
                    if (item.effect === 'heal_hp') {
                        targetAlly.hp = Math.min(targetAlly.maxHp, targetAlly.hp + item.power);
                    } else if (item.effect === 'heal_mp') {
                        targetAlly.mp = Math.min(targetAlly.maxMp, targetAlly.mp + item.power);
                    }
                    currentItems = currentItems.map(i => i.id === item.id ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0);
                    currentParty = [...currentParty];
                    setActiveBattle(prev => prev ? {
                        ...prev,
                        party: currentParty,
                        items: currentItems,
                        logTargetName: targetAlly.name,
                        logAction: `ЗІЛЛЯ ${item.name}`,
                        logResult: `ВІДНОВЛЕНО`,
                        floatingDamage: { id: targetAlly.id, text: `+${item.power}`, isEnemy: false }
                    } : null);
                }

                await new Promise(r => setTimeout(r, 650));
                setActiveBattle(prev => prev ? {
                    ...prev,
                    attackingHeroId: null,
                    hitEnemyId: null,
                    floatingDamage: null
                } : null);

            } else if (turnItem.isEnemy) {
                // --- ENEMY TURN ---
                const enemy = currentEnemies.find(e => e.id === turnItem.id && e.isAlive);
                if (!enemy) continue;

                const aliveHeroTargets = currentParty.filter(p => p.isAlive);
                if (aliveHeroTargets.length === 0) {
                    handleTacticalDefeat(currentParty, currentEnemies);
                    return;
                }

                // Enemy lunges forward
                setActiveBattle(prev => prev ? { ...prev, attackingEnemyId: enemy.id } : null);

                // Check if enemy Cleric heals wounded ally
                if (enemy.role === 'cleric' && enemy.mp >= 4) {
                    const woundedEnemy = currentEnemies.find(e => e.isAlive && e.hp < e.maxHp * 0.6);
                    if (woundedEnemy) {
                        playSparkleSound();
                        enemy.mp -= 4;
                        const healVal = 20;
                        woundedEnemy.hp = Math.min(woundedEnemy.maxHp, woundedEnemy.hp + healVal);
                        currentEnemies = [...currentEnemies];
                        setActiveBattle(prev => prev ? {
                            ...prev,
                            enemies: currentEnemies,
                            logTargetName: woundedEnemy.name,
                            logAction: `${enemy.name} CASTS CURE`,
                            logResult: `+${healVal} HP`,
                            floatingDamage: { id: woundedEnemy.id, text: `+${healVal}`, isEnemy: true }
                        } : null);
                        await new Promise(r => setTimeout(r, 650));
                        setActiveBattle(prev => prev ? { ...prev, attackingEnemyId: null, floatingDamage: null } : null);
                        continue;
                    }
                }

                // Check if enemy Mage casts FIRE
                if (enemy.role === 'mage' && enemy.mp >= 5 && Math.random() < 0.6) {
                    playSparkleSound();
                    enemy.mp -= 5;
                    const targetHero = aliveHeroTargets[Math.floor(Math.random() * aliveHeroTargets.length)];
                    const fireDmg = 18 + Math.floor(Math.random() * 8);
                    targetHero.hp = Math.max(0, targetHero.hp - fireDmg);
                    targetHero.isAlive = targetHero.hp > 0;
                    currentParty = [...currentParty];
                    setActiveBattle(prev => prev ? {
                        ...prev,
                        party: currentParty,
                        hitHeroId: targetHero.id,
                        logTargetName: targetHero.name,
                        logAction: `${enemy.name} CASTS FIRE`,
                        logResult: `${fireDmg} ВОГОНЬ!`,
                        floatingDamage: { id: targetHero.id, text: `-${fireDmg}`, isEnemy: false }
                    } : null);
                    await new Promise(r => setTimeout(r, 650));
                    setActiveBattle(prev => prev ? { ...prev, attackingEnemyId: null, hitHeroId: null, floatingDamage: null } : null);
                    if (currentParty.every(p => !p.isAlive || p.hp <= 0)) {
                        handleTacticalDefeat(currentParty, currentEnemies);
                        return;
                    }
                    continue;
                }

                // Default: Physical strike
                const targetHero = aliveHeroTargets[Math.floor(Math.random() * aliveHeroTargets.length)];
                const hitRes = calculatePhysicalDamage(enemy, targetHero, enemy.damage);
                playPunchSound(false, false);

                if (hitRes.isHit) {
                    targetHero.hp = Math.max(0, targetHero.hp - hitRes.damage);
                    targetHero.isAlive = targetHero.hp > 0;
                }

                currentParty = [...currentParty];
                setActiveBattle(prev => prev ? {
                    ...prev,
                    party: currentParty,
                    hitHeroId: targetHero.id,
                    logTargetName: targetHero.name,
                    logAction: `${enemy.name} АТАКА`,
                    logResult: hitRes.isHit ? `${hitRes.damage} УДАР!` : 'ПРОМАХ!',
                    floatingDamage: { id: targetHero.id, text: hitRes.isHit ? `-${hitRes.damage}` : 'MISS', isEnemy: false }
                } : null);

                await new Promise(r => setTimeout(r, 650));
                setActiveBattle(prev => prev ? {
                    ...prev,
                    attackingEnemyId: null,
                    hitHeroId: null,
                    floatingDamage: null
                } : null);

                if (currentParty.every(p => !p.isAlive || p.hp <= 0)) {
                    handleTacticalDefeat(currentParty, currentEnemies);
                    return;
                }
            }
        }

        // Round finished without total wipeout: return to Command phase for next round!
        const nextHeroIdx = currentParty.findIndex(p => p.isAlive);
        setActiveBattle(prev => prev ? {
            ...prev,
            combatPhase: 'command',
            activeHeroIdx: nextHeroIdx !== -1 ? nextHeroIdx : 0,
            pendingCommands: [],
            menuView: 'main',
            logTargetName: currentParty[nextHeroIdx]?.name || '—',
            logAction: 'НОВИЙ РАУНД',
            logResult: 'ОБЕРІТЬ ДІЮ'
        } : null);
    };

    // -------------------------------------------------------------------
    // RESOLVE TACTICAL VICTORY (PLAYER WINS)
    // -------------------------------------------------------------------
    const handleTacticalVictory = (
        finalParty: TacticalCombatant[], 
        finalEnemies: TacticalCombatant[]
    ) => {
        playLevelUpSound();
        playSparkleSound();
        if (!activeBattle) return;

        setActiveBattle(prev => prev ? { ...prev, combatPhase: 'victory' } : null);

        // Update player's persistent squad fighters
        const winningSquad = activeBattle.attackerSide === 'player' 
            ? activeBattle.attackerSquad 
            : activeBattle.defenderSquad;

        // Apply XP and HP/Death changes
        // Rule: "Якщо боєць помирає під час гри, то він зникає повністю і не може бути відновлений до кінця самої гри."
        // "Також при перемозі кожному персонажу начисляються очки досвіду (+20 XP)."
        let leveledUpAny = false;
        const updatedFighters = winningSquad.fighters.map(f => {
            const combatant = finalParty.find(p => p.id === f.id);
            if (combatant) {
                if (combatant.hp <= 0 || !combatant.isAlive) {
                    return {
                        ...f,
                        currentHp: 0,
                        isDead: true
                    };
                } else {
                    const { fighter, leveledUp } = addExpToRpgFighter(f, 20);
                    if (leveledUp) leveledUpAny = true;
                    return {
                        ...fighter,
                        currentHp: combatant.hp,
                        currentMp: combatant.mp
                    };
                }
            }
            return f;
        });

        winningSquad.fighters = updatedFighters;

        // Update checker pieces on the board
        const defeatedPieceId = activeBattle.attackerSide === 'player' 
            ? activeBattle.defenderPieceId 
            : activeBattle.attackerPieceId;
        const winnerPieceId = activeBattle.attackerSide === 'player' 
            ? activeBattle.attackerPieceId 
            : activeBattle.defenderPieceId;
        const isAttackerWinner = activeBattle.attackerSide === 'player';

        setPieces(prev => {
            const remaining = prev.filter(p => p.id !== defeatedPieceId);
            return remaining.map(p => {
                if (p.id === winnerPieceId) {
                    const newRow = isAttackerWinner ? activeBattle.targetRow : p.row;
                    const newCol = isAttackerWinner ? activeBattle.targetCol : p.col;
                    const promotionRow = p.side === 'player' ? 0 : 7;
                    const becomesKing = p.isKing || newRow === promotionRow;
                    return {
                        ...p,
                        row: newRow,
                        col: newCol,
                        isKing: becomesKing,
                        squad: winningSquad
                    };
                }
                return p;
            });
        });

        // Save progress
        const updatedPlayerSquads = playerInitialSquads.map(s => {
            if (s.id === winningSquad.id) return winningSquad;
            return s;
        });
        const updatedProgress: WorldProgress = {
            ...progress,
            rpgArmyCheckersSquads: updatedPlayerSquads
        };
        onUpdateProgress(updatedProgress);

        addLog(`🏆 ПЕРЕМОГА У ДВОБОЇ! Ворожу шашку знято з дошки! Живі бійці здобули +20 XP${leveledUpAny ? ' та новий рівень!' : ''}!`);
    };

    // Close battle overlay on victory
    const completeVictoryAndReturnToBoard = () => {
        setActiveBattle(null);
        setSelectedPieceId(null);
        setCurrentTurn('ai');
    };

    // -------------------------------------------------------------------
    // RESOLVE TACTICAL DEFEAT (AI WINS)
    // -------------------------------------------------------------------
    const handleTacticalDefeat = (
        finalParty: TacticalCombatant[], 
        finalEnemies: TacticalCombatant[]
    ) => {
        if (!activeBattle) return;
        setActiveBattle(prev => prev ? { ...prev, combatPhase: 'defeat' } : null);

        // Player's squad defeated: piece removed from the board!
        const playerPieceId = activeBattle.attackerSide === 'player' 
            ? activeBattle.attackerPieceId 
            : activeBattle.defenderPieceId;

        setPieces(prev => prev.filter(p => p.id !== playerPieceId));
        addLog(`💀 ВАШ ЗАГІН ЗНИЩЕНО! Шашка пала у запеклому бою.`);
    };

    // Close battle overlay on defeat
    const completeDefeatAndReturnToBoard = () => {
        setActiveBattle(null);
        setSelectedPieceId(null);
        setCurrentTurn('ai');
    };

    // -------------------------------------------------------------------
    // STRATEGIC CHECKERS MOVE SELECTION (PLAYER)
    // -------------------------------------------------------------------
    const handleSquareClick = (r: number, c: number) => {
        if (currentTurn !== 'player' || activeBattle || gameResult) return;

        // If clicking on player piece, select it
        const clickedPiece = pieces.find(p => p.row === r && p.col === c);
        if (clickedPiece && clickedPiece.side === 'player') {
            setSelectedPieceId(clickedPiece.id);
            return;
        }

        // If a piece is selected and clicking on a destination square
        if (selectedPieceId) {
            const selectedPiece = pieces.find(p => p.id === selectedPieceId);
            if (!selectedPiece) return;

            const validMoves = getValidMovesForPiece(selectedPiece, pieces);
            const targetMove = validMoves.find(m => m.r === r && m.c === c);

            if (targetMove) {
                if (targetMove.isJump && targetMove.victimPiece) {
                    // Start Tactical G29 Fantasy Adventure Battle on jump attack!
                    startTacticalBattle(selectedPiece, targetMove.victimPiece, r, c, true);
                } else {
                    // Regular strategic step move
                    playPunchSound(false, false);
                    const promotionRow = 0;
                    const isKing = selectedPiece.isKing || r === promotionRow;

                    setPieces(prev => prev.map(p => {
                        if (p.id === selectedPiece.id) {
                            return { ...p, row: r, col: c, isKing };
                        }
                        return p;
                    }));

                    addLog(`♙ Загін «${selectedPiece.squad.name}» перемістився на (${r + 1}, ${c + 1}).`);
                    setSelectedPieceId(null);
                    setCurrentTurn('ai');
                }
            } else {
                setSelectedPieceId(null);
            }
        }
    };

    // -------------------------------------------------------------------
    // AI TURN EXECUTION ON STRATEGIC BOARD
    // -------------------------------------------------------------------
    useEffect(() => {
        if (currentTurn !== 'ai' || activeBattle || gameResult) return;

        const timer = setTimeout(() => {
            const aiPieces = pieces.filter(p => p.side === 'ai');
            if (aiPieces.length === 0) {
                handleGlobalVictory();
                return;
            }

            // Find all jumps
            const allJumps: { piece: StrategicPiece; move: { r: number; c: number; isJump: boolean; victimPiece?: StrategicPiece } }[] = [];
            const allSteps: { piece: StrategicPiece; move: { r: number; c: number; isJump: boolean } }[] = [];

            aiPieces.forEach(p => {
                const moves = getValidMovesForPiece(p, pieces);
                moves.forEach(m => {
                    if (m.isJump && m.victimPiece) {
                        allJumps.push({ piece: p, move: m });
                    } else if (!m.isJump) {
                        allSteps.push({ piece: p, move: m });
                    }
                });
            });

            if (allJumps.length > 0) {
                // AI executes jump attack -> triggers Tactical G29 Battle!
                const choice = allJumps[Math.floor(Math.random() * allJumps.length)];
                startTacticalBattle(choice.piece, choice.move.victimPiece!, choice.move.r, choice.move.c, true);
            } else if (allSteps.length > 0) {
                // AI regular step
                const choice = allSteps[Math.floor(Math.random() * allSteps.length)];
                const promotionRow = 7;
                const isKing = choice.piece.isKing || choice.move.r === promotionRow;

                setPieces(prev => prev.map(p => {
                    if (p.id === choice.piece.id) {
                        return { ...p, row: choice.move.r, col: choice.move.c, isKing };
                    }
                    return p;
                }));

                addLog(`⚔️ Суперник перемістив загін «${choice.piece.squad.name}».`);
                setCurrentTurn('player');
            } else {
                // AI has no moves: Player wins!
                handleGlobalVictory();
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [currentTurn, activeBattle, pieces, gameResult]);

    // Check Global Game Result (All player pieces lost or all AI pieces lost)
    useEffect(() => {
        const playerPieces = pieces.filter(p => p.side === 'player');
        const aiPieces = pieces.filter(p => p.side === 'ai');

        if (pieces.length > 0) {
            if (playerPieces.length === 0) {
                setGameResult('defeat');
                onDefeat(progress);
            } else if (aiPieces.length === 0) {
                setGameResult('victory');
            }
        }
    }, [pieces]);

    const handleGlobalVictory = () => {
        playLevelUpSound();
        playGoldSound();
        setGameResult('victory');
        const rewardGold = 50 + (Number(opponent.difficulty) || 1) * 20;
        const updatedProgress = {
            ...progress,
            playerGold: (progress.playerGold || 0) + rewardGold
        };
        onUpdateProgress(updatedProgress);
        onVictory(updatedProgress);
    };

    const selectedPiece = pieces.find(p => p.id === selectedPieceId);
    const validMovesForSelected = selectedPiece ? getValidMovesForPiece(selectedPiece, pieces) : [];

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none">
            <div className="relative w-full max-w-5xl h-[94vh] bg-[#140e0a] border-2 border-amber-600/70 rounded-2xl flex flex-col overflow-hidden shadow-2xl font-sans text-stone-150">
                
                {/* ========================================================= */}
                {/* HEADER                                                    */}
                {/* ========================================================= */}
                <div className="h-14 bg-gradient-to-r from-stone-950 via-[#1f140e] to-stone-950 px-4 flex items-center justify-between border-b border-amber-900/50">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚔️</span>
                        <div>
                            <div className="text-sm font-black text-amber-300 flex items-center gap-2">
                                <span>Рольові армійські шашки 8х8</span>
                                <span className="text-[10px] bg-red-950 text-red-300 border border-red-700/50 px-1.5 py-0.5 rounded font-mono font-bold">
                                    БОЇ G29
                                </span>
                            </div>
                            <div className="text-[11px] text-stone-400">
                                {tavernName} • Суперник: <span className="text-amber-200 font-bold">{opponent.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {onOpenToyShop && (
                            <button
                                onClick={onOpenToyShop}
                                className="px-3 py-1.5 rounded-lg bg-amber-900/40 border border-amber-500/40 text-amber-300 hover:bg-amber-800/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                title="Меню з іграшками: прокачка бійців та відновлення загиблих"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Прокачка загонів</span>
                            </button>
                        )}

                        <div className="text-xs px-2.5 py-1 bg-stone-900 border border-stone-700 rounded-lg font-mono">
                            Хід: <b className={currentTurn === 'player' ? 'text-amber-400' : 'text-red-400'}>
                                {currentTurn === 'player' ? 'Ваш хід' : 'Хід суперника...'}
                            </b>
                        </div>

                        <button 
                            onClick={onClose}
                            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* MAIN STRATEGIC AREA (8x8 CHECKERS BOARD + SIDE PANEL)     */}
                {/* ========================================================= */}
                <div className="flex-1 flex flex-col md:flex-row p-3 gap-3 overflow-hidden bg-[#0d0907]">
                    
                    {/* LEFT: 8x8 Strategic Checkers Board */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="aspect-square max-h-full w-full max-w-[540px] p-2 bg-[#2a1b12] border-4 border-[#54331e] rounded-xl shadow-2xl flex flex-col">
                            <div className="w-full h-full grid grid-cols-8 grid-rows-8 border-2 border-stone-800">
                                {Array.from({ length: 64 }).map((_, idx) => {
                                    const r = Math.floor(idx / 8);
                                    const c = idx % 8;
                                    const isDark = (r + c) % 2 === 1;
                                    const piece = pieces.find(p => p.row === r && p.col === c);
                                    const isSelected = piece && piece.id === selectedPieceId;
                                    const isValidMove = validMovesForSelected.some(m => m.r === r && m.c === c);
                                    const isJumpMove = validMovesForSelected.some(m => m.r === r && m.c === c && m.isJump);

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleSquareClick(r, c)}
                                            className={`relative flex items-center justify-center transition-all ${
                                                isDark ? 'bg-[#3b2416]' : 'bg-[#d8c3a5]'
                                            } ${isValidMove ? 'cursor-pointer hover:bg-amber-700/60' : ''}`}
                                        >
                                            {/* Move destination indicators */}
                                            {isValidMove && (
                                                <div className={`absolute z-20 rounded-full animate-ping pointer-events-none ${
                                                    isJumpMove ? 'w-5 h-5 bg-red-500/80 border-2 border-white' : 'w-4 h-4 bg-amber-400/70'
                                                }`} />
                                            )}

                                            {/* Checker Squad Piece */}
                                            {piece && (
                                                <div 
                                                    className={`relative w-[86%] h-[86%] rounded-full flex flex-col items-center justify-center shadow-lg transition-transform ${
                                                        piece.side === 'player'
                                                            ? 'bg-gradient-to-b from-amber-700 to-amber-950 border-2 border-amber-300 text-white cursor-pointer hover:scale-105'
                                                            : 'bg-gradient-to-b from-stone-800 to-stone-950 border-2 border-red-500/80 text-red-200'
                                                    } ${isSelected ? 'ring-4 ring-yellow-400 scale-110 z-30' : ''}`}
                                                >
                                                    {/* Crown for King pieces */}
                                                    {piece.isKing && (
                                                        <Crown className="w-3.5 h-3.5 text-yellow-300 absolute -top-1.5 drop-shadow" />
                                                    )}

                                                    {/* Squad Avatar */}
                                                    <span className="text-base sm:text-lg leading-none">
                                                        {piece.side === 'player' ? piece.squad.avatar : '💀'}
                                                    </span>

                                                    {/* Living fighters indicator (out of 4) */}
                                                    <div className="flex gap-0.5 mt-0.5">
                                                        {piece.squad.fighters.map(f => (
                                                            <div 
                                                                key={f.id} 
                                                                className={`w-1 h-1 rounded-full ${
                                                                    !f.isDead && f.currentHp > 0 ? 'bg-emerald-400' : 'bg-red-600/40'
                                                                }`} 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Selected Piece Info & Combat Log */}
                    <div className="w-full md:w-80 flex flex-col gap-3 justify-between">
                        {/* Selected Squad Card */}
                        <div className="bg-[#18110b] border border-amber-800/40 rounded-xl p-3 space-y-2">
                            <div className="text-xs font-bold text-amber-300 uppercase flex items-center justify-between">
                                <span>Обрана Шашка-Загін</span>
                                <span className="text-[10px] text-stone-400">4 бійці</span>
                            </div>

                            {selectedPiece ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{selectedPiece.squad.avatar}</span>
                                        <div>
                                            <div className="text-xs font-bold text-amber-200 truncate max-w-[200px]">
                                                {selectedPiece.squad.name}
                                            </div>
                                            <div className="text-[10px] text-stone-400">
                                                Позиція: ({selectedPiece.row + 1}, {selectedPiece.col + 1}) • {selectedPiece.isKing ? 'Дамка' : 'Звичайна'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4 Fighters of Squad */}
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        {selectedPiece.squad.fighters.map(f => {
                                            const isDead = f.isDead || f.currentHp <= 0;
                                            return (
                                                <div 
                                                    key={f.id} 
                                                    className={`p-1.5 rounded border text-[10px] flex flex-col justify-between ${
                                                        isDead ? 'border-red-950 bg-red-950/20 opacity-50' : 'border-stone-800 bg-stone-900/60'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center font-bold">
                                                        <span className="flex items-center gap-1 truncate text-stone-200">
                                                            {f.role === 'warrior_2' ? (
                                                                <img src="/assets/guardian/guardian.png" alt="Гвардієць" className="w-3.5 h-3.5 object-contain inline-block filter drop-shadow" />
                                                            ) : null}
                                                            <span className="truncate">{f.name.split(' ')[0]}</span>
                                                        </span>
                                                        <span className="text-amber-400 font-mono">Lv.{f.level}</span>
                                                    </div>
                                                    <div className="text-[9px] text-stone-400 flex justify-between mt-1">
                                                        <span>HP: {f.currentHp}/{f.maxHp}</span>
                                                        {f.maxMp ? <span className="text-sky-400">MP: {f.currentMp ?? f.maxMp}</span> : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-stone-500 py-4 text-center">
                                    Натисніть на свою шашку на дошці для вибору
                                </div>
                            )}
                        </div>

                        {/* Strategic Combat Rules Brief */}
                        <div className="bg-[#18110b] border border-stone-800 rounded-xl p-3 text-xs space-y-1.5">
                            <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Правила Рольових Шашок:</span>
                            </div>
                            <p className="text-[11px] text-stone-400 leading-tight">
                                • Рух по діагоналі. При атаці через клітинку запускається тактичний двобої G29!
                            </p>
                            <p className="text-[11px] text-stone-400 leading-tight">
                                • У кожній шашці б'ються 4 герої: 2 воїни, 1 маг і 1 клірик. Маг володіє бойовою магією, клірик — лікуванням!
                            </p>
                            <p className="text-[11px] text-stone-400 leading-tight">
                                • Загиблий під час бою боєць залишається мертвим до кінця гри.
                            </p>
                        </div>

                        {/* Recent Activity Log */}
                        <div className="bg-[#120c08] border border-stone-800 rounded-xl p-3 flex-1 flex flex-col justify-between overflow-hidden">
                            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                                Журнал партії:
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1 text-[11px] text-stone-300 font-mono">
                                {combatLog.map((log, i) => (
                                    <div key={i} className="leading-tight">{log}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* TACTICAL G29 FANTASY ADVENTURE BATTLE OVERLAY MODAL       */}
                {/* Exact Match to User Screenshot & FantasyAdventureModal   */}
                {/* ========================================================= */}
                <AnimatePresence>
                    {activeBattle && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-50 bg-black flex flex-col select-none"
                        >
                            {/* TOP HALF: BATTLEFIELD ARENA (NES PIXEL ART) */}
                            <div className="h-[62%] w-full relative bg-[#050505] flex overflow-hidden border-b-[4px] border-white">
                                
                                {/* Forest pine trees canopy along top of both sides - exact match to user's screenshot! */}
                                <div className="absolute top-0 left-0 right-0 h-12 flex justify-between pointer-events-none select-none z-10 opacity-90">
                                    <div className="w-1/2 h-full flex overflow-hidden">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="flex-1 flex flex-col justify-end">
                                                <svg viewBox="0 0 16 24" className="w-full h-full text-emerald-800" fill="currentColor" shapeRendering="crispEdges">
                                                    <polygon points="8,2 2,10 14,10" fill="#14532d" />
                                                    <polygon points="8,7 1,17 15,17" fill="#166534" />
                                                    <polygon points="8,13 0,22 16,22" fill="#15803d" />
                                                    <rect x="7" y="22" width="2" height="2" fill="#451a03" />
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-1/2 h-full flex overflow-hidden">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="flex-1 flex flex-col justify-end">
                                                <svg viewBox="0 0 16 24" className="w-full h-full text-emerald-800" fill="currentColor" shapeRendering="crispEdges">
                                                    <polygon points="8,2 2,10 14,10" fill="#14532d" />
                                                    <polygon points="8,7 1,17 15,17" fill="#166534" />
                                                    <polygon points="8,13 0,22 16,22" fill="#15803d" />
                                                    <rect x="7" y="22" width="2" height="2" fill="#451a03" />
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Center divider pillar - matching screenshot */}
                                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 bg-gradient-to-r from-stone-800 via-stone-400 to-stone-800 z-10 pointer-events-none" />

                                {/* LEFT SIDE: ENEMY SQUAD COMBATANTS (4 fighters) */}
                                <div className="w-1/2 h-full pt-12 pb-3 px-6 flex flex-col justify-around relative">
                                    {activeBattle.enemies.map((enemy, idx) => {
                                        const isAttacking = activeBattle.attackingEnemyId === enemy.id;
                                        const isHit = activeBattle.hitEnemyId === enemy.id;
                                        const isTargetable = activeBattle.menuView === 'target_enemy' && enemy.isAlive;
                                        const isSelectedTarget = activeBattle.enemies.filter(e => e.isAlive)[activeBattle.selectedEnemyTargetIdx]?.id === enemy.id;

                                        return (
                                            <div 
                                                key={enemy.id}
                                                onClick={() => {
                                                    if (isTargetable) confirmEnemyTarget(enemy.id);
                                                }}
                                                className={`relative flex items-center transition-all ${
                                                    isTargetable ? 'cursor-pointer hover:scale-105' : ''
                                                }`}
                                            >
                                                {/* Floating damage counter */}
                                                {activeBattle.floatingDamage && activeBattle.floatingDamage.id === enemy.id && (
                                                    <div className="absolute -top-3 left-12 z-30 font-black text-sm px-1.5 py-0.5 border animate-bounce text-red-400 border-red-500 bg-black/90">
                                                        {activeBattle.floatingDamage.text}
                                                    </div>
                                                )}

                                                {/* Pointer indicator */}
                                                {(isSelectedTarget || (isTargetable && activeBattle.menuView === 'target_enemy')) && (
                                                    <span className="absolute -left-6 text-yellow-300 animate-pulse text-base">👉</span>
                                                )}

                                                <PixelHeroSprite 
                                                    type={enemy.spriteType}
                                                    isAttacking={isAttacking}
                                                    isHit={isHit}
                                                    isDead={!enemy.isAlive}
                                                    isEnemy={true}
                                                />

                                                <span className="text-[10px] text-stone-300 font-mono font-bold ml-2">
                                                    {enemy.name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* RIGHT SIDE: PARTY HEROES (4 fighters in vertical formation) */}
                                <div className="w-1/2 h-full pt-12 pb-3 px-6 flex flex-col justify-around items-end pr-10 relative">
                                    {activeBattle.party.map((hero, idx) => {
                                        const isActiveTurn = activeBattle.combatPhase === 'command' && activeBattle.activeHeroIdx === idx;
                                        const isAttacking = activeBattle.attackingHeroId === hero.id;
                                        const isHit = activeBattle.hitHeroId === hero.id;

                                        return (
                                            <div 
                                                key={hero.id}
                                                onClick={() => {
                                                    if (activeBattle.combatPhase === 'command' && activeBattle.menuView === 'target_ally') {
                                                        confirmAllyTarget(hero.id);
                                                    }
                                                }}
                                                className={`relative flex items-center transition-all ${
                                                    isActiveTurn ? '-translate-x-4 drop-shadow-[0_0_6px_#ffffff]' : ''
                                                }`}
                                            >
                                                {/* Floating healing / damage counter */}
                                                {activeBattle.floatingDamage && activeBattle.floatingDamage.id === hero.id && (
                                                    <div className={`absolute -top-3 -left-12 z-30 font-black text-sm px-1.5 py-0.5 border animate-bounce ${
                                                        activeBattle.floatingDamage.text.startsWith('+') 
                                                            ? 'text-emerald-400 border-emerald-500 bg-black/90' 
                                                            : 'text-red-400 border-red-500 bg-black/90'
                                                    }`}>
                                                        {activeBattle.floatingDamage.text}
                                                    </div>
                                                )}

                                                {activeBattle.menuView === 'target_ally' && (
                                                    <span className="absolute -left-6 text-yellow-300 animate-pulse">👉</span>
                                                )}

                                                <PixelHeroSprite 
                                                    type={hero.spriteType}
                                                    isAttacking={isAttacking}
                                                    isHit={isHit}
                                                    isDead={!hero.isAlive}
                                                    isEnemy={false}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* FULL SCREEN VICTORY OVERLAY OVER THE BATTLEFIELD */}
                                {activeBattle.combatPhase === 'victory' && (
                                    <div className="absolute inset-0 bg-black/85 z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                                        <div className="border-[4px] border-yellow-400 bg-[#0e0e18] p-6 max-w-md w-full shadow-[0_0_25px_rgba(250,204,21,0.5)] flex flex-col items-center gap-3 font-mono">
                                            <div className="text-yellow-400 font-black text-2xl tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                                                ★ ВЕЛИЧНА ПЕРЕМОГА! ★
                                            </div>
                                            <div className="text-white text-sm font-bold tracking-wide">
                                                Ворожу шашку-загін розгромлено!
                                            </div>
                                            <div className="flex gap-4 my-2 text-base font-black">
                                                <span className="text-emerald-400 bg-black/60 px-3 py-1 border border-emerald-500/50">
                                                    +20 EXP ВСІМ ЖИВИМ
                                                </span>
                                            </div>
                                            <button
                                                onClick={completeVictoryAndReturnToBoard}
                                                className="w-full mt-2 py-3 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black font-black text-base uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all border-2 border-white cursor-pointer"
                                            >
                                                🏆 ПОВЕРНУТИСЬ ДО ДОШКИ
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* FULL SCREEN DEFEAT OVERLAY OVER THE BATTLEFIELD */}
                                {activeBattle.combatPhase === 'defeat' && (
                                    <div className="absolute inset-0 bg-black/85 z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                                        <div className="border-[4px] border-rose-600 bg-[#180a0a] p-6 max-w-md w-full shadow-[0_0_25px_rgba(225,29,72,0.5)] flex flex-col items-center gap-3 font-mono">
                                            <div className="text-rose-500 font-black text-2xl tracking-widest">
                                                💀 ЗАГІН ЗНИЩЕНО...
                                            </div>
                                            <div className="text-neutral-300 text-sm font-bold">
                                                Усі бійці цієї шашки полягли у бою.
                                            </div>
                                            <button
                                                onClick={completeDefeatAndReturnToBoard}
                                                className="w-full mt-2 py-3 bg-rose-700 text-white font-black text-base uppercase tracking-wider shadow-lg hover:bg-rose-600 active:scale-95 transition-all border-2 border-white cursor-pointer"
                                            >
                                                ПРОДОВЖИТИ ГРУ
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* BOTTOM HALF: 3 NES WINDOWS MATCHING THE USER'S SCREENSHOT EXACTLY */}
                            <div className="h-[38%] w-full flex p-2 gap-2 bg-black font-mono">
                                
                                {/* BOTTOM BOX 1 (LEFT 30%): TARGET / COMBAT LOG WINDOW */}
                                <div className="w-[30%] border-[3px] border-white bg-black p-3 flex flex-col justify-between text-xs sm:text-sm leading-snug">
                                    <div className="text-amber-400 font-bold uppercase tracking-wider border-b border-white/20 pb-1 truncate">
                                        {activeBattle.logTargetName || '—'}
                                    </div>
                                    <div className="text-white font-bold tracking-wide truncate">
                                        {activeBattle.logAction || ' '}
                                    </div>
                                    <div className="text-yellow-300 font-black tracking-wide truncate">
                                        {activeBattle.logResult || ' '}
                                    </div>
                                </div>

                                {/* BOTTOM BOX 2 (CENTER 42%): COMMAND SELECTION MENU */}
                                <div className="w-[42%] border-[3px] border-white bg-black p-2 flex flex-col justify-between text-xs sm:text-sm relative">
                                    
                                    {/* MAIN MENU */}
                                    {activeBattle.menuView === 'main' && activeBattle.combatPhase === 'command' && (
                                        <div className="flex flex-col justify-between h-full p-1">
                                            <div className="text-[11px] text-yellow-400 font-bold mb-1 flex justify-between items-center">
                                                <span>HERO {activeBattle.activeHeroIdx + 1}/4: {activeBattle.party[activeBattle.activeHeroIdx]?.name}</span>
                                                <button 
                                                    onClick={handleAutoBattleRound}
                                                    className="bg-amber-600 hover:bg-amber-500 text-black px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                                    title="Всі герої миттєво атакують фізичними ударами"
                                                >
                                                    ⚡ ALL FIGHT
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 flex-grow items-center">
                                                {/* FIGHT */}
                                                <button 
                                                    onClick={() => handleSelectMainCommand('fight')}
                                                    onMouseEnter={() => setActiveBattle(prev => prev ? { ...prev, mainCursor: 'fight' } : null)}
                                                    className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold cursor-pointer"
                                                >
                                                    <span className={`w-4 ${activeBattle.mainCursor === 'fight' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                                    FIGHT
                                                </button>

                                                {/* RUN */}
                                                <button 
                                                    onClick={() => handleSelectMainCommand('run')}
                                                    onMouseEnter={() => setActiveBattle(prev => prev ? { ...prev, mainCursor: 'run' } : null)}
                                                    className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold cursor-pointer"
                                                >
                                                    <span className={`w-4 ${activeBattle.mainCursor === 'run' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                                    RUN
                                                </button>

                                                {/* MAGIC (with spells for Mage and Cleric!) */}
                                                <button 
                                                    onClick={() => handleSelectMainCommand('magic')}
                                                    onMouseEnter={() => setActiveBattle(prev => prev ? { ...prev, mainCursor: 'magic' } : null)}
                                                    className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold cursor-pointer"
                                                >
                                                    <span className={`w-4 ${activeBattle.mainCursor === 'magic' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                                    MAGIC
                                                </button>

                                                {/* DRINK */}
                                                <button 
                                                    onClick={() => handleSelectMainCommand('drink')}
                                                    onMouseEnter={() => setActiveBattle(prev => prev ? { ...prev, mainCursor: 'drink' } : null)}
                                                    className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold cursor-pointer"
                                                >
                                                    <span className={`w-4 ${activeBattle.mainCursor === 'drink' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                                    DRINK
                                                </button>

                                                {/* ITEM */}
                                                <button 
                                                    onClick={() => handleSelectMainCommand('item')}
                                                    onMouseEnter={() => setActiveBattle(prev => prev ? { ...prev, mainCursor: 'item' } : null)}
                                                    className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold cursor-pointer"
                                                >
                                                    <span className={`w-4 ${activeBattle.mainCursor === 'item' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                                    ITEM
                                                </button>

                                                {/* Back button */}
                                                {activeBattle.pendingCommands.length > 0 && (
                                                    <button 
                                                        onClick={handleCancelPreviousHero}
                                                        className="text-xs text-rose-400 hover:text-rose-200 underline text-left cursor-pointer"
                                                    >
                                                        [BACK]
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* TARGET ENEMY SUBMENU */}
                                    {activeBattle.menuView === 'target_enemy' && (
                                        <div className="flex flex-col h-full justify-between p-1">
                                            <div className="text-xs text-yellow-300 mb-1">SELECT ENEMY TARGET:</div>
                                            <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[85px]">
                                                {activeBattle.enemies.filter(e => e.isAlive).map((enemy, idx) => (
                                                    <button
                                                        key={enemy.id}
                                                        onClick={() => confirmEnemyTarget(enemy.id)}
                                                        onMouseEnter={() => setActiveBattle(prev => prev ? { ...prev, selectedEnemyTargetIdx: idx } : null)}
                                                        className="text-left text-xs sm:text-sm font-bold hover:text-yellow-300 truncate cursor-pointer"
                                                    >
                                                        {activeBattle.enemies.filter(e => e.isAlive)[activeBattle.selectedEnemyTargetIdx]?.id === enemy.id ? '👉 ' : '   '}
                                                        {enemy.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => setActiveBattle(prev => prev ? { ...prev, menuView: 'main', selectedSpell: null } : null)} 
                                                className="text-xs text-neutral-400 hover:text-white pt-1 text-left cursor-pointer"
                                            >
                                                [CANCEL]
                                            </button>
                                        </div>
                                    )}

                                    {/* MAGIC SUBMENU (MAGE & CLERIC SPELLS) */}
                                    {activeBattle.menuView === 'magic' && (
                                        <div className="flex flex-col h-full justify-between p-1">
                                            <div className="flex justify-between text-xs text-yellow-300 mb-1">
                                                <span>SPELLS ({activeBattle.party[activeBattle.activeHeroIdx]?.role === 'cleric' ? 'WHITE' : 'BLACK'}):</span>
                                                <span>MP: {activeBattle.party[activeBattle.activeHeroIdx]?.mp}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[80px]">
                                                {activeBattle.party[activeBattle.activeHeroIdx]?.spells.map(spell => {
                                                    const curHero = activeBattle.party[activeBattle.activeHeroIdx];
                                                    const canCast = curHero && curHero.mp >= spell.mpCost;

                                                    return (
                                                        <button
                                                            key={spell.id}
                                                            disabled={!canCast}
                                                            onClick={() => {
                                                                if (!canCast) return;
                                                                setActiveBattle(prev => prev ? { ...prev, selectedSpell: spell } : null);

                                                                if (spell.type === 'heal' && spell.targetScope === 'single_ally') {
                                                                    setActiveBattle(prev => prev ? {
                                                                        ...prev,
                                                                        selectedSpell: spell,
                                                                        menuView: 'target_ally',
                                                                        logAction: `CAST ${spell.name}`,
                                                                        logResult: 'PICK ALLY'
                                                                    } : null);
                                                                } else if (spell.targetScope === 'all_allies') {
                                                                    // Mass heal immediately queued!
                                                                    const currentHero = activeBattle.party[activeBattle.activeHeroIdx];
                                                                    const newPending = [
                                                                        ...activeBattle.pendingCommands,
                                                                        {
                                                                            actorId: currentHero.id,
                                                                            type: 'magic' as const,
                                                                            targetId: 'all_allies',
                                                                            spell
                                                                        }
                                                                    ];
                                                                    setActiveBattle(prev => prev ? {
                                                                        ...prev,
                                                                        pendingCommands: newPending,
                                                                        menuView: 'main',
                                                                        selectedSpell: null
                                                                    } : null);
                                                                    advanceToNextHeroOrExecute(newPending);
                                                                } else if (spell.targetScope === 'all_enemies') {
                                                                    // AoE flame wave immediately queued!
                                                                    const currentHero = activeBattle.party[activeBattle.activeHeroIdx];
                                                                    const newPending = [
                                                                        ...activeBattle.pendingCommands,
                                                                        {
                                                                            actorId: currentHero.id,
                                                                            type: 'magic' as const,
                                                                            targetId: 'all_enemies',
                                                                            spell
                                                                        }
                                                                    ];
                                                                    setActiveBattle(prev => prev ? {
                                                                        ...prev,
                                                                        pendingCommands: newPending,
                                                                        menuView: 'main',
                                                                        selectedSpell: null
                                                                    } : null);
                                                                    advanceToNextHeroOrExecute(newPending);
                                                                } else {
                                                                    // Single enemy spell (FIRE, LIT, ICE, HOLY)
                                                                    setActiveBattle(prev => prev ? {
                                                                        ...prev,
                                                                        selectedSpell: spell,
                                                                        menuView: 'target_enemy',
                                                                        logAction: `CAST ${spell.name}`,
                                                                        logResult: 'PICK ENEMY'
                                                                    } : null);
                                                                }
                                                            }}
                                                            className={`text-left text-xs font-bold truncate cursor-pointer ${
                                                                canCast ? 'hover:text-yellow-300 text-white' : 'text-neutral-500 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            {spell.name} ({spell.mpCost})
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button 
                                                onClick={() => setActiveBattle(prev => prev ? { ...prev, menuView: 'main' } : null)} 
                                                className="text-xs text-neutral-400 hover:text-white pt-1 text-left cursor-pointer"
                                            >
                                                [CANCEL]
                                            </button>
                                        </div>
                                    )}

                                    {/* ITEM / DRINK SUBMENU */}
                                    {activeBattle.menuView === 'item' && (
                                        <div className="flex flex-col h-full justify-between p-1">
                                            <div className="text-xs text-yellow-300 mb-1">CHOOSE ITEM:</div>
                                            <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[80px]">
                                                {activeBattle.items.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            setActiveBattle(prev => prev ? {
                                                                ...prev,
                                                                selectedItem: item,
                                                                menuView: 'target_ally',
                                                                logAction: `USE ${item.name}`,
                                                                logResult: 'PICK ALLY'
                                                            } : null);
                                                        }}
                                                        className="text-left text-xs font-bold hover:text-yellow-300 text-white truncate cursor-pointer"
                                                    >
                                                        {item.name} x{item.count}
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => setActiveBattle(prev => prev ? { ...prev, menuView: 'main' } : null)} 
                                                className="text-xs text-neutral-400 hover:text-white pt-1 text-left cursor-pointer"
                                            >
                                                [CANCEL]
                                            </button>
                                        </div>
                                    )}

                                    {/* TARGET ALLY SUBMENU */}
                                    {activeBattle.menuView === 'target_ally' && (
                                        <div className="flex flex-col h-full justify-between p-1">
                                            <div className="text-xs text-emerald-300 mb-1">TARGET ALLY:</div>
                                            <div className="grid grid-cols-2 gap-1">
                                                {activeBattle.party.map(hero => (
                                                    <button
                                                        key={hero.id}
                                                        onClick={() => confirmAllyTarget(hero.id)}
                                                        className="text-left text-xs font-bold hover:text-emerald-300 text-white truncate cursor-pointer"
                                                    >
                                                        👉 {hero.name} ({hero.hp})
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => setActiveBattle(prev => prev ? { ...prev, menuView: 'main' } : null)} 
                                                className="text-xs text-neutral-400 hover:text-white pt-1 text-left cursor-pointer"
                                            >
                                                [CANCEL]
                                            </button>
                                        </div>
                                    )}

                                    {/* Resolving Phase Indicator */}
                                    {activeBattle.combatPhase === 'resolving' && (
                                        <div className="h-full flex items-center justify-center text-sm font-bold animate-pulse text-amber-400">
                                            ⚔️ BATTLE IN PROGRESS...
                                        </div>
                                    )}
                                </div>

                                {/* BOTTOM BOX 3 (RIGHT 28%): 4 STACKED PARTY HP/MP STATUS WINDOWS */}
                                <div className="w-[28%] flex flex-col gap-1 justify-between">
                                    {activeBattle.party.map((hero, idx) => {
                                        const isCurrentChoosing = activeBattle.combatPhase === 'command' && activeBattle.activeHeroIdx === idx;
                                        const safeHp = typeof hero.hp === 'number' && !isNaN(hero.hp) ? hero.hp : 0;
                                        const safeMaxHp = typeof hero.maxHp === 'number' && !isNaN(hero.maxHp) && hero.maxHp > 0 ? hero.maxHp : 30;
                                        const isLowHp = safeHp <= safeMaxHp * 0.3;
                                        const safeMp = typeof hero.mp === 'number' && !isNaN(hero.mp) ? hero.mp : 0;

                                        return (
                                            <div 
                                                key={hero.id}
                                                className={`border-[2px] p-1 flex flex-col justify-center transition-all ${
                                                    isCurrentChoosing 
                                                        ? 'border-yellow-400 bg-[#16162a]' 
                                                        : 'border-white bg-black'
                                                } ${!hero.isAlive ? 'opacity-40' : ''}`}
                                            >
                                                <div className="flex justify-between items-center text-xs sm:text-sm font-bold leading-tight">
                                                    <span className={isCurrentChoosing ? 'text-yellow-300' : 'text-white'}>
                                                        {hero.name}
                                                    </span>
                                                    {hero.maxMp > 0 && (
                                                        <span className="text-[10px] text-sky-300 font-normal">
                                                            MP {safeMp}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center text-xs sm:text-sm font-black leading-tight">
                                                    <span className="text-neutral-400 font-bold">HP</span>
                                                    <span className={isLowHp ? 'text-rose-400 animate-pulse' : 'text-white'}>
                                                        {safeHp}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========================================================= */}
                {/* GLOBAL VICTORY MODAL                                      */}
                {/* ========================================================= */}
                <AnimatePresence>
                    {gameResult === 'victory' && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4 select-none"
                        >
                            <div className="max-w-md w-full bg-[#1c140e] border-2 border-amber-500 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
                                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-3xl">
                                    🏆
                                </div>
                                <h3 className="text-2xl font-black text-amber-300">
                                    ПЕРЕМОГА В РОЛЬОВИХ ШАШКАХ!
                                </h3>
                                <p className="text-sm text-stone-300">
                                    Ви розгромили всі ворожі шашки-загони суперника <span className="text-amber-200 font-bold">{opponent.name}</span>!
                                </p>

                                <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl space-y-1.5 text-xs text-left">
                                    <div className="text-amber-400 font-bold">Отримані нагороди:</div>
                                    <div className="text-stone-300">• Золото: <span className="text-amber-300 font-bold">+{50 + (opponent.difficulty === 'master' ? 3 : opponent.difficulty === 'expert' ? 2 : 1) * 20} монет</span></div>
                                    <div className="text-stone-300">• Досвід бійців: <span className="text-emerald-400 font-bold">+20 XP за кожну виграну сутичку!</span></div>
                                    <div className="text-stone-300">• Усі вижилі бійці зберегли свій прогрес прокачки.</div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 font-black rounded-xl hover:brightness-110 shadow-lg cursor-pointer"
                                >
                                    Забрати нагороду та повернутися
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========================================================= */}
                {/* GLOBAL DEFEAT MODAL                                       */}
                {/* ========================================================= */}
                <AnimatePresence>
                    {gameResult === 'defeat' && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4 select-none"
                        >
                            <div className="max-w-md w-full bg-[#180a0a] border-2 border-rose-600 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
                                <div className="w-16 h-16 rounded-full bg-rose-600/20 border-2 border-rose-500 mx-auto flex items-center justify-center text-3xl">
                                    💀
                                </div>
                                <h3 className="text-2xl font-black text-rose-400">
                                    ПОРАЗКА В РОЛЬОВИХ ШАШКАХ
                                </h3>
                                <p className="text-sm text-stone-300">
                                    Усі ваші шашки-загони були розбиті військами суперника <span className="text-amber-200 font-bold">{opponent.name}</span>.
                                </p>

                                <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-400 text-left">
                                    💡 Загиблі бійці можуть бути відновлені (відроджені з 0 рівня) у <span className="text-amber-300 font-bold">Меню з іграшками</span>.
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-rose-700 hover:bg-rose-600 text-white font-black rounded-xl transition shadow-lg cursor-pointer"
                                >
                                    Повернутися до таверни
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    OpponentData, 
    TavernData, 
    SettlementData, 
    WorldProgress, 
    CombatZone, 
    BrawlRoundLog,
    FencingStance
} from '../types';
import { 
    FencingFighter, 
    resolveFencingRound, 
    FENCING_STANCE_INFO, 
    FENCING_HIT_MODIFIERS 
} from '../lib/fencingEngine';
import { calculateTotalHealth, pickOpponentCombatZones } from '../lib/brawlEngine';
import { getHeroCommanderSprite, getCompanionSprite } from '../lib/companionSprites';
import { recordVictory, recordLoss, getOpponentWinCount, WINS_TO_RETIRE_TO_NPC, DEFAULT_PLAYER_STATS } from '../lib/worldData';
import { 
    playSwordClashSound, 
    playShieldBlockSound, 
    playDodgeSound, 
    playDiceSound, 
    playLevelUpSound 
} from '../lib/soundEffects';
import { 
    Shield, 
    Zap, 
    Trophy, 
    Flame, 
    Sparkles, 
    RotateCcw, 
    ArrowLeft, 
    Coins, 
    Heart, 
    CheckCircle2, 
    AlertTriangle,
    Crown,
    Swords
} from 'lucide-react';

interface FencingArenaModalProps {
    opponent: OpponentData;
    tavern: TavernData;
    settlement: SettlementData;
    progress: WorldProgress;
    mode: 'sword_shield' | 'sword_only';
    onUpdateProgress: (updated: WorldProgress) => void;
    onClose: () => void;
    onOpenLevelUpModal?: () => void;
    betAmount?: number;
    onVictory?: () => void;
    onDefeat?: () => void;
}

export function FencingArenaModal({
    opponent,
    tavern,
    settlement,
    progress,
    mode,
    onUpdateProgress,
    onClose,
    onOpenLevelUpModal,
    betAmount = 0,
    onVictory,
    onDefeat
}: FencingArenaModalProps) {
    const playerStats = progress.playerStats || DEFAULT_PLAYER_STATS;

    const activityType = mode === 'sword_shield' ? 'fencing_sword_shield' : 'fencing_sword_only';

    // Calculate maximum health
    const playerMaxHp = calculateTotalHealth(playerStats.baseHp, playerStats.strength);
    const oppBaseHp = opponent.baseHp || 110;
    const oppStrength = opponent.strength || 16;
    const oppAgility = opponent.agility || 12;
    const oppMaxHp = calculateTotalHealth(oppBaseHp, oppStrength);

    // Initial stances
    const initialOppStance: FencingStance = mode;

    // Fighter states
    const [playerHp, setPlayerHp] = useState<number>(playerStats.currentHp ?? playerMaxHp);
    const [oppHp, setOppHp] = useState<number>(oppMaxHp);
    const [roundNumber, setRoundNumber] = useState<number>(1);

    // Stance is locked by tournament mode
    const [playerStance, setPlayerStance] = useState<FencingStance>(mode);
    const [oppStance, setOppStance] = useState<FencingStance>(initialOppStance);

    // Player zone choices
    const [selectedAttackZone, setSelectedAttackZone] = useState<CombatZone>('head');
    const [selectedDefenseZone, setSelectedDefenseZone] = useState<CombatZone>('head');

    // Round resolution state
    const [isResolving, setIsResolving] = useState<boolean>(false);
    const [lastLog, setLastLog] = useState<BrawlRoundLog | null>(null);
    const [combatHistory, setCombatHistory] = useState<BrawlRoundLog[]>([]);
    const [floatingText, setFloatingText] = useState<{ id: number; text: string; isCrit: boolean; isPlayer: boolean } | null>(null);

    // Duel completion state
    const [duelOver, setDuelOver] = useState<'victory' | 'defeat' | null>(null);
    const [unlockedNext, setUnlockedNext] = useState<string | undefined>(undefined);
    const [isConquered, setIsConquered] = useState<boolean>(false);
    const [xpGained, setXpGained] = useState<number>(0);
    const [leveledUp, setLeveledUp] = useState<boolean>(false);
    const [newLevelNum, setNewLevelNum] = useState<number>(playerStats.level);
    const [pointsGained, setPointsGained] = useState<number>(0);
    const [fencingWins, setFencingWins] = useState<number>(() => getOpponentWinCount(progress, opponent.id, activityType));
    const [becameNpc, setBecameNpc] = useState<boolean>(false);

    useEffect(() => {
        playDiceSound();
    }, []);

    const handleExecuteStrike = () => {
        if (isResolving || duelOver) return;

        setIsResolving(true);
        playDiceSound();

        const playerFighter: FencingFighter = {
            name: 'Лицар (Ви)',
            avatar: '🤺',
            currentHp: playerHp,
            maxHp: playerMaxHp,
            strength: playerStats.strength,
            agility: playerStats.agility,
            stance: playerStance
        };

        // Opponent may adapt stance dynamically
        const nextOppStance: FencingStance = Math.random() > 0.45 ? oppStance : (oppStance === 'sword_shield' ? 'sword_only' : 'sword_shield');
        setOppStance(nextOppStance);

        const oppFighter: FencingFighter = {
            name: opponent.name,
            avatar: opponent.avatar,
            currentHp: oppHp,
            maxHp: oppMaxHp,
            strength: oppStrength,
            agility: oppAgility,
            stance: nextOppStance
        };

        // Opponent tactical zone pick
        const { attackZone: oppAttack, defenseZone: oppDefense } = pickOpponentCombatZones(
            roundNumber,
            oppHp,
            oppMaxHp,
            selectedAttackZone
        );

        // Resolve round using the strict formula: 1d20 + agility + hit_modifier > 1d20 + agility_opp
        const resolution = resolveFencingRound(
            roundNumber,
            playerFighter,
            oppFighter,
            selectedAttackZone,
            selectedDefenseZone,
            oppAttack,
            oppDefense,
            playerStance,
            nextOppStance
        );

        const log = resolution.log;

        // Play sound effects based on outcomes
        setTimeout(() => {
            if (log.isShieldBlock) {
                playShieldBlockSound();
            } else if (log.playerHit || log.oppHit) {
                playSwordClashSound();
            } else {
                playDodgeSound();
            }

            // Visual floating damage indicators
            if (log.playerHit && log.playerDamage > 0) {
                setFloatingText({
                    id: Date.now(),
                    text: `-${log.playerDamage} HP${log.playerHeadHit ? ' (КРИТ!)' : ''}`,
                    isCrit: log.playerHeadHit,
                    isPlayer: false
                });
            } else if (log.isShieldBlock && log.oppBlocked) {
                setFloatingText({
                    id: Date.now(),
                    text: `БЛОК ЩИТОМ (0 HP)`,
                    isCrit: false,
                    isPlayer: false
                });
            }

            setPlayerHp(resolution.newPlayerHp);
            setOppHp(resolution.newOppHp);
            setLastLog(log);
            setCombatHistory(prev => [log, ...prev]);
            setRoundNumber(prev => prev + 1);
            setIsResolving(false);

            // Check duel victory/defeat
            if (resolution.newOppHp <= 0) {
                handleVictory(Math.max(10, resolution.newPlayerHp));
            } else if (resolution.newPlayerHp <= 0) {
                handleDefeat(0);
            }
        }, 350);
    };

    const handleVictory = (finalHp: number) => {
        setDuelOver('victory');
        const outcome = recordVictory(progress, opponent, tavern, activityType);
        const updatedWithBet = {
            ...outcome.updatedProgress,
            playerGold: outcome.updatedProgress.playerGold + betAmount,
            playerStats: {
                ...outcome.updatedProgress.playerStats,
                currentHp: finalHp
            }
        };
        onUpdateProgress(updatedWithBet);
        setIsConquered(outcome.isTavernNowConquered);
        setUnlockedNext(outcome.unlockedNextName);
        setXpGained(outcome.xpEarned);
        setLeveledUp(outcome.didLevelUp);
        setNewLevelNum(outcome.newLevel);
        setPointsGained(outcome.pointsGained);
        setFencingWins(outcome.winsAgainstOpponent);
        setBecameNpc(outcome.becameNpc);

        if (outcome.didLevelUp) {
            playLevelUpSound();
        }

        onVictory?.();
    };

    const handleDefeat = (finalHp: number) => {
        setDuelOver('defeat');
        const outcome = recordLoss(progress, activityType);
        const updatedWithBet = {
            ...outcome.updatedProgress,
            playerGold: Math.max(0, outcome.updatedProgress.playerGold - betAmount),
            playerStats: {
                ...outcome.updatedProgress.playerStats,
                currentHp: finalHp
            }
        };
        onUpdateProgress(updatedWithBet);
        setXpGained(outcome.xpEarned);
        setLeveledUp(outcome.didLevelUp);
        setNewLevelNum(outcome.newLevel);
        setPointsGained(outcome.pointsGained);
        onDefeat?.();
    };

    const handleRestartDuel = () => {
        setPlayerHp(playerMaxHp);
        setOppHp(oppMaxHp);
        setRoundNumber(1);
        setLastLog(null);
        setCombatHistory([]);
        setDuelOver(null);
        setFloatingText(null);
        playDiceSound();
    };

    const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerHp / playerMaxHp) * 100)));
    const oppHpPercent = Math.max(0, Math.min(100, Math.round((oppHp / oppMaxHp) * 100)));

    const curStanceConfig = FENCING_STANCE_INFO[playerStance];

    return (
        <div 
            id="fencing-arena-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
            <div 
                id="fencing-arena-card"
                className="relative w-full max-w-4xl bg-[#120d09] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]"
            >
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-amber-950/80 via-[#26170d] to-stone-900 border-b border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            id="fencing-close-btn"
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 transition cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <Swords className="w-5 h-5 text-amber-400" />
                                <h2 className="text-base sm:text-lg font-black text-amber-200 tracking-wide uppercase">
                                    Змагання з фехтування
                                </h2>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Раунд {roundNumber}
                                </span>
                            </div>
                            <p className="text-[11px] text-stone-400">
                                {tavern?.name || 'Таверна'} • {settlement?.name || 'Поселення'}
                            </p>
                        </div>
                    </div>

                    {/* Wins tracker pill */}
                    <div className="flex items-center gap-2 bg-stone-900/90 border border-amber-500/30 rounded-xl px-3 py-1">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <div className="text-right">
                            <span className="text-[10px] text-stone-400 block leading-tight">Перемог над дуелянтом</span>
                            <span className="text-xs font-bold text-amber-300">
                                {fencingWins} / {WINS_TO_RETIRE_TO_NPC}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stance Selector Banner */}
                <div className="px-4 py-2 bg-[#1a120b] border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                            Турнірна дисципліна:
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-[#18110a] px-3 py-2 rounded-xl border border-amber-500/30 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">
                                {mode === 'sword_shield' ? '🛡️⚔️' : '⚔️'}
                            </span>
                            <div>
                                <span className="text-xs font-bold text-amber-200 block">
                                    {mode === 'sword_shield' ? 'Меч і щит (Захисний стиль)' : 'Меч без щита (Агресивний стиль)'}
                                </span>
                                <span className="text-[11px] text-stone-400">
                                    {mode === 'sword_shield' ? '+4 шкода до клинка | 0 втрати здоров\'я при блоці' : '+5 шкода до клинка | 1/2 шкоди при блоці'}
                                </span>
                            </div>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {mode === 'sword_shield' ? 'Захист щитом' : 'Чистий меч'}
                        </span>
                    </div>
                </div>

                {/* Main Arena Content */}
                <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4">
                    {/* Top Section: Combatant Cards & Health Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {/* Player Card */}
                        <div className="p-3 sm:p-4 rounded-xl bg-[#18110a] border border-amber-500/30 relative">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-16 rounded-xl bg-amber-950/60 border border-amber-500/40 overflow-hidden shadow-inner flex items-center justify-center relative flex-shrink-0">
                                        <img 
                                            src={getHeroCommanderSprite(playerStats.gender)}
                                            alt="Лицар"
                                            className="w-full h-full object-cover object-top"
                                        />
                                        <span className="absolute bottom-0.5 right-0.5 text-xs">🤺</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-sm font-black text-amber-100">
                                                {playerStats.gender === 'female' ? 'Ви (Лицарка)' : 'Ви (Лицар)'}
                                            </h3>
                                            <span className={`text-[10px] font-bold ${playerStats.gender === 'female' ? 'text-pink-400' : 'text-sky-400'}`}>
                                                {playerStats.gender === 'female' ? '♀️' : '♂️'}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                                Рівень {playerStats.level}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                                            <span className="flex items-center gap-1 text-amber-300 font-medium">
                                                <Flame className="w-3 h-3" /> Сила: {playerStats.strength}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                                <Zap className="w-3 h-3" /> Спритність: {playerStats.agility}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded bg-stone-900 border border-stone-700 text-amber-300">
                                    {playerStance === 'sword_shield' ? '🛡️ Меч і Щит' : '⚔️ Тільки меч'}
                                </span>
                            </div>

                            {/* Player HP Bar */}
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="flex items-center gap-1 text-red-400">
                                        <Heart className="w-3.5 h-3.5 fill-red-400" /> Здоров'я (HP)
                                    </span>
                                    <span className="text-stone-200">
                                        {playerHp} / {playerMaxHp}
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-700 p-0.5">
                                    <motion.div 
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            playerHpPercent > 50 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                                            playerHpPercent > 25 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                                            'bg-gradient-to-r from-rose-600 to-red-500'
                                        }`}
                                        style={{ width: `${playerHpPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Opponent Card */}
                        <div className="p-3 sm:p-4 rounded-xl bg-[#18110a] border border-amber-500/30 relative">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-16 rounded-xl bg-amber-950/60 border border-amber-500/40 overflow-hidden shadow-inner flex items-center justify-center relative flex-shrink-0">
                                        <img 
                                            src={getCompanionSprite({
                                                name: opponent.name,
                                                avatar: opponent.avatar,
                                                gender: opponent.gender,
                                                type: opponent.type
                                            })}
                                            alt={opponent.name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                        <span className="absolute bottom-0.5 right-0.5 text-xs">{opponent.avatar}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-sm font-black text-amber-100">{opponent.name}</h3>
                                            <span className={`text-[10px] font-bold ${opponent.gender === 'female' ? 'text-pink-400' : 'text-sky-400'}`}>
                                                {opponent.gender === 'female' ? '♀️' : '♂️'}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-bold border border-stone-700">
                                                {opponent.type === 'champion' ? `Чемпіон #${opponent.rank}` : `Претендент #${opponent.rank}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                                            <span className="flex items-center gap-1 text-amber-300 font-medium">
                                                <Flame className="w-3 h-3" /> Сила: {oppStrength}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                                <Zap className="w-3 h-3" /> Спритність: {oppAgility}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded bg-stone-900 border border-stone-700 text-stone-300">
                                    {oppStance === 'sword_shield' ? '🛡️ Меч і Щит' : '⚔️ Тільки меч'}
                                </span>
                            </div>

                            {/* Opponent HP Bar */}
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="flex items-center gap-1 text-red-400">
                                        <Heart className="w-3.5 h-3.5 fill-red-400" /> Здоров'я (HP)
                                    </span>
                                    <span className="text-stone-200">
                                        {oppHp} / {oppMaxHp}
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-700 p-0.5">
                                    <motion.div 
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            oppHpPercent > 50 ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                                            oppHpPercent > 25 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                                            'bg-gradient-to-r from-rose-700 to-red-600'
                                        }`}
                                        style={{ width: `${oppHpPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Text Indicator */}
                    <AnimatePresence>
                        {floatingText && (
                            <motion.div
                                key={floatingText.id}
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: -20, scale: 1.1 }}
                                exit={{ opacity: 0, y: -35 }}
                                className="text-center font-black text-sm sm:text-base py-1 px-3 rounded-full mx-auto w-fit bg-amber-950/80 border border-amber-400 text-amber-200 shadow-xl"
                            >
                                {floatingText.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Combat Actions & Zone Selection */}
                    {!duelOver && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Zone Selection 1: ATTACK */}
                                <div className="p-3.5 rounded-xl bg-[#19120b] border border-amber-500/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Swords className="w-4 h-4 text-amber-400" />
                                            <h4 className="text-xs font-black uppercase text-amber-200 tracking-wider">
                                                1. Зона удару (Атака)
                                            </h4>
                                        </div>
                                        <span className="text-[10px] text-amber-400/80 font-mono">
                                            1d20 + Спр ({playerStats.agility}) + Мод
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Head */}
                                        <button
                                            id="fencing-attack-head-btn"
                                            type="button"
                                            onClick={() => setSelectedAttackZone('head')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedAttackZone === 'head'
                                                    ? 'bg-rose-900/40 border-rose-500 ring-2 ring-rose-500/50 text-rose-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">👤</span>
                                            <span className="text-xs font-black">ГОЛОВА</span>
                                            <span className="text-[10px] text-rose-400 font-bold mt-0.5">Мод: -2</span>
                                            <span className="text-[9px] text-rose-300 font-bold uppercase">4x шкода!</span>
                                        </button>

                                        {/* Torso */}
                                        <button
                                            id="fencing-attack-torso-btn"
                                            type="button"
                                            onClick={() => setSelectedAttackZone('torso')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedAttackZone === 'torso'
                                                    ? 'bg-amber-900/40 border-amber-500 ring-2 ring-amber-500/50 text-amber-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🥋</span>
                                            <span className="text-xs font-black">ТУЛУБ</span>
                                            <span className="text-[10px] text-amber-400 font-bold mt-0.5">Мод: +3</span>
                                            <span className="text-[9px] text-amber-300 font-medium">Випад у корпус</span>
                                        </button>

                                        {/* Legs */}
                                        <button
                                            id="fencing-attack-legs-btn"
                                            type="button"
                                            onClick={() => setSelectedAttackZone('legs')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedAttackZone === 'legs'
                                                    ? 'bg-blue-900/40 border-blue-500 ring-2 ring-blue-500/50 text-blue-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🦵</span>
                                            <span className="text-xs font-black">НОГИ</span>
                                            <span className="text-[10px] text-blue-400 font-bold mt-0.5">Мод: +2</span>
                                            <span className="text-[9px] text-blue-300 font-medium">Укол у стегно</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Zone Selection 2: DEFENSE */}
                                <div className="p-3.5 rounded-xl bg-[#19120b] border border-blue-500/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-blue-400" />
                                            <h4 className="text-xs font-black uppercase text-blue-200 tracking-wider">
                                                2. Зона захисту (Блок)
                                            </h4>
                                        </div>
                                        <span className="text-[10px] text-blue-300">
                                            {playerStance === 'sword_shield' ? '🛡️ Щит: 0 HP шкоди' : '⚔️ Меч: 1/2 HP шкоди'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Head */}
                                        <button
                                            id="fencing-defend-head-btn"
                                            type="button"
                                            onClick={() => setSelectedDefenseZone('head')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedDefenseZone === 'head'
                                                    ? 'bg-blue-900/40 border-blue-400 ring-2 ring-blue-400/50 text-blue-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🪖</span>
                                            <span className="text-xs font-black">ГОЛОВА</span>
                                            <span className="text-[9px] text-blue-300 font-bold mt-0.5">Блок маски</span>
                                        </button>

                                        {/* Torso */}
                                        <button
                                            id="fencing-defend-torso-btn"
                                            type="button"
                                            onClick={() => setSelectedDefenseZone('torso')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedDefenseZone === 'torso'
                                                    ? 'bg-blue-900/40 border-blue-400 ring-2 ring-blue-400/50 text-blue-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🛡️</span>
                                            <span className="text-xs font-black">ТУЛУБ</span>
                                            <span className="text-[9px] text-blue-300 font-bold mt-0.5">Блок нагрудника</span>
                                        </button>

                                        {/* Legs */}
                                        <button
                                            id="fencing-defend-legs-btn"
                                            type="button"
                                            onClick={() => setSelectedDefenseZone('legs')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedDefenseZone === 'legs'
                                                    ? 'bg-blue-900/40 border-blue-400 ring-2 ring-blue-400/50 text-blue-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🦵</span>
                                            <span className="text-xs font-black">НОГИ</span>
                                            <span className="text-[9px] text-blue-300 font-bold mt-0.5">Нижній блок</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Active Stance Rule Reminder */}
                            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    <span>
                                        <strong>{curStanceConfig.name}:</strong> {curStanceConfig.description}
                                    </span>
                                </span>
                                <span className="font-mono text-[11px] text-amber-200/80">
                                    Шанс: 1d20 + Спр + Мод &gt; 1d20 + Спр_суперника
                                </span>
                            </div>

                            {/* Execute Strike Button */}
                            <button
                                id="fencing-strike-execute-btn"
                                type="button"
                                disabled={isResolving}
                                onClick={handleExecuteStrike}
                                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-[0.99] text-stone-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-950/50 border border-amber-400 transition cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Swords className="w-5 h-5 text-stone-950" />
                                <span>{isResolving ? 'Виконується випад...' : 'Завдати випаду мечем'}</span>
                            </button>
                        </div>
                    )}

                    {/* Victory / Defeat Overlay Panel */}
                    {duelOver && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-5 rounded-2xl border ${
                                duelOver === 'victory'
                                    ? 'bg-gradient-to-b from-amber-950/70 via-[#1e150d] to-[#120e09] border-amber-400 shadow-2xl'
                                    : 'bg-gradient-to-b from-rose-950/70 via-[#1c0e0e] to-[#120909] border-rose-500 shadow-2xl'
                            }`}
                        >
                            <div className="text-center space-y-3">
                                <div className="text-5xl">
                                    {duelOver === 'victory' ? '🏆' : '💀'}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black uppercase text-amber-100 tracking-wide">
                                    {duelOver === 'victory' ? 'Тріумфальна перемога у фехтуванні!' : 'Поразка на арені'}
                                </h3>
                                <p className="text-xs sm:text-sm text-stone-300 max-w-lg mx-auto">
                                    {duelOver === 'victory'
                                        ? `Ви майстерно парирували випади та знезброїли ${opponent.name}!`
                                        : `${opponent.name} виявився швидшим у цьому поєдинку. Відновіть сили та спробуйте ще раз!`}
                                </p>

                                {duelOver === 'victory' && (
                                    <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30 max-w-md mx-auto space-y-2 text-left">
                                        <div className="flex items-center justify-between text-xs text-amber-200">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <Coins className="w-4 h-4 text-yellow-400" /> Нагорода золотом:
                                            </span>
                                            <span className="font-mono font-black text-amber-300">
                                                +{opponent.rewards?.gold || 60} золота
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-emerald-200">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <Zap className="w-4 h-4 text-emerald-400" /> Досвід (XP):
                                            </span>
                                            <span className="font-mono font-black text-emerald-300">
                                                +{xpGained} XP
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-blue-200">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <Trophy className="w-4 h-4 text-blue-400" /> Перемог над суперником:
                                            </span>
                                            <span className="font-mono font-black text-blue-300">
                                                {fencingWins} / {WINS_TO_RETIRE_TO_NPC}
                                            </span>
                                        </div>

                                        {/* Retirement notice when reaching 3 wins */}
                                        {becameNpc && (
                                            <div className="mt-2 p-2 rounded-lg bg-blue-950/60 border border-blue-400/50 text-[11px] text-blue-200 flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="font-bold text-blue-100 block">
                                                        Суперник став мирним НПЦ!
                                                    </span>
                                                    Після 3 твоїх перемог {opponent.name} визнав твою перевагу, повісив клинок на стіну та став мирним жителем таверни, з яким можна побесідувати!
                                                </div>
                                            </div>
                                        )}

                                        {leveledUp && (
                                            <div className="mt-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-400/50 text-[11px] text-emerald-200 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 font-bold">
                                                    <Sparkles className="w-4 h-4 text-emerald-300" /> НОВИЙ РІВЕНЬ: {newLevelNum}!
                                                </span>
                                                <span className="text-[10px] text-emerald-300">
                                                    +{pointsGained} очк. характеристик
                                                </span>
                                            </div>
                                        )}

                                        {unlockedNext && (
                                            <div className="mt-2 p-2 rounded-lg bg-amber-950/50 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-2">
                                                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                                                <span>Відкрито наступного суперника: <strong>{unlockedNext}</strong>!</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-3 pt-2">
                                    {duelOver === 'defeat' && (
                                        <button
                                            id="fencing-retry-btn"
                                            type="button"
                                            onClick={handleRestartDuel}
                                            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>Спробувати знову</span>
                                        </button>
                                    )}

                                    {leveledUp && onOpenLevelUpModal && (
                                        <button
                                            id="fencing-levelup-btn"
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                onOpenLevelUpModal();
                                            }}
                                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span>Покращити героя (+{pointsGained})</span>
                                        </button>
                                    )}

                                    <button
                                        id="fencing-finish-btn"
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                                    >
                                        Повернутися в таверну
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Combat Log Feed */}
                    <div className="p-3.5 rounded-xl bg-[#140e0a] border border-stone-800">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
                                <span>📜</span> Літопис поєдинку
                            </h4>
                            <span className="text-[10px] text-stone-500">
                                {combatHistory.length} раунд(ів)
                            </span>
                        </div>

                        {lastLog ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs pr-1">
                                {combatHistory.map((item, idx) => (
                                    <div 
                                        key={idx}
                                        className={`p-2.5 rounded-lg border text-xs whitespace-pre-line leading-relaxed ${
                                            idx === 0 
                                                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 shadow-sm' 
                                                : 'bg-stone-900/40 border-stone-800 text-stone-400'
                                        }`}
                                    >
                                        {item.text}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-stone-500 italic py-2 text-center">
                                Оберіть стійку, точку випаду та блок і натисніть «Завдати випаду мечем»!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

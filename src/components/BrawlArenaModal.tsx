import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    OpponentData, 
    TavernData, 
    SettlementData, 
    WorldProgress, 
    CombatZone, 
    BrawlRoundLog 
} from '../types';
import { 
    BrawlFighter, 
    calculateTotalHealth, 
    pickOpponentCombatZones, 
    resolveBrawlRound 
} from '../lib/brawlEngine';
import { recordVictory, recordLoss, DEFAULT_PLAYER_STATS } from '../lib/worldData';
import { 
    playPunchSound, 
    playDodgeSound, 
    playDiceSound, 
    playLevelUpSound 
} from '../lib/soundEffects';
import { 
    Shield, 
    Zap, 
    Activity, 
    Trophy, 
    Flame, 
    Sparkles, 
    RotateCcw, 
    ArrowLeft, 
    Coins, 
    Heart, 
    CheckCircle2, 
    AlertTriangle,
    Crown
} from 'lucide-react';

interface BrawlArenaModalProps {
    opponent: OpponentData;
    tavern: TavernData;
    settlement: SettlementData;
    progress: WorldProgress;
    onUpdateProgress: (updated: WorldProgress) => void;
    onClose: () => void;
    onOpenLevelUpModal?: () => void;
    betAmount?: number;
    onDefeat?: () => void;
}

export function BrawlArenaModal({
    opponent,
    tavern,
    settlement,
    progress,
    onUpdateProgress,
    onClose,
    onOpenLevelUpModal,
    betAmount = 0,
    onDefeat
}: BrawlArenaModalProps) {
    const playerStats = progress.playerStats || DEFAULT_PLAYER_STATS;

    // Calculate player max health: baseHp + strength
    const playerMaxHp = calculateTotalHealth(playerStats.baseHp, playerStats.strength);

    // Calculate opponent max health: baseHp + strength
    const oppBaseHp = opponent.baseHp || 100;
    const oppStrength = opponent.strength || 15;
    const oppAgility = opponent.agility || 10;
    const oppMaxHp = calculateTotalHealth(oppBaseHp, oppStrength);

    // Fighter states
    const [playerHp, setPlayerHp] = useState<number>(playerStats.currentHp ?? playerMaxHp);
    const [oppHp, setOppHp] = useState<number>(oppMaxHp);
    const [roundNumber, setRoundNumber] = useState<number>(1);

    // Player choices
    const [selectedAttackZone, setSelectedAttackZone] = useState<CombatZone>('head');
    const [selectedDefenseZone, setSelectedDefenseZone] = useState<CombatZone>('head');

    // Round state
    const [isResolving, setIsResolving] = useState<boolean>(false);
    const [lastLog, setLastLog] = useState<BrawlRoundLog | null>(null);
    const [combatHistory, setCombatHistory] = useState<BrawlRoundLog[]>([]);
    const [floatingText, setFloatingText] = useState<{ id: number; text: string; isCrit: boolean; isPlayer: boolean } | null>(null);

    // Duel termination state
    const [duelOver, setDuelOver] = useState<'victory' | 'defeat' | null>(null);
    const [unlockedNext, setUnlockedNext] = useState<string | undefined>(undefined);
    const [isConquered, setIsConquered] = useState<boolean>(false);
    const [xpGained, setXpGained] = useState<number>(0);
    const [leveledUp, setLeveledUp] = useState<boolean>(false);
    const [newLevelNum, setNewLevelNum] = useState<number>(playerStats.level);
    const [pointsGained, setPointsGained] = useState<number>(0);
    const [brawlWins, setBrawlWins] = useState<number>(0);
    const [becameNpc, setBecameNpc] = useState<boolean>(false);

    // Sound initialization on start
    useEffect(() => {
        playDiceSound();
    }, []);

    const handleExecuteStrike = () => {
        if (isResolving || duelOver) return;

        setIsResolving(true);
        playDiceSound();

        const playerFighter: BrawlFighter = {
            name: 'Лицар (Ви)',
            avatar: '🛡️',
            title: `Рівень ${playerStats.level}`,
            baseHp: playerStats.baseHp,
            strength: playerStats.strength,
            agility: playerStats.agility,
            currentHp: playerHp,
            maxHp: playerMaxHp
        };

        const oppFighter: BrawlFighter = {
            name: opponent.name,
            avatar: opponent.avatar,
            title: opponent.title,
            baseHp: oppBaseHp,
            strength: oppStrength,
            agility: oppAgility,
            currentHp: oppHp,
            maxHp: oppMaxHp
        };

        // Pick opponent zones
        const prevZone = lastLog ? lastLog.playerAttackZone : undefined;
        const oppChoices = pickOpponentCombatZones(roundNumber, oppHp, oppMaxHp, prevZone);

        // Resolve round
        const resolution = resolveBrawlRound(
            roundNumber,
            playerFighter,
            oppFighter,
            selectedAttackZone,
            selectedDefenseZone,
            oppChoices.attackZone,
            oppChoices.defenseZone
        );

        setTimeout(() => {
            // Sound effects based on player attack
            if (resolution.log.playerHit) {
                playPunchSound(resolution.log.playerHeadHit, resolution.log.playerBlocked);
            } else {
                playDodgeSound();
            }

            setPlayerHp(resolution.newPlayerHp);
            setOppHp(resolution.newOppHp);
            setLastLog(resolution.log);
            setCombatHistory(prev => [resolution.log, ...prev]);

            // Check match outcome
            if (resolution.newOppHp <= 0) {
                // Victory!
                const outcome = recordVictory(progress, opponent, tavern, true);
                const updatedWithBet = {
                    ...outcome.updatedProgress,
                    playerGold: outcome.updatedProgress.playerGold + betAmount,
                    playerStats: {
                        ...outcome.updatedProgress.playerStats,
                        currentHp: Math.max(10, resolution.newPlayerHp)
                    }
                };
                onUpdateProgress(updatedWithBet);
                setDuelOver('victory');
                setUnlockedNext(outcome.unlockedNextName);
                setIsConquered(outcome.isTavernNowConquered);
                setXpGained(outcome.xpEarned);
                setLeveledUp(outcome.didLevelUp);
                setNewLevelNum(outcome.newLevel);
                setPointsGained(outcome.pointsGained);
                setBrawlWins(outcome.winsAgainstOpponent);
                setBecameNpc(outcome.becameNpc);
                if (outcome.didLevelUp) {
                    playLevelUpSound();
                }
            } else if (resolution.newPlayerHp <= 0) {
                // Defeat!
                const outcome = recordLoss(progress, true);
                const updatedWithBet = {
                    ...outcome.updatedProgress,
                    playerGold: Math.max(0, outcome.updatedProgress.playerGold - betAmount),
                    playerStats: {
                        ...outcome.updatedProgress.playerStats,
                        currentHp: 0
                    }
                };
                onUpdateProgress(updatedWithBet);
                setDuelOver('defeat');
                setXpGained(outcome.xpEarned);
                setLeveledUp(outcome.didLevelUp);
                setNewLevelNum(outcome.newLevel);
                setPointsGained(outcome.pointsGained);
                onDefeat?.();
            } else {
                setRoundNumber(r => r + 1);
            }

            setIsResolving(false);
        }, 400);
    };

    const handleRematch = () => {
        setPlayerHp(playerMaxHp);
        setOppHp(oppMaxHp);
        setRoundNumber(1);
        setLastLog(null);
        setCombatHistory([]);
        setDuelOver(null);
        setIsResolving(false);
        playDiceSound();
    };

    const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerHp / playerMaxHp) * 100)));
    const oppHpPercent = Math.max(0, Math.min(100, Math.round((oppHp / oppMaxHp) * 100)));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="relative w-full max-w-4xl max-h-[96vh] bg-[#140f0c] border-2 border-amber-600/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header banner */}
                <div className="p-3.5 bg-gradient-to-r from-[#291b10] via-[#1a120b] to-[#291b10] border-b border-[#b8860b]/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-[#251b13] hover:bg-[#382b20] border border-stone-700 text-stone-300 transition flex items-center gap-1 text-xs"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">До таверни</span>
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🥊</span>
                                <h2 className="text-base sm:text-lg font-black font-serif text-[#f5ebd7] tracking-wide">
                                    Кулачний бій: {opponent.name}
                                </h2>
                            </div>
                            <div className="text-[11px] text-[#a89988]">
                                {settlement.name} • {tavern.name} • Раунд #{roundNumber}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-400/50 rounded-full text-xs font-bold text-amber-300">
                            Рівень {playerStats.level}
                        </span>
                    </div>
                </div>

                {/* Fighters Ring Stage */}
                <div className="p-4 sm:p-6 bg-gradient-to-b from-[#1b140e] to-[#120d09] border-b border-[#3b2d1f]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        {/* 1. Player Card */}
                        <div className="p-4 rounded-xl bg-[#201812] border-2 border-emerald-500/50 relative overflow-hidden shadow-lg">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-3xl p-1.5 rounded-xl bg-black/50 border border-emerald-500/40">
                                        🛡️
                                    </span>
                                    <div>
                                        <div className="text-[11px] font-bold text-emerald-400">
                                            Лицар (Ви) • Рівень {playerStats.level}
                                        </div>
                                        <h3 className="text-base font-black text-[#f5ebd7]">
                                            Мандрівний Гравець
                                        </h3>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-sm font-black text-emerald-300">
                                        {playerHp} / {playerMaxHp} HP
                                    </span>
                                </div>
                            </div>

                            {/* Player HP Bar */}
                            <div className="w-full h-3.5 bg-black/70 rounded-full overflow-hidden border border-emerald-600/40 mb-2.5">
                                <motion.div
                                    animate={{ width: `${playerHpPercent}%` }}
                                    transition={{ duration: 0.3 }}
                                    className={`h-full transition-colors ${
                                        playerHpPercent > 50
                                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                                            : playerHpPercent > 25
                                            ? 'bg-gradient-to-r from-amber-600 to-yellow-400'
                                            : 'bg-gradient-to-r from-red-600 to-rose-400'
                                    }`}
                                />
                            </div>

                            {/* Player Attributes */}
                            <div className="flex items-center justify-between text-xs text-[#a89988] pt-1 border-t border-stone-800">
                                <span className="flex items-center gap-1 text-red-300">
                                    <Heart className="w-3.5 h-3.5" /> База: {playerStats.baseHp}
                                </span>
                                <span className="flex items-center gap-1 text-amber-300">
                                    <Zap className="w-3.5 h-3.5" /> Сила: {playerStats.strength}
                                </span>
                                <span className="flex items-center gap-1 text-emerald-300">
                                    <Activity className="w-3.5 h-3.5" /> Спритність (d20): +{playerStats.agility}
                                </span>
                            </div>
                        </div>

                        {/* 2. Opponent Card */}
                        <div className="p-4 rounded-xl bg-[#201812] border-2 border-red-500/50 relative overflow-hidden shadow-lg">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-3xl p-1.5 rounded-xl bg-black/50 border border-red-500/40">
                                        {opponent.avatar}
                                    </span>
                                    <div>
                                        <div className="text-[11px] font-bold text-red-400">
                                            {opponent.title}
                                        </div>
                                        <h3 className="text-base font-black text-[#f5ebd7]">
                                            {opponent.name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-sm font-black text-red-300">
                                        {oppHp} / {oppMaxHp} HP
                                    </span>
                                </div>
                            </div>

                            {/* Opponent HP Bar */}
                            <div className="w-full h-3.5 bg-black/70 rounded-full overflow-hidden border border-red-600/40 mb-2.5">
                                <motion.div
                                    animate={{ width: `${oppHpPercent}%` }}
                                    transition={{ duration: 0.3 }}
                                    className={`h-full transition-colors ${
                                        oppHpPercent > 50
                                            ? 'bg-gradient-to-r from-red-600 to-rose-400'
                                            : oppHpPercent > 25
                                            ? 'bg-gradient-to-r from-amber-600 to-yellow-400'
                                            : 'bg-gradient-to-r from-red-800 to-red-600'
                                    }`}
                                />
                            </div>

                            {/* Opponent Attributes */}
                            <div className="flex items-center justify-between text-xs text-[#a89988] pt-1 border-t border-stone-800">
                                <span className="flex items-center gap-1 text-red-300">
                                    <Heart className="w-3.5 h-3.5" /> База: {oppBaseHp}
                                </span>
                                <span className="flex items-center gap-1 text-amber-300">
                                    <Zap className="w-3.5 h-3.5" /> Сила: {oppStrength}
                                </span>
                                <span className="flex items-center gap-1 text-blue-300">
                                    <Activity className="w-3.5 h-3.5" /> Спритність (d20): +{oppAgility}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Action Stage (Zones selection or Victory/Defeat screen) */}
                <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
                    {!duelOver ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Zone Selection 1: ATTACK */}
                                <div className="p-3.5 rounded-xl bg-[#1b1510] border border-amber-500/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">🎯</span>
                                            <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider">
                                                1. Куди завдати удару (Атака)
                                            </h4>
                                        </div>
                                        <span className="text-[10px] text-amber-200/70">
                                            Голова = 4x шкоди
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Head */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAttackZone('head')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedAttackZone === 'head'
                                                    ? 'bg-gradient-to-b from-red-600/30 to-amber-700/30 border-red-500 ring-2 ring-red-500/50 text-red-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🤕</span>
                                            <span className="text-xs font-black">ГОЛОВА</span>
                                            <span className="text-[9px] text-red-400 font-bold uppercase mt-0.5">💥 4x Урон</span>
                                        </button>

                                        {/* Torso */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAttackZone('torso')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedAttackZone === 'torso'
                                                    ? 'bg-gradient-to-b from-amber-600/30 to-yellow-700/30 border-amber-500 ring-2 ring-amber-500/50 text-amber-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🥋</span>
                                            <span className="text-xs font-black">ТУЛУБ</span>
                                            <span className="text-[9px] text-amber-400 font-bold uppercase mt-0.5">Корпус</span>
                                        </button>

                                        {/* Legs */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAttackZone('legs')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedAttackZone === 'legs'
                                                    ? 'bg-gradient-to-b from-blue-600/30 to-indigo-700/30 border-blue-500 ring-2 ring-blue-500/50 text-blue-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🦵</span>
                                            <span className="text-xs font-black">НОГИ</span>
                                            <span className="text-[9px] text-blue-400 font-bold uppercase mt-0.5">Підсічка</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Zone Selection 2: DEFENSE */}
                                <div className="p-3.5 rounded-xl bg-[#1b1510] border border-blue-500/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">🛡️</span>
                                            <h4 className="text-xs font-black uppercase text-blue-300 tracking-wider">
                                                2. Що захищати (Блок)
                                            </h4>
                                        </div>
                                        <span className="text-[10px] text-blue-200/70">
                                            Вгаданий блок = 25% шкоди
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Head */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDefenseZone('head')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedDefenseZone === 'head'
                                                    ? 'bg-gradient-to-b from-blue-600/30 to-indigo-700/30 border-blue-400 ring-2 ring-blue-400/50 text-blue-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🪖</span>
                                            <span className="text-xs font-black">ГОЛОВА</span>
                                            <span className="text-[9px] text-blue-400 font-bold uppercase mt-0.5">Блок щелепи</span>
                                        </button>

                                        {/* Torso */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDefenseZone('torso')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedDefenseZone === 'torso'
                                                    ? 'bg-gradient-to-b from-blue-600/30 to-indigo-700/30 border-blue-400 ring-2 ring-blue-400/50 text-blue-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🛡️</span>
                                            <span className="text-xs font-black">ТУЛУБ</span>
                                            <span className="text-[9px] text-blue-400 font-bold uppercase mt-0.5">Блок корпусу</span>
                                        </button>

                                        {/* Legs */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDefenseZone('legs')}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                                selectedDefenseZone === 'legs'
                                                    ? 'bg-gradient-to-b from-blue-600/30 to-indigo-700/30 border-blue-400 ring-2 ring-blue-400/50 text-blue-200 shadow-md'
                                                    : 'bg-[#140e0a] border-stone-800 text-stone-400 hover:border-stone-600'
                                            }`}
                                        >
                                            <span className="text-2xl mb-1">🥾</span>
                                            <span className="text-xs font-black">НОГИ</span>
                                            <span className="text-[9px] text-blue-400 font-bold uppercase mt-0.5">Стійка</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Strike Button */}
                            <button
                                onClick={handleExecuteStrike}
                                disabled={isResolving}
                                className="w-full py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 text-black font-black text-sm uppercase tracking-wider rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer disabled:opacity-50"
                            >
                                <span className="text-xl">🥊</span>
                                <span>{isResolving ? 'Кидок кубиків 1d20...' : 'ЗАВДАТИ УДАРУ! (Кидок 1d20 + Спритність)'}</span>
                            </button>

                            {/* Round Combat Log / Roll Breakdown */}
                            {lastLog && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3.5 rounded-xl bg-[#17120d] border border-amber-600/40 space-y-2 text-xs"
                                >
                                    <div className="font-bold text-amber-300 flex items-center justify-between border-b border-stone-800 pb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">🎲</span>
                                            <span>Результат Раунду #{lastLog.roundNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-[#c4b5a0]">
                                            <span>Атака: 1d20({lastLog.playerD20})+{playerStats.agility} = <strong className="text-amber-300">{lastLog.playerTotal}</strong> проти <strong className="text-red-400">{lastLog.oppDefTotal}</strong></span>
                                        </div>
                                    </div>

                                    <div className="text-stone-300 whitespace-pre-line leading-relaxed font-sans">
                                        {lastLog.text}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        /* Duel Finished Screen (Victory or Defeat) */
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-6 rounded-2xl bg-[#1b140e] border-2 border-amber-500 text-center space-y-4"
                        >
                            {duelOver === 'victory' ? (
                                <>
                                    <div className="inline-flex p-4 rounded-full bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400 text-4xl mb-1 animate-bounce">
                                        🏆
                                    </div>
                                    <h3 className="text-2xl font-black font-serif text-yellow-400">
                                        ПЕРЕМОГА НОКАУТОМ!
                                    </h3>
                                    <p className="text-xs text-[#c4b5a0] max-w-md mx-auto">
                                        Суперник <strong>{opponent.name}</strong> впав на долівку та не зміг підвестися! Таверна гримить оплесками на вашу честь!
                                    </p>

                                    {/* Rewards */}
                                    <div className="flex items-center justify-center gap-4 py-3 bg-[#140e0a] rounded-xl border border-stone-800 max-w-md mx-auto text-xs">
                                        <div className="flex items-center gap-1 text-yellow-300 font-black">
                                            <Coins className="w-4 h-4 text-amber-400" />
                                            <span>+{opponent.rewards.gold} Золота</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-200 font-black">
                                            <Shield className="w-4 h-4 text-amber-400" />
                                            <span>+{opponent.rewards.reputation} Слави</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-300 font-black">
                                            <Sparkles className="w-4 h-4 text-emerald-400" />
                                            <span>+{xpGained} XP Досвіду</span>
                                        </div>
                                    </div>

                                    {/* Level Up Banner */}
                                    {leveledUp && (
                                        <div className="p-3 bg-gradient-to-r from-amber-600/30 via-yellow-500/30 to-amber-600/30 border border-yellow-400 rounded-xl text-yellow-300 text-xs font-black flex items-center justify-center gap-2 animate-pulse">
                                            <Sparkles className="w-4 h-4 text-yellow-400" />
                                            <span>НОВИЙ РІВЕНЬ ДОСЯГНУТО! Рівень {newLevelNum}! Отримано +{pointsGained} очок прокачки!</span>
                                        </div>
                                    )}

                                    {/* 3-Victory NPC Retirement Milestone */}
                                    {(becameNpc || brawlWins >= 3) && (
                                        <div className="p-3 bg-gradient-to-r from-amber-600/40 via-yellow-500/30 to-amber-600/40 border-2 border-yellow-400 rounded-xl text-yellow-200 text-xs font-bold flex flex-col items-center gap-1 shadow-lg animate-pulse">
                                            <div className="flex items-center gap-1.5 text-yellow-300 font-black">
                                                <span>🍺 3-тя ПЕРЕМОГА! БОЄЦЬ СТАВ ЗВИЧАЙНИМ НПЦ!</span>
                                            </div>
                                            <p className="text-[11px] text-[#f5ebd7]/95 font-normal">
                                                {opponent.name} зазнав(ла) 3 поразок, зняв(ла) боксерські бинти і завершив(ла) бої. Тепер він мирно відпочиває за столиком таверни!
                                            </p>
                                        </div>
                                    )}

                                    {unlockedNext && (
                                        <div className="text-xs text-emerald-300 font-bold">
                                            🔓 Розблоковано наступного бійця: {unlockedNext}
                                        </div>
                                    )}

                                    {isConquered && (
                                        <div className="p-3 bg-yellow-500/20 border border-yellow-400 rounded-xl text-yellow-300 font-black text-xs">
                                            👑 ТАВЕРНУ ПІДКОРЕНО! Ви перемогли першого чемпіона закладу!
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="inline-flex p-4 rounded-full bg-red-950/60 border-2 border-red-500 text-red-400 text-4xl mb-1">
                                        🩸
                                    </div>
                                    <h3 className="text-2xl font-black font-serif text-red-400">
                                        ВИ ЗНЕПРИТОМНІЛИ!
                                    </h3>
                                    <p className="text-xs text-[#c4b5a0] max-w-md mx-auto">
                                        Удар супротивника виявився надто сильним. Шинкар допоміг вам підвестися та дав скуштувати цілющого узвару.
                                    </p>

                                    {/* Partial XP from loss */}
                                    <div className="flex items-center justify-center gap-2 text-xs text-[#c4b5a0] bg-[#140e0a] p-2.5 rounded-xl border border-stone-800 max-w-xs mx-auto">
                                        <Sparkles className="w-4 h-4 text-emerald-400" />
                                        <span>Отримано досвід за бій: <strong className="text-emerald-300">+{xpGained} XP</strong></span>
                                    </div>

                                    {leveledUp && (
                                        <div className="p-3 bg-gradient-to-r from-amber-600/30 via-yellow-500/30 to-amber-600/30 border border-yellow-400 rounded-xl text-yellow-300 text-xs font-black flex items-center justify-center gap-2">
                                            <Sparkles className="w-4 h-4 text-yellow-400" />
                                            <span>НОВИЙ РІВЕНЬ ДОСЯГНУТО! Рівень {newLevelNum}! (+{pointsGained} очок прокачки)</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Post duel actions */}
                            <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
                                {duelOver === 'victory' && (becameNpc || brawlWins >= 3) ? (
                                    <div className="px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-xs font-bold text-[#c4b5a0]">
                                        Боєць став мирним НПЦ (3/3 перемог)
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleRematch}
                                        className="px-5 py-2.5 bg-[#2b2118] hover:bg-[#3d2f23] border border-[#b8860b]/50 rounded-xl text-xs font-bold text-[#f5ebd7] transition flex items-center gap-1.5"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>
                                            {duelOver === 'victory' && brawlWins > 0 
                                                ? `Реванш (${brawlWins}/3)` 
                                                : 'Реванш'}
                                        </span>
                                    </button>
                                )}

                                {onOpenLevelUpModal && (
                                    <button
                                        onClick={onOpenLevelUpModal}
                                        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md"
                                    >
                                        <Zap className="w-4 h-4" />
                                        <span>Прокачка характеристик</span>
                                    </button>
                                )}

                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-md transition"
                                >
                                    Повернутися в таверну
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Footer status bar */}
                <div className="p-3 bg-[#120e0b] border-t border-[#3b2d1f] flex justify-between items-center text-xs text-[#a89988]">
                    <div className="flex items-center gap-3">
                        <span>Золото: <strong className="text-amber-300">{progress.playerGold} 🪙</strong></span>
                        <span>•</span>
                        <span>Досвід: <strong className="text-emerald-300">{playerStats.xp} / {playerStats.xpToNextLevel} XP</strong></span>
                    </div>

                    {playerStats.statPoints > 0 && onOpenLevelUpModal && (
                        <button
                            onClick={onOpenLevelUpModal}
                            className="px-2.5 py-1 bg-yellow-500/25 border border-yellow-400 rounded-full text-yellow-300 text-[11px] font-black animate-pulse flex items-center gap-1 cursor-pointer"
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>Доступні очки прокачки: {playerStats.statPoints}</span>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

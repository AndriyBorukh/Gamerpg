import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    Swords, 
    Shield, 
    RotateCcw, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    Trophy,
    Heart,
    Flame,
    Zap
} from 'lucide-react';

interface DiceDuelModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

export default function DiceDuelModal({
    expectedXpReward = 80,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: DiceDuelModalProps) {
    const [playerDamage, setPlayerDamage] = useState<number>(0);
    const [opponentDamage, setOpponentDamage] = useState<number>(0);
    const maxDamage = 3;

    // Dice values: null means not yet rolled in this clash round
    const [playerDieValue, setPlayerDieValue] = useState<number | null>(null);
    const [opponentDieValue, setOpponentDieValue] = useState<number | null>(null);

    // Current rolling status: which specific die is currently rolling
    const [rollingEntity, setRollingEntity] = useState<'player' | 'opponent' | null>(null);

    // activeAttacker: whose round it is
    const [activeAttacker, setActiveAttacker] = useState<'player' | 'opponent'>('player');

    // clashStep:
    // 'ready_attack' -> attacker needs to roll attack die
    // 'ready_defend' -> attacker has rolled, defender needs to roll defense die
    // 'clash_resolved' -> both have rolled, result calculated, ready for next round
    const [clashStep, setClashStep] = useState<'ready_attack' | 'ready_defend' | 'clash_resolved'>('ready_attack');

    const [gameState, setGameState] = useState<'turn' | 'game_over'>('turn');
    const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
    const [duelCommentary, setDuelCommentary] = useState<string>('Ваш раунд! Киньте кубик атаки (⚔️ d20), щоб розпочати випад.');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [log, setLog] = useState<string[]>([]);

    const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (rollIntervalRef.current) {
                clearInterval(rollIntervalRef.current);
                rollIntervalRef.current = null;
            }
        };
    }, []);

    const playTone = (type: 'roll' | 'hit' | 'block' | 'win_match' | 'lose_match') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'roll') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'hit') {
                [600, 250, 100].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.05);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.15);
                    o.start(ctx.currentTime + i * 0.05);
                    o.stop(ctx.currentTime + i * 0.05 + 0.15);
                });
            } else if (type === 'block') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(700, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'win_match') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
                    o.start(ctx.currentTime + i * 0.12);
                    o.stop(ctx.currentTime + i * 0.12 + 0.3);
                });
            } else if (type === 'lose_match') {
                [320, 240, 160].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.2);
                });
            }
        } catch {
            // Audio context disabled
        }
    };

    // Roll handlers for sequential turns
    const handleRollAttack = () => {
        if (rollingEntity !== null || clashStep !== 'ready_attack' || gameState === 'game_over') return;
        const currentEntity = activeAttacker; // 'player' or 'opponent'
        setRollingEntity(currentEntity);
        playTone('roll');

        let ticks = 0;
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = setInterval(() => {
            const randomVal = Math.floor(Math.random() * 20) + 1;
            if (currentEntity === 'player') {
                setPlayerDieValue(randomVal);
            } else {
                setOpponentDieValue(randomVal);
            }
            ticks++;

            if (ticks > 8) {
                if (rollIntervalRef.current) {
                    clearInterval(rollIntervalRef.current);
                    rollIntervalRef.current = null;
                }
                const finalAtk = Math.floor(Math.random() * 20) + 1;
                if (currentEntity === 'player') {
                    setPlayerDieValue(finalAtk);
                    setRollingEntity(null);
                    setClashStep('ready_defend');
                    setDuelCommentary(`⚔️ Ваша Атака: ${finalAtk}! Тепер кидок захисту здійснює ${opponent.name}...`);
                } else {
                    setOpponentDieValue(finalAtk);
                    setRollingEntity(null);
                    setClashStep('ready_defend');
                    setDuelCommentary(`⚔️ Атака ${opponent.name}: ${finalAtk}! Ваш час кинути кубик захисту (🛡️ d20)!`);
                }
            }
        }, 70);
    };

    const handleRollDefense = () => {
        if (rollingEntity !== null || clashStep !== 'ready_defend' || gameState === 'game_over') return;
        const defendingEntity = activeAttacker === 'player' ? 'opponent' : 'player';
        setRollingEntity(defendingEntity);
        playTone('roll');

        let ticks = 0;
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = setInterval(() => {
            const randomVal = Math.floor(Math.random() * 20) + 1;
            if (defendingEntity === 'player') {
                setPlayerDieValue(randomVal);
            } else {
                setOpponentDieValue(randomVal);
            }
            ticks++;

            if (ticks > 8) {
                if (rollIntervalRef.current) {
                    clearInterval(rollIntervalRef.current);
                    rollIntervalRef.current = null;
                }
                const finalDef = Math.floor(Math.random() * 20) + 1;

                if (activeAttacker === 'player') {
                    // Player attacked, opponent defends
                    const pAtk = playerDieValue!;
                    setOpponentDieValue(finalDef);
                    setRollingEntity(null);
                    setClashStep('clash_resolved');

                    if (pAtk > finalDef) {
                        const newOppDamage = opponentDamage + 1;
                        setOpponentDamage(newOppDamage);
                        playTone('hit');
                        setDuelCommentary(`💥 ВЛУЧАННЯ! Ваша Атака (${pAtk}) подолала Захист ${opponent.name} (${finalDef})! +1 Пошкодження супротивнику!`);
                        setLog(prev => [`[Ваш випад]: ⚔️ Атака ${pAtk} > 🛡️ Захист ${finalDef} ➔ Пошкодження ${opponent.name}! (${newOppDamage}/${maxDamage})`, ...prev.slice(0, 15)]);

                        if (newOppDamage >= maxDamage) {
                            setGameState('game_over');
                            setWinner('player');
                            playTone('win_match');
                        }
                    } else {
                        playTone('block');
                        setDuelCommentary(`🛡️ БЛОК! Захист ${opponent.name} (${finalDef}) відбив вашу Атаку (${pAtk})! Пошкодження немає.`);
                        setLog(prev => [`[Ваш випад]: ⚔️ Атака ${pAtk} ≤ 🛡️ Захист ${finalDef} ➔ ${opponent.name} захистився!`, ...prev.slice(0, 15)]);
                    }
                } else {
                    // Opponent attacked, player defends
                    const oAtk = opponentDieValue!;
                    setPlayerDieValue(finalDef);
                    setRollingEntity(null);
                    setClashStep('clash_resolved');

                    if (oAtk > finalDef) {
                        const newPlayDamage = playerDamage + 1;
                        setPlayerDamage(newPlayDamage);
                        playTone('hit');
                        setDuelCommentary(`🩸 ВАС ПОРАНЕНО! Атака ${opponent.name} (${oAtk}) пробила ваш Захист (${finalDef})! +1 Пошкодження Герою!`);
                        setLog(prev => [`[Випад ${opponent.name}]: ⚔️ Атака ${oAtk} > 🛡️ Захист ${finalDef} ➔ Ви отримали пошкодження! (${newPlayDamage}/${maxDamage})`, ...prev.slice(0, 15)]);

                        if (newPlayDamage >= maxDamage) {
                            setGameState('game_over');
                            setWinner('opponent');
                            playTone('lose_match');
                        }
                    } else {
                        playTone('block');
                        setDuelCommentary(`🛡️ ВІДБИТО! Ваш Захист (${finalDef}) успішно стримав Атаку ${opponent.name} (${oAtk})!`);
                        setLog(prev => [`[Випад ${opponent.name}]: ⚔️ Атака ${oAtk} ≤ 🛡️ Захист ${finalDef} ➔ Ви успішно відбили удар!`, ...prev.slice(0, 15)]);
                    }
                }
            }
        }, 70);
    };

    const handleNextRound = () => {
        if (gameState === 'game_over') return;
        const nextAttacker = activeAttacker === 'player' ? 'opponent' : 'player';
        setActiveAttacker(nextAttacker);
        setPlayerDieValue(null);
        setOpponentDieValue(null);
        setRollingEntity(null);
        setClashStep('ready_attack');

        if (nextAttacker === 'player') {
            setDuelCommentary('Ваш раунд! Киньте кубик атаки (⚔️ d20).');
        } else {
            setDuelCommentary(`Раунд ${opponent.name}! Супротивник готується кинути кубик атаки.`);
        }
    };

    const handleRestart = () => {
        setPlayerDamage(0);
        setOpponentDamage(0);
        setActiveAttacker('player');
        setPlayerDieValue(null);
        setOpponentDieValue(null);
        setRollingEntity(null);
        setClashStep('ready_attack');
        setGameState('turn');
        setWinner(null);
        setDuelCommentary('Новий двобій розпочато! Ваш раунд: кидайте кубик атаки (⚔️ d20)!');
        setLog([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                className="relative w-full max-w-2xl bg-[#181110] border-2 border-rose-500/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="bg-[#241412] border-b border-rose-500/40 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="text-2xl p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40">
                            ⚔️
                        </div>
                        <div>
                            <h2 className="text-lg font-black font-serif text-rose-200">
                                Двобій на костях d20 (Атака vs Захист)
                            </h2>
                            <p className="text-xs text-rose-400/80">
                                Таверна «{tavernName}» • Бій до {maxDamage} пошкоджень проти {opponent.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-rose-400 hover:text-rose-200 transition cursor-pointer"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-rose-400 hover:text-rose-200 transition cursor-pointer"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Rules */}
                {showRules && (
                    <div className="p-3 bg-[#130b0a] border-b border-rose-500/30 text-xs text-stone-300 space-y-1.5">
                        <p className="font-bold text-rose-300">📜 Правила двобою на костях:</p>
                        <ul className="list-disc pl-5 space-y-1 text-stone-300">
                            <li>
                                <strong className="text-amber-300">Ваш хід:</strong> Ви кидаєте <span className="text-rose-400 font-bold">кубик атаки (⚔️ d20)</span>, а супротивник кидає <span className="text-sky-400 font-bold">кубик захисту (🛡️ d20)</span>. Якщо Атака більша за Захист — супротивнику наноситься 1 очко пошкоджень.
                            </li>
                            <li>
                                <strong className="text-rose-300">Хід супротивника:</strong> Супротивник кидає <span className="text-rose-400 font-bold">кубик атаки (⚔️ d20)</span>, а Ви кидаєте <span className="text-sky-400 font-bold">кубик захисту (🛡️ d20)</span>. Якщо Атака більша за Захист — Герою наноситься 1 очко пошкоджень.
                            </li>
                            <li>
                                Бій триває до <strong className="text-amber-400 font-bold">3 пошкоджень</strong> одного з бійців!
                            </li>
                        </ul>
                    </div>
                )}

                {/* Damage Status Bar */}
                <div className="grid grid-cols-3 bg-[#140b0a] border-b border-rose-900/40 py-3 px-4 text-center items-center">
                    {/* Player */}
                    <div className="flex flex-col items-center">
                        <div className="text-2xl">🧙‍♂️</div>
                        <span className="text-xs font-bold text-rose-200">Ви (Герой)</span>
                        <div className="flex gap-1 mt-1">
                            {Array.from({ length: maxDamage }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                                        i < playerDamage 
                                            ? 'bg-red-600 text-white shadow-sm shadow-red-500/50 ring-1 ring-red-400' 
                                            : 'bg-stone-800 border border-stone-700 text-stone-600'
                                    }`}
                                >
                                    {i < playerDamage ? '🩸' : ''}
                                </span>
                            ))}
                        </div>
                        <span className="text-[10px] text-stone-400 mt-0.5">Пошкоджень: {playerDamage}/{maxDamage}</span>
                    </div>

                    {/* Turn Phase */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Чий хід</span>
                        <div className={`mt-0.5 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 border shadow-sm ${
                            activeAttacker === 'player'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-amber-500/10'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-rose-500/10'
                        }`}>
                            <span>{activeAttacker === 'player' ? '⚔️ Ваш хід (Атака)' : `⚔️ Хід ${opponent.name} (Захищайтесь)`}</span>
                        </div>
                    </div>

                    {/* Opponent */}
                    <div className="flex flex-col items-center">
                        <div className="text-2xl">{opponent.avatar}</div>
                        <span className="text-xs font-bold text-rose-200">{opponent.name}</span>
                        <div className="flex gap-1 mt-1">
                            {Array.from({ length: maxDamage }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                                        i < opponentDamage 
                                            ? 'bg-red-600 text-white shadow-sm shadow-red-500/50 ring-1 ring-red-400' 
                                            : 'bg-stone-800 border border-stone-700 text-stone-600'
                                    }`}
                                >
                                    {i < opponentDamage ? '🩸' : ''}
                                </span>
                            ))}
                        </div>
                        <span className="text-[10px] text-stone-400 mt-0.5">Пошкоджень: {opponentDamage}/{maxDamage}</span>
                    </div>
                </div>

                {/* Clash Arena Area: Step-by-Step Sequential Dice */}
                <div className="flex-1 p-5 flex flex-col items-center justify-center bg-gradient-to-b from-[#181110] via-[#120a09] to-[#181110]">
                    <div className="w-full max-w-lg mb-4">
                        {/* Turn Phase Banner */}
                        <div className="text-center mb-3 flex items-center justify-center gap-2">
                            <span className="text-xs font-bold px-3 py-1 rounded-md bg-stone-900/90 border border-stone-800 text-stone-300 shadow-sm">
                                {activeAttacker === 'player' 
                                    ? '1️⃣ Ваш випад: спочатку кидок АТАКИ, потім кидок ЗАХИСТУ супротивника'
                                    : `1️⃣ Випад ${opponent.name}: спочатку кидок АТАКИ, потім ваш кидок ЗАХИСТУ`}
                            </span>
                        </div>

                        {/* 2 Dice on the table */}
                        <div className="grid grid-cols-2 gap-4 sm:gap-8 items-center">
                            {/* Left Side: Player's Die */}
                            <div className={`p-4 rounded-2xl border flex flex-col items-center transition-all ${
                                activeAttacker === 'player'
                                    ? (clashStep === 'ready_attack' ? 'bg-red-950/50 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-950/60' : 'bg-red-950/25 border-red-900/60')
                                    : (clashStep === 'ready_defend' ? 'bg-sky-950/50 border-sky-400 ring-2 ring-sky-500/40 shadow-lg shadow-sky-950/60' : 'bg-sky-950/25 border-sky-900/60')
                            }`}>
                                <span className="text-xs font-bold text-stone-200 mb-2 flex items-center gap-1">
                                    <span>🧙‍♂️ Ви (Герой)</span>
                                </span>

                                <div className="flex flex-col items-center">
                                    <motion.div
                                        animate={rollingEntity === 'player' ? { rotate: [0, 180, 360], scale: [1, 1.15, 1] } : {}}
                                        transition={{ repeat: rollingEntity === 'player' ? Infinity : 0, duration: 0.22 }}
                                        className={`w-20 h-20 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white border-2 transition-all ${
                                            activeAttacker === 'player'
                                                ? 'bg-gradient-to-br from-red-600 via-rose-700 to-red-900 border-red-400 shadow-red-500/30'
                                                : 'bg-gradient-to-br from-sky-600 via-blue-700 to-blue-900 border-sky-400 shadow-sky-500/30'
                                        }`}
                                    >
                                        {playerDieValue !== null ? (
                                            <span className="text-2xl font-black font-mono">{playerDieValue}</span>
                                        ) : (
                                            <span className="text-2xl font-black opacity-60 font-mono">
                                                {rollingEntity === 'player' ? '🎲' : '?'}
                                            </span>
                                        )}
                                        <span className="text-[9px] uppercase tracking-wider font-black mt-0.5">
                                            {activeAttacker === 'player' ? '⚔️ Атака' : '🛡️ Захист'}
                                        </span>
                                    </motion.div>
                                    <span className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 ${
                                        activeAttacker === 'player' ? 'text-red-400' : 'text-sky-400'
                                    }`}>
                                        {activeAttacker === 'player' ? <Swords className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                        {playerDieValue !== null 
                                            ? `d20 = ${playerDieValue}` 
                                            : (activeAttacker === 'player' && clashStep === 'ready_attack' ? '👉 Ваш кидок' : (activeAttacker === 'opponent' && clashStep === 'ready_defend' ? '👉 Ваш захист' : 'Очікує черги'))}
                                    </span>
                                </div>
                            </div>

                            {/* Right Side: Opponent's Die */}
                            <div className={`p-4 rounded-2xl border flex flex-col items-center transition-all ${
                                activeAttacker === 'opponent'
                                    ? (clashStep === 'ready_attack' ? 'bg-red-950/50 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-950/60' : 'bg-red-950/25 border-red-900/60')
                                    : (clashStep === 'ready_defend' ? 'bg-sky-950/50 border-sky-400 ring-2 ring-sky-500/40 shadow-lg shadow-sky-950/60' : 'bg-sky-950/25 border-sky-900/60')
                            }`}>
                                <span className="text-xs font-bold text-stone-200 mb-2 flex items-center gap-1">
                                    <span>{opponent.avatar} {opponent.name}</span>
                                </span>

                                <div className="flex flex-col items-center">
                                    <motion.div
                                        animate={rollingEntity === 'opponent' ? { rotate: [0, -180, -360], scale: [1, 1.15, 1] } : {}}
                                        transition={{ repeat: rollingEntity === 'opponent' ? Infinity : 0, duration: 0.22 }}
                                        className={`w-20 h-20 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white border-2 transition-all ${
                                            activeAttacker === 'opponent'
                                                ? 'bg-gradient-to-br from-red-600 via-rose-700 to-red-900 border-red-400 shadow-red-500/30'
                                                : 'bg-gradient-to-br from-sky-600 via-blue-700 to-blue-900 border-sky-400 shadow-sky-500/30'
                                        }`}
                                    >
                                        {opponentDieValue !== null ? (
                                            <span className="text-2xl font-black font-mono">{opponentDieValue}</span>
                                        ) : (
                                            <span className="text-2xl font-black opacity-60 font-mono">
                                                {rollingEntity === 'opponent' ? '🎲' : '?'}
                                            </span>
                                        )}
                                        <span className="text-[9px] uppercase tracking-wider font-black mt-0.5">
                                            {activeAttacker === 'opponent' ? '⚔️ Атака' : '🛡️ Захист'}
                                        </span>
                                    </motion.div>
                                    <span className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 ${
                                        activeAttacker === 'opponent' ? 'text-red-400' : 'text-sky-400'
                                    }`}>
                                        {activeAttacker === 'opponent' ? <Swords className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                        {opponentDieValue !== null 
                                            ? `d20 = ${opponentDieValue}` 
                                            : (activeAttacker === 'opponent' && clashStep === 'ready_attack' ? '👉 Кидок ворога' : (activeAttacker === 'player' && clashStep === 'ready_defend' ? '👉 Захист ворога' : 'Очікує черги'))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Commentary Banner */}
                    <div className="w-full max-w-lg mb-4 p-2.5 rounded-xl bg-[#201311] border border-rose-950 text-xs font-bold text-center text-rose-200">
                        {duelCommentary}
                    </div>

                    {/* Step-by-Step Action Controls */}
                    {gameState !== 'game_over' ? (
                        <div className="w-full max-w-md flex flex-col items-center gap-2">
                            {clashStep === 'ready_attack' && (
                                <button
                                    onClick={handleRollAttack}
                                    disabled={rollingEntity !== null}
                                    className={`w-full py-3.5 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-lg active:scale-95 ${
                                        rollingEntity !== null
                                            ? 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                                            : activeAttacker === 'player'
                                            ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-400 hover:brightness-110 ring-2 ring-red-400/30'
                                            : 'bg-gradient-to-r from-orange-600 via-amber-600 to-red-700 text-white border-amber-400 hover:brightness-110 ring-2 ring-amber-400/30'
                                    }`}
                                >
                                    <Swords className="w-5 h-5" />
                                    <span>
                                        {rollingEntity !== null
                                            ? 'Кубик атаки котиться...'
                                            : activeAttacker === 'player'
                                            ? 'КРОК 1: КИНУТИ КУБИК АТАКИ (⚔️ d20)'
                                            : `КРОК 1: ХІД ВОРОГА — КИДОК АТАКИ ${opponent.name} (⚔️ d20)`}
                                    </span>
                                </button>
                            )}

                            {clashStep === 'ready_defend' && (
                                <button
                                    onClick={handleRollDefense}
                                    disabled={rollingEntity !== null}
                                    className={`w-full py-3.5 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-lg active:scale-95 ${
                                        rollingEntity !== null
                                            ? 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                                            : activeAttacker === 'player'
                                            ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white border-sky-400 hover:brightness-110 ring-2 ring-sky-400/30'
                                            : 'bg-gradient-to-r from-sky-500 via-cyan-600 to-blue-700 text-white border-sky-300 hover:brightness-110 ring-2 ring-sky-400/40 animate-pulse'
                                    }`}
                                >
                                    <Shield className="w-5 h-5" />
                                    <span>
                                        {rollingEntity !== null
                                            ? 'Кубик захисту котиться...'
                                            : activeAttacker === 'player'
                                            ? `КРОК 2: КИДОК ЗАХИСТУ ${opponent.name} (🛡️ d20)`
                                            : 'КРОК 2: ВІДБИТИ УДАР — ВАШ КИДОК ЗАХИСТУ (🛡️ d20)'}
                                    </span>
                                </button>
                            )}

                            {clashStep === 'clash_resolved' && (
                                <button
                                    onClick={handleNextRound}
                                    className="w-full py-3.5 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 border bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-stone-950 border-amber-300 hover:brightness-110 ring-2 ring-amber-400/30 transition-all cursor-pointer shadow-lg active:scale-95"
                                >
                                    <span>
                                        ПРОДОВЖИТИ ДВОБІЙ ➔ ({activeAttacker === 'player' ? `Хід ${opponent.name}` : 'Ваш хід'})
                                    </span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-3 text-center p-4 bg-[#231513] border border-rose-500/50 rounded-2xl w-full max-w-sm"
                        >
                            <div className="text-3xl">
                                {winner === 'player' ? '🏆 ⚔️ 👑' : '💀 🥀'}
                            </div>
                            <div>
                                <h3 className={`text-base font-black font-serif ${
                                    winner === 'player' ? 'text-amber-300' : 'text-rose-400'
                                }`}>
                                    {winner === 'player' ? 'Блискуча перемога у двобої!' : 'Поразка у двобої на костях!'}
                                </h3>
                                <p className="text-xs text-stone-300 mt-1">
                                    {winner === 'player' 
                                        ? `Ви нанесли 3 пошкодження супротивнику ${opponent.name}! Отримано золото та +${expectedXpReward} XP!`
                                        : `${opponent.name} наніс вам 3 пошкодження та виграв двобій.`}
                                </p>
                            </div>

                            <div className="flex gap-2 w-full pt-1">
                                <button
                                    onClick={handleRestart}
                                    className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Ще раз</span>
                                </button>

                                <button
                                    onClick={winner === 'player' ? onVictory : onDefeat}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-lg ${
                                        winner === 'player'
                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 hover:brightness-110'
                                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                                    }`}
                                >
                                    {winner === 'player' ? 'Забрати нагороду' : 'Залишити ринг'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* History Log */}
                {log.length > 0 && (
                    <div className="bg-[#0e0706] border-t border-rose-950 p-2.5 max-h-20 overflow-y-auto text-[10px] font-mono text-stone-400 space-y-0.5 scrollbar-thin scrollbar-thumb-stone-800">
                        {log.map((entry, idx) => (
                            <div key={idx} className="leading-tight">
                                • {entry}
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}


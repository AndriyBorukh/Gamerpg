import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    Dices, 
    RotateCcw, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    Trophy,
    Sparkles,
    Flame,
    Zap
} from 'lucide-react';

interface D20DiceModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

export default function D20DiceModal({
    expectedXpReward = 60,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: D20DiceModalProps) {
    const [playerScore, setPlayerScore] = useState<number>(0);
    const [opponentScore, setOpponentScore] = useState<number>(0);
    const [round, setRound] = useState<number>(1);
    const targetWins = 3;

    const [playerD20, setPlayerD20] = useState<number>(20);
    const [opponentD20, setOpponentD20] = useState<number>(20);
    const [isRolling, setIsRolling] = useState<boolean>(false);
    const [gameState, setGameState] = useState<'ready' | 'rolled' | 'game_over'>('ready');
    const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
    const [roundText, setRoundText] = useState<string>('');
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

    const playTone = (type: 'roll' | 'nat20' | 'nat1' | 'win_round' | 'lose_round' | 'match_win') => {
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
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'nat20') {
                [523, 659, 783, 1046, 1318].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.07);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.07 + 0.15);
                    o.start(ctx.currentTime + i * 0.07);
                    o.stop(ctx.currentTime + i * 0.07 + 0.15);
                });
            } else if (type === 'nat1') {
                [300, 240, 180, 120].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.09);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.09 + 0.15);
                    o.start(ctx.currentTime + i * 0.09);
                    o.stop(ctx.currentTime + i * 0.09 + 0.15);
                });
            } else if (type === 'win_round') {
                [523.25, 659.25, 783.99].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
                    o.start(ctx.currentTime + i * 0.08);
                    o.stop(ctx.currentTime + i * 0.08 + 0.15);
                });
            } else if (type === 'lose_round') {
                [380, 310, 240].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
                    o.start(ctx.currentTime + i * 0.08);
                    o.stop(ctx.currentTime + i * 0.08 + 0.15);
                });
            } else if (type === 'match_win') {
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
            }
        } catch {
            // AudioContext not supported
        }
    };

    const handleRollDice = () => {
        if (isRolling || gameState === 'game_over') return;
        setIsRolling(true);
        setGameState('ready');
        playTone('roll');

        // Dice animation interval
        let count = 0;
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = setInterval(() => {
            setPlayerD20(Math.floor(Math.random() * 20) + 1);
            setOpponentD20(Math.floor(Math.random() * 20) + 1);
            count++;
            if (count > 10) {
                if (rollIntervalRef.current) {
                    clearInterval(rollIntervalRef.current);
                    rollIntervalRef.current = null;
                }
                const finalPlayer = Math.floor(Math.random() * 20) + 1;
                const finalOpponent = Math.floor(Math.random() * 20) + 1;
                setPlayerD20(finalPlayer);
                setOpponentD20(finalOpponent);
                setIsRolling(false);
                setGameState('rolled');

                if (finalPlayer === 20) playTone('nat20');
                else if (finalPlayer === 1) playTone('nat1');

                if (finalPlayer > finalOpponent) {
                    const newScore = playerScore + 1;
                    setPlayerScore(newScore);
                    playTone('win_round');
                    const isNat = finalPlayer === 20 ? ' (🌟 Критичний 20!)' : '';
                    setRoundText(`Перемога в раунді! ${finalPlayer} проти ${finalOpponent}${isNat}! +1 очко!`);
                    setLog(prev => [`Раунд ${round}: Ви викинули ${finalPlayer}, ${opponent.name} викинув ${finalOpponent} -> +1 Очко Герою!`, ...prev.slice(0, 15)]);

                    if (newScore >= targetWins) {
                        setGameState('game_over');
                        setWinner('player');
                        playTone('match_win');
                    } else {
                        setRound(r => r + 1);
                    }
                } else if (finalOpponent > finalPlayer) {
                    const newScore = opponentScore + 1;
                    setOpponentScore(newScore);
                    playTone('lose_round');
                    const isNat = finalOpponent === 20 ? ' (💀 Суперник викинув 20!)' : '';
                    setRoundText(`Поразка в раунді! ${opponent.name} викинув ${finalOpponent} проти ваших ${finalPlayer}${isNat}.`);
                    setLog(prev => [`Раунд ${round}: Ви викинули ${finalPlayer}, ${opponent.name} викинув ${finalOpponent} -> +1 Очко ${opponent.name}!`, ...prev.slice(0, 15)]);

                    if (newScore >= targetWins) {
                        setGameState('game_over');
                        setWinner('opponent');
                    } else {
                        setRound(r => r + 1);
                    }
                } else {
                    setRoundText(`Нічия! Обидва викинули по ${finalPlayer}! Перекидаємо кістки!`);
                    setLog(prev => [`Раунд ${round}: Нічия (${finalPlayer} = ${finalOpponent}) -> перекидання!`, ...prev.slice(0, 15)]);
                }
            }
        }, 80);
    };

    const handleRestart = () => {
        setPlayerScore(0);
        setOpponentScore(0);
        setRound(1);
        setGameState('ready');
        setWinner(null);
        setRoundText('');
        setLog([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                className="relative w-full max-w-2xl bg-[#16120e] border-2 border-indigo-500/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="bg-[#181324] border-b border-indigo-500/40 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="text-2xl p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40">
                            🎲
                        </div>
                        <div>
                            <h2 className="text-lg font-black font-serif text-indigo-200">
                                Гра в d20 кості (D20 Dice High-Roll)
                            </h2>
                            <p className="text-xs text-indigo-400/80">
                                Таверна «{tavernName}» • Гра до {targetWins} перемог проти {opponent.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-indigo-400 hover:text-indigo-200 transition cursor-pointer"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-indigo-400 hover:text-indigo-200 transition cursor-pointer"
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

                {/* Rules accordion */}
                {showRules && (
                    <div className="p-3 bg-[#110e1a] border-b border-indigo-500/30 text-xs text-stone-300 space-y-1">
                        <p className="font-bold text-indigo-300">📜 Правила гри в d20 кості:</p>
                        <ul className="list-disc pl-5 space-y-0.5 text-stone-400">
                            <li>Обидва гравці одночасно кидають двадцятигранні кістки (<strong className="text-indigo-300">1d20</strong>).</li>
                            <li>Той, у кого випала більша грань — виграє раунд та отримує <strong className="text-indigo-300">+1 очко</strong>.</li>
                            <li>При однаковому значенні грається додатковий раунд (нічия).</li>
                            <li>Перемагає той, хто першим здобуде <strong className="text-indigo-300">3 очки</strong>!</li>
                        </ul>
                    </div>
                )}

                {/* Scoreboard */}
                <div className="grid grid-cols-3 bg-[#120e1c] border-b border-indigo-900/40 py-3 px-4 text-center items-center">
                    {/* Player */}
                    <div className="flex flex-col items-center">
                        <div className="text-2xl">🧙‍♂️</div>
                        <span className="text-xs font-bold text-indigo-300">Ви (Герой)</span>
                        <div className="text-2xl font-black font-mono text-indigo-400 mt-0.5">
                            {playerScore} <span className="text-xs text-stone-500 font-normal">/ {targetWins}</span>
                        </div>
                    </div>

                    {/* VS & Round */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Раунд {round}</span>
                        <span className="text-sm font-black text-indigo-400 my-0.5">VS</span>
                        <div className="flex gap-1">
                            {Array.from({ length: targetWins }).map((_, i) => (
                                <span 
                                    key={i} 
                                    className={`w-2.5 h-2.5 rounded-full ${
                                        i < playerScore ? 'bg-indigo-400 shadow-sm shadow-indigo-400/50' : 'bg-stone-800'
                                    }`} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Opponent */}
                    <div className="flex flex-col items-center">
                        <div className="text-2xl">{opponent.avatar}</div>
                        <span className="text-xs font-bold text-indigo-300">{opponent.name}</span>
                        <div className="text-2xl font-black font-mono text-indigo-400 mt-0.5">
                            {opponentScore} <span className="text-xs text-stone-500 font-normal">/ {targetWins}</span>
                        </div>
                    </div>
                </div>

                {/* Dice Stage Area */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[220px] bg-gradient-to-b from-[#16121f] via-[#100d17] to-[#16121f] relative">
                    <div className="grid grid-cols-2 gap-8 sm:gap-14 items-center justify-center mb-6">
                        {/* Player d20 */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-indigo-300 mb-2">Ваш кубик d20</span>
                            <motion.div
                                animate={isRolling ? { rotate: [0, 180, 360], scale: [1, 1.15, 1] } : {}}
                                transition={{ repeat: isRolling ? Infinity : 0, duration: 0.3 }}
                                className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl select-none transition-all ${
                                    playerD20 === 20
                                        ? 'bg-gradient-to-br from-yellow-500 to-amber-700 border-yellow-300 ring-4 ring-yellow-400/40 text-black animate-pulse'
                                        : playerD20 === 1
                                        ? 'bg-gradient-to-br from-red-900 to-stone-900 border-red-500 text-red-300'
                                        : 'bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-900 border-indigo-400 text-white'
                                }`}
                            >
                                <span className="text-3xl font-black font-mono tracking-tight">
                                    {playerD20}
                                </span>
                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-80">
                                    {playerD20 === 20 ? '🌟 NAT 20' : playerD20 === 1 ? '💀 FUMBLE' : 'd20'}
                                </span>
                            </motion.div>
                        </div>

                        {/* Opponent d20 */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-stone-400 mb-2">{opponent.name}</span>
                            <motion.div
                                animate={isRolling ? { rotate: [0, -180, -360], scale: [1, 1.15, 1] } : {}}
                                transition={{ repeat: isRolling ? Infinity : 0, duration: 0.3 }}
                                className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl select-none transition-all ${
                                    opponentD20 === 20
                                        ? 'bg-gradient-to-br from-yellow-500 to-amber-700 border-yellow-300 ring-4 ring-yellow-400/40 text-black'
                                        : opponentD20 === 1
                                        ? 'bg-gradient-to-br from-red-900 to-stone-900 border-red-500 text-red-300'
                                        : 'bg-gradient-to-br from-stone-800 to-stone-900 border-stone-700 text-stone-300'
                                }`}
                            >
                                <span className="text-3xl font-black font-mono tracking-tight">
                                    {opponentD20}
                                </span>
                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-80">
                                    {opponentD20 === 20 ? '🌟 NAT 20' : opponentD20 === 1 ? '💀 FUMBLE' : 'd20'}
                                </span>
                            </motion.div>
                        </div>
                    </div>

                    {/* Commentary */}
                    {roundText && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`px-4 py-1.5 rounded-xl border text-xs font-bold text-center mb-4 max-w-md ${
                                playerD20 > opponentD20
                                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                                    : playerD20 < opponentD20
                                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                                    : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                            }`}
                        >
                            {roundText}
                        </motion.div>
                    )}

                    {/* Controls */}
                    {gameState !== 'game_over' ? (
                        <button
                            onClick={handleRollDice}
                            disabled={isRolling}
                            className={`py-3 px-8 rounded-xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-lg active:scale-95 ${
                                isRolling
                                    ? 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white border-indigo-400 hover:brightness-110 ring-2 ring-indigo-400/20'
                            }`}
                        >
                            <Dices className="w-5 h-5" />
                            <span>{isRolling ? 'Кістки котяться по столу...' : 'КИДАТИ d20 КОСТІ'}</span>
                        </button>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-3 text-center p-4 bg-[#1b1527] border border-indigo-500/50 rounded-2xl w-full max-w-sm"
                        >
                            <div className="text-3xl">
                                {winner === 'player' ? '🏆 🎲 👑' : '💀 🥀'}
                            </div>
                            <div>
                                <h3 className={`text-base font-black font-serif ${
                                    winner === 'player' ? 'text-indigo-300' : 'text-rose-400'
                                }`}>
                                    {winner === 'player' ? 'Перемога в d20 костях!' : 'Поразка в d20 костях!'}
                                </h3>
                                <p className="text-xs text-stone-300 mt-1">
                                    {winner === 'player' 
                                        ? `Ви здолали ${opponent.name} з рахунком ${playerScore}:${opponentScore}! Отримано золото та +${expectedXpReward} XP!`
                                        : `${opponent.name} здобув перемогу з рахунком ${opponentScore}:${playerScore}.`}
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
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:brightness-110'
                                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                                    }`}
                                >
                                    {winner === 'player' ? 'Забрати виграш' : 'Залишити стіл'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* History Log */}
                {log.length > 0 && (
                    <div className="bg-[#0f0c16] border-t border-indigo-900/40 p-3 max-h-24 overflow-y-auto text-[11px] font-mono text-stone-400 space-y-0.5 scrollbar-thin scrollbar-thumb-stone-800">
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

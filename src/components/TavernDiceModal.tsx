import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    Dices, 
    RotateCcw, 
    Coins, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    Flame,
    Zap
} from 'lucide-react';

interface TavernDiceModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

const DIE_FACES: Record<number, string> = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
};

export default function TavernDiceModal({
    expectedXpReward,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: TavernDiceModalProps) {
    const [playerScore, setPlayerScore] = useState<number>(0);
    const [opponentScore, setOpponentScore] = useState<number>(0);
    const [round, setRound] = useState<number>(1);
    const [targetWins] = useState<number>(3);

    const [playerDice, setPlayerDice] = useState<number[]>([1, 1, 1]);
    const [opponentDice, setOpponentDice] = useState<number[]>([1, 1, 1]);
    const [isShaking, setIsShaking] = useState<boolean>(false);
    const [gameState, setGameState] = useState<'ready' | 'rolled' | 'game_over'>('ready');
    const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
    const [roundResultText, setRoundResultText] = useState<string>('');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [log, setLog] = useState<string[]>([]);

    const playTone = (type: 'shake' | 'roll' | 'win_round' | 'lose_round' | 'match_win') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'shake') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'roll') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(350, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'win_round') {
                [523, 659].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.2);
                });
            } else if (type === 'match_win') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.35);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.35);
                });
            }
        } catch {}
    };

    const addLog = (msg: string) => setLog(prev => [msg, ...prev.slice(0, 15)]);

    const startMatch = () => {
        setPlayerScore(0);
        setOpponentScore(0);
        setRound(1);
        setGameState('ready');
        setWinner(null);
        setRoundResultText('');
        setPlayerDice([1, 1, 1]);
        setOpponentDice([1, 1, 1]);
        setLog([`🎲 Нова дуель у кості! Мета: першим виграти 3 раунди.`]);
    };

    useEffect(() => {
        if (isOpen) {
            startMatch();
        }
    }, [isOpen]);

    const rollDice = () => {
        if (isShaking || gameState === 'game_over') return;
        setIsShaking(true);
        playTone('shake');

        setTimeout(() => {
            const p1 = Math.floor(Math.random() * 6) + 1;
            const p2 = Math.floor(Math.random() * 6) + 1;
            const p3 = Math.floor(Math.random() * 6) + 1;
            const pSum = p1 + p2 + p3;
            setPlayerDice([p1, p2, p3]);

            const o1 = Math.floor(Math.random() * 6) + 1;
            const o2 = Math.floor(Math.random() * 6) + 1;
            const o3 = Math.floor(Math.random() * 6) + 1;
            const oSum = o1 + o2 + o3;
            setOpponentDice([o1, o2, o3]);

            setIsShaking(false);
            setGameState('rolled');
            playTone('roll');

            // Evaluate
            let newPScore = playerScore;
            let newOScore = opponentScore;

            if (pSum > oSum) {
                newPScore += 1;
                setPlayerScore(newPScore);
                setRoundResultText(`🎉 Ви виграли раунд #${round}! (${pSum} проти ${oSum})`);
                addLog(`⚔️ Раунд #${round}: Ви викинули ${p1}+${p2}+${p3}=${pSum}, ${opponent.name}: ${o1}+${o2}+${o3}=${oSum}. Очко на вашу користь!`);
                playTone('win_round');
            } else if (oSum > pSum) {
                newOScore += 1;
                setOpponentScore(newOScore);
                setRoundResultText(`💀 ${opponent.name} забрав раунд #${round}! (${oSum} проти ${pSum})`);
                addLog(`⚔️ Раунд #${round}: ${opponent.name} викинув ${o1}+${o2}+${o3}=${oSum}, Ви: ${pSum}. Очко супернику.`);
            } else {
                setRoundResultText(`🤝 Нічия в раунді #${round}! Обидва викинули по ${pSum}.`);
                addLog(`🤝 Раунд #${round}: Рівний рахунок (${pSum} = ${oSum}). Раунд переграється.`);
            }

            if (newPScore >= targetWins) {
                setWinner('player');
                setGameState('game_over');
                playTone('match_win');
                addLog(`👑 ПЕРЕМОГА В ДУЕЛІ! Ви першим набрали ${targetWins} перемог.`);
            } else if (newOScore >= targetWins) {
                setWinner('opponent');
                setGameState('game_over');
                addLog(`💀 ПОРАЗКА! ${opponent.name} здобув перемогу з рахунком ${newOScore}:${newPScore}.`);
            } else {
                setRound(r => r + 1);
            }
        }, 700);
    };

    if (!isOpen) return null;

    const pSum = playerDice.reduce((a, b) => a + b, 0);
    const oSum = opponentDice.reduce((a, b) => a + b, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="relative w-full max-w-3xl h-[85vh] bg-[#1a140f] border-2 border-amber-600/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="px-4 py-2.5 bg-[#251b14] border-b border-amber-600/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl p-1.5 rounded-lg bg-[#140e0b] border border-amber-500/40">
                            🎲
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-serif font-black text-sm sm:text-base text-amber-300">
                                    Прості Тавернні Кості (3d6 High Roll)
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                                    {tavernName}
                                </span>
                            </div>
                            <p className="text-xs text-stone-400">
                                Суперник: <strong className="text-stone-200">{opponent.name}</strong> ({opponent.title})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-black/50 border border-amber-500/40 text-xs font-black text-amber-300">
                            Рахунок: {playerScore} — {opponentScore} (до {targetWins})
                        </div>
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-1.5 rounded-lg bg-[#140e0b] hover:bg-[#2b1f16] border border-stone-700 text-stone-300 transition-colors"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                        </button>
                        <button
                            onClick={() => setShowRules(true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#140e0b] hover:bg-[#2b1f16] border border-amber-500/40 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Правила</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-[#140e0b] hover:bg-rose-950/60 border border-stone-700 hover:border-rose-500/50 text-stone-300 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Arena */}
                <div className="flex-1 p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2d1b13] via-[#1a110c] to-[#100b08] flex flex-col justify-between overflow-y-auto">
                    {/* Opponent Area */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-stone-800 backdrop-blur-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl p-1.5 rounded-full bg-stone-900 border border-amber-500/30">
                                {opponent.avatar}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-stone-200">{opponent.name}</div>
                                <div className="text-sm font-black text-amber-300">
                                    Сума: {gameState !== 'ready' ? oSum : '—'}
                                </div>
                            </div>
                        </div>

                        {/* Opponent 3 Dice */}
                        <div className="flex gap-3">
                            {opponentDice.map((d, i) => (
                                <div
                                    key={i}
                                    className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-gradient-to-br from-[#382317] to-[#1a100a] border border-amber-600/50 shadow-lg flex items-center justify-center text-3xl font-black text-amber-200"
                                >
                                    {gameState !== 'ready' ? DIE_FACES[d] : '🎲'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shaker / Round Status in Middle */}
                    <div className="text-center py-4 space-y-2">
                        {roundResultText && (
                            <div className="text-sm font-black text-yellow-300 animate-pulse">
                                {roundResultText}
                            </div>
                        )}
                        <div className="text-xs text-stone-400">
                            Раунд {round}. Киньте шкіряний стакан з 3 кістками!
                        </div>
                    </div>

                    {/* Player Area */}
                    <div className="p-4 rounded-2xl bg-black/50 border-2 border-amber-500/60 backdrop-blur-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-amber-300 uppercase">Ваш кидок</div>
                                <div className="text-lg font-black text-yellow-300">
                                    Сума: {gameState !== 'ready' ? pSum : '—'}
                                </div>
                            </div>

                            {/* Player 3 Dice */}
                            <div className="flex gap-3">
                                {playerDice.map((d, i) => (
                                    <motion.div
                                        key={i}
                                        animate={isShaking ? { rotate: [0, -10, 10, -10, 0], y: [0, -5, 5, 0] } : {}}
                                        transition={{ repeat: Infinity, duration: 0.2 }}
                                        className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-[#fdfbf7] text-stone-900 border-2 border-amber-500 shadow-2xl flex items-center justify-center text-4xl font-black"
                                    >
                                        {gameState !== 'ready' ? DIE_FACES[d] : '🎲'}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Shake & Roll Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={rollDice}
                                disabled={isShaking || gameState === 'game_over'}
                                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm shadow-xl transition-transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Dices className="w-5 h-5" />
                                <span>{isShaking ? 'Струшуємо стакан...' : 'СТРУСИТИ ТА КИНУТИ КОСТІ!'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Match Over Modal */}
                <AnimatePresence>
                    {gameState === 'game_over' && winner && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md p-6 rounded-2xl bg-[#1a140f] border-2 border-amber-500/80 shadow-2xl text-center space-y-4"
                            >
                                {winner === 'player' ? (
                                    <>
                                        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center text-3xl shadow animate-bounce">
                                            👑
                                        </div>
                                        <h2 className="text-2xl font-serif font-black text-amber-300">
                                            ВИ ПЕРЕМОГЛИ В КОСТЯХ!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            Рахунок <strong className="text-yellow-400">{playerScore}:{opponentScore}</strong> на вашу користь!
                                        </p>
                                        <div className="p-3 rounded-xl bg-[#241a12] border border-amber-500/40 flex items-center justify-around text-xs font-bold text-amber-300">
                                            <div className="flex items-center gap-1.5">
                                                <Coins className="w-4 h-4 text-amber-400" />
                                                <span>+{opponent.rewards.gold} золота</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-emerald-400">
                                                <Sparkles className="w-4 h-4" />
                                                <span>+{(expectedXpReward ?? (opponent.rewards.xp || 90))} XP</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                onVictory();
                                                onClose();
                                            }}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm shadow-lg cursor-pointer"
                                        >
                                            Забрати виграш та вийти
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-3xl shadow">
                                            💀
                                        </div>
                                        <h2 className="text-2xl font-serif font-black text-rose-400">
                                            ПОРАЗКА В ДУЕЛІ!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            {opponent.name} набрав 3 перемоги першим.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={startMatch}
                                                className="flex-1 py-3 rounded-xl bg-[#2e2118] hover:bg-[#3d2c20] border border-amber-500/50 text-amber-300 font-black text-sm cursor-pointer"
                                            >
                                                Реванш
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onDefeat();
                                                    onClose();
                                                }}
                                                className="px-5 py-3 rounded-xl bg-stone-800 text-stone-300 font-bold text-sm cursor-pointer"
                                            >
                                                Вийти
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Rules Modal */}
                <AnimatePresence>
                    {showRules && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md p-5 rounded-2xl bg-[#1a140f] border-2 border-amber-500/70 shadow-2xl space-y-3 text-xs text-[#e8dac7]"
                            >
                                <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                                    <h3 className="text-base font-serif font-black text-amber-300">
                                        Правила простих костей (3d6)
                                    </h3>
                                    <button
                                        onClick={() => setShowRules(false)}
                                        className="p-1 rounded-lg bg-stone-800 text-stone-300 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p>1. Кожен гравець струшує стакан і викидає по 3 шестигранні кубики.</p>
                                <p>2. Перемагає той, чия сума трьох кісток вища в раунді.</p>
                                <p>3. Матч триває до 3 перемог одного з гравців.</p>
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="w-full py-2 rounded-xl bg-amber-500 text-black font-black cursor-pointer"
                                >
                                    Зрозуміло
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

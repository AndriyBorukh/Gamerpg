import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    Coins, 
    RotateCcw, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    Trophy,
    Award
} from 'lucide-react';

interface CoinTossModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

type CoinSide = 'heads' | 'tails'; // heads = Орел, tails = Решка

export default function CoinTossModal({
    expectedXpReward = 50,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: CoinTossModalProps) {
    const [playerScore, setPlayerScore] = useState<number>(0);
    const [opponentScore, setOpponentScore] = useState<number>(0);
    const [round, setRound] = useState<number>(1);
    const targetWins = 3;

    const [playerChoice, setPlayerChoice] = useState<CoinSide>('heads');
    const [isFlipping, setIsFlipping] = useState<boolean>(false);
    const [coinResult, setCoinResult] = useState<CoinSide | null>(null);
    const [flipRotation, setFlipRotation] = useState<number>(0);
    const [gameState, setGameState] = useState<'choosing' | 'flipped' | 'game_over'>('choosing');
    const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
    const [roundText, setRoundText] = useState<string>('');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [log, setLog] = useState<string[]>([]);

    const playTone = (type: 'flip' | 'land' | 'win_round' | 'lose_round' | 'match_win') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'flip') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'land') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(950, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
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
                [400, 320, 260].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.15);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.15);
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
            // AudioContext not allowed or disabled
        }
    };

    const handleFlipCoin = (side: CoinSide) => {
        if (isFlipping || gameState === 'game_over') return;
        setPlayerChoice(side);
        setIsFlipping(true);
        setGameState('choosing');
        playTone('flip');

        const flips = 1440 + Math.floor(Math.random() * 4) * 360 + (Math.random() > 0.5 ? 180 : 0);
        setFlipRotation(prev => prev + flips);

        setTimeout(() => {
            const result: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
            setCoinResult(result);
            setIsFlipping(false);
            setGameState('flipped');
            playTone('land');

            const isPlayerWin = result === side;
            const newPlayerScore = isPlayerWin ? playerScore + 1 : playerScore;
            const newOpponentScore = !isPlayerWin ? opponentScore + 1 : opponentScore;

            if (isPlayerWin) {
                setPlayerScore(newPlayerScore);
                setRoundText(`Ви вгадали! Випав ${result === 'heads' ? '🦅 Орел' : '👑 Решка'}! Очко ваше!`);
                playTone('win_round');
                setLog(prev => [`Раунд ${round}: Випав ${result === 'heads' ? 'Орел' : 'Решка'} (Ви обрали ${side === 'heads' ? 'Орла' : 'Решку'}) -> +1 Очко Герою!`, ...prev.slice(0, 15)]);
            } else {
                setOpponentScore(newOpponentScore);
                setRoundText(`Не вгадали! Випав ${result === 'heads' ? '🦅 Орел' : '👑 Решка'}, а ви обрали ${side === 'heads' ? '🦅 Орла' : '👑 Решку'}. Очко забирає ${opponent.name}!`);
                playTone('lose_round');
                setLog(prev => [`Раунд ${round}: Випав ${result === 'heads' ? 'Орел' : 'Решка'} (Ви обрали ${side === 'heads' ? 'Орла' : 'Решку'}) -> +1 Очко ${opponent.name}!`, ...prev.slice(0, 15)]);
            }

            if (newPlayerScore >= targetWins) {
                setGameState('game_over');
                setWinner('player');
                playTone('match_win');
            } else if (newOpponentScore >= targetWins) {
                setGameState('game_over');
                setWinner('opponent');
            } else {
                setRound(r => r + 1);
            }
        }, 1200);
    };

    const handleRestart = () => {
        setPlayerScore(0);
        setOpponentScore(0);
        setRound(1);
        setCoinResult(null);
        setGameState('choosing');
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
                className="relative w-full max-w-2xl bg-[#16120e] border-2 border-[#b8860b] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="bg-[#1e1710] border-b border-[#b8860b]/40 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="text-2xl p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40">
                            🪙
                        </div>
                        <div>
                            <h2 className="text-lg font-black font-serif text-amber-200">
                                Гра в монетку (Орел чи Решка)
                            </h2>
                            <p className="text-xs text-amber-400/80">
                                Таверна «{tavernName}» • Гра до {targetWins} перемог проти {opponent.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-amber-400 hover:text-amber-200 transition cursor-pointer"
                            title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-amber-400 hover:text-amber-200 transition cursor-pointer"
                            title="Правила гри"
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
                    <div className="p-3 bg-[#110d0a] border-b border-amber-500/30 text-xs text-stone-300 space-y-1">
                        <p className="font-bold text-amber-300">📜 Правила гри в монетку:</p>
                        <ul className="list-disc pl-5 space-y-0.5 text-stone-400">
                            <li>Оберіть сторону: <strong className="text-amber-300">🦅 Орел</strong> або <strong className="text-amber-300">👑 Решка</strong>.</li>
                            <li>Золота монета підкидається у повітря та обертається над тавернським столом.</li>
                            <li>Якщо ви вгадали сторону монети — очко отримуєте ви. Якщо ні — очко дістається супернику.</li>
                            <li>Перемагає той, хто першим набере <strong className="text-amber-300">3 очки</strong>!</li>
                        </ul>
                    </div>
                )}

                {/* Scoreboard */}
                <div className="grid grid-cols-3 bg-[#110e0b] border-b border-stone-800 py-3 px-4 text-center items-center">
                    {/* Player */}
                    <div className="flex flex-col items-center">
                        <div className="text-2xl">🧙‍♂️</div>
                        <span className="text-xs font-bold text-amber-300">Ви (Герой)</span>
                        <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">
                            {playerScore} <span className="text-xs text-stone-500 font-normal">/ {targetWins}</span>
                        </div>
                    </div>

                    {/* VS & Round */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Раунд {round}</span>
                        <span className="text-sm font-black text-[#b8860b] my-0.5">VS</span>
                        <div className="flex gap-1">
                            {Array.from({ length: targetWins }).map((_, i) => (
                                <span 
                                    key={i} 
                                    className={`w-2.5 h-2.5 rounded-full ${
                                        i < playerScore ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-stone-800'
                                    }`} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Opponent */}
                    <div className="flex flex-col items-center">
                        <div className="text-2xl">{opponent.avatar}</div>
                        <span className="text-xs font-bold text-amber-300">{opponent.name}</span>
                        <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">
                            {opponentScore} <span className="text-xs text-stone-500 font-normal">/ {targetWins}</span>
                        </div>
                    </div>
                </div>

                {/* Coin Stage Area */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[220px] bg-gradient-to-b from-[#16120e] via-[#120d09] to-[#16120e] relative">
                    {/* Glowing aura */}
                    <div className="absolute w-44 h-44 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

                    {/* 3D Animated Coin */}
                    <div className="perspective-1000 mb-6">
                        <motion.div
                            animate={{
                                rotateY: flipRotation,
                                y: isFlipping ? [-10, -60, -10] : 0,
                                scale: isFlipping ? [1, 1.25, 1] : 1
                            }}
                            transition={{
                                duration: isFlipping ? 1.2 : 0.4,
                                ease: "easeInOut"
                            }}
                            className="w-28 h-28 rounded-full border-4 border-yellow-500/80 bg-gradient-to-tr from-amber-700 via-yellow-400 to-amber-600 shadow-2xl flex flex-col items-center justify-center select-none ring-4 ring-amber-500/20"
                        >
                            <div className="w-24 h-24 rounded-full border border-yellow-200/40 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-500/40 via-amber-600/30 to-amber-900/60 shadow-inner">
                                <span className="text-4xl filter drop-shadow-md">
                                    {coinResult === 'tails' ? '👑' : '🦅'}
                                </span>
                                <span className="text-[10px] font-black tracking-widest uppercase text-amber-950 mt-0.5">
                                    {coinResult === 'tails' ? 'Решка' : 'Орел'}
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Status commentary text */}
                    {roundText && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`px-4 py-1.5 rounded-xl border text-xs font-bold text-center mb-4 max-w-md ${
                                coinResult === playerChoice
                                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                            }`}
                        >
                            {roundText}
                        </motion.div>
                    )}

                    {/* Choices buttons */}
                    {gameState !== 'game_over' ? (
                        <div className="flex flex-col items-center gap-2.5 w-full max-w-sm">
                            <span className="text-xs font-bold text-stone-400">
                                {isFlipping ? 'Монета обертається у повітрі...' : 'Оберіть сторону для кидка:'}
                            </span>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={() => handleFlipCoin('heads')}
                                    disabled={isFlipping}
                                    className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-lg active:scale-95 ${
                                        isFlipping
                                            ? 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 border-amber-400 hover:brightness-110 ring-2 ring-amber-400/20'
                                    }`}
                                >
                                    <span className="text-xl">🦅</span>
                                    <span>ОРЕЛ</span>
                                </button>

                                <button
                                    onClick={() => handleFlipCoin('tails')}
                                    disabled={isFlipping}
                                    className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-lg active:scale-95 ${
                                        isFlipping
                                            ? 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 border-amber-400 hover:brightness-110 ring-2 ring-amber-400/20'
                                    }`}
                                >
                                    <span className="text-xl">👑</span>
                                    <span>РЕШКА</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-3 text-center p-4 bg-[#1e1710] border border-amber-500/50 rounded-2xl w-full max-w-sm"
                        >
                            <div className="text-3xl">
                                {winner === 'player' ? '🏆 🪙 👑' : '💀 🥀'}
                            </div>
                            <div>
                                <h3 className={`text-base font-black font-serif ${
                                    winner === 'player' ? 'text-yellow-400' : 'text-rose-400'
                                }`}>
                                    {winner === 'player' ? 'Тріумф у грі в монетку!' : 'Поразка у грі в монетку!'}
                                </h3>
                                <p className="text-xs text-stone-300 mt-1">
                                    {winner === 'player' 
                                        ? `Ви переграли ${opponent.name} з рахунком ${playerScore}:${opponentScore}! Отримано золото та +${expectedXpReward} XP!`
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
                                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 hover:brightness-110'
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
                    <div className="bg-[#100d0a] border-t border-stone-800 p-3 max-h-24 overflow-y-auto text-[11px] font-mono text-stone-400 space-y-0.5 scrollbar-thin scrollbar-thumb-stone-800">
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

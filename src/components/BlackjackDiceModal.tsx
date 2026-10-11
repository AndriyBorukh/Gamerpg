import { useState } from 'react';
import { motion } from 'motion/react';
import { OpponentData } from '../types';
import { Coins, X, Info } from 'lucide-react';

interface BlackjackDiceModalProps {
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    betAmount: number;
    playerGold: number;
    onVictory: (reward: number) => void;
    onDefeat: (penalty: number) => void;
    onClose: () => void;
}

export function BlackjackDiceModal({
    isOpen,
    opponent,
    tavernName,
    betAmount,
    playerGold,
    onVictory,
    onDefeat,
    onClose
}: BlackjackDiceModalProps) {
    const [playerScore, setPlayerScore] = useState<number>(0);
    const [aiScore, setAiScore] = useState<number>(0);
    const [playerRolls, setPlayerRolls] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'game_over'>('playing');
    const [message, setMessage] = useState<string>('Кидайте кубик, щоб набрати рівно або близько до 21 очка!');

    if (!isOpen) return null;

    const handleRoll = () => {
        if (gameState !== 'playing') return;
        const roll = Math.floor(Math.random() * 6) + 1;
        const newRolls = [...playerRolls, roll];
        const newScore = playerScore + roll;
        setPlayerRolls(newRolls);
        setPlayerScore(newScore);

        if (newScore > 21) {
            setGameState('game_over');
            setMessage('Перебір на кубиках! Ви програли.');
            onDefeat(betAmount);
        } else if (newScore === 21) {
            handleStand(21);
        }
    };

    const handleStand = (currentPScore = playerScore) => {
        if (gameState !== 'playing') return;
        // AI turn
        let aScore = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 10;
        if (aScore > 21) aScore = 19;
        setAiScore(aScore);
        setGameState('game_over');

        if (currentPScore > 21) {
            setMessage(`Перебір! У дилера ${aScore}. Ви програли.`);
            onDefeat(betAmount);
        } else if (aScore > 21 || currentPScore > aScore) {
            setMessage(`Перемога на кубиках! У вас ${currentPScore}, у дилера ${aScore}.`);
            onVictory(betAmount > 0 ? betAmount * 2 : 35);
        } else if (currentPScore === aScore) {
            setMessage(`Нічия! У обох ${currentPScore}.`);
        } else {
            setMessage(`Поразка! У дилера ${aScore}, у вас ${currentPScore}.`);
            onDefeat(betAmount);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-md bg-[#16120e] border-2 border-amber-600 rounded-2xl shadow-2xl p-6 text-[#f5ebd7] flex flex-col gap-5"
            >
                <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🎲</span>
                        <h3 className="text-xl font-bold font-serif text-amber-200">Блек Джек на кубиках</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-[#251b14] p-4 rounded-xl border border-amber-900/40 text-center flex flex-col gap-3">
                    <div className="text-sm font-bold text-amber-300">{message}</div>
                    <div className="flex justify-around text-sm">
                        <div>Ваші очки: <span className="text-emerald-400 font-bold text-lg">{playerScore}</span></div>
                        {aiScore > 0 && <div>Очки {opponent.name}: <span className="text-rose-400 font-bold text-lg">{aiScore}</span></div>}
                    </div>
                    <div className="flex gap-2 justify-center">
                        {playerRolls.map((r, i) => (
                            <div key={i} className="w-10 h-10 bg-amber-600 text-stone-950 font-bold rounded-lg flex items-center justify-center text-lg shadow">
                                {r}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    {gameState === 'playing' ? (
                        <>
                            <button onClick={handleRoll} className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold">
                                Кинути кубик
                            </button>
                            <button onClick={() => handleStand()} className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold border border-stone-600">
                                Досить (Stand)
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold">
                            Закрити
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

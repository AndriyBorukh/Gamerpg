import { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, X } from 'lucide-react';

interface BettingModalProps {
    isOpen: boolean;
    title: string;
    playerGold: number;
    onConfirm: (bet: number) => void;
    onClose: () => void;
}

export function BettingModal({ isOpen, title, playerGold, onConfirm, onClose }: BettingModalProps) {
    const minBet = playerGold >= 10 ? 10 : playerGold;
    const maxBet = Math.max(minBet, Math.min(playerGold, 500));
    const [bet, setBet] = useState<number>(() => {
        if (playerGold >= 50) return 50;
        if (playerGold >= 10) return 10;
        return playerGold;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-md bg-[#16120e] border-2 border-amber-600 rounded-2xl shadow-2xl p-6 text-[#f5ebd7] flex flex-col gap-5"
            >
                <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
                    <div className="flex items-center gap-2">
                        <Coins className="w-6 h-6 text-amber-400" />
                        <h3 className="text-xl font-bold font-serif text-amber-200">Ставка: {title}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-3 bg-[#251b14] p-4 rounded-xl border border-amber-900/40">
                    <div className="flex justify-between text-sm text-stone-300">
                        <span>Ваше золото:</span>
                        <span className="text-amber-400 font-bold">{playerGold} 🪙</span>
                    </div>
                    <div className="flex justify-between text-sm text-stone-300">
                        <span>Сума ставки:</span>
                        <span className="text-emerald-400 font-bold">{bet} 🪙</span>
                    </div>

                    <input
                        type="range"
                        min={minBet}
                        max={maxBet}
                        step={playerGold >= 10 ? "10" : "1"}
                        value={bet}
                        onChange={(e) => setBet(Number(e.target.value))}
                        className="accent-amber-500 cursor-pointer"
                    />

                    <div className="flex gap-2 justify-center mt-2 flex-wrap">
                        {[10, 25, 50, 100, 250, 500].filter(val => val <= playerGold).map(val => (
                            <button
                                key={val}
                                onClick={() => setBet(val)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                    bet === val 
                                        ? 'bg-amber-600 text-stone-950' 
                                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                                }`}
                            >
                                {val} 🪙
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold border border-stone-600"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={() => onConfirm(bet)}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-stone-950 font-bold shadow-lg"
                    >
                        Зробити ставку ({bet} 🪙)
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

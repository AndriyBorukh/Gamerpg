import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { Coins, Trophy, Info, X, Shield, Sparkles } from 'lucide-react';

interface BlackjackModalProps {
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    betAmount: number;
    playerGold: number;
    onVictory: (reward: number) => void;
    onDefeat: (penalty: number) => void;
    onClose: () => void;
}

interface Card {
    suit: string;
    rank: string;
    value: number;
}

export function BlackjackModal({
    isOpen,
    opponent,
    tavernName,
    betAmount,
    playerGold,
    onVictory,
    onDefeat,
    onClose
}: BlackjackModalProps) {
    const [deck, setDeck] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'dealer_turn' | 'game_over'>('playing');
    const [resultMessage, setResultMessage] = useState<string>('');

    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    useEffect(() => {
        if (!isOpen) return;
        startNewGame();
    }, [isOpen]);

    const startNewGame = () => {
        let newDeck: Card[] = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                let val = parseInt(rank);
                if (['J', 'Q', 'K'].includes(rank)) val = 10;
                if (rank === 'A') val = 11;
                newDeck.push({ suit, rank, value: val });
            }
        }
        // Shuffle
        newDeck.sort(() => Math.random() - 0.5);

        const p1 = newDeck.pop()!;
        const p2 = newDeck.pop()!;
        const d1 = newDeck.pop()!;
        const d2 = newDeck.pop()!;

        setDeck(newDeck);
        setPlayerHand([p1, p2]);
        setDealerHand([d1, d2]);
        setGameState('playing');
        setResultMessage('');
    };

    const calculateScore = (hand: Card[]): number => {
        let score = 0;
        let aces = 0;
        for (const card of hand) {
            if (!card) continue;
            score += card.value || 0;
            if (card.rank === 'A') aces++;
        }
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    };

    const handleHit = () => {
        if (gameState !== 'playing' || deck.length === 0) return;
        const newDeck = [...deck];
        const card = newDeck.pop();
        if (!card) return;
        const newHand = [...playerHand, card];
        setDeck(newDeck);
        setPlayerHand(newHand);

        const score = calculateScore(newHand);
        if (score > 21) {
            setGameState('game_over');
            setResultMessage('Перебір! Ви програли.');
            onDefeat(betAmount);
        }
    };

    const handleStand = () => {
        if (gameState !== 'playing') return;
        setGameState('dealer_turn');

        let currentDealerHand = [...dealerHand];
        let currentDeck = [...deck];

        while (calculateScore(currentDealerHand) < 17) {
            if (currentDeck.length === 0) break;
            const card = currentDeck.pop();
            if (!card) break;
            currentDealerHand.push(card);
        }

        setDealerHand(currentDealerHand);
        setDeck(currentDeck);

        const pScore = calculateScore(playerHand);
        const dScore = calculateScore(currentDealerHand);

        setGameState('game_over');
        if (dScore > 21 || pScore > dScore) {
            setResultMessage(`Перемога! У вас ${pScore}, у дилера ${dScore}.`);
            onVictory(betAmount > 0 ? betAmount * 2 : 30);
        } else if (pScore === dScore) {
            setResultMessage(`Нічия! У обох ${pScore}.`);
        } else {
            setResultMessage(`Поразка! У дилера ${dScore}, у вас ${pScore}.`);
            onDefeat(betAmount);
        }
    };

    if (!isOpen) return null;

    const pScore = calculateScore(playerHand);
    const dScore = gameState === 'playing' ? (dealerHand[0]?.value ?? 0) : calculateScore(dealerHand);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-xl bg-[#16120e] border-2 border-amber-600 rounded-2xl shadow-2xl p-6 text-[#f5ebd7] flex flex-col gap-5"
            >
                <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🃏</span>
                        <h3 className="text-xl font-bold font-serif text-amber-200">Блек Джек</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-4 bg-[#1f1711] p-4 rounded-xl border border-amber-900/40">
                    <div>
                        <div className="text-xs text-stone-400 mb-2">Дилер ({opponent.name}) — Очки: {dScore}</div>
                        <div className="flex gap-2">
                            {dealerHand.map((card, i) => (
                                <div key={i} className={`w-14 h-20 bg-white text-stone-950 rounded-lg flex flex-col items-center justify-center font-bold ${i === 1 && gameState === 'playing' ? 'bg-stone-800 text-stone-600' : ''}`}>
                                    {i === 1 && gameState === 'playing' ? '🎴' : `${card.rank}${card.suit}`}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs text-stone-400 mb-2">Ваша рука — Очки: {pScore}</div>
                        <div className="flex gap-2">
                            {playerHand.map((card, i) => (
                                <div key={i} className="w-14 h-20 bg-white text-stone-950 rounded-lg flex flex-col items-center justify-center font-bold">
                                    {card.rank}{card.suit}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {resultMessage && (
                    <div className="p-3 bg-amber-950/60 border border-amber-500 rounded-xl text-center font-bold text-amber-300">
                        {resultMessage}
                    </div>
                )}

                <div className="flex gap-3">
                    {gameState === 'playing' ? (
                        <>
                            <button onClick={handleHit} className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold">
                                Ще (Hit)
                            </button>
                            <button onClick={handleStand} className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold border border-stone-600">
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

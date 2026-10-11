import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { 
    Swords, 
    RotateCcw, 
    ShieldAlert, 
    CheckCircle2, 
    Coins, 
    Trophy, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    Info, 
    X, 
    Shield,
    Flame
} from 'lucide-react';

export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export interface DurakCard {
    id: string;
    suit: CardSuit;
    rank: number; // 2..14
    label: string;
    symbol: string;
    color: 'red' | 'black';
}

interface DurakAdvancedModalProps {
    isOpen: boolean;
    variant: 'durak_52_2trumps' | 'durak_52_3trumps' | 'durak_52_4trumps' | 'durak_104_2trumps';
    opponent: OpponentData;
    tavernName: string;
    betAmount: number;
    playerGold: number;
    onVictory: (rewardGold: number) => void;
    onDefeat: (lostGold: number) => void;
    onClose: () => void;
}

interface TablePair {
    id: string;
    attack: DurakCard;
    defense?: DurakCard;
}

const SUIT_SYMBOLS: Record<CardSuit, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣'
};

const SUIT_NAMES_UA: Record<CardSuit, string> = {
    spades: 'Піка',
    hearts: 'Чирва',
    diamonds: 'Бубна',
    clubs: 'Трефа'
};

function getRankLabel(rank: number): string {
    if (rank <= 10) return rank.toString();
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    if (rank === 14) return 'A';
    return rank.toString();
}

function createAdvancedDeck(variant: string): { deck: DurakCard[]; trumps: CardSuit[] } {
    const suits: CardSuit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const decksCount = variant === 'durak_104_2trumps' ? 2 : 1;
    const rawDeck: DurakCard[] = [];

    for (let d = 0; d < decksCount; d++) {
        for (const suit of suits) {
            for (let rank = 2; rank <= 14; rank++) {
                rawDeck.push({
                    id: `card_${d}_${suit}_${rank}_${Math.random().toString(36).substring(2, 7)}`,
                    suit,
                    rank,
                    label: getRankLabel(rank),
                    symbol: SUIT_SYMBOLS[suit],
                    color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black'
                });
            }
        }
    }

    // Shuffle
    for (let i = rawDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rawDeck[i], rawDeck[j]] = [rawDeck[j], rawDeck[i]];
    }

    // Determine trumps
    let trumps: CardSuit[] = ['spades', 'hearts'];
    if (variant === 'durak_52_3trumps') {
        trumps = ['spades', 'hearts', 'diamonds'];
    } else if (variant === 'durak_52_4trumps') {
        trumps = ['spades', 'hearts', 'diamonds', 'clubs'];
    } else {
        trumps = ['spades', 'hearts'];
    }

    return { deck: rawDeck, trumps };
}

export function DurakAdvancedModal({
    isOpen,
    variant,
    opponent,
    tavernName,
    betAmount,
    playerGold,
    onVictory,
    onDefeat,
    onClose
}: DurakAdvancedModalProps) {
    const [deck, setDeck] = useState<DurakCard[]>([]);
    const [trumpSuits, setTrumpSuits] = useState<CardSuit[]>([]);
    const [playerHand, setPlayerHand] = useState<DurakCard[]>([]);
    const [aiHand, setAiHand] = useState<DurakCard[]>([]);
    const [tablePairs, setTablePairs] = useState<TablePair[]>([]);
    const [discardCount, setDiscardCount] = useState<number>(0);

    const [isPlayerAttacker, setIsPlayerAttacker] = useState<boolean>(true);
    const [turnPhase, setTurnPhase] = useState<'attacking' | 'defending' | 'ai_thinking' | 'ai_taking' | 'game_over'>('attacking');
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | 'draw' | null>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);

    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [selectedTargetPairId, setSelectedTargetPairId] = useState<string | null>(null);
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);

    const variantTitle = 
        variant === 'durak_52_2trumps' ? 'Дурень (52 карти, 2 козирі)' :
        variant === 'durak_52_3trumps' ? 'Дурень (52 карти, 3 козирі)' :
        variant === 'durak_52_4trumps' ? 'Дурень (52 карти, 4 козирі — Всі козирі!)' :
        'Дурень (104 карти, 2 козирі)';

    // Initialize game
    useEffect(() => {
        if (!isOpen) return;
        const { deck: newDeck, trumps } = createAdvancedDeck(variant);
        setTrumpSuits(trumps);

        // Deal 6 cards each
        const pHand = newDeck.splice(0, 6);
        const aHand = newDeck.splice(0, 6);

        setDeck(newDeck);
        setPlayerHand(pHand);
        setAiHand(aHand);
        setTablePairs([]);
        setDiscardCount(0);
        setGameResult(null);
        setLogMessages([`Розпочато гру: ${variantTitle} у таверні «${tavernName}» проти ${opponent.name}. Козирні масті: ${trumps.map(s => SUIT_NAMES_UA[s]).join(', ')}!`]);

        // Decide who goes first (lowest trump or random)
        setIsPlayerAttacker(true);
        setTurnPhase('attacking');
    }, [isOpen, variant]);

    const addLog = (msg: string) => {
        setLogMessages(prev => [msg, ...prev.slice(0, 19)]);
    };

    // Check if card is trump
    const isTrump = (suit: CardSuit) => trumpSuits.includes(suit);

    // Can defending card beat attacking card?
    const canBeat = (attackingCard: DurakCard, defendingCard: DurakCard): boolean => {
        const attackIsTrump = isTrump(attackingCard.suit);
        const defenseIsTrump = isTrump(defendingCard.suit);

        // Same suit: higher rank always beats lower rank
        if (defendingCard.suit === attackingCard.suit) {
            return defendingCard.rank > attackingCard.rank;
        }

        // Trump beats non-trump
        if (defenseIsTrump && !attackIsTrump) {
            return true;
        }

        // Non-trump cannot beat trump or different non-trump suit
        if (!defenseIsTrump) {
            return false;
        }

        // Both are trumps of different suits in multi-trump mode: higher priority trump (lower index) beats
        if (defenseIsTrump && attackIsTrump) {
            const defIdx = trumpSuits.indexOf(defendingCard.suit);
            const attIdx = trumpSuits.indexOf(attackingCard.suit);
            if (defIdx !== -1 && attIdx !== -1 && defIdx < attIdx) {
                return true;
            }
        }

        return false;
    };

    // Replenish hands up to 6 cards
    const replenishHands = (currentDeck: DurakCard[], pHand: DurakCard[], aHand: DurakCard[], playerStartsNext: boolean) => {
        const workingDeck = [...currentDeck];
        const newP = [...pHand];
        const newA = [...aHand];

        // Attacker draws first
        const attackerCards = playerStartsNext ? newP : newA;
        const defenderCards = playerStartsNext ? newA : newP;

        while (attackerCards.length < 6 && workingDeck.length > 0) {
            attackerCards.push(workingDeck.pop()!);
        }
        while (defenderCards.length < 6 && workingDeck.length > 0) {
            defenderCards.push(workingDeck.pop()!);
        }

        setDeck(workingDeck);
        setPlayerHand(playerStartsNext ? attackerCards : defenderCards);
        setAiHand(playerStartsNext ? defenderCards : attackerCards);
    };

    // Player action: play card to attack or defend
    const handleCardClick = (card: DurakCard) => {
        if (turnPhase === 'game_over' || turnPhase === 'ai_thinking') return;

        if (turnPhase === 'attacking' && isPlayerAttacker) {
            // If table is empty, any card can attack. If not empty, card rank must match rank on table.
            if (tablePairs.length > 0) {
                const tableRanks = new Set<number>();
                tablePairs.forEach(p => {
                    tableRanks.add(p.attack.rank);
                    if (p.defense) tableRanks.add(p.defense.rank);
                });
                if (!tableRanks.has(card.rank)) {
                    setActionFeedback('Можна підкидати лише карти того ж рангу!');
                    setTimeout(() => setActionFeedback(null), 2000);
                    return;
                }
            }

            const undefendedCount = tablePairs.filter(p => !p.defense).length;
            if (tablePairs.length >= 6 || undefendedCount >= aiHand.length) {
                setActionFeedback('У суперника недостатньо карт у руці для захисту!');
                setTimeout(() => setActionFeedback(null), 2000);
                return;
            }

            // Move card from player hand to table attack
            setPlayerHand(prev => prev.filter(c => c.id !== card.id));
            setTablePairs(prev => [...prev, { id: `pair_${Math.random()}`, attack: card }]);
            addLog(`Ви атакуєте картою ${card.label}${card.symbol}.`);
            setSelectedCardId(null);

            // Now AI must defend
            setTurnPhase('ai_thinking');
            setTimeout(() => aiDefend([...tablePairs, { id: `pair_${Math.random()}`, attack: card }], aiHand, card), 900);

        } else if (turnPhase === 'defending' && !isPlayerAttacker) {
            // Player defending against selected attack pair
            if (!selectedTargetPairId) {
                // Find first undefended pair
                const undefended = tablePairs.find(p => !p.defense);
                if (undefended) {
                    tryDefendCard(card, undefended.id);
                } else {
                    setActionFeedback('Оберіть невибиту картку на столі!');
                    setTimeout(() => setActionFeedback(null), 2000);
                }
            } else {
                tryDefendCard(card, selectedTargetPairId);
            }
        }
    };

    const tryDefendCard = (card: DurakCard, pairId: string) => {
        const pair = tablePairs.find(p => p.id === pairId);
        if (!pair || pair.defense) return;

        if (!canBeat(pair.attack, card)) {
            setActionFeedback('Ця карта не б\'є атакуючу!');
            setTimeout(() => setActionFeedback(null), 2000);
            return;
        }

        // Successful defense
        setPlayerHand(prev => prev.filter(c => c.id !== card.id));
        setTablePairs(prev => prev.map(p => p.id === pairId ? { ...p, defense: card } : p));
        addLog(`Ви побили ${pair.attack.label}${pair.symbol} картою ${card.label}${card.symbol}!`);
        setSelectedCardId(null);
        setSelectedTargetPairId(null);

        // Check if all table pairs are defended
        const updatedPairs = tablePairs.map(p => p.id === pairId ? { ...p, defense: card } : p);
        if (updatedPairs.every(p => p.defense)) {
            // AI might throw in more or pass
            setTurnPhase('ai_thinking');
            setTimeout(() => aiThrowOrPass(updatedPairs), 1000);
        }
    };

    const setActionPay = (msg: string) => {
        setActionFeedback(msg);
    };

    // AI defense logic
    const aiDefend = (currentPairs: TablePair[], currentAiHand: DurakCard[], latestAttack: DurakCard) => {
        const lastPair = currentPairs[currentPairs.length - 1];
        // Find beating card in AI hand
        const beatingCardIndex = currentAiHand.findIndex(c => canBeat(lastPair.attack, c));

        if (beatingCardIndex !== -1) {
            const defCard = currentAiHand[beatingCardIndex];
            const newAiHand = currentAiHand.filter((_, idx) => idx !== beatingCardIndex);
            setAiHand(newAiHand);

            const updatedPairs = currentPairs.map(p => p.id === lastPair.id ? { ...p, defense: defCard } : p);
            setTablePairs(updatedPairs);
            addLog(`${opponent.name} відбивається картою ${defCard.label}${defCard.symbol}.`);

            // Check win condition
            if (newAiHand.length === 0 && deck.length === 0) {
                endGame('defeat');
                return;
            }

            // Back to player turn to attack more or bito
            setTurnPhase('attacking');
        } else {
            // AI takes the cards!
            addLog(`${opponent.name} не може відбитися і забирає карти!`);
            setTurnPhase('ai_taking');
            setTimeout(() => {
                const takenCards = currentPairs.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
                const newAiHand = [...currentAiHand, ...takenCards];
                setAiHand(newAiHand);
                setTablePairs([]);
                replenishHands(deck, playerHand, newAiHand, true);
                setIsPlayerAttacker(true);
                setTurnPhase('attacking');

                if (newAiHand.length === 0 && deck.length === 0) {
                    endGame('victory');
                }
            }, 1200);
        }
    };

    // AI throw in or pass after player successfully defended
    const aiThrowOrPass = (currentPairs: TablePair[]) => {
        // AI checks if it wants to throw in another card of matching rank
        const tableRanks = new Set<number>();
        currentPairs.forEach(p => {
            tableRanks.add(p.attack.rank);
            if (p.defense) tableRanks.add(p.defense.rank);
        });

        const matchingCard = aiHand.find(c => tableRanks.has(c.rank));
        if (matchingCard && currentPairs.length < 6) {
            const newAiHand = aiHand.filter(c => c.id !== matchingCard.id);
            setAiHand(newAiHand);
            const newPairs = [...currentPairs, { id: `pair_${Math.random()}`, attack: matchingCard }];
            setTablePairs(newPairs);
            addLog(`${opponent.name} підкидає карту ${matchingCard.label}${matchingCard.symbol}!`);
            setTurnPhase('defending');

            if (newAiHand.length === 0 && deck.length === 0) {
                endGame('victory');
            }
        } else {
            // Bito! Cards discarded
            addLog(`Карти йдуть у біто.`);
            setDiscardCount(prev => prev + currentPairs.length * 2);
            setTablePairs([]);
            replenishHands(deck, playerHand, aiHand, false);
            setIsPlayerAttacker(false);
            setTurnPhase('defending');

            if (playerHand.length === 0 && deck.length === 0) {
                endGame('victory');
            } else if (aiHand.length === 0 && deck.length === 0) {
                endGame('defeat');
            }
        }
    };

    // Player action: Bito (Take cards to discard if defending, or pass turn if attacking)
    const handlePlayerBitoOrTake = () => {
        if (turnPhase === 'game_over' || turnPhase === 'ai_thinking') return;

        if (turnPhase === 'attacking' && isPlayerAttacker) {
            if (tablePairs.length === 0) return;
            // Player ends attack -> Bito
            addLog('Ви кажете «Бито»! Карти відправляються у відбій.');
            setDiscardCount(prev => prev + tablePairs.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]).length);
            setTablePairs([]);
            replenishHands(deck, playerHand, aiHand, false);
            setIsPlayerAttacker(false);
            setTurnPhase('defending');

            if (playerHand.length === 0 && deck.length === 0) {
                endGame('victory');
            } else if (aiHand.length === 0 && deck.length === 0) {
                endGame('defeat');
            }

            // AI turn to attack player
            setTimeout(() => aiAttack(), 800);

        } else if (turnPhase === 'defending' && !isPlayerAttacker) {
            // Player takes all cards on table
            const takenCards = tablePairs.flatMap(p => p.defense ? [p.attack, p.defense] : [p.attack]);
            const newP = [...playerHand, ...takenCards];
            setPlayerHand(newP);
            setTablePairs([]);
            addLog('Ви забираєте карти собі!');
            replenishHands(deck, newP, aiHand, true);
            setIsPlayerAttacker(true);
            setTurnPhase('attacking');

            if (aiHand.length === 0 && deck.length === 0) {
                endGame('defeat');
            }

            // AI attacks again
            setTimeout(() => aiAttack(), 800);
        }
    };

    const aiAttack = () => {
        if (aiHand.length === 0) return;
        const cardToAttack = aiHand[0];
        const newAiHand = aiHand.slice(1);
        setAiHand(newAiHand);
        setTablePairs([{ id: `pair_${Math.random()}`, attack: cardToAttack }]);
        addLog(`${opponent.name} ходить картою ${cardToAttack.label}${cardToAttack.symbol}.`);
        setIsPlayerAttacker(false);
        setTurnPhase('defending');
    };

    const endGame = (result: 'victory' | 'defeat') => {
        setGameResult(result);
        setTurnPhase('game_over');
        if (result === 'victory') {
            onVictory(betAmount > 0 ? betAmount * 2 : 50);
        } else {
            onDefeat(betAmount);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="relative w-full max-w-5xl max-h-[96vh] bg-[#16120e] border-2 border-[#b8860b] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#251d16] border-b border-[#b8860b]/40">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🃏</span>
                        <div>
                            <h2 className="text-xl font-bold font-serif text-amber-200">{variantTitle}</h2>
                            <p className="text-xs text-stone-400">Таверна «{tavernName}» проти {opponent.title} {opponent.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {betAmount > 0 && (
                            <span className="bg-amber-950/60 border border-amber-600/50 px-3 py-1 rounded-full text-xs font-bold text-amber-300 flex items-center gap-1">
                                Ставка: {betAmount} <Coins className="w-3.5 h-3.5" />
                            </span>
                        )}
                        <button
                            onClick={() => setShowRules(true)}
                            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                            title="Правила"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Table Area */}
                <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto gap-6 bg-radial from-[#251d16] to-[#120e0a]">
                    
                    {/* Opponent Hand & Info */}
                    <div className="flex items-center justify-between bg-[#1f1812] p-4 rounded-2xl border border-amber-900/40">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{opponent.avatar}</span>
                            <div>
                                <h3 className="font-bold text-amber-100">{opponent.name}</h3>
                                <p className="text-xs text-stone-400">Карток у руці: <span className="text-amber-300 font-bold">{aiHand.length}</span></p>
                            </div>
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto max-w-[50%] p-1">
                            {aiHand.map((_, i) => (
                                <div key={i} className="w-8 h-12 bg-gradient-to-br from-red-950 to-stone-950 border border-amber-700/50 rounded-lg shadow-md flex items-center justify-center text-xs font-bold text-amber-500/60">
                                    🎴
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Table Play Area & Trump info */}
                    <div className="flex flex-col items-center justify-center min-h-[220px] bg-[#1a130e]/80 border-2 border-dashed border-amber-900/40 rounded-2xl p-4 relative">
                        <div className="absolute top-3 left-4 flex items-center gap-3 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-amber-900/50 text-xs">
                            <span>Козирі ({trumpSuits.length}):</span>
                            <span className="text-amber-400 font-bold text-sm">
                                {trumpSuits.map(s => SUIT_SYMBOLS[s]).join(' ')}
                            </span>
                            <span className="text-stone-400">| Колода: {deck.length} | Відбій: {discardCount}</span>
                        </div>

                        <div className="absolute top-3 right-4 bg-amber-950/60 border border-amber-700/50 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 animate-pulse">
                            {turnPhase === 'ai_thinking' ? `${opponent.name} думає...` :
                             isPlayerAttacker ? 'Ваша атака' : 'Ваш захист'}
                        </div>

                        {/* Action feedback */}
                        {actionFeedback && (
                            <div className="absolute top-14 bg-red-950/90 border border-red-500 text-red-200 px-4 py-1.5 rounded-xl text-xs font-bold shadow-lg z-20">
                                {actionFeedback}
                            </div>
                        )}

                        {/* Table Pairs */}
                        <div className="flex flex-wrap gap-4 items-center justify-center mt-6">
                            {tablePairs.length === 0 ? (
                                <div className="text-stone-500 text-sm italic">Стіл порожній. Зробіть хід або натисніть «Бито».</div>
                            ) : (
                                tablePairs.map(pair => (
                                    <div 
                                        key={pair.id} 
                                        onClick={() => setSelectedTargetPairId(pair.id)}
                                        className={`flex flex-col gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                                            selectedTargetPairId === pair.id ? 'border-amber-400 bg-amber-950/40' : 'border-stone-800 bg-stone-950/40'
                                        }`}
                                    >
                                        <div className={`w-14 h-20 rounded-lg flex flex-col items-center justify-center font-bold shadow-md bg-white ${pair.attack.color === 'red' ? 'text-red-600' : 'text-stone-900'} border border-stone-300`}>
                                            <span className="text-sm">{pair.attack.label}</span>
                                            <span className="text-xl">{pair.attack.symbol}</span>
                                        </div>
                                        <div className={`w-14 h-20 rounded-lg flex flex-col items-center justify-center font-bold shadow-md ${pair.defense ? (pair.defense.color === 'red' ? 'text-red-600 bg-white' : 'text-stone-900 bg-white') : 'border-2 border-dashed border-stone-600 text-stone-500 bg-stone-900'}`}>
                                            {pair.defense ? (
                                                <>
                                                    <span className="text-sm">{pair.defense.label}</span>
                                                    <span className="text-xl">{pair.defense.symbol}</span>
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-center">Захист</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Table Controls (Bito / Take) */}
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={handlePlayerBitoOrTake}
                                disabled={turnPhase === 'ai_thinking' || (isPlayerAttacker && tablePairs.length === 0)}
                                className="py-2 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-stone-950 font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {isPlayerAttacker ? 'Бито / Завершити атаку' : 'Взяти карти'}
                            </button>
                        </div>
                    </div>

                    {/* Player Hand & Controls */}
                    <div className="flex flex-col gap-3 bg-[#1f1812] p-4 rounded-2xl border border-amber-900/40">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-amber-200">Ваша рука ({playerHand.length} карт)</span>
                            <span className="text-xs text-stone-400">Оберіть карту для ходу</span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {playerHand.map(card => {
                                const isSelected = selectedCardId === card.id;
                                const isTr = isTrump(card.suit);
                                return (
                                    <motion.button
                                        key={card.id}
                                        whileHover={{ scale: 1.08, y: -6 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setSelectedCardId(card.id);
                                            handleCardClick(card);
                                        }}
                                        className={`relative w-16 h-24 rounded-xl flex flex-col items-center justify-between p-2 font-bold shadow-xl bg-white ${
                                            card.color === 'red' ? 'text-red-600' : 'text-stone-900'
                                        } border-2 ${isSelected ? 'border-amber-400 ring-4 ring-amber-400/30' : isTr ? 'border-amber-500' : 'border-stone-300'}`}
                                    >
                                        <div className="w-full flex justify-between text-xs">
                                            <span>{card.label}</span>
                                            <span>{card.symbol}</span>
                                        </div>
                                        <div className="text-2xl">{card.symbol}</div>
                                        <div className="w-full flex justify-between text-xs rotate-180">
                                            <span>{card.label}</span>
                                            <span>{card.symbol}</span>
                                        </div>
                                        {isTr && (
                                            <span className="absolute -top-2 -right-2 bg-amber-500 text-stone-950 text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow">
                                                Козир
                                            </span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Log messages */}
                    <div className="bg-[#120d09] p-3 rounded-xl border border-stone-800 text-xs text-stone-300 max-h-24 overflow-y-auto">
                        {logMessages.map((msg, i) => (
                            <div key={i} className="py-0.5 border-b border-stone-900 last:border-0">{msg}</div>
                        ))}
                    </div>

                </div>

                {/* Game Over Modal / Overlay */}
                {gameResult && (
                    <div className="absolute inset-0 z-65 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#251d16] border-2 border-amber-500 rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center gap-5 shadow-2xl"
                        >
                            <div className="text-5xl">
                                {gameResult === 'victory' ? '🏆' : '💀'}
                            </div>
                            <h3 className="text-2xl font-bold font-serif text-amber-200">
                                {gameResult === 'victory' ? 'Блискуча Перемога!' : 'Гірка Поразка!'}
                            </h3>
                            <p className="text-sm text-stone-300">
                                {gameResult === 'victory' 
                                    ? `Ви перемогли ${opponent.name} у грі «${variantTitle}»!` 
                                    : `${opponent.name} переграв вас у цій партії.`}
                            </p>
                            {betAmount > 0 && (
                                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${gameResult === 'victory' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : 'bg-red-950/60 text-red-400 border border-red-500/40'}`}>
                                    {gameResult === 'victory' ? `Виграно золота: +${betAmount * 2}` : `Втрачено ставки: -${betAmount}`}
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-bold shadow-lg hover:from-amber-500 transition-transform hover:scale-105"
                            >
                                Повернутися до таверни
                            </button>
                        </motion.div>
                    </div>
                )}

                {/* Rules Modal */}
                {showRules && (
                    <div className="absolute inset-0 z-65 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-[#251d16] border-2 border-[#b8860b] rounded-2xl p-6 max-w-lg w-full text-[#f5ebd7] flex flex-col gap-4">
                            <h3 className="text-lg font-bold font-serif text-amber-200">Правила: {variantTitle}</h3>
                            <p className="text-xs text-stone-300 leading-relaxed">
                                Це розширена версія класичного Дурня з кількома козирними мастями або збільшеною колодою. Захищайтеся старшою картою тієї ж масті або будь-яким козирем. Кілька козирних мастей роблять гру надзвичайно тактичною та динамічною!
                            </p>
                            <button
                                onClick={() => setShowRules(false)}
                                className="py-2.5 rounded-xl bg-amber-600 text-stone-950 font-bold hover:bg-amber-500"
                            >
                                Зрозуміло
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import {
    createFrenchTarotDeck,
    shuffleTarotDeck,
    TarotCard,
    TarotBid,
    TarotSuit,
    TAROT_BIDS,
    PlayedCardEntry,
    isCardPlayable,
    determineTrickWinner,
    isValidChienDiscard,
    calculateFinalTarotScore,
    aiEvaluateHandBidding,
    aiChooseChienDiscard,
    aiSelectCardToPlay,
    TarotScoringResult
} from '../lib/tarotGame';
import {
    Trophy,
    Coins,
    Info,
    X,
    Sparkles,
    Shield,
    Crown,
    HelpCircle,
    ArrowRight,
    Zap,
    Layers,
    CheckCircle2,
    AlertCircle,
    RotateCcw
} from 'lucide-react';

interface FrenchTarotModalProps {
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    betAmount: number;
    playerGold: number;
    onVictory: (reward: number) => void;
    onDefeat: (penalty: number) => void;
    onClose: () => void;
}

interface PlayerSeat {
    index: number;
    name: string;
    avatar: string;
    isHuman: boolean;
    hand: TarotCard[];
    wonTricks: TarotCard[];
    currentBid: TarotBid | null;
    isPreneur: boolean;
}

export function FrenchTarotModal({
    isOpen,
    opponent,
    tavernName,
    betAmount,
    playerGold,
    onVictory,
    onDefeat,
    onClose
}: FrenchTarotModalProps) {
    // Game stage: 'bidding' | 'chien_discard' | 'trick_play' | 'game_over'
    const [phase, setPhase] = useState<'bidding' | 'chien_discard' | 'trick_play' | 'game_over'>('bidding');
    
    // Players (0: Player, 1: West, 2: North [Opponent], 3: East)
    const [players, setPlayers] = useState<PlayerSeat[]>([]);
    const [chien, setChien] = useState<TarotCard[]>([]);
    const [discardSelection, setDiscardSelection] = useState<TarotCard[]>([]);
    
    // Bidding state
    const [biddingTurn, setBiddingTurn] = useState<number>(0); // 0..3
    const [highestBid, setHighestBid] = useState<TarotBid | null>(null);
    const [highestBidder, setHighestBidder] = useState<number | null>(null);
    const [allPassed, setAllPassed] = useState<boolean>(false);

    // Trick play state
    const [trickNumber, setTrickNumber] = useState<number>(1); // 1..18
    const [currentTrick, setCurrentTrick] = useState<PlayedCardEntry[]>([]);
    const [currentTurn, setCurrentTurn] = useState<number>(0);
    const [trickWinnerBanner, setTrickWinnerBanner] = useState<string | null>(null);
    const [petitAuBoutSide, setPetitAuBoutSide] = useState<'preneur' | 'defense' | null>(null);
    
    // Score & outcome
    const [finalScoreResult, setFinalScoreResult] = useState<TarotScoringResult | null>(null);

    // UI state
    const [activeSuitFilter, setActiveSuitFilter] = useState<'all' | TarotSuit>('all');
    const [showRules, setShowRules] = useState<boolean>(false);
    const [isFastSpeed, setIsFastSpeed] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [cardErrorTooltip, setCardErrorTooltip] = useState<string | null>(null);

    const speedDelay = isFastSpeed ? 450 : 900;

    // Initialize game when modal opens
    useEffect(() => {
        if (!isOpen) return;
        initializeFullTarotGame();
    }, [isOpen]);

    const initializeFullTarotGame = () => {
        const fullDeck = shuffleTarotDeck(createFrenchTarotDeck());

        // Deal: 18 cards to 4 players (72 cards), 6 cards to Chien
        const p0Hand = fullDeck.slice(0, 18);
        const p1Hand = fullDeck.slice(18, 36);
        const p2Hand = fullDeck.slice(36, 54);
        const p3Hand = fullDeck.slice(54, 72);
        const chienCards = fullDeck.slice(72, 78);

        // Sort player's hand nicely
        sortHand(p0Hand);

        const initialSeats: PlayerSeat[] = [
            {
                index: 0,
                name: 'Ви',
                avatar: '🧙‍♂️',
                isHuman: true,
                hand: p0Hand,
                wonTricks: [],
                currentBid: null,
                isPreneur: false
            },
            {
                index: 1,
                name: 'Жан-Люк',
                avatar: '🧔',
                isHuman: false,
                hand: p1Hand,
                wonTricks: [],
                currentBid: null,
                isPreneur: false
            },
            {
                index: 2,
                name: opponent.name,
                avatar: opponent.avatar || '🧝',
                isHuman: false,
                hand: p2Hand,
                wonTricks: [],
                currentBid: null,
                isPreneur: false
            },
            {
                index: 3,
                name: 'П’єр',
                avatar: '👴',
                isHuman: false,
                hand: p3Hand,
                wonTricks: [],
                currentBid: null,
                isPreneur: false
            }
        ];

        setPlayers(initialSeats);
        setChien(chienCards);
        setDiscardSelection([]);
        setPhase('bidding');
        setBiddingTurn(0);
        setHighestBid(null);
        setHighestBidder(null);
        setAllPassed(false);
        setTrickNumber(1);
        setCurrentTrick([]);
        setCurrentTurn(0);
        setTrickWinnerBanner(null);
        setPetitAuBoutSide(null);
        setFinalScoreResult(null);
        setCardErrorTooltip(null);
        setStatusMessage('Етап торгів: оголосіть контракт або спасуйте.');
    };

    // Sort hand: Trumps first (descending), then suits
    const sortHand = (hand: TarotCard[]) => {
        hand.sort((a, b) => {
            if (a.suit === 'excuse') return -1;
            if (b.suit === 'excuse') return 1;
            if (a.suit === 'trumps' && b.suit !== 'trumps') return -1;
            if (a.suit !== 'trumps' && b.suit === 'trumps') return 1;
            if (a.suit === b.suit) {
                return b.power - a.power;
            }
            return a.suit.localeCompare(b.suit);
        });
    };

    // --- BIDDING PHASE LOGIC ---
    useEffect(() => {
        if (phase !== 'bidding') return;
        if (allPassed) return;

        // If it's an AI turn to bid
        if (biddingTurn > 0 && biddingTurn < 4) {
            const currentSeat = players[biddingTurn];
            if (!currentSeat || currentSeat.currentBid !== null) return;

            const timer = setTimeout(() => {
                handleAiBid(biddingTurn);
            }, speedDelay);
            return () => clearTimeout(timer);
        }

        // Check if bidding is complete (all 4 players have made their bid)
        if (players.every(p => p.currentBid !== null)) {
            resolveBiddingFinish();
        }
    }, [phase, biddingTurn, players, allPassed]);

    const handlePlayerBid = (bid: TarotBid) => {
        if (biddingTurn !== 0) return;

        setPlayers(prev => {
            const next = [...prev];
            next[0] = { ...next[0], currentBid: bid };
            return next;
        });

        if (bid !== 'passe') {
            setHighestBid(bid);
            setHighestBidder(0);
            setStatusMessage(`Ви оголосили контракт [${TAROT_BIDS[bid].nameUk}]!`);
        } else {
            setStatusMessage('Ви сказали "Пас".');
        }

        setBiddingTurn(1);
    };

    const handleAiBid = (seatIndex: number) => {
        const seat = players[seatIndex];
        const aiSuggested = aiEvaluateHandBidding(seat.hand);

        // Current highest priority
        const currentPriority = highestBid ? TAROT_BIDS[highestBid].priority : 0;
        const aiPriority = TAROT_BIDS[aiSuggested].priority;

        let finalBid: TarotBid = 'passe';
        if (aiPriority > currentPriority) {
            finalBid = aiSuggested;
            setHighestBid(finalBid);
            setHighestBidder(seatIndex);
            setStatusMessage(`${seat.name} оголошує контракт: [${TAROT_BIDS[finalBid].nameUk}]!`);
        } else {
            setStatusMessage(`${seat.name} каже: "Пас".`);
        }

        setPlayers(prev => {
            const next = [...prev];
            next[seatIndex] = { ...next[seatIndex], currentBid: finalBid };
            return next;
        });

        setBiddingTurn(prev => prev + 1);
    };

    const resolveBiddingFinish = () => {
        if (!highestBid || highestBidder === null) {
            // All 4 passed: redraw or prompt
            setAllPassed(true);
            setStatusMessage('Усі гравці спасували! Перездача колоди.');
            setTimeout(() => {
                initializeFullTarotGame();
            }, 1500);
            return;
        }

        // Mark Preneur
        setPlayers(prev =>
            prev.map(p => ({
                ...p,
                isPreneur: p.index === highestBidder
            }))
        );

        const preneurName = players[highestBidder].name;
        const bidInfo = TAROT_BIDS[highestBid];

        if (highestBid === 'prise' || highestBid === 'garde') {
            // Chien is taken into hand
            setStatusMessage(`Контракт [${bidInfo.nameUk}] виграв ${preneurName}! Відкриття Прикупу ("Собаки").`);
            setPhase('chien_discard');

            if (highestBidder === 0) {
                // Player is Preneur: add chien to player hand
                setPlayers(prev => {
                    const next = [...prev];
                    const combined = [...next[0].hand, ...chien];
                    sortHand(combined);
                    next[0] = { ...next[0], hand: combined };
                    return next;
                });
            } else {
                // AI is Preneur: auto discard
                setTimeout(() => {
                    const aiPreneur = players[highestBidder];
                    const combined = [...aiPreneur.hand, ...chien];
                    const discards = aiChooseChienDiscard(combined);
                    const remainingHand = combined.filter(c => !discards.some(d => d.id === c.id));
                    
                    setPlayers(prev => {
                        const next = [...prev];
                        next[highestBidder] = {
                            ...next[highestBidder],
                            hand: remainingHand,
                            wonTricks: [...discards] // Discard counts towards preneur tricks
                        };
                        return next;
                    });

                    setStatusMessage(`${aiPreneur.name} скинув 6 карт у свій знос. Початок розіграшу!`);
                    setTimeout(() => {
                        setPhase('trick_play');
                        setTrickNumber(1);
                        setCurrentTurn(highestBidder); // Preneur leads trick 1
                    }, speedDelay);
                }, speedDelay * 1.5);
            }
        } else {
            // Garde sans or Garde contre: Chien remains closed on table
            setStatusMessage(`Контракт [${bidInfo.nameUk}] виграв ${preneurName}! "Собака" залишається закритою. Початок розіграшу!`);
            setTimeout(() => {
                setPhase('trick_play');
                setTrickNumber(1);
                setCurrentTurn(highestBidder);
            }, speedDelay * 1.2);
        }
    };

    // --- CHIEN DISCARD (PLAYER) ---
    const handleToggleDiscardCard = (card: TarotCard) => {
        if (discardSelection.some(c => c.id === card.id)) {
            setDiscardSelection(prev => prev.filter(c => c.id !== card.id));
            setCardErrorTooltip(null);
        } else {
            if (discardSelection.length >= 6) {
                setCardErrorTooltip('Ви вже обрали 6 карт для зносу!');
                return;
            }
            if (card.rank === 'R') {
                setCardErrorTooltip('Заборонено скидати Короля!');
                return;
            }
            if (card.isOudler) {
                setCardErrorTooltip('Заборонено скидати Удлер (21, 1 або Блазня)!');
                return;
            }
            if (card.suit === 'trumps') {
                const nonTrumpCount = players[0].hand.filter(
                    c => c.suit !== 'trumps' && c.suit !== 'excuse' && c.rank !== 'R'
                ).length;
                if (nonTrumpCount >= 6) {
                    setCardErrorTooltip('Не можна скидати козир, поки є звичайні карти!');
                    return;
                }
            }
            setDiscardSelection(prev => [...prev, card]);
            setCardErrorTooltip(null);
        }
    };

    const handleConfirmPlayerDiscard = () => {
        const check = isValidChienDiscard(discardSelection, players[0].hand);
        if (!check.valid) {
            setCardErrorTooltip(check.reason || 'Неправильний знос');
            return;
        }

        const remainingHand = players[0].hand.filter(c => !discardSelection.some(d => d.id === c.id));
        setPlayers(prev => {
            const next = [...prev];
            next[0] = {
                ...next[0],
                hand: remainingHand,
                wonTricks: [...discardSelection] // Player's discard counts in their trick score!
            };
            return next;
        });

        setDiscardSelection([]);
        setPhase('trick_play');
        setTrickNumber(1);
        setCurrentTurn(0);
        setStatusMessage('Знос завершено! Ви робите перший хід.');
    };

    // --- TRICK PLAY LOGIC ---
    useEffect(() => {
        if (phase !== 'trick_play') return;

        // If trick is full (4 cards played)
        if (currentTrick.length === 4) {
            const timer = setTimeout(() => {
                resolveTrickEnd();
            }, speedDelay * 1.6);
            return () => clearTimeout(timer);
        }

        // If it's an AI player's turn to play
        if (currentTurn !== 0 && currentTrick.length < 4) {
            const timer = setTimeout(() => {
                handleAiPlayCard(currentTurn);
            }, speedDelay);
            return () => clearTimeout(timer);
        }
    }, [phase, currentTrick, currentTurn]);

    const handlePlayerPlayCard = (card: TarotCard) => {
        if (currentTurn !== 0 || currentTrick.length >= 4) return;

        const check = isCardPlayable(card, players[0].hand, currentTrick, trickNumber);
        if (!check.valid) {
            setCardErrorTooltip(check.reason || 'Цю карту зараз не можна зіграти за правилами Таро');
            setTimeout(() => setCardErrorTooltip(null), 3500);
            return;
        }

        setCardErrorTooltip(null);

        // Play card
        const playedEntry: PlayedCardEntry = {
            playerIndex: 0,
            playerName: 'Ви',
            card
        };

        // Remove from player hand
        setPlayers(prev => {
            const next = [...prev];
            next[0] = {
                ...next[0],
                hand: next[0].hand.filter(c => c.id !== card.id)
            };
            return next;
        });

        setCurrentTrick(prev => [...prev, playedEntry]);
        setCurrentTurn(1); // Next player is West
    };

    const handleAiPlayCard = (seatIndex: number) => {
        const seat = players[seatIndex];
        const cardToPlay = aiSelectCardToPlay(
            seatIndex,
            seat.hand,
            currentTrick,
            trickNumber,
            highestBidder ?? 0
        );

        const playedEntry: PlayedCardEntry = {
            playerIndex: seatIndex,
            playerName: seat.name,
            card: cardToPlay
        };

        setPlayers(prev => {
            const next = [...prev];
            next[seatIndex] = {
                ...next[seatIndex],
                hand: next[seatIndex].hand.filter(c => c.id !== cardToPlay.id)
            };
            return next;
        });

        setCurrentTrick(prev => [...prev, playedEntry]);
        setCurrentTurn((seatIndex + 1) % 4);
    };

    const resolveTrickEnd = () => {
        const winner = determineTrickWinner(currentTrick);
        const winnerSeat = players[winner.winnerIndex];
        const winningCard = winner.winningCard;

        // Check Petit au bout (if trick 18 had Petit)
        if (trickNumber === 18 && winner.hasPetit) {
            const isWinnerPreneur = winner.winnerIndex === highestBidder;
            setPetitAuBoutSide(isWinnerPreneur ? 'preneur' : 'defense');
        }

        // Check Excuse retention rule:
        // If someone played Excuse, and their side didn't win, Excuse goes to owner's wonTricks
        const trickCardsToWinner: TarotCard[] = [];
        for (const entry of currentTrick) {
            if (entry.card.suit === 'excuse') {
                const excusePlayerIsPreneur = entry.playerIndex === highestBidder;
                const winnerIsPreneur = winner.winnerIndex === highestBidder;

                if (excusePlayerIsPreneur === winnerIsPreneur) {
                    // Same side won: Excuse stays in trick
                    trickCardsToWinner.push(entry.card);
                } else {
                    // Different side won: Excuse returns to its owner's wonTricks!
                    setPlayers(prev => {
                        const next = [...prev];
                        next[entry.playerIndex] = {
                            ...next[entry.playerIndex],
                            wonTricks: [...next[entry.playerIndex].wonTricks, entry.card]
                        };
                        return next;
                    });
                }
            } else {
                trickCardsToWinner.push(entry.card);
            }
        }

        // Add won cards to trick winner's pile
        setPlayers(prev => {
            const next = [...prev];
            next[winner.winnerIndex] = {
                ...next[winner.winnerIndex],
                wonTricks: [...next[winner.winnerIndex].wonTricks, ...trickCardsToWinner]
            };
            return next;
        });

        setTrickWinnerBanner(`Взятку №${trickNumber} забрав ${winnerSeat.name} (${winningCard.shortLabel})!`);

        setTimeout(() => {
            setTrickWinnerBanner(null);
            setCurrentTrick([]);

            if (trickNumber >= 18) {
                // All 18 tricks complete -> calculate final scoring
                finishFullGame();
            } else {
                setTrickNumber(t => t + 1);
                setCurrentTurn(winner.winnerIndex); // Winner leads next trick
            }
        }, speedDelay * 1.4);
    };

    const finishFullGame = () => {
        const preneurIdx = highestBidder ?? 0;
        const bid = highestBid ?? 'prise';

        const preneurCards = players[preneurIdx].wonTricks;
        const defenseCards = players.filter(p => p.index !== preneurIdx).flatMap(p => p.wonTricks);

        const score = calculateFinalTarotScore(
            preneurIdx,
            bid,
            preneurCards,
            defenseCards,
            chien,
            petitAuBoutSide,
            null
        );

        setFinalScoreResult(score);
        setPhase('game_over');

        // Determine if player won or lost
        const isPlayerPreneur = preneurIdx === 0;
        const didPlayerWin = (isPlayerPreneur && score.isSuccess) || (!isPlayerPreneur && !score.isSuccess);

        if (didPlayerWin) {
            // Reward calculation based on bet amount and points
            const multiplier = TAROT_BIDS[bid].multiplier;
            const reward = Math.max(betAmount * 2, betAmount + Math.round(Math.abs(score.netScorePerPlayer) * 1.5 * multiplier));
            onVictory(reward);
        } else {
            onDefeat(betAmount);
        }
    };

    // Filter player's hand based on selected tab
    const filteredPlayerHand = useMemo(() => {
        if (!players[0]) return [];
        if (activeSuitFilter === 'all') return players[0].hand;
        if (activeSuitFilter === 'trumps') {
            return players[0].hand.filter(c => c.suit === 'trumps' || c.suit === 'excuse');
        }
        return players[0].hand.filter(c => c.suit === activeSuitFilter);
    }, [players, activeSuitFilter]);

    // Current trick points on table
    const currentTrickPoints = useMemo(() => {
        return currentTrick.reduce((acc, e) => acc + e.card.points, 0);
    }, [currentTrick]);

    if (!isOpen) return null;

    const preneurSeat = highestBidder !== null ? players[highestBidder] : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md select-none">
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-5xl h-[94vh] max-h-[860px] bg-[#140e0a] border-2 border-amber-600/80 rounded-2xl shadow-2xl p-3 sm:p-5 text-[#f5ebd7] flex flex-col justify-between overflow-hidden"
            >
                {/* 1. Header Bar */}
                <div className="flex items-center justify-between border-b border-amber-900/50 pb-2.5 px-1">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl sm:text-3xl">🔮</span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg sm:text-xl font-bold font-serif text-amber-200 tracking-wide">
                                    Французьке Таро (Jeu de Tarot)
                                </h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono">
                                    78 карт • 4 гравці
                                </span>
                            </div>
                            <p className="text-xs text-stone-400">
                                Таверна: <span className="text-amber-300">{tavernName}</span> • Ставка:{' '}
                                <span className="text-amber-400 font-bold">{betAmount} 🪙</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Speed Toggle */}
                        <button
                            onClick={() => setIsFastSpeed(v => !v)}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                isFastSpeed
                                    ? 'bg-amber-600 border-amber-400 text-stone-950'
                                    : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-700'
                            }`}
                            title="Швидкість гри"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isFastSpeed ? '2.5x Швидко' : '1x Норма'}</span>
                        </button>

                        <button
                            onClick={() => setShowRules(true)}
                            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-900/40 text-amber-300"
                            title="Офіційні правила Таро"
                        >
                            <Info className="w-4 h-4" />
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300"
                            title="Закрити"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 2. Top Status & Contract Badge Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1b130c] border border-amber-900/40 px-3 py-2 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-400">Етап:</span>
                        <span className="font-bold text-amber-300 uppercase tracking-wider">
                            {phase === 'bidding' && 'Торгівля за контракти'}
                            {phase === 'chien_discard' && 'Знос карт Прикупу'}
                            {phase === 'trick_play' && `Розіграш взяток (${trickNumber} / 18)`}
                            {phase === 'game_over' && 'Підсумок партії'}
                        </span>
                    </div>

                    {highestBid && preneurSeat && (
                        <div className="flex items-center gap-2 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-600/30">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-amber-200">
                                Берущий:{' '}
                                <strong className="text-amber-400 font-bold">{preneurSeat.name}</strong> •{' '}
                                <span className="font-bold">{TAROT_BIDS[highestBid].nameUk}</span> (x
                                {TAROT_BIDS[highestBid].multiplier})
                            </span>
                        </div>
                    )}

                    <div className="text-stone-300 italic font-sans text-[11px] truncate max-w-sm">
                        {statusMessage}
                    </div>
                </div>

                {/* 3. Main Felt Table Area */}
                <div className="relative flex-1 my-2 bg-gradient-to-b from-[#112415] via-[#0d1c10] to-[#09150c] border-2 border-[#3b593f]/40 rounded-2xl p-3 flex flex-col justify-between overflow-hidden shadow-inner">
                    {/* Felt table texture glow */}
                    <div className="absolute inset-0 bg-radial from-emerald-950/20 via-transparent to-black/60 pointer-events-none" />

                    {/* SEAT NORTH: Opponent (Index 2) */}
                    <div className="relative z-10 flex flex-col items-center">
                        <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                                currentTurn === 2 && phase === 'trick_play'
                                    ? 'bg-amber-600/30 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                                    : 'bg-[#18130e]/80 border-stone-800'
                            }`}
                        >
                            <span className="text-xl">{opponent.avatar || '🧝'}</span>
                            <div className="text-left">
                                <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                                    <span>{opponent.name}</span>
                                    {players[2]?.isPreneur && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-black font-bold">
                                            Preneur
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-stone-400">
                                    Карт у руці: <span className="text-amber-400">{players[2]?.hand.length || 0}</span> •
                                    Взяток: <span className="text-emerald-400">{players[2]?.wonTricks.length || 0}</span>
                                    {players[2]?.currentBid && (
                                        <span className="ml-1 text-amber-300 font-mono">
                                            [{TAROT_BIDS[players[2].currentBid].nameUk}]
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE ROW: West (Seat 1) | Center Felt Tricks | East (Seat 3) */}
                    <div className="relative z-10 flex items-center justify-between px-2 sm:px-6">
                        {/* SEAT WEST: Jean-Luc (Index 1) */}
                        <div
                            className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                                currentTurn === 1 && phase === 'trick_play'
                                    ? 'bg-amber-600/30 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                                    : 'bg-[#18130e]/80 border-stone-800'
                            }`}
                        >
                            <span className="text-xl">🧔</span>
                            <span className="text-xs font-bold text-amber-200 mt-1">Жан-Люк</span>
                            <span className="text-[10px] text-stone-400">
                                {players[1]?.hand.length || 0} карт
                            </span>
                            {players[1]?.isPreneur && (
                                <span className="text-[9px] px-1 rounded bg-amber-500 text-black font-bold mt-0.5">
                                    Preneur
                                </span>
                            )}
                            {players[1]?.currentBid && (
                                <span className="text-[9px] text-amber-300 font-mono mt-0.5">
                                    [{TAROT_BIDS[players[1].currentBid].nameUk}]
                                </span>
                            )}
                        </div>

                        {/* CENTER FELT: Current Trick / Chien / Bidding Box */}
                        <div className="relative flex flex-col items-center justify-center min-h-[190px] w-full max-w-md mx-auto">
                            {/* Phase 1: Bidding UI in Center */}
                            {phase === 'bidding' && (
                                <div className="bg-[#18130e]/95 border border-amber-600/60 rounded-xl p-4 w-full text-center space-y-3 shadow-2xl backdrop-blur-md">
                                    <div className="flex items-center justify-center gap-2 text-amber-300 font-serif font-bold text-sm">
                                        <Crown className="w-4 h-4 text-amber-400" />
                                        <span>Торги за контракт (Les Enchères)</span>
                                    </div>

                                    {/* Chien preview */}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[11px] text-stone-400">
                                            Прикуп ("Собака / Le Chien") — 6 закритих карт на столі:
                                        </span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5, 6].map(i => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-12 rounded bg-gradient-to-br from-amber-900 to-amber-950 border border-amber-600/50 flex items-center justify-center text-xs shadow-md"
                                                >
                                                    🎴
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Player Bidding Actions */}
                                    {biddingTurn === 0 ? (
                                        <div className="space-y-2">
                                            <div className="text-xs text-amber-200 font-medium">Ваш хід оголошувати:</div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                                                <button
                                                    onClick={() => handlePlayerBid('passe')}
                                                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-semibold transition-all"
                                                >
                                                    Пас (Passe)
                                                </button>
                                                {(['prise', 'garde', 'garde_sans', 'garde_contre'] as TarotBid[]).map(bidKey => {
                                                    const option = TAROT_BIDS[bidKey];
                                                    const currentPriority = highestBid ? TAROT_BIDS[highestBid].priority : 0;
                                                    const isAvailable = option.priority > currentPriority;

                                                    return (
                                                        <button
                                                            key={bidKey}
                                                            onClick={() => handlePlayerBid(bidKey)}
                                                            disabled={!isAvailable}
                                                            className={`p-2 rounded-lg border font-bold transition-all text-[11px] flex flex-col items-center ${
                                                                isAvailable
                                                                    ? 'bg-amber-600/30 hover:bg-amber-600/50 border-amber-500 text-amber-100 hover:scale-102'
                                                                    : 'bg-stone-900/50 border-stone-800 text-stone-500 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            <span>{option.nameUk}</span>
                                                            <span className="text-[9px] font-mono text-amber-400">
                                                                (x{option.multiplier})
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-stone-300 animate-pulse flex items-center justify-center gap-2 py-2">
                                            <span>Очікування ходу гравця:</span>
                                            <strong className="text-amber-300">{players[biddingTurn]?.name}</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Phase 2: Chien Discard (Écart) */}
                            {phase === 'chien_discard' && (
                                <div className="bg-[#18130e]/95 border border-amber-500 rounded-xl p-3 w-full text-center space-y-2 shadow-2xl backdrop-blur-md">
                                    <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                                        <Layers className="w-4 h-4 text-amber-400" />
                                        <span>Відкритий Прикуп ("Собака")</span>
                                    </div>
                                    <div className="flex gap-1.5 justify-center flex-wrap">
                                        {chien.map(card => (
                                            <TarotCardView key={card.id} card={card} size="sm" />
                                        ))}
                                    </div>

                                    {highestBidder === 0 ? (
                                        <div className="space-y-2 pt-1 border-t border-amber-900/40">
                                            <p className="text-xs text-amber-200">
                                                Ви — Берущий! Оберіть <span className="font-bold text-amber-400">6 карт</span> зі
                                                своєї руки нижче, щоб скинути їх у свій знос (очки підуть вам).
                                            </p>
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-xs font-bold text-amber-300 font-mono">
                                                    Обрано: {discardSelection.length} / 6
                                                </span>
                                                <button
                                                    onClick={handleConfirmPlayerDiscard}
                                                    disabled={discardSelection.length !== 6}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        discardSelection.length === 6
                                                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md'
                                                            : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Підтвердити знос (6 карт)
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-stone-300 py-1">
                                            {players[highestBidder]?.name} формує свій знос...
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Phase 3: Trick Table (4 Played Cards Compass) */}
                            {phase === 'trick_play' && (
                                <div className="relative w-full h-[180px] flex items-center justify-center">
                                    {/* Compass Layout: North, West, East, South */}
                                    <div className="relative w-64 h-44 flex items-center justify-center">
                                        {currentTrick.map(entry => {
                                            // Position based on seat
                                            let posClasses = '';
                                            if (entry.playerIndex === 2) posClasses = '-top-1 left-1/2 -translate-x-1/2'; // North
                                            if (entry.playerIndex === 1) posClasses = 'left-0 top-1/2 -translate-y-1/2'; // West
                                            if (entry.playerIndex === 3) posClasses = 'right-0 top-1/2 -translate-y-1/2'; // East
                                            if (entry.playerIndex === 0) posClasses = '-bottom-1 left-1/2 -translate-x-1/2'; // South (Player)

                                            return (
                                                <motion.div
                                                    key={`${entry.playerIndex}_${entry.card.id}`}
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className={`absolute ${posClasses} z-20 flex flex-col items-center`}
                                                >
                                                    <span className="text-[9px] font-bold text-amber-300 bg-black/60 px-1 rounded mb-0.5">
                                                        {entry.playerName}
                                                    </span>
                                                    <TarotCardView card={entry.card} size="md" />
                                                </motion.div>
                                            );
                                        })}

                                        {/* Winner banner overlay */}
                                        <AnimatePresence>
                                            {trickWinnerBanner && (
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.8, opacity: 0 }}
                                                    className="absolute z-30 bg-[#1f1710] border-2 border-amber-500 px-3 py-1.5 rounded-xl text-center shadow-2xl text-xs font-bold text-amber-200"
                                                >
                                                    {trickWinnerBanner}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {/* Phase 4: Game Over Screen in Center */}
                            {phase === 'game_over' && finalScoreResult && (
                                <div className="bg-[#1b130c]/98 border-2 border-amber-500 rounded-2xl p-4 w-full max-w-lg text-center space-y-3 shadow-2xl">
                                    <div className="text-3xl">
                                        {(highestBidder === 0 && finalScoreResult.isSuccess) ||
                                        (highestBidder !== 0 && !finalScoreResult.isSuccess)
                                            ? '🏆'
                                            : '💀'}
                                    </div>
                                    <h4 className="text-lg font-bold font-serif text-amber-200">
                                        {(highestBidder === 0 && finalScoreResult.isSuccess) ||
                                        (highestBidder !== 0 && !finalScoreResult.isSuccess)
                                            ? 'Перемога у Французькому Таро!'
                                            : 'Поразка у Французькому Таро!'}
                                    </h4>

                                    <div className="bg-[#120c08] p-3 rounded-xl border border-amber-900/50 text-xs text-left space-y-1.5 font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-stone-400">Берущий:</span>
                                            <span className="text-amber-300 font-bold">
                                                {players[finalScoreResult.preneurIndex].name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-400">Контракт:</span>
                                            <span className="text-amber-300">
                                                {finalScoreResult.contract.nameUk} (x
                                                {finalScoreResult.contract.multiplier})
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-400">Зібрано Удлерів (Кінців):</span>
                                            <span className="text-emerald-400 font-bold">
                                                {finalScoreResult.preneurOudlersCount} / 3 (потрібно{' '}
                                                {finalScoreResult.targetPointsNeeded} очок)
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-400">Набрано очок карт:</span>
                                            <span className="text-amber-200 font-bold">
                                                {finalScoreResult.preneurCardPoints} з 91
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-400">Різниця (Diff):</span>
                                            <span
                                                className={`font-bold ${
                                                    finalScoreResult.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                }`}
                                            >
                                                {finalScoreResult.diff >= 0 ? '+' : ''}
                                                {finalScoreResult.diff}
                                            </span>
                                        </div>
                                        {finalScoreResult.petitAuBoutBonus !== 0 && (
                                            <div className="flex justify-between text-teal-300">
                                                <span>Бонус Petit au bout (1 в кінці):</span>
                                                <span>{finalScoreResult.petitAuBoutBonus > 0 ? '+' : ''}{finalScoreResult.petitAuBoutBonus}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-amber-900/40 pt-1 flex justify-between text-amber-400 font-bold">
                                            <span>Рахунок за гру (FFT):</span>
                                            <span>{finalScoreResult.totalPreneurScore} pts</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-3">
                                        <button
                                            onClick={initializeFullTarotGame}
                                            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>Зіграти ще раз</span>
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-lg"
                                        >
                                            Завершити гру
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SEAT EAST: Pierre (Seat 3) */}
                        <div
                            className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                                currentTurn === 3 && phase === 'trick_play'
                                    ? 'bg-amber-600/30 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                                    : 'bg-[#18130e]/80 border-stone-800'
                            }`}
                        >
                            <span className="text-xl">👴</span>
                            <span className="text-xs font-bold text-amber-200 mt-1">П’єр</span>
                            <span className="text-[10px] text-stone-400">
                                {players[3]?.hand.length || 0} карт
                            </span>
                            {players[3]?.isPreneur && (
                                <span className="text-[9px] px-1 rounded bg-amber-500 text-black font-bold mt-0.5">
                                    Preneur
                                </span>
                            )}
                            {players[3]?.currentBid && (
                                <span className="text-[9px] text-amber-300 font-mono mt-0.5">
                                    [{TAROT_BIDS[players[3].currentBid].nameUk}]
                                </span>
                            )}
                        </div>
                    </div>

                    {/* SEAT SOUTH: Human Player Status Bar */}
                    <div className="relative z-10 flex items-center justify-between px-2 pt-1 border-t border-[#3b593f]/30">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🧙‍♂️</span>
                            <div className="text-left">
                                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                    <span>Ви (Гравець)</span>
                                    {players[0]?.isPreneur ? (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-black font-bold">
                                            Preneur (Берущий)
                                        </span>
                                    ) : (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-700 text-stone-300 font-medium">
                                            Захист (Défense)
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-stone-400">
                                    Карт: <span className="text-amber-400">{players[0]?.hand.length || 0}</span> • Взятих
                                    карт: <span className="text-emerald-400">{players[0]?.wonTricks.length || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card error message alert */}
                        {cardErrorTooltip && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium shadow-md"
                            >
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>{cardErrorTooltip}</span>
                            </motion.div>
                        )}

                        <div className="text-[11px] text-stone-400">
                            {phase === 'trick_play' && (
                                <span>
                                    Хід:{' '}
                                    <strong
                                        className={
                                            currentTurn === 0 ? 'text-emerald-400 font-bold' : 'text-amber-300'
                                        }
                                    >
                                        {players[currentTurn]?.name}
                                    </strong>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Player Hand Section (Bottom Drawer) */}
                <div className="bg-[#18130e] border border-amber-900/50 rounded-xl p-2.5 flex flex-col gap-2 shadow-xl">
                    {/* Suit filter tabs */}
                    <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-xs">
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] text-stone-400 mr-1 hidden sm:inline">Фільтр:</span>
                            <button
                                onClick={() => setActiveSuitFilter('all')}
                                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                                    activeSuitFilter === 'all'
                                        ? 'bg-amber-600 text-stone-950 font-bold'
                                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                }`}
                            >
                                Всі ({players[0]?.hand.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveSuitFilter('trumps')}
                                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                                    activeSuitFilter === 'trumps'
                                        ? 'bg-amber-600 text-stone-950 font-bold'
                                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                }`}
                            >
                                ★ Козирі ({players[0]?.hand.filter(c => c.suit === 'trumps' || c.suit === 'excuse').length || 0})
                            </button>
                            <button
                                onClick={() => setActiveSuitFilter('spades')}
                                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                                    activeSuitFilter === 'spades'
                                        ? 'bg-amber-600 text-stone-950 font-bold'
                                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                }`}
                            >
                                ♠ Піки ({players[0]?.hand.filter(c => c.suit === 'spades').length || 0})
                            </button>
                            <button
                                onClick={() => setActiveSuitFilter('hearts')}
                                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                                    activeSuitFilter === 'hearts'
                                        ? 'bg-amber-600 text-stone-950 font-bold'
                                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                }`}
                            >
                                ♥ Чирви ({players[0]?.hand.filter(c => c.suit === 'hearts').length || 0})
                            </button>
                            <button
                                onClick={() => setActiveSuitFilter('diamonds')}
                                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                                    activeSuitFilter === 'diamonds'
                                        ? 'bg-amber-600 text-stone-950 font-bold'
                                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                }`}
                            >
                                ♦ Бубни ({players[0]?.hand.filter(c => c.suit === 'diamonds').length || 0})
                            </button>
                            <button
                                onClick={() => setActiveSuitFilter('clubs')}
                                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                                    activeSuitFilter === 'clubs'
                                        ? 'bg-amber-600 text-stone-950 font-bold'
                                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                }`}
                            >
                                ♣ Трефи ({players[0]?.hand.filter(c => c.suit === 'clubs').length || 0})
                            </button>
                        </div>

                        {phase === 'chien_discard' && highestBidder === 0 && (
                            <span className="text-[11px] text-amber-300 font-bold">
                                Клікніть на 6 карт для зносу!
                            </span>
                        )}
                    </div>

                    {/* Cards Hand Grid / Row */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1.5 pt-1 px-0.5 justify-start items-end min-h-[110px] custom-scrollbar">
                        {filteredPlayerHand.map(card => {
                            const isSelectedForDiscard = discardSelection.some(c => c.id === card.id);
                            
                            // Check playability in trick play
                            let playable = true;
                            if (phase === 'trick_play' && currentTurn === 0) {
                                playable = isCardPlayable(card, players[0].hand, currentTrick, trickNumber).valid;
                            } else if (phase === 'trick_play' && currentTurn !== 0) {
                                playable = false;
                            }

                            return (
                                <motion.div
                                    key={card.id}
                                    whileHover={{ y: -6, scale: 1.05 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="shrink-0"
                                >
                                    <button
                                        onClick={() => {
                                            if (phase === 'chien_discard' && highestBidder === 0) {
                                                handleToggleDiscardCard(card);
                                            } else if (phase === 'trick_play') {
                                                handlePlayerPlayCard(card);
                                            }
                                        }}
                                        disabled={phase === 'bidding' || (phase === 'trick_play' && currentTurn !== 0)}
                                        className={`transition-all rounded-lg ${
                                            isSelectedForDiscard
                                                ? 'ring-2 ring-amber-400 -translate-y-2'
                                                : !playable && phase === 'trick_play'
                                                ? 'opacity-40 grayscale cursor-not-allowed'
                                                : ''
                                        }`}
                                    >
                                        <TarotCardView card={card} size="lg" isSelected={isSelectedForDiscard} />
                                    </button>
                                </motion.div>
                            );
                        })}
                        {filteredPlayerHand.length === 0 && (
                            <div className="text-xs text-stone-500 py-6 px-4 italic">
                                Немає карт цієї категорії в руці.
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. French Tarot Official Rules Modal */}
                <AnimatePresence>
                    {showRules && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative w-full max-w-2xl max-h-[85vh] bg-[#1a120c] border-2 border-amber-600 rounded-2xl p-5 text-stone-200 flex flex-col gap-4 overflow-y-auto"
                            >
                                <div className="flex items-center justify-between border-b border-amber-900/50 pb-2">
                                    <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-lg">
                                        <HelpCircle className="w-5 h-5 text-amber-400" />
                                        <span>Офіційні правила Французького Таро (FFT / Wikipedia)</span>
                                    </div>
                                    <button
                                        onClick={() => setShowRules(false)}
                                        className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3 text-xs leading-relaxed text-stone-300">
                                    <div className="p-3 bg-[#241a12] rounded-xl border border-amber-900/30">
                                        <h5 className="font-bold text-amber-300 mb-1">Колода з 78 карт та Очки (Всього 91 очко)</h5>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            <li><strong>4 масті по 14 карт:</strong> 1..10, Валет (1.5), Лицар (2.5), Дама (3.5), Король (4.5). Фоски 1..10 вартують 0.5 очка.</li>
                                            <li><strong>21 Козир (Atouts):</strong> нумеровані 1..21. Козирі 2..20 вартують 0.5 очка.</li>
                                            <li><strong>3 Удлери / Кінці (Bouts / Oudlers):</strong> 21 Козир, 1 Козир (Le Petit) та Блазень (L’Excuse). Кожен вартує <strong>4.5 очка</strong>.</li>
                                        </ul>
                                    </div>

                                    <div className="p-3 bg-[#241a12] rounded-xl border border-amber-900/30">
                                        <h5 className="font-bold text-amber-300 mb-1">Кількість Удлерів та Необхідні Очки для перемоги</h5>
                                        <div className="grid grid-cols-2 gap-2 text-amber-200">
                                            <div className="p-2 bg-black/40 rounded">3 Удлери → потрібно <strong>36 очок</strong></div>
                                            <div className="p-2 bg-black/40 rounded">2 Удлери → потрібно <strong>41 очко</strong></div>
                                            <div className="p-2 bg-black/40 rounded">1 Удлер → потрібно <strong>51 очко</strong></div>
                                            <div className="p-2 bg-black/40 rounded">0 Удлерів → потрібно <strong>56 очок</strong></div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-[#241a12] rounded-xl border border-amber-900/30">
                                        <h5 className="font-bold text-amber-300 mb-1">Торгівля (Контракти)</h5>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            <li><strong>Пас (Passe):</strong> гравець не грає в атаці.</li>
                                            <li><strong>Мала (Prise / Petite) [x1]:</strong> забирає 6 карт Прикупу, скидає 6 карт (без Королів і Удлерів).</li>
                                            <li><strong>Гард (Garde) [x2]:</strong> забирає Прикуп і скидає 6 карт. Множник x2.</li>
                                            <li><strong>Гард без собаки (Garde sans) [x4]:</strong> Прикуп закритий, але очки йдуть Берущому.</li>
                                            <li><strong>Гард проти собаки (Garde contre) [x6]:</strong> Прикуп закритий, а його очки йдуть Захисту!</li>
                                        </ul>
                                    </div>

                                    <div className="p-3 bg-[#241a12] rounded-xl border border-amber-900/30">
                                        <h5 className="font-bold text-amber-300 mb-1">Правила розіграшу взяток</h5>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            <li><strong>Обов'язок ходу в масть:</strong> зобов'язані грати в масть заходу.</li>
                                            <li><strong>Обов'язок козиря:</strong> якщо масті немає — зобов'язані бити козирем.</li>
                                            <li><strong>Обов'язок перебивання (Surcouper):</strong> якщо в взятці вже є козир, зобов'язані покласти вищий козир (якщо є).</li>
                                            <li><strong>Блазень (L’Excuse):</strong> можна зіграти будь-коли замість будь-якої карти. Він не бере взятку, але повертається власнику!</li>
                                            <li><strong>Petit au bout:</strong> якщо 1 козир (Le Petit) зіграно на 18-й (останній) взятці, сторона переможця взятки отримує бонус +10 очок (множиться на коефіцієнт контракту).</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                    <button
                                        onClick={() => setShowRules(false)}
                                        className="py-2 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs"
                                    >
                                        Зрозуміло
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

// Subcomponent: Crisp, authentic Tarot Card renderer
interface TarotCardViewProps {
    card: TarotCard;
    size?: 'sm' | 'md' | 'lg';
    isSelected?: boolean;
    key?: string | number;
}

function TarotCardView({ card, size = 'md', isSelected = false }: TarotCardViewProps) {
    const isRedSuit = card.suit === 'hearts' || card.suit === 'diamonds';
    const isTrump = card.suit === 'trumps';
    const isExcuse = card.suit === 'excuse';

    let sizeClasses = 'w-16 h-24 text-[10px]';
    if (size === 'sm') sizeClasses = 'w-11 h-16 text-[9px]';
    if (size === 'lg') sizeClasses = 'w-14 sm:w-16 h-22 sm:h-26 text-[10px] sm:text-xs';

    return (
        <div
            className={`relative ${sizeClasses} rounded-lg select-none border flex flex-col justify-between p-1 text-center font-serif shadow-md transition-all ${
                isSelected
                    ? 'border-amber-400 bg-amber-100 text-stone-950 shadow-amber-500/40'
                    : isTrump
                    ? 'bg-gradient-to-b from-[#2a1a2e] to-[#160e1a] border-purple-500/60 text-purple-200'
                    : isExcuse
                    ? 'bg-gradient-to-b from-[#38260d] to-[#1c1206] border-amber-400 text-amber-200'
                    : 'bg-stone-100 border-stone-400 text-stone-900'
            }`}
        >
            {/* Top Corner Label */}
            <div className="flex justify-between items-center leading-none">
                <span
                    className={`font-bold font-sans ${
                        isRedSuit
                            ? 'text-red-600'
                            : isTrump
                            ? 'text-purple-300'
                            : isExcuse
                            ? 'text-amber-400'
                            : 'text-stone-900'
                    }`}
                >
                    {card.shortLabel.split(' ')[0]}
                </span>
                {card.isOudler && (
                    <span className="text-[8px] bg-amber-500/90 text-stone-950 font-bold px-1 rounded-sm leading-tight">
                        OUD
                    </span>
                )}
            </div>

            {/* Center Symbol / Arcana Visual */}
            <div className="flex flex-col items-center justify-center my-auto">
                {isTrump ? (
                    <>
                        <span className="text-base sm:text-lg text-purple-400">★</span>
                        <span className="font-bold text-[10px] text-amber-300 font-sans">{card.rank}</span>
                    </>
                ) : isExcuse ? (
                    <>
                        <span className="text-base sm:text-lg">🃏</span>
                        <span className="font-bold text-[9px] text-amber-300">EXCUSE</span>
                    </>
                ) : (
                    <>
                        <span
                            className={`text-base sm:text-lg ${
                                isRedSuit ? 'text-red-600' : 'text-stone-900'
                            }`}
                        >
                            {card.suit === 'spades' && '♠'}
                            {card.suit === 'hearts' && '♥'}
                            {card.suit === 'diamonds' && '♦'}
                            {card.suit === 'clubs' && '♣'}
                        </span>
                        <span className="text-[9px] font-bold font-sans text-stone-700">
                            {typeof card.rank === 'string'
                                ? card.rank === 'R'
                                    ? 'Король'
                                    : card.rank === 'D'
                                    ? 'Дама'
                                    : card.rank === 'C'
                                    ? 'Лицар'
                                    : 'Валет'
                                : ''}
                        </span>
                    </>
                )}
            </div>

            {/* Bottom Card Points Badge */}
            <div className="flex justify-between items-center text-[8px] opacity-75 font-sans leading-none">
                <span className="truncate">{card.points}п</span>
                <span>
                    {card.suit === 'spades' && '♠'}
                    {card.suit === 'hearts' && '♥'}
                    {card.suit === 'diamonds' && '♦'}
                    {card.suit === 'clubs' && '♣'}
                    {isTrump && '★'}
                    {isExcuse && '🃏'}
                </span>
            </div>
        </div>
    );
}

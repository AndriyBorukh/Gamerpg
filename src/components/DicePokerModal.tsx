import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    Dices, 
    RotateCcw, 
    CheckCircle2, 
    Coins, 
    Trophy, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    Flame,
    Lock
} from 'lucide-react';

interface DicePokerModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

export interface PokerHandResult {
    score: number; // 1 to 9
    nameUA: string;
    tieBreakers: number[]; // Ranks sorted by importance
    description: string;
}

export function evaluatePokerDice(dice: number[]): PokerHandResult {
    const sorted = [...dice].sort((a, b) => a - b);
    const counts: Record<number, number> = {};
    sorted.forEach(d => { counts[d] = (counts[d] || 0) + 1; });

    const entries = Object.entries(counts).map(([val, count]) => ({
        val: parseInt(val, 10),
        count
    })).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.val - a.val;
    });

    const isFiveOfKind = entries[0].count === 5;
    const isFourOfKind = entries[0].count === 4;
    const isFullHouse = entries[0].count === 3 && entries[1].count === 2;
    const isThreeOfKind = entries[0].count === 3 && entries[1].count === 1;
    const isTwoPair = entries[0].count === 2 && entries[1].count === 2;
    const isOnePair = entries[0].count === 2 && entries[1].count === 1;

    const strSorted = sorted.join('');
    const isLowStraight = strSorted === '12345';
    const isHighStraight = strSorted === '23456';

    if (isFiveOfKind) {
        return {
            score: 9,
            nameUA: `Покер (5 однакових: ${entries[0].val})`,
            tieBreakers: [entries[0].val],
            description: `Абсолютна комбінація з п'яти ${entries[0].val}!`
        };
    }
    if (isFourOfKind) {
        return {
            score: 8,
            nameUA: `Каре (4 одинакових: ${entries[0].val})`,
            tieBreakers: [entries[0].val, entries[1].val],
            description: `Чотири кістки номіналу ${entries[0].val}`
        };
    }
    if (isFullHouse) {
        return {
            score: 7,
            nameUA: `Фулл-Хаус (${entries[0].val} і ${entries[1].val})`,
            tieBreakers: [entries[0].val, entries[1].val],
            description: `Трійка ${entries[0].val} та пара ${entries[1].val}`
        };
    }
    if (isHighStraight) {
        return {
            score: 6,
            nameUA: 'Великий Стріт (2-3-4-5-6)',
            tieBreakers: [6],
            description: 'Послідовність від двійки до шістки'
        };
    }
    if (isLowStraight) {
        return {
            score: 5,
            nameUA: 'Малий Стріт (1-2-3-4-5)',
            tieBreakers: [5],
            description: 'Послідовність від одиниці до п\'ятірки'
        };
    }
    if (isThreeOfKind) {
        return {
            score: 4,
            nameUA: `Трійка (${entries[0].val})`,
            tieBreakers: [entries[0].val, entries[1].val, entries[2].val],
            description: `Три кістки номіналу ${entries[0].val}`
        };
    }
    if (isTwoPair) {
        return {
            score: 3,
            nameUA: `Дві Пари (${entries[0].val} та ${entries[1].val})`,
            tieBreakers: [Math.max(entries[0].val, entries[1].val), Math.min(entries[0].val, entries[1].val), entries[2].val],
            description: `Пара ${entries[0].val} та пара ${entries[1].val}`
        };
    }
    if (isOnePair) {
        return {
            score: 2,
            nameUA: `Пара (${entries[0].val})`,
            tieBreakers: [entries[0].val, ...entries.slice(1).map(e => e.val).sort((a, b) => b - a)],
            description: `Дві кістки номіналу ${entries[0].val}`
        };
    }

    return {
        score: 1,
        nameUA: `Старша кістка (${sorted[4]})`,
        tieBreakers: [...sorted].reverse(),
        description: `Найвище значення: ${sorted[4]}`
    };
}

// Compare two hands: 1 if A > B, -1 if A < B, 0 if equal
export function comparePokerHands(a: PokerHandResult, b: PokerHandResult): number {
    if (a.score > b.score) return 1;
    if (a.score < b.score) return -1;
    for (let i = 0; i < Math.min(a.tieBreakers.length, b.tieBreakers.length); i++) {
        if (a.tieBreakers[i] > b.tieBreakers[i]) return 1;
        if (a.tieBreakers[i] < b.tieBreakers[i]) return -1;
    }
    return 0;
}

const DIE_PULLS: Record<number, string> = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
};

export default function DicePokerModal({
    expectedXpReward,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: DicePokerModalProps) {
    const [playerDice, setPlayerDice] = useState<number[]>([1, 2, 3, 4, 5]);
    const [playerHeld, setPlayerHeld] = useState<boolean[]>([false, false, false, false, false]);
    const [playerRerollsLeft, setPlayerRerollsLeft] = useState<number>(2);

    const [aiDice, setAiDice] = useState<number[]>([2, 3, 4, 5, 6]);
    const [aiHeld, setAiHeld] = useState<boolean[]>([false, false, false, false, false]);
    const [aiRerollsLeft, setAiRerollsLeft] = useState<number>(2);

    const [playerScoreRounds, setPlayerScoreRounds] = useState<number>(0);
    const [aiScoreRounds, setAiScoreRounds] = useState<number>(0);
    const [currentRound, setCurrentRound] = useState<number>(1);

    const [isRolling, setIsRolling] = useState<boolean>(false);
    const [gameStage, setGameStage] = useState<'initial' | 'player_turn' | 'ai_turn' | 'round_showdown' | 'match_over'>('initial');
    const [matchWinner, setMatchWinner] = useState<'player' | 'ai' | null>(null);
    const [log, setLog] = useState<string[]>([]);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);

    const playTone = (type: 'roll' | 'lock' | 'round_win' | 'round_lose' | 'match_win') => {
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
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'lock') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'round_win') {
                [523.25, 659.25, 783.99].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.25);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.25);
                });
            } else if (type === 'match_win') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.4);
                    o.start(ctx.currentTime + i * 0.12);
                    o.stop(ctx.currentTime + i * 0.12 + 0.4);
                });
            }
        } catch {}
    };

    const addLog = (msg: string) => setLog(prev => [msg, ...prev.slice(0, 20)]);

    const roll5 = () => [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
    ];

    const startMatch = () => {
        setPlayerScoreRounds(0);
        setAiScoreRounds(0);
        setCurrentRound(1);
        setMatchWinner(null);
        startRound(1);
    };

    const startRound = (roundNum: number) => {
        const pDice = roll5();
        const aDice = roll5();
        setPlayerDice(pDice);
        setPlayerHeld([false, false, false, false, false]);
        setPlayerRerollsLeft(2);

        setAiDice(aDice);
        setAiHeld([false, false, false, false, false]);
        setAiRerollsLeft(2);

        setGameStage('player_turn');
        playTone('roll');
        addLog(`🎲 Раунд #${roundNum}! Перший кидок зроблено. Виберіть кістки, які бажаєте залишити, або перекиньте.`);
    };

    useEffect(() => {
        if (isOpen) {
            startMatch();
        }
    }, [isOpen]);

    const toggleHoldPlayerDie = (index: number) => {
        if (gameStage !== 'player_turn' || playerRerollsLeft === 0) return;
        const newHeld = [...playerHeld];
        newHeld[index] = !newHeld[index];
        setPlayerHeld(newHeld);
        playTone('lock');
    };

    // Player executes a reroll
    const handlePlayerReroll = () => {
        if (gameStage !== 'player_turn' || playerRerollsLeft <= 0 || isRolling) return;
        setIsRolling(true);
        playTone('roll');

        setTimeout(() => {
            const newDice = playerDice.map((d, i) => playerHeld[i] ? d : (Math.floor(Math.random() * 6) + 1));
            setPlayerDice(newDice);
            const remaining = playerRerollsLeft - 1;
            setPlayerRerollsLeft(remaining);
            setIsRolling(false);

            const hand = evaluatePokerDice(newDice);
            addLog(`🎲 Ви перекинули нефіксовані кістки. Поточна комбінація: ${hand.nameUA}.`);

            if (remaining === 0) {
                // Out of rerolls, pass to AI
                setGameStage('ai_turn');
            }
        }, 500);
    };

    // Player stands with current hand
    const handlePlayerStand = () => {
        if (gameStage !== 'player_turn') return;
        const hand = evaluatePokerDice(playerDice);
        addLog(`✋ Ви зафіксували комбінацію: ${hand.nameUA}. Черга ${opponent.name}!`);
        setGameStage('ai_turn');
    };

    // AI Turn Strategy Execution
    useEffect(() => {
        if (gameStage !== 'ai_turn') return;

        const aiTimer = setTimeout(() => {
            // Smart AI decision:
            let currentAiDice = [...aiDice];
            let remainingRerolls = aiRerollsLeft;

            const executeAiRerolls = () => {
                if (remainingRerolls <= 0) {
                    // AI finished, go to showdown!
                    finishRound(currentAiDice);
                    return;
                }

                // Analyze AI current hand
                const evalHand = evaluatePokerDice(currentAiDice);
                
                // If AI already has Poker, Full House, or Straight, stand!
                if (evalHand.score >= 5) {
                    addLog(`🤖 ${opponent.name} задоволений своєю комбінацією (${evalHand.nameUA}) і зупиняється!`);
                    finishRound(currentAiDice);
                    return;
                }

                // Determine which dice to hold
                const counts: Record<number, number> = {};
                currentAiDice.forEach(d => { counts[d] = (counts[d] || 0) + 1; });

                const held = currentAiDice.map(d => counts[d] >= 2); // Keep pairs and triples

                // Reroll non-held
                currentAiDice = currentAiDice.map((d, i) => held[i] ? d : (Math.floor(Math.random() * 6) + 1));
                setAiDice(currentAiDice);
                setAiHeld(held);
                remainingRerolls -= 1;
                setAiRerollsLeft(remainingRerolls);
                playTone('roll');

                const newHand = evaluatePokerDice(currentAiDice);
                addLog(`🤖 ${opponent.name} перекинув кістки. Його комбінація: ${newHand.nameUA}.`);

                if (remainingRerolls > 0 && newHand.score < 5) {
                    setTimeout(executeAiRerolls, 800);
                } else {
                    setTimeout(() => finishRound(currentAiDice), 800);
                }
            };

            executeAiRerolls();
        }, 900);

        return () => clearTimeout(aiTimer);
    }, [gameStage]);

    // Finish round & compare hands
    const finishRound = (finalAiDice: number[]) => {
        const pHand = evaluatePokerDice(playerDice);
        const aHand = evaluatePokerDice(finalAiDice);

        const comp = comparePokerHands(pHand, aHand);
        let pScore = playerScoreRounds;
        let aScore = aiScoreRounds;

        if (comp > 0) {
            pScore += 1;
            setPlayerScoreRounds(pScore);
            playTone('round_win');
            addLog(`🎉 Ви виграли раунд #${currentRound}! (${pHand.nameUA} проти ${aHand.nameUA})`);
        } else if (comp < 0) {
            aScore += 1;
            setAiScoreRounds(aScore);
            playTone('round_lose');
            addLog(`💔 ${opponent.name} виграв раунд #${currentRound}! (${aHand.nameUA} проти ${pHand.nameUA})`);
        } else {
            addLog(`🤝 Нічия в раунді #${currentRound}! Обидва зібрали ${pHand.nameUA}.`);
        }

        setGameStage('round_showdown');

        // Check if match won (best of 3: first to 2 wins)
        if (pScore >= 2) {
            setMatchWinner('player');
            setGameStage('match_over');
            playTone('match_win');
            addLog(`🏆 ЧУДОВО! Ви здобули перемогу в матчі з рахунком ${pScore}:${aScore}!`);
        } else if (aScore >= 2) {
            setMatchWinner('ai');
            setGameStage('match_over');
            addLog(`💀 МАТЧ ПРОГРАНО! ${opponent.name} переміг з рахунком ${aScore}:${pScore}.`);
        }
    };

    const handleNextRound = () => {
        const nextR = currentRound + 1;
        setCurrentRound(nextR);
        startRound(nextR);
    };

    const playerHand = evaluatePokerDice(playerDice);
    const aiHand = evaluatePokerDice(aiDice);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="relative w-full max-w-4xl h-[90vh] bg-[#1a140f] border-2 border-amber-600/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
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
                                    Покер на костях (Tavern Dice Poker)
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
                        {/* Match Score */}
                        <div className="px-3 py-1 rounded-full bg-black/50 border border-amber-500/40 text-xs font-black text-amber-300">
                            Рахунок: {playerScoreRounds} — {aiScoreRounds} (до 2 перемог)
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
                            <span>Комбінації</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-[#140e0b] hover:bg-rose-950/60 border border-stone-700 hover:border-rose-500/50 text-stone-300 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Arena */}
                <div className="flex-1 p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2d1b13] via-[#1a110c] to-[#100b08] flex flex-col justify-between overflow-y-auto">
                    {/* Opponent Dice Field (Top) */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-stone-800 backdrop-blur-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="text-xl p-1 rounded-full bg-stone-900 border border-amber-500/30">
                                    {opponent.avatar}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-stone-200">
                                        {opponent.name} <span className="text-[10px] text-stone-400">({opponent.title})</span>
                                    </div>
                                    <div className="text-xs font-black text-amber-300">
                                        Комбінація: {gameStage === 'round_showdown' || gameStage === 'match_over' ? aiHand.nameUA : '🎲 Кинуто...'}
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-stone-400">
                                Перекидань залишилось: <strong className="text-amber-400">{aiRerollsLeft}</strong>
                            </div>
                        </div>

                        {/* Opponent 5 Dice */}
                        <div className="flex justify-center gap-3 sm:gap-4 py-2">
                            {aiDice.map((val, idx) => (
                                <div
                                    key={idx}
                                    className={`relative w-12 sm:w-16 h-12 sm:h-16 rounded-xl bg-gradient-to-br from-[#3b271d] to-[#1c120c] border-2 shadow-xl flex items-center justify-center text-3xl sm:text-4xl font-black text-amber-200 ${
                                        aiHeld[idx] ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-stone-700'
                                    }`}
                                >
                                    <span>{DIE_PULLS[val]}</span>
                                    {aiHeld[idx] && (
                                        <div className="absolute -top-2 px-1 rounded bg-amber-500 text-[8px] font-black text-black">
                                            ФІКС
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle Arena / Showdown Status */}
                    <div className="my-2 p-3 rounded-xl bg-[#20150f] border border-amber-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-amber-400" />
                            <span className="font-bold text-amber-200">
                                Раунд {currentRound} з 3. Рахунок: <strong className="text-yellow-400">{playerScoreRounds} : {aiScoreRounds}</strong>
                            </span>
                        </div>

                        <div className="text-stone-300 italic">
                            {gameStage === 'player_turn' && `Ваш хід: клацніть по кубиках щоб зафіксувати їх (🔒), потім перекиньте або натисніть «Зупинитися».`}
                            {gameStage === 'ai_turn' && `${opponent.name} обдумує комбінацію та кидає кубики...`}
                            {gameStage === 'round_showdown' && `Раунд завершено! Порівняйте комбінації.`}
                        </div>
                    </div>

                    {/* Player Dice Field (Bottom) */}
                    <div className="p-4 rounded-2xl bg-black/50 border-2 border-amber-500/60 backdrop-blur-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                                    Ваші кістки
                                </div>
                                <div className="text-sm font-black text-yellow-300">
                                    {playerHand.nameUA} <span className="text-xs text-stone-400 font-normal">({playerHand.description})</span>
                                </div>
                            </div>

                            <div className="text-xs text-stone-300">
                                Перекидань залишилося: <strong className="text-amber-400">{playerRerollsLeft}</strong>
                            </div>
                        </div>

                        {/* Player 5 Clickable Dice */}
                        <div className="flex justify-center gap-3 sm:gap-5 py-2">
                            {playerDice.map((val, idx) => {
                                const isHeld = playerHeld[idx];
                                return (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ y: -4, scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleHoldPlayerDie(idx)}
                                        disabled={gameStage !== 'player_turn' || playerRerollsLeft === 0}
                                        className={`relative w-14 sm:w-18 h-14 sm:h-18 rounded-2xl bg-[#fdfbf7] text-stone-900 border-2 shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                                            isHeld
                                                ? 'border-amber-500 ring-4 ring-amber-400/60 shadow-amber-500/30'
                                                : 'border-stone-400 hover:border-amber-400'
                                        }`}
                                    >
                                        <span className="text-4xl sm:text-5xl font-black">
                                            {DIE_PULLS[val]}
                                        </span>
                                        {isHeld && (
                                            <div className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-[9px] font-black text-black shadow flex items-center gap-0.5">
                                                <Lock className="w-2.5 h-2.5" />
                                                <span>ТРИМАТИ</span>
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            {gameStage === 'player_turn' && (
                                <>
                                    {playerRerollsLeft > 0 && (
                                        <button
                                            onClick={handlePlayerReroll}
                                            disabled={isRolling}
                                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 font-black text-xs text-black shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
                                        >
                                            <Dices className="w-4 h-4" />
                                            <span>Перекинути нефіксовані ({playerRerollsLeft})</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={handlePlayerStand}
                                        className="px-5 py-2.5 rounded-xl bg-[#2e2118] hover:bg-[#3d2c20] border border-amber-500/50 font-black text-xs text-amber-300 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Зупинитися на цій комбінації</span>
                                    </button>
                                </>
                            )}

                            {gameStage === 'round_showdown' && (
                                <button
                                    onClick={handleNextRound}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
                                >
                                    <span>Наступний раунд ➔</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Match Over Modal */}
                <AnimatePresence>
                    {gameStage === 'match_over' && matchWinner && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md p-6 rounded-2xl bg-[#1a140f] border-2 border-amber-500/80 shadow-2xl text-center space-y-4"
                            >
                                {matchWinner === 'player' ? (
                                    <>
                                        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-bounce">
                                            🎲
                                        </div>
                                        <h2 className="text-2xl font-serif font-black text-amber-300">
                                            ПЕРЕМОГА В ПОКЕРІ НА КОСТЯХ!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            Ви перемогли {opponent.name} з рахунком <strong className="text-yellow-400">{playerScoreRounds}:{aiScoreRounds}</strong>!
                                        </p>
                                        <div className="p-3 rounded-xl bg-[#241a12] border border-amber-500/40 flex items-center justify-around text-xs font-bold text-amber-300">
                                            <div className="flex items-center gap-1.5">
                                                <Coins className="w-4 h-4 text-amber-400" />
                                                <span>+{opponent.rewards.gold} золота</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-emerald-400">
                                                <Sparkles className="w-4 h-4" />
                                                <span>+{(expectedXpReward ?? (opponent.rewards.xp || 110))} XP</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                onVictory();
                                                onClose();
                                            }}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm shadow-lg cursor-pointer"
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
                                            МАТЧ ПРОГРАНО!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            {opponent.name}: «Кістки сьогодні були на моєму боці!»
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={startMatch}
                                                className="flex-1 py-3 rounded-xl bg-[#2e2118] hover:bg-[#3d2c20] border border-amber-500/50 text-amber-300 font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Реванш</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onDefeat();
                                                    onClose();
                                                }}
                                                className="px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-sm cursor-pointer"
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
                                className="w-full max-w-lg p-5 rounded-2xl bg-[#1a140f] border-2 border-amber-500/70 shadow-2xl space-y-3 text-xs text-[#e8dac7]"
                            >
                                <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                                    <h3 className="text-base font-serif font-black text-amber-300 flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4 text-amber-400" />
                                        <span>Ієрархія комбінацій Покеру на костях</span>
                                    </h3>
                                    <button
                                        onClick={() => setShowRules(false)}
                                        className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                                    <div className="p-2 rounded bg-[#251b14] border border-amber-500/30 flex justify-between font-bold">
                                        <span className="text-yellow-400">1. Покер (5 однакових)</span>
                                        <span>⚄ ⚄ ⚄ ⚄ ⚄</span>
                                    </div>
                                    <div className="p-2 rounded bg-[#251b14] border border-stone-800 flex justify-between font-bold">
                                        <span className="text-amber-300">2. Каре (4 однакових)</span>
                                        <span>⚅ ⚅ ⚅ ⚅ ⚁</span>
                                    </div>
                                    <div className="p-2 rounded bg-[#251b14] border border-stone-800 flex justify-between font-bold">
                                        <span className="text-amber-300">3. Фулл-Хаус (3 + 2)</span>
                                        <span>⚃ ⚃ ⚃ ⚂ ⚂</span>
                                    </div>
                                    <div className="p-2 rounded bg-[#251b14] border border-stone-800 flex justify-between font-bold">
                                        <span className="text-amber-200">4. Великий Стріт</span>
                                        <span>⚁ ⚂ ⚃ ⚄ ⚅ (2-3-4-5-6)</span>
                                    </div>
                                    <div className="p-2 rounded bg-[#251b14] border border-stone-800 flex justify-between font-bold">
                                        <span className="text-amber-200">5. Малий Стріт</span>
                                        <span>⚀ ⚁ ⚂ ⚃ ⚄ (1-2-3-4-5)</span>
                                    </div>
                                    <div className="p-2 rounded bg-[#251b14] border border-stone-800 flex justify-between font-bold">
                                        <span>6. Трійка (3 однакових)</span>
                                        <span>⚅ ⚅ ⚅ ⚃ ⚀</span>
                                    </div>
                                    <div className="p-2 rounded bg-[#251b14] border border-stone-800 flex justify-between font-bold">
                                        <span>7. Дві Пари</span>
                                        <span>⚄ ⚄ ⚂ ⚂ ⚀</span>
                                    </div>
                                    <div className="p-2 rounded bg-[#251b14] border border-stone-800 flex justify-between font-bold">
                                        <span>8. Одна Пара</span>
                                        <span>⚃ ⚃ ⚅ ⚂ ⚀</span>
                                    </div>
                                    <div className="p-2 rounded bg-[#251b14] border border-stone-800 flex justify-between font-bold">
                                        <span>9. Старша кістка</span>
                                        <span>⚅ ⚄ ⚂ ⚁ ⚀</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowRules(false)}
                                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer shadow"
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

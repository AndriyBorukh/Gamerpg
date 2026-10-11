import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    Swords, 
    RotateCcw, 
    ShieldAlert, 
    CheckCircle2, 
    Coins, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    ArrowUp
} from 'lucide-react';

export type CardSuit = 
    | 'spades' 
    | 'hearts' 
    | 'diamonds' 
    | 'clubs' 
    | 'stars' 
    | 'moons'
    | 'joker'
    | 'wands'
    | 'swords_tarot'
    | 'cups'
    | 'pentacles'
    | 'tarot_major';

export interface ClassicCard {
    id: string;
    suit: CardSuit;
    rank: number; // 2..14 (11=J, 12=Q, 13=K, 14=A), or Tarot / Joker ranks
    label: string;
    symbol: string;
    color: 'red' | 'black' | 'gold' | 'cyan';
}

export type DurakGameMode = 
    | '36' 
    | '52' 
    | '54'
    | '56'
    | 'minor_tarot'
    | 'tarot'
    | 'durak_52_2trumps' 
    | 'durak_52_2trumps_plus1trump' 
    | 'durak_52_2trumps_plus2trumps' 
    | 'durak_52_2trumps_plus2suits' 
    | 'durak_52_2trumps_plus1suit'
    | '52_2trumps' 
    | '52_3trumps' 
    | '52_4trumps' 
    | '104_2trumps';

interface ClassicDurakModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    mode: DurakGameMode;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

interface TablePair {
    id: string;
    attack: ClassicCard;
    defense?: ClassicCard;
}

export const SUIT_SYMBOLS: Record<CardSuit, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    stars: '⭐',
    moons: '🌙',
    joker: '🃏',
    wands: '🥖',
    swords_tarot: '⚔️',
    cups: '🍷',
    pentacles: '🪙',
    tarot_major: '🎴'
};

export const SUIT_NAMES_UA: Record<CardSuit, string> = {
    spades: 'Піка (Вино)',
    hearts: 'Чирва',
    diamonds: 'Бубна (Дзвінка)',
    clubs: 'Трефа (Хрест)',
    stars: 'Зірка',
    moons: 'Місяць',
    joker: 'Джокер',
    wands: 'Жезли (Палиці)',
    swords_tarot: 'Мечі',
    cups: 'Кубки (Чаші)',
    pentacles: 'Пентаклі (Монети)',
    tarot_major: 'Старші Аркани Таро'
};

const MAJOR_ARCANA_NAMES: string[] = [
    '0. Дурень',
    'I. Маг',
    'II. Жриця',
    'III. Імператриця',
    'IV. Імператор',
    'V. Ієрофант',
    'VI. Закохані',
    'VII. Колісниця',
    'VIII. Сила',
    'IX. Отшельник',
    'X. Колесо Долі',
    'XI. Справедливість',
    'XII. Повішений',
    'XIII. Смерть',
    'XIV. Помірність',
    'XV. Диявол',
    'XVI. Вежа',
    'XVII. Зірка',
    'XVIII. Місяць',
    'XIX. Сонце',
    'XX. Страшний Суд',
    'XXI. Світ'
];

function getRankLabel(rank: number, suit?: CardSuit): string {
    if (suit === 'joker') return 'JK';
    if (suit === 'tarot_major') {
        const roman = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
        return roman[rank - 1] || rank.toString();
    }
    if (suit === 'wands' || suit === 'swords_tarot' || suit === 'cups' || suit === 'pentacles') {
        if (rank === 1) return 'A';
        if (rank <= 10) return rank.toString();
        if (rank === 11) return 'P';
        if (rank === 12) return 'Kn';
        if (rank === 13) return 'Q';
        if (rank === 14) return 'K';
    }
    if (rank <= 10) return rank.toString();
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    if (rank === 14) return 'A';
    return rank.toString();
}

function getRankNameUA(rank: number, suit?: CardSuit): string {
    if (suit === 'joker') return 'Джокер';
    if (suit === 'tarot_major') {
        return MAJOR_ARCANA_NAMES[rank - 1] || `Старший Аркан ${rank}`;
    }
    if (suit === 'wands' || suit === 'swords_tarot' || suit === 'cups' || suit === 'pentacles') {
        if (rank === 1) return 'Туз Таро';
        if (rank <= 10) return `${rank} Таро`;
        if (rank === 11) return 'Паж (Паж)';
        if (rank === 12) return 'Лицар (Рейтар)';
        if (rank === 13) return 'Королева (Дама)';
        if (rank === 14) return 'Король (Король)';
    }
    if (rank <= 10) return rank.toString();
    if (rank === 11) return 'Валет';
    if (rank === 12) return 'Дама';
    if (rank === 13) return 'Король';
    if (rank === 14) return 'Туз';
    return rank.toString();
}

function getCardTextColor(color: 'red' | 'black' | 'gold' | 'cyan'): string {
    switch (color) {
        case 'red': return 'text-rose-600';
        case 'gold': return 'text-amber-500';
        case 'cyan': return 'text-cyan-600';
        case 'black':
        default:
            return 'text-stone-900';
    }
}

export function getModeTitle(m: DurakGameMode): string {
    switch (m) {
        case '36': return 'Класичний Дурень (36 карт)';
        case '52': return 'Великий Дурень (52 карти)';
        case '54': return 'Дурень на 54 карти (з 2 Джокерами)';
        case '56': return 'Розширена колода на 56 карт (з 4 Джокерами)';
        case 'minor_tarot': return 'Дурень на 56 Молодших арканів Таро';
        case 'tarot': return 'Дурень на повну колоду Таро (78 карт)';
        case 'durak_52_2trumps':
        case '52_2trumps':
            return 'Дурень 52 (2 козирі)';
        case 'durak_52_2trumps_plus1trump':
        case '52_3trumps':
            return 'Дурень 52 (2 козирі + 1 априорно козирна масть ⭐ Зірки, 65 карт)';
        case 'durak_52_2trumps_plus2trumps':
        case '52_4trumps':
            return 'Дурень 52 (2 козирі + 2 априорно козирні масті ⭐ Зірки та 🌙 Місяці, 78 карт)';
        case 'durak_52_2trumps_plus2suits':
            return 'Дурень 52 (+2 масті: 6 мастей, 78 карт, 2 козирі)';
        case 'durak_52_2trumps_plus1suit':
            return 'Дурень 52 (+1 додаткова масть: 5 мастей, 65 карт, 2 козирі)';
        case '104_2trumps':
            return 'Дурень на 2 колоди (104 карти, 2 козирі)';
        default:
            return 'Дурень';
    }
}

function createDeck(mode: DurakGameMode): ClassicCard[] {
    const deck: ClassicCard[] = [];

    if (mode === 'minor_tarot' || mode === 'tarot') {
        const minorSuits: CardSuit[] = ['wands', 'swords_tarot', 'cups', 'pentacles'];
        for (const suit of minorSuits) {
            let color: 'red' | 'black' | 'gold' | 'cyan' = 'black';
            if (suit === 'cups' || suit === 'wands') color = 'red';
            else if (suit === 'pentacles') color = 'gold';

            for (let rank = 1; rank <= 14; rank++) {
                deck.push({
                    id: `${suit}_${rank}_${Math.random().toString(36).substring(2, 9)}`,
                    suit,
                    rank,
                    label: getRankLabel(rank, suit),
                    symbol: SUIT_SYMBOLS[suit],
                    color
                });
            }
        }

        if (mode === 'tarot') {
            for (let rank = 1; rank <= 22; rank++) {
                deck.push({
                    id: `tarot_major_${rank}_${Math.random().toString(36).substring(2, 9)}`,
                    suit: 'tarot_major',
                    rank,
                    label: getRankLabel(rank, 'tarot_major'),
                    symbol: SUIT_SYMBOLS['tarot_major'],
                    color: 'gold'
                });
            }
        }
    } else {
        let suits: CardSuit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
        if (mode === 'durak_52_2trumps_plus1suit' || mode === 'durak_52_2trumps_plus1trump' || mode === '52_3trumps') {
            suits = ['spades', 'hearts', 'diamonds', 'clubs', 'stars'];
        } else if (mode === 'durak_52_2trumps_plus2suits' || mode === 'durak_52_2trumps_plus2trumps' || mode === '52_4trumps') {
            suits = ['spades', 'hearts', 'diamonds', 'clubs', 'stars', 'moons'];
        }

        const minRank = mode === '36' ? 6 : 2;
        const decksCount = mode === '104_2trumps' ? 2 : 1;

        for (let d = 0; d < decksCount; d++) {
            for (const suit of suits) {
                let color: 'red' | 'black' | 'gold' | 'cyan' = 'black';
                if (suit === 'hearts' || suit === 'diamonds') color = 'red';
                else if (suit === 'stars') color = 'gold';
                else if (suit === 'moons') color = 'cyan';

                for (let rank = minRank; rank <= 14; rank++) {
                    deck.push({
                        id: `${suit}_${rank}_${d}_${Math.random().toString(36).substring(2, 9)}`,
                        suit,
                        rank,
                        label: getRankLabel(rank),
                        symbol: SUIT_SYMBOLS[suit],
                        color
                    });
                }
            }
        }

        if (mode === '54' || mode === '56') {
            deck.push({
                id: `joker_black_${Math.random().toString(36).substring(2, 9)}`,
                suit: 'joker',
                rank: 15,
                label: 'JK',
                symbol: SUIT_SYMBOLS['joker'],
                color: 'black'
            });
            deck.push({
                id: `joker_red_${Math.random().toString(36).substring(2, 9)}`,
                suit: 'joker',
                rank: 16,
                label: 'JK',
                symbol: SUIT_SYMBOLS['joker'],
                color: 'red'
            });
            if (mode === '56') {
                deck.push({
                    id: `joker_gold_${Math.random().toString(36).substring(2, 9)}`,
                    suit: 'joker',
                    rank: 17,
                    label: 'JK',
                    symbol: SUIT_SYMBOLS['joker'],
                    color: 'gold'
                });
                deck.push({
                    id: `joker_cyan_${Math.random().toString(36).substring(2, 9)}`,
                    suit: 'joker',
                    rank: 18,
                    label: 'JK',
                    symbol: SUIT_SYMBOLS['joker'],
                    color: 'cyan'
                });
            }
        }
    }

    // Shuffle using Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

export function getTrumpSuits(m: DurakGameMode, mainTrumpSuit: CardSuit): CardSuit[] {
    const standardSuits: CardSuit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    let availableSuits: CardSuit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    if (m === 'durak_52_2trumps_plus1suit') {
        availableSuits = ['spades', 'hearts', 'diamonds', 'clubs', 'stars'];
    } else if (m === 'durak_52_2trumps_plus2suits' || m === 'durak_52_2trumps_plus2trumps' || m === '52_4trumps') {
        availableSuits = ['spades', 'hearts', 'diamonds', 'clubs', 'stars', 'moons'];
    }

    if (m === 'durak_52_2trumps_plus2trumps' || m === '52_4trumps') {
        let baseSuit = mainTrumpSuit;
        if (!standardSuits.includes(baseSuit)) {
            baseSuit = 'spades';
        }
        const idx = standardSuits.indexOf(baseSuit);
        const safeIdx = idx >= 0 ? idx : 0;
        const trump1 = standardSuits[safeIdx];
        const trump2 = standardSuits[(safeIdx + 1) % standardSuits.length];
        return [trump1, trump2, 'stars', 'moons'];
    }

    if (m === 'durak_52_2trumps_plus1trump' || m === '52_3trumps') {
        let baseSuit = mainTrumpSuit;
        if (!standardSuits.includes(baseSuit)) {
            baseSuit = 'spades';
        }
        const idx = standardSuits.indexOf(baseSuit);
        const safeIdx = idx >= 0 ? idx : 0;
        const trump1 = standardSuits[safeIdx];
        const trump2 = standardSuits[(safeIdx + 1) % standardSuits.length];
        return [trump1, trump2, 'stars'];
    }

    const idx = availableSuits.indexOf(mainTrumpSuit);
    const safeIdx = idx >= 0 ? idx : 0;

    if (
        m === 'durak_52_2trumps' || 
        m === '52_2trumps' || 
        m === '104_2trumps' || 
        m === 'durak_52_2trumps_plus1suit' || 
        m === 'durak_52_2trumps_plus2suits'
    ) {
        return [
            mainTrumpSuit,
            availableSuits[(safeIdx + 1) % availableSuits.length]
        ];
    }

    return [mainTrumpSuit];
}

export default function ClassicDurakModal({
    expectedXpReward,
    isOpen,
    mode,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: ClassicDurakModalProps) {
    const [deck, setDeck] = useState<ClassicCard[]>([]);
    const [trumpCard, setTrumpCard] = useState<ClassicCard | null>(null);
    const [playerHand, setPlayerHand] = useState<ClassicCard[]>([]);
    const [aiHand, setAiHand] = useState<ClassicCard[]>([]);
    const [tablePairs, setTablePairs] = useState<TablePair[]>([]);
    const [discardCount, setDiscardCount] = useState<number>(0);

    const [isPlayerAttacker, setIsPlayerAttacker] = useState<boolean>(true);
    const [turnPhase, setTurnPhase] = useState<'attacking' | 'defending' | 'ai_thinking' | 'ai_taking' | 'game_over'>('attacking');
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | 'draw' | null>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    
    // Explicit selection state for intuitive touch & desktop controls
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [selectedTargetPairId, setSelectedTargetPairId] = useState<string | null>(null);
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);

    const activeTrumpSuits = useMemo(() => {
        if (!trumpCard) return [];
        return getTrumpSuits(mode, trumpCard.suit);
    }, [mode, trumpCard]);

    // Audio synthesizer for classic tactile sounds
    const playTone = (type: 'deal' | 'place' | 'beat' | 'take' | 'win' | 'lose') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'deal') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'place') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.09);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.09);
                osc.start();
                osc.stop(ctx.currentTime + 0.09);
            } else if (type === 'beat') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.setValueAtTime(600, ctx.currentTime + 0.06);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
            } else if (type === 'take') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.14, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'win') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
                osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.start();
                osc.stop(ctx.currentTime + 0.5);
            } else if (type === 'lose') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(350, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.35);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
            }
        } catch {
            // Ignore audio context failures
        }
    };

    const addLog = (msg: string) => {
        setLogMessages(prev => [msg, ...prev.slice(0, 30)]);
    };

    const isTrump = (suit: CardSuit, trumpSuits: CardSuit[]) => trumpSuits.includes(suit);

    // Helper: Checks if cardB beats cardA
    const canBeat = (attackCard: ClassicCard, defenseCard: ClassicCard, trumpSuits: CardSuit[]): boolean => {
        // Joker rules: higher Joker beats lower Joker, Joker beats standard cards
        if (defenseCard.suit === 'joker') {
            if (attackCard.suit === 'joker') {
                return defenseCard.rank > attackCard.rank;
            }
            return true;
        }
        if (attackCard.suit === 'joker') {
            return false;
        }

        // Major Arcana rules: higher Major Arcana beats lower Major Arcana, Major Arcana beats Minor Arcana
        if (defenseCard.suit === 'tarot_major') {
            if (attackCard.suit === 'tarot_major') {
                return defenseCard.rank > attackCard.rank;
            }
            return true;
        }
        if (attackCard.suit === 'tarot_major') {
            return false;
        }

        const attackIsTrump = isTrump(attackCard.suit, trumpSuits);
        const defenseIsTrump = isTrump(defenseCard.suit, trumpSuits);

        // Same suit: higher rank always beats lower rank
        if (defenseCard.suit === attackCard.suit) {
            return defenseCard.rank > attackCard.rank;
        }

        // Trump beats non-trump
        if (defenseIsTrump && !attackIsTrump) {
            return true;
        }

        // When both are trumps of different suits: primary trump beats secondary trumps
        if (defenseIsTrump && attackIsTrump) {
            const defIdx = trumpSuits.indexOf(defenseCard.suit);
            const attIdx = trumpSuits.indexOf(attackCard.suit);
            if (defIdx < attIdx) {
                return true;
            }
        }

        return false;
    };

    // Check if card can be tossed during attacking
    const canTossCard = (card: ClassicCard): boolean => {
        if (tablePairs.length === 0) return true;
        const tableRanks = new Set<number>();
        tablePairs.forEach(p => {
            tableRanks.add(p.attack.rank);
            if (p.defense) tableRanks.add(p.defense.rank);
        });
        return tableRanks.has(card.rank);
    };

    // Helper to sort hand cards cleanly
    const sortCards = (cards: ClassicCard[], trumpSuits: CardSuit[]) => {
        return [...cards].sort((a, b) => {
            const aIsTrump = isTrump(a.suit, trumpSuits);
            const bIsTrump = isTrump(b.suit, trumpSuits);
            if (aIsTrump && !bIsTrump) return 1;
            if (!aIsTrump && bIsTrump) return -1;
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return a.rank - b.rank;
        });
    };

    // Initialize Game
    const startNewGame = () => {
        const newDeck = createDeck(mode);
        const pHand = newDeck.splice(0, 6);
        const aHand = newDeck.splice(0, 6);
        // Trump card is revealed from bottom of deck
        const trump = newDeck[newDeck.length - 1];
        const trumpSuits = getTrumpSuits(mode, trump.suit);

        // Determine who goes first: player with lowest trump
        let playerLowestTrump = 99;
        let aiLowestTrump = 99;
        pHand.forEach(c => {
            if (isTrump(c.suit, trumpSuits) && c.rank < playerLowestTrump) playerLowestTrump = c.rank;
        });
        aHand.forEach(c => {
            if (isTrump(c.suit, trumpSuits) && c.rank < aiLowestTrump) aiLowestTrump = c.rank;
        });

        let playerStarts = true;
        if (playerLowestTrump < aiLowestTrump) {
            playerStarts = true;
        } else if (aiLowestTrump < playerLowestTrump) {
            playerStarts = false;
        } else {
            playerStarts = Math.random() > 0.5;
        }

        setDeck(newDeck);
        setTrumpCard(trump);
        setPlayerHand(sortCards(pHand, trumpSuits));
        setAiHand(sortCards(aHand, trumpSuits));
        setTablePairs([]);
        setDiscardCount(0);
        setIsPlayerAttacker(playerStarts);
        setTurnPhase(playerStarts ? 'attacking' : 'ai_thinking');
        setGameResult(null);
        setSelectedCardId(null);
        setSelectedTargetPairId(null);
        setActionFeedback(null);
        
        const trumpSymbolsText = trumpSuits.map(s => `${SUIT_SYMBOLS[s]} ${SUIT_NAMES_UA[s]}`).join(', ');
        setLogMessages([
            `🃏 Нова партія! Режим: ${getModeTitle(mode)}. Козирі (${trumpSuits.length}): ${trumpSymbolsText}.`,
            playerStarts 
                ? '⚔️ Ваш перший хід! Оберіть карту з руки для початку атаки.' 
                : `⚔️ Перший хід робить ${opponent.name}!`
        ]);
        playTone('deal');
    };

    useEffect(() => {
        if (isOpen) {
            startNewGame();
        }
    }, [isOpen, mode]);

    // Replenish hands from deck up to 6 cards
    const replenishHands = (
        currentDeck: ClassicCard[],
        pHand: ClassicCard[],
        aHand: ClassicCard[],
        attackerIsPlayer: boolean,
        trumpSuits: CardSuit[]
    ) => {
        const remainingDeck = [...currentDeck];
        const newPHand = [...pHand];
        const newAHand = [...aHand];

        if (attackerIsPlayer) {
            while (newPHand.length < 6 && remainingDeck.length > 0) {
                newPHand.push(remainingDeck.shift()!);
            }
            while (newAHand.length < 6 && remainingDeck.length > 0) {
                newAHand.push(remainingDeck.shift()!);
            }
        } else {
            while (newAHand.length < 6 && remainingDeck.length > 0) {
                newAHand.push(remainingDeck.shift()!);
            }
            while (newPHand.length < 6 && remainingDeck.length > 0) {
                newPHand.push(remainingDeck.shift()!);
            }
        }

        return {
            remainingDeck,
            newPHand: sortCards(newPHand, trumpSuits),
            newAHand: sortCards(newAHand, trumpSuits)
        };
    };

    // Check Win/Loss conditions
    const checkGameOver = (currentDeck: ClassicCard[], pHand: ClassicCard[], aHand: ClassicCard[]) => {
        if (currentDeck.length === 0) {
            if (pHand.length === 0 && aHand.length === 0) {
                setGameResult('draw');
                setTurnPhase('game_over');
                addLog('🤝 Нічия! Обидва дуелянти одночасно позбулися карт.');
                return true;
            } else if (pHand.length === 0) {
                setGameResult('victory');
                setTurnPhase('game_over');
                playTone('win');
                addLog(`👑 ПЕРЕМОГА! Ви скинули всі карти. ${opponent.name} залишився в дурнях!`);
                return true;
            } else if (aHand.length === 0) {
                setGameResult('defeat');
                setTurnPhase('game_over');
                playTone('lose');
                addLog(`💀 ПОРАЗКА! ${opponent.name} скинув усі карти. Ви залишилися в дурнях!`);
                return true;
            }
        }
        return false;
    };

    // AI Turn Controller
    useEffect(() => {
        if (turnPhase !== 'ai_thinking' || gameResult !== null || !trumpCard) return;

        const timer = setTimeout(() => {
            if (isPlayerAttacker) {
                // AI is DEFENDING against player's attack
                const unbeatenPair = tablePairs.find(p => !p.defense);
                if (!unbeatenPair) return;

                // Find valid defensive cards in AI hand
                const validDefenseCards = aiHand
                    .filter(c => canBeat(unbeatenPair.attack, c, activeTrumpSuits))
                    .sort((a, b) => {
                        const aIsTrump = isTrump(a.suit, activeTrumpSuits);
                        const bIsTrump = isTrump(b.suit, activeTrumpSuits);
                        if (!aIsTrump && bIsTrump) return -1;
                        if (aIsTrump && !bIsTrump) return 1;
                        return a.rank - b.rank;
                    });

                if (validDefenseCards.length > 0) {
                    // AI beats with lowest valid card
                    const bestCard = validDefenseCards[0];
                    const newAiHand = aiHand.filter(c => c.id !== bestCard.id);
                    const newPairs = tablePairs.map(p => 
                        p.id === unbeatenPair.id ? { ...p, defense: bestCard } : p
                    );
                    setAiHand(newAiHand);
                    setTablePairs(newPairs);
                    playTone('beat');
                    addLog(`🛡️ ${opponent.name} побив ${unbeatenPair.attack.symbol}${unbeatenPair.attack.label} картою ${bestCard.symbol}${bestCard.label}.`);

                    // Check if player wants to toss more or finalize
                    setTurnPhase('attacking');
                } else {
                    // AI cannot beat -> AI takes cards
                    playTone('take');
                    addLog(`📥 ${opponent.name}: «Не маю чим kritи... Беру карти!»`);
                    setTurnPhase('ai_taking');
                }
            } else {
                // AI is ATTACKING player
                if (tablePairs.length === 0) {
                    // First attack: pick lowest non-trump card, or lowest trump
                    const sorted = [...aiHand].sort((a, b) => {
                        const aIsTrump = isTrump(a.suit, activeTrumpSuits);
                        const bIsTrump = isTrump(b.suit, activeTrumpSuits);
                        if (!aIsTrump && bIsTrump) return -1;
                        if (aIsTrump && !bIsTrump) return 1;
                        return a.rank - b.rank;
                    });

                    const attackCard = sorted[0];
                    const newAiHand = aiHand.filter(c => c.id !== attackCard.id);
                    setAiHand(newAiHand);
                    setTablePairs([{ id: Math.random().toString(), attack: attackCard }]);
                    playTone('place');
                    addLog(`⚔️ ${opponent.name} атакує: ${attackCard.symbol} ${attackCard.label} (${getRankNameUA(attackCard.rank)})!`);
                    setTurnPhase('defending');
                } else {
                    // Follow-up attack: Check if there's any unbeaten card on table
                    const unbeaten = tablePairs.some(p => !p.defense);
                    if (unbeaten) {
                        setTurnPhase('defending');
                        return;
                    }

                    // Check if AI can toss matching ranks
                    const maxAllowedAttack = Math.min(6, playerHand.length + tablePairs.length);
                    if (tablePairs.length < maxAllowedAttack && aiHand.length > 0) {
                        const tableRanks = new Set<number>();
                        tablePairs.forEach(p => {
                            tableRanks.add(p.attack.rank);
                            if (p.defense) tableRanks.add(p.defense.rank);
                        });

                        const matchingCards = aiHand
                            .filter(c => tableRanks.has(c.rank))
                            .sort((a, b) => {
                                const aIsTrump = isTrump(a.suit, activeTrumpSuits);
                                const bIsTrump = isTrump(b.suit, activeTrumpSuits);
                                if (!aIsTrump && bIsTrump) return -1;
                                if (aIsTrump && !bIsTrump) return 1;
                                return a.rank - b.rank;
                            });

                        // Avoid throwing high trump cards pointlessly
                        const sensibleCard = matchingCards.find(c => !(isTrump(c.suit, activeTrumpSuits) && c.rank >= 12));

                        if (sensibleCard) {
                            const newAiHand = aiHand.filter(c => c.id !== sensibleCard.id);
                            setAiHand(newAiHand);
                            setTablePairs([...tablePairs, { id: Math.random().toString(), attack: sensibleCard }]);
                            playTone('place');
                            addLog(`⚔️ ${opponent.name} підкидає: ${sensibleCard.symbol} ${sensibleCard.label}!`);
                            setTurnPhase('defending');
                            return;
                        }
                    }

                    // AI has nothing sensible to toss -> БИТО!
                    addLog(`🧹 ${opponent.name}: «Бито! Відбій.»`);
                    playTone('place');
                    const discardedCount = tablePairs.reduce((acc, p) => acc + (p.defense ? 2 : 1), 0);
                    setDiscardCount(prev => prev + discardedCount);
                    setTablePairs([]);

                    const { remainingDeck, newPHand, newAHand } = replenishHands(
                        deck,
                        playerHand,
                        aiHand,
                        isPlayerAttacker,
                        activeTrumpSuits
                    );

                    setDeck(remainingDeck);
                    setPlayerHand(newPHand);
                    setAiHand(newAHand);

                    if (checkGameOver(remainingDeck, newPHand, newAHand)) return;

                    // Defender (player) becomes new attacker!
                    setIsPlayerAttacker(true);
                    setTurnPhase('attacking');
                    setSelectedCardId(null);
                    addLog('⚔️ Ваш хід! Атакуйте будь-якою картою.');
                }
            }
        }, 850);

        return () => clearTimeout(timer);
    }, [turnPhase, tablePairs, isPlayerAttacker, aiHand, playerHand, deck, trumpCard, gameResult, activeTrumpSuits, mode]);

    // Validation map for currently playable cards in player hand
    const playableCardsMap = useMemo(() => {
        const map = new Map<string, { canPlay: boolean; reason?: string; targetPairId?: string }>();
        if (!trumpCard || gameResult !== null) return map;

        playerHand.forEach(card => {
            if (isPlayerAttacker) {
                if (turnPhase !== 'attacking' && turnPhase !== 'ai_taking') {
                    map.set(card.id, { canPlay: false, reason: 'Зачекайте ходу суперника' });
                    return;
                }
                if (tablePairs.length >= 6) {
                    map.set(card.id, { canPlay: false, reason: 'Максимум 6 карт на столі' });
                    return;
                }
                const undefendedCount = tablePairs.filter(p => !p.defense).length;
                if (undefendedCount >= aiHand.length) {
                    map.set(card.id, { canPlay: false, reason: 'У суперника недостатньо карт у руці' });
                    return;
                }
                if (!canTossCard(card)) {
                    map.set(card.id, { canPlay: false, reason: 'Можна підкидати тільки карти номіналів, що є на столі' });
                    return;
                }
                map.set(card.id, { canPlay: true });
            } else {
                // Defending
                if (turnPhase !== 'defending') {
                    map.set(card.id, { canPlay: false, reason: 'Зачекайте атаки суперника' });
                    return;
                }
                // Check if this card can beat ANY unbeaten attack pair on table
                const beatablePairs = tablePairs.filter(p => !p.defense && canBeat(p.attack, card, activeTrumpSuits));
                if (beatablePairs.length === 0) {
                    map.set(card.id, { canPlay: false, reason: 'Не б\'є жодну карту на столі' });
                } else {
                    map.set(card.id, { canPlay: true, targetPairId: beatablePairs[0].id });
                }
            }
        });

        return map;
    }, [playerHand, isPlayerAttacker, turnPhase, tablePairs, trumpCard, gameResult, activeTrumpSuits, aiHand]);

    // Execute play with a specific card
    const executePlayCard = (card: ClassicCard, explicitTargetPairId?: string) => {
        if (gameResult !== null || !trumpCard) return;

        if (isPlayerAttacker) {
            // Attacking / Tossing
            if (turnPhase !== 'attacking' && turnPhase !== 'ai_taking') {
                setActionFeedback('Зачекайте відповіді суперника!');
                return;
            }
            if (tablePairs.length >= 6) {
                setActionFeedback('Максимум 6 карт у колі!');
                return;
            }
            const undefendedCount = tablePairs.filter(p => !p.defense).length;
            if (undefendedCount >= aiHand.length) {
                setActionFeedback('У суперника недостатньо карт у руці для захисту!');
                return;
            }
            if (!canTossCard(card)) {
                setActionFeedback(`Номінал ${card.label} відсутній на столі для підкидання!`);
                return;
            }

            const newHand = playerHand.filter(c => c.id !== card.id);
            setPlayerHand(newHand);
            setTablePairs([...tablePairs, { id: Math.random().toString(), attack: card }]);
            playTone('place');
            addLog(`⚔️ Ви зіграли: ${card.symbol} ${card.label} (${getRankNameUA(card.rank)}).`);
            setSelectedCardId(null);
            setActionFeedback(null);

            if (turnPhase !== 'ai_taking') {
                setTurnPhase('ai_thinking');
            }
        } else {
            // Defending
            if (turnPhase !== 'defending') {
                setActionFeedback('Зараз не ваша черга захищатися!');
                return;
            }

            // Strictly find target pair that this card CAN BEAT according to Durak rules!
            let targetPair: TablePair | null = null;

            // 1. If explicit target pair is provided, check if card legally beats that specific pair
            if (explicitTargetPairId) {
                const candidate = tablePairs.find(p => p.id === explicitTargetPairId && !p.defense);
                if (candidate && canBeat(candidate.attack, card, activeTrumpSuits)) {
                    targetPair = candidate;
                }
            }

            // 2. If not matched, find ANY open pair on table that this card can legally beat
            if (!targetPair) {
                targetPair = tablePairs.find(p => !p.defense && canBeat(p.attack, card, activeTrumpSuits)) || null;
            }

            // 3. If no matching card can be beaten, strictly reject with explanatory message
            if (!targetPair) {
                const openPairs = tablePairs.filter(p => !p.defense);
                if (openPairs.length === 0) {
                    setActionFeedback('Всі карти на столі вже побиті!');
                } else {
                    const firstAtt = openPairs[0].attack;
                    const cardIsTrump = isTrump(card.suit, activeTrumpSuits);
                    const attIsTrump = isTrump(firstAtt.suit, activeTrumpSuits);

                    if (card.suit === firstAtt.suit) {
                        setActionFeedback(`Карта ${card.symbol}${card.label} (${card.rank}) слабша за ${firstAtt.symbol}${firstAtt.label} (${firstAtt.rank}) тієї ж масті!`);
                    } else if (!cardIsTrump && attIsTrump) {
                        setActionFeedback(`Козирну карту ${firstAtt.symbol}${firstAtt.label} можна побити лише старшим козирем!`);
                    } else if (!cardIsTrump && !attIsTrump) {
                        setActionFeedback(`Масті не збігаються (${card.symbol} ≠ ${firstAtt.symbol}) і ${card.symbol}${card.label} не є козирем!`);
                    } else {
                        setActionFeedback(`Карта ${card.symbol}${card.label} не може побити ${firstAtt.symbol}${firstAtt.label} за правилами!`);
                    }
                }
                return;
            }

            const newHand = playerHand.filter(c => c.id !== card.id);
            const newPairs = tablePairs.map(p => 
                p.id === targetPair!.id ? { ...p, defense: card } : p
            );

            setPlayerHand(newHand);
            setTablePairs(newPairs);
            playTone('beat');
            addLog(`🛡️ Ви побили ${targetPair.attack.symbol}${targetPair.attack.label} картою ${card.symbol}${card.label}!`);
            setSelectedCardId(null);
            setSelectedTargetPairId(null);
            setActionFeedback(null);

            // Check if there are still unbeaten attack cards
            const stillUnbeaten = newPairs.some(p => !p.defense);
            if (!stillUnbeaten) {
                setTurnPhase('ai_thinking');
            }
        }
    };

    // User taps on card in hand
    const handleCardClick = (card: ClassicCard) => {
        if (gameResult !== null) return;

        const playableInfo = playableCardsMap.get(card.id);

        if (selectedCardId === card.id) {
            // Double click / second tap triggers play if valid
            if (playableInfo?.canPlay) {
                executePlayCard(card, selectedTargetPairId || playableInfo.targetPairId);
            } else {
                setActionFeedback(playableInfo?.reason || 'Цю карту зараз не можна зіграти за правилами');
            }
        } else {
            // First tap selects card
            setSelectedCardId(card.id);
            if (playableInfo?.canPlay) {
                setActionFeedback(null);
                if (!isPlayerAttacker && playableInfo.targetPairId) {
                    setSelectedTargetPairId(playableInfo.targetPairId);
                } else {
                    setSelectedTargetPairId(null);
                }
            } else {
                setSelectedTargetPairId(null);
                setActionFeedback(playableInfo?.reason || 'Ця карта не б\'є жодну карту на столі');
            }
        }
    };

    // Player action: БИТО (Fold to discard)
    const handlePlayerBito = () => {
        if (!isPlayerAttacker || turnPhase !== 'attacking' || tablePairs.length === 0 || !trumpCard) return;

        const unbeaten = tablePairs.some(p => !p.defense);
        if (unbeaten) {
            setActionFeedback('Не всі карти побито суперником!');
            return;
        }

        playTone('place');
        addLog('🧹 БИТО! Всі карти йдуть у відбій.');
        const discardedCount = tablePairs.reduce((acc, p) => acc + (p.defense ? 2 : 1), 0);
        setDiscardCount(prev => prev + discardedCount);
        setTablePairs([]);
        setSelectedCardId(null);
        setActionFeedback(null);

        const { remainingDeck, newPHand, newAHand } = replenishHands(
            deck,
            playerHand,
            aiHand,
            isPlayerAttacker,
            activeTrumpSuits
        );

        setDeck(remainingDeck);
        setPlayerHand(newPHand);
        setAiHand(newAHand);

        if (checkGameOver(remainingDeck, newPHand, newAHand)) return;

        // Defender (AI) becomes new attacker
        setIsPlayerAttacker(false);
        setTurnPhase('ai_thinking');
        addLog(`⚔️ Хід переходить до ${opponent.name}.`);
    };

    // Player action: ВЗЯТИ (Take all table cards)
    const handlePlayerTake = () => {
        if (isPlayerAttacker || turnPhase !== 'defending' || tablePairs.length === 0 || !trumpCard) return;

        playTone('take');
        addLog('📥 Ви берете всі карти зі столу.');

        const allTableCards: ClassicCard[] = [];
        tablePairs.forEach(p => {
            allTableCards.push(p.attack);
            if (p.defense) allTableCards.push(p.defense);
        });

        const updatedPlayerHand = sortCards([...playerHand, ...allTableCards], activeTrumpSuits);

        // Attacker (AI) replenishes to 6
        const remainingDeck = [...deck];
        const newAHand = [...aiHand];
        while (newAHand.length < 6 && remainingDeck.length > 0) {
            newAHand.push(remainingDeck.shift()!);
        }

        setDeck(remainingDeck);
        setPlayerHand(updatedPlayerHand);
        setAiHand(sortCards(newAHand, activeTrumpSuits));
        setTablePairs([]);
        setSelectedCardId(null);
        setActionFeedback(null);

        if (checkGameOver(remainingDeck, updatedPlayerHand, newAHand)) return;

        // AI attacks again
        setIsPlayerAttacker(false);
        setTurnPhase('ai_thinking');
        addLog(`⚔️ Оскільки ви взяли карти, ${opponent.name} знову атакує!`);
    };

    // Complete AI taking cards (when player has finished tossing)
    const handleFinalizeAiTaking = () => {
        if (!isPlayerAttacker || turnPhase !== 'ai_taking' || !trumpCard) return;

        playTone('take');
        const allTableCards: ClassicCard[] = [];
        tablePairs.forEach(p => {
            allTableCards.push(p.attack);
            if (p.defense) allTableCards.push(p.defense);
        });

        const updatedAiHand = sortCards([...aiHand, ...allTableCards], activeTrumpSuits);

        // Attacker (Player) replenishes to 6
        const remainingDeck = [...deck];
        const newPHand = [...playerHand];
        while (newPHand.length < 6 && remainingDeck.length > 0) {
            newPHand.push(remainingDeck.shift()!);
        }

        setDeck(remainingDeck);
        setPlayerHand(sortCards(newPHand, activeTrumpSuits));
        setAiHand(updatedAiHand);
        setTablePairs([]);
        setSelectedCardId(null);
        setActionFeedback(null);

        if (checkGameOver(remainingDeck, newPHand, updatedAiHand)) return;

        // Player attacks again
        setIsPlayerAttacker(true);
        setTurnPhase('attacking');
        addLog(`📥 ${opponent.name} забрав ${allTableCards.length} карт(и). Ви знову атакуєте!`);
    };

    const selectedCard = playerHand.find(c => c.id === selectedCardId);
    const selectedCardPlayable = selectedCardId ? playableCardsMap.get(selectedCardId)?.canPlay : false;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 bg-black/90 backdrop-blur-md select-none">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-5xl h-[96vh] sm:h-[94vh] bg-[#0f1b11] border-2 border-amber-600/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* 1. Header Bar */}
                <div className="px-3 sm:px-4 py-2 bg-[#162719] border-b border-amber-600/40 flex items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-xl sm:text-2xl p-1 rounded-lg bg-[#0b140c] border border-amber-500/40 shrink-0">
                            {opponent.avatar}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <h3 className="font-serif font-black text-xs sm:text-sm text-amber-300">
                                    {getModeTitle(mode)}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                                    {tavernName}
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-stone-300">
                                Проти: <strong className="text-amber-200">{opponent.name}</strong> ({opponent.title})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-1.5 rounded-lg bg-[#0b140c] hover:bg-[#1a2d1d] border border-stone-700 text-stone-300 transition-colors"
                            title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                        </button>
                        <button
                            onClick={() => setShowRules(true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0b140c] hover:bg-[#1a2d1d] border border-amber-500/40 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Правила</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-[#0b140c] hover:bg-rose-950/70 border border-stone-700 hover:border-rose-500/50 text-stone-300 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Закрити"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 2. Main Felt Table (Green Baize) */}
                <div className="flex-1 min-h-0 relative flex flex-col justify-between p-2 sm:p-3.5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1d3d22] via-[#132a17] to-[#0a170d] overflow-hidden">
                    
                    {/* Top Section: Opponent Card Fan & Status */}
                    <div className="shrink-0 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/45 border border-emerald-900/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1b2f1e] border border-amber-500/50 flex items-center justify-center text-lg shadow">
                                {opponent.avatar}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                    <span>{opponent.name}</span>
                                    <span className="text-[10px] text-stone-400">({opponent.title})</span>
                                </div>
                                <div className="text-[11px] text-stone-300 flex items-center gap-2">
                                    <span>Карт на руці: <strong className="text-amber-400 font-mono text-xs">{aiHand.length}</strong></span>
                                    <span className="hidden sm:inline text-stone-500">•</span>
                                    <span className="hidden md:inline italic text-stone-400 text-[10px]">«{opponent.flavorQuote}»</span>
                                </div>
                            </div>
                        </div>

                        {/* Opponent Card Backs Fan */}
                        <div className="flex -space-x-3 sm:-space-x-4 overflow-hidden py-1 max-w-[45vw] justify-end">
                            {aiHand.map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: -8, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="w-7 sm:w-8 md:w-9 h-10 sm:h-12 rounded-md bg-gradient-to-br from-amber-800 via-amber-950 to-stone-900 border border-amber-500/60 shadow-md flex items-center justify-center text-amber-300/40 text-[10px] font-serif font-black shrink-0"
                                >
                                    ✦
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Middle Section: Deck, Trump Card & Table Arena */}
                    <div className="flex-1 min-h-[140px] flex items-center justify-between gap-2 sm:gap-4 py-2 relative overflow-hidden">
                        
                        {/* Deck & Trump Display (Left Wing) */}
                        <div className="shrink-0 flex flex-col items-center gap-1.5 bg-black/40 p-2 sm:p-2.5 rounded-xl border border-emerald-800/50 shadow-lg min-w-[90px] sm:min-w-[110px]">
                            <div className="text-[9px] sm:text-[10px] font-black text-amber-300 tracking-wider uppercase">
                                Колода ({deck.length})
                            </div>
                            <div className="relative w-14 sm:w-18 h-20 sm:h-24 flex items-center justify-center">
                                {trumpCard && (
                                    <>
                                        {/* Horizontal Turned Trump Card */}
                                        <div
                                            className={`absolute w-12 sm:w-15 h-16 sm:h-20 rounded-lg bg-[#fffdf9] border-2 border-amber-400 shadow-xl flex flex-col justify-between p-1 rotate-90 transform origin-center ${getCardTextColor(trumpCard.color)}`}
                                        >
                                            <div className="text-[9px] font-black leading-none">
                                                {trumpCard.label}{trumpCard.symbol}
                                            </div>
                                            <div className="text-base sm:text-lg self-center font-black">
                                                {trumpCard.symbol}
                                            </div>
                                            <div className="text-[9px] font-black leading-none self-end rotate-180">
                                                {trumpCard.label}{trumpCard.symbol}
                                            </div>
                                        </div>

                                        {/* Deck Stack on Top of Trump */}
                                        {deck.length > 0 && (
                                            <div className="absolute w-12 sm:w-14 h-16 sm:h-20 rounded-lg bg-gradient-to-br from-amber-900 via-stone-900 to-amber-950 border-2 border-amber-500/80 shadow-2xl flex flex-col items-center justify-center text-amber-300 font-serif">
                                                <div className="text-[9px] font-black tracking-wider">ДУРАК</div>
                                                <div className="text-[9px] text-amber-200 mt-0.5 font-bold">{deck.length}</div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Trump Suit Indicators */}
                            {trumpCard && (
                                <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="text-[9px] font-black text-amber-400 uppercase">
                                        Козирі ({activeTrumpSuits.length}):
                                    </div>
                                    <div className="flex items-center justify-center gap-1 flex-wrap max-w-[130px]">
                                        {activeTrumpSuits.map((suit, idx) => {
                                            const isMain = idx === 0;
                                            return (
                                                <div 
                                                    key={suit}
                                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black shadow border ${
                                                        isMain 
                                                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40' 
                                                            : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                                    }`}
                                                    title={`${SUIT_NAMES_UA[suit]}${isMain ? ' (Головний відкритий козир)' : ' (Козирна масть)'}`}
                                                >
                                                    <span className="text-xs">{SUIT_SYMBOLS[suit]}</span>
                                                    {isMain && <span className="text-[8px] text-amber-400 font-bold">★</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Discard Pile */}
                            <div className="text-[9px] sm:text-[10px] text-stone-400 flex items-center gap-1 mt-1">
                                <span>Відбій:</span>
                                <strong className="text-amber-300/80 font-mono">{discardCount}</strong>
                            </div>
                        </div>

                        {/* Battle Pairs Table Area (Center) */}
                        <div className="flex-1 h-full min-h-[140px] rounded-2xl bg-black/30 border-2 border-dashed border-emerald-700/40 p-2 sm:p-3 flex flex-wrap items-center justify-center content-center gap-2 sm:gap-4 overflow-y-auto shadow-inner">
                            {tablePairs.length === 0 ? (
                                <div className="text-center text-stone-300/60 space-y-1 py-4">
                                    <Swords className="w-7 h-7 sm:w-8 sm:h-8 mx-auto text-emerald-400/50 animate-pulse" />
                                    <p className="text-xs sm:text-sm font-bold text-amber-200/80">
                                        {isPlayerAttacker 
                                            ? 'Ваш хід! Виберіть карту з руки нижче.' 
                                            : `Очікування атаки від ${opponent.name}...`}
                                    </p>
                                </div>
                            ) : (
                                tablePairs.map((pair) => {
                                    const isTargeted = selectedTargetPairId === pair.id;
                                    const attackIsTrump = isTrump(pair.attack.suit, activeTrumpSuits);
                                    const defenseIsTrump = pair.defense ? isTrump(pair.defense.suit, activeTrumpSuits) : false;

                                    return (
                                        <div 
                                            key={pair.id} 
                                            onClick={() => {
                                                if (!isPlayerAttacker && !pair.defense && selectedCard) {
                                                    if (canBeat(pair.attack, selectedCard, activeTrumpSuits)) {
                                                        executePlayCard(selectedCard, pair.id);
                                                    } else {
                                                        const cardIsTrump = isTrump(selectedCard.suit, activeTrumpSuits);
                                                        const attIsTrump = isTrump(pair.attack.suit, activeTrumpSuits);
                                                        if (selectedCard.suit === pair.attack.suit) {
                                                            setActionFeedback(`Карта ${selectedCard.symbol}${selectedCard.label} (${selectedCard.rank}) слабша за ${pair.attack.symbol}${pair.attack.label} (${pair.attack.rank})!`);
                                                        } else if (!cardIsTrump && attIsTrump) {
                                                            setActionFeedback(`Козир ${pair.attack.symbol}${pair.attack.label} б'ється лише старшим козирем!`);
                                                        } else if (!cardIsTrump && !attIsTrump) {
                                                            setActionFeedback(`Масті не збігаються (${selectedCard.symbol} ≠ ${pair.attack.symbol}) і карта не козирна!`);
                                                        } else {
                                                            setActionFeedback(`Карта ${selectedCard.symbol}${selectedCard.label} не може побити ${pair.attack.symbol}${pair.attack.label}!`);
                                                        }
                                                    }
                                                }
                                            }}
                                            className={`relative w-14 sm:w-18 md:w-20 h-20 sm:h-26 md:h-28 transition-transform cursor-pointer ${
                                                isTargeted ? 'scale-105' : ''
                                            }`}
                                        >
                                            {/* Attack Card (Bottom of Pair) */}
                                            <motion.div
                                                initial={{ scale: 0.8, y: -15, opacity: 0 }}
                                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                                className={`absolute inset-0 rounded-lg bg-[#fffdfa] border-2 shadow-lg flex flex-col justify-between p-1 sm:p-1.5 ${
                                                    attackIsTrump 
                                                        ? 'border-amber-400 ring-2 ring-amber-400/40' 
                                                        : 'border-stone-400'
                                                } ${getCardTextColor(pair.attack.color)}`}
                                            >
                                                <div className="text-[10px] sm:text-xs font-black leading-none">
                                                    {pair.attack.label} {pair.attack.symbol}
                                                </div>
                                                <div className="text-xl sm:text-2xl self-center font-black">
                                                    {pair.attack.symbol}
                                                </div>
                                                <div className="text-[10px] sm:text-xs font-black leading-none self-end rotate-180">
                                                    {pair.attack.label} {pair.attack.symbol}
                                                </div>
                                            </motion.div>

                                            {/* Defense Card (Offset on top of attack card) */}
                                            {pair.defense ? (
                                                <motion.div
                                                    initial={{ scale: 0.8, y: 15, opacity: 0 }}
                                                    animate={{ scale: 1, y: 0, opacity: 1 }}
                                                    className={`absolute inset-0 translate-x-2 translate-y-2.5 sm:translate-x-2.5 sm:translate-y-3 rounded-lg bg-[#fffdfa] border-2 shadow-2xl flex flex-col justify-between p-1 sm:p-1.5 z-10 ${
                                                        defenseIsTrump 
                                                            ? 'border-amber-400 ring-2 ring-amber-400/40' 
                                                            : 'border-stone-400'
                                                    } ${getCardTextColor(pair.defense.color)}`}
                                                >
                                                    <div className="text-[10px] sm:text-xs font-black leading-none">
                                                        {pair.defense.label} {pair.defense.symbol}
                                                    </div>
                                                    <div className="text-xl sm:text-2xl self-center font-black">
                                                        {pair.defense.symbol}
                                                    </div>
                                                    <div className="text-[10px] sm:text-xs font-black leading-none self-end rotate-180">
                                                        {pair.defense.label} {pair.defense.symbol}
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                !isPlayerAttacker && (
                                                    <div className="absolute -bottom-2 -right-1 z-10 px-1.5 py-0.5 rounded bg-rose-600 text-[9px] font-black text-white shadow animate-bounce">
                                                        Бити!
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Right Wing: Dual Combat Log (Desktop) */}
                        <div className="hidden lg:flex flex-col w-52 h-full bg-black/40 p-2.5 rounded-xl border border-emerald-800/40 shrink-0">
                            <div className="text-[10px] font-black text-amber-300 uppercase pb-1 border-b border-stone-800 flex items-center justify-between">
                                <span>Хід дуелі</span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                                    isPlayerAttacker ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                                }`}>
                                    {isPlayerAttacker ? 'Атака' : 'Захист'}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1 text-[11px] text-stone-300 scrollbar-thin scrollbar-thumb-stone-800 py-1">
                                {logMessages.map((msg, i) => (
                                    <div key={i} className="leading-tight py-0.5 border-b border-stone-900/60">
                                        {msg}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. Bottom Player Dashboard (Control Bar + Hands) */}
                    <div className="shrink-0 space-y-1.5 z-30 pt-1">
                        
                        {/* Interactive Action Control & Guidance Banner */}
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-800/70 backdrop-blur-md flex-wrap gap-2 shadow-lg">
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 shadow ${
                                    isPlayerAttacker 
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950' 
                                        : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                                }`}>
                                    {isPlayerAttacker ? <Swords className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                    <span>{isPlayerAttacker ? 'ВАША АТАКА' : 'ВАШ ЗАХИСТ'}</span>
                                </span>

                                <div className="text-xs text-stone-200 font-medium">
                                    {actionFeedback ? (
                                        <span className="text-amber-300 font-bold flex items-center gap-1">
                                            <span>⚠️ {actionFeedback}</span>
                                        </span>
                                    ) : (
                                        <>
                                            {turnPhase === 'attacking' && (
                                                tablePairs.length === 0 
                                                    ? 'Оберіть карту з руки для атаки (натисніть на карту)' 
                                                    : 'Підкидайте карти тих же номіналів або натисніть «БИТО»'
                                            )}
                                            {turnPhase === 'defending' && 'Побийте кожну карту столу старшою картою або козирем'}
                                            {turnPhase === 'ai_thinking' && `${opponent.name} обдумує свій хід...`}
                                            {turnPhase === 'ai_taking' && `${opponent.name} бере карти! Можете підкинути ще або натиснути «Віддати»`}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Buttons Panel */}
                            <div className="flex items-center gap-2">
                                {/* Selected Card Play Button */}
                                {selectedCard && selectedCardPlayable && (
                                    <button
                                        onClick={() => executePlayCard(selectedCard, selectedTargetPairId || undefined)}
                                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 font-black text-xs text-stone-950 shadow-md transition-all flex items-center gap-1 cursor-pointer animate-pulse hover:scale-105"
                                    >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                        <span>
                                            {isPlayerAttacker ? `Зіграти ${selectedCard.symbol}${selectedCard.label}` : `Побити картою ${selectedCard.symbol}${selectedCard.label}`}
                                        </span>
                                    </button>
                                )}

                                {/* BITO Button */}
                                {isPlayerAttacker && turnPhase === 'attacking' && tablePairs.length > 0 && tablePairs.every(p => p.defense) && (
                                    <button
                                        onClick={handlePlayerBito}
                                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 font-black text-xs text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>БИТО (У Відбій)</span>
                                    </button>
                                )}

                                {/* Finalize AI Taking Button */}
                                {isPlayerAttacker && turnPhase === 'ai_taking' && (
                                    <button
                                        onClick={handleFinalizeAiTaking}
                                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 font-black text-xs text-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                                    >
                                        <span>📥 Віддати карти супернику</span>
                                    </button>
                                )}

                                {/* Take Cards Button */}
                                {!isPlayerAttacker && turnPhase === 'defending' && tablePairs.length > 0 && (
                                    <button
                                        onClick={handlePlayerTake}
                                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 font-black text-xs text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                                    >
                                        <span>📥 Взяти карти</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Player Hand Cards Carousel / Grid */}
                        <div className="relative bg-black/40 border border-emerald-900/60 rounded-xl px-2 sm:px-4 py-2 flex items-center justify-center">
                            <div className="flex items-end justify-center -space-x-2 sm:-space-x-3 md:-space-x-4 overflow-x-auto max-w-full py-2 px-3 min-h-[96px] sm:min-h-[118px] md:min-h-[126px]">
                                {playerHand.map((card, idx) => {
                                    const cardIsTrump = isTrump(card.suit, activeTrumpSuits);
                                    const isSelected = selectedCardId === card.id;
                                    const playableInfo = playableCardsMap.get(card.id);
                                    const canPlay = playableInfo?.canPlay ?? false;

                                    return (
                                        <motion.button
                                            key={`hand-card-${card.id}-${idx}`}
                                            whileHover={{ y: -18, scale: 1.12, zIndex: 40 }}
                                            whileTap={{ scale: 0.95 }}
                                            animate={{ 
                                                y: isSelected ? -20 : 0,
                                                scale: isSelected ? 1.12 : 1,
                                                zIndex: isSelected ? 35 : undefined
                                            }}
                                            onClick={() => handleCardClick(card)}
                                            className={`relative w-12 sm:w-15 md:w-17 h-18 sm:h-22 md:h-26 rounded-xl bg-[#fffdfa] border-2 shadow-xl flex flex-col justify-between p-1 sm:p-1.5 cursor-pointer transition-all shrink-0 ${
                                                isSelected 
                                                    ? 'ring-4 ring-yellow-400 border-amber-500 shadow-yellow-500/50 -translate-y-4 z-30' 
                                                    : canPlay
                                                        ? 'border-emerald-400 hover:border-amber-400 shadow-emerald-500/20'
                                                        : 'border-stone-400/80 opacity-90'
                                            } ${getCardTextColor(card.color)}`}
                                        >
                                            {/* Trump or Playable Badge */}
                                            {cardIsTrump && (
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1 rounded bg-amber-500 text-[8px] font-black text-black uppercase shadow whitespace-nowrap">
                                                    Козир {activeTrumpSuits.indexOf(card.suit) === 0 ? '★' : ''}
                                                </div>
                                            )}
                                            {canPlay && !cardIsTrump && (
                                                <div className="absolute -top-1.5 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300 animate-ping" />
                                            )}

                                            <div className="text-[11px] sm:text-xs md:text-sm font-black leading-none">
                                                {card.label} {card.symbol}
                                            </div>
                                            <div className="text-xl sm:text-2xl md:text-3xl self-center font-black">
                                                {card.symbol}
                                            </div>
                                            <div className="text-[11px] sm:text-xs md:text-sm font-black leading-none self-end rotate-180">
                                                {card.label} {card.symbol}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Hand Counter Info */}
                            <div className="absolute bottom-1 right-2 text-[10px] text-stone-400 font-mono">
                                Карт у вас: <strong className="text-amber-300">{playerHand.length}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Victory / Defeat Modal Overlay */}
                <AnimatePresence>
                    {gameResult !== null && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md p-6 rounded-2xl bg-[#18130d] border-2 border-amber-500/80 shadow-2xl text-center space-y-4"
                            >
                                {gameResult === 'victory' ? (
                                    <>
                                        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-bounce">
                                            👑
                                        </div>
                                        <h2 className="text-2xl font-serif font-black text-amber-300">
                                            ВИ ПЕРЕМОГЛИ!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            {opponent.name} залишився в Дурнях! Ви блискуче розіграли свої карти.
                                        </p>
                                        <div className="p-3 rounded-xl bg-[#23180f] border border-amber-500/40 flex items-center justify-around text-xs font-bold text-amber-300">
                                            <div className="flex items-center gap-1.5">
                                                <Coins className="w-4 h-4 text-amber-400" />
                                                <span>+{opponent.rewards.gold} золота</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-emerald-400">
                                                <Sparkles className="w-4 h-4" />
                                                <span>+{expectedXpReward ?? ((expectedXpReward ?? (opponent.rewards.xp || 100)))} XP</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    onVictory();
                                                    onClose();
                                                }}
                                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm shadow-lg transition-transform hover:scale-105 cursor-pointer"
                                            >
                                                Забрати нагороду та вийти
                                            </button>
                                        </div>
                                    </>
                                ) : gameResult === 'defeat' ? (
                                    <>
                                        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-3xl shadow">
                                            💀
                                        </div>
                                        <h2 className="text-2xl font-serif font-black text-rose-400">
                                            ВИ ЗАЛИШИЛИСЯ В ДУРНЯХ!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            {opponent.name}: «{opponent.flavorQuote}»
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={startNewGame}
                                                className="flex-1 py-3 rounded-xl bg-[#2e2118] hover:bg-[#3d2c20] border border-amber-500/50 text-amber-300 font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Спробувати ще раз</span>
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
                                ) : (
                                    <>
                                        <h2 className="text-xl font-black text-stone-300">НІЧИЯ!</h2>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={startNewGame}
                                                className="flex-1 py-3 rounded-xl bg-amber-600 text-black font-black text-sm cursor-pointer"
                                            >
                                                Переграти
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* 5. Rules Modal Overlay */}
                <AnimatePresence>
                    {showRules && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-lg p-5 rounded-2xl bg-[#18130d] border-2 border-amber-500/70 shadow-2xl space-y-3 text-xs text-[#e8dac7]"
                            >
                                <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                                    <h3 className="text-base font-serif font-black text-amber-300 flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4 text-amber-400" />
                                        <span>{getModeTitle(mode)}</span>
                                    </h3>
                                    <button
                                        onClick={() => setShowRules(false)}
                                        className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                                    <p><strong>1. Мета гри:</strong> Першим позбутися всіх карт на руках після вичерпання колоди. Той, хто залишається з картами, програє (стає «Дурнем»).</p>
                                     <p><strong>2. Особливість цього режиму:</strong> {
                                        mode === 'durak_52_2trumps' ? 'Гра йде колодою 52 карти з двома козирними мастями (відкритий козир + парна масть).' :
                                        mode === 'durak_52_2trumps_plus1trump' ? 'До колоди додається 5-та масть (⭐ Зірка, 65 карт), яка є апріорно козирною і у виборі козиря не бере участі, плюс 2 козирі обираються зі стандартних 4 мастей.' :
                                        mode === 'durak_52_2trumps_plus2trumps' ? 'До колоди додається 2 нові масті (⭐ Зірка та 🌙 Місяць, 78 карт), які є апріорно козирними і у виборі козиря не беруть участі, плюс 2 козирі обираються зі стандартних 4 мастей.' :
                                        mode === 'durak_52_2trumps_plus2suits' ? 'Колода розширена до 6 мастей (78 карт: ♠, ♥, ♦, ♣ + ⭐ Зірки + 🌙 Місяці) з двома козирями.' :
                                        mode === 'durak_52_2trumps_plus1suit' ? 'Колода розширена до 5 мастей (65 карт: ♠, ♥, ♦, ♣ + ⭐ Зірки) з двома козирями.' :
                                        'Стандартні правила підкидного дурня.'
                                    }</p>
                                    <p><strong>3. Козирі:</strong> Козирна карта б'є будь-яку некозирну карту. Якщо обидві карти козирні: карта тієї ж козирної масті б'є молодшу за номіналом, а головний козир (★) б'є вторинні козирі.</p>
                                    <p><strong>4. Атака та підкидання:</strong> Гравець ходить картою з руки. Після захисту можна підкидати карти будь-яких номіналів, що вже присутні на столі (максимум 6 карт).</p>
                                    <p><strong>5. Бито:</strong> Якщо всі атаки успішно відбиті і атакуючий не бажає більше підкидати — карти йдуть у <strong>Відбій</strong>, а черга ходу переходить до захисника.</p>
                                </div>

                                <button
                                    onClick={() => setShowRules(false)}
                                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer shadow"
                                >
                                    Зрозуміло, до гри!
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

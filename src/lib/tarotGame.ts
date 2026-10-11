// Authentic French Tarot (Jeu de tarot) Engine
// Compliant with the official Fédération Française de Tarot (FFT) & Wikipedia rules.

export type TarotSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'trumps' | 'excuse';

export interface TarotCard {
    id: string;
    suit: TarotSuit;
    rank: number | string; // 1..10, 'V', 'C', 'D', 'R' for suits; 1..21 for trumps; 'EXCUSE' for excuse
    shortLabel: string;
    nameUk: string;
    nameFr: string;
    points: number; // 4.5, 3.5, 2.5, 1.5, 0.5
    isOudler: boolean; // 21, 1 (Petit), Excuse
    power: number; // For sorting and trick comparison within the suit/trump
}

export type TarotBid = 'passe' | 'prise' | 'garde' | 'garde_sans' | 'garde_contre';

export interface TarotBidOption {
    bid: TarotBid;
    nameUk: string;
    nameFr: string;
    multiplier: number;
    description: string;
    priority: number; // 0 for pass, 1 for prise, 2 for garde, etc.
}

export const TAROT_BIDS: Record<TarotBid, TarotBidOption> = {
    passe: {
        bid: 'passe',
        nameUk: 'Пас',
        nameFr: 'Passe',
        multiplier: 0,
        description: 'Відмова від участі в торгах',
        priority: 0
    },
    prise: {
        bid: 'prise',
        nameUk: 'Мала (Prise)',
        nameFr: 'Prise / Petite',
        multiplier: 1,
        description: 'Берущий відкриває "Собаку" (6 карт), забирає собі та скидає 6 непотрібних карт. Множник x1.',
        priority: 1
    },
    garde: {
        bid: 'garde',
        nameUk: 'Гард (Garde)',
        nameFr: 'Garde',
        multiplier: 2,
        description: 'Берущий забирає "Собаку" та скидає 6 карт. Множник x2.',
        priority: 2
    },
    garde_sans: {
        bid: 'garde_sans',
        nameUk: 'Гард без собаки (Garde sans le chien)',
        nameFr: 'Garde sans le chien',
        multiplier: 4,
        description: '"Собака" залишається закритою, але її очки йдуть Берущому в кінці. Множник x4.',
        priority: 3
    },
    garde_contre: {
        bid: 'garde_contre',
        nameUk: 'Гард проти собаки (Garde contre le chien)',
        nameFr: 'Garde contre le chien',
        multiplier: 6,
        description: '"Собака" залишається закритою, а її очки йдуть Захисту. Множник x6.',
        priority: 4
    }
};

// 78-card French Tarot Deck Generator
export function createFrenchTarotDeck(): TarotCard[] {
    const deck: TarotCard[] = [];

    const suits: { suit: TarotSuit; symbol: string; uk: string; fr: string }[] = [
        { suit: 'spades', symbol: '♠', uk: 'Піка', fr: 'Pique' },
        { suit: 'hearts', symbol: '♥', uk: 'Чирва', fr: 'Cœur' },
        { suit: 'diamonds', symbol: '♦', uk: 'Бубна', fr: 'Carreau' },
        { suit: 'clubs', symbol: '♣', uk: 'Трефа', fr: 'Trèfle' }
    ];

    // 4 Suits x 14 cards = 56 cards
    for (const s of suits) {
        // Pip cards 1 to 10 (each worth 0.5 points)
        for (let r = 1; r <= 10; r++) {
            const rankName = r === 1 ? 'Туз' : r.toString();
            deck.push({
                id: `${s.suit}_${r}`,
                suit: s.suit,
                rank: r,
                shortLabel: `${r} ${s.symbol}`,
                nameUk: `${rankName} ${s.uk}`,
                nameFr: `${r} de ${s.fr}`,
                points: 0.5,
                isOudler: false,
                power: r
            });
        }

        // 4 Court figures (Honors / Figures)
        // Valet (1.5 pts)
        deck.push({
            id: `${s.suit}_V`,
            suit: s.suit,
            rank: 'V',
            shortLabel: `V ${s.symbol}`,
            nameUk: `Валет ${s.uk}`,
            nameFr: `Valet de ${s.fr}`,
            points: 1.5,
            isOudler: false,
            power: 11
        });

        // Cavalier (Knight, 2.5 pts)
        deck.push({
            id: `${s.suit}_C`,
            suit: s.suit,
            rank: 'C',
            shortLabel: `C ${s.symbol}`,
            nameUk: `Лицар (Кавалер) ${s.uk}`,
            nameFr: `Cavalier de ${s.fr}`,
            points: 2.5,
            isOudler: false,
            power: 12
        });

        // Dame (Queen, 3.5 pts)
        deck.push({
            id: `${s.suit}_D`,
            suit: s.suit,
            rank: 'D',
            shortLabel: `D ${s.symbol}`,
            nameUk: `Дама ${s.uk}`,
            nameFr: `Dame de ${s.fr}`,
            points: 3.5,
            isOudler: false,
            power: 13
        });

        // Roi (King, 4.5 pts)
        deck.push({
            id: `${s.suit}_R`,
            suit: s.suit,
            rank: 'R',
            shortLabel: `R ${s.symbol}`,
            nameUk: `Король ${s.uk}`,
            nameFr: `Roi de ${s.fr}`,
            points: 4.5,
            isOudler: false,
            power: 14
        });
    }

    // 21 Trumps (Atouts)
    for (let t = 1; t <= 21; t++) {
        const isOudler = t === 1 || t === 21;
        const points = isOudler ? 4.5 : 0.5;
        const ukLabel = t === 1 ? '1 Малий (Petit)' : t === 21 ? '21 Козир (Удлер)' : `${t} Козир`;
        const frLabel = t === 1 ? 'Le Petit (1)' : t === 21 ? 'Le 21' : `${t} d'Atout`;

        deck.push({
            id: `trump_${t}`,
            suit: 'trumps',
            rank: t,
            shortLabel: `${t} ★`,
            nameUk: ukLabel,
            nameFr: frLabel,
            points,
            isOudler,
            power: t + 100 // High baseline power for trumps
        });
    }

    // 1 Excuse (L'Excuse / Блазень)
    deck.push({
        id: 'excuse',
        suit: 'excuse',
        rank: 'EXCUSE',
        shortLabel: '🃏 Excuse',
        nameUk: 'Блазень (L’Excuse)',
        nameFr: 'L’Excuse',
        points: 4.5,
        isOudler: true,
        power: 0 // Special card
    });

    return deck;
}

// Shuffles deck using Fisher-Yates
export function shuffleTarotDeck(deck: TarotCard[]): TarotCard[] {
    const copy = [...deck];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export interface PlayedCardEntry {
    playerIndex: number;
    playerName: string;
    card: TarotCard;
}

// Helper: Get lead suit of a trick
export function getTrickLeadSuit(trickCards: PlayedCardEntry[]): TarotSuit | null {
    if (trickCards.length === 0) return null;
    // If first card was Excuse, the second card determines the lead suit
    for (const entry of trickCards) {
        if (entry.card.suit !== 'excuse') {
            return entry.card.suit;
        }
    }
    return 'excuse';
}

// Helper: Highest trump currently played in the trick
export function getHighestTrumpInTrick(trickCards: PlayedCardEntry[]): number {
    let highest = 0;
    for (const entry of trickCards) {
        if (entry.card.suit === 'trumps' && typeof entry.card.rank === 'number') {
            if (entry.card.rank > highest) {
                highest = entry.card.rank;
            }
        }
    }
    return highest;
}

// Official FFT Rule Check: Is a card legal to play?
export function isCardPlayable(
    card: TarotCard,
    hand: TarotCard[],
    trickCards: PlayedCardEntry[],
    trickNumber: number // 1..18
): { valid: boolean; reason?: string } {
    // 1. If leading the trick, any card can be played!
    if (trickCards.length === 0) {
        return { valid: true };
    }

    // 2. L'Excuse can almost always be played!
    if (card.suit === 'excuse') {
        // In the 18th trick, Excuse cannot be played if player has other cards (standard FFT rule)
        if (trickNumber === 18 && hand.length > 1) {
            return { valid: false, reason: 'Блазень не може розігруватися у 18-й (останній) взятці!' };
        }
        return { valid: true };
    }

    const leadSuit = getTrickLeadSuit(trickCards);

    // If trick only had Excuse so far, this card becomes the actual lead
    if (!leadSuit || leadSuit === 'excuse') {
        return { valid: true };
    }

    const hasLeadSuit = hand.some(c => c.suit === leadSuit);
    const hasTrumps = hand.some(c => c.suit === 'trumps');
    const highestTrumpInTrick = getHighestTrumpInTrick(trickCards);
    const trumpsHigherThanCurrent = hand.filter(
        c => c.suit === 'trumps' && typeof c.rank === 'number' && c.rank > highestTrumpInTrick
    );

    // 3. If lead is a Trump:
    if (leadSuit === 'trumps') {
        if (hasTrumps) {
            if (card.suit !== 'trumps') {
                return { valid: false, reason: 'Захід з козиря: ви зобов’язані покласти козир!' };
            }
            // Must overtrump (surcouper) if possible
            if (trumpsHigherThanCurrent.length > 0 && typeof card.rank === 'number' && card.rank <= highestTrumpInTrick) {
                return { valid: false, reason: `Ви зобов’язані перебити козир (потрібен козир вище ${highestTrumpInTrick})!` };
            }
            return { valid: true };
        } else {
            // No trumps: can discard any card
            return { valid: true };
        }
    }

    // 4. If lead is a regular suit (♠, ♥, ♦, ♣):
    if (hasLeadSuit) {
        if (card.suit !== leadSuit) {
            return { valid: false, reason: `Ви зобов’язані грати в масть (${leadSuit})!` };
        }
        return { valid: true };
    }

    // 5. Player has no cards of the lead suit -> MUST TRUMP (Couper) if has trumps!
    if (hasTrumps) {
        if (card.suit !== 'trumps') {
            return { valid: false, reason: 'У вас немає масті заходу: ви зобов’язані бити козирем!' };
        }

        // If another player already played a trump:
        if (highestTrumpInTrick > 0) {
            // Must overtrump if possible
            if (trumpsHigherThanCurrent.length > 0 && typeof card.rank === 'number' && card.rank <= highestTrumpInTrick) {
                return { valid: false, reason: `Потрібно перебити зіграний козир вищим за ${highestTrumpInTrick}!` };
            }
        }
        return { valid: true };
    }

    // 6. Player has neither suit nor trumps: can discard (défausse) any card
    return { valid: true };
}

// Determine Trick Winner according to French Tarot
export function determineTrickWinner(trickCards: PlayedCardEntry[]): {
    winnerIndex: number;
    winningCard: TarotCard;
    hasPetit: boolean;
    hasExcuse: boolean;
} {
    if (trickCards.length === 0) {
        throw new Error('Cannot evaluate empty trick');
    }

    const leadSuit = getTrickLeadSuit(trickCards);

    let highestTrumpValue = -1;
    let highestTrumpWinner = -1;
    let highestTrumpCard: TarotCard | null = null;

    let highestSuitPower = -1;
    let highestSuitWinner = -1;
    let highestSuitCard: TarotCard | null = null;

    let hasPetit = false;
    let hasExcuse = false;

    for (const entry of trickCards) {
        const { card, playerIndex } = entry;

        if (card.suit === 'excuse') {
            hasExcuse = true;
            continue; // Excuse never takes trick
        }

        if (card.suit === 'trumps') {
            const val = typeof card.rank === 'number' ? card.rank : 0;
            if (val === 1) hasPetit = true;
            if (val > highestTrumpValue) {
                highestTrumpValue = val;
                highestTrumpWinner = playerIndex;
                highestTrumpCard = card;
            }
        } else if (card.suit === leadSuit && highestTrumpValue === -1) {
            if (card.power > highestSuitPower) {
                highestSuitPower = card.power;
                highestSuitWinner = playerIndex;
                highestSuitCard = card;
            }
        }
    }

    if (highestTrumpWinner !== -1 && highestTrumpCard) {
        return {
            winnerIndex: highestTrumpWinner,
            winningCard: highestTrumpCard,
            hasPetit,
            hasExcuse
        };
    }

    if (highestSuitWinner !== -1 && highestSuitCard) {
        return {
            winnerIndex: highestSuitWinner,
            winningCard: highestSuitCard,
            hasPetit,
            hasExcuse
        };
    }

    // Fallback (only Excuse played, which is edge case)
    return {
        winnerIndex: trickCards[0].playerIndex,
        winningCard: trickCards[0].card,
        hasPetit,
        hasExcuse
    };
}

// Validate Chien Discard (Ecart):
// Preneur cannot discard Kings, Oudlers (21, 1, Excuse), or Trumps unless forced
export function isValidChienDiscard(
    discardedCards: TarotCard[],
    fullHandBeforeDiscard: TarotCard[]
): { valid: boolean; reason?: string } {
    if (discardedCards.length !== 6) {
        return { valid: false, reason: `Необхідно скинути рівно 6 карт (зараз обрано ${discardedCards.length})` };
    }

    for (const card of discardedCards) {
        if (card.rank === 'R') {
            return { valid: false, reason: `Заборонено скидати Короля (${card.nameUk})!` };
        }
        if (card.isOudler) {
            return { valid: false, reason: `Заборонено скидати Удлер (${card.nameUk})!` };
        }
    }

    // Check trumps: can only discard trump if non-trump non-king cards are fewer than 6
    const nonTrumpNonKingCards = fullHandBeforeDiscard.filter(
        c => c.suit !== 'trumps' && c.suit !== 'excuse' && c.rank !== 'R'
    );

    const discardedTrumps = discardedCards.filter(c => c.suit === 'trumps');
    if (discardedTrumps.length > 0) {
        const allowedTrumpDiscards = Math.max(0, 6 - nonTrumpNonKingCards.length);
        if (discardedTrumps.length > allowedTrumpDiscards) {
            return { valid: false, reason: 'Не можна скидати козирі, поки є звичайні числові карти чи фігури!' };
        }
    }

    return { valid: true };
}

// Final Scoring Structure
export interface TarotScoringResult {
    preneurIndex: number;
    contract: TarotBidOption;
    targetPointsNeeded: number;
    preneurCardPoints: number;
    defenseCardPoints: number;
    preneurOudlersCount: number;
    defenseOudlersCount: number;
    diff: number;
    isSuccess: boolean;
    baseScore: number;
    petitAuBoutBonus: number; // +10 or -10
    poigneeBonus: number;
    netScorePerPlayer: number; // The score that Preneur gains/loses from EACH defender
    totalPreneurScore: number; // netScorePerPlayer * 3
    summaryText: string;
}

export function calculateFinalTarotScore(
    preneurIndex: number,
    contractBid: TarotBid,
    preneurWonTricks: TarotCard[],
    defenseWonTricks: TarotCard[],
    chienCards: TarotCard[],
    petitAuBoutWinnerSide: 'preneur' | 'defense' | null,
    poigneeBonusSide: { side: 'preneur' | 'defense'; bonus: number } | null
): TarotScoringResult {
    const contract = TAROT_BIDS[contractBid];

    // Card piles
    const preneurAllCards = [...preneurWonTricks];
    const defenseAllCards = [...defenseWonTricks];

    // Chien allocation
    if (contractBid === 'garde_sans') {
        preneurAllCards.push(...chienCards);
    } else if (contractBid === 'garde_contre') {
        defenseAllCards.push(...chienCards);
    }

    // Calculate card points
    const preneurCardPoints = Number(preneurAllCards.reduce((acc, c) => acc + c.points, 0).toFixed(1));
    const defenseCardPoints = Number(defenseAllCards.reduce((acc, c) => acc + c.points, 0).toFixed(1));

    // Count Oudlers in preneur pile
    const preneurOudlers = preneurAllCards.filter(c => c.isOudler);
    const preneurOudlersCount = preneurOudlers.length;
    const defenseOudlersCount = 3 - preneurOudlersCount;

    // Threshold by Oudler count according to Wikipedia & FFT rules:
    // 3 Oudlers -> 36 points
    // 2 Oudlers -> 41 points
    // 1 Oudler  -> 51 points
    // 0 Oudlers -> 56 points
    let targetPointsNeeded = 56;
    if (preneurOudlersCount === 3) targetPointsNeeded = 36;
    else if (preneurOudlersCount === 2) targetPointsNeeded = 41;
    else if (preneurOudlersCount === 1) targetPointsNeeded = 51;

    const diff = Number((preneurCardPoints - targetPointsNeeded).toFixed(1));
    const isSuccess = diff >= 0;

    // Base calculation: 25 + |diff|
    const baseScore = 25 + Math.abs(Math.round(diff));

    // Petit au bout bonus (10 pts before multiplier)
    let petitBonus = 0;
    if (petitAuBoutWinnerSide === 'preneur') {
        petitBonus = 10;
    } else if (petitAuBoutWinnerSide === 'defense') {
        petitBonus = -10;
    }

    // Poignee bonus
    let poigneeBonus = 0;
    if (poigneeBonusSide) {
        poigneeBonus = poigneeBonusSide.side === 'preneur' ? poigneeBonusSide.bonus : -poigneeBonusSide.bonus;
    }

    // Single defender score: (baseScore * multiplier) + (petitBonus * multiplier) + poigneeBonus
    const mult = Math.max(1, contract.multiplier);
    const signedBase = isSuccess ? baseScore : -baseScore;
    const netScorePerPlayer = (signedBase + petitBonus) * mult + poigneeBonus;
    const totalPreneurScore = netScorePerPlayer * 3;

    const summaryText = isSuccess
        ? `Контракт [${contract.nameUk}] ВИКОНАНО! Набрано ${preneurCardPoints} очок із ${targetPointsNeeded} необхідних (${preneurOudlersCount} удлери). Перевищення: +${diff.toFixed(1)} очок.`
        : `Контракт [${contract.nameUk}] ПРОВАЛЕНО! Набрано лише ${preneurCardPoints} очок із ${targetPointsNeeded} необхідних (${preneurOudlersCount} удлери). Недобір: ${Math.abs(diff).toFixed(1)} очок.`;

    return {
        preneurIndex,
        contract,
        targetPointsNeeded,
        preneurCardPoints,
        defenseCardPoints,
        preneurOudlersCount,
        defenseOudlersCount,
        diff,
        isSuccess,
        baseScore,
        petitAuBoutBonus: petitBonus * mult,
        poigneeBonus,
        netScorePerPlayer,
        totalPreneurScore,
        summaryText
    };
}

// AI Heuristic: Evaluate Hand for Bidding
export function aiEvaluateHandBidding(hand: TarotCard[]): TarotBid {
    const oudlers = hand.filter(c => c.isOudler).length;
    const trumps = hand.filter(c => c.suit === 'trumps');
    const highTrumps = trumps.filter(c => typeof c.rank === 'number' && c.rank >= 15).length;
    const kings = hand.filter(c => c.rank === 'R').length;
    const queens = hand.filter(c => c.rank === 'D').length;

    const strength = oudlers * 4 + trumps.length * 1.2 + highTrumps * 2 + kings * 3 + queens * 1.5;

    if (strength >= 32 && oudlers >= 2 && trumps.length >= 8) {
        return 'garde_sans';
    }
    if (strength >= 24 && oudlers >= 1 && trumps.length >= 6) {
        return 'garde';
    }
    if (strength >= 18 && (oudlers >= 1 || kings >= 2)) {
        return 'prise';
    }
    return 'passe';
}

// AI Discard: Pick 6 non-trump, non-king cards with lowest values
export function aiChooseChienDiscard(hand: TarotCard[]): TarotCard[] {
    const eligible = hand.filter(c => !c.isOudler && c.rank !== 'R' && c.suit !== 'trumps' && c.suit !== 'excuse');
    
    // Sort by points ascending, then power ascending
    eligible.sort((a, b) => a.points - b.points || a.power - b.power);

    if (eligible.length >= 6) {
        return eligible.slice(0, 6);
    }

    // Edge case fallback: fill with other non-oudler non-king cards
    const remaining = hand.filter(c => !c.isOudler && c.rank !== 'R' && !eligible.includes(c));
    return [...eligible, ...remaining.slice(0, 6 - eligible.length)];
}

// AI Play: Select legal card to play
export function aiSelectCardToPlay(
    playerIndex: number,
    hand: TarotCard[],
    trickCards: PlayedCardEntry[],
    trickNumber: number,
    preneurIndex: number
): TarotCard {
    const legalCards = hand.filter(c => isCardPlayable(c, hand, trickCards, trickNumber).valid);

    if (legalCards.length === 1) return legalCards[0];

    const isPreneur = playerIndex === preneurIndex;
    const leadSuit = getTrickLeadSuit(trickCards);

    // If leading the trick:
    if (trickCards.length === 0) {
        // Preneur leading: if has high trumps (18-21), lead trump to exhaust defense trumps!
        if (isPreneur) {
            const highTrump = legalCards.find(c => c.suit === 'trumps' && typeof c.rank === 'number' && c.rank >= 18);
            if (highTrump) return highTrump;
            // Or cash King
            const king = legalCards.find(c => c.rank === 'R');
            if (king) return king;
        } else {
            // Defense leading: play a suit card to find preneur's void, or cash King
            const king = legalCards.find(c => c.rank === 'R');
            if (king) return king;
            const lowSuit = legalCards.find(c => c.suit !== 'trumps' && c.suit !== 'excuse' && c.points === 0.5);
            if (lowSuit) return lowSuit;
        }
        // Fallback: pick any medium card
        return legalCards[Math.floor(Math.random() * legalCards.length)];
    }

    // Responding to a trick:
    const currentWinner = determineTrickWinner(trickCards);
    const isPartnerWinning = (currentWinner.winnerIndex === preneurIndex) === isPreneur;

    if (isPartnerWinning) {
        // Partner is winning: load high points (King/Queen/Knight/Jack) if safe
        const pointsCards = legalCards.filter(c => c.points > 0.5 && !c.isOudler);
        if (pointsCards.length > 0) {
            pointsCards.sort((a, b) => b.points - a.points);
            return pointsCards[0];
        }
        // Otherwise play lowest card
        legalCards.sort((a, b) => a.power - b.power);
        return legalCards[0];
    } else {
        // Opponent is winning: try to take trick with cheapest winning card
        // If we can play a winning card:
        const winningCards: TarotCard[] = [];
        for (const c of legalCards) {
            const testTrick = [...trickCards, { playerIndex, playerName: 'AI', card: c }];
            if (determineTrickWinner(testTrick).winnerIndex === playerIndex) {
                winningCards.push(c);
            }
        }

        if (winningCards.length > 0) {
            // Pick lowest winning card
            winningCards.sort((a, b) => a.power - b.power);
            return winningCards[0];
        }

        // Cannot win: play lowest value card or save Petit
        const nonPetit = legalCards.filter(c => !(c.suit === 'trumps' && c.rank === 1));
        const pool = nonPetit.length > 0 ? nonPetit : legalCards;
        pool.sort((a, b) => a.points - b.points || a.power - b.power);
        return pool[0];
    }
}

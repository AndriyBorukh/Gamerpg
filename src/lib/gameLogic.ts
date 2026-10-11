import { Card, Suit, Rank, Player, TablePair } from '../types';

export const CLASSIC_SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const CLASSIC_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const SENIOR_SUIT: Suit = '👑'; // Старша масть

export const EXTENDED_SUITS: Suit[] = [
    '♠', '♥', '♦', '♣', 
    '★', '☾', '🍁', '⚡', '💧', '🌸', 
    '🔮', '🛡️', '⚔️', '🗝️', '📜', '🧭', '⏳', '⚖️', 
    '👑', '💎', '🔥', '🌊', '🌪️', '🌱', '🪐', '🌌'
];
export const EXTENDED_RANKS: Rank[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'N', 'Q', 'K', 'A'];

export const TAROT_RANKS: Rank[] = [
    '0 (Шут)', 'I (Маг)', 'II (Жриця)', 'III (Імператриця)', 'IV (Імператор)', 
    'V (Іерофант)', 'VI (Закохані)', 'VII (Колісниця)', 'VIII (Справедливість)', 'IX (Відлючник)', 
    'X (Фортуна)', 'XI (Сила)', 'XII (Повішений)', 'XIII (Смерть)', 'XIV (Поміркованість)', 
    'XV (Диявол)', 'XVI (Вежа)', 'XVII (Зірка)', 'XVIII (Місяць)', 'XIX (Сонце)', 
    'XX (Суд)', 'XXI (Світ)'
];

export const MINOR_TAROT_SUITS: Suit[] = ['🪄', '🗡️', '🍷', '🪙'];
export const MINOR_TAROT_RANKS: Rank[] = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 
    'P (Паж)', 'KN (Лицар)', 'Q (Королева)', 'K (Король)', 'A (Туз)'
];

export const SUITS: Suit[] = CLASSIC_SUITS;
export const RANKS: Rank[] = CLASSIC_RANKS;

export const BOT_AVATARS = [
    '🤖', '🦊', '🦉', '🦁', '🐻', '🐼', '🐯', '🐨', 
    '🦄', '🐲', '🐺', '🐸', '🐵', '🦅', '🦈', '🐙', 
    '🦔', '🦩', '🦡', '🦦', '🐊', '🦬', '🦙', '🦘', 
    '🦚', '🦜', '🦝', '🐈', '🐕', '🦃', '🦥', '🦨'
];

export type DeckMode = 'classic' | 'extended' | 'tarot' | 'classic54' | 'minor_tarot' | 'classic56';

export const getCardValue = (rank: Rank, deckMode: DeckMode = 'classic'): number => {
    if (rank === 'DTH (Смерть)') return 100;
    if (rank === 'AB (Архієпископ)') return 99;
    if (rank === 'PL (Паладин)') return 99;
    if (rank === 'DK (Лицар смерті)') return 99;
    if (rank === 'HR (Герой)') return 99;
    if (rank === 'ILL (Ілюзія)') return 99;
    if (rank === 'GM (Гросмейстер)') return 98;
    if (rank === 'BP (Єпископ)') return 97;
    if (rank === 'GB (Гравець)') return 96;
    if (rank === 'M (Магістр)') return 95;
    if (rank === 'AL (Алхімік)') return 95;
    if (rank === 'SG (Мудрець)') return 94;
    if (rank === 'PR (Священик)') return 93;
    if (rank === 'PC (Принцеса)') return 92;
    if (rank === 'PRN (Принц)') return 92;
    if (rank === 'TH (Злодій)') return 92;
    if (rank === 'WZ (Чарівник)') return 91;
    if (rank === 'SH (Шулер)') return 90;
    if (rank === 'IL (Ілюзіоніст)') return 90;
    if (rank === 'KB (Каббаліст)') return 90;
    if (rank === 'INV (Винахідник)') return 90;
    if (rank === 'MG (Маг)') return 89;
    if (rank === 'WL (Чаклун)') return 88;
    if (rank === 'CL (Клірик)') return 86;
    if (rank === 'MC (Найманець)') return 85;
    if (rank === 'GL (Золото)') return 80;
    if (rank === 'MR (Торговець)') return 80;
    if (rank === 'VK (Вікінг)') return 8;
    if (rank === 'DRK (Драккар)') return 8;
    if (rank === 'PRT_SHIP (Піратський корабель)') return 7;
    if (rank === 'PRT_CREW (Піратський екіпаж)') return 5;
    if (rank === 'HL (Ординець)') return 7;
    if (rank === 'SL (Срібло)') return 75;
    if (rank === 'RG (Злість)') return 75;
    if (rank === 'KN (Знання)') return 70;
    if (rank === 'RN (Ренджер)') return 12;
    if (rank === 'HM (Псар)') return 11;
    if (rank === 'HN (Мисливець)') return 11;
    if (rank === 'NC (Некромант)') return 11;
    if (rank === 'LD (Лідер)') return 11;
    if (rank === 'CM (Командир)') return 11;
    if (rank === 'GN (Полководець)') return 11;
    if (rank === 'TYC (Магнат)') return 90;
    if (rank === 'GLD_MN (Золота шахта)') return 80;
    if (rank === 'SLV_MN (Срібна шахта)') return 75;
    if (rank === 'MNR (Шахтарі)') return 70;
    if (rank === 'TRSR_HNT (Шукач скарбів)') return 85;
    if (rank === 'TP (Траппер)') return 10;
    if (rank === 'BR (Варвар)') return 10;
    if (rank === 'SP (Закляття)') return 10;
    if (rank === 'TR (Пастка)') return 10;
    if (rank === 'ASN (Ассасін)') return 14;
    if (rank === 'EXC (Кат)') return 13;
    if (rank === 'CRB (Арбалетчики)') return 10;
    if (rank === 'PRT (Пірат)') return 10;
    if (rank === 'RBR (Розбійник)') return 10;
    if (rank === 'BRG (Грабіжник)') return 9;
    if (rank === 'DRD (Друїд)') return 88;
    if (rank === 'SHM (Шаман)') return 88;
    if (rank === 'DOC (Лікар)') return 86;
    if (rank === 'WDC (Знахар)') return 86;
    if (rank === 'CST (Замок)') return 95;
    if (rank === 'BST (Бастіон)') return 90;
    if (rank === 'WAL (Стіна)') return 80;
    if (rank === 'TWR (Вежа)') return 60;
    if (rank === 'SHD (Щит)') return 4;
    if (rank === 'ARC (Лучники)') return 7;
    if (rank === 'TRSR (Скарб)') return 11;
    if (rank === 'ELX (Еліксир)') return 10;
    if (rank === 'BR_SP (Дух ведмедя)') return 9;
    if (rank === 'BR_ANM (Ведмідь)') return 9;
    if (rank === 'WLF_SP (Дух вовка)') return 8;
    if (rank === 'WLF (Вовк)') return 8;
    if (rank === 'WR_SP (Дух воїна)') return 10;
    if (rank === 'AUT (Автоматон)') return 5;
    if (rank === 'ZB (Зомбі)') return 4;
    if (rank === 'GLM (Голем)') return 4;
    if (rank === 'SK (Скелет)') return 3;
    if (rank === 'ANM (Аніматронік)') return 3;
    if (rank === 'DG (Собака)') return 1;
    if (rank === 'Black Joker') return deckMode === 'tarot' ? 30 : (deckMode === 'extended' ? 50 : 15);
    if (rank === 'Red Joker') return deckMode === 'tarot' ? 31 : (deckMode === 'extended' ? 51 : 16);
    if (rank === 'White Joker') return 17;
    if (rank === 'Gold Joker') return 18;
    if (rank === 'N') return deckMode === 'extended' ? 12 : 11.5;
    if (deckMode === 'tarot') {
        const index = TAROT_RANKS.indexOf(rank);
        return index !== -1 ? index : 0;
    }
    if (deckMode === 'minor_tarot') {
        const index = MINOR_TAROT_RANKS.indexOf(rank);
        return index !== -1 ? index + 2 : 0;
    }
    const ranks = deckMode === 'extended' ? EXTENDED_RANKS : CLASSIC_RANKS;
    const index = ranks.indexOf(rank);
    return index + (deckMode === 'extended' ? 0 : 2); 
};

export const createDeck = (deckMode: DeckMode = 'classic'): Card[] => {
    const deck: Card[] = [];
    let id = 1;
    if (deckMode === 'tarot') {
        // Tarot Major Arcana deck (22 cards)
        for (const rank of TAROT_RANKS) {
            deck.push({ id: id++, suit: '🎴', rank, value: getCardValue(rank, 'tarot') });
        }
    } else if (deckMode === 'minor_tarot') {
        // Tarot Minor Arcana (56 cards, 4 suits * 14 cards)
        const suits = MINOR_TAROT_SUITS;
        const ranks = MINOR_TAROT_RANKS;
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ id: id++, suit, rank, value: getCardValue(rank, 'minor_tarot') });
            }
        }
    } else if (deckMode === 'classic56') {
        // Extended 56-card deck (52 standard cards + 4 Jokers)
        const suits = CLASSIC_SUITS;
        const ranks = CLASSIC_RANKS;
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ id: id++, suit, rank, value: getCardValue(rank, 'classic') });
            }
        }
        deck.push({ id: id++, suit: 'Joker', rank: 'Black Joker', value: 15 });
        deck.push({ id: id++, suit: 'Joker', rank: 'Red Joker', value: 16 });
        deck.push({ id: id++, suit: 'Joker', rank: 'White Joker', value: 17 });
        deck.push({ id: id++, suit: 'Joker', rank: 'Gold Joker', value: 18 });
    } else if (deckMode === 'classic54') {
        // Standard 54-card deck (52 standard cards + 2 Jokers)
        const suits = CLASSIC_SUITS;
        const ranks = CLASSIC_RANKS;
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ id: id++, suit, rank, value: getCardValue(rank, 'classic') });
            }
        }
        deck.push({ id: id++, suit: 'Joker', rank: 'Black Joker', value: 15 });
        deck.push({ id: id++, suit: 'Joker', rank: 'Red Joker', value: 16 });
    } else {
        const suits = deckMode === 'extended' ? EXTENDED_SUITS : CLASSIC_SUITS;
        const ranks = deckMode === 'extended' ? EXTENDED_RANKS : CLASSIC_RANKS;
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ id: id++, suit, rank, value: getCardValue(rank, deckMode) });
            }
            // Add 1 Priest and 1 Bishop for each suit
            deck.push({ id: id++, suit, rank: 'PR (Священик)', value: 93, isPriest: true });
            deck.push({ id: id++, suit, rank: 'BP (Єпископ)', value: 97, isBishop: true });
        }
        deck.push({ id: id++, suit: 'Joker', rank: 'Black Joker', value: deckMode === 'extended' ? 50 : 15 });
        deck.push({ id: id++, suit: 'Joker', rank: 'Red Joker', value: deckMode === 'extended' ? 51 : 16 });

        // Add 4 Archbishops (1 per classic suit)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'AB (Архієпископ)', value: 99, isArchbishop: true });
        });

        // Add 8 Paladins (2 per classic suit)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'PL (Паладин)', value: 99, isPaladin: true });
            deck.push({ id: id++, suit, rank: 'PL (Паладин)', value: 99, isPaladin: true });
        });

        // Add 5 Alchemists
        for (let i = 0; i < 5; i++) {
            deck.push({ id: id++, suit: '🧪', rank: 'AL (Алхімік)', value: 95, isAlchemist: true });
        }

        // Add 8 Huntsmen (2 per classic suit)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'HM (Псар)', value: 11, isHuntsman: true });
            deck.push({ id: id++, suit, rank: 'HM (Псар)', value: 11, isHuntsman: true });
        });

        // 1. Лицар смерті (8 карт на колоду)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'DK (Лицар смерті)', value: 99, isDeathKnight: true });
            deck.push({ id: id++, suit, rank: 'DK (Лицар смерті)', value: 99, isDeathKnight: true });
        });

        // 2. Некромант (2 карти для кожної масті)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'NC (Некромант)', value: 11, isNecromancer: true });
            deck.push({ id: id++, suit, rank: 'NC (Некромант)', value: 11, isNecromancer: true });
        });

        // 3. Смерть (1 на колоду)
        deck.push({ id: id++, suit: '💀' as any, rank: 'DTH (Смерть)', value: 100, isDeathCard: true });

        // 4. Торговець (4 карти для кожної масті)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 4; i++) {
                deck.push({ id: id++, suit, rank: 'MR (Торговець)', value: 80, isMerchant: true });
            }
        });

        // 5. Герой (10 карт в колоді)
        for (let i = 0; i < 10; i++) {
            const suit = CLASSIC_SUITS[i % CLASSIC_SUITS.length];
            deck.push({ id: id++, suit, rank: 'HR (Герой)', value: 99, isHero: true });
        }

        // 6. Чаклун (3 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'WL (Чаклун)', value: 88, isWarlock: true });
            }
        });

        // 7. Маг (3 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'MG (Маг)', value: 89, isMage: true });
            }
        });

        // 8. Чарівник (3 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'WZ (Чарівник)', value: 91, isWizard: true });
            }
        });

        // 9. Ілюзіоніст (3 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'IL (Ілюзіоніст)', value: 90, isIllusionist: true });
            }
        });

        // 10. Варвар (3 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'BR (Варвар)', value: 10, isBarbarian: true });
            }
        });

        // 11. Клірик (3 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'CL (Клірик)', value: 86, isCleric: true });
            }
        });

        // 12. Ренджер (3 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'RN (Ренджер)', value: 12, isRanger: true });
            }
        });

        // 13. Мисливець (3 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'HN (Мисливець)', value: 11, isHunter: true });
            }
        });

        // 14. Траппер (3 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'TP (Траппер)', value: 10, isTrapper: true });
            }
        });

        // 15. Лідер (2 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'LD (Лідер)', value: 11, isLeader: true });
            deck.push({ id: id++, suit, rank: 'LD (Лідер)', value: 11, isLeader: true });
        });

        // 16. Командир (2 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'CM (Командир)', value: 11, isCommander: true });
            deck.push({ id: id++, suit, rank: 'CM (Командир)', value: 11, isCommander: true });
        });

        // 17. Полководець (2 карти на масть)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'GN (Полководець)', value: 11, isGeneral: true });
            deck.push({ id: id++, suit, rank: 'GN (Полководець)', value: 11, isGeneral: true });
        });

        // 18. Золото (4 карти)
        for (let i = 0; i < 4; i++) {
            deck.push({ id: id++, suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true });
        }

        // 19. Срібло (4 карти)
        for (let i = 0; i < 4; i++) {
            deck.push({ id: id++, suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true });
        }

        // 20. Принцеса (1 на масть = 4 карти)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'PC (Принцеса)', value: 92, isPrincess: true });
        });

        // 21. Принц (1 на масть = 4 карти)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'PRN (Принц)', value: 92, isPrince: true });
        });

        // 22. Каббаліст (2 на масть = 8 карт)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'KB (Каббаліст)', value: 90, isKabbalist: true });
            deck.push({ id: id++, suit, rank: 'KB (Каббаліст)', value: 90, isKabbalist: true });
        });

        // 23. Винахідник (2 на масть = 8 карт)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'INV (Винахідник)', value: 90, isInventor: true });
            deck.push({ id: id++, suit, rank: 'INV (Винахідник)', value: 90, isInventor: true });
        });

        // 24. Пірат (2 на масть)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'PRT (Пірат)', value: 10, isPirate: true });
            deck.push({ id: id++, suit, rank: 'PRT (Пірат)', value: 10, isPirate: true });
        });

        // 25. Скарб (10 на колоду)
        for (let i = 0; i < 10; i++) {
            deck.push({ id: id++, suit: '🗝️', rank: 'TRSR (Скарб)', value: 11, isTreasure: true });
        }

        // 26. Еліксир здоров'я (20 карт в колоді)
        for (let i = 0; i < 20; i++) {
            deck.push({ id: id++, suit: '🧪', rank: 'ELX (Еліксир)', value: 10, isHealthElixir: true });
        }

        // 27. Розбійник (2 на масть)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'RBR (Розбійник)', value: 10, isRobber: true });
            deck.push({ id: id++, suit, rank: 'RBR (Розбійник)', value: 10, isRobber: true });
        });

        // 28. Грабіжник (2 на масть)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'BRG (Грабіжник)', value: 9, isBurglar: true });
            deck.push({ id: id++, suit, rank: 'BRG (Грабіжник)', value: 9, isBurglar: true });
        });

        // 29. Лікар (4 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 4; i++) {
                deck.push({ id: id++, suit, rank: 'DOC (Лікар)', value: 86, isDoctor: true });
            }
        });

        // 30. Знахар (4 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 4; i++) {
                deck.push({ id: id++, suit, rank: 'WDC (Знахар)', value: 86, isWitchDoctor: true });
            }
        });

        // 31. Друїд (3 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'DRD (Друїд)', value: 88, isDruid: true });
            }
        });

        // 32. Шаман (3 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 3; i++) {
                deck.push({ id: id++, suit, rank: 'SHM (Шаман)', value: 88, isShaman: true });
            }
        });

        // 33. Стіна (6 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 6; i++) {
                deck.push({ id: id++, suit, rank: 'WAL (Стіна)', value: 80, isWall: true });
            }
        });

        // 34. Вежа (6 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 6; i++) {
                deck.push({ id: id++, suit, rank: 'TWR (Вежа)', value: 60, isTower: true });
            }
        });

        // 35. Бастіон (6 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 6; i++) {
                deck.push({ id: id++, suit, rank: 'BST (Бастіон)', value: 90, isBastion: true });
            }
        });

        // 36. Замок (6 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 6; i++) {
                deck.push({ id: id++, suit, rank: 'CST (Замок)', value: 95, isCastle: true });
            }
        });

        // 37. Щит (16 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 16; i++) {
                deck.push({ id: id++, suit, rank: 'SHD (Щит)', value: 4, isShield: true });
            }
        });

        // 38. Кат (2 на масть)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'EXC (Кат)', value: 13, isExecutioner: true });
            deck.push({ id: id++, suit, rank: 'EXC (Кат)', value: 13, isExecutioner: true });
        });

        // 39. Ассасін (2 на масть)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'ASN (Ассасін)', value: 14, isAssassin: true });
            deck.push({ id: id++, suit, rank: 'ASN (Ассасін)', value: 14, isAssassin: true });
        });

        // 40. Лучники (4 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 4; i++) {
                deck.push({ id: id++, suit, rank: 'ARC (Лучники)', value: 7, isArcher: true });
            }
        });

        // 41. Арбалетчики (2 на масть)
        CLASSIC_SUITS.forEach(suit => {
            deck.push({ id: id++, suit, rank: 'CRB (Арбалетчики)', value: 10, isCrossbowman: true });
            deck.push({ id: id++, suit, rank: 'CRB (Арбалетчики)', value: 10, isCrossbowman: true });
        });

        // 42. Магнат (4 на масть)
        CLASSIC_SUITS.forEach(suit => {
            for (let i = 0; i < 4; i++) {
                deck.push({ id: id++, suit, rank: 'TYC (Магнат)', value: 90, isTycoon: true });
            }
        });

        // 43. Золота шахта (10 карт на колоду)
        for (let i = 0; i < 10; i++) {
            deck.push({ id: id++, suit: '⛏️', rank: 'GLD_MN (Золота шахта)' as any, value: 80, isGoldMine: true });
        }

        // 44. Срібна шахта (20 карт на колоду)
        for (let i = 0; i < 20; i++) {
            deck.push({ id: id++, suit: '⛏️', rank: 'SLV_MN (Срібна шахта)' as any, value: 75, isSilverMine: true });
        }

        // 45. Шахтарі (25 карт на колоду)
        for (let i = 0; i < 25; i++) {
            deck.push({ id: id++, suit: '⛏️', rank: 'MNR (Шахтарі)' as any, value: 70, isMiners: true });
        }

        // 46. Шукач скарбів (15 карт на колоду)
        for (let i = 0; i < 15; i++) {
            deck.push({ id: id++, suit: '🧭', rank: 'TRSR_HNT (Шукач скарбів)' as any, value: 85, isTreasureHunter: true });
        }

        // 47. Переплавлення (8 рівнів)
        const smeltingConfig = [
            { level: 1, count: 6 },
            { level: 2, count: 5 },
            { level: 3, count: 5 },
            { level: 4, count: 5 },
            { level: 5, count: 5 },
            { level: 6, count: 3 },
            { level: 7, count: 3 },
            { level: 8, count: 4 },
        ];
        smeltingConfig.forEach(cfg => {
            for (let i = 0; i < cfg.count; i++) {
                deck.push({
                    id: id++,
                    suit: '⚒️' as any,
                    rank: `SP (Переплавлення ${cfg.level})` as any,
                    value: 90,
                    isSpell: true,
                    isSmeltingSpell: true,
                    smeltingLevel: cfg.level
                });
            }
        });

        // 48. Вивільнення ресурсів (7 рівнів)
        const releaseConfig = [
            { level: 1, count: 6 },
            { level: 2, count: 5 },
            { level: 3, count: 5 },
            { level: 4, count: 5 },
            { level: 5, count: 5 },
            { level: 6, count: 3 },
            { level: 7, count: 3 },
        ];
        releaseConfig.forEach(cfg => {
            for (let i = 0; i < cfg.count; i++) {
                deck.push({
                    id: id++,
                    suit: '💎' as any,
                    rank: `SP (Вивільнення ${cfg.level})` as any,
                    value: 90,
                    isSpell: true,
                    isResourceReleaseSpell: true,
                    resourceReleaseLevel: cfg.level
                });
            }
        });

        if (deckMode === 'extended') {
            // 2 Magisters: Beat any card, cannot attack or be thrown in
            deck.push({ id: id++, suit: '✨', rank: 'M (Магістр)', value: 95, isMagister: true });
            deck.push({ id: id++, suit: '✨', rank: 'M (Магістр)', value: 95, isMagister: true });
            
            // 1 Grandmaster: Beats any card, locks throwing in after played
            deck.push({ id: id++, suit: '♟️', rank: 'GM (Гросмейстер)', value: 98, isGrandmaster: true });

            // 1 Sharper: Acts as Trump Ace, can be thrown in anytime
            deck.push({ id: id++, suit: '🎩', rank: 'SH (Шулер)', value: 90, isSharper: true });

            // 6 Thieves: Steals high attack card and locks table
            for (let i = 0; i < 6; i++) {
                deck.push({ id: id++, suit: '🗡️', rank: 'TH (Злодій)', value: 92, isThief: true });
            }

            // 4 Sages: Transfers attack to next player
            for (let i = 0; i < 4; i++) {
                deck.push({ id: id++, suit: '📜', rank: 'SG (Мудрець)', value: 94, isSage: true });
            }

            // 10 Mercenaries: Beats anything below Trump 10
            const extendedSuitsForMerc: Suit[] = ['⚔️', '🛡️', '♠', '♥', '♦', '♣', '🔥', '⚡', '👑', '★'];
            for (let i = 0; i < 10; i++) {
                deck.push({ 
                    id: id++, 
                    suit: extendedSuitsForMerc[i % extendedSuitsForMerc.length], 
                    rank: 'MC (Найманець)', 
                    value: 85, 
                    isMercenary: true 
                });
            }
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

export const canBeat = (attackCard: Card, defenseCard: Card, trumpSuits: Suit[], seniorSuit: Suit = SENIOR_SUIT): boolean => {
    const defBonus = defenseCard.strengthBonus || 0;
    const attBonus = attackCard.strengthBonus || 0;
    const effectiveDefVal = (defenseCard.heroLevel ?? defenseCard.value ?? 0) + defBonus;
    const effectiveAttVal = (attackCard.heroLevel ?? attackCard.value ?? 0) + attBonus;

    // Any card with active strength boost can beat an attack card if its effective strength is >= attack card's strength:
    // "будь яка наступна карта битиме з силою +1 / +3 / +10"
    if (defBonus > 0 && effectiveDefVal >= effectiveAttVal) {
        return true;
    }

    // Death, Death Knight, Archbishop, Paladin, Alchemist, Merchant, Gold, Silver, Gambler, Magister, Grandmaster, Thief, Sage, Priest, Bishop, Power Word Kill can beat/act on ANY attack card!
    if (
        defenseCard.isDeathCard ||
        defenseCard.isDeathKnight ||
        defenseCard.isArchbishop || 
        defenseCard.isPaladin || 
        defenseCard.isAlchemist || 
        defenseCard.isMerchant ||
        defenseCard.isGold ||
        defenseCard.isSilver ||
        defenseCard.isGambler || 
        defenseCard.isMagister || 
        defenseCard.isGrandmaster || 
        defenseCard.isThief || 
        defenseCard.isSage || 
        defenseCard.isPriest || 
        defenseCard.isBishop ||
        defenseCard.isPowerWordKill ||
        defenseCard.isKnowledge ||
        defenseCard.isRage ||
        defenseCard.isWall ||
        defenseCard.isTower ||
        defenseCard.isBastion ||
        defenseCard.isCastle ||
        defenseCard.isShield ||
        defenseCard.isPirate ||
        defenseCard.isViking ||
        defenseCard.isRobber ||
        defenseCard.isBurglar
    ) {
        return true;
    }

    // Annihilation spell: beats cards from King and below (value <= 13)
    if (defenseCard.isAnnihilation) {
        return attackCard.value <= 13;
    }

    // Finger of Death spell: beats cards from Jack and below (value <= 11)
    if (defenseCard.isFingerOfDeath) {
        return attackCard.value <= 11;
    }

    // Chill Touch spell: beats cards below 6 (value < 6)
    if (defenseCard.isChillTouch) {
        return attackCard.value < 6;
    }

    // Vampire: beats any card!
    if (attackCard.isVampire) {
        return true;
    }
    // Vampire can be beaten by any card >= 3
    if (defenseCard.isVampire) {
        return attackCard.value >= 3 || trumpSuits.includes(attackCard.suit) || attackCard.suit === seniorSuit || attackCard.suit === 'Joker';
    }

    // Illusion card as attack can be beaten by any card (except another illusion, handled above)
    if (attackCard.isIllusion) {
        return true;
    }

    // Custom Hero Card on defense: beats any card equal to or lower than its power/level (0..99)
    if (defenseCard.isCustomHeroCard) {
        const heroVal = defenseCard.heroLevel ?? defenseCard.value ?? 0;
        return attackCard.value <= heroVal;
    }

    // Hordeling as defense: beats any card with value <= hordeling power (10)
    if (defenseCard.isHordeling) {
        const hordelingVal = defenseCard.value || 10;
        return attackCard.value <= hordelingVal;
    }

    // Custom Hero Card on attack: can be beaten by any card whose value is >= attack hero's power/level
    if (attackCard.isCustomHeroCard) {
        const attackVal = attackCard.heroLevel ?? attackCard.value ?? 0;
        if (defenseCard.isCustomHeroCard) {
            const defenseVal = defenseCard.heroLevel ?? defenseCard.value ?? 0;
            return defenseVal >= attackVal;
        }
        return defenseCard.value >= attackVal;
    }

    // Hero as defense beats like Trump Ace
    if (defenseCard.isHero) {
        if (attackCard.isDeathCard || attackCard.isMagister || attackCard.isGrandmaster || attackCard.isArchbishop) return false;
        return true;
    }

    // Spell (standard): "лише б'є любу карту нижче вальта" (value < 11)
    if (defenseCard.isSpell) {
        return attackCard.value < 11;
    }

    // Trap: "лише відбиває карти 10 і нижче" (value <= 10)
    if (defenseCard.isTrap) {
        return attackCard.value <= 10;
    }

    // Barbarian on attack: "може бути побита 7 і вище"
    if (attackCard.isBarbarian) {
        if (defenseCard.value >= 7 || trumpSuits.includes(defenseCard.suit) || defenseCard.suit === seniorSuit || defenseCard.isEmpowered || defenseCard.suit === 'Joker') {
            return true;
        }
    }

    // Dog or Skeleton or Zombie attack cards
    if (attackCard.isDog) {
        return defenseCard.value >= 1;
    }
    if (attackCard.isSkeleton) {
        if (defenseCard.value >= 3 || trumpSuits.includes(defenseCard.suit) || defenseCard.suit === seniorSuit || defenseCard.isEmpowered) return true;
    }
    if (attackCard.isZombie) {
        if (defenseCard.value >= 4 || trumpSuits.includes(defenseCard.suit) || defenseCard.suit === seniorSuit || defenseCard.isEmpowered) return true;
    }

    // Mercenary: beats anything whose strength is lower than a Trump 10!
    if (defenseCard.isMercenary) {
        if (attackCard.isMagister || attackCard.isGrandmaster || attackCard.isArchbishop || attackCard.isPaladin || attackCard.isDeathCard) return false;
        
        const isAttackTrumpOrSenior = trumpSuits.includes(attackCard.suit) || attackCard.suit === seniorSuit || attackCard.isSharper || attackCard.suit === 'Joker';
        if (isAttackTrumpOrSenior) {
            if (attackCard.value >= 10) {
                return false;
            }
        }
        return true;
    }

    // Jokers rule
    if (defenseCard.suit === 'Joker') {
        if (attackCard.suit === 'Joker') {
            return defenseCard.value > attackCard.value;
        }
        return true; 
    }
    if (attackCard.suit === 'Joker') {
        return false;
    }

    // Sharper as defense acts as Trump Ace
    if (defenseCard.isSharper) {
        if (attackCard.isMagister || attackCard.isGrandmaster || attackCard.isArchbishop || attackCard.isDeathCard) return false;
        return true;
    }
    
    // Check if cards are trumps or senior suit
    const isDefenseTrumpOrSenior = trumpSuits.includes(defenseCard.suit) || defenseCard.suit === seniorSuit || defenseCard.isSharper || defenseCard.isEmpowered || defenseCard.isHero;
    const isAttackTrumpOrSenior = trumpSuits.includes(attackCard.suit) || attackCard.suit === seniorSuit || attackCard.isSharper || attackCard.isEmpowered || attackCard.isHero;

    if (isDefenseTrumpOrSenior) {
        if (!isAttackTrumpOrSenior) {
            return true;
        }
        // Both are trumps / senior suit
        return effectiveDefVal > effectiveAttVal;
    }

    if (isAttackTrumpOrSenior) {
        return false;
    }

    // Normal suit comparison
    if (attackCard.suit === defenseCard.suit) {
        return effectiveDefVal > effectiveAttVal;
    }

    return false;
};

export const isInstantSpellCard = (card: Card): boolean => {
    if (card.isIllusion) return false;
    return !!(
        card.isIllusionCopySpell || 
        card.isImmortalitySpell || 
        card.isEndTurnSpell ||
        card.isSummonGhostSpell || 
        card.isSummonSkeletonsSpell || 
        card.isSummonZombiesSpell ||
        card.isSummonGolemSpell || 
        card.isSummonAnimatronicSpell || 
        card.isSummonAutomatonSpell ||
        card.isMeteorSwarm ||
        card.isManaShield ||
        card.isChainLightning ||
        card.isMassDeath ||
        card.isDeathRay ||
        card.isMindHeist ||
        card.isConversion ||
        card.isHolyCathedral ||
        card.isNorthernWind ||
        card.isHorde ||
        card.isHordeCard ||
        card.isUndeadLord ||
        card.isZombiePlague ||
        card.isTurnToSkeletons ||
        card.isPirateRaid ||
        card.isPirateShip ||
        card.isPirateCrew ||
        card.isUndeadLordSpell ||
        card.isGrandKonungSpell ||
        card.isGreatKhanSpell ||
        card.isZombieApocalypseSpell ||
        card.isInvadersSpell ||
        card.isStormOfSeasSpell ||
        card.isEinherjarSpell ||
        card.isHelArmySpell ||
        card.isVampireSpell ||
        card.isBurnCardSpell ||
        card.isBurnHandSpell ||
        card.isHealthElixir ||
        card.isTreasure ||
        card.isTycoon ||
        card.isGold ||
        card.isSilver ||
        card.isGoldMine ||
        card.isSilverMine ||
        card.isMiners ||
        card.isTreasureHunter ||
        card.isWall ||
        card.isTower ||
        card.isBastion ||
        card.isCastle ||
        card.isShield ||
        card.isSmeltingSpell ||
        card.isResourceReleaseSpell ||
        card.isWeakStrengthBoostSpell ||
        card.isStrengthBoostSpell ||
        card.isStrongStrengthBoostSpell
    );
};

export const getRequiredEternalDiscardCount = (card: Card): number => {
    if (card.isSmeltingSpell) {
        const level = card.smeltingLevel || 1;
        if (level === 1) return 10;
        if (level === 2 || level === 3 || level === 4 || level === 6) return 8;
        if (level === 5) return 6;
        if (level === 7) return 4;
        if (level === 8) return 24;
        return 10;
    }
    if (card.isResourceReleaseSpell) {
        const level = card.resourceReleaseLevel || 1;
        if (level === 1) return 12;
        if (level === 2) return 10;
        if (level === 3 || level === 4) return 8;
        if (level >= 5) return 6;
        return 12;
    }
    return 0;
};

export const canAttackWithCard = (
    card: Card, 
    table: TablePair[], 
    isLockedByGrandmaster: boolean = false,
    isPaladinDefenseLocked: boolean = false,
    actualTrumpSuits: Suit[] = [],
    seniorSuit: Suit = SENIOR_SUIT,
    eternalDiscardCount: number = 0
): boolean => {
    // If card requires cards in eternal discard, verify available count
    const reqEternal = getRequiredEternalDiscardCount(card);
    if (reqEternal > 0 && eternalDiscardCount < reqEternal) return false;

    // Instant spells can always be played on turn
    if (isInstantSpellCard(card)) return true;

    // If table is locked by Grandmaster or Thief, NO ONE can attack or throw in!
    if (isLockedByGrandmaster) return false;

    // Defense-only cards or passive cards cannot start attack or be thrown in!
    if (card.isArchbishop || card.isPriest || card.isBishop || card.isMagister || card.isThief || card.isSage || card.isGambler || card.isTrap || card.isSpell) return false;

    // If Paladin or Death Knight defense locked the bout, attackers can ONLY throw in TRUMPS or senior suit / Jokers / Sharper / Empowered / Hero / Illusion!
    if (isPaladinDefenseLocked && table.length > 0) {
        const isTrump = actualTrumpSuits.includes(card.suit) || card.suit === seniorSuit || card.suit === 'Joker' || card.isSharper || card.isEmpowered || card.isHero || card.isIllusion || card.isDeathKnight;
        if (!isTrump) return false;
    }

    // First card on table: any normal or active attack card can start attack!
    if (table.length === 0) return true;

    // Paladin / Death Knight on attack or present on table allows throwing in ANY card!
    const isPaladinPresentOnTable = table.some(p => p.attack.isPaladin || p.attack.isDeathKnight || (p.defense && (p.defense.isPaladin || p.defense.isDeathKnight)));
    if (card.isPaladin || card.isDeathKnight || isPaladinPresentOnTable) return true;

    // Sharper, Hero, Custom Hero Card, Hordeling, Illusion, Death, Gold, Silver, Knowledge, Rage, Princess, Prince, Kabbalist, Inventor, Wall, Tower, Bastion, Castle, Shield, Doctor, Witch Doctor, Druid, Shaman, Health Elixir, Treasure, Pirate, Viking, Robber, Burglar, and Spells can be thrown in / played AT ANY TIME!
    if (
        card.isSharper || card.isHero || card.isCustomHeroCard || card.isHordeling || card.isIllusion || card.isDeathCard || 
        card.isGold || card.isSilver || card.isGoldMine || card.isSilverMine || card.isMiners || card.isTreasureHunter || card.isKnowledge || card.isRage || 
        card.isPrincess || card.isPrince || card.isKabbalist || card.isInventor ||
        card.isWall || card.isTower || card.isBastion || card.isCastle || card.isShield ||
        card.isDoctor || card.isWitchDoctor || card.isDruid || card.isShaman ||
        card.isHealthElixir || card.isTreasure || card.isTycoon || card.isPirate || card.isViking || card.isRobber || card.isBurglar ||
        card.isLeader || card.isCommander || card.isGeneral || card.isHuntsman || card.isRanger || card.isHunter || card.isTrapper || card.isNecromancer ||
        card.isDrakkar || card.isNomad || card.isZombie || card.isPirateShip || card.isSkeleton || card.isDraugr || card.isHero || card.isDeathKnight || card.isKnight || card.isKing ||
        card.isIllusionCopySpell || card.isImmortalitySpell || card.isEndTurnSpell ||
        card.isSummonGhostSpell || card.isSummonSkeletonsSpell || card.isSummonZombiesSpell ||
        card.isSummonGolemSpell || card.isSummonAnimatronicSpell || card.isSummonAutomatonSpell ||
        card.isSmeltingSpell || card.isResourceReleaseSpell
    ) return true;

    // Otherwise, rank must match any card on the table
    const ranksOnTable = getTableRanks(table);
    return ranksOnTable.includes(card.rank);
};

export const getMinTrumpValue = (hand: Card[], trumpSuits: Suit[]): number => {
    let minVal = 1000;
    hand.forEach(c => {
        if (trumpSuits.includes(c.suit) && c.value < minVal) {
            minVal = c.value;
        }
    });
    return minVal;
};

export const getNextActivePlayerIndex = (
    players: Player[], 
    currentId: number, 
    deckCountOrPrikup?: number | Record<number, any[]>, 
    prikupDecks?: Record<number, any[]>
): number => {
    let currentIndex = players.findIndex(p => p.id === currentId);
    if (currentIndex === -1) currentIndex = 0;

    const actualPrikup = prikupDecks || (typeof deckCountOrPrikup === 'object' ? deckCountOrPrikup : undefined);
    const fallbackDeckCount = typeof deckCountOrPrikup === 'number' ? deckCountOrPrikup : 0;

    let nextIndex = (currentIndex + 1) % players.length;
    let count = 0;
    while (count < players.length) {
        const p = players[nextIndex];
        const hasCardsToDraw = actualPrikup 
            ? ((actualPrikup[p.id]?.length || 0) > 0) 
            : (fallbackDeckCount > 0);
        if (!p.outRank && !p.isEliminated && (p.hand.length > 0 || hasCardsToDraw)) {
            return p.id;
        }
        nextIndex = (nextIndex + 1) % players.length;
        count++;
    }
    return currentId;
};

export const getTableRanks = (table: TablePair[]): Rank[] => {
    return table.flatMap(p => p.defense ? [p.attack.rank, p.defense.rank] : [p.attack.rank]);
};

export const getSortedAttackCards = (
    hand: Card[], 
    table: TablePair[], 
    trumpSuits: Suit[], 
    isLockedByGrandmaster: boolean = false,
    eternalDiscardCount: number = 0
): Card[] => {
    if (isLockedByGrandmaster) return [];

    const validCards = hand.filter(c => canAttackWithCard(c, table, isLockedByGrandmaster, false, trumpSuits, SENIOR_SUIT, eternalDiscardCount));
    if (validCards.length === 0) return [];
    
    // Sort logic: Normal lowest value first, then trumps, then special cards
    return [...validCards].sort((a, b) => {
        const aIsTrump = trumpSuits.includes(a.suit) || a.suit === SENIOR_SUIT || a.suit === 'Joker' || a.isEmpowered;
        const bIsTrump = trumpSuits.includes(b.suit) || b.suit === SENIOR_SUIT || b.suit === 'Joker' || b.isEmpowered;
        const aScore = aIsTrump ? 1000 + a.value : a.value;
        const bScore = bIsTrump ? 1000 + b.value : b.value;
        return aScore - bScore;
    });
};

export const getBestAttackCard = (
    hand: Card[], 
    table: TablePair[], 
    trumpSuits: Suit[], 
    isLockedByGrandmaster: boolean = false,
    eternalDiscardCount: number = 0
): Card | null => {
    const sorted = getSortedAttackCards(hand, table, trumpSuits, isLockedByGrandmaster, eternalDiscardCount);
    return sorted.length > 0 ? sorted[0] : null;
};

export const getSortedDefenseCards = (
    attack: Card, 
    hand: Card[], 
    trumpSuits: Suit[], 
    seniorSuit: Suit = SENIOR_SUIT,
    strengthBoost: number = 0
): Card[] => {
    const validCards = hand.filter(c => {
        const cWithBoost = strengthBoost > 0 ? { ...c, strengthBonus: (c.strengthBonus || 0) + strengthBoost } : c;
        return canBeat(attack, cWithBoost, trumpSuits, seniorSuit);
    });
    if (validCards.length === 0) return [];
    
    return [...validCards].sort((a, b) => {
        // Save Magister, Grandmaster, Gambler, Bishop, Priest, Gold, Silver, etc. for emergency/high value if possible, or use standard cards
        const aSpecialPenalty = a.isMagister ? 2000 : (a.isGrandmaster ? 1800 : (a.isBishop ? 1750 : (a.isGambler ? 1700 : (a.isGold ? 1650 : (a.isSilver ? 1600 : (a.isSage ? 1600 : (a.isPriest ? 1500 : (a.isThief ? 1400 : (a.isMercenary ? 1300 : (a.isSharper ? 1200 : 0))))))))));
        const bSpecialPenalty = b.isMagister ? 2000 : (b.isGrandmaster ? 1800 : (b.isBishop ? 1750 : (b.isGambler ? 1700 : (b.isGold ? 1650 : (b.isSilver ? 1600 : (b.isSage ? 1600 : (b.isPriest ? 1500 : (b.isThief ? 1400 : (b.isMercenary ? 1300 : (b.isSharper ? 1200 : 0))))))))));

        const aIsTrump = trumpSuits.includes(a.suit) || a.suit === seniorSuit || a.suit === 'Joker';
        const bIsTrump = trumpSuits.includes(b.suit) || b.suit === seniorSuit || b.suit === 'Joker';

        const aScore = aSpecialPenalty + (aIsTrump ? 100 + a.value : a.value);
        const bScore = bSpecialPenalty + (bIsTrump ? 100 + b.value : b.value);
        return aScore - bScore;
    });
};

export const getSortedEmpoweredDefenseCandidates = (
    attack: Card,
    hand: Card[],
    trumpSuits: Suit[],
    seniorSuit: Suit = SENIOR_SUIT,
    strengthBoost: number = 0
): Card[] => {
    const nonEmpowered = hand.filter(c => !c.isEmpowered);
    const valid = nonEmpowered.filter(c => {
        const cWithBoost = strengthBoost > 0 ? { ...c, strengthBonus: (c.strengthBonus || 0) + strengthBoost } : c;
        return canBeat(attack, { ...cWithBoost, isEmpowered: true }, trumpSuits, seniorSuit);
    });
    // Sort so lowest base value cards are prioritized for empowerment (saving stronger cards)
    return [...valid].sort((a, b) => {
        const aIsTrump = trumpSuits.includes(a.suit) || a.suit === seniorSuit;
        const bIsTrump = trumpSuits.includes(b.suit) || b.suit === seniorSuit;
        const aScore = (aIsTrump ? 200 : 0) + a.value;
        const bScore = (bIsTrump ? 200 : 0) + b.value;
        return aScore - bScore;
    });
};

export const getBestDefenseCard = (
    attack: Card, 
    hand: Card[], 
    trumpSuits: Suit[], 
    seniorSuit: Suit = SENIOR_SUIT,
    strengthBoost: number = 0
): Card | null => {
    const sorted = getSortedDefenseCards(attack, hand, trumpSuits, seniorSuit, strengthBoost);
    return sorted.length > 0 ? sorted[0] : null;
};

export const canPlayerMakeMove = (
    player: Player, 
    table: TablePair[], 
    defenderId: number, 
    actualTrumpSuits: Suit[], 
    isLockedByGrandmaster: boolean = false,
    seniorSuit: Suit = SENIOR_SUIT,
    isPaladinDefenseLocked: boolean = false,
    eternalDiscardCount: number = 0
): boolean => {
    if (player.outRank || player.isEliminated || player.hand.length === 0) return false;

    // Instant/Summon spells can be cast on player's turn if requirements (like eternal discard) are met
    if (player.hand.some(c => {
        if (!isInstantSpellCard(c)) return false;
        const req = getRequiredEternalDiscardCount(c);
        if (req > 0 && eternalDiscardCount < req) return false;
        return true;
    })) return true;

    // If player is Defender
    if (player.id === defenderId) {
        const undefPair = table.find(p => !p.defense);
        if (undefPair) {
            const boost = player.strengthBoost || 0;
            return player.hand.some(card => {
                const cardWithBoost = boost > 0 ? { ...card, strengthBonus: (card.strengthBonus || 0) + boost } : card;
                return canBeat(undefPair.attack, cardWithBoost, actualTrumpSuits, seniorSuit) ||
                    (player.powerPoints > 0 && !card.isEmpowered && canBeat(undefPair.attack, { ...cardWithBoost, isEmpowered: true }, actualTrumpSuits, seniorSuit));
            });
        }
        return false;
    }

    // If player is Attacker / Co-attacker
    if (isLockedByGrandmaster) return false;

    return player.hand.some(card => canAttackWithCard(card, table, isLockedByGrandmaster, isPaladinDefenseLocked, actualTrumpSuits, seniorSuit));
};

export const getInitialHandSize = (deckMode: DeckMode, playerCount: number): number => {
    if (deckMode === 'extended') return 12;
    if (deckMode === 'tarot') return Math.max(1, Math.min(6, Math.floor(20 / Math.max(1, playerCount))));
    if (deckMode === 'minor_tarot') return 6;
    return Math.max(2, Math.min(6, Math.floor(48 / Math.max(1, playerCount))));
};

// ==========================================
// КОРОЛІВСЬКА ГРА УР (ROYAL GAME OF UR)
// СПЕЦІАЛЬНІ ІСТОРИЧНІ ТАЙЛИ ТА ЇХ ЛОГІКА
// ==========================================

export type UrSpecialTileCategory = 
    | 'cornucopia'       // Ріг достатку / Вази нектару та багатства
    | 'fort_rosette'     // Священна розетка (Форт)
    | 'deity'            // Божественні тайли (Іштар, Мардук)
    | 'royal_realm'      // Царське царство (Ламассу, Бик, Лев)
    | 'eyes_insight'     // Чотири ока спостереження
    | 'dots_abundance'   // П'ять сфер плодючості
    | 'tree_of_life'     // Небесні сади / Древо життя
    | 'warriors'         // Небесні воїни-охоронці
    | 'entrance';        // Ворота малого царства

export interface UrHistoricalTileData {
    id: string;
    name: string;
    historicalTitle: string;
    category: UrSpecialTileCategory;
    icon: string;
    badgeText: string;
    description: string;
    historicalLore: string;
    goldReward?: number;
    grantsExtraRoll?: boolean;
    providesShield?: boolean;
}

export const UR_HISTORICAL_SPECIAL_TILES: Record<string, UrHistoricalTileData> = {
    // РІГ ДОСТАТКУ (CORNUCOPIA)
    'bridge_vases': {
        id: 'bridge_vases',
        name: 'Ріг Достатку Мосту',
        historicalTitle: 'Священна Амфора та Ріг Достатку',
        category: 'cornucopia',
        icon: '🏺',
        badgeText: 'Ріг Достатку',
        description: 'Приносить благословення достатку! Гравець отримує +15 Золота при зупинці.',
        historicalLore: 'У вавилонських та шумерських міфах посудина та ріг достатку символізували невичерпні дари річок Тигр та Євфрат. Фішка, що зупиняється тут, черпає небесне багатство.',
        goldReward: 15
    },
    'heaven_vases': {
        id: 'heaven_vases',
        name: 'Небесний Ріг Достатку',
        historicalTitle: 'Ріг Божественного Достатку Небес',
        category: 'cornucopia',
        icon: '✨',
        badgeText: 'Небесний Достаток',
        description: 'Вершина Небес! Дарує благословення богів та +25 Золота в скарбницю.',
        historicalLore: 'Верховна чаша на вершині дошки Ура, знайдена в царській гробниці цариці Пуабі. Той, хто дістається до неї, знаходить славу і золото.',
        goldReward: 25
    },

    // СВЯЩЕННІ РОЗЕТКИ (ФОРТИ)
    'earth_fort_l': {
        id: 'earth_fort_l',
        name: 'Західний Форт Землі',
        historicalTitle: 'Восьмипелюсткова Розетка Землі',
        category: 'fort_rosette',
        icon: '🌺',
        badgeText: 'Розетка (Форт)',
        description: 'Священна розетка. Зупинка тут дарує негайний додатковий кидок!',
        historicalLore: 'Автентична восьмипелюсткова зірка-розетка, символ богині кохання і війни Інанни. Дарує право додаткового кидка.',
        grantsExtraRoll: true
    },
    'earth_fort_r': {
        id: 'earth_fort_r',
        name: 'Східний Форт Землі',
        historicalTitle: 'Східна Розетка Сонця',
        category: 'fort_rosette',
        icon: '🌺',
        badgeText: 'Розетка (Форт)',
        description: 'Священна розетка. Зупинка тут дарує негайний додатковий кидок!',
        historicalLore: 'Один із чотирьох бастіонів, що контролюють земну твердь. Володіння обома відкриває Панування над Землею.',
        grantsExtraRoll: true
    },
    'heaven_fort_l': {
        id: 'heaven_fort_l',
        name: 'Західний Форт Небес',
        historicalTitle: 'Небесна Розетка Зірок',
        category: 'fort_rosette',
        icon: '🌺',
        badgeText: 'Розетка (Форт)',
        description: 'Небесний Форт. Дарує повторний кидок та наближає до панування над Небом.',
        historicalLore: 'Твердиня у верхній частині дошки. Стримує небесні сили і дарує додатковий хід.',
        grantsExtraRoll: true
    },
    'heaven_fort_r': {
        id: 'heaven_fort_r',
        name: 'Східний Форт Небес',
        historicalTitle: 'Небесна Розетка Світанку',
        category: 'fort_rosette',
        icon: '🌺',
        badgeText: 'Розетка (Форт)',
        description: 'Небесний Форт. Дарує повторний кидок та наближає до панування над Небом.',
        historicalLore: 'Четвертий форт дошки. Утримання всіх чотирьох фортів одночасно забезпечує негайну абсолютну перемогу.',
        grantsExtraRoll: true
    },

    // ТАЙЛ ІШТАР (ТАЙЛ БОГИНІ)
    'tile_ishtar': {
        id: 'tile_ishtar',
        name: 'Тайл Іштар',
        historicalTitle: 'Престол Цариці Небес Іштар',
        category: 'deity',
        icon: '⭐',
        badgeText: 'Щит Іштар',
        description: 'Наймогутніший тайл! Доки ваша фішка тут, усі ваші фішки на Фортах захищені від ворожого збиття.',
        historicalLore: 'Іштар (Інанна) — верховна володарка неба та воїнства. Її присутність захищає союзників у фортах містичною непереможністю.',
        providesShield: true
    },

    // ТАЙЛ МАРДУКА
    'tile_marduk': {
        id: 'tile_marduk',
        name: 'Тайл Мардука',
        historicalTitle: 'Трон Владики Богів Мардука',
        category: 'deity',
        icon: '👑',
        badgeText: 'Мардук',
        description: 'Владика богів. Передова твердиня на мосту між Небом і Землею. Спавн за 2 Золота.',
        historicalLore: 'Мардук — верховний бог Вавилона, переможець первісного хаосу Тіамат. Володіння його тайлом дає стратегічну перевагу на мосту.'
    },

    // ЧОТИРИ ОКА (EYES OF INSIGHT)
    'earth_eyes_l': {
        id: 'earth_eyes_l',
        name: 'Чотири Ока (Захід)',
        historicalTitle: 'Очі Всевидячого Спостереження',
        category: 'eyes_insight',
        icon: '👁️',
        badgeText: 'Ока Мудрості',
        description: 'Символ пильності та мудрості. Охороняє підступи до Царського Царства.',
        historicalLore: 'Історичний геометричний орнамент із 4 кіл з цятками в центрі. За клинописними текстами символізує благословення яснобачення.'
    },
    'earth_eyes_r': {
        id: 'earth_eyes_r',
        name: 'Чотири Ока (Схід)',
        historicalTitle: 'Очі Всевидячого Спостереження',
        category: 'eyes_insight',
        icon: '👁️',
        badgeText: 'Ока Мудрості',
        description: 'Символ пильності та мудрості. Охороняє підступи до Царського Царства.',
        historicalLore: 'Чотири ока богів, звернених на чотири сторони світу для спостереження за долями смертних.'
    },

    // П'ЯТЬ КІЛ (FIVE DOTS)
    'earth_dots_l': {
        id: 'earth_dots_l',
        name: 'П’ять Сфер Достатку (Захід)',
        historicalTitle: 'П’ять Точок Плодючості',
        category: 'dots_abundance',
        icon: '🎲',
        badgeText: 'П’ять Сфер',
        description: 'Символ плодючості та доброго знамення на шляху до мосту.',
        historicalLore: 'На клинописній табличці 177 р. до н.е. цей тайл вважався знаком удачі: «Хто зупиниться тут — знайде їжу і добре питво».'
    },
    'earth_dots_r': {
        id: 'earth_dots_r',
        name: 'П’ять Сфер Достатку (Схід)',
        historicalTitle: 'П’ять Точок Плодючості',
        category: 'dots_abundance',
        icon: '🎲',
        badgeText: 'П’ять Сфер',
        description: 'Символ плодючості та доброго знамення на шляху до мосту.',
        historicalLore: 'П’ять священних небесних світил Месопотамії, що обіцяють мандрівникам сприятливий попутний вітер.'
    },

    // ДРЕВО ЖИТТЯ / НЕБЕСНІ САДИ
    'heaven_trees_l': {
        id: 'heaven_trees_l',
        name: 'Небесні Сади (Захід)',
        historicalTitle: 'Древо Життя Небес',
        category: 'tree_of_life',
        icon: '🌳',
        badgeText: 'Древо Життя',
        description: 'Вічнозелений сад безсмертних богів біля вершини Небес.',
        historicalLore: 'Зображення священних кедрів та пальм, що дарують прохолоду й божественний спокій душам переможців.'
    },
    'heaven_trees_r': {
        id: 'heaven_trees_r',
        name: 'Небесні Сади (Схід)',
        historicalTitle: 'Древо Життя Небес',
        category: 'tree_of_life',
        icon: '🌳',
        badgeText: 'Древо Життя',
        description: 'Вічнозелений сад безсмертних богів біля вершини Небес.',
        historicalLore: 'Східний сад богів біля входу до небесних чертогів. Оберігає форти Небес.'
    },

    // НЕБЕСНІ ВОЇНИ
    'heaven_warriors': {
        id: 'heaven_warriors',
        name: 'Чотири Небесні Воїни',
        historicalTitle: 'Вартові Престолу',
        category: 'warriors',
        icon: '🛡️',
        badgeText: 'Воїни',
        description: 'Чотири духи-охоронці небесного престолу на виході з мосту.',
        historicalLore: 'Чотири крилаті духи-захисники (апкаллу), які стоять на варті між світом людей та чертогами богів.'
    },

    // ЦАРСЬКЕ ЦАРСТВО (ROYAL REALM)
    'royal_realm_1': {
        id: 'royal_realm_1',
        name: 'Царське Царство: Священний Лев',
        historicalTitle: 'Тотем Лева Царів',
        category: 'royal_realm',
        icon: '🦁',
        badgeText: 'Лев Царства',
        description: 'Центральна лінія Землі. Виставлення фішки за кидок Золото + Срібло.',
        historicalLore: 'Лев — символ царської могутності у Шумері й Вавилоні. Захищає центр земної дошки.'
    },
    'royal_realm_2': {
        id: 'royal_realm_2',
        name: 'Царське Царство: Крилатий Бик',
        historicalTitle: 'Тотем Небесного Бика',
        category: 'royal_realm',
        icon: '🐂',
        badgeText: 'Бик Царства',
        description: 'Центральна лінія Землі. Виставлення фішки за кидок Золото + Срібло.',
        historicalLore: 'Крилатий людиноподібний бик Гугаланна, що уособлює незламну міць.'
    },
    'royal_realm_3': {
        id: 'royal_realm_3',
        name: 'Царське Царство: Ламассу',
        historicalTitle: 'Охоронець Ламассу',
        category: 'royal_realm',
        icon: '🦅',
        badgeText: 'Ламассу',
        description: 'Центральна лінія Землі біля південного рубежу. Спавн за Золото + Срібло.',
        historicalLore: 'Крилатий геній-охоронець з головою царя, який захищає вхід до внутрішніх палат палацу.'
    },

    // ВХОДИ
    'entrance_l': {
        id: 'entrance_l',
        name: 'Західний Вхід Малого Царства',
        historicalTitle: 'Брама Смертних',
        category: 'entrance',
        icon: '🚪',
        badgeText: 'Вхід',
        description: 'Вхідні ворота. Гравець завжди може скинути кидок і ввести фішку сюди!',
        historicalLore: 'Земні міські ворота Ура, звідки кожна фішка починає свій священний похід до Небес.'
    },
    'entrance_r': {
        id: 'entrance_r',
        name: 'Східний Вхід Малого Царства',
        historicalTitle: 'Брама Сходу',
        category: 'entrance',
        icon: '🚪',
        badgeText: 'Вхід',
        description: 'Вхідні ворота. Гравець завжди може скинути кидок і ввести фішку сюди!',
        historicalLore: 'Східна брама долини Євфрату, відкрита для нових духів і мандрівників.'
    }
};

export interface UrSpecialTileLandingResult {
    tileData: UrHistoricalTileData;
    goldEarned: number;
    grantsExtraRoll: boolean;
    activatedIshtarShield: boolean;
    logMessage: string;
}

export function evaluateUrTileLanding(
    tileId: string, 
    player: 'player' | 'opponent',
    playerName: string
): UrSpecialTileLandingResult | null {
    const tileData = UR_HISTORICAL_SPECIAL_TILES[tileId];
    if (!tileData) return null;

    let goldEarned = 0;
    let grantsExtraRoll = false;
    let activatedIshtarShield = false;
    let logMessage = '';

    if (tileData.category === 'cornucopia' && tileData.goldReward) {
        goldEarned = tileData.goldReward;
        logMessage = `💰 ${playerName} став на «${tileData.name}» (Ріг Достатку) і отримує +${goldEarned} золота з небесних скарбниць!`;
    } else if (tileData.category === 'fort_rosette') {
        grantsExtraRoll = true;
        logMessage = `🌺 ${playerName} захопив «${tileData.name}»! Отримано священний додатковий кидок!`;
    } else if (tileData.category === 'deity' && tileData.id === 'tile_ishtar') {
        activatedIshtarShield = true;
        logMessage = `🛡️ ${playerName} зайняв «Тайл Іштар»! Усі Форти гравця захищені священним щитом від збиття!`;
    } else if (tileData.category === 'deity' && tileData.id === 'tile_marduk') {
        logMessage = `👑 ${playerName} зійшов на «Тайл Мардука» на вершині мосту!`;
    } else if (tileData.category === 'tree_of_life') {
        logMessage = `🌳 ${playerName} вступив під тінь «Древа Життя Небес»!`;
    } else if (tileData.category === 'eyes_insight') {
        logMessage = `👁️ ${playerName} пройшов повз «Ока Мудрості»! Шлях осяяно яснобаченням.`;
    } else if (tileData.category === 'dots_abundance') {
        logMessage = `🎲 ${playerName} відвідав «Сфери Достатку» — знак доброї долі.`;
    } else {
        logMessage = `✨ ${playerName} перемістився на «${tileData.name}».`;
    }

    return {
        tileData,
        goldEarned,
        grantsExtraRoll,
        activatedIshtarShield,
        logMessage
    };
}




import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    X, 
    Crown, 
    Trophy, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    Swords, 
    Lightbulb, 
    Bot,
    RefreshCw,
    BookOpen
} from 'lucide-react';

export type GameVariant = 
    | 'standard' 
    | 'shatranj' 
    | 'chaturanga' 
    | 'chaturaji' 
    | 'tamerlane' 
    | 'courier' 
    | 'capablanca' 
    | 'carrera' 
    | 'grasshopper' 
    | 'double' 
    | 'cheskers'
    | 'archchess'
    | 'archcourier'
    | 'senterej'
    | 'al_adli'
    | 'sittuyin'
    | 'makruk'
    | 'shatar'
    | 'xiangqi'
    | 'janggi'
    | 'heian_shogi'
    | 'sho_shogi'
    | 'shogi'
    | 'napoleonic'
    | 'fide_napoleonic'
    | 'napoleon_ottomans'
    | 'bachelor';

export type PieceColor = 'white' | 'black' | 'red' | 'green';
export type PieceType = 
    | 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
    | 'farzin' | 'alfil' | 'mantri' | 'gaja' | 'nauka' | 'camel' | 'dabbaba'
    | 'giraffe' | 'picket' | 'vizier' | 'ferz' | 'courier' | 'man' | 'fool'
    | 'archbishop' | 'chancellor' | 'centaur' | 'champion' | 'grasshopper'
    | 'centurion' | 'decurion'
    | 'guard' | 'duke' | 'squirrel' | 'archcourier' | 'crowned_rook'
    | 'cannon' | 'silver_general' | 'gold_general' | 'lance' | 'keima' | 'drunk_elephant' | 'crown_prince'
    | 'promoted_silver' | 'promoted_knight' | 'promoted_lance' | 'promoted_pawn' | 'dragon_king' | 'dragon_horse'
    | 'emperor' | 'marshall' | 'guard_infantry' | 'guard_cavalry' | 'heavy_cavalry' | 'light_cavalry' | 'grenadier' | 'dragoon' | 'heavy_infantry' | 'light_infantry' | 'horse_artillery' | 'foot_artillery'
    | 'cuirassier' | 'carabinier' | 'hussar' | 'lancer' | 'chasseur_cheval' | 'grenadier_cheval' | 'empress_dragoon' | 'mameluke' | 'voltigeur' | 'tirailleur' | 'chasseur_pied' | 'carabinier_pied' | 'artillerie_volante' | 'general' | 'engineer' | 'fortification';

export interface Piece {
    id: string;
    type: PieceType;
    color: PieceColor;
}

export type BoardState = (Piece | null)[][];

export interface Position {
    row: number;
    col: number;
}

export interface Move {
    from: Position;
    to: Position;
    piece: Piece;
    captured?: Piece;
    san?: string;
}

interface ChessModalProps {
    isOpen: boolean;
    variant: GameVariant;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

const VARIANT_INFO: Record<GameVariant, { title: string; origin: string; desc: string }> = {
    standard: { title: 'Класичні Шахи', origin: 'Європа', desc: 'Класична шахівниця 8x8 з рокіровкою, подвійним ходом пішаків, матом та ферзем.' },
    shatranj: { title: 'Стародавній Шатрандж', origin: 'Персія (VI ст.)', desc: 'Шатрандж з Алфілом (стрибок 2 по діагоналі) та Фарзіном (1 крок по діагоналі).' },
    chaturanga: { title: 'Індійська Чатуранга', origin: 'Індія (V ст.)', desc: 'Прабатько шахів: Гаджа (Слон), Ратха (Колісниця) та Падаті (Пішаки). Мату немає — Короля б\'ють безпосередньо!' },
    chaturaji: { title: 'Чатураджі (Човни)', origin: 'Давня Індія', desc: 'Варіант із Човнами (Наука), що стрибають на 2 клітинки по діагоналі. Побиття Раджі завершує гру!' },
    tamerlane: { title: 'Шахи Тамерлана', origin: 'Азія (XIV ст.)', desc: 'Величезне поле 10x11 із Жирафами, Верблюдами, Даббабою та Пикетом.' },
    courier: { title: 'Кур\'єрські Шахи', origin: 'Німеччина (12x8)', desc: 'Середньовічна дошка 12x8 з надшвидким Кур\'єром, Людиною та Блазнем.' },
    capablanca: { title: 'Шахи Капабланки', origin: 'Куба (10x8)', desc: 'Дошка 10x8 з Архієпископом (Слон+Кінь) та Канцлером (Тура+Кінь).' },
    carrera: { title: 'Шахи Карери', origin: 'Італія (1617 р.)', desc: 'Дошка 10x8 з Центавром (Слон+Кінь) та Чемпіоном (Тура+Кінь).' },
    grasshopper: { title: 'Казкові шахи з Коником', origin: 'Fairy Chess', desc: 'Дошка 8x8 із Кониками, які обов\'язково перестрибують 1 фігуру.' },
    double: { title: 'Подвійні Шахи', origin: 'Модерн (16x12)', desc: 'Велика дошка 16x12 з двома королівськими свитами.' },
    cheskers: { title: 'Шашмати (Solomon Golomb 1948)', origin: 'США (1948)', desc: 'Гібрид шашок та шахів! Пішаки й Королі ходять та стрибають діагоналями (із обов\'язковим взяттям), Верблюди та Слони ходять за шаховими правилами.' },
    archchess: { title: 'Шахи Аркчес (Archchess)', origin: 'Модерн (10x10)', desc: 'Епічна дошка 10x10 з могутнім Центуріоном (лине як кінь та стрибає на 2), спритним Декуріоном та особливими двокроковими пішаками.' },
    archcourier: { title: 'Шахи Архкур\'єр (ArchCourier Chess)', origin: 'Модерн (12x8)', desc: 'Великі тактичні шахи 12x8 з новими активними фігурами: Охоронцем, Герцогом, Білкою, Архкур\'єром та Коронованою Турою.' },
    senterej: { title: 'Сентереж (Ефіопські шахи)', origin: 'Ефіопія', desc: 'Ефіопська версія шатранджу. Падіння фігур супроводжується особливими правилами перетворення.' },
    al_adli: { title: 'Індійські шахи IX століття', origin: 'Арабський Халіфат (IX ст.)', desc: 'Історична версія Аль-Адлі з могутніми Даббабами по краях дошки.' },
    sittuyin: { title: 'Сіттуїн (Бірманські шахи)', origin: 'М\'янма (Бірма)', desc: 'Традиційна бірманська гра на нешаховому полі 8x8 з 16 відміченими діагоналями (Sit-ke-myin). Початковий розклад копіює бойові порядки: висунуті вперед солдати Не, слони Сін, коні Миїн, колісниці Ятта та генерал Сіт-ке.' },
    makruk: { title: 'Макрук (Таїландські шахи)', origin: 'Таїланд (Сіам)', desc: 'Традиційні сіамські шахи з пішаками на 3-й лінії та унікальними шляхетними фігурами (Khon).' },
    shatar: { title: 'Шатар (Монгольські шахи)', origin: 'Монголія', desc: 'Монгольські степові шахи, де фігура Берс ходить як дракон, а пішаки мають суворі дебютні правила.' },
    xiangqi: { title: 'Сянци (Китайські шахи)', origin: 'Китай', desc: 'Популярна азійська гра на розлінованій дошці з Гарматами, Палацом для Генерала та Річкою посередині.' },
    janggi: { title: 'Чангі (Корейські шахи)', origin: 'Корея', desc: 'Корейський варіант сянци, де Гармати стрибають одна через одну, а Слони ковзають по широкій траєкторії.' },
    heian_shogi: { title: 'Хейан Сьогі', origin: 'Японія (X ст.)', desc: 'Перші історичні японські шахи 8x8 зі Срібними й Золотими Генералами та Списами.' },
    sho_shogi: { title: 'Шо Сьогі (Малі Сьогі)', origin: 'Японія (XVI ст.)', desc: 'Середньовічні сьогі 9x9 з П\'яним Слоном, що перетворюється на спадкоємного принца.' },
    shogi: { title: 'Сучасні Сьогі', origin: 'Японія', desc: 'Класичні японські шахи 9x9 з можливістю скидання захоплених фігур на будь-яку вільну клітину.' },
    napoleonic: { title: 'Наполеонівські Шахи', origin: 'Франція (14x14)', desc: 'Масштабна тактична гра 14x14 з 12 унікальними військовими підрозділами, саперами, річкою, мостами та укріпленнями.' },
    fide_napoleonic: { title: 'Наполеонівські Шахи FIDE (8x8)', origin: 'Франція (8x8)', desc: 'Військові шахи 8x8 з Імператором, Маршалом, Гвардійською піхотою/кавалерією, Важкою (Knightrider) та Легкою (Camel) кавалерією, Кінною та Пішою (Pao) артилерією, Гренадерами, Драгунами та Піхотою (з перетворенням у Гвардію/Драгунів).' },
    napoleon_ottomans: { title: 'Наполеон і Османи (10x10)', origin: 'Франція / Османська Імперія (10x10)', desc: 'Великі шахи 10x10 за правилами Великих Турецьких Шахів: Французька імперська армія Наполеона проти Османських військ Султана.' },
    bachelor: { title: 'Шахи Холостяка (Bachelor Chess 7x6)', origin: 'Європа / Модерн (7x6)', desc: 'Гра 7x6 за правилами FIDE: Король шукає Королеву! Перемога здобувається «Одруженням» — якщо Король опиняється на сусідній клітинці з дружньою Королевою. На 6-й горизонталі будь-яка Тура, Слон, Кінь чи Ферзь можуть перетворитися (або понизитися) у Ферзя, Слона, Туру чи Коня. Пішаки ходять лише на 1 клітинку вперед (без подвійного ходу та взяття на проході).' }
};

// Piece metadata for clear UI identification
const PIECE_META: Record<PieceType, { label: string; symbol: string; badge: string }> = {
    king: { label: 'Король', symbol: '♔', badge: 'Кр' },
    queen: { label: 'Ферзь', symbol: '♕', badge: 'Ф' },
    rook: { label: 'Тура', symbol: '♖', badge: 'Т' },
    bishop: { label: 'Слон', symbol: '♗', badge: 'С' },
    knight: { label: 'Кінь', symbol: '♘', badge: 'К' },
    pawn: { label: 'Пішак', symbol: '♙', badge: 'П' },
    farzin: { label: 'Фарзін', symbol: '♕', badge: 'Фз' },
    alfil: { label: 'Алфіл', symbol: '🐘', badge: 'Ал' },
    mantri: { label: 'Мантрі', symbol: '♕', badge: 'Мн' },
    gaja: { label: 'Гаджа', symbol: '🐘', badge: 'Сн' },
    nauka: { label: 'Наука (Човен)', symbol: '⛵', badge: 'Чв' },
    camel: { label: 'Верблюд', symbol: '🐪', badge: 'В' },
    dabbaba: { label: 'Даббаба', symbol: '🏰', badge: 'Дб' },
    giraffe: { label: 'Жирафа', symbol: '🦒', badge: 'Ж' },
    picket: { label: 'Пикет', symbol: '🎯', badge: 'Пк' },
    vizier: { label: 'Візир', symbol: '📜', badge: 'Вз' },
    ferz: { label: 'Ферз', symbol: '👑', badge: 'Фз' },
    courier: { label: 'Кур\'єр', symbol: '⚡', badge: 'Кр' },
    man: { label: 'Людина', symbol: '🛡️', badge: 'Л' },
    fool: { label: 'Блазень', symbol: '🎭', badge: 'Б' },
    archbishop: { label: 'Архієпископ', symbol: '🦄', badge: 'Ап' },
    chancellor: { label: 'Канцлер', symbol: '🛡️', badge: 'Кц' },
    centaur: { label: 'Кентавр', symbol: '🦄', badge: 'Кн' },
    champion: { label: 'Чемпіон', symbol: '🛡️', badge: 'Чм' },
    grasshopper: { label: 'Коник', symbol: '🦗', badge: 'Кк' },
    centurion: { label: 'Центуріон', symbol: '⚔️', badge: 'Ц' },
    decurion: { label: 'Декуріон', symbol: '🛡️', badge: 'Д' },
    guard: { label: 'Охоронець', symbol: '🛡️', badge: 'Ох' },
    duke: { label: 'Герцог', symbol: '🪖', badge: 'Гц' },
    squirrel: { label: 'Білка', symbol: '🐿️', badge: 'Бл' },
    archcourier: { label: 'Архкур\'єр', symbol: '⚡', badge: 'Ак' },
    crowned_rook: { label: 'Коронована Тура', symbol: '🏰', badge: 'Кт' },
    cannon: { label: 'Гармата', symbol: '💣', badge: 'Гм' },
    silver_general: { label: 'Срібний Генерал', symbol: '🥈', badge: 'Ср' },
    gold_general: { label: 'Золотий Генерал', symbol: '🥇', badge: 'Зл' },
    lance: { label: 'Спис', symbol: '🏹', badge: 'Сп' },
    keima: { label: 'Кейма', symbol: '🐎', badge: 'Км' },
    drunk_elephant: { label: 'П\'яний Слон', symbol: '🐘', badge: 'Пс' },
    crown_prince: { label: 'Принц', symbol: '👑', badge: 'Пр' },
    promoted_silver: { label: 'Просунутий Срібний', symbol: '🥈', badge: '+С' },
    promoted_knight: { label: 'Просунутий Кінь', symbol: '🐎', badge: '+К' },
    promoted_lance: { label: 'Просунутий Спис', symbol: '🏹', badge: '+Сп' },
    promoted_pawn: { label: 'Токін', symbol: '♙', badge: 'Тк' },
    dragon_king: { label: 'Королівський Дракон', symbol: '🐉', badge: 'Кд' },
    dragon_horse: { label: 'Драконячий Кінь', symbol: '🦄', badge: 'Дк' },
    emperor: { label: 'Імператор', symbol: '👑', badge: 'Імп' },
    marshall: { label: 'Маршал', symbol: '🎖️', badge: 'Мш' },
    guard_infantry: { label: 'Гвардійська піхота', symbol: '💂', badge: 'ГП' },
    guard_cavalry: { label: 'Гвардійська кавалерія', symbol: '🏇', badge: 'ГК' },
    heavy_cavalry: { label: 'Важка кавалерія', symbol: '🛡️', badge: 'ВК' },
    light_cavalry: { label: 'Легка кавалерія', symbol: '🐎', badge: 'ЛК' },
    grenadier: { label: 'Гренадер', symbol: '💣', badge: 'Гр' },
    dragoon: { label: 'Драгун', symbol: '🏇', badge: 'Др' },
    heavy_infantry: { label: 'Важка піхота', symbol: '♙', badge: 'ВП' },
    light_infantry: { label: 'Легка піхота', symbol: '🏃', badge: 'ЛП' },
    horse_artillery: { label: 'Кінна артилерія', symbol: '🔥', badge: 'КА' },
    foot_artillery: { label: 'Піша артилерія', symbol: '💥', badge: 'ПА' },
    cuirassier: { label: 'Кірасир', symbol: '🛡️', badge: 'Кір' },
    carabinier: { label: 'Карабінер-вершник', symbol: '👑', badge: 'Крб' },
    hussar: { label: 'Гусар', symbol: '🐎', badge: 'Гус' },
    lancer: { label: 'Улан (пікінер)', symbol: '🔱', badge: 'Ул' },
    chasseur_cheval: { label: 'Кінний єгер', symbol: '🏇', badge: 'КЄг' },
    grenadier_cheval: { label: 'Кінний гренадер', symbol: '💣', badge: 'КГр' },
    empress_dragoon: { label: 'Драгун Імператриці', symbol: '🦄', badge: 'ДІм' },
    mameluke: { label: 'Мамелюк', symbol: '⚔️', badge: 'Мам' },
    voltigeur: { label: 'Вольтижер', symbol: '🎯', badge: 'Влт' },
    tirailleur: { label: 'Тиральєр', symbol: '🏹', badge: 'Тир' },
    chasseur_pied: { label: 'Піший єгер', symbol: '🏃', badge: 'ПЄг' },
    carabinier_pied: { label: 'Піший карабінер', symbol: '💂', badge: 'ПКр' },
    artillerie_volante: { label: 'Летюча артилерія', symbol: '⚡', badge: 'ЛАр' },
    general: { label: 'Генерал', symbol: '👑', badge: 'Ген' },
    engineer: { label: 'Сапер (інженер)', symbol: '🛠️', badge: 'Інж' },
    fortification: { label: 'Укріплення', symbol: '🏯', badge: 'Форт' }
};

export function createInitialBoard(variant: GameVariant): BoardState {
    if (variant === 'cheskers') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));

        // Black back rank (row 0 = rank 8)
        // b8 = Camel (col 1), d8 = King (col 3), f8 = King (col 5), h8 = Bishop (col 7)
        b[0][1] = { id: 'b_camel', type: 'camel', color: 'black' };
        b[0][3] = { id: 'b_king1', type: 'king', color: 'black' };
        b[0][5] = { id: 'b_king2', type: 'king', color: 'black' };
        b[0][7] = { id: 'b_bishop', type: 'bishop', color: 'black' };

        // Black pawns (row 1 & 2 = rank 7 & 6)
        // rank 7 (row 1): a7 (0), c7 (2), e7 (4), g7 (6)
        [0, 2, 4, 6].forEach(c => { b[1][c] = { id: `b_p1_${c}`, type: 'pawn', color: 'black' }; });
        // rank 6 (row 2): b6 (1), d6 (3), f6 (5), h6 (7)
        [1, 3, 5, 7].forEach(c => { b[2][c] = { id: `b_p2_${c}`, type: 'pawn', color: 'black' }; });

        // White pawns (row 5 & 6 = rank 3 & 2)
        // rank 3 (row 5): a3 (0), c3 (2), e3 (4), g3 (6)
        [0, 2, 4, 6].forEach(c => { b[5][c] = { id: `w_p1_${c}`, type: 'pawn', color: 'white' }; });
        // rank 2 (row 6): b2 (1), d2 (3), f2 (5), h2 (7)
        [1, 3, 5, 7].forEach(c => { b[6][c] = { id: `w_p2_${c}`, type: 'pawn', color: 'white' }; });

        // White back rank (row 7 = rank 1)
        // a1 = Bishop (col 0), c1 = King (col 2), e1 = King (col 4), g1 = Camel (col 6)
        b[7][0] = { id: 'w_bishop', type: 'bishop', color: 'white' };
        b[7][2] = { id: 'w_king1', type: 'king', color: 'white' };
        b[7][4] = { id: 'w_king2', type: 'king', color: 'white' };
        b[7][6] = { id: 'w_camel', type: 'camel', color: 'white' };

        return b;
    }

    if (variant === 'double') {
        const rows = 12;
        const cols = 16;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook', 'rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
            b[10][col] = { id: `w_10_${col}`, type: 'pawn', color: 'white' };
            b[11][col] = { id: `w_11_${col}`, type, color: 'white' };
        });
        return b;
    }

    if (variant === 'tamerlane') {
        const rows = 10;
        const cols = 11;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));

        b[0][0] = { id: 'b_0_0', type: 'alfil', color: 'black' };
        b[0][2] = { id: 'b_0_2', type: 'camel', color: 'black' };
        b[0][4] = { id: 'b_0_4', type: 'dabbaba', color: 'black' };
        b[0][6] = { id: 'b_0_6', type: 'dabbaba', color: 'black' };
        b[0][8] = { id: 'b_0_8', type: 'camel', color: 'black' };
        b[0][10] = { id: 'b_0_10', type: 'alfil', color: 'black' };

        const bRow1: PieceType[] = ['rook', 'knight', 'picket', 'giraffe', 'vizier', 'king', 'queen', 'giraffe', 'picket', 'knight', 'rook'];
        bRow1.forEach((type, col) => { b[1][col] = { id: `b_1_${col}`, type, color: 'black' }; });

        for (let col = 0; col < cols; col++) {
            b[2][col] = { id: `b_2_${col}`, type: 'pawn', color: 'black' };
            b[7][col] = { id: `w_7_${col}`, type: 'pawn', color: 'white' };
        }

        const wRow8: PieceType[] = ['rook', 'knight', 'picket', 'giraffe', 'queen', 'king', 'vizier', 'giraffe', 'picket', 'knight', 'rook'];
        wRow8.forEach((type, col) => { b[8][col] = { id: `w_8_${col}`, type, color: 'white' }; });

        b[9][0] = { id: 'w_9_0', type: 'alfil', color: 'white' };
        b[9][2] = { id: 'w_9_2', type: 'camel', color: 'white' };
        b[9][4] = { id: 'w_9_4', type: 'dabbaba', color: 'white' };
        b[9][6] = { id: 'w_9_6', type: 'dabbaba', color: 'white' };
        b[9][8] = { id: 'w_9_8', type: 'camel', color: 'white' };
        b[9][10] = { id: 'w_9_10', type: 'alfil', color: 'white' };

        return b;
    }

    if (variant === 'courier') {
        const rows = 8;
        const cols = 12;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'courier', 'man', 'queen', 'king', 'fool', 'courier', 'bishop', 'knight', 'rook'];
        
        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
            b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
        });
        return b;
    }

    if (variant === 'capablanca') {
        const rows = 8;
        const cols = 10;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const backRow: PieceType[] = ['rook', 'knight', 'archbishop', 'bishop', 'queen', 'king', 'bishop', 'chancellor', 'knight', 'rook'];

        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
            b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
        });
        return b;
    }

    if (variant === 'carrera') {
        const rows = 8;
        const cols = 10;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const backRow: PieceType[] = ['rook', 'knight', 'centaur', 'bishop', 'queen', 'king', 'bishop', 'champion', 'knight', 'rook'];

        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
            b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
        });
        return b;
    }

    if (variant === 'archchess') {
        const rows = 10;
        const cols = 10;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'centurion', 'king', 'queen', 'decurion', 'bishop', 'knight', 'rook'];

        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
            b[8][col] = { id: `w_8_${col}`, type: 'pawn', color: 'white' };
            b[9][col] = { id: `w_9_${col}`, type, color: 'white' };
        });
        return b;
    }

    if (variant === 'archcourier') {
        const rows = 8;
        const cols = 12;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const backRow: PieceType[] = ['rook', 'knight', 'archcourier', 'bishop', 'duke', 'queen', 'king', 'squirrel', 'bishop', 'crowned_rook', 'knight', 'rook'];

        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
        });

        for (let col = 0; col < cols; col++) {
            if (col === 6) {
                b[1][col] = { id: 'b_guard', type: 'guard', color: 'black' };
                b[6][col] = { id: 'w_guard', type: 'guard', color: 'white' };
                b[2][col] = { id: 'b_pawn_g6', type: 'pawn', color: 'black' };
                b[5][col] = { id: 'w_pawn_g3', type: 'pawn', color: 'white' };
            } else {
                b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
                b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
            }
        }
        return b;
    }

    if (variant === 'senterej') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const whiteBack: PieceType[] = ['rook', 'knight', 'alfil', 'farzin', 'king', 'alfil', 'knight', 'rook'];
        const blackBack: PieceType[] = ['rook', 'knight', 'alfil', 'king', 'farzin', 'alfil', 'knight', 'rook'];
        whiteBack.forEach((type, col) => {
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
            b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
        });
        blackBack.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
        });
        return b;
    }

    if (variant === 'al_adli') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const backRow: PieceType[] = ['dabbaba', 'knight', 'rook', 'ferz', 'king', 'rook', 'knight', 'dabbaba'];
        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
            b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
        });
        return b;
    }

    if (variant === 'sittuyin') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        // Pawns (Nè): For each player, 4 pawns at 3rd row to player's left, 4 pawns at 4th row to player's right
        for (let c = 0; c < 4; c++) {
            b[5][c] = { id: `w_p_${c}`, type: 'pawn', color: 'white' };
            b[3][c] = { id: `b_p_${c}`, type: 'pawn', color: 'black' };
        }
        for (let c = 4; c < 8; c++) {
            b[4][c] = { id: `w_p_${c}`, type: 'pawn', color: 'white' };
            b[2][c] = { id: `b_p_${c}`, type: 'pawn', color: 'black' };
        }
        
        // White non-pawn pieces
        b[7][0] = { id: 'w_r_1', type: 'rook', color: 'white' };
        b[7][1] = { id: 'w_r_2', type: 'rook', color: 'white' };
        b[6][2] = { id: 'w_f_1', type: 'ferz', color: 'white' };
        b[6][3] = { id: 'w_k_1', type: 'king', color: 'white' };
        b[6][4] = { id: 'w_n_1', type: 'knight', color: 'white' };
        b[6][5] = { id: 'w_n_2', type: 'knight', color: 'white' };
        b[6][6] = { id: 'w_s_1', type: 'silver_general', color: 'white' };
        b[6][7] = { id: 'w_s_2', type: 'silver_general', color: 'white' };

        // Black non-pawn pieces
        b[0][7] = { id: 'b_r_1', type: 'rook', color: 'black' };
        b[0][6] = { id: 'b_r_2', type: 'rook', color: 'black' };
        b[1][5] = { id: 'b_f_1', type: 'ferz', color: 'black' };
        b[1][4] = { id: 'b_k_1', type: 'king', color: 'black' };
        b[1][3] = { id: 'b_n_1', type: 'knight', color: 'black' };
        b[1][2] = { id: 'b_n_2', type: 'knight', color: 'black' };
        b[1][1] = { id: 'b_s_1', type: 'silver_general', color: 'black' };
        b[1][0] = { id: 'b_s_2', type: 'silver_general', color: 'black' };
        return b;
    }

    if (variant === 'makruk') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const whiteBack: PieceType[] = ['rook', 'knight', 'silver_general', 'king', 'ferz', 'silver_general', 'knight', 'rook'];
        const blackBack: PieceType[] = ['rook', 'knight', 'silver_general', 'ferz', 'king', 'silver_general', 'knight', 'rook'];
        whiteBack.forEach((type, col) => {
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
            b[5][col] = { id: `w_5_${col}`, type: 'pawn', color: 'white' };
        });
        blackBack.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[2][col] = { id: `b_2_${col}`, type: 'pawn', color: 'black' };
        });
        return b;
    }

    if (variant === 'shatar') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'dragon_king', 'king', 'bishop', 'knight', 'rook'];
        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
            b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
        });
        return b;
    }

    if (variant === 'xiangqi') {
        const rows = 10;
        const cols = 9;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const backRow: PieceType[] = ['rook', 'knight', 'alfil', 'ferz', 'king', 'ferz', 'alfil', 'knight', 'rook'];
        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[9][col] = { id: `w_9_${col}`, type, color: 'white' };
        });
        b[2][1] = { id: 'b_can_1', type: 'cannon', color: 'black' };
        b[2][7] = { id: 'b_can_2', type: 'cannon', color: 'black' };
        b[7][1] = { id: 'w_can_1', type: 'cannon', color: 'white' };
        b[7][7] = { id: 'w_can_2', type: 'cannon', color: 'white' };
        [0, 2, 4, 6, 8].forEach(col => {
            b[3][col] = { id: `b_p_${col}`, type: 'pawn', color: 'black' };
            b[6][col] = { id: `w_p_${col}`, type: 'pawn', color: 'white' };
        });
        return b;
    }

    if (variant === 'janggi') {
        const rows = 10;
        const cols = 9;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        // Janggi back row setup: Rook, Elephant (Sang), Horse (Ma), Guard (Sa), EMPTY, Guard (Sa), Horse (Ma), Elephant (Sang), Rook
        const backRowCols = [0, 1, 2, 3, 5, 6, 7, 8];
        const backRowTypes: PieceType[] = ['rook', 'alfil', 'knight', 'ferz', 'ferz', 'knight', 'alfil', 'rook'];
        backRowCols.forEach((col, idx) => {
            const type = backRowTypes[idx];
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[9][col] = { id: `w_9_${col}`, type, color: 'white' };
        });
        // King stands at the center of each Palace
        b[1][4] = { id: 'b_1_4', type: 'king', color: 'black' };
        b[8][4] = { id: 'w_8_4', type: 'king', color: 'white' };

        // Cannons (Po)
        b[2][1] = { id: 'b_can_1', type: 'cannon', color: 'black' };
        b[2][7] = { id: 'b_can_2', type: 'cannon', color: 'black' };
        b[7][1] = { id: 'w_can_1', type: 'cannon', color: 'white' };
        b[7][7] = { id: 'w_can_2', type: 'cannon', color: 'white' };

        // Pawns (Jol / Byeong)
        [0, 2, 4, 6, 8].forEach(col => {
            b[3][col] = { id: `b_p_${col}`, type: 'pawn', color: 'black' };
            b[6][col] = { id: `w_p_${col}`, type: 'pawn', color: 'white' };
        });
        return b;
    }

    if (variant === 'heian_shogi') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const whiteBack: PieceType[] = ['lance', 'keima', 'silver_general', 'king', 'gold_general', 'silver_general', 'keima', 'lance'];
        const blackBack: PieceType[] = ['lance', 'keima', 'silver_general', 'gold_general', 'king', 'silver_general', 'keima', 'lance'];
        whiteBack.forEach((type, col) => {
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
            b[5][col] = { id: `w_5_${col}`, type: 'pawn', color: 'white' };
        });
        blackBack.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[2][col] = { id: `b_2_${col}`, type: 'pawn', color: 'black' };
        });
        return b;
    }

    if (variant === 'sho_shogi') {
        const rows = 9;
        const cols = 9;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const whiteBack: PieceType[] = ['lance', 'keima', 'silver_general', 'gold_general', 'king', 'gold_general', 'silver_general', 'keima', 'lance'];
        const blackBack: PieceType[] = ['lance', 'keima', 'silver_general', 'gold_general', 'king', 'gold_general', 'silver_general', 'keima', 'lance'];
        whiteBack.forEach((type, col) => {
            b[8][col] = { id: `w_8_${col}`, type, color: 'white' };
            b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
        });
        blackBack.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[2][col] = { id: `b_2_${col}`, type: 'pawn', color: 'black' };
        });
        b[7][1] = { id: 'w_bishop', type: 'bishop', color: 'white' };
        b[7][4] = { id: 'w_drunk_elephant', type: 'drunk_elephant', color: 'white' };
        b[7][7] = { id: 'w_rook', type: 'rook', color: 'white' };
        b[1][1] = { id: 'b_bishop', type: 'bishop', color: 'black' };
        b[1][4] = { id: 'b_drunk_elephant', type: 'drunk_elephant', color: 'black' };
        b[1][7] = { id: 'b_rook', type: 'rook', color: 'black' };
        return b;
    }

    if (variant === 'shogi') {
        const rows = 9;
        const cols = 9;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        const whiteBack: PieceType[] = ['lance', 'keima', 'silver_general', 'gold_general', 'king', 'gold_general', 'silver_general', 'keima', 'lance'];
        const blackBack: PieceType[] = ['lance', 'keima', 'silver_general', 'gold_general', 'king', 'gold_general', 'silver_general', 'keima', 'lance'];
        whiteBack.forEach((type, col) => {
            b[8][col] = { id: `w_8_${col}`, type, color: 'white' };
            b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
        });
        blackBack.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[2][col] = { id: `b_2_${col}`, type: 'pawn', color: 'black' };
        });
        b[7][1] = { id: 'w_bishop', type: 'bishop', color: 'white' };
        b[7][7] = { id: 'w_rook', type: 'rook', color: 'white' };
        b[1][1] = { id: 'b_bishop', type: 'bishop', color: 'black' };
        b[1][7] = { id: 'b_rook', type: 'rook', color: 'black' };
        return b;
    }

    if (variant === 'chaturaji') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));

        // Red (Top Left - Row 0 & 1, cols 0..3)
        b[0][0] = { id: 'r_king', type: 'king', color: 'red' };
        b[0][1] = { id: 'r_gaja', type: 'gaja', color: 'red' };
        b[0][2] = { id: 'r_knight', type: 'knight', color: 'red' };
        b[0][3] = { id: 'r_nauka', type: 'nauka', color: 'red' };
        for (let c = 0; c < 4; c++) b[1][c] = { id: `r_p_${c}`, type: 'pawn', color: 'red' };

        // Black (Top Right - Row 0 & 1, cols 4..7)
        b[0][7] = { id: 'b_king', type: 'king', color: 'black' };
        b[1][7] = { id: 'b_gaja', type: 'gaja', color: 'black' };
        b[2][7] = { id: 'b_knight', type: 'knight', color: 'black' };
        b[3][7] = { id: 'b_nauka', type: 'nauka', color: 'black' };
        for (let r = 0; r < 4; r++) b[r][6] = { id: `b_p_${r}`, type: 'pawn', color: 'black' };

        // Green (Bottom Right - Row 6 & 7, cols 4..7)
        b[7][7] = { id: 'g_king', type: 'king', color: 'green' };
        b[7][6] = { id: 'g_gaja', type: 'gaja', color: 'green' };
        b[7][5] = { id: 'g_knight', type: 'knight', color: 'green' };
        b[7][4] = { id: 'g_nauka', type: 'nauka', color: 'green' };
        for (let c = 4; c < 8; c++) b[6][c] = { id: `g_p_${c}`, type: 'pawn', color: 'green' };

        // White (Bottom Left - Row 6 & 7, cols 0..3)
        b[7][0] = { id: 'w_king', type: 'king', color: 'white' };
        b[6][0] = { id: 'w_gaja', type: 'gaja', color: 'white' };
        b[5][0] = { id: 'w_knight', type: 'knight', color: 'white' };
        b[4][0] = { id: 'w_nauka', type: 'nauka', color: 'white' };
        for (let r = 4; r < 8; r++) b[r][1] = { id: `w_p_${r}`, type: 'pawn', color: 'white' };

        return b;
    }

    if (variant === 'shatranj' || variant === 'chaturanga') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));

        const isShatranj = variant === 'shatranj';
        const advisorType: PieceType = isShatranj ? 'farzin' : 'mantri';
        const elephantType: PieceType = isShatranj ? 'alfil' : 'gaja';

        const backRow: PieceType[] = ['rook', 'knight', elephantType, advisorType, 'king', elephantType, 'knight', 'rook'];

        backRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
            b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
        });

        return b;
    }

    if (variant === 'napoleonic') {
        const rows = 14;
        const cols = 14;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));

        // White back line (rank 1 / row 13): f1 (HA), g1 (FA), h1 (FA), i1 (HA)
        b[13][5] = { id: 'w_ha1', type: 'horse_artillery', color: 'white' };
        b[13][6] = { id: 'w_fa1', type: 'foot_artillery', color: 'white' };
        b[13][7] = { id: 'w_fa2', type: 'foot_artillery', color: 'white' };
        b[13][8] = { id: 'w_ha2', type: 'horse_artillery', color: 'white' };

        // White rank 2 (row 12): a2 (li), c2 (LC), d2 (HC), e2 (GC), f2 (GI), g2 (E), h2 (M), i2 (GI), j2 (GC), k2 (HC), l2 (LC), n2 (li)
        b[12][0] = { id: 'w_li1', type: 'light_infantry', color: 'white' };
        b[12][2] = { id: 'w_lc1', type: 'light_cavalry', color: 'white' };
        b[12][3] = { id: 'w_hc1', type: 'heavy_cavalry', color: 'white' };
        b[12][4] = { id: 'w_gc1', type: 'guard_cavalry', color: 'white' };
        b[12][5] = { id: 'w_gi1', type: 'guard_infantry', color: 'white' };
        b[12][6] = { id: 'w_emp', type: 'emperor', color: 'white' };
        b[12][7] = { id: 'w_mar', type: 'marshall', color: 'white' };
        b[12][8] = { id: 'w_gi2', type: 'guard_infantry', color: 'white' };
        b[12][9] = { id: 'w_gc2', type: 'guard_cavalry', color: 'white' };
        b[12][10] = { id: 'w_hc2', type: 'heavy_cavalry', color: 'white' };
        b[12][11] = { id: 'w_lc2', type: 'light_cavalry', color: 'white' };
        b[12][13] = { id: 'w_li2', type: 'light_infantry', color: 'white' };

        // White rank 3 (row 11): b3-f3 (hi), g3-h3 (D), i3-m3 (hi)
        for (let c = 1; c <= 5; c++) b[11][c] = { id: `w_hi_${c}`, type: 'heavy_infantry', color: 'white' };
        b[11][6] = { id: 'w_dr1', type: 'dragoon', color: 'white' };
        b[11][7] = { id: 'w_dr2', type: 'dragoon', color: 'white' };
        for (let c = 8; c <= 12; c++) b[11][c] = { id: `w_hi_${c}`, type: 'heavy_infantry', color: 'white' };

        // White rank 4 (row 10): g4 (g), h4 (g)
        b[10][6] = { id: 'w_gr1', type: 'grenadier', color: 'white' };
        b[10][7] = { id: 'w_gr2', type: 'grenadier', color: 'white' };

        // White rank 5 (row 9): b5 (li), d5 (li), k5 (li), m5 (li)
        b[9][1] = { id: 'w_li3', type: 'light_infantry', color: 'white' };
        b[9][3] = { id: 'w_li4', type: 'light_infantry', color: 'white' };
        b[9][10] = { id: 'w_li5', type: 'light_infantry', color: 'white' };
        b[9][12] = { id: 'w_li6', type: 'light_infantry', color: 'white' };

        // White rank 6 (row 8): f6 (li), i6 (li)
        b[8][5] = { id: 'w_li7', type: 'light_infantry', color: 'white' };
        b[8][8] = { id: 'w_li8', type: 'light_infantry', color: 'white' };

        // Black back line (rank 14 / row 0): f14 (HA), g14 (FA), h14 (FA), i14 (HA)
        b[0][5] = { id: 'b_ha1', type: 'horse_artillery', color: 'black' };
        b[0][6] = { id: 'b_fa1', type: 'foot_artillery', color: 'black' };
        b[0][7] = { id: 'b_fa2', type: 'foot_artillery', color: 'black' };
        b[0][8] = { id: 'b_ha2', type: 'horse_artillery', color: 'black' };

        // Black rank 13 (row 1): a13 (li), c13 (LC), d13 (HC), e13 (GC), f13 (GI), g13 (E), h13 (M), i13 (GI), j13 (GC), k13 (HC), l13 (LC), n13 (li)
        b[1][0] = { id: 'b_li1', type: 'light_infantry', color: 'black' };
        b[1][2] = { id: 'b_lc1', type: 'light_cavalry', color: 'black' };
        b[1][3] = { id: 'b_hc1', type: 'heavy_cavalry', color: 'black' };
        b[1][4] = { id: 'b_gc1', type: 'guard_cavalry', color: 'black' };
        b[1][5] = { id: 'b_gi1', type: 'guard_infantry', color: 'black' };
        b[1][6] = { id: 'b_emp', type: 'emperor', color: 'black' };
        b[1][7] = { id: 'b_mar', type: 'marshall', color: 'black' };
        b[1][8] = { id: 'b_gi2', type: 'guard_infantry', color: 'black' };
        b[1][9] = { id: 'b_gc2', type: 'guard_cavalry', color: 'black' };
        b[1][10] = { id: 'b_hc2', type: 'heavy_cavalry', color: 'black' };
        b[1][11] = { id: 'b_lc2', type: 'light_cavalry', color: 'black' };
        b[1][13] = { id: 'b_li2', type: 'light_infantry', color: 'black' };

        // Black rank 12 (row 2): b12-f12 (hi), g12-h12 (D), i12-m12 (hi)
        for (let c = 1; c <= 5; c++) b[2][c] = { id: `b_hi_${c}`, type: 'heavy_infantry', color: 'black' };
        b[2][6] = { id: 'b_dr1', type: 'dragoon', color: 'black' };
        b[2][7] = { id: 'b_dr2', type: 'dragoon', color: 'black' };
        for (let c = 8; c <= 12; c++) b[2][c] = { id: `b_hi_${c}`, type: 'heavy_infantry', color: 'black' };

        // Black rank 11 (row 3): g11 (g), h11 (g)
        b[3][6] = { id: 'b_gr1', type: 'grenadier', color: 'black' };
        b[3][7] = { id: 'b_gr2', type: 'grenadier', color: 'black' };

        // Black rank 10 (row 4): b10 (li), d10 (li), k10 (li), m10 (li)
        b[4][1] = { id: 'b_li3', type: 'light_infantry', color: 'black' };
        b[4][3] = { id: 'b_li4', type: 'light_infantry', color: 'black' };
        b[4][10] = { id: 'b_li5', type: 'light_infantry', color: 'black' };
        b[4][12] = { id: 'b_li6', type: 'light_infantry', color: 'black' };

        // Black rank 9 (row 5): f9 (li), i9 (li)
        b[5][5] = { id: 'b_li7', type: 'light_infantry', color: 'black' };
        b[5][8] = { id: 'b_li8', type: 'light_infantry', color: 'black' };

        return b;
    }

    if (variant === 'fide_napoleonic') {
        const rows = 8;
        const cols = 8;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        
        // FIDE Napoleonic Chess (8x8):
        // Back Rank: HA (Horse Artillery) | HC (Heavy Cavalry) | GC (Guard Cavalry) | M (Marshall) | E (Emperor) | GI (Guard Infantry) | LC (Light Cavalry) | FA (Foot Artillery)
        const blackBackRow: PieceType[] = [
            'horse_artillery', 'heavy_cavalry', 'guard_cavalry', 'marshall', 
            'emperor', 'guard_infantry', 'light_cavalry', 'foot_artillery'
        ];
        const blackFrontRow: PieceType[] = [
            'heavy_infantry', 'light_infantry', 'heavy_infantry', 'dragoon', 
            'grenadier', 'heavy_infantry', 'light_infantry', 'heavy_infantry'
        ];

        const whiteFrontRow: PieceType[] = [
            'heavy_infantry', 'light_infantry', 'heavy_infantry', 'dragoon', 
            'grenadier', 'heavy_infantry', 'light_infantry', 'heavy_infantry'
        ];
        const whiteBackRow: PieceType[] = [
            'horse_artillery', 'heavy_cavalry', 'guard_cavalry', 'marshall', 
            'emperor', 'guard_infantry', 'light_cavalry', 'foot_artillery'
        ];

        blackBackRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
        });
        blackFrontRow.forEach((type, col) => {
            b[1][col] = { id: `b_1_${col}`, type, color: 'black' };
        });

        whiteFrontRow.forEach((type, col) => {
            b[6][col] = { id: `w_6_${col}`, type, color: 'white' };
        });
        whiteBackRow.forEach((type, col) => {
            b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
        });

        return b;
    }

    if (variant === 'napoleon_ottomans') {
        const rows = 10;
        const cols = 10;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));
        
        // Black setup (Ottomans / top)
        // Row 0: FA | D | GC | ED | E | Ge | Ca | GC | D | FA
        b[0][0] = { id: 'b_fa1', type: 'foot_artillery', color: 'black' };
        b[0][1] = { id: 'b_d1', type: 'dragoon', color: 'black' };
        b[0][2] = { id: 'b_gc1', type: 'guard_cavalry', color: 'black' };
        b[0][3] = { id: 'b_ed', type: 'empress_dragoon', color: 'black' };
        b[0][4] = { id: 'b_emp', type: 'emperor', color: 'black' };
        b[0][5] = { id: 'b_ge', type: 'general', color: 'black' };
        b[0][6] = { id: 'b_ca', type: 'carabinier', color: 'black' };
        b[0][7] = { id: 'b_gc2', type: 'guard_cavalry', color: 'black' };
        b[0][8] = { id: 'b_d2', type: 'dragoon', color: 'black' };
        b[0][9] = { id: 'b_fa2', type: 'foot_artillery', color: 'black' };

        // Row 1: hi | hi | hi | hi | AV | AV | hi | hi | hi | hi
        for (let c = 0; c <= 3; c++) b[1][c] = { id: `b_hi_${c}`, type: 'heavy_infantry', color: 'black' };
        b[1][4] = { id: 'b_av1', type: 'artillerie_volante', color: 'black' };
        b[1][5] = { id: 'b_av2', type: 'artillerie_volante', color: 'black' };
        for (let c = 6; c <= 9; c++) b[1][c] = { id: `b_hi_${c}`, type: 'heavy_infantry', color: 'black' };

        // Row 2: _ | _ | _ | _ | hi | hi | _ | _ | _ | _
        b[2][4] = { id: 'b_hi_ex1', type: 'heavy_infantry', color: 'black' };
        b[2][5] = { id: 'b_hi_ex2', type: 'heavy_infantry', color: 'black' };

        // White setup (French / bottom)
        // Row 7: _ | _ | _ | _ | hi | hi | _ | _ | _ | _
        b[7][4] = { id: 'w_hi_ex1', type: 'heavy_infantry', color: 'white' };
        b[7][5] = { id: 'w_hi_ex2', type: 'heavy_infantry', color: 'white' };

        // Row 8: hi | hi | hi | hi | AV | AV | hi | hi | hi | hi
        for (let c = 0; c <= 3; c++) b[8][c] = { id: `w_hi_${c}`, type: 'heavy_infantry', color: 'white' };
        b[8][4] = { id: 'w_av1', type: 'artillerie_volante', color: 'white' };
        b[8][5] = { id: 'w_av2', type: 'artillerie_volante', color: 'white' };
        for (let c = 6; c <= 9; c++) b[8][c] = { id: `w_hi_${c}`, type: 'heavy_infantry', color: 'white' };

        // Row 9: FA | D | GC | ED | E | Ge | Ca | GC | D | FA
        b[9][0] = { id: 'w_fa1', type: 'foot_artillery', color: 'white' };
        b[9][1] = { id: 'w_d1', type: 'dragoon', color: 'white' };
        b[9][2] = { id: 'w_gc1', type: 'guard_cavalry', color: 'white' };
        b[9][3] = { id: 'w_ed', type: 'empress_dragoon', color: 'white' };
        b[9][4] = { id: 'w_emp', type: 'emperor', color: 'white' };
        b[9][5] = { id: 'w_ge', type: 'general', color: 'white' };
        b[9][6] = { id: 'w_ca', type: 'carabinier', color: 'white' };
        b[9][7] = { id: 'w_gc2', type: 'guard_cavalry', color: 'white' };
        b[9][8] = { id: 'w_d2', type: 'dragoon', color: 'white' };
        b[9][9] = { id: 'w_fa2', type: 'foot_artillery', color: 'white' };

        return b;
    }

    if (variant === 'bachelor') {
        const rows = 6;
        const cols = 7;
        const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));

        // Black back row (rank 6 / row 0): Rook, Knight, Knight, King, Bishop, Bishop, Rook
        const blackBackRow: PieceType[] = ['rook', 'knight', 'knight', 'king', 'bishop', 'bishop', 'rook'];
        blackBackRow.forEach((type, col) => {
            b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
            b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
        });

        // White back row (rank 1 / row 5): Rook, Knight, Knight, King, Bishop, Bishop, Rook
        const whiteBackRow: PieceType[] = ['rook', 'knight', 'knight', 'king', 'bishop', 'bishop', 'rook'];
        whiteBackRow.forEach((type, col) => {
            b[4][col] = { id: `w_4_${col}`, type: 'pawn', color: 'white' };
            b[5][col] = { id: `w_5_${col}`, type, color: 'white' };
        });

        return b;
    }

    // Standard & Grasshopper 8x8
    const rows = 8;
    const cols = 8;
    const b: BoardState = Array(rows).fill(null).map(() => Array(cols).fill(null));

    const standardBackRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    standardBackRow.forEach((type, col) => {
        b[0][col] = { id: `b_0_${col}`, type, color: 'black' };
        b[1][col] = { id: `b_1_${col}`, type: 'pawn', color: 'black' };
        b[6][col] = { id: `w_6_${col}`, type: 'pawn', color: 'white' };
        b[7][col] = { id: `w_7_${col}`, type, color: 'white' };
    });

    if (variant === 'grasshopper') {
        b[0][1] = { id: 'b_g1', type: 'grasshopper', color: 'black' };
        b[0][6] = { id: 'b_g2', type: 'grasshopper', color: 'black' };
        b[7][1] = { id: 'w_g1', type: 'grasshopper', color: 'white' };
        b[7][6] = { id: 'w_g2', type: 'grasshopper', color: 'white' };
    }

    return b;
}

export function getRawLegalMoves(
    board: BoardState, 
    pos: Position, 
    variant: GameVariant, 
    bridges: number[] = [3, 10], 
    fortifications: string[] = []
): Position[] {
    const piece = board[pos.row][pos.col];
    if (!piece) return [];

    const rows = board.length;
    const cols = board[0].length;
    const isWhite = piece.color === 'white';
    const forwardDir = isWhite ? -1 : 1;

    let moves: Position[] = [];

    const addLeaperMove = (r: number, c: number) => {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
            const target = board[r][c];
            if (!target) {
                moves.push({ row: r, col: c });
            } else if (target.color !== piece.color) {
                if (variant === 'napoleonic' && fortifications.includes(`${r},${c}`)) {
                    // Protected by fortification!
                } else {
                    moves.push({ row: r, col: c });
                }
            }
        }
    };

    const rayMove = (dr: number, dc: number) => {
        let r = pos.row + dr;
        let c = pos.col + dc;
        while (r >= 0 && r < rows && c >= 0 && c < cols) {
            const target = board[r][c];
            if (!target) {
                moves.push({ row: r, col: c });
            } else {
                if (target.color !== piece.color) {
                    if (variant === 'napoleonic' && fortifications.includes(`${r},${c}`)) {
                        // Protected by fortification! Cannot capture.
                    } else {
                        moves.push({ row: r, col: c });
                    }
                }
                break;
            }
            // River crossing stopping condition
            const isRiverRow = variant === 'napoleonic' && r === 6;
            if (isRiverRow && !bridges.includes(c)) {
                break;
            }
            r += dr;
            c += dc;
        }
    };

    const knightMoves = () => {
        const deltas = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        deltas.forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
    };

    const kingMoves = () => {
        const deltas = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        deltas.forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
    };

    switch (piece.type) {
        case 'pawn': {
            if (variant === 'xiangqi' || variant === 'janggi') {
                const r1 = pos.row + forwardDir;
                if (r1 >= 0 && r1 < rows) {
                    const t = board[r1][pos.col];
                    if (!t || t.color !== piece.color) {
                        moves.push({ row: r1, col: pos.col });
                    }
                }
                const crossedRiver = variant === 'janggi' || (isWhite ? (pos.row < 5) : (pos.row > 4));
                if (crossedRiver) {
                    [-1, 1].forEach(dc => {
                        const nc = pos.col + dc;
                        if (nc >= 0 && nc < cols) {
                            const t = board[pos.row][nc];
                            if (!t || t.color !== piece.color) {
                                moves.push({ row: pos.row, col: nc });
                            }
                        }
                    });
                }
                break;
            }

            if (variant === 'heian_shogi' || variant === 'sho_shogi' || variant === 'shogi') {
                const r1 = pos.row + forwardDir;
                if (r1 >= 0 && r1 < rows) {
                    const t = board[r1][pos.col];
                    if (!t || t.color !== piece.color) {
                        moves.push({ row: r1, col: pos.col });
                    }
                }
                break;
            }

            if (variant === 'cheskers') {
                // 1 step diagonally forward
                [-1, 1].forEach(dc => {
                    const r1 = pos.row + forwardDir;
                    const c1 = pos.col + dc;
                    if (r1 >= 0 && r1 < rows && c1 >= 0 && c1 < cols && !board[r1][c1]) {
                        moves.push({ row: r1, col: c1 });
                    }
                });
                // Jump capture 2 steps diagonally forward
                [-1, 1].forEach(dc => {
                    const midR = pos.row + forwardDir;
                    const midC = pos.col + dc;
                    const landR = pos.row + forwardDir * 2;
                    const landC = pos.col + dc * 2;
                    if (landR >= 0 && landR < rows && landC >= 0 && landC < cols) {
                        const midPiece = board[midR][midC];
                        const landPiece = board[landR][landC];
                        if (midPiece && midPiece.color !== piece.color && !landPiece) {
                            moves.push({ row: landR, col: landC });
                        }
                    }
                });
                break;
            }

            if (variant === 'chaturaji') {
                let fDr = 0, fDc = 0;
                let capDeltas: [number, number][] = [];
                if (piece.color === 'white') {
                    fDr = -1; capDeltas = [[-1, -1], [-1, 1]];
                } else if (piece.color === 'red') {
                    fDr = 1; capDeltas = [[1, -1], [1, 1]];
                } else if (piece.color === 'black') {
                    fDc = 1; capDeltas = [[-1, 1], [1, 1]];
                } else if (piece.color === 'green') {
                    fDc = -1; capDeltas = [[-1, -1], [1, -1]];
                }

                const r1 = pos.row + fDr;
                const c1 = pos.col + fDc;
                if (r1 >= 0 && r1 < rows && c1 >= 0 && c1 < cols && !board[r1][c1]) {
                    moves.push({ row: r1, col: c1 });
                }

                capDeltas.forEach(([dr, dc]) => {
                    const cr = pos.row + dr;
                    const cc = pos.col + dc;
                    if (cr >= 0 && cr < rows && cc >= 0 && cc < cols) {
                        const t = board[cr][cc];
                        if (t && t.color !== piece.color) {
                            moves.push({ row: cr, col: cc });
                        }
                    }
                });
                break;
            }

            // Standard forward 1 step
            const r1 = pos.row + forwardDir;
            if (r1 >= 0 && r1 < rows && !board[r1][pos.col]) {
                moves.push({ row: r1, col: pos.col });

                // Double step from start rank
                const startRank = (variant === 'grasshopper') ? (isWhite ? 5 : 2) :
                                  (variant === 'napoleon_ottomans') ? (isWhite ? 8 : 1) :
                                  (isWhite ? rows - 2 : 1);
                if ((variant === 'standard' || variant === 'capablanca' || variant === 'carrera' || variant === 'grasshopper' || variant === 'double' || variant === 'archchess' || variant === 'archcourier' || variant === 'fide_napoleonic' || variant === 'napoleon_ottomans') && pos.row === startRank) {
                    const r2 = pos.row + forwardDir * 2;
                    if (!board[r2][pos.col]) {
                        let isBlocked = false;
                        if (variant === 'archchess') {
                            const opponentColor = piece.color === 'white' ? 'black' : 'white';
                            const hasAdjOpponentPawn = [-1, 1].some(dc => {
                                const c = pos.col + dc;
                                if (c >= 0 && c < cols) {
                                    const adjPiece = board[r2][c];
                                    return adjPiece && adjPiece.type === 'pawn' && adjPiece.color === opponentColor;
                                }
                                return false;
                            });
                            
                            if (hasAdjOpponentPawn && isKingInCheck(board, piece.color, variant)) {
                                const tempBoard = board.map(r => [...r]);
                                tempBoard[r2][pos.col] = piece;
                                tempBoard[pos.row][pos.col] = null;
                                if (!isKingInCheck(tempBoard, piece.color, variant)) {
                                    isBlocked = true;
                                }
                            }
                        }
                        if (!isBlocked) {
                            moves.push({ row: r2, col: pos.col });
                        }
                    }
                }
            }
            // Diagonal captures
            [-1, 1].forEach(dc => {
                const c = pos.col + dc;
                if (r1 >= 0 && r1 < rows && c >= 0 && c < cols) {
                    const target = board[r1][c];
                    if (target && target.color !== piece.color) {
                        moves.push({ row: r1, col: c });
                    }
                }
            });
            break;
        }

        case 'knight':
            if (variant === 'xiangqi' || variant === 'janggi') {
                const horseMoves = [
                    { step: [-1, 0], targets: [[-2, -1], [-2, 1]] },
                    { step: [1, 0], targets: [[2, -1], [2, 1]] },
                    { step: [0, -1], targets: [[-1, -2], [1, -2]] },
                    { step: [0, 1], targets: [[-1, 2], [1, 2]] }
                ];
                horseMoves.forEach(m => {
                    const blockR = pos.row + m.step[0];
                    const blockC = pos.col + m.step[1];
                    if (blockR >= 0 && blockR < rows && blockC >= 0 && blockC < cols && board[blockR][blockC] === null) {
                        m.targets.forEach(([tr, tc]) => {
                            addLeaperMove(pos.row + tr, pos.col + tc);
                        });
                    }
                });
            } else {
                knightMoves();
            }
            break;

        case 'bishop':
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            break;

        case 'rook':
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            break;

        case 'queen':
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            break;

        case 'king':
        case 'man':
            if (variant === 'cheskers') {
                [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
                    const r1 = pos.row + dr;
                    const c1 = pos.col + dc;
                    if (r1 >= 0 && r1 < rows && c1 >= 0 && c1 < cols && !board[r1][c1]) {
                        moves.push({ row: r1, col: c1 });
                    }
                });
                [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
                    const midR = pos.row + dr;
                    const midC = pos.col + dc;
                    const landR = pos.row + dr * 2;
                    const landC = pos.col + dc * 2;
                    if (landR >= 0 && landR < rows && landC >= 0 && landC < cols) {
                        const midPiece = board[midR][midC];
                        const landPiece = board[landR][landC];
                        if (midPiece && midPiece.color !== piece.color && !landPiece) {
                            moves.push({ row: landR, col: landC });
                        }
                    }
                });
                break;
            }
            if (variant === 'xiangqi' || variant === 'janggi') {
                const isPalace = (r: number, c: number) => {
                    const validCol = c >= 3 && c <= 5;
                    const validRow = isWhite ? (r >= 7 && r <= 9) : (r >= 0 && r <= 2);
                    return validCol && validRow;
                };
                const orthDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                const diagDirs = variant === 'janggi' ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [];
                [...orthDirs, ...diagDirs].forEach(([dr, dc]) => {
                    const nr = pos.row + dr;
                    const nc = pos.col + dc;
                    if (isPalace(nr, nc)) {
                        addLeaperMove(nr, nc);
                    }
                });
            } else {
                kingMoves();
            }
            break;

        case 'alfil':
        case 'gaja':
        case 'nauka':
            if (variant === 'xiangqi') {
                [[-2, -2], [-2, 2], [2, -2], [2, 2]].forEach(([dr, dc]) => {
                    const nr = pos.row + dr;
                    const nc = pos.col + dc;
                    const midR = pos.row + dr / 2;
                    const midC = pos.col + dc / 2;
                    const riverCrossed = isWhite ? (nr < 5) : (nr > 4);
                    if (!riverCrossed && nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        if (board[midR][midC] === null) {
                            addLeaperMove(nr, nc);
                        }
                    }
                });
            } else if (variant === 'janggi') {
                const elephantMoves = [
                    { path: [[-1, 0], [-2, -1], [-3, -2]], end: [-3, -2] },
                    { path: [[-1, 0], [-2, 1], [-3, 2]], end: [-3, 2] },
                    { path: [[1, 0], [2, -1], [3, -2]], end: [3, -2] },
                    { path: [[1, 0], [2, 1], [3, 2]], end: [3, 2] },
                    { path: [[0, -1], [-1, -2], [-2, -3]], end: [-2, -3] },
                    { path: [[0, -1], [1, -2], [2, -3]], end: [2, -3] },
                    { path: [[0, 1], [-1, 2], [-2, 3]], end: [-2, 3] },
                    { path: [[0, 1], [1, 2], [2, 3]], end: [2, 3] }
                ];
                elephantMoves.forEach(m => {
                    const [er, ec] = m.end;
                    const targetR = pos.row + er;
                    const targetC = pos.col + ec;
                    if (targetR >= 0 && targetR < rows && targetC >= 0 && targetC < cols) {
                        const isBlocked = m.path.slice(0, 2).some(([dr, dc]) => board[pos.row + dr][pos.col + dc] !== null);
                        if (!isBlocked) {
                            addLeaperMove(targetR, targetC);
                        }
                    }
                });
            } else {
                [[-2, -2], [-2, 2], [2, -2], [2, 2]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            }
            break;

        case 'farzin':
        case 'mantri':
        case 'ferz':
        case 'vizier':
            if (variant === 'xiangqi' || variant === 'janggi') {
                const isPalace = (r: number, c: number) => {
                    const validCol = c >= 3 && c <= 5;
                    const validRow = isWhite ? (r >= 7 && r <= 9) : (r >= 0 && r <= 2);
                    return validCol && validRow;
                };
                const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
                const orthDirs = variant === 'janggi' ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [];
                [...diagDirs, ...orthDirs].forEach(([dr, dc]) => {
                    const nr = pos.row + dr;
                    const nc = pos.col + dc;
                    if (isPalace(nr, nc)) {
                        addLeaperMove(nr, nc);
                    }
                });
            } else {
                [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            }
            break;

        case 'dabbaba':
            [[-2, 0], [2, 0], [0, -2], [0, 2]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;

        case 'camel':
            // (3,1) / (1,3) long knight jump
            [[-3, -1], [-3, 1], [-1, -3], [-1, 3], [1, -3], [1, 3], [3, -1], [3, 1]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;

        case 'giraffe':
            [[-3, -2], [-3, 2], [-2, -3], [-2, 3], [2, -3], [2, 3], [3, -2], [3, 2]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;

        case 'archbishop':
        case 'centaur':
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            knightMoves();
            break;

        case 'chancellor':
        case 'champion':
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            knightMoves();
            break;

        case 'courier':
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            break;

        case 'grasshopper': {
            const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            dirs.forEach(([dr, dc]) => {
                let r = pos.row + dr;
                let c = pos.col + dc;
                let foundObstacle = false;

                while (r >= 0 && r < rows && c >= 0 && c < cols) {
                    if (!foundObstacle) {
                        if (board[r][c] !== null) {
                            foundObstacle = true;
                        }
                    } else {
                        const target = board[r][c];
                        if (!target || target.color !== piece.color) {
                            moves.push({ row: r, col: c });
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            });
            break;
        }

        case 'centurion': {
            const deltas = [
                [-2, 0], [2, 0], [0, -2], [0, 2],
                [-2, -2], [-2, 2], [2, -2], [2, 2],
                [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            deltas.forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;
        }

        case 'decurion':
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;

        case 'guard':
            kingMoves();
            break;

        case 'duke':
            kingMoves();
            knightMoves();
            break;

        case 'squirrel': {
            const deltas = [
                [-2, 0], [2, 0], [0, -2], [0, 2],
                [-2, -2], [-2, 2], [2, -2], [2, 2],
                [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            deltas.forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;
        }

        case 'archcourier':
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;

        case 'crowned_rook':
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;

        case 'cannon': {
            const rookDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            if (variant === 'janggi') {
                // In Janggi, a cannon MUST jump over exactly 1 piece (which is NOT a cannon), and cannot jump over or capture another cannon
                rookDirs.forEach(([dr, dc]) => {
                    let r = pos.row + dr;
                    let c = pos.col + dc;
                    // Find screen piece
                    while (r >= 0 && r < rows && c >= 0 && c < cols) {
                        if (board[r][c] !== null) {
                            const screen = board[r][c]!;
                            if (screen.type === 'cannon') {
                                // Cannon cannot jump over another cannon in Janggi
                                break;
                            }
                            // Found valid screen piece! Look beyond it
                            let qr = r + dr;
                            let qc = c + dc;
                            while (qr >= 0 && qr < rows && qc >= 0 && qc < cols) {
                                const target = board[qr][qc];
                                if (target === null) {
                                    moves.push({ row: qr, col: qc });
                                } else {
                                    if (target.color !== piece.color && target.type !== 'cannon') {
                                        moves.push({ row: qr, col: qc });
                                    }
                                    break;
                                }
                                qr += dr;
                                qc += dc;
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                });
            } else {
                rookDirs.forEach(([dr, dc]) => {
                    let r = pos.row + dr;
                    let c = pos.col + dc;
                    while (r >= 0 && r < rows && c >= 0 && c < cols) {
                        if (board[r][c] === null) {
                            moves.push({ row: r, col: c });
                        } else {
                            let qr = r + dr;
                            let qc = c + dc;
                            while (qr >= 0 && qr < rows && qc >= 0 && qc < cols) {
                                if (board[qr][qc] !== null) {
                                    if (board[qr][qc]!.color !== piece.color) {
                                        moves.push({ row: qr, col: qc });
                                    }
                                    break;
                                }
                                qr += dr;
                                qc += dc;
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                });
            }
            break;
        }

        case 'silver_general': {
            const dy = isWhite ? -1 : 1;
            [[-1, -1], [-1, 1], [1, -1], [1, 1], [dy, 0]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;
        }

        case 'gold_general':
        case 'promoted_silver':
        case 'promoted_knight':
        case 'promoted_lance':
        case 'promoted_pawn': {
            const dy = isWhite ? -1 : 1;
            [[-1, 0], [1, 0], [0, -1], [0, 1], [dy, -1], [dy, 1]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;
        }

        case 'lance': {
            const dy = isWhite ? -1 : 1;
            let r = pos.row + dy;
            while (r >= 0 && r < rows) {
                const t = board[r][pos.col];
                if (!t) {
                    moves.push({ row: r, col: pos.col });
                } else {
                    if (t.color !== piece.color) {
                        moves.push({ row: r, col: pos.col });
                    }
                    break;
                }
                r += dy;
            }
            break;
        }

        case 'keima': {
            const dy = isWhite ? -2 : 2;
            [[-1, dy], [1, dy]].forEach(([dc, dr]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;
        }

        case 'drunk_elephant': {
            const dy = isWhite ? -1 : 1;
            [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1], [0, 1], [dy, 0]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;
        }

        case 'crown_prince':
            kingMoves();
            break;

        case 'dragon_king':
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;

        case 'dragon_horse':
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;

        case 'emperor':
        case 'engineer':
            kingMoves();
            break;

        case 'marshall': {
            const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            dirs.forEach(([dr, dc]) => {
                let r = pos.row + dr;
                let c = pos.col + dc;
                while (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const target = board[r][c];
                    if (!target) {
                        moves.push({ row: r, col: c });
                    } else {
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            });
            dirs.forEach(([dr, dc]) => {
                const r = pos.row + dr;
                const c = pos.col + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const target = board[r][c];
                    if (target && target.color !== piece.color) {
                        if (fortifications.includes(`${r},${c}`)) {
                            // protected
                        } else {
                            moves.push({ row: r, col: c });
                        }
                    }
                }
            });
            break;
        }

        case 'guard_infantry': {
            const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            dirs.forEach(([dr, dc]) => {
                let r = pos.row + dr;
                let c = pos.col + dc;
                let steps = 0;
                while (r >= 0 && r < rows && c >= 0 && c < cols && steps < 2) {
                    const target = board[r][c];
                    if (!target) {
                        moves.push({ row: r, col: c });
                    } else {
                        if (target.color !== piece.color) {
                            if (fortifications.includes(`${r},${c}`)) {
                                // protected
                            } else {
                                moves.push({ row: r, col: c });
                            }
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                    steps++;
                }
            });
            break;
        }

        case 'guard_cavalry':
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            break;

        case 'heavy_cavalry':
        case 'cuirassier': {
            const deltas = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
            deltas.forEach(([dr, dc]) => {
                let r = pos.row + dr;
                let c = pos.col + dc;
                while (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const target = board[r][c];
                    if (!target) {
                        moves.push({ row: r, col: c });
                    } else {
                        if (target.color !== piece.color) {
                            if (fortifications.includes(`${r},${c}`)) {
                                // protected
                            } else {
                                moves.push({ row: r, col: c });
                            }
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            });
            break;
        }

        case 'light_cavalry':
        case 'hussar': {
            const deltas = [[-3, -1], [-3, 1], [-1, -3], [-1, 3], [1, -3], [1, 3], [3, -1], [3, 1]];
            deltas.forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;
        }

        case 'grenadier':
        case 'chasseur_pied': {
            // 4-direction pawn / Steward: orthogonal 1-step to empty, diagonal 1-step capture
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
                const r = pos.row + dr;
                const c = pos.col + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c] === null) {
                    moves.push({ row: r, col: c });
                }
            });
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
                const r = pos.row + dr;
                const c = pos.col + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const target = board[r][c];
                    if (target && target.color !== piece.color) {
                        if (fortifications.includes(`${r},${c}`)) {
                            // protected
                        } else {
                            moves.push({ row: r, col: c });
                        }
                    }
                }
            });
            break;
        }

        case 'dragoon': {
            // Knight leaps + Grenadier movement (ortho move to empty, diag capture)
            const knightDeltas = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            knightDeltas.forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));

            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
                const r = pos.row + dr;
                const c = pos.col + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c] === null) {
                    moves.push({ row: r, col: c });
                }
            });
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
                const r = pos.row + dr;
                const c = pos.col + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const target = board[r][c];
                    if (target && target.color !== piece.color) {
                        if (fortifications.includes(`${r},${c}`)) {
                            // protected
                        } else {
                            moves.push({ row: r, col: c });
                        }
                    }
                }
            });
            break;
        }

        case 'heavy_infantry': {
            const r1 = pos.row + forwardDir;
            if (r1 >= 0 && r1 < rows && !board[r1][pos.col]) {
                moves.push({ row: r1, col: pos.col });
                const startRank = (variant === 'fide_napoleonic') ? (isWhite ? 6 : 1) :
                                  (variant === 'napoleon_ottomans') ? (isWhite ? 8 : 1) : 
                                  (isWhite ? 11 : 2);
                if (pos.row === startRank) {
                    const r2 = pos.row + forwardDir * 2;
                    if (r2 >= 0 && r2 < rows && !board[r2][pos.col]) {
                        moves.push({ row: r2, col: pos.col });
                    }
                }
            }
            [-1, 1].forEach(dc => {
                const c = pos.col + dc;
                const r = pos.row + forwardDir;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const target = board[r][c];
                    if (target && target.color !== piece.color) {
                        if (fortifications.includes(`${r},${c}`)) {
                            // protected
                        } else {
                            moves.push({ row: r, col: c });
                        }
                    }
                }
            });
            break;
        }

        case 'light_infantry': {
            [-1, 1].forEach(dc => {
                const r1 = pos.row + forwardDir;
                const c1 = pos.col + dc;
                if (r1 >= 0 && r1 < rows && c1 >= 0 && c1 < cols && !board[r1][c1]) {
                    moves.push({ row: r1, col: c1 });
                    const startRanks = variant === 'napoleonic' 
                        ? (isWhite ? [12, 9, 8] : [1, 4, 5]) 
                        : variant === 'fide_napoleonic'
                        ? (isWhite ? [6] : [1])
                        : (isWhite ? [12] : [1]);
                    if (startRanks.includes(pos.row)) {
                        const r2 = pos.row + forwardDir * 2;
                        const c2 = pos.col + dc * 2;
                        if (r2 >= 0 && r2 < rows && c2 >= 0 && c2 < cols && !board[r2][c2] && !board[r1][c1]) {
                            moves.push({ row: r2, col: c2 });
                        }
                    }
                }
            });
            const rCap = pos.row + forwardDir;
            if (rCap >= 0 && rCap < rows) {
                const target = board[rCap][pos.col];
                if (target && target.color !== piece.color) {
                    if (fortifications.includes(`${rCap},${pos.col}`)) {
                        // protected
                    } else {
                        moves.push({ row: rCap, col: pos.col });
                    }
                }
            }
            break;
        }

        case 'horse_artillery':
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            break;

        case 'foot_artillery': {
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            dirs.forEach(([dr, dc]) => {
                let r = pos.row + dr;
                let c = pos.col + dc;
                while (r >= 0 && r < rows && c >= 0 && c < cols) {
                    if (board[r][c] === null) {
                        moves.push({ row: r, col: c });
                    } else {
                        let qr = r + dr;
                        let qc = c + dc;
                        while (qr >= 0 && qr < rows && qc >= 0 && qc < cols) {
                            if (board[qr][qc] !== null) {
                                if (board[qr][qc]!.color !== piece.color) {
                                    if (fortifications.includes(`${qr},${qc}`)) {
                                        // protected
                                    } else {
                                        moves.push({ row: qr, col: qc });
                                    }
                                }
                                break;
                            }
                            qr += dr;
                            qc += dc;
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            });
            break;
        }

        case 'carabinier':
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            break;

        case 'lancer': {
            const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            dirs.forEach(([dr, dc]) => {
                let r = pos.row + dr;
                let c = pos.col + dc;
                let steps = 0;
                while (r >= 0 && r < rows && c >= 0 && c < cols && steps < 3) {
                    const target = board[r][c];
                    if (!target) {
                        moves.push({ row: r, col: c });
                    } else {
                        if (target.color !== piece.color) {
                            if (fortifications.includes(`${r},${c}`)) {
                                // protected
                            } else {
                                moves.push({ row: r, col: c });
                            }
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                    steps++;
                }
            });
            break;
        }

        case 'chasseur_cheval': {
            const deltas = [[-3, -2], [-3, 2], [-2, -3], [-2, 3], [2, -3], [2, 3], [3, -2], [3, 2]];
            deltas.forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;
        }

        case 'grenadier_cheval': {
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            break;
        }

        case 'empress_dragoon': {
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            knightMoves();
            break;
        }

        case 'mameluke': {
            const d1 = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
            const firstHop: Position[] = [];
            d1.forEach(([dr, dc]) => {
                const r = pos.row + dr;
                const c = pos.col + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const target = board[r][c];
                    if (!target || target.color !== piece.color) {
                        if (target && fortifications.includes(`${r},${c}`)) {
                            // protected
                        } else {
                            moves.push({ row: r, col: c });
                        }
                    }
                    if (!target) {
                        firstHop.push({ row: r, col: c });
                    }
                }
            });
            firstHop.forEach(hop => {
                d1.forEach(([dr, dc]) => {
                    const r2 = hop.row + dr;
                    const c2 = hop.col + dc;
                    if (r2 === pos.row && c2 === pos.col) return;
                    if (r2 >= 0 && r2 < rows && c2 >= 0 && c2 < cols) {
                        const target = board[r2][c2];
                        if (!target || target.color !== piece.color) {
                            if (target && fortifications.includes(`${r2},${c2}`)) {
                                // protected
                            } else {
                                if (!moves.some(m => m.row === r2 && m.col === c2)) {
                                    moves.push({ row: r2, col: c2 });
                                }
                            }
                        }
                    }
                });
            });
            break;
        }

        case 'voltigeur': {
            [-1, 1].forEach(dc => {
                const r1 = pos.row + forwardDir;
                const c1 = pos.col + dc;
                if (r1 >= 0 && r1 < rows && c1 >= 0 && c1 < cols && !board[r1][c1]) {
                    moves.push({ row: r1, col: c1 });
                }
            });
            const rCap = pos.row + forwardDir;
            if (rCap >= 0 && rCap < rows) {
                const target = board[rCap][pos.col];
                if (target && target.color !== piece.color) {
                    if (fortifications.includes(`${rCap},${pos.col}`)) {
                        // protected
                    } else {
                        moves.push({ row: rCap, col: pos.col });
                    }
                }
            }
            [[-2, -2], [-2, 2], [2, -2], [2, 2]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            [[-2, 0], [2, 0], [0, -2], [0, 2]].forEach(([dr, dc]) => addLeaperMove(pos.row + dr, pos.col + dc));
            break;
        }

        case 'tirailleur': {
            [-1, 1].forEach(dc => {
                const r1 = pos.row + forwardDir;
                const c1 = pos.col + dc;
                if (r1 >= 0 && r1 < rows && c1 >= 0 && c1 < cols && !board[r1][c1]) {
                    moves.push({ row: r1, col: c1 });
                }
            });
            const rCap = pos.row + forwardDir;
            if (rCap >= 0 && rCap < rows) {
                const target = board[rCap][pos.col];
                if (target && target.color !== piece.color) {
                    if (fortifications.includes(`${rCap},${pos.col}`)) {
                        // protected
                    } else {
                        moves.push({ row: rCap, col: pos.col });
                    }
                }
            }
            const r2 = pos.row + forwardDir * 2;
            const rIntermediate = pos.row + forwardDir;
            if (r2 >= 0 && r2 < rows && !board[rIntermediate][pos.col] && !board[r2][pos.col]) {
                moves.push({ row: r2, col: pos.col });
            }
            break;
        }

        case 'carabinier_pied': {
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
                const r = pos.row + dr;
                const c = pos.col + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols && !board[r][c]) {
                    moves.push({ row: r, col: c });
                }
            });
            [[-1, 0], [1, 0]].forEach(([dr, dc]) => {
                const r = pos.row + dr;
                const c = pos.col + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const target = board[r][c];
                    if (target && target.color !== piece.color) {
                        if (fortifications.includes(`${r},${c}`)) {
                            // protected
                        } else {
                            moves.push({ row: r, col: c });
                        }
                    }
                }
            });
            break;
        }

        case 'artillerie_volante':
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            knightMoves();
            break;

        case 'general':
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => rayMove(dr, dc));
            knightMoves();
            break;

        default:
            kingMoves();
            break;
    }

    if (variant === 'cheskers') {
        const hasJump = moves.some(m => Math.abs(m.row - pos.row) === 2);
        if (hasJump) {
            moves = moves.filter(m => Math.abs(m.row - pos.row) === 2);
        }
    }

    return moves;
}

export function isKingInCheck(
    board: BoardState, 
    color: PieceColor, 
    variant: GameVariant,
    bridges: number[] = [3, 10], 
    fortifications: string[] = []
): boolean {
    if (variant === 'chaturanga' || variant === 'chaturaji') {
        // No check in Chaturanga / Chaturaji (King is captured directly)
        return false;
    }

    // Find all kings of this color
    const kingPositions: Position[] = [];
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[0].length; c++) {
            const p = board[r][c];
            if (p && (p.type === 'king' || p.type === 'emperor') && p.color === color) {
                kingPositions.push({ row: r, col: c });
            }
        }
    }

    if (kingPositions.length === 0) return false;

    if (variant === 'xiangqi') {
        const whiteKing = kingPositions[0];
        let oppKingPos: Position | null = null;
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[0].length; c++) {
                const p = board[r][c];
                if (p && p.type === 'king' && p.color !== color) {
                    oppKingPos = { row: r, col: c };
                    break;
                }
            }
            if (oppKingPos) break;
        }

        if (oppKingPos && whiteKing && whiteKing.col === oppKingPos.col) {
            let minR = Math.min(whiteKing.row, oppKingPos.row);
            let maxR = Math.max(whiteKing.row, oppKingPos.row);
            let hasIntervening = false;
            for (let r = minR + 1; r < maxR; r++) {
                if (board[r][whiteKing.col] !== null) {
                    hasIntervening = true;
                    break;
                }
            }
            if (!hasIntervening) {
                return true;
            }
        }
    }

    // Check if any opponent piece can attack any king
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[0].length; c++) {
            const p = board[r][c];
            if (p && p.color !== color) {
                // Fast geometric pre-filter: skip pieces that cannot physically reach any king
                let canReachKing = false;
                for (let k = 0; k < kingPositions.length; k++) {
                    const kp = kingPositions[k];
                    const dr = Math.abs(kp.row - r);
                    const dc = Math.abs(kp.col - c);

                    if (p.type === 'pawn') {
                        const forward = p.color === 'white' ? -1 : 1;
                        if (kp.row === r + forward && (kp.col === c - 1 || kp.col === c + 1)) {
                            canReachKing = true;
                            break;
                        }
                    } else if (p.type === 'knight') {
                        if ((dr === 1 && dc === 2) || (dr === 2 && dc === 1)) {
                            canReachKing = true;
                            break;
                        }
                    } else if (p.type === 'rook') {
                        if (dr === 0 || dc === 0) {
                            canReachKing = true;
                            break;
                        }
                    } else if (p.type === 'bishop') {
                        if (dr === dc && dr > 0) {
                            canReachKing = true;
                            break;
                        }
                    } else if (p.type === 'queen') {
                        if (dr === 0 || dc === 0 || (dr === dc && dr > 0)) {
                            canReachKing = true;
                            break;
                        }
                    } else if (p.type === 'king' || p.type === 'emperor') {
                        if (dr <= 1 && dc <= 1 && (dr + dc > 0)) {
                            canReachKing = true;
                            break;
                        }
                    } else {
                        // Variants / special pieces
                        canReachKing = true;
                        break;
                    }
                }

                if (!canReachKing) continue;

                // For standard sliding pieces (rook, bishop, queen) on the same line, do a fast raycast without allocating move arrays
                if (p.type === 'rook' || p.type === 'bishop' || p.type === 'queen') {
                    for (let k = 0; k < kingPositions.length; k++) {
                        const kp = kingPositions[k];
                        const diffR = kp.row - r;
                        const diffC = kp.col - c;
                        const absDr = Math.abs(diffR);
                        const absDc = Math.abs(diffC);

                        const isOrthogonal = (absDr === 0 && absDc > 0) || (absDc === 0 && absDr > 0);
                        const isDiagonal = (absDr === absDc && absDr > 0);

                        if ((p.type === 'rook' && isOrthogonal) || 
                            (p.type === 'bishop' && isDiagonal) || 
                            (p.type === 'queen' && (isOrthogonal || isDiagonal))) {
                            
                            const stepR = absDr === 0 ? 0 : diffR / absDr;
                            const stepC = absDc === 0 ? 0 : diffC / absDc;
                            let currR = r + stepR;
                            let currC = c + stepC;
                            let blocked = false;
                            while (currR !== kp.row || currC !== kp.col) {
                                if (board[currR][currC] !== null) {
                                    blocked = true;
                                    break;
                                }
                                currR += stepR;
                                currC += stepC;
                            }
                            if (!blocked) {
                                return true;
                            }
                        }
                    }
                    continue;
                }

                const rawMoves = getRawLegalMoves(board, { row: r, col: c }, variant, bridges, fortifications);
                if (rawMoves.some(m => kingPositions.some(k => k.row === m.row && k.col === m.col))) {
                    return true;
                }
            }
        }
    }

    return false;
}

export function getLegalMoves(
    board: BoardState, 
    pos: Position, 
    variant: GameVariant,
    bridges: number[] = [3, 10], 
    fortifications: string[] = []
): Position[] {
    const piece = board[pos.row][pos.col];
    if (!piece) return [];

    const rawMoves = getRawLegalMoves(board, pos, variant, bridges, fortifications);

    if (variant === 'chaturanga' || variant === 'chaturaji') {
        // No check filtering in Chaturanga/Chaturaji
        return rawMoves;
    }

    // Filter out moves that leave own King in check using in-place mutate & revert (zero GC allocation)
    let valid: Position[] = [];
    for (let i = 0; i < rawMoves.length; i++) {
        const m = rawMoves[i];
        const destPiece = board[m.row][m.col];
        
        board[m.row][m.col] = piece;
        board[pos.row][pos.col] = null;

        let midPiece: Piece | null = null;
        let midR = 0, midC = 0;
        if (variant === 'cheskers' && Math.abs(pos.row - m.row) === 2) {
            midR = (pos.row + m.row) / 2;
            midC = (pos.col + m.col) / 2;
            midPiece = board[midR][midC];
            board[midR][midC] = null;
        }

        const leavesInCheck = isKingInCheck(board, piece.color, variant, bridges, fortifications);

        // Revert board state
        board[pos.row][pos.col] = piece;
        board[m.row][m.col] = destPiece;
        if (midPiece !== null) {
            board[midR][midC] = midPiece;
        }

        if (!leavesInCheck) {
            valid.push(m);
        }
    }

    if (variant === 'cheskers') {
        let anyJumpAvailable = false;
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[0].length; c++) {
                const p = board[r][c];
                if (p && p.color === piece.color) {
                    const rm = getRawLegalMoves(board, { row: r, col: c }, variant);
                    if (rm.some(m => Math.abs(m.row - r) === 2)) {
                        anyJumpAvailable = true;
                        break;
                    }
                }
            }
            if (anyJumpAvailable) break;
        }
        if (anyJumpAvailable) {
            valid = valid.filter(m => Math.abs(m.row - pos.row) === 2);
        }
    }

    return valid;
}

// Chinese piece character mapping for Xiangqi
const XIANGQI_PIECE_META: Record<string, { redChar: string; blackChar: string; label: string; badge: string }> = {
    king: { redChar: '帥', blackChar: '將', label: 'Генерал / Маршал', badge: 'Кр' },
    ferz: { redChar: '仕', blackChar: '士', label: 'Радник (Ші)', badge: 'Фз' },
    alfil: { redChar: '相', blackChar: '象', label: 'Слон (Сян)', badge: 'Сл' },
    knight: { redChar: '傌', blackChar: '馬', label: 'Кінь (Ма)', badge: 'К' },
    rook: { redChar: '俥', blackChar: '車', label: 'Колісниця (Цзю)', badge: 'Т' },
    cannon: { redChar: '炮', blackChar: '砲', label: 'Гармата (Пао)', badge: 'Гм' },
    pawn: { redChar: '兵', blackChar: '卒', label: 'Воїн (Цзу/Бін)', badge: 'П' },
};

// Korean piece character mapping for Janggi
const JANGGI_PIECE_META: Record<string, { redChar: string; blueChar: string; label: string; badge: string }> = {
    king: { redChar: '漢', blueChar: '楚', label: 'Генерал / Хан / Чо', badge: 'Кр' },
    ferz: { redChar: '仕', blueChar: '士', label: 'Са (Охоронець)', badge: 'Са' },
    alfil: { redChar: '象', blueChar: '象', label: 'Санг (Слон)', badge: 'Сн' },
    knight: { redChar: '傌', blueChar: '馬', label: 'Ма (Кінь)', badge: 'Ма' },
    rook: { redChar: '俥', blueChar: '車', label: 'Ча (Тура / Колісниця)', badge: 'Ча' },
    cannon: { redChar: '砲', blueChar: '包', label: 'По (Гармата)', badge: 'По' },
    pawn: { redChar: '兵', blueChar: '卒', label: 'Бьон / Чол (Воїн)', badge: 'Чол' },
};

// Visual Piece Token Component
function ChessPieceToken({ piece, isSelected, variant }: { piece: Piece; isSelected?: boolean; variant?: GameVariant }) {
    if (variant === 'janggi') {
        const jgMeta = JANGGI_PIECE_META[piece.type] || { redChar: '兵', blueChar: '卒', label: piece.type, badge: 'П' };
        const isRed = piece.color === 'white' || piece.color === 'red';
        const char = isRed ? jgMeta.redChar : jgMeta.blueChar;

        return (
            <div 
                className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-lg border-2 sm:border-[3px] flex items-center justify-center transition-all shadow-[0_3px_8px_rgba(0,0,0,0.6)] ${
                    isRed 
                        ? 'border-red-600 bg-gradient-to-b from-[#fff8f8] via-[#fde8e8] to-[#f8cdcd] text-red-600 ring-1 ring-red-400/50' 
                        : 'border-emerald-700 bg-gradient-to-b from-[#f4faf6] via-[#dceee2] to-[#badae5] text-emerald-800 ring-1 ring-emerald-500/50'
                } ${isSelected ? 'scale-110 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#2b1f14] z-30' : ''}`}
                title={`${jgMeta.label} (${isRed ? 'Червоні (Хан)' : 'Сині (Чо)'})`}
            >
                {/* Inner Octagonal / Rounded Bevel Ring */}
                <div className={`absolute inset-0.5 rounded border ${isRed ? 'border-red-500/40' : 'border-emerald-700/40'} pointer-events-none`} />

                {/* Calligraphic Character */}
                <span className={`text-base sm:text-2xl font-black font-serif select-none drop-shadow-sm ${
                    isRed ? 'text-red-600' : 'text-emerald-900'
                }`}>
                    {char}
                </span>

                {/* Subscript Ukrainian Piece Code Badge */}
                <span className={`absolute -bottom-1 -right-1 px-1 py-0.2 text-[8px] sm:text-[9px] font-black rounded-full border select-none ${
                    isRed ? 'bg-red-950 border-red-500 text-red-200' : 'bg-emerald-950 border-emerald-500 text-emerald-200'
                }`}>
                    {jgMeta.badge}
                </span>
            </div>
        );
    }

    if (variant === 'xiangqi') {
        const xqMeta = XIANGQI_PIECE_META[piece.type] || { redChar: '兵', blackChar: '卒', label: piece.type, badge: 'П' };
        const isRed = piece.color === 'white' || piece.color === 'red';
        const char = isRed ? xqMeta.redChar : xqMeta.blackChar;

        return (
            <div 
                className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-full border-2 sm:border-[3px] flex items-center justify-center transition-all bg-gradient-to-b from-[#fff7e6] via-[#f7e6c4] to-[#ebd4a0] shadow-[0_3px_8px_rgba(0,0,0,0.6)] ${
                    isRed 
                        ? 'border-red-600/90 text-red-600 ring-1 ring-red-400/50' 
                        : 'border-stone-900/90 text-stone-900 ring-1 ring-stone-600/50'
                } ${isSelected ? 'scale-110 ring-4 ring-amber-400 ring-offset-2 ring-offset-[#2b1f14] z-30' : ''}`}
                title={`${xqMeta.label} (${isRed ? 'Червоні' : 'Чорні'})`}
            >
                {/* Inner Decorative Ring */}
                <div className={`absolute inset-0.5 rounded-full border ${isRed ? 'border-red-600/40' : 'border-stone-800/40'} pointer-events-none`} />

                {/* Calligraphic Chinese Character */}
                <span className={`text-base sm:text-2xl font-black font-serif select-none drop-shadow-sm ${
                    isRed ? 'text-red-600' : 'text-stone-950'
                }`}>
                    {char}
                </span>

                {/* Subscript Ukrainian Piece Code Badge */}
                <span className={`absolute -bottom-1 -right-1 px-1 py-0.2 text-[8px] sm:text-[9px] font-black rounded-full border select-none ${
                    isRed ? 'bg-red-950 border-red-500 text-red-200' : 'bg-stone-950 border-stone-500 text-stone-200'
                }`}>
                    {xqMeta.badge}
                </span>
            </div>
        );
    }

    let meta = PIECE_META[piece.type] || { label: piece.type, symbol: '♟', badge: piece.type.slice(0, 2) };

    if (variant === 'fide_napoleonic') {
        const fideMetaMap: Record<string, { label: string; symbol: string; badge: string }> = {
            king: { label: 'Імператор', symbol: '👑', badge: 'Імп' },
            queen: { label: 'Маршал', symbol: '🎖️', badge: 'Мар' },
            bishop: { label: 'Гвардієць', symbol: '💂', badge: 'Гв' },
            knight: { label: 'Кавалерія', symbol: '🐎', badge: 'Кав' },
            rook: { label: 'Артилерія', symbol: '💥', badge: 'Арт' },
            pawn: { label: 'Піхота', symbol: '🪖', badge: 'Піх' },
        };
        if (fideMetaMap[piece.type]) meta = fideMetaMap[piece.type];
    } else if (variant === 'napoleon_ottomans') {
        const isFrench = piece.color === 'white';
        const mapWhite: Record<string, { label: string; symbol: string; badge: string }> = {
            king: { label: 'Імператор Наполеон', symbol: '👑', badge: 'Імп' },
            queen: { label: 'Маршал', symbol: '🎖️', badge: 'Мар' },
            bishop: { label: 'Гвардія', symbol: '💂', badge: 'Гв' },
            knight: { label: 'Кавалерія', symbol: '🐎', badge: 'Кав' },
            rook: { label: 'Артилерія', symbol: '💥', badge: 'Арт' },
            dabbaba: { label: 'Важка артилерія', symbol: '💣', badge: 'ВАр' },
            vizier: { label: 'Штабний офіцер', symbol: '📜', badge: 'Офі' },
            pawn: { label: 'Піхота', symbol: '🪖', badge: 'Піх' },
        };
        const mapBlack: Record<string, { label: string; symbol: string; badge: string }> = {
            king: { label: 'Султан', symbol: '☪️', badge: 'Сул' },
            queen: { label: 'Великий Візир', symbol: '🕌', badge: 'ВВіз' },
            bishop: { label: 'Дервіш / Імам', symbol: '👳', badge: 'Дер' },
            knight: { label: 'Сипахи', symbol: '🐎', badge: 'Сип' },
            rook: { label: 'Пушкарі', symbol: '💥', badge: 'Пуш' },
            dabbaba: { label: 'Велика гармата', symbol: '💣', badge: 'ВГар' },
            vizier: { label: 'Візир', symbol: '📜', badge: 'Віз' },
            pawn: { label: 'Яничари', symbol: '⚔️', badge: 'Яни' },
        };
        const currentMap = isFrench ? mapWhite : mapBlack;
        if (currentMap[piece.type]) meta = currentMap[piece.type];
    } else if (variant === 'sittuyin') {
        const sittuyinMetaMap: Record<string, { label: string; symbol: string; badge: string }> = {
            king: { label: 'Мін-джі (Король)', symbol: '👑', badge: 'Мін' },
            ferz: { label: 'Сіт-ке (Генерал)', symbol: '🛡️', badge: 'Сіт' },
            silver_general: { label: 'Сін (Слон)', symbol: '🐘', badge: 'Сін' },
            knight: { label: 'Миїн (Кінь)', symbol: '🐎', badge: 'Мин' },
            rook: { label: 'Ятта (Колісниця)', symbol: '🏰', badge: 'Ятт' },
            pawn: { label: 'Не (Солдат)', symbol: '♙', badge: 'Не' },
        };
        if (sittuyinMetaMap[piece.type]) meta = sittuyinMetaMap[piece.type];
    }

    const colorStyles = {
        white: 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 border-amber-500/80 text-amber-950 shadow-[0_2px_6px_rgba(0,0,0,0.5)]',
        black: 'bg-gradient-to-b from-stone-900 via-stone-850 to-stone-950 border-amber-500/60 text-amber-100 shadow-[0_2px_6px_rgba(0,0,0,0.8)]',
        red: 'bg-gradient-to-b from-rose-800 via-rose-900 to-rose-950 border-rose-400 text-rose-100 shadow-[0_2px_6px_rgba(225,29,72,0.6)]',
        green: 'bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950 border-emerald-400 text-emerald-100 shadow-[0_2px_6px_rgba(16,185,129,0.6)]'
    };

    return (
        <div 
            className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all ${colorStyles[piece.color]} ${isSelected ? 'scale-110 ring-2 ring-amber-300 ring-offset-1 ring-offset-black z-30' : ''}`}
            title={`${meta.label} (${piece.color})`}
        >
            <span className="text-lg sm:text-2xl font-black drop-shadow-sm select-none">
                {meta.symbol}
            </span>

            {/* Subscript Ukrainian Piece Code Badge */}
            <span className={`absolute -bottom-1 -right-1 px-1 py-0.2 text-[8px] sm:text-[9px] font-black rounded-full border select-none ${
                piece.color === 'white' ? 'bg-amber-950 border-amber-400 text-amber-200' :
                piece.color === 'red' ? 'bg-rose-950 border-rose-400 text-rose-200' :
                piece.color === 'green' ? 'bg-emerald-950 border-emerald-400 text-emerald-200' :
                'bg-black border-amber-500 text-amber-300'
            }`}>
                {meta.badge}
            </span>
        </div>
    );
}

// Check if a player is engaged in Bachelor Chess (can marry King & Queen on next turn)
export function isPlayerEngaged(b: BoardState, color: PieceColor, variant: GameVariant): boolean {
    if (variant !== 'bachelor') return false;
    
    for (let r = 0; r < b.length; r++) {
        for (let c = 0; c < b[0].length; c++) {
            const p = b[r][c];
            if (p && p.color === color) {
                const legalMoves = getLegalMoves(b, { row: r, col: c }, variant);
                for (const m of legalMoves) {
                    const simBoard = b.map(row => [...row]);
                    let movedType = p.type;
                    const promoRow = color === 'white' ? 0 : simBoard.length - 1;
                    if (m.row === promoRow && (p.type === 'pawn' || p.type === 'rook' || p.type === 'bishop' || p.type === 'knight' || p.type === 'queen')) {
                        movedType = 'queen';
                    }
                    simBoard[m.row][m.col] = { ...p, type: movedType };
                    simBoard[r][c] = null;

                    let kingPos: Position | null = null;
                    const queenPositions: Position[] = [];
                    for (let sr = 0; sr < simBoard.length; sr++) {
                        for (let sc = 0; sc < simBoard[0].length; sc++) {
                            const sp = simBoard[sr][sc];
                            if (sp && sp.color === color) {
                                if (sp.type === 'king') kingPos = { row: sr, col: sc };
                                if (sp.type === 'queen') queenPositions.push({ row: sr, col: sc });
                            }
                        }
                    }

                    if (kingPos && queenPositions.length > 0) {
                        for (const qp of queenPositions) {
                            if (Math.max(Math.abs(kingPos.row - qp.row), Math.abs(kingPos.col - qp.col)) <= 1) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

export default function ChessModal({
    isOpen,
    variant,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: ChessModalProps) {
    const [currentVariant, setCurrentVariant] = useState<GameVariant>(variant);

    useEffect(() => {
        setCurrentVariant(variant);
    }, [variant]);

    const [board, setBoard] = useState<BoardState>(() => createInitialBoard(variant));
    const [turn, setTurn] = useState<PieceColor>('white');
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [validMoves, setValidMoves] = useState<Position[]>([]);
    const [moveHistory, setMoveHistory] = useState<Move[]>([]);

    const [whiteCaptures, setWhiteCaptures] = useState<Piece[]>([]);
    const [blackCaptures, setBlackCaptures] = useState<Piece[]>([]);

    const [isCheck, setIsCheck] = useState<boolean>(false);
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | 'draw' | null>(null);
    const [winReason, setWinReason] = useState<string>('');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [hint, setHint] = useState<{ from: Position; to: Position } | null>(null);

    // Promotion pending state for Cheskers & standard chess
    const [promotionPending, setPromotionPending] = useState<{ from: Position; to: Position; piece: Piece } | null>(null);

    // Compute Bachelor Chess Engagement state
    const whiteIsEngaged = useMemo(() => isPlayerEngaged(board, 'white', currentVariant), [board, currentVariant]);
    const blackIsEngaged = useMemo(() => isPlayerEngaged(board, 'black', currentVariant), [board, currentVariant]);

    // Napoleonic Chess tactical configurations
    const [napoleonicBridges, setNapoleonicBridges] = useState<number[]>([3, 10]);
    const [napoleonicFortifications, setNapoleonicFortifications] = useState<string[]>(['5,3', '5,10', '8,3', '8,10']);
    const [customSubunitCavalry, setCustomSubunitCavalry] = useState<PieceType>('guard_cavalry'); 
    const [customSubunitInfantry, setCustomSubunitInfantry] = useState<PieceType>('heavy_infantry'); 
    const [customSubunitArtillery, setCustomSubunitArtillery] = useState<PieceType>('foot_artillery'); 

    // Apply free choice subunits changes
    const applySubunitSelections = (cavalry: PieceType, infantry: PieceType, artillery: PieceType) => {
        setBoard(prev => prev.map(row => row.map(cell => {
            if (!cell) return null;
            let type = cell.type;
            if (cell.color === 'white' || cell.color === 'black') {
                const isCav = ['guard_cavalry', 'mameluke', 'cuirassier', 'carabinier', 'hussar', 'lancer', 'chasseur_cheval', 'grenadier_cheval', 'empress_dragoon'].includes(type);
                if (isCav) {
                    type = cavalry;
                }
                const isInf = ['heavy_infantry', 'voltigeur', 'tirailleur', 'chasseur_pied', 'carabinier_pied'].includes(type);
                if (isInf) {
                    type = infantry;
                }
                const isArt = ['foot_artillery', 'artillerie_volante', 'general'].includes(type);
                if (isArt) {
                    type = artillery;
                }
            }
            return { ...cell, type };
        })));
    };

    // Reset state on open or variant change
    useEffect(() => {
        if (isOpen) {
            setBoard(createInitialBoard(currentVariant));
            setTurn('white');
            setSelectedPos(null);
            setValidMoves([]);
            setMoveHistory([]);
            setWhiteCaptures([]);
            setBlackCaptures([]);
            setIsCheck(false);
            setGameResult(null);
            setWinReason('');
            setIsAiThinking(false);
            setHint(null);
            setPromotionPending(null);
        }
    }, [isOpen, currentVariant]);

    const playAudioSound = (type: 'move' | 'capture' | 'check' | 'win' | 'lose') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'move') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(350, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'capture') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'check') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'win') {
                const notes = [400, 520, 650, 800];
                notes.forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.25);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.25);
                });
            } else if (type === 'lose') {
                const notes = [350, 300, 250, 180];
                notes.forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
                    o.start(ctx.currentTime + i * 0.12);
                    o.stop(ctx.currentTime + i * 0.12 + 0.3);
                });
            }
        } catch {
            // ignore
        }
    };

    const handleSquareClick = (row: number, col: number) => {
        if (gameResult || isAiThinking || turn !== 'white' || promotionPending) return;

        setHint(null);
        const clickedPiece = board[row][col];

        // Execute move if target square is in valid moves
        if (selectedPos) {
            const isValid = validMoves.some(m => m.row === row && m.col === col);
            if (isValid) {
                const p = board[selectedPos.row][selectedPos.col];
                if (p) {
                    const isNapoPromo = currentVariant === 'napoleonic' || currentVariant === 'fide_napoleonic' || currentVariant === 'napoleon_ottomans';
                    const isPawnPromo = p.type === 'pawn';
                    const isNapoInfantryPromo = isNapoPromo && (
                        p.type === 'heavy_infantry' || 
                        p.type === 'light_infantry' || 
                        p.type === 'grenadier' || 
                        p.type === 'chasseur_pied' || 
                        p.type === 'voltigeur' || 
                        p.type === 'tirailleur' || 
                        p.type === 'carabinier_pied' ||
                        p.type === 'pawn'
                    );
                    
                    const promoRow = p.color === 'white' ? 0 : board.length - 1;
                    
                    if (row === promoRow) {
                        if (currentVariant === 'bachelor' && (p.type === 'pawn' || p.type === 'rook' || p.type === 'bishop' || p.type === 'knight' || p.type === 'queen')) {
                            setPromotionPending({ from: selectedPos, to: { row, col }, piece: p });
                            return;
                        }
                        if (isNapoInfantryPromo) {
                            setPromotionPending({ from: selectedPos, to: { row, col }, piece: p });
                            return;
                        }
                        if (isPawnPromo && (currentVariant === 'cheskers' || currentVariant === 'standard' || currentVariant === 'capablanca' || currentVariant === 'carrera' || currentVariant === 'double' || currentVariant === 'archcourier')) {
                            setPromotionPending({ from: selectedPos, to: { row, col }, piece: p });
                            return;
                        }
                    }
                }
                executeMove(selectedPos, { row, col });
                return;
            }
        }

        // Select white piece
        if (clickedPiece && clickedPiece.color === 'white') {
            setSelectedPos({ row, col });
            const moves = getLegalMoves(board, { row, col }, currentVariant);
            setValidMoves(moves);
            return;
        }

        setSelectedPos(null);
        setValidMoves([]);
    };

    const executeMove = (from: Position, to: Position, promoChoice?: PieceType) => {
        const p = board[from.row][from.col];
        if (!p) return;

        const captured = board[to.row][to.col];
        const newBoard: BoardState = board.map(r => [...r]);
        
        let movedPiece = { ...p };
        if (promoChoice) {
            movedPiece.type = promoChoice;
        } else if (currentVariant === 'shogi' || currentVariant === 'heian_shogi' || currentVariant === 'sho_shogi') {
            const isWhite = p.color === 'white';
            const promoRows = currentVariant === 'heian_shogi' 
                ? (isWhite ? [0, 1, 2] : [5, 6, 7])
                : (isWhite ? [0, 1, 2] : [6, 7, 8]);
            
            const enteredOrMovedInZone = promoRows.includes(to.row) || promoRows.includes(from.row);
            if (enteredOrMovedInZone) {
                if (p.type === 'pawn') movedPiece.type = 'promoted_pawn';
                else if (p.type === 'silver_general') movedPiece.type = 'promoted_silver';
                else if (p.type === 'keima') movedPiece.type = 'promoted_knight';
                else if (p.type === 'lance') movedPiece.type = 'promoted_lance';
                else if (p.type === 'rook') movedPiece.type = 'dragon_king';
                else if (p.type === 'bishop') movedPiece.type = 'dragon_horse';
                else if (p.type === 'drunk_elephant' && currentVariant === 'sho_shogi') movedPiece.type = 'crown_prince';
            }
        } else if (p.type === 'pawn') {
            if (currentVariant === 'sittuyin') {
                const isWhite = p.color === 'white';
                const opponentHalf = isWhite ? [0, 1, 2, 3] : [4, 5, 6, 7];
                const isOnDiagonal = (to.row === to.col) || (to.row + to.col === 7);
                const isBackRow = to.row === (isWhite ? 0 : 7);
                if ((opponentHalf.includes(to.row) && isOnDiagonal) || isBackRow) {
                    movedPiece.type = 'ferz';
                }
            } else {
                const promoRow = p.color === 'white' ? 0 : newBoard.length - 1;
                if (to.row === promoRow) {
                    if (currentVariant === 'shatranj' || currentVariant === 'chaturanga') movedPiece.type = 'farzin';
                    else if (currentVariant === 'cheskers') movedPiece.type = 'king';
                    else movedPiece.type = 'queen';
                }
            }
        }

        newBoard[to.row][to.col] = movedPiece;
        newBoard[from.row][from.col] = null;

        let jumpedPiece: Piece | null = null;
        if (currentVariant === 'cheskers' && Math.abs(from.row - to.row) === 2 && Math.abs(from.col - to.col) === 2) {
            const midR = (from.row + to.row) / 2;
            const midC = (from.col + to.col) / 2;
            jumpedPiece = newBoard[midR][midC];
            newBoard[midR][midC] = null;
        }

        const effectiveCaptured = captured || jumpedPiece;

        if (effectiveCaptured) {
            playAudioSound('capture');
            if (p.color === 'white') setWhiteCaptures(prev => [...prev, effectiveCaptured]);
            else setBlackCaptures(prev => [...prev, effectiveCaptured]);
        } else {
            playAudioSound('move');
        }

        const moveObj: Move = { from, to, piece: movedPiece, captured: effectiveCaptured || undefined };
        setMoveHistory(prev => [...prev, moveObj]);
        setBoard(newBoard);
        setSelectedPos(null);
        setValidMoves([]);

        let nextTurn: PieceColor = 'white';
        if (currentVariant === 'chaturaji') {
            const order: PieceColor[] = ['white', 'red', 'black', 'green'];
            const curIdx = order.indexOf(p.color);
            for (let i = 1; i <= 4; i++) {
                const cand = order[(curIdx + i) % 4];
                const hasKing = newBoard.some(row => row.some(cell => cell && cell.type === 'king' && cell.color === cand));
                if (hasKing) {
                    nextTurn = cand;
                    break;
                }
            }

            const whiteHasKing = newBoard.some(row => row.some(cell => cell && cell.type === 'king' && cell.color === 'white'));
            if (!whiteHasKing) {
                setGameResult('defeat');
                setWinReason('Вашого Раджу (Короля) було захоплено у Чатураджі!');
                playAudioSound('lose');
                return;
            }

            const activeOpponents = ['red', 'black', 'green'].filter(c => 
                newBoard.some(row => row.some(cell => cell && cell.type === 'king' && cell.color === c))
            );

            if (activeOpponents.length === 0) {
                setGameResult('victory');
                setWinReason('Ви підкорили всіх 3-х суперників у Чатураджі!');
                playAudioSound('win');
                return;
            }
        } else {
            nextTurn = p.color === 'white' ? 'black' : 'white';

            // Bachelor Chess Marriage Win Condition: King adjacent to friendly Queen
            if (currentVariant === 'bachelor') {
                const movingColor = p.color;
                let playerKingPos: Position | null = null;
                const playerQueens: Position[] = [];

                for (let r = 0; r < newBoard.length; r++) {
                    for (let c = 0; c < newBoard[0].length; c++) {
                        const cell = newBoard[r][c];
                        if (cell && cell.color === movingColor) {
                            if (cell.type === 'king') playerKingPos = { row: r, col: c };
                            if (cell.type === 'queen') playerQueens.push({ row: r, col: c });
                        }
                    }
                }

                if (playerKingPos && playerQueens.length > 0) {
                    const isMarried = playerQueens.some(q => 
                        Math.max(Math.abs(playerKingPos!.row - q.row), Math.abs(playerKingPos!.col - q.col)) <= 1
                    );
                    if (isMarried) {
                        if (movingColor === 'white') {
                            setGameResult('victory');
                            setWinReason('Перемога Одруженням! Ваш Король опинився поруч із Королевою!');
                            playAudioSound('win');
                            return;
                        } else {
                            setGameResult('defeat');
                            setWinReason('Поразка Одруженням: Король суперника одружився з Королевою!');
                            playAudioSound('lose');
                            return;
                        }
                    }
                }
            }

            const isKing = (c: Piece | null) => c && (c.type === 'king' || c.type === 'emperor');
            const blackHasKing = newBoard.some(row => row.some(cell => isKing(cell) && cell!.color === 'black'));
            const whiteHasKing = newBoard.some(row => row.some(cell => isKing(cell) && cell!.color === 'white'));

            if (currentVariant === 'chaturanga') {
                if (!whiteHasKing) {
                    setGameResult('defeat');
                    setWinReason('Вашого Раджу (Короля) було захоплено у Чатуранзі!');
                    playAudioSound('lose');
                    return;
                }
                if (!blackHasKing) {
                    setGameResult('victory');
                    setWinReason('Раджу суперника було захоплено у Чатуранзі!');
                    playAudioSound('win');
                    return;
                }
            } else {
                if (!blackHasKing) {
                    setGameResult('victory');
                    setWinReason('Усіх Королів суперника захоплено!');
                    playAudioSound('win');
                    return;
                }

                if (!whiteHasKing) {
                    setGameResult('defeat');
                    setWinReason('Усіх ваших Королів захоплено!');
                    playAudioSound('lose');
                    return;
                }

                // Check if nextTurn has ANY legal moves (Checkmate & Stalemate evaluation with early break)
                let hasAnyLegalMove = false;
                checkLegalLoop: for (let r = 0; r < newBoard.length; r++) {
                    for (let c = 0; c < newBoard[0].length; c++) {
                        const cellPiece = newBoard[r][c];
                        if (cellPiece && cellPiece.color === nextTurn) {
                            const lm = getLegalMoves(newBoard, { row: r, col: c }, currentVariant);
                            if (lm.length > 0) {
                                hasAnyLegalMove = true;
                                break checkLegalLoop;
                            }
                        }
                    }
                }

                const inCheck = isKingInCheck(newBoard, nextTurn, currentVariant);
                setIsCheck(inCheck);

                if (!hasAnyLegalMove) {
                    if (inCheck) {
                        if (nextTurn === 'white') {
                            setGameResult('defeat');
                            setWinReason('Шах і Мат! Вашому Королю поставлено мат.');
                            playAudioSound('lose');
                        } else {
                            setGameResult('victory');
                            setWinReason('Шах і Мат! Королю суперника поставлено мат!');
                            playAudioSound('win');
                        }
                    } else {
                        setGameResult('draw');
                        setWinReason('Пат! Немає можливих ходів.');
                    }
                    return;
                }

                if (inCheck) playAudioSound('check');
            }
        }

        setTurn(nextTurn);
    };

    // AI Bot Turn
    useEffect(() => {
        if (!isOpen || gameResult || turn === 'white') return;

        setIsAiThinking(true);
        const timer = setTimeout(() => {
            const allMoves: { from: Position; to: Position; score: number }[] = [];

            for (let r = 0; r < board.length; r++) {
                for (let c = 0; c < board[0].length; c++) {
                    const p = board[r][c];
                    if (p && p.color === turn) {
                        const moves = getLegalMoves(board, { row: r, col: c }, currentVariant);
                        moves.forEach(m => {
                            let score = Math.random() * 5;
                            const target = board[m.row][m.col];
                             if (target) {
                                if (target.type === 'king' || target.type === 'crown_prince') score += 1000;
                                else if (target.type === 'queen' || target.type === 'dragon_king' || target.type === 'dragon_horse' || target.type === 'archbishop' || target.type === 'chancellor' || target.type === 'centurion' || target.type === 'squirrel') score += 90;
                                else if (target.type === 'crowned_rook') score += 60;
                                else if (target.type === 'rook' || target.type === 'archcourier' || target.type === 'cannon') score += 50;
                                else if (target.type === 'gold_general' || target.type === 'promoted_silver' || target.type === 'promoted_knight' || target.type === 'promoted_lance' || target.type === 'drunk_elephant') score += 40;
                                else if (target.type === 'bishop' || target.type === 'knight' || target.type === 'gaja' || target.type === 'camel' || target.type === 'duke' || target.type === 'silver_general') score += 30;
                                else if (target.type === 'decurion' || target.type === 'guard' || target.type === 'lance' || target.type === 'keima' || target.type === 'promoted_pawn') score += 20;
                                else score += 10;
                            }
                            if (currentVariant === 'cheskers' && Math.abs(m.row - r) === 2) score += 40;
                            if (currentVariant === 'bachelor') {
                                if (m.row === (board.length - 1)) score += 150;
                                // Check if this move marries black king with queen
                                const simB = board.map(rowArr => [...rowArr]);
                                const simPType = (m.row === board.length - 1) ? 'queen' : p.type;
                                simB[m.row][m.col] = { ...p, type: simPType };
                                simB[r][c] = null;
                                let bk: Position | null = null;
                                const bq: Position[] = [];
                                for (let sr = 0; sr < simB.length; sr++) {
                                    for (let sc = 0; sc < simB[0].length; sc++) {
                                        const sp = simB[sr][sc];
                                        if (sp && sp.color === 'black') {
                                            if (sp.type === 'king') bk = { row: sr, col: sc };
                                            if (sp.type === 'queen') bq.push({ row: sr, col: sc });
                                        }
                                    }
                                }
                                if (bk && bq.some(q => Math.max(Math.abs(bk!.row - q.row), Math.abs(bk!.col - q.col)) <= 1)) {
                                    score += 5000;
                                }
                            }
                            allMoves.push({ from: { row: r, col: c }, to: m, score });
                        });
                    }
                }
            }

            if (allMoves.length > 0) {
                allMoves.sort((a, b) => b.score - a.score);
                const chosen = allMoves[0];
                const p = board[chosen.from.row][chosen.from.col];
                const isPromo = p && chosen.to.row === (board.length - 1) && (
                    p.type === 'pawn' || 
                    p.type === 'heavy_infantry' || 
                    p.type === 'light_infantry' || 
                    p.type === 'grenadier' ||
                    (currentVariant === 'bachelor' && (p.type === 'rook' || p.type === 'bishop' || p.type === 'knight' || p.type === 'queen'))
                );
                const promoChoice = isPromo 
                    ? ((currentVariant === 'napoleonic' || currentVariant === 'fide_napoleonic' || currentVariant === 'napoleon_ottomans') ? 'guard_infantry' : (currentVariant === 'archchess' || currentVariant === 'archcourier' || currentVariant === 'bachelor') ? 'queen' : 'king') 
                    : undefined;
                executeMove(chosen.from, chosen.to, promoChoice);
            } else {
                if (currentVariant === 'chaturaji') {
                    const order: PieceColor[] = ['white', 'red', 'black', 'green'];
                    const curIdx = order.indexOf(turn);
                    for (let i = 1; i <= 4; i++) {
                        const cand = order[(curIdx + i) % 4];
                        const hasKing = board.some(row => row.some(cell => cell && cell.type === 'king' && cell.color === cand));
                        if (hasKing && cand !== turn) {
                            setTurn(cand);
                            break;
                        }
                    }
                } else {
                    setGameResult('victory');
                    setWinReason('Суперник не має можливих ходів (Пат або Мат)');
                    playAudioSound('win');
                }
            }

            setIsAiThinking(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [turn, isOpen, gameResult, board, currentVariant]);

    if (!isOpen) return null;

    const info = VARIANT_INFO[currentVariant] || VARIANT_INFO['napoleonic'];
    const rows = board.length;
    const cols = board[0].length;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-5xl bg-[#1a140f] border-2 border-[#b8860b] rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#241a12] border-b border-[#b8860b]/40 gap-2">
                    <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-lg font-bold font-serif text-amber-200 leading-none">
                                    {info.title}
                                </h2>
                                <select
                                    value={currentVariant}
                                    onChange={(e) => setCurrentVariant(e.target.value as GameVariant)}
                                    className="text-[11px] bg-[#2e2015] border border-[#b8860b]/50 text-amber-300 rounded px-2 py-0.5 outline-none hover:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer"
                                    title="Змінити варіант шахів"
                                >
                                    <optgroup label="Наполеонівські варіанти">
                                        <option value="napoleonic">Класичні Наполеонівські (14x14)</option>
                                        <option value="fide_napoleonic">Наполеонівські FIDE (8x8)</option>
                                        <option value="napoleon_ottomans">Наполеон і Османи (10x10)</option>
                                    </optgroup>
                                    <optgroup label="Історичні та Європейські">
                                        <option value="bachelor">Шахи Холостяка (Bachelor Chess 7x6)</option>
                                        <option value="standard">Класичні Шахи (8x8)</option>
                                        <option value="shatranj">Шатрандж (8x8)</option>
                                        <option value="chaturanga">Чатуранга (8x8)</option>
                                        <option value="chaturaji">Чатураджі (4 гравці)</option>
                                        <option value="tamerlane">Шахи Тамерлана (10x11)</option>
                                        <option value="courier">Курʼєрські Шахи (12x8)</option>
                                        <option value="capablanca">Шахи Капабланки (10x8)</option>
                                        <option value="carrera">Шахи Каррери (10x8)</option>
                                        <option value="grasshopper">Кониковий Варіант (Grasshopper)</option>
                                        <option value="cheskers">Ческерс (Шахо-Шашки)</option>
                                        <option value="archchess">Археошахи (Archchess 10x8)</option>
                                        <option value="archcourier">Архкурʼєрські Шахи (12x8)</option>
                                    </optgroup>
                                    <optgroup label="Східні та Азійські">
                                        <option value="xiangqi">Китайські Сянци (9x10)</option>
                                        <option value="janggi">Корейські Чангі (9x10)</option>
                                        <option value="shogi">Японські Сьогі (9x9)</option>
                                        <option value="sho_shogi">Малі Шо Сьогі (9x9)</option>
                                        <option value="heian_shogi">Давні Хеян Сьогі (8x8)</option>
                                        <option value="makruk">Тайський Макрук (8x8)</option>
                                        <option value="sittuyin">Бірманський Сіттуїн (8x8)</option>
                                        <option value="shatar">Монгольський Шатар (8x8)</option>
                                        <option value="senterej">Ефіопський Сентерей (8x8)</option>
                                        <option value="al_adli">Шахи Аль-Адлі (8x8)</option>
                                    </optgroup>
                                </select>
                            </div>
                            <p className="text-[11px] text-amber-400/80 mt-0.5">
                                Таверна «{tavernName}» • Противник: {opponent.name} ({opponent.title})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-1.5 bg-[#2d2117] hover:bg-[#3d2e20] text-amber-300 rounded-lg border border-[#b8860b]/30 transition"
                            title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-1.5 bg-[#2d2117] hover:bg-[#3d2e20] text-amber-300 rounded-lg border border-[#b8860b]/30 transition flex items-center gap-1 text-xs"
                        >
                            <BookOpen className="w-4 h-4" />
                            <span className="hidden sm:inline">Правила</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-200 rounded-lg border border-rose-500/40 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col md:flex-row gap-4 items-center md:items-start justify-center">
                    {/* Left: Chess Board & Controls */}
                    <div className="flex flex-col items-center gap-2 w-full max-w-xl">
                        {/* Opponent Info Bar */}
                        <div className="w-full flex items-center justify-between px-3 py-2 bg-[#201811] border border-[#b8860b]/30 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                                <Bot className={`w-4 h-4 ${isAiThinking ? 'text-amber-400 animate-spin' : 'text-stone-400'}`} />
                                <span className="font-bold text-stone-200">{opponent.name}</span>
                                {isAiThinking && (
                                    <span className="text-[10px] text-amber-400 italic">обмірковує хід...</span>
                                )}
                                {blackIsEngaged && (
                                    <span className="px-2 py-0.5 bg-rose-950/90 border border-rose-500 text-rose-300 text-[10px] font-black rounded-full animate-pulse flex items-center gap-1">
                                        💍 ЗАРУЧЕНИЙ (Загроза одруження!)
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {blackCaptures.map((p, idx) => (
                                    <span key={idx} className="text-xs" title={p.type}>
                                        {PIECE_META[p.type]?.symbol || '♟'}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Board Canvas */}
                        {currentVariant === 'xiangqi' || currentVariant === 'janggi' ? (
                            <div 
                                className="relative w-full border-4 border-[#3a2312] rounded-xl shadow-2xl overflow-hidden bg-[#e5c185] p-2 sm:p-3 select-none mx-auto"
                                style={{
                                    width: '100%',
                                    maxWidth: 'min(100%, 54vh)',
                                    aspectRatio: `${cols} / ${rows}`
                                }}
                            >
                                {/* SVG Board Grid Overlay */}
                                <svg 
                                    className="absolute inset-0 w-full h-full p-2 sm:p-3 pointer-events-none" 
                                    viewBox="0 0 900 1000" 
                                    preserveAspectRatio="none"
                                >
                                    {/* Outer Frame */}
                                    <rect x="36" y="36" width="828" height="928" stroke="#4a2e16" strokeWidth="2" fill="none" />
                                    <rect x="50" y="50" width="800" height="900" stroke="#3d2411" strokeWidth="4" fill="none" />

                                    {/* Horizontal Ranks (10 Lines) */}
                                    {Array.from({ length: 10 }).map((_, r) => (
                                        <line 
                                            key={`r-${r}`} 
                                            x1="50" 
                                            y1={50 + r * 100} 
                                            x2="850" 
                                            y2={50 + r * 100} 
                                            stroke="#4a2e16" 
                                            strokeWidth="2.5" 
                                        />
                                    ))}

                                    {/* Vertical Files (9 Lines) */}
                                    <line x1="50" y1="50" x2="50" y2="950" stroke="#4a2e16" strokeWidth="3" />
                                    <line x1="850" y1="50" x2="850" y2="950" stroke="#4a2e16" strokeWidth="3" />

                                    {Array.from({ length: 7 }).map((_, idx) => {
                                        const c = idx + 1;
                                        const x = 50 + c * 100;
                                        if (currentVariant === 'xiangqi') {
                                            return (
                                                <g key={`c-${c}`}>
                                                    <line x1={x} y1="50" x2={x} y2="450" stroke="#4a2e16" strokeWidth="2.5" />
                                                    <line x1={x} y1="550" x2={x} y2="950" stroke="#4a2e16" strokeWidth="2.5" />
                                                </g>
                                            );
                                        } else {
                                            return (
                                                <line key={`c-${c}`} x1={x} y1="50" x2={x} y2="950" stroke="#4a2e16" strokeWidth="2.5" />
                                            );
                                        }
                                    })}

                                    {/* River Calligraphic Text */}
                                    {currentVariant === 'xiangqi' && (
                                        <g fill="#4a2e16" fontSize="36" fontWeight="bold" fontFamily="serif" textAnchor="middle" dominantBaseline="middle">
                                            <text x="250" y="500">楚   河</text>
                                            <text x="650" y="500">漢   界</text>
                                        </g>
                                    )}

                                    {/* Palaces (Fortress X Diagonals) */}
                                    {/* Top Palace (Black) */}
                                    <line x1="350" y1="50" x2="550" y2="250" stroke="#4a2e16" strokeWidth="2" />
                                    <line x1="550" y1="50" x2="350" y2="250" stroke="#4a2e16" strokeWidth="2" />

                                    {/* Bottom Palace (Red/White) */}
                                    <line x1="350" y1="750" x2="550" y2="950" stroke="#4a2e16" strokeWidth="2" />
                                    <line x1="550" y1="750" x2="350" y2="950" stroke="#4a2e16" strokeWidth="2" />

                                    {/* Crosshairs on Cannon & Pawn Starting Points */}
                                    {[
                                        { r: 2, c: 1 }, { r: 2, c: 7 },
                                        { r: 7, c: 1 }, { r: 7, c: 7 },
                                        { r: 3, c: 0, skipLeft: true }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 3, c: 6 }, { r: 3, c: 8, skipRight: true },
                                        { r: 6, c: 0, skipLeft: true }, { r: 6, c: 2 }, { r: 6, c: 4 }, { r: 6, c: 6 }, { r: 6, c: 8, skipRight: true },
                                    ].map((mark, i) => {
                                        const cx = 50 + mark.c * 100;
                                        const cy = 50 + mark.r * 100;
                                        const d = 6;
                                        const l = 10;
                                        return (
                                            <g key={`mark-${i}`} stroke="#4a2e16" strokeWidth="1.8" fill="none">
                                                {!mark.skipLeft && (
                                                    <>
                                                        <path d={`M ${cx - d - l} ${cy - d} L ${cx - d} ${cy - d} L ${cx - d} ${cy - d - l}`} />
                                                        <path d={`M ${cx - d - l} ${cy + d} L ${cx - d} ${cy + d} L ${cx - d} ${cy + d + l}`} />
                                                    </>
                                                )}
                                                {!mark.skipRight && (
                                                    <>
                                                        <path d={`M ${cx + d + l} ${cy - d} L ${cx + d} ${cy - d} L ${cx + d} ${cy - d - l}`} />
                                                        <path d={`M ${cx + d + l} ${cy + d} L ${cx + d} ${cy + d} L ${cx + d} ${cy + d + l}`} />
                                                    </>
                                                )}
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Intersections Interactive Grid */}
                                <div 
                                    className="grid gap-0 relative w-full h-full z-10 p-2 sm:p-3"
                                    style={{
                                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
                                    }}
                                >
                                    {Array.from({ length: rows }).map((_, r) => 
                                        Array.from({ length: cols }).map((_, c) => {
                                            const piece = board[r][c];
                                            const isSelected = selectedPos?.row === r && selectedPos?.col === c;
                                            const isValidMove = validMoves.some(m => m.row === r && m.col === c);

                                            return (
                                                <button
                                                    key={`${r}-${c}`}
                                                    onClick={() => handleSquareClick(r, c)}
                                                    className="relative flex items-center justify-center transition-all cursor-pointer group"
                                                >
                                                    {/* Rank Coordinate Number */}
                                                    {c === 0 && (
                                                        <span className="absolute top-0 left-0.5 text-[8px] opacity-70 font-mono text-[#3a2312] pointer-events-none font-bold">
                                                            {10 - r}
                                                        </span>
                                                    )}

                                                    {/* Selection Highlight */}
                                                    {isSelected && (
                                                        <div className="absolute w-9 h-9 sm:w-11 sm:h-11 bg-amber-400/40 border-2 border-amber-500 rounded-full z-20 animate-pulse shadow-lg" />
                                                    )}

                                                    {/* Valid Move Indicator */}
                                                    {isValidMove && (
                                                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                                            {piece ? (
                                                                <div className="w-9 h-9 sm:w-11 sm:h-11 border-2 border-rose-500 rounded-full animate-ping" />
                                                            ) : (
                                                                <div className="w-3.5 h-3.5 bg-emerald-600 rounded-full shadow-md ring-2 ring-white/90 animate-bounce" />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Styled Piece Token */}
                                                    {piece && (
                                                        <ChessPieceToken piece={piece} isSelected={isSelected} variant={currentVariant} />
                                                    )}

                                                    {/* File Coordinate Letter */}
                                                    {r === rows - 1 && (
                                                        <span className="absolute bottom-0 right-0.5 text-[8px] opacity-70 font-mono text-[#3a2312] pointer-events-none font-bold">
                                                            {files[c]}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div 
                                className="grid gap-0 border-4 border-[#3d2c1d] rounded-xl shadow-2xl overflow-hidden bg-[#2b1f14] p-1 mx-auto"
                                style={{
                                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                    width: '100%',
                                    maxWidth: 'min(100%, 54vh)',
                                    aspectRatio: `${cols} / ${rows}`
                                }}
                            >
                                {Array.from({ length: rows }).map((_, r) => 
                                    Array.from({ length: cols }).map((_, c) => {
                                        const isDark = (r + c) % 2 === 1;
                                        const piece = board[r][c];
                                        const isSelected = selectedPos?.row === r && selectedPos?.col === c;
                                        const isValidMove = validMoves.some(m => m.row === r && m.col === c);

                                        return (
                                            <button
                                                key={`${r}-${c}`}
                                                onClick={() => handleSquareClick(r, c)}
                                                className={`relative flex items-center justify-center aspect-square transition-all ${
                                                    currentVariant === 'sittuyin'
                                                        ? 'bg-[#d8b168] border border-[#4a2e16]/20'
                                                        : (isDark ? 'bg-[#5a422e]' : 'bg-[#c2a688]')
                                                } hover:brightness-110 cursor-pointer`}
                                            >
                                                {/* Sittuyin Diagonal Lines (16 Marked Squares) */}
                                                {currentVariant === 'sittuyin' && r === c && (
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 stroke-[#4a2e16] stroke-[2]" viewBox="0 0 100 100">
                                                        <line x1="0" y1="0" x2="100" y2="100" />
                                                    </svg>
                                                )}
                                                {currentVariant === 'sittuyin' && r + c === 7 && (
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 stroke-[#4a2e16] stroke-[2]" viewBox="0 0 100 100">
                                                        <line x1="100" y1="0" x2="0" y2="100" />
                                                    </svg>
                                                )}

                                                {/* Rank Coordinate Number */}
                                                {c === 0 && (
                                                    <span className="absolute top-0.5 left-1 text-[8px] opacity-60 font-mono pointer-events-none">
                                                        {rows - r}
                                                    </span>
                                                )}

                                                {/* Selection Highlight */}
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-amber-400/40 ring-2 ring-amber-300 ring-inset z-20 animate-pulse" />
                                                )}

                                                {/* Valid Move Indicator */}
                                                {isValidMove && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                                        {piece ? (
                                                            <div className="w-full h-full border-2 border-rose-500 rounded-full animate-ping" />
                                                        ) : (
                                                            <div className="w-3 h-3 bg-emerald-400 rounded-full shadow ring-2 ring-white/80 animate-bounce" />
                                                        )}
                                                    </div>
                                                )}

                                                {/* Styled Piece Token */}
                                                {piece && (
                                                    <ChessPieceToken piece={piece} isSelected={isSelected} variant={currentVariant} />
                                                )}

                                                {/* File Coordinate Letter */}
                                                {r === rows - 1 && (
                                                    <span className="absolute bottom-0.5 right-1 text-[8px] opacity-60 font-mono pointer-events-none">
                                                        {files[c]}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* Player Info Bar */}
                        <div className="w-full flex items-center justify-between px-3 py-2 bg-[#201811] border border-[#b8860b]/30 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                                <Swords className="w-4 h-4 text-amber-400" />
                                <span className="font-bold text-amber-200">Ваш хід (Білі)</span>
                                {isCheck && (
                                    <span className="px-2 py-0.5 bg-rose-900/80 border border-rose-500 text-rose-200 text-[10px] font-black rounded-full animate-bounce">
                                        ШАХ!
                                    </span>
                                )}
                                {whiteIsEngaged && (
                                    <span className="px-2 py-0.5 bg-pink-950/90 border border-pink-500 text-pink-200 text-[10px] font-black rounded-full animate-pulse flex items-center gap-1">
                                        💍 ЗАРУЧЕНИЙ (Можна одружитися наступним ходом!)
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {whiteCaptures.map((p, idx) => (
                                    <span key={idx} className="text-xs" title={p.type}>
                                        {PIECE_META[p.type]?.symbol || '♙'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Rules & Move History */}
                    <div className="w-full md:w-80 flex flex-col gap-3 shrink-0">
                        {/* Variant Info Box */}
                        <div className="p-3 bg-[#201811] border border-[#b8860b]/40 rounded-xl text-xs space-y-2">
                            <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-1.5">
                                <span className="font-bold text-amber-300 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5" /> {info.title}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 bg-amber-950/60 border border-amber-500/30 text-amber-200 rounded-full">
                                    {info.origin}
                                </span>
                            </div>
                            <p className="text-stone-300 leading-relaxed italic text-[11px]">
                                {info.desc}
                            </p>
                        </div>

                        {/* Free Choice Napoleonic Subunit Selection (Вільний вибір підрозділів) */}
                        {(currentVariant === 'fide_napoleonic' || currentVariant === 'napoleonic' || currentVariant === 'napoleon_ottomans') && (
                            <div className="p-3 bg-[#201811] border border-[#b8860b]/40 rounded-xl text-xs space-y-2.5">
                                <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-1.5">
                                    <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                                        🎖️ Вільний вибір підрозділів
                                    </span>
                                    <span className="text-[9px] text-stone-400 font-mono">
                                        Free Choice
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-[10px] text-amber-200/90 font-medium block mb-0.5">
                                            Гвардійська кавалерія (GC):
                                        </label>
                                        <select
                                            value={customSubunitCavalry}
                                            onChange={(e) => {
                                                const val = e.target.value as PieceType;
                                                setCustomSubunitCavalry(val);
                                                applySubunitSelections(val, customSubunitInfantry, customSubunitArtillery);
                                            }}
                                            className="w-full bg-[#17100b] border border-[#b8860b]/50 rounded-lg px-2 py-1 text-amber-100 text-[11px] focus:outline-none focus:border-amber-400"
                                        >
                                            <option value="guard_cavalry">Слон / Guard Cavalry (діагоналі)</option>
                                            <option value="mameluke">Мамелюк / Mameluke (2 ходи конем)</option>
                                            <option value="cuirassier">Кірасир / Cuirassier (Кінь + 1 крок ортогонально)</option>
                                            <option value="hussar">Гусар / Hussar (Кінь + 1 крок по діагоналі)</option>
                                            <option value="lancer">Улан / Lancer (Ходить як тура, б'є як кінь)</option>
                                            <option value="carabinier">Карабінер (Кінь + далекобійна атака)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-amber-200/90 font-medium block mb-0.5">
                                            Спеціалізація піхоти:
                                        </label>
                                        <select
                                            value={customSubunitInfantry}
                                            onChange={(e) => {
                                                const val = e.target.value as PieceType;
                                                setCustomSubunitInfantry(val);
                                                applySubunitSelections(customSubunitCavalry, val, customSubunitArtillery);
                                            }}
                                            className="w-full bg-[#17100b] border border-[#b8860b]/50 rounded-lg px-2 py-1 text-amber-100 text-[11px] focus:outline-none focus:border-amber-400"
                                        >
                                            <option value="heavy_infantry">Важка піхота / Heavy Infantry (Стандартний пішак)</option>
                                            <option value="voltigeur">Вольтижер / Voltigeur (1 крок у будь-який бік)</option>
                                            <option value="chasseur_pied">Шасер / Chasseur à pied</option>
                                            <option value="tirailleur">Тиральєр / Tirailleur</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-amber-200/90 font-medium block mb-0.5">
                                            Спеціалізація артилерії:
                                        </label>
                                        <select
                                            value={customSubunitArtillery}
                                            onChange={(e) => {
                                                const val = e.target.value as PieceType;
                                                setCustomSubunitArtillery(val);
                                                applySubunitSelections(customSubunitCavalry, customSubunitInfantry, val);
                                            }}
                                            className="w-full bg-[#17100b] border border-[#b8860b]/50 rounded-lg px-2 py-1 text-amber-100 text-[11px] focus:outline-none focus:border-amber-400"
                                        >
                                            <option value="foot_artillery">Піша артилерія / Foot Artillery (Гармата Pao)</option>
                                            <option value="artillerie_volante">Кінно-літаюча артилерія (Тура + 1 крок по діагоналі)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Move History */}
                        <div className="p-3 bg-[#201811] border border-[#b8860b]/40 rounded-xl text-xs flex-1 flex flex-col min-h-[140px]">
                            <span className="font-bold text-amber-200 mb-2 block border-b border-[#b8860b]/30 pb-1">
                                Історія ходів:
                            </span>
                            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] text-stone-300 pr-1 max-h-48">
                                {moveHistory.length === 0 ? (
                                    <div className="text-stone-500 italic text-center py-4">Зробіть перший хід</div>
                                ) : (
                                    moveHistory.map((m, idx) => (
                                        <div key={idx} className="flex items-center justify-between border-b border-stone-800/50 py-0.5">
                                            <span>{idx + 1}. {m.piece.color === 'white' ? 'Білі' : 'Чорні'}</span>
                                            <span className="text-amber-300 font-bold">
                                                {files[m.from.col]}{rows - m.from.row} ➔ {files[m.to.col]}{rows - m.to.row} {m.captured ? '⚔️' : ''}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Rules Overlay Drawer */}
                        {showRules && (
                            <div className="p-3 bg-[#2a1e15] border border-amber-500/50 rounded-xl text-xs space-y-1.5 text-stone-200 animate-fade-in">
                                <div className="font-bold text-amber-300 flex items-center justify-between">
                                    <span>Довідник правил {info.title}</span>
                                    <button onClick={() => setShowRules(false)} className="text-stone-400 hover:text-white">✕</button>
                                </div>
                                <p className="text-[11px] leading-relaxed">
                                    {currentVariant === 'bachelor' ? (
                                        <>
                                            • <b>Одруження (Marriage)</b>: Якщо Король стає на сусідню клітинку (по вертикалі, горизонталі чи діагоналі) до своєї Королеви — гравець негайно виграє «одруженням»!<br />
                                            • <b>Заручини (Engaged)</b>: Якщо Король може одружитися наступного ходу, він вважається зарученим.<br />
                                            • <b>Шах</b>: Якщо Король під шахом, рух Короля або Ферзя поруч дозволений лише якщо це одночасно виводить Короля з-під шаху.<br />
                                            • <b>Перетворення на 6-й горизонталі</b>: Будь-яка Тура, Слон, Кінь або Ферзь при вході на 6-ту горизонталь (останній ряд) може перетворитися на будь-яку з цих 4-х фігур. Пішак, що досягає останнього ряду, обов'язково перетворюється.<br />
                                            • <b>Пішаки</b>: Ходять тільки на 1 клітинку вперед (без подвійного ходу та без взяття на проході).<br />
                                        </>
                                    ) : currentVariant === 'fide_napoleonic' ? (
                                        <>
                                            • <b>Імператор (E)</b>: Ходить як класичний Король (1 крок у будь-якому з 8 напрямків).<br />
                                            • <b>Маршал (M)</b>: Ходить як Ферзь по порожніх полях, але б'є ворожі фігури лише на сусідніх клітинках (як Король).<br />
                                            • <b>Гвардійська піхота (GI)</b>: Ходить як Ферзь на відстань до 2-х клітинок.<br />
                                            • <b>Гвардійська кавалерія (GC)</b>: Ходить як класичний Слон.<br />
                                            • <b>Важка кавалерія (HC)</b>: Вершник (Knightrider) — здійснює необмежену серію стрибків конем по прямій лінії.<br />
                                            • <b>Легка кавалерія (LC)</b>: Верблюд (Camel) — стрибок 3×1 або 1×3.<br />
                                            • <b>Гренадери (g)</b>: Стюард — хід на 1 клітинку ортогонально (на порожнє поле), взяття на 1 клітинку по діагоналі.<br />
                                            • <b>Драгуни (D)</b>: Поєднує хід Коня та Гренадера (кінна піхота).<br />
                                            • <b>Важка піхота (hi)</b>: Ходить як класичний пішак (1 крок прямо, перший хід подвійний, взяття по діагоналі вперед).<br />
                                            • <b>Легка піхота (li)</b>: Пішак Бероліни (хід по діагоналі вперед, взяття прямо вперед).<br />
                                            • <b>Кінна артилерія (HA)</b>: Ходить як класична Тура.<br />
                                            • <b>Піша артилерія (FA)</b>: Китайська гармата (Pao) — хід як тура, взяття через 1 фігуру-екран.<br />
                                            • <b>Перетворення</b>: Піхота перетворюється на <i>Гвардійську піхоту</i> або <i>Драгунів</i>. Рокіровка та взяття на проході відсутні.<br />
                                        </>
                                    ) : currentVariant === 'chaturanga' || currentVariant === 'chaturaji' ? (
                                        <>• Мета гри: Побити Раджу (Короля) суперника безпосередньо (мату немає)!<br /></>
                                    ) : currentVariant === 'cheskers' ? (
                                        <>• Мета гри: Побити всіх Королів суперника або позбавити ходів.<br />• Взяття для Пішаків та Королів є обов\'язковим!</>
                                    ) : (
                                        <>• Мета гри: Поставити Шах і Мат Королю суперника.<br /></>
                                    )}
                                    • Натисніть на свої фігури (Білі), щоб побачити доступні підсвічені зелені ходи.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pawn Promotion Modal */}
                {promotionPending && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
                        <div className="w-full max-w-sm bg-[#231b14] border-2 border-[#b8860b] rounded-2xl p-5 text-center space-y-4 shadow-2xl">
                            <h3 className="text-lg font-bold font-serif text-amber-200">
                                Перетворення пішака!
                            </h3>
                            <p className="text-xs text-stone-300">
                                Оберіть фігуру, у яку перетвориться ваш пішак:
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                {currentVariant === 'cheskers' ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                executeMove(promotionPending.from, promotionPending.to, 'king');
                                                setPromotionPending(null);
                                            }}
                                            className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                        >
                                            <span className="text-2xl">♔</span>
                                            <span className="text-xs font-bold">Король</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                executeMove(promotionPending.from, promotionPending.to, 'bishop');
                                                setPromotionPending(null);
                                            }}
                                            className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                        >
                                            <span className="text-2xl">♗</span>
                                            <span className="text-xs font-bold">Слон</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                executeMove(promotionPending.from, promotionPending.to, 'camel');
                                                setPromotionPending(null);
                                            }}
                                            className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                        >
                                            <span className="text-2xl">🐪</span>
                                            <span className="text-xs font-bold">Верблюд</span>
                                        </button>
                                    </>
                                ) : (currentVariant === 'napoleonic' || currentVariant === 'fide_napoleonic' || currentVariant === 'napoleon_ottomans') ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                executeMove(promotionPending.from, promotionPending.to, 'guard_infantry');
                                                setPromotionPending(null);
                                            }}
                                            className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                        >
                                            <span className="text-2xl">💂</span>
                                            <span className="text-xs font-bold">Гвардійська піхота</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                executeMove(promotionPending.from, promotionPending.to, 'dragoon');
                                                setPromotionPending(null);
                                            }}
                                            className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                        >
                                            <span className="text-2xl">🏇</span>
                                            <span className="text-xs font-bold">Драгун</span>
                                        </button>
                                        {currentVariant === 'napoleonic' && (
                                            <button
                                                onClick={() => {
                                                    executeMove(promotionPending.from, promotionPending.to, 'engineer');
                                                    setPromotionPending(null);
                                                }}
                                                className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                            >
                                                <span className="text-2xl">🛠️</span>
                                                <span className="text-xs font-bold">Сапер / Інженер</span>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                executeMove(promotionPending.from, promotionPending.to, 'queen');
                                                setPromotionPending(null);
                                            }}
                                            className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                        >
                                            <span className="text-2xl">♕</span>
                                            <span className="text-xs font-bold">Ферзь</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                executeMove(promotionPending.from, promotionPending.to, 'rook');
                                                setPromotionPending(null);
                                            }}
                                            className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                        >
                                            <span className="text-2xl">♖</span>
                                            <span className="text-xs font-bold">Тура</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                executeMove(promotionPending.from, promotionPending.to, 'bishop');
                                                setPromotionPending(null);
                                            }}
                                            className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                        >
                                            <span className="text-2xl">♗</span>
                                            <span className="text-xs font-bold">Слон</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                executeMove(promotionPending.from, promotionPending.to, 'knight');
                                                setPromotionPending(null);
                                            }}
                                            className="p-3 bg-amber-950/80 hover:bg-amber-800 border border-amber-500 rounded-xl flex flex-col items-center gap-1 text-amber-200 cursor-pointer"
                                        >
                                            <span className="text-2xl">♘</span>
                                            <span className="text-xs font-bold">Кінь</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Victory / Defeat Modal Overlay */}
                <AnimatePresence>
                    {gameResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        >
                            <div className="w-full max-w-md bg-[#231b14] border-2 border-[#b8860b] rounded-2xl p-6 text-center space-y-4 shadow-2xl">
                                <div className="text-5xl animate-bounce">
                                    {gameResult === 'victory' ? '👑' : gameResult === 'draw' ? '🤝' : '💀'}
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black font-serif text-amber-200">
                                        {gameResult === 'victory' ? 'ПЕРЕМОГА!' : gameResult === 'draw' ? 'НІЧИЯ!' : 'ПОРАЗКА'}
                                    </h3>
                                    <p className="text-xs text-stone-300 mt-1">
                                        {winReason}
                                    </p>
                                </div>

                                <div className="p-3 bg-black/40 border border-[#b8860b]/40 rounded-xl text-xs text-amber-300/90">
                                    {gameResult === 'victory' 
                                        ? `Ви обіграли ${opponent.name} у ${info.title}!` 
                                        : gameResult === 'draw'
                                        ? `Нічия у партії проти ${opponent.name}!`
                                        : `${opponent.name} виявився сильнішим у цій партії.`}
                                </div>

                                <button
                                    onClick={() => {
                                        if (gameResult === 'victory') onVictory();
                                        else onDefeat();
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-stone-950 font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer"
                                >
                                    Продовжити
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

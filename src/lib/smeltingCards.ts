import { Card, Suit, Rank } from '../types';

export type SmeltingCategory = 
    | 'all'
    | 'hero' 
    | 'mage' 
    | 'commander' 
    | 'defense' 
    | 'economy' 
    | 'spell' 
    | 'smelt_release' 
    | 'classic' 
    | 'tarot';

export interface SmeltingCardOption {
    key: string;
    title: string;
    desc: string;
    category: SmeltingCategory;
    icon: string;
    badge?: string;
    cardTemplate: Omit<Card, 'id'>;
}

export const ALL_SMELTING_CARDS: SmeltingCardOption[] = [
    // 1. HEROES & LEGENDS
    {
        key: 'hero',
        title: 'Ейнхерій / Герой',
        desc: 'Сила 99. Могутній воїн з Вальгалли. Б\'є майже будь-яку карту.',
        category: 'hero',
        icon: '🛡️',
        badge: 'Сила 99',
        cardTemplate: { suit: '🛡️', rank: 'HR (Герой)', value: 99, isHero: true }
    },
    {
        key: 'death',
        title: 'Смерть',
        desc: 'Сила 100. Абсолютна карта. Знищує будь-яку карту та блокує підкидання.',
        category: 'hero',
        icon: '💀',
        badge: 'Сила 100',
        cardTemplate: { suit: '💀' as any, rank: 'DTH (Смерть)', value: 100, isDeathCard: true }
    },
    {
        key: 'deathKnight',
        title: 'Лицар Смерті',
        desc: 'Сила 99. При атаці закликає 3 Скелети, відбиває будь-яку атаку.',
        category: 'hero',
        icon: '🖤',
        badge: 'Сила 99',
        cardTemplate: { suit: '🖤' as any, rank: 'DK (Лицар смерті)', value: 99, isDeathKnight: true }
    },
    {
        key: 'paladin',
        title: 'Паладин',
        desc: 'Сила 99. Знімає обмеження підкидання та б\'є будь-яку карту.',
        category: 'hero',
        icon: '⚔️',
        badge: 'Сила 99',
        cardTemplate: { suit: '⚔️', rank: 'PL (Паладин)', value: 99, isPaladin: true }
    },
    {
        key: 'vampire',
        title: 'Вампір',
        desc: 'Сила 11. Перемагає будь-яку карту, відновлює сили володаря.',
        category: 'hero',
        icon: '🦇',
        badge: 'Сила 11',
        cardTemplate: { suit: '🦇' as any, rank: 'VMP (Вампір)' as any, value: 11, isVampire: true }
    },
    {
        key: 'vampireSpell',
        title: 'Закляття Вампіра',
        desc: 'Закляття: Обернення у вампіра. Перетворює будь-яку іншу карту з руки на нового Вампіра!',
        category: 'spell',
        icon: '🔮',
        badge: 'Закляття',
        cardTemplate: { suit: '🔮' as any, rank: 'SP (Закляття)' as any, value: 91, isSpell: true, isVampireSpell: true }
    },
    {
        key: 'barbarian',
        title: 'Варвар',
        desc: 'Сила 10. Атакує люто та дає 1 карту Злості!',
        category: 'hero',
        icon: '🪓',
        badge: 'Сила 10',
        cardTemplate: { suit: '🪓' as any, rank: 'BR (Варвар)', value: 10, isBarbarian: true }
    },
    {
        key: 'executioner',
        title: 'Кат',
        desc: 'Сила 13. Страшний воїн, що б\'є старші карти ворога.',
        category: 'hero',
        icon: '⚔️',
        badge: 'Сила 13',
        cardTemplate: { suit: '⚔️', rank: 'EXC (Кат)', value: 13, isExecutioner: true }
    },
    {
        key: 'assassin',
        title: 'Ассасін',
        desc: 'Сила 14. Смертоносний вбивця, завдає критичних ударів.',
        category: 'hero',
        icon: '🗡️',
        badge: 'Сила 14',
        cardTemplate: { suit: '🗡️', rank: 'ASN (Ассасін)', value: 14, isAssassin: true }
    },
    {
        key: 'mercenary',
        title: 'Найманець',
        desc: 'Сила 85. Б\'є будь-яку карту своєї масті та козирі нижче 10.',
        category: 'hero',
        icon: '⚔️',
        badge: 'Сила 85',
        cardTemplate: { suit: '⚔️', rank: 'MC (Найманець)', value: 85, isMercenary: true }
    },
    {
        key: 'magister',
        title: 'Магістр',
        desc: 'Сила 95. Абсолютний захисник. Б\'є будь-яку карту на столі.',
        category: 'hero',
        icon: '✨',
        badge: 'Сила 95',
        cardTemplate: { suit: '✨', rank: 'M (Магістр)', value: 95, isMagister: true }
    },
    {
        key: 'grandmaster',
        title: 'Гросмейстер',
        desc: 'Сила 98. Б\'є карту та блокує підкидання іншими гравцями.',
        category: 'hero',
        icon: '♟️',
        badge: 'Сила 98',
        cardTemplate: { suit: '♟️', rank: 'GM (Гросмейстер)', value: 98, isGrandmaster: true }
    },
    {
        key: 'sharper',
        title: 'Шулер',
        desc: 'Сила 90. Діє як козирний туз, обходить обмеження захисту.',
        category: 'hero',
        icon: '🎩',
        badge: 'Сила 90',
        cardTemplate: { suit: '🎩', rank: 'SH (Шулер)', value: 90, isSharper: true }
    },
    {
        key: 'thief',
        title: 'Злодій',
        desc: 'Сила 92. Краде високу атакувальну карту та блокує хід.',
        category: 'hero',
        icon: '🗡️',
        badge: 'Сила 92',
        cardTemplate: { suit: '🗡️', rank: 'TH (Злодій)', value: 92, isThief: true }
    },
    {
        key: 'gambler',
        title: 'Гравець',
        desc: 'Сила 96. Б\'є будь-яку карту і відправляє її у вічний відбій.',
        category: 'hero',
        icon: '🎰',
        badge: 'Сила 96',
        cardTemplate: { suit: '🎰' as any, rank: 'GB (Гравець)', value: 96, isGambler: true }
    },
    {
        key: 'sage',
        title: 'Мудрець',
        desc: 'Сила 94. Переводить атаку на наступного гравця.',
        category: 'hero',
        icon: '📜',
        badge: 'Сила 94',
        cardTemplate: { suit: '📜', rank: 'SG (Мудрець)', value: 94, isSage: true }
    },

    // 2. MAGES, PRIESTS & MYSTICS
    {
        key: 'archbishop',
        title: 'Архієпископ',
        desc: 'Сила 99. Дає +6 сили, робить стіл козирями, повертає 4 карти з відбою.',
        category: 'mage',
        icon: '⛪',
        badge: 'Сила 99',
        cardTemplate: { suit: '⛪' as any, rank: 'AB (Архієпископ)', value: 99, isArchbishop: true }
    },
    {
        key: 'bishop',
        title: 'Єпископ',
        desc: 'Сила 97. Дає +4 сили, повертає 3 карти з відбою та змушує пропустити хід.',
        category: 'mage',
        icon: '🏛️',
        badge: 'Сила 97',
        cardTemplate: { suit: '🏛️' as any, rank: 'BP (Єпископ)', value: 97, isBishop: true }
    },
    {
        key: 'priest',
        title: 'Священик',
        desc: 'Сила 93. Дає +2 сили, повертає 2 карти з відбою та забирає стіл.',
        category: 'mage',
        icon: '✝️',
        badge: 'Сила 93',
        cardTemplate: { suit: '✝️' as any, rank: 'PR (Священик)', value: 93, isPriest: true }
    },
    {
        key: 'necromancer',
        title: 'Некромант',
        desc: 'Сила 11. Закликає нежить, перетворює карти відбою на воїнів.',
        category: 'mage',
        icon: '🧙‍♂️',
        badge: 'Сила 11',
        cardTemplate: { suit: '🧙‍♂️' as any, rank: 'NC (Некромант)', value: 11, isNecromancer: true }
    },
    {
        key: 'mage',
        title: 'Маг',
        desc: 'Сила 89. Дає 5 Заклять, 1 Анігіляцію, 1 Знання та +3 очка сили!',
        category: 'mage',
        icon: '🔮',
        badge: 'Сила 89',
        cardTemplate: { suit: '🔮', rank: 'MG (Маг)', value: 89, isMage: true }
    },
    {
        key: 'wizard',
        title: 'Чарівник',
        desc: 'Сила 91. Дає 4 Закляття, бере 2 карти з колоди та дає +5 очок сили!',
        category: 'mage',
        icon: '🧙‍♂️',
        badge: 'Сила 91',
        cardTemplate: { suit: '🧙‍♂️' as any, rank: 'WZ (Чарівник)', value: 91, isWizard: true }
    },
    {
        key: 'warlock',
        title: 'Чаклун',
        desc: 'Сила 88. Володар темної магії. Створює руйнівні закляття.',
        category: 'mage',
        icon: '🔮',
        badge: 'Сила 88',
        cardTemplate: { suit: '🔮', rank: 'WL (Чаклун)', value: 88, isWarlock: true }
    },
    {
        key: 'illusionist',
        title: 'Ілюзіоніст',
        desc: 'Сила 90. Дає 4 карти Ілюзії для обману та захисту.',
        category: 'mage',
        icon: '🎭',
        badge: 'Сила 90',
        cardTemplate: { suit: '🎭' as any, rank: 'IL (Ілюзіоніст)', value: 90, isIllusionist: true }
    },
    {
        key: 'kabbalist',
        title: 'Каббаліст',
        desc: 'Сила 90. Містичний мудрець. Дає 2 випадкові бойові закляття!',
        category: 'mage',
        icon: '📜',
        badge: 'Сила 90',
        cardTemplate: { suit: '📜', rank: 'KB (Каббаліст)', value: 90, isKabbalist: true }
    },
    {
        key: 'alchemist',
        title: 'Алхімік',
        desc: 'Сила 95. Створює 2 козирних Тузи, 2 Золота та 2 Срібла.',
        category: 'mage',
        icon: '🧪',
        badge: 'Сила 95',
        cardTemplate: { suit: '🧪', rank: 'AL (Алхімік)', value: 95, isAlchemist: true }
    },
    {
        key: 'druid',
        title: 'Друїд',
        desc: 'Сила 88. Закликає природні сили, відновлює здоров\'я та сили.',
        category: 'mage',
        icon: '🌱',
        badge: 'Сила 88',
        cardTemplate: { suit: '🌱' as any, rank: 'DRD (Друїд)', value: 88, isDruid: true }
    },
    {
        key: 'shaman',
        title: 'Шаман',
        desc: 'Сила 88. Закликає духів вогню та стихій на поле бою.',
        category: 'mage',
        icon: '🔥',
        badge: 'Сила 88',
        cardTemplate: { suit: '🔥', rank: 'SHM (Шаман)', value: 88, isShaman: true }
    },
    {
        key: 'doctor',
        title: 'Лікар',
        desc: 'Сила 86. Відновлює здоров\'я (+15 HP) та лікує поранення.',
        category: 'mage',
        icon: '🩺',
        badge: 'Сила 86',
        cardTemplate: { suit: '🩺' as any, rank: 'DOC (Лікар)', value: 86, isDoctor: true }
    },
    {
        key: 'witchDoctor',
        title: 'Знахар',
        desc: 'Сила 86. Цілює травами та закляттями (+12 HP, +10 Armor).',
        category: 'mage',
        icon: '🌿',
        badge: 'Сила 86',
        cardTemplate: { suit: '🌿' as any, rank: 'WDC (Знахар)', value: 86, isWitchDoctor: true }
    },
    {
        key: 'cleric',
        title: 'Клірик',
        desc: 'Сила 86. Відновлює +10 HP та воскрешає останню карту зі звичайного відбою!',
        category: 'mage',
        icon: '🕊️',
        badge: 'Сила 86',
        cardTemplate: { suit: '🕊️' as any, rank: 'CL (Клірик)', value: 86, isCleric: true }
    },

    // 3. COMMANDERS, TROOPS & BEASTS
    {
        key: 'general',
        title: 'Полководець',
        desc: 'Сила 11. При атаці викликає 3 додаткові карти "9" своєї масті!',
        category: 'commander',
        icon: '👑',
        badge: 'Сила 11',
        cardTemplate: { suit: '👑', rank: 'GN (Полководець)', value: 11, isGeneral: true }
    },
    {
        key: 'commander',
        title: 'Командир',
        desc: 'Сила 11. При атаці викликає 3 додаткові карти "7" своєї масті!',
        category: 'commander',
        icon: '🎖️',
        badge: 'Сила 11',
        cardTemplate: { suit: '🎖️' as any, rank: 'CM (Командир)', value: 11, isCommander: true }
    },
    {
        key: 'leader',
        title: 'Лідер',
        desc: 'Сила 11. При атаці викликає 3 додаткові карти "5" своєї масті!',
        category: 'commander',
        icon: '🏅',
        badge: 'Сила 11',
        cardTemplate: { suit: '🏅' as any, rank: 'LD (Лідер)', value: 11, isLeader: true }
    },
    {
        key: 'prince',
        title: 'Принц',
        desc: 'Сила 92. Спадкоємець престолу. Викликає 2 Валетів при розіграші!',
        category: 'commander',
        icon: '🤴',
        badge: 'Сила 92',
        cardTemplate: { suit: '👑', rank: 'PRN (Принц)', value: 92, isPrince: true }
    },
    {
        key: 'princess',
        title: 'Принцеса',
        desc: 'Сила 92. Високородна карта. Відновлює +15 HP при розіграші!',
        category: 'commander',
        icon: '👸',
        badge: 'Сила 92',
        cardTemplate: { suit: '👑', rank: 'PC (Принцеса)', value: 92, isPrincess: true }
    },
    {
        key: 'ranger',
        title: 'Ренджер',
        desc: 'Сила 12. Викликає 4 Собак (сила 1) та дає 1 Пастку!',
        category: 'commander',
        icon: '🏹',
        badge: 'Сила 12',
        cardTemplate: { suit: '🏹' as any, rank: 'RN (Ренджер)', value: 12, isRanger: true }
    },
    {
        key: 'hunter',
        title: 'Мисливець',
        desc: 'Сила 11. Викликає 4 Собак (сила 1) та дає 2 Пастки!',
        category: 'commander',
        icon: '🎯',
        badge: 'Сила 11',
        cardTemplate: { suit: '🎯' as any, rank: 'HN (Мисливець)', value: 11, isHunter: true }
    },
    {
        key: 'trapper',
        title: 'Траппер',
        desc: 'Сила 10. Викликає 4 Собак (сила 1) та дає 4 Пастки!',
        category: 'commander',
        icon: '⛓️',
        badge: 'Сила 10',
        cardTemplate: { suit: '⛓️' as any, rank: 'TP (Траппер)', value: 10, isTrapper: true }
    },
    {
        key: 'huntsman',
        title: 'Псар',
        desc: 'Сила 11. При атаці випускає 4 Собаки (сила 1)!',
        category: 'commander',
        icon: '🐺',
        badge: 'Сила 11',
        cardTemplate: { suit: '🐺' as any, rank: 'HM (Псар)', value: 11, isHuntsman: true }
    },
    {
        key: 'dog',
        title: 'Собака',
        desc: 'Сила 1. Швидкий укус. У відбої згорає у вічний відбій.',
        category: 'commander',
        icon: '🐕',
        badge: 'Сила 1',
        cardTemplate: { suit: '🐕', rank: 'DG (Собака)', value: 1, isDog: true }
    },
    {
        key: 'archer',
        title: 'Лучники',
        desc: 'Сила 7. Загін стрільців далекої дистанції.',
        category: 'commander',
        icon: '🏹',
        badge: 'Сила 7',
        cardTemplate: { suit: '🏹' as any, rank: 'ARC (Лучники)', value: 7, isArcher: true }
    },
    {
        key: 'crossbowman',
        title: 'Арбалетчики',
        desc: 'Сила 10. Бронебійний залп важких стріл.',
        category: 'commander',
        icon: '🎯',
        badge: 'Сила 10',
        cardTemplate: { suit: '🎯' as any, rank: 'CRB (Арбалетчики)', value: 10, isCrossbowman: true }
    },
    {
        key: 'pirate',
        title: 'Пірат',
        desc: 'Сила 10. Морський розбійник. Б\'є ворогів та приносить трофеї.',
        category: 'commander',
        icon: '🏴‍☠️',
        badge: 'Сила 10',
        cardTemplate: { suit: '🏴‍☠️' as any, rank: 'PRT (Пірат)', value: 10, isPirate: true }
    },
    {
        key: 'viking',
        title: 'Вікінг',
        desc: 'Сила 12. Безстрашний північний нальотчик.',
        category: 'commander',
        icon: '⚔️',
        badge: 'Сила 12',
        cardTemplate: { suit: '⚔️', rank: 'VK (Вікінг)', value: 12, isViking: true }
    },
    {
        key: 'drakkar',
        title: 'Драккар',
        desc: 'Сила 14. Бойовий корабель норманів. Закликає воїнів у бій.',
        category: 'commander',
        icon: '⛵',
        badge: 'Сила 14',
        cardTemplate: { suit: '⛵' as any, rank: 'DRK (Драккар)', value: 14, isDrakkar: true }
    },
    {
        key: 'robber',
        title: 'Розбійник',
        desc: 'Сила 10. Грабує майно та блокує ресурси ворога.',
        category: 'commander',
        icon: '🪓',
        badge: 'Сила 10',
        cardTemplate: { suit: '🪓' as any, rank: 'RBR (Розбійник)', value: 10, isRobber: true }
    },
    {
        key: 'burglar',
        title: 'Грабіжник',
        desc: 'Сила 9. Непомітно викрадає карти та ресурси.',
        category: 'commander',
        icon: '💰',
        badge: 'Сила 9',
        cardTemplate: { suit: '💰' as any, rank: 'BRG (Грабіжник)', value: 9, isBurglar: true }
    },
    {
        key: 'hordeling',
        title: 'Ординець',
        desc: 'Сила 10. Воїн Степової Орди, атакує великими групами.',
        category: 'commander',
        icon: '🐎',
        badge: 'Сила 10',
        cardTemplate: { suit: '🐎' as any, rank: 'HL (Ординець)', value: 10, isHordeling: true }
    },
    {
        key: 'skeleton',
        title: 'Скелет',
        desc: 'Сила 2. Нежить. Легкий піхотинець армії темряви.',
        category: 'commander',
        icon: '☠️',
        badge: 'Сила 2',
        cardTemplate: { suit: '☠️' as any, rank: 'SK (Скелет)', value: 2, isSkeleton: true }
    },
    {
        key: 'zombie',
        title: 'Зомбі',
        desc: 'Сила 3. Нежить. Повільний, але витривалий боєць.',
        category: 'commander',
        icon: '🧟',
        badge: 'Сила 3',
        cardTemplate: { suit: '🧟' as any, rank: 'ZB (Зомбі)', value: 3, isZombie: true }
    },
    {
        key: 'ghost',
        title: 'Привид',
        desc: 'Сила 5. Безтілесний дух, ігнорує звичайний захист.',
        category: 'commander',
        icon: '👻',
        badge: 'Сила 5',
        cardTemplate: { suit: '👻' as any, rank: 'SP (Закляття)', value: 5, isGhost: true }
    },
    {
        key: 'illusion',
        title: 'Ілюзія',
        desc: 'Сила 1. Беззахисна фантомна карта. Згорає у вічний відбій.',
        category: 'commander',
        icon: '🌌',
        badge: 'Сила 1',
        cardTemplate: { suit: '🌌', rank: 'ILL (Ілюзія)', value: 1, isIllusion: true }
    },

    // 4. DEFENSE, STRUCTURES & MECHANISMS
    {
        key: 'castle',
        title: 'Замок',
        desc: 'Фортеця! Надає +100 Захисту (Armor) при розіграші.',
        category: 'defense',
        icon: '🏰',
        badge: 'Armor +100',
        cardTemplate: { suit: '🏰' as any, rank: 'CST (Замок)', value: 95, isCastle: true }
    },
    {
        key: 'bastion',
        title: 'Бастіон',
        desc: 'Міцна споруда. Надає +75 Захисту (Armor).',
        category: 'defense',
        icon: '🛡️',
        badge: 'Armor +75',
        cardTemplate: { suit: '🛡️', rank: 'BST (Бастіон)', value: 90, isBastion: true }
    },
    {
        key: 'tower',
        title: 'Вежа',
        desc: 'Оборонна вежа. Надає +50 Захисту (Armor).',
        category: 'defense',
        icon: '🗼',
        badge: 'Armor +50',
        cardTemplate: { suit: '🗼' as any, rank: 'TWR (Вежа)', value: 60, isTower: true }
    },
    {
        key: 'wall',
        title: 'Стіна',
        desc: 'Кам\'яна стіна. Надає +25 Захисту (Armor).',
        category: 'defense',
        icon: '🧱',
        badge: 'Armor +25',
        cardTemplate: { suit: '🧱' as any, rank: 'WAL (Стіна)', value: 80, isWall: true }
    },
    {
        key: 'shield',
        title: 'Щит',
        desc: 'Базовий захист. Надає +10 Захисту (Armor).',
        category: 'defense',
        icon: '🛡️',
        badge: 'Armor +10',
        cardTemplate: { suit: '🛡️', rank: 'SHD (Щит)', value: 4, isShield: true }
    },
    {
        key: 'trap',
        title: 'Пастка',
        desc: 'Б\'є карти силою 10 і нижче у вічний відбій!',
        category: 'defense',
        icon: '🪤',
        badge: 'Сила 10',
        cardTemplate: { suit: '🪤' as any, rank: 'TR (Пастка)', value: 10, isTrap: true }
    },
    {
        key: 'golem',
        title: 'Голем',
        desc: 'Сила 15. Кам\'яний велетень. Надає +30 Захисту (Armor).',
        category: 'defense',
        icon: '🗿',
        badge: 'Сила 15',
        cardTemplate: { suit: '🗿' as any, rank: 'GLM (Голем)', value: 15, isGolem: true }
    },
    {
        key: 'automaton',
        title: 'Автоматон',
        desc: 'Сила 12. Сталевий механічний воїн високої міцності.',
        category: 'defense',
        icon: '⚙️',
        badge: 'Сила 12',
        cardTemplate: { suit: '⚙️' as any, rank: 'AUT (Автоматон)', value: 12, isAutomaton: true }
    },
    {
        key: 'animatronic',
        title: 'Аніматронік',
        desc: 'Сила 11. Механізований хижак, атакує несподівано.',
        category: 'defense',
        icon: '🤖',
        badge: 'Сила 11',
        cardTemplate: { suit: '🤖' as any, rank: 'ANM (Аніматронік)', value: 11, isAnimatronic: true }
    },
    {
        key: 'inventor',
        title: 'Винахідник',
        desc: 'Сила 90. Створює Автоматона або Аніматроніка.',
        category: 'defense',
        icon: '⚙️',
        badge: 'Сила 90',
        cardTemplate: { suit: '⚙️' as any, rank: 'INV (Винахідник)', value: 90, isInventor: true }
    },

    // 5. ECONOMY, RESOURCES & POTIONS
    {
        key: 'gold',
        title: 'Золото',
        desc: 'Дає +3 очка сили та переводить або підсилює атаку.',
        category: 'economy',
        icon: '🪙',
        badge: '+3 Сили',
        cardTemplate: { suit: '🪙', rank: 'GL (Золото)', value: 80, isGold: true }
    },
    {
        key: 'silver',
        title: 'Срібло',
        desc: 'Дає +1 очко сили та відбиває звичайні атаки.',
        category: 'economy',
        icon: '🥈',
        badge: '+1 Сили',
        cardTemplate: { suit: '🥈', rank: 'SL (Срібло)', value: 75, isSilver: true }
    },
    {
        key: 'goldMine',
        title: 'Золота шахта',
        desc: 'Виробляє 3 карти Золота у вашу руку!',
        category: 'economy',
        icon: '⛏️',
        badge: 'Економіка',
        cardTemplate: { suit: '⛏️', rank: 'GLD_MN (Золота шахта)' as any, value: 80, isGoldMine: true }
    },
    {
        key: 'silverMine',
        title: 'Срібна шахта',
        desc: 'Виробляє 3 карти Срібла у вашу руку!',
        category: 'economy',
        icon: '⛏️',
        badge: 'Економіка',
        cardTemplate: { suit: '⛏️', rank: 'SLV_MN (Срібна шахта)' as any, value: 75, isSilverMine: true }
    },
    {
        key: 'miners',
        title: 'Шахтарі',
        desc: 'Добувають 1 Золото або 2 Срібла.',
        category: 'economy',
        icon: '⛏️',
        badge: 'Економіка',
        cardTemplate: { suit: '⛏️', rank: 'MNR (Шахтарі)' as any, value: 70, isMiners: true }
    },
    {
        key: 'treasureHunter',
        title: 'Шукач скарбів',
        desc: 'Знаходить цінні реліквії та карти Скарбів.',
        category: 'economy',
        icon: '🧭',
        badge: 'Економіка',
        cardTemplate: { suit: '🧭', rank: 'TRSR_HNT (Шукач скарбів)' as any, value: 85, isTreasureHunter: true }
    },
    {
        key: 'treasure',
        title: 'Скарб',
        desc: 'Приносить великі багатства та очки могутності.',
        category: 'economy',
        icon: '🗝️',
        badge: 'Економіка',
        cardTemplate: { suit: '🗝️', rank: 'TRSR (Скарб)', value: 11, isTreasure: true }
    },
    {
        key: 'tycoon',
        title: 'Магнат',
        desc: 'Дає 1 Скарб та 2 карти Золота.',
        category: 'economy',
        icon: '🎩',
        badge: 'Економіка',
        cardTemplate: { suit: '🎩', rank: 'TYC (Магнат)', value: 90, isTycoon: true }
    },
    {
        key: 'merchant',
        title: 'Торговець',
        desc: 'Обмінює карти та дає перевагу в ресурсах.',
        category: 'economy',
        icon: '💼',
        badge: 'Економіка',
        cardTemplate: { suit: '💼' as any, rank: 'MR (Торговець)', value: 80, isMerchant: true }
    },
    {
        key: 'healthElixir',
        title: 'Еліксир Здоров\'я',
        desc: 'Зілля! Миттєво відновлює +28 HP.',
        category: 'economy',
        icon: '🧪',
        badge: 'HP +28',
        cardTemplate: { suit: '🧪', rank: 'ELX (Еліксир)', value: 10, isHealthElixir: true }
    },
    {
        key: 'knowledge',
        title: 'Знання',
        desc: 'Дає +1 очко сили та згорає у вічний відбій.',
        category: 'economy',
        icon: '📖',
        badge: '+1 Сили',
        cardTemplate: { suit: '📖' as any, rank: 'KN (Знання)', value: 80, isKnowledge: true }
    },
    {
        key: 'rage',
        title: 'Злість',
        desc: 'Перетворює карту в руці на Козир та згорає у вічний відбій.',
        category: 'economy',
        icon: '🔥',
        badge: 'Козир',
        cardTemplate: { suit: '🔥', rank: 'RG (Злість)', value: 80, isRage: true }
    },

    // 6. SPELLS & MAGIC
    {
        key: 'immortality',
        title: 'Закляття Безсмертя',
        desc: 'Тимчасове безсмертя! Повний захист від шкоди на кілька ходів.',
        category: 'spell',
        icon: '🛡️',
        badge: 'Закляття',
        cardTemplate: { suit: '🛡️', rank: 'SP (Закляття)', value: 99, isSpell: true, isImmortalitySpell: true }
    },
    {
        key: 'meteorSwarm',
        title: 'Метеоритний дощ',
        desc: 'Знищує всі карти на столі та завдає шкоди ворогам.',
        category: 'spell',
        icon: '☄️',
        badge: 'Закляття',
        cardTemplate: { suit: '☄️' as any, rank: 'SP (Закляття)', value: 99, isSpell: true, isMeteorSwarm: true }
    },
    {
        key: 'chainLightning',
        title: 'Ланцюгова блискавка',
        desc: 'Знищує карту на столі та розряджає енергію по ворогам.',
        category: 'spell',
        icon: '⚡',
        badge: 'Закляття',
        cardTemplate: { suit: '⚡', rank: 'SP (Закляття)', value: 95, isSpell: true, isChainLightning: true }
    },
    {
        key: 'manaShield',
        title: 'Магічний Щит',
        desc: 'Надає +60 Захисту (Armor) та 2 карти заклять у руку.',
        category: 'spell',
        icon: '🛡️',
        badge: 'Закляття',
        cardTemplate: { suit: '🛡️', rank: 'SP (Закляття)', value: 99, isSpell: true, isManaShield: true }
    },
    {
        key: 'massDeath',
        title: 'Масова смерть',
        desc: 'Знищує кілька ворожих карт одним закляттям.',
        category: 'spell',
        icon: '💀',
        badge: 'Закляття',
        cardTemplate: { suit: '💀' as any, rank: 'SP (Закляття)', value: 99, isSpell: true, isMassDeath: true }
    },
    {
        key: 'deathRay',
        title: 'Промінь смерті',
        desc: 'Направлений руйнівний промінь темної енергії.',
        category: 'spell',
        icon: '🔮',
        badge: 'Закляття',
        cardTemplate: { suit: '🔮', rank: 'SP (Закляття)', value: 95, isSpell: true, isDeathRay: true }
    },
    {
        key: 'mindHeist',
        title: 'Крадіжка розуму',
        desc: 'Викрадає сильну карту з руки супротивника.',
        category: 'spell',
        icon: '👁️',
        badge: 'Закляття',
        cardTemplate: { suit: '👁️' as any, rank: 'SP (Закляття)', value: 90, isSpell: true, isMindHeist: true }
    },
    {
        key: 'conversion',
        title: 'Навернення',
        desc: 'Перетворює ворожу атаку на союзницьку карту.',
        category: 'spell',
        icon: '✨',
        badge: 'Закляття',
        cardTemplate: { suit: '✨', rank: 'SP (Закляття)', value: 92, isSpell: true, isConversion: true }
    },
    {
        key: 'holyCathedral',
        title: 'Священний собор',
        desc: 'Створює священну ауру захисту та благословення.',
        category: 'spell',
        icon: '⛪',
        badge: 'Закляття',
        cardTemplate: { suit: '⛪' as any, rank: 'SP (Закляття)', value: 98, isSpell: true, isHolyCathedral: true }
    },
    {
        key: 'northernWind',
        title: 'Північний вітер',
        desc: 'Заморожує карти та змушує ворога пропустити хід.',
        category: 'spell',
        icon: '❄️',
        badge: 'Закляття',
        cardTemplate: { suit: '❄️' as any, rank: 'SP (Закляття)', value: 90, isSpell: true, isNorthernWind: true }
    },
    {
        key: 'horde',
        title: 'Орда',
        desc: 'Закликає загін ординців на стіл бою.',
        category: 'spell',
        icon: '🪓',
        badge: 'Закляття',
        cardTemplate: { suit: '🪓' as any, rank: 'SP (Закляття)', value: 90, isSpell: true, isHorde: true }
    },
    {
        key: 'undeadLord',
        title: 'Повелитель нежиті',
        desc: 'Піднімає мертвих воїнів та посилює нежить.',
        category: 'spell',
        icon: '👑',
        badge: 'Закляття',
        cardTemplate: { suit: '👑', rank: 'SP (Закляття)', value: 95, isSpell: true, isUndeadLord: true }
    },
    {
        key: 'zombiePlague',
        title: 'Чума зомбі',
        desc: 'Заражає карти та перетворює їх на зомбі.',
        category: 'spell',
        icon: '🧟',
        badge: 'Закляття',
        cardTemplate: { suit: '🧟' as any, rank: 'SP (Закляття)', value: 94, isSpell: true, isZombiePlague: true }
    },
    {
        key: 'turnToSkeletons',
        title: 'Перетворення на скелетів',
        desc: 'Перетворює карти супротивника на слабких скелетів.',
        category: 'spell',
        icon: '☠️',
        badge: 'Закляття',
        cardTemplate: { suit: '☠️' as any, rank: 'SP (Закляття)', value: 94, isSpell: true, isTurnToSkeletons: true }
    },
    {
        key: 'pirateRaid',
        title: 'Піратський рейд',
        desc: 'Морський напад піратів з висадкою екіпажу.',
        category: 'spell',
        icon: '🏴‍☠️',
        badge: 'Закляття',
        cardTemplate: { suit: '🏴‍☠️' as any, rank: 'SP (Закляття)', value: 95, isSpell: true, isPirateRaid: true }
    },
    {
        key: 'undeadLordSpell',
        title: 'Влада Повелителя нежиті',
        desc: 'Потужне закляття воскресіння армії полеглих.',
        category: 'spell',
        icon: '💀',
        badge: 'Закляття',
        cardTemplate: { suit: '💀' as any, rank: 'SP (Закляття)', value: 96, isSpell: true, isUndeadLordSpell: true }
    },
    {
        key: 'grandKonungSpell',
        title: 'Великий Конунг',
        desc: 'Закликає північних воїнів та драккари вікінгів.',
        category: 'spell',
        icon: '❄️',
        badge: 'Закляття',
        cardTemplate: { suit: '❄️' as any, rank: 'SP (Закляття)', value: 96, isSpell: true, isGrandKonungSpell: true }
    },
    {
        key: 'greatKhanSpell',
        title: 'Великий Хан',
        desc: 'Закликає кінноту кочівників з нищівною атакою.',
        category: 'spell',
        icon: '🐎',
        badge: 'Закляття',
        cardTemplate: { suit: '🐎' as any, rank: 'SP (Закляття)', value: 96, isSpell: true, isGreatKhanSpell: true }
    },
    {
        key: 'zombieApocalypseSpell',
        title: 'Апокаліпсис зомбі',
        desc: 'Масове нашестя зомбі на всі позиції.',
        category: 'spell',
        icon: '🧟',
        badge: 'Закляття',
        cardTemplate: { suit: '🧟' as any, rank: 'SP (Закляття)', value: 97, isSpell: true, isZombieApocalypseSpell: true }
    },
    {
        key: 'invadersSpell',
        title: 'Загарбники',
        desc: 'Масований штурм ворожих рубежів.',
        category: 'spell',
        icon: '⚔️',
        badge: 'Закляття',
        cardTemplate: { suit: '⚔️', rank: 'SP (Закляття)', value: 96, isSpell: true, isInvadersSpell: true }
    },
    {
        key: 'stormOfSeasSpell',
        title: 'Буря морів',
        desc: 'Нищівний шторм, змиває ворожі карти у відбій.',
        category: 'spell',
        icon: '🌊',
        badge: 'Закляття',
        cardTemplate: { suit: '🌊', rank: 'SP (Закляття)', value: 96, isSpell: true, isStormOfSeasSpell: true }
    },
    {
        key: 'einherjarSpell',
        title: 'Поклик Ейнхеріїв',
        desc: 'Закликає духів полеглих воїнів Вальгалли.',
        category: 'spell',
        icon: '🛡️',
        badge: 'Закляття',
        cardTemplate: { suit: '🛡️', rank: 'SP (Закляття)', value: 97, isSpell: true, isEinherjarSpell: true }
    },
    {
        key: 'helArmySpell',
        title: 'Армія Хель',
        desc: 'Легіони підземного царства виходять на бій.',
        category: 'spell',
        icon: '💀',
        badge: 'Закляття',
        cardTemplate: { suit: '💀' as any, rank: 'SP (Закляття)', value: 97, isSpell: true, isHelArmySpell: true }
    },
    {
        key: 'burnCardSpell',
        title: 'Спалити карту',
        desc: 'Спалює обрану карту у вічний відбій.',
        category: 'spell',
        icon: '🔥',
        badge: 'Закляття',
        cardTemplate: { suit: '🔥', rank: 'SP (Закляття)', value: 90, isSpell: true, isBurnCardSpell: true }
    },
    {
        key: 'burnHandSpell',
        title: 'Спалити руку',
        desc: 'Випалює карти в руці ворога вогнем.',
        category: 'spell',
        icon: '🧨',
        badge: 'Закляття',
        cardTemplate: { suit: '🧨' as any, rank: 'SP (Закляття)', value: 92, isSpell: true, isBurnHandSpell: true }
    },
    {
        key: 'summonGhost',
        title: 'Виклик Привида',
        desc: 'Закликає Привида на стіл бою.',
        category: 'spell',
        icon: '👻',
        badge: 'Закляття',
        cardTemplate: { suit: '👻' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonGhostSpell: true }
    },
    {
        key: 'summonSkeletons',
        title: 'Виклик Скелетів',
        desc: 'Закликає 2 Скелетів на стіл бою.',
        category: 'spell',
        icon: '☠️',
        badge: 'Закляття',
        cardTemplate: { suit: '☠️' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonSkeletonsSpell: true }
    },
    {
        key: 'summonZombies',
        title: 'Виклик Зомбі',
        desc: 'Закликає 2 Зомбі на стіл бою.',
        category: 'spell',
        icon: '🧟',
        badge: 'Закляття',
        cardTemplate: { suit: '🧟' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonZombiesSpell: true }
    },
    {
        key: 'summonGolem',
        title: 'Створення Голема',
        desc: 'Створює могутнього Голема (+30 Armor).',
        category: 'spell',
        icon: '🗿',
        badge: 'Закляття',
        cardTemplate: { suit: '🗿' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonGolemSpell: true, isEternalCard: true }
    },
    {
        key: 'summonAnimatronic',
        title: 'Створення Аніматроніка',
        desc: 'Створює механізованого Аніматроніка.',
        category: 'spell',
        icon: '🤖',
        badge: 'Закляття',
        cardTemplate: { suit: '🤖' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonAnimatronicSpell: true, isEternalCard: true }
    },
    {
        key: 'summonAutomaton',
        title: 'Створення Автоматона',
        desc: 'Створює броньованого Автоматона.',
        category: 'spell',
        icon: '⚙️',
        badge: 'Закляття',
        cardTemplate: { suit: '⚙️' as any, rank: 'SP (Закляття)', value: 10, isSpell: true, isSummonAutomatonSpell: true, isEternalCard: true }
    },
    {
        key: 'illusionCopy',
        title: 'Ілюзорна копія',
        desc: 'Створює ілюзорну копію будь-якої своєї карти.',
        category: 'spell',
        icon: '✨',
        badge: 'Закляття',
        cardTemplate: { suit: '✨', rank: 'SP (Ілюзорна копія)', value: 10, isSpell: true, isIllusionCopySpell: true }
    },
    {
        key: 'endTurn',
        title: 'Завершення ходу',
        desc: 'Миттєво завершує раунд та відправляє карти у відбій.',
        category: 'spell',
        icon: '⌛',
        badge: 'Закляття',
        cardTemplate: { suit: '⌛' as any, rank: 'SP (Закляття)', value: 99, isSpell: true, isEndTurnSpell: true }
    },
    {
        key: 'powerWordKill',
        title: 'Слово сили: Смерть',
        desc: 'Смертельне закляття вищого рангу.',
        category: 'spell',
        icon: '💀',
        badge: 'Закляття',
        cardTemplate: { suit: '💀' as any, rank: 'SP (Слово сили: Смерть)', value: 99, isSpell: true, isPowerWordKill: true }
    },
    {
        key: 'fingerOfDeath',
        title: 'Перст смерті',
        desc: 'Б\'є карти від Вальта і нижче у вічний відбій.',
        category: 'spell',
        icon: '👆',
        badge: 'Закляття',
        cardTemplate: { suit: '🔮', rank: 'SP (Перст смерті)', value: 11, isSpell: true, isFingerOfDeath: true }
    },
    {
        key: 'chillTouch',
        title: 'Чіл тач (Крижаний дотик)',
        desc: 'Б\'є карти нижче 6 у вічний відбій.',
        category: 'spell',
        icon: '❄️',
        badge: 'Закляття',
        cardTemplate: { suit: '❄️' as any, rank: 'SP (Чіл тач)', value: 6, isSpell: true, isChillTouch: true }
    },
    {
        key: 'annihilation',
        title: 'Анігіляція',
        desc: 'Б\'є карти від Короля і нижче у вічний відбій.',
        category: 'spell',
        icon: '💥',
        badge: 'Закляття',
        cardTemplate: { suit: '💥' as any, rank: 'SP (Анігіляція)', value: 13, isSpell: true, isAnnihilation: true }
    },
    {
        key: 'basicSpell',
        title: 'Магічний сувій',
        desc: 'Базове закляття. Б\'є карту нижче Вальта у вічний відбій.',
        category: 'spell',
        icon: '🔮',
        badge: 'Закляття',
        cardTemplate: { suit: '🔮', rank: 'SP (Закляття)', value: 10, isSpell: true }
    },

    // 7. SMELTING (LVL 1-7) & RESOURCE RELEASE (LVL 1-7)
    // NOTE: Smelting Level 8 is strictly EXCLUDED!
    {
        key: 'smeltingLvl1',
        title: 'Переплавлення (Рівень 1)',
        desc: 'Знищує 10 карт з вічного відбою ➔ дає 1 випадкову карту.',
        category: 'smelt_release',
        icon: '⚒️',
        badge: 'Lvl 1',
        cardTemplate: { suit: '⚒️' as any, rank: 'SP (Переплавлення 1)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 1 }
    },
    {
        key: 'smeltingLvl2',
        title: 'Переплавлення (Рівень 2)',
        desc: 'Знищує 8 карт з вічного відбою ➔ дає 1 випадкову карту.',
        category: 'smelt_release',
        icon: '⚒️',
        badge: 'Lvl 2',
        cardTemplate: { suit: '⚒️' as any, rank: 'SP (Переплавлення 2)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 2 }
    },
    {
        key: 'smeltingLvl3',
        title: 'Переплавлення (Рівень 3)',
        desc: 'Знищує 8 карт з вічного відбою ➔ дає 2 випадкові карти.',
        category: 'smelt_release',
        icon: '⚒️',
        badge: 'Lvl 3',
        cardTemplate: { suit: '⚒️' as any, rank: 'SP (Переплавлення 3)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 3 }
    },
    {
        key: 'smeltingLvl4',
        title: 'Переплавлення (Рівень 4)',
        desc: 'Знищує 8 карт з вічного відбою ➔ дає 4 випадкові карти.',
        category: 'smelt_release',
        icon: '⚒️',
        badge: 'Lvl 4',
        cardTemplate: { suit: '⚒️' as any, rank: 'SP (Переплавлення 4)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 4 }
    },
    {
        key: 'smeltingLvl5',
        title: 'Переплавлення (Рівень 5)',
        desc: 'Знищує 6 карт з вічного відбою ➔ дає 4 випадкові карти.',
        category: 'smelt_release',
        icon: '⚒️',
        badge: 'Lvl 5',
        cardTemplate: { suit: '⚒️' as any, rank: 'SP (Переплавлення 5)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 5 }
    },
    {
        key: 'smeltingLvl6',
        title: 'Переплавлення (Рівень 6)',
        desc: 'Знищує 8 карт з вічного відбою ➔ дає 2 карти Героя.',
        category: 'smelt_release',
        icon: '⚒️',
        badge: 'Lvl 6',
        cardTemplate: { suit: '⚒️' as any, rank: 'SP (Переплавлення 6)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 6 }
    },
    {
        key: 'smeltingLvl7',
        title: 'Переплавлення (Рівень 7)',
        desc: 'Знищує 4 карти з вічного відбою ➔ дає 12 карт Золота.',
        category: 'smelt_release',
        icon: '⚒️',
        badge: 'Lvl 7',
        cardTemplate: { suit: '⚒️' as any, rank: 'SP (Переплавлення 7)' as any, value: 90, isSpell: true, isSmeltingSpell: true, smeltingLevel: 7 }
    },
    {
        key: 'resourceReleaseLvl1',
        title: 'Вивільнення ресурсів I',
        desc: 'Знищує 12 карт з вічного відбою ➔ +2 очка сили.',
        category: 'smelt_release',
        icon: '💎',
        badge: '+2⚡',
        cardTemplate: { suit: '💎' as any, rank: 'SP (Вивільнення 1)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 1 }
    },
    {
        key: 'resourceReleaseLvl2',
        title: 'Вивільнення ресурсів II',
        desc: 'Знищує 10 карт з вічного відбою ➔ +2 очка сили.',
        category: 'smelt_release',
        icon: '💎',
        badge: '+2⚡',
        cardTemplate: { suit: '💎' as any, rank: 'SP (Вивільнення 2)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 2 }
    },
    {
        key: 'resourceReleaseLvl3',
        title: 'Вивільнення ресурсів III',
        desc: 'Знищує 8 карт з вічного відбою ➔ +2 очка сили.',
        category: 'smelt_release',
        icon: '💎',
        badge: '+2⚡',
        cardTemplate: { suit: '💎' as any, rank: 'SP (Вивільнення 3)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 3 }
    },
    {
        key: 'resourceReleaseLvl4',
        title: 'Вивільнення ресурсів IV',
        desc: 'Знищує 8 карт з вічного відбою ➔ +4 очка сили.',
        category: 'smelt_release',
        icon: '💎',
        badge: '+4⚡',
        cardTemplate: { suit: '💎' as any, rank: 'SP (Вивільнення 4)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 4 }
    },
    {
        key: 'resourceReleaseLvl5',
        title: 'Вивільнення ресурсів V',
        desc: 'Знищує 6 карт з вічного відбою ➔ +4 очка сили.',
        category: 'smelt_release',
        icon: '💎',
        badge: '+4⚡',
        cardTemplate: { suit: '💎' as any, rank: 'SP (Вивільнення 5)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 5 }
    },
    {
        key: 'resourceReleaseLvl6',
        title: 'Вивільнення ресурсів VI',
        desc: 'Знищує 6 карт з вічного відбою ➔ +5 очок сили.',
        category: 'smelt_release',
        icon: '💎',
        badge: '+5⚡',
        cardTemplate: { suit: '💎' as any, rank: 'SP (Вивільнення 6)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 6 }
    },
    {
        key: 'resourceReleaseLvl7',
        title: 'Вивільнення ресурсів VII',
        desc: 'Знищує 6 карт з вічного відбою ➔ +6 очок сили.',
        category: 'smelt_release',
        icon: '💎',
        badge: '+6⚡',
        cardTemplate: { suit: '💎' as any, rank: 'SP (Вивільнення 7)' as any, value: 90, isSpell: true, isResourceReleaseSpell: true, resourceReleaseLevel: 7 }
    },

    // 8. CLASSIC CARDS & JOKERS
    // Jokers
    {
        key: 'blackJoker',
        title: 'Чорний Джокер',
        desc: 'Сила 15 (або 50). Б\'є більшість карт, універсальний козир.',
        category: 'classic',
        icon: '🃏',
        badge: 'Джокер',
        cardTemplate: { suit: 'Joker', rank: 'Black Joker', value: 15 }
    },
    {
        key: 'redJoker',
        title: 'Червоний Джокер',
        desc: 'Сила 16 (або 51). Найвищий Джокер у грі.',
        category: 'classic',
        icon: '🃏',
        badge: 'Джокер',
        cardTemplate: { suit: 'Joker', rank: 'Red Joker', value: 16 }
    },

    // Aces
    {
        key: 'aceSpades',
        title: 'Туз Піка',
        desc: 'Сила 14. Найстарша звичайна карта масті Піка.',
        category: 'classic',
        icon: '♠',
        badge: 'Туз',
        cardTemplate: { suit: '♠', rank: 'A', value: 14 }
    },
    {
        key: 'aceHearts',
        title: 'Туз Чирва',
        desc: 'Сила 14. Найстарша звичайна карта масті Чирва.',
        category: 'classic',
        icon: '♥',
        badge: 'Туз',
        cardTemplate: { suit: '♥', rank: 'A', value: 14 }
    },
    {
        key: 'aceDiamonds',
        title: 'Туз Бубна',
        desc: 'Сила 14. Найстарша звичайна карта масті Бубна.',
        category: 'classic',
        icon: '♦',
        badge: 'Туз',
        cardTemplate: { suit: '♦', rank: 'A', value: 14 }
    },
    {
        key: 'aceClubs',
        title: 'Туз Хреста',
        desc: 'Сила 14. Найстарша звичайна карта масті Хреста.',
        category: 'classic',
        icon: '♣',
        badge: 'Туз',
        cardTemplate: { suit: '♣', rank: 'A', value: 14 }
    },

    // Kings
    {
        key: 'kingSpades',
        title: 'Король Піка',
        desc: 'Сила 13. Старша карта масті Піка.',
        category: 'classic',
        icon: '♠',
        badge: 'Король',
        cardTemplate: { suit: '♠', rank: 'K', value: 13 }
    },
    {
        key: 'kingHearts',
        title: 'Король Чирва',
        desc: 'Сила 13. Старша карта масті Чирва.',
        category: 'classic',
        icon: '♥',
        badge: 'Король',
        cardTemplate: { suit: '♥', rank: 'K', value: 13 }
    },
    {
        key: 'kingDiamonds',
        title: 'Король Бубна',
        desc: 'Сила 13. Старша карта масті Бубна.',
        category: 'classic',
        icon: '♦',
        badge: 'Король',
        cardTemplate: { suit: '♦', rank: 'K', value: 13 }
    },
    {
        key: 'kingClubs',
        title: 'Король Хреста',
        desc: 'Сила 13. Старша карта масті Хреста.',
        category: 'classic',
        icon: '♣',
        badge: 'Король',
        cardTemplate: { suit: '♣', rank: 'K', value: 13 }
    },

    // Queens
    {
        key: 'queenSpades',
        title: 'Дама Піка',
        desc: 'Сила 12. Старша карта масті Піка.',
        category: 'classic',
        icon: '♠',
        badge: 'Дама',
        cardTemplate: { suit: '♠', rank: 'Q', value: 12 }
    },
    {
        key: 'queenHearts',
        title: 'Дама Чирва',
        desc: 'Сила 12. Старша карта масті Чирва.',
        category: 'classic',
        icon: '♥',
        badge: 'Дама',
        cardTemplate: { suit: '♥', rank: 'Q', value: 12 }
    },
    {
        key: 'queenDiamonds',
        title: 'Дама Бубна',
        desc: 'Сила 12. Старша карта масті Бубна.',
        category: 'classic',
        icon: '♦',
        badge: 'Дама',
        cardTemplate: { suit: '♦', rank: 'Q', value: 12 }
    },
    {
        key: 'queenClubs',
        title: 'Дама Хреста',
        desc: 'Сила 12. Старша карта масті Хреста.',
        category: 'classic',
        icon: '♣',
        badge: 'Дама',
        cardTemplate: { suit: '♣', rank: 'Q', value: 12 }
    },

    // Jacks
    {
        key: 'jackSpades',
        title: 'Валет Піка',
        desc: 'Сила 11. Магічний поріг для заклять.',
        category: 'classic',
        icon: '♠',
        badge: 'Валет',
        cardTemplate: { suit: '♠', rank: 'J', value: 11 }
    },
    {
        key: 'jackHearts',
        title: 'Валет Чирва',
        desc: 'Сила 11. Магічний поріг для заклять.',
        category: 'classic',
        icon: '♥',
        badge: 'Валет',
        cardTemplate: { suit: '♥', rank: 'J', value: 11 }
    },
    {
        key: 'jackDiamonds',
        title: 'Валет Бубна',
        desc: 'Сила 11. Магічний поріг для заклять.',
        category: 'classic',
        icon: '♦',
        badge: 'Валет',
        cardTemplate: { suit: '♦', rank: 'J', value: 11 }
    },
    {
        key: 'jackClubs',
        title: 'Валет Хреста',
        desc: 'Сила 11. Магічний поріг для заклять.',
        category: 'classic',
        icon: '♣',
        badge: 'Валет',
        cardTemplate: { suit: '♣', rank: 'J', value: 11 }
    },

    // Knights
    {
        key: 'knightSpades',
        title: 'Лицар (Всадник) Піка',
        desc: 'Сила 11. Розширена колода.',
        category: 'classic',
        icon: '♠',
        badge: 'Лицар',
        cardTemplate: { suit: '♠', rank: 'N', value: 11, isKnight: true }
    },
    {
        key: 'knightHearts',
        title: 'Лицар (Всадник) Чирва',
        desc: 'Сила 11. Розширена колода.',
        category: 'classic',
        icon: '♥',
        badge: 'Лицар',
        cardTemplate: { suit: '♥', rank: 'N', value: 11, isKnight: true }
    },
    {
        key: 'knightDiamonds',
        title: 'Лицар (Всадник) Бубна',
        desc: 'Сила 11. Розширена колода.',
        category: 'classic',
        icon: '♦',
        badge: 'Лицар',
        cardTemplate: { suit: '♦', rank: 'N', value: 11, isKnight: true }
    },
    {
        key: 'knightClubs',
        title: 'Лицар (Всадник) Хреста',
        desc: 'Сила 11. Розширена колода.',
        category: 'classic',
        icon: '♣',
        badge: 'Лицар',
        cardTemplate: { suit: '♣', rank: 'N', value: 11, isKnight: true }
    },

    // Numbered Cards (10 to 0)
    {
        key: 'card10Spades',
        title: '10 Піка',
        desc: 'Сила 10. Висока числова карта.',
        category: 'classic',
        icon: '♠',
        badge: '10',
        cardTemplate: { suit: '♠', rank: '10', value: 10 }
    },
    {
        key: 'card10Hearts',
        title: '10 Чирва',
        desc: 'Сила 10. Висока числова карта.',
        category: 'classic',
        icon: '♥',
        badge: '10',
        cardTemplate: { suit: '♥', rank: '10', value: 10 }
    },
    {
        key: 'card10Diamonds',
        title: '10 Бубна',
        desc: 'Сила 10. Висока числова карта.',
        category: 'classic',
        icon: '♦',
        badge: '10',
        cardTemplate: { suit: '♦', rank: '10', value: 10 }
    },
    {
        key: 'card10Clubs',
        title: '10 Хреста',
        desc: 'Сила 10. Висока числова карта.',
        category: 'classic',
        icon: '♣',
        badge: '10',
        cardTemplate: { suit: '♣', rank: '10', value: 10 }
    },
    {
        key: 'card9Spades',
        title: '9 Піка',
        desc: 'Сила 9.',
        category: 'classic',
        icon: '♠',
        badge: '9',
        cardTemplate: { suit: '♠', rank: '9', value: 9 }
    },
    {
        key: 'card9Hearts',
        title: '9 Чирва',
        desc: 'Сила 9.',
        category: 'classic',
        icon: '♥',
        badge: '9',
        cardTemplate: { suit: '♥', rank: '9', value: 9 }
    },
    {
        key: 'card8Hearts',
        title: '8 Чирва',
        desc: 'Сила 8.',
        category: 'classic',
        icon: '♥',
        badge: '8',
        cardTemplate: { suit: '♥', rank: '8', value: 8 }
    },
    {
        key: 'card7Spades',
        title: '7 Піка',
        desc: 'Сила 7.',
        category: 'classic',
        icon: '♠',
        badge: '7',
        cardTemplate: { suit: '♠', rank: '7', value: 7 }
    },
    {
        key: 'card6Spades',
        title: '6 Піка',
        desc: 'Сила 6.',
        category: 'classic',
        icon: '♠',
        badge: '6',
        cardTemplate: { suit: '♠', rank: '6', value: 6 }
    },
    {
        key: 'card5Hearts',
        title: '5 Чирва',
        desc: 'Сила 5.',
        category: 'classic',
        icon: '♥',
        badge: '5',
        cardTemplate: { suit: '♥', rank: '5', value: 5 }
    },
    {
        key: 'card2Diamonds',
        title: '2 Бубна',
        desc: 'Сила 2.',
        category: 'classic',
        icon: '♦',
        badge: '2',
        cardTemplate: { suit: '♦', rank: '2', value: 2 }
    },
    {
        key: 'card0Spades',
        title: '0 Піка',
        desc: 'Сила 0. Найнижча карта.',
        category: 'classic',
        icon: '♠',
        badge: '0',
        cardTemplate: { suit: '♠', rank: '0', value: 0 }
    },

    // 9. TAROT MAJOR ARCANA
    {
        key: 'tarotFool',
        title: '0 - Шут (Дурень)',
        desc: 'Старший Аркан Таро. Сила 0.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро 0',
        cardTemplate: { suit: '🎴', rank: '0 (Шут)', value: 0 }
    },
    {
        key: 'tarotMagician',
        title: 'I - Маг',
        desc: 'Старший Аркан Таро. Сила 1.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро I',
        cardTemplate: { suit: '🎴', rank: 'I (Маг)', value: 1 }
    },
    {
        key: 'tarotHighPriestess',
        title: 'II - Жриця',
        desc: 'Старший Аркан Таро. Сила 2.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро II',
        cardTemplate: { suit: '🎴', rank: 'II (Жриця)', value: 2 }
    },
    {
        key: 'tarotEmpress',
        title: 'III - Імператриця',
        desc: 'Старший Аркан Таро. Сила 3.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро III',
        cardTemplate: { suit: '🎴', rank: 'III (Імператриця)', value: 3 }
    },
    {
        key: 'tarotEmperor',
        title: 'IV - Імператор',
        desc: 'Старший Аркан Таро. Сила 4.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро IV',
        cardTemplate: { suit: '🎴', rank: 'IV (Імператор)', value: 4 }
    },
    {
        key: 'tarotHierophant',
        title: 'V - Ієрофант',
        desc: 'Старший Аркан Таро. Сила 5.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро V',
        cardTemplate: { suit: '🎴', rank: 'V (Іерофант)', value: 5 }
    },
    {
        key: 'tarotLovers',
        title: 'VI - Закохані',
        desc: 'Старший Аркан Таро. Сила 6.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро VI',
        cardTemplate: { suit: '🎴', rank: 'VI (Закохані)', value: 6 }
    },
    {
        key: 'tarotChariot',
        title: 'VII - Колісниця',
        desc: 'Старший Аркан Таро. Сила 7.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро VII',
        cardTemplate: { suit: '🎴', rank: 'VII (Колісниця)', value: 7 }
    },
    {
        key: 'tarotStrength',
        title: 'VIII - Сила',
        desc: 'Старший Аркан Таро. Сила 8.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро VIII',
        cardTemplate: { suit: '🎴', rank: 'VIII (Справедливість)', value: 8 }
    },
    {
        key: 'tarotHermit',
        title: 'IX - Відлюдник',
        desc: 'Старший Аркан Таро. Сила 9.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро IX',
        cardTemplate: { suit: '🎴', rank: 'IX (Відлючник)', value: 9 }
    },
    {
        key: 'tarotWheelOfFortune',
        title: 'X - Колесо Фортуни',
        desc: 'Старший Аркан Таро. Сила 10.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро X',
        cardTemplate: { suit: '🎴', rank: 'X (Фортуна)', value: 10 }
    },
    {
        key: 'tarotJustice',
        title: 'XI - Справедливість',
        desc: 'Старший Аркан Таро. Сила 11.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XI',
        cardTemplate: { suit: '🎴', rank: 'XI (Сила)', value: 11 }
    },
    {
        key: 'tarotHangedMan',
        title: 'XII - Повішений',
        desc: 'Старший Аркан Таро. Сила 12.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XII',
        cardTemplate: { suit: '🎴', rank: 'XII (Повішений)', value: 12 }
    },
    {
        key: 'tarotDeath',
        title: 'XIII - Смерть (Таро)',
        desc: 'Старший Аркан Таро. Сила 13.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XIII',
        cardTemplate: { suit: '🎴', rank: 'XIII (Смерть)', value: 13 }
    },
    {
        key: 'tarotTemperance',
        title: 'XIV - Поміркованість',
        desc: 'Старший Аркан Таро. Сила 14.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XIV',
        cardTemplate: { suit: '🎴', rank: 'XIV (Поміркованість)', value: 14 }
    },
    {
        key: 'tarotDevil',
        title: 'XV - Диявол',
        desc: 'Старший Аркан Таро. Сила 15.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XV',
        cardTemplate: { suit: '🎴', rank: 'XV (Диявол)', value: 15 }
    },
    {
        key: 'tarotTower',
        title: 'XVI - Вежа (Таро)',
        desc: 'Старший Аркан Таро. Сила 16.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XVI',
        cardTemplate: { suit: '🎴', rank: 'XVI (Вежа)', value: 16 }
    },
    {
        key: 'tarotStar',
        title: 'XVII - Зірка',
        desc: 'Старший Аркан Таро. Сила 17.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XVII',
        cardTemplate: { suit: '🎴', rank: 'XVII (Зірка)', value: 17 }
    },
    {
        key: 'tarotMoon',
        title: 'XVIII - Місяць',
        desc: 'Старший Аркан Таро. Сила 18.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XVIII',
        cardTemplate: { suit: '🎴', rank: 'XVIII (Місяць)', value: 18 }
    },
    {
        key: 'tarotSun',
        title: 'XIX - Сонце',
        desc: 'Старший Аркан Таро. Сила 19.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XIX',
        cardTemplate: { suit: '🎴', rank: 'XIX (Сонце)', value: 19 }
    },
    {
        key: 'tarotJudgement',
        title: 'XX - Суд',
        desc: 'Старший Аркан Таро. Сила 20.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XX',
        cardTemplate: { suit: '🎴', rank: 'XX (Суд)', value: 20 }
    },
    {
        key: 'tarotWorld',
        title: 'XXI - Світ',
        desc: 'Старший Аркан Таро. Сила 21.',
        category: 'tarot',
        icon: '🎴',
        badge: 'Таро XXI',
        cardTemplate: { suit: '🎴', rank: 'XXI (Світ)', value: 21 }
    }
];

export const createCardFromSmeltingKey = (key: string, id?: number): Card => {
    const cardId = id ?? Math.floor(Date.now() + Math.random() * 1000000);
    const option = ALL_SMELTING_CARDS.find(o => o.key === key);
    if (option) {
        return {
            ...option.cardTemplate,
            id: cardId
        } as Card;
    }

    // Default fallback
    return {
        id: cardId,
        suit: '🛡️',
        rank: 'HR (Герой)',
        value: 99,
        isHero: true
    };
};

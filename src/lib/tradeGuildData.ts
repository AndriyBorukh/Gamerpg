import { WorldProgress } from '../types';

export interface CommoditySubGood {
    id: string;
    name: string;
    icon: string;
    basePrice: number; // Base gold price per unit
    volatility: 'low' | 'medium' | 'high' | 'extreme'; // Price fluctuation factor
    description: string;
    unitName: string; // мішок, туша, діжка, сувій, злиток тощо
}

export interface CommodityCategory {
    id: string;
    name: string;
    icon: string;
    description: string;
    categoryQuote: string;
    colorScheme: {
        bg: string;
        border: string;
        text: string;
        accent: string;
    };
    goods: CommoditySubGood[];
}

export interface GuildInvestmentPosition {
    id: string; // unique investment id
    cityId: string;
    cityName: string;
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    goodId: string;
    goodName: string;
    goodIcon: string;
    unitName: string;
    unitsCount: number;
    buyPricePerUnit: number;
    totalInvestedGold: number;
    purchaseTimestamp: number;
    marketMultiplierAtBuy: number;
    accumulatedDividends: number;
    daysActive: number;
}

export interface GuildTradeProfile {
    guildReputation: number; // Experience points in the merchant guild
    totalProfitGold: number; // Total gold earned through trading and investments
    successfulDealsCount: number; // Number of completed deals
    investments: GuildInvestmentPosition[]; // Active investments & commodity holdings
}

// 19 Complete Guild Commodity Categories with All Requested Goods
export const GUILD_COMMODITY_CATEGORIES: CommodityCategory[] = [
    {
        id: 'food',
        name: 'Їжа',
        icon: '🌾',
        description: 'Основа процвітання будь-якого краю. Продукти першої необхідності для міст і гарнізонів.',
        categoryQuote: '«Хліб — усьому голова, а сите військо ніколи не зазнає поразки.»',
        colorScheme: {
            bg: 'from-amber-950/40 to-yellow-950/20',
            border: 'border-amber-500/50',
            text: 'text-amber-200',
            accent: 'bg-amber-500/20'
        },
        goods: [
            { id: 'food_grain', name: 'Зерно', icon: '🌾', basePrice: 12, volatility: 'low', unitName: 'мішок', description: 'Добірна пшениця та жито з родючих нив.' },
            { id: 'food_flour', name: 'Борошно', icon: '🥡', basePrice: 16, volatility: 'low', unitName: 'мішок', description: 'Тонко змелене борошно на вітряних млинах.' },
            { id: 'food_bread', name: 'Хліб', icon: '🍞', basePrice: 8, volatility: 'low', unitName: 'кошик', description: 'Свіжоспечені житні та пшеничні паляниці.' },
            { id: 'food_cereals', name: 'Крупи', icon: '🥣', basePrice: 14, volatility: 'low', unitName: 'мішок', description: 'Гречка, пшоно, ячмінь та вівсянка для поживних каш.' },
            { id: 'food_vegetables', name: 'Овочі', icon: '🥕', basePrice: 10, volatility: 'medium', unitName: 'віз', description: 'Капуста, ріпа, морква, буряк та цибуля з міських садів.' },
            { id: 'food_fruits', name: 'Фрукти', icon: '🍎', basePrice: 18, volatility: 'medium', unitName: 'ящик', description: 'Соковиті яблука, груші, сливи та сушені ягоди.' },
            { id: 'food_nuts', name: 'Горіхи', icon: '🌰', basePrice: 22, volatility: 'medium', unitName: 'торба', description: 'Лісові та волоські горіхи довготривалого зберігання.' }
        ]
    },
    {
        id: 'animals',
        name: 'Тварини',
        icon: '🐄',
        description: 'Тяглова сила, худоба та домашня птиця для господарств і кінних загонів.',
        categoryQuote: '«Добрий кінь вартий скарбу, а череді корів зрадіє будь-яке поселення.»',
        colorScheme: {
            bg: 'from-emerald-950/40 to-stone-900/40',
            border: 'border-emerald-600/50',
            text: 'text-emerald-200',
            accent: 'bg-emerald-500/20'
        },
        goods: [
            { id: 'anim_horses', name: 'Коні', icon: '🐎', basePrice: 120, volatility: 'high', unitName: 'жеребець', description: 'Породисті бойові скакуни та міцні тяглові коні.' },
            { id: 'anim_cows', name: 'Корови', icon: '🐄', basePrice: 65, volatility: 'medium', unitName: 'голова', description: 'Молочні корови та племінні бики для господарств.' },
            { id: 'anim_sheep', name: 'Вівці', icon: '🐑', basePrice: 30, volatility: 'medium', unitName: 'отара', description: 'Тонкорунні вівці — джерело цінної вовни та сиру.' },
            { id: 'anim_goats', name: 'Кози', icon: '🐐', basePrice: 24, volatility: 'medium', unitName: 'голова', description: 'Невибагливі кози з корисним та поживним молоком.' },
            { id: 'anim_pigs', name: 'Свині', icon: '🐖', basePrice: 38, volatility: 'medium', unitName: 'голова', description: 'Вгодовані кабани для швидкого забезпечення харчами.' },
            { id: 'anim_chickens', name: 'Кури', icon: '🐔', basePrice: 8, volatility: 'low', unitName: 'клітка (10 шт)', description: 'Несучки та півні для подвір\'я й свіжих яєць.' },
            { id: 'anim_geese', name: 'Гуси', icon: '🪿', basePrice: 15, volatility: 'low', unitName: 'зграя (5 шт)', description: 'Великі свійські гуси, пух для перин та м\'ясо.' }
        ]
    },
    {
        id: 'fish',
        name: 'Риба',
        icon: '🐟',
        description: 'Річкові та морські делікатеси, що мають високий попит під час постів та бенкетів.',
        categoryQuote: '«Хто вміє кинути сітку — ніколи не голодуватиме, а за ікру вельможі платять золотом.»',
        colorScheme: {
            bg: 'from-cyan-950/40 to-blue-950/20',
            border: 'border-cyan-500/50',
            text: 'text-cyan-200',
            accent: 'bg-cyan-500/20'
        },
        goods: [
            { id: 'fish_fresh', name: 'Свіжа риба', icon: '🐟', basePrice: 15, volatility: 'high', unitName: 'козуб', description: 'Щойно виловлені щуки, соми, судаки та коропи.' },
            { id: 'fish_dried', name: 'Сушена риба', icon: '🐡', basePrice: 18, volatility: 'low', unitName: 'в\'язка', description: 'В\'ялена на сонці та диму риба для довгих мандрівок.' },
            { id: 'fish_salted', name: 'Солона риба', icon: '🐠', basePrice: 22, volatility: 'low', unitName: 'діжка', description: 'Засолені в дубових бочках оселедці та лосось.' },
            { id: 'fish_caviar', name: 'Ікра', icon: '🥣', basePrice: 95, volatility: 'extreme', unitName: 'баночка', description: 'Чорна осетрова та червона ікра для княжих бенкетів.' }
        ]
    },
    {
        id: 'meat',
        name: 'М\'ясо',
        icon: '🥩',
        description: 'Свіже та копчене м\'ясо для прогодування городян, лицарів і подорожніх.',
        categoryQuote: '«Шмат смаженого м\'яса додає сили руці, яка тримає меч.»',
        colorScheme: {
            bg: 'from-rose-950/40 to-red-950/20',
            border: 'border-rose-600/50',
            text: 'text-rose-200',
            accent: 'bg-rose-500/20'
        },
        goods: [
            { id: 'meat_pork', name: 'Свинина', icon: '🥩', basePrice: 25, volatility: 'medium', unitName: 'туша', description: 'Соковиті окороки, сало та свіжа свинина.' },
            { id: 'meat_beef', name: 'Яловичина', icon: '🍖', basePrice: 32, volatility: 'medium', unitName: 'туша', description: 'Добірні яловичі вирізки для міських різниць.' },
            { id: 'meat_mutton', name: 'Баранина', icon: '🥩', basePrice: 28, volatility: 'medium', unitName: 'туша', description: 'Ніжна баранина з гірських та степових пасовищ.' },
            { id: 'meat_game', name: 'Дичина', icon: '🦌', basePrice: 42, volatility: 'high', unitName: 'здобич', description: 'Впольовані олені, вепри, фазани та дикі качки.' }
        ]
    },
    {
        id: 'apiculture',
        name: 'Продукти бджільництва',
        icon: '🍯',
        description: 'Золотистий мед та пахучий віск з лісових пасік та бортних угідь.',
        categoryQuote: '«Мед солодкий на язиці, а віск світить у найтемнішу ніч.»',
        colorScheme: {
            bg: 'from-yellow-950/50 to-amber-950/30',
            border: 'border-yellow-500/60',
            text: 'text-yellow-200',
            accent: 'bg-yellow-500/20'
        },
        goods: [
            { id: 'api_honey', name: 'Мед', icon: '🍯', basePrice: 35, volatility: 'medium', unitName: 'глечик', description: 'Запашний липовий, гречаний та різнотравний мед.' },
            { id: 'api_wax', name: 'Віск', icon: '🕯️', basePrice: 28, volatility: 'low', unitName: 'злиток', description: 'Чистий бджолиний віск для свічок, печаток і змащування.' }
        ]
    },
    {
        id: 'spices',
        name: 'Приправи',
        icon: '🧂',
        description: 'Рідкісні заморські спеції, степові прянощі та життєво необхідна сіль.',
        categoryQuote: '«Дрібка шафрану коштує як злиток срібла, а без солі пропаде будь-який запас.»',
        colorScheme: {
            bg: 'from-orange-950/40 to-stone-900/40',
            border: 'border-orange-500/50',
            text: 'text-orange-200',
            accent: 'bg-orange-500/20'
        },
        goods: [
            { id: 'spc_salt', name: 'Сіль', icon: '🧂', basePrice: 20, volatility: 'low', unitName: 'пуд', description: 'Біле золото карпатських та кримських солеварень.' },
            { id: 'spc_pepper', name: 'Перець', icon: '🫑', basePrice: 45, volatility: 'high', unitName: 'мішечок', description: 'Гострий чорний та запашний перець із південних караванів.' },
            { id: 'spc_saffron', name: 'Шафран', icon: '🌸', basePrice: 110, volatility: 'extreme', unitName: 'скринька', description: 'Найдорожча царська пряність яскраво-золотого кольору.' },
            { id: 'spc_mustard', name: 'Гірчиця', icon: '🥣', basePrice: 16, volatility: 'low', unitName: 'горщик', description: 'Гостра розтерта гірчиця для м\'ясних страв.' },
            { id: 'spc_herbs', name: 'Трави', icon: '🌿', basePrice: 18, volatility: 'medium', unitName: 'снопик', description: 'Чебрець, полин, м\'ята, шавлія та духмяний майоран.' }
        ]
    },
    {
        id: 'beverages',
        name: 'Напої',
        icon: '🍺',
        description: 'Хмільні та освіжаючі напої для міських таверн, застіль і святкувань.',
        categoryQuote: '«Добра пивоварня ніколи не знає збитків у цьому краї!»',
        colorScheme: {
            bg: 'from-amber-950/50 to-orange-950/30',
            border: 'border-amber-400/60',
            text: 'text-amber-100',
            accent: 'bg-amber-400/20'
        },
        goods: [
            { id: 'bev_beer', name: 'Пиво', icon: '🍺', basePrice: 15, volatility: 'low', unitName: 'бочка', description: 'Світлий та темний ель, зварений на доброму хмелю.' },
            { id: 'bev_mead', name: 'Хмільний мед', icon: '🏺', basePrice: 32, volatility: 'medium', unitName: 'амфора', description: 'Старовинний питний мед багаторічної витримки.' },
            { id: 'bev_wine', name: 'Вино', icon: '🍷', basePrice: 55, volatility: 'high', unitName: 'сулія', description: 'Шляхетні червоні та білі виноградні вина.' },
            { id: 'bev_kvass', name: 'Квас', icon: '🧃', basePrice: 8, volatility: 'low', unitName: 'бочонок', description: 'Освіжаючий хлібний та ягідний квас.' }
        ]
    },
    {
        id: 'fabrics',
        name: 'Тканини',
        icon: '🧵',
        description: 'Рулони натуральних сукон, тонкого шовку та практичного льону.',
        categoryQuote: '«З тонкої нитки тчеться багатство міст і велич імперій.»',
        colorScheme: {
            bg: 'from-indigo-950/40 to-slate-900/40',
            border: 'border-indigo-500/50',
            text: 'text-indigo-200',
            accent: 'bg-indigo-500/20'
        },
        goods: [
            { id: 'fab_flax', name: 'Льон', icon: '🌾', basePrice: 18, volatility: 'low', unitName: 'сувій', description: 'Міцне лляне волокно та нитки для полотна.' },
            { id: 'fab_wool', name: 'Вовна', icon: '🧶', basePrice: 24, volatility: 'medium', unitName: 'кіптя', description: 'Тепла овеча вовна для сукна та зимового одягу.' },
            { id: 'fab_canvas', name: 'Полотно', icon: '📜', basePrice: 20, volatility: 'low', unitName: 'рулон', description: 'Цупке вибілене полотно для сорочок та вітрил.' },
            { id: 'fab_silk', name: 'Шовк', icon: '🪡', basePrice: 85, volatility: 'extreme', unitName: 'сувій', description: 'Розкішний гладкий шовк зі східних купецьких шляхів.' },
            { id: 'fab_cotton', name: 'Бавовна', icon: '☁️', basePrice: 28, volatility: 'medium', unitName: 'пака', description: 'М\'яка заморська бавовняна пряжа.' }
        ]
    },
    {
        id: 'clothing',
        name: 'Одяг',
        icon: '👕',
        description: 'Готовий пошитий одяг для простолюду, купців та вельможної шляхти.',
        categoryQuote: '«За одежею стрічають, а за якісним кроєм пізнають майстра гільдії крамарів.»',
        colorScheme: {
            bg: 'from-purple-950/40 to-stone-900/40',
            border: 'border-purple-500/50',
            text: 'text-purple-200',
            accent: 'bg-purple-500/20'
        },
        goods: [
            { id: 'clo_shirts', name: 'Сорочки', icon: '👕', basePrice: 22, volatility: 'low', unitName: 'дюжина', description: 'Вишиті лляні та суконні сорочки.' },
            { id: 'clo_cloaks', name: 'Плащі', icon: '🧥', basePrice: 38, volatility: 'medium', unitName: 'партія (5 шт)', description: 'Теплі дорожні плащі з каптурами від дощу й вітру.' },
            { id: 'clo_pants', name: 'Штани', icon: '👖', basePrice: 26, volatility: 'low', unitName: 'дюжина', description: 'Міцні суконні шаровари та європейські штани.' },
            { id: 'clo_dresses', name: 'Сукні', icon: '👗', basePrice: 60, volatility: 'high', unitName: 'штука', description: 'Пишні оксамитові та шовкові сукні міських панянок.' },
            { id: 'clo_headwear', name: 'Головні убори', icon: '👑', basePrice: 30, volatility: 'medium', unitName: 'десяток', description: 'Шапки, хустки, капелюхи та каптури.' }
        ]
    },
    {
        id: 'leather',
        name: 'Шкіра',
        icon: '👞',
        description: 'Вичинені шкури, міцне ремісниче взуття та дорожнє спорядження.',
        categoryQuote: '«Добра шкіра не боїться болота і захищає ногу в далеких походах.»',
        colorScheme: {
            bg: 'from-amber-950/50 to-stone-950/40',
            border: 'border-yellow-700/50',
            text: 'text-amber-200',
            accent: 'bg-amber-600/20'
        },
        goods: [
            { id: 'lea_raw', name: 'Шкіра (вичинена)', icon: '🥋', basePrice: 32, volatility: 'medium', unitName: 'дублена шкура', description: 'Цупка волова та свиняча шкіра для ремісників.' },
            { id: 'lea_belts', name: 'Ремені', icon: '🪢', basePrice: 20, volatility: 'low', unitName: 'в\'язка (10 шт)', description: 'Шкіряні паски з кованими латунними пряжками.' },
            { id: 'lea_boots', name: 'Взуття', icon: '👞', basePrice: 40, volatility: 'medium', unitName: 'пара (5 шт)', description: 'Високі юхтові чоботи та міцні черевики.' },
            { id: 'lea_bags', name: 'Сумки', icon: '👜', basePrice: 25, volatility: 'low', unitName: 'партія (5 шт)', description: 'Купецькі капшуки, дорожні торби та сакви.' },
            { id: 'lea_gloves', name: 'Рукавички', icon: '🧤', basePrice: 18, volatility: 'low', unitName: 'дюжина пар', description: 'Шкіряні рукавиці для вершників та лучників.' }
        ]
    },
    {
        id: 'weapons',
        name: 'Зброя',
        icon: '⚔️',
        description: 'Коване залізо та сталь гільдій зброярів для самооборони та армій.',
        categoryQuote: '«У неспокійні часи зброя цінується вище за хліб, а добрий клинок рятує життя.»',
        colorScheme: {
            bg: 'from-red-950/40 to-stone-900/50',
            border: 'border-red-500/50',
            text: 'text-red-200',
            accent: 'bg-red-500/20'
        },
        goods: [
            { id: 'wep_swords', name: 'Мечі', icon: '🗡️', basePrice: 75, volatility: 'high', unitName: 'клинок', description: 'Загартовані дворучні та одноручні мечі гільдійських ковалів.' },
            { id: 'wep_spears', name: 'Списи', icon: '🔱', basePrice: 35, volatility: 'medium', unitName: 'десяток', description: 'Довгі піки та списи з міцними наконечниками.' },
            { id: 'wep_axes', name: 'Сокири', icon: '🪓', basePrice: 45, volatility: 'medium', unitName: 'партія (5 шт)', description: 'Бойові сокири, чекани та бердиші.' },
            { id: 'wep_bows', name: 'Луки', icon: '🏹', basePrice: 50, volatility: 'medium', unitName: 'пачка (5 шт)', description: 'Складені тисові та ясенові луки з тятивами.' },
            { id: 'wep_crossbows', name: 'Арбалети', icon: '🎯', basePrice: 90, volatility: 'high', unitName: 'штука', description: 'Потужні сталеві арбалети з коловоротами.' },
            { id: 'wep_shields', name: 'Щити', icon: '🛡️', basePrice: 40, volatility: 'low', unitName: 'партія (5 шт)', description: 'Дубові круглі та краплеподібні щити, окуті сталлю.' }
        ]
    },
    {
        id: 'armors',
        name: 'Обладунки',
        icon: '🛡️',
        description: 'Важкий та легкий захист для лицарів, стражників та найманців.',
        categoryQuote: '«Сталевий панцир відбиває стріли, а кольчуга береже від рубаючих ударів.»',
        colorScheme: {
            bg: 'from-slate-900/60 to-zinc-900/40',
            border: 'border-slate-500/50',
            text: 'text-slate-200',
            accent: 'bg-slate-500/20'
        },
        goods: [
            { id: 'arm_chainmail', name: 'Кольчуги', icon: '⛓️', basePrice: 85, volatility: 'high', unitName: 'обладунок', description: 'Плетені з гартованих кілець міцні кольчужні сорочки.' },
            { id: 'arm_helmets', name: 'Шоломи', icon: '🪖', basePrice: 45, volatility: 'medium', unitName: 'партія (5 шт)', description: 'Шоломи типу нормандських конусів, салади та топфхельми.' },
            { id: 'arm_bracers', name: 'Наручі', icon: '🦾', basePrice: 30, volatility: 'low', unitName: 'дюжина пар', description: 'Сталеві та шкіряні наручі для захисту передпліч.' },
            { id: 'arm_cuirasses', name: 'Панцирі', icon: '🛡️', basePrice: 130, volatility: 'extreme', unitName: 'комплект', description: 'Повні ковані нагрудники та пластинчасті лати.' }
        ]
    },
    {
        id: 'metals',
        name: 'Метали',
        icon: '🔨',
        description: 'Злитки чорних, кольорових та благородних металів з гірських копалень.',
        categoryQuote: '«Золото купує все, але залізо править світом.»',
        colorScheme: {
            bg: 'from-stone-900/60 to-amber-950/30',
            border: 'border-yellow-600/50',
            text: 'text-amber-100',
            accent: 'bg-yellow-500/20'
        },
        goods: [
            { id: 'met_iron', name: 'Залізо', icon: '🧱', basePrice: 28, volatility: 'low', unitName: 'пуд злитків', description: 'Кричне залізо для кузень та майстерень.' },
            { id: 'met_copper', name: 'Мідь', icon: '🟤', basePrice: 36, volatility: 'medium', unitName: 'злиток', description: 'Червона мідь для монет, казанів та бронзи.' },
            { id: 'met_tin', name: 'Олово', icon: '⚪', basePrice: 42, volatility: 'medium', unitName: 'злиток', description: 'М\'яке олово для сплавів та лиття солдатиків.' },
            { id: 'met_lead', name: 'Свинець', icon: '🔘', basePrice: 30, volatility: 'low', unitName: 'чушка', description: 'Важкий свинець для куль, покрівлі та друкарства.' },
            { id: 'met_silver', name: 'Срібло', icon: '🥈', basePrice: 110, volatility: 'high', unitName: 'фунт', description: 'Чисті срібні злитки для карбування та ювелірів.' },
            { id: 'met_gold', name: 'Золото', icon: '🥇', basePrice: 220, volatility: 'extreme', unitName: 'унція', description: 'Найвищої проби золоті бруски міських скарбниць.' }
        ]
    },
    {
        id: 'tableware',
        name: 'Посуд',
        icon: '🏺',
        description: 'Гончарні, токарні та ковані вироби для домашнього вогнища та корчм.',
        categoryQuote: '«Жоден стіл не буде накритий без гончарного глечика та точеної миски.»',
        colorScheme: {
            bg: 'from-amber-950/40 to-stone-900/40',
            border: 'border-amber-600/50',
            text: 'text-amber-200',
            accent: 'bg-amber-600/20'
        },
        goods: [
            { id: 'tab_ceramics', name: 'Кераміка', icon: '🏺', basePrice: 18, volatility: 'low', unitName: 'віз (50 шт)', description: 'Глиняні горщики, глеки для молока, макітри та миски.' },
            { id: 'tab_wood', name: 'Дерев\'яний посуд', icon: '🪵', basePrice: 14, volatility: 'low', unitName: 'ящик (100 шт)', description: 'Липові ложки, точені тарелі та діжки.' },
            { id: 'tab_metal', name: 'Металевий посуд', icon: '🫖', basePrice: 48, volatility: 'medium', unitName: 'набір (10 шт)', description: 'Мідні казани, олов\'яні кубки та залізні сковороди.' }
        ]
    },
    {
        id: 'raw_materials',
        name: 'Сировина',
        icon: '🪵',
        description: 'Будівельні матеріали, лісове багатство та камінь для фортечних мурів.',
        categoryQuote: '«З каменю та дуба постають незламні замки та великі міста.»',
        colorScheme: {
            bg: 'from-emerald-950/30 to-stone-900/50',
            border: 'border-stone-500/50',
            text: 'text-stone-200',
            accent: 'bg-stone-500/20'
        },
        goods: [
            { id: 'raw_wood', name: 'Деревина', icon: '🪵', basePrice: 20, volatility: 'low', unitName: 'колоди (віз)', description: 'Корабельні сосни, дубовий брус та ялина.' },
            { id: 'raw_furs', name: 'Хутро', icon: '🦊', basePrice: 85, volatility: 'high', unitName: 'зв\'язка (соболі/лисиці)', description: 'Цінне хутро соболя, куниці, бобра та чорнобурки.' },
            { id: 'raw_resin', name: 'Смола', icon: '🪨', basePrice: 22, volatility: 'low', unitName: 'бочка', description: 'Дьоготь та деревна смола для конопачення човнів.' },
            { id: 'raw_stone', name: 'Камінь', icon: '🧱', basePrice: 25, volatility: 'low', unitName: 'підвода тесаного блоку', description: 'Білий вапняк, граніт та пісковик для будівництва.' }
        ]
    },
    {
        id: 'household',
        name: 'Побутове',
        icon: '🕯️',
        description: 'Повсякденні побутові речі, інструменти та приладдя для осель.',
        categoryQuote: '«Дрібниці творять затишок, а голка з ниткою виручить у будь-якій халепі.»',
        colorScheme: {
            bg: 'from-yellow-950/40 to-stone-900/40',
            border: 'border-yellow-600/50',
            text: 'text-yellow-100',
            accent: 'bg-yellow-600/20'
        },
        goods: [
            { id: 'hou_candles', name: 'Свічки', icon: '🕯️', basePrice: 15, volatility: 'low', unitName: 'коробка (50 шт)', description: 'Воскові та лойові свічки для освітлення домівок.' },
            { id: 'hou_soap', name: 'Мило', icon: '🧼', basePrice: 18, volatility: 'low', unitName: 'ящик брусків', description: 'Запашне лавандове та миловарне господарське мило.' },
            { id: 'hou_ropes', name: 'Мотузки', icon: '🪢', basePrice: 16, volatility: 'low', unitName: 'бухта (100 м)', description: 'Міцні прядив\'яні та конопляні канати.' },
            { id: 'hou_needles', name: 'Голки', icon: '🪡', basePrice: 24, volatility: 'medium', unitName: 'пачка (200 шт)', description: 'Сталеві гартовані швейні та шевські голки.' },
            { id: 'hou_knives', name: 'Ножі', icon: '🔪', basePrice: 30, volatility: 'low', unitName: 'дюжина', description: 'Універсальні побутові та обробні ножі.' }
        ]
    },
    {
        id: 'stationery',
        name: 'Письмове',
        icon: '📜',
        description: 'Матеріали для книгодрукування, скрипторіїв, грамот та указів.',
        categoryQuote: '«Написане пером не вирубаєш сокирою, а знання дорожчі за палаци.»',
        colorScheme: {
            bg: 'from-amber-950/40 to-purple-950/30',
            border: 'border-amber-400/50',
            text: 'text-amber-200',
            accent: 'bg-amber-400/20'
        },
        goods: [
            { id: 'sta_parchment', name: 'Пергамент', icon: '📜', basePrice: 50, volatility: 'medium', unitName: 'стопа (20 листів)', description: 'Тонко вичинена теляча шкіра для важливих грамот.' },
            { id: 'sta_paper', name: 'Папір', icon: '📄', basePrice: 35, volatility: 'medium', unitName: 'пачка', description: 'Ганчірковий міцний папір перших папірень.' },
            { id: 'sta_ink', name: 'Чорнило', icon: '✒️', basePrice: 28, volatility: 'low', unitName: 'флакон', description: 'Густе стійке чорнило з чорнильних горішків.' },
            { id: 'sta_books', name: 'Книги', icon: '📚', basePrice: 140, volatility: 'extreme', unitName: 'фоліант у шкірі', description: 'Рукописні літописи, кодекси законів та травники.' }
        ]
    },
    {
        id: 'luxury',
        name: 'Предмети розкоші',
        icon: '💎',
        description: 'Найвишуканіші товари світу для королів, князів та верховних ієрархів.',
        categoryQuote: '«Сяйво діамантів засліплює розум, а східний аромат п\'янить дужче за вино.»',
        colorScheme: {
            bg: 'from-purple-950/50 to-pink-950/30',
            border: 'border-fuchsia-500/60',
            text: 'text-fuchsia-200',
            accent: 'bg-fuchsia-500/20'
        },
        goods: [
            { id: 'lux_gems', name: 'Коштовне каміння', icon: '💎', basePrice: 260, volatility: 'extreme', unitName: 'огранений карат', description: 'Смарагди, рубіни, сапфіри та діаманти найчистішої води.' },
            { id: 'lux_gold_jewelry', name: 'Золото (ювелірне)', icon: '👑', basePrice: 190, volatility: 'high', unitName: 'виріб', description: 'Масивні золоті гривни, персні та ланцюги.' },
            { id: 'lux_silverware', name: 'Срібло (філігрань)', icon: '💍', basePrice: 120, volatility: 'high', unitName: 'комплект', description: 'Тонка філігранна срібна робота з емаллю.' },
            { id: 'lux_silk_brocade', name: 'Шовк (парча)', icon: '👘', basePrice: 150, volatility: 'extreme', unitName: 'відріз', description: 'Золототкана парча та дамаський розписний шовк.' },
            { id: 'lux_perfume', name: 'Парфуми', icon: '🧴', basePrice: 95, volatility: 'high', unitName: 'кришталевий флакон', description: 'Ефірні олії троянди, сандалу та амбри.' }
        ]
    },
    {
        id: 'transport',
        name: 'Транспортне',
        icon: '🐎',
        description: 'Спорядження для караванів, кінних обозів, возів та подорожей.',
        categoryQuote: '«Міцне колесо та надійна підкова долають тисячі верст без зупинки.»',
        colorScheme: {
            bg: 'from-amber-950/40 to-stone-900/50',
            border: 'border-amber-600/50',
            text: 'text-amber-200',
            accent: 'bg-amber-600/20'
        },
        goods: [
            { id: 'tra_saddles', name: 'Сідла', icon: '🏇', basePrice: 55, volatility: 'medium', unitName: 'сідло з стременами', description: 'Зручні шкіряні кавалерійські та купецькі сідла.' },
            { id: 'tra_bridles', name: 'Вуздечки', icon: '🪢', basePrice: 22, volatility: 'low', unitName: 'комплект (5 шт)', description: 'Міцні шори, вудила та ремінні вуздечки.' },
            { id: 'tra_wagons', name: 'Вози', icon: '🛒', basePrice: 110, volatility: 'high', unitName: 'критий купецький віз', description: 'Вантажні чумацькі та купецькі мажі на дубових осях.' },
            { id: 'tra_wheels', name: 'Колеса', icon: '⚙️', basePrice: 32, volatility: 'low', unitName: 'комплект (4 колеса)', description: 'Ковані обкуті залізом колеса зі спицями.' },
            { id: 'tra_horseshoes', name: 'Підкови', icon: '🧲', basePrice: 18, volatility: 'low', unitName: 'зв\'язка (20 шт)', description: 'Гартовані ковальські підкови з цвяхами-вухналями.' }
        ]
    }
];

// Guild Ranks
export interface GuildRankInfo {
    rank: number;
    title: string;
    badge: string;
    requiredReputation: number;
    feeDiscountPercent: number;
    profitBonusPercent: number;
    maxActivePositions: number;
    description: string;
}

export const GUILD_RANKS: GuildRankInfo[] = [
    { rank: 1, title: 'Учень Купця', badge: '🪙', requiredReputation: 0, feeDiscountPercent: 0, profitBonusPercent: 0, maxActivePositions: 5, description: 'Базовий доступ до міських складів. Комісія гільдії 8%.' },
    { rank: 2, title: 'Приказчик Гільдії', badge: '📜', requiredReputation: 100, feeDiscountPercent: 25, profitBonusPercent: 5, maxActivePositions: 8, description: 'Знижена комісія (6%), +5% до дивідендів. До 8 активних угод.' },
    { rank: 3, title: 'Шанований Купець', badge: '🏛️', requiredReputation: 350, feeDiscountPercent: 50, profitBonusPercent: 10, maxActivePositions: 12, description: 'Комісія 4%, +10% до прибутку. Відкриття караванних синдикатів.' },
    { rank: 4, title: 'Гільдмейстер Торгівлі', badge: '👑', requiredReputation: 800, feeDiscountPercent: 75, profitBonusPercent: 20, maxActivePositions: 18, description: 'Мінімальна комісія (2%), +20% до прибутку та захист караванів.' },
    { rank: 5, title: 'Верховний Торговий Магнат', badge: '💎', requiredReputation: 1800, feeDiscountPercent: 100, profitBonusPercent: 30, maxActivePositions: 30, description: 'Повна відсутність комісії (0%), +30% чистий бонус прибутку та безлімітні склади!' }
];

export function getGuildRank(reputation: number): GuildRankInfo {
    for (let i = GUILD_RANKS.length - 1; i >= 0; i--) {
        if (reputation >= GUILD_RANKS[i].requiredReputation) {
            return GUILD_RANKS[i];
        }
    }
    return GUILD_RANKS[0];
}

// Deterministic yet evolving price multiplier for a good in a city based on city ID and current time/seed
export function getCommodityMarketPrice(
    cityId: string,
    good: CommoditySubGood,
    category: CommodityCategory,
    timeSeed: number = 0
): {
    currentPrice: number;
    priceMultiplier: number;
    trend: 'skyrocketing' | 'rising' | 'stable' | 'falling' | 'crashing';
    trendPercent: number;
    trendLabel: string;
} {
    // Generate pseudorandom factor based on cityId, good.id, and timeSeed (which steps on player travel/actions)
    let hash = 0;
    const str = `${cityId}:${good.id}:${category.id}:${Math.floor(timeSeed / 4)}`;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }

    const normalizedHash = Math.abs(hash) % 1000 / 1000; // 0.0 to 1.0

    let volatilityRange = 0.15;
    if (good.volatility === 'low') volatilityRange = 0.12;
    if (good.volatility === 'medium') volatilityRange = 0.25;
    if (good.volatility === 'high') volatilityRange = 0.45;
    if (good.volatility === 'extreme') volatilityRange = 0.75;

    // Center around 1.0 with oscillation
    const rawDelta = (normalizedHash - 0.48) * 2 * volatilityRange;
    const multiplier = Math.max(0.45, Math.min(2.4, 1.0 + rawDelta));
    const currentPrice = Math.max(1, Math.round(good.basePrice * multiplier));
    const trendPercent = Math.round((multiplier - 1.0) * 100);

    let trend: 'skyrocketing' | 'rising' | 'stable' | 'falling' | 'crashing' = 'stable';
    let trendLabel = '⚖️ Стабільна ціна';

    if (trendPercent >= 40) {
        trend = 'skyrocketing';
        trendLabel = `🔥 Дефіцит! (+${trendPercent}%)`;
    } else if (trendPercent >= 10) {
        trend = 'rising';
        trendLabel = `📈 Зростання (+${trendPercent}%)`;
    } else if (trendPercent <= -30) {
        trend = 'crashing';
        trendLabel = `📉 Обвал цін (${trendPercent}%)`;
    } else if (trendPercent <= -10) {
        trend = 'falling';
        trendLabel = `🔻 Спад попиту (${trendPercent}%)`;
    } else {
        trend = 'stable';
        trendLabel = `⚖️ Звичайна ціна (${trendPercent >= 0 ? '+' : ''}${trendPercent}%)`;
    }

    return {
        currentPrice,
        priceMultiplier: multiplier,
        trend,
        trendPercent,
        trendLabel
    };
}

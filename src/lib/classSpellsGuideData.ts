import { COMPANION_CLASSES } from './companionClasses';
import { CompanionClassDef } from '../types';

export interface GuideClassCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    classIds: string[];
}

export interface DetailedClassGuideItem {
    id: string;
    name: string;
    title: string;
    category: string;
    categoryName: string;
    icon: string;
    badgeColor: string;
    description: string;
    role: 'Танк / Захисник' | 'Штурмовик / ДПС' | 'Стрілець / Рейндж' | 'Маг / Заклинач' | 'Підтримка / Бафер' | 'Універсал / Спеціаліст';
    difficulty: 'Легко' | 'Середньо' | 'Високо' | 'Експерт';
    baseStats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
    ability: {
        name: string;
        type: 'damage_single' | 'damage_aoe' | 'buff_player' | 'summon' | 'raise_undead' | 'trap' | 'damage_multi' | 'heal_player' | 'heal';
        typeName: string;
        typeIcon: string;
        power: number;
        hitCount?: number;
        description: string;
        tacticalNote: string;
        cooldownOrTrigger: string;
    };
    summon?: {
        name: string;
        title: string;
        avatar: string;
        hp: number;
        strength: number;
        agility: number;
        armor: number;
        special?: string;
    };
    synergies: string[];
    counters: string[];
}

export interface GameSpellGuideItem {
    id: string;
    name: string;
    school: 'Некромантія та Тінь' | 'Стихійна Магія' | 'Священна Магія' | 'Арканна та Захисна' | 'Магія Природи';
    schoolIcon: string;
    schoolColor: string;
    tier: 'Базове' | 'Бойове' | 'Вище' | 'Легендарне';
    effectDescription: string;
    cardRule?: string;
    brawlRule?: string;
    manaCostOrReq?: string;
    flavorQuote: string;
    icon: string;
}

export const GUIDE_CATEGORIES: GuideClassCategory[] = [
    {
        id: 'melee',
        name: 'Ближній бій та Авангард',
        icon: '⚔️',
        color: 'from-amber-700 to-red-800',
        description: 'Воїни першої лінії, важкоброньовані лицарі, майстри шаленого натиску та захисники загону.',
        classIds: ['barbarian', 'berserker', 'pikeman', 'grenadier', 'samurai', 'guardian', 'cataphract', 'duelist', 'swordsman', 'shieldbearer']
    },
    {
        id: 'ranged',
        name: 'Стрільці та Далекобійні',
        icon: '🏹',
        color: 'from-emerald-700 to-teal-800',
        description: 'Майстри луків, арбалетів, ранньої вогнепальної зброї та метальних снарядів із високою точністю.',
        classIds: ['hunter', 'sniper', 'crossbowman', 'skirmisher', 'ranger', 'musketeer', 'arquebusier', 'thrower']
    },
    {
        id: 'rogue',
        name: 'Розбійники та Асасини',
        icon: '🗡️',
        color: 'from-purple-800 to-zinc-900',
        description: 'Швидкі бійці, отруйники, майстри ударів у спину, диверсанти та підступні дуелянти.',
        classIds: ['assassin', 'ninja', 'thief', 'saboteur', 'spy', 'executioner', 'pirate', 'bandit']
    },
    {
        id: 'magic',
        name: 'Стихійна та Арканна Магія',
        icon: '🔮',
        color: 'from-indigo-700 to-blue-900',
        description: 'Чаклуни, некроманти, піроманти та повелителі простору й часу, що знищують цілі полки.',
        classIds: ['elementalist', 'warlock', 'summoner', 'necromancer', 'illusionist', 'alchemist', 'druid', 'shaman', 'chronomancer', 'gravitomancer', 'cryomancer', 'pyromancer', 'blood_mage', 'shadowmancer']
    },
    {
        id: 'holy',
        name: 'Святі Воїни та Інквізиція',
        icon: '✝️',
        color: 'from-yellow-600 to-amber-700',
        description: 'Служителі світла, паладини, екзорцисти, здатні випалювати нежить та зцілювати рани побратимів.',
        classIds: ['priest', 'paladin', 'exorcist', 'inquisitor', 'holy_knight', 'martyr']
    },
    {
        id: 'beasts',
        name: 'Природа, Звірі та Перевертні',
        icon: '🐺',
        color: 'from-green-700 to-emerald-900',
        description: 'Приборкувачі диких хижаків, драконарії, вершники та знахарі з природними тотемами.',
        classIds: ['beastmaster', 'rider', 'dragon_knight', 'shapeshifter', 'beast_trainer', 'herbalist']
    },
    {
        id: 'special',
        name: 'Тактики, Лідери та Особливі',
        icon: '⚙️',
        color: 'from-amber-800 to-stone-900',
        description: 'Командири, барабанщики, дипломати, торговці та інженери, що змінюють правила самої битви.',
        classIds: ['commander', 'tactician', 'clonemaster', 'puppeteer', 'necro_engineer', 'archaeologist', 'cartographer', 'adventurer', 'diplomat', 'merchant', 'gambler', 'wandering_knight', 'banner_bearer', 'drummer', 'herald', 'beggar']
    }
];

export const ALL_CLASSES_DETAILED: DetailedClassGuideItem[] = [
    // ⚔️ Ближній бій
    {
        id: 'barbarian',
        name: 'Варвар',
        title: 'Barbarian',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '🪓',
        badgeColor: 'bg-red-900 border-red-500 text-red-200',
        description: 'Нестримний воїн північних пусток. Чим більше ран отримує, тим потужніший його бойовий шал.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Легко',
        baseStats: { hp: 120, attack: 18, defense: 8, speed: 10 },
        ability: {
            name: 'Бойовий Клич',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 30,
            description: 'Завдає 30 одиниць миттєвої нищівної шкоди найнебезпечнішому ворогу перед початком сутички.',
            tacticalNote: 'Ідеальний для швидкого виведення з ладу ворожого ватажка чи мага.',
            cooldownOrTrigger: 'Спрацьовує на старті раунду'
        },
        synergies: ['Берсерк', 'Шаман', 'Прапороносець'],
        counters: ['Стрільці', 'Маги слабкої броні']
    },
    {
        id: 'berserker',
        name: 'Берсерк',
        title: 'Berserker',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '🩸',
        badgeColor: 'bg-rose-950 border-rose-600 text-rose-200',
        description: 'Воїн, охоплений кривавою люттю, що ігнорує власний захист заради колосальної сили різанини.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Середньо',
        baseStats: { hp: 100, attack: 22, defense: 4, speed: 12 },
        ability: {
            name: 'Кривава Лють',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 20,
            description: 'Розсікає сокирами все поле бою, завдаючи 20 одиниць шкоди абсолютно кожному ворогу в загоні.',
            tacticalNote: 'Найкращий вибір проти великих зграй гоблінів, бандитів чи зомбі.',
            cooldownOrTrigger: 'Миттєвий вступний натиск'
        },
        synergies: ['Жрець', 'Гвардієць', 'Барабанщик'],
        counters: ['Численні слабкі загони']
    },
    {
        id: 'pikeman',
        name: 'Пікінер',
        title: 'Pikeman',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '🔱',
        badgeColor: 'bg-amber-950 border-amber-600 text-amber-200',
        description: 'Дисциплінований боєць із довгою швейцарською пікою, що зупиняє будь-який натиск на відстані.',
        role: 'Танк / Захисник',
        difficulty: 'Легко',
        baseStats: { hp: 110, attack: 14, defense: 14, speed: 8 },
        ability: {
            name: 'Стіна Списів',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 25,
            description: 'Пронизує нападника до того, як той встигне дістатися союзної лінії (25 шкоди).',
            tacticalNote: 'Ефективний проти вершників та монстрів із чарджем.',
            cooldownOrTrigger: 'Контратака при наближенні'
        },
        synergies: ['Щитоносець', 'Арбалетник', 'Командир'],
        counters: ['Кіннота', 'Звірі']
    },
    {
        id: 'grenadier',
        name: 'Гренадер',
        title: 'Grenadier',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '💣',
        badgeColor: 'bg-orange-950 border-orange-500 text-orange-200',
        description: 'Елітний піхотинець, озброєний алхімічними бомбами, порохом та запалювальними сумішами.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Середньо',
        baseStats: { hp: 95, attack: 16, defense: 10, speed: 9 },
        ability: {
            name: 'Вибухівка',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 35,
            description: 'Кидає чавунну гранату в центр ворожого строю, завдаючи 35 масової вогняної шкоди.',
            tacticalNote: 'Має найвищий показник початкової вибухової шкоди серед піхоти.',
            cooldownOrTrigger: 'Кидок на відкритті бою'
        },
        synergies: ['Алхімік', 'Піромант', 'Диверсант'],
        counters: ['Щільні формації ворогів']
    },
    {
        id: 'samurai',
        name: 'Самурай',
        title: 'Samurai',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '👘',
        badgeColor: 'bg-red-950 border-red-600 text-red-100',
        description: 'Майстер кованої катани та кодексу честі, здатний розсікти ворога одним блискавичним рухом.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Високо',
        baseStats: { hp: 105, attack: 24, defense: 12, speed: 16 },
        ability: {
            name: 'Удар Іайдзюцу',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 50,
            description: 'Смертельний розтин мечем з піхов: 50 чистих одиниць шкоди в уразливе місце.',
            tacticalNote: 'Знищує елітних ворогів або лідерів до того, як вони зроблять хід.',
            cooldownOrTrigger: 'Блискавичне вихоплення катани'
        },
        synergies: ['Дуельянт', 'Асасин', 'Хрономант'],
        counters: ['Одиночні броньовані боси']
    },
    {
        id: 'guardian',
        name: 'Гвардієць',
        title: 'Guardian',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '🛡️',
        badgeColor: 'bg-blue-950 border-blue-500 text-blue-200',
        description: 'Королівський страж у повних латах, головне завдання якого — життя та безпека командира.',
        role: 'Танк / Захисник',
        difficulty: 'Легко',
        baseStats: { hp: 140, attack: 12, defense: 20, speed: 6 },
        ability: {
            name: 'Захисна Стійка',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 20,
            description: 'Прикриває лідера щитом, поглинаючи перші 20 одиниць шкоди та підвищуючи захист.',
            tacticalNote: 'Рятує гравця в небезпечних дуелях та раундах із високими ставками.',
            cooldownOrTrigger: 'Постійна аура охорони'
        },
        synergies: ['Жрець', 'Маг', 'Снайпер'],
        counters: ['Швидкі вбивці']
    },
    {
        id: 'cataphract',
        name: 'Катапрактарій',
        title: 'Cataphract',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '🐎',
        badgeColor: 'bg-amber-900 border-amber-500 text-amber-100',
        description: 'Закований у залізо від голови до копит вершник, що трощить піхоту своєю масою та довгим контосом.',
        role: 'Танк / Захисник',
        difficulty: 'Середньо',
        baseStats: { hp: 135, attack: 18, defense: 18, speed: 11 },
        ability: {
            name: 'Кінний Чардж',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 25,
            description: 'Врізається у ворожі ряди на галопі, збиваючи ворогів з ніг (25 шкоди всім).',
            tacticalNote: 'Поєднує високу живучість броні з надійною шкодою по площі.',
            cooldownOrTrigger: 'Таран на першій секунді'
        },
        synergies: ['Вершник', 'Командир', 'Паладин'],
        counters: ['Легка піхота та стрільці']
    },
    {
        id: 'duelist',
        name: 'Дуельянт',
        title: 'Duelist',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '🤺',
        badgeColor: 'bg-zinc-800 border-amber-400 text-amber-200',
        description: 'Майстер фехтування на шпагах та рапірах. Неперевершений у поєдинках один на один.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Середньо',
        baseStats: { hp: 90, attack: 20, defense: 10, speed: 18 },
        ability: {
            name: 'Точний Випад',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 35,
            description: 'Знаходить щілину в обладунках ворога і завдає 35 одиниць кричущої шкоди.',
            tacticalNote: 'Має підвищений шанс критичного удару та ухилення від контратаки.',
            cooldownOrTrigger: 'Швидкий контрвипад'
        },
        synergies: ['Асасин', 'Самурай', 'Тактик'],
        counters: ['Одиночні важкі лицарі']
    },
    {
        id: 'swordsman',
        name: 'Мечник',
        title: 'Swordsman',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '⚔️',
        badgeColor: 'bg-stone-800 border-stone-500 text-stone-200',
        description: 'Класичний ветеран незліченних битв. Універсальний у будь-якій сутичці.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Легко',
        baseStats: { hp: 100, attack: 15, defense: 12, speed: 10 },
        ability: {
            name: 'Шквал Ударів',
            type: 'damage_multi',
            typeName: 'Серія атак (4 удари підряд)',
            typeIcon: '⚔️',
            power: 14,
            hitCount: 4,
            description: 'Шквал ударів наносить 4 атаки ворогу підряд, завдаючи швидкої нищівної серії розрубів клинком.',
            tacticalNote: 'Наносить 4 атаки ворогу підряд. Кожен випад пробиває захист окремо, забезпечуючи колосальну сумарну шкоду.',
            cooldownOrTrigger: '4 атаки підряд'
        },
        synergies: ['Будь-який клас'],
        counters: ['Звичайні розбійники']
    },
    {
        id: 'shieldbearer',
        name: 'Щитоносець',
        title: 'Shieldbearer',
        category: 'melee',
        categoryName: 'Ближній бій',
        icon: '🛡️',
        badgeColor: 'bg-stone-900 border-amber-600 text-amber-200',
        description: 'Непохитна жива стіна з важким павезом, що приймає стріли та удари на себе.',
        role: 'Танк / Захисник',
        difficulty: 'Легко',
        baseStats: { hp: 130, attack: 10, defense: 22, speed: 5 },
        ability: {
            name: 'Блок Щитом',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 20,
            description: 'Блокує ворожі атаки, додаючи +20 до захисту гравця в поточному раунді.',
            tacticalNote: 'Зменшує вхідну шкоду загону майже вдвічі.',
            cooldownOrTrigger: 'Глуха оборона'
        },
        synergies: ['Снайпер', 'Елементаліст', 'Жрець'],
        counters: ['Стрілецькі залпи']
    },

    // 🏹 Стрільці
    {
        id: 'hunter',
        name: 'Мисливець',
        title: 'Hunter',
        category: 'ranged',
        categoryName: 'Стрільці та далекобійні',
        icon: '🏹',
        badgeColor: 'bg-emerald-950 border-emerald-600 text-emerald-200',
        description: 'Лісовий мисливець, що знає повадки диких звірів та б\'є точно у вразливі органи.',
        role: 'Стрілець / Рейндж',
        difficulty: 'Легко',
        baseStats: { hp: 85, attack: 18, defense: 6, speed: 14 },
        ability: {
            name: 'Смертельний Постріл',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 35,
            description: 'Випускає прицільну стрілу з довгого лука, завдаючи 35 одиниць шкоди.',
            tacticalNote: 'Чудово підходить для зняття небезпечних цілей на відстані.',
            cooldownOrTrigger: 'Приціл із засідки'
        },
        synergies: ['Звіролов', 'Друїд', 'Рейнджер'],
        counters: ['Дикі хижаки та неброньовані цілі']
    },
    {
        id: 'sniper',
        name: 'Снайпер',
        title: 'Sniper',
        category: 'ranged',
        categoryName: 'Стрільці та далекобійні',
        icon: '🎯',
        badgeColor: 'bg-teal-950 border-teal-500 text-teal-200',
        description: 'Майстер наддалекого пострілу, що здатний ліквідувати ворожого командира з одного пострілу.',
        role: 'Стрілець / Рейндж',
        difficulty: 'Високо',
        baseStats: { hp: 75, attack: 28, defense: 4, speed: 15 },
        ability: {
            name: 'Хедшот',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 60,
            description: 'Величезний критичний постріл у голову: 60 одиниць чистісінької шкоди.',
            tacticalNote: 'Найвища одиночна фізична шкода серед усіх стрільців.',
            cooldownOrTrigger: 'Ідеальне фокусування'
        },
        synergies: ['Щитоносець', 'Шпигун', 'Гвардієць'],
        counters: ['Ворожі ватажки та боси']
    },
    {
        id: 'crossbowman',
        name: 'Арбалетник',
        title: 'Crossbowman',
        category: 'ranged',
        categoryName: 'Стрільці та далекобійні',
        icon: '🔩',
        badgeColor: 'bg-stone-900 border-amber-700 text-amber-300',
        description: 'Озброєний важким сталевим арбалетом з комірцевим натягом, що пробиває лати наскрізь.',
        role: 'Стрілець / Рейндж',
        difficulty: 'Легко',
        baseStats: { hp: 90, attack: 22, defense: 10, speed: 7 },
        ability: {
            name: 'Пробивний Болт',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 45,
            description: 'Завдає 45 одиниць бронебійної шкоди, ігноруючи значну частину ворожого захисту.',
            tacticalNote: 'Ідеальний проти паладинів, катафрактаріїв та важких лицарів.',
            cooldownOrTrigger: 'Потужний постріл болтом'
        },
        synergies: ['Пікінер', 'Командир'],
        counters: ['Важка броня']
    },
    {
        id: 'skirmisher',
        name: 'Застрільник',
        title: 'Skirmisher',
        category: 'ranged',
        categoryName: 'Стрільці та далекобійні',
        icon: '🏃‍♂️',
        badgeColor: 'bg-green-950 border-green-600 text-green-200',
        description: 'Надмобільний легкоозброєний боєць із дротиками, що виснажує ворожий авангард постійним обстрілом.',
        role: 'Стрілець / Рейндж',
        difficulty: 'Легко',
        baseStats: { hp: 80, attack: 14, defense: 6, speed: 19 },
        ability: {
            name: 'Швидкий Обстріл',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 15,
            description: 'Закидає дротиками всю лінію супротивника, завдаючи 15 шкоди кожному.',
            tacticalNote: 'Збиває концентрацію ворожих магів та послаблює стрій.',
            cooldownOrTrigger: 'Залп на ходу'
        },
        synergies: ['Метальник', 'Ніндзя'],
        counters: ['Повільні загони піхоти']
    },
    {
        id: 'ranger',
        name: 'Рейнджер',
        title: 'Ranger',
        category: 'ranged',
        categoryName: 'Стрільці та далекобійні',
        icon: '🌲',
        badgeColor: 'bg-emerald-900 border-emerald-500 text-emerald-100',
        description: 'Універсальний слідопит, що однаково вправно б\'ється луком, парними клинками та ставить пастки.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Середньо',
        baseStats: { hp: 95, attack: 19, defense: 9, speed: 13 },
        ability: {
            name: 'Град Стріл',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 25,
            description: 'Випускає град стріл по площі 2 на 3 тайли (уражає всіх ворогів у зоні 6 клітинок, 25 шкоди).',
            tacticalNote: 'Поєднує чудовий АоЕ-урон зі стійкістю у ближньому бою.',
            cooldownOrTrigger: 'Залп по площі'
        },
        synergies: ['Друїд', 'Мисливець', 'Звіролов'],
        counters: ['Зграї монстрів']
    },
    {
        id: 'musketeer',
        name: 'Мушкетер',
        title: 'Musketeer',
        category: 'ranged',
        categoryName: 'Стрільці та далекобійні',
        icon: '🪶',
        badgeColor: 'bg-blue-950 border-amber-400 text-amber-200',
        description: 'Шляхетний королівський стрілець із мушкетом та шпагою. Потужний вогнепальний залп із димом і громом.',
        role: 'Стрілець / Рейндж',
        difficulty: 'Середньо',
        baseStats: { hp: 85, attack: 26, defense: 7, speed: 11 },
        ability: {
            name: 'Залп',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 55,
            description: 'Потужний свинцевий постріл упритул на 55 одиниць нищівної шкоди.',
            tacticalNote: 'Один із найпотужніших точкових пострілів у грі.',
            cooldownOrTrigger: 'Пороховий постріл'
        },
        synergies: ['Аркебузир', 'Гренадер', 'Дуельянт'],
        counters: ['Елітні броньовані вороги']
    },
    {
        id: 'arquebusier',
        name: 'Аркебузир',
        title: 'Arquebusier',
        category: 'ranged',
        categoryName: 'Стрільці та далекобійні',
        icon: '💥',
        badgeColor: 'bg-stone-900 border-orange-600 text-orange-200',
        description: 'Стрілець епохи Відродження із важкою аркебузою на сошці, що стріляє картеччю.',
        role: 'Стрілець / Рейндж',
        difficulty: 'Легко',
        baseStats: { hp: 90, attack: 20, defense: 8, speed: 6 },
        ability: {
            name: 'Гарматний Постріл',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 30,
            description: 'Постріл картеччю віялом по ворожих лавах (30 шкоди всім ворогам).',
            tacticalNote: 'Ефективно змітає першу та другу лінію ворожого війська.',
            cooldownOrTrigger: 'Залп картечі'
        },
        synergies: ['Мушкетер', 'Гренадер', 'Пікінер'],
        counters: ['Щільні шеренги']
    },
    {
        id: 'thrower',
        name: 'Метальник',
        title: 'Thrower',
        category: 'ranged',
        categoryName: 'Стрільці та далекобійні',
        icon: '🪓',
        badgeColor: 'bg-zinc-900 border-amber-600 text-amber-200',
        description: 'Майстер метання францисок, важких ножів та бойових зірок на середній дистанції.',
        role: 'Стрілець / Рейндж',
        difficulty: 'Легко',
        baseStats: { hp: 95, attack: 17, defense: 9, speed: 12 },
        ability: {
            name: 'Кидок Сокири',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 25,
            description: 'Метає важку сокиру в щит або шолом ворога, завдаючи 25 шкоди.',
            tacticalNote: 'Швидка та безвідмовна дія без витрат мани.',
            cooldownOrTrigger: 'Миттєвий кидок'
        },
        synergies: ['Варвар', 'Застрільник'],
        counters: ['Середня піхота']
    },

    // 🗡️ Розбійники та Асасини
    {
        id: 'assassin',
        name: 'Асасин',
        title: 'Assassin',
        category: 'rogue',
        categoryName: 'Розбійники та асасини',
        icon: '🥷',
        badgeColor: 'bg-purple-950 border-purple-600 text-purple-200',
        description: 'Тіньовий убивця, що завдає фатального удару отруєним кинджалом із повної темряви.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Високо',
        baseStats: { hp: 70, attack: 32, defense: 4, speed: 20 },
        ability: {
            name: 'Удар в спину',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 70,
            description: 'Найвищий показник одиночної шкоди в грі (70 шкоди) при раптовій атаці з тіні.',
            tacticalNote: 'Здатний миттєво знищити найсильнішого ворожого мага чи лідера.',
            cooldownOrTrigger: 'Атака з невидимості'
        },
        synergies: ['Тіньовик', 'Шпигун', 'Ніндзя'],
        counters: ['Маги, боси без свити']
    },
    {
        id: 'ninja',
        name: 'Ніндзя',
        title: 'Ninja',
        category: 'rogue',
        categoryName: 'Розбійники та асасини',
        icon: '🥷',
        badgeColor: 'bg-zinc-950 border-purple-500 text-purple-300',
        description: 'Шинобі, що поєднує димові шашки, сюрікени, ухилення та отруйні техніки ніндзюцу.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Середньо',
        baseStats: { hp: 80, attack: 18, defense: 6, speed: 22 },
        ability: {
            name: 'Сюрікени',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 20,
            description: 'Віяловий кидок отруєних зірочок по всіх цілях (20 шкоди кожній).',
            tacticalNote: 'Поєднує високу швидкість ініціативи та отруєння натовпу.',
            cooldownOrTrigger: 'Кидок віялом'
        },
        synergies: ['Самурай', 'Асасин', 'Алхімік'],
        counters: ['Групи легкої піхоти']
    },
    {
        id: 'thief',
        name: 'Злодій',
        title: 'Thief',
        category: 'rogue',
        categoryName: 'Розбійники та асасини',
        icon: '💰',
        badgeColor: 'bg-stone-900 border-yellow-600 text-yellow-300',
        description: 'Спритний кишеньковий злодій, що краде гаманці ворогів та б\'є заточкою з-під поли.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Легко',
        baseStats: { hp: 75, attack: 15, defense: 5, speed: 17 },
        ability: {
            name: 'Підступний Удар',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 20,
            description: 'Швидкий удар у бік на 20 шкоди з шансом викрасти трохи золота під час бою.',
            tacticalNote: 'Приносить додаткові монети за кожен бій.',
            cooldownOrTrigger: 'Кишеньковий удар'
        },
        synergies: ['Торговець', 'Азартник', 'Бандит'],
        counters: ['Слабкі вартові']
    },
    {
        id: 'saboteur',
        name: 'Диверсант',
        title: 'Saboteur',
        category: 'rogue',
        categoryName: 'Розбійники та асасини',
        icon: '🧨',
        badgeColor: 'bg-red-950 border-orange-500 text-orange-200',
        description: 'Майстер підривної справи та прихованих мінних пасток на шляхах ворожих караванів.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Середньо',
        baseStats: { hp: 85, attack: 18, defense: 8, speed: 13 },
        ability: {
            name: 'Міна',
            type: 'trap',
            typeName: 'Прихована мінна пастка',
            typeIcon: '💣',
            power: 45,
            description: 'Встановлює в клітинці перед персонажем приховану міну, яку не бачать вороги. Коли ворог встає на цю клітинку, міна вибухає та завдає шкоди всім персонажам на відстані 1 клітинки.',
            tacticalNote: 'Вороги не бачать міну і наступають на неї. Вибух накриває зону 3х3 навколо міни.',
            cooldownOrTrigger: 'Наступання ворога на клітинку з міною'
        },
        synergies: ['Гренадер', 'Алхімік'],
        counters: ['Ворожі загони та патрулі']
    },
    {
        id: 'spy',
        name: 'Шпигун',
        title: 'Spy',
        category: 'rogue',
        categoryName: 'Розбійники та асасини',
        icon: '🕵️‍♂️',
        badgeColor: 'bg-zinc-900 border-zinc-500 text-zinc-300',
        description: 'Майстер маскування, отруєння криниць та передачі таємних карт місцевості.',
        role: 'Підтримка / Бафер',
        difficulty: 'Високо',
        baseStats: { hp: 80, attack: 12, defense: 7, speed: 16 },
        ability: {
            name: 'Саботаж',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 15,
            description: 'Псує спорядження ворожого лідера, знижуючи його атаку та завдаючи 15 шкоди.',
            tacticalNote: 'Ослаблює боса перед головним зіткненням.',
            cooldownOrTrigger: 'Прихований диверсійний акт'
        },
        synergies: ['Тактик', 'Дипломат', 'Асасин'],
        counters: ['Командири ворогів']
    },
    {
        id: 'executioner',
        name: 'Кат',
        title: 'Executioner',
        category: 'rogue',
        categoryName: 'Розбійники та асасини',
        icon: '🪓',
        badgeColor: 'bg-red-950 border-red-700 text-red-100',
        description: 'Мовчазний велетень у чорному каптурі з важкою сокирою плахи для страт.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Середньо',
        baseStats: { hp: 115, attack: 28, defense: 10, speed: 8 },
        ability: {
            name: 'Декапітація',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 65,
            description: 'Нищівний смертельний удар плахи на 65 одиниць шкоди.',
            tacticalNote: 'Миттєво добиває поранених супротивників з високим HP.',
            cooldownOrTrigger: 'Страта на пласі'
        },
        synergies: ['Варвар', 'Некромант'],
        counters: ['Поранені важкі воїни']
    },
    {
        id: 'pirate',
        name: 'Пірат',
        title: 'Pirate',
        category: 'rogue',
        categoryName: 'Розбійники та асасини',
        icon: '🏴‍☠️',
        badgeColor: 'bg-sky-950 border-sky-600 text-sky-200',
        description: 'Морський розбійник із кремнієвим пістолем, абордажною шаблею та ромом.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Легко',
        baseStats: { hp: 95, attack: 18, defense: 9, speed: 12 },
        ability: {
            name: 'Постріл з мушкета',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 30,
            description: 'Раптовий постріл упритул із димового пістоля (30 шкоди).',
            tacticalNote: 'Збалансований бієць для прибережних та тавернних сутичок.',
            cooldownOrTrigger: 'Абордажний постріл'
        },
        synergies: ['Бандит', 'Мушкетер'],
        counters: ['Портові стражники']
    },
    {
        id: 'bandit',
        name: 'Бандит',
        title: 'Bandit',
        category: 'rogue',
        categoryName: 'Розбійники та асасини',
        icon: '🗡️',
        badgeColor: 'bg-stone-900 border-amber-800 text-amber-200',
        description: 'Дорожній грабіжник із великої дороги, що влаштовує раптові засідки в лісових хащах.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Легко',
        baseStats: { hp: 90, attack: 14, defense: 7, speed: 11 },
        ability: {
            name: 'Засідка',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 15,
            description: 'Раптовий напад із чагарників, що завдає 15 шкоди всім супротивникам.',
            tacticalNote: 'Дає початкову перевагу проти торгових караванів чи патрулів.',
            cooldownOrTrigger: 'Лісова засідка'
        },
        synergies: ['Злодій', 'Пірат'],
        counters: ['Непідготовлені каравани']
    },

    // 🔮 Стихійна та Арканна Магія
    {
        id: 'elementalist',
        name: 'Елементаліст',
        title: 'Elementalist',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '🌌',
        badgeColor: 'bg-indigo-950 border-indigo-500 text-indigo-200',
        description: 'Повелитель чотирьох першоелементів — вогню, льоду, грому та розколотої землі.',
        role: 'Маг / Заклинач',
        difficulty: 'Середньо',
        baseStats: { hp: 75, attack: 25, defense: 5, speed: 12 },
        ability: {
            name: 'Метеоритний Дощ',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 45,
            description: 'Скидає палаючі кам\'яні уламки з неба, завдаючи колосальні 45 шкоди всім ворогам.',
            tacticalNote: 'Найсильніша стихійна масова магія для зачистки великих груп.',
            cooldownOrTrigger: 'Арканний каст'
        },
        synergies: ['Піромант', 'Кріомант', 'Гравітомант'],
        counters: ['Великі загони монстрів']
    },
    {
        id: 'warlock',
        name: 'Чаклун',
        title: 'Warlock',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '👁️',
        badgeColor: 'bg-purple-950 border-purple-500 text-purple-200',
        description: 'Уклав темну угоду з потойбічними сутностями заради заборонених руйнівних проклять.',
        role: 'Маг / Заклинач',
        difficulty: 'Високо',
        baseStats: { hp: 80, attack: 24, defense: 6, speed: 11 },
        ability: {
            name: 'Прокляття',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 50,
            description: 'Накладає чорну печать в\'янення на душу ворога, завдаючи 50 темної шкоди.',
            tacticalNote: 'Ігнорує звичайну фізичну броню ворога.',
            cooldownOrTrigger: 'Накладання печаті'
        },
        synergies: ['Некромант', 'Тіньовик', 'Кровомант'],
        counters: ['Важкоброньовані лицарі']
    },
    {
        id: 'summoner',
        name: 'Заклинач',
        title: 'Summoner',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '🌀',
        badgeColor: 'bg-blue-950 border-cyan-500 text-cyan-200',
        description: 'Відкриває портали до планів стихій і закликає могутніх духів та големів битися за нього.',
        role: 'Маг / Заклинач',
        difficulty: 'Середньо',
        baseStats: { hp: 70, attack: 10, defense: 5, speed: 10 },
        ability: {
            name: 'Призов Елементаля',
            type: 'summon',
            typeName: 'Призов істоти (Summon)',
            typeIcon: '👥',
            power: 1,
            description: 'Миттєво створює на полі бою вогняного Елементаля (100 HP, 10 сили, 5 броні).',
            tacticalNote: 'Призваний Елементаль бере на себе удари ворогів та завдає шкоди кожен раунд.',
            cooldownOrTrigger: 'Відкриття стихійного порталу'
        },
        summon: {
            name: 'Елементаль',
            title: 'Призвана істота вогню та каменю',
            avatar: '🔥',
            hp: 100,
            strength: 10,
            agility: 10,
            armor: 5,
            special: 'Палаюча аура'
        },
        synergies: ['Ілюзіоніст', 'Клонмайстер', 'Командир'],
        counters: ['Одиночні сильні вороги']
    },
    {
        id: 'necromancer',
        name: 'Некромант',
        title: 'Necromancer',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '💀',
        badgeColor: 'bg-stone-950 border-green-500 text-green-300',
        description: 'Повелитель кісток та померлих душ, що повертає полеглих воїнів у бій у вигляді нежиті.',
        role: 'Маг / Заклинач',
        difficulty: 'Високо',
        baseStats: { hp: 75, attack: 14, defense: 6, speed: 9 },
        ability: {
            name: 'Підняти Нежить',
            type: 'raise_undead',
            typeName: 'Некромантія / Підняття мерців',
            typeIcon: '💀',
            power: 1,
            description: 'Оживляє мертвого бійця як Скелета-воїна (80 HP, 8 сили, 2 броні) під своїм повним контролем.',
            tacticalNote: 'Дозволяє затягувати бій нескінченною армією оживлених мерців.',
            cooldownOrTrigger: 'Закляття над померлим'
        },
        summon: {
            name: 'Скелет-воїн',
            title: 'Нежить',
            avatar: '💀',
            hp: 80,
            strength: 8,
            agility: 8,
            armor: 2,
            special: 'Імунітет до отрути та кровотечі'
        },
        synergies: ['Чаклун', 'Кат', 'Некромант-інженер'],
        counters: ['Тривалі затяжні битви']
    },
    {
        id: 'illusionist',
        name: 'Ілюзіоніст',
        title: 'Illusionist',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '🎭',
        badgeColor: 'bg-violet-950 border-pink-500 text-pink-200',
        description: 'Маніпулятор світлом та розумом, що заплутує супротивників дзеркальними фантомами.',
        role: 'Маг / Заклинач',
        difficulty: 'Середньо',
        baseStats: { hp: 70, attack: 12, defense: 4, speed: 18 },
        ability: {
            name: 'Примарний Двійник',
            type: 'summon',
            typeName: 'Призов істоти (Summon)',
            typeIcon: '👥',
            power: 1,
            description: 'Створює спритну примарну ілюзію (30 HP, 15 спритності), яка поглинає атаки ворогів.',
            tacticalNote: 'Змушує ворогів марнувати сильні удари на фантомів.',
            cooldownOrTrigger: 'Дзеркальне роздвоєння'
        },
        summon: {
            name: 'Ілюзія',
            title: 'Примарний двійник',
            avatar: '👤',
            hp: 30,
            strength: 5,
            agility: 15,
            armor: 0,
            special: 'Високе ухилення'
        },
        synergies: ['Заклинач', 'Асасин', 'Хрономант'],
        counters: ['Вороги з повільними сильними ударами']
    },
    {
        id: 'alchemist',
        name: 'Алхімік',
        title: 'Alchemist',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '🧪',
        badgeColor: 'bg-emerald-950 border-lime-500 text-lime-200',
        description: 'Вчений герметик, що варить кислоти, отруйні гази та зілля відновлення сили.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Легко',
        baseStats: { hp: 85, attack: 17, defense: 8, speed: 11 },
        ability: {
            name: 'Отруйна Бомба',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 30,
            description: 'Розбиває колбу з отруйним газом, завдаючи 30 хімічної шкоди всім супротивникам.',
            tacticalNote: 'Ефективно роз\'їдає броню та задихає ворожих бійців.',
            cooldownOrTrigger: 'Кидок алхімічної колби'
        },
        synergies: ['Гренадер', 'Знахар', 'Диверсант'],
        counters: ['Броньована піхота']
    },
    {
        id: 'druid',
        name: 'Друїд',
        title: 'Druid',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '🍃',
        badgeColor: 'bg-green-950 border-emerald-500 text-emerald-200',
        description: 'Хранитель священних гаїв, що черпає міць від коренів стародавніх дубів та лісових струмків.',
        role: 'Підтримка / Бафер',
        difficulty: 'Легко',
        baseStats: { hp: 100, attack: 14, defense: 10, speed: 10 },
        ability: {
            name: 'Сила Природи',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 30,
            description: 'Огортає лідера живою корою та лісовою енергією, надаючи +30 захисту та регенерації.',
            tacticalNote: 'Один із найпотужніших бафів стійкості у грі.',
            cooldownOrTrigger: 'Молитва лісу'
        },
        synergies: ['Звіролов', 'Рейнджер', 'Перевертень'],
        counters: ['Швидкий ворожий натиск']
    },
    {
        id: 'shaman',
        name: 'Шаман',
        title: 'Shaman',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '⚡',
        badgeColor: 'bg-blue-950 border-yellow-400 text-yellow-200',
        description: 'Голос духів предків, що викликає грози та б\'є ворогів блискавками з чистого неба.',
        role: 'Маг / Заклинач',
        difficulty: 'Середньо',
        baseStats: { hp: 85, attack: 22, defense: 7, speed: 13 },
        ability: {
            name: 'Удар Блискавки',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 40,
            description: 'Влучає розрядом небесної електрики на 40 шкоди з оглушенням цілі.',
            tacticalNote: 'Ефективний проти воїнів у залізних латах.',
            cooldownOrTrigger: 'Удар тотема блискавки'
        },
        synergies: ['Варвар', 'Елементаліст'],
        counters: ['Заковані в метал лицарі']
    },
    {
        id: 'chronomancer',
        name: 'Хрономант',
        title: 'Chronomancer',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '⏳',
        badgeColor: 'bg-cyan-950 border-cyan-400 text-cyan-200',
        description: 'Магістр плину часу, здатний уповільнювати ворожі стріли та дарувати миттєву швидкість собі.',
        role: 'Підтримка / Бафер',
        difficulty: 'Експерт',
        baseStats: { hp: 75, attack: 15, defense: 8, speed: 25 },
        ability: {
            name: 'Зупинка Часу',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 40,
            description: 'Заморожує час на мить, даруючи герою +40 бойової переваги та додатковий хід.',
            tacticalNote: 'Перевертає результат програшного поєдинку на вашу користь.',
            cooldownOrTrigger: 'Арканний розрив часової нитки'
        },
        synergies: ['Самурай', 'Асасин', 'Снайпер'],
        counters: ['Швидкісні вороги']
    },
    {
        id: 'gravitomancer',
        name: 'Гравітомант',
        title: 'Gravitomancer',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '🌌',
        badgeColor: 'bg-purple-950 border-violet-400 text-violet-200',
        description: 'Керує силою тяжіння, роблячи ворогів невагомими або розчавлюючи їх тисячотонною масою.',
        role: 'Маг / Заклинач',
        difficulty: 'Високо',
        baseStats: { hp: 80, attack: 20, defense: 9, speed: 10 },
        ability: {
            name: 'Чорна Діра',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 35,
            description: 'Створює сингулярність у центрі ворожого строю, розчавлюючи всіх на 35 шкоди.',
            tacticalNote: 'Збиває стрій та нівелює захист ворожих щитів.',
            cooldownOrTrigger: 'Колапс гравітації'
        },
        synergies: ['Елементаліст', 'Гренадер'],
        counters: ['Щільні формації']
    },
    {
        id: 'cryomancer',
        name: 'Кріомант',
        title: 'Cryomancer',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '❄️',
        badgeColor: 'bg-sky-950 border-sky-400 text-sky-200',
        description: 'Маг вічної мерзлоти, що створює крижані панцирі та сковує рухи ворогів лютим холодом.',
        role: 'Маг / Заклинач',
        difficulty: 'Середньо',
        baseStats: { hp: 85, attack: 18, defense: 12, speed: 9 },
        ability: {
            name: 'Крижана Буря',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 25,
            description: 'Засипає ворогів гострими крижаними голками на 25 шкоди, сповільнюючи їхній напад.',
            tacticalNote: 'Поєднує масову шкоду зі зниженням швидкості ворога.',
            cooldownOrTrigger: 'Заметіль мерзлоти'
        },
        synergies: ['Піромант', 'Щитоносець'],
        counters: ['Швидкі ворожі нападники']
    },
    {
        id: 'pyromancer',
        name: 'Піромант',
        title: 'Pyromancer',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '🔥',
        badgeColor: 'bg-red-950 border-amber-500 text-amber-200',
        description: 'Фанатик полум\'я, що перетворює будь-яке поле бою на суцільне море палаючого вогню.',
        role: 'Маг / Заклинач',
        difficulty: 'Легко',
        baseStats: { hp: 75, attack: 28, defense: 5, speed: 12 },
        ability: {
            name: 'Вогняна Куля',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE 2x2)',
            typeIcon: '💥',
            power: 35,
            description: 'Магічний вибух вогню по площі 2 на 2 тайли (уражає всіх ворогів у зоні 4 клітинок).',
            tacticalNote: 'Знищує скупчення ворогів нищівним термічним вибухом.',
            cooldownOrTrigger: 'Вибух кулі полум\'я'
        },
        synergies: ['Елементаліст', 'Гренадер'],
        counters: ['Одиночні вороги без захисту від вогню']
    },
    {
        id: 'blood_mage',
        name: 'Кровомант',
        title: 'Blood Mage',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '🩸',
        badgeColor: 'bg-rose-950 border-rose-500 text-rose-200',
        description: 'Використовує життєву силу власної крові та крові ворогів для смертоносних заклинань.',
        role: 'Маг / Заклинач',
        difficulty: 'Високо',
        baseStats: { hp: 95, attack: 26, defense: 6, speed: 14 },
        ability: {
            name: 'Кривава Стріла',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 60,
            description: 'Формує гостру криваву голку з викраденого життя, завдаючи 60 одиниць шкоди.',
            tacticalNote: 'Ігнорує звичайний опір та посилюється від поранених ворогів.',
            cooldownOrTrigger: 'Жертва крові'
        },
        synergies: ['Некромант', 'Чаклун', 'Берсерк'],
        counters: ['Живі істоти']
    },
    {
        id: 'shadowmancer',
        name: 'Тіньовик',
        title: 'Shadowmancer',
        category: 'magic',
        categoryName: 'Стихійна та арканна магія',
        icon: '🌑',
        badgeColor: 'bg-zinc-950 border-zinc-700 text-zinc-200',
        description: 'Зливається з темрявою та посилає живі тіні, що душать ворогів ізсередини.',
        role: 'Маг / Заклинач',
        difficulty: 'Середньо',
        baseStats: { hp: 80, attack: 18, defense: 8, speed: 16 },
        ability: {
            name: 'Покрив Темряви',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 20,
            description: 'Огортає поле бою темрявою на 20 шкоди всім ворогам, засліплюючи їх.',
            tacticalNote: 'Знижує точність ворожих стрільців.',
            cooldownOrTrigger: 'Тіньове затемнення'
        },
        synergies: ['Асасин', 'Ніндзя', 'Чаклун'],
        counters: ['Стрільці та лучники']
    },

    // ✝️ Святі Воїни
    {
        id: 'priest',
        name: 'Жрець',
        title: 'Priest',
        category: 'holy',
        categoryName: 'Святі воїни та інквізиція',
        icon: '✨',
        badgeColor: 'bg-yellow-950 border-yellow-400 text-yellow-200',
        description: 'Служитель храму небес, що закликає божественне світло для зцілення смертельних ран.',
        role: 'Підтримка / Бафер',
        difficulty: 'Легко',
        baseStats: { hp: 85, attack: 8, defense: 10, speed: 9 },
        ability: {
            name: 'Святе Зцілення',
            type: 'heal',
            typeName: 'Зцілення персонажа',
            typeIcon: '✨',
            power: 50,
            description: 'Потужне божественне зцілення: відновлює +50 здоров\'я персонажу та заліковує рани.',
            tacticalNote: 'Найсильніше пряме зцілення персонажа в грі.',
            cooldownOrTrigger: 'Священна молитва'
        },
        synergies: ['Паладин', 'Гвардієць', 'Берсерк'],
        counters: ['Затяжний бій на виснаження']
    },
    {
        id: 'paladin',
        name: 'Паладин',
        title: 'Paladin',
        category: 'holy',
        categoryName: 'Святі воїни та інквізиція',
        icon: '🛡️',
        badgeColor: 'bg-amber-950 border-amber-400 text-amber-200',
        description: 'Лицар святого ордену в освячених латах із благословенним мечем та незламною вірою.',
        role: 'Танк / Захисник',
        difficulty: 'Легко',
        baseStats: { hp: 130, attack: 18, defense: 18, speed: 8 },
        ability: {
            name: 'Святий Удар',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 40,
            description: 'Удар освяченою зброєю на 40 шкоди, що завдає подвійну шкоду нежиті та демонам.',
            tacticalNote: 'Ідеальний вибір для очищення цвинтарів, склепів та руїн.',
            cooldownOrTrigger: 'Освячений розмах мечем'
        },
        synergies: ['Жрець', 'Екзорцист', 'Святий лицар'],
        counters: ['Нежить, вампіри, скелети, демони']
    },
    {
        id: 'exorcist',
        name: 'Екзорцист',
        title: 'Exorcist',
        category: 'holy',
        categoryName: 'Святі воїни та інквізиція',
        icon: '📜',
        badgeColor: 'bg-amber-950 border-yellow-500 text-yellow-100',
        description: 'Магістр вигнання потойбічних демонів та спочилих духів за допомогою святої води та молитов.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Середньо',
        baseStats: { hp: 90, attack: 20, defense: 10, speed: 11 },
        ability: {
            name: 'Вигнання',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 35,
            description: 'Випалює святим словом усіх ворогів на 35 шкоди, миттєво знищуючи призваних духів.',
            tacticalNote: 'Найкращий захисник проти ворожих некромантів та заклиначів.',
            cooldownOrTrigger: 'Обряд вигнання'
        },
        synergies: ['Паладин', 'Інквізитор'],
        counters: ['Призвані істоти, нежить']
    },
    {
        id: 'inquisitor',
        name: 'Інквізитор',
        title: 'Inquisitor',
        category: 'holy',
        categoryName: 'Святі воїни та інквізиція',
        icon: '🔥',
        badgeColor: 'bg-red-950 border-amber-600 text-amber-200',
        description: 'Безжальний мисливець на єретиків, чорнокнижників та відьом із розпеченим залізом.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Середньо',
        baseStats: { hp: 105, attack: 22, defense: 12, speed: 10 },
        ability: {
            name: 'Очищувальне Вогнище',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 50,
            description: 'Спалює святим полум\'ям ворога на 50 шкоди та блокує його магічні здібності.',
            tacticalNote: 'Нейтралізує найнебезпечнішого ворожого чаклуна.',
            cooldownOrTrigger: 'Вогонь очищення'
        },
        synergies: ['Екзорцист', 'Паладин'],
        counters: ['Ворожі маги та чаклуни']
    },
    {
        id: 'holy_knight',
        name: 'Святий лицар',
        title: 'Holy Knight',
        category: 'holy',
        categoryName: 'Святі воїни та інквізиція',
        icon: '⚔️',
        badgeColor: 'bg-yellow-950 border-amber-300 text-yellow-100',
        description: 'Елітний паладин ордену Сонця, що веде військо у бій під прапорами божественної справедливості.',
        role: 'Танк / Захисник',
        difficulty: 'Легко',
        baseStats: { hp: 125, attack: 19, defense: 17, speed: 9 },
        ability: {
            name: 'Світло Небес',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 30,
            description: 'Сліпучий спалах небесного світла на 30 шкоди всім ворогам.',
            tacticalNote: 'Поєднує масову шкоду та підтримку аури захисту загону.',
            cooldownOrTrigger: 'Сяйво меча'
        },
        synergies: ['Паладин', 'Жрець', 'Прапороносець'],
        counters: ['Темні загони та нежить']
    },
    {
        id: 'martyr',
        name: 'Мученик',
        title: 'Martyr',
        category: 'holy',
        categoryName: 'Святі воїни та інквізиція',
        icon: '🕯️',
        badgeColor: 'bg-stone-900 border-red-400 text-red-200',
        description: 'Приймає на себе удари, призначені союзникам, перетворюючи власний біль на колосальну силу.',
        role: 'Підтримка / Бафер',
        difficulty: 'Високо',
        baseStats: { hp: 150, attack: 10, defense: 10, speed: 7 },
        ability: {
            name: 'Жертовність',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 60,
            description: 'Дарує неймовірні +60 сили та захисту гравцю ціною власного болю.',
            tacticalNote: 'Найпотужніший силовий баф у вирішальний момент бою.',
            cooldownOrTrigger: 'Акт самопожертви'
        },
        synergies: ['Жрець', 'Берсерк'],
        counters: ['Вирішальні фінальні дуелі']
    },

    // 🐺 Природа та Звірі
    {
        id: 'beastmaster',
        name: 'Звіролов',
        title: 'Beastmaster',
        category: 'beasts',
        categoryName: 'Природа, звірі та перевертні',
        icon: '🐾',
        badgeColor: 'bg-green-950 border-emerald-600 text-emerald-200',
        description: 'Приборкувач лісових хижаків, що завжди веде в бій лютих вовків та ведмедів.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Легко',
        baseStats: { hp: 95, attack: 14, defense: 8, speed: 12 },
        ability: {
            name: 'Поклик Вовка',
            type: 'summon',
            typeName: 'Призов істоти (Summon)',
            typeIcon: '👥',
            power: 1,
            description: 'Закликає швидкого лісового Вовка (60 HP, 6 сили, 12 спритності, 1 броні).',
            tacticalNote: 'Вовк блискавично атакує ворожих стрільців з флангу.',
            cooldownOrTrigger: 'Мисливський свист'
        },
        summon: {
            name: 'Вовк',
            title: 'Вірний лісовий хижак',
            avatar: '🐺',
            hp: 60,
            strength: 6,
            agility: 12,
            armor: 1,
            special: 'Фланговий укус'
        },
        synergies: ['Дресирувальник', 'Друїд', 'Мисливець'],
        counters: ['Стрільці ворога']
    },
    {
        id: 'rider',
        name: 'Вершник',
        title: 'Rider',
        category: 'beasts',
        categoryName: 'Природа, звірі та перевертні',
        icon: '🐎',
        badgeColor: 'bg-amber-950 border-amber-600 text-amber-200',
        description: 'Швидкий кінний воїн на чистокровному степовому коні з шаблею та списом.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Легко',
        baseStats: { hp: 110, attack: 17, defense: 11, speed: 16 },
        ability: {
            name: 'Наскок',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 35,
            description: 'Блискавичний наскок на галопі з шабельним ударом на 35 шкоди.',
            tacticalNote: 'Ідеальний для швидкого переслідування та маневрів.',
            cooldownOrTrigger: 'Кавалерійський наскок'
        },
        synergies: ['Катапрактарій', 'Командир'],
        counters: ['Піхотні стрільці']
    },
    {
        id: 'dragon_knight',
        name: 'Драконарій',
        title: 'Dragon Knight',
        category: 'beasts',
        categoryName: 'Природа, звірі та перевертні',
        icon: '🐉',
        badgeColor: 'bg-red-950 border-amber-500 text-amber-300',
        description: 'Легендарний лицар, пов\'язаний кровною клятвою з дихаючим вогнем драконом.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Високо',
        baseStats: { hp: 120, attack: 22, defense: 16, speed: 10 },
        ability: {
            name: 'Поклик Дракона',
            type: 'summon',
            typeName: 'Призов істоти (Summon)',
            typeIcon: '👥',
            power: 1,
            description: 'Закликає малого Дракона (150 HP, 15 сили, 8 спритності, 10 броні) з вогняним диханням.',
            tacticalNote: 'Найсильніша призвана бойова одиниця в грі.',
            cooldownOrTrigger: 'Драконячий ріг'
        },
        summon: {
            name: 'Дракончик',
            title: 'Вогнедишний дракон',
            avatar: '🐉',
            hp: 150,
            strength: 15,
            agility: 8,
            armor: 10,
            special: 'Вогняне дихання'
        },
        synergies: ['Паладин', 'Елементаліст'],
        counters: ['Будь-які сильні ворожі армії']
    },
    {
        id: 'shapeshifter',
        name: 'Перевертень',
        title: 'Shapeshifter',
        category: 'beasts',
        categoryName: 'Природа, звірі та перевертні',
        icon: '🐻',
        badgeColor: 'bg-stone-900 border-emerald-600 text-emerald-200',
        description: 'Людина, здатна на волі приймати подобу лютої печерної ведмедиці або вовкулаки.',
        role: 'Танк / Захисник',
        difficulty: 'Середньо',
        baseStats: { hp: 135, attack: 19, defense: 14, speed: 9 },
        ability: {
            name: 'Форма Ведмедя',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 40,
            description: 'Трансформується у ведмедя, надаючи герою +40 до максимального здоров\'я та сили розриву.',
            tacticalNote: 'Перетворює крихкий загін на броньовану машину.',
            cooldownOrTrigger: 'Зміна подоби'
        },
        synergies: ['Друїд', 'Звіролов'],
        counters: ['Пряма фізична шкода']
    },
    {
        id: 'beast_trainer',
        name: 'Дресирувальник',
        title: 'Beast Trainer',
        category: 'beasts',
        categoryName: 'Природа, звірі та перевертні',
        icon: '🐕',
        badgeColor: 'bg-green-950 border-green-500 text-green-200',
        description: 'Керує зграями бойових мастифів та соколів, спрямовуючи їх на горлянки ворогів.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Легко',
        baseStats: { hp: 90, attack: 16, defense: 8, speed: 13 },
        ability: {
            name: 'Зграя',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 25,
            description: 'Спускає з повідка зграю псів, що рвуть ворогів на 25 масової шкоди.',
            tacticalNote: 'Швидка дезорганізація ворожої лінії.',
            cooldownOrTrigger: 'Команда «Фас!»'
        },
        synergies: ['Звіролов', 'Мисливець'],
        counters: ['Легка піхота']
    },
    {
        id: 'herbalist',
        name: 'Знахар',
        title: 'Herbalist',
        category: 'beasts',
        categoryName: 'Природа, звірі та перевертні',
        icon: '🌿',
        badgeColor: 'bg-emerald-950 border-teal-500 text-teal-200',
        description: 'Знавець лісових трав, ягід дурману та цілющих коренів, що рятує від отруєнь.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Легко',
        baseStats: { hp: 80, attack: 12, defense: 7, speed: 10 },
        ability: {
            name: 'Отруйна Хмара',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 20,
            description: 'Розпилює сухі лісові отруйні трави, завдаючи 20 шкоди всім ворогам.',
            tacticalNote: 'Поєднує природну шкоду та лікування після бою.',
            cooldownOrTrigger: 'Розпилення трав'
        },
        synergies: ['Алхімік', 'Друїд'],
        counters: ['Групи ворогів']
    },

    // ⚙️ Тактики та Особливі Класи
    {
        id: 'commander',
        name: 'Командир',
        title: 'Commander',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '👑',
        badgeColor: 'bg-amber-950 border-yellow-500 text-yellow-200',
        description: 'Військовий лідер, чиї накази згуртовують бійців у непереможний єдиний кулак.',
        role: 'Підтримка / Бафер',
        difficulty: 'Середньо',
        baseStats: { hp: 110, attack: 14, defense: 14, speed: 10 },
        ability: {
            name: 'Наказ до Атаки',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 25,
            description: 'Синхронізує атаки всього загону, надаючи +25 до сили кожного союзника.',
            tacticalNote: 'Найкращий лідер для великих найманих загонів.',
            cooldownOrTrigger: 'Голосний наказ'
        },
        synergies: ['Прапороносець', 'Барабанщик', 'Пікінер'],
        counters: ['Розрізнені загони ворогів']
    },
    {
        id: 'tactician',
        name: 'Тактик',
        title: 'Tactician',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '♟️',
        badgeColor: 'bg-slate-900 border-cyan-500 text-cyan-200',
        description: 'Гросмейстер воєнних маневрів, що прораховує кроки ворога на п\'ять раундів наперед.',
        role: 'Підтримка / Бафер',
        difficulty: 'Високо',
        baseStats: { hp: 90, attack: 12, defense: 11, speed: 14 },
        ability: {
            name: 'Тактична Перевага',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 30,
            description: 'Аналізує слабкі місця ворога, надаючи +30 до тактичної сили загону.',
            tacticalNote: 'Підвищує шанс успіху в карткових та бойових турнірах.',
            cooldownOrTrigger: 'Тактичний розрахунок'
        },
        synergies: ['Командир', 'Дуельянт'],
        counters: ['Шаблонові дії ворогів']
    },
    {
        id: 'clonemaster',
        name: 'Клонмайстер',
        title: 'Clonemaster',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '👥',
        badgeColor: 'bg-purple-950 border-purple-400 text-purple-200',
        description: 'Майстер просторових дублікатів, що створює фізичні копії себе або союзників.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Високо',
        baseStats: { hp: 80, attack: 14, defense: 7, speed: 12 },
        ability: {
            name: 'Створити Клона',
            type: 'summon',
            typeName: 'Призов істоти (Summon)',
            typeIcon: '👥',
            power: 1,
            description: 'Створює повноцінного Клона (40 HP, 4 сили, 4 спритності), що копіює дії командира.',
            tacticalNote: 'Подвоює кількість цілей для відволікання супротивника.',
            cooldownOrTrigger: 'Створення дубліката'
        },
        summon: {
            name: 'Клон',
            title: 'Фізична копія',
            avatar: '👥',
            hp: 40,
            strength: 4,
            agility: 4,
            armor: 0,
            special: 'Копіювання атак'
        },
        synergies: ['Заклинач', 'Ілюзіоніст'],
        counters: ['Одиночні вороги']
    },
    {
        id: 'puppeteer',
        name: 'Маріонетник',
        title: 'Puppeteer',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🪆',
        badgeColor: 'bg-stone-900 border-pink-500 text-pink-200',
        description: 'Керує невидимими нитками розуму, змушуючи ворогів битися проти своїх же побратимів.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Експерт',
        baseStats: { hp: 75, attack: 22, defense: 6, speed: 13 },
        ability: {
            name: 'Контроль Розуму',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 45,
            description: 'Перехоплює контроль над ворожим воїном, завдаючи 45 шкоди його союзникам.',
            tacticalNote: 'Звертає найсильнішого ворога проти його власного війська.',
            cooldownOrTrigger: 'Натяг ниток волі'
        },
        synergies: ['Чаклун', 'Ілюзіоніст'],
        counters: ['Сильні ворожі бійці']
    },
    {
        id: 'necro_engineer',
        name: 'Некромант-інженер',
        title: 'Necro Engineer',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🤖',
        badgeColor: 'bg-zinc-950 border-emerald-400 text-emerald-300',
        description: 'Поєднує кібернетичні шестерні, сталеві пластини та темну некромантію у жахливі меха-конструкції.',
        role: 'Танк / Захисник',
        difficulty: 'Високо',
        baseStats: { hp: 90, attack: 16, defense: 14, speed: 6 },
        ability: {
            name: 'Створити Кіборга-зомбі',
            type: 'summon',
            typeName: 'Призов істоти (Summon)',
            typeIcon: '👥',
            power: 1,
            description: 'Створює броньованого Меха-Зомбі (120 HP, 12 сили, 15 броні).',
            tacticalNote: 'Один із найбільш броньованих захисників у грі.',
            cooldownOrTrigger: 'Збірка кібернетичного мерця'
        },
        summon: {
            name: 'Меха-Зомбі',
            title: 'Конструкція з плоті та сталі',
            avatar: '🤖',
            hp: 120,
            strength: 12,
            agility: 2,
            armor: 15,
            special: 'Титанічна броня'
        },
        synergies: ['Некромант', 'Гренадер'],
        counters: ['Фізичні атаки']
    },
    {
        id: 'archaeologist',
        name: 'Археолог',
        title: 'Archaeologist',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🏺',
        badgeColor: 'bg-amber-950 border-amber-600 text-amber-200',
        description: 'Дослідник стародавніх руїн та гробниць, що знає таємниці забутих реліквій.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Легко',
        baseStats: { hp: 85, attack: 15, defense: 9, speed: 11 },
        ability: {
            name: 'Стародавній Артефакт',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 30,
            description: 'Активує прадавню реліквію, вражаючи всіх ворогів магічним спалахом на 30 шкоди.',
            tacticalNote: 'Дає бонуси до знаходження артефактів та скарбів на карті.',
            cooldownOrTrigger: 'Активація реліквії'
        },
        synergies: ['Картограф', 'Авантюрист'],
        counters: ['Стародавні вартові руїн']
    },
    {
        id: 'cartographer',
        name: 'Картограф',
        title: 'Cartographer',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🗺️',
        badgeColor: 'bg-stone-900 border-amber-500 text-amber-100',
        description: 'Малює точні карти королівства, знаючи всі приховані стежки, броди та таємні стоянки.',
        role: 'Підтримка / Бафер',
        difficulty: 'Легко',
        baseStats: { hp: 80, attack: 10, defense: 8, speed: 15 },
        ability: {
            name: 'Знання Місцевості',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 20,
            description: 'Обирає вигідну висоту, надаючи загону +20 до захисту та ініціативи.',
            tacticalNote: 'Прискорює пересування по карті світу.',
            cooldownOrTrigger: 'Оцінка рельєфу'
        },
        synergies: ['Рейнджер', 'Археолог'],
        counters: ['Засідки в незнайомій місцевості']
    },
    {
        id: 'adventurer',
        name: 'Авантюрист',
        title: 'Adventurer',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🧭',
        badgeColor: 'bg-emerald-950 border-amber-400 text-amber-200',
        description: 'Шукач пригод та скарбів, що легко виплутується з будь-яких небезпечних халеп.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Легко',
        baseStats: { hp: 95, attack: 16, defense: 10, speed: 12 },
        ability: {
            name: 'Удача',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 25,
            description: 'Виняткове везіння рятує від критичних ударів та додає +25 до сили героя.',
            tacticalNote: 'Збільшує шанс рідкісних знахідок у подорожах.',
            cooldownOrTrigger: 'Щасливий випадок'
        },
        synergies: ['Азартник', 'Злодій'],
        counters: ['Випадкові невдачі']
    },
    {
        id: 'diplomat',
        name: 'Дипломат',
        title: 'Diplomat',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '📜',
        badgeColor: 'bg-blue-950 border-sky-400 text-sky-200',
        description: 'Майстер переговорів та етикету, здатний залагодити конфлікт без єдиної краплі крові.',
        role: 'Підтримка / Бафер',
        difficulty: 'Середньо',
        baseStats: { hp: 80, attack: 8, defense: 8, speed: 10 },
        ability: {
            name: 'Мирні Переговори',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 15,
            description: 'Деморалізує та знезброює ворога словами перемир\'я, знижуючи силу його удару.',
            tacticalNote: 'Покращує відносини з мешканцями таверн та міською владою.',
            cooldownOrTrigger: 'Дипломатична промова'
        },
        synergies: ['Торговець', 'Шпигун'],
        counters: ['Розумні вороги та ватажки']
    },
    {
        id: 'merchant',
        name: 'Торговець',
        title: 'Merchant',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🪙',
        badgeColor: 'bg-amber-950 border-yellow-400 text-yellow-300',
        description: 'Фінансовий магнат гільдії, що вміє перемагати ворогів золотом та щедрими хабарями.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Легко',
        baseStats: { hp: 85, attack: 11, defense: 9, speed: 9 },
        ability: {
            name: 'Підкуп',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 25,
            description: 'Підкуповує ворожого найманця кинутим мішком золота, виводячи його з бою (25 шкоди).',
            tacticalNote: 'Приносить великий дохід від торгових караванів.',
            cooldownOrTrigger: 'Кидок золотом'
        },
        synergies: ['Азартник', 'Злодій', 'Командир'],
        counters: ['Найманці та жадібні розбійники']
    },
    {
        id: 'gambler',
        name: 'Азартник',
        title: 'Gambler',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🎲',
        badgeColor: 'bg-rose-950 border-amber-400 text-amber-200',
        description: 'Гравець за столами таверн, для якого все життя — це одна велика гра в кості.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Середньо',
        baseStats: { hp: 80, attack: 18, defense: 6, speed: 14 },
        ability: {
            name: 'Кидок Кубика',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 50,
            description: 'Кидає щасливі кості, завдаючи непередбачувані від 25 до 50 колосальної шкоди.',
            tacticalNote: 'Дає бонус у всіх тавернних міні-іграх та дуелях на гроші.',
            cooldownOrTrigger: 'Кидок кісток'
        },
        synergies: ['Торговець', 'Авантюрист'],
        counters: ['Вороги з фіксованими схемами']
    },
    {
        id: 'wandering_knight',
        name: 'Мандрівний лицар',
        title: 'Wandering Knight',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🛡️',
        badgeColor: 'bg-stone-800 border-amber-500 text-amber-200',
        description: 'Благородний безземельний лицар, що шукає подвигів, захищаючи невинних на трактах.',
        role: 'Танк / Захисник',
        difficulty: 'Легко',
        baseStats: { hp: 115, attack: 16, defense: 14, speed: 9 },
        ability: {
            name: 'Удар Мечем',
            type: 'damage_single',
            typeName: 'Одиночний удар',
            typeIcon: '🎯',
            power: 30,
            description: 'Нищівний удар мечем в межах 1 клітинки від воїна (наносить потрійне пошкодження х3).',
            tacticalNote: 'Надійний та смертоносний у ближньому контакті 1 на 1.',
            cooldownOrTrigger: 'Лицарський удар'
        },
        synergies: ['Паладин', 'Мечник'],
        counters: ['Розбійники на трактах']
    },
    {
        id: 'banner_bearer',
        name: 'Прапороносець',
        title: 'Banner Bearer',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🚩',
        badgeColor: 'bg-red-950 border-yellow-400 text-yellow-200',
        description: 'Тримає високий бойовий стяг, надихаючи союзників стояти на смерть і не відступати.',
        role: 'Підтримка / Бафер',
        difficulty: 'Легко',
        baseStats: { hp: 110, attack: 12, defense: 13, speed: 8 },
        ability: {
            name: 'Підняти Прапор',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 35,
            description: 'Високо підіймає шовковий прапор, додаючи +35 до бойового духу та стійкості загону.',
            tacticalNote: 'Запобігає паніці та посилює всі суміжні бафи.',
            cooldownOrTrigger: 'Салют прапором'
        },
        synergies: ['Командир', 'Барабанщик', 'Глашатай'],
        counters: ['Ефекти залякування']
    },
    {
        id: 'drummer',
        name: 'Барабанщик',
        title: 'Drummer',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🥁',
        badgeColor: 'bg-amber-950 border-amber-500 text-amber-200',
        description: 'Відбиває чіткий бойовий ритм на барабанах, задаючи темп маршу та шаленого наступу.',
        role: 'Підтримка / Бафер',
        difficulty: 'Легко',
        baseStats: { hp: 90, attack: 10, defense: 8, speed: 11 },
        ability: {
            name: 'Бойовий Марш',
            type: 'buff_player',
            typeName: 'Підтримка / Баф',
            typeIcon: '🛡️',
            power: 25,
            description: 'Ритмічний бій барабана прискорює атаки та додає +25 до швидкості реакції.',
            tacticalNote: 'Дає команді право першого удару в бою.',
            cooldownOrTrigger: 'Бойовий дріб'
        },
        synergies: ['Прапороносець', 'Берсерк', 'Командир'],
        counters: ['Повільні ворожі навали']
    },
    {
        id: 'herald',
        name: 'Глашатай',
        title: 'Herald',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🎺',
        badgeColor: 'bg-yellow-950 border-amber-400 text-yellow-200',
        description: 'Оголошує волю монарха через золоту сурму, оглушаючи та деморалізуючи ворогів.',
        role: 'Штурмовик / ДПС',
        difficulty: 'Легко',
        baseStats: { hp: 85, attack: 13, defense: 8, speed: 12 },
        ability: {
            name: 'Бойовий Клич',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 20,
            description: 'Оглушливий звук сурми завдає 20 акустичної шкоди всім ворогам і лякає їх.',
            tacticalNote: 'Послаблює ворожу броню на початку бою.',
            cooldownOrTrigger: 'Сурмління у ріг'
        },
        synergies: ['Прапороносець', 'Барабанщик'],
        counters: ['Невпевнені новобранці ворога']
    },
    {
        id: 'beggar',
        name: 'Жебрак',
        title: 'Beggar',
        category: 'special',
        categoryName: 'Тактики, лідери та особливі',
        icon: '🪡',
        badgeColor: 'bg-stone-900 border-stone-600 text-stone-300',
        description: 'Непримітний волоцюга в лахмітті, якого всі ігнорують, але який володіє містичним везінням.',
        role: 'Універсал / Спеціаліст',
        difficulty: 'Високо',
        baseStats: { hp: 60, attack: 8, defense: 3, speed: 15 },
        ability: {
            name: 'Жалібний Крик',
            type: 'damage_aoe',
            typeName: 'Масова атака (AoE)',
            typeIcon: '💥',
            power: 10,
            description: 'Жалібний зойк збиває ворогів з пантелику (10 шкоди всім), змушуючи їх промахуватися.',
            tacticalNote: 'Має приховані бонуси до випадкових подій та жебракування у багатих містах.',
            cooldownOrTrigger: 'Жалібний зойк'
        },
        synergies: ['Злодій', 'Азартник'],
        counters: ['Шляхетні вороги з мораллю']
    }
];

export const ALL_GAME_SPELLS: GameSpellGuideItem[] = [
    {
        id: 'annihilation',
        name: 'Анігіляція',
        school: 'Некромантія та Тінь',
        schoolIcon: '💥',
        schoolColor: 'from-purple-950 to-red-950 border-red-600 text-red-200',
        tier: 'Легендарне',
        effectDescription: 'Найвище закляття абсолютної смерті. Б\'є ворожу карту від Короля і нижче та назавжди відправляє її у ВІЧНИЙ ВІДБІЙ без права повернення.',
        cardRule: 'Побиває будь-яку карту номіналом 13 (Король) і нижче прямо у вічний відбій.',
        brawlRule: 'Завдає 70 чистої шкоди одиночній цілі та розчиняє захисні бар\'єри.',
        manaCostOrReq: '2 очки сили / вищий арканний ранг',
        flavorQuote: '«Ні тіла, ні душі, ні пам’яті. Лише попіл, розвіяний над порожнечею.»',
        icon: '💥'
    },
    {
        id: 'power_word_kill',
        name: 'Слово сили: Смерть',
        school: 'Некромантія та Тінь',
        schoolIcon: '💀',
        schoolColor: 'from-zinc-950 to-purple-950 border-purple-500 text-purple-200',
        tier: 'Вище',
        effectDescription: 'Вимовлення темного слова давньої мови, що миттєво зупиняє биття серця будь-якої живої істоти.',
        cardRule: 'Побиває ворожі карти високих рангів у вічний відбій.',
        brawlRule: 'Завдає 60 смертоносних одиниць темної шкоди безпосередньо у здоров\'я.',
        manaCostOrReq: '1 карта закляття / вічний відбій',
        flavorQuote: '«Одне слово — і темрява забирає подих назавжди.»',
        icon: '💀'
    },
    {
        id: 'finger_of_death',
        name: 'Перст смерті',
        school: 'Некромантія та Тінь',
        schoolIcon: '👉',
        schoolColor: 'from-stone-950 to-emerald-950 border-green-600 text-green-300',
        tier: 'Бойове',
        effectDescription: 'Промінь чорної блискавки з пальця некроманта, що пронизує життєву силу цілі.',
        cardRule: 'Б\'є карти від Вальта (11) і нижче у вічний відбій.',
        brawlRule: 'Завдає 45 одиниць шкоди ворожому магу або стрільцю.',
        manaCostOrReq: '1 закляття некромантії',
        flavorQuote: '«Достатньо лише вказати пальцем, щоб засудити до небуття.»',
        icon: '👉'
    },
    {
        id: 'chill_touch',
        name: 'Чіл тач (Крижаний дотик)',
        school: 'Некромантія та Тінь',
        schoolIcon: '❄️',
        schoolColor: 'from-cyan-950 to-blue-950 border-cyan-500 text-cyan-200',
        tier: 'Базове',
        effectDescription: 'Холод могильного склепу сковує ворожі м\'язи та перетворює слабкі карти на лід.',
        cardRule: 'Б\'є карти нижче 6 (двійки, трійки, четвірки, п\'ятірки) у вічний відбій.',
        brawlRule: 'Завдає 25 холодної шкоди та сповільнює ініціативу ворога.',
        manaCostOrReq: 'Базове закляття чаклунів',
        flavorQuote: '«Холод склепу торкається твого серця швидше за будь-яке лезо.»',
        icon: '❄️'
    },
    {
        id: 'arcane_aegis',
        name: 'Магічний Щит (Arcane Aegis)',
        school: 'Арканна та Захисна',
        schoolIcon: '🛡️',
        schoolColor: 'from-blue-950 to-indigo-950 border-blue-400 text-blue-200',
        tier: 'Бойове',
        effectDescription: 'Створює напівпрозору кулю з арканної енергії, що вбирає смертельні удари та поповнює руку закляттями.',
        cardRule: 'Надає +60 Захисту (Armor) та додає 2 карти заклять у руку.',
        brawlRule: 'Поглинає наступні 60 одиниць будь-якої фізичної або магічної шкоди.',
        manaCostOrReq: '1 карта щита / 2 SP',
        flavorQuote: '«Сталь може зламатися, але чиста арканна воля — ніколи.»',
        icon: '🛡️'
    },
    {
        id: 'meteor_shower',
        name: 'Метеоритний Дощ',
        school: 'Стихійна Магія',
        schoolIcon: '☄️',
        schoolColor: 'from-red-950 to-amber-950 border-orange-500 text-orange-200',
        tier: 'Вище',
        effectDescription: 'Розриває небесне склепіння, скидаючи палаючі кам\'яні брили на голови всієї ворожої армії.',
        cardRule: 'Знищує 2 або більше ворожих карт на столі одним магічним ударом.',
        brawlRule: 'Завдає 45 масової вогняної шкоди кожному бійцю ворожого загону.',
        manaCostOrReq: '3 очки сили / Елементаліст',
        flavorQuote: '«Коли палає саме небо, ніде сховатися від гніву стихій.»',
        icon: '☄️'
    },
    {
        id: 'holy_resurrection',
        name: 'Священне Воскресіння',
        school: 'Священна Магія',
        schoolIcon: '✨',
        schoolColor: 'from-amber-950 to-yellow-950 border-yellow-300 text-yellow-100',
        tier: 'Легендарне',
        effectDescription: 'Божественна благодать повертає полеглих союзників до життя з повним здоров\'ям та зняттям усіх проклять.',
        cardRule: 'Повертає карти з відбою назад у руку гравця на пас.',
        brawlRule: 'Оживляє загиблого союзника зі 100% максимального запасу HP.',
        manaCostOrReq: 'Вищий ранг Жреця / Паладина',
        flavorQuote: '«Світло не знає поразки, доки жива віра в наших серцях.»',
        icon: '✨'
    },
    {
        id: 'summon_undead_army',
        name: 'Призов армії нежиті',
        school: 'Некромантія та Тінь',
        schoolIcon: '🧟',
        schoolColor: 'from-stone-950 to-emerald-950 border-green-500 text-green-200',
        tier: 'Вище',
        effectDescription: 'Викликає з могил 2 Скелети, 2 Зомбі та Привида з відбою для повної облоги супротивника.',
        cardRule: 'Наповнює стіл картами нежиті та додає закляття Перст смерті у руку.',
        brawlRule: 'Створює натовп із 4 призваних створінь, що беруть удар на себе.',
        manaCostOrReq: 'Повелитель нежиті / Некромант',
        flavorQuote: '«Мертві більше не сплять. Тепер вони крокують за мною.»',
        icon: '🧟'
    },
    {
        id: 'weak_strength_boost',
        name: 'Слабке підняття сили',
        school: 'Арканна та Захисна',
        schoolIcon: '🗡️',
        schoolColor: 'from-amber-950 to-orange-950 border-amber-500 text-amber-200',
        tier: 'Базове',
        effectDescription: 'Магічне зачарування бойової зброї. Будь-яка наступна зіграна карта битиме з додатковою силою +1.',
        cardRule: 'Будь-яка наступна карта битиме з силою +1 (триває 1 хід).',
        brawlRule: 'Дає +10% до фізичної шкоди на наступну атаку.',
        manaCostOrReq: '1 очко сили / Магазин заклять',
        flavorQuote: '«Гострий клинок знаходить щілину в будь-якому обладунку.»',
        icon: '🗡️'
    },
    {
        id: 'strength_boost',
        name: 'Підняття сили',
        school: 'Арканна та Захисна',
        schoolIcon: '⚔️',
        schoolColor: 'from-orange-950 to-red-950 border-orange-500 text-orange-200',
        tier: 'Бойове',
        effectDescription: 'Концентрований сплеск бойової люті. Будь-яка наступна зіграна карта битиме з додатковою силою +3.',
        cardRule: 'Будь-яка наступна карта битиме з силою +3 (триває 1 хід).',
        brawlRule: 'Дає +30% до фізичної шкоди на наступну атаку.',
        manaCostOrReq: '2 очка сили / Магазин заклять',
        flavorQuote: '«Сила воїна множиться люттю та магією пращурів.»',
        icon: '⚔️'
    },
    {
        id: 'strong_strength_boost',
        name: 'Сильне підняття сили',
        school: 'Арканна та Захисна',
        schoolIcon: '💥',
        schoolColor: 'from-red-950 to-rose-950 border-red-500 text-red-200',
        tier: 'Вище',
        effectDescription: 'Колосальний вибух руйнівної сили. Будь-яка наступна зіграна карта битиме з додатковою силою +10.',
        cardRule: 'Будь-яка наступна карта битиме з силою +10 (триває 1 хід).',
        brawlRule: 'Дає +100% до фізичної шкоди на наступну атаку з розсіченням.',
        manaCostOrReq: '4 очка сили / Магазин заклять',
        flavorQuote: '«Удар нищівної сили розколює скелі та ламає найміцніші щити.»',
        icon: '💥'
    }
];

import { OpponentData, SettlementData, CharacterGender } from '../types';
import { WORLD_SETTLEMENTS } from './worldData';
import { generateRandomName, getGenderForName, MALE_AVATARS, FEMALE_AVATARS } from './nameGenerator';

function getStableSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export type WanderingGameType =
    | 'rpg_cards'
    | 'classic_durak_36'
    | 'classic_durak_52'
    | 'french_tarot'
    | 'blackjack'
    | 'blackjack_dice'
    | 'dice_poker'
    | 'tavern_dice'
    | 'checkers'
    | 'senet'
    | 'ur'
    | 'mehen'
    | 'aseb'
    | 'archery'
    | 'jousting'
    | 'chess_standard'
    | 'shatranj'
    | 'steeplechase'
    | 'brawl'
    | 'fencing';

export interface GamblerGoal {
    description: string;
    targetSettlementId?: string;
    targetSettlementName?: string;
    targetX: number;
    targetY: number;
}

export interface GamblerAlly {
    id: string;
    name: string;
    title: string;
    avatar: string;
    gender?: CharacterGender;
    opponent: OpponentData;
    isDefeated?: boolean;
}

export interface WanderingGambler {
    id: string;
    name: string;
    title: string;
    avatar: string;
    gender?: CharacterGender;
    badgeIcon: string;
    themeColor: string; // e.g. amber, sky, violet, emerald
    gameType: WanderingGameType;
    gameName: string;
    gameCategoryName: string;
    gameDescription: string;
    flavorLore: string;
    greetingText: string;
    preferredBet: number;
    minBet: number;
    maxBet: number;
    x: number;
    y: number;
    speed: number; // % of map per second
    state: 'traveling' | 'resting' | 'seeking_match';
    actionTimer: number; // in seconds
    currentGoal: GamblerGoal;
    opponent: OpponentData;
    allies: GamblerAlly[];
}

interface GamblerTemplate {
    id: string;
    name: string;
    title: string;
    avatar: string;
    badgeIcon: string;
    themeColor: string;
    gameType: WanderingGameType;
    gameName: string;
    gameCategoryName: string;
    gameDescription: string;
    flavorLore: string;
    greetingText: string;
    preferredBet: number;
    maxBet: number;
    difficulty: 'easy' | 'normal' | 'hard' | 'expert' | 'master';
    initialStartX: number;
    initialStartY: number;
    hp: number;
    strength: number;
    agility: number;
    armor: number;
}

const GAMBLER_TEMPLATES: GamblerTemplate[] = [
    {
        id: 'gambler_durak_36',
        name: 'Остап Хитрий Козир',
        title: 'Мандрівний Шулер Півдня',
        avatar: '🃏',
        badgeIcon: '🎴',
        themeColor: '#eab308', // amber
        gameType: 'classic_durak_36',
        gameName: 'Класичний Дурень (36 карт)',
        gameCategoryName: 'Картярська класика',
        gameDescription: 'Традиційний український перевідний та підкидний дурень на 36 карт із козирями.',
        flavorLore: 'Пройшов усі ярмарки від Карпат до Дикого Поля. Кажуть, він може відчути туза пальцями навіть у сутінках.',
        greetingText: '«Добрий день, мандрівнику! Шукаєш чесної гри в карти? Діставай колоду — зіграємо в класичного Дурня на 36 карт!»',
        preferredBet: 15,
        maxBet: 50,
        difficulty: 'normal',
        initialStartX: 42,
        initialStartY: 36,
        hp: 100,
        strength: 12,
        agility: 15,
        armor: 15
    },
    {
        id: 'gambler_durak_52',
        name: 'Шевальє де Бомонт',
        title: 'Віртуоз Великої Колоди',
        avatar: '🎩',
        badgeIcon: '♠️',
        themeColor: '#f59e0b', // amber-600
        gameType: 'classic_durak_52',
        gameName: 'Дурень на 52 карти',
        gameCategoryName: 'Велика колода',
        gameDescription: 'Розширений варіант Дурня з повною колодою на 52 карти та глибокими комбінаціями.',
        flavorLore: 'Вигнаний французький аристократ, що мандрує між замками. Його майстерність з 52 картами вражає навіть королів.',
        greetingText: '«Salut, друже! Звичайна колода занадто проста? Спробуй здолати мене у грі на 52 карти! Тільки точний розрахунок і витримка.»',
        preferredBet: 25,
        maxBet: 75,
        difficulty: 'hard',
        initialStartX: 58,
        initialStartY: 24,
        hp: 110,
        strength: 11,
        agility: 14,
        armor: 20
    },
    {
        id: 'gambler_rpg_cards',
        name: 'Магістр Ельдрін Світлоносний',
        title: 'Мандрівний Бойовий Арканіст',
        avatar: '🧙‍♂️',
        badgeIcon: '✨',
        themeColor: '#8b5cf6', // purple
        gameType: 'rpg_cards',
        gameName: 'Карткова RPG Дуель',
        gameCategoryName: 'Магічний поєдинок',
        gameDescription: 'Епічна дуель із бойовими картами, закляттями, щитами броні та магічними сферами.',
        flavorLore: 'Вчений ордену Срібного Світанку. Досліджує древні магічні формули та матеріалізує їх у вигляді бойових рунних карт.',
        greetingText: '«Відчуваю в тобі сильну енергію, мандрівнику! Чи вистачить твоєї колоди та заклять, щоб витримати мій арканний натиск?»',
        preferredBet: 30,
        maxBet: 100,
        difficulty: 'hard',
        initialStartX: 32,
        initialStartY: 52,
        hp: 140,
        strength: 10,
        agility: 16,
        armor: 30
    },
    {
        id: 'gambler_french_tarot',
        name: 'Мадам Селеста Віщунка',
        title: 'Володарка Французького Таро',
        avatar: '🔮',
        badgeIcon: '🎴',
        themeColor: '#c084fc', // purple-400
        gameType: 'french_tarot',
        gameName: 'Французьке Таро',
        gameCategoryName: 'Королівське Таро',
        gameDescription: 'Елегантна гра на 78 карт з мажорними арканами, козирями та взятками.',
        flavorLore: 'Мандрівна провидиця в оксамитовому плащі. В її очах відбивається зоряне небо, а кожна взятка — немов пророцтво долі.',
        greetingText: '«Зорі шепочуть, що наші шляхи перетнулися невипадково. Колода із 78 арканів Таро готова — випробуй своє везіння!»',
        preferredBet: 20,
        maxBet: 80,
        difficulty: 'hard',
        initialStartX: 68,
        initialStartY: 44,
        hp: 95,
        strength: 9,
        agility: 13,
        armor: 15
    },
    {
        id: 'gambler_blackjack',
        name: 'Барон Моріц Одноокий',
        title: 'Мандрівний Банкір Блекджеку',
        avatar: '🪙',
        badgeIcon: '🎰',
        themeColor: '#10b981', // emerald
        gameType: 'blackjack',
        gameName: 'Класичний Блекджек (21)',
        gameCategoryName: 'Азартне Очко',
        gameDescription: 'Швидка та безжальна гра на удачу й хладнокровність: набери рівно 21 або більше ніж у дилера.',
        flavorLore: 'Колишній скарбник торговельної гільдії. Кажуть, він втратив око у суперечці через туза, але зберіг залізний спокій.',
        greetingText: '«Дзенькіт золота — найкраща музика на дорозі! Ризикнеш набрати 21 проти мого банку? Став монети на стіл!»',
        preferredBet: 20,
        maxBet: 100,
        difficulty: 'normal',
        initialStartX: 48,
        initialStartY: 65,
        hp: 115,
        strength: 13,
        agility: 12,
        armor: 25
    },
    {
        id: 'gambler_blackjack_dice',
        name: 'Рашид ібн Халід',
        title: 'Караванник Кістяного «21»',
        avatar: '👳',
        badgeIcon: '🎲',
        themeColor: '#14b8a6', // teal
        gameType: 'blackjack_dice',
        gameName: 'Блекджек на кубиках',
        gameCategoryName: 'Кістяний азарт',
        gameDescription: 'Захоплюючий варіант гри у «21», де замість карт кидаються білі гральні кубики.',
        flavorLore: 'Прибув із далеких південних пісків із караваном шовку. Знає секрети балансу та ваги кісток краще за будь-кого.',
        greetingText: '«Мир тобі, подорожній! Забудь про паперові карти — відчуй вагу справжньої слонової кістки! Кидай кубики до двадцяти одного!»',
        preferredBet: 15,
        maxBet: 60,
        difficulty: 'normal',
        initialStartX: 75,
        initialStartY: 60,
        hp: 105,
        strength: 12,
        agility: 14,
        armor: 18
    },
    {
        id: 'gambler_dice_poker',
        name: 'Бородань Торвальд',
        title: 'Північний Чемпіон з Покеру на кістках',
        avatar: '🧔',
        badgeIcon: '🎯',
        themeColor: '#06b6d4', // cyan
        gameType: 'dice_poker',
        gameName: 'Покер на кістках',
        gameCategoryName: 'Комбінації та ризик',
        gameDescription: 'П’ять кубиків, перекидання та класичні покерні комбінації: пара, стріт, фул-хаус та каре.',
        flavorLore: 'Мореплавець з північних фіордів. Перемагав у портових тавернах від Любека до Новгорода завдяки холодній витримці.',
        greetingText: '«Ха! Ще один сміливець на дорозі! Бери склянку та п’ять кубиків — побачимо, чиє каре міцніше за північний лід!»',
        preferredBet: 20,
        maxBet: 70,
        difficulty: 'hard',
        initialStartX: 22,
        initialStartY: 28,
        hp: 130,
        strength: 16,
        agility: 11,
        armor: 25
    },
    {
        id: 'gambler_tavern_dice',
        name: 'Сержант Вульф Костоправ',
        title: 'Ветеран Тавернських Кісток',
        avatar: '🪖',
        badgeIcon: '🏺',
        themeColor: '#f97316', // orange
        gameType: 'tavern_dice',
        gameName: 'Тавернські кості (Барбу)',
        gameCategoryName: 'Військові кості',
        gameDescription: 'Непередбачувана солдатська гра в кістки на набір очок та перевірку удачі.',
        flavorLore: 'Ветеран десяти облог та незліченних походів. У поході завжди носить у кишені пару потертих щасливих кубиків.',
        greetingText: '«Гей, новобранцю! Сядемо на пеньок біля дороги та кинемо кістки, як ми робили в таборах під час війни?»',
        preferredBet: 10,
        maxBet: 40,
        difficulty: 'easy',
        initialStartX: 38,
        initialStartY: 46,
        hp: 125,
        strength: 15,
        agility: 12,
        armor: 22
    },
    {
        id: 'gambler_checkers',
        name: 'Дід Панкрат Мислитель',
        title: 'Сивочолий Майстер Шашок',
        avatar: '🧓',
        badgeIcon: '⚪',
        themeColor: '#94a3b8', // slate
        gameType: 'checkers',
        gameName: 'Класичні Шашки',
        gameCategoryName: 'Логіка та стратегія',
        gameDescription: 'Перевірена віками шашкова баталія: прості шашки, рубка через поле та прорив у дамки.',
        flavorLore: 'Живе простим життям мандрівного мудреця. Носить із собою берестяну дошку та набір круглих дерев’яних шашок.',
        greetingText: '«Здоров будь, юначе! Не поспішай на мечі — краще розімнемо розум за шашковою дошкою. Зіграємо партію?»',
        preferredBet: 10,
        maxBet: 35,
        difficulty: 'normal',
        initialStartX: 52,
        initialStartY: 48,
        hp: 90,
        strength: 8,
        agility: 10,
        armor: 10
    },
    {
        id: 'gambler_chess_standard',
        name: 'Гросмейстер Болеслав',
        title: 'Мандрівний Королівський Шахіст',
        avatar: '♟️',
        badgeIcon: '👑',
        themeColor: '#3b82f6', // blue
        gameType: 'chess_standard',
        gameName: 'Класичні Шахи (FIDE)',
        gameCategoryName: 'Велика гра королів',
        gameDescription: 'Світова класика інтелектуальної дуелі: пішаки, коні, тури, слони та боротьба за мат королю.',
        flavorLore: 'Один із найвидатніших теоретиків шахів свого часу. Подорожує королівствами у пошуках гідного супротивника.',
        greetingText: '«Вітаю, шляхетний друже! Шахи — це дзеркало душі та полководницького хисту. Пропоную партію без зайвої метушні!»',
        preferredBet: 25,
        maxBet: 80,
        difficulty: 'hard',
        initialStartX: 62,
        initialStartY: 32,
        hp: 100,
        strength: 9,
        agility: 11,
        armor: 15
    },
    {
        id: 'gambler_shatranj',
        name: 'Візир Аль-Фарабі',
        title: 'Мудрець Прадавнього Шатранджу',
        avatar: '🕌',
        badgeIcon: '👳',
        themeColor: '#6366f1', // indigo
        gameType: 'shatranj',
        gameName: 'Давній Шатрандж (Східні шахи)',
        gameCategoryName: 'Прадавні шахи',
        gameDescription: 'Автентичний середньовічний прабатько шахів: слони стрибають через клітинку, а ферзь — мудрий радник.',
        flavorLore: 'Хранитель перських манускриптів про шах-мат. Досліджує витоки військових настільних ігор стародавніх імперій.',
        greetingText: '«Хай буде мирний твій шлях! Чи знайомий ти з прабатьком шахів — Шатранджем? Його правила суворіші й величніші за сучасні.»',
        preferredBet: 20,
        maxBet: 60,
        difficulty: 'expert',
        initialStartX: 80,
        initialStartY: 48,
        hp: 105,
        strength: 10,
        agility: 12,
        armor: 18
    },
    {
        id: 'gambler_senet',
        name: 'Жрець Імхотеп Мандрівний',
        title: 'Хранитель Палати Сенету',
        avatar: '📜',
        badgeIcon: '🏺',
        themeColor: '#d97706', // amber-600
        gameType: 'senet',
        gameName: 'Давньоєгипетський Сенет',
        gameCategoryName: 'Священна гра фараонів',
        gameDescription: 'Священна гра давнього Єгипту на 30 клітинок, де фішки проходять шлях душі через Будинок Краси та Води Небезпеки.',
        flavorLore: 'Ніс факел у гробницях Долини Царів. Його дошка з папірусу та різьблені фігурки несуть благословення бога Тота.',
        greetingText: '«О подорожній під сонцем Ра! Сенет — це шлях душі до вічності. Кинь палички долі та проведи свої фігури через Палату Краси!»',
        preferredBet: 15,
        maxBet: 50,
        difficulty: 'normal',
        initialStartX: 72,
        initialStartY: 72,
        hp: 95,
        strength: 9,
        agility: 12,
        armor: 12
    },
    {
        id: 'gambler_ur',
        name: 'Енліль з Ніневії',
        title: 'Володар Царської Гри Ур',
        avatar: '🦁',
        badgeIcon: '🏛️',
        themeColor: '#b45309', // amber-700
        gameType: 'ur',
        gameName: 'Царська гра Ур (Месопотамія)',
        gameCategoryName: 'Найдавніша настільна гра',
        gameDescription: 'Шумерська царська настільна гра з 4-гранними пірамідними кістками, безпечними розетками та гонкою фішок.',
        flavorLore: 'Шумерський купець з долини Євфрату. Його сім’я передавала правила гри Ур з покоління в покоління понад чотири тисячі років.',
        greetingText: '«Цій грі грали царі Вавилону та Уру задовго до того, як постали перші замки цього краю! Зіграймо партію в Царський Ур!»',
        preferredBet: 20,
        maxBet: 60,
        difficulty: 'normal',
        initialStartX: 84,
        initialStartY: 38,
        hp: 110,
        strength: 12,
        agility: 13,
        armor: 16
    },
    {
        id: 'gambler_mehen',
        name: 'Оракул Себек Зміїноокий',
        title: 'Жрець Спірального Мехену',
        avatar: '🐍',
        badgeIcon: '🌀',
        themeColor: '#059669', // emerald-600
        gameType: 'mehen',
        gameName: 'Священний зміїний Мехен',
        gameCategoryName: 'Спіральні перегони',
        gameDescription: 'Ритуальна гра на круглій дошці-змії: рух фішок до центру та випуск хижих левів на зворотному шляху.',
        flavorLore: 'Живе самітником біля річкових оазисів. Вважає рух фішок по тілу змія Мехен магічним обрядом захисту від темних сил.',
        greetingText: '«Згорнутий змій Мехен чекає твого кроку. Чи наважишся ти дійти до його голови та випустити священного лева?»',
        preferredBet: 15,
        maxBet: 50,
        difficulty: 'hard',
        initialStartX: 40,
        initialStartY: 76,
        hp: 100,
        strength: 11,
        agility: 14,
        armor: 14
    },
    {
        id: 'gambler_aseb',
        name: 'Басир із Карнака',
        title: 'Майстер Двадцяти Квадратів',
        avatar: '🏛️',
        badgeIcon: '🏺',
        themeColor: '#7c3aed', // violet-600
        gameType: 'aseb',
        gameName: 'Давній Асеб (20 квадратів)',
        gameCategoryName: 'Античні гонки',
        gameDescription: 'Динамічна антична гра на 20 квадратів з центральною доріжкою сутичок та безпечними притулками.',
        flavorLore: 'Мандрівний архітектор та дослідник давніх святилищ. Розкладає дошку Асеба на кожному привалі караванів.',
        greetingText: '«Двадцять квадратів вирішать, хто швидший і кмітливіший! Кидай кістки й займай центральну лінію, друже!»',
        preferredBet: 15,
        maxBet: 55,
        difficulty: 'normal',
        initialStartX: 55,
        initialStartY: 78,
        hp: 105,
        strength: 11,
        agility: 13,
        armor: 15
    },
    {
        id: 'gambler_steeplechase',
        name: 'Данило Швидконогий',
        title: 'Мандрівний Жокей та Коняр',
        avatar: '🏇',
        badgeIcon: '🐎',
        themeColor: '#15803d', // green-700
        gameType: 'steeplechase',
        gameName: 'Кінні перегони з перешкодами',
        gameCategoryName: 'Кінний спорт та азарт',
        gameDescription: 'Захоплюючий стіплчез: бар’єри, управління витривалістю скакуна та фінішний спурт на іподромі.',
        flavorLore: 'Степовий вершник, який розуміє коней краще за людей. Його гнідий жерець Вітер обігнав найкращих скакунів столиці.',
        greetingText: '«Дивись, яка рівна галявина біля тракту! Сідлай коня — влаштуємо справжній стіплчез з бар’єрами на золотий куш!»',
        preferredBet: 25,
        maxBet: 100,
        difficulty: 'hard',
        initialStartX: 30,
        initialStartY: 40,
        hp: 110,
        strength: 13,
        agility: 17,
        armor: 18
    },
    {
        id: 'gambler_archery',
        name: 'Робін з Гущавини',
        title: 'Вільний Стрілець Смарагдового Лісу',
        avatar: '🏹',
        badgeIcon: '🎯',
        themeColor: '#16a34a', // green-600
        gameType: 'archery',
        gameName: 'Турнір лучників',
        gameCategoryName: 'Влучність і окомір',
        gameDescription: 'Змагання зі стрільби з лука по мішенях: розрахунок вітру, натягнення тятиви та влучання в яблучко.',
        flavorLore: 'Легендарний мисливець та захисник знедолених. Його тисовий лук не знає промаху навіть у густому тумані лісу.',
        greetingText: '«Ого, міцний мандрівник з луком за плечима! Поставмо мішень на сімдесят кроків та з’ясуймо, чия стріла точніша!»',
        preferredBet: 20,
        maxBet: 75,
        difficulty: 'hard',
        initialStartX: 26,
        initialStartY: 62,
        hp: 115,
        strength: 12,
        agility: 18,
        armor: 20
    },
    {
        id: 'gambler_jousting',
        name: 'Сер Роланд Безземельний',
        title: 'Мандрівний Лицар Списового Двобою',
        avatar: '🛡️',
        badgeIcon: '⚔️',
        themeColor: '#ea580c', // orange-600
        gameType: 'jousting',
        gameName: 'Лицарський Джостинг',
        gameCategoryName: 'Турнір честі',
        gameDescription: 'Шляхетний лицарський з’їзд на конях зі списами: прицілювання у шолом або щит та вибивання із сідла.',
        flavorLore: 'Бродячий лицар ордену Грифона. Мандрує від замку до замку, відстоюючи честь і шукаючи гідних лицарів для двобою.',
        greetingText: '«В ім’я честі та слави, сер! Списи напереваги, щити до бою! Зіткнемося в шляхетному джостингу перед сонцем!»',
        preferredBet: 30,
        maxBet: 100,
        difficulty: 'expert',
        initialStartX: 46,
        initialStartY: 22,
        hp: 150,
        strength: 17,
        agility: 13,
        armor: 38
    },
    {
        id: 'gambler_brawl',
        name: 'Тарас Залізна Рука',
        title: 'Мандрівний Чемпіон Кулачного Бою',
        avatar: '🥊',
        badgeIcon: '💥',
        themeColor: '#dc2626', // red-600
        gameType: 'brawl',
        gameName: 'Кулачний бій (Tavern Brawl)',
        gameCategoryName: 'Рукопашна бійка',
        gameDescription: 'Чесний кулачний двобій за правилами трактирних бійців: удари в голову, корпус, захисні блоки та стійкість.',
        flavorLore: 'Велетень з козацьких слобід. Його кулаки гартовані ковальським молотом, а серце не знає страху перед жодним силачем.',
        greetingText: '«Оце так зустріч! Скидай плащ і ставай у стійку — перевіримо, чи міцні твої кулаки у дружній бійці на дорозі!»',
        preferredBet: 15,
        maxBet: 60,
        difficulty: 'normal',
        initialStartX: 36,
        initialStartY: 58,
        hp: 160,
        strength: 18,
        agility: 12,
        armor: 25
    },
    {
        id: 'gambler_fencing',
        name: 'Дон Алехандро де Кордоба',
        title: 'Шляхетний Майстер Меча і Щита',
        avatar: '⚔️',
        badgeIcon: '🛡️',
        themeColor: '#0284c7', // sky-600
        gameType: 'fencing',
        gameName: 'Дуель на мечах та щитах',
        gameCategoryName: 'Мистецтво фехтування',
        gameDescription: 'Академічний фехтувальний поєдинок: стійки, колючі та рубаючі випади, надійні блоки баклером і парирування.',
        flavorLore: 'Випускник Толедської академії фехтування. Мандрує світом, шукаючи досконалості в гармонії сталі та щита.',
        greetingText: '«En garde, пане! Меч у правиці, щит біля грудей — що може бути благородніше за дзвін клинків у чесному двобої?»',
        preferredBet: 25,
        maxBet: 80,
        difficulty: 'hard',
        initialStartX: 64,
        initialStartY: 56,
        hp: 130,
        strength: 14,
        agility: 17,
        armor: 28
    }
];

// Helper to pick a random target settlement for a wandering gambler
function pickGamblerRandomGoal(gambler: GamblerTemplate, excludeSettlementId?: string): GamblerGoal {
    // Gamblers prefer cities, towns, castles and villages with taverns
    const civilPlaces = WORLD_SETTLEMENTS.filter(s => 
        s.type !== 'graveyard' && 
        s.type !== 'ruins' && 
        s.id !== excludeSettlementId
    );

    const target = civilPlaces[Math.floor(Math.random() * civilPlaces.length)] || WORLD_SETTLEMENTS[0];
    
    return {
        description: `Мандрує до поселення «${target.name}» у пошуках суперника в ${gambler.gameName}`,
        targetSettlementId: target.id,
        targetSettlementName: target.name,
        targetX: target.x,
        targetY: target.y
    };
}

export function generateInitialWanderingGamblers(): WanderingGambler[] {
    return GAMBLER_TEMPLATES.map((tmpl): WanderingGambler => {
        const goal = pickGamblerRandomGoal(tmpl);
        
        const tmplGender: CharacterGender = getGenderForName(tmpl.name);
        const generatedGamblerName = generateRandomName('any', tmplGender, getStableSeed(tmpl.id));

        const oppData: OpponentData = {
            id: `gambler-${tmpl.id}`,
            name: generatedGamblerName,
            gender: tmplGender,
            title: tmpl.title,
            avatar: tmpl.avatar,
            type: 'champion',
            rank: 1,
            difficulty: tmpl.difficulty,
            flavorQuote: tmpl.greetingText,
            description: `${tmpl.flavorLore} Спеціалізується на грі: ${tmpl.gameName}.`,
            hp: tmpl.hp,
            armor: tmpl.armor,
            powerPoints: 4,
            baseHp: tmpl.hp,
            strength: tmpl.strength,
            agility: tmpl.agility,
            rewards: {
                gold: tmpl.preferredBet * 2,
                powerPoints: 2,
                reputation: 15,
                xp: 40
            }
        };

        const alliesCount = Math.floor(Math.random() * 11); // 0 to 10 allies
        const allies: GamblerAlly[] = [];
        const maleAllyTitles = ['Супутник', 'Асистент', 'Шулер-молодший', 'Учень', 'Секундант', 'Партнер', 'Помічник', 'Знавець', 'Братчик'];
        const femaleAllyTitles = ['Супутниця', 'Асистентка', 'Шулерка', 'Учениця', 'Секундантка', 'Партнерка', 'Помічниця', 'Знавчиня', 'Сестриця'];
        
        for (let i = 0; i < alliesCount; i++) {
            const seed = getStableSeed(tmpl.id + 'ally' + i);
            const allyGender: CharacterGender = seed % 2 === 0 ? 'male' : 'female';
            const allyTitles = allyGender === 'female' ? femaleAllyTitles : maleAllyTitles;
            const avatarPool = allyGender === 'female' ? FEMALE_AVATARS : MALE_AVATARS;
            const allyTitle = allyTitles[seed % allyTitles.length];
            const allyAvatar = avatarPool[seed % avatarPool.length];
            const allyName = generateRandomName('any', allyGender, seed);
            
            allies.push({
                id: `${tmpl.id}-ally-${i}`,
                name: allyName,
                gender: allyGender,
                title: `${allyTitle} у грі «${tmpl.gameName}»`,
                avatar: allyAvatar,
                opponent: {
                    id: `${tmpl.id}-ally-opp-${i}`,
                    name: allyName,
                    gender: allyGender,
                    title: `Союзник ${generatedGamblerName}`,
                    avatar: allyAvatar,
                    type: 'contender',
                    rank: 1,
                    difficulty: tmpl.difficulty,
                    flavorQuote: `«Граємо до перемоги!»`,
                    description: `Союзник мандрівного гравця ${generatedGamblerName}.`,
                    hp: Math.round(tmpl.hp * 0.75),
                    armor: Math.round(tmpl.armor * 0.75),
                    powerPoints: 3,
                    baseHp: Math.round(tmpl.hp * 0.75),
                    strength: tmpl.strength - 2,
                    agility: tmpl.agility - 2,
                    rewards: {
                        gold: Math.round(tmpl.preferredBet),
                        powerPoints: 1,
                        reputation: 5,
                        xp: 20
                    }
                },
                isDefeated: false
            });
        }

        return {
            id: tmpl.id,
            name: generatedGamblerName,
            gender: tmplGender,
            title: tmpl.title,
            avatar: tmpl.avatar,
            badgeIcon: tmpl.badgeIcon,
            themeColor: tmpl.themeColor,
            gameType: tmpl.gameType,
            gameName: tmpl.gameName,
            gameCategoryName: tmpl.gameCategoryName,
            gameDescription: tmpl.gameDescription,
            flavorLore: tmpl.flavorLore,
            greetingText: tmpl.greetingText,
            preferredBet: tmpl.preferredBet,
            minBet: 0,
            maxBet: tmpl.maxBet,
            x: tmpl.initialStartX,
            y: tmpl.initialStartY,
            speed: 0.55 + (Math.random() * 0.25), // 0.55 .. 0.80 % per second
            state: 'traveling',
            actionTimer: 0,
            currentGoal: goal,
            opponent: oppData,
            allies
        };
    });
}

export interface GamblerUpdateResult {
    updatedGamblers: WanderingGambler[];
    encounteredGambler: WanderingGambler | null;
}

// AI update loop for wandering gamblers (peaceful travelers)
export function updateWanderingGamblers(
    gamblers: WanderingGambler[],
    deltaSeconds: number,
    playerPos: { x: number; y: number },
    isEncounterActive: boolean = false
): GamblerUpdateResult {
    let encounteredGambler: WanderingGambler | null = null;

    const updatedGamblers: WanderingGambler[] = gamblers.map((gambler): WanderingGambler => {
        const distToPlayer = Math.hypot(gambler.x - playerPos.x, gambler.y - playerPos.y);

        // Peaceful collision detection: when player steps within 1.7% of map
        if (!isEncounterActive && distToPlayer <= 1.7 && !encounteredGambler) {
            encounteredGambler = gambler;
        }

        let nextState = gambler.state;
        let nextGoal = { ...gambler.currentGoal };
        let nextActionTimer = gambler.actionTimer;

        // If resting / seeking match at a roadside tavern
        if (nextState === 'resting' || nextState === 'seeking_match') {
            nextActionTimer -= deltaSeconds;
            if (nextActionTimer <= 0) {
                // Done resting, pick new destination
                const tmpl = GAMBLER_TEMPLATES.find(t => t.id === gambler.id) || GAMBLER_TEMPLATES[0];
                nextGoal = pickGamblerRandomGoal(tmpl, nextGoal.targetSettlementId);
                nextState = 'traveling';
                nextActionTimer = 0;
            }
            return {
                ...gambler,
                state: nextState,
                actionTimer: Math.max(0, nextActionTimer),
                currentGoal: nextGoal
            };
        }

        // Traveling towards target settlement
        const dx = nextGoal.targetX - gambler.x;
        const dy = nextGoal.targetY - gambler.y;
        const distToTarget = Math.hypot(dx, dy);

        if (distToTarget <= 1.2) {
            // Reached destination! Rest for 10-15 seconds before moving to next settlement
            return {
                ...gambler,
                state: Math.random() > 0.5 ? 'resting' : 'seeking_match',
                actionTimer: 10 + Math.random() * 8,
                currentGoal: nextGoal
            };
        }

        // Move towards target
        const moveDist = gambler.speed * deltaSeconds;
        const ratio = Math.min(1, moveDist / Math.max(0.001, distToTarget));
        const newX = Math.max(4, Math.min(96, gambler.x + dx * ratio));
        const newY = Math.max(4, Math.min(96, gambler.y + dy * ratio));

        return {
            ...gambler,
            x: Number(newX.toFixed(2)),
            y: Number(newY.toFixed(2)),
            state: nextState,
            actionTimer: nextActionTimer,
            currentGoal: nextGoal
        };
    });

    return {
        updatedGamblers,
        encounteredGambler
    };
}

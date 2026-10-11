import fs from 'fs';
import path from 'path';

interface Drink {
    id: string;
    name: string;
    type: 'beer' | 'wine';
    subtype: string;
    price: number;
    strength: string;
    hpHeal: number;
    buffStat?: 'strength' | 'agility' | 'hp' | 'reputation' | 'xp' | 'brawl';
    buffValue?: number;
    description: string;
    flavorQuote: string;
    icon: string;
    color: string;
}

const beerAdjectives = [
    "Старовинне", "Ельдрійське", "Гном'яче", "Ельфійське", "Вулканічне",
    "Північне", "Багряне", "Оксамитове", "Смарагдове", "Срібне",
    "Золотисте", "Печерне", "Дубове", "Крижане", "Пекельне",
    "Тайгове", "Шахтарське", "Королівське", "Штормове", "Медове",
    "Алхімічне", "Чернече", "Гірське", "Лісове", "Драконяче"
];

const beerTypes = [
    { subtype: "Темний Ель", icon: "🍺", color: "text-amber-500" },
    { subtype: "Густий Стаут", icon: "🍺", color: "text-yellow-600" },
    { subtype: "Пшеничне Нефільтроване", icon: "🍻", color: "text-yellow-400" },
    { subtype: "Медовуха", icon: "🍺", color: "text-amber-400" },
    { subtype: "Золотистий Лагер", icon: "🍺", color: "text-amber-300" },
    { subtype: "Копчений Портер", icon: "🍺", color: "text-orange-600" },
    { subtype: "Хмільний ІПА", icon: "🍻", color: "text-[#d4af37]" },
    { subtype: "Червоний Ель", icon: "🍺", color: "text-red-500" },
    { subtype: "Крижаний Ель", icon: "🍻", color: "text-cyan-400" },
    { subtype: "Трав'яний Ель", icon: "🍺", color: "text-emerald-400" }
];

const beerNouns = [
    "«Око Дракона»", "«Сльоза Гнома»", "«Подих Завірюхи»", "«Ікла Вовка»", "«Молот Коваля»",
    "«Золотий Колос»", "«Місячний Ведмідь»", "«Вугілля Глибин»", "«Дуб Вуалі»", "«Серце Гори»",
    "«Туман Вальгалли»", "«Пекельний Громовержець»", "«Залізна Хватка»", "«Світляк Лісу»", "«Хмільна Башта»",
    "«Штормовий Шквал»", "«Корона Короля»", "«Руна Сили»", "«Байка Шинока»", "«Сонячний Вогонь»",
    "«Печерна Свіжість»", "«Скелястий Пік»", "«Лицарський Захист»", "«Морський Бриз»", "«Вожак Зграї»"
];

const beerQuotes = [
    "«Піна тримається міцніше, ніж клятви найманців!»",
    "«Один кубок заспокоїть дух, два — запалять серце!»",
    "«Зварено за секретними рецептами гірських майстрів.»",
    "«Такий густий, що можна різати бойовим кинджалом.»",
    "«Дарує міць гнома та бадьорість лісового мандрівника.»",
    "«Зігріває навіть у люту завірюху Північних Скель.»",
    "«Найкращий тавернний напій після важкого бою!»",
    "«Свіжий аромат соснових шишок та золотого хмелю.»"
];

const beerDescs = [
    "Незрівнянне темне пиво з глибокими кавово-шоколадними нотками та оксамитовою піною.",
    "Густий міцний стаут, зварений у мідних котлах гірських фортець.",
    "Освіжаюче пшеничне пиво з відтінками диких цитрусів та лісового меду.",
    "Золотиста медовуха, настояна на польових травах та дикому гірському меду.",
    "Класичний тавернний ель з багатим хмільним ароматом та м'якою гірчинкою.",
    "Копчене темне пиво, яке дозріває у обпалених дубових бочках з-під міцного елю.",
    "Ароматне пиво з подвійним охолодженням та приємною свіжістю джерельної води.",
    "Червоний ель з карамельним присмаком, створений для справжніх поціновувачів бенкетів."
];

// Specific named unique 110 beers
const beers: Drink[] = [];
for (let i = 1; i <= 110; i++) {
    const adj = beerAdjectives[(i * 3) % beerAdjectives.length];
    const noun = beerNouns[(i * 7) % beerNouns.length];
    const typeObj = beerTypes[i % beerTypes.length];
    const quote = beerQuotes[(i * 5) % beerQuotes.length];
    const desc = beerDescs[(i * 2) % beerDescs.length];

    const price = Math.round(5 + ((i * 11) % 45));
    const hpHeal = Math.round(10 + ((i * 13) % 35));
    const strengthPct = (4.0 + ((i % 12) * 0.7)).toFixed(1) + '%';
    
    let buffStat: Drink['buffStat'] = undefined;
    let buffValue: number | undefined = undefined;
    if (i % 3 === 0) {
        buffStat = 'strength';
        buffValue = 1 + (i % 3);
    } else if (i % 4 === 0) {
        buffStat = 'hp';
        buffValue = 10 + (i % 20);
    } else if (i % 5 === 0) {
        buffStat = 'brawl';
        buffValue = 2 + (i % 4);
    }

    beers.push({
        id: `beer_${i}`,
        name: `${adj} ${typeObj.subtype} ${noun}`,
        type: 'beer',
        subtype: typeObj.subtype,
        price,
        strength: strengthPct,
        hpHeal,
        buffStat,
        buffValue,
        description: `${desc} (#${i} у реєстрі пивоварів Ельдрії).`,
        flavorQuote: quote,
        icon: typeObj.icon,
        color: typeObj.color
    });
}

// 98 Wines
const wineAdjectives = [
    "Кропив'яне", "Королівське", "Багряне", "Місячне", "Рубінове",
    "Ельфійське", "Сонячне", "Оксамитове", "Срібне", "Кристальне",
    "Вулканічне", "Вуальове", "Тайгове", "Бурштинове", "Замкове",
    "Княже", "Іскристе", "Озерне", "Зоряне", "Драконяче"
];

const wineTypes = [
    { subtype: "Червоне Сухе", icon: "🍷", color: "text-red-600" },
    { subtype: "Червоне Напівсолодке", icon: "🍷", color: "text-rose-500" },
    { subtype: "Біле Сухе", icon: "🥂", color: "text-amber-200" },
    { subtype: "Біле Десертне", icon: "🍾", color: "text-[#d4af37]" },
    { subtype: "Рожеве Мускатне", icon: "🍷", color: "text-pink-400" },
    { subtype: "Ігристе Нектарне", icon: "🍾", color: "text-yellow-300" },
    { subtype: "Пряний Глінтвейн", icon: "🏺", color: "text-orange-500" },
    { subtype: "Магічне Кристальне", icon: "🍷", color: "text-purple-400" }
];

const wineNouns = [
    "«Сльоза Німфи»", "«Оксамит Осені»", "«Нектар Дракона»", "«Сяйво Вечірниці»", "«Троянда Ельфів»",
    "«Кров Замка»", "«Поцілунок Сонця»", "«Вуаль Королеви»", "«Срібний Кубок»", "«Кришталева Грона»",
    "«Вулканічний Схід»", "«Багряний Оксамит»", "«Таємниця Вежі»", "«Захід Мрій»", "«Шовковий Слід»",
    "«Смарагдовий Бриз»", "«Грозовий Портвейн»", "«Легенда Долини»", "«Перламутр»", "«Абсолют»"
];

const wineQuotes = [
    "«Кожен ковток розповідає історію сонячних схилів!»",
    "«Вино, варте королівського бенкету та тавернних пісень.»",
    "«Витримується в льохах понад п'ятдесят років.»",
    "«Витончений аромат багряних ягід та лісового горіха.»",
    "«Розпалює натхнення у поетів та відвагу у дуелянтів.»",
    "«Сріблясті відблиски у кубку заворожують погляд.»",
    "«Приємно зігріває вуста та дарує легкість душі.»",
    "«Справжній шедевр ельфійського виноробства.»"
];

const wineDescs = [
    "Благородне витримане вино з глибоким букетом спілих ягід, сливи та дубових ноток.",
    "Витончене біле вино з ніжним ароматом польових квітів та білих персиків.",
    "Багряне вино вищого ґатунку, зварене з кращих грона Сонячної Долини.",
    "Мерехтливе ельфійське вино, що грає на сонці золотистими та срібними іскрами.",
    "Ароматний пряний глінтвейн із додаванням кориці, гвоздики та гірського меду.",
    "Рожеве десертне вино з шовковистим смаком та відтінками стиглої полуниці.",
    "Вишукане ігристе вино, що подається у кришталевих кубках під час святкувань.",
    "Магічне вино, настояне на зоряному пилу та пелюстках місячної лілії."
];

const wines: Drink[] = [];
for (let i = 1; i <= 98; i++) {
    const adj = wineAdjectives[(i * 4) % wineAdjectives.length];
    const noun = wineNouns[(i * 6) % wineNouns.length];
    const typeObj = wineTypes[i % wineTypes.length];
    const quote = wineQuotes[(i * 3) % wineQuotes.length];
    const desc = wineDescs[(i * 5) % wineDescs.length];

    const price = Math.round(15 + ((i * 17) % 85));
    const hpHeal = Math.round(20 + ((i * 19) % 55));
    const strengthPct = (10.5 + ((i % 10) * 0.8)).toFixed(1) + '%';

    let buffStat: Drink['buffStat'] = undefined;
    let buffValue: number | undefined = undefined;
    if (i % 3 === 0) {
        buffStat = 'agility';
        buffValue = 1 + (i % 3);
    } else if (i % 4 === 0) {
        buffStat = 'reputation';
        buffValue = 5 + (i % 15);
    } else if (i % 5 === 0) {
        buffStat = 'xp';
        buffValue = 15 + (i % 35);
    }

    wines.push({
        id: `wine_${i}`,
        name: `${adj} ${typeObj.subtype} ${noun}`,
        type: 'wine',
        subtype: typeObj.subtype,
        price,
        strength: strengthPct,
        hpHeal,
        buffStat,
        buffValue,
        description: `${desc} (Вінтаж 14${40 + (i % 50)} року, Ельдрійські льохи).`,
        flavorQuote: quote,
        icon: typeObj.icon,
        color: typeObj.color
    });
}

const fileContent = `// Automatically generated alcohol database for Eldria taverns
// 110 Beers (Пиво) and 98 Wines (Вино)

export interface AlcoholDrink {
    id: string;
    name: string;
    type: 'beer' | 'wine';
    subtype: string;
    price: number;
    strength: string;
    hpHeal: number;
    buffStat?: 'strength' | 'agility' | 'hp' | 'reputation' | 'xp' | 'brawl';
    buffValue?: number;
    description: string;
    flavorQuote: string;
    icon: string;
    color: string;
}

export const ALL_BEERS: AlcoholDrink[] = ${JSON.stringify(beers, null, 4)};

export const ALL_WINES: AlcoholDrink[] = ${JSON.stringify(wines, null, 4)};

// Simple deterministic string hashing for seed-based menu generation
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

// Deterministic pseudo-random integer between min and max inclusive
function pseudoRandomInt(seed: number, min: number, max: number): number {
    const x = Math.sin(seed) * 10000;
    const rand = x - Math.floor(x);
    return Math.floor(rand * (max - min + 1)) + min;
}

// Fisher-Yates shuffle using deterministic seed
function deterministicShuffle<T>(array: T[], seedStr: string): T[] {
    const copy = [...array];
    let seed = hashString(seedStr);
    for (let i = copy.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = Math.floor((seed / 233280) * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
}

export interface TavernAlcoholMenu {
    beers: AlcoholDrink[]; // 5-10 items
    wines: AlcoholDrink[]; // 4-8 items
}

/**
 * Returns the alcohol menu for a given tavern ID.
 * Exactly 5-10 beers and 4-8 wines, deterministically selected based on tavernId.
 */
export function getTavernAlcoholMenu(tavernId: string): TavernAlcoholMenu {
    const beerSeed = hashString(tavernId + '_beer');
    const wineSeed = hashString(tavernId + '_wine');

    // Count of beers: 5 to 10
    const beerCount = pseudoRandomInt(beerSeed, 5, 10);
    // Count of wines: 4 to 8
    const wineCount = pseudoRandomInt(wineSeed, 4, 8);

    const shuffledBeers = deterministicShuffle(ALL_BEERS, tavernId + '_beer_list');
    const shuffledWines = deterministicShuffle(ALL_WINES, tavernId + '_wine_list');

    return {
        beers: shuffledBeers.slice(0, beerCount),
        wines: shuffledWines.slice(0, wineCount)
    };
}
`;

fs.writeFileSync(path.join(process.cwd(), 'src', 'lib', 'alcoholData.ts'), fileContent, 'utf-8');
console.log('Successfully generated alcoholData.ts with:', beers.length, 'beers and', wines.length, 'wines.');

import { SettlementData, TavernData } from '../../types';
import { CITIES_AND_CASTLES } from './citiesAndCastles';
import { VILLAGES_AND_HAMLETS } from './villagesAndHamlets';
import { RUINS_AND_GRAVEYARDS } from './ruinsAndGraveyards';
import { getRandomLandCoordinate, ensureOnLand, LAND_CONTINENTS } from '../world/terrainSystem';

// Mulberry32 PRNG for deterministic world generation
function createPRNG(seed: number) {
    let s = seed;
    return function rand() {
        let t = (s += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// LAND BIOME BOUNDING REGIONS (Guarantees settlements land on continents, avoiding deep sea water!)
export const LAND_REGIONS = LAND_CONTINENTS.map(c => ({
    name: c.name,
    minX: c.bounds.minX,
    maxX: c.bounds.maxX,
    minY: c.bounds.minY,
    maxY: c.bounds.maxY
}));

const CITY_ROOTS = [
    'Ранне', 'Вальгард', 'Ельфен', 'Злато', 'Срібно', 'Остро', 'Чорно', 'Біло', 'Червоно', 'Дубно',
    'Буре', 'Світо', 'Яро', 'Миро', 'Свято', 'Броні', 'Залізо', 'Камінно', 'Сокіл', 'Орло',
    'Володо', 'Світло', 'Тінь', 'Сонячно', 'Громо', 'Вітро', 'Криштале', 'Крижано', 'Вогне', 'Степо',
    'Морсько', 'Гірньо', 'Драконо', 'Болотно', 'Буян', 'Поліс', 'Верхо', 'Дніпро', 'Рось', 'Дністро',
    'Борис', 'Галич', 'Перея', 'Теребов', 'Збара', 'Кремене', 'Чигирин', 'Батурин', 'Глухів', 'Корсунь',
    'Ніжин', 'Охтир', 'Лубни', 'Прилу', 'Вінни', 'Ужго', 'Мукаче', 'Хуст', 'Рахів', 'Снятин',
    'Коломий', 'Косів', 'Рогатин', 'Жовкв', 'Броди', 'Скал', 'Белз', 'Буськ', 'Самбір', 'Стрий',
    'Дрогобич', 'Калуш', 'Теребовля', 'Хотин', 'Кам\'янець', 'Брацлав', 'Умань', 'Меджибіж', 'Старокостянтинів', 'Ізяслав'
];

const CITY_SUFFIXES = [
    'град', 'піль', 'дар', 'славль', 'вар', 'бург', 'тин', 'чин', 'бор', 'мар',
    'клів', 'вер', 'рон', 'доній', 'гар', 'донт', 'віль', 'форд', 'хельм', 'вен', 'гард'
];

const CASTLE_NAMES = [
    'Орлине Гніздо', 'Сокіл', 'Світла Твердиня', 'Залізна Вежа', 'Громовий Бастіон', 'Фортеця Вітрів',
    'Срібний Лев', 'Вовче Лігво', 'Буревій', 'Чорна Скеля', 'Оберігач', 'Рубіновий Замок',
    'Каменяр', 'Вогняна Цитадель', 'Північний Вартовий', 'Світанок', 'Крижаний Клинок', 'Дубовий Захист',
    'Острозька Фортеця', 'Світязь', 'Підгірці', 'Олесько', 'Хотинська Цитадель', 'Любарт',
    'Паланок', 'Свидовець', 'Скеля', 'Гримайлів', 'Цитадель Лева', 'Медобори', 'Драконяча Варта'
];

const VILLAGE_NAMES = [
    'Дубівка', 'Калинівка', 'Яблунівка', 'Березово', 'Вітрянка', 'Соснівка', 'Вільшанка', 'Липівка',
    'Кленовий Гай', 'Ясенівка', 'Тополі', 'Вишневе', 'Малинівка', 'Сливове', 'Оріхове', 'Тростянець',
    'Кринички', 'Джерельне', 'Світле', 'Зарічне', 'Прирічне', 'Підгірне', 'Загірне', 'Зелене',
    'Красне', 'Михайлівка', 'Іванівка', 'Павлівка', 'Григорівка', 'Семенівка', 'Олександрівка', 'Василівка',
    'Петрівка', 'Степанівка', 'Тарасівка', 'Богданівка', 'Андріївка', 'Дмитрівка', 'Федорівка', 'Ярославка',
    'Перемога', 'Благодатне', 'Сонячне', 'Криничне', 'Веселе', 'Шевченкове', 'Бережани', 'Вербове'
];

const HAMLET_NAMES = [
    'Хутір Тихий', 'Зелений Гай', 'Хутір Лісника', 'Хутір Пасічника', 'Чумацька Криниця', 'Хутір Обертас',
    'Хутір Млинаря', 'Козацькі Двори', 'Хутір Веселий', 'Хутір Затишний', 'Соколиний Брід', 'Хутір Рибалки',
    'Криничка', 'Хутір Мисливця', 'Хутір Миколи', 'Старий Млин', 'Хутір Коваля', 'Дідовий Хутір',
    'Хутір Травника', 'Хутір Бджоляра', 'Сонячна Поляна', 'Хутір Гончара', 'Березовий Хутір', 'Хутір Сторожа',
    'Хутір Бурлаки', 'Степовий Хутір', 'Хутір Каменяра', 'Вересковий Хутір', 'Хутір Смоляра', 'Хутір Дроворуба'
];

const GRAVEYARD_NAMES = [
    'Цвинтар Забутих Воїнів', 'Некрополь Чорного Туману', 'Прадавній Склеп Лицарів', 'Курган Світанку',
    'Погост Мертвих Шепотів', 'Цвинтар Старого Абатства', 'Некрополь Могильних Тіней', 'Гробниця Беззіркової Ночі',
    'Погост Мисливців', 'Цвинтар Розбійників', 'Склеп Забутих Боярів', 'Некрополь Палаючих Кісток',
    'Погост Смолянистий', 'Цвинтар Рибалок', 'Некрополь Смарагдових Тіней'
];

const RUINS_NAMES = [
    'Руїни Вежі Магів', 'Затонулий Цвинтар', 'Прадавнє Святилище', 'Зруйнована Цитадель',
    'Руїни Замку Дракона', 'Опалений Вівтар', 'Палісад Забутого Форту', 'Зруйнований Монастир',
    'Руїни Вежі Спостереження', 'Забутий Каменолом', 'Зруйнована Дзвіниця', 'Руїни Прадавньої Гільдії',
    'Вівтар Місячного Світла', 'Зруйнований Млин', 'Руїни Портового Маяка'
];

function generateTavern(id: string, name: string, sign: string, settlementType: 'city' | 'village' | 'hamlet' | 'castle' | 'ruins' | 'graveyard', tier: number): TavernData {
    const isGraveyard = settlementType === 'graveyard';
    return {
        id,
        name,
        sign,
        keeperName: isGraveyard ? 'Повелитель Склепу (Некромант)' : 'Корчмар Борис',
        atmosphere: isGraveyard
            ? 'Холод могильних плиток, розриті гробниці, зеленкавий магічний туман та брязкання кісток нежиті (скелетів, зомбі, гулів).'
            : 'Гомінкий затишний зал із дубовими столами, де б\'ються найсильніші картярі та воїни.',
        description: isGraveyard
            ? 'Могильне лігво у склепі, де блукають скелети, зомбі, гулі, упирі та інша нежить.'
            : `Головний заїжджий заклад settlement зі столами для карт, рингом для кулачних боїв та настільних ігор.`,
        settlementType,
        tierLevel: tier
    };
}

export function generateFullProceduralWorld(): SettlementData[] {
    const rand = createPRNG(42949672);
    const generated: SettlementData[] = [];
    const nameSet = new Set<string>();

    // Existing curated settlements - validated to ensure they are on solid land
    const existing = [
        ...CITIES_AND_CASTLES,
        ...VILLAGES_AND_HAMLETS,
        ...RUINS_AND_GRAVEYARDS
    ];
    existing.forEach(s => {
        const landCheck = ensureOnLand(s.x, s.y);
        generated.push({
            ...s,
            x: landCheck.x,
            y: landCheck.y,
            region: s.region || landCheck.regionName
        });
        nameSet.add(s.name.toLowerCase());
    });

    const existingCitiesCount = existing.filter(s => s.type === 'city').length;
    const targetCitiesCount = 100; // 100 Cities Total Requirement!
    const citiesToCreate = targetCitiesCount - existingCitiesCount;

    let cityIndex = 1;

    for (let i = 0; i < citiesToCreate; i++) {
        // Guaranteed land coordinate across all continental biomes
        const landCoord = getRandomLandCoordinate(rand, i);
        const cx = landCoord.x;
        const cy = landCoord.y;
        const regionName = landCoord.continent.name;

        let cityName = '';
        let tries = 0;
        do {
            const r = CITY_ROOTS[Math.floor(rand() * CITY_ROOTS.length)];
            const s = CITY_SUFFIXES[Math.floor(rand() * CITY_SUFFIXES.length)];
            cityName = `Місто ${r}${s}`;
            tries++;
        } while (nameSet.has(cityName.toLowerCase()) && tries < 50);
        
        if (nameSet.has(cityName.toLowerCase())) {
            cityName = `Місто ${CITY_ROOTS[i % CITY_ROOTS.length]}${cityIndex++}`;
        }
        nameSet.add(cityName.toLowerCase());

        const cityId = `proc_city_${i + 1}`;

        const cityTaverns: TavernData[] = [
            generateTavern(`${cityId}_t1`, `Таверна «Золотий Дракон ${i + 1}»`, '🐉', 'city', 3),
            generateTavern(`${cityId}_t2`, `Шинок «Срібний Келих»`, '🍷', 'city', 3),
            generateTavern(`${cityId}_t3`, `Корчма «Старий Меч»`, '⚔️', 'city', 2),
            generateTavern(`${cityId}_t4`, `Заїжджий Двір «Королівська Варта»`, '👑', 'city', 2)
        ];

        const cityData: SettlementData = {
            id: cityId,
            name: cityName,
            type: 'city',
            region: regionName,
            x: Number(cx.toFixed(2)),
            y: Number(cy.toFixed(2)),
            description: `Великий торговий та бойовий осередок у регіоні ${regionName}. Центр гільдій картярів та дуелянтів.`,
            taverns: cityTaverns
        };
        generated.push(cityData);

        // --- 2 to 4 Castles surrounding each city (strictly on land) ---
        const castlesCount = 2 + Math.floor(rand() * 3);
        for (let c = 0; c < castlesCount; c++) {
            const angle = rand() * Math.PI * 2;
            const dist = 0.8 + rand() * 1.6;
            const rawKx = Math.min(97, Math.max(3, cx + Math.cos(angle) * dist));
            const rawKy = Math.min(97, Math.max(3, cy + Math.sin(angle) * dist));
            const castleLand = ensureOnLand(rawKx, rawKy);

            const castleBaseName = CASTLE_NAMES[Math.floor(rand() * CASTLE_NAMES.length)];
            const castleName = `Замок ${castleBaseName} ${i + 1}-${c + 1}`;
            const castleId = `${cityId}_castle_${c + 1}`;

            generated.push({
                id: castleId,
                name: castleName,
                type: 'castle',
                region: castleLand.regionName || regionName,
                x: castleLand.x,
                y: castleLand.y,
                description: `Фортечна твердиня лицарів неподалік від ${cityName}. Обороняє підступи та влаштовує турніри.`,
                taverns: [
                    generateTavern(`${castleId}_t1`, `Твердиня «Гарнізон»`, '🛡️', 'castle', 3),
                    generateTavern(`${castleId}_t2`, `Замковий Шинок «Герб»`, '🏰', 'castle', 2)
                ]
            });
        }

        // --- 3 to 8 Villages surrounding each city (strictly on land) ---
        const villagesCount = 3 + Math.floor(rand() * 6);
        for (let v = 0; v < villagesCount; v++) {
            const angle = rand() * Math.PI * 2;
            const dist = 1.2 + rand() * 2.2;
            const rawVx = Math.min(97, Math.max(3, cx + Math.cos(angle) * dist));
            const rawVy = Math.min(97, Math.max(3, cy + Math.sin(angle) * dist));
            const villageLand = ensureOnLand(rawVx, rawVy);

            const villageBaseName = VILLAGE_NAMES[Math.floor(rand() * VILLAGE_NAMES.length)];
            const villageName = `Село ${villageBaseName} ${i + 1}-${v + 1}`;
            const villageId = `${cityId}_village_${v + 1}`;

            generated.push({
                id: villageId,
                name: villageName,
                type: 'village',
                region: villageLand.regionName || regionName,
                x: villageLand.x,
                y: villageLand.y,
                description: `Мальовниче ярмаркове село навколо ${cityName}. Славиться ремісниками та затишними корчмами.`,
                taverns: [
                    generateTavern(`${villageId}_t1`, `Корчма «Чумацький Заїзд»`, '🍻', 'village', 2),
                    generateTavern(`${villageId}_t2`, `Шинок «Зелений Млин»`, '🌾', 'village', 1)
                ]
            });

            // --- 1 to 2 Hamlets per village (strictly on land) ---
            const hamletsCount = 1 + Math.floor(rand() * 2);
            for (let h = 0; h < hamletsCount; h++) {
                const hAngle = rand() * Math.PI * 2;
                const hDist = 0.6 + rand() * 1.2;
                const rawHx = Math.min(98, Math.max(2, villageLand.x + Math.cos(hAngle) * hDist));
                const rawHy = Math.min(98, Math.max(2, villageLand.y + Math.sin(hAngle) * hDist));
                const hamletLand = ensureOnLand(rawHx, rawHy);

                const hamletBaseName = HAMLET_NAMES[Math.floor(rand() * HAMLET_NAMES.length)];
                const hamletName = `${hamletBaseName} ${i + 1}-${v + 1}-${h + 1}`;
                const hamletId = `${villageId}_hamlet_${h + 1}`;

                generated.push({
                    id: hamletId,
                    name: hamletName,
                    type: 'hamlet',
                    region: hamletLand.regionName || regionName,
                    x: hamletLand.x,
                    y: hamletLand.y,
                    description: `Затишне тихе поселення пасічників та дроворубів біля ${villageName}.`,
                    taverns: [
                        generateTavern(`${hamletId}_t1`, `Корчма біля Млина`, '🏡', 'hamlet', 1)
                    ]
                });
            }

            // --- Graveyard NEXT TO EVERY VILLAGE & CITY (strictly on land) ---
            const gAngle = rand() * Math.PI * 2;
            const gDist = 0.5 + rand() * 1.0;
            const rawGx = Math.min(98, Math.max(2, villageLand.x + Math.cos(gAngle) * gDist));
            const rawGy = Math.min(98, Math.max(2, villageLand.y + Math.sin(gAngle) * gDist));
            const graveyardLand = ensureOnLand(rawGx, rawGy);

            const gName = GRAVEYARD_NAMES[Math.floor(rand() * GRAVEYARD_NAMES.length)];
            const graveyardName = `${gName} (${villageName})`;
            const graveyardId = `${villageId}_graveyard`;

            generated.push({
                id: graveyardId,
                name: graveyardName,
                type: 'graveyard',
                region: graveyardLand.regionName || regionName,
                x: graveyardLand.x,
                y: graveyardLand.y,
                description: `Стародавнє кладовище біля ${villageName}. Склепи, кургани та покинуті труни.`,
                taverns: [
                    generateTavern(`${graveyardId}_t1`, `Склеп «Чорна Сова»`, '🪦', 'graveyard', 2)
                ]
            });
        }

        // --- Ruins around each city (strictly on land) ---
        const ruinsCount = 2 + Math.floor(rand() * 3);
        for (let r = 0; r < ruinsCount; r++) {
            const rAngle = rand() * Math.PI * 2;
            const rDist = 1.5 + rand() * 2.8;
            const rawRx = Math.min(98, Math.max(2, cx + Math.cos(rAngle) * rDist));
            const rawRy = Math.min(98, Math.max(2, cy + Math.sin(rAngle) * rDist));
            const ruinLand = ensureOnLand(rawRx, rawRy);

            const rName = RUINS_NAMES[Math.floor(rand() * RUINS_NAMES.length)];
            const ruinName = `${rName} ${i + 1}-${r + 1}`;
            const ruinId = `${cityId}_ruin_${r + 1}`;

            generated.push({
                id: ruinId,
                name: ruinName,
                type: 'ruins',
                region: ruinLand.regionName || regionName,
                x: ruinLand.x,
                y: ruinLand.y,
                description: `Покинута прадавня споруда в околицях ${cityName}. Притулок розбійників та розкрадачів гробниць.`,
                taverns: [
                    generateTavern(`${ruinId}_t1`, `Притулок «Темна Вежа»`, '💀', 'ruins', 3)
                ]
            });
        }
    }

    return generated;
}

export const ALL_SETTLEMENTS_GENERATED: SettlementData[] = generateFullProceduralWorld();

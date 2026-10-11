import { SettlementData } from '../../types';
import { createTavernOpponents } from './createTavernOpponents';

export const VILLAGES_AND_HAMLETS: SettlementData[] = [
    // === СЕЛА (30+) ===
    {
        id: 'village_medove',
        name: 'Село Медове',
        type: 'village',
        region: 'Центральні Землі',
        x: 48,
        y: 43,
        description: 'Мальовниче село пасічників біля сонячних дубрав. Славиться запашною медовухою.',
        taverns: [
            {
                id: 'medove_t1',
                name: 'Шинок «Медова Свічка»',
                sign: '🍯',
                keeperName: 'Пасічник Тарас',
                atmosphere: 'Запах воску та меду, дерев\'яні кухлі та добрий гумор селян.',
                description: 'Затишний шинок пасічників.',
                ...createTavernOpponents('medove_t1', 'Медова Свічка', 'village', 2)
            },
            {
                id: 'medove_t2',
                name: 'Корчма «Липовий Цвіт»',
                sign: '🌼',
                keeperName: 'Дядько Пилип',
                atmosphere: 'Свіже липове чайне мастило, трав\'яні хліби та швидкі карткові партії.',
                description: 'Місце відпочинку чумаків.',
                ...createTavernOpponents('medove_t2', 'Липовий Цвіт', 'village', 2)
            }
        ]
    },
    {
        id: 'village_kyniv',
        name: 'Село Кунів',
        type: 'village',
        region: 'Південні Болота',
        x: 55,
        y: 70,
        description: 'Село рибалок на річці Десна. Всі хати на палях, між ними плавають на човнах.',
        taverns: [
            {
                id: 'kyniv_t1',
                name: 'Корчма «Заплава»',
                sign: '🐟',
                keeperName: 'Рибалка Яків',
                atmosphere: 'Сіті на стінах, запах в\'яленої тарані та гучні оповіді про річкових чудовиськ.',
                description: 'Притулок річковиків.',
                ...createTavernOpponents('kyniv_t1', 'Заплава', 'village', 2)
            }
        ]
    },
    {
        id: 'village_mlyny',
        name: 'Село Млини',
        type: 'village',
        region: 'Західні Поля',
        x: 28,
        y: 50,
        description: 'Село млинарів із десятками вітряків на пагорбах. Постійно дме свіжий західний вітер.',
        taverns: [
            {
                id: 'mlyny_t1',
                name: 'Шинок «Вітряк»',
                sign: '🌾',
                keeperName: 'Млинар Захар',
                atmosphere: 'Шуми жорновів, борошняний пил у повітрі та свіже пиво з власної солодовні.',
                description: 'Шинок робітників млинів.',
                ...createTavernOpponents('mlyny_t1', 'Вітряк', 'village', 2)
            }
        ]
    },
    {
        id: 'village_dubky',
        name: 'Село Дубки',
        type: 'village',
        region: 'Північний Ліс',
        x: 60,
        y: 24,
        description: 'Село дроворубів у дубовому гаю. Тут виготовляють найкращі бочки для віскі та меду.',
        taverns: [
            {
                id: 'dubky_t1',
                name: 'Корчма «Дубова Бочка»',
                sign: '🪵',
                keeperName: 'Бондар Трохим',
                atmosphere: 'Дубові лави, важкі пивні кухлі та змагання на мозолястих руках.',
                description: 'Місце збору бондарів та дроворубів.',
                ...createTavernOpponents('dubky_t1', 'Дубова Бочка', 'village', 2)
            }
        ]
    },
    {
        id: 'village_vynohradne',
        name: 'Село Виноградне',
        type: 'village',
        region: 'Південне Долля',
        x: 72,
        y: 75,
        description: 'Сонцесяйне село на південних схилах, вкрите смарагдовими виноградниками.',
        taverns: [
            {
                id: 'vynohradne_t1',
                name: 'Винарня «Славута»',
                sign: '🍇',
                keeperName: 'Винороб Марко',
                atmosphere: 'Солодкий запах бродіння сусла, кришталеві чаші та дружні карткові турніри.',
                description: 'Знаменита південна винарня.',
                ...createTavernOpponents('vynohradne_t1', 'Славута', 'village', 2)
            }
        ]
    },
    {
        id: 'village_vovchyntsi',
        name: 'Село Вовчинці',
        type: 'village',
        region: 'Гірські Підніжжя',
        x: 28,
        y: 20,
        description: 'Село вівчарів під скелями Білої Гори. Щовечора ватри палають на пасовищах.',
        taverns: [
            {
                id: 'vovchyntsi_t1',
                name: 'Колиба «Ватра»',
                sign: '🔥',
                keeperName: 'Овчар Дмитро',
                atmosphere: 'Запах бринзи, диму ватри та тужливі звуки трембіти за вікном.',
                description: 'Традиційна гірська колиба.',
                ...createTavernOpponents('vovchyntsi_t1', 'Ватра', 'village', 2)
            }
        ]
    },
    {
        id: 'village_yarovoi',
        name: 'Село Яровий',
        type: 'village',
        region: 'Східні Степи',
        x: 88,
        y: 46,
        description: 'Село табунників та конярів у глибокому степовому яру.',
        taverns: [
            {
                id: 'yarovoi_t1',
                name: 'Шинок «Дикий Коник»',
                sign: '🐎',
                keeperName: 'Коняр Опанас',
                atmosphere: 'Дзвін вуздечок, запах сіна та гарячі суперечки за швидких коней.',
                description: 'Шинок конярів.',
                ...createTavernOpponents('yarovoi_t1', 'Дикий Коник', 'village', 2)
            }
        ]
    },
    {
        id: 'village_lypy',
        name: 'Село Липи',
        type: 'village',
        region: 'Центральний Ліс',
        x: 38,
        y: 34,
        description: 'Тайне село різб\'ярів по дереву та травників.',
        taverns: [
            {
                id: 'lypy_t1',
                name: 'Корчма «Різьблена Ложка»',
                sign: '🥄',
                keeperName: 'Різьбар Мирон',
                atmosphere: 'Різьблені меблі, дерев\'яні статуетки та спокійні вечори.',
                description: 'Затишна корчма різб\'ярів.',
                ...createTavernOpponents('lypy_t1', 'Різьблена Ложка', 'village', 2)
            }
        ]
    },
    {
        id: 'village_solonets',
        name: 'Село Солонець',
        type: 'village',
        region: 'Південні Солончаки',
        x: 58,
        y: 84,
        description: 'Село солеварів біля білих солоних озер півдня.',
        taverns: [
            {
                id: 'solonets_t1',
                name: 'Шинок «Біла Сіль»',
                sign: '🧂',
                keeperName: 'Солевар Богдан',
                atmosphere: 'Білі кристали солі на столах, солона риба та міцний горілчаний напій.',
                description: 'Шинок солеварів.',
                ...createTavernOpponents('solonets_t1', 'Біла Сіль', 'village', 2)
            }
        ]
    },
    {
        id: 'village_krynytsi',
        name: 'Село Криниці',
        type: 'village',
        region: 'Центральне Плató',
        x: 46,
        y: 54,
        description: 'Село з цілющими підземними джерелами та кришталевими колодязями.',
        taverns: [
            {
                id: 'krynytsi_t1',
                name: 'Корчма «Чисте Джерело»',
                sign: '💧',
                keeperName: 'Криничник Гнат',
                atmosphere: 'Прохолода цілющої води, м\'ята та дружні розмови.',
                description: 'Корчма біля цілющого колодязя.',
                ...createTavernOpponents('krynytsi_t1', 'Чисте Джерело', 'village', 2)
            }
        ]
    },
    {
        id: 'village_hontari',
        name: 'Село Ґонтарі',
        type: 'village',
        region: 'Західні Ліси',
        x: 18,
        y: 40,
        description: 'Село майстрів, які виготовляють дерев\'яний ґонт для дахів замків та церков.',
        taverns: [
            {
                id: 'hontari_t1',
                name: 'Шинок «Тесла»',
                sign: '🪓',
                keeperName: 'Тесля Федько',
                atmosphere: 'Аромат свіжої стружки та дружні карткові поєдинки.',
                description: 'Шинок дерев\'яних майстрів.',
                ...createTavernOpponents('hontari_t1', 'Тесла', 'village', 2)
            }
        ]
    },
    {
        id: 'village_rudnia',
        name: 'Село Рудня',
        type: 'village',
        region: 'Болотні Руди',
        x: 44,
        y: 68,
        description: 'Село плавильників болотяної залізної руди.',
        taverns: [
            {
                id: 'rudnia_t1',
                name: 'Корчма «Залізняк»',
                sign: '⛓️',
                keeperName: 'Рудар Вакула',
                atmosphere: 'Чорні від кіптяви обличчя, гарячі печі та важке пиво.',
                description: 'Корчма болотних рударів.',
                ...createTavernOpponents('rudnia_t1', 'Залізняк', 'village', 2)
            }
        ]
    },
    {
        id: 'village_khoruhva',
        name: 'Село Хоругва',
        type: 'village',
        region: 'Східний Рубіж',
        x: 78,
        y: 35,
        description: 'Село прикордонних дозорців під сторожовою вежею.',
        taverns: [
            {
                id: 'khoruhva_t1',
                name: 'Шинок «Сторожове Око»',
                sign: '👁️',
                keeperName: 'Вартовий Лесь',
                atmosphere: 'Сигнальні багаття за вікном, пильність та швидка гра.',
                description: 'Шинок прикордонників.',
                ...createTavernOpponents('khoruhva_t1', 'Сторожове Око', 'village', 2)
            }
        ]
    },
    {
        id: 'village_zelenyi meander',
        name: 'Село Зелений Меандр',
        type: 'village',
        region: 'Річкова Долина',
        x: 62,
        y: 58,
        description: 'Село на вигині тихої річки, оточене вербами.',
        taverns: [
            {
                id: 'zelenyi_t1',
                name: 'Таверна «Тиха Верба»',
                sign: '🌿',
                keeperName: 'Мельник Семен',
                atmosphere: 'Шуми річки, пташиний спів та лагідне сонячне світло.',
                description: 'Тиха річкова таверна.',
                ...createTavernOpponents('zelenyi_t1', 'Тиха Верба', 'village', 2)
            }
        ]
    },
    {
        id: 'village_berezivka',
        name: 'Село Березівка',
        type: 'village',
        region: 'Північно-Східний Ліс',
        x: 72,
        y: 18,
        description: 'Село березових гаїв, де добувають березовий сік та роблять дьоготь.',
        taverns: [
            {
                id: 'berezivka_t1',
                name: 'Шинок «Біла Береза»',
                sign: '🌳',
                keeperName: 'Дьогтяр Кузьма',
                atmosphere: 'Аромат березового соку та квасу, тиха селянська атмосфера.',
                description: 'Затишний березовий шинок.',
                ...createTavernOpponents('berezivka_t1', 'Біла Береза', 'village', 2)
            }
        ]
    },

    // === ХУТОРИ (30+) ===
    {
        id: 'hamlet_lisovyi',
        name: 'Хутір Лісовий',
        type: 'hamlet',
        region: 'Центральні Ліси',
        x: 40,
        y: 30,
        description: 'Усамітнений хутір із трьох хат у глибині лісу.',
        taverns: [
            {
                id: 'hamlet_lisovyi_t1',
                name: 'Заїзд «Старий Пень»',
                sign: '🪵',
                keeperName: 'Дід Остап',
                atmosphere: 'Тиха хатина, де завжди радий гостю самотній лісник.',
                description: 'Затишний притулок мандрівника.',
                ...createTavernOpponents('hamlet_lisovyi_t1', 'Старий Пень', 'hamlet', 1)
            }
        ]
    },
    {
        id: 'hamlet_kamianyi',
        name: 'Хутір Кам\'яний',
        type: 'hamlet',
        region: 'Гірські Схили',
        x: 20,
        y: 25,
        description: 'Маленька висілка камнетесів біля скелястого обриву.',
        taverns: [
            {
                id: 'hamlet_kamianyi_t1',
                name: 'Корчма «Гірський Скляра»',
                sign: '🪨',
                keeperName: 'Камнетес Влас',
                atmosphere: 'Кам\'яні стіни та камін, що зігріває в холодні ночі.',
                description: 'Гірський заїзд.',
                ...createTavernOpponents('hamlet_kamianyi_t1', 'Гірський Скляра', 'hamlet', 1)
            }
        ]
    },
    {
        id: 'hamlet_stepovyi',
        name: 'Хутір Степовий',
        type: 'hamlet',
        region: 'Східні Степи',
        x: 84,
        y: 62,
        description: 'Поодинока садиба чабана серед випаленого сонцем степу.',
        taverns: [
            {
                id: 'hamlet_stepovyi_t1',
                name: 'Шинок «Степова Ватра»',
                sign: '🔥',
                keeperName: 'Чабан Никонор',
                atmosphere: 'Вогнище під зоряним степовим небом.',
                description: 'Степовий відпочинок.',
                ...createTavernOpponents('hamlet_stepovyi_t1', 'Степова Ватра', 'hamlet', 1)
            }
        ]
    },
    {
        id: 'hamlet_otamanivka',
        name: 'Хутір Отаманівка',
        type: 'hamlet',
        region: 'Східні Степи',
        x: 92,
        y: 58,
        description: 'Хутір старого козацького старшини.',
        taverns: [
            {
                id: 'hamlet_otamanivka_t1',
                name: 'Світлиця Отамана',
                sign: '⚔️',
                keeperName: 'Дед Максим',
                atmosphere: 'Старовинні шаблі, портрети пращурів та щира розмова.',
                description: 'Світлиця ветерана.',
                ...createTavernOpponents('hamlet_otamanivka_t1', 'Світлиця Отамана', 'hamlet', 1)
            }
        ]
    },
    {
        id: 'hamlet_mlyнок',
        name: 'Хутір Млинок',
        type: 'hamlet',
        region: 'Центральна Річка',
        x: 50,
        y: 60,
        description: 'Садиба біля водяного млина.',
        taverns: [
            {
                id: 'hamlet_mlynok_t1',
                name: 'Корчминка «Тихий Плесо»',
                sign: '🌊',
                keeperName: 'Мельник Олексій',
                atmosphere: 'Шуми води, дзижчання комах та свіжий хліб.',
                description: 'Затишок на березі.',
                ...createTavernOpponents('hamlet_mlynok_t1', 'Тихий Плесо', 'hamlet', 1)
            }
        ]
    },
    {
        id: 'hamlet_solovey',
        name: 'Хутір Соловейко',
        type: 'hamlet',
        region: 'Південні Сади',
        x: 64,
        y: 72,
        description: 'Хутір у яблуневому саду, де птахи співають від світанку до заходу.',
        taverns: [
            {
                id: 'hamlet_solovey_t1',
                name: 'Заїзд «Яблуневий Цвіт»',
                sign: '🍎',
                keeperName: 'Садівник Тихон',
                atmosphere: 'Запах яблук та солодкого сидру.',
                description: 'Садовий шинок.',
                ...createTavernOpponents('hamlet_solovey_t1', 'Яблуневий Цвіт', 'hamlet', 1)
            }
        ]
    },
    {
        id: 'hamlet_pylypivka',
        name: 'Хутір Пилипівка',
        type: 'hamlet',
        region: 'Північна Пуща',
        x: 56,
        y: 12,
        description: 'Хутір мисливця на соболів.',
        taverns: [
            {
                id: 'hamlet_pylypivka_t1',
                name: 'Корчма «Соболина Загадка»',
                sign: '🦊',
                keeperName: 'Мисливець Пилип',
                atmosphere: 'Теплі хутра, гаряча юшка та тиха гра.',
                description: 'Мисливська хата.',
                ...createTavernOpponents('hamlet_pylypivka_t1', 'Соболина Загадка', 'hamlet', 1)
            }
        ]
    },
    {
        id: 'hamlet_chornohaiv',
        name: 'Хутір Чорногай',
        type: 'hamlet',
        region: 'Західна Діброви',
        x: 14,
        y: 35,
        description: 'Усамітнена хата на краю чорного дубового гаю.',
        taverns: [
            {
                id: 'hamlet_chornohaiv_t1',
                name: 'Шинок «Чорний Ворон»',
                sign: '🦅',
                keeperName: 'Старий Ворон',
                atmosphere: 'Похмурі розповіді про стародавні скарби та загадкові карти.',
                description: 'Похмурий хутір.',
                ...createTavernOpponents('hamlet_chornohaiv_t1', 'Чорний Ворон', 'hamlet', 1)
            }
        ]
    }
];

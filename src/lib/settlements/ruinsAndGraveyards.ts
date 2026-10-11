import { SettlementData } from '../../types';
import { createTavernOpponents } from './createTavernOpponents';

export const RUINS_AND_GRAVEYARDS: SettlementData[] = [
    // === РУЇНИ З БАНДИТАМИ ТА МОНСТРАМИ (16 locations) ===
    {
        id: 'ruins_starohrad',
        name: 'Стародавні Руїни «Староград»',
        type: 'ruins',
        region: 'Центральні Землі',
        x: 48,
        y: 28,
        description: 'Заруйнована фортеця прадавньої імперії. Тут переховуються бандити, розбійники та тіньові потвори.',
        taverns: [
            {
                id: 'ruins_starohrad_t1',
                name: 'Лігво «Тіньова Вежа»',
                sign: '💀',
                keeperName: 'Ватажок Бандитів Лютий',
                atmosphere: 'Напівзруйнований підвал, смолоскипи на стінах та брязкання награбованого золота.',
                description: 'Притулок розбійників. Тут б\'ються на смерть або за велику здобич.',
                ...createTavernOpponents('ruins_starohrad_t1', 'Тіньова Вежа', 'ruins', 3)
            }
        ]
    },
    {
        id: 'ruins_proklatyi_zamok',
        name: 'Проклятий Замок «Форт-Розлом»',
        type: 'ruins',
        region: 'Вулканічні Землі',
        x: 94,
        y: 35,
        description: 'Обпалені полум\'ям руїни замку. Захоплені злими найманцями та дикими культистами.',
        taverns: [
            {
                id: 'ruins_fort_t1',
                name: 'Підземелля «Обпалені Камені»',
                sign: '🔥',
                keeperName: 'Культист Вульф',
                atmosphere: 'Червоні відблиски лави, похмурі ритуальні знаки та дикі бійці.',
                description: 'Арена вогняних культистів.',
                ...createTavernOpponents('ruins_fort_t1', 'Обпалені Камені', 'ruins', 3)
            }
        ]
    },
    {
        id: 'ruins_chornogo_orla',
        name: 'Руїни Башти Чорного Орла',
        type: 'ruins',
        region: 'Західне Узбережжя',
        x: 16,
        y: 56,
        description: 'Зруйнована прибережна сигнальна вежа, де влаштували базу морські пірати.',
        taverns: [
            {
                id: 'ruins_orla_t1',
                name: 'Притулок «Розбитий Драккар»',
                sign: '🏴‍☠️',
                keeperName: 'Атаман Дрейк',
                atmosphere: 'Запах плісняви та морської вологи. Всюди скрині з чужими статками.',
                description: 'Піратський кубло серед розвалу.',
                ...createTavernOpponents('ruins_orla_t1', 'Розбитий Драккар', 'ruins', 2)
            }
        ]
    },
    {
        id: 'ruins_zagublenoho_mista',
        name: 'Загублене Місто «Антарес»',
        type: 'ruins',
        region: 'Східний Степ',
        x: 88,
        y: 72,
        description: 'Занесені піском руїни прадавнього південного амфітеатру, де гуляють дикі звірі та мародери.',
        taverns: [
            {
                id: 'ruins_antares_t1',
                name: 'Арена Мародерів «Амфітеатр»',
                sign: '⚔️',
                keeperName: 'Гладіатор Брут',
                atmosphere: 'Напівполіровані мармурові плити, покриті пилом і кров\'ю минулих боїв.',
                description: 'Арена степових мародерів.',
                ...createTavernOpponents('ruins_antares_t1', 'Амфітеатр', 'ruins', 3)
            }
        ]
    },
    {
        id: 'ruins_smertnoho_hrybavyshcha',
        name: 'Грибна Улоговина',
        type: 'ruins',
        region: 'Південні Болота',
        x: 42,
        y: 84,
        description: 'Зруйноване село під гігантськими отруйними грибами, заповнене болотними потворами.',
        taverns: [
            {
                id: 'ruins_hryb_t1',
                name: 'Гнилий Льох «Мухомор»',
                sign: '🍄',
                keeperName: 'Кикімора Ганна',
                atmosphere: 'Зелений туман, свічення плісняви та підступні гравці-культисти.',
                description: 'Гниле притулок отруйників.',
                ...createTavernOpponents('ruins_hryb_t1', 'Мухомор', 'ruins', 2)
            }
        ]
    },
    {
        id: 'ruins_kryzhanogo_hrotu',
        name: 'Крижаний Грот «Левіафан»',
        type: 'ruins',
        region: 'Крайня Північ',
        x: 32,
        y: 6,
        description: 'Замерзлі печери зі залишками затонулого варязького флоту. Населені печерними тролями.',
        taverns: [
            {
                id: 'ruins_grot_t1',
                name: 'Льодовий Зал Тролів',
                sign: '🧊',
                keeperName: 'Вождь Тролів Гром',
                atmosphere: 'Величезні бурульки, замерзлі кістки та богатирська сила супротивників.',
                description: 'Табір північних тролів.',
                ...createTavernOpponents('ruins_grot_t1', 'Льодовий Зал Тролів', 'ruins', 3)
            }
        ]
    },

    // === КЛАДОВИЩА З НЕЖИТТЮ (16 locations) ===
    {
        id: 'graveyard_chornoyi_troyandy',
        name: 'Кладовище «Чорна Троянда»',
        type: 'graveyard',
        region: 'Центральні Землі',
        x: 58,
        y: 48,
        description: 'Прадавній цвинтар зі старовинними склепами. Ночами тут повстають скелети та мерці.',
        taverns: [
            {
                id: 'graveyard_troianda_t1',
                name: 'Склеп Графа «Обитель Тіней»',
                sign: '🦇',
                keeperName: 'Некромант Вальтер',
                atmosphere: 'Холод могільного каменя, свічки з чорного воску та сяйво червоних очей nejiyt.',
                description: 'Дуельна зала нежиті та некромантів.',
                ...createTavernOpponents('graveyard_troianda_t1', 'Обитель Тіней', 'graveyard', 3)
            }
        ]
    },
    {
        id: 'graveyard_tumanne_pole',
        name: 'Туманний Погост',
        type: 'graveyard',
        region: 'Південні Болота',
        x: 52,
        y: 80,
        description: 'Затоплене кладовище серед болотного туману. Допомагати заблукалим тут нікому.',
        taverns: [
            {
                id: 'graveyard_tuman_t1',
                name: 'Каплиця Упирів',
                sign: '🪦',
                keeperName: 'Упир Гриць',
                atmosphere: 'Затишшя перед бурею, скрип напіввідкритих трун та страшний регіт.',
                description: 'Притулок нічних упирів та зомбі.',
                ...createTavernOpponents('graveyard_tuman_t1', 'Каплиця Упирів', 'graveyard', 2)
            }
        ]
    },
    {
        id: 'graveyard_zabutykh_voroiniv',
        name: 'Курган Забутих Воїнів',
        type: 'graveyard',
        region: 'Східний Степ',
        x: 82,
        y: 65,
        description: 'Величезний козацький курган, де спочивають упалі в древніх битвах воїни-привиди.',
        taverns: [
            {
                id: 'graveyard_kurhan_t1',
                name: 'Курган Привидів',
                sign: '👻',
                keeperName: 'Привид Сотника',
                atmosphere: 'Прозорі постаті лицарів у старовинних обладунках, що грають неземними картами.',
                description: 'Примарна арена великих предків.',
                ...createTavernOpponents('graveyard_kurhan_t1', 'Курган Привидів', 'graveyard', 3)
            }
        ]
    },
    {
        id: 'graveyard_kryzhanogo_pogostu',
        name: 'Крижаний Некрополь',
        type: 'graveyard',
        region: 'Крайня Північ',
        x: 48,
        y: 4,
        description: 'Замерзлі мавзолеї древніх північних королів під крижаними заносами.',
        taverns: [
            {
                id: 'graveyard_necropol_t1',
                name: 'Тронний Склеп Короля-Лича',
                sign: '👑',
                keeperName: 'Король-Лич Морготом',
                atmosphere: 'Морозне дихання смерті, кришталевий трон і заковані в лід лицарі Смерті.',
                description: 'Обитель найсильніших королів нежиті.',
                ...createTavernOpponents('graveyard_necropol_t1', 'Тронний Склеп Короля-Лича', 'graveyard', 3)
            }
        ]
    },
    {
        id: 'graveyard_morskikh_utoplenykiv',
        name: 'Цвинтар Утоплеників',
        type: 'graveyard',
        region: 'Західне Узбережжя',
        x: 10,
        y: 72,
        description: 'Скелястий берег зі хрестами з корабельних щогл. Звідси виходять водяники та утопленики.',
        taverns: [
            {
                id: 'graveyard_utopl_t1',
                name: 'Грот Примарного Корабля',
                sign: '⚓',
                keeperName: 'Привид Капітана Флінта',
                atmosphere: 'Зеленкаве фосфоричне сяйво, водорості на підлозі та прокляті скарби.',
                description: 'Арена примарних моряків.',
                ...createTavernOpponents('graveyard_utopl_t1', 'Грот Примарного Корабля', 'graveyard', 2)
            }
        ]
    }
];

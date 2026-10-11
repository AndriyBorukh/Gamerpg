import { SettlementData } from '../../types';
import { createTavernOpponents } from './createTavernOpponents';

export const CITIES_AND_CASTLES: SettlementData[] = [
    // === ВЕЛИКІ МІСТА ТА СТОЛИЦІ (16 міст) ===
    {
        id: 'city_rannegrad',
        name: 'Раннеград',
        type: 'city',
        region: 'Центральні Землі',
        x: 52,
        y: 37,
        description: 'Велична білокам\'яна столиця королівства на пагорбах біля Озера Світанкового. Осередок найсильніших лицарів та майстрів бойових мистецтв.',
        taverns: [
            {
                id: 'rannegrad_t1',
                name: 'Таверна «Золотий Дракон»',
                sign: '🐉',
                keeperName: 'Корчмар Борис',
                atmosphere: 'Шумна, розкішна зала з гербами та дубовими столами, де збираються вельможі та найкращі лицарі.',
                description: 'Головна турнірна таверна столиці з найбільшими ставками в регіоні.',
                ...createTavernOpponents('rannegrad_t1', 'Золотий Дракон', 'city', 3)
            },
            {
                id: 'rannegrad_t2',
                name: 'Шинок «Срібний Келих»',
                sign: '🍷',
                keeperName: 'Пані Меланія',
                atmosphere: 'Затишне світло ліхтарів, вишукані вина та поважні міські торговці, які не терплять шахрайства.',
                description: 'Місце збору заможних гільдійських картярів та фехтувальників.',
                ...createTavernOpponents('rannegrad_t2', 'Срібний Келих', 'city', 3)
            },
            {
                id: 'rannegrad_t3',
                name: 'Заїжджий Двір «Старий Меч»',
                sign: '⚔️',
                keeperName: 'Ветеран Гордій',
                atmosphere: 'Пахне смаженим м\'ясом та смолою. Тут висять щити минулих баталій, а за столами сидять вояки.',
                description: 'Притулок бувалих воїнів, де б\'ються жорстко та прямолінійно.',
                ...createTavernOpponents('rannegrad_t3', 'Старий Меч', 'city', 3)
            },
            {
                id: 'rannegrad_t4',
                name: 'Корчма «Королівська Варта»',
                sign: '👑',
                keeperName: 'Сотник Дем\'ян',
                atmosphere: 'Дисциплінований та урочистий заклад біля замкових мурів, де офіцери міряються майстерністю.',
                description: 'Офіцерський клуб столиці, де чемпіони славляться залізною витримкою.',
                ...createTavernOpponents('rannegrad_t4', 'Королівська Варта', 'city', 3)
            }
        ]
    },
    {
        id: 'city_valgard',
        name: 'Вальгард',
        type: 'city',
        region: 'Західне Узбережжя',
        x: 23,
        y: 32,
        description: 'Грізна морська фортеця норманів та лицарів західних морів на крутих прибережних скелях біля Золотого Мису.',
        taverns: [
            {
                id: 'valgard_t1',
                name: 'Корчма «Морський Вовк»',
                sign: '🐺',
                keeperName: 'Одноокий Торвальд',
                atmosphere: 'Пахне морською сіллю, пивом та смаженою рибою. Тут лунають войовничі саги вікінгів.',
                description: 'Улюблений заклад мореплавців та відчайдушних бійців.',
                ...createTavernOpponents('valgard_t1', 'Морський Вовк', 'city', 2)
            },
            {
                id: 'valgard_t2',
                name: 'Таверна «Драккар Вальгард»',
                sign: '⛵',
                keeperName: 'Свен Залізний Кулак',
                atmosphere: 'Масивні лави, вирізані з корабельних балок, та трофеї з далеких походів.',
                description: 'Заклад варязької знаті, де мечі метають із силою сокири.',
                ...createTavernOpponents('valgard_t2', 'Драккар Вальгард', 'city', 2)
            },
            {
                id: 'valgard_t3',
                name: 'Шинок «Золотий Якір»',
                sign: '⚓',
                keeperName: 'Купець Інґвар',
                atmosphere: 'Дзвін золотих монет, карти із зображенням морських чудовиськ і хитромудрі ставки.',
                description: 'Таверна морських магнатів та сміливих контрабандистів.',
                ...createTavernOpponents('valgard_t3', 'Золотий Якір', 'city', 2)
            },
            {
                id: 'valgard_t4',
                name: 'Притулок «Буря Півночі»',
                sign: '⚡',
                keeperName: 'Стара Хельга',
                atmosphere: 'Тріскотіння каміна, темне ель та мовчазні ветерани, готові змагатися до кінця.',
                description: 'Легендарна таверна, де перевіряють справжній нордичний характер.',
                ...createTavernOpponents('valgard_t4', 'Буря Півночі', 'city', 2)
            }
        ]
    },
    {
        id: 'city_sribnolis',
        name: 'Срібноліс',
        type: 'city',
        region: 'Північні Землі',
        x: 53,
        y: 17,
        description: 'Місто високих срібних шпилів серед прадавніх гаїв півночі. Тут шанують мудрість, магію та вишукане фехтування.',
        taverns: [
            {
                id: 'sribnolis_t1',
                name: 'Таверна «Срібна Гілка»',
                sign: '🌿',
                keeperName: 'Ельфійка Іллірія',
                atmosphere: 'Дзвінка музика арфи, аромат соснового меду та чарівливе сяйво люмінесцентних ліхтарів.',
                description: 'Аристократичний заклад, де грають витончено та неквапливо.',
                ...createTavernOpponents('sribnolis_t1', 'Срібна Гілка', 'city', 2)
            },
            {
                id: 'sribnolis_t2',
                name: 'Шинок «Місячний Промінь»',
                sign: '🌙',
                keeperName: 'Мудрець Таелін',
                atmosphere: 'М\'які шовкові подушки, загадкові відвідувачі у капюшонах та тихі інтелектуальні баталії.',
                description: 'Місце зустрічі чаклунів та магістрів картярського ремесла.',
                ...createTavernOpponents('sribnolis_t2', 'Місячний Промінь', 'city', 2)
            },
            {
                id: 'sribnolis_t3',
                name: 'Гостинний Двір «Білий Олень»',
                sign: '🦌',
                keeperName: 'Мисливець Брандор',
                atmosphere: 'Мисливські трофеї на стінах, багаття посеред зали та смажена дичина на рожні.',
                description: 'Притулок королівських слідопитів та лісових рейнджерів.',
                ...createTavernOpponents('sribnolis_t3', 'Білий Олень', 'city', 2)
            },
            {
                id: 'sribnolis_t4',
                name: 'Корчма «Зоряна Брама»',
                sign: '✨',
                keeperName: 'Астролог Келеборн',
                atmosphere: 'Зоряні карти на стелі, кришталеві келихи та містичні колоди карт, що світяться в темряві.',
                description: 'Головний центр турнірів північного краю.',
                ...createTavernOpponents('sribnolis_t4', 'Зоряна Брама', 'city', 2)
            }
        ]
    },
    {
        id: 'city_chornovoddia',
        name: 'Чорноводдя',
        type: 'city',
        region: 'Південні Болота',
        x: 48,
        y: 77,
        description: 'Похмуре туманне місто на палях серед безкраїх південних топей та мангрових плавнів.',
        taverns: [
            {
                id: 'chornovoddia_t1',
                name: 'Корчма «Чорна П\'явка»',
                sign: '🪱',
                keeperName: 'Одноногий Карас',
                atmosphere: 'Тьмяне світло зелених свічок, запах баговиння та суворі погляди болотяних мисливців.',
                description: 'Місце, де грають на останні монети та не прощають помилок.',
                ...createTavernOpponents('chornovoddia_t1', 'Чорна П\'явка', 'city', 2)
            },
            {
                id: 'chornovoddia_t2',
                name: 'Шинок «Туманний Привид»',
                sign: '👻',
                keeperName: 'Відьма Соломія',
                atmosphere: 'Густий дим трав\'яних люльок, скрипучі мости та моторошні легенди про затонулі скарби.',
                description: 'Таємничий заклад, у якому господиня знає майбутнє кожного гравця.',
                ...createTavernOpponents('chornovoddia_t2', 'Туманний Привид', 'city', 2)
            },
            {
                id: 'chornovoddia_t3',
                name: 'Таверна «Гнилий Дуб»',
                sign: '🪵',
                keeperName: 'Корчмар Панас',
                atmosphere: 'Масивні столи з мокрого дерева, міцна болотяна брага та ризиковані турніри.',
                description: 'Осередок місцевих контрабандистів та шукачів старожитностей.',
                ...createTavernOpponents('chornovoddia_t3', 'Гнилий Дуб', 'city', 2)
            },
            {
                id: 'chornovoddia_t4',
                name: 'Лігво «Болотний Змій»',
                sign: '🐍',
                keeperName: 'Отруйник Радован',
                atmosphere: 'Шурхіт луски у клітках під стелею, екзотичні настоянки та безжальні суперники.',
                description: 'Найнебезпечніша арена болотяного краю для справжніх майстрів.',
                ...createTavernOpponents('chornovoddia_t4', 'Болотний Змій', 'city', 2)
            }
        ]
    },
    {
        id: 'city_volnytsia',
        name: 'Вольниця',
        type: 'city',
        region: 'Східні Степи',
        x: 82,
        y: 53,
        description: 'Велике вільне місто козаків, вершників та кочових отаманів на широкому степовому роздоллі.',
        taverns: [
            {
                id: 'volnytsia_t1',
                name: 'Січовий Шинок «Золота Підкова»',
                sign: '🐎',
                keeperName: 'Отаман Сава',
                atmosphere: 'Дзвін шабель на стінах, пісні під кобзу та гарячий козацький куліш біля вогнища.',
                description: 'Легендарний степовий шинок, де козацька честь дорожча за золото.',
                ...createTavernOpponents('volnytsia_t1', 'Золота Підкова', 'city', 3)
            },
            {
                id: 'volnytsia_t2',
                name: 'Корчма «Дике Поле»',
                sign: '🌾',
                keeperName: 'Степовик Мирон',
                atmosphere: 'Запах степового полину, шкіряні сідла на лавах та гарячі суперечки за кожну карту.',
                description: 'Улюблене місце відпочинку табунників та дозорців кордону.',
                ...createTavernOpponents('volnytsia_t2', 'Дике Поле', 'city', 3)
            },
            {
                id: 'volnytsia_t3',
                name: 'Заїзд «Степовий Орел»',
                sign: '🦅',
                keeperName: 'Сотник Лаврін',
                atmosphere: 'Простора дерев\'яна зала з панорамою на безкраїй горизонт заходу сонця.',
                description: 'Турнірний центр вершників та найкращих лучників степу.',
                ...createTavernOpponents('volnytsia_t3', 'Степовий Орел', 'city', 3)
            },
            {
                id: 'volnytsia_t4',
                name: 'Таверна «Шабля та Люлька»',
                sign: '⚔️',
                keeperName: 'Характерник Василь',
                atmosphere: 'Дим запашного тютюну, дзвін кухлів та містичні карти з козацькими символами.',
                description: 'Заклад легендарних характерників, які бачать карти наскрізь.',
                ...createTavernOpponents('volnytsia_t4', 'Шабля та Люлька', 'city', 3)
            }
        ]
    },
    {
        id: 'city_solnechnyi_bereh',
        name: 'Сонячний Берег',
        type: 'city',
        region: 'Південне Узбережжя',
        x: 68,
        y: 89,
        description: 'Розкішне курортне портове місто з мармуровими набережними, пальмами та вічним сонцем.',
        taverns: [
            {
                id: 'solnechnyi_t1',
                name: 'Гранд-Казино «Морська Перлина»',
                sign: '🦪',
                keeperName: 'Дон Родріго',
                atmosphere: 'Кришталеві люстри, оксамитові столи та золоті фішки під звуки прибою.',
                description: 'Елітний гральний дім південного моря для найбагатших гостей.',
                ...createTavernOpponents('solnechnyi_t1', 'Морська Перлина', 'city', 3)
            },
            {
                id: 'solnechnyi_t2',
                name: 'Таверна «Бриз Пальми»',
                sign: '🌴',
                keeperName: 'Синьйора Лучія',
                atmosphere: 'Теплий морський вітерець, екзотичні фрукти та гра на відкритій терасі.',
                description: 'Романтичний притулок мандрівників та витончених гравців.',
                ...createTavernOpponents('solnechnyi_t2', 'Бриз Пальми', 'city', 3)
            },
            {
                id: 'solnechnyi_t3',
                name: 'Шинок «Кораловий Риф»',
                sign: '🐠',
                keeperName: 'Капітан Бартоломео',
                atmosphere: 'Піратські мапи на столах, ром десятилітньої витримки та азартні суперечки.',
                description: 'Місце збору південних каперів та мисливців за скарбами.',
                ...createTavernOpponents('solnechnyi_t3', 'Кораловий Риф', 'city', 3)
            },
            {
                id: 'solnechnyi_t4',
                name: 'Клуб «Аполон»',
                sign: '☀️',
                keeperName: 'Маестро Август',
                atmosphere: 'Античні колони, мармурові бюсти та вишукані турніри за золоті лаври.',
                description: 'Академія карткового мистецтва південної імперії.',
                ...createTavernOpponents('solnechnyi_t4', 'Аполон', 'city', 3)
            }
        ]
    },
    {
        id: 'city_girskyi_zamok',
        name: 'Гірський Шпиль',
        type: 'city',
        region: 'Гірські Кряжі',
        x: 35,
        y: 20,
        description: 'Місто-фортеця гномів та горян, вирубане просто в базальтових скелях Білих Вершин.',
        taverns: [
            {
                id: 'girskyi_t1',
                name: 'Корчма «Кам\'яне Серце»',
                sign: '🪨',
                keeperName: 'Гном Торін Громовий',
                atmosphere: 'Величезні кам\'яні склепіння, важкі залізні кружки та димні ковальські печі.',
                description: 'Головна таверна рудокопів з незламними чемпіонами.',
                ...createTavernOpponents('girskyi_t1', 'Кам\'яне Серце', 'city', 3)
            },
            {
                id: 'girskyi_t2',
                name: 'Таверна «Гніздо Грифона»',
                sign: '🦅',
                keeperName: 'Горець Олексій',
                atmosphere: 'Балкон над бездонною прірвою, де вітер завиває в тон картам на столі.',
                description: 'Екстремальний заклад для тих, хто не боїться високих ставок.',
                ...createTavernOpponents('girskyi_t2', 'Гніздо Грифона', 'city', 3)
            },
            {
                id: 'girskyi_t3',
                name: 'Шинок «Срібна Жила»',
                sign: '⛏️',
                keeperName: 'Майстер Балін',
                atmosphere: 'Блиск необроблених алмазів, дзвін кирок за стіною та важке ель.',
                description: 'Таверна гільдії гірників та ювелірів.',
                ...createTavernOpponents('girskyi_t3', 'Срібна Жила', 'city', 3)
            },
            {
                id: 'girskyi_t4',
                name: 'Зал Героїв «Один»',
                sign: '🛡️',
                keeperName: 'Ярл Бйорн',
                atmosphere: 'Шкури полярних ведмедів, бойові роги та пам\'ятні банери великих перемог.',
                description: 'Святилище чемпіонів, де випробовують найсильніших воїнів.',
                ...createTavernOpponents('girskyi_t4', 'Один', 'city', 3)
            }
        ]
    },
    {
        id: 'city_smaragdove',
        name: 'Смарагдове',
        type: 'city',
        region: 'Південні Долини',
        x: 65,
        y: 65,
        description: 'Місто квітучих садів, багатих ярмарків та найвідоміших виноробів континенту.',
        taverns: [
            {
                id: 'smaragdove_t1',
                name: 'Таверна «Зелений Паросток»',
                sign: '🌱',
                keeperName: 'Садівник Федір',
                atmosphere: 'Аромат троянд, виноградні лози над столами та вишукані зелені лікери.',
                description: 'Затишне місце відпочинку для любителів приємної гри.',
                ...createTavernOpponents('smaragdove_t1', 'Зелений Паросток', 'city', 2)
            },
            {
                id: 'smaragdove_t2',
                name: 'Шинок «Золота Бджола»',
                sign: '🐝',
                keeperName: 'Медоварка Ганна',
                atmosphere: 'Солодкий запах липового меду, свіжий хліб та веселі вечірні турніри.',
                description: 'Популярний шинок серед торговців прянощами та медом.',
                ...createTavernOpponents('smaragdove_t2', 'Золота Бджола', 'city', 2)
            },
            {
                id: 'smaragdove_t3',
                name: 'Погріб «Стара Лоза»',
                sign: '🍇',
                keeperName: 'Сомельє Арсен',
                atmosphere: 'Дубові бочки столітнього віку, тьмяне світло та дорогі рідкісні вина.',
                description: 'Заклад винних експертів та інтелігентних гравців.',
                ...createTavernOpponents('smaragdove_t3', 'Стара Лоза', 'city', 2)
            },
            {
                id: 'smaragdove_t4',
                name: 'Розважальний Двір «Веселий Фавн»',
                sign: '🪕',
                keeperName: 'Менестрель Лука',
                atmosphere: 'Жива лютнева музика, танці та щовечірні карткові чемпіонати.',
                description: 'Епіцентр культурного життя та змагань Смарагдового.',
                ...createTavernOpponents('smaragdove_t4', 'Веселий Фавн', 'city', 2)
            }
        ]
    },
    {
        id: 'city_vohnedol',
        name: 'Вогнедол',
        type: 'city',
        region: 'Вулканічні Землі',
        x: 88,
        y: 28,
        description: 'Місто великих доменних печей, гарячих гейзерів та легендарних ковальських гільдій.',
        taverns: [
            {
                id: 'vohnedol_t1',
                name: 'Таверна «Червоний Горн»',
                sign: '🔥',
                keeperName: 'Коваль Вульфрик',
                atmosphere: 'Жар від розпеченої сталі, іскри та важкі розмови про міць зброї.',
                description: 'Місце відпочинку зброярів та важкої піхоти.',
                ...createTavernOpponents('vohnedol_t1', 'Червоний Горн', 'city', 3)
            },
            {
                id: 'vohnedol_t2',
                name: 'Шинок «Лавовий Стік»',
                sign: '🌋',
                keeperName: 'Рудий Гнат',
                atmosphere: 'Скляні вікна з видом на лавовий потік та міцні вогняні настоянки.',
                description: 'Екзотичний шинок з ризикованими правилами гри.',
                ...createTavernOpponents('vohnedol_t2', 'Лавовий Стік', 'city', 3)
            },
            {
                id: 'vohnedol_t3',
                name: 'Заїзд «Саламандра»',
                sign: '🦎',
                keeperName: 'Чаклунка Зоряна',
                atmosphere: 'Теплі кам\'яні лави, дим прянощів та таємничі вогняні карти.',
                description: 'Притулок магів вогню та алхіміків.',
                ...createTavernOpponents('vohnedol_t3', 'Саламандра', 'city', 3)
            },
            {
                id: 'vohnedol_t4',
                name: 'Арена «Ковадло Титана»',
                sign: '⚒️',
                keeperName: 'Гладіатор Спартак',
                atmosphere: 'Крики вболівальників, сталеві столи та безкомпромісні карткові дуелі.',
                description: 'Головна арена вулканічного регіону для найсміливіших.',
                ...createTavernOpponents('vohnedol_t4', 'Ковадло Титана', 'city', 3)
            }
        ]
    },
    {
        id: 'city_zolotodol',
        name: 'Золотодол',
        type: 'city',
        region: 'Східні Торгові Шляхи',
        x: 73,
        y: 42,
        description: 'Місто банкірів, караван-сараїв та золотих сховищ на перетині всіх східних шляхів.',
        taverns: [
            {
                id: 'zolotodol_t1',
                name: 'Гільдійський Дім «Золотий Злиток»',
                sign: '💰',
                keeperName: 'Лихвар Абрам',
                atmosphere: 'Сяйво золота, шовкові килими та гравці в дорогих оксамитових плащах.',
                description: 'Найбагатший клуб для фінансової еліти континенту.',
                ...createTavernOpponents('zolotodol_t1', 'Золотий Злиток', 'city', 3)
            },
            {
                id: 'zolotodol_t2',
                name: 'Караван-Сарай «Східний Вітер»',
                sign: '🐫',
                keeperName: 'Купець Касім',
                atmosphere: 'Аромат кардамону, кава на піску та екзотичні колоди з далеких країн.',
                description: 'Зустріч мандрівників з усього світу.',
                ...createTavernOpponents('zolotodol_t2', 'Східний Вітер', 'city', 3)
            },
            {
                id: 'zolotodol_t3',
                name: 'Шинок «Ваги Справедливості»',
                sign: '⚖️',
                keeperName: 'Суддя Корній',
                atmosphere: 'Суворий порядок, захист від шулерів та чесна гра на високі суми.',
                description: 'Осередок чесних картярів та законників.',
                ...createTavernOpponents('zolotodol_t3', 'Ваги Справедливості', 'city', 3)
            },
            {
                id: 'zolotodol_t4',
                name: 'Таверна «Багатий Улов»',
                sign: '🎣',
                keeperName: 'Шинкар Тимур',
                atmosphere: 'Щедрі частування, ріки пива та безперервні турніри до ранку.',
                description: 'Улюблене місце купців після вдалих торгових угод.',
                ...createTavernOpponents('zolotodol_t4', 'Багатий Улов', 'city', 3)
            }
        ]
    },
    {
        id: 'city_khorol',
        name: 'Хорол',
        type: 'city',
        region: 'Центральні Землі',
        x: 43,
        y: 47,
        description: 'Старовинне козацьке місто-форпост на високому березі річки з міцними дерев\'яними вежами.',
        taverns: [
            {
                id: 'khorol_t1',
                name: 'Корчма «Старий Дунай»',
                sign: '🌊',
                keeperName: 'Дід Остап',
                atmosphere: 'Затишний річковий краєвид, смажена щука та тихі карткові посиденьки.',
                description: 'Місце зустрічі річкових веслярів та козаків.',
                ...createTavernOpponents('khorol_t1', 'Старий Дунай', 'city', 2)
            },
            {
                id: 'khorol_t2',
                name: 'Шинок «Козацька Застава»',
                sign: '🏹',
                keeperName: 'Сотник Гриць',
                atmosphere: 'Військовий порядок, шаблі на стінах та азартні поєдинки за чаркою медовухи.',
                description: 'Військовий клуб гарнізону Хорола.',
                ...createTavernOpponents('khorol_t2', 'Козацька Застава', 'city', 2)
            },
            {
                id: 'khorol_t3',
                name: 'Таверна «Чумацький Шлях»',
                sign: '🌌',
                keeperName: 'Чумак Василь',
                atmosphere: 'Мішки з сіллю під стінами, розповіді про дальні походи та швидка гра.',
                description: 'Притулок чумаків, які возять сіль з Криму.',
                ...createTavernOpponents('khorol_t3', 'Чумацький Шлях', 'city', 2)
            },
            {
                id: 'khorol_t4',
                name: 'Заїзд «Червона Калина»',
                sign: '🍒',
                keeperName: 'Господиня Оксана',
                atmosphere: 'Спів кобзарів, пироги з вишнею та привітні господарі.',
                description: 'Серце гостинності центральних земель.',
                ...createTavernOpponents('khorol_t4', 'Червона Калина', 'city', 2)
            }
        ]
    },
    {
        id: 'city_bilovezh',
        name: 'Біловеж',
        type: 'city',
        region: 'Північно-Західні Пущі',
        x: 18,
        y: 18,
        description: 'Місто білокам\'яних стін посеред незайманих пралісів з величними зубрами та соснами-велетнями.',
        taverns: [
            {
                id: 'bilovezh_t1',
                name: 'Таверна «Могутній Зубр»',
                sign: '🦬',
                keeperName: 'Єгер Матвій',
                atmosphere: 'Роги зубрів над каміном, шкури диких звірів та міцна лісова настоянка.',
                description: 'Головний мисливський клуб півночі.',
                ...createTavernOpponents('bilovezh_t1', 'Могутній Зубр', 'city', 2)
            },
            {
                id: 'bilovezh_t2',
                name: 'Шинок «Лісовий Вогник»',
                sign: '🕯️',
                keeperName: 'Травниця Ярина',
                atmosphere: 'Запах чебрецю, м\'яке світло свічок та спокійні карткові дуелі.',
                description: 'Місце роздумів та спокійної стратегії.',
                ...createTavernOpponents('bilovezh_t2', 'Лісовий Вогник', 'city', 2)
            },
            {
                id: 'bilovezh_t3',
                name: 'Притулок «Хвойний Затишок»',
                sign: '🌲',
                keeperName: 'Дроворуб Семен',
                atmosphere: 'Тепло пічки, смолистий аромат дров та прості й щирі правила гри.',
                description: 'Таверна робітників лісового господарства.',
                ...createTavernOpponents('bilovezh_t3', 'Хвойний Затишок', 'city', 2)
            },
            {
                id: 'bilovezh_t4',
                name: 'Зал «Біла Башта»',
                sign: '🗼',
                keeperName: 'Комендант Радомир',
                atmosphere: 'Високі стрілчасті вікна, вид на пущу та турнірні столи лицарів.',
                description: 'Цитадель чемпіонів Біловежа.',
                ...createTavernOpponents('bilovezh_t4', 'Біла Башта', 'city', 2)
            }
        ]
    },
    {
        id: 'city_tarkhov',
        name: 'Тархов',
        type: 'city',
        region: 'Західні Скелі',
        x: 12,
        y: 48,
        description: 'Суворе шахтарське місто-бастіон, що постачає найкращу залізну руду для армій королівства.',
        taverns: [
            {
                id: 'tarkhov_t1',
                name: 'Таверна «Залізна Рука»',
                sign: '🦾',
                keeperName: 'Коваль Гордій',
                atmosphere: 'Дзвін кувалд, столи з товстого заліза та міцне темне пиво.',
                description: 'Таверна важковаговиків та ковалів.',
                ...createTavernOpponents('tarkhov_t1', 'Залізна Рука', 'city', 2)
            },
            {
                id: 'tarkhov_t2',
                name: 'Шинок «Глибока Шахта»',
                sign: '🚇',
                keeperName: 'Шахтар Прокіп',
                atmosphere: 'Підземна зала з ліхтарями-гасівками та азартними іграми рудокопів.',
                description: 'Притулок тих, хто працює глибоко під землею.',
                ...createTavernOpponents('tarkhov_t2', 'Глибока Шахта', 'city', 2)
            },
            {
                id: 'tarkhov_t3',
                name: 'Корчма «Скелястий Орел»',
                sign: '🦅',
                keeperName: 'Вартовий Степан',
                atmosphere: 'Краєвид на кар\'єр, вітер та швидкі карткові партії.',
                description: 'Оглядова вежа з чудовою таверною.',
                ...createTavernOpponents('tarkhov_t3', 'Скелястий Орел', 'city', 2)
            },
            {
                id: 'tarkhov_t4',
                name: 'Клуб «Сталевий Клинок»',
                sign: '⚔️',
                keeperName: 'Майстер Орест',
                atmosphere: 'Виставка викуваних мечів, полірована сталь та турнірний запал.',
                description: 'Арена найкращих бійців Тархова.',
                ...createTavernOpponents('tarkhov_t4', 'Сталевий Клинок', 'city', 2)
            }
        ]
    },
    {
        id: 'city_dubovyi_krai',
        name: 'Дубовий Гай',
        type: 'city',
        region: 'Центральний Захід',
        x: 32,
        y: 42,
        description: 'Місто тисячолітніх дубів, де друїди, мисливці та лицарі живуть у гармонії з природою.',
        taverns: [
            {
                id: 'dubovyi_t1',
                name: 'Таверна «Віковий Дуб»',
                sign: '🌳',
                keeperName: 'Старійшина Боримир',
                atmosphere: 'Зала всередині стовбура велетенського дуба, м\'який мох та магічні свічки.',
                description: 'Чудо природи та картярського спорту.',
                ...createTavernOpponents('dubovyi_t1', 'Віковий Дуб', 'city', 2)
            },
            {
                id: 'dubovyi_t2',
                name: 'Шинок «Жолудь»',
                sign: '🌰',
                keeperName: 'Травник Микита',
                atmosphere: 'Аромат жолудевої кави, дерев\'яні різьблені карти та дружня бесіда.',
                description: 'Затишний шинок для довгих вечорів.',
                ...createTavernOpponents('dubovyi_t2', 'Жолудь', 'city', 2)
            },
            {
                id: 'dubovyi_t3',
                name: 'Заїзд «Лісова Пісня»',
                sign: '🎵',
                keeperName: 'Співачка Леся',
                atmosphere: 'Мелодійний спів, лютня та карткові батли під оплески гостей.',
                description: 'Музичний оазис серед лісу.',
                ...createTavernOpponents('dubovyi_t3', 'Лісова Пісня', 'city', 2)
            },
            {
                id: 'dubovyi_t4',
                name: 'Корчма «Друїдський Колодязь»',
                sign: '💧',
                keeperName: 'Друїд Всеволод',
                atmosphere: 'Чиста джерельна вода, настоянки на травах та глибокі стратегічні баталії.',
                description: 'Місце сили та інтелектуальних поєдинків.',
                ...createTavernOpponents('dubovyi_t4', 'Друїдський Колодязь', 'city', 2)
            }
        ]
    },
    {
        id: 'city_morske_oko',
        name: 'Морське Око',
        type: 'city',
        region: 'Західний Архіпелаг',
        x: 8,
        y: 65,
        description: 'Острівне портове місто у формі лагуни, захищене від штормів високими рифами.',
        taverns: [
            {
                id: 'morske_t1',
                name: 'Таверна «Блакитна Лагуна»',
                sign: '🏝️',
                keeperName: 'Капітан Немо',
                atmosphere: 'Підводні вікна з рибами, прозора бірюзова вода та морські делікатеси.',
                description: 'Найкрасивіша острівна таверна регіону.',
                ...createTavernOpponents('morske_t1', 'Блакитна Лагуна', 'city', 2)
            },
            {
                id: 'morske_t2',
                name: 'Шинок «Чорна Перлина»',
                sign: '🏴‍☠️',
                keeperName: 'Боцман Біллі',
                atmosphere: 'Папуги під стелею, карти скарбів і відчайдушні піратські ставки.',
                description: 'Таємна база морських розбійників.',
                ...createTavernOpponents('morske_t2', 'Чорна Перлина', 'city', 2)
            },
            {
                id: 'morske_t3',
                name: 'Притулок «Маяк»',
                sign: '🗼',
                keeperName: 'Доглядач Семен',
                atmosphere: 'Світло прожектора над морем, шуми хвиль та спокійні ігри до ранку.',
                description: 'Затишний куточок на вершині скелі.',
                ...createTavernOpponents('morske_t3', 'Маяк', 'city', 2)
            },
            {
                id: 'morske_t4',
                name: 'Клуб «Нептун»',
                sign: '🔱',
                keeperName: 'Адмірал Нельсон',
                atmosphere: 'Офіцерські мундири, хронометри та високе карткове мистецтво.',
                description: 'Елітний морський клуб.',
                ...createTavernOpponents('morske_t4', 'Нептун', 'city', 2)
            }
        ]
    },
    {
        id: 'city_pivnichna_brama',
        name: 'Північна Брама',
        type: 'city',
        region: 'Крайня Північ',
        x: 42,
        y: 8,
        description: 'Крижане місто-цитадель на кордоні з вічними льодовиками та північним сяйвом.',
        taverns: [
            {
                id: 'pivnichna_t1',
                name: 'Таверна «Полярне Сяйво»',
                sign: '🌌',
                keeperName: 'Шаман Інгмар',
                atmosphere: 'Магічне сяйво неба крізь кришталевий купол, шкури мамонтів та гарячий глінтвейн.',
                description: 'Казковий притулок серед вічної мерзлоти.',
                ...createTavernOpponents('pivnichna_t1', 'Полярне Сяйво', 'city', 3)
            },
            {
                id: 'pivnichna_t2',
                name: 'Шинок «Крижаний Ікол»',
                sign: '🧊',
                keeperName: 'Мисливець Рагнар',
                atmosphere: 'Стіни з прозорого льоду, полум\'я каміна та захоплюючі турніри.',
                description: 'Унікальний льодовий шинок півночі.',
                ...createTavernOpponents('pivnichna_t2', 'Крижаний Ікол', 'city', 3)
            },
            {
                id: 'pivnichna_t3',
                name: 'Корчма «Білий Ведмідь»',
                sign: '🐻‍❄️',
                keeperName: 'Ярл Олаф',
                atmosphere: 'Величезні порції смаженого м\'яса, бочки з міцним медом і богатирські виклики.',
                description: 'Місце для найвитриваліших воїнів.',
                ...createTavernOpponents('pivnichna_t3', 'Білий Ведмідь', 'city', 3)
            },
            {
                id: 'pivnichna_t4',
                name: 'Цитадель «Вічна Варта»',
                sign: '⚔️',
                keeperName: 'Командор Едвард',
                atmosphere: 'Залізний спокій вартових, стратеги за картами та бездоганна тактика.',
                description: 'Штаб оборони північного кордону.',
                ...createTavernOpponents('pivnichna_t4', 'Вічна Варта', 'city', 3)
            }
        ]
    },

    // === ВЕЛИЧНІ ЗАМКИ - ЯК МІСТА (14 замків, по 4 зали/турнірні арени + зброярня) ===
    {
        id: 'castle_drakoniv_yar',
        name: 'Замок «Драконів Яр»',
        type: 'castle',
        region: 'Вулканічні Хребти',
        x: 82,
        y: 20,
        description: 'Неприступний чорний замок на краю лавового розлому, де тренуються драконоборці та королівська гвардія.',
        taverns: [
            {
                id: 'drakoniv_yar_t1',
                name: 'Тронна Зала Барона',
                sign: '🏰',
                keeperName: 'Барон Вальдемар',
                atmosphere: 'Червоний оксамит, герби з палаючим драконом та елітні лицарі в полірованих обладунках.',
                description: 'Аристократична дуельна зала замку.',
                ...createTavernOpponents('drakoniv_yar_t1', 'Тронна Зала Барона', 'castle', 3)
            },
            {
                id: 'drakoniv_yar_t2',
                name: 'Гарнізонна Казарма Варти',
                sign: '🛡️',
                keeperName: 'Сержант Бруно',
                atmosphere: 'Брязкіт лат, запах збройової олії та суворі бійці гарнізону.',
                description: 'Місце перевірки сили та фехтувальної майстерності.',
                ...createTavernOpponents('drakoniv_yar_t2', 'Гарнізонна Казарма Варти', 'castle', 3)
            },
            {
                id: 'drakoniv_yar_t3',
                name: 'Лицарська Арена Честі',
                sign: '⚔️',
                keeperName: 'Герольд Артур',
                atmosphere: 'Піщана арена, знамена лицарських орденів та глядацькі трибуни.',
                description: 'Головне турнірне поле твердині.',
                ...createTavernOpponents('drakoniv_yar_t3', 'Лицарська Арена Честі', 'castle', 3)
            },
            {
                id: 'drakoniv_yar_t4',
                name: 'Винний Погріб Каштеляна',
                sign: '🍷',
                keeperName: 'Каштелян Зигмунд',
                atmosphere: 'Старі склепіння, факели та ставки на коштовні реліквії.',
                description: 'Таємний клуб офіцерів замку.',
                ...createTavernOpponents('drakoniv_yar_t4', 'Винний Погріб Каштеляна', 'castle', 3)
            }
        ]
    },
    {
        id: 'castle_bilyi_lev',
        name: 'Цитадель «Білий Лев»',
        type: 'castle',
        region: 'Центральні Землі',
        x: 60,
        y: 30,
        description: 'Головна твердиня паладинів та ордену Срібного Світанку. Її мармурові вежі височіють над річкою Рось.',
        taverns: [
            {
                id: 'bilyi_lev_t1',
                name: 'Зала Паладинів Світла',
                sign: '✨',
                keeperName: 'Верховний Магістр Годфрі',
                atmosphere: 'Освячені світильники, молитви перед боєм та бездоганна лицарська честь.',
                description: 'Священна дуельна зала ордену.',
                ...createTavernOpponents('bilyi_lev_t1', 'Зала Паладинів Світла', 'castle', 3)
            },
            {
                id: 'bilyi_lev_t2',
                name: 'Збройова Зала Охоронців',
                sign: '🛡️',
                keeperName: 'Оруженосець Філіп',
                atmosphere: 'Щити з білими левами на стінах та майстри бою на мечах.',
                description: 'Тренувальний табір елітних воїнів.',
                ...createTavernOpponents('bilyi_lev_t2', 'Збройова Зала Охоронців', 'castle', 3)
            },
            {
                id: 'bilyi_lev_t3',
                name: 'Вежа Сокола',
                sign: '🦅',
                keeperName: 'Сенешаль Роберт',
                atmosphere: 'Панорама на все королівство, легкий бриз та інтелектуальні баталії.',
                description: 'Вершина стратегії та карткового розуму.',
                ...createTavernOpponents('bilyi_lev_t3', 'Вежа Сокола', 'castle', 3)
            },
            {
                id: 'bilyi_lev_t4',
                name: 'Турнірне Поле Короля',
                sign: '👑',
                keeperName: 'Маршал Жан',
                atmosphere: 'Сурми, оплески вельмож та поєдинки за королівський кубок.',
                description: 'Найпрестижніша арена королівства.',
                ...createTavernOpponents('bilyi_lev_t4', 'Турнірне Поле Короля', 'castle', 3)
            }
        ]
    },
    {
        id: 'castle_zalizna_skelia',
        name: 'Твердиня «Залізна Скеля»',
        type: 'castle',
        region: 'Західні Гори',
        x: 20,
        y: 42,
        description: 'Гігантський гірський замок, врізаний у прямовисну скелю над бурхливими водами океану.',
        taverns: [
            {
                id: 'zalizna_skelia_t1',
                name: 'Тронний Зал Залізного Графа',
                sign: '👑',
                keeperName: 'Граф Едмунд',
                atmosphere: 'Холодний камінь, важкі ланцюги та непідкупні судді турнірів.',
                description: 'Головна резиденція правителів західного кордону.',
                ...createTavernOpponents('zalizna_skelia_t1', 'Тронний Зал Залізного Графа', 'castle', 3)
            },
            {
                id: 'zalizna_skelia_t2',
                name: 'Бастіон Стрільців',
                sign: '🏹',
                keeperName: 'Капітан Роланд',
                atmosphere: 'Бійниці з видом на море, арбалети та швидкі рефлекси бійців.',
                description: 'Осередок найкращих стрільців та дуелянтів.',
                ...createTavernOpponents('zalizna_skelia_t2', 'Бастіон Стрільців', 'castle', 3)
            },
            {
                id: 'zalizna_skelia_t3',
                name: 'Каземати Фортеці',
                sign: '⛓️',
                keeperName: 'Наглядач Борис',
                atmosphere: 'Суворий дух залізної дисципліни та перевірка сили духу.',
                description: 'Арена безкомпромісних кулачних та збройних боїв.',
                ...createTavernOpponents('zalizna_skelia_t3', 'Каземати Фортеці', 'castle', 3)
            },
            {
                id: 'zalizna_skelia_t4',
                name: 'Вежа Морського Дозору',
                sign: '🌊',
                keeperName: 'Лейтенант Ерік',
                atmosphere: 'Морські підзорні труби, штормові вітри та гарячі ставки.',
                description: 'Оглядовий пост з турнірним клубом.',
                ...createTavernOpponents('zalizna_skelia_t4', 'Вежа Морського Дозору', 'castle', 3)
            }
        ]
    },
    {
        id: 'castle_kryzhanyi_bastion',
        name: 'Замок «Крижаний Бастіон»',
        type: 'castle',
        region: 'Північні Льоди',
        x: 48,
        y: 4,
        description: 'Найпівнічніший королівський форпост серед вічних снігів, оплот захисту від нічних морозних велетнів.',
        taverns: [
            {
                id: 'kryzhanyi_t1',
                name: 'Зала Крижаного Трону',
                sign: '❄️',
                keeperName: 'Герцог Фростгард',
                atmosphere: 'Хрускіт інею, хутряні мантії та лицарі з загартованим поглядом.',
                description: 'Осередок володарів північних земель.',
                ...createTavernOpponents('kryzhanyi_t1', 'Зала Крижаного Трону', 'castle', 3)
            },
            {
                id: 'kryzhanyi_t2',
                name: 'Камінний Зал Ветеранів',
                sign: '🔥',
                keeperName: 'Ветеран Сноррі',
                atmosphere: 'Величезне полум\'я каміна, гаряча медовуха та незламні воїни.',
                description: 'Притулок ветеранів північних війн.',
                ...createTavernOpponents('kryzhanyi_t2', 'Камінний Зал Ветеранів', 'castle', 3)
            },
            {
                id: 'kryzhanyi_t3',
                name: 'Арена Північного Сяйва',
                sign: '🌌',
                keeperName: 'Воїн Свен',
                atmosphere: 'Крижана гладіаторська арена під відкритим зоряним небом.',
                description: 'Місце випробування справжнього воїнського гарту.',
                ...createTavernOpponents('kryzhanyi_t3', 'Арена Північного Сяйва', 'castle', 3)
            },
            {
                id: 'kryzhanyi_t4',
                name: 'Арсенал Варягів',
                sign: '🪓',
                keeperName: 'Зброяр Ульф',
                atmosphere: 'Точильні камені, важкі сокири та міцні щити.',
                description: 'Збройовий клуб північної гвардії.',
                ...createTavernOpponents('kryzhanyi_t4', 'Арсенал Варягів', 'castle', 3)
            }
        ]
    },
    {
        id: 'castle_tuman_holm',
        name: 'Замок «Туманний Холм»',
        type: 'castle',
        region: 'Південні Болота',
        x: 42,
        y: 70,
        description: 'Містичний замок на самотньому скелястому пагорбі посеред вічного болотяного туману.',
        taverns: [
            {
                id: 'tuman_holm_t1',
                name: 'Зала Тіньових Лордів',
                sign: '🕯️',
                keeperName: 'Лорд Мортем',
                atmosphere: 'Тьмяні свічки, чорні прапори та таємничі майстри фехтування.',
                description: 'Зала аристократів туманного краю.',
                ...createTavernOpponents('tuman_holm_t1', 'Зала Тіньових Лордів', 'castle', 3)
            },
            {
                id: 'tuman_holm_t2',
                name: 'Таємна Рада Алхіміків',
                sign: '⚗️',
                keeperName: 'Алхімік Вальтер',
                atmosphere: 'Колби з фосфорним світінням, дим та складні стратегічні дуелі.',
                description: 'Інтелектуальне коло алхіміків замку.',
                ...createTavernOpponents('tuman_holm_t2', 'Таємна Рада Алхіміків', 'castle', 3)
            },
            {
                id: 'tuman_holm_t3',
                name: 'Вартова Башта Воронів',
                sign: '🦅',
                keeperName: 'Капітан Ворон',
                atmosphere: 'Зграї чорних воронів на мурах, запах грози та напружені битви.',
                description: 'Дозорна арена замкової варти.',
                ...createTavernOpponents('tuman_holm_t3', 'Вартова Башта Воронів', 'castle', 3)
            },
            {
                id: 'tuman_holm_t4',
                name: 'Підземелля Горгульї',
                sign: '🗿',
                keeperName: 'Майстер Крістіан',
                atmosphere: 'Кам\'яні статуї, луна кроків та несподівані контрудари суперників.',
                description: 'Арена підземних випробувань.',
                ...createTavernOpponents('tuman_holm_t4', 'Підземелля Горгульї', 'castle', 3)
            }
        ]
    },
    {
        id: 'castle_zolotyi_shpyil',
        name: 'Цитадель «Золотий Шпиль»',
        type: 'castle',
        region: 'Східні Степи',
        x: 86,
        y: 45,
        description: 'Величний золотоверхий замок верховного гетьмана степового краю з панорамою на сотні верст.',
        taverns: [
            {
                id: 'zolotyi_shpyil_t1',
                name: 'Гетьманська Світлиця',
                sign: '👑',
                keeperName: 'Гетьман Богдан',
                atmosphere: 'Золоті булави, козацькі клейноди та найшанованіші полковники.',
                description: 'Елітна резиденція вищого командування.',
                ...createTavernOpponents('zolotyi_shpyil_t1', 'Гетьманська Світлиця', 'castle', 3)
            },
            {
                id: 'zolotyi_shpyil_t2',
                name: 'Шпалерна Зала Полковників',
                sign: '⚔️',
                keeperName: 'Полковник Іван',
                atmosphere: 'Шаблі в срібних піхвах, розмови про військові походи та дуелі на картах.',
                description: 'Штабний офіцерський клуб.',
                ...createTavernOpponents('zolotyi_shpyil_t2', 'Шпалерна Зала Полковників', 'castle', 3)
            },
            {
                id: 'zolotyi_shpyil_t3',
                name: 'Кінна Арена Звитяги',
                sign: '🐎',
                keeperName: 'Осавул Тарас',
                atmosphere: 'Пісок, дзвоники на збруї коней та відчайдушні виклики.',
                description: 'Арена змагань найкращих вершників.',
                ...createTavernOpponents('zolotyi_shpyil_t3', 'Кінна Арена Звитяги', 'castle', 3)
            },
            {
                id: 'zolotyi_shpyil_t4',
                name: 'Скарбниця Фортеці',
                sign: '💰',
                keeperName: 'Скарбник Остап',
                atmosphere: 'Скрині з червінцями, шовки та максимальні грошові ставки.',
                description: 'Гральний зал на високі ставки.',
                ...createTavernOpponents('zolotyi_shpyil_t4', 'Скарбниця Фортеці', 'castle', 3)
            }
        ]
    },
    {
        id: 'castle_smaragdova_vezha',
        name: 'Замок «Смарагдова Вежа»',
        type: 'castle',
        region: 'Південні Долини',
        x: 62,
        y: 74,
        description: 'Розкішний палацовий комплекс серед кипарисових гаїв та фонтанів герцогів Півдня.',
        taverns: [
            {
                id: 'smaragdova_t1',
                name: 'Дзеркальна Зала Герцога',
                sign: '🪞',
                keeperName: 'Герцог Фердинанд',
                atmosphere: 'Золочені дзеркала, мармурові столи та витончені рапіри біля стін.',
                description: 'Зала найвищого дворянства півдня.',
                ...createTavernOpponents('smaragdova_t1', 'Дзеркальна Зала Герцога', 'castle', 3)
            },
            {
                id: 'smaragdova_t2',
                name: 'Оранжерея Троянд',
                sign: '🌹',
                keeperName: 'Графиня Елеонора',
                atmosphere: 'Квітучі кущі троянд, фонтан і тихі стратегічні поєдинки.',
                description: 'Романтичний та вишуканий турнірний куточок.',
                ...createTavernOpponents('smaragdova_t2', 'Оранжерея Троянд', 'castle', 3)
            },
            {
                id: 'smaragdova_t3',
                name: 'Фехтувальна Галерея',
                sign: '🤺',
                keeperName: 'Маестро Доменіко',
                atmosphere: 'Дзвін рапір, шпажні дуелі та висока техніка фехтування.',
                description: 'Академія фехтування та честі.',
                ...createTavernOpponents('smaragdova_t3', 'Фехтувальна Галерея', 'castle', 3)
            },
            {
                id: 'smaragdova_t4',
                name: 'Винні Підвали Замку',
                sign: '🍇',
                keeperName: 'Маркіз Де Анжу',
                atmosphere: 'Старовинні дубові діжки, оксамитові стільці та легендарні вина.',
                description: 'Клуб шанувальників вишуканого відпочинку.',
                ...createTavernOpponents('smaragdova_t4', 'Винні Підвали Замку', 'castle', 3)
            }
        ]
    },
    {
        id: 'castle_orlyne_hnizdo',
        name: 'Цитадель «Орлине Гніздо»',
        type: 'castle',
        region: 'Гірські Кряжі',
        x: 37,
        y: 12,
        description: 'Гірська фортеця на гострому піку, куди веде лише підвісний канатний міст над прірвою.',
        taverns: [
            {
                id: 'orlyne_t1',
                name: 'Зала Вершинного Вітру',
                sign: '🦅',
                keeperName: 'Лорд Артур Високий',
                atmosphere: 'Скляні стіни над хмарами, політ орлів за вікном та запаморочлива висота.',
                description: 'Верховна зала володарів хмарних вершин.',
                ...createTavernOpponents('orlyne_t1', 'Зала Вершинного Вітру', 'castle', 3)
            },
            {
                id: 'orlyne_t2',
                name: 'Кам\'яний Бастіон Грифонів',
                sign: '🛡️',
                keeperName: 'Командир Кайл',
                atmosphere: 'Гнізда грифонів, збруя вершників та сувора виучка воїнів.',
                description: 'Гарнізон крилатих захисників гір.',
                ...createTavernOpponents('orlyne_t2', 'Кам\'яний Бастіон Грифонів', 'castle', 3)
            },
            {
                id: 'orlyne_t3',
                name: 'Хмарна Арена Дуелей',
                sign: '☁️',
                keeperName: 'Чемпіон Даріус',
                atmosphere: 'Майданчик на краю обриву, де кожен крок вимагає абсолютної впевненості.',
                description: 'Арена екстремальних фехтувальних дуелей.',
                ...createTavernOpponents('orlyne_t3', 'Хмарна Арена Дуелей', 'castle', 3)
            },
            {
                id: 'orlyne_t4',
                name: 'Арсенал Гірських Стрільців',
                sign: '🏹',
                keeperName: 'Стрілець Робін',
                atmosphere: 'Композитні луки, гострі наконечники стріл та турніри на влучність.',
                description: 'Клуб влучних стрільців та мисливців.',
                ...createTavernOpponents('orlyne_t4', 'Арсенал Гірських Стрільців', 'castle', 3)
            }
        ]
    }
];

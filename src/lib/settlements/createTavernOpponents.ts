import { OpponentData, CharacterGender, TavernActivityType } from '../../types';
import { generateRandomName, CultureType, getGenderForName, MALE_AVATARS, FEMALE_AVATARS } from '../nameGenerator';

function getStableSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function createTavernOpponents(tavernId: string, tavernName: string, settlementType: 'city' | 'village' | 'hamlet' | 'castle' | 'ruins' | 'graveyard', tierLevel: number = 1): {
    contenders: OpponentData[];
    champions: OpponentData[];
    classicDurakContenders: OpponentData[];
    classicDurakChampions: OpponentData[];
    extendedDurakContenders: OpponentData[];
    extendedDurakChampions: OpponentData[];
    dicePokerContenders: OpponentData[];
    dicePokerChampions: OpponentData[];
    tavernDiceContenders: OpponentData[];
    tavernDiceChampions: OpponentData[];
    toySoldiersContenders: OpponentData[];
    toySoldiersChampions: OpponentData[];
    checkersContenders: OpponentData[];
    checkersChampions: OpponentData[];
    chessStandardContenders: OpponentData[];
    chessStandardChampions: OpponentData[];
    senetContenders: OpponentData[];
    senetChampions: OpponentData[];
    urContenders: OpponentData[];
    urChampions: OpponentData[];
    mehenContenders: OpponentData[];
    mehenChampions: OpponentData[];
    asebContenders: OpponentData[];
    asebChampions: OpponentData[];
    brawlers: OpponentData[];
    brawlChampions: OpponentData[];
    fencingSwordShieldContenders: OpponentData[];
    fencingSwordShieldChampions: OpponentData[];
    fencingSwordOnlyContenders: OpponentData[];
    fencingSwordOnlyChampions: OpponentData[];
    fencingContenders: OpponentData[];
    fencingChampions: OpponentData[];
    archeryContenders: OpponentData[];
    archeryChampions: OpponentData[];
    joustingContenders: OpponentData[];
    joustingChampions: OpponentData[];
    checkersWarContenders: OpponentData[];
    checkersWarChampions: OpponentData[];
} {
    const isGraveyard = settlementType === 'graveyard';
    const usedNamesInTavern = new Set<string>();

    const makeUniqueCharacter = (
        baseSeedStr: string,
        preferredName?: string,
        preferredAvatar?: string,
        culture: CultureType = 'any',
        preferredGender?: CharacterGender
    ): { name: string; gender: CharacterGender; avatar: string } => {
        let gender: CharacterGender = preferredGender || (preferredName ? getGenderForName(preferredName) : ((getStableSeed(baseSeedStr) % 2 === 0) ? 'male' : 'female'));
        
        let avatar = preferredAvatar;
        if (!avatar || avatar === '🥉' || avatar === '🥈' || avatar === '🥇' || avatar === '👑') {
            const avatarPool = gender === 'female' ? FEMALE_AVATARS : MALE_AVATARS;
            avatar = avatarPool[getStableSeed(baseSeedStr) % avatarPool.length];
        }

        if (preferredName && !usedNamesInTavern.has(preferredName)) {
            usedNamesInTavern.add(preferredName);
            return { name: preferredName, gender, avatar };
        }

        let attempt = 0;
        while (attempt < 300) {
            const seed = getStableSeed(`${baseSeedStr}_att_${attempt}`);
            const candidate = generateRandomName(culture, gender, seed);
            if (!usedNamesInTavern.has(candidate)) {
                usedNamesInTavern.add(candidate);
                return { name: candidate, gender, avatar };
            }
            attempt++;
        }

        const fallbackBase = preferredName || generateRandomName(culture, gender, getStableSeed(baseSeedStr));
        const fallback = `${fallbackBase} (${usedNamesInTavern.size + 1})`;
        usedNamesInTavern.add(fallback);
        return { name: fallback, gender, avatar };
    };

    const makeUniqueName = (baseSeedStr: string, preferredName?: string, culture: CultureType = 'any'): string => {
        return makeUniqueCharacter(baseSeedStr, preferredName, undefined, culture).name;
    };

    const humanContenderTemplates = [
        {
            name: 'Грицько Зелений',
            title: 'Шинкарський Учень',
            avatar: '🧑‍🌾',
            difficulty: 'easy' as const,
            quote: 'Я тільки вчуся, але мої козирі ще покажуть себе!',
            desc: 'Місцевий хлопець, який любить ризикнути парою мідяків вечорами.'
        },
        {
            name: 'Богдан Стріла',
            title: 'Лісовий Ренджер',
            avatar: '🏹',
            difficulty: 'easy' as const,
            quote: 'Моє око ніколи не хибить — ні з луком, ні за столом.',
            desc: 'Влучний мисливець, що полюбляє викладати дрібні карти вчасно.'
        },
        {
            name: 'Одарка Знахарка',
            title: 'Травниця з Хутора',
            avatar: '🧕',
            difficulty: 'normal' as const,
            quote: 'Трави бачать твою долю, а мої карти її вирішують.',
            desc: 'Знає таємниці заклять та часто притримує цілющі еліксири.'
        },
        {
            name: 'Михайло Круконіс',
            title: 'Міський Злодюжка',
            avatar: '🗡️',
            difficulty: 'normal' as const,
            quote: 'Те, що лежить на столі, вже майже в моїй кишені!',
            desc: 'Хитрий шулер, що грає на підступах і швидких атаках.'
        },
        {
            name: 'Ярополк Молот',
            title: 'Ветеран Ополчення',
            avatar: '🛡️',
            difficulty: 'normal' as const,
            quote: 'Мій щит тримав удари орди, а твої карти для мене — смішки.',
            desc: 'Завзятий захисник, якого важко пробити навіть старшими мастями.'
        },
        {
            name: 'Василь Бурлака',
            title: 'Мандрівний Найманець',
            avatar: '⚔️',
            difficulty: 'hard' as const,
            quote: 'Золото дзвонить — меч служить, а карти приносять здобич!',
            desc: 'Бував у десятках битв, прораховує ходи суперника на два кроки вперед.'
        },
        {
            name: 'Любава Віщунка',
            title: 'Таємнича Картярка',
            avatar: '🔮',
            difficulty: 'hard' as const,
            quote: 'Кожна карта має душу. Твої вже благають про пощаду.',
            desc: 'Майстерно використовує спеціальні карти та чаклунські прийоми.'
        },
        {
            name: 'Остап Лихий',
            title: 'Голова Картярів',
            avatar: '🦹',
            difficulty: 'hard' as const,
            quote: 'Останній бар\'єр перед чемпіонами! Далі ти не пройдеш!',
            desc: 'Найдосвідченіший серед шукачів слави. Володіє повною колодою хитрощів.'
        }
    ];

    const graveyardContenderTemplates = [
        {
            name: 'Скелет-Воїн',
            title: 'Невпокоєний Мертвець',
            avatar: '💀',
            difficulty: 'easy' as const,
            quote: 'Стукіт моїх кісток — це останній звук, який ти почуєш на цьому цвинтарі!',
            desc: 'Стародавній скелет у напівзігнилих лицарських обладунках.'
        },
        {
            name: 'Гнилий Зомбі',
            title: 'Потворний Мертвець',
            avatar: '🧟',
            difficulty: 'easy' as const,
            quote: 'Мозок... Жоден живий не залишить цей погост без бою!',
            desc: 'Відроджений мертвець, що виліз із розритої могили.'
        },
        {
            name: 'Могильний Гуль',
            title: 'Подагричний Пожирач Трупів',
            avatar: '👹',
            difficulty: 'normal' as const,
            quote: 'Свіжа кров та кістки завітали на наші могильні плити!',
            desc: 'Спекотний та кровожерливий монстр, що живе в склепах.'
        },
        {
            name: 'Привид Забутого Лицаря',
            title: 'Дух Палаючого Склепу',
            avatar: '👻',
            difficulty: 'normal' as const,
            quote: 'Я бився за ці землі триста років тому, і мій дух прагне бою!',
            desc: 'Безтілесний привид у примарних лицарських обладунках.'
        },
        {
            name: 'Некромант-Учень',
            title: 'Темний Маг Тіней',
            avatar: '🧙‍♂️',
            difficulty: 'normal' as const,
            quote: 'Мої закляття піднімають армію скелетів із глибин земляних могил!',
            desc: 'Чернець у чорному балахоні, що керує нежиттю.'
        },
        {
            name: 'Проклятий Лицар Смерті',
            title: 'Темний Воїн Погосту',
            avatar: '🗡️',
            difficulty: 'hard' as const,
            quote: 'Мій проклятий меч загартований у вогні пекла та некрополя!',
            desc: 'Павший лицар, оживлений темною магією.'
        },
        {
            name: 'Вампір-Кровопивця',
            title: 'Нічний Володар Склепу',
            avatar: '🦇',
            difficulty: 'hard' as const,
            quote: 'Твоя гаряча пульсуюча кров освіжить мій столітній сон!',
            desc: 'Древній вампір із гострими іклами та магією крові.'
        },
        {
            name: 'Стародавній Лич-Повелитель',
            title: 'Володар Могильної Магії',
            avatar: '🔮',
            difficulty: 'hard' as const,
            quote: 'Смерть — це лише початок моєї вічної могутності!',
            desc: 'Безсмертний некромант-лич, закоханий у магію нежиті.'
        }
    ];

    const contenderTemplates = isGraveyard ? graveyardContenderTemplates : humanContenderTemplates;

    const humanChampionTemplates = [
        {
            rank: 3,
            name: 'Ратибор Залізний',
            title: '🥉 3-тє місце: Бронзовий Картяр',
            avatar: '🥉',
            difficulty: 'hard' as const,
            quote: 'Бронзовий пояс — це лише мій мінімум. Твоя пригода закінчується тут!',
            desc: 'Третій найсильніший гравець закладу. Бездоганно тримає козирі до вирішальної миті.',
            hp: 520,
            armor: 220,
            power: 2
        },
        {
            rank: 2,
            name: 'Магістр Іларіон',
            title: '🥈 2-ге місце: Срібний Чаклун Карт',
            avatar: '🥈',
            difficulty: 'expert' as const,
            quote: 'Карткова магія — точна наука. Ти робиш помилки там, де я бачу перемогу.',
            desc: 'Другий майстер таверни. Використовує посилення очками сили та нищівні контрвипади.',
            hp: 550,
            armor: 250,
            power: 3
        },
        {
            rank: 1,
            name: 'Воєвода Святослав Непереможний',
            title: '🥇 1-ше місце: Золотий Гросмейстер Таверни',
            avatar: '👑',
            difficulty: 'master' as const,
            quote: 'Я володар цього столу й цієї таверни! Поклонися справжньому королю карт!',
            desc: 'Абсолютний чемпіон закладу. Перемога над ним приносить вічну славу та титул підкорювача!',
            hp: 600,
            armor: 300,
            power: 4
        }
    ];

    const graveyardChampionTemplates = [
        {
            rank: 3,
            name: 'Броніслав Зомбі-Титан',
            title: '🥉 3-тє місце: Бронзовий Гігант Нежиті',
            avatar: '🥉',
            difficulty: 'hard' as const,
            quote: 'Я велетенський зомбі, що трощить могильні плити одним подихом!',
            desc: 'Третій чемпіон нежиті на цьому цвинтарі.',
            hp: 580,
            armor: 250,
            power: 2
        },
        {
            rank: 2,
            name: 'Король Скелетів Мордохай',
            title: '🥈 2-ге місце: Срібний Повелитель Костей',
            avatar: '🥈',
            difficulty: 'expert' as const,
            quote: 'Уся нежить цього цвинтаря схиляється перед моїм кістяним скіпетром!',
            desc: 'Другий чемпіон некрополя, майстер нищівних примарних ударів.',
            hp: 630,
            armor: 290,
            power: 3
        },
        {
            rank: 1,
            name: 'Великий Лич Король Смерті',
            title: '🥇 1-ше місце: Золотий Володар Некрополя',
            avatar: '👑',
            difficulty: 'master' as const,
            quote: 'Я абсолютний володар цвинтаря та повелитель мерців! Твоя душа належатиме нежиті!',
            desc: 'Абсолютний чемпіон цвинтаря. Перемога над ним очищує кладовище від темного прокляття!',
            hp: 700,
            armor: 340,
            power: 4
        }
    ];

    const championTemplates = isGraveyard ? graveyardChampionTemplates : humanChampionTemplates;

    // Dedicated Fist Brawler NPCs
    const brawlerTemplates = [
        {
            name: 'Гнат Залізняк',
            title: 'Підручний Коваля',
            avatar: '🔨',
            difficulty: 'easy' as const,
            quote: 'Мої кулаки кують залізо, а з твоїх ребер зроблять підкову!',
            desc: 'Міцний юнак із кузні з мозолистими руками. Б\'є просто, але важко.',
            baseHp: 80,
            strength: 14,
            agility: 8
        },
        {
            name: 'Тиміш Дубовий',
            title: 'Лісоруб-Гігант',
            avatar: '🪓',
            difficulty: 'easy' as const,
            quote: 'Я валив столітні дуби голими руками. Твій блок трісне як тріска!',
            desc: 'Здоровань з лісопилки. Має величезний розмах рук і міцний захист торсу.',
            baseHp: 95,
            strength: 18,
            agility: 7
        },
        {
            name: 'Кузьма Шибайголова',
            title: 'П\'яний Матрос',
            avatar: '⚓',
            difficulty: 'normal' as const,
            quote: 'Хитає мене від хмелю, але правий хук летить рівно в щелепу!',
            desc: 'Бувалий моряк. Рухається непередбачувано й часто цілить прямо в голову.',
            baseHp: 110,
            strength: 20,
            agility: 11
        },
        {
            name: 'Марко Кабан',
            title: 'Шинковий Вибивала',
            avatar: '🐗',
            difficulty: 'normal' as const,
            quote: 'Хто шукає бійки в нашій таверні — вилітає через вікно носом у багнюку!',
            desc: 'Ветеран тавернових сутичок. Вміє вчасно блокувати удари в корпус.',
            baseHp: 125,
            strength: 24,
            agility: 10
        },
        {
            name: 'Данило Блискавка',
            title: 'Вуличний Кулачник',
            avatar: '🥊',
            difficulty: 'normal' as const,
            quote: 'Ти навіть не помітиш, як отримаєш двійку в щелепу й підсічку по ногах!',
            desc: 'Спритний боєць із міських нетрів. Має високу швидкість і вміє ухилятися.',
            baseHp: 130,
            strength: 22,
            agility: 16
        },
        {
            name: 'Тарас Лютий',
            title: 'Колишній Берсерк',
            avatar: '🪖',
            difficulty: 'hard' as const,
            quote: 'Біль тільки розпалює мою лють! Спробуй встояти після мого прямого!',
            desc: 'Шалений воїн, який не зважає на пропущені удари та йде напролом.',
            baseHp: 150,
            strength: 30,
            agility: 12
        },
        {
            name: 'Омелян Скеля',
            title: 'Каменяр-Важковаговик',
            avatar: '🗿',
            difficulty: 'hard' as const,
            quote: 'Об мої груди ламалися дубові кийки! Твої удари для мене — комарині укуси!',
            desc: 'Непохитний велетень із кам\'яних кар\'єрів з колосальним запасом здоров\'я.',
            baseHp: 175,
            strength: 34,
            agility: 9
        },
        {
            name: 'Гордій Вепр',
            title: 'Голова Бійцівського Кола',
            avatar: '👹',
            difficulty: 'hard' as const,
            quote: 'Останній бар\'єр перед ринговими чемпіонами! Покажи, чи вартий ти вийти на легенд!',
            desc: 'Найдосвідченіший кулачник серед місцевих бійців. Володіє нищівною серією ударів.',
            baseHp: 190,
            strength: 38,
            agility: 14
        }
    ];

    const brawlChampionTemplates = [
        {
            rank: 3,
            name: 'Броніслав Залізний Лікоть',
            title: '🥉 3-тє місце: Бронзовий Громила Рингу',
            avatar: '🥉',
            difficulty: 'hard' as const,
            quote: 'Мій удар ліктем ламає будь-який блок! Твоя голова довго дзвенітиме!',
            desc: 'Третій чемпіон бійцівського рингу таверни. Спеціалізується на нищівних ударах у голову.',
            baseHp: 210,
            strength: 44,
            agility: 15
        },
        {
            rank: 2,
            name: 'Яромир Громовий Кулак',
            title: '🥈 2-ге місце: Срібний Титан Таверни',
            avatar: '🥈',
            difficulty: 'expert' as const,
            quote: 'Швидкість блискавки, міць грому! Я поклав сотні бійців на ці дошки!',
            desc: 'Другий чемпіон рингу. Поєднує високу силу та спритність, майже не піддається блокуванню.',
            baseHp: 240,
            strength: 52,
            agility: 18
        },
        {
            rank: 1,
            name: 'Любомир Ведмідь-Людожер',
            title: '🥇 1-ше місце: Золотий Король Кулака',
            avatar: '👑',
            difficulty: 'master' as const,
            quote: 'У цій таверні я абсолютний король кулачного бою! Жоден сміливець не пішов звідси на своїх двох!',
            desc: 'Абсолютний чемпіон кулачного рингу. Перемога над ним робить вас легендою таверни!',
            baseHp: 280,
            strength: 62,
            agility: 20
        }
    ];

    const fencingTemplates = [
        {
            name: 'Юліан Шпажист',
            title: 'Учень Гільдії Фехтувальників',
            avatar: '🤺',
            difficulty: 'easy' as const,
            quote: 'Мій клинок ще легкий, але швидкий! Покажи свій випад!',
            desc: 'Юний дуелянт, що тренує базові стійки та захисні парирування.',
            baseHp: 80,
            strength: 14,
            agility: 13
        },
        {
            name: 'Радомир Бистрий Клинок',
            title: 'Майстер Швидких Випадів',
            avatar: '🗡️',
            difficulty: 'easy' as const,
            quote: 'Хто покладається лише на силу — той падає від одного точного уколу!',
            desc: 'Спритний фехтувальник, який полюбляє швидкі випади в ноги та тулуб.',
            baseHp: 95,
            strength: 16,
            agility: 15
        },
        {
            name: 'Любава Залізна Діва',
            title: 'Войовниця з Палашем та Щитом',
            avatar: '🛡️',
            difficulty: 'normal' as const,
            quote: 'Мій щит не здолати жодним ударом, а палаш карає за кожну помилку!',
            desc: 'Досвідчена войовниця в кольчузі з важким дубовим щитом.',
            baseHp: 115,
            strength: 22,
            agility: 11
        },
        {
            name: 'Ольгерд Брейтер',
            title: 'Ветеран Дуелей Честі',
            avatar: '⚔️',
            difficulty: 'normal' as const,
            quote: 'Десятки дуелей на світанку навчили мене відчувати рух ворожого вістря.',
            desc: 'Шляхетний дуелянт, який віртуозно володіє мечем без щита.',
            baseHp: 130,
            strength: 25,
            agility: 14
        },
        {
            name: 'Мирослав Сталевий Щит',
            title: 'Вартовий Міської Брами',
            avatar: '🛡️',
            difficulty: 'normal' as const,
            quote: 'Стійка непохитна, захист бездоганний. Спробуй пробити мій блок!',
            desc: 'Гарнізонний мечник, який майстерно прикривається щитом від випадів у голову.',
            baseHp: 150,
            strength: 29,
            agility: 13
        },
        {
            name: 'Тарас Січовий Шабельник',
            title: 'Віртуоз Козацької Шаблі',
            avatar: '⚡',
            difficulty: 'hard' as const,
            quote: 'Шабля свистить, як вітер у степу! Парируй, якщо встигнеш оком змигнути!',
            desc: 'Майстер шабельного бою, чиї випади наносять страшні поранення.',
            baseHp: 165,
            strength: 34,
            agility: 18
        },
        {
            name: 'Войтек Лев\'яче Серце',
            title: 'Мандрівний Лицар Турнірів',
            avatar: '🦁',
            difficulty: 'hard' as const,
            quote: 'Честь і залізо! На лицарських аренах я бився з найкращими клинками континенту!',
            desc: 'Загартований ветеран лицарських турнірів у повному обладунку з мечем та щитом.',
            baseHp: 185,
            strength: 38,
            agility: 16
        },
        {
            name: 'Казимир Блискавичний',
            title: 'Гроза Фехтувальних Залів',
            avatar: '🦅',
            difficulty: 'hard' as const,
            quote: 'Один хибний рух — і мій клинок біля твого горла! Доведи, що гідний битися з чемпіонами!',
            desc: 'Непереможний майстер дуелей честі, останній суперник перед трійкою чемпіонів.',
            baseHp: 200,
            strength: 42,
            agility: 19
        }
    ];

    const fencingChampionTemplates = [
        {
            rank: 3,
            name: 'Лицар Броніслав Буревій',
            title: '🥉 3-тє місце: Бронзовий Майстер Меча',
            avatar: '🥉',
            difficulty: 'hard' as const,
            quote: 'Мій меч трощить захист, а щит відбиває будь-яку зброю! Готуйся до справжнього бою!',
            desc: 'Третій чемпіон турніру фехтування. Використовує міцну стійку меч і щит.',
            baseHp: 220,
            strength: 46,
            agility: 17
        },
        {
            rank: 2,
            name: 'Барон Вальдемар фон Клінген',
            title: '🥈 2-ге місце: Срібний Гранд-Дуелянт',
            avatar: '🥈',
            difficulty: 'expert' as const,
            quote: 'Мистецтво клинка — це поезія сталі! Я розіб\'ю твою оборону за лічені секунди!',
            desc: 'Другий чемпіон фехтувальної зали. Майстер смертоносних випадів без щита.',
            baseHp: 250,
            strength: 54,
            agility: 20
        },
        {
            rank: 1,
            name: 'Королівський Маршал Святополк',
            title: '🥇 1-ше місце: Золотий Клинок Корони',
            avatar: '👑',
            difficulty: 'master' as const,
            quote: 'Я очолював королівську гвардію та перемагав у сотнях дуелей! Здолай мене — і твоє ім\'я впишуть у хроніки лицарства!',
            desc: 'Абсолютний володар золотого клинка таверни. Легенда лицарського фехтування континенту!',
            baseHp: 290,
            strength: 65,
            agility: 22
        }
    ];

    const mult = (settlementType === 'city' || settlementType === 'castle') ? 1.5 : ((settlementType === 'village' || settlementType === 'ruins' || settlementType === 'graveyard') ? 1.2 : 1.0);

    const contenders: OpponentData[] = contenderTemplates.map((t, idx) => {
        const char = makeUniqueCharacter(tavernId + 'card_contender' + idx, t.name, t.avatar);
        return {
            id: `${tavernId}_card_contender_${idx + 1}`,
            name: char.name,
            gender: char.gender,
            title: t.title,
            avatar: char.avatar,
            type: 'contender',
            rank: idx + 1,
            difficulty: t.difficulty,
            flavorQuote: t.quote,
            description: t.desc,
            hp: Math.round((450 + idx * 10) * mult),
            armor: Math.round((180 + idx * 5) * mult),
            powerPoints: idx >= 4 ? 2 : 1,
            baseHp: Math.round((70 + idx * 8) * mult),
            strength: Math.round((12 + idx * 2.5) * mult),
            agility: Math.round((7 + idx * 1.2) * mult),
            rewards: {
                gold: Math.round((60 + idx * 25) * mult),
                powerPoints: idx >= 5 ? 2 : 1,
                reputation: Math.round((15 + idx * 5) * mult),
                xp: Math.round((70 + idx * 15) * mult)
            }
        };
    });

    const champions: OpponentData[] = championTemplates.map(c => {
        const char = makeUniqueCharacter(tavernId + 'card_champion' + c.rank, c.name, c.avatar);
        return {
            id: `${tavernId}_card_champion_${c.rank}`,
            name: char.name,
            gender: char.gender,
            title: c.title,
            avatar: char.avatar,
            type: 'champion',
            rank: c.rank,
            difficulty: c.difficulty,
            flavorQuote: c.quote,
            description: c.desc,
            hp: Math.round(c.hp * mult),
            armor: Math.round(c.armor * mult),
            powerPoints: c.power,
            baseHp: Math.round((c.rank === 1 ? 220 : (c.rank === 2 ? 180 : 150)) * mult),
            strength: Math.round((c.rank === 1 ? 60 : (c.rank === 2 ? 45 : 35)) * mult),
            agility: Math.round((c.rank === 1 ? 19 : (c.rank === 2 ? 16 : 14)) * mult),
            rewards: {
                gold: Math.round((300 + (4 - c.rank) * 150) * mult),
                powerPoints: (4 - c.rank) + 1,
                reputation: Math.round((80 + (4 - c.rank) * 40) * mult),
                xp: Math.round((200 + (4 - c.rank) * 80) * mult)
            }
        };
    });

    const brawlers: OpponentData[] = brawlerTemplates.map((t, idx) => {
        const baseHp = Math.round(t.baseHp * mult);
        const strength = Math.round(t.strength * mult);
        const agility = Math.round(t.agility * mult);
        const char = makeUniqueCharacter(tavernId + 'brawl_fighter' + idx, t.name, t.avatar);
        return {
            id: `${tavernId}_brawl_fighter_${idx + 1}`,
            name: char.name,
            gender: char.gender,
            title: t.title,
            avatar: char.avatar,
            type: 'contender',
            rank: idx + 1,
            difficulty: t.difficulty,
            flavorQuote: t.quote,
            description: t.desc,
            hp: Math.round((450 + idx * 10) * mult),
            armor: Math.round((180 + idx * 5) * mult),
            powerPoints: idx >= 4 ? 2 : 1,
            baseHp,
            strength,
            agility,
            rewards: {
                gold: Math.round((70 + idx * 30) * mult),
                powerPoints: idx >= 5 ? 2 : 1,
                reputation: Math.round((20 + idx * 6) * mult),
                xp: Math.round((90 + idx * 20) * mult)
            }
        };
    });

    const brawlChampions: OpponentData[] = brawlChampionTemplates.map(c => {
        const baseHp = Math.round(c.baseHp * mult);
        const strength = Math.round(c.strength * mult);
        const agility = Math.round(c.agility * mult);
        const char = makeUniqueCharacter(tavernId + 'brawl_champion' + c.rank, c.name, c.avatar);
        return {
            id: `${tavernId}_brawl_champion_${c.rank}`,
            name: char.name,
            gender: char.gender,
            title: c.title,
            avatar: char.avatar,
            type: 'champion',
            rank: c.rank,
            difficulty: c.difficulty,
            flavorQuote: c.quote,
            description: c.desc,
            hp: Math.round((c.rank === 1 ? 600 : (c.rank === 2 ? 550 : 520)) * mult),
            armor: Math.round((c.rank === 1 ? 300 : (c.rank === 2 ? 250 : 220)) * mult),
            powerPoints: (4 - c.rank) + 1,
            baseHp,
            strength,
            agility,
            rewards: {
                gold: Math.round((350 + (4 - c.rank) * 160) * mult),
                powerPoints: (4 - c.rank) + 2,
                reputation: Math.round((90 + (4 - c.rank) * 45) * mult),
                xp: Math.round((220 + (4 - c.rank) * 90) * mult)
            }
        };
    });

    const helperMakeRoster = (
        prefix: string,
        contendersData: { name: string; title: string; avatar: string; difficulty: 'easy' | 'normal' | 'hard' | 'expert'; quote: string; desc: string }[],
        championsData: { rank: number; name: string; title: string; avatar: string; difficulty: 'hard' | 'expert' | 'master'; quote: string; desc: string; hp: number; armor: number; power: number }[]
    ) => {
        const cList: OpponentData[] = contendersData.map((t, idx) => {
            const char = makeUniqueCharacter(tavernId + prefix + 'contender' + idx, t.name, t.avatar);
            return {
                id: `${tavernId}_${prefix}_contender_${idx + 1}`,
                name: char.name,
                gender: char.gender,
                title: t.title,
                avatar: char.avatar,
                type: 'contender',
                rank: idx + 1,
                difficulty: t.difficulty,
                flavorQuote: t.quote,
                description: t.desc,
                hp: Math.round((450 + idx * 10) * mult),
                armor: Math.round((180 + idx * 5) * mult),
                powerPoints: idx >= 4 ? 2 : 1,
                baseHp: Math.round((70 + idx * 8) * mult),
                strength: Math.round((12 + idx * 2.5) * mult),
                agility: Math.round((7 + idx * 1.2) * mult),
                rewards: {
                    gold: Math.round((60 + idx * 25) * mult),
                    powerPoints: idx >= 5 ? 2 : 1,
                    reputation: Math.round((15 + idx * 5) * mult),
                    xp: Math.round((70 + idx * 15) * mult)
                }
            };
        });

        const chList: OpponentData[] = championsData.map(c => {
            const char = makeUniqueCharacter(tavernId + prefix + 'champion' + c.rank, c.name, c.avatar);
            return {
                id: `${tavernId}_${prefix}_champion_${c.rank}`,
                name: char.name,
                gender: char.gender,
                title: c.title,
                avatar: char.avatar,
                type: 'champion',
                rank: c.rank,
                difficulty: c.difficulty,
                flavorQuote: c.quote,
                description: c.desc,
                hp: Math.round(c.hp * mult),
                armor: Math.round(c.armor * mult),
                powerPoints: c.power,
                baseHp: Math.round((c.rank === 1 ? 220 : (c.rank === 2 ? 180 : 150)) * mult),
                strength: Math.round((c.rank === 1 ? 60 : (c.rank === 2 ? 45 : 35)) * mult),
                agility: Math.round((c.rank === 1 ? 19 : (c.rank === 2 ? 16 : 14)) * mult),
                rewards: {
                    gold: Math.round((300 + (4 - c.rank) * 150) * mult),
                    powerPoints: (4 - c.rank) + 1,
                    reputation: Math.round((80 + (4 - c.rank) * 40) * mult),
                    xp: Math.round((200 + (4 - c.rank) * 80) * mult)
                }
            };
        });

        return { cList, chList };
    };

    // 2. Classic Durak (36 cards)
    const durak36ContendersData = [
        { name: 'Панас Швидкорукий', title: 'Картярський Підручний', avatar: '🃏', difficulty: 'easy' as const, quote: 'Головне — швидко підкинути пару шісток!', desc: 'Місцевий хлопець, що любить швидку гру.' },
        { name: 'Степан Козирний', title: 'Знавець Мастей', avatar: '♠️', difficulty: 'easy' as const, quote: 'Козирна дама ніколи не підводить мого розрахунку.', desc: 'Ретельно рахує козирі суперника.' },
        { name: 'Варвара Хватка', title: 'Шинкарська Роздавальниця', avatar: '👩‍🦰', difficulty: 'normal' as const, quote: 'У моїх руках навіть сімка б\'є короля!', desc: 'Майстерно підкидає однакові номінали.' },
        { name: 'Дмитро Перевідний', title: 'Майстер Відбою', avatar: '🎩', difficulty: 'normal' as const, quote: 'Бито чи взяти? Скоро сам побачиш!', desc: 'Змушує суперника брати повну руку карт.' },
        { name: 'Олесь Пильне Око', title: 'Картковий Лічильник', avatar: '🧐', difficulty: 'normal' as const, quote: 'Я пам\'ятаю кожну карту, що пішла у відбій.', desc: 'Безпомилково прораховує залишок колоди.' },
        { name: 'Зоряна Хитра', title: 'Королева Підкидання', avatar: '💃', difficulty: 'hard' as const, quote: 'Один невірний захист — і ти забрав увесь стіл!', desc: 'Атакує безжально серіями по 3-4 карти.' },
        { name: 'Корній Безжалісний', title: 'Ветеран Зеленого Сукна', avatar: '🧔', difficulty: 'hard' as const, quote: 'За цим столом дурнями ставали навіть бояри.', desc: 'Досвідчений картяр з сорокарічним стажем.' },
        { name: 'Захар Тузовий', title: 'Голова Класичного Столу', avatar: '🎴', difficulty: 'hard' as const, quote: 'Останнє випробування перед майстрами колоди!', desc: 'Не залишає шансів гравцям, що неуважно захищаються.' }
    ];
    const durak36ChampionsData = [
        { rank: 3, name: 'Гордій Бронзовий Туз', title: '🥉 3-тє місце: Бронзовий Майстер 36 Карт', avatar: '🥉', difficulty: 'hard' as const, quote: 'Твої карти вже горять у моїх руках!', desc: 'Третій гросмейстер класичного дурака.', hp: 500, armor: 200, power: 2 },
        { rank: 2, name: 'Соломія Срібна Піка', title: '🥈 2-ге місце: Срібна Володарка Козирів', avatar: '🥈', difficulty: 'expert' as const, quote: 'Козирна масть підкоряється моїй волі!', desc: 'Другий майстер таверни з бездоганною пам\'яттю карт.', hp: 550, armor: 250, power: 3 },
        { rank: 1, name: 'Всеволод Золотий Король', title: '🥇 1-ше місце: Золотий Король Дурака', avatar: '👑', difficulty: 'master' as const, quote: 'Я ніколи не залишаюся в дурнях! Покажи свою майстерність!', desc: 'Абсолютний чемпіон класичної гри.', hp: 600, armor: 300, power: 4 }
    ];

    // 3. Extended Durak (52 cards)
    const durak52ContendersData = [
        { name: 'Жан Заморський', title: 'Французький Гість', avatar: '🧑‍🎨', difficulty: 'easy' as const, quote: 'Велика колода з двійками вимагає вишуканого стилю!', desc: 'Мандрівник з далеких земель з колодою 52 карт.' },
        { name: 'Орися Двійкова', title: 'Ловителька Дрібних Карт', avatar: '👧', difficulty: 'easy' as const, quote: 'Двійка чи трійка на старті — ключ до перемоги.', desc: 'Вправно очищує руку від дрібних карт.' },
        { name: 'Кирило Чотиримастний', title: 'Знавець Великої Колоди', avatar: '🧮', difficulty: 'normal' as const, quote: '52 карти — це 52 можливості залишити тебе в дурнях!', desc: 'Любить затяжні тактичні партії.' },
        { name: 'Тетяна Дзвінка', title: 'Бубнова Фаворитка', avatar: '♦️', difficulty: 'normal' as const, quote: 'Бубни завжди приносять мені удачу.', desc: 'Грає виключно за математичним розрахунком.' },
        { name: 'Артем Довгорук', title: 'Шулер 52 Карт', avatar: '🕵️', difficulty: 'normal' as const, quote: 'Спробуй відбити атаку з п\'яти карт одразу!', desc: 'Спеціалізується на масованих підкиданнях.' },
        { name: 'Меланія Валет', title: 'Пані Картярської Гільдії', avatar: '👑', difficulty: 'hard' as const, quote: 'Туз б\'є все, крім мого козиря!', desc: 'Зберігає сильні козирі до останніх ходів.' },
        { name: 'Марко Кардинал', title: 'Гросмейстер 52 Карт', avatar: '🧙', difficulty: 'hard' as const, quote: 'Велика колода не прощає жодної поспішної карти.', desc: 'Вміє перевернути партію навіть з 15 картами на руках.' },
        { name: 'Лука Непохитний', title: 'Картярський Страж', avatar: '🧛', difficulty: 'hard' as const, quote: 'Фінальний крок до королів великої колоди!', desc: 'Видатний знавець гри на 52 карти.' }
    ];
    const durak52ChampionsData = [
        { rank: 3, name: 'Северин Бронзовий Джокер', title: '🥉 3-тє місце: Бронзовий Лорд 52 Карт', avatar: '🥉', difficulty: 'hard' as const, quote: 'Велика колода — мій рідний дім!', desc: 'Третій чемпіон закладу у грі на 52 карти.', hp: 500, armor: 200, power: 2 },
        { rank: 2, name: 'Віолетта Срібна Дама', title: '🥈 2-ге місце: Срібна Герцогиня Мастей', avatar: '🥈', difficulty: 'expert' as const, quote: 'Я керую всіма 52 картами як своєю свитою!', desc: 'Другий майстер таверни у розширеному дураку.', hp: 550, armor: 250, power: 3 },
        { rank: 1, name: 'Август Золотий Туз', title: '🥇 1-ше місце: Золотий Імператор 52 Карт', avatar: '👑', difficulty: 'master' as const, quote: 'Ніхто в цьому краї не здатен обіграти мене на повній колоді!', desc: 'Абсолютний чемпіон великої колоди.', hp: 600, armor: 300, power: 4 }
    ];

    // 4. Dice Poker
    const dicePokerContendersData = [
        { name: 'Юрко Костяний', title: 'Шинкарський Метальник', avatar: '🎲', difficulty: 'easy' as const, quote: 'Пара шісток — і золото в моїй кишені!', desc: 'Любить ризикувати на перекиданнях.' },
        { name: 'Ганна Пара', title: 'Любителька Двійних Пар', avatar: '👩', difficulty: 'easy' as const, quote: 'Стабільні дві пари краще за непевний стріт.', desc: 'Завжди фіксує надійні комбінації.' },
        { name: 'Орест Трійка', title: 'Майстер Сетів', avatar: '🧔', difficulty: 'normal' as const, quote: 'Три трійки відкривають шлях до фулл-хаусу!', desc: 'Вміло будує складні комбінації.' },
        { name: 'Катерина Стріт', title: 'Шукачка Послідовностей', avatar: '✨', difficulty: 'normal' as const, quote: '1-2-3-4-5 — краса чисел у дії!', desc: 'Часто збирає малі та великі стріти.' },
        { name: 'Роман Каре', title: 'Мисливець за Четвірками', avatar: '🤠', difficulty: 'normal' as const, quote: 'Чотири однакові кістки не лишають надії опоненту!', desc: 'Ризиковий та азартний гравець у покер.' },
        { name: 'Злата Фулл-Хаус', title: 'Володарка Повного Дому', avatar: '🧝‍♀️', difficulty: 'hard' as const, quote: 'Трійка плюс пара — мій улюблений смак перемоги.', desc: 'Вміє оцінювати ймовірності кидка.' },
        { name: 'Тимур П\'ять Граней', title: 'Ветеран Костяного Покеру', avatar: '🧙‍♂️', difficulty: 'hard' as const, quote: 'Я бачу результат ще до того, як кубики зупиняться.', desc: 'Досвідчений майстер тавернного покеру.' },
        { name: 'Борис Покерний', title: 'Страж Костяного Столу', avatar: '🦹‍♂️', difficulty: 'hard' as const, quote: 'Тільки найкращі комбінації дадуть тобі право грати з чемпіонами!', desc: 'Останній бар\'єр перед костяними королями.' }
    ];
    const dicePokerChampionsData = [
        { rank: 3, name: 'Данило Бронзовий Стріт', title: '🥉 3-тє місце: Бронзовий Майстер Покеру', avatar: '🥉', difficulty: 'hard' as const, quote: 'Мої кубики знають точну геометрію успіху!', desc: 'Третій чемпіон покеру на костях.', hp: 500, armor: 200, power: 2 },
        { rank: 2, name: 'Клара Срібне Каре', title: '🥈 2-ге місце: Срібна Королева Фулл-Хаусу', avatar: '🥈', difficulty: 'expert' as const, quote: 'Чотири однакових — це мій звичайний перший кидок!', desc: 'Другий майстер костяного столу.', hp: 550, armor: 250, power: 3 },
        { rank: 1, name: 'Аркадій Золотий Покер', title: '🥇 1-ше місце: Золотий Володар 5 Кубиків', avatar: '👑', difficulty: 'master' as const, quote: 'Я викидаю 5 однакових із заплющеними очима! Спробуй перевершити!', desc: 'Абсолютний чемпіон покеру на костях.', hp: 600, armor: 300, power: 4 }
    ];

    // 5. Tavern Simple Dice
    const tavernDiceContendersData = [
        { name: 'Микола Стаканник', title: 'Шинкарський Кидач', avatar: '🥤', difficulty: 'easy' as const, quote: 'Шкіряний стакан ніколи не обманює!', desc: 'Любить швидкі парі на костях.' },
        { name: 'Іванка Щаслива', title: 'Улюблениця Фортуни', avatar: '🍀', difficulty: 'easy' as const, quote: 'Сьогодні мій день для високих сум!', desc: 'Викидає стабільно високі значення.' },
        { name: 'Петро Три Шістки', title: 'Азартний Мідячник', avatar: '🔥', difficulty: 'normal' as const, quote: '18 очок на трьох кубиках — і золото моє!', desc: 'Гравець на максимальну суму.' },
        { name: 'Марфа Кругова', title: 'Майстриня Чаші', avatar: '👵', difficulty: 'normal' as const, quote: 'Один рух зап\'ястя — і кістки лягають як треба.', desc: 'Вміє правильно розкручувати стакан.' },
        { name: 'Валентин Гранитель', title: 'Володар Кидків', avatar: '🎯', difficulty: 'normal' as const, quote: 'Хто кидає впевнено, той завжди забирає банк.', desc: 'Тактик тавернних дуелей на костях.' },
        { name: 'Софія Нестримна', title: 'Королева Азарту', avatar: '💃', difficulty: 'hard' as const, quote: 'Ризик — це єдине, що робить гру солодкою!', desc: 'Перемагає у вирішальних раундах.' },
        { name: 'Гліб Кам\'яний', title: 'Старий Гравець', avatar: '🗿', difficulty: 'hard' as const, quote: 'Я бачив тисячі кидків. Мене важко здивувати.', desc: 'Непохитний майстер простих костей.' },
        { name: 'Максим Кубикар', title: 'Голова Столу Костей', avatar: '🛡️', difficulty: 'hard' as const, quote: 'Останній кидок перед чемпіонами чаші!', desc: 'Найсильніший суперник серед претендентів.' }
    ];
    const tavernDiceChampionsData = [
        { rank: 3, name: 'Федір Бронзова Грань', title: '🥉 3-тє місце: Бронзовий Кидач Костей', avatar: '🥉', difficulty: 'hard' as const, quote: 'Три кубики в моїх руках не знають поразки!', desc: 'Третій чемпіон простих костей.', hp: 500, armor: 200, power: 2 },
        { rank: 2, name: 'Регіна Срібна Чаша', title: '🥈 2-ге місце: Срібна Жриця Граней', avatar: '🥈', difficulty: 'expert' as const, quote: 'Шкіряний стакан підкоряється моєму шепоту!', desc: 'Другий майстер костяної дуелі.', hp: 550, armor: 250, power: 3 },
        { rank: 1, name: 'Осип Золота Кістка', title: '🥇 1-ше місце: Золотий Король Костей', avatar: '👑', difficulty: 'master' as const, quote: 'Я володар найвищих сум у цій таверні! Кидай свої кубики!', desc: 'Абсолютний чемпіон гри в кості.', hp: 600, armor: 300, power: 4 }
    ];

    // 6. Checkers
    const checkersContendersData = [
        { name: 'Ярослав Пішак', title: 'Любитель Діагоналей', avatar: '♟️', difficulty: 'easy' as const, quote: 'Один крок по діагоналі — і я вже за твоїми плечима!', desc: 'Початківець шашкової науки.' },
        { name: 'Надія Світла', title: 'Шашкова Тактикиня', avatar: '👧', difficulty: 'easy' as const, quote: 'Білі шашки завжди мають перевагу першого ходу.', desc: 'Впевнено тримає центр дошки.' },
        { name: 'Борис Стрибун', title: 'Майстер Подвійних Взяттів', avatar: '🦘', difficulty: 'normal' as const, quote: 'Стрибок, ще стрибок — і твоїх шашок як не було!', desc: 'Шукає обов\'язкові взяття та ланцюжки.' },
        { name: 'Олена Дамка', title: 'Шукачка Королівських Полів', avatar: '👸', difficulty: 'normal' as const, quote: 'Дійду до восьмого ряду — і гра закінчиться!', desc: 'Цілеспрямовано веде шашки в дамки.' },
        { name: 'Ігор Затискач', title: 'Майстер Шашкових Пасток', avatar: '⛓️', difficulty: 'normal' as const, quote: 'У тебе не залишиться жодного вільного ходу!', desc: 'Блокує шашки суперника біля країв.' },
        { name: 'Людмила Стратег', title: 'Гросмейстер Дошки', avatar: '🧙‍♀️', difficulty: 'hard' as const, quote: 'Кожен хід на чорних клітинках має глибокий зміст.', desc: 'Прораховує комбінації на 4 ходи наперед.' },
        { name: 'Тарас Чорне Поле', title: 'Ветеран Шашок', avatar: '🧔', difficulty: 'hard' as const, quote: 'Ця дошка 8x8 пам\'ятає тисячі моїх тріумфів.', desc: 'Віртуоз англійських шашок.' },
        { name: 'В\'ячеслав Незламний', title: 'Вартовий Шашкового Столу', avatar: '🏰', difficulty: 'hard' as const, quote: 'Пройди мене, якщо мрієш битися з королями дамок!', desc: 'Останній претендент перед чемпіонами.' }
    ];
    const checkersChampionsData = [
        { rank: 3, name: 'Казимир Бронзова Дамка', title: '🥉 3-тє місце: Бронзовий Майстер Шашок', avatar: '🥉', difficulty: 'hard' as const, quote: 'Мої дамки контролюють усі діагоналі залу!', desc: 'Третій гросмейстер шашок.', hp: 500, armor: 200, power: 2 },
        { rank: 2, name: 'Валентина Срібний Король', title: '🥈 2-ге місце: Срібна Королева Дошки', avatar: '🥈', difficulty: 'expert' as const, quote: 'Жодна твоя шашка не уникне обов\'язкового взяття!', desc: 'Другий майстер шашкових турнірів.', hp: 550, armor: 250, power: 3 },
        { rank: 1, name: 'Ростислав Золотий Гросмейстер', title: '🥇 1-ше місце: Золотий Володар 64 Клітинок', avatar: '👑', difficulty: 'master' as const, quote: 'На цій дошці я володар кожного ходу й кожної дамки!', desc: 'Абсолютний чемпіон англійських шашок.', hp: 600, armor: 300, power: 4 }
    ];

    // 7. Senet
    const senetContendersData = [
        { name: 'Аменхотеп Мандрівник', title: 'Шукач Осіріса', avatar: '🏺', difficulty: 'easy' as const, quote: '30 клітинок ведуть до безсмертя душі!', desc: 'Знавець стародавніх єгипетських паличок.' },
        { name: 'Нефертіті Мудра', title: 'Жриця Дому Краси', avatar: '🧕', difficulty: 'easy' as const, quote: 'Дім Краси захистить мої фішки від будь-яких бід.', desc: 'Вміло ховає фішки у притулках.' },
        { name: 'Рамзес Швидкий', title: 'Майстер Паличок Долі', avatar: '⚡', difficulty: 'normal' as const, quote: 'Чотири світлі палички дають мені право на новий кидок!', desc: 'Часто викидає бонусні ходи.' },
        { name: 'Клеопатра Водна', title: 'Хранителька Нілу', avatar: '🌊', difficulty: 'normal' as const, quote: 'Остерігайся Дому Води, інакше тебе змиє на старт!', desc: 'Заманює фішки суперника у пастки.' },
        { name: 'Сет Безжалісний', title: 'Порушник Спокою', avatar: '🐺', difficulty: 'normal' as const, quote: 'Я обміняю твою фішку і заберу твою позицію!', desc: 'Майстер атаки та розміну фішок.' },
        { name: 'Ісіда Цілителька', title: 'Жриця Відродження', avatar: '✨', difficulty: 'hard' as const, quote: 'Дім Відродження дарує друге життя моїм вірним слугам.', desc: 'Швидко повертає фішки у гру.' },
        { name: 'Гор Соколине Око', title: 'Володар Вічності', avatar: '🦅', difficulty: 'hard' as const, quote: 'Останні клітинки відкриють ворота до царства богів.', desc: 'Безпомилково виводить фішки за межі дошки.' },
        { name: 'Анубіс Вартовий', title: 'Страж 30 Клітинок', avatar: '🐕', difficulty: 'hard' as const, quote: 'Тільки гідний розум перетне священне поле Сенета!', desc: 'Найсильніший претендент на священному полі.' }
    ];
    const senetChampionsData = [
        { rank: 3, name: 'Птолемей Бронзовий Скарабей', title: '🥉 3-тє місце: Бронзовий Жрець Сенету', avatar: '🥉', difficulty: 'hard' as const, quote: 'Священний скарабей прокладає мій шлях крізь піски часу!', desc: 'Третій майстер гри богів.', hp: 500, armor: 200, power: 2 },
        { rank: 2, name: 'Хатшепсут Срібний Анкх', title: '🥈 2-ге місце: Срібна Володарка Життя', avatar: '🥈', difficulty: 'expert' as const, quote: 'Символ життя веде мої фішки просто у вічність!', desc: 'Другий майстер священного поля Сенета.', hp: 550, armor: 250, power: 3 },
        { rank: 1, name: 'Осіріс Золоте Сонце', title: '🥇 1-ше місце: Золотий Верховний Жрець Сенету', avatar: '👑', difficulty: 'master' as const, quote: 'Я володар священного поля 30 клітинок! Схилися перед волею фараонів!', desc: 'Абсолютний чемпіон Сенета.', hp: 600, armor: 300, power: 4 }
    ];

    const { cList: classicDurakContenders, chList: classicDurakChampions } = helperMakeRoster('durak36', durak36ContendersData, durak36ChampionsData);
    const { cList: extendedDurakContenders, chList: extendedDurakChampions } = helperMakeRoster('durak52', durak52ContendersData, durak52ChampionsData);
    const { cList: dicePokerContenders, chList: dicePokerChampions } = helperMakeRoster('dicepoker', dicePokerContendersData, dicePokerChampionsData);
    const { cList: tavernDiceContenders, chList: tavernDiceChampions } = helperMakeRoster('taverndice', tavernDiceContendersData, tavernDiceChampionsData);
    const { cList: checkersContenders, chList: checkersChampions } = helperMakeRoster('checkers', checkersContendersData, checkersChampionsData);
    const { cList: senetContenders, chList: senetChampions } = helperMakeRoster('senet', senetContendersData, senetChampionsData);

    // 8. Royal Game of Ur (Королівська гра Ур)
    const urContendersData = [
        { name: 'Лугальбанда Слідопит', title: 'Шумерський Мандрівник', avatar: '🏺', difficulty: 'easy' as const, quote: 'Тетраедричні кості знають шлях через центральний міст!', desc: 'Знавець найдавніших шумерських стежок на дошці.' },
        { name: 'Пуабі Загадкова', title: 'Цариця Гробниць Ура', avatar: '👸', difficulty: 'easy' as const, quote: 'Лазурит і золото моїх фішок принесуть мені перемогу.', desc: 'Володіє благородним стилем спокійної гри.' },
        { name: 'Енліль-Майстер', title: 'Хранитель Клинопису', avatar: '📜', difficulty: 'normal' as const, quote: 'Усе записано на глиняних табличках: твоя поразка неминуча!', desc: 'Розраховує кожен крок за давніми правилами Ітті-Мардук-балату.' },
        { name: 'Нанна Нічний', title: 'Жрець Місяця Ура', avatar: '🌙', difficulty: 'normal' as const, quote: 'Під світлом місяця розетка стає неприступною фортецею.', desc: 'Вміло займає центральну захисну розетку.' },
        { name: 'Думузі Пастух', title: 'Страж Тетраедрів', avatar: '🐑', difficulty: 'normal' as const, quote: 'Мої чотири пірамідальні кістки завжди падають вершинами долі!', desc: 'Має надзвичайне везіння на додаткові кидки.' },
        { name: 'Шамаш Сонячний', title: 'Суддя Вавилона', avatar: '☀️', difficulty: 'hard' as const, quote: 'У центральній смузі немає жалю: один точний кидок — і ти на старті!', desc: 'Агресивно збиває фішки суперника з поля бою.' },
        { name: 'Енкіду Неприборканий', title: 'Степовий Воїн', avatar: '🐂', difficulty: 'hard' as const, quote: 'Я прорвуся крізь міст до виходу, наче дикий вепр!', desc: 'Швидко виводить свої фішки вперед.' },
        { name: 'Ур-Намму Законодавець', title: 'Цар Зикуратів', avatar: '🏛️', difficulty: 'hard' as const, quote: 'Правила Ура непорушні тисячоліттями. Доведи, що ти гідний царів!', desc: 'Найсильніший суперник шумерського турніру.' }
    ];
    const urChampionsData = [
        { rank: 3, name: 'Саргон Бронзовий Тетраедр', title: '🥉 3-тє місце: Бронзовий Владика Аккаду', avatar: '🥉', difficulty: 'hard' as const, quote: 'Моє військо пройде дошку Ура, не залишивши сліду від ворогів!', desc: 'Третій чемпіон Королівської гри Ур.', hp: 500, armor: 200, power: 2 },
        { rank: 2, name: 'Інанна Срібна Розетка', title: '🥈 2-ге місце: Срібна Богиня Битви', avatar: '🥈', difficulty: 'expert' as const, quote: 'Священна розетка благословляє мене другим кидком!', desc: 'Друга чемпіонка, бездоганно володіє контролем безпечних зон.', hp: 550, armor: 250, power: 3 },
        { rank: 1, name: 'Гільгамеш Золотий Напівбог', title: '🥇 1-ше місце: Золотий Цар Урука', avatar: '👑', difficulty: 'master' as const, quote: 'Я шукав безсмертя у віках і знайшов його на священній дошці Ура!', desc: 'Абсолютний чемпіон Королівської гри Ур.', hp: 600, armor: 300, power: 4 }
    ];

    // 9. Mehen (Мехен - Гра Священного Змія)
    const mehenContendersData = [
        { name: 'Нефер Заклинач', title: 'Приборкувач Змій', avatar: '🐍', difficulty: 'easy' as const, quote: 'Спіраль Мехена згортається навколо кожного, хто поспішає!', desc: 'Знає таємниці руху по колу священного змія.' },
        { name: 'Бастет Спритна', title: 'Вартова Святилища', avatar: '🐱', difficulty: 'easy' as const, quote: 'Мої лапи м\'які, а фішки швидко прослизнуть до голови змія!', desc: 'Легко уникає зворотних пасток.' },
        { name: 'Хнум Гончар', title: 'Майстер Спіралей', avatar: '🏺', difficulty: 'normal' as const, quote: 'Кожне кільце змія виліплене моїми руками з мулу Нілу.', desc: 'Вміє тримати позицію на безпечних кільцях.' },
        { name: 'Собек Річковий', title: 'Ловець Хвиль Нілу', avatar: '🐊', difficulty: 'normal' as const, quote: 'Хто оступиться на мокрому хвості змія — впаде на попереднє коло!', desc: 'Небезпечний у контактних збиттях на вузьких доріжках.' },
        { name: 'Хека Чаклун', title: 'Маг Священного Сувою', avatar: '🔮', difficulty: 'normal' as const, quote: 'Сила магії направляє палички долі до потрібної кількості кроків.', desc: 'Часто викидає максимальні значення паличок.' },
        { name: 'Сехмет Вогняна', title: 'Око Сонячного Ра', avatar: '🦁', difficulty: 'hard' as const, quote: 'Я захищаю голову Мехена від будь-якого нечистого помислу!', desc: 'Швидко мчить вперед до центру змія.' },
        { name: 'Тот Писар', title: 'Хранитель Знань', avatar: '🪶', difficulty: 'hard' as const, quote: 'Математика спіралі не має таємниць для того, хто рахує вічність.', desc: 'Ідеально прораховує ймовірності кидка паличок.' },
        { name: 'Апеп Тіньовий', title: 'Володар Звивистих Пасток', avatar: '🐉', difficulty: 'hard' as const, quote: 'Спіраль стане твоєю пасткою, а Голова Мехена залишиться недосяжною!', desc: 'Найсильніший суперник на спіральному полі Мехена.' }
    ];
    const mehenChampionsData = [
        { rank: 3, name: 'Імхотеп Бронзовий Зодчий', title: '🥉 3-тє місце: Бронзовий Архітектор Спіралі', avatar: '🥉', difficulty: 'hard' as const, quote: 'Спіраль Мехена — це досконалий проект небесних сил!', desc: 'Третій чемпіон гри Мехен.', hp: 500, armor: 200, power: 2 },
        { rank: 2, name: 'Клеопатра Срібний Урей', title: '🥈 2-ге місце: Срібна Цариця Нілу', avatar: '🥈', difficulty: 'expert' as const, quote: 'Священна змія корони оберігає мої фішки на шляху до перемоги!', desc: 'Друга чемпіонка зі зміїним тактичним розумом.', hp: 550, armor: 250, power: 3 },
        { rank: 1, name: 'Ра-Мехен Золотий Захисник', title: '🥇 1-ше місце: Золотий Страж Сонячного Човна', avatar: '👑', difficulty: 'master' as const, quote: 'Я оберігаю сонце Ра крізь 36 кілець вічного змія Мехена!', desc: 'Абсолютний чемпіон гри Мехен.', hp: 600, armor: 300, power: 4 }
    ];

    // 10. Aseb (Асеб - Давньоєгипетська гра 20 клітинок)
    const asebContendersData = [
        { name: 'Сенмут Зодчий', title: 'Будівничий 20 Квадратів', avatar: '📐', difficulty: 'easy' as const, quote: 'Чотири клітинки входу і дванадцять на злітній смузі — бездоганна геометрія!', desc: 'Майстер переходу зі стартових клітин на бойову смугу.' },
        { name: 'Тія Золотокоса', title: 'Цариця Перегонів', avatar: '🧕', difficulty: 'easy' as const, quote: 'Хто перший захопить розетку на восьмій клітинці — володар гри!', desc: 'Цілить точно у безпечні розетки.' },
        { name: 'Хоремхеб Воєначальник', title: 'Тактик Прямої Атаки', avatar: '🛡️', difficulty: 'normal' as const, quote: 'На довгій алеї Асебу немає схованки для слабких!', desc: 'Атакує без вагань на центральній злітній смузі.' },
        { name: 'Ментухотеп Стійкий', title: 'Страж Центральної Алеї', avatar: '🏺', difficulty: 'normal' as const, quote: 'Мої фішки стоять на розетках, мов гранітні обеліски!', desc: 'Вміє блокувати просування ворожих фішок.' },
        { name: 'Меритатон Сонцесяйна', title: 'Майстриня Паличок Долі', avatar: '✨', difficulty: 'normal' as const, quote: 'Чотири білі грані паличок відкривають дорогу вперед!', desc: 'Має високу точність кидка паличок.' },
        { name: 'Рамзес Невтомний', title: 'Колісничий 20 Клітинок', avatar: '🏹', difficulty: 'hard' as const, quote: 'Мої фішки летять по злітній смузі швидше за бойову колісницю!', desc: 'Стрімко проривається до фінішу.' },
        { name: 'Тутмос Завойовник', title: 'Гроза Рубежів', avatar: '⚔️', difficulty: 'hard' as const, quote: 'Збити ворожу фішку перед самим виходом — справжнє мистецтво!', desc: 'Влаштовує засідки перед фінішним виходом.' },
        { name: 'Аменхотеп Пишний', title: 'Володар Царської Дошки', avatar: '🪞', difficulty: 'hard' as const, quote: 'Асеб — гра царів і фараонів. Покажи, чи вартий ти виходу в чемпіони!', desc: 'Найсильніший претендент гри Асеб.' }
    ];
    const asebChampionsData = [
        { rank: 3, name: 'Ехнатон Бронзовий Атон', title: '🥉 3-тє місце: Бронзовий Майстер Асебу', avatar: '🥉', difficulty: 'hard' as const, quote: 'Світло сонячного диска осяює кожну з двадцяти священних клітинок!', desc: 'Третій чемпіон царської гри 20 клітинок.', hp: 500, armor: 200, power: 2 },
        { rank: 2, name: 'Нефертіті Срібний Лотос', title: '🥈 2-ге місце: Срібна Цариця Розетки', avatar: '🥈', difficulty: 'expert' as const, quote: 'Краса та непереможний розрахунок на кожній розетці Асебу!', desc: 'Друга чемпіонка з легендарною майстерністю гри.', hp: 550, armor: 250, power: 3 },
        { rank: 1, name: 'Тутанхамон Золотий Фараон', title: '🥇 1-ше місце: Золотий Володар Царської Скриньки', avatar: '👑', difficulty: 'master' as const, quote: 'Моя дошка Асебу знайдена в золотій усипальниці! Я непереможний володар 20 клітинок!', desc: 'Абсолютний чемпіон гри Асеб.', hp: 600, armor: 300, power: 4 }
    ];

    const { cList: urContenders, chList: urChampions } = helperMakeRoster('ur', urContendersData, urChampionsData);
    const { cList: mehenContenders, chList: mehenChampions } = helperMakeRoster('mehen', mehenContendersData, mehenChampionsData);
    const { cList: asebContenders, chList: asebChampions } = helperMakeRoster('aseb', asebContendersData, asebChampionsData);

    const makeFencingRoster = (prefix: string) => {
        const cList: OpponentData[] = fencingTemplates.map((t, idx) => {
            const baseHp = Math.round(t.baseHp * mult);
            const strength = Math.round(t.strength * mult);
            const agility = Math.round(t.agility * mult);
            const generatedName = makeUniqueName(tavernId + prefix + '_fighter_' + idx, isGraveyard ? t.name : undefined);
            return {
                id: `${tavernId}_${prefix}_fighter_${idx + 1}`,
                name: generatedName,
                title: t.title,
                avatar: t.avatar,
                type: 'contender',
                rank: idx + 1,
                difficulty: t.difficulty,
                flavorQuote: t.quote,
                description: t.desc,
                hp: Math.round((450 + idx * 10) * mult),
                armor: Math.round((180 + idx * 5) * mult),
                powerPoints: idx >= 4 ? 2 : 1,
                baseHp,
                strength,
                agility,
                rewards: {
                    gold: Math.round((75 + idx * 30) * mult),
                    powerPoints: idx >= 5 ? 2 : 1,
                    reputation: Math.round((22 + idx * 6) * mult),
                    xp: Math.round((95 + idx * 20) * mult)
                }
            };
        });

        const chList: OpponentData[] = fencingChampionTemplates.map(c => {
            const baseHp = Math.round(c.baseHp * mult);
            const strength = Math.round(c.strength * mult);
            const agility = Math.round(c.agility * mult);
            const generatedName = makeUniqueName(tavernId + prefix + '_champion_' + c.rank, isGraveyard ? c.name : undefined);
            return {
                id: `${tavernId}_${prefix}_champion_${c.rank}`,
                name: generatedName,
                title: c.title,
                avatar: c.avatar,
                type: 'champion',
                rank: c.rank,
                difficulty: c.difficulty,
                flavorQuote: c.quote,
                description: c.desc,
                hp: Math.round((c.rank === 1 ? 620 : (c.rank === 2 ? 560 : 530)) * mult),
                armor: Math.round((c.rank === 1 ? 310 : (c.rank === 2 ? 260 : 230)) * mult),
                powerPoints: (4 - c.rank) + 1,
                baseHp,
                strength,
                agility,
                rewards: {
                    gold: Math.round((360 + (4 - c.rank) * 160) * mult),
                    powerPoints: (4 - c.rank) + 2,
                    reputation: Math.round((95 + (4 - c.rank) * 45) * mult),
                    xp: Math.round((230 + (4 - c.rank) * 90) * mult)
                }
            };
        });

        return { cList, chList };
    };

    const shieldRoster = makeFencingRoster('fencing_shield');
    const onlyRoster = makeFencingRoster('fencing_only');
    const fencingSwordShieldContenders = shieldRoster.cList;
    const fencingSwordShieldChampions = shieldRoster.chList;
    const fencingSwordOnlyContenders = onlyRoster.cList;
    const fencingSwordOnlyChampions = onlyRoster.chList;

    const fencingContenders: OpponentData[] = fencingTemplates.map((t, idx) => {
        const baseHp = Math.round(t.baseHp * mult);
        const strength = Math.round(t.strength * mult);
        const agility = Math.round(t.agility * mult);
        const generatedName = makeUniqueName(tavernId + 'fencing_fighter_' + idx, isGraveyard ? t.name : undefined);
        return {
            id: `${tavernId}_fencing_fighter_${idx + 1}`,
            name: generatedName,
            title: t.title,
            avatar: t.avatar,
            type: 'contender',
            rank: idx + 1,
            difficulty: t.difficulty,
            flavorQuote: t.quote,
            description: t.desc,
            hp: Math.round((450 + idx * 10) * mult),
            armor: Math.round((180 + idx * 5) * mult),
            powerPoints: idx >= 4 ? 2 : 1,
            baseHp,
            strength,
            agility,
            rewards: {
                gold: Math.round((75 + idx * 30) * mult),
                powerPoints: idx >= 5 ? 2 : 1,
                reputation: Math.round((22 + idx * 6) * mult),
                xp: Math.round((95 + idx * 20) * mult)
            }
        };
    });

    const fencingChampions: OpponentData[] = fencingChampionTemplates.map(c => {
        const baseHp = Math.round(c.baseHp * mult);
        const strength = Math.round(c.strength * mult);
        const agility = Math.round(c.agility * mult);
        const generatedName = makeUniqueName(tavernId + 'fencing_champion_' + c.rank, isGraveyard ? c.name : undefined);
        return {
            id: `${tavernId}_fencing_champion_${c.rank}`,
            name: generatedName,
            title: c.title,
            avatar: c.avatar,
            type: 'champion',
            rank: c.rank,
            difficulty: c.difficulty,
            flavorQuote: c.quote,
            description: c.desc,
            hp: Math.round((c.rank === 1 ? 620 : (c.rank === 2 ? 560 : 530)) * mult),
            armor: Math.round((c.rank === 1 ? 310 : (c.rank === 2 ? 260 : 230)) * mult),
            powerPoints: (4 - c.rank) + 1,
            baseHp,
            strength,
            agility,
            rewards: {
                gold: Math.round((360 + (4 - c.rank) * 160) * mult),
                powerPoints: (4 - c.rank) + 2,
                reputation: Math.round((95 + (4 - c.rank) * 45) * mult),
                xp: Math.round((230 + (4 - c.rank) * 90) * mult)
            }
        };
    });

    // Chess (Класичні та варіантні шахи)
    const chessStandardContendersData = [
        { name: 'Віктор Конехід', title: 'Гросмейстер Кінних Вилок', avatar: '🐴', difficulty: 'easy' as const, quote: 'Мій кінь може стрибнути буквою Г прямо на твоє туру!', desc: 'Початківець шахового клубу.' },
        { name: 'Світлана Пішак', title: 'Захисниця Короля', avatar: '♟️', difficulty: 'easy' as const, quote: 'Навіть маленький пішак може стати ферзем!', desc: 'Стійко обороняє позиції.' },
        { name: 'Андрій Тура', title: 'Майстер Важких Фігур', avatar: '🏰', difficulty: 'normal' as const, quote: 'Відкрита горизонталь — і моя тура заблокує весь твій край!', desc: 'Любить контролювати відкриті лінії.' },
        { name: 'Анатолій Слон', title: 'Діагональний Тактик', avatar: '🧙‍♂️', difficulty: 'normal' as const, quote: 'Білопольний чи чорнопольний — мої слони прострілюють усю дошку!', desc: 'Далекоглядний шахіст.' },
        { name: 'Оксана Гамбіт', title: 'Агресивна Стратегиня', avatar: '⚔️', difficulty: 'normal' as const, quote: 'Я пожертвую пішаком задля стрімкого розвитку атаки!', desc: 'Розиграє гострі позиції.' },
        { name: 'Григорій Ендшпіль', title: 'Віртуоз Фіналів', avatar: '⌛', difficulty: 'hard' as const, quote: 'В ендшпілі кожен хід короля вирішує долю всієї партії.', desc: 'Точно грає в залишках фігур.' },
        { name: 'Маркіян Рокіровка', title: 'Майстер Непробивного Захисту', avatar: '🛡️', difficulty: 'hard' as const, quote: 'Мій король у безпечній фортеці, а твій під шахом!', desc: 'Міцний захисник.' },
        { name: 'Всеволод Ферзь', title: 'Грозний Шахіст', avatar: '👑', difficulty: 'hard' as const, quote: 'Найсильніша фігура на дошці принесе мені мат за кілька ходів!', desc: 'Найсильніший суперник шахового клубу.' }
    ];
    const chessStandardChampionsData = [
        { rank: 3, name: 'Броніслав Бронзовий Ферзь', title: '🥉 3-тє місце: Бронзовий Майстер Шахів', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзова корона шахіста сяє над дошкою!', desc: 'Третій гросмейстер шахової таверни.', hp: 520, armor: 220, power: 2 },
        { rank: 2, name: 'Святослав Срібна Тура', title: '🥈 2-ге місце: Срібний Гросмейстер Корони', avatar: '🥈', difficulty: 'expert' as const, quote: 'Жоден твій король не врятується від срібного мату!', desc: 'Другий майстер шахових турнірів.', hp: 580, armor: 270, power: 3 },
        { rank: 1, name: 'Володимир Золотий Король', title: '🥇 1-ше місце: Золотий Чемпіон Шахів', avatar: '👑', difficulty: 'master' as const, quote: 'Мій розум розраховує тридцять ходів наперед! Мат тобі, воїне!', desc: 'Абсолютний чемпіон шахів.', hp: 640, armor: 320, power: 4 }
    ];
    const chessRoster = helperMakeRoster('chess', chessStandardContendersData, chessStandardChampionsData);
    const chessStandardContenders = chessRoster.cList;
    const chessStandardChampions = chessRoster.chList;

    // Toy Soldiers (Гра в солдатики 15x15)
    const toySoldiersContendersData = [
        { name: 'Макар Олов\'яний', title: 'Командир Моделей', avatar: '🧸', difficulty: 'easy' as const, quote: 'Мої олов\'яні піхотинці тримають стрій!', desc: 'Захоплений колекціонер солдатиків.' },
        { name: 'Тарас Генерал-Майор', title: 'Тактик Настільних Битв', avatar: '🚩', difficulty: 'easy' as const, quote: 'Гармата на пагорбі розіб\'є твій фланг!', desc: 'Любитель тактичних маневрів.' },
        { name: 'Лев Рекрут', title: 'Майстер Засідок', avatar: '🎯', difficulty: 'normal' as const, quote: 'Прикрийся за дерев\'яним парканом і стріляй по команді!', desc: 'Вправний командувач іграшкових військ.' },
        { name: 'Дарина Кавалерія', title: 'Очільниця Олов\'яної Кінноти', avatar: '🏇', difficulty: 'normal' as const, quote: 'Швидка атака кінноти знешкодить твою артилерію!', desc: 'Володіє швидкими маневрами.' },
        { name: 'Пилип Артилерист', title: 'Стратег Паперових Фортець', avatar: '💣', difficulty: 'normal' as const, quote: 'Я прорахував дальність пострілу до міліметра!', desc: 'Точний стрілець мініатюрних гармат.' },
        { name: 'Захар Бастіон', title: 'Вартовий Олов\'яної Вежі', avatar: '🏰', difficulty: 'hard' as const, quote: 'Мою фортецю з дерев\'яних кубиків ще ніхто не здолав!', desc: 'Непробивний оборонець.' },
        { name: 'Роман Гусар', title: 'Сміливий Командир', avatar: '⚔️', difficulty: 'hard' as const, quote: 'Вперед, олов\'яні гусари, за славою й перемогою!', desc: 'Відчадушний настільний полководець.' },
        { name: 'Гордій Маршал', title: 'Непереможний Полководець', avatar: '🎖️', difficulty: 'hard' as const, quote: 'Це поле бою 15x15 стане твоїм уроком стратегії!', desc: 'Найкращий гравець у солдатики.' }
    ];
    const toySoldiersChampionsData = [
        { rank: 3, name: 'Антон Бронзовий Солдатик', title: '🥉 3-тє місце: Бронзовий Олов\'яний Командир', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзовий батальйон готовий до вирішального бою!', desc: 'Третій чемпіон тактичних ігор.', hp: 510, armor: 210, power: 2 },
        { rank: 2, name: 'Ілля Срібний Полководець', title: '🥈 2-ге місце: Срібний Стратег Мініатюр', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібна армія маневрує бездоганно на будь-якій карті!', desc: 'Другий майстер настільних боїв.', hp: 560, armor: 260, power: 3 },
        { rank: 1, name: 'Ярослав Золотий Фельдмаршал', title: '🥇 1-ше місце: Золотий Вождь Олов\'яних Армій', avatar: '👑', difficulty: 'master' as const, quote: 'Я збудував імперію олов\'яних воїнів! Здавайся або будь розбитий!', desc: 'Абсолютний чемпіон настільних боїв.', hp: 620, armor: 310, power: 4 }
    ];
    const toySoldiersRoster = helperMakeRoster('toysoldiers', toySoldiersContendersData, toySoldiersChampionsData);
    const toySoldiersContenders = toySoldiersRoster.cList;
    const toySoldiersChampions = toySoldiersRoster.chList;

    // Archery Competition (Змагання зі стрільби з лука)
    const archeryContendersData = [
        { name: 'Грицько Стрілонос', title: 'Мисливець на Качок', avatar: '🏹', difficulty: 'easy' as const, quote: 'Стріла знає свій шлях краще за лукаря!', desc: 'Місцевий мисливець на пернату дичину.' },
        { name: 'Остап Соколине Око', title: 'Лісовий Слідопит', avatar: '🦅', difficulty: 'easy' as const, quote: 'Вітер — мій союзник, а не перешкода.', desc: 'Вправний лісовий стрілець.' },
        { name: 'Ярина Тетява', title: 'Краща Лучниця Села', avatar: '🎯', difficulty: 'normal' as const, quote: 'Десятка в яблучко — мій звичний розрахунок.', desc: 'Краща лучниця навколишніх земель.' },
        { name: 'Мирон Меткий', title: 'Майстер Мішеней', avatar: '🏹', difficulty: 'normal' as const, quote: 'Похибка вітру не врятує твій результат!', desc: 'Майстер турнірних стрільбищ.' },
        { name: 'Богдан Вартовий', title: 'Лучник Королівської Варти', avatar: '🧝', difficulty: 'normal' as const, quote: 'П\'ять стріл — п\'ять точних отворів у центрі.', desc: 'Ветеран міської варти.' },
        { name: 'Назар Вітрогон', title: 'Степовий Стрілець', avatar: '💨', difficulty: 'hard' as const, quote: 'Я влучаю навіть у штормовий бічний порив!', desc: 'Мандрівний чемпіон стрілецьких гільдій.' },
        { name: 'Калина Гостра Стріла', title: 'Уславлена Майстриня', avatar: '🪶', difficulty: 'hard' as const, quote: 'Один рух пальця — і перемога в кишені.', desc: 'Уславлена майстриня стрільбища.' },
        { name: 'Семен Залізний Наконечник', title: 'Голова Лучного Цеху', avatar: '🎖️', difficulty: 'hard' as const, quote: 'Покажи, на що здатна твоя спритність!', desc: 'Голова лучного цеху.' }
    ];
    const archeryChampionsData = [
        { rank: 3, name: 'Корній Бронзовий Сагайдак', title: '🥉 3-тє місце: Бронзовий Сагайдак', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзовий лучник таверни не промахується!', desc: 'Третій чемпіон стрільбища.', hp: 520, armor: 220, power: 2 },
        { rank: 2, name: 'Любава Срібне Око', title: '🥈 2-ге місце: Срібне Око Турніру', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібна стріла завжди знаходить центр мішені!', desc: 'Друга майстриня стрілецьких змагань.', hp: 580, armor: 260, power: 3 },
        { rank: 1, name: 'Ростислав Золотий Лук', title: '🥇 1-ше місце: Золотий Лук Королівства', avatar: '👑', difficulty: 'master' as const, quote: 'Золотий лук не знає поразок! Покажи свою точність!', desc: 'Абсолютний чемпіон зі стрільби з лука.', hp: 640, armor: 320, power: 4 }
    ];
    const archeryRoster = helperMakeRoster('archery', archeryContendersData, archeryChampionsData);
    const archeryContenders = archeryRoster.cList;
    const archeryChampions = archeryRoster.chList;

    // Jousting (Лицарський Джостинг)
    const joustingContendersData = [
        { name: 'Тиміш Конепас', title: 'Юний Зброєносець', avatar: '🐎', difficulty: 'easy' as const, quote: 'Мій кінь найшвидший, а спис міцний!', desc: 'Юний лицарський зброєносець.' },
        { name: 'Лукаш Важкий Спис', title: 'Лицарський Рекрут', avatar: '🏇', difficulty: 'easy' as const, quote: 'Тримайся міцніше в сідлі!', desc: 'Місцевий лицарський рекрут.' },
        { name: 'Демко Щитолом', title: 'Загартований Вершник', avatar: '🛡️', difficulty: 'normal' as const, quote: 'Один удар — і твій щит розлетиться на тріски!', desc: 'Загартований вершник.' },
        { name: 'Захар Громовий Кінь', title: 'Турнірний Кавалерист', avatar: '⚡', difficulty: 'normal' as const, quote: 'Галоп мого скакуна змітає все на ристалищі!', desc: 'Турнірний кавалерист.' },
        { name: 'Свирид Броньований', title: 'Ветеран Кавалерії', avatar: '🪖', difficulty: 'normal' as const, quote: 'Моя броня витримає найпотужніший випад.', desc: 'Ветеран кавалерійських атак.' },
        { name: 'Святослав Незламний', title: 'Турнірний Боєць', avatar: '⚔️', difficulty: 'hard' as const, quote: 'Спробуй витримати удар мого дубового списа!', desc: 'Уславлений турнірний боєць.' },
        { name: 'Данило Буревій', title: 'Майстер Кінного Двобою', avatar: '🌪️', difficulty: 'hard' as const, quote: 'Я вибиваю з сідла з першого ж зіткнення!', desc: 'Майстер кінного двобою.' },
        { name: 'Мстислав Залізний Лицар', title: 'Голова Лицарського Ордену', avatar: '🛡️', difficulty: 'hard' as const, quote: 'Фінальний крок перед чемпіонами ристалища!', desc: 'Голова лицарського ордену.' }
    ];
    const joustingChampionsData = [
        { rank: 3, name: 'Бруно Бронзовий Спис', title: '🥉 3-тє місце: Бронзовий Спис', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзовий спис зламає твій захист!', desc: 'Третій лицар ристалища.', hp: 550, armor: 250, power: 2 },
        { rank: 2, name: 'Радомир Срібний Лицар', title: '🥈 2-ге місце: Срібний Лицар', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібний чемпіон ніколи не вилітає з сідла!', desc: 'Другий майстер кінного бою.', hp: 600, armor: 280, power: 3 },
        { rank: 1, name: 'Ярополк Золотий Чемпіон', title: '🥇 1-ше місце: Золотий Король Ристалища', avatar: '👑', difficulty: 'master' as const, quote: 'Король ристалища скине тебе в траву першим же ударом!', desc: 'Абсолютний чемпіон лицарського джостингу.', hp: 660, armor: 340, power: 4 }
    ];
    const joustingRoster = helperMakeRoster('jousting', joustingContendersData, joustingChampionsData);
    const joustingContenders = joustingRoster.cList;
    const joustingChampions = joustingRoster.chList;

    // Army Checkers (Армійські шашки 8x8)
    const checkersWarContendersData = [
        { name: 'Влад Шашкович', title: 'Любитель Армійських Шашок', avatar: '🔴', difficulty: 'easy' as const, quote: 'Мої 12 армійських шашок-загонів розірвуть твою оборону!', desc: 'Місцевий любитель настільних боїв.' },
        { name: 'Остап Дамка', title: 'Тактик Армійських Шашок', avatar: '👑', difficulty: 'easy' as const, quote: 'Кожен загін — це 12 бійців! Вони будуть битися до кінця!', desc: 'Мандрівний стратег армійських шашок.' },
        { name: 'Ярина Рубін', title: 'Командир Червоних Шашок', avatar: '🔴', difficulty: 'normal' as const, quote: 'Мої бійці загартовані в сотнях тактичних сутичок!', desc: 'Командир червоної гвардії армійських шашок.' },
        { name: 'Олексій Чорна Варта', title: 'Маршал Темних Загонів', avatar: '⚫', difficulty: 'normal' as const, quote: 'Ти не витримаєш тиску наших 12 армійських батальйонів!', desc: 'Досвідчений майстер Армійських Шашок.' },
        { name: 'Захар Гроссмейстер', title: 'Гранд-Майстер Армійських Шашок', avatar: '♟️', difficulty: 'hard' as const, quote: 'За кожну збиту дамку ти заплатиш кров\'ю бійців!', desc: 'Уславлений гросмейстер Армійських Шашок.' }
    ];
    const checkersWarChampionsData = [
        { rank: 3, name: 'Бруно Бронзовий Маршал', title: '🥉 3-тє місце: Бронзовий Маршал Шашок', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзовий загін не поступається жодній позиції!', desc: '3-й чемпіон Армійських Шашок.', hp: 530, armor: 230, power: 2 },
        { rank: 2, name: 'Святослав Срібний Полководець', title: '🥈 2-ге місце: Срібний Полководець 8x8', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібні шашки-загони рухаються до абсолютної перемоги!', desc: '2-й чемпіон Армійських Шашок.', hp: 590, armor: 270, power: 3 },
        { rank: 1, name: 'Ярослав Золотий Імператор Шашок', title: '🥇 1-ше місце: Золотий Імператор Армійських Шашок', avatar: '👑', difficulty: 'master' as const, quote: 'Я збудував імперію армійських шашок-загонів! Здавайся або будь знищений!', desc: 'Абсолютний чемпіон Армійських Шашок.', hp: 650, armor: 330, power: 4 }
    ];
    const checkersWarRoster = helperMakeRoster('checkers_war', checkersWarContendersData, checkersWarChampionsData);
    const checkersWarContenders = checkersWarRoster.cList;
    const checkersWarChampions = checkersWarRoster.chList;

    return { 
        contenders, 
        champions, 
        classicDurakContenders,
        classicDurakChampions,
        extendedDurakContenders,
        extendedDurakChampions,
        dicePokerContenders,
        dicePokerChampions,
        tavernDiceContenders,
        tavernDiceChampions,
        toySoldiersContenders,
        toySoldiersChampions,
        checkersContenders,
        checkersChampions,
        chessStandardContenders,
        chessStandardChampions,
        senetContenders,
        senetChampions,
        urContenders,
        urChampions,
        mehenContenders,
        mehenChampions,
        asebContenders,
        asebChampions,
        brawlers, 
        brawlChampions,
        fencingSwordShieldContenders,
        fencingSwordShieldChampions,
        fencingSwordOnlyContenders,
        fencingSwordOnlyChampions,
        fencingContenders,
        fencingChampions,
        archeryContenders,
        archeryChampions,
        joustingContenders,
        joustingChampions,
        checkersWarContenders,
        checkersWarChampions
    };
}

export function createDedicatedActivityOpponents(
    tavernId: string,
    activityType: TavernActivityType,
    settlementType: 'city' | 'village' | 'hamlet' | 'castle' | 'ruins' | 'graveyard' = 'village',
    tierLevel: number = 1
): { contenders: OpponentData[]; champions: OpponentData[] } {
    const isGraveyard = settlementType === 'graveyard';
    const usedNames = new Set<string>();
    const mult = tierLevel === 3 ? 1.4 : (tierLevel === 2 ? 1.2 : 1.0);

    const makeChar = (
        seedStr: string,
        preferredName?: string,
        preferredAvatar?: string,
        culture: CultureType = 'any',
        preferredGender?: CharacterGender
    ): { name: string; gender: CharacterGender; avatar: string } => {
        let gender: CharacterGender = preferredGender || (preferredName ? getGenderForName(preferredName) : ((getStableSeed(seedStr) % 2 === 0) ? 'male' : 'female'));
        let avatar = preferredAvatar;
        if (!avatar || avatar === '🥉' || avatar === '🥈' || avatar === '🥇' || avatar === '👑') {
            const avatarPool = gender === 'female' ? FEMALE_AVATARS : MALE_AVATARS;
            avatar = avatarPool[getStableSeed(seedStr) % avatarPool.length];
        }
        if (preferredName && !usedNames.has(preferredName)) {
            usedNames.add(preferredName);
            return { name: preferredName, gender, avatar };
        }
        let attempt = 0;
        while (attempt < 200) {
            const seed = getStableSeed(`${seedStr}_att_${attempt}`);
            const candidate = generateRandomName(culture, gender, seed);
            if (!usedNames.has(candidate)) {
                usedNames.add(candidate);
                return { name: candidate, gender, avatar };
            }
            attempt++;
        }
        const fallback = preferredName ? `${preferredName} (${usedNames.size + 1})` : generateRandomName(culture, gender, getStableSeed(seedStr));
        usedNames.add(fallback);
        return { name: fallback, gender, avatar };
    };

    const buildRoster = (
        contendersData: { name: string; title: string; avatar: string; difficulty: 'easy' | 'normal' | 'hard' | 'expert'; quote: string; desc: string }[],
        championsData: { rank: number; name: string; title: string; avatar: string; difficulty: 'hard' | 'expert' | 'master'; quote: string; desc: string; hp: number; armor: number; power: number }[]
    ) => {
        const contenders: OpponentData[] = contendersData.map((t, idx) => {
            const char = makeChar(`${tavernId}_${activityType}_c_${idx}`, isGraveyard ? t.name : undefined, t.avatar);
            return {
                id: `${tavernId}_${activityType}_contender_${idx + 1}`,
                name: char.name,
                gender: char.gender,
                title: t.title,
                avatar: char.avatar,
                type: 'contender' as const,
                rank: idx + 1,
                difficulty: t.difficulty,
                flavorQuote: t.quote,
                description: t.desc,
                hp: Math.round((450 + idx * 12) * mult),
                armor: Math.round((180 + idx * 6) * mult),
                powerPoints: idx >= 4 ? 2 : 1,
                baseHp: Math.round((75 + idx * 8) * mult),
                strength: Math.round((12 + idx * 2.5) * mult),
                agility: Math.round((8 + idx * 1.5) * mult),
                rewards: {
                    gold: Math.round((60 + idx * 25) * mult),
                    powerPoints: idx >= 5 ? 2 : 1,
                    reputation: Math.round((15 + idx * 5) * mult),
                    xp: Math.round((70 + idx * 15) * mult)
                }
            };
        });

        const champions: OpponentData[] = championsData.map(c => {
            const char = makeChar(`${tavernId}_${activityType}_ch_${c.rank}`, isGraveyard ? c.name : undefined, c.avatar);
            return {
                id: `${tavernId}_${activityType}_champion_${c.rank}`,
                name: char.name,
                gender: char.gender,
                title: c.title,
                avatar: char.avatar,
                type: 'champion' as const,
                rank: c.rank,
                difficulty: c.difficulty,
                flavorQuote: c.quote,
                description: c.desc,
                hp: Math.round(c.hp * mult),
                armor: Math.round(c.armor * mult),
                powerPoints: c.power,
                baseHp: Math.round((c.rank === 1 ? 230 : (c.rank === 2 ? 190 : 160)) * mult),
                strength: Math.round((c.rank === 1 ? 65 : (c.rank === 2 ? 50 : 38)) * mult),
                agility: Math.round((c.rank === 1 ? 20 : (c.rank === 2 ? 17 : 15)) * mult),
                rewards: {
                    gold: Math.round((320 + (4 - c.rank) * 160) * mult),
                    powerPoints: (4 - c.rank) + 2,
                    reputation: Math.round((85 + (4 - c.rank) * 40) * mult),
                    xp: Math.round((210 + (4 - c.rank) * 80) * mult)
                }
            };
        });

        return { contenders, champions };
    };

    if (activityType === 'potion_roulette') {
        const cData = [
            { name: 'Лаврін Травник', title: 'Шинкарський Зілляр', avatar: '🌿', difficulty: 'easy' as const, quote: 'Моє зілля або зцілить, або налякає!', desc: 'Знає всі лісові трави та їхні соки.' },
            { name: 'Катерина Алхімічка', title: 'Знавець Рецептів', avatar: '⚗️', difficulty: 'easy' as const, quote: 'Два інгредієнти — і отрута стає нектаром.', desc: 'Вміло розпізнає смертельні відвари.' },
            { name: 'Борис Дегустатор', title: 'Майстер Смаку', avatar: '🧪', difficulty: 'normal' as const, quote: 'Я відчуваю краплю болиголову за версту!', desc: 'Пройшов сотні випробувань напоями.' },
            { name: 'Одарка Еліксирниця', title: 'Чарівниця Колб', avatar: '🧫', difficulty: 'normal' as const, quote: 'Кожен ковток — це виклик небезпеці!', desc: 'Спеціалізується на антидотах і сорбентах.' },
            { name: 'Тиміш Отруйник', title: 'Знавець Смертельних Трав', avatar: '☠️', difficulty: 'normal' as const, quote: 'Обережно з червоними та мутними пляшечками...', desc: 'Хитрий майстер рулетки отрут.' },
            { name: 'Ярина Світла', title: 'Цілителька Таверни', avatar: '💖', difficulty: 'hard' as const, quote: 'Справжнє зілля підтримує життя до останнього!', desc: 'Знаходить цілющі пляшки серед отрут.' },
            { name: 'Гнат Сажотрус', title: 'Стійкий до Токсинів', avatar: '🧑‍🔬', difficulty: 'hard' as const, quote: 'Мій організм перетравить навіть свинець!', desc: 'Ветеран тавернних алхімічних парі.' },
            { name: 'Северин Верховний Алхімік', title: 'Охоронець Столу Зілля', avatar: '🧙‍♂️', difficulty: 'hard' as const, quote: 'Лише найстійкіший вийде переможцем з-за цього столу!', desc: 'Головний алхімік закладу.' }
        ];
        const chData = [
            { rank: 3, name: 'Броніслав Бронзова Колба', title: '🥉 3-тє місце: Бронзовий Алхімік', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзова колба ніколи не тріскається!', desc: 'Третій гросмейстер рулетки зілля.', hp: 520, armor: 220, power: 2 },
            { rank: 2, name: 'Мілана Срібний Еліксир', title: '🥈 2-ге місце: Срібна Травничка', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібний кубок сповнений таємниць!', desc: 'Друга майстриня відварів та протиотрут.', hp: 580, armor: 270, power: 3 },
            { rank: 1, name: 'Корнелій Золотий Флакон', title: '🥇 1-ше місце: Золотий Володар Зілля', avatar: '👑', difficulty: 'master' as const, quote: 'Я випив тисячу отрут і здобув абсолютну перемогу! Випий свій келих!', desc: 'Абсолютний чемпіон королівської рулетки зілля.', hp: 650, armor: 330, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'coin_flip') {
        const cData = [
            { name: 'Артем Двосрібник', title: 'Шинкарський Мідячник', avatar: '🪙', difficulty: 'easy' as const, quote: 'Орел чи решка — монета завжди падає дзвінко!', desc: 'Початківець швидких тавернних парі.' },
            { name: 'Одарка Орел', title: 'Шукачка Крилатих Граней', avatar: '🦅', difficulty: 'easy' as const, quote: 'Орел завжди приносить мені щастя!', desc: 'Завжди ставить на крилатого володаря.' },
            { name: 'Тарас Решка', title: 'Любитель Номіналів', avatar: '💰', difficulty: 'normal' as const, quote: 'Решка — це золото в кишені!', desc: 'Спеціалізується на гербовій стороні.' },
            { name: 'Зоряна Золотарка', title: 'Майстриня Підкидання', avatar: '✨', difficulty: 'normal' as const, quote: 'Монета крутиться в повітрі, як зірка!', desc: 'Віртуозно підкручує монетку пальцем.' },
            { name: 'Микита Грошовик', title: 'Тавернський Лихвар', avatar: '🤑', difficulty: 'normal' as const, quote: 'Кожен кидок — це дзвінка монета в скарбничку!', desc: 'Грає за чітким математичним розрахунком.' },
            { name: 'Варвара Срібне Око', title: 'Ловителька Монет', avatar: '👁️', difficulty: 'hard' as const, quote: 'Я бачу результат ще до того, як монета впаде!', desc: 'Має неймовірну реакцію.' },
            { name: 'Остап Щаслива Рука', title: 'Ветеран Золотих Парі', avatar: '🎩', difficulty: 'hard' as const, quote: 'За цим столом я виграв сотні дукатів!', desc: 'Досвідчений гравець у монетку.' },
            { name: 'Григір Мідний Барон', title: 'Вартовий Монетного Столу', avatar: '🪙', difficulty: 'hard' as const, quote: 'Кидай свою монету, подивимось на твою удачу!', desc: 'Найсильніший претендент серед кидачів.' }
        ];
        const chData = [
            { rank: 3, name: 'Давид Бронзовий Дукат', title: '🥉 3-тє місце: Бронзовий Кидач Монет', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзова монета не знає поразок!', desc: 'Третій чемпіон тавернного кидка.', hp: 500, armor: 200, power: 2 },
            { rank: 2, name: 'Олена Срібна Гривня', title: '🥈 2-ге місце: Срібна Пані Орла', avatar: '🥈', difficulty: 'expert' as const, quote: 'Мої монети слухаються мого погляду!', desc: 'Друга майстриня парі на монетах.', hp: 550, armor: 250, power: 3 },
            { rank: 1, name: 'Святополк Золотий Флорин', title: '🥇 1-ше місце: Золотий Король Монети', avatar: '👑', difficulty: 'master' as const, quote: 'Я володар кожного кидка в цьому краї! Орел чи Решка?!', desc: 'Абсолютний чемпіон гри в монетку.', hp: 600, armor: 300, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'd20_dice') {
        const cData = [
            { name: 'Лука Одногранник', title: 'Учень Кидків d20', avatar: '🎲', difficulty: 'easy' as const, quote: 'Головне — уникати одиниці на d20!', desc: 'Початківець великих кубиків.' },
            { name: 'Наталя Двадцятка', title: 'Шукачка Критичного Успіху', avatar: '🎯', difficulty: 'easy' as const, quote: 'Натуральна 20 — мій улюблений результат!', desc: 'Регулярно викидає найвищі грані.' },
            { name: 'Родіон Високий Кидок', title: 'Азартний Гравець d20', avatar: '🔥', difficulty: 'normal' as const, quote: '15 і вище — це мій звичний стандарт!', desc: 'Любить ризиковані парі на високі грані.' },
            { name: 'Уляна Гранителька', title: 'Знавець Багатогранників', avatar: '💎', difficulty: 'normal' as const, quote: '20 граней дають нескінченні можливості!', desc: 'Виточує ідеально збалансовані кубики.' },
            { name: 'Кирило Модифікатор', title: 'Майстер Бонусів', avatar: '📐', difficulty: 'normal' as const, quote: 'Мій розрахунок ймовірностей бездоганний!', desc: 'Математик високих кидків.' },
            { name: 'Богдана Щасливий Ікосаедр', title: 'Володарка Граней', avatar: '✨', difficulty: 'hard' as const, quote: 'Мої кістки виточені з місячного каменю!', desc: 'Неймовірно щаслива гравчиня.' },
            { name: 'Корній Старий Гравець', title: 'Ветеран d20', avatar: '🧙', difficulty: 'hard' as const, quote: 'Я кидав d20 ще до того, як збудували цю таверну.', desc: 'Досвідчений майстер двадцятигранки.' },
            { name: 'Захар Двадцятигранний', title: 'Вартовий Великого Кубика', avatar: '🛡️', difficulty: 'hard' as const, quote: 'Останнє випробування перед королями двадцятки!', desc: 'Лідер столу d20.' }
        ];
        const chData = [
            { rank: 3, name: 'Марко Бронзовий d20', title: '🥉 3-тє місце: Бронзовий Майстер 20 Граней', avatar: '🥉', difficulty: 'hard' as const, quote: 'Критичний успіх уже поруч!', desc: 'Третій чемпіон гри на d20.', hp: 510, armor: 210, power: 2 },
            { rank: 2, name: 'Софія Срібна Двадцятка', title: '🥈 2-ге місце: Срібна Королева High-Roll', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібний кубик дарує мені тільки високі числа!', desc: 'Друга майстриня двадцятигранних кісток.', hp: 560, armor: 260, power: 3 },
            { rank: 1, name: 'Любомир Золотий Критичний', title: '🥇 1-ше місце: Золотий Володар d20', avatar: '👑', difficulty: 'master' as const, quote: '20 на d20 — це закон моєї волі! Кидай свій кубик!', desc: 'Абсолютний чемпіон d20 High-Roll.', hp: 630, armor: 310, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'dice_duel') {
        const cData = [
            { name: 'Павло Щитоносець', title: 'Учень Захисту 2d20', avatar: '🛡️', difficulty: 'easy' as const, quote: 'Мій блок міцніший за твою атаку!', desc: 'Початківець бойових кубиків.' },
            { name: 'Дарина Мечниця', title: 'Швидка Нападниця 2d20', avatar: '⚔️', difficulty: 'easy' as const, quote: 'Атака — найкращий захист у двобої!', desc: 'Агресивно кидає на атаку.' },
            { name: 'Юхим Контратакувальник', title: 'Майстер Відповіді', avatar: '🤺', difficulty: 'normal' as const, quote: 'Відіб\'ю твій випад і завдам удару у відповідь!', desc: 'Вміло розраховує баланс кубів.' },
            { name: 'Тетяна Двокубикова', title: 'Тактикиня Двобоїв', avatar: '🎲', difficulty: 'normal' as const, quote: 'Кожен раунд — це битва розумів і кісток!', desc: 'Точно тримає дистанцію.' },
            { name: 'Гордій Парирувальник', title: 'Знавець Блоків', avatar: '🛡️', difficulty: 'normal' as const, quote: 'Спробуй пробити мій захисний кубик!', desc: 'Спеціалізується на глухому захисті.' },
            { name: 'Оксана Стрімка', title: 'Майстриня Випадів', avatar: '⚡', difficulty: 'hard' as const, quote: 'Три поранення — і ти на лопатках!', desc: 'Швидко завдає критичних ударів.' },
            { name: 'Василь Рубака', title: 'Ветеран 2d20 Арен', avatar: '🪓', difficulty: 'hard' as const, quote: 'Мої кістки падають з вагою бойової сокири!', desc: 'Сильний і досвідчений боєць.' },
            { name: 'Максим Залізний Двобієць', title: 'Охоронець Ристалища 2d20', avatar: '🏆', difficulty: 'hard' as const, quote: 'Доведи свою майстерність у чесному бою!', desc: 'Останній бар\'єр перед чемпіонами двобоїв.' }
        ];
        const chData = [
            { rank: 3, name: 'Яків Бронзовий Клинок', title: '🥉 3-тє місце: Бронзовий Дуелянт', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзовий меч 2d20 не знає втоми!', desc: 'Третій чемпіон костяного двобою.', hp: 520, armor: 220, power: 2 },
            { rank: 2, name: 'Роксолана Срібний Щит', title: '🥈 2-ге місце: Срібна Захисниця Двобоїв', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібний блок не пробити жодною атакою!', desc: 'Друга майстриня захисного двобою.', hp: 580, armor: 270, power: 3 },
            { rank: 1, name: 'Борислав Золотий Чемпіон 2d20', title: '🥇 1-ше місце: Золотий Володар Двобоїв', avatar: '👑', difficulty: 'master' as const, quote: 'Я непереможний лицар двобоїв на кубиках! До зброї!', desc: 'Абсолютний чемпіон двобоїв 2d20.', hp: 650, armor: 330, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'dice_duel_tournament') {
        const cData = [
            { name: 'Андрій Кваліфікатор', title: 'Боєць 1/4 Фіналу', avatar: '🥊', difficulty: 'easy' as const, quote: 'Перший раунд турніру завжди за мною!', desc: 'Любитель швидких турнірних сутичок.' },
            { name: 'Ілона Турнірна', title: 'Претендентка Сітки', avatar: '🥋', difficulty: 'easy' as const, quote: 'Я пройду до півфіналу будь-якою ціною!', desc: 'Енергійна учасниця змагань.' },
            { name: 'Сергій Сітковий', title: 'Тактик Турнірної Таблиці', avatar: '📋', difficulty: 'normal' as const, quote: 'У турнірі перемагає той, хто розраховує сили!', desc: 'Розраховує кожен поєдинок сітки.' },
            { name: 'Марія Півфіналістка', title: 'Гроза 1/2 Фіналу', avatar: '🔥', difficulty: 'normal' as const, quote: 'Ще один бій — і я у фіналі!', desc: 'Відома стійкістю у півфіналах.' },
            { name: 'Денис Фіналіст', title: 'Майстер Вирішальних Боїв', avatar: '⚔️', difficulty: 'normal' as const, quote: 'Фінальний раунд вимагає залізних нервів!', desc: 'Холоднокровний турнірний боєць.' },
            { name: 'Алла Незламна', title: 'Турнірна Воїтелька', avatar: '🛡️', difficulty: 'hard' as const, quote: 'Я здолала сімох бійців, здолаю й тебе!', desc: 'Має багато турнірних нагород.' },
            { name: 'Олег Кубковий', title: 'Ветеран Гранд-Фіналів', avatar: '🏆', difficulty: 'hard' as const, quote: 'Турнірний кубок стоїть у мене вдома!', desc: 'Багаторазовий фіналіст таверни.' },
            { name: 'Тарас Голова Турніру', title: 'Головний Суддя та Боєць', avatar: '👑', difficulty: 'hard' as const, quote: 'Гранд-фінал покаже, хто справжній чемпіон 8 бійців!', desc: 'Очільник турнірної ради.' }
        ];
        const chData = [
            { rank: 3, name: 'Матвій Бронзовий Кубок', title: '🥉 3-тє місце: Бронзовий Призер Турніру', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзова медаль лише крок до вершини!', desc: 'Третій чемпіон турніру 8 бійців.', hp: 530, armor: 230, power: 2 },
            { rank: 2, name: 'Вікторія Срібний Лавр', title: '🥈 2-ге місце: Срібна Фіналістка Турніру', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібний лавровий вінок прикрашає переможців!', desc: 'Друга майстриня гранд-фіналів.', hp: 590, armor: 280, power: 3 },
            { rank: 1, name: 'Герман Золотий Гранд-Чемпіон', title: '🥇 1-ше місце: Золотий Тріумфатор 8 Бійців', avatar: '👑', difficulty: 'master' as const, quote: 'Турнір 8 бійців підкоряється лише найсильнішому! Бийся за кубок!', desc: 'Абсолютний чемпіон турніру 8 бійців.', hp: 660, armor: 340, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'french_tarot') {
        const cData = [
            { name: 'Євген Жезлоносець', title: 'Учень Молодших Арканів', avatar: '🥖', difficulty: 'easy' as const, quote: 'Масть жезлів розкриє твою долю!', desc: 'Початківець французького таро.' },
            { name: 'Марі Жриця', title: 'Хранителька Таємниць', avatar: '🔮', difficulty: 'easy' as const, quote: 'Таємний Аркан підкаже вірний хід.', desc: 'Вміло розігрує козирі.' },
            { name: 'Луї Кубковий', title: 'Майстер Чаш', avatar: '🏆', difficulty: 'normal' as const, quote: 'Повні кубки обіцяють щедру перемогу.', desc: 'Збирає очки за хабарі.' },
            { name: 'Селеста Зірка', title: 'Провісниця Долі', avatar: '⭐', difficulty: 'normal' as const, quote: 'Зірки прихильні до сміливих гравців.', desc: 'Тактик складних контрактів.' },
            { name: 'П\'єр Мечник', title: 'Володар Клинків', avatar: '⚔️', difficulty: 'normal' as const, quote: 'Мечі зрізають навіть сильні взятки!', desc: 'Агресивний гравець у таро.' },
            { name: 'Жозефіна Пентакль', title: 'Золота Пані Арканів', avatar: '🪙', difficulty: 'hard' as const, quote: 'Кожен пентакль — це запорука успіху.', desc: 'Контролює цінність взятих карт.' },
            { name: 'Анрі Маг', title: 'Гросмейстер Старших Арканів', avatar: '🧙', difficulty: 'hard' as const, quote: '22 Старших Аркани скоряються моїй руці.', desc: 'Віртуоз гри у французьке таро.' },
            { name: 'Клод Охоронець Колоди', title: 'Страж Таро', avatar: '👑', difficulty: 'hard' as const, quote: 'Покажи своє вміння читати розклад долі!', desc: 'Найсильніший претендент столу таро.' }
        ];
        const chData = [
            { rank: 3, name: 'Франсуа Бронзовий Аркан', title: '🥉 3-тє місце: Бронзовий Таролог', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзове колесо долі крутиться на мою користь!', desc: 'Третій чемпіон французького таро.', hp: 520, armor: 220, power: 2 },
            { rank: 2, name: 'Беатріс Срібний Місяць', title: '🥈 2-ге місце: Срібна Жриця Арканів', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібне сяйво розсіє будь-який блеф!', desc: 'Друга майстриня французького таро.', hp: 580, armor: 270, power: 3 },
            { rank: 1, name: 'Шарль Золоте Сонце', title: '🥇 1-ше місце: Золотий Володар Таро', avatar: '👑', difficulty: 'master' as const, quote: 'Золотий аркан Сонця гарантує тріумф! Розкрий свої карти!', desc: 'Абсолютний чемпіон французького таро.', hp: 650, armor: 330, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'blackjack' || activityType === 'blackjack_dice') {
        const isDice = activityType === 'blackjack_dice';
        const cData = [
            { name: 'Василь Десятка', title: isDice ? 'Шинкарський Кидач 21' : 'Картяр 21 Очка', avatar: isDice ? '🎲' : '🃏', difficulty: 'easy' as const, quote: 'Головне — не перебрати понад 21!', desc: 'Любить обережні роздачі.' },
            { name: 'Надія Туз', title: 'Шукачка Одинадцятки', avatar: '🎴', difficulty: 'easy' as const, quote: 'Туз дає 1 або 11 — найкраща гнучкість!', desc: 'Вправно балансує на межі ризику.' },
            { name: 'Грицько Спліттер', title: 'Майстер Розділення', avatar: '✂️', difficulty: 'normal' as const, quote: 'Дві десятки — і я подвоюю свої шанси!', desc: 'Часто ділить руки на дві.' },
            { name: 'Калина Дабл', title: 'Смілива Гравчиня', avatar: '🔥', difficulty: 'normal' as const, quote: 'Подвоєння ставки — мій улюблений маневр!', desc: 'Сміливо йде на подвоєння.' },
            { name: 'Тимур Страхувальник', title: 'Знавець Ризиків', avatar: '🛡️', difficulty: 'normal' as const, quote: 'Страховка проти туза рятує гаманець.', desc: 'Грає виважено й акуратно.' },
            { name: 'Одарка Блекджек', title: 'Королева Роздач', avatar: '👑', difficulty: 'hard' as const, quote: 'Туз і картинка з першої спроби — чистий блекджек!', desc: 'Часто ловить природні 21.' },
            { name: 'Семен Лічильник', title: 'Майстер Рахунку', avatar: '🧮', difficulty: 'hard' as const, quote: 'Я рахую кожну карту в шузі та знаю залишок.', desc: 'Видатний лічильник карт і кубиків.' },
            { name: 'Захар Круп\'є', title: 'Страж Столу 21', avatar: '🎩', difficulty: 'hard' as const, quote: 'Дилер стоїть на 17! Чи наважишся перевершити?', desc: 'Головний круп\'є закладу.' }
        ];
        const chData = [
            { rank: 3, name: 'Данило Бронзовий Блекджек', title: '🥉 3-тє місце: Бронзовий Майстер 21', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзове очко завжди рівно 21!', desc: 'Третій чемпіон Блекджека.', hp: 510, armor: 210, power: 2 },
            { rank: 2, name: 'Клара Срібний Туз', title: '🥈 2-ге місце: Срібна Королева Роздачі', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібний туз ніколи не дає перебору!', desc: 'Друга майстриня гри в 21.', hp: 560, armor: 260, power: 3 },
            { rank: 1, name: 'Аркадій Золотий Дилер', title: '🥇 1-ше місце: Золотий Король 21 Очка', avatar: '👑', difficulty: 'master' as const, quote: 'Я б\'ю дилера в будь-якій роздачі! Візьми свою карту!', desc: 'Абсолютний чемпіон гри Блекджек.', hp: 630, armor: 310, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'army_battle') {
        const cData = [
            { name: 'Панас Десятник', title: 'Командир Авангарду', avatar: '🚩', difficulty: 'easy' as const, quote: 'Перший загін рушає в бій!', desc: 'Командує передовими рядами армії.' },
            { name: 'Варвара Стрілецька', title: 'Очільниця Загону Лучників', avatar: '🏹', difficulty: 'easy' as const, quote: 'Залп 5 стріл змете будь-яку кінноту!', desc: 'Керує стрілецькими дружинами.' },
            { name: 'Остап Піхотинець', title: 'Капітан Залізних Щитів', avatar: '🛡️', difficulty: 'normal' as const, quote: 'Стіна щитів з 16 загонів тримає удар!', desc: 'Тактик оборонних фаланг.' },
            { name: 'Дарина Кінна', title: 'Командирка Важкої Кавалерії', avatar: '🏇', difficulty: 'normal' as const, quote: 'Фланговий прорив змітає центр ворога!', desc: 'Швидка та рішуча полководиця.' },
            { name: 'Григір Артилерист', title: 'Майстер Облоги', avatar: '💣', difficulty: 'normal' as const, quote: 'Гарматні батареї рознесуть ворожі редути!', desc: 'Вправний командувач важкої зброї.' },
            { name: 'Ярослава Воєвода', title: 'Стратегиня 16 Загонів', avatar: '⚔️', difficulty: 'hard' as const, quote: 'У великій битві кожен загін має своє місце.', desc: 'Досвідчена командувачка полків.' },
            { name: 'Михайло Залізний Полковник', title: 'Ветеран Польових Битв', avatar: '🎖️', difficulty: 'hard' as const, quote: 'Мої загони пройшли вогонь і воду!', desc: 'Пройшов десятки масштабних баталій.' },
            { name: 'Володимир Верховний Командувач', title: 'Маршал Великої Армії', avatar: '👑', difficulty: 'hard' as const, quote: '16 проти 16: доведи свою військову геніальність!', desc: 'Головний настільний полководець.' }
        ];
        const chData = [
            { rank: 3, name: 'Бруно Бронзовий Генерал', title: '🥉 3-тє місце: Бронзовий Воєвода', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзова дивізія ніколи не відступає!', desc: 'Третій полководець Битви Армій.', hp: 540, armor: 240, power: 2 },
            { rank: 2, name: 'Радомира Срібна Маршалка', title: '🥈 2-ге місце: Срібна Стратегиня Армій', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібні полки маневрують бездоганно!', desc: 'Друга майстриня великих баталій.', hp: 600, armor: 290, power: 3 },
            { rank: 1, name: 'Святослав Золотий Генералісимус', title: '🥇 1-ше місце: Золотий Володар 16 Загонів', avatar: '👑', difficulty: 'master' as const, quote: 'Я скорив усі армії світу! Веди свої полки на бій!', desc: 'Абсолютний чемпіон Битви Армій.', hp: 680, armor: 350, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (
        activityType === 'toy_checkers' || activityType === 'toy_checkers_10x10' || activityType === 'toy_checkers_12x12' || activityType === 'toy_checkers_classic' ||
        activityType === 'toy_pawns' || activityType === 'toy_pawns_10x10' || activityType === 'toy_pawns_12x12' ||
        activityType === 'magic_pawns' || activityType === 'magic_pawns_10x10' || activityType === 'magic_pawns_12x12' ||
        activityType === 'wizard_battle' || activityType === 'wizard_tournament'
    ) {
        const isWizard = activityType.includes('wizard') || activityType.includes('magic_pawns');
        const cData = [
            { name: isWizard ? 'Зореслав Учень' : 'Макар Фігурист', title: isWizard ? 'Учень Магічного Кола' : 'Колекціонер Бойових Фігур', avatar: isWizard ? '🧙' : '♟️', difficulty: 'easy' as const, quote: isWizard ? 'Перше закляття завжди найяскравіше!' : 'Мої фігурки стоять на своїх клітинках!', desc: 'Початківець настільних двобоїв.' },
            { name: isWizard ? 'Мілана Вогняна' : 'Світлана Пішакова', title: isWizard ? 'Майстриня Іскор' : 'Швидка Тактикиня', avatar: isWizard ? '🔥' : '🔴', difficulty: 'easy' as const, quote: isWizard ? 'Полум\'яний подих розтопить твій бар\'єр!' : 'Мої дамки і пішаки пробивають фланг!', desc: 'Енергійна суперниця.' },
            { name: isWizard ? 'Радомир Крижаний' : 'Остап Шашковий', title: isWizard ? 'Чаклун Морозу' : 'Майстер Бойових Шашок', avatar: isWizard ? '❄️' : '⚪', difficulty: 'normal' as const, quote: isWizard ? 'Крижаний щит зупинить твої чари.' : 'Діагональ чи пряма — я бачу всі ходи.', desc: 'Вмілий оборонець.' },
            { name: isWizard ? 'Одарка Блискавка' : 'Тамара Замкова', title: isWizard ? 'Володарка Грому' : 'Вартова Поля', avatar: isWizard ? '⚡' : '🏰', difficulty: 'normal' as const, quote: isWizard ? 'Блискавка вражає миттєво!' : 'Центр дошки належить моїм фігурам!', desc: 'Швидка та рішуча гравчиня.' },
            { name: isWizard ? 'Григір Талісманник' : 'Богдан Боєць', title: isWizard ? 'Знавець Рун' : 'Ветеран Мініатюр', avatar: isWizard ? '🧿' : '⚔️', difficulty: 'normal' as const, quote: isWizard ? 'Стародавні руни підсилюють мої фігури!' : 'Кожна фігурка загартована у боях.', desc: 'Тактик настільних боїв.' },
            { name: isWizard ? 'Ярослава Чарівниця' : 'Катерина Дамкова', title: isWizard ? 'Майстриня Сяйва' : 'Гросмейстерка Фігур', avatar: isWizard ? '✨' : '👸', difficulty: 'hard' as const, quote: isWizard ? 'Магічне сяйво відкриє шлях до перемоги.' : 'Мої дамки контролюють усю дошку!', desc: 'Сильна та досвідчена гравчиня.' },
            { name: isWizard ? 'Любомир Архімаг' : 'Михайло Полководець', title: isWizard ? 'Ветеран Магічних Турнірів' : 'Ветеран Настільних Війн', avatar: isWizard ? '🧙‍♂️' : '🎖️', difficulty: 'hard' as const, quote: isWizard ? 'Я бачив падіння сотень заклиначів.' : 'Мої фігури пам\'ятають великі перемоги.', desc: 'Досвідчений майстер.' },
            { name: isWizard ? 'Северин Верховний Заклинач' : 'Ярополк Охоронець Дошки', title: isWizard ? 'Хранитель Чарівного Кола' : 'Голова Клубу Фігур', avatar: isWizard ? '👑' : '🛡️', difficulty: 'hard' as const, quote: isWizard ? 'Покажи міць своїх чарів у вирішальній битві!' : 'Доведи майстерність володіння фігурами!', desc: 'Найсильніший суперник закладу.' }
        ];
        const chData = [
            { rank: 3, name: 'Броніслав Бронзовий Гросмейстер', title: '🥉 3-тє місце: Бронзовий Майстер', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзова майстерність не підводить!', desc: 'Третій чемпіон турніру.', hp: 520, armor: 220, power: 2 },
            { rank: 2, name: 'Святослава Срібна Володарка', title: '🥈 2-ге місце: Срібна Переможниця', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібна перемога сяє над дошкою!', desc: 'Друга майстриня настільних сутичок.', hp: 580, armor: 270, power: 3 },
            { rank: 1, name: 'Всеволод Золотий Тріумфатор', title: '🥇 1-ше місце: Золотий Володар Турніру', avatar: '👑', difficulty: 'master' as const, quote: 'Я підкорив цю гру повністю! Зроби свій хід!', desc: 'Абсолютний чемпіон турніру.', hp: 650, armor: 330, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'aranian_checkers_war') {
        const cData = [
            { name: 'Олесь Аранієць', title: 'Учень Аранійської Школи', avatar: '⚔️', difficulty: 'easy' as const, quote: 'Аранійський крок убік ламає будь-яку класичну оборону!', desc: 'Опановує вільний аранійський маневр.' },
            { name: 'Марина Флангова', title: 'Швидка Загонниця', avatar: '🔴', difficulty: 'easy' as const, quote: 'Вліво, вправо, вперед — наші загони всюдисущі!', desc: 'Грамотно розгортає флангові атаки.' },
            { name: 'Ярослав Всебічний', title: 'Майстер 5 Напрямків', avatar: '👑', difficulty: 'normal' as const, quote: 'Побивши твій загін, я стану рівно на його місце!', desc: 'Агресивний аранійський тактик.' },
            { name: 'Одарка Нестримна', title: 'Командирка Авангарду', avatar: '⚔️', difficulty: 'normal' as const, quote: 'Коли мій загін стає дамкою — він підкорює всі 8 сторін!', desc: 'Швидко проводить дамки до першої лінії.' },
            { name: 'Богдан Дамковий', title: 'Ветеран Аранійської Варти', avatar: '🛡️', difficulty: 'hard' as const, quote: 'Дамка у всіх 8 напрямках — це абсолютна влада над дошкою!', desc: 'Майстер ендшпілю Аранійських шашок.' }
        ];
        const chData = [
            { rank: 3, name: 'Аран Бронзовий Маршал', title: '🥉 3-тє місце: Бронзовий Маршал Аранії', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзові загони тримають фронт у кожному напрямку!', desc: '3-й чемпіон Аранійських Армійських Шашок.', hp: 530, armor: 230, power: 2 },
            { rank: 2, name: 'Радомир Срібний Полководець', title: '🥈 2-ге місце: Срібний Полководець 8x8', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібні аранійські шашки рухаються безжально!', desc: '2-й чемпіон Аранійських Армійських Шашок.', hp: 590, armor: 270, power: 3 },
            { rank: 1, name: 'Костянтин Золотий Генерал Аранії', title: '🥇 1-ше місце: Золотий Генералісимус Аранії', avatar: '👑', difficulty: 'master' as const, quote: 'Вся дошка під моїм поглядом! Зроби свій аранійський хід або здавайся!', desc: 'Абсолютний чемпіон Аранійських Армійських Шашок.', hp: 650, armor: 330, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'military_checkers' || activityType === 'aranian_military_checkers') {
        const isAranian = activityType === 'aranian_military_checkers';
        const cData = [
            { name: 'Марко Центуріон (120 бійців)', title: isAranian ? 'Аранійський Центуріон' : 'Командир Легіону 120', avatar: '🛡️', difficulty: 'easy' as const, quote: '120 солдатів у кожній шашці готові кидати монети в бій!', desc: 'Володіє військовими шашками-загонами.' },
            { name: 'Ольга Монетна', title: 'Тактикиня Кидків', avatar: '🪙', difficulty: 'easy' as const, quote: 'N монет атаки проти M захисту — чиста військова математика!', desc: 'Вправно кидає монети загону.' },
            { name: 'Данило Загороджувач', title: 'Ветеран Захисту', avatar: '⚔️', difficulty: 'normal' as const, quote: 'Мій загін 2-го рівня перекидає всі невдалі монети захисту!', desc: 'Знає силу перекидання монет.' },
            { name: 'Роман Штурмовик', title: 'Ас Атаки 1-го Рівня', avatar: '🔥', difficulty: 'normal' as const, quote: 'Перекидання монет атаки гарантує прорив твого захисту!', desc: 'Спеціаліст нищівних атак.' },
            { name: 'Валерій Ветеран 120', title: 'Генерал Монетних Баталій', avatar: '🎖️', difficulty: 'hard' as const, quote: 'Коли загін досягає 4-го рівня — він готовий до великої декомпресії в лицарів!', desc: 'Легендарний полководець військових шашок.' }
        ];
        const chData = [
            { rank: 3, name: 'Гордій Бронзовий Командор', title: '🥉 3-тє місце: Бронзовий Командор 120', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзовий легіон витримує сотні кидків монет!', desc: '3-й чемпіон Військових Шашок.', hp: 540, armor: 240, power: 2 },
            { rank: 2, name: 'Максим Срібний Трибун', title: '🥈 2-ге місце: Срібний Трибун Монетних Війн', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібні монети падають на наш бік!', desc: '2-й чемпіон Військових Шашок.', hp: 600, armor: 280, power: 3 },
            { rank: 1, name: 'Аврелій Золотий Легат Військових Шашок', title: '🥇 1-ше місце: Золотий Легат Імперії 120 Бійців', avatar: '👑', difficulty: 'master' as const, quote: '120 бійців у кожній шашці скоряються моїй волі! Кидай монети за свою долю!', desc: 'Абсолютний тріумфатор Військових Шашок.', hp: 660, armor: 340, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'tavern_labyrinth') {
        const cData = [
            { name: 'Остап Картограф', title: 'Дослідник Підземель', avatar: '🗺️', difficulty: 'easy' as const, quote: 'Я пам\'ятаю кожен поворот підвалів таверни!', desc: 'Складає плани та карти стародавніх коридорів.' },
            { name: 'Дарина Шукачка Скарбів', title: 'Мисливиця за Скринями', avatar: '🗝️', difficulty: 'easy' as const, quote: 'У глухих кутах завжди ховаються золоті дукати!', desc: 'Не боїться темряви, замків та пасток.' },
            { name: 'Богдан Слідопит', title: 'Швидкий Бігун', avatar: '🏃‍♂️', difficulty: 'normal' as const, quote: 'Три хвилини — це ціла вічність, якщо знаєш шлях!', desc: 'Відомий своєю спритністю в заплутаних переходах.' },
            { name: 'Ярослава Факельниця', title: 'Охоронниця Вогню', avatar: '🔥', difficulty: 'normal' as const, quote: 'Світло факела завжди вкаже правильний шлях до виходу!', desc: 'Допомагає мандрівникам не заблукати в пітьмі.' },
            { name: 'Тихон Тіньовий Крок', title: 'Майстер Скритності', avatar: '🥷', difficulty: 'normal' as const, quote: 'Стіни лабіринту шепочуть мені таємниці коротких ходів...', desc: 'Безшумно проходить крізь будь-які завали.' },
            { name: 'Ольга Компасниця', title: 'Майстриня Орієнтування', avatar: '🧭', difficulty: 'hard' as const, quote: 'Північ, південь чи захід — я ніколи не втрачаю напрямок!', desc: 'З легкістю обходить будь-які заплутані глухі кути.' },
            { name: 'Радомир Лабіринтник', title: 'Ветеран Підземель', avatar: '🏛️', difficulty: 'hard' as const, quote: 'Сотні разів я проходив цими кам\'яними переходами за лічені хвилини!', desc: 'Досвідчений дослідник тавернних ходів.' },
            { name: 'Святослав Кам\'яне Серце', title: 'Вартовий Підземних Воріт', avatar: '🗿', difficulty: 'hard' as const, quote: 'Ці стародавні плити бачили імперії, а ти встигнеш за 3 хвилини?', desc: 'Невблаганний вартовий фінального виходу.' }
        ];
        const chData = [
            { rank: 3, name: 'Броніслав Бронзовий Факел', title: '🥉 3-тє місце: Бронзовий Провідник', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзове світло ніколи не згасає в лабіринті!', desc: 'Третій чемпіон підземних забігів.', hp: 520, armor: 220, power: 2 },
            { rank: 2, name: 'Мілана Срібна Нить', title: '🥈 2-ге місце: Володарка Нитки Аріадни', avatar: '🥈', difficulty: 'expert' as const, quote: 'Моя срібна нитка веде точно до виходу повз глухі кути!', desc: 'Друга майстриня швидкісного проходження лабіринту.', hp: 580, armor: 270, power: 3 },
            { rank: 1, name: 'Тесей Золотий Мінотавр', title: '🥇 1-ше місце: Володар Тавернного Лабіринту', avatar: '👑', difficulty: 'master' as const, quote: 'Я господар цих кам\'яних катакомб! Три хвилини, і ти заблукаєш навіки!', desc: 'Абсолютний чемпіон та гросмейстер проходження лабіринтів.', hp: 650, armor: 330, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    if (activityType === 'tavern_treasure_hunter') {
        const cData = [
            { name: 'Дейв Платформер', title: 'Легендарний Шукач Скарбів', avatar: '🧢', difficulty: 'easy' as const, quote: 'Збирай діаманти, уникай пасток і шукай двері!', desc: 'Знавець ретро-платформерів та підземель.' },
            { name: 'Одарка Стрибкова', title: 'Акробатка Платформ', avatar: '🤸‍♀️', difficulty: 'easy' as const, quote: 'Стрибок через прірву — це моя стихія!', desc: 'Швидка та спритна мисливиця за скарбами.' },
            { name: 'Богдан Рубіновий', title: 'Мисливець за Самоцвітами', avatar: '💎', difficulty: 'normal' as const, quote: 'Кожен червоний діамант наближає до перемоги!', desc: 'Збирає всі скарби на рівнях.' },
            { name: 'Ярослава Ключниця', title: 'Відмикачка Воріт', avatar: '🔑', difficulty: 'normal' as const, quote: 'Знайди двері до наступного рівня!', desc: 'Знає всі таємні проходи платформ.' },
            { name: 'Тихон Стрімкий', title: 'Швидкий Платформер', avatar: '⚡', difficulty: 'normal' as const, quote: 'Час іде, а скарби чекають!', desc: 'Проходить рівні на максимальній швидкості.' },
            { name: 'Ольга Золота', title: 'Володарка Скарбів', avatar: '👑', difficulty: 'hard' as const, quote: 'Золоті кубки та діаманти належать найкращим!', desc: 'Досвідчена шукачка скарбів.' },
            { name: 'Радомир Каменепад', title: 'Вартовий Платформ', avatar: '🧱', difficulty: 'hard' as const, quote: 'Цегла до цегли — і побудовано неприступний замок!', desc: 'Майстер лабіринтів з цегли.' },
            { name: 'Святослав Легенда', title: 'Гросмейстер Шукачів', avatar: '🏆', difficulty: 'hard' as const, quote: 'Пройди всі рівні та відчини двері до перемоги!', desc: 'Головний майстер платформних пригод.' }
        ];
        const chData = [
            { rank: 3, name: 'Бронзовий Шукач', title: '🥉 3-тє місце: Бронзовий Платформер', avatar: '🥉', difficulty: 'hard' as const, quote: 'Бронзовий діамант сяє яскраво!', desc: 'Третій чемпіон платформних забігів.', hp: 520, armor: 220, power: 2 },
            { rank: 2, name: 'Срібна Мисливиця', title: '🥈 2-ге місце: Срібна Шукачка Скарбів', avatar: '🥈', difficulty: 'expert' as const, quote: 'Срібні самоцвіти мої!', desc: 'Друга майстриня платформ.', hp: 580, armor: 270, power: 3 },
            { rank: 1, name: 'Золотий Дейв', title: '🥇 1-ше місце: Легендарний Герой Платформера', avatar: '👑', difficulty: 'master' as const, quote: 'Я пройшов усі рівні платформи без єдиної втрати життя!', desc: 'Абсолютний чемпіон гри «Шукач скарбів».', hp: 650, armor: 330, power: 4 }
        ];
        return buildRoster(cData, chData);
    }

    // Generic procedural generation for any other specific activity (e.g. specialized chess or durak variants)
    const formattedActName = activityType.replace(/_/g, ' ');
    const proceduralContenders = Array.from({ length: 8 }, (_, idx) => {
        const seedStr = `${tavernId}_${activityType}_contender_${idx}`;
        const char = makeChar(seedStr, undefined, undefined);
        return {
            name: char.name,
            title: `Тактик #${idx + 1} (${formattedActName})`,
            avatar: char.avatar,
            difficulty: (idx < 2 ? 'easy' : idx < 5 ? 'normal' : 'hard') as 'easy' | 'normal' | 'hard',
            quote: `Я покажу тобі справжню гру в «${formattedActName}»!`,
            desc: `Місцевий знавець та тактик гри «${formattedActName}».`
        };
    });
    const proceduralChampions = [
        { rank: 3, name: 'Бронзовий Майстер', title: `🥉 3-тє місце: Бронзовий Гравець (${formattedActName})`, avatar: '🥉', difficulty: 'hard' as const, quote: `Бронзова нагорода — це лише початок!`, desc: `Третій призер у грі «${formattedActName}».`, hp: 520, armor: 220, power: 2 },
        { rank: 2, name: 'Срібний Чемпіон', title: `🥈 2-ге місце: Срібний Майстер (${formattedActName})`, avatar: '🥈', difficulty: 'expert' as const, quote: `Срібний кубок підтверджує мій клас!`, desc: `Другий майстер у грі «${formattedActName}».`, hp: 570, armor: 260, power: 3 },
        { rank: 1, name: 'Золотий Гросмейстер', title: `🥇 1-ше місце: Золотий Володар (${formattedActName})`, avatar: '👑', difficulty: 'master' as const, quote: `Я непереможний у «${formattedActName}»! Зіграймо!`, desc: `Абсолютний чемпіон гри «${formattedActName}».`, hp: 640, armor: 320, power: 4 }
    ];

    return buildRoster(proceduralContenders, proceduralChampions);
}


// All settlements matching the user's uploaded fantasy continent map
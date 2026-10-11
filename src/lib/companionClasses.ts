import { CompanionClassDef } from '../types';

export const COMPANION_CLASSES: Record<string, CompanionClassDef> = {
    // ⚔️ Ближній бій
    barbarian: {
        id: 'barbarian',
        name: 'Варвар (Barbarian)',
        description: 'Шалений боєць, який стає сильнішим після отримання шкоди.',
        abilityName: 'Бойовий Клич',
        abilityDescription: 'Завдає великої шкоди одному ворогу перед боєм.',
        abilityType: 'damage_single',
        abilityPower: 30
    },
    berserker: {
        id: 'berserker',
        name: 'Берсерк (Berserker)',
        description: 'Входить у лють, втрачаючи захист заради величезної атаки.',
        abilityName: 'Кривава Лють',
        abilityDescription: 'Потужна атака по всім ворогам.',
        abilityType: 'damage_aoe',
        abilityPower: 20
    },
    pikeman: {
        id: 'pikeman',
        name: 'Пікінер (Pikeman)',
        description: 'Боєць із довгою зброєю, ефективний проти ворогів, що наближаються.',
        abilityName: 'Стіна Списів',
        abilityDescription: 'Наносить шкоду одному ворогу на відстані.',
        abilityType: 'damage_single',
        abilityPower: 25
    },
    grenadier: {
        id: 'grenadier',
        name: 'Гренадер (Grenadier)',
        description: 'Використовує гранати, вибухівку та запалювальні суміші.',
        abilityName: 'Вибухівка',
        abilityDescription: 'Наносить шкоду всім ворогам у загоні.',
        abilityType: 'damage_aoe',
        abilityPower: 35
    },
    samurai: {
        id: 'samurai',
        name: 'Самурай (Samurai)',
        description: 'Точні удари, контратаки та смертельні одиночні атаки.',
        abilityName: 'Удар Іайдзюцу',
        abilityDescription: 'Смертельний удар по одиночній цілі.',
        abilityType: 'damage_single',
        abilityPower: 50
    },
    guardian: {
        id: 'guardian',
        name: 'Гвардієць (Guardian)',
        description: 'Спеціалізується на захисті союзників.',
        abilityName: 'Захисна Стійка',
        abilityDescription: 'Дає бафф для гравця.',
        abilityType: 'buff_player',
        abilityPower: 20
    },
    cataphract: {
        id: 'cataphract',
        name: 'Катапрактарій (Cataphract)',
        description: 'Важкоозброєний кінний воїн.',
        abilityName: 'Кінний Чардж',
        abilityDescription: 'Атака по всім ворогам на полі.',
        abilityType: 'damage_aoe',
        abilityPower: 25
    },
    duelist: {
        id: 'duelist',
        name: 'Дуельянт (Duelist)',
        description: 'Швидкий боєць, який отримує бонуси в бою один на один.',
        abilityName: 'Точний Випад',
        abilityDescription: 'Значна шкода одному ворогу.',
        abilityType: 'damage_single',
        abilityPower: 35
    },
    swordsman: {
        id: 'swordsman',
        name: 'Мечник (Swordsman)',
        description: 'Універсальний майстер клинка.',
        abilityName: 'Шквал Ударів',
        abilityDescription: 'Наносить 4 атаки ворогу підряд.',
        abilityType: 'damage_multi',
        abilityPower: 14,
        hitCount: 4
    },
    shieldbearer: {
        id: 'shieldbearer',
        name: 'Щитоносець (Shieldbearer)',
        description: 'Може блокувати атаки та прикривати союзників.',
        abilityName: 'Блок Щитом',
        abilityDescription: 'Захищає та додає сили гравцю.',
        abilityType: 'buff_player',
        abilityPower: 20
    },
    // 🏹 Стрільці та дистанційні
    hunter: {
        id: 'hunter', name: 'Мисливець (Hunter)', description: 'Луки, пастки, висліджування.',
        abilityName: 'Смертельний Постріл', abilityDescription: 'Шкода одному ворогу.', abilityType: 'damage_single', abilityPower: 35
    },
    sniper: {
        id: 'sniper', name: 'Снайпер (Sniper)', description: 'Величезна дальність і критичні удари.',
        abilityName: 'Хедшот', abilityDescription: 'Величезна шкода одній цілі.', abilityType: 'damage_single', abilityPower: 60
    },
    crossbowman: {
        id: 'crossbowman', name: 'Арбалетник (Crossbowman)', description: 'Повільні, але потужні постріли.',
        abilityName: 'Пробивний Болт', abilityDescription: 'Атака одного ворога.', abilityType: 'damage_single', abilityPower: 45
    },
    skirmisher: {
        id: 'skirmisher', name: 'Застрільник (Skirmisher)', description: 'Мобільний стрілець, який атакує та відступає.',
        abilityName: 'Швидкий Обстріл', abilityDescription: 'Шкода всім ворогам.', abilityType: 'damage_aoe', abilityPower: 15
    },
    ranger: {
        id: 'ranger', name: 'Рейнджер (Ranger)', description: 'Поєднує стрільбу, виживання та ближній бій.',
        abilityName: 'Град Стріл', abilityDescription: 'Атака ворогів по площі 2 на 3 тайли.', abilityType: 'damage_aoe', abilityPower: 25
    },
    musketeer: {
        id: 'musketeer', name: 'Мушкетер (Musketeer)', description: 'Вогнепальна зброя, потужний постріл із перезарядкою.',
        abilityName: 'Залп', abilityDescription: 'Велика шкода одній цілі.', abilityType: 'damage_single', abilityPower: 55
    },
    arquebusier: {
        id: 'arquebusier', name: 'Аркебузир (Arquebusier)', description: 'Рання вогнепальна зброя, сильний залповий постріл.',
        abilityName: 'Гарматний Постріл', abilityDescription: 'Атака по групі.', abilityType: 'damage_aoe', abilityPower: 30
    },
    thrower: {
        id: 'thrower', name: 'Метальник (Thrower)', description: 'Ножі, сокири, списи та інша метальна зброя.',
        abilityName: 'Кидок Сокири', abilityDescription: 'Атака одного ворога.', abilityType: 'damage_single', abilityPower: 25
    },
    // 🗡️ Швидкі та хитрі
    assassin: {
        id: 'assassin', name: 'Асасин (Assassin)', description: 'Величезний бонус до атаки з прихованої позиції.',
        abilityName: 'Удар в спину', abilityDescription: 'Смертельний удар.', abilityType: 'damage_single', abilityPower: 70
    },
    ninja: {
        id: 'ninja', name: 'Ніндзя (Ninja)', description: 'Швидкість, ухилення, отрути та димові завіси.',
        abilityName: 'Сюрікени', abilityDescription: 'Шкода всім ворогам.', abilityType: 'damage_aoe', abilityPower: 20
    },
    thief: {
        id: 'thief', name: 'Злодій (Thief)', description: 'Крадіжка, замки, пастки.',
        abilityName: 'Підступний Удар', abilityDescription: 'Атака однієї цілі.', abilityType: 'damage_single', abilityPower: 20
    },
    saboteur: {
        id: 'saboteur', name: 'Диверсант (Saboteur)', description: 'Міни, пастки та вибухівка.',
        abilityName: 'Міна', abilityDescription: 'Встановлює перед собою приховану міну, невидиму для ворогів. При наступанні ворога вибухає та завдає 45 шкоди всім у радіусі 1 кл.', abilityType: 'trap', abilityPower: 45
    },
    spy: {
        id: 'spy', name: 'Шпигун (Spy)', description: 'Маскування, інформація та маніпуляція ворогами.',
        abilityName: 'Саботаж', abilityDescription: 'Ослаблює ворога.', abilityType: 'damage_single', abilityPower: 15
    },
    executioner: {
        id: 'executioner', name: 'Кат (Executioner)', description: 'Спеціалізується на добиванні поранених ворогів.',
        abilityName: 'Декапітація', abilityDescription: 'Величезна шкода одному ворогу.', abilityType: 'damage_single', abilityPower: 65
    },
    pirate: {
        id: 'pirate', name: 'Пірат (Pirate)', description: 'Шабля, пістоль, абордаж і брудні прийоми.',
        abilityName: 'Постріл з мушкета', abilityDescription: 'Шкода одному ворогу.', abilityType: 'damage_single', abilityPower: 30
    },
    bandit: {
        id: 'bandit', name: 'Бандит (Bandit)', description: 'Отримує бонуси від грабунку та бою проти слабших ворогів.',
        abilityName: 'Засідка', abilityDescription: 'Шкода всім ворогам.', abilityType: 'damage_aoe', abilityPower: 15
    },
    // 🔮 Магічні
    elementalist: {
        id: 'elementalist', name: 'Елементаліст (Elementalist)', description: 'Вогонь, лід, блискавка, земля.',
        abilityName: 'Метеоритний Дощ', abilityDescription: 'Велика шкода всім ворогам.', abilityType: 'damage_aoe', abilityPower: 45
    },
    warlock: {
        id: 'warlock', name: 'Чаклун (Warlock)', description: 'Укладає угоди з надприродними істотами.',
        abilityName: 'Прокляття', abilityDescription: 'Шкода одному ворогу.', abilityType: 'damage_single', abilityPower: 50
    },
    summoner: {
        id: 'summoner', name: 'Заклинач (Summoner)', description: 'Створює істот, які б\'ються замість нього.',
        abilityName: 'Призов Елементаля', abilityDescription: 'Призиває Елементаля.', abilityType: 'summon', abilityPower: 1,
        summonTemplate: { name: 'Елементаль', title: 'Призвана істота', avatar: '🔥', baseHp: 100, strength: 10, agility: 10, armor: 5 }
    },
    necromancer: {
        id: 'necromancer', name: 'Некромант (Necromancer)', description: 'Скелети, зомбі та інші мерці.',
        abilityName: 'Підняти Нежить', abilityDescription: 'Перетворює мертвого союзника на Скелета.', abilityType: 'raise_undead', abilityPower: 1,
        summonTemplate: { name: 'Скелет-воїн', title: 'Нежить', avatar: '💀', baseHp: 80, strength: 8, agility: 8, armor: 2 }
    },
    illusionist: {
        id: 'illusionist', name: 'Ілюзіоніст (Illusionist)', description: 'Створює копії та примарних союзників.',
        abilityName: 'Примарний Двійник', abilityDescription: 'Призиває ілюзію.', abilityType: 'summon', abilityPower: 1,
        summonTemplate: { name: 'Ілюзія', title: 'Фантом', avatar: '👤', baseHp: 30, strength: 5, agility: 15, armor: 0 }
    },
    alchemist: {
        id: 'alchemist', name: 'Алхімік (Alchemist)', description: 'Зілля, кислоти, отрути, бомби.',
        abilityName: 'Отруйна Бомба', abilityDescription: 'Шкода всім ворогам.', abilityType: 'damage_aoe', abilityPower: 30
    },
    druid: {
        id: 'druid', name: 'Друїд (Druid)', description: 'Природа, лікування та перетворення.',
        abilityName: 'Сила Природи', abilityDescription: 'Баф для гравця.', abilityType: 'buff_player', abilityPower: 30
    },
    shaman: {
        id: 'shaman', name: 'Шаман (Shaman)', description: 'Духи, прокляття та тотеми.',
        abilityName: 'Удар Блискавки', abilityDescription: 'Атака одного ворога.', abilityType: 'damage_single', abilityPower: 40
    },
    chronomancer: {
        id: 'chronomancer', name: 'Хрономант (Chronomancer)', description: 'Маніпулює швидкістю часу.',
        abilityName: 'Зупинка Часу', abilityDescription: 'Баф гравцю.', abilityType: 'buff_player', abilityPower: 40
    },
    gravitomancer: {
        id: 'gravitomancer', name: 'Гравітомант (Gravitomancer)', description: 'Змінює гравітацію та притягує ворогів.',
        abilityName: 'Чорна Діра', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 35
    },
    cryomancer: {
        id: 'cryomancer', name: 'Кріомант (Cryomancer)', description: 'Заморожує ворогів та створює крижані бар\'єри.',
        abilityName: 'Крижана Буря', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 25
    },
    pyromancer: {
        id: 'pyromancer', name: 'Піромант (Pyromancer)', description: 'Спеціаліст із вогню.',
        abilityName: 'Вогняна Куля', abilityDescription: 'Магічний вибух вогню по площі 2 на 2 тайли (уражає ворогів у зоні 4 клітинок).', abilityType: 'damage_aoe', abilityPower: 35
    },
    blood_mage: {
        id: 'blood_mage', name: 'Кровомант (Blood Mage)', description: 'Використовує власне HP як ресурс для магії.',
        abilityName: 'Кривава Стріла', abilityDescription: 'Атака одного ворога.', abilityType: 'damage_single', abilityPower: 60
    },
    shadowmancer: {
        id: 'shadowmancer', name: 'Тіньовик (Shadowmancer)', description: 'Керує тінями та темрявою.',
        abilityName: 'Покрив Темряви', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 20
    },
    // ✝️ Святі
    priest: {
        id: 'priest', name: 'Жрець (Priest)', description: 'Лікування та підтримка.',
        abilityName: 'Святе Зцілення', abilityDescription: 'Зцілює здоров\'я персонажа (+50 HP).', abilityType: 'heal_player', abilityPower: 50
    },
    paladin: {
        id: 'paladin', name: 'Паладин (Paladin)', description: 'Важка броня + свята магія.',
        abilityName: 'Святий Удар', abilityDescription: 'Шкода одному ворогу.', abilityType: 'damage_single', abilityPower: 40
    },
    exorcist: {
        id: 'exorcist', name: 'Екзорцист (Exorcist)', description: 'Особливо сильний проти нежиті та демонів.',
        abilityName: 'Вигнання', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 35
    },
    inquisitor: {
        id: 'inquisitor', name: 'Інквізитор (Inquisitor)', description: 'Полювання на магів, демонів і єретиків.',
        abilityName: 'Очищувальне Вогнище', abilityDescription: 'Атака одного ворога.', abilityType: 'damage_single', abilityPower: 50
    },
    holy_knight: {
        id: 'holy_knight', name: 'Святий лицар (Holy Knight)', description: 'Бойовий клас із потужними святими здібностями.',
        abilityName: 'Світло Небес', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 30
    },
    martyr: {
        id: 'martyr', name: 'Мученик (Martyr)', description: 'Перетворює отриману шкоду на силу для союзників.',
        abilityName: 'Жертовність', abilityDescription: 'Баф гравцю.', abilityType: 'buff_player', abilityPower: 60
    },
    // 🐺 Природа та звірі
    beastmaster: {
        id: 'beastmaster', name: 'Звіролов (Beastmaster)', description: 'Приручає тварин.',
        abilityName: 'Поклик Вовка', abilityDescription: 'Призиває вовка.', abilityType: 'summon', abilityPower: 1,
        summonTemplate: { name: 'Вовк', title: 'Звір', avatar: '🐺', baseHp: 60, strength: 6, agility: 12, armor: 1 }
    },
    rider: {
        id: 'rider', name: 'Вершник (Rider)', description: 'Б\'ється верхом на тварині.',
        abilityName: 'Наскок', abilityDescription: 'Атака одного ворога.', abilityType: 'damage_single', abilityPower: 35
    },
    dragon_knight: {
        id: 'dragon_knight', name: 'Драконарій (Dragon Knight)', description: 'Спеціаліст із боротьби поруч із драконом.',
        abilityName: 'Поклик Дракона', abilityDescription: 'Призиває малого дракона.', abilityType: 'summon', abilityPower: 1,
        summonTemplate: { name: 'Дракончик', title: 'Звір', avatar: '🐉', baseHp: 150, strength: 15, agility: 8, armor: 10 }
    },
    shapeshifter: {
        id: 'shapeshifter', name: 'Перевертень (Shapeshifter)', description: 'Може змінювати форму.',
        abilityName: 'Форма Ведмедя', abilityDescription: 'Баф гравцю.', abilityType: 'buff_player', abilityPower: 40
    },
    beast_trainer: {
        id: 'beast_trainer', name: 'Дресирувальник (Beast Trainer)', description: 'Керує групою тварин.',
        abilityName: 'Зграя', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 25
    },
    herbalist: {
        id: 'herbalist', name: 'Знахар (Herbalist)', description: 'Трави, лікування та природні отрути.',
        abilityName: 'Отруйна Хмара', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 20
    },
    // ⚙️ Незвичайні
    commander: {
        id: 'commander', name: 'Командир (Commander)', description: 'Майже не б\'ється сам, але дає накази союзникам.',
        abilityName: 'Наказ до Атаки', abilityDescription: 'Баф гравцю.', abilityType: 'buff_player', abilityPower: 25
    },
    tactician: {
        id: 'tactician', name: 'Тактик (Tactician)', description: 'Змінює характеристики поля бою.',
        abilityName: 'Тактична Перевага', abilityDescription: 'Баф гравцю.', abilityType: 'buff_player', abilityPower: 30
    },
    clonemaster: {
        id: 'clonemaster', name: 'Клонмайстер (Clonemaster)', description: 'Створює копії себе або союзників.',
        abilityName: 'Створити Клона', abilityDescription: 'Призиває клона.', abilityType: 'summon', abilityPower: 1,
        summonTemplate: { name: 'Клон', title: 'Копія', avatar: '👥', baseHp: 40, strength: 4, agility: 4, armor: 0 }
    },
    puppeteer: {
        id: 'puppeteer', name: 'Маріонетник (Puppeteer)', description: 'Контролює ворогів.',
        abilityName: 'Контроль Розуму', abilityDescription: 'Атака одного ворога.', abilityType: 'damage_single', abilityPower: 45
    },
    necro_engineer: {
        id: 'necro_engineer', name: 'Некромант-інженер (Necro Engineer)', description: 'Створює механічно-нежиттєві конструкції.',
        abilityName: 'Створити Кіборга-зомбі', abilityDescription: 'Призиває меха-зомбі.', abilityType: 'summon', abilityPower: 1,
        summonTemplate: { name: 'Меха-Зомбі', title: 'Конструкція', avatar: '🤖', baseHp: 120, strength: 12, agility: 2, armor: 15 }
    },
    archaeologist: {
        id: 'archaeologist', name: 'Археолог (Archaeologist)', description: 'Знаходить стародавні артефакти та використовує їх.',
        abilityName: 'Стародавній Артефакт', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 30
    },
    cartographer: {
        id: 'cartographer', name: 'Картограф (Cartographer)', description: 'Відкриває приховані області та отримує бонуси за дослідження.',
        abilityName: 'Знання Місцевості', abilityDescription: 'Баф гравцю.', abilityType: 'buff_player', abilityPower: 20
    },
    adventurer: {
        id: 'adventurer', name: 'Авантюрист (Adventurer)', description: 'Універсальний клас із бонусами до дослідження, скарбів і випадкових подій.',
        abilityName: 'Удача', abilityDescription: 'Баф гравцю.', abilityType: 'buff_player', abilityPower: 25
    },
    diplomat: {
        id: 'diplomat', name: 'Дипломат (Diplomat)', description: 'Може уникати боїв і залучати NPC на свій бік.',
        abilityName: 'Мирні Переговори', abilityDescription: 'Знижує силу ворога (Баф гравцю).', abilityType: 'buff_player', abilityPower: 15
    },
    merchant: {
        id: 'merchant', name: 'Торговець (Merchant)', description: 'Економічний клас, який заробляє золото та отримує особливі ціни.',
        abilityName: 'Підкуп', abilityDescription: 'Завдає шкоди одному ворогу.', abilityType: 'damage_single', abilityPower: 25
    },
    gambler: {
        id: 'gambler', name: 'Азартник (Gambler)', description: 'Здібності залежать від випадковості.',
        abilityName: 'Кидок Кубика', abilityDescription: 'Випадкова велика шкода.', abilityType: 'damage_single', abilityPower: 50
    },
    wandering_knight: {
        id: 'wandering_knight', name: 'Мандрівний лицар (Wandering Knight)', description: 'Слабший за спеціалізованого лицаря, але має широкий набір умінь.',
        abilityName: 'Удар Мечем', abilityDescription: 'Атака одного ворога.', abilityType: 'damage_single', abilityPower: 30
    },
    banner_bearer: {
        id: 'banner_bearer', name: 'Прапороносець (Banner Bearer)', description: 'Посилює всю групу.',
        abilityName: 'Підняти Прапор', abilityDescription: 'Дає баф гравцю.', abilityType: 'buff_player', abilityPower: 35
    },
    drummer: {
        id: 'drummer', name: 'Барабанщик (Drummer)', description: 'Бойові ритми дають союзникам різні ефекти.',
        abilityName: 'Бойовий Марш', abilityDescription: 'Баф гравцю.', abilityType: 'buff_player', abilityPower: 25
    },
    herald: {
        id: 'herald', name: 'Глашатай (Herald)', description: 'Може деморалізувати ворогів або підняти мораль союзників.',
        abilityName: 'Бойовий Клич', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 20
    },
    beggar: {
        id: 'beggar', name: 'Жебрак (Beggar)', description: 'Дивний слабкий клас із дуже високою удачею та соціальними здібностями.',
        abilityName: 'Жалібний Крик', abilityDescription: 'Атака по всім ворогам.', abilityType: 'damage_aoe', abilityPower: 10
    }
};

export const COMPANION_CLASS_KEYS = Object.keys(COMPANION_CLASSES);

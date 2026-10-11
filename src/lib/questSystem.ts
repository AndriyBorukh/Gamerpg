import { 
    Quest, 
    QuestType, 
    QuestDifficulty, 
    QuestObjective, 
    QuestObjectiveType, 
    ManualQuestInput, 
    WorldProgress, 
    SettlementData, 
    TavernData, 
    TavernActivityType 
} from '../types';
import { WORLD_SETTLEMENTS } from './worldData';

// Available Quick Presets for Manual Creation
export interface QuestPreset {
    id: string;
    label: string;
    category: string;
    icon: string;
    input: ManualQuestInput;
}

export const QUEST_MANUAL_PRESETS: QuestPreset[] = [
    {
        id: 'preset_hunt_goblins',
        label: 'Знищення банди гоблінів',
        category: 'Полювання',
        icon: '🏹',
        input: {
            title: 'Набіг на табір гоблінів-розбійників',
            description: 'Місцеві фермери налякані зухвалими набігами гоблінів. Знайдіть їхній загін на тракті та покарайте розбійників.',
            type: 'monster_hunt',
            difficulty: 'medium',
            giverName: 'Староста Богдан',
            giverTitle: 'Сільський війт',
            giverAvatar: '🧔',
            targetMonsterName: 'Загін Гоблінів-Грабіжників',
            requiredCount: 1,
            goldReward: 250,
            xpReward: 120,
            reputationReward: 20,
            cardPiecesReward: 10,
            itemRewardName: 'Трофейний шкіряний сагайдак',
            objectives: [
                {
                    id: 'obj_hunt_goblins_1',
                    text: 'Вистежити та знищити загін гоблінів-грабіжників на карті світу',
                    type: 'kill_monster',
                    targetMonsterName: 'Гоблін',
                    requiredCount: 1,
                    isOptional: false
                },
                {
                    id: 'obj_hunt_goblins_2',
                    text: '⭐ Розім’яти м’язи: здобути перемогу в кулачному бою в таверні',
                    type: 'win_duel',
                    requiredCount: 1,
                    isOptional: true,
                    bonusGold: 60,
                    bonusXp: 35
                }
            ]
        }
    },
    {
        id: 'preset_delivery_letter',
        label: 'Термінова депеша гільдії',
        category: 'Доставка',
        icon: '📜',
        input: {
            title: 'Таємний лист до магістрату',
            description: 'Запечатаний сургучем сувій із терміновими новинами про ціни на шовк і прянощі. Доставте його до найближчого великого міста.',
            type: 'delivery',
            difficulty: 'easy',
            giverName: 'Купець Ольгерд',
            giverTitle: 'Гільдійський фактор',
            giverAvatar: '🧮',
            targetSettlementName: 'Раннеград',
            targetSettlementId: 'rannegrad',
            requiredCount: 1,
            goldReward: 180,
            xpReward: 80,
            reputationReward: 25,
            cardPiecesReward: 5,
            itemRewardName: 'Гільдійська печатка купця',
            objectives: [
                {
                    id: 'obj_delivery_letter_1',
                    text: 'Прибути до Раннеграда та вручити депешу в магістрат',
                    type: 'visit_settlement',
                    targetSettlementId: 'rannegrad',
                    requiredCount: 1,
                    isOptional: false
                },
                {
                    id: 'obj_delivery_letter_2',
                    text: '⭐ Зібрати в дорозі щонайменше 10 уламків рідкісних карт',
                    type: 'collect_card_pieces',
                    requiredCount: 10,
                    isOptional: true,
                    bonusGold: 50,
                    bonusXp: 30
                }
            ]
        }
    },
    {
        id: 'preset_card_duel',
        label: 'Картярський тріумф у таверні',
        category: 'Картярство',
        icon: '🃏',
        input: {
            title: 'Виклик місцевому тузу картярства',
            description: 'У залі таверни вихваляється самовпевнений картяр. Обіграйте його в карти та доведіть свою беззаперечну майстерність.',
            type: 'duel_champion',
            difficulty: 'hard',
            giverName: 'Старий картяр Остап',
            giverTitle: 'Ветеран колоди',
            giverAvatar: '🃏',
            targetActivityName: 'Картярська дуель RPG',
            requiredCount: 1,
            goldReward: 350,
            xpReward: 200,
            reputationReward: 30,
            cardPiecesReward: 25,
            itemRewardName: 'Рідкісна гральна карта майстра',
            objectives: [
                {
                    id: 'obj_card_duel_1',
                    text: 'Здолати суперника в картярській RPG-дуелі в таверні',
                    type: 'win_duel',
                    requiredCount: 1,
                    isOptional: false
                },
                {
                    id: 'obj_card_duel_2',
                    text: '⭐ Виграти партію в кістки або класичного дурня для закріплення тріумфу',
                    type: 'win_minigame',
                    requiredCount: 1,
                    isOptional: true,
                    bonusGold: 80,
                    bonusXp: 45
                }
            ]
        }
    },
    {
        id: 'preset_explore_ruins',
        label: 'Експедиція до забутих руїн',
        category: 'Розвідка',
        icon: '🏛️',
        input: {
            title: 'Таємниці старовинних бастіонів',
            description: 'Астрологи помітили незвичне сяйво над старими руїнами. Вирушайте туди, огляньте місцевість та зберіть свідчення про стародавній культ.',
            type: 'visit_settlement',
            difficulty: 'medium',
            giverName: 'Зорезнавець Касіян',
            giverTitle: 'Хранитель літописів',
            giverAvatar: '🔮',
            targetSettlementName: 'Руїни Старого Форпосту',
            requiredCount: 1,
            goldReward: 220,
            xpReward: 150,
            reputationReward: 15,
            cardPiecesReward: 12,
            itemRewardName: 'Старовинний пергамент',
            objectives: [
                {
                    id: 'obj_explore_ruins_1',
                    text: 'Дістатися до руїн та завершити розвідку території',
                    type: 'visit_settlement',
                    requiredCount: 1,
                    isOptional: false
                },
                {
                    id: 'obj_explore_ruins_2',
                    text: '⭐ Очистити навколишні землі від бродячого загону монстрів',
                    type: 'kill_monster',
                    requiredCount: 1,
                    isOptional: true,
                    bonusGold: 70,
                    bonusXp: 40
                }
            ]
        }
    },
    {
        id: 'preset_minigame_dice',
        label: 'Турнір кісток і шашок',
        category: 'Тавернські ігри',
        icon: '🎲',
        input: {
            title: 'Чемпіонат за келихом темного елю',
            description: 'Покажіть майстерність у тавернських настільних іграх: здобудьте дві блискучі перемоги в кістки або класичного дурня.',
            type: 'minigame_win',
            difficulty: 'medium',
            giverName: 'Шинкар Ладо',
            giverTitle: 'Господар закладу',
            giverAvatar: '🍺',
            targetActivityName: 'Тавернські мініігри',
            requiredCount: 2,
            goldReward: 200,
            xpReward: 100,
            reputationReward: 15,
            cardPiecesReward: 8,
            itemRewardName: 'Щасливий різьблений кубик',
            objectives: [
                {
                    id: 'obj_minigame_dice_1',
                    text: 'Здобути 2 перемоги в будь-яких тавернських настільних іграх',
                    type: 'win_minigame',
                    requiredCount: 2,
                    isOptional: false
                },
                {
                    id: 'obj_minigame_dice_2',
                    text: '⭐ Провести переможну дуель на картах або мечах',
                    type: 'win_duel',
                    requiredCount: 1,
                    isOptional: true,
                    bonusGold: 60,
                    bonusXp: 35
                }
            ]
        }
    }
];

// Helper: Calculate standard rewards by difficulty
export function getRewardsByDifficulty(difficulty: QuestDifficulty) {
    switch (difficulty) {
        case 'easy':
            return { gold: 120, xp: 60, reputation: 10, cardPieces: 5 };
        case 'medium':
            return { gold: 250, xp: 130, reputation: 20, cardPieces: 12 };
        case 'hard':
            return { gold: 450, xp: 250, reputation: 35, cardPieces: 25 };
        case 'heroic':
            return { gold: 800, xp: 500, reputation: 60, cardPieces: 50 };
    }
}

/**
 * Гарантує наявність валідного списку цілей для будь-якого квесту (навіть старого збереження)
 */
export function normalizeQuestObjectives(quest: Quest): QuestObjective[] {
    if (quest.objectives && quest.objectives.length > 0) {
        return quest.objectives;
    }

    // Автоматична побудова цілі зі старих даних
    const primaryType: QuestObjectiveType = 
        quest.type === 'monster_hunt' ? 'kill_monster' :
        quest.type === 'delivery' ? 'deliver_cargo' :
        quest.type === 'visit_settlement' ? 'visit_settlement' :
        quest.type === 'duel_champion' ? 'win_duel' :
        quest.type === 'minigame_win' ? 'win_minigame' :
        quest.type === 'collect_resources' ? 'collect_card_pieces' : 'custom';

    const text = 
        quest.type === 'monster_hunt' ? `Здолати загін монстрів: ${quest.target.monsterName || 'вороги'}` :
        quest.type === 'delivery' ? `Доставити вантаж до: ${quest.target.settlementName || 'поселення'}` :
        quest.type === 'visit_settlement' ? `Відвідати локацію: ${quest.target.settlementName || 'поселення'}` :
        quest.type === 'duel_champion' ? 'Здолати чемпіона в таверні' :
        quest.type === 'minigame_win' ? 'Перемогти в тавернських іграх' :
        quest.type === 'collect_resources' ? 'Зібрати необхідні уламки карт' : quest.title;

    return [
        {
            id: `${quest.id}_obj_primary`,
            text,
            type: primaryType,
            currentCount: quest.currentCount || 0,
            requiredCount: Math.max(1, quest.requiredCount || 1),
            isCompleted: (quest.currentCount || 0) >= (quest.requiredCount || 1),
            isOptional: false,
            targetSettlementId: quest.target.settlementId,
            targetSettlementName: quest.target.settlementName,
            targetMonsterName: quest.target.monsterName,
            targetMonsterCategory: quest.target.monsterCategory,
            targetCoords: quest.target.targetCoords
        }
    ];
}

/**
 * ПРОСТИЙ ТА ГНУЧКИЙ МЕТОД СТВОРЕННЯ КВЕСТУ ВРУЧНУ
 * Створює об'єкт Quest із підтримкою багатоетапної системи цілей
 */
export function createManualQuest(input: ManualQuestInput): Quest {
    const id = `quest_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const difficulty: QuestDifficulty = input.difficulty || 'medium';
    const standardRewards = getRewardsByDifficulty(difficulty);
    const type: QuestType = input.type || 'custom';

    let objectives: QuestObjective[] = [];

    if (input.objectives && input.objectives.length > 0) {
        objectives = input.objectives.map((obj, idx) => ({
            id: obj.id || `obj_${id}_${idx}`,
            text: obj.text.trim() || `Ціль ${idx + 1}`,
            type: obj.type || (
                type === 'monster_hunt' ? 'kill_monster' :
                type === 'delivery' ? 'deliver_cargo' :
                type === 'visit_settlement' ? 'visit_settlement' :
                type === 'duel_champion' ? 'win_duel' :
                type === 'minigame_win' ? 'win_minigame' : 'custom'
            ),
            requiredCount: Math.max(1, obj.requiredCount || 1),
            currentCount: 0,
            isCompleted: false,
            isOptional: !!obj.isOptional,
            targetSettlementId: obj.targetSettlementId || input.targetSettlementId,
            targetSettlementName: input.targetSettlementName,
            targetMonsterName: obj.targetMonsterName || input.targetMonsterName,
            targetActivityType: obj.targetActivityType,
            bonusReward: (obj.bonusGold || obj.bonusXp) ? {
                gold: obj.bonusGold || 0,
                xp: obj.bonusXp || 0
            } : undefined
        }));
    } else {
        const req = Math.max(1, input.requiredCount || 1);
        const objText = 
            type === 'monster_hunt' ? `Здолати загін: ${input.targetMonsterName || 'вороги'}` :
            type === 'delivery' ? `Доставити вантаж до: ${input.targetSettlementName || 'поселення'}` :
            type === 'visit_settlement' ? `Відвідати: ${input.targetSettlementName || 'поселення'}` :
            type === 'duel_champion' ? 'Здобути перемогу в дуелі' :
            type === 'minigame_win' ? 'Перемогти в тавернських іграх' : input.title;

        const objType: QuestObjectiveType = 
            type === 'monster_hunt' ? 'kill_monster' :
            type === 'delivery' ? 'deliver_cargo' :
            type === 'visit_settlement' ? 'visit_settlement' :
            type === 'duel_champion' ? 'win_duel' :
            type === 'minigame_win' ? 'win_minigame' : 'custom';

        objectives = [
            {
                id: `obj_${id}_0`,
                text: objText,
                type: objType,
                requiredCount: req,
                currentCount: 0,
                isCompleted: false,
                isOptional: false,
                targetSettlementId: input.targetSettlementId,
                targetSettlementName: input.targetSettlementName,
                targetMonsterName: input.targetMonsterName
            }
        ];
    }

    const mandatoryObjectives = objectives.filter(o => !o.isOptional);
    const totalRequired = mandatoryObjectives.length > 0 ? mandatoryObjectives.length : objectives.length;

    // Find coordinates if destination settlement provided
    let targetCoords: { x: number; y: number } | undefined;
    if (input.targetSettlementId) {
        const found = WORLD_SETTLEMENTS.find(s => s.id === input.targetSettlementId);
        if (found) targetCoords = { x: found.x, y: found.y };
    }

    return {
        id,
        title: input.title.trim() || 'Таємниче завдання мандрівника',
        description: input.description.trim() || 'Подорожній у таверні доручив вам виконати особливе доручення для зміцнення миру в землях Елдрії.',
        type,
        difficulty,
        giverName: input.giverName?.trim() || 'Мандрівний шляхтич',
        giverTitle: input.giverTitle?.trim() || 'Замовник пригод',
        giverAvatar: input.giverAvatar?.trim() || '📜',
        giverLocationName: input.giverLocationName?.trim() || 'Королівський тракт',
        giverSettlementId: input.targetSettlementId,
        objectives,
        target: {
            settlementId: input.targetSettlementId,
            settlementName: input.targetSettlementName,
            monsterName: input.targetMonsterName,
            activityName: input.targetActivityName,
            targetCoords
        },
        requiredCount: totalRequired,
        currentCount: 0,
        reward: {
            gold: input.goldReward !== undefined ? input.goldReward : standardRewards.gold,
            xp: input.xpReward !== undefined ? input.xpReward : standardRewards.xp,
            reputation: input.reputationReward !== undefined ? input.reputationReward : standardRewards.reputation,
            cardPieces: input.cardPiecesReward !== undefined ? input.cardPiecesReward : standardRewards.cardPieces,
            itemRewardName: input.itemRewardName?.trim() || undefined,
            itemRewardIcon: input.itemRewardName ? '🎁' : undefined
        },
        status: 'active', // Hand-created quests immediately activate in the journal
        isCustom: true,
        createdAt: Date.now(),
        trackedObjectiveId: objectives[0]?.id
    };
}

// Generators for authentic NPC Tavern Quests
const NPC_GIVERS = [
    { name: 'Корчмар Братислав', title: 'Власник корчми', avatar: '🍺', category: 'tavern' },
    { name: 'Ветеран Гнат Залізняк', title: 'Колишній сотник', avatar: '⚔️', category: 'veteran' },
    { name: 'Мисливець Ратибор', title: 'Слідопит хащів', avatar: '🏹', category: 'hunter' },
    { name: 'Купець Добриня', title: 'Гільдійський фактор', avatar: '💰', category: 'merchant' },
    { name: 'Бард Лютослав', title: 'Мандрівний пісняр', avatar: '🪕', category: 'bard' },
    { name: 'Зорезнавець Касіян', title: 'Хранитель пергаментів', avatar: '🔮', category: 'astrologer' },
    { name: 'Травниця Ярина', title: 'Цілителька трав', avatar: '🌿', category: 'herbalist' },
    { name: 'Староста Світозар', title: 'Голова ради', avatar: '📜', category: 'elder' }
];

const MONSTER_TARGETS = [
    { name: 'Зграя Печерних Вовкулаків', category: 'wolves', diff: 'medium' as QuestDifficulty },
    { name: 'Ватага Лісових Розбійників', category: 'bandits', diff: 'easy' as QuestDifficulty },
    { name: 'Клан Кам’яних Тролів', category: 'trolls', diff: 'hard' as QuestDifficulty },
    { name: 'Некромант Чорного Кургану', category: 'undead', diff: 'heroic' as QuestDifficulty },
    { name: 'Орда Степових Кочівників', category: 'nomads', diff: 'medium' as QuestDifficulty },
    { name: 'Гоблінський авангард', category: 'goblins', diff: 'easy' as QuestDifficulty }
];

/**
 * СИСТЕМА ДИНАМІЧНОЇ ГЕНЕРАЦІЇ КВЕСТІВ ВІД НПЦ ІЗ ЦІЛЯМИ
 * Створює багатоцільові завдання (основна ціль + бонусна необов'язкова ціль)
 */
export function generateNpcQuestsForSettlement(
    settlement: SettlementData, 
    _tavern?: TavernData, 
    count: number = 3
): Quest[] {
    const quests: Quest[] = [];
    const seed = Date.now();
    const otherSettlements = WORLD_SETTLEMENTS.filter(s => s.id !== settlement.id);

    // Pick diverse quest styles
    for (let i = 0; i < count; i++) {
        const typeIndex = (i + Math.floor(Math.random() * 3)) % 5;
        const giver = NPC_GIVERS[(i * 3 + Math.floor(Math.random() * NPC_GIVERS.length)) % NPC_GIVERS.length];
        const targetSettlement = otherSettlements[Math.floor(Math.random() * otherSettlements.length)] || WORLD_SETTLEMENTS[0];
        const monster = MONSTER_TARGETS[Math.floor(Math.random() * MONSTER_TARGETS.length)];

        let quest: Quest;

        if (typeIndex === 0) {
            // 1. Полювання на монстрів
            const diff = monster.diff;
            const rew = getRewardsByDifficulty(diff);
            const questId = `npc_quest_hunt_${settlement.id}_${i}_${seed}`;

            const objectives: QuestObjective[] = [
                {
                    id: `${questId}_obj_1`,
                    text: `Знищити загін «${monster.name}» на карті світу`,
                    type: 'kill_monster',
                    currentCount: 0,
                    requiredCount: 1,
                    isCompleted: false,
                    isOptional: false,
                    targetMonsterName: monster.name,
                    targetMonsterCategory: monster.category
                },
                {
                    id: `${questId}_obj_2`,
                    text: '⭐ Додатково: здобути перемогу в кулачному бою або фехтуванні в таверні',
                    type: 'win_duel',
                    currentCount: 0,
                    requiredCount: 1,
                    isCompleted: false,
                    isOptional: true,
                    bonusReward: { gold: 60, xp: 40 }
                }
            ];

            quest = {
                id: questId,
                title: `Полювання: ${monster.name}`,
                description: `${giver.name} шукає хороброго воїна. Поблизу бачили небезпечний загін «${monster.name}». Знищіть цю загрозу на карті світу та поверніть спокій мандрівникам.`,
                type: 'monster_hunt',
                difficulty: diff,
                giverName: giver.name,
                giverTitle: giver.title,
                giverAvatar: giver.avatar,
                giverLocationName: settlement.name,
                giverSettlementId: settlement.id,
                objectives,
                target: {
                    monsterName: monster.name,
                    monsterCategory: monster.category
                },
                requiredCount: 1,
                currentCount: 0,
                reward: {
                    gold: rew.gold + 40,
                    xp: rew.xp + 30,
                    reputation: rew.reputation + 5,
                    cardPieces: rew.cardPieces + 5,
                    itemRewardName: 'Мисливський трофей пошани'
                },
                status: 'available',
                createdAt: Date.now(),
                trackedObjectiveId: objectives[0].id
            };
        } else if (typeIndex === 1) {
            // 2. Доставка вантажу / депеші
            const diff: QuestDifficulty = 'easy';
            const rew = getRewardsByDifficulty(diff);
            const questId = `npc_quest_delivery_${settlement.id}_${i}_${seed}`;

            const objectives: QuestObjective[] = [
                {
                    id: `${questId}_obj_1`,
                    text: `Прибути до поселення ${targetSettlement.name} та вручити депешу`,
                    type: 'visit_settlement',
                    currentCount: 0,
                    requiredCount: 1,
                    isCompleted: false,
                    isOptional: false,
                    targetSettlementId: targetSettlement.id,
                    targetSettlementName: targetSettlement.name,
                    targetCoords: { x: targetSettlement.x, y: targetSettlement.y }
                },
                {
                    id: `${questId}_obj_2`,
                    text: '⭐ Додатково: зібрати дорогою щонайменше 10 уламків карт',
                    type: 'collect_card_pieces',
                    currentCount: 0,
                    requiredCount: 10,
                    isCompleted: false,
                    isOptional: true,
                    bonusReward: { gold: 70, xp: 40 }
                }
            ];

            quest = {
                id: questId,
                title: `Терміновий кур'єр до ${targetSettlement.name}`,
                description: `${giver.name} просить терміново доправити цінну депешу до поселення ${targetSettlement.name} (${targetSettlement.type === 'city' ? 'Велике місто' : 'Форпост'}). Оплата гарантована гільдією.`,
                type: 'delivery',
                difficulty: diff,
                giverName: giver.name,
                giverTitle: giver.title,
                giverAvatar: giver.avatar,
                giverLocationName: settlement.name,
                giverSettlementId: settlement.id,
                objectives,
                target: {
                    settlementId: targetSettlement.id,
                    settlementName: targetSettlement.name,
                    targetCoords: { x: targetSettlement.x, y: targetSettlement.y }
                },
                requiredCount: 1,
                currentCount: 0,
                reward: {
                    gold: rew.gold + 60,
                    xp: rew.xp + 20,
                    reputation: rew.reputation + 10,
                    cardPieces: rew.cardPieces,
                    itemRewardName: 'Лист подяки магістрату'
                },
                status: 'available',
                createdAt: Date.now(),
                trackedObjectiveId: objectives[0].id
            };
        } else if (typeIndex === 2) {
            // 3. Картярська дуель / Виклик чемпіону
            const diff: QuestDifficulty = 'medium';
            const rew = getRewardsByDifficulty(diff);
            const questId = `npc_quest_duel_${settlement.id}_${i}_${seed}`;

            const objectives: QuestObjective[] = [
                {
                    id: `${questId}_obj_1`,
                    text: 'Здобути тріумф у картярському двобої або кулачному бою',
                    type: 'win_duel',
                    currentCount: 0,
                    requiredCount: 1,
                    isCompleted: false,
                    isOptional: false
                },
                {
                    id: `${questId}_obj_2`,
                    text: '⭐ Додатково: здобути перемогу в тавернській грі в кістки або шашки',
                    type: 'win_minigame',
                    currentCount: 0,
                    requiredCount: 1,
                    isCompleted: false,
                    isOptional: true,
                    bonusReward: { gold: 50, xp: 35 }
                }
            ];

            quest = {
                id: questId,
                title: 'Картярська перемога над суперником',
                description: `«Тільки той, хто тримає колоду з твердою рукою, заслуговує на повагу!» — каже ${giver.name}. Здобудьте перемогу в картярському двобої або кулачній бійці.`,
                type: 'duel_champion',
                difficulty: diff,
                giverName: giver.name,
                giverTitle: giver.title,
                giverAvatar: giver.avatar,
                giverLocationName: settlement.name,
                giverSettlementId: settlement.id,
                objectives,
                target: {
                    activityName: 'Картярські або кулачні дуелі'
                },
                requiredCount: 1,
                currentCount: 0,
                reward: {
                    gold: rew.gold + 50,
                    xp: rew.xp + 40,
                    reputation: rew.reputation + 15,
                    cardPieces: rew.cardPieces + 10,
                    itemRewardName: 'Рідкісний уламок карти туза'
                },
                status: 'available',
                createdAt: Date.now(),
                trackedObjectiveId: objectives[0].id
            };
        } else if (typeIndex === 3) {
            // 4. Розвідка поселення / руїн
            const target = otherSettlements.find(s => s.type === 'ruins' || s.type === 'graveyard' || s.type === 'castle') || targetSettlement;
            const diff: QuestDifficulty = 'medium';
            const rew = getRewardsByDifficulty(diff);
            const questId = `npc_quest_visit_${settlement.id}_${i}_${seed}`;

            const objectives: QuestObjective[] = [
                {
                    id: `${questId}_obj_1`,
                    text: `Дістатися та оглянути територію ${target.name}`,
                    type: 'visit_settlement',
                    currentCount: 0,
                    requiredCount: 1,
                    isCompleted: false,
                    isOptional: false,
                    targetSettlementId: target.id,
                    targetSettlementName: target.name,
                    targetCoords: { x: target.x, y: target.y }
                },
                {
                    id: `${questId}_obj_2`,
                    text: '⭐ Додатково: знищити бродячий загін монстрів дорогою',
                    type: 'kill_monster',
                    currentCount: 0,
                    requiredCount: 1,
                    isCompleted: false,
                    isOptional: true,
                    bonusReward: { gold: 80, xp: 50 }
                }
            ];

            quest = {
                id: questId,
                title: `Розвідка земель: ${target.name}`,
                description: `${giver.name} прагне дізнатися, що діється в околицях ${target.name}. Відвідайте це місце та поверніться з картографічними записами.`,
                type: 'visit_settlement',
                difficulty: diff,
                giverName: giver.name,
                giverTitle: giver.title,
                giverAvatar: giver.avatar,
                giverLocationName: settlement.name,
                giverSettlementId: settlement.id,
                objectives,
                target: {
                    settlementId: target.id,
                    settlementName: target.name,
                    targetCoords: { x: target.x, y: target.y }
                },
                requiredCount: 1,
                currentCount: 0,
                reward: {
                    gold: rew.gold + 70,
                    xp: rew.xp + 45,
                    reputation: rew.reputation + 12,
                    cardPieces: rew.cardPieces + 4,
                    itemRewardName: 'Старовинна мапа доріг'
                },
                status: 'available',
                createdAt: Date.now(),
                trackedObjectiveId: objectives[0].id
            };
        } else {
            // 5. Мініігри в таверні (кістки, дурень, шашки)
            const diff: QuestDifficulty = 'easy';
            const rew = getRewardsByDifficulty(diff);
            const questId = `npc_quest_minigame_${settlement.id}_${i}_${seed}`;

            const objectives: QuestObjective[] = [
                {
                    id: `${questId}_obj_1`,
                    text: 'Здобути 2 перемоги в тавернських азартних іграх',
                    type: 'win_minigame',
                    currentCount: 0,
                    requiredCount: 2,
                    isCompleted: false,
                    isOptional: false
                },
                {
                    id: `${questId}_obj_2`,
                    text: '⭐ Додатково: перемогти супротивника в картярській дуелі',
                    type: 'win_duel',
                    currentCount: 0,
                    requiredCount: 1,
                    isCompleted: false,
                    isOptional: true,
                    bonusReward: { gold: 65, xp: 40 }
                }
            ];

            quest = {
                id: questId,
                title: 'Азартний турнір у корчмі',
                description: `${giver.name} пропонує перевірити вашу удачу: зіграйте в кістки, дурня чи шашки та здобудьте 2 впевнені перемоги.`,
                type: 'minigame_win',
                difficulty: diff,
                giverName: giver.name,
                giverTitle: giver.title,
                giverAvatar: giver.avatar,
                giverLocationName: settlement.name,
                giverSettlementId: settlement.id,
                objectives,
                target: {
                    activityName: 'Тавернські ігри (кістки, дурень, шашки)'
                },
                requiredCount: 2,
                currentCount: 0,
                reward: {
                    gold: rew.gold + 30,
                    xp: rew.xp + 30,
                    reputation: rew.reputation + 10,
                    cardPieces: rew.cardPieces + 5,
                    itemRewardName: 'Щаслива мідна фішка'
                },
                status: 'available',
                createdAt: Date.now(),
                trackedObjectiveId: objectives[0].id
            };
        }

        quests.push(quest);
    }

    return quests;
}

// -------------------------------------------------------------
// HELPER ACTIONS: ACCEPT, ABANDON, CLAIM, TRACK OBJECTIVES
// -------------------------------------------------------------

export function acceptQuest(progress: WorldProgress, quest: Quest): WorldProgress {
    const currentActive = progress.activeQuests || [];
    if (currentActive.some(q => q.id === quest.id)) return progress;

    const objectives = normalizeQuestObjectives(quest);
    const activatedQuest: Quest = {
        ...quest,
        objectives,
        status: 'active',
        trackedObjectiveId: objectives[0]?.id
    };

    // Remove from availableNpcQuests if present
    const updatedAvailable = (progress.availableNpcQuests || []).filter(q => q.id !== quest.id);

    return {
        ...progress,
        activeQuests: [...currentActive, activatedQuest],
        availableNpcQuests: updatedAvailable,
        trackedQuestId: activatedQuest.id,
        trackedObjectiveId: activatedQuest.trackedObjectiveId
    };
}

export function abandonQuest(progress: WorldProgress, questId: string): WorldProgress {
    return {
        ...progress,
        activeQuests: (progress.activeQuests || []).filter(q => q.id !== questId),
        trackedQuestId: progress.trackedQuestId === questId ? undefined : progress.trackedQuestId,
        trackedObjectiveId: progress.trackedQuestId === questId ? undefined : progress.trackedObjectiveId
    };
}

export function setTrackedObjective(
    progress: WorldProgress, 
    questId: string, 
    objectiveId?: string
): WorldProgress {
    const updatedActive = (progress.activeQuests || []).map(q => {
        if (q.id === questId) {
            return {
                ...q,
                trackedObjectiveId: objectiveId || q.objectives?.[0]?.id
            };
        }
        return q;
    });

    return {
        ...progress,
        activeQuests: updatedActive,
        trackedQuestId: questId,
        trackedObjectiveId: objectiveId
    };
}

export function claimQuestReward(progress: WorldProgress, questId: string): {
    updatedProgress: WorldProgress;
    quest?: Quest;
    rewardMessage: string;
} {
    const active = progress.activeQuests || [];
    const targetQuest = active.find(q => q.id === questId);

    if (!targetQuest || targetQuest.status !== 'completed') {
        return { updatedProgress: progress, rewardMessage: 'Квест ще не виконаний або вже винагороджений' };
    }

    const { gold, xp, reputation, cardPieces } = targetQuest.reward;

    // Розрахунок бонусів за виконані додаткові цілі
    const objectives = normalizeQuestObjectives(targetQuest);
    let bonusGold = 0;
    let bonusXp = 0;
    let completedOptionalCount = 0;

    objectives.forEach(obj => {
        if (obj.isOptional && obj.isCompleted && obj.bonusReward) {
            bonusGold += obj.bonusReward.gold || 0;
            bonusXp += obj.bonusReward.xp || 0;
            completedOptionalCount++;
        }
    });

    const totalGold = gold + bonusGold;
    const totalXp = xp + bonusXp;

    // Apply stats update
    const currentStats = progress.playerStats;
    const newXp = (currentStats.xp || 0) + totalXp;
    const newGold = progress.playerGold + totalGold;
    const newReputation = progress.playerReputation + reputation;
    const newCardPieces = (progress.cardPieces || 0) + (cardPieces || 0);

    const updatedActive = active.filter(q => q.id !== questId);
    const completedIds = [...(progress.completedQuestIds || []), questId];

    const updatedProgress: WorldProgress = {
        ...progress,
        playerGold: newGold,
        playerReputation: newReputation,
        cardPieces: newCardPieces,
        playerStats: {
            ...currentStats,
            xp: newXp
        },
        activeQuests: updatedActive,
        completedQuestIds: completedIds,
        trackedQuestId: progress.trackedQuestId === questId ? undefined : progress.trackedQuestId,
        trackedObjectiveId: progress.trackedQuestId === questId ? undefined : progress.trackedObjectiveId
    };

    let rewardMessage = `Виконано квест «${targetQuest.title}»! Отримано: +${totalGold} 🪙`;
    if (bonusGold > 0) rewardMessage += ` (включаючи +${bonusGold} 🪙 за додаткові цілі)`;
    rewardMessage += `, +${totalXp} досвіду, +${reputation} слави${cardPieces ? `, +${cardPieces} уламків карт` : ''}!`;

    return {
        updatedProgress,
        quest: targetQuest,
        rewardMessage
    };
}

export type QuestTriggerEvent = 
    | { type: 'monster_defeated'; squadId?: string; monsterCategory?: string; monsterName?: string; count?: number }
    | { type: 'settlement_visited'; settlementId: string; settlementName?: string }
    | { type: 'duel_won'; opponentId?: string; opponentName?: string; count?: number }
    | { type: 'minigame_won'; activityType?: TavernActivityType; count?: number }
    | { type: 'card_pieces_gained'; amount: number };

/**
 * Оновлює прогрес цілей активних квестів на основі подій у грі
 */
export function processQuestEvent(
    progress: WorldProgress, 
    event: QuestTriggerEvent
): { updatedProgress: WorldProgress; newlyCompletedQuests: Quest[] } {
    const active = progress.activeQuests || [];
    if (active.length === 0) return { updatedProgress: progress, newlyCompletedQuests: [] };

    const newlyCompleted: Quest[] = [];
    let hasChanges = false;

    const updatedQuests = active.map(quest => {
        if (quest.status !== 'active') return quest;

        const objectives = normalizeQuestObjectives(quest);
        let questObjectivesChanged = false;

        const updatedObjectives = objectives.map(obj => {
            if (obj.isCompleted) return obj;

            let inc = 0;

            switch (event.type) {
                case 'monster_defeated':
                    if (obj.type === 'kill_monster' || quest.type === 'monster_hunt' || quest.type === 'custom') {
                        // Match specific monster or category, or generic monster
                        if (!obj.targetMonsterName || 
                            (event.monsterName && obj.targetMonsterName.toLowerCase().includes(event.monsterName.toLowerCase())) ||
                            (event.monsterCategory && obj.targetMonsterCategory === event.monsterCategory) ||
                            (!obj.targetMonsterName && !obj.targetMonsterCategory)
                        ) {
                            inc = event.count || 1;
                        }
                    }
                    break;

                case 'settlement_visited':
                    if (obj.type === 'visit_settlement' || obj.type === 'deliver_cargo' || quest.type === 'delivery' || quest.type === 'visit_settlement') {
                        if (obj.targetSettlementId === event.settlementId || 
                            (obj.targetSettlementName && event.settlementName && 
                             obj.targetSettlementName.toLowerCase() === event.settlementName.toLowerCase()) ||
                            (!obj.targetSettlementId && !obj.targetSettlementName)
                        ) {
                            inc = 1;
                        }
                    }
                    break;

                case 'duel_won':
                    if (obj.type === 'win_duel' || quest.type === 'duel_champion' || quest.type === 'custom') {
                        inc = event.count || 1;
                    }
                    break;

                case 'minigame_won':
                    if (obj.type === 'win_minigame' || quest.type === 'minigame_win' || quest.type === 'custom') {
                        inc = event.count || 1;
                    }
                    break;

                case 'card_pieces_gained':
                    if (obj.type === 'collect_card_pieces' || quest.type === 'collect_resources') {
                        inc = event.amount || 0;
                    }
                    break;
            }

            if (inc > 0) {
                questObjectivesChanged = true;
                const newCount = Math.min(obj.requiredCount, obj.currentCount + inc);
                const isCompleted = newCount >= obj.requiredCount;
                return {
                    ...obj,
                    currentCount: newCount,
                    isCompleted
                };
            }

            return obj;
        });

        if (questObjectivesChanged) {
            hasChanges = true;

            // Перевірка завершення всіх обов'язкових цілей
            const mandatory = updatedObjectives.filter(o => !o.isOptional);
            const mandatoryToCheck = mandatory.length > 0 ? mandatory : updatedObjectives;
            const completedMandatory = mandatoryToCheck.filter(o => o.isCompleted).length;
            const isFullyCompleted = completedMandatory >= mandatoryToCheck.length;

            const updatedQuest: Quest = {
                ...quest,
                objectives: updatedObjectives,
                currentCount: completedMandatory,
                requiredCount: mandatoryToCheck.length,
                status: isFullyCompleted ? 'completed' : quest.status
            };

            if (isFullyCompleted) {
                newlyCompleted.push(updatedQuest);
            }

            return updatedQuest;
        }

        return quest;
    });

    if (!hasChanges) {
        return { updatedProgress: progress, newlyCompletedQuests: [] };
    }

    return {
        updatedProgress: {
            ...progress,
            activeQuests: updatedQuests
        },
        newlyCompletedQuests: newlyCompleted
    };
}

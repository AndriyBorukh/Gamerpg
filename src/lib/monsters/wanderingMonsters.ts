import { OpponentData, SettlementData } from '../../types';
import { WORLD_SETTLEMENTS } from '../worldData';
import { generateRandomName } from '../nameGenerator';

function getStableSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export type MonsterCategory = 'undead' | 'beasts' | 'bandits' | 'cultists' | 'aberrations';

export type SquadState = 'marching' | 'raiding' | 'hunting' | 'chasing_player';

export interface SquadGoal {
    type: 'raid_settlement' | 'defile_graveyard' | 'scout_ruins' | 'hunt_wilderness' | 'patrol_road';
    description: string;
    targetSettlementId?: string;
    targetSettlementName?: string;
    targetX: number;
    targetY: number;
}

export interface SquadAlly {
    id: string;
    name: string;
    title: string;
    avatar: string;
    hp: number;
    maxHp: number;
    baseHp?: number;
    strength: number;
    agility: number;
    armor: number;
    isDefeated: boolean;
    opponent: OpponentData;
}

export interface MonsterSquad {
    id: string;
    name: string;
    avatar: string;
    category: MonsterCategory;
    themeColor: string; // Hex or tailwind
    level: number; // 1..6
    dangerRating: 'Звичайний' | 'Небезпечний' | 'Смертельний' | 'Елітний Вожак';
    membersCount: number;
    allies: SquadAlly[];
    x: number;
    y: number;
    speed: number; // % per second on world map
    state: SquadState;
    actionTimer: number; // Seconds remaining in raiding/idle
    currentGoal: SquadGoal;
    leader: {
        name: string;
        title: string;
        avatar: string;
        lore: string;
        hp: number;
        armor: number;
        powerPoints: number;
        baseHp: number;
        strength: number;
        agility: number;
        isDefeated?: boolean;
        opponent: OpponentData;
    };
    rewards: {
        gold: number;
        cardPieces: number;
        xp: number;
        reputation: number;
    };
}

// Helper to pick a random target settlement or landmark for bandit gangs
function pickRandomGoal(): SquadGoal {
    const r = Math.random();
    
    // 35% Graveyard or Ruins ambushes
    if (r < 0.35) {
        const darkLocs = WORLD_SETTLEMENTS.filter(s => s.type === 'graveyard' || s.type === 'ruins');
        if (darkLocs.length > 0) {
            const loc = darkLocs[Math.floor(Math.random() * darkLocs.length)];
            const isGrave = loc.type === 'graveyard';
            return {
                type: isGrave ? 'defile_graveyard' : 'scout_ruins',
                description: isGrave ? `Засідка грабіжників біля «${loc.name}»` : `Сховок головорізів у руїнах «${loc.name}»`,
                targetSettlementId: loc.id,
                targetSettlementName: loc.name,
                targetX: loc.x,
                targetY: loc.y
            };
        }
    }
    
    // 40% Village or Hamlet raid
    if (r < 0.75) {
        const villages = WORLD_SETTLEMENTS.filter(s => s.type === 'village' || s.type === 'hamlet');
        if (villages.length > 0) {
            const loc = villages[Math.floor(Math.random() * villages.length)];
            return {
                type: 'raid_settlement',
                description: `Кривавий набіг бандитів на поселення «${loc.name}»`,
                targetSettlementId: loc.id,
                targetSettlementName: loc.name,
                targetX: loc.x,
                targetY: loc.y
            };
        }
    }

    // 25% City outskirts or highway patrol
    const anyLoc = WORLD_SETTLEMENTS[Math.floor(Math.random() * WORLD_SETTLEMENTS.length)];
    const offsetX = (Math.random() - 0.5) * 6;
    const offsetY = (Math.random() - 0.5) * 6;
    const targetX = Math.max(5, Math.min(95, anyLoc.x + offsetX));
    const targetY = Math.max(5, Math.min(95, anyLoc.y + offsetY));

    return {
        type: 'hunt_wilderness',
        description: `Грабунок купецьких караванів біля «${anyLoc.name}»`,
        targetSettlementId: anyLoc.id,
        targetSettlementName: anyLoc.name,
        targetX,
        targetY
    };
}

// Preset squad archetypes - All hostile gangs consisting exclusively of bandits, robbers, thugs, and highwaymen
interface SquadTemplate {
    templateId: string;
    name: string;
    avatar: string;
    category: MonsterCategory;
    themeColor: string;
    level: number;
    dangerRating: 'Звичайний' | 'Небезпечний' | 'Смертельний' | 'Елітний Вожак';
    minMembers: number;
    maxMembers: number;
    speed: number;
    leaderTitle: string;
    leaderName: string;
    leaderAvatar: string;
    leaderLore: string;
    hp: number;
    armor: number;
    powerPoints: number;
    strength: number;
    agility: number;
    baseGold: number;
    basePieces: number;
    baseXp: number;
}

const SQUAD_TEMPLATES: SquadTemplate[] = [
    {
        templateId: 'bandits_highwaymen',
        name: 'Ватага Розбійників з Тракту',
        avatar: '🥷',
        category: 'bandits',
        themeColor: '#f59e0b',
        level: 2,
        dangerRating: 'Звичайний',
        minMembers: 7,
        maxMembers: 15,
        speed: 0.85,
        leaderTitle: 'Отаман Розбійників',
        leaderName: 'Семен Залізозуб',
        leaderAvatar: '🥷',
        leaderLore: 'Безжальний ватажок розбійників з тракту. Перепиняє торгові карети та грабує мандрівників.',
        hp: 130,
        armor: 20,
        powerPoints: 6,
        strength: 19,
        agility: 15,
        baseGold: 85,
        basePieces: 20,
        baseXp: 180
    },
    {
        templateId: 'bandits_cutthroats',
        name: 'Загін Нічних Головорізів',
        avatar: '🗡️',
        category: 'bandits',
        themeColor: '#dc2626',
        level: 3,
        dangerRating: 'Небезпечний',
        minMembers: 6,
        maxMembers: 14,
        speed: 0.9,
        leaderTitle: 'Ватажок Головорізів',
        leaderName: 'Влад Нічний Ніж',
        leaderAvatar: '🗡️',
        leaderLore: 'Атаман підступних головорізів, що нападають із темряви та не залишають свідків у кривавих сутичках.',
        hp: 150,
        armor: 16,
        powerPoints: 7,
        strength: 21,
        agility: 18,
        baseGold: 95,
        basePieces: 30,
        baseXp: 210
    },
    {
        templateId: 'bandits_forest_robbers',
        name: 'Ватага Лісових Грабіжників',
        avatar: '🏹',
        category: 'bandits',
        themeColor: '#16a34a',
        level: 2,
        dangerRating: 'Звичайний',
        minMembers: 8,
        maxMembers: 16,
        speed: 0.8,
        leaderTitle: 'Отаман Лісових Засідок',
        leaderName: 'Гриць Чорноліс',
        leaderAvatar: '🏹',
        leaderLore: 'Досвідчений отаман грабіжників, що влаштовує криваві засідки у непрохідних чагарях та ярах.',
        hp: 125,
        armor: 14,
        powerPoints: 6,
        strength: 18,
        agility: 19,
        baseGold: 75,
        basePieces: 22,
        baseXp: 170
    },
    {
        templateId: 'bandits_steppe_raiders',
        name: 'Банда Степових Грабіжників',
        avatar: '🐎',
        category: 'bandits',
        themeColor: '#ea580c',
        level: 3,
        dangerRating: 'Небезпечний',
        minMembers: 6,
        maxMembers: 12,
        speed: 1.0,
        leaderTitle: 'Степовий Отаман Бандитів',
        leaderName: 'Остап Кінний Різун',
        leaderAvatar: '🐎',
        leaderLore: 'Грізний ватажок степових грабіжників, що здійснює стрімкі набіги на селища та постоялі двори.',
        hp: 155,
        armor: 18,
        powerPoints: 8,
        strength: 23,
        agility: 16,
        baseGold: 105,
        basePieces: 35,
        baseXp: 240
    },
    {
        templateId: 'bandits_ravine_thugs',
        name: 'Криваві Головорізи Чорного Яру',
        avatar: '🪓',
        category: 'bandits',
        themeColor: '#991b1b',
        level: 4,
        dangerRating: 'Смертельний',
        minMembers: 5,
        maxMembers: 10,
        speed: 0.85,
        leaderTitle: 'Ватажок Кровожерливих Головорізів',
        leaderName: 'Максим М\'ясник',
        leaderAvatar: '🪓',
        leaderLore: 'Жорстокий отаман головорізів із Чорного Яру. Відбирає усе золото та зброю до останнього шеляга.',
        hp: 185,
        armor: 22,
        powerPoints: 9,
        strength: 26,
        agility: 17,
        baseGold: 130,
        basePieces: 45,
        baseXp: 300
    },
    {
        templateId: 'bandits_trade_robbers',
        name: 'Банда Грабіжників Торговельних Шляхів',
        avatar: '💰',
        category: 'bandits',
        themeColor: '#d97706',
        level: 2,
        dangerRating: 'Небезпечний',
        minMembers: 7,
        maxMembers: 14,
        speed: 0.85,
        leaderTitle: 'Грізний Отаман Грабіжників',
        leaderName: 'Богдан Заломок',
        leaderAvatar: '💰',
        leaderLore: 'Досвідчений ватажок грабіжників, який тримає у страху всіх купецьких гіральдів та подорожніх.',
        hp: 140,
        armor: 18,
        powerPoints: 7,
        strength: 20,
        agility: 15,
        baseGold: 115,
        basePieces: 28,
        baseXp: 200
    },
    {
        templateId: 'bandits_ambush_highwaymen',
        name: 'Зграя Розбійників-Засідників',
        avatar: '🎯',
        category: 'bandits',
        themeColor: '#b45309',
        level: 3,
        dangerRating: 'Небезпечний',
        minMembers: 6,
        maxMembers: 12,
        speed: 0.9,
        leaderTitle: 'Майстер Засідок і Розбійник',
        leaderName: 'Тимко Косий Стрілець',
        leaderAvatar: '🎯',
        leaderLore: 'Вправний ватажок розбійників-арбалетників, що розстрілює валки із засідки та грабує здобич.',
        hp: 145,
        armor: 15,
        powerPoints: 8,
        strength: 19,
        agility: 22,
        baseGold: 100,
        basePieces: 32,
        baseXp: 220
    },
    {
        templateId: 'bandits_border_thugs',
        name: 'Лихий Загін Межових Головорізів',
        avatar: '🥷',
        category: 'bandits',
        themeColor: '#7f1d1d',
        level: 5,
        dangerRating: 'Елітний Вожак',
        minMembers: 5,
        maxMembers: 10,
        speed: 0.95,
        leaderTitle: 'Отаман Межових Бандитів',
        leaderName: 'Яків Чорногуз',
        leaderAvatar: '🥷',
        leaderLore: 'Атаман межових головорізів та бандитів, що контролює прикордонні переправи, мости і заїжджі двори.',
        hp: 210,
        armor: 26,
        powerPoints: 11,
        strength: 28,
        agility: 20,
        baseGold: 175,
        basePieces: 55,
        baseXp: 390
    },
    {
        templateId: 'undead_necromancer_horde',
        name: 'Орда Темного Некроманта',
        avatar: '🧙‍♂️',
        category: 'undead',
        themeColor: '#8b5cf6',
        level: 3,
        dangerRating: 'Небезпечний',
        minMembers: 3,
        maxMembers: 15,
        speed: 0.8,
        leaderTitle: 'Темний Некромант',
        leaderName: 'Некромант Малраш',
        leaderAvatar: '🧙‍♂️',
        leaderLore: 'Повелитель мертвих, що подорожує землями з ордою нежиті. Його оточують слухняні зомбі та древні скелети.',
        hp: 160,
        armor: 16,
        powerPoints: 9,
        strength: 18,
        agility: 15,
        baseGold: 140,
        basePieces: 35,
        baseXp: 280
    },
    {
        templateId: 'undead_black_necromancer',
        name: 'Культ Чорного Некроманта',
        avatar: '🔮',
        category: 'undead',
        themeColor: '#7e22ce',
        level: 4,
        dangerRating: 'Смертельний',
        minMembers: 4,
        maxMembers: 15,
        speed: 0.82,
        leaderTitle: 'Верховний Некромант',
        leaderName: 'Некромант Мордекай',
        leaderAvatar: '🔮',
        leaderLore: 'Чернець Чорного Місяця та майстер некромантії. В підкоренні тримає полки зомбі та легіони скелетів.',
        hp: 190,
        armor: 20,
        powerPoints: 12,
        strength: 20,
        agility: 17,
        baseGold: 180,
        basePieces: 50,
        baseXp: 380
    }
];

// Instantiates a squad from template
export function createSquadFromTemplate(template: SquadTemplate, initialX?: number, initialY?: number): MonsterSquad {
    const goal = pickRandomGoal();

    // Spawn location: if not given, spawn near its origin target or a random border
    let spawnX = initialX;
    let spawnY = initialY;
    if (spawnX === undefined || spawnY === undefined) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 20;
        spawnX = Math.max(8, Math.min(92, goal.targetX + Math.cos(angle) * dist));
        spawnY = Math.max(8, Math.min(92, goal.targetY + Math.sin(angle) * dist));
    }

    const uniqueId = `squad_${template.templateId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    let leaderNameDisplay = template.leaderName;
    if (template.category === 'bandits' || template.category === 'cultists') {
        leaderNameDisplay = generateRandomName('any', 'any', getStableSeed(uniqueId + 'leader'));
    }

    const isNecromancerSquad = template.category === 'undead' || template.templateId.includes('necromancer');

    const opponent: OpponentData = {
        id: `monster_leader_${uniqueId}`,
        name: leaderNameDisplay,
        title: template.leaderTitle,
        avatar: template.leaderAvatar,
        type: 'champion',
        rank: template.level,
        difficulty: template.dangerRating === 'Елітний Вожак' ? 'master' : template.dangerRating === 'Смертельний' ? 'expert' : template.dangerRating === 'Небезпечний' ? 'hard' : 'normal',
        flavorQuote: isNecromancerSquad 
            ? `«Повстаньте із занепаду, мої вірні мерці! Ваш володар потребує вашої крові та кісток!»`
            : `«Наша банда не знає жалю! Готуй золото та зброю або прощайся з життям!»`,
        description: template.leaderLore,
        hp: template.hp,
        armor: template.armor,
        powerPoints: template.powerPoints,
        baseHp: template.hp,
        strength: template.strength,
        agility: template.agility,
        rewards: {
            gold: template.baseGold + Math.floor(Math.random() * 20),
            powerPoints: 3,
            reputation: 15,
            xp: template.baseXp
        }
    };

    const allies: SquadAlly[] = [];

    if (isNecromancerSquad) {
        // Necromancer walks with 1-6 zombies and 1-8 skeletons
        const numZombies = 1 + Math.floor(Math.random() * 6); // 1-6 zombies
        const numSkeletons = 1 + Math.floor(Math.random() * 8); // 1-8 skeletons

        const zombieTypes = [
            { name: 'Гнилий Зомбі', title: 'Зомбі', avatar: '🧟' },
            { name: 'Ожилий Кадавр', title: 'Зомбі', avatar: '🧟' },
            { name: 'Зомбі-Пожирач', title: 'Зомбі', avatar: '🧟' },
            { name: 'Повзучий Мрець', title: 'Зомбі', avatar: '🧟' },
            { name: 'Кровожерливий Зомбі', title: 'Зомбі', avatar: '🧟' },
            { name: 'Вурдалак-Зомбі', title: 'Зомбі', avatar: '🧟' }
        ];

        const skeletonTypes = [
            { name: 'Скелет-Воїн', title: 'Скелет', avatar: '💀' },
            { name: 'Кістлявий Мечник', title: 'Скелет', avatar: '💀' },
            { name: 'Скелет-Копейщик', title: 'Скелет-Списик', avatar: '💀' },
            { name: 'Скелет-Арбалетник', title: 'Скелет-Стрілець', avatar: '💀' },
            { name: 'Древній Скелет-Страж', title: 'Скелет-Вартовий', avatar: '💀' },
            { name: 'Іржавий Скелет', title: 'Скелет', avatar: '💀' }
        ];

        let index = 0;
        // 1. Add Zombies (1-6)
        for (let i = 0; i < numZombies; i++) {
            const zType = zombieTypes[i % zombieTypes.length];
            const allyId = `ally_zombie_${uniqueId}_${index++}`;
            const allyHp = 40 + Math.floor(Math.random() * 20); // 40-60 HP
            const allyStrength = 16 + Math.floor(Math.random() * 4);
            const allyAgility = 8 + Math.floor(Math.random() * 4);
            const allyArmor = 6 + Math.floor(Math.random() * 4);

            const allyNameDisplay = `${zType.name} #${i + 1}`;

            const allyOpponent: OpponentData = {
                id: `monster_ally_${allyId}`,
                name: allyNameDisplay,
                title: zType.title,
                avatar: zType.avatar,
                type: 'contender',
                rank: Math.max(1, template.level - 1),
                difficulty: 'normal',
                flavorQuote: `«Гррр... Пожирати... свіже м'ясо...»`,
                description: `Оживлена некромантом плоть у загоні «${template.name}»`,
                hp: allyHp,
                armor: allyArmor,
                powerPoints: 1,
                baseHp: allyHp,
                strength: allyStrength,
                agility: allyAgility,
                rewards: {
                    gold: Math.floor(template.baseGold / 5),
                    powerPoints: 1,
                    reputation: 2,
                    xp: Math.floor(template.baseXp / 5)
                }
            };

            allies.push({
                id: allyId,
                name: allyNameDisplay,
                title: zType.title,
                avatar: zType.avatar,
                hp: allyHp,
                maxHp: allyHp,
                baseHp: allyHp,
                strength: allyStrength,
                agility: allyAgility,
                armor: allyArmor,
                isDefeated: false,
                opponent: allyOpponent
            });
        }

        // 2. Add Skeletons (1-8)
        for (let j = 0; j < numSkeletons; j++) {
            const sType = skeletonTypes[j % skeletonTypes.length];
            const allyId = `ally_skeleton_${uniqueId}_${index++}`;
            const allyHp = 30 + Math.floor(Math.random() * 15); // 30-45 HP
            const allyStrength = 13 + Math.floor(Math.random() * 4);
            const allyAgility = 14 + Math.floor(Math.random() * 4);
            const allyArmor = 10 + Math.floor(Math.random() * 4);

            const allyNameDisplay = `${sType.name} #${j + 1}`;

            const allyOpponent: OpponentData = {
                id: `monster_ally_${allyId}`,
                name: allyNameDisplay,
                title: sType.title,
                avatar: sType.avatar,
                type: 'contender',
                rank: Math.max(1, template.level - 1),
                difficulty: 'normal',
                flavorQuote: `«Кістки брязкають... Могильний холод іде за вироком Некроманта!»`,
                description: `Закований у залізо скелет із древньої усипальниці під проводом Некроманта`,
                hp: allyHp,
                armor: allyArmor,
                powerPoints: 1,
                baseHp: allyHp,
                strength: allyStrength,
                agility: allyAgility,
                rewards: {
                    gold: Math.floor(template.baseGold / 5),
                    powerPoints: 1,
                    reputation: 2,
                    xp: Math.floor(template.baseXp / 5)
                }
            };

            allies.push({
                id: allyId,
                name: allyNameDisplay,
                title: sType.title,
                avatar: sType.avatar,
                hp: allyHp,
                maxHp: allyHp,
                baseHp: allyHp,
                strength: allyStrength,
                agility: allyAgility,
                armor: allyArmor,
                isDefeated: false,
                opponent: allyOpponent
            });
        }
    } else {
        const alliesCount = Math.floor(Math.random() * 11); // 0 to 10 allies
        const allyNamesMap: Record<MonsterCategory, Array<{ name: string; title: string; avatar: string }>> = {
            bandits: [
                { name: 'Бандит-Засідник', title: 'Бандит', avatar: '🥷' },
                { name: 'Лісовий Грабіжник', title: 'Грабіжник', avatar: '🏹' },
                { name: 'Лютий Головоріз', title: 'Головоріз', avatar: '🗡️' },
                { name: 'Розбійник з Тракту', title: 'Розбійник', avatar: '🥷' },
                { name: 'Нічний Грабіжник', title: 'Грабіжник', avatar: '🗡️' },
                { name: 'Степовий Бандит', title: 'Бандит', avatar: '🐎' },
                { name: 'Підступний Головоріз', title: 'Головоріз', avatar: '🗡️' },
                { name: 'Дорожній Розбійник', title: 'Розбійник', avatar: '🥷' },
                { name: 'Безжальний Бандит', title: 'Бандит', avatar: '🪓' },
                { name: 'Грабіжник Караванів', title: 'Грабіжник', avatar: '💰' },
                { name: 'Головоріз Околиць', title: 'Головоріз', avatar: '🗡️' },
                { name: 'Межовий Розбійник', title: 'Розбійник', avatar: '🥷' },
            ],
            beasts: [
                { name: 'Лютий Головоріз', title: 'Головоріз', avatar: '🗡️' },
                { name: 'Лісовий Грабіжник', title: 'Грабіжник', avatar: '🏹' },
            ],
            undead: [
                { name: 'Зомбі-Пожирач', title: 'Зомбі', avatar: '🧟' },
                { name: 'Скелет-Воїн', title: 'Скелет', avatar: '💀' },
            ],
            cultists: [
                { name: 'Головоріз Засідок', title: 'Головоріз', avatar: '🥷' },
            ],
            aberrations: [
                { name: 'Безжальний Грабіжник', title: 'Грабіжник', avatar: '🪓' },
            ]
        };

        const templatesList = allyNamesMap[template.category] || allyNamesMap.bandits;

        for (let i = 0; i < alliesCount; i++) {
            const allyTemplate = templatesList[Math.floor(Math.random() * templatesList.length)];
            const allyId = `ally_${uniqueId}_${i}`;
            const allyHp = Math.max(30, Math.floor(template.hp * 0.5) + Math.floor(Math.random() * 25));
            const allyStrength = Math.max(10, template.strength - 4 + Math.floor(Math.random() * 6));
            const allyAgility = Math.max(10, template.agility - 4 + Math.floor(Math.random() * 6));
            const allyArmor = Math.max(4, template.armor - 6 + Math.floor(Math.random() * 8));

            let randomBanditName = generateRandomName('any', 'any', getStableSeed(allyId));
            let allyNameDisplay = `${randomBanditName} (${allyTemplate.title})`;

            const allyOpponent: OpponentData = {
                id: `monster_ally_${allyId}`,
                name: randomBanditName,
                title: allyTemplate.title,
                avatar: allyTemplate.avatar,
                type: 'contender',
                rank: Math.max(1, template.level - 1),
                difficulty: 'normal',
                flavorQuote: `«За отамана! Грабуй і ріж!»`,
                description: `${allyTemplate.title} у бандитському загоні «${template.name}»`,
                hp: allyHp,
                armor: allyArmor,
                powerPoints: 2,
                baseHp: allyHp,
                strength: allyStrength,
                agility: allyAgility,
                rewards: {
                    gold: Math.floor(template.baseGold / 4),
                    powerPoints: 1,
                    reputation: 3,
                    xp: Math.floor(template.baseXp / 4)
                }
            };

            allies.push({
                id: allyId,
                name: allyNameDisplay,
                title: allyTemplate.title,
                avatar: allyTemplate.avatar,
                hp: allyHp,
                maxHp: allyHp,
                baseHp: allyHp,
                strength: allyStrength,
                agility: allyAgility,
                armor: allyArmor,
                isDefeated: false,
                opponent: allyOpponent
            });
        }
    }

    return {
        id: uniqueId,
        name: template.name,
        avatar: template.avatar,
        category: template.category,
        themeColor: template.themeColor,
        level: template.level,
        dangerRating: template.dangerRating,
        membersCount: 1 + allies.length,
        allies,
        x: spawnX,
        y: spawnY,
        speed: template.speed,
        state: 'marching',
        actionTimer: 0,
        currentGoal: goal,
        leader: {
            name: template.leaderName,
            title: template.leaderTitle,
            avatar: template.leaderAvatar,
            lore: template.leaderLore,
            hp: template.hp,
            armor: template.armor,
            powerPoints: template.powerPoints,
            baseHp: template.hp,
            strength: template.strength,
            agility: template.agility,
            isDefeated: false,
            opponent
        },
        rewards: {
            gold: template.baseGold,
            cardPieces: template.basePieces,
            xp: template.baseXp,
            reputation: 15
        }
    };
}

// Generates 8 distinct wandering monster squads across the continent
export function generateInitialWanderingSquads(): MonsterSquad[] {
    const squads: MonsterSquad[] = [];
    
    // Spread initial positions across different quadrants of the map
    const spawnPoints = [
        { x: 22, y: 35 },
        { x: 78, y: 25 },
        { x: 38, y: 65 },
        { x: 82, y: 72 },
        { x: 50, y: 48 },
        { x: 18, y: 78 },
        { x: 68, y: 40 },
        { x: 88, y: 55 },
        { x: 30, y: 20 },
        { x: 62, y: 82 }
    ];

    SQUAD_TEMPLATES.forEach((tmpl, idx) => {
        const pt = spawnPoints[idx % spawnPoints.length];
        squads.push(createSquadFromTemplate(tmpl, pt.x, pt.y));
    });

    return squads;
}

// AI update loop for wandering squads
export interface SquadUpdateResult {
    updatedSquads: MonsterSquad[];
    collidedSquad: MonsterSquad | null;
    chasingSquad: MonsterSquad | null;
}

export function updateWanderingSquads(
    squads: MonsterSquad[],
    deltaSeconds: number,
    playerPos: { x: number; y: number },
    isPlayerInCombat: boolean = false
): SquadUpdateResult {
    let collidedSquad: MonsterSquad | null = null;
    let chasingSquad: MonsterSquad | null = null;

    const updatedSquads: MonsterSquad[] = squads.map((squad): MonsterSquad => {
        // Compute distance to player
        const distToPlayer = Math.hypot(squad.x - playerPos.x, squad.y - playerPos.y);

        // Collision detection (within 1.8% of map)
        if (!isPlayerInCombat && distToPlayer <= 1.8 && !collidedSquad) {
            collidedSquad = squad;
        }

        let nextState: SquadState = squad.state;
        let nextGoal = { ...squad.currentGoal };
        let nextActionTimer = squad.actionTimer;
        let currentTargetX = nextGoal.targetX;
        let currentTargetY = nextGoal.targetY;
        let effectiveSpeed = squad.speed;

        // Player proximity detection: if player is within 6.5% detection radius and not in combat
        if (!isPlayerInCombat && distToPlayer <= 6.5) {
            nextState = 'chasing_player';
            currentTargetX = playerPos.x;
            currentTargetY = playerPos.y;
            effectiveSpeed = squad.speed * 1.25; // 25% sprint boost when chasing
            chasingSquad = squad;
        } else if (nextState === 'chasing_player' && distToPlayer > 10.0) {
            // Lost sight of player, resume normal goal
            nextState = 'marching';
            currentTargetX = nextGoal.targetX;
            currentTargetY = nextGoal.targetY;
        }

        // If currently raiding / paused at destination
        if (nextState === 'raiding' || nextState === 'hunting') {
            nextActionTimer -= deltaSeconds;
            if (nextActionTimer <= 0) {
                // Done raiding, pick a new goal!
                nextGoal = pickRandomGoal();
                nextState = 'marching';
                nextActionTimer = 0;
            }
            return {
                ...squad,
                state: nextState,
                actionTimer: Math.max(0, nextActionTimer),
                currentGoal: nextGoal
            };
        }

        // Marching towards destination
        const dx = currentTargetX - squad.x;
        const dy = currentTargetY - squad.y;
        const distToTarget = Math.hypot(dx, dy);

        if (distToTarget <= 1.2 && nextState !== 'chasing_player') {
            // Reached destination! Enter raiding state for 8 seconds
            return {
                ...squad,
                state: 'raiding',
                actionTimer: 8.0,
                currentGoal: nextGoal
            };
        }

        // Move towards target
        const moveDist = effectiveSpeed * deltaSeconds;
        const ratio = Math.min(1, moveDist / Math.max(0.001, distToTarget));
        const newX = Math.max(4, Math.min(96, squad.x + dx * ratio));
        const newY = Math.max(4, Math.min(96, squad.y + dy * ratio));

        return {
            ...squad,
            x: Number(newX.toFixed(2)),
            y: Number(newY.toFixed(2)),
            state: nextState,
            actionTimer: nextActionTimer,
            currentGoal: nextGoal
        };
    });

    return {
        updatedSquads,
        collidedSquad,
        chasingSquad
    };
}

// Respawns a squad that was defeated
export function respawnDefeatedSquad(existingSquads: MonsterSquad[], squadId: string): MonsterSquad[] {
    const tmplIndex = Math.floor(Math.random() * SQUAD_TEMPLATES.length);
    const tmpl = SQUAD_TEMPLATES[tmplIndex];
    
    // Spawn at a random graveyard or edge
    const darkSpots = WORLD_SETTLEMENTS.filter(s => s.type === 'graveyard' || s.type === 'ruins');
    const spot = darkSpots[Math.floor(Math.random() * darkSpots.length)];
    const spawnX = spot ? spot.x + (Math.random() - 0.5) * 4 : 50;
    const spawnY = spot ? spot.y + (Math.random() - 0.5) * 4 : 50;

    const newSquad = createSquadFromTemplate(tmpl, spawnX, spawnY);
    return existingSquads.filter(s => s.id !== squadId).concat(newSquad);
}

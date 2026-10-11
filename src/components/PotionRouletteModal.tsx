import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { OpponentData, WorldProgress, ToySoldier, HiredCompanion, CharacterGender } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    RotateCcw, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    FastForward,
    Users,
    Skull,
    Gift
} from 'lucide-react';

interface PotionRouletteModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    progress?: WorldProgress;
    onUpdateProgress?: (progress: WorldProgress) => void;
    onVictory: (goldWon?: number) => void;
    onDefeat: () => void;
    onClose: () => void;
}

export const POTION_PARTICIPANT_OPTIONS = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200];

export function getPotionRoulettePrize(count: number): number {
    const idx = POTION_PARTICIPANT_OPTIONS.indexOf(count);
    if (idx !== -1) {
        return 20 * Math.pow(2, idx);
    }
    const step = Math.max(0, Math.round((count - 20) / 20));
    return 20 * Math.pow(2, step);
}

export type PotionType = 
    | 'light_poison' 
    | 'medium_poison' 
    | 'heavy_poison' 
    | 'healing' 
    | 'water'
    | 'antidote'
    | 'sorbent'
    | 'catalyst'
    | 'inhibitor'
    | 'mixture'
    | 'compression'
    | 'decompression'
    | 'sleep'
    | 'slow_poison'
    | 'vigor'
    | 'vodka'
    | 'beer'
    | 'permanganate'
    | 'poison'
    | 'fortune'
    | 'invulnerability'
    | 'love'
    | 'friendship';

export interface PotionItem {
    id: number;
    type: PotionType;
    name: string;
    hpChange: number;
    color: string;
    icon: string;
    description: string;
    spikedBy?: string;
    spikedByName?: string;
    spikedByAvatar?: string;
    spikedByGender?: CharacterGender;
    isSpikedLove?: boolean;
    isSpikedFriendship?: boolean;
    fortuneTurns?: number;
}

export interface Participant {
    id: string;
    name: string;
    avatar: string;
    gender?: CharacterGender;
    hp: number;
    maxHp: number;
    isPlayer: boolean;
    isEliminated: boolean;
    lastPotion?: PotionItem;

    // Status effects
    hasAntidote?: boolean;
    hasSorbent?: boolean;
    catalystMultiplier?: number;
    inhibitorMultiplier?: number;
    mixtureTurns?: number;
    slowPoisonTurns?: number;
    compressionCountdown?: number;
    isCompressed?: boolean;
    compressedUnitType?: 'пішак' | 'шашка' | 'піхотинець' | 'магічний_пішак';
    isAsleep?: boolean;
    isVigorous?: boolean;
    drunkenness?: number;
    hasPermanganate?: boolean;
    hasFortune?: boolean;
    fortuneTurns?: number;
    invulnerabilityTurns?: number;
    natureBreakRounds?: number;
    recruitedToId?: string;
    recruitedToName?: string;
    recruitedType?: 'love' | 'friendship';

    // Tactical action counts
    givePotionUses?: number;
    scanAndChooseUses?: number;
    scanAndDiscardUses?: number;
    discardSecretUses?: number;
    solventUses?: number;
    hasSolventActive?: boolean;
    sorbentUses?: number;
    hasSorbentActive?: boolean;
    snakeEaterUses?: number;
    hasSnakeEaterActive?: boolean;
    vomitDrugUses?: number;
    poisonResistUses?: number;
    hasPoisonResistActive?: boolean;
    wakeUpUses?: number;
    distillUses?: number;
    miracleUses?: number;
    neutralizerUses?: number;
    filterUses?: number;
    transmutePoisonUses?: number;
    tasterUses?: number;
    skipTurnUses?: number;
    mixPotionsUses?: number;
    flushTableUses?: number;
    craftHealingUses?: number;
    craftMixtureUses?: number;
    craftInvulnerabilityUses?: number;
    craftFortuneUses?: number;
    craftFortune3Uses?: number;
    craftFortune5Uses?: number;
    natureBreakUses?: number;
    spikeLoveUses?: number;
    spikeFriendshipUses?: number;
    spikeSleepUses?: number;
    highlightHealingUses?: number;
    highlightMixtureUses?: number;
    highlightPoisonsUses?: number;
    neutralizeAllPoisonsUses?: number;
    weakenAllPoisonsUses?: number;
    hasPoisonToMixtureActive?: boolean;
    poisonToMixtureUses?: number;
    hasPoisonToWaterActive?: boolean;
    poisonToWaterUses?: number;
    hasPoisonToSorbentActive?: boolean;
    poisonToSorbentUses?: number;
}

interface SleepDiceState {
    participant: Participant;
    bottle?: PotionItem;
    rolls: number[];
    isRolling: boolean;
    finished: boolean;
    successCount: number;
    failCount: number;
    isAsleep: boolean;
    bottleId: number;
    isDrunkRoll?: boolean;
}

const INITIAL_POTIONS_RECIPE: { 
    type: PotionType; 
    count: number; 
    name: string; 
    hpChange: number; 
    color: string; 
    icon: string; 
    description: string 
}[] = [
    { type: 'light_poison', count: 10, name: 'Легкий яд', hpChange: -40, color: 'text-lime-400 bg-lime-950/80 border-lime-500', icon: '🧪', description: '-40 HP пошкодження' },
    { type: 'medium_poison', count: 5, name: 'Середній яд', hpChange: -60, color: 'text-purple-400 bg-purple-950/80 border-purple-500', icon: '⚗️', description: '-60 HP пошкодження' },
    { type: 'heavy_poison', count: 3, name: 'Тяжкий яд', hpChange: -100, color: 'text-red-400 bg-red-950/80 border-red-500', icon: '☠️', description: '-100 HP смертельна отрута' },
    { type: 'healing', count: 2, name: 'Зілля зцілення', hpChange: 20, color: 'text-rose-300 bg-rose-950/80 border-rose-500', icon: '💖', description: '+20 HP відновлення' },
    { type: 'water', count: 2, name: 'Чиста вода', hpChange: 0, color: 'text-sky-300 bg-sky-950/80 border-sky-500', icon: '💧', description: '0 HP освіжаюча вода' },
    { type: 'antidote', count: 1, name: 'Антидот', hpChange: 0, color: 'text-teal-300 bg-teal-950/80 border-teal-500', icon: '🛡️', description: 'Блокує наступний яд (знешкоджується після ураження)' },
    { type: 'sorbent', count: 1, name: 'Сорбент', hpChange: 0, color: 'text-stone-300 bg-stone-900/80 border-stone-500', icon: '🧽', description: 'Повністю нейтралізує ДІЮ наступного випитого зілля' },
    { type: 'catalyst', count: 1, name: 'Каталізатор', hpChange: 0, color: 'text-yellow-300 bg-yellow-950/80 border-yellow-500', icon: '⚡', description: 'Подвоює ефект яду чи лікування в наступному ході (2x)' },
    { type: 'inhibitor', count: 1, name: 'Інгібітор', hpChange: 0, color: 'text-cyan-300 bg-cyan-950/80 border-cyan-500', icon: '❄️', description: 'Послаблює ефект яду чи лікування в наступному ході (0.5x)' },
    { type: 'mixture', count: 1, name: 'Мікстура', hpChange: 10, color: 'text-emerald-300 bg-emerald-950/80 border-emerald-500', icon: '🍵', description: 'Лікує по +10 HP щоходу впродовж 3 ходів' },
    { type: 'compression', count: 1, name: 'Зілля компресії', hpChange: 0, color: 'text-indigo-300 bg-indigo-950/80 border-indigo-500', icon: '📦', description: 'Через 3 ходи стискає в іграшку (1d4). Переможець забирає її!' },
    { type: 'decompression', count: 1, name: 'Зілля декомпресії', hpChange: 0, color: 'text-fuchsia-300 bg-fuchsia-950/80 border-fuchsia-500', icon: '🔓', description: 'Відміняє дію активного Зілля компресії!' },
    { type: 'sleep', count: 1, name: 'Зілля сну', hpChange: 0, color: 'text-purple-300 bg-purple-950/80 border-purple-500', icon: '💤', description: 'Кидок 5d20: 3 поразки (≤10) = гравець засинає і вибуває!' },
    { type: 'slow_poison', count: 1, name: 'Повільний яд', hpChange: -5, color: 'text-amber-400 bg-amber-950/80 border-amber-600', icon: '🐍', description: 'Задає -5 HP шкоди щоходу впродовж 3 ходів' },
    { type: 'vigor', count: 1, name: 'Зілля бадьорості', hpChange: 0, color: 'text-amber-300 bg-amber-950/80 border-amber-500', icon: '⚡', description: 'Не дає заснути до кінця гри' },
    { type: 'vodka', count: 8, name: 'Горілка', hpChange: 0, color: 'text-slate-200 bg-slate-900/80 border-slate-400', icon: '🍾', description: '+1d10 до захмеленості. Якщо >25%, кидок на сон щоходу, але дія ядів зменшується у 2 рази' },
    { type: 'beer', count: 5, name: 'Пиво', hpChange: 0, color: 'text-yellow-400 bg-amber-950/40 border-yellow-600', icon: '🍺', description: '+1d6 до захмеленості' },
    { type: 'permanganate', count: 2, name: 'Марганцівка', hpChange: 0, color: 'text-pink-400 bg-pink-950/80 border-pink-500', icon: '🧼', description: 'Відміняє дію всіх зіль у наступному ході (виблює все разом з випитим)' },
    { type: 'fortune', count: 1, name: 'Зілля успіху', hpChange: 0, color: 'text-amber-400 bg-amber-950/80 border-amber-500', icon: '🍀', description: 'Любе випите зілля в наступному ході виявиться зіллям лікування (+20 HP)' },
];

function generateShuffledPotions(participantCount: number = 40): PotionItem[] {
    const list: PotionItem[] = [];
    let idCounter = 1;

    // Scale recipe count based on ratio to 40 participants
    const ratio = Math.max(0.5, participantCount / 40);

    for (const group of INITIAL_POTIONS_RECIPE) {
        const count = Math.max(1, Math.round(group.count * ratio));
        for (let i = 0; i < count; i++) {
            list.push({
                id: idCounter++,
                type: group.type,
                name: group.name,
                hpChange: group.hpChange,
                color: group.color,
                icon: group.icon,
                description: group.description
            });
        }
    }
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

const MALE_NPC_NAMES: { name: string; avatar: string; gender: CharacterGender }[] = [
    { name: 'Грім Залізнорукий', avatar: '🧔', gender: 'male' },
    { name: 'Алхімік Раду', avatar: '🧙‍♂️', gender: 'male' },
    { name: 'Одноокий Боб', avatar: '🦹‍♂️', gender: 'male' },
    { name: 'Корчмар Семен', avatar: '🧑‍🌾', gender: 'male' },
    { name: 'Ліндор Срібний', avatar: '🧝‍♂️', gender: 'male' },
    { name: 'Тінь Завулків', avatar: '🥷', gender: 'male' },
    { name: 'Бальтазар Жорстокий', avatar: '🧔‍♂️', gender: 'male' },
    { name: 'Граф Влад', avatar: '🧛‍♂️', gender: 'male' },
    { name: 'Грок Сокира', avatar: '🧌', gender: 'male' },
    { name: 'Таелін Мисливець', avatar: '🏹', gender: 'male' },
    { name: 'Кухар Влас', avatar: '🧑‍🍳', gender: 'male' },
    { name: 'Купець Касім', avatar: '👳', gender: 'male' },
    { name: 'Дід Панас', avatar: '🧓', gender: 'male' },
    { name: 'Капітан Дрейк', avatar: '🧑‍✈️', gender: 'male' },
    { name: 'Слідопит Ян', avatar: '🤠', gender: 'male' },
    { name: 'Гном Борух', avatar: '⛏️', gender: 'male' },
    { name: 'Астролог Назар', avatar: '🔮', gender: 'male' },
    { name: 'Бронзовий Голем', avatar: '🗿', gender: 'male' },
    { name: 'Чародій Зиновій', avatar: '✨', gender: 'male' },
    { name: 'Хитрун Олексій', avatar: '🎭', gender: 'male' },
    { name: 'Залізоволосий Орест', avatar: '🛡️', gender: 'male' },
    { name: 'Зухвалий Тарас', avatar: '⚔️', gender: 'male' },
    { name: 'Сліпий Лірник', avatar: '🪕', gender: 'male' },
    { name: 'Маг Вогню Любомир', avatar: '🔥', gender: 'male' },
    { name: 'Володар Тіней Святослав', avatar: '🌌', gender: 'male' },
    { name: 'Друїд Мирослав', avatar: '🌿', gender: 'male' },
    { name: 'Темний Лицар Острій', avatar: '🗡️', gender: 'male' },
    { name: 'Лісовий Ельф Ярослав', avatar: '🍃', gender: 'male' },
    { name: 'Старий Козак Василь', avatar: '🪓', gender: 'male' },
    { name: 'Алхімік Маркіян', avatar: '🧪', gender: 'male' },
    { name: 'Берсерк Богдан', avatar: '🪓', gender: 'male' },
    { name: 'Священик Дмитро', avatar: '📿', gender: 'male' }
];

const FEMALE_NPC_NAMES: { name: string; avatar: string; gender: CharacterGender }[] = [
    { name: 'Елірія Нічна', avatar: '🧝‍♀️', gender: 'female' },
    { name: 'Морріган Відьма', avatar: '🧙‍♀️', gender: 'female' },
    { name: 'Піксі Нікс', avatar: '🧚', gender: 'female' },
    { name: 'Гадюка Лея', avatar: '🦹‍♀️', gender: 'female' },
    { name: 'Валькірія Фрея', avatar: '🛡️', gender: 'female' },
    { name: 'Чародійка Дарина', avatar: '🌸', gender: 'female' },
    { name: 'Княгиня Ольга', avatar: '👸', gender: 'female' },
    { name: 'Ворожка Соломія', avatar: '🔮', gender: 'female' },
    { name: 'Стрільчиня Оксана', avatar: '🏹', gender: 'female' },
    { name: 'Цілителька Олена', avatar: '💖', gender: 'female' },
    { name: 'Мавка Лісова', avatar: '🌿', gender: 'female' },
    { name: 'Розбійниця Катерина', avatar: '🗡️', gender: 'female' },
    { name: 'Травничиня Ярина', avatar: '🍃', gender: 'female' },
    { name: 'Майстриня Богдана', avatar: '✨', gender: 'female' },
    { name: 'Чаклунка Зоряна', avatar: '🌙', gender: 'female' },
    { name: 'Паладинка Христина', avatar: '⚔️', gender: 'female' },
    { name: 'Бардеса Наталя', avatar: '🪕', gender: 'female' },
    { name: 'Володарка Снігів Ілона', avatar: '❄️', gender: 'female' },
    { name: 'Нишпорка Світлана', avatar: '🥷', gender: 'female' },
    { name: 'Амазонка Роксолана', avatar: '🛡️', gender: 'female' }
];

const MALE_TITLES = ['Лицар', 'Алхімік', 'Чародій', 'Стрілець', 'Вартовий', 'Друїд', 'Берсерк', 'Монах', 'Бард', 'Слідопит', 'Шукач', 'Гном', 'Ельф', 'Орк', 'Паладин', 'Розбійник', 'Купець', 'Володар', 'Маг', 'Майстер', 'Воєвода', 'Гетьман', 'Отаман'];
const FEMALE_TITLES = ['Лицарка', 'Алхімічка', 'Чародійка', 'Стрільчиня', 'Вартова', 'Друїдка', 'Берсеркерка', 'Черниця', 'Бардеса', 'Слідопитка', 'Шукачка', 'Гномиха', 'Ельфійка', 'Орчанка', 'Паладинка', 'Розбійниця', 'Купчиха', 'Володарка', 'Магиня', 'Майстриня', 'Княгиня', 'Ворожка', 'Цілителька'];

const MALE_FIRST_NAMES = ['Орест', 'Тарас', 'Богдан', 'Ярослав', 'Святослав', 'Мирослав', 'Назар', 'Зиновій', 'Олексій', 'Данило', 'Захар', 'Всеволод', 'Борис', 'Ростислав', 'Влас', 'Касім', 'Маркіян', 'Дмитро', 'Любомир', 'Острій', 'Василь', 'Максим', 'Андрій', 'Степан', 'Матвій', 'Лев', 'Іван', 'Петро', 'Микола', 'Олег', 'Ігор', 'Володимир', 'Роман'];
const FEMALE_FIRST_NAMES = ['Соломія', 'Оксана', 'Катерина', 'Олена', 'Дарина', 'Богдана', 'Ярина', 'Наталя', 'Зоряна', 'Христина', 'Ольга', 'Анна', 'Марія', 'Софія', 'Анастасія', 'Любов', 'Надія', 'Віра', 'Людмила', 'Мирослава', 'Ярослава', 'Владислава', 'Звенислава', 'Мальва', 'Лада', 'Веселина', 'Милана', 'Радослава', 'Таїсія', 'Тетяна', 'Уляна'];

const MALE_GUILDS = ['з Вежі', 'з Лісу', 'з Гори', 'Вогняний', 'Темний', 'Срібний', 'Залізний', 'Бронзовий', 'Золотий', 'Хоробрий', 'Мудрий', 'Швидкий', 'Могутній', 'Незламний'];
const FEMALE_GUILDS = ['з Вежі', 'з Лісу', 'з Гори', 'Вогняна', 'Темна', 'Срібна', 'Залізна', 'Бронзова', 'Золота', 'Хоробра', 'Мудра', 'Швидка', 'Могутня', 'Незламна'];

const MALE_AVATARS = ['🧔', '👨', '🧙‍♂️', '🦹‍♂️', '🧑‍🌾', '🧝‍♂️', '🥷', '🧔‍♂️', '🧛‍♂️', '🧌', '🏹', '🧑‍🍳', '👳', '🧓', '🧑‍✈️', '🤠', '🛡️', '⛏️', '🔮', '🗿', '✨', '🎭', '⚔️', '🪕', '🔥', '🌌', '🌿', '🗡️', '🍃', '🪓', '🧪', '📿', '🐺', '🦁', '🦅', '🐻'];
const FEMALE_AVATARS = ['🧝‍♀️', '🧙‍♀️', '🦹‍♀️', '🧚', '👸', '👩‍🦰', '👩‍🦳', '👩‍🎤', '👩‍🌾', '👩‍🔬', '👩‍🎓', '🧕', '💃', '🌸', '🌙'];

function generateNpcList(neededCount: number): { name: string; avatar: string; gender: CharacterGender }[] {
    const result: { name: string; avatar: string; gender: CharacterGender }[] = [];
    
    // Interleave base male and female names
    const maxBase = Math.max(MALE_NPC_NAMES.length, FEMALE_NPC_NAMES.length);
    for (let i = 0; i < maxBase; i++) {
        if (i < MALE_NPC_NAMES.length && result.length < neededCount) {
            result.push(MALE_NPC_NAMES[i]);
        }
        if (i < FEMALE_NPC_NAMES.length && result.length < neededCount) {
            result.push(FEMALE_NPC_NAMES[i]);
        }
    }

    let counter = 1;
    while (result.length < neededCount) {
        const isFemale = counter % 2 === 1;
        const gender: CharacterGender = isFemale ? 'female' : 'male';
        
        const titleList = isFemale ? FEMALE_TITLES : MALE_TITLES;
        const firstNameList = isFemale ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES;
        const guildList = isFemale ? FEMALE_GUILDS : MALE_GUILDS;
        const avatarList = isFemale ? FEMALE_AVATARS : MALE_AVATARS;

        const title = titleList[(counter * 3) % titleList.length];
        const firstName = firstNameList[(counter * 5) % firstNameList.length];
        const guild = guildList[(counter * 7) % guildList.length];
        const avatar = avatarList[counter % avatarList.length];

        result.push({
            name: `${title} ${firstName} ${guild}`,
            avatar: avatar,
            gender: gender
        });
        counter++;
    }
    return result.slice(0, neededCount);
}

export default function PotionRouletteModal({
    expectedXpReward = 150,
    isOpen,
    tavernName,
    progress,
    onUpdateProgress,
    onVictory,
    onDefeat,
    onClose
}: PotionRouletteModalProps) {
    const [participantCount, setParticipantCount] = useState<number>(20);
    const [round, setRound] = useState<number>(1);
    const [potions, setPotions] = useState<PotionItem[]>([]);
    const [selectedBottleIds, setSelectedBottleIds] = useState<number[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
    const [fastMode, setFastMode] = useState<boolean>(false);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [lastActionText, setLastActionText] = useState<string>('Гра розпочалася! Учасники готові випробувати зілля!');
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<Participant | null>(null);
    const [compressedRewards, setCompressedRewards] = useState<ToySoldier[]>([]);
    const [log, setLog] = useState<string[]>([]);
    
    const currentPrize = getPotionRoulettePrize(participantCount);
    
    // Stable Refs for state reading without breaking AI timers
    const participantsRef = useRef<Participant[]>([]);
    participantsRef.current = participants;

    const potionsRef = useRef<PotionItem[]>([]);
    potionsRef.current = potions;

    const selectedBottleIdsRef = useRef<number[]>([]);
    selectedBottleIdsRef.current = selectedBottleIds;

    const compressedRewardsRef = useRef<ToySoldier[]>([]);
    compressedRewardsRef.current = compressedRewards;

    const fastModeRef = useRef<boolean>(fastMode);
    fastModeRef.current = fastMode;

    // Interactive 5d20 Sleep Dice State
    const [sleepDiceState, setSleepDiceState] = useState<SleepDiceState | null>(null);

    // Tactical Actions State
    const [selectedTactic, setSelectedTactic] = useState<'scan_choose' | 'scan_discard' | 'discard_secret' | 'wake_up' | 'distill' | 'miracle' | 'neutralizer' | 'filter' | 'taster' | 'skipTurn' | 'mixPotions' | 'flushTable' | 'sorbent' | 'vomitDrug' | 'craft_healing' | 'craft_mixture' | 'craft_invulnerability' | 'craft_fortune' | 'craft_fortune_3' | 'craft_fortune_5' | 'spike_love' | 'spike_friendship' | 'spike_sleep' | null>(null);
    const [craftingSelectedBottles, setCraftingSelectedBottles] = useState<PotionItem[]>([]);
    const [scanChooseBottle, setScanChooseBottle] = useState<PotionItem | null>(null);
    const [scanDiscardBottle, setScanDiscardBottle] = useState<PotionItem | null>(null);
    const [givenPotionContext, setGivenPotionContext] = useState<{ bottle: PotionItem; from: Participant; listWithReducedUses: Participant[] } | null>(null);
    const [mixPotionsFirstBottle, setMixPotionsFirstBottle] = useState<PotionItem | null>(null);
    const [showRerouteTargets, setShowRerouteTargets] = useState<boolean>(false);
    const [activeMobileTab, setActiveMobileTab] = useState<'potions' | 'participants' | 'log'>('potions');
    const [rightPanelTab, setRightPanelTab] = useState<'participants' | 'log'>('participants');
    const [isTacticsExpanded, setIsTacticsExpanded] = useState<boolean>(true);

    // Visual highlights on table
    const [revealedHealing, setRevealedHealing] = useState<boolean>(false);
    const [revealedMixture, setRevealedMixture] = useState<boolean>(false);
    const [revealedPoisons, setRevealedPoisons] = useState<boolean>(false);

    // Forced Drink State for Friendship (1 bottle) and Love (3 bottles)
    const [forcedDrinkState, setForcedDrinkState] = useState<{
        targetId: string;
        targetName: string;
        targetAvatar: string;
        remaining: number;
        spikerId: string;
        spikerName: string;
        type: 'love' | 'friendship';
    } | null>(null);

    const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

    const playTone = (type: 'drink' | 'poison' | 'heal' | 'water' | 'eliminate' | 'victory') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'drink') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(450, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
            } else if (type === 'heal') {
                [440, 554, 659, 880].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);
                    o.start(ctx.currentTime + i * 0.08);
                    o.stop(ctx.currentTime + i * 0.08 + 0.2);
                });
            } else if (type === 'poison') {
                [280, 210, 160, 110].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
                    o.start(ctx.currentTime + i * 0.08);
                    o.stop(ctx.currentTime + i * 0.08 + 0.15);
                });
            } else if (type === 'water') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'eliminate') {
                [180, 140, 90].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'square';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.2);
                });
            } else if (type === 'victory') {
                [523.25, 659.25, 783.99, 1046.50, 1318.5].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.35);
                    o.start(ctx.currentTime + i * 0.12);
                    o.stop(ctx.currentTime + i * 0.12 + 0.35);
                });
            }
        } catch {
            // Audio context disabled
        }
    };

    // Initialize participants and potions based on selected participant count
    const initGame = (customSize?: number | any) => {
        const size = typeof customSize === 'number' ? customSize : participantCount;
        if (typeof customSize === 'number') {
            setParticipantCount(customSize);
        }

        const npcs = generateNpcList(size - 1);
        const playerGender: CharacterGender = progress?.playerStats?.gender || 'male';
        const playerAvatar = playerGender === 'female' ? '🧙‍♀️' : '🧙‍♂️';
        const playerName = `Ви (${playerGender === 'female' ? 'Героїня' : 'Герой'})`;
        const stats = progress?.playerStats;
        const playerRealMaxHp = stats ? Math.max(50, (stats.baseHp || 80) + (stats.strength || 20)) : 100;

        const parts: Participant[] = [
            { 
                id: 'player', 
                name: playerName, 
                avatar: playerAvatar, 
                gender: playerGender,
                hp: playerRealMaxHp, 
                maxHp: playerRealMaxHp, 
                isPlayer: true, 
                isEliminated: false,
                givePotionUses: 1,
                scanAndChooseUses: 1,
                scanAndDiscardUses: 1,
                discardSecretUses: 1,
                solventUses: 1,
                hasSolventActive: false,
                sorbentUses: 1,
                hasSorbentActive: false,
                snakeEaterUses: 1,
                hasSnakeEaterActive: false,
                vomitDrugUses: 1,
                poisonResistUses: 1,
                hasPoisonResistActive: false,
                wakeUpUses: 1,
                distillUses: 1,
                miracleUses: 1,
                neutralizerUses: 1,
                filterUses: 1,
                transmutePoisonUses: 1,
                tasterUses: 1,
                skipTurnUses: 1,
                mixPotionsUses: 1,
                flushTableUses: 1,
                craftHealingUses: 1,
                craftMixtureUses: 1,
                craftInvulnerabilityUses: 1,
                craftFortuneUses: 1,
                craftFortune3Uses: 1,
                craftFortune5Uses: 1,
                invulnerabilityTurns: 0,
                natureBreakUses: 1,
                natureBreakRounds: 0,
                spikeLoveUses: 1,
                spikeFriendshipUses: 1,
                spikeSleepUses: 1,
                highlightHealingUses: 1,
                highlightMixtureUses: 1,
                highlightPoisonsUses: 1,
                neutralizeAllPoisonsUses: 1,
                weakenAllPoisonsUses: 1,
                hasPoisonToMixtureActive: false,
                poisonToMixtureUses: 1,
                hasPoisonToWaterActive: false,
                poisonToWaterUses: 1,
                hasPoisonToSorbentActive: false,
                poisonToSorbentUses: 1
            },
            ...npcs.map((npc, idx) => {
                const npcRealHp = 80 + ((idx * 11) % 45); // Real variable NPC health (80-125 HP)
                return {
                    id: `npc_${idx}`,
                    name: npc.name,
                    avatar: npc.avatar,
                    gender: npc.gender,
                    hp: npcRealHp, 
                    maxHp: npcRealHp, 
                    isPlayer: false, 
                    isEliminated: false,
                    givePotionUses: 1,
                    scanAndChooseUses: 1,
                    scanAndDiscardUses: 1,
                    discardSecretUses: 1,
                    solventUses: 1,
                    hasSolventActive: false,
                    sorbentUses: 1,
                    hasSorbentActive: false,
                    snakeEaterUses: 1,
                    hasSnakeEaterActive: false,
                    vomitDrugUses: 1,
                    poisonResistUses: 1,
                    hasPoisonResistActive: false,
                    wakeUpUses: 1,
                    distillUses: 1,
                    miracleUses: 1,
                    neutralizerUses: 1,
                    filterUses: 1,
                    transmutePoisonUses: 1,
                    tasterUses: 1,
                    skipTurnUses: 1,
                    mixPotionsUses: 1,
                    flushTableUses: 1,
                    craftHealingUses: 1,
                    craftMixtureUses: 1,
                    craftInvulnerabilityUses: 1,
                    craftFortuneUses: 1,
                    craftFortune3Uses: 1,
                    craftFortune5Uses: 1,
                    invulnerabilityTurns: 0,
                    natureBreakUses: 1,
                    natureBreakRounds: 0,
                    spikeLoveUses: 1,
                    spikeFriendshipUses: 1,
                    spikeSleepUses: 1,
                    highlightHealingUses: 1,
                    highlightMixtureUses: 1,
                    highlightPoisonsUses: 1,
                    neutralizeAllPoisonsUses: 1,
                    weakenAllPoisonsUses: 1,
                    hasPoisonToMixtureActive: false,
                    poisonToMixtureUses: 1,
                    hasPoisonToWaterActive: false,
                    poisonToWaterUses: 1,
                    hasPoisonToSorbentActive: false,
                    poisonToSorbentUses: 1
                };
            })
        ];
        
        const generatedPotions = generateShuffledPotions(size);
        setParticipants(parts);
        participantsRef.current = parts;
        setPotions(generatedPotions);
        potionsRef.current = generatedPotions;
        setSelectedBottleIds([]);
        selectedBottleIdsRef.current = [];
        setCurrentTurnIndex(0);
        setRound(1);
        setGameOver(false);
        setWinner(null);
        setCompressedRewards([]);
        compressedRewardsRef.current = [];
        setSleepDiceState(null);
        setSelectedTactic(null);
        setCraftingSelectedBottles([]);
        setMixPotionsFirstBottle(null);
        setScanChooseBottle(null);
        setScanDiscardBottle(null);
        setGivenPotionContext(null);
        setShowRerouteTargets(false);
        setRevealedHealing(false);
        setRevealedMixture(false);
        setRevealedPoisons(false);
        setForcedDrinkState(null);
        setActiveMobileTab('potions');
        setLog([`🎮 Гра розпочалася! ${size} великих випробувачів та ${generatedPotions.length} таємничих пляшок на столі таверни.`]);
        setLastActionText('Раунд 1. Оберіть пляшечку зілля зі столу!');
    };

    useEffect(() => {
        if (isOpen) {
            initGame();
        }
        return () => {
            if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
        };
    }, [isOpen]);

    // Active participants
    const activeParticipants = participants.filter(p => !p.isEliminated);
    const activeCount = activeParticipants.length;

    // Helper: Award compressed figures if player wins
    const awardCompressedFigures = (rewards: ToySoldier[]) => {
        if (rewards.length > 0 && progress && onUpdateProgress) {
            const existing = progress.toySoldiers || [];
            onUpdateProgress({
                ...progress,
                toySoldiers: [...existing, ...rewards]
            });
        }
    };

    // Advance turn & process start-of-turn ticks (slow poison, mixture, compression)
    const advanceToNextTurn = (
        currentList: Participant[], 
        fromIdx: number, 
        newSelectedCount: number,
        accumulatedRewards: ToySoldier[]
    ) => {
        // Clear all active potion highlights on turn transition (highlights last 1 turn)
        setRevealedHealing(false);
        setRevealedMixture(false);
        setRevealedPoisons(false);

        let updatedList = [...currentList];
        let currentRewards = [...accumulatedRewards];

        // Loop until we find a participant who is alive AND not skipping because of natureBreak
        let nextIdx = (fromIdx + 1) % updatedList.length;
        let safetyCounter = 0;
        let skipMessages: string[] = [];

        while (safetyCounter < updatedList.length * 4) {
            const candidate = updatedList[nextIdx];
            if (!candidate || candidate.isEliminated) {
                nextIdx = (nextIdx + 1) % updatedList.length;
                safetyCounter++;
                continue;
            }

            if ((candidate.natureBreakRounds || 0) > 0) {
                const remainingSkips = candidate.natureBreakRounds! - 1;
                const updatedCandidate = {
                    ...candidate,
                    natureBreakRounds: remainingSkips
                };
                updatedList[nextIdx] = updatedCandidate;

                if (remainingSkips === 0) {
                    skipMessages.push(`💨 ${candidate.avatar} ${candidate.name} завершив перерву "до вітру" (пропустив 3-є коло) і повертається у гру!`);
                } else {
                    skipMessages.push(`💨 ${candidate.avatar} ${candidate.name} відійшов до вітру і пропускає цей хід (залишилось пропустити кіл: ${remainingSkips})`);
                }

                nextIdx = (nextIdx + 1) % updatedList.length;
                safetyCounter++;
                continue;
            }

            // Candidate is alive and active
            break;
        }

        if (skipMessages.length > 0) {
            setLog(prev => [...skipMessages, ...prev.slice(0, 35)]);
        }

        const nextPart = updatedList[nextIdx];

        if (nextPart && !nextPart.isEliminated) {
            let tickPart = { ...nextPart };
            let tickMessages: string[] = [];

            // 0. Invulnerability Turns Tick
            if ((tickPart.invulnerabilityTurns || 0) > 0) {
                tickPart.invulnerabilityTurns! -= 1;
                if (tickPart.invulnerabilityTurns === 0) {
                    tickMessages.push(`🛡️ Дія Зілля неушкодженності для ${tickPart.name} завершилася.`);
                } else {
                    tickMessages.push(`🛡️ ${tickPart.name} під захистом Зілля неушкодженності! Залишилось ходів: ${tickPart.invulnerabilityTurns}`);
                }
            }

            // 0.2. Fortune Active Notice
            if (!tickPart.isEliminated && (tickPart.hasFortune || (tickPart.fortuneTurns || 0) > 0) && !tickPart.hasPermanganate) {
                const rem = tickPart.fortuneTurns || 1;
                tickMessages.push(`🍀 ${tickPart.name} під дією Зілля успіху! (Залишилось ходів: ${rem})`);
            }

            // 1. Slow Poison Tick
            if ((tickPart.slowPoisonTurns || 0) > 0) {
                tickPart.slowPoisonTurns! -= 1;
                if ((tickPart.invulnerabilityTurns || 0) > 0) {
                    tickMessages.push(`🛡️ Повільний яд заблоковано Неушкодженістю ${tickPart.name}!`);
                } else {
                    let mult = (tickPart.catalystMultiplier || 1) * (tickPart.inhibitorMultiplier || 1);
                    let tickDmg = Math.round(-5 * mult);
                    if (tickPart.drunkenness && tickPart.drunkenness > 25) {
                        tickDmg = Math.round(tickDmg * 0.5); // halved!
                    }
                    tickPart.hp = Math.max(0, tickPart.hp + tickDmg);
                    tickMessages.push(`🐍 ${tickPart.name}: Повільний яд (${tickDmg} HP). Залишилось ходів отруєння: ${tickPart.slowPoisonTurns}`);
                    if (tickPart.hp <= 0) {
                        tickPart.isEliminated = true;
                        tickMessages.push(`💀 ${tickPart.name} вибув від Повільного яду!`);
                    }
                }
            }

            // 2. Mixture Heal Tick
            if ((tickPart.mixtureTurns || 0) > 0 && !tickPart.isEliminated) {
                tickPart.mixtureTurns! -= 1;
                let mult = (tickPart.catalystMultiplier || 1) * (tickPart.inhibitorMultiplier || 1);
                let tickHeal = Math.round(10 * mult);
                tickPart.hp = Math.min(100, tickPart.hp + tickHeal);
                tickMessages.push(`🍵 ${tickPart.name}: Мікстура (+${tickHeal} HP). Залишилось ходів зцілення: ${tickPart.mixtureTurns}`);
            }

            // 3. Compression Countdown Tick
            if ((tickPart.compressionCountdown || 0) > 0 && !tickPart.isEliminated) {
                tickPart.compressionCountdown! -= 1;
                if ((tickPart.invulnerabilityTurns || 0) > 0) {
                    tickMessages.push(`🛡️ Компресія заблокована Неушкодженістю ${tickPart.name}!`);
                } else if (tickPart.compressionCountdown === 0) {
                    // Compress into toy figure (1d4)!
                    const r = Math.floor(Math.random() * 4) + 1;
                    let unitType: 'пішак' | 'шашка' | 'піхотинець' | 'магічний_пішак' = 'пішак';
                    let unitName = 'Бойовий пішак';
                    let avatar = '♟️';
                    let maxHp = 1;

                    if (r === 2) {
                        unitType = 'шашка';
                        unitName = 'Бойова шашка';
                        avatar = '🔴';
                        maxHp = 1;
                    } else if (r === 3) {
                        unitType = 'піхотинець';
                        unitName = 'Олов\'яний піхотинець';
                        avatar = '⚔️';
                        maxHp = 3;
                    } else if (r === 4) {
                        unitType = 'магічний_пішак';
                        unitName = 'Магічний бойовий пішак';
                        avatar = '🧙‍♂️♟️';
                        maxHp = 2;
                    }

                    tickPart.isCompressed = true;
                    tickPart.compressedUnitType = unitType;
                    tickPart.isEliminated = true;
                    tickPart.hp = 0;

                    const newToy: ToySoldier = {
                        id: `compressed_potion_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        name: unitName,
                        avatar: avatar,
                        level: 0,
                        experience: 0,
                        deaths: 0,
                        maxHp: maxHp,
                        type: unitType,
                        cost: 20
                    };

                    currentRewards.push(newToy);
                    setCompressedRewards(currentRewards);
                    tickMessages.push(`🌀 ${tickPart.name} повністю скомпресувався у [${avatar} ${unitName}]! Фігура чекає на переможця!`);
                } else {
                    tickMessages.push(`📦 ${tickPart.name}: До компресії у фігуру залишилось ходів: ${tickPart.compressionCountdown}`);
                }
            }

            if (tickMessages.length > 0) {
                updatedList[nextIdx] = tickPart;
                setLog(prev => [...tickMessages, ...prev.slice(0, 35)]);
            }
        }

        setParticipants(updatedList);
        participantsRef.current = updatedList;

        // Check surviving count
        const remainingAlive = updatedList.filter(p => !p.isEliminated);
        if (remainingAlive.length <= 1) {
            setGameOver(true);
            const champion = remainingAlive[0] || null;
            setWinner(champion);
            if (champion?.isPlayer) {
                playTone('victory');
                awardCompressedFigures(currentRewards);
            }
            return;
        }

        // Check if table needs reshuffle (all bottles taken)
        if (newSelectedCount >= potions.length) {
            const refreshedPotions = generateShuffledPotions(participantCount);
            setPotions(refreshedPotions);
            potionsRef.current = refreshedPotions;
            setSelectedBottleIds([]);
            selectedBottleIdsRef.current = [];
            setRound(r => r + 1);
            const reshuffleMsg = `--- 🔄 Всі зілля випито! ${refreshedPotions.length} нових зілля перетасовано на стіл для Раунду ${round + 1}! Залишилось живих: ${remainingAlive.length} ---`;
            setLastActionText(reshuffleMsg);
            setLog(prev => [reshuffleMsg, ...prev.slice(0, 35)]);
        }

        // Ensure the selected nextIdx is not eliminated (e.g. if they just compressed into a toy or died from poison during start-of-turn tick)
        let loopSafety = 0;
        while (updatedList[nextIdx] && updatedList[nextIdx].isEliminated && loopSafety < updatedList.length) {
            nextIdx = (nextIdx + 1) % updatedList.length;
            loopSafety++;
        }

        setCurrentTurnIndex(nextIdx);

        // Check if the next active participant is drunk and needs to roll for sleep!
        const finalNextPart = updatedList[nextIdx];
        if (finalNextPart && !finalNextPart.isEliminated && (finalNextPart.drunkenness || 0) > 25 && !finalNextPart.isVigorous) {
            setSleepDiceState({
                participant: finalNextPart,
                rolls: [],
                isRolling: false,
                finished: false,
                successCount: 0,
                failCount: 0,
                isAsleep: false,
                bottleId: -1,
                isDrunkRoll: true
            });
        }
    };

    // Execute interactive 5d20 Sleep Dice Roll
    const executeSleepDiceRoll = () => {
        if (!sleepDiceState || sleepDiceState.isRolling) return;
        setSleepDiceState(prev => prev ? { ...prev, isRolling: true } : null);
        playTone('drink');

        const delay = fastModeRef.current ? 120 : 350;
        setTimeout(() => {
            const rolls: number[] = [];
            let succ = 0;
            let fail = 0;
            for (let i = 0; i < 5; i++) {
                const r = Math.floor(Math.random() * 20) + 1;
                rolls.push(r);
                if (r >= 11) succ++; else fail++;
                if (succ >= 3 || fail >= 3) break;
            }

            const isAsleep = fail >= 3;
            setSleepDiceState(prev => prev ? {
                ...prev,
                rolls,
                isRolling: false,
                finished: true,
                successCount: succ,
                failCount: fail,
                isAsleep
            } : null);

            if (isAsleep) {
                playTone('eliminate');
            } else {
                playTone('water');
            }
        }, delay);
    };

    // Complete sleep dice sequence & continue turn
    const finishSleepDiceSequence = () => {
        if (!sleepDiceState) return;

        const { participant, rolls, isAsleep, bottleId, isDrunkRoll } = sleepDiceState;
        setSleepDiceState(null);

        let updatedPart: Participant = { ...participant };
        let soundType: 'eliminate' | 'water' = 'water';
        let actionMsg = '';

        if (isAsleep) {
            updatedPart.isAsleep = true;
            updatedPart.isEliminated = true;
            updatedPart.hp = 0;
            if (isDrunkRoll) {
                actionMsg = `💤 Алкогольний сон! Через надмірну захмеленість (${participant.drunkenness}%) та невдалий кидок 5d20: [${rolls.join(', ')}], ${participant.name} вирубався(лася) до кінця гри!`;
            } else {
                actionMsg = `💤 Зілля сну! Кидок 5d20: [${rolls.join(', ')}] (3 поразки!). ${participant.name} міцно заснув(ла) і вибуває!`;
            }
            soundType = 'eliminate';
        } else {
            if (isDrunkRoll) {
                actionMsg = `🍺 Стійкість! Попри захмеленість (${participant.drunkenness}%), ${participant.name} переборов(ла) дрімоту (5d20: [${rolls.join(', ')}]) та продовжує гру!`;
            } else {
                actionMsg = `🌙 Зілля сну! Кидок 5d20: [${rolls.join(', ')}] (3 успіхи!). ${participant.name} переборов(ла) магію сну і продовжує гру!`;
            }
            soundType = 'water';
        }

        playTone(soundType);

        const currentParticipants = participantsRef.current.length > 0 ? participantsRef.current : participants;
        const updatedList = currentParticipants.map(p => p.id === updatedPart.id ? updatedPart : p);
        participantsRef.current = updatedList;

        const remainingAlive = updatedList.filter(p => !p.isEliminated);
        if (remainingAlive.length <= 1) {
            setParticipants(updatedList);
            setLastActionText(actionMsg);
            setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
            setGameOver(true);
            const champion = remainingAlive[0] || null;
            setWinner(champion);
            if (champion?.isPlayer) {
                playTone('victory');
                awardCompressedFigures(compressedRewardsRef.current);
            }
            return;
        }

        if (isAsleep) {
            setParticipants(updatedList);
            setLastActionText(actionMsg);
            setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
            advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIdsRef.current.length, compressedRewardsRef.current);
        } else {
            if (isDrunkRoll) {
                setParticipants(updatedList);
                setLastActionText(actionMsg + " Оберіть пляшечку зілля зі столу!");
                setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
            } else {
                setParticipants(updatedList);
                setLastActionText(actionMsg);
                setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIdsRef.current.length, compressedRewardsRef.current);
            }
        }
    };

    // AI auto-roll handler for sleep dice
    useEffect(() => {
        if (sleepDiceState && !sleepDiceState.participant.isPlayer) {
            if (!sleepDiceState.isRolling && !sleepDiceState.finished) {
                const timer = setTimeout(() => {
                    executeSleepDiceRoll();
                }, fastMode ? 80 : 250);
                return () => clearTimeout(timer);
            }
            if (sleepDiceState.finished) {
                const timer = setTimeout(() => {
                    finishSleepDiceSequence();
                }, fastMode ? 150 : 600);
                return () => clearTimeout(timer);
            }
        }
    }, [sleepDiceState, fastMode]);

    // Route bottle clicks based on active player tactical choices
    const handlePlayerClickBottle = (bottleId: number) => {
        if ((!isPlayerTurn && !forcedDrinkState) || selectedBottleIds.includes(bottleId)) return;
        const bottle = potions.find(p => p.id === bottleId);
        if (!bottle) return;

        // If forced drink state is active, the chosen bottle is drunk by the target participant!
        if (forcedDrinkState && forcedDrinkState.remaining > 0) {
            const targetPart = participants.find(p => p.id === forcedDrinkState.targetId);
            if (targetPart && !targetPart.isEliminated) {
                const remainingAfter = forcedDrinkState.remaining - 1;
                if (remainingAfter <= 0) {
                    setForcedDrinkState(null);
                } else {
                    setForcedDrinkState({
                        ...forcedDrinkState,
                        remaining: remainingAfter
                    });
                }
                const actionPrefix = forcedDrinkState.type === 'love'
                    ? `💘 Примусове пиття (${forcedDrinkState.spikerName}): ${targetPart.name} випиває обрану пляшечку #${potions.indexOf(bottle) + 1} (${bottle.name})! (Залишилося: ${remainingAfter} шт.)`
                    : `🤝 Примусове пиття (${forcedDrinkState.spikerName}): ${targetPart.name} випиває обрану пляшечку #${potions.indexOf(bottle) + 1} (${bottle.name})!`;
                setLastActionText(actionPrefix);
                setLog(prev => [actionPrefix, ...prev.slice(0, 35)]);
                handleDrinkPotion(bottleId, targetPart, undefined, true);
                return;
            }
        }

        if (selectedTactic === 'scan_choose') {
            setScanChooseBottle(bottle);
        } else if (selectedTactic === 'scan_discard') {
            setScanDiscardBottle(bottle);
        } else if (selectedTactic === 'discard_secret') {
            executeDiscardSecret(bottle);
        } else if (selectedTactic === 'distill') {
            executePotionConversion(bottle, 'vodka');
        } else if (selectedTactic === 'miracle') {
            executePotionConversion(bottle, 'healing');
        } else if (selectedTactic === 'neutralizer') {
            executePotionConversion(bottle, 'neutralizer');
        } else if (selectedTactic === 'filter') {
            executePotionConversion(bottle, 'filter');
        } else if (selectedTactic === 'vomitDrug') {
            executePotionConversion(bottle, 'permanganate');
        } else if (selectedTactic === 'spike_love') {
            executePotionConversion(bottle, 'love');
        } else if (selectedTactic === 'spike_friendship') {
            executePotionConversion(bottle, 'friendship');
        } else if (selectedTactic === 'spike_sleep') {
            executePotionConversion(bottle, 'sleep');
        } else if (selectedTactic === 'skipTurn') {
            executeSkipTurn();
        } else if (selectedTactic === 'mixPotions') {
            if (!mixPotionsFirstBottle) {
                setMixPotionsFirstBottle(bottle);
                setLastActionText(`Перше зілля (#${potions.indexOf(bottle) + 1}) обрано. Оберіть друге для змішування!`);
            } else {
                executeMixPotions(mixPotionsFirstBottle, bottle);
                setMixPotionsFirstBottle(null);
                setSelectedTactic(null);
            }
        } else if (selectedTactic === 'craft_healing') {
            const isAlreadyIn = craftingSelectedBottles.some(b => b.id === bottle.id);
            let nextList: PotionItem[];
            if (isAlreadyIn) {
                nextList = craftingSelectedBottles.filter(b => b.id !== bottle.id);
            } else {
                nextList = [...craftingSelectedBottles, bottle];
            }
            if (nextList.length >= 3) {
                executeCraftHealing(nextList.slice(0, 3));
                setCraftingSelectedBottles([]);
                setSelectedTactic(null);
            } else {
                setCraftingSelectedBottles(nextList);
                setLastActionText(`Обрано ${nextList.length}/3 пляшечок для створення Зілля зцілення. Оберіть ще ${3 - nextList.length}!`);
            }
        } else if (selectedTactic === 'craft_mixture') {
            const isAlreadyIn = craftingSelectedBottles.some(b => b.id === bottle.id);
            let nextList: PotionItem[];
            if (isAlreadyIn) {
                nextList = craftingSelectedBottles.filter(b => b.id !== bottle.id);
            } else {
                nextList = [...craftingSelectedBottles, bottle];
            }
            if (nextList.length >= 3) {
                executeCraftMixture(nextList.slice(0, 3));
                setCraftingSelectedBottles([]);
                setSelectedTactic(null);
            } else {
                setCraftingSelectedBottles(nextList);
                setLastActionText(`Обрано ${nextList.length}/3 пляшечок для створення Мікстури. Оберіть ще ${3 - nextList.length}!`);
            }
        } else if (selectedTactic === 'craft_invulnerability') {
            const isAlreadyIn = craftingSelectedBottles.some(b => b.id === bottle.id);
            let nextList: PotionItem[];
            if (isAlreadyIn) {
                nextList = craftingSelectedBottles.filter(b => b.id !== bottle.id);
            } else {
                nextList = [...craftingSelectedBottles, bottle];
            }
            if (nextList.length >= 4) {
                executeCraftInvulnerability(nextList.slice(0, 4));
                setCraftingSelectedBottles([]);
                setSelectedTactic(null);
            } else {
                setCraftingSelectedBottles(nextList);
                setLastActionText(`Обрано ${nextList.length}/4 пляшечок для Зілля неушкодженності. Оберіть ще ${4 - nextList.length}!`);
            }
        } else if (selectedTactic === 'craft_fortune') {
            const isAlreadyIn = craftingSelectedBottles.some(b => b.id === bottle.id);
            let nextList: PotionItem[];
            if (isAlreadyIn) {
                nextList = craftingSelectedBottles.filter(b => b.id !== bottle.id);
            } else {
                nextList = [...craftingSelectedBottles, bottle];
            }
            if (nextList.length >= 5) {
                executeCraftFortune(nextList.slice(0, 5), 1);
                setCraftingSelectedBottles([]);
                setSelectedTactic(null);
            } else {
                setCraftingSelectedBottles(nextList);
                setLastActionText(`Обрано ${nextList.length}/5 пляшечок для Зілля успіху. Оберіть ще ${5 - nextList.length}!`);
            }
        } else if (selectedTactic === 'craft_fortune_3') {
            const isAlreadyIn = craftingSelectedBottles.some(b => b.id === bottle.id);
            let nextList: PotionItem[];
            if (isAlreadyIn) {
                nextList = craftingSelectedBottles.filter(b => b.id !== bottle.id);
            } else {
                nextList = [...craftingSelectedBottles, bottle];
            }
            if (nextList.length >= 6) {
                executeCraftFortune(nextList.slice(0, 6), 3);
                setCraftingSelectedBottles([]);
                setSelectedTactic(null);
            } else {
                setCraftingSelectedBottles(nextList);
                setLastActionText(`Обрано ${nextList.length}/6 пляшечок для Тривалого зілля успіху. Оберіть ще ${6 - nextList.length}!`);
            }
        } else if (selectedTactic === 'craft_fortune_5') {
            const isAlreadyIn = craftingSelectedBottles.some(b => b.id === bottle.id);
            let nextList: PotionItem[];
            if (isAlreadyIn) {
                nextList = craftingSelectedBottles.filter(b => b.id !== bottle.id);
            } else {
                nextList = [...craftingSelectedBottles, bottle];
            }
            if (nextList.length >= 8) {
                executeCraftFortune(nextList.slice(0, 8), 5);
                setCraftingSelectedBottles([]);
                setSelectedTactic(null);
            } else {
                setCraftingSelectedBottles(nextList);
                setLastActionText(`Обрано ${nextList.length}/8 пляшечок для Довготривалого зілля успіху. Оберіть ще ${8 - nextList.length}!`);
            }
        } else if (selectedTactic === 'flushTable') {
            handleFlushTable();
        } else if (selectedTactic === 'taster') {
            handleTaster(bottle);
        } else {
            handleDrinkPotion(bottleId, playerParticipant!);
        }
    };

    // Handle picking/drinking a potion
    const handleDrinkPotion = (bottleId: number, currentParticipant: Participant, customList?: Participant[], forceAllow: boolean = false, overrideBottle?: PotionItem) => {
        if ((selectedBottleIds.includes(bottleId) && !forceAllow) || gameOver || sleepDiceState) return;
        const originalBottle = overrideBottle || potions.find(p => p.id === bottleId);
        if (!originalBottle) return;

        playTone('drink');
        setSelectedBottleIds(prev => prev.includes(bottleId) ? prev : [...prev, bottleId]);
        if (!selectedBottleIdsRef.current.includes(bottleId)) {
            selectedBottleIdsRef.current = [...selectedBottleIdsRef.current, bottleId];
        }

        let actionMsg = '';
        const initialPart = customList ? (customList.find(p => p.id === currentParticipant.id) || currentParticipant) : currentParticipant;
        let updatedPart: Participant = { ...initialPart };

        // 0. Check Fortune (Success) Potion BEFORE everything else if permanganate is NOT active
        let bottle = { ...originalBottle };
        if (originalBottle.type !== 'fortune' && (updatedPart.hasFortune || (updatedPart.fortuneTurns || 0) > 0) && !updatedPart.hasPermanganate) {
            if ((updatedPart.fortuneTurns || 0) > 0) {
                updatedPart.fortuneTurns! -= 1;
                if (updatedPart.fortuneTurns === 0) {
                    updatedPart.hasFortune = false;
                }
            } else {
                updatedPart.hasFortune = false;
            }
            const remMsg = (updatedPart.fortuneTurns || 0) > 0 ? ` (залишилось ходів успіху: ${updatedPart.fortuneTurns})` : '';
            bottle = {
                id: originalBottle.id,
                type: 'healing',
                name: `Зілля лікування (через Зілля успіху)`,
                hpChange: 20,
                color: 'text-rose-300 bg-rose-950/80 border-rose-500',
                icon: '💖',
                description: `+20 HP відновлення завдяки Зіллю успіху${remMsg}`
            };
        }

        updatedPart.lastPotion = bottle;

        // 0.5. Check Potassium Permanganate (Марганцівка) - cancels all potion effects, vomits out everything
        if (updatedPart.hasPermanganate) {
            updatedPart.hasPermanganate = false;
            updatedPart.slowPoisonTurns = 0;
            updatedPart.mixtureTurns = 0;
            updatedPart.compressionCountdown = 0;
            updatedPart.drunkenness = 0;
            updatedPart.hasAntidote = false;
            updatedPart.hasSorbent = false;
            updatedPart.hasFortune = false;
            updatedPart.fortuneTurns = 0;
            updatedPart.catalystMultiplier = 1;
            updatedPart.inhibitorMultiplier = 1;

            actionMsg = `🤮 Марганцівка подіяла! ${updatedPart.name} виблював випите зілля ${bottle.icon} ${bottle.name} та очистив свій організм від усіх активних зіль, отрут та алкоголю!`;
            playTone('water');
        } else if ((updatedPart.invulnerabilityTurns || 0) > 0 && bottle.type !== 'invulnerability') {
            actionMsg = `🛡️ Неушкодженість! ${updatedPart.name} знаходиться під захистом Зілля неушкодженності (залишилось ${updatedPart.invulnerabilityTurns} ходи). Зілля ${bottle.icon} ${bottle.name} не має жодного впливу!`;
            playTone('water');
        } else {
            // 1. Check SORBENT (active toggle with 10 uses or drunk sorbent bottle)
            if (updatedPart.hasSorbentActive) {
                updatedPart.hasSorbentActive = false;
                updatedPart.sorbentUses = Math.max(0, (updatedPart.sorbentUses ?? 10) - 1);
                actionMsg = `🧽 Сорбент! ${updatedPart.name} заздалегідь прийняв сорбент! Дія ${bottle.icon} ${bottle.name} була повністю нейтралізована!`;
                playTone('water');
            } else if (updatedPart.hasSorbent) {
                updatedPart.hasSorbent = false;
                actionMsg = `🧽 Сорбент у шлунку повністю нейтралізував дію ${bottle.icon} ${bottle.name}! Жодного ефекту!`;
                playTone('water');
            } else {
                const isPoisonType = ['light_poison', 'medium_poison', 'heavy_poison', 'slow_poison'].includes(bottle.type);

                // Check Poison Transmutation Active Buffs
                if (isPoisonType && updatedPart.hasPoisonToMixtureActive) {
                    updatedPart.hasPoisonToMixtureActive = false;
                    updatedPart.poisonToMixtureUses = Math.max(0, (updatedPart.poisonToMixtureUses ?? 1) - 1);
                    updatedPart.mixtureTurns = 3;
                    actionMsg = `🍵 Яд в мікстуру! Випитий яд ${bottle.icon} ${bottle.name} трансмутувався у цілющу Мікстуру (+10 HP щоходу на 3 ходи)!`;
                    playTone('heal');
                }
                else if (isPoisonType && updatedPart.hasPoisonToWaterActive) {
                    updatedPart.hasPoisonToWaterActive = false;
                    updatedPart.poisonToWaterUses = Math.max(0, (updatedPart.poisonToWaterUses ?? 1) - 1);
                    actionMsg = `💧 Яд в воду! Випитий яд ${bottle.icon} ${bottle.name} миттєво знешкоджено і перетворено на 💧 Чисту воду (0 HP)!`;
                    playTone('water');
                }
                else if (isPoisonType && updatedPart.hasPoisonToSorbentActive) {
                    updatedPart.hasPoisonToSorbentActive = false;
                    updatedPart.poisonToSorbentUses = Math.max(0, (updatedPart.poisonToSorbentUses ?? 1) - 1);
                    updatedPart.hasSorbent = true;
                    actionMsg = `🧽 Яд в сорбент! Випитий яд ${bottle.icon} ${bottle.name} перетворився на активний Сорбент і захистить від наступного зілля!`;
                    playTone('heal');
                }
                // Check Snake Eater active
                else if (isPoisonType && updatedPart.hasSnakeEaterActive) {
                    updatedPart.hasSnakeEaterActive = false;
                    updatedPart.snakeEaterUses = Math.max(0, (updatedPart.snakeEaterUses ?? 1) - 1);
                    updatedPart.hp = Math.min(updatedPart.maxHp, updatedPart.hp + 20);
                    actionMsg = `🐍 Поїдач змій! Випитий яд ${bottle.icon} ${bottle.name} не завдав шкоди, а відновив +20 HP! Поточне HP: ${updatedPart.hp}/${updatedPart.maxHp}`;
                    playTone('heal');
                }
                // Check Poison Resist active
                else if (isPoisonType && updatedPart.hasPoisonResistActive) {
                    updatedPart.hasPoisonResistActive = false;
                    updatedPart.poisonResistUses = Math.max(0, (updatedPart.poisonResistUses ?? 1) - 1);
                    actionMsg = `🛡️ Стійкість до яду! Випитий яд ${bottle.icon} ${bottle.name} не завдав жодної шкоди!`;
                    playTone('heal');
                }
                // 2. Check ANTIDOTE (blocks poison effect)
                else if (isPoisonType && updatedPart.hasAntidote) {
                    updatedPart.hasAntidote = false;
                    actionMsg = `🛡️ Антидот повністю знешкодив отруту ${bottle.icon} ${bottle.name}! Шкоду відвернуто!`;
                    playTone('heal');
                } else {
                    // Special Interactive SLEEP Potion Modal
                    if (bottle.type === 'sleep') {
                        if (updatedPart.isVigorous) {
                            actionMsg = `💤 Зілля сну! Але ${updatedPart.name} має ефект Зілля бадьорості й не може заснути!`;
                            playTone('water');
                        } else {
                            setSleepDiceState({
                                participant: updatedPart,
                                bottle,
                                rolls: [],
                                isRolling: false,
                                finished: false,
                                successCount: 0,
                                failCount: 0,
                                isAsleep: false,
                                bottleId
                            });
                            return; // Pause turn, waiting for interactive 5d20 dice roll
                        }
                    } else {
                        // Check if solvent is active
                        let wasSolventApplied = false;
                        if (updatedPart.hasSolventActive) {
                            updatedPart.hasSolventActive = false;
                            updatedPart.solventUses = Math.max(0, (updatedPart.solventUses ?? 1) - 1);
                            wasSolventApplied = true;
                        }

                        // 3. Calculate HP Change with Catalyst / Inhibitor multipliers
                        let baseHpChange = bottle.hpChange;
                        let mult = (updatedPart.catalystMultiplier || 1) * (updatedPart.inhibitorMultiplier || 1);

                        // Reset multipliers after applying to poison/heal
                        if (baseHpChange !== 0) {
                            updatedPart.catalystMultiplier = 1;
                            updatedPart.inhibitorMultiplier = 1;
                        }

                        let effectiveHpChange = Math.round(baseHpChange * mult);
                        
                        // IF drunk and it is a poison, halve the damage!
                        if (isPoisonType && updatedPart.drunkenness && updatedPart.drunkenness > 25) {
                            effectiveHpChange = Math.round(effectiveHpChange * 0.5); // halve the negative hpChange
                        }

                        // IF solvent was applied and it is a poison, halve the damage!
                        if (isPoisonType && wasSolventApplied) {
                            effectiveHpChange = Math.round(effectiveHpChange * 0.5);
                        }

                        let newHp = Math.min(100, Math.max(0, updatedPart.hp + effectiveHpChange));
                        updatedPart.hp = newHp;

                        let soundType: 'heal' | 'poison' | 'water' | 'eliminate' = 'water';

                        switch (bottle.type) {
                            case 'antidote':
                                updatedPart.hasAntidote = true;
                                actionMsg = `🛡️ ${updatedPart.name} випив Антидот! Наступний яд буде знешкоджено!`;
                                soundType = 'heal';
                                break;

                            case 'sorbent':
                                updatedPart.hasSorbent = true;
                                actionMsg = `🧽 ${updatedPart.name} випив Сорбент! Наступне випите зілля буде нейтралізовано!`;
                                soundType = 'heal';
                                break;

                            case 'catalyst':
                                updatedPart.catalystMultiplier = 2;
                                actionMsg = `⚡ ${updatedPart.name} випив Каталізатор! Наступне яд/лікування подіє в 2 рази сильніше (2x)!`;
                                soundType = 'heal';
                                break;

                            case 'inhibitor':
                                updatedPart.inhibitorMultiplier = 0.5;
                                actionMsg = `❄️ ${updatedPart.name} випив Інгібітор! Наступне яд/лікування ослабне у 2 рази (0.5x)!`;
                                soundType = 'heal';
                                break;

                            case 'mixture':
                                updatedPart.mixtureTurns = 3;
                                actionMsg = `🍵 ${updatedPart.name} випив Мікстуру (${effectiveHpChange >= 0 ? '+' : ''}${effectiveHpChange} HP)! Лікування +10 HP щоходу 3 ходи.`;
                                soundType = 'heal';
                                break;

                            case 'compression':
                                updatedPart.compressionCountdown = 3;
                                actionMsg = `📦 ${updatedPart.name} випив Зілля компресії! Через 3 ходи перетвориться на іграшку (1d4)!`;
                                soundType = 'poison';
                                break;

                            case 'decompression':
                                if ((updatedPart.compressionCountdown || 0) > 0) {
                                    updatedPart.compressionCountdown = 0;
                                    actionMsg = `🔓 ${updatedPart.name} випив Зілля декомпресії! Ефект компресії скасовано!`;
                                } else {
                                    actionMsg = `✨ ${updatedPart.name} випив Зілля декомпресії, але ефекту компресії не було.`;
                                }
                                soundType = 'heal';
                                break;

                            case 'slow_poison': {
                                const slowTurns = wasSolventApplied ? 1 : 3;
                                updatedPart.slowPoisonTurns = slowTurns;
                                actionMsg = `🐍 ${updatedPart.name} випив Повільний яд (${effectiveHpChange} HP)! Отруєння -5 HP щоходу ${slowTurns} ходи${wasSolventApplied ? ' (послаблено розчинником)' : ''}.`;
                                soundType = 'poison';
                                break;
                            }

                            case 'healing':
                                soundType = 'heal';
                                actionMsg = `💖 ${updatedPart.name} випив Зілля зцілення (${effectiveHpChange >= 0 ? '+' : ''}${effectiveHpChange} HP). HP: ${updatedPart.hp}/100`;
                                break;

                            case 'water':
                                soundType = 'water';
                                actionMsg = `💧 ${updatedPart.name} випив Чисту воду (0 HP). HP: ${updatedPart.hp}/100`;
                                break;

                            case 'vigor':
                                updatedPart.isVigorous = true;
                                actionMsg = `⚡ ${updatedPart.name} випив Зілля бадьорості! Тепер він(вона) не засне до кінця гри!`;
                                soundType = 'heal';
                                break;

                            case 'vodka': {
                                const roll = Math.floor(Math.random() * 10) + 1; // 1d10
                                updatedPart.drunkenness = (updatedPart.drunkenness || 0) + roll;
                                actionMsg = `🍾 ${updatedPart.name} випив Горілку (+${roll} до захмеленості: ${updatedPart.drunkenness}%).`;
                                if (updatedPart.drunkenness > 25) {
                                    actionMsg += ` ⚠️ Сп'яніння >25%: дія отрут зменшена вдвічі, але щоходу буде кидок на сон!`;
                                }
                                soundType = 'water';
                                break;
                            }

                            case 'beer': {
                                const roll = Math.floor(Math.random() * 6) + 1; // 1d6
                                updatedPart.drunkenness = (updatedPart.drunkenness || 0) + roll;
                                actionMsg = `🍺 ${updatedPart.name} випив Пиво (+${roll} до захмеленості: ${updatedPart.drunkenness}%).`;
                                if (updatedPart.drunkenness > 25) {
                                    actionMsg += ` ⚠️ Сп'яніння >25%: дія отрут зменшена вдвічі, але щоходу буде кидок на сон!`;
                                }
                                soundType = 'water';
                                break;
                            }

                            case 'permanganate':
                                updatedPart.hasPermanganate = true;
                                actionMsg = `🧼 ${updatedPart.name} випив Марганцівку! У наступному ході він повністю очистить організм та виблює нове зілля!`;
                                soundType = 'heal';
                                break;

                            case 'fortune': {
                                const turns = bottle.fortuneTurns || (bottle.description.includes('5') ? 5 : bottle.description.includes('3') ? 3 : 1);
                                updatedPart.hasFortune = true;
                                updatedPart.fortuneTurns = turns;
                                if (turns > 1) {
                                    actionMsg = `🍀 ${updatedPart.name} випив ${bottle.name}! Впродовж наступних ${turns} ходів будь-яке випите зілля перетвориться на Зілля лікування (+20 HP)!`;
                                } else {
                                    actionMsg = `🍀 ${updatedPart.name} випив Зілля успіху! У наступному ході будь-яке випите зілля перетвориться на Зілля лікування (+20 HP)!`;
                                }
                                soundType = 'heal';
                                break;
                            }

                            case 'invulnerability':
                                updatedPart.invulnerabilityTurns = 3;
                                actionMsg = `🛡️✨ ${updatedPart.name} випив Зілля неушкодженності! Впродовж наступних 3 ходів на нього НЕ ДІЄ жодне зілля чи отрута!`;
                                soundType = 'heal';
                                break;

                            case 'love': {
                                const spikerId = bottle.spikedBy || (playerParticipant ? playerParticipant.id : 'player');
                                const spikerName = bottle.spikedByName || (playerParticipant ? playerParticipant.name : 'Гравець');
                                soundType = 'heal';

                                // Character DOES NOT get eliminated!
                                updatedPart.isEliminated = false;
                                updatedPart.recruitedToId = spikerId;
                                updatedPart.recruitedToName = spikerName;
                                updatedPart.recruitedType = 'love';

                                setForcedDrinkState({
                                    targetId: updatedPart.id,
                                    targetName: updatedPart.name,
                                    targetAvatar: updatedPart.avatar,
                                    remaining: 3,
                                    spikerId,
                                    spikerName,
                                    type: 'love'
                                });

                                const isByPlayer = playerParticipant && spikerId === playerParticipant.id;
                                actionMsg = `💘 Зілля закоханості! ${updatedPart.name} випив(ла) Зілля закоханості та палко закохався(лася) у ${spikerName}! Персонаж НЕ вибуває, але змушений(а) випити наступні 3 зілля, які обере ${isByPlayer ? 'Ви' : spikerName}!`;
                                break;
                            }

                            case 'friendship': {
                                const spikerId = bottle.spikedBy || (playerParticipant ? playerParticipant.id : 'player');
                                const spikerName = bottle.spikedByName || (playerParticipant ? playerParticipant.name : 'Гравець');
                                soundType = 'heal';

                                // Character DOES NOT get eliminated!
                                updatedPart.isEliminated = false;
                                updatedPart.recruitedToId = spikerId;
                                updatedPart.recruitedToName = spikerName;
                                updatedPart.recruitedType = 'friendship';

                                setForcedDrinkState({
                                    targetId: updatedPart.id,
                                    targetName: updatedPart.name,
                                    targetAvatar: updatedPart.avatar,
                                    remaining: 1,
                                    spikerId,
                                    spikerName,
                                    type: 'friendship'
                                });

                                const isByPlayer = playerParticipant && spikerId === playerParticipant.id;
                                actionMsg = `🤝 Зілля дружби! ${updatedPart.name} випив(ла) Зілля дружби та став(ла) вірним другом ${spikerName}! Персонаж НЕ вибуває, але дружньо вип'є наступне зілля, яке обере ${isByPlayer ? 'Ви' : spikerName}!`;
                                break;
                            }

                            default: {
                                soundType = updatedPart.hp <= 0 ? 'eliminate' : 'poison';
                                const multNote = mult === 2 ? ' ⚡(2x Каталізатор!)' : mult === 0.5 ? ' ❄️(0.5x Інгібітор!)' : '';
                                const solventNote = (wasSolventApplied && isPoisonType) ? ' 🧴(дію яду послаблено розчинником!)' : '';
                                actionMsg = `${bottle.icon} ${updatedPart.name} випив ${bottle.name} (${effectiveHpChange} HP${multNote}${solventNote}). HP: ${updatedPart.hp}/100`;
                                break;
                            }
                        }

                        if (updatedPart.hp <= 0 && !updatedPart.isEliminated) {
                            updatedPart.isEliminated = true;
                            soundType = 'eliminate';
                            actionMsg += ' 💀 ВИБУВ(ЛА)!';
                        }

                        playTone(soundType);
                    }
                }
            }
        }

        // Update participants list
        const listToUse = customList || participants;
        const updatedList = listToUse.map(p => p.id === updatedPart.id ? updatedPart : p);
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);

        // Check surviving count
        const remainingAlive = updatedList.filter(p => !p.isEliminated);
        if (remainingAlive.length <= 1) {
            setGameOver(true);
            const champion = remainingAlive[0] || null;
            setWinner(champion);
            if (champion?.isPlayer) {
                playTone('victory');
                awardCompressedFigures(compressedRewards);
            }
            return;
        }

        // Advance turn & run status ticks
        advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length + 1, compressedRewards);
    };

    // Tactic: Scan and discard a potion (know what it is, then dump it)
    const executeScanAndDiscard = (bottle: PotionItem) => {
        if (!playerParticipant) return;

        // Mark bottle as taken
        setSelectedBottleIds(prev => [...prev, bottle.id]);

        // Decrement scanAndDiscardUses
        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return { 
                    ...p, 
                    scanAndDiscardUses: Math.max(0, (p.scanAndDiscardUses !== undefined ? p.scanAndDiscardUses : 3) - 1) 
                };
            }
            return p;
        });

        const actionMsg = `🧪 Сканування: ${playerParticipant.name} перевірив пляшечку #${potions.indexOf(bottle) + 1} (${bottle.icon} ${bottle.name}) та вилив її вміст у каналізацію!`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        setSelectedTactic(null);
        setScanDiscardBottle(null);

        // Advance turn
        advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length + 1, compressedRewards);
    };

    // Tactic: Taster - test a potion and report its content
    const handleTaster = (bottle: PotionItem) => {
        if (!playerParticipant) return;

        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    tasterUses: Math.max(0, (p.tasterUses ?? 3) - 1)
                };
            }
            return p;
        });

        const actionMsg = `👅 Дегустатор: Ви скористалися послугами дегустатора! Це ${bottle.name}.`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        setSelectedTactic(null);
    };

    // Tactic: Skip Turn
    const executeSkipTurn = () => {
        if (!playerParticipant) return;

        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    skipTurnUses: Math.max(0, (p.skipTurnUses ?? 4) - 1)
                };
            }
            return p;
        });

        const actionMsg = `⏭️ Пропуск: Ви вирішили пропустити свій хід.`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        setSelectedTactic(null);

        // Advance turn
        advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length, compressedRewards);
    };

    // Tactic: Mix Potions - pick 2 potions, combine their effects, and drink the mixture
    const executeMixPotions = (bottle1: PotionItem, bottle2: PotionItem) => {
        if (!playerParticipant) return;
        
        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    mixPotionsUses: Math.max(0, (p.mixPotionsUses ?? 3) - 1)
                };
            }
            return p;
        });

        // Mark both bottles as taken on table
        setSelectedBottleIds(prev => [...prev, bottle1.id, bottle2.id]);

        const combinedHp = Math.round((bottle1.hpChange + bottle2.hpChange) / 2);
        const mixedBottle: PotionItem = {
            id: bottle1.id,
            type: (bottle1.hpChange + bottle2.hpChange) >= 0 ? 'healing' : 'medium_poison',
            name: `Суміш (#${potions.indexOf(bottle1) + 1} + #${potions.indexOf(bottle2) + 1})`,
            hpChange: combinedHp,
            color: combinedHp >= 0 ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500' : 'text-purple-300 bg-purple-950/80 border-purple-500',
            icon: '🧪✨',
            description: `Змішані ${bottle1.name} та ${bottle2.name} (ефект: ${combinedHp} HP)`
        };

        const actionMsg = `🧪 Змішування: Ви змішали пляшечки #${potions.indexOf(bottle1) + 1} (${bottle1.name}) та #${potions.indexOf(bottle2) + 1} (${bottle2.name})! Результат суміші: ${combinedHp >= 0 ? '+' : ''}${combinedHp} HP.`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        
        // Drink the mixture with the updated participant list
        handleDrinkPotion(mixedBottle.id, playerParticipant, updatedList, true); 
    };

    // Tactic: Craft Healing Potion (mix 3 potions -> drink healing potion)
    const executeCraftHealing = (bottles: PotionItem[]) => {
        if (!playerParticipant || bottles.length < 3) return;

        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    craftHealingUses: Math.max(0, (p.craftHealingUses ?? 1) - 1)
                };
            }
            return p;
        });

        // Mark all 3 bottles as taken on table
        const bottleIds = bottles.map(b => b.id);
        setSelectedBottleIds(prev => [...prev, ...bottleIds]);

        const craftedBottle: PotionItem = {
            id: bottles[0].id,
            type: 'healing',
            name: 'Зілля зцілення (Створене)',
            hpChange: 20,
            color: 'text-rose-300 bg-rose-950/80 border-rose-500',
            icon: '💖✨',
            description: 'Створене з 3 пляшок: відновлює +20 HP'
        };

        const bottleIndices = bottles.map(b => `#${potions.indexOf(b) + 1}`).join(', ');
        const actionMsg = `💖 Створення зілля зцілення: Ви змішали 3 пляшечки (${bottleIndices}) та створили й випили Зілля зцілення (+20 HP)!`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);

        handleDrinkPotion(craftedBottle.id, playerParticipant, updatedList, true, craftedBottle);
    };

    // Tactic: Craft Mixture (mix 3 potions -> drink mixture potion)
    const executeCraftMixture = (bottles: PotionItem[]) => {
        if (!playerParticipant || bottles.length < 3) return;

        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    craftMixtureUses: Math.max(0, (p.craftMixtureUses ?? 1) - 1)
                };
            }
            return p;
        });

        // Mark all 3 bottles as taken on table
        const bottleIds = bottles.map(b => b.id);
        setSelectedBottleIds(prev => [...prev, ...bottleIds]);

        const craftedBottle: PotionItem = {
            id: bottles[0].id,
            type: 'mixture',
            name: 'Мікстура (Створена)',
            hpChange: 10,
            color: 'text-emerald-300 bg-emerald-950/80 border-emerald-500',
            icon: '🍵✨',
            description: 'Створена з 3 пляшок: лікує по +10 HP впродовж 3 ходів'
        };

        const bottleIndices = bottles.map(b => `#${potions.indexOf(b) + 1}`).join(', ');
        const actionMsg = `🍵 Створення мікстури: Ви змішали 3 пляшечки (${bottleIndices}) та створили й випили цілющу Мікстуру (+10 HP щоходу на 3 ходи)!`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);

        handleDrinkPotion(craftedBottle.id, playerParticipant, updatedList, true, craftedBottle);
    };

    // Tactic: Craft Invulnerability Potion (mix 4 potions -> drink invulnerability potion for 3 turns)
    const executeCraftInvulnerability = (bottles: PotionItem[]) => {
        if (!playerParticipant || bottles.length < 4) return;

        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    craftInvulnerabilityUses: Math.max(0, (p.craftInvulnerabilityUses ?? 1) - 1)
                };
            }
            return p;
        });

        // Mark all 4 bottles as taken on table
        const bottleIds = bottles.map(b => b.id);
        setSelectedBottleIds(prev => [...prev, ...bottleIds]);

        const craftedBottle: PotionItem = {
            id: bottles[0].id,
            type: 'invulnerability',
            name: 'Зілля неушкодженності',
            hpChange: 0,
            color: 'text-amber-200 bg-amber-950/90 border-yellow-400',
            icon: '🛡️✨',
            description: 'Створене з 4 пляшок: повна неушкодженність від усіх зіль на 3 ходи!'
        };

        const bottleIndices = bottles.map(b => `#${potions.indexOf(b) + 1}`).join(', ');
        const actionMsg = `🛡️ Створення зілля неушкодженності: Ви змішали 4 пляшечки (${bottleIndices}) та створили й випили Зілля неушкодженності на 3 ходи!`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);

        handleDrinkPotion(craftedBottle.id, playerParticipant, updatedList, true, craftedBottle);
    };

    // Tactic: Craft Fortune Potion (mix 5, 6, or 8 potions -> drink Fortune potion lasting 1, 3, or 5 turns)
    const executeCraftFortune = (bottles: PotionItem[], turns: number) => {
        const requiredCount = turns === 1 ? 5 : turns === 3 ? 6 : 8;
        if (!playerParticipant || bottles.length < requiredCount) return;

        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    craftFortuneUses: turns === 1 ? Math.max(0, (p.craftFortuneUses ?? 1) - 1) : p.craftFortuneUses,
                    craftFortune3Uses: turns === 3 ? Math.max(0, (p.craftFortune3Uses ?? 1) - 1) : p.craftFortune3Uses,
                    craftFortune5Uses: turns === 5 ? Math.max(0, (p.craftFortune5Uses ?? 1) - 1) : p.craftFortune5Uses
                };
            }
            return p;
        });

        // Mark all selected bottles as taken on table
        const bottleIds = bottles.map(b => b.id);
        setSelectedBottleIds(prev => [...new Set([...prev, ...bottleIds])]);
        selectedBottleIdsRef.current = [...new Set([...(selectedBottleIdsRef.current || []), ...bottleIds])];

        const titleName = turns === 1 ? 'Зілля успіху' : turns === 3 ? 'Тривале зілля успіху' : 'Довготривале зілля успіху';
        const craftedBottle: PotionItem = {
            id: bottles[0].id,
            type: 'fortune',
            name: `${titleName} (Створене)`,
            hpChange: 0,
            color: 'text-amber-300 bg-amber-950/90 border-amber-500',
            icon: '🍀✨',
            description: `Створене з ${bottles.length} пляшок: будь-яке випите зілля впродовж наступних ${turns} ходів перетвориться на Зілля лікування (+20 HP)`,
            fortuneTurns: turns
        };

        const bottleIndices = bottles.map(b => `#${potions.indexOf(b) + 1}`).join(', ');
        const actionMsg = `🍀 Створення ${titleName}: Ви змішали ${bottles.length} пляшечок (${bottleIndices}) та створили й випили ${titleName} на ${turns} ходів!`;
        setParticipants(updatedList);
        participantsRef.current = updatedList;
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);

        handleDrinkPotion(craftedBottle.id, playerParticipant, updatedList, true, craftedBottle);
    };

    // Tactic: Nature Break ("Збігати до вітру") - cleanses all effects & skips 3 rounds
    const handleNatureBreak = () => {
        if (!playerParticipant || (playerParticipant.natureBreakUses || 0) <= 0 || !isPlayerTurn) return;

        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    natureBreakUses: Math.max(0, (p.natureBreakUses ?? 1) - 1),
                    natureBreakRounds: 3,
                    // Cleanse all negative and positive effects
                    slowPoisonTurns: 0,
                    mixtureTurns: 0,
                    compressionCountdown: 0,
                    isCompressed: false,
                    invulnerabilityTurns: 0,
                    drunkenness: 0,
                    hasAntidote: false,
                    hasSorbent: false,
                    hasSorbentActive: false,
                    hasSolventActive: false,
                    hasSnakeEaterActive: false,
                    hasPoisonResistActive: false,
                    hasPermanganate: false,
                    hasFortune: false,
                    fortuneTurns: 0,
                    catalystMultiplier: 1,
                    inhibitorMultiplier: 1,
                    isAsleep: false
                };
            }
            return p;
        });

        const actionMsg = `💨 ${playerParticipant.name} збігав до вітру! Всі ефекти (отрути, компресію, сп'яніння, захисти та бафи) знято! Пропуск наступних 3 кіл.`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        setSelectedTactic(null);
        playTone('water');

        // Advance to next turn (skipping player's current turn and starting 3-round break)
        advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length, compressedRewards);
    };

    // Tactic: Flush Table - dumps all potions, regenerates fresh batch, and passes turn
    const handleFlushTable = () => {
        if (!playerParticipant) return;

        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    flushTableUses: Math.max(0, (p.flushTableUses ?? 6) - 1)
                };
            }
            return p;
        });

        // Regenerate fresh potions for the table
        const newPotions = generateShuffledPotions(participantCount);
        setPotions(newPotions);
        setSelectedBottleIds([]);

        const actionMsg = `🚽 Вилити стіл: Усі старі зілля вилито в каналізацію! На стіл виставлено ${newPotions.length} нових зілля. Хід переходить далі!`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        setSelectedTactic(null);
        playTone('water');

        // Advance turn (skip turn because of table flush)
        advanceToNextTurn(updatedList, currentTurnIndex, 0, compressedRewards);
    };

    // Tactic: Toggle Sorbent before drinking
    const handleToggleSorbent = () => {
        if (!playerParticipant || (playerParticipant.sorbentUses ?? 0) <= 0) return;
        setParticipants(prev => prev.map(p => {
            if (p.isPlayer) {
                const nextActive = !p.hasSorbentActive;
                return {
                    ...p,
                    hasSorbentActive: nextActive
                };
            }
            return p;
        }));
    };

    // Tactic: Toggle Snake Eater before drinking
    const handleToggleSnakeEater = () => {
        if (!playerParticipant || (playerParticipant.snakeEaterUses ?? 0) <= 0) return;
        setParticipants(prev => prev.map(p => {
            if (p.isPlayer) {
                const nextActive = !p.hasSnakeEaterActive;
                return {
                    ...p,
                    hasSnakeEaterActive: nextActive,
                    hasPoisonResistActive: nextActive ? false : p.hasPoisonResistActive
                };
            }
            return p;
        }));
    };

    // Tactic: Toggle Poison Resistance before drinking
    const handleTogglePoisonResist = () => {
        if (!playerParticipant || (playerParticipant.poisonResistUses ?? 0) <= 0) return;
        setParticipants(prev => prev.map(p => {
            if (p.isPlayer) {
                const nextActive = !p.hasPoisonResistActive;
                return {
                    ...p,
                    hasPoisonResistActive: nextActive,
                    hasSnakeEaterActive: nextActive ? false : p.hasSnakeEaterActive
                };
            }
            return p;
        }));
    };

    // Tactic: Highlight Healing Potions (lasts 1 turn)
    const handleToggleHighlightHealing = () => {
        if (!playerParticipant || (playerParticipant.highlightHealingUses ?? 0) <= 0) return;
        const nextState = !revealedHealing;
        setRevealedHealing(nextState);
        if (nextState) {
            setParticipants(prev => prev.map(p => p.isPlayer ? { ...p, highlightHealingUses: Math.max(0, (p.highlightHealingUses ?? 1) - 1) } : p));
            const actionMsg = `💖 Підсвітка Зілля зцілення! Усі цілющі зілля на столі засяяли на 1 хід!`;
            setLastActionText(actionMsg);
            setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
            playTone('heal');
        }
    };

    // Tactic: Highlight Mixture Potions (lasts 1 turn)
    const handleToggleHighlightMixture = () => {
        if (!playerParticipant || (playerParticipant.highlightMixtureUses ?? 0) <= 0) return;
        const nextState = !revealedMixture;
        setRevealedMixture(nextState);
        if (nextState) {
            setParticipants(prev => prev.map(p => p.isPlayer ? { ...p, highlightMixtureUses: Math.max(0, (p.highlightMixtureUses ?? 1) - 1) } : p));
            const actionMsg = `🍵 Підсвітка Мікстур! Усі цілющі мікстури на столі засяяли на 1 хід!`;
            setLastActionText(actionMsg);
            setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
            playTone('heal');
        }
    };

    // Tactic: Highlight Poisons (lasts 1 turn)
    const handleToggleHighlightPoisons = () => {
        if (!playerParticipant || (playerParticipant.highlightPoisonsUses ?? 0) <= 0) return;
        const nextState = !revealedPoisons;
        setRevealedPoisons(nextState);
        if (nextState) {
            setParticipants(prev => prev.map(p => p.isPlayer ? { ...p, highlightPoisonsUses: Math.max(0, (p.highlightPoisonsUses ?? 1) - 1) } : p));
            const actionMsg = `☠️ Підсвітка Отрут! Усі яди та отрути на столі засяяли на 1 хід!`;
            setLastActionText(actionMsg);
            setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
            playTone('poison');
        }
    };

    // Tactic: Neutralize all poisons on table to pure water (0 HP)
    const handleNeutralizeAllPoisons = () => {
        if (!playerParticipant || (playerParticipant.neutralizeAllPoisonsUses ?? 0) <= 0) return;
        const isPoisonType = (t: PotionType) => ['light_poison', 'medium_poison', 'heavy_poison', 'slow_poison', 'poison'].includes(t);
        setPotions(prev => prev.map(p => {
            if (isPoisonType(p.type)) {
                return {
                    ...p,
                    type: 'water',
                    name: 'Чиста вода (знешкоджена)',
                    hpChange: 0,
                    color: 'text-sky-300 bg-sky-950/80 border-sky-500',
                    icon: '💧',
                    description: '0 HP освіжаюча вода (знешкоджений яд)'
                };
            }
            return p;
        }));
        setParticipants(prev => prev.map(p => p.isPlayer ? { ...p, neutralizeAllPoisonsUses: Math.max(0, (p.neutralizeAllPoisonsUses ?? 1) - 1) } : p));
        const actionMsg = `💧 Нейтралізація всіх ядів! Усі отрути на столі миттєво перетворено на Чисту воду (0 HP)!`;
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        playTone('water');
    };

    // Tactic: Weaken all poisons on table to -5 HP damage
    const handleWeakenAllPoisons = () => {
        if (!playerParticipant || (playerParticipant.weakenAllPoisonsUses ?? 0) <= 0) return;
        const isPoisonType = (t: PotionType) => ['light_poison', 'medium_poison', 'heavy_poison', 'slow_poison', 'poison'].includes(t);
        setPotions(prev => prev.map(p => {
            if (isPoisonType(p.type)) {
                return {
                    ...p,
                    hpChange: -5,
                    description: '-5 HP слабкий яд (ослаблено магією)'
                };
            }
            return p;
        }));
        setParticipants(prev => prev.map(p => p.isPlayer ? { ...p, weakenAllPoisonsUses: Math.max(0, (p.weakenAllPoisonsUses ?? 1) - 1) } : p));
        const actionMsg = `🧪 Ослаблення ядів! Усі отрути на столі відтепер наносять лише -5 HP пошкодження!`;
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        playTone('water');
    };

    // Tactic: Toggle Poison to Mixture buff
    const handleTogglePoisonToMixture = () => {
        if (!playerParticipant || (playerParticipant.poisonToMixtureUses ?? 0) <= 0) return;
        setParticipants(prev => prev.map(p => p.isPlayer ? { ...p, hasPoisonToMixtureActive: !p.hasPoisonToMixtureActive, hasPoisonToWaterActive: false, hasPoisonToSorbentActive: false } : p));
    };

    // Tactic: Toggle Poison to Water buff
    const handleTogglePoisonToWater = () => {
        if (!playerParticipant || (playerParticipant.poisonToWaterUses ?? 0) <= 0) return;
        setParticipants(prev => prev.map(p => p.isPlayer ? { ...p, hasPoisonToWaterActive: !p.hasPoisonToWaterActive, hasPoisonToMixtureActive: false, hasPoisonToSorbentActive: false } : p));
    };

    // Tactic: Toggle Poison to Sorbent buff
    const handleTogglePoisonToSorbent = () => {
        if (!playerParticipant || (playerParticipant.poisonToSorbentUses ?? 0) <= 0) return;
        setParticipants(prev => prev.map(p => p.isPlayer ? { ...p, hasPoisonToSorbentActive: !p.hasPoisonToSorbentActive, hasPoisonToMixtureActive: false, hasPoisonToWaterActive: false } : p));
    };

    // Tactic: Discard a potion blindly (dump it without scanning)
    const executeDiscardSecret = (bottle: PotionItem) => {
        if (!playerParticipant) return;

        // Mark bottle as taken
        setSelectedBottleIds(prev => [...prev, bottle.id]);

        // Decrement discardSecretUses
        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return { 
                    ...p, 
                    discardSecretUses: Math.max(0, (p.discardSecretUses !== undefined ? p.discardSecretUses : 4) - 1) 
                };
            }
            return p;
        });

        const actionMsg = `🗑️ ${playerParticipant.name} вилив вміст пляшечки #${potions.indexOf(bottle) + 1} наосліп, не дізнавшись її таємницю.`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        setSelectedTactic(null);

        // Advance turn
        advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length + 1, compressedRewards);
    };

    // Tactic: Convert selected potion to a different type
    const executePotionConversion = (bottle: PotionItem, conversionType: 'vodka' | 'healing' | 'neutralizer' | 'filter' | 'permanganate' | 'love' | 'friendship' | 'sleep') => {
        if (!playerParticipant) return;

        let updatedPotion: PotionItem;
        let actionMsg = "";
        const bottleIndex = potions.indexOf(bottle) + 1;

        if (conversionType === 'vodka') {
            updatedPotion = {
                ...bottle,
                type: 'vodka',
                name: 'Горілка',
                hpChange: 0,
                color: 'text-slate-200 bg-slate-900/80 border-slate-400',
                icon: '🍾',
                description: '+1d10 до захмеленості. Якщо >25%, кидок на сон щоходу, але дія ядів зменшується у 2 рази'
            };
            actionMsg = `🧪 Алхімічна перегонка! Ви перетворили пляшечку #${bottleIndex} на 🍾 Горілку!`;
        } else if (conversionType === 'healing') {
            updatedPotion = {
                ...bottle,
                type: 'healing',
                name: 'Зілля зцілення',
                hpChange: 20,
                color: 'text-rose-300 bg-rose-950/80 border-rose-500',
                icon: '💖',
                description: '+20 HP відновлення'
            };
            actionMsg = `✨ Чудо перегонка! Ви перетворили пляшечку #${bottleIndex} на 💖 Зілля зцілення!`;
        } else if (conversionType === 'sleep') {
            updatedPotion = {
                ...bottle,
                type: 'sleep',
                name: 'Зілля сну',
                hpChange: 0,
                color: 'text-purple-300 bg-purple-950/80 border-purple-500',
                icon: '💤',
                description: 'Підмішане Зілля сну! Кидок 5d20: 3 поразки (≤10) = гравець засинає!'
            };
            actionMsg = `💤 Сонне зілля підмішано! Ви підлили Зілля сну у пляшечку #${bottleIndex}!`;
        } else if (conversionType === 'neutralizer') {
            updatedPotion = {
                ...bottle,
                type: 'water',
                name: 'Брудна вода',
                hpChange: -1,
                color: 'text-yellow-600 bg-amber-950/30 border-yellow-700',
                icon: '🤢',
                description: '-1 HP брудна вода'
            };
            actionMsg = `🤢 Нейтралізатор! Ви знешкодили пляшечку #${bottleIndex}, тепер це 🤢 Брудна вода (-1 HP).`;
        } else if (conversionType === 'permanganate') {
            updatedPotion = {
                ...bottle,
                type: 'permanganate',
                name: 'Марганцівка',
                hpChange: 0,
                color: 'text-pink-400 bg-pink-950/80 border-pink-500',
                icon: '🧼',
                description: 'Відміняє дію всіх зіль у наступному ході (виблює все разом з випитим)'
            };
            actionMsg = `🧼 Блювотний препарат! Ви перетворили пляшечку #${bottleIndex} на Марганцівку 🧼!`;
        } else if (conversionType === 'love') {
            const playerGender: CharacterGender = playerParticipant.gender || (progress?.playerStats?.gender || 'male');
            const targetGenderDesc = playerGender === 'male' ? 'жінку' : 'чоловіка';
            updatedPotion = {
                ...bottle,
                type: 'love',
                name: 'Любовне зілля',
                hpChange: 0,
                color: 'text-pink-300 bg-pink-950/80 border-pink-500',
                icon: '💘',
                description: `Діє лише на осіб протилежної статі! Якщо його вип'є ${targetGenderDesc}, то палко закохається у ${playerParticipant.name}, здасться та вступить у ваш загін!`,
                spikedBy: playerParticipant.id,
                spikedByName: playerParticipant.name,
                spikedByAvatar: playerParticipant.avatar,
                spikedByGender: playerGender,
                isSpikedLove: true
            };
            actionMsg = `💘 Любовне зілля підмішано! Ви підлили Любовне зілля у пляшечку #${bottleIndex}! Зілля подіє лише на особу протилежної статі (${targetGenderDesc})!`;
        } else if (conversionType === 'friendship') {
            updatedPotion = {
                ...bottle,
                type: 'friendship',
                name: 'Зілля дружби',
                hpChange: 0,
                color: 'text-amber-300 bg-amber-950/80 border-amber-500',
                icon: '🤝',
                description: `Випивший стає вірним другом ${playerParticipant.name}, здається та вступає у ваш загін!`,
                spikedBy: playerParticipant.id,
                spikedByName: playerParticipant.name,
                spikedByAvatar: playerParticipant.avatar,
                isSpikedFriendship: true
            };
            actionMsg = `🤝 Зілля дружби підмішано! Ви перетворили пляшечку #${bottleIndex} на Зілля дружби! Той, хто її вип'є, стане вашим другом і вступить у ваш загін!`;
        } else {
            updatedPotion = {
                ...bottle,
                type: 'water',
                name: 'Чиста вода',
                hpChange: 0,
                color: 'text-sky-300 bg-sky-950/80 border-sky-500',
                icon: '💧',
                description: '0 HP освіжаюча вода'
            };
            actionMsg = `💧 Фільтр! Ви відфільтрували пляшечку #${bottleIndex}, перетворивши її на 💧 Чисту воду!`;
        }

        // Update potions state
        setPotions(prev => prev.map(p => p.id === bottle.id ? updatedPotion : p));

        // Decrement corresponding tactic uses
        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return {
                    ...p,
                    distillUses: conversionType === 'vodka' ? Math.max(0, (p.distillUses ?? 2) - 1) : p.distillUses,
                    miracleUses: conversionType === 'healing' ? Math.max(0, (p.miracleUses ?? 3) - 1) : p.miracleUses,
                    neutralizerUses: conversionType === 'neutralizer' ? Math.max(0, (p.neutralizerUses ?? 3) - 1) : p.neutralizerUses,
                    filterUses: conversionType === 'filter' ? Math.max(0, (p.filterUses ?? 5) - 1) : p.filterUses,
                    vomitDrugUses: conversionType === 'permanganate' ? Math.max(0, (p.vomitDrugUses ?? 1) - 1) : p.vomitDrugUses,
                    spikeLoveUses: conversionType === 'love' ? Math.max(0, (p.spikeLoveUses ?? 1) - 1) : p.spikeLoveUses,
                    spikeFriendshipUses: conversionType === 'friendship' ? Math.max(0, (p.spikeFriendshipUses ?? 1) - 1) : p.spikeFriendshipUses,
                };
            }
            return p;
        });

        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        setSelectedTactic(null);
        playTone('heal');
    };

    // Tactic: Handle choice of scanning and deciding whether to drink or discard
    const handleScanAndChooseResult = (drink: boolean) => {
        if (!scanChooseBottle || !playerParticipant) return;
        const bottle = scanChooseBottle;
        setScanChooseBottle(null);
        setSelectedTactic(null);

        // Decrement scanAndChooseUses
        const updatedList = participants.map(p => {
            if (p.isPlayer) {
                return { 
                    ...p, 
                    scanAndChooseUses: Math.max(0, (p.scanAndChooseUses !== undefined ? p.scanAndChooseUses : 2) - 1) 
                };
            }
            return p;
        });

        if (drink) {
            // Player decides to drink it
            const msg = `🔍 Сканування: ${playerParticipant.name} просканував пляшечку #${potions.indexOf(bottle) + 1} (${bottle.icon} ${bottle.name}) та вирішив ВИПИТИ її!`;
            setLog(prev => [msg, ...prev.slice(0, 35)]);
            handleDrinkPotion(bottle.id, playerParticipant, updatedList, true);
        } else {
            // Player decides to pour it out
            setSelectedBottleIds(prev => [...prev, bottle.id]);
            const actionMsg = `🔍 Сканування: ${playerParticipant.name} просканував пляшечку #${potions.indexOf(bottle) + 1} (${bottle.icon} ${bottle.name}) та відмовився її пити. Вона вилита!`;
            setParticipants(updatedList);
            setLastActionText(actionMsg);
            setLog(prev => [actionMsg, ...prev.slice(0, 35)]);

            // Advance turn
            advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length + 1, compressedRewards);
        }
    };

    // Wake up a sleeping participant and pass the turn to them
    const handleWakeUpParticipant = (targetId: string) => {
        if (!playerParticipant) return;
        const targetIndex = participants.findIndex(p => p.id === targetId);
        if (targetIndex === -1) return;

        const targetPart = participants[targetIndex];

        const updatedList = participants.map(p => {
            if (p.id === targetId) {
                return {
                    ...p,
                    isAsleep: false,
                    isEliminated: false,
                    hp: 50 // Restore to 50 HP so they are back in action
                };
            }
            if (p.isPlayer) {
                return {
                    ...p,
                    wakeUpUses: Math.max(0, (p.wakeUpUses ?? 4) - 1)
                };
            }
            return p;
        });

        const actionMsg = `⏰ БУДИЛЬНИК! ${playerParticipant.name} використав Будильник і розбудив ${targetPart.avatar} ${targetPart.name}! Хід переходить до нього!`;
        setParticipants(updatedList);
        setLastActionText(actionMsg);
        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
        playTone('heal');

        // Pass turn to the awakened participant
        setCurrentTurnIndex(targetIndex);
    };

    // AI turn effect - NPCs actively use ALL tactics and abilities
    useEffect(() => {
        if (gameOver || !isOpen || sleepDiceState || givenPotionContext) return;
        
        const currentParticipants = participantsRef.current.length > 0 ? participantsRef.current : participants;
        const currentPart = currentParticipants[currentTurnIndex];
        if (!currentPart || currentPart.isEliminated) return;

        if (!currentPart.isPlayer) {
            let currentPotions = potionsRef.current.length > 0 ? potionsRef.current : potions;
            let currentSelected = selectedBottleIdsRef.current;
            let availablePotions = currentPotions.filter(p => !currentSelected.includes(p.id));
            
            // If table ran out of potions, auto-reshuffle
            if (availablePotions.length === 0) {
                currentPotions = generateShuffledPotions(participantCount);
                setPotions(currentPotions);
                potionsRef.current = currentPotions;
                setSelectedBottleIds([]);
                selectedBottleIdsRef.current = [];
                availablePotions = currentPotions;
            }

            const delay = fastMode ? 50 : 450;

            // 1. Evaluate defensive protections (Sorbent & Solvent & Snake Eater & Poison Resistance)
            const canUseSorbent = (currentPart.sorbentUses ?? 10) > 0 && !currentPart.hasSorbentActive;
            const canUseSolvent = (currentPart.solventUses ?? 1) > 0 && !currentPart.hasSolventActive;
            const canUseSnakeEater = (currentPart.snakeEaterUses ?? 1) > 0 && !currentPart.hasSnakeEaterActive;
            const canUsePoisonResist = (currentPart.poisonResistUses ?? 1) > 0 && !currentPart.hasPoisonResistActive;
            
            let willActivateSorbent = false;
            let willActivateSolvent = false;
            let willActivateSnakeEater = false;
            let willActivatePoisonResist = false;

            if (canUseSnakeEater && currentPart.hp <= 65 && Math.random() < 0.50) {
                willActivateSnakeEater = true;
            } else if (canUsePoisonResist && currentPart.hp <= 45 && Math.random() < 0.50) {
                willActivatePoisonResist = true;
            } else if (canUseSorbent && (currentPart.hp <= 70 || Math.random() < 0.35)) {
                willActivateSorbent = true;
            } else if (canUseSolvent && currentPart.hp <= 50 && Math.random() < 0.40) {
                willActivateSolvent = true;
            }

            // Build participant list with updated protections if activated
            const baseList = (willActivateSorbent || willActivateSolvent || willActivateSnakeEater || willActivatePoisonResist) ? currentParticipants.map(p => {
                if (p.id === currentPart.id) {
                    return {
                        ...p,
                        hasSorbentActive: willActivateSorbent ? true : p.hasSorbentActive,
                        hasSolventActive: willActivateSolvent ? true : p.hasSolventActive,
                        hasSnakeEaterActive: willActivateSnakeEater ? true : p.hasSnakeEaterActive,
                        hasPoisonResistActive: willActivatePoisonResist ? true : p.hasPoisonResistActive
                    };
                }
                return p;
            }) : currentParticipants;

            // 2. Candidate Tactics for NPC
            type NPCTactic = 
                | 'flushTable'
                | 'wakeUp'
                | 'skipTurn'
                | 'miracle'
                | 'filter'
                | 'neutralizer'
                | 'distill'
                | 'mixPotions'
                | 'scan_choose'
                | 'scan_discard'
                | 'discard_secret'
                | 'taster'
                | 'vomitDrug'
                | 'natureBreak'
                | 'spike_love'
                | 'spike_friendship';

            const possibleTactics: { tactic: NPCTactic; weight: number }[] = [];

            // A. Flush Table (6 uses)
            const canFlush = (currentPart.flushTableUses ?? 6) > 0;
            if (canFlush && (availablePotions.length <= 8 || (currentPart.hp < 35 && Math.random() < 0.30))) {
                possibleTactics.push({ tactic: 'flushTable', weight: 4 });
            }

            // B. Alarm Clock / Wake Up (4 uses)
            const canWakeUp = (currentPart.wakeUpUses ?? 4) > 0;
            const sleepingParticipants = participants.filter(p => p.isAsleep && p.id !== currentPart.id);
            if (canWakeUp && sleepingParticipants.length > 0) {
                possibleTactics.push({ tactic: 'wakeUp', weight: 3 });
            }

            // C. Skip Turn (4 uses)
            const canSkip = (currentPart.skipTurnUses ?? 4) > 0;
            if (canSkip && (currentPart.hp < 40 || Math.random() < 0.20)) {
                possibleTactics.push({ tactic: 'skipTurn', weight: 3 });
            }

            // D. Miracle barrel (3 uses) -> turns bottle to Healing +20 HP
            const canMiracle = (currentPart.miracleUses ?? 3) > 0;
            if (canMiracle && currentPart.hp <= 80) {
                possibleTactics.push({ tactic: 'miracle', weight: 4 });
            }

            // E. Filter (5 uses) -> turns bottle to Pure Water 0 HP
            const canFilter = (currentPart.filterUses ?? 5) > 0;
            if (canFilter && currentPart.hp <= 65) {
                possibleTactics.push({ tactic: 'filter', weight: 3 });
            }

            // F. Neutralizer (3 uses) -> turns bottle to Dirty Water -1 HP
            const canNeutralizer = (currentPart.neutralizerUses ?? 3) > 0;
            if (canNeutralizer && currentPart.hp <= 50) {
                possibleTactics.push({ tactic: 'neutralizer', weight: 3 });
            }

            // G. Distill (2 uses) -> turns bottle to Vodka 🍾
            const canDistill = (currentPart.distillUses ?? 2) > 0;
            if (canDistill) {
                possibleTactics.push({ tactic: 'distill', weight: 2 });
            }

            // I. Mix Potions (3 uses)
            const canMix = (currentPart.mixPotionsUses ?? 3) > 0;
            if (canMix && availablePotions.length >= 2) {
                possibleTactics.push({ tactic: 'mixPotions', weight: 3 });
            }

            // L. Scan and Choose (2 uses)
            const canScanChoose = (currentPart.scanAndChooseUses ?? 2) > 0;
            if (canScanChoose) {
                possibleTactics.push({ tactic: 'scan_choose', weight: 4 });
            }

            // M. Scan and Discard (3 uses)
            const canScanDiscard = (currentPart.scanAndDiscardUses ?? 3) > 0;
            if (canScanDiscard) {
                possibleTactics.push({ tactic: 'scan_discard', weight: 3 });
            }

            // N. Discard Secret (4 uses)
            const canDiscardSecret = (currentPart.discardSecretUses ?? 4) > 0;
            if (canDiscardSecret) {
                possibleTactics.push({ tactic: 'discard_secret', weight: 3 });
            }

            // O. Taster (3 uses)
            const canTaster = (currentPart.tasterUses ?? 3) > 0;
            if (canTaster) {
                possibleTactics.push({ tactic: 'taster', weight: 3 });
            }

            // P. Vomit Drug (Блювотний препарат) (1 use)
            const canVomitDrug = (currentPart.vomitDrugUses ?? 1) > 0;
            const hasBadEffects = ((currentPart.slowPoisonTurns || 0) > 0) || ((currentPart.drunkenness || 0) > 20) || ((currentPart.compressionCountdown || 0) > 0);
            if (canVomitDrug && currentPart.hp < 40 && hasBadEffects) {
                possibleTactics.push({ tactic: 'vomitDrug', weight: 6 });
            }

            // Q. Nature Break (Збігати до вітру) (1 use)
            const canNatureBreak = (currentPart.natureBreakUses ?? 1) > 0;
            const hasSevereBadEffects = ((currentPart.slowPoisonTurns || 0) > 0) || ((currentPart.compressionCountdown || 0) > 0) || ((currentPart.drunkenness || 0) > 25);
            if (canNatureBreak && (hasSevereBadEffects || (currentPart.hp < 30 && Math.random() < 0.35))) {
                possibleTactics.push({ tactic: 'natureBreak', weight: 6 });
            }

            // R. Spike Love Potion (Підмішати любовне зілля) (1 use)
            const canSpikeLove = (currentPart.spikeLoveUses ?? 1) > 0;
            if (canSpikeLove && availablePotions.length > 2 && Math.random() < 0.40) {
                possibleTactics.push({ tactic: 'spike_love', weight: 4 });
            }

            // S. Spike Friendship Potion (Підмішати зілля дружби) (1 use)
            const canSpikeFriendship = (currentPart.spikeFriendshipUses ?? 1) > 0;
            if (canSpikeFriendship && availablePotions.length > 2 && Math.random() < 0.40) {
                possibleTactics.push({ tactic: 'spike_friendship', weight: 4 });
            }

            // NPC has high overall chance (65% or 80% if low HP) to pick an active tactical ability
            const tacticThreshold = currentPart.hp < 45 ? 0.80 : 0.65;
            let chosenTactic: NPCTactic | null = null;

            if (possibleTactics.length > 0 && Math.random() < tacticThreshold) {
                const totalWeight = possibleTactics.reduce((sum, t) => sum + t.weight, 0);
                let randomVal = Math.random() * totalWeight;
                for (const item of possibleTactics) {
                    if (randomVal < item.weight) {
                        chosenTactic = item.tactic;
                        break;
                    }
                    randomVal -= item.weight;
                }
                if (!chosenTactic && possibleTactics.length > 0) {
                    chosenTactic = possibleTactics[0].tactic;
                }
            }

            // 3. Execute chosen tactic OR regular drink
            aiTimerRef.current = setTimeout(() => {
                if (willActivateSorbent) {
                    const sorbentMsg = `🧽 Тактика: ${currentPart.avatar} ${currentPart.name} прийняв(ла) Сорбент перед вибором зілля! Наступний ефект буде заблоковано!`;
                    setLog(prev => [sorbentMsg, ...prev.slice(0, 35)]);
                }
                if (willActivateSolvent) {
                    const solventMsg = `🧴 Тактика: ${currentPart.avatar} ${currentPart.name} випив(ла) Розчинник! Шкода від отрути буде зменшена вдвічі!`;
                    setLog(prev => [solventMsg, ...prev.slice(0, 35)]);
                }
                if (willActivateSnakeEater) {
                    const snakeEaterMsg = `🐍 Тактика: ${currentPart.avatar} ${currentPart.name} активував(ла) Поїдач змій перед вибором зілля! Наступний яд вилікує його!`;
                    setLog(prev => [snakeEaterMsg, ...prev.slice(0, 35)]);
                }
                if (willActivatePoisonResist) {
                    const poisonResistMsg = `🛡️ Тактика: ${currentPart.avatar} ${currentPart.name} активував(ла) Стійкість до яду перед вибором зілля! Шкода від яду буде нейтралізована!`;
                    setLog(prev => [poisonResistMsg, ...prev.slice(0, 35)]);
                }

                if (chosenTactic === 'flushTable') {
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, flushTableUses: Math.max(0, (p.flushTableUses ?? 6) - 1) };
                        }
                        return p;
                    });
                    const newPotions = generateShuffledPotions(participantCount);
                    setPotions(newPotions);
                    setSelectedBottleIds([]);

                    const actionMsg = `🚽 Тактика: ${currentPart.avatar} ${currentPart.name} скористався "Вилити стіл" та оновив усі 31 зілля! Хід переходить далі!`;
                    setParticipants(updatedList);
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    playTone('water');
                    advanceToNextTurn(updatedList, currentTurnIndex, 0, compressedRewards);
                    return;
                }

                if (chosenTactic === 'wakeUp') {
                    const sleepers = participants.filter(p => p.isAsleep && p.id !== currentPart.id);
                    if (sleepers.length > 0) {
                        const targetSleeper = sleepers[Math.floor(Math.random() * sleepers.length)];
                        const targetIndex = participants.findIndex(p => p.id === targetSleeper.id);

                        const updatedList = baseList.map(p => {
                            if (p.id === targetSleeper.id) {
                                return { ...p, isAsleep: false, isEliminated: false, hp: 50 };
                            }
                            if (p.id === currentPart.id) {
                                return { ...p, wakeUpUses: Math.max(0, (p.wakeUpUses ?? 4) - 1) };
                            }
                            return p;
                        });

                        const actionMsg = `⏰ Тактика: ${currentPart.avatar} ${currentPart.name} дзвенить Будильником і будить ${targetSleeper.avatar} ${targetSleeper.name}! Хід переходить до нього!`;
                        setParticipants(updatedList);
                        setLastActionText(actionMsg);
                        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                        playTone('heal');
                        setCurrentTurnIndex(targetIndex);
                        return;
                    }
                }

                if (chosenTactic === 'skipTurn') {
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, skipTurnUses: Math.max(0, (p.skipTurnUses ?? 4) - 1) };
                        }
                        return p;
                    });
                    const actionMsg = `⏭️ Тактика: ${currentPart.avatar} ${currentPart.name} вирішив пропустити свій хід!`;
                    setParticipants(updatedList);
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length, compressedRewards);
                    return;
                }

                if (chosenTactic === 'vomitDrug') {
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return {
                                ...p,
                                vomitDrugUses: Math.max(0, (p.vomitDrugUses ?? 1) - 1),
                                slowPoisonTurns: 0,
                                mixtureTurns: 0,
                                compressionCountdown: 0,
                                drunkenness: 0,
                                hasAntidote: false,
                                hasSorbent: false,
                                hasFortune: false,
                                fortuneTurns: 0,
                                catalystMultiplier: 1,
                                inhibitorMultiplier: 1,
                                hasSorbentActive: false,
                                hasSolventActive: false,
                                hasSnakeEaterActive: false,
                                hasPoisonResistActive: false
                            };
                        }
                        return p;
                    });
                    const actionMsg = `🤮 Тактика: ${currentPart.avatar} ${currentPart.name} прийняв Блювотний препарат (марганцівку), очистив свій організм від усіх активних отрут та пропустив хід!`;
                    setParticipants(updatedList);
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    playTone('water');
                    advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length, compressedRewards);
                    return;
                }

                if (chosenTactic === 'natureBreak') {
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return {
                                ...p,
                                natureBreakUses: Math.max(0, (p.natureBreakUses ?? 1) - 1),
                                natureBreakRounds: 3,
                                slowPoisonTurns: 0,
                                mixtureTurns: 0,
                                compressionCountdown: 0,
                                isCompressed: false,
                                invulnerabilityTurns: 0,
                                drunkenness: 0,
                                hasAntidote: false,
                                hasSorbent: false,
                                hasSorbentActive: false,
                                hasSolventActive: false,
                                hasSnakeEaterActive: false,
                                hasPoisonResistActive: false,
                                hasPermanganate: false,
                                hasFortune: false,
                                fortuneTurns: 0,
                                catalystMultiplier: 1,
                                inhibitorMultiplier: 1,
                                isAsleep: false
                            };
                        }
                        return p;
                    });
                    const actionMsg = `💨 Тактика: ${currentPart.avatar} ${currentPart.name} збігав(ла) до вітру! Знято всі ефекти, отруту та сп'яніння. Пропускає 3 кола гри!`;
                    setParticipants(updatedList);
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    playTone('water');
                    advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length, compressedRewards);
                    return;
                }

                if (chosenTactic === 'spike_love') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const npcGender: CharacterGender = currentPart.gender || 'male';
                    const targetGenderDesc = npcGender === 'male' ? 'жінок' : 'чоловіків';
                    const lovePotion: PotionItem = {
                        ...targetBottle,
                        type: 'love',
                        name: 'Любовне зілля',
                        hpChange: 0,
                        color: 'text-pink-300 bg-pink-950/80 border-pink-500',
                        icon: '💘',
                        description: `Діє лише на осіб протилежної статі! Якщо його вип'є особа протилежної статі, вона закохається у ${currentPart.name}, здасться та вступить до ${npcGender === 'female' ? 'її' : 'його'} загону!`,
                        spikedBy: currentPart.id,
                        spikedByName: currentPart.name,
                        spikedByAvatar: currentPart.avatar,
                        spikedByGender: npcGender,
                        isSpikedLove: true
                    };
                    setPotions(prev => prev.map(p => p.id === targetBottle.id ? lovePotion : p));
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, spikeLoveUses: Math.max(0, (p.spikeLoveUses ?? 1) - 1) };
                        }
                        return p;
                    });
                    const actionMsg = `💘 Тактика: ${currentPart.avatar} ${currentPart.name} підлив(ла) Любовне зілля (діє лише на ${targetGenderDesc}) у пляшечку #${potions.indexOf(targetBottle) + 1}!`;
                    setParticipants(updatedList);
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    playTone('heal');
                    // Pick another random available bottle to drink
                    const remainingPotions = availablePotions.filter(p => p.id !== targetBottle.id);
                    const drinkBottle = remainingPotions.length > 0 ? remainingPotions[Math.floor(Math.random() * remainingPotions.length)] : targetBottle;
                    handleDrinkPotion(drinkBottle.id, currentPart, updatedList);
                    return;
                }

                if (chosenTactic === 'spike_friendship') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const friendPotion: PotionItem = {
                        ...targetBottle,
                        type: 'friendship',
                        name: 'Зілля дружби',
                        hpChange: 0,
                        color: 'text-amber-300 bg-amber-950/80 border-amber-500',
                        icon: '🤝',
                        description: `Випивший стає вірним другом ${currentPart.name}, здається та вступає до його загону!`,
                        spikedBy: currentPart.id,
                        spikedByName: currentPart.name,
                        spikedByAvatar: currentPart.avatar,
                        isSpikedFriendship: true
                    };
                    setPotions(prev => prev.map(p => p.id === targetBottle.id ? friendPotion : p));
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, spikeFriendshipUses: Math.max(0, (p.spikeFriendshipUses ?? 1) - 1) };
                        }
                        return p;
                    });
                    const actionMsg = `🤝 Тактика: ${currentPart.avatar} ${currentPart.name} перетворив(ла) пляшечку #${potions.indexOf(targetBottle) + 1} на Зілля дружби!`;
                    setParticipants(updatedList);
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    playTone('heal');
                    // Pick another random available bottle to drink
                    const remainingPotions = availablePotions.filter(p => p.id !== targetBottle.id);
                    const drinkBottle = remainingPotions.length > 0 ? remainingPotions[Math.floor(Math.random() * remainingPotions.length)] : targetBottle;
                    handleDrinkPotion(drinkBottle.id, currentPart, updatedList);
                    return;
                }

                if (chosenTactic === 'miracle') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const healingPotion: PotionItem = {
                        ...targetBottle,
                        type: 'healing',
                        name: 'Зілля зцілення',
                        hpChange: 20,
                        color: 'text-rose-300 bg-rose-950/80 border-rose-500',
                        icon: '💖',
                        description: '+20 HP відновлення'
                    };
                    setPotions(prev => prev.map(p => p.id === targetBottle.id ? healingPotion : p));
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, miracleUses: Math.max(0, (p.miracleUses ?? 3) - 1) };
                        }
                        return p;
                    });
                    const actionMsg = `💖 Тактика: ${currentPart.avatar} ${currentPart.name} використав "Чудо-діжку", перетворив пляшечку #${potions.indexOf(targetBottle) + 1} на Зілля зцілення (+20 HP) та випив її!`;
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    handleDrinkPotion(targetBottle.id, currentPart, updatedList, true, healingPotion);
                    return;
                }

                if (chosenTactic === 'filter') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const waterPotion: PotionItem = {
                        ...targetBottle,
                        type: 'water',
                        name: 'Чиста вода',
                        hpChange: 0,
                        color: 'text-sky-300 bg-sky-950/80 border-sky-500',
                        icon: '💧',
                        description: '0 HP освіжаюча вода'
                    };
                    setPotions(prev => prev.map(p => p.id === targetBottle.id ? waterPotion : p));
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, filterUses: Math.max(0, (p.filterUses ?? 5) - 1) };
                        }
                        return p;
                    });
                    const actionMsg = `💧 Тактика: ${currentPart.avatar} ${currentPart.name} застосував "Фільтр", перетворив пляшечку #${potions.indexOf(targetBottle) + 1} на Чисту воду (0 HP) і випив її!`;
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    handleDrinkPotion(targetBottle.id, currentPart, updatedList, true, waterPotion);
                    return;
                }

                if (chosenTactic === 'neutralizer') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const neutralPotion: PotionItem = {
                        ...targetBottle,
                        type: 'water',
                        name: 'Брудна вода',
                        hpChange: -1,
                        color: 'text-yellow-600 bg-amber-950/30 border-yellow-700',
                        icon: '🤢',
                        description: '-1 HP брудна вода'
                    };
                    setPotions(prev => prev.map(p => p.id === targetBottle.id ? neutralPotion : p));
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, neutralizerUses: Math.max(0, (p.neutralizerUses ?? 3) - 1) };
                        }
                        return p;
                    });
                    const actionMsg = `🤢 Тактика: ${currentPart.avatar} ${currentPart.name} використав "Нейтралізатор" на пляшечку #${potions.indexOf(targetBottle) + 1} (-1 HP) та випив її безпечно!`;
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    handleDrinkPotion(targetBottle.id, currentPart, updatedList, true, neutralPotion);
                    return;
                }

                if (chosenTactic === 'distill') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const vodkaPotion: PotionItem = {
                        ...targetBottle,
                        type: 'vodka',
                        name: 'Горілка',
                        hpChange: 0,
                        color: 'text-slate-200 bg-slate-900/80 border-slate-400',
                        icon: '🍾',
                        description: '+1d10 до захмеленості'
                    };
                    setPotions(prev => prev.map(p => p.id === targetBottle.id ? vodkaPotion : p));
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, distillUses: Math.max(0, (p.distillUses ?? 2) - 1) };
                        }
                        return p;
                    });
                    const actionMsg = `🍾 Тактика: ${currentPart.avatar} ${currentPart.name} провів алхімічну "Перегонку", перетворив пляшечку #${potions.indexOf(targetBottle) + 1} на Горілку і випив залпом!`;
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    handleDrinkPotion(targetBottle.id, currentPart, updatedList, true, vodkaPotion);
                    return;
                }

                if (chosenTactic === 'mixPotions' && availablePotions.length >= 2) {
                    const b1 = availablePotions[0];
                    const b2 = availablePotions[1];
                    const combinedHp = Math.round((b1.hpChange + b2.hpChange) / 2);
                    const mixedBottle: PotionItem = {
                        id: b1.id,
                        type: combinedHp >= 0 ? 'healing' : 'medium_poison',
                        name: `Суміш (#${potions.indexOf(b1) + 1} + #${potions.indexOf(b2) + 1})`,
                        hpChange: combinedHp,
                        color: combinedHp >= 0 ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500' : 'text-purple-300 bg-purple-950/80 border-purple-500',
                        icon: '🧪✨',
                        description: `Змішані ${b1.name} та ${b2.name}`
                    };

                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, mixPotionsUses: Math.max(0, (p.mixPotionsUses ?? 3) - 1) };
                        }
                        return p;
                    });
                    setSelectedBottleIds(prev => [...prev, b1.id, b2.id]);
                    const actionMsg = `🧪 Тактика: ${currentPart.avatar} ${currentPart.name} змішав пляшечки #${potions.indexOf(b1) + 1} (${b1.name}) та #${potions.indexOf(b2) + 1} (${b2.name}) і випив суміш (${combinedHp >= 0 ? '+' : ''}${combinedHp} HP)!`;
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    handleDrinkPotion(b1.id, currentPart, updatedList, true, mixedBottle);
                    return;
                }

                if (chosenTactic === 'scan_choose') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, scanAndChooseUses: Math.max(0, (p.scanAndChooseUses ?? 2) - 1) };
                        }
                        return p;
                    });
                    const isGood = targetBottle.hpChange >= 0;
                    if (isGood) {
                        const actionMsg = `🔍 Скан & Вибір: ${currentPart.avatar} ${currentPart.name} просканував пляшечку #${potions.indexOf(targetBottle) + 1}, виявив корисне зілля "${targetBottle.name}" та випив його!`;
                        setLastActionText(actionMsg);
                        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                        handleDrinkPotion(targetBottle.id, currentPart, updatedList, true);
                    } else {
                        const actionMsg = `🔍 Скан & Вибір: ${currentPart.avatar} ${currentPart.name} просканував пляшечку #${potions.indexOf(targetBottle) + 1}, виявив небезпечне зілля "${targetBottle.name}" та вилив його геть!`;
                        setSelectedBottleIds(prev => [...prev, targetBottle.id]);
                        setParticipants(updatedList);
                        setLastActionText(actionMsg);
                        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                        advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length + 1, compressedRewards);
                    }
                    return;
                }

                if (chosenTactic === 'scan_discard') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, scanAndDiscardUses: Math.max(0, (p.scanAndDiscardUses ?? 3) - 1) };
                        }
                        return p;
                    });
                    const actionMsg = `🧪 Скан & Вилити: ${currentPart.avatar} ${currentPart.name} перевірив пляшечку #${potions.indexOf(targetBottle) + 1} (${targetBottle.name}) та вилив її у стік!`;
                    setSelectedBottleIds(prev => [...prev, targetBottle.id]);
                    setParticipants(updatedList);
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length + 1, compressedRewards);
                    return;
                }

                if (chosenTactic === 'discard_secret') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, discardSecretUses: Math.max(0, (p.discardSecretUses ?? 4) - 1) };
                        }
                        return p;
                    });
                    const actionMsg = `🗑️ Вилити наосліп: ${currentPart.avatar} ${currentPart.name} викинув пляшечку #${potions.indexOf(targetBottle) + 1} наосліп!`;
                    setSelectedBottleIds(prev => [...prev, targetBottle.id]);
                    setParticipants(updatedList);
                    setLastActionText(actionMsg);
                    setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                    advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length + 1, compressedRewards);
                    return;
                }

                if (chosenTactic === 'taster') {
                    const targetBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    const updatedList = baseList.map(p => {
                        if (p.id === currentPart.id) {
                            return { ...p, tasterUses: Math.max(0, (p.tasterUses ?? 3) - 1) };
                        }
                        return p;
                    });
                    const isGood = targetBottle.hpChange >= 0;
                    if (isGood) {
                        const actionMsg = `👅 Дегустатор: Дегустатор ${currentPart.name} спробував #${potions.indexOf(targetBottle) + 1} (${targetBottle.name}) і схвалив! ${currentPart.name} випив його!`;
                        setLastActionText(actionMsg);
                        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                        handleDrinkPotion(targetBottle.id, currentPart, updatedList, true);
                    } else {
                        const actionMsg = `👅 Дегустатор: Дегустатор ${currentPart.name} виявив отруйне зілля #${potions.indexOf(targetBottle) + 1} (${targetBottle.name})! Пляшку відставлено!`;
                        setSelectedBottleIds(prev => [...prev, targetBottle.id]);
                        setParticipants(updatedList);
                        setLastActionText(actionMsg);
                        setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                        advanceToNextTurn(updatedList, currentTurnIndex, selectedBottleIds.length + 1, compressedRewards);
                    }
                    return;
                }

                // Default: drink random available bottle
                if (availablePotions.length > 0) {
                    const randomBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
                    handleDrinkPotion(randomBottle.id, currentPart, baseList, true);
                } else {
                    advanceToNextTurn(baseList, currentTurnIndex, selectedBottleIds.length, compressedRewards);
                }
            }, delay);
        }

        return () => {
            if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
        };
    }, [currentTurnIndex, gameOver, isOpen, sleepDiceState, fastMode, givenPotionContext]);

    const currentTurnParticipant = participants[currentTurnIndex];
    const isPlayerTurn = currentTurnParticipant && currentTurnParticipant.isPlayer && !currentTurnParticipant.isEliminated && !gameOver && !sleepDiceState;
    const playerParticipant = participants.find(p => p.isPlayer);

    // Auto-switch mobile view to potions table when it is player's turn
    useEffect(() => {
        if (isPlayerTurn) {
            setActiveMobileTab('potions');
        }
    }, [isPlayerTurn]);

    // Automated forced drinking when spiker is an NPC
    useEffect(() => {
        if (!forcedDrinkState || forcedDrinkState.remaining <= 0 || gameOver || !isOpen || sleepDiceState) return;

        const isNpcSpiker = playerParticipant ? forcedDrinkState.spikerId !== playerParticipant.id : true;
        if (!isNpcSpiker) return;

        const delay = fastMode ? 150 : 650;
        const timer = setTimeout(() => {
            const currentPotions = potionsRef.current.length > 0 ? potionsRef.current : potions;
            const currentSelected = selectedBottleIdsRef.current;
            let availablePotions = currentPotions.filter(p => !currentSelected.includes(p.id));

            if (availablePotions.length === 0) {
                const refreshed = generateShuffledPotions(participantCount);
                setPotions(refreshed);
                potionsRef.current = refreshed;
                setSelectedBottleIds([]);
                selectedBottleIdsRef.current = [];
                availablePotions = refreshed;
            }

            const targetPart = participants.find(p => p.id === forcedDrinkState.targetId);
            if (!targetPart || targetPart.isEliminated) {
                setForcedDrinkState(null);
                return;
            }

            const chosenBottle = availablePotions[Math.floor(Math.random() * availablePotions.length)];
            const remainingAfter = forcedDrinkState.remaining - 1;

            if (remainingAfter <= 0) {
                setForcedDrinkState(null);
            } else {
                setForcedDrinkState({
                    ...forcedDrinkState,
                    remaining: remainingAfter
                });
            }

            const actionPrefix = forcedDrinkState.type === 'love'
                ? `💘 Примусове пиття (${forcedDrinkState.spikerName}): ${forcedDrinkState.spikerName} примушує ${targetPart.name} випити обрану пляшечку #${currentPotions.indexOf(chosenBottle) + 1} (${chosenBottle.name})! (Залишилося: ${remainingAfter} шт.)`
                : `🤝 Примусове пиття (${forcedDrinkState.spikerName}): ${forcedDrinkState.spikerName} примушує ${targetPart.name} випити обрану пляшечку #${currentPotions.indexOf(chosenBottle) + 1} (${chosenBottle.name})!`;

            setLastActionText(actionPrefix);
            setLog(prev => [actionPrefix, ...prev.slice(0, 35)]);
            handleDrinkPotion(chosenBottle.id, targetPart, undefined, true);
        }, delay);

        return () => clearTimeout(timer);
    }, [forcedDrinkState, gameOver, isOpen, sleepDiceState, fastMode, participantCount, participants, playerParticipant]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                className="relative w-full max-w-6xl bg-[#140e10] border-2 border-emerald-500/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7] my-auto max-h-[95vh]"
            >
                {/* Header */}
                <div className="bg-[#1c1216] border-b border-emerald-500/40 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="text-2xl p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40">
                            🧪
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-lg font-black font-serif text-emerald-200">
                                    Гра «Королівська рулетка зілля» ({participantCount} учасників)
                                </h2>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black flex items-center gap-1 shadow-sm">
                                    <span>💰 Банк:</span>
                                    <span className="text-yellow-300">{currentPrize} зол.</span>
                                </span>
                            </div>
                            <p className="text-[11px] text-emerald-400/80 mt-0.5">
                                Таверна «{tavernName}» • {potions.length} зілля на столі • Раунд {round} • Живих: {activeCount}/{participantCount}
                            </p>
                        </div>
                    </div>

                    {/* Participant count selector bar with scaled prizes */}
                    <div className="flex flex-wrap items-center gap-1 bg-black/50 p-1.5 rounded-xl border border-emerald-950">
                        <span className="text-[10px] text-emerald-400 font-bold px-1 uppercase tracking-wider">Гравців:</span>
                        {POTION_PARTICIPANT_OPTIONS.map(sz => {
                            const prize = getPotionRoulettePrize(sz);
                            const isSelected = participantCount === sz;
                            return (
                                <button
                                    key={sz}
                                    onClick={() => initGame(sz)}
                                    className={`px-2 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-stone-950 font-black shadow-md'
                                            : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800'
                                    }`}
                                    title={`${sz} учасників — виграш: ${prize} золота`}
                                >
                                    <span>{sz}</span>
                                    <span className={`text-[10px] px-1 py-0.2 rounded font-sans font-bold ${
                                        isSelected ? 'bg-black/30 text-stone-950' : 'text-amber-400/90'
                                    }`}>
                                        🪙{prize >= 1000 ? `${(prize / 1000).toFixed(1)}k` : prize}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-1.5 self-end md:self-auto">
                        <button
                            onClick={() => setFastMode(!fastMode)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                fastMode ? 'bg-amber-600 border-amber-400 text-black' : 'bg-stone-900 border-stone-800 text-stone-300'
                            }`}
                            title="Швидкий хід суперників"
                        >
                            <FastForward className="w-3.5 h-3.5" />
                            <span>Швидко</span>
                        </button>
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-emerald-400 hover:text-emerald-200 transition cursor-pointer"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-emerald-400 hover:text-emerald-200 transition cursor-pointer"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Rules Panel */}
                {showRules && (
                    <div className="p-3 bg-[#110b0d] border-b border-emerald-500/30 text-xs text-stone-300 space-y-1.5 max-h-56 overflow-y-auto">
                        <p className="font-bold text-emerald-300 flex items-center gap-1">
                            📜 Точні правила Рулетки зілля ({participantCount} учасників / {potions.length} зілля):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-stone-300 text-[11px]">
                            <div>
                                <p className="text-amber-300 font-bold mb-1">Основні зілля:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-stone-400">
                                    <li>🟢 10 легких ядів (<strong className="text-lime-400">-40 HP</strong>)</li>
                                    <li>🟣 5 середніх ядів (<strong className="text-purple-400">-60 HP</strong>)</li>
                                    <li>☠️ 3 тяжких яди (<strong className="text-red-400">-100 HP</strong>)</li>
                                    <li>💖 2 зілля зцілення (<strong className="text-rose-400">+20 HP</strong>)</li>
                                    <li>💧 2 чистої води (<strong className="text-sky-400">0 HP</strong>)</li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-emerald-300 font-bold mb-1">Спеціальні та магічні зілля (по 1 шт):</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-stone-400">
                                    <li>🛡️ <strong className="text-teal-300">Антидот</strong>: блокує яд у наступному ході (зникає після ураження)</li>
                                    <li>🧽 <strong className="text-stone-200">Сорбент</strong>: нейтралізує ДІЮ наступного випитого зілля</li>
                                    <li>⚡ <strong className="text-yellow-300">Каталізатор</strong>: подвоює (2x) яд або лікування в наступному ході</li>
                                    <li>❄️ <strong className="text-cyan-300">Інгібітор</strong>: послаблює у 2 рази (0.5x) яд або лікування</li>
                                    <li>🍵 <strong className="text-emerald-300">Мікстура</strong>: лікує +10 HP щоходу впродовж 3 ходів</li>
                                    <li>📦 <strong className="text-indigo-300">Зілля компресії</strong>: через 3 ходи стискає в іграшку (1d4). Переможець забрати фігури!</li>
                                    <li>🔓 <strong className="text-fuchsia-300">Зілля декомпресії</strong>: скасовує дію компресії</li>
                                    <li>💤 <strong className="text-purple-300">Зілля сну</strong>: кидок 5d20 (3 поразки ≤10 = засинаєш і вибуваєш)</li>
                                    <li>🐍 <strong className="text-amber-400">Повільний яд</strong>: -5 HP щоходу впродовж 3 ходів</li>
                                    <li>🧴 <strong className="text-amber-300">Розчинник (1 шт)</strong>: послаблює дію будь-якого випитого яду вдвічі</li>
                                    <li>💖 <strong className="text-rose-300">Створити зілля зцілення</strong>: змішує 3 зілля → миттєве лікування (+20 HP)</li>
                                    <li>🍵 <strong className="text-emerald-300">Створити мікстуру</strong>: змішує 3 зілля → регенерація (+10 HP/хід на 3 ходи)</li>
                                    <li>🛡️ <strong className="text-yellow-300">Створити зілля неушкодженності</strong>: змішує 4 зілля → 3 ходи жодне зілля не діє!</li>
                                    <li>🍀 <strong className="text-amber-300">Створити Зілля успіху</strong>: змішує 5 зіль → 1 хід будь-яке зілля перетворюється на лікування (+20 HP)</li>
                                    <li>🍀 <strong className="text-amber-300">Створити Тривале зілля успіху</strong>: змішує 6 зіль → 3 ходи будь-яке зілля перетворюється на лікування (+20 HP)</li>
                                    <li>🍀 <strong className="text-amber-300">Створити Довготривале зілля успіху</strong>: змішує 8 зіль → 5 ходів будь-яке зілля перетворюється на лікування (+20 HP)</li>
                                    <li>💨 <strong className="text-cyan-300">Збігати до вітру</strong>: знімає абсолютно всі ефекти та пропускає 3 повних кола ходів</li>
                                    <li>💘 <strong className="text-pink-300">Підмішати любовне зілля</strong>: обране зілля стає любовним → випивший закохується, здається та вступає у ваш загін</li>
                                    <li>🤝 <strong className="text-amber-300">Підмішати зілля дружби</strong>: обране зілля стає зіллям дружби → випивший стає вірним другом, здається та вступає у ваш загін</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hero Status Bar */}
                <div className="bg-[#170e12] border-b border-stone-800 p-2.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">🧙‍♂️</div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-300 text-sm">Ваш стан (Герой)</span>
                                {playerParticipant?.isEliminated && (
                                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold">
                                        💀 ВИБУВ
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-36 sm:w-48 h-3.5 bg-stone-900 rounded-full border border-stone-700 overflow-hidden relative">
                                    <div 
                                        className={`h-full transition-all duration-300 ${
                                            (playerParticipant?.hp || 0) > 60 
                                                ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                                                : (playerParticipant?.hp || 0) > 30 
                                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                                                : 'bg-gradient-to-r from-red-600 to-rose-500'
                                        }`}
                                        style={{ width: `${Math.max(0, playerParticipant?.hp || 0)}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow">
                                        {playerParticipant?.hp || 0} / 100 HP
                                    </span>
                                </div>

                                {/* Status indicators for player */}
                                <div className="flex items-center gap-1 text-[10px] flex-wrap">
                                    {playerParticipant?.hasAntidote && <span className="px-1.5 py-0.5 bg-teal-950 border border-teal-500 rounded text-teal-300 font-bold" title="Антидот активний">🛡️ Антидот</span>}
                                    {playerParticipant?.hasSorbent && <span className="px-1.5 py-0.5 bg-stone-900 border border-stone-500 rounded text-stone-200 font-bold" title="Сорбент активний">🧽 Сорбент</span>}
                                    {playerParticipant?.hasSnakeEaterActive && <span className="px-1.5 py-0.5 bg-green-950 border border-green-500 rounded text-green-300 font-bold animate-pulse" title="Поїдач змій активний">🐍 Поїдач змій</span>}
                                    {playerParticipant?.hasPoisonResistActive && <span className="px-1.5 py-0.5 bg-purple-950 border border-purple-500 rounded text-purple-300 font-bold animate-pulse" title="Стійкість до яду активна">🛡️ Стійкість</span>}
                                    {(playerParticipant?.catalystMultiplier || 1) > 1 && <span className="px-1.5 py-0.5 bg-yellow-950 border border-yellow-500 rounded text-yellow-300 font-bold">⚡ 2x</span>}
                                    {(playerParticipant?.inhibitorMultiplier || 1) < 1 && <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500 rounded text-cyan-300 font-bold">❄️ 0.5x</span>}
                                    {(playerParticipant?.mixtureTurns || 0) > 0 && <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 rounded text-emerald-300 font-bold">🍵 +10HP ({playerParticipant?.mixtureTurns})</span>}
                                    {(playerParticipant?.slowPoisonTurns || 0) > 0 && <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-500 rounded text-amber-300 font-bold">🐍 -5HP ({playerParticipant?.slowPoisonTurns})</span>}
                                    {(playerParticipant?.compressionCountdown || 0) > 0 && <span className="px-1.5 py-0.5 bg-indigo-950 border border-indigo-500 rounded text-indigo-300 font-bold animate-pulse">📦 Стиснення ({playerParticipant?.compressionCountdown})</span>}
                                    {(playerParticipant?.invulnerabilityTurns || 0) > 0 && <span className="px-1.5 py-0.5 bg-yellow-950 border border-yellow-400 rounded text-yellow-200 font-bold animate-pulse">🛡️✨ Неушкодженість ({playerParticipant?.invulnerabilityTurns})</span>}
                                    {(playerParticipant?.natureBreakRounds || 0) > 0 && <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-400 rounded text-cyan-200 font-bold animate-pulse">💨 До вітру ({playerParticipant?.natureBreakRounds} к.)</span>}
                                    {playerParticipant?.isVigorous && <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-500 rounded text-amber-300 font-bold">⚡ Бадьорий</span>}
                                    {(playerParticipant?.drunkenness || 0) > 0 && <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-500 rounded text-slate-200 font-bold">🍺 Сп'яніння ({playerParticipant?.drunkenness}%)</span>}
                                    {playerParticipant?.hasPermanganate && <span className="px-1.5 py-0.5 bg-pink-950 border border-pink-500 rounded text-pink-300 font-bold">🧼 Очищення</span>}
                                    {(playerParticipant?.hasFortune || (playerParticipant?.fortuneTurns || 0) > 0) && <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-500 rounded text-amber-300 font-bold">🍀 Успіх {(playerParticipant?.fortuneTurns || 0) > 0 ? `(${playerParticipant?.fortuneTurns} х.)` : ''}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Turn announcer badge */}
                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                            isPlayerTurn 
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse' 
                                : 'bg-stone-900 border-stone-800 text-stone-300'
                        }`}>
                            <span>Хід:</span>
                            <span className="text-base">{currentTurnParticipant?.avatar}</span>
                            <span className="font-black text-amber-200">
                                {isPlayerTurn ? 'ВАШ ХІД! Оберіть зілля!' : `${currentTurnParticipant?.name || '...'} обирає`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Tabs (visible on mobile / tablets) */}
                <div className="flex lg:hidden items-center justify-around bg-[#140b10] border-b border-stone-850 p-1.5 gap-1 shrink-0">
                    <button
                        onClick={() => setActiveMobileTab('potions')}
                        className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                            activeMobileTab === 'potions'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-sm'
                                : 'text-stone-400 hover:text-stone-200 bg-stone-900/40 border border-stone-800/40'
                        }`}
                    >
                        <span>🧪 Стіл</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-stone-900 border border-stone-700 rounded-full">
                            {31 - selectedBottleIds.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveMobileTab('participants')}
                        className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                            activeMobileTab === 'participants'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-sm'
                                : 'text-stone-400 hover:text-stone-200 bg-stone-900/40 border border-stone-800/40'
                        }`}
                    >
                        <span>👥 Гравці</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-stone-900 border border-stone-700 rounded-full">
                            {activeCount}/{participants.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveMobileTab('log')}
                        className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                            activeMobileTab === 'log'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-sm'
                                : 'text-stone-400 hover:text-stone-200 bg-stone-900/40 border border-stone-800/40'
                        }`}
                    >
                        <span>📜 Журнал</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-stone-900 border border-stone-700 rounded-full">
                            {log.length}
                        </span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3 flex-1 overflow-y-auto overscroll-contain custom-scrollbar min-h-0">
                    {/* Left 2 Cols: Table with 31 Potions (Visible on desktop or when mobile tab is 'potions') */}
                    <div className={`lg:col-span-2 flex flex-col gap-2 min-h-0 ${
                        activeMobileTab === 'potions' ? 'flex' : 'hidden lg:flex'
                    }`}>
                        <div className="w-full flex items-center justify-between mb-0.5 shrink-0">
                            <span className="text-xs font-bold text-stone-400">
                                Стіл із зіллями (Залишилось: {potions.length - selectedBottleIds.length} / {potions.length}):
                            </span>
                            {isPlayerTurn && (
                                <span className="text-xs font-black text-amber-400 animate-bounce">
                                    👇 Натисніть на будь-яку пляшку!
                                </span>
                            )}
                        </div>

                        {/* Special Tactics Bar with Collapse/Expand */}
                        <div className="w-full bg-[#160e11] border border-amber-950/40 p-2 rounded-xl shrink-0">
                            <div className="flex items-center justify-between px-1">
                                <button
                                    onClick={() => setIsTacticsExpanded(!isTacticsExpanded)}
                                    className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 hover:text-amber-200 transition cursor-pointer"
                                >
                                    <span>🔮 Тактичний арсенал ({isTacticsExpanded ? '26 дій' : 'натисніть щоб відкрити'})</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
                                        {isTacticsExpanded ? '▲ Згорнути' : '▼ Розгорнути'}
                                    </span>
                                </button>
                                {selectedTactic && (
                                    <span className="text-[9px] text-amber-300 font-bold animate-pulse">
                                        ✨ Активна тактика: {selectedTactic}! Оберіть пляшечку!
                                    </span>
                                )}
                            </div>
                            {isTacticsExpanded && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-1.5 mt-1.5">
                                {/* 1. Sorbent (1 use) */}
                                <button
                                    onClick={() => handleToggleSorbent()}
                                    disabled={!isPlayerTurn || (playerParticipant?.sorbentUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        playerParticipant?.hasSorbentActive
                                            ? 'bg-amber-500/30 border-amber-400 text-amber-200 ring-2 ring-amber-400/70 scale-105 animate-pulse'
                                            : (playerParticipant?.sorbentUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-500 hover:text-amber-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🧽 Сорбент</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${playerParticipant?.hasSorbentActive ? 'bg-amber-400 text-stone-950' : 'bg-amber-950 text-amber-300'}`}>
                                            {playerParticipant?.sorbentUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {playerParticipant?.hasSorbentActive ? 'АКТИВОВАНО: захист діє!' : 'Прийняти перед тим як пити'}
                                    </span>
                                </button>

                                {/* 1a. Snake Eater (1 use) */}
                                <button
                                    onClick={() => handleToggleSnakeEater()}
                                    disabled={!isPlayerTurn || (playerParticipant?.snakeEaterUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        playerParticipant?.hasSnakeEaterActive
                                            ? 'bg-green-500/30 border-green-400 text-green-200 ring-2 ring-green-400/70 scale-105 animate-pulse'
                                            : (playerParticipant?.snakeEaterUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-green-500 hover:text-green-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🐍 Поїдач змій</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${playerParticipant?.hasSnakeEaterActive ? 'bg-green-400 text-stone-950' : 'bg-green-950 text-green-300'}`}>
                                            {playerParticipant?.snakeEaterUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {playerParticipant?.hasSnakeEaterActive ? 'АКТИВОВАНО: яд лікує +20 HP!' : 'Яд не завдає шкоди, а лікує +20 HP'}
                                    </span>
                                </button>

                                {/* 1b. Poison Resistance (1 use) */}
                                <button
                                    onClick={() => handleTogglePoisonResist()}
                                    disabled={!isPlayerTurn || (playerParticipant?.poisonResistUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        playerParticipant?.hasPoisonResistActive
                                            ? 'bg-purple-500/30 border-purple-400 text-purple-200 ring-2 ring-purple-400/70 scale-105 animate-pulse'
                                            : (playerParticipant?.poisonResistUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-purple-500 hover:text-purple-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🛡️ Стійкість яду</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${playerParticipant?.hasPoisonResistActive ? 'bg-purple-400 text-stone-950' : 'bg-purple-950 text-purple-300'}`}>
                                            {playerParticipant?.poisonResistUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {playerParticipant?.hasPoisonResistActive ? 'АКТИВОВАНО: захист діє!' : 'Випитий яд не наносить пошкоджень'}
                                    </span>
                                </button>

                                {/* 1c. Vomit Drug (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'vomitDrug' ? null : 'vomitDrug');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.vomitDrugUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'vomitDrug'
                                            ? 'bg-pink-500/20 border-pink-400 text-pink-200 ring-2 ring-pink-400/50 scale-105'
                                            : (playerParticipant?.vomitDrugUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-pink-500 hover:text-pink-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🧼 Блювотне</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'vomitDrug' ? 'bg-pink-400 text-stone-950' : 'bg-pink-950 text-pink-300'}`}>
                                            {playerParticipant?.vomitDrugUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Перетворити зілля на Марганцівку
                                    </span>
                                </button>

                                {/* 2. Mix Potions (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'mixPotions' ? null : 'mixPotions');
                                        setMixPotionsFirstBottle(null);
                                        setCraftingSelectedBottles([]);
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.mixPotionsUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'mixPotions'
                                            ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200 ring-2 ring-fuchsia-400/50 scale-105'
                                            : (playerParticipant?.mixPotionsUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-fuchsia-500 hover:text-fuchsia-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🧪 Змішування</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'mixPotions' ? 'bg-fuchsia-400 text-stone-950' : 'bg-fuchsia-950 text-fuchsia-300'}`}>
                                            {playerParticipant?.mixPotionsUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {mixPotionsFirstBottle ? `1-ше (#${potions.indexOf(mixPotionsFirstBottle) + 1}) обрано! Тисніть 2-ге!` : 'Обрати 2 пляшки та змішати'}
                                    </span>
                                </button>

                                {/* 2a. Craft Healing Potion (3 bottles) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'craft_healing' ? null : 'craft_healing');
                                        setCraftingSelectedBottles([]);
                                        setMixPotionsFirstBottle(null);
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.craftHealingUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'craft_healing'
                                            ? 'bg-rose-500/20 border-rose-400 text-rose-200 ring-2 ring-rose-400/50 scale-105'
                                            : (playerParticipant?.craftHealingUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-rose-500 hover:text-rose-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>💖 Зілля зцілення</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'craft_healing' ? 'bg-rose-400 text-stone-950' : 'bg-rose-950 text-rose-300'}`}>
                                            {playerParticipant?.craftHealingUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {selectedTactic === 'craft_healing'
                                            ? `Обрано ${craftingSelectedBottles.length}/3 пляшок`
                                            : 'Змішує 3 зілля → випити зцілення (+20 HP)'}
                                    </span>
                                </button>

                                {/* 2b. Craft Mixture (3 bottles) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'craft_mixture' ? null : 'craft_mixture');
                                        setCraftingSelectedBottles([]);
                                        setMixPotionsFirstBottle(null);
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.craftMixtureUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'craft_mixture'
                                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 scale-105'
                                            : (playerParticipant?.craftMixtureUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-emerald-500 hover:text-emerald-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🍵 Мікстура</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'craft_mixture' ? 'bg-emerald-400 text-stone-950' : 'bg-emerald-950 text-emerald-300'}`}>
                                            {playerParticipant?.craftMixtureUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {selectedTactic === 'craft_mixture'
                                            ? `Обрано ${craftingSelectedBottles.length}/3 пляшок`
                                            : 'Змішує 3 зілля → випити мікстуру (+10 HP/хід)'}
                                    </span>
                                </button>

                                {/* 2c. Craft Invulnerability (4 bottles) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'craft_invulnerability' ? null : 'craft_invulnerability');
                                        setCraftingSelectedBottles([]);
                                        setMixPotionsFirstBottle(null);
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.craftInvulnerabilityUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'craft_invulnerability'
                                            ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200 ring-2 ring-yellow-400/50 scale-105'
                                            : (playerParticipant?.craftInvulnerabilityUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-yellow-400 hover:text-yellow-200 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🛡️ Неушкодженість</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'craft_invulnerability' ? 'bg-yellow-400 text-stone-950' : 'bg-yellow-950 text-yellow-300'}`}>
                                            {playerParticipant?.craftInvulnerabilityUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {selectedTactic === 'craft_invulnerability'
                                            ? `Обрано ${craftingSelectedBottles.length}/4 пляшок`
                                            : 'Змішує 4 зілля → 3 ходи жодне зілля не діє!'}
                                    </span>
                                </button>

                                {/* 2e. Craft Fortune (5 bottles) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'craft_fortune' ? null : 'craft_fortune');
                                        setCraftingSelectedBottles([]);
                                        setMixPotionsFirstBottle(null);
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.craftFortuneUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'craft_fortune'
                                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105'
                                            : (playerParticipant?.craftFortuneUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-400 hover:text-amber-200 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🍀 Успіх (5)</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'craft_fortune' ? 'bg-amber-400 text-stone-950' : 'bg-amber-950 text-amber-300'}`}>
                                            {playerParticipant?.craftFortuneUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {selectedTactic === 'craft_fortune'
                                            ? `Обрано ${craftingSelectedBottles.length}/5 пляшок`
                                            : 'Змішує 5 зіль → Зілля успіху (1 хід)'}
                                    </span>
                                </button>

                                {/* 2f. Craft Duration Fortune (6 bottles) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'craft_fortune_3' ? null : 'craft_fortune_3');
                                        setCraftingSelectedBottles([]);
                                        setMixPotionsFirstBottle(null);
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.craftFortune3Uses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'craft_fortune_3'
                                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105'
                                            : (playerParticipant?.craftFortune3Uses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-400 hover:text-amber-200 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🍀 Тривалий Успіх (6)</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'craft_fortune_3' ? 'bg-amber-400 text-stone-950' : 'bg-amber-950 text-amber-300'}`}>
                                            {playerParticipant?.craftFortune3Uses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {selectedTactic === 'craft_fortune_3'
                                            ? `Обрано ${craftingSelectedBottles.length}/6 пляшок`
                                            : 'Змішує 6 зіль → Успіх (3 ходи)'}
                                    </span>
                                </button>

                                {/* 2g. Craft Long Fortune (8 bottles) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'craft_fortune_5' ? null : 'craft_fortune_5');
                                        setCraftingSelectedBottles([]);
                                        setMixPotionsFirstBottle(null);
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.craftFortune5Uses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'craft_fortune_5'
                                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105'
                                            : (playerParticipant?.craftFortune5Uses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-400 hover:text-amber-200 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🍀 Довготривалий Успіх (8)</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'craft_fortune_5' ? 'bg-amber-400 text-stone-950' : 'bg-amber-950 text-amber-300'}`}>
                                            {playerParticipant?.craftFortune5Uses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {selectedTactic === 'craft_fortune_5'
                                            ? `Обрано ${craftingSelectedBottles.length}/8 пляшок`
                                            : 'Змішує 8 зіль → Успіх (5 ходів)'}
                                    </span>
                                </button>

                                {/* 2d. Nature Break (Збігати до вітру) */}
                                <button
                                    onClick={() => handleNatureBreak()}
                                    disabled={!isPlayerTurn || (playerParticipant?.natureBreakUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        (playerParticipant?.natureBreakUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-cyan-300 hover:border-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/30 cursor-pointer shadow-sm'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>💨 До вітру</span>
                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-cyan-950 text-cyan-300">
                                            {playerParticipant?.natureBreakUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Зняти всі ефекти та пропуск 3 кіл
                                    </span>
                                </button>

                                {/* 4. Flush Table (1 use) */}
                                <button
                                    onClick={() => handleFlushTable()}
                                    disabled={!isPlayerTurn || (playerParticipant?.flushTableUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        (playerParticipant?.flushTableUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-red-500 hover:text-red-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🚽 Вилити стіл</span>
                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-red-950 text-red-300">
                                            {playerParticipant?.flushTableUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Оновити всі зілля на столі
                                    </span>
                                </button>

                                {/* 5. Solvent (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setParticipants(prev => prev.map(p => {
                                            if (p.isPlayer) {
                                                return {
                                                    ...p,
                                                    hasSolventActive: !p.hasSolventActive
                                                };
                                            }
                                            return p;
                                        }));
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.solventUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        playerParticipant?.hasSolventActive
                                            ? 'bg-amber-600/30 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105 animate-pulse'
                                            : (playerParticipant?.solventUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-500 hover:text-amber-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🧴 Розчинник</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${playerParticipant?.hasSolventActive ? 'bg-amber-400 text-stone-950' : 'bg-amber-950 text-amber-300'}`}>
                                            {playerParticipant?.solventUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Зменшує шкоду отрути вдвічі
                                    </span>
                                </button>

                                 {/* 7. Scan & Choose (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'scan_choose' ? null : 'scan_choose');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.scanAndChooseUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'scan_choose'
                                            ? 'bg-purple-500/20 border-purple-400 text-purple-200 ring-2 ring-purple-400/50 scale-105'
                                            : (playerParticipant?.scanAndChooseUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-purple-500 hover:text-purple-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🔍 Скан&Вибір</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'scan_choose' ? 'bg-purple-400 text-stone-950' : 'bg-purple-950 text-purple-300'}`}>
                                            {playerParticipant?.scanAndChooseUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Показати вміст перед питтям
                                    </span>
                                </button>

                                {/* 8. Scan & Discard (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'scan_discard' ? null : 'scan_discard');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.scanAndDiscardUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'scan_discard'
                                            ? 'bg-rose-500/20 border-rose-400 text-rose-200 ring-2 ring-rose-400/50 scale-105'
                                            : (playerParticipant?.scanAndDiscardUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-rose-500 hover:text-rose-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🧪 Скан&Вилити</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'scan_discard' ? 'bg-rose-400 text-stone-950' : 'bg-rose-950 text-rose-300'}`}>
                                            {playerParticipant?.scanAndDiscardUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Дізнатися вміст і вилити
                                    </span>
                                </button>

                                {/* 9. Discard Secret (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'discard_secret' ? null : 'discard_secret');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.discardSecretUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'discard_secret'
                                            ? 'bg-stone-500/20 border-stone-400 text-stone-200 ring-2 ring-stone-400/50 scale-105'
                                            : (playerParticipant?.discardSecretUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-500 hover:text-stone-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🗑️ Наосліп</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'discard_secret' ? 'bg-stone-400 text-stone-950' : 'bg-stone-900 text-stone-400'}`}>
                                            {playerParticipant?.discardSecretUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Викинути зілля наосліп
                                    </span>
                                </button>

                                {/* 10. Distill (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'distill' ? null : 'distill');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.distillUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'distill'
                                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105'
                                            : (playerParticipant?.distillUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-500 hover:text-amber-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🍾 Перегонка</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'distill' ? 'bg-amber-400 text-stone-950' : 'bg-amber-950 text-amber-300'}`}>
                                            {playerParticipant?.distillUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Зілля стає горілкою
                                    </span>
                                </button>

                                {/* 11. Miracle (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'miracle' ? null : 'miracle');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.miracleUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'miracle'
                                            ? 'bg-rose-500/20 border-rose-400 text-rose-200 ring-2 ring-rose-400/50 scale-105'
                                            : (playerParticipant?.miracleUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-rose-500 hover:text-rose-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>💖 Чудо-діжка</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'miracle' ? 'bg-rose-400 text-stone-950' : 'bg-[#4c0519] text-rose-300'}`}>
                                            {playerParticipant?.miracleUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Стає лікуванням (+20 HP)
                                    </span>
                                </button>

                                 {/* 13. Taster (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'taster' ? null : 'taster');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.tasterUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'taster'
                                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 scale-105'
                                            : (playerParticipant?.tasterUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-emerald-500 hover:text-emerald-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>👅 Дегустатор</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'taster' ? 'bg-emerald-400 text-stone-950' : 'bg-emerald-950 text-emerald-300'}`}>
                                            {playerParticipant?.tasterUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Дегустує зілля за вас
                                    </span>
                                </button>

                                {/* 14. Neutralizer (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'neutralizer' ? null : 'neutralizer');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.neutralizerUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'neutralizer'
                                            ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200 ring-2 ring-yellow-400/50 scale-105'
                                            : (playerParticipant?.neutralizerUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-yellow-500 hover:text-yellow-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🤢 Нейтралізатор</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'neutralizer' ? 'bg-yellow-400 text-stone-950' : 'bg-yellow-950 text-yellow-300'}`}>
                                            {playerParticipant?.neutralizerUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Стає брудною водою (-1 HP)
                                    </span>
                                </button>

                                {/* 15. Filter (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'filter' ? null : 'filter');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.filterUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'filter'
                                            ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-2 ring-sky-400/50 scale-105'
                                            : (playerParticipant?.filterUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-sky-500 hover:text-sky-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>💧 Фільтр</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'filter' ? 'bg-sky-400 text-stone-950' : 'bg-[#082f49] text-sky-300'}`}>
                                            {playerParticipant?.filterUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Стає чистою водою (0 HP)
                                    </span>
                                </button>

                                {/* 16. Skip Turn (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'skipTurn' ? null : 'skipTurn');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.skipTurnUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'skipTurn'
                                            ? 'bg-slate-500/20 border-slate-400 text-slate-200 ring-2 ring-slate-400/50 scale-105'
                                            : (playerParticipant?.skipTurnUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-slate-500 hover:text-slate-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>⏭️ Пропуск</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'skipTurn' ? 'bg-slate-400 text-stone-950' : 'bg-slate-950 text-slate-300'}`}>
                                            {playerParticipant?.skipTurnUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Пропустити хід
                                    </span>
                                </button>

                                {/* 17. Alarm Clock / Wake Up (1 use) */}
                                <button
                                    onClick={() => {
                                        const sleepers = participants.filter(p => p.isAsleep);
                                        if (sleepers.length === 0) {
                                            setLastActionText("Немає заснулих учасників для пробудження!");
                                            return;
                                        }
                                        setSelectedTactic(selectedTactic === 'wake_up' ? null : 'wake_up');
                                    }}
                                    disabled={(playerParticipant?.wakeUpUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'wake_up'
                                            ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 ring-2 ring-indigo-400/50 scale-105'
                                            : (playerParticipant?.wakeUpUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-indigo-500 hover:text-indigo-300 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>⏰ Будильник</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'wake_up' ? 'bg-indigo-400 text-stone-950' : 'bg-indigo-950 text-indigo-300'}`}>
                                            {playerParticipant?.wakeUpUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Розбудити когось
                                    </span>
                                </button>

                                {/* 18. Spike Love Potion (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'spike_love' ? null : 'spike_love');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.spikeLoveUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'spike_love'
                                            ? 'bg-pink-500/20 border-pink-400 text-pink-200 ring-2 ring-pink-400/50 scale-105'
                                            : (playerParticipant?.spikeLoveUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-pink-500 hover:text-pink-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>💘 Любовне</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'spike_love' ? 'bg-pink-400 text-stone-950' : 'bg-pink-950 text-pink-300'}`}>
                                            {playerParticipant?.spikeLoveUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        П'є наступні 3 зілля
                                    </span>
                                </button>

                                {/* 19. Spike Friendship Potion (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'spike_friendship' ? null : 'spike_friendship');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.spikeFriendshipUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'spike_friendship'
                                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105'
                                            : (playerParticipant?.spikeFriendshipUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-500 hover:text-amber-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🤝 Дружба</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'spike_friendship' ? 'bg-amber-400 text-stone-950' : 'bg-amber-950 text-amber-300'}`}>
                                            {playerParticipant?.spikeFriendshipUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        П'є наступне 1 зілля
                                    </span>
                                </button>

                                {/* 20. Spike Sleep Potion (1 use) */}
                                <button
                                    onClick={() => {
                                        if (!isPlayerTurn) return;
                                        setSelectedTactic(selectedTactic === 'spike_sleep' ? null : 'spike_sleep');
                                    }}
                                    disabled={!isPlayerTurn || (playerParticipant?.spikeSleepUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        selectedTactic === 'spike_sleep'
                                            ? 'bg-purple-500/20 border-purple-400 text-purple-200 ring-2 ring-purple-400/50 scale-105'
                                            : (playerParticipant?.spikeSleepUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-purple-500 hover:text-purple-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>💤 Сонне</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${selectedTactic === 'spike_sleep' ? 'bg-purple-400 text-stone-950' : 'bg-purple-950 text-purple-300'}`}>
                                            {playerParticipant?.spikeSleepUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Підмішати Зілля сну (5d20)
                                    </span>
                                </button>

                                {/* 21. Highlight Healing */}
                                <button
                                    onClick={() => handleToggleHighlightHealing()}
                                    disabled={!isPlayerTurn || (playerParticipant?.highlightHealingUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        revealedHealing
                                            ? 'bg-rose-500/30 border-rose-400 text-rose-200 ring-2 ring-rose-400/70 scale-105 animate-pulse'
                                            : (playerParticipant?.highlightHealingUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-rose-500 hover:text-rose-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>💖 Зцілення</span>
                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-rose-950 text-rose-300">
                                            {playerParticipant?.highlightHealingUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {revealedHealing ? 'АКТИВНО: сяють!' : 'Підсвітити зцілення'}
                                    </span>
                                </button>

                                {/* 22. Highlight Mixture */}
                                <button
                                    onClick={() => handleToggleHighlightMixture()}
                                    disabled={!isPlayerTurn || (playerParticipant?.highlightMixtureUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        revealedMixture
                                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/70 scale-105 animate-pulse'
                                            : (playerParticipant?.highlightMixtureUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-emerald-500 hover:text-emerald-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🍵 Мікстури</span>
                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-emerald-950 text-emerald-300">
                                            {playerParticipant?.highlightMixtureUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {revealedMixture ? 'АКТИВНО: сяють!' : 'Підсвітити мікстури'}
                                    </span>
                                </button>

                                {/* 23. Highlight Poisons */}
                                <button
                                    onClick={() => handleToggleHighlightPoisons()}
                                    disabled={!isPlayerTurn || (playerParticipant?.highlightPoisonsUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        revealedPoisons
                                            ? 'bg-purple-500/30 border-purple-400 text-purple-200 ring-2 ring-purple-400/70 scale-105 animate-pulse'
                                            : (playerParticipant?.highlightPoisonsUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-purple-500 hover:text-purple-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>☠️ Яди</span>
                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-purple-950 text-purple-300">
                                            {playerParticipant?.highlightPoisonsUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        {revealedPoisons ? 'АКТИВНО: сяють!' : 'Підсвітити всі яди'}
                                    </span>
                                </button>

                                {/* 24. Neutralize All Poisons */}
                                <button
                                    onClick={() => handleNeutralizeAllPoisons()}
                                    disabled={!isPlayerTurn || (playerParticipant?.neutralizeAllPoisonsUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        (playerParticipant?.neutralizeAllPoisonsUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-sky-300 hover:border-sky-400 hover:text-sky-200 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>💧 Знешкодити яди</span>
                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-sky-950 text-sky-300">
                                            {playerParticipant?.neutralizeAllPoisonsUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Всі яди в воду (0 HP)
                                    </span>
                                </button>

                                {/* 25. Weaken All Poisons */}
                                <button
                                    onClick={() => handleWeakenAllPoisons()}
                                    disabled={!isPlayerTurn || (playerParticipant?.weakenAllPoisonsUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        (playerParticipant?.weakenAllPoisonsUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-lime-300 hover:border-lime-400 hover:text-lime-200 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🧪 Ослабити яди</span>
                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-lime-950 text-lime-300">
                                            {playerParticipant?.weakenAllPoisonsUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Всі яди наносять -5 HP
                                    </span>
                                </button>

                                {/* 26. Poison to Mixture */}
                                <button
                                    onClick={() => handleTogglePoisonToMixture()}
                                    disabled={!isPlayerTurn || (playerParticipant?.poisonToMixtureUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        playerParticipant?.hasPoisonToMixtureActive
                                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/70 scale-105 animate-pulse'
                                            : (playerParticipant?.poisonToMixtureUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-emerald-500 hover:text-emerald-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🍵 Яд в мікстуру</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${playerParticipant?.hasPoisonToMixtureActive ? 'bg-emerald-400 text-stone-950' : 'bg-emerald-950 text-emerald-300'}`}>
                                            {playerParticipant?.poisonToMixtureUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Наступний яд стане мікстурою
                                    </span>
                                </button>

                                {/* 27. Poison to Water */}
                                <button
                                    onClick={() => handleTogglePoisonToWater()}
                                    disabled={!isPlayerTurn || (playerParticipant?.poisonToWaterUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        playerParticipant?.hasPoisonToWaterActive
                                            ? 'bg-sky-500/30 border-sky-400 text-sky-200 ring-2 ring-sky-400/70 scale-105 animate-pulse'
                                            : (playerParticipant?.poisonToWaterUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-sky-500 hover:text-sky-300 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>💧 Яд в воду</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${playerParticipant?.hasPoisonToWaterActive ? 'bg-sky-400 text-stone-950' : 'bg-sky-950 text-sky-300'}`}>
                                            {playerParticipant?.poisonToWaterUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Наступний яд стане чистою водою
                                    </span>
                                </button>

                                {/* 28. Poison to Sorbent */}
                                <button
                                    onClick={() => handleTogglePoisonToSorbent()}
                                    disabled={!isPlayerTurn || (playerParticipant?.poisonToSorbentUses || 0) <= 0}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold text-center flex flex-col justify-between transition-all relative select-none ${
                                        playerParticipant?.hasPoisonToSorbentActive
                                            ? 'bg-stone-500/30 border-stone-300 text-stone-100 ring-2 ring-stone-300/70 scale-105 animate-pulse'
                                            : (playerParticipant?.poisonToSorbentUses || 0) <= 0
                                            ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                            : isPlayerTurn
                                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-400 hover:text-stone-200 cursor-pointer'
                                            : 'bg-stone-950/50 border-stone-900 text-stone-500 cursor-default'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>🧽 Яд в сорбент</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black ${playerParticipant?.hasPoisonToSorbentActive ? 'bg-stone-300 text-stone-950' : 'bg-stone-900 text-stone-300'}`}>
                                            {playerParticipant?.poisonToSorbentUses ?? 1}/1
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-left text-stone-400 mt-0.5 leading-tight font-normal">
                                        Наступний яд стане сорбентом
                                    </span>
                                </button>
                            </div>
                            )}
                        </div>

                        {/* Forced Drink State Banner */}
                        {forcedDrinkState && forcedDrinkState.remaining > 0 && (
                            <div className="w-full p-2.5 rounded-xl bg-gradient-to-r from-pink-950 via-purple-950 to-amber-950 border-2 border-pink-500/80 text-xs font-bold text-center shadow-lg animate-pulse flex items-center justify-between shrink-0 my-1">
                                <span className="flex items-center gap-2">
                                    <span className="text-xl">{forcedDrinkState.type === 'love' ? '💘' : '🤝'}</span>
                                    <span>
                                        Примусове пиття від <strong className="text-pink-300 font-black">{forcedDrinkState.spikerName}</strong> для <strong className="text-amber-200">{forcedDrinkState.targetAvatar} {forcedDrinkState.targetName}</strong>! 
                                        {forcedDrinkState.spikerId === playerParticipant?.id 
                                            ? ` Оберіть зілля на столі (Залишилося обрати: ${forcedDrinkState.remaining} шт.)`
                                            : ` ${forcedDrinkState.spikerName} обирає зілля для примусового пиття (Залишилось: ${forcedDrinkState.remaining} шт.)...`}
                                    </span>
                                </span>
                            </div>
                        )}

                        {/* Potions Grid (31 bottles) */}
                        <div className="w-full bg-[#100a0d] border border-stone-800 rounded-2xl p-3 shadow-inner grid grid-cols-6 sm:grid-cols-8 md:grid-cols-9 gap-2 justify-items-center max-h-[360px] sm:max-h-[420px] lg:max-h-[480px] overflow-y-auto overscroll-contain custom-scrollbar touch-pan-y min-h-[220px]">
                            {potions.map((potion, idx) => {
                                const isTaken = selectedBottleIds.includes(potion.id);
                                const isFirstMixSelected = mixPotionsFirstBottle?.id === potion.id;
                                const craftIndex = craftingSelectedBottles.findIndex(b => b.id === potion.id);
                                const isCraftSelected = craftIndex !== -1;

                                const isPoisonType = ['light_poison', 'medium_poison', 'heavy_poison', 'slow_poison', 'poison'].includes(potion.type);
                                const isHealingType = potion.type === 'healing';
                                const isMixtureType = potion.type === 'mixture';

                                const isHighlightedHealing = revealedHealing && isHealingType;
                                const isHighlightedMixture = revealedMixture && isMixtureType;
                                const isHighlightedPoison = revealedPoisons && isPoisonType;

                                const canClick = (isPlayerTurn || !!forcedDrinkState) && !isTaken;

                                return (
                                    <button
                                        key={potion.id}
                                        onClick={() => canClick && handlePlayerClickBottle(potion.id)}
                                        disabled={!canClick}
                                        className={`w-11 sm:w-12 h-14 sm:h-16 rounded-xl border flex flex-col items-center justify-between p-1 transition-all select-none relative ${
                                            isTaken
                                                ? 'bg-stone-950/60 border-stone-900 opacity-20 scale-90 cursor-not-allowed'
                                                : isHighlightedHealing
                                                ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-400 scale-110 shadow-lg shadow-rose-500/50 animate-pulse cursor-pointer'
                                                : isHighlightedMixture
                                                ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400 scale-110 shadow-lg shadow-emerald-500/50 animate-pulse cursor-pointer'
                                                : isHighlightedPoison
                                                ? 'bg-purple-950/90 border-purple-400 ring-2 ring-purple-400 scale-110 shadow-lg shadow-purple-500/50 animate-pulse cursor-pointer'
                                                : isFirstMixSelected
                                                ? 'bg-fuchsia-950/80 border-fuchsia-400 ring-2 ring-fuchsia-400 scale-110 shadow-lg shadow-fuchsia-500/40 animate-pulse cursor-pointer'
                                                : isCraftSelected
                                                ? 'bg-amber-950/90 border-yellow-400 ring-2 ring-yellow-400 scale-110 shadow-lg shadow-yellow-500/50 animate-pulse cursor-pointer'
                                                : canClick
                                                ? 'bg-gradient-to-b from-[#2a1720] to-[#1a0f15] border-amber-500/70 hover:border-amber-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 cursor-pointer ring-1 ring-amber-400/20'
                                                : 'bg-[#1e1319] border-stone-800 opacity-80 cursor-default'
                                        }`}
                                    >
                                        {isHighlightedHealing && (
                                            <span className="absolute -top-1 -right-1 text-[10px] bg-rose-500 text-black font-black rounded-full px-1 z-10 shadow-md animate-bounce">
                                                💖
                                            </span>
                                        )}
                                        {isHighlightedMixture && (
                                            <span className="absolute -top-1 -right-1 text-[10px] bg-emerald-500 text-black font-black rounded-full px-1 z-10 shadow-md animate-bounce">
                                                🍵
                                            </span>
                                        )}
                                        {isHighlightedPoison && (
                                            <span className="absolute -top-1 -right-1 text-[10px] bg-purple-600 text-white font-black rounded-full px-1 z-10 shadow-md animate-bounce">
                                                ☠️
                                            </span>
                                        )}

                                        <span className="text-[8px] font-mono font-bold text-stone-500">#{idx + 1}</span>
                                        <span className="text-lg sm:text-xl filter drop-shadow">
                                            {isTaken ? '💨' : isFirstMixSelected ? '🧪✨' : isCraftSelected ? '✨' : '🧪'}
                                        </span>
                                        <span className={`text-[7px] font-bold uppercase tracking-wider truncate max-w-full ${
                                            isTaken 
                                                ? 'text-stone-600' 
                                                : isFirstMixSelected 
                                                ? 'text-fuchsia-300 font-black' 
                                                : isCraftSelected
                                                ? 'text-yellow-300 font-black'
                                                : 'text-amber-400'
                                        }`}>
                                            {isTaken ? 'Випито' : isFirstMixSelected ? 'Суміш' : isCraftSelected ? `№${craftIndex + 1}` : 'Зілля'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Action commentary */}
                        <div className="w-full mt-2 p-2 rounded-xl bg-[#1a1014] border border-stone-800 text-xs text-center font-bold text-amber-200 truncate">
                            {lastActionText}
                        </div>
                    </div>

                    {/* Right Col: Participants List & Log (Visible on desktop or when mobile tab is selected) */}
                    <div className={`bg-[#110a0d] border border-stone-800 rounded-2xl p-2.5 flex-col min-h-0 h-[380px] sm:h-[420px] lg:h-[480px] ${
                        activeMobileTab === 'participants' ? 'flex' : activeMobileTab === 'log' ? 'flex' : 'hidden lg:flex'
                    }`}>
                        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 mb-1.5 gap-1">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        setRightPanelTab('participants');
                                        setActiveMobileTab('participants');
                                    }}
                                    className={`px-2 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                                        (activeMobileTab === 'participants' || (rightPanelTab === 'participants' && activeMobileTab !== 'log'))
                                            ? 'bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 shadow-sm'
                                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                                    }`}
                                >
                                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Учасники ({activeCount}/{participants.length})</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setRightPanelTab('log');
                                        setActiveMobileTab('log');
                                    }}
                                    className={`px-2 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                                        (activeMobileTab === 'log' || (rightPanelTab === 'log' && activeMobileTab !== 'participants'))
                                            ? 'bg-purple-950/90 border border-purple-500/60 text-purple-200 shadow-sm'
                                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                                    }`}
                                >
                                    <span>📜 Журнал ({log.length})</span>
                                </button>
                            </div>
                            {(activeMobileTab === 'participants' || (rightPanelTab === 'participants' && activeMobileTab !== 'log')) && (
                                <span className="text-[10px] font-bold text-stone-500 uppercase">HP</span>
                            )}
                        </div>

                        {/* Panel View: Participants */}
                        {(activeMobileTab === 'participants' || (rightPanelTab === 'participants' && activeMobileTab !== 'log')) ? (
                            <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-stone-800">
                                {participants.map((p, idx) => {
                                    const isCurrent = currentTurnIndex === idx && !p.isEliminated && !gameOver;
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                if (selectedTactic === 'wake_up' && p.isAsleep && (playerParticipant?.wakeUpUses || 0) > 0) {
                                                    handleWakeUpParticipant(p.id);
                                                    setSelectedTactic(null);
                                                }
                                            }}
                                            className={`p-1.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                                                selectedTactic === 'wake_up' && p.isAsleep && (playerParticipant?.wakeUpUses || 0) > 0
                                                    ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-400 animate-pulse cursor-pointer'
                                                    : p.isEliminated
                                                    ? 'bg-black/40 border-stone-900 opacity-40'
                                                    : isCurrent
                                                    ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-400 text-amber-200'
                                                    : p.isPlayer
                                                    ? 'bg-[#24131b] border-amber-500/40 text-stone-200'
                                                    : 'bg-[#180e13] border-stone-800/80 text-stone-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="text-sm flex-shrink-0">{p.avatar}</span>
                                                <div className="truncate">
                                                    <div className="font-bold truncate text-[11px] flex items-center gap-1">
                                                        <span>{p.name}</span>
                                                        <span className={`text-[10px] font-bold ${p.gender === 'female' ? 'text-pink-400' : 'text-sky-400'}`} title={p.gender === 'female' ? 'Жіноча стать' : 'Чоловіча стать'}>
                                                            {p.gender === 'female' ? '♀️' : '♂️'}
                                                        </span>
                                                        {p.isPlayer && <span className="text-[9px] text-amber-400 font-normal">(Ви)</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[8px] text-stone-400 truncate">
                                                        {p.hasAntidote && <span>🛡️</span>}
                                                        {p.hasSorbent && <span>🧽</span>}
                                                        {p.hasSorbentActive && <span className="text-amber-300">🧽Сорбент</span>}
                                                        {p.hasSnakeEaterActive && <span className="text-green-400">🐍Поїдач</span>}
                                                        {p.hasPoisonResistActive && <span className="text-purple-400">🛡️Стійкість</span>}
                                                        {(p.catalystMultiplier || 1) > 1 && <span>⚡2x</span>}
                                                        {(p.inhibitorMultiplier || 1) < 1 && <span>❄️0.5x</span>}
                                                        {(p.mixtureTurns || 0) > 0 && <span className="text-emerald-400">🍵({p.mixtureTurns})</span>}
                                                        {(p.slowPoisonTurns || 0) > 0 && <span className="text-amber-400">🐍({p.slowPoisonTurns})</span>}
                                                        {(p.compressionCountdown || 0) > 0 && <span className="text-indigo-400">📦({p.compressionCountdown})</span>}
                                                        {(p.invulnerabilityTurns || 0) > 0 && <span className="text-yellow-300 font-bold" title={`Неушкодженість: ${p.invulnerabilityTurns} ходи`}>🛡️({p.invulnerabilityTurns})</span>}
                                                        {(p.natureBreakRounds || 0) > 0 && <span className="text-cyan-300 font-bold" title={`Відійшов(ла) до вітру (пропуск ${p.natureBreakRounds} кіл)`}>💨({p.natureBreakRounds}к.)</span>}
                                                        {p.isVigorous && <span className="text-amber-300 font-bold" title="Бадьорий(а)">⚡</span>}
                                                        {(p.drunkenness || 0) > 0 && <span className="text-slate-300 font-bold" title={`Сп'яніння: ${p.drunkenness}%`}>🍺({p.drunkenness}%)</span>}
                                                        {p.hasPermanganate && <span className="text-pink-400 font-bold" title="Марганцівка">🧼</span>}
                                                        {(p.hasFortune || (p.fortuneTurns || 0) > 0) && <span className="text-amber-400 font-bold" title={`Зілля успіху (${p.fortuneTurns || 1} х.)`}>🍀{(p.fortuneTurns || 0) > 1 ? <span className="text-[10px] ml-0.5">({p.fortuneTurns})</span> : ''}</span>}
                                                        {p.lastPotion && !p.hasAntidote && !p.hasSorbent && !p.hasFortune && !p.hasPermanganate && (
                                                            <span className="text-stone-500 truncate">
                                                                {p.lastPotion.icon} {p.lastPotion.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {p.isAsleep && (playerParticipant?.wakeUpUses || 0) > 0 ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleWakeUpParticipant(p.id);
                                                            setSelectedTactic(null);
                                                        }}
                                                        className="ml-1 px-1.5 py-1 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 border border-indigo-400 rounded-lg text-[9px] font-black text-[#f5ebd7] uppercase cursor-pointer transition-all shadow-md active:scale-95 animate-pulse flex items-center gap-0.5"
                                                        title="Розбудити гравця та передати хід"
                                                    >
                                                        <span>⏰</span>
                                                        <span>Будильник</span>
                                                    </button>
                                                ) : p.isEliminated ? (
                                                    <span className={`text-[10px] font-black flex items-center gap-0.5 ${
                                                        p.recruitedType === 'love' 
                                                            ? 'text-pink-400' 
                                                            : p.recruitedType === 'friendship' 
                                                            ? 'text-amber-400' 
                                                            : 'text-rose-500'
                                                    }`}>
                                                        {p.recruitedType === 'love' ? (
                                                            <span title={`Закоханий(а) у ${p.recruitedToName || 'підмішавшого'}`}>💘 {p.gender === 'female' ? 'Закохана' : 'Закоханий'} ({p.recruitedToName || 'підмішавшого'})</span>
                                                        ) : p.recruitedType === 'friendship' ? (
                                                            <span title={`Друг ${p.recruitedToName || 'підмішавшого'}`}>🤝 Друг ({p.recruitedToName || 'підмішавшого'})</span>
                                                        ) : (
                                                            <>
                                                                <Skull className="w-3 h-3" />
                                                                {p.isCompressed ? '🌀 Іграшка' : p.isAsleep ? (p.gender === 'female' ? '💤 Заснула' : '💤 Заснув') : (p.gender === 'female' ? 'Вибула' : 'Вибув')}
                                                            </>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <div className="text-right">
                                                        <span className={`font-mono font-bold text-[11px] ${
                                                            p.hp > 60 ? 'text-emerald-400' : p.hp > 30 ? 'text-amber-400' : 'text-rose-400'
                                                        }`}>
                                                            {p.hp}
                                                        </span>
                                                        <span className="text-[9px] text-stone-600">/100</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Panel View: Log */
                            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs font-mono text-stone-300 p-1 scrollbar-thin scrollbar-thumb-stone-800">
                                {log.map((entry, idx) => (
                                    <div key={idx} className="p-1.5 rounded-lg bg-black/40 border border-stone-850 leading-relaxed text-[11px]">
                                        • {entry}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Interactive 5d20 Sleep Dice Roll Modal */}
                {sleepDiceState && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-30">
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#1c111a] border-2 border-purple-500 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl flex flex-col items-center gap-4 text-[#f5ebd7]"
                        >
                            <div className="text-5xl animate-bounce">
                                {sleepDiceState.isDrunkRoll ? '🍺 🍾 🎲' : '💤 🔮 🎲'}
                            </div>

                            <div>
                                <h3 className="text-xl font-black font-serif text-purple-300">
                                    {sleepDiceState.isDrunkRoll ? 'Алкогольна втома — Кидок 5d20' : 'Зілля сну — Кидок 5d20'}
                                </h3>
                                <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                                    {sleepDiceState.isDrunkRoll ? (
                                        sleepDiceState.participant.isPlayer 
                                            ? `Ви сильно захмеліли (${sleepDiceState.participant.drunkenness}%)! Киньте 5 кубиків d20: потрібно 3 успіхи (≥11), щоб не відключитися та не заснути!`
                                            : `${sleepDiceState.participant.name} сильно захмелів(ла) (${sleepDiceState.participant.drunkenness}%)! Потрібно 3 успіхи (≥11) проти дрімоти.`
                                    ) : (
                                        sleepDiceState.participant.isPlayer 
                                            ? 'Ви випили Зілля сну! Киньте 5 кубиків d20: потрібно 3 успіхи (≥11), щоб встояти проти сну!'
                                            : `${sleepDiceState.participant.name} випив(ла) Зілля сну! Потрібно 3 успіхи (≥11) проти сну.`
                                    )}
                                </p>
                            </div>

                            {/* Dice Grid (5 d20 dice) */}
                            <div className="flex justify-center gap-2 sm:gap-3 my-2 w-full">
                                {[0, 1, 2, 3, 4].map(idx => {
                                    const roll = sleepDiceState.rolls[idx];
                                    const isSuccess = roll !== undefined && roll >= 11;

                                    return (
                                        <div
                                            key={idx}
                                            className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all ${
                                                sleepDiceState.isRolling
                                                    ? 'bg-purple-950/80 border-purple-400 animate-spin'
                                                    : roll === undefined
                                                    ? 'bg-stone-900 border-stone-800 text-stone-600'
                                                    : isSuccess
                                                    ? 'bg-emerald-950 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/20'
                                                    : 'bg-rose-950 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/20'
                                            }`}
                                        >
                                            <span className="text-[8px] font-mono font-bold text-stone-400">d20 #{idx + 1}</span>
                                            <span className="text-lg font-black font-mono">
                                                {sleepDiceState.isRolling ? '🎲' : roll ?? '?'}
                                            </span>
                                            <span className="text-[8px] font-bold uppercase">
                                                {roll === undefined ? '—' : isSuccess ? '✅ Успіх' : '❌ Поразка'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Live Scores */}
                            <div className="flex items-center justify-center gap-6 text-sm font-bold bg-black/50 px-4 py-2 rounded-xl border border-purple-900/60 w-full">
                                <div className="text-emerald-400 flex items-center gap-1.5">
                                    <span>Успіхи (≥11):</span>
                                    <span className="text-lg font-black font-mono">{sleepDiceState.successCount} / 3</span>
                                </div>
                                <div className="text-stone-600">|</div>
                                <div className="text-rose-400 flex items-center gap-1.5">
                                    <span>Поразки (≤10):</span>
                                    <span className="text-lg font-black font-mono">{sleepDiceState.failCount} / 3</span>
                                </div>
                            </div>

                            {/* Result Message */}
                            {sleepDiceState.finished && (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`p-3 rounded-xl border text-xs font-bold w-full ${
                                        sleepDiceState.isAsleep
                                            ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                                            : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                    }`}
                                >
                                    {sleepDiceState.isAsleep ? (
                                        sleepDiceState.isDrunkRoll ? (
                                            <span>💤 3 ПОРАЗКИ! {sleepDiceState.participant.name} відключився(лася) від алкоголю та вибуває з рулетки!</span>
                                        ) : (
                                            <span>💤 3 ПОРАЗКИ! {sleepDiceState.participant.name} міцно заснув(ла) від зілля і вибуває з рулетки!</span>
                                        )
                                    ) : (
                                        sleepDiceState.isDrunkRoll ? (
                                            <span>🌙 3 УСПІХИ! {sleepDiceState.participant.name} встояв(ла) на ногах попри сп'яніння та продовжує хід!</span>
                                        ) : (
                                            <span>🌙 3 УСПІХИ! {sleepDiceState.participant.name} переборов(ла) чари сну та продовжує гру!</span>
                                        )
                                    )}
                                </motion.div>
                            )}

                            {/* Action Button */}
                            <div className="w-full pt-1">
                                {!sleepDiceState.finished ? (
                                    <button
                                        onClick={executeSleepDiceRoll}
                                        disabled={sleepDiceState.isRolling}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-purple-500/30 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <span>🎲 КИНУТИ 5d20</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={finishSleepDiceSequence}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-stone-950 font-black text-sm shadow-lg transition cursor-pointer"
                                    >
                                        <span>ПРОДОВЖИТИ ГРУ</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Game Over Modal Screen Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-20">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#1c1117] border-2 border-amber-500 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl flex flex-col items-center gap-3"
                        >
                            <div className="text-5xl">
                                {winner?.isPlayer ? '👑 🏆 🧪' : '💀 🥀'}
                            </div>

                            <h3 className={`text-xl font-black font-serif ${
                                winner?.isPlayer ? 'text-amber-300' : 'text-rose-400'
                            }`}>
                                {winner?.isPlayer ? 'Тріумф у Королівській рулетці зілля!' : 'Гру завершено!'}
                            </h3>

                            <p className="text-xs text-stone-300 leading-relaxed">
                                {winner?.isPlayer 
                                    ? `Неймовірно! Ви єдиний, хто пережив усі підступні зілля та здолав ${participantCount - 1} суперників! Отримано куш +${currentPrize} золота та +${expectedXpReward} XP!`
                                    : winner 
                                    ? `Переможцем став ${winner.avatar} ${winner.name}, який залишився останнім на ногах!`
                                    : `Всі ${participantCount} учасників отруїлися — нічия!`}
                            </p>

                            {/* Show gold won badge */}
                            {winner?.isPlayer && (
                                <div className="w-full p-2.5 bg-amber-950/80 border border-amber-500/60 rounded-xl text-xs text-amber-200 flex items-center justify-around font-bold">
                                    <span className="flex items-center gap-1.5 text-yellow-300">
                                        <span>💰 Виграш:</span>
                                        <span className="text-sm font-black">+{currentPrize} золота</span>
                                    </span>
                                    <span className="flex items-center gap-1 text-emerald-300">
                                        <span>✨ Досвід:</span>
                                        <span>+{expectedXpReward} XP</span>
                                    </span>
                                </div>
                            )}

                            {/* Show compressed rewards won if player won */}
                            {winner?.isPlayer && compressedRewards.length > 0 && (
                                <div className="w-full p-2.5 bg-indigo-950/80 border border-indigo-500/60 rounded-xl text-xs text-indigo-200 flex flex-col items-center gap-1.5">
                                    <div className="font-bold flex items-center gap-1 text-amber-300">
                                        <Gift className="w-4 h-4 text-amber-400" />
                                        <span>Скомпресовані фігури у нагороду ({compressedRewards.length} шт):</span>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {compressedRewards.map((toy, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-black/60 border border-indigo-400 rounded-lg text-[11px] font-bold text-white flex items-center gap-1">
                                                <span>{toy.avatar}</span>
                                                <span>{toy.name}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2.5 w-full pt-2">
                                <button
                                    onClick={() => initGame()}
                                    className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Зіграти ще раз</span>
                                </button>

                                <button
                                    onClick={() => (winner?.isPlayer ? onVictory(currentPrize) : onDefeat())}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shadow-lg ${
                                        winner?.isPlayer
                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 hover:brightness-110'
                                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                                    }`}
                                >
                                    {winner?.isPlayer ? `Забрати ${currentPrize} зол.` : 'Залишити таверну'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Tactical actions overlays */}
                {scanChooseBottle !== null && (
                    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-[#150d11] border-2 border-purple-500 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-4 text-[#f5ebd7]">
                            <div className="w-14 h-14 rounded-full bg-purple-950/50 border-2 border-purple-500 flex items-center justify-center text-2xl animate-pulse">
                                🔍
                            </div>
                            
                            <div className="space-y-0.5">
                                <h3 className="text-base font-black uppercase text-purple-400 font-serif tracking-wide">
                                    скан+вибір
                                </h3>
                                <p className="text-[11px] text-stone-400">
                                    Аналізатор розпізнав вміст пляшечки #{potions.indexOf(scanChooseBottle) + 1}:
                                </p>
                            </div>

                            <div className={`w-full py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${scanChooseBottle.color || 'bg-stone-900/60 border-stone-800 text-stone-300'}`}>
                                <span className="text-3xl filter drop-shadow">{scanChooseBottle.icon}</span>
                                <span className="text-xs font-black uppercase tracking-wider">зілля: {scanChooseBottle.name}</span>
                                <span className="text-[10px] font-bold opacity-80">
                                    {scanChooseBottle.hpChange !== 0 ? `Зміна HP: ${scanChooseBottle.hpChange > 0 ? '+' : ''}${scanChooseBottle.hpChange} HP` : 'Ефект чистої води (0 HP)'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
                                <button
                                    onClick={() => handleScanAndChooseResult(false)}
                                    className="py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500 font-bold transition text-xs cursor-pointer uppercase tracking-wider"
                                >
                                    вилити
                                </button>
                                <button
                                    onClick={() => handleScanAndChooseResult(true)}
                                    className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black transition text-xs shadow-lg cursor-pointer uppercase tracking-wider"
                                >
                                    випити
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {scanDiscardBottle !== null && (
                    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-[#150d11] border-2 border-amber-500 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-4 text-[#f5ebd7]">
                            <div className="w-14 h-14 rounded-full bg-amber-950/50 border-2 border-amber-500 flex items-center justify-center text-2xl animate-pulse">
                                🧪
                            </div>
                            
                            <div className="space-y-0.5">
                                <h3 className="text-base font-black uppercase text-amber-400 font-serif tracking-wide">
                                    скан + вилити
                                </h3>
                                <p className="text-[11px] text-stone-400">
                                    Вміст відсканованої пляшечки #{potions.indexOf(scanDiscardBottle) + 1}:
                                </p>
                            </div>

                            <div className={`w-full py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${scanDiscardBottle.color || 'bg-stone-900/60 border-stone-800 text-stone-300'}`}>
                                <span className="text-3xl filter drop-shadow">{scanDiscardBottle.icon}</span>
                                <span className="text-xs font-black uppercase tracking-wider">зілля: {scanDiscardBottle.name}</span>
                                <span className="text-[10px] font-bold opacity-80">
                                    {scanDiscardBottle.hpChange !== 0 ? `Зміна HP: ${scanDiscardBottle.hpChange > 0 ? '+' : ''}${scanDiscardBottle.hpChange} HP` : 'Ефект чистої води (0 HP)'}
                                </span>
                            </div>

                            <div className="w-full mt-1">
                                <button
                                    onClick={() => executeScanAndDiscard(scanDiscardBottle)}
                                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black transition text-xs shadow-lg cursor-pointer uppercase tracking-wider"
                                >
                                    вилити
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {givenPotionContext !== null && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                        <div className="bg-[#120a0e] border-2 border-[#b58b4c] rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-[#f5ebd7] animate-fadeIn">
                            <div className="flex flex-col items-center text-center gap-1.5">
                                <div className="w-14 h-14 rounded-full bg-amber-950/40 border-2 border-amber-500 flex items-center justify-center text-2xl animate-bounce">
                                    🎁
                                </div>
                                <h3 className="text-base font-black uppercase text-amber-400 font-serif tracking-wide">
                                    Вам дали зілля!
                                </h3>
                                <p className="text-xs text-stone-300">
                                    {givenPotionContext.from.avatar} <strong className="text-amber-200">{givenPotionContext.from.name}</strong> змусив вас взаємодіяти з пляшечкою <strong className="text-stone-100">#{potions.indexOf(givenPotionContext.bottle) + 1}</strong>!
                                </p>
                                <p className="text-[10px] text-stone-400">
                                    Оберіть, як вчинити з цією пляшечкою за допомогою ваших тактичних можливостей:
                                </p>
                            </div>

                            {/* Main Action Options */}
                            <div className="flex flex-col gap-2">
                                {/* 1. Solvent Toggle if available */}
                                {(playerParticipant?.solventUses ?? 0) > 0 && (
                                    <button
                                        onClick={() => {
                                            setParticipants(prev => prev.map(p => {
                                                if (p.isPlayer) {
                                                    return {
                                                        ...p,
                                                        hasSolventActive: !p.hasSolventActive
                                                    };
                                                }
                                                return p;
                                            }));
                                        }}
                                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition flex items-center justify-between cursor-pointer ${
                                            playerParticipant?.hasSolventActive
                                                ? 'bg-amber-600/30 border-amber-400 text-amber-200 ring-2 ring-amber-400/30'
                                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-amber-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>🧴 Режим розчинника</span>
                                            {playerParticipant?.hasSolventActive && (
                                                <span className="text-[8px] bg-amber-400 text-stone-950 px-1 rounded font-black animate-pulse">АКТИВНИЙ</span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black opacity-80">
                                            {playerParticipant?.solventUses}/1 флакон
                                        </span>
                                    </button>
                                )}

                                {/* 1a. Snake Eater Toggle if available */}
                                {(playerParticipant?.snakeEaterUses ?? 0) > 0 && (
                                    <button
                                        onClick={() => handleToggleSnakeEater()}
                                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition flex items-center justify-between cursor-pointer ${
                                            playerParticipant?.hasSnakeEaterActive
                                                ? 'bg-green-600/30 border-green-400 text-green-200 ring-2 ring-green-400/30'
                                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-green-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>🐍 Режим поїдання змій</span>
                                            {playerParticipant?.hasSnakeEaterActive && (
                                                <span className="text-[8px] bg-green-400 text-stone-950 px-1 rounded font-black animate-pulse">АКТИВНИЙ</span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black opacity-80">
                                            {playerParticipant?.snakeEaterUses}/1 флакон
                                        </span>
                                    </button>
                                )}

                                {/* 1b. Poison Resistance Toggle if available */}
                                {(playerParticipant?.poisonResistUses ?? 0) > 0 && (
                                    <button
                                        onClick={() => handleTogglePoisonResist()}
                                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition flex items-center justify-between cursor-pointer ${
                                            playerParticipant?.hasPoisonResistActive
                                                ? 'bg-purple-600/30 border-purple-400 text-purple-200 ring-2 ring-purple-400/30'
                                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-purple-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>🛡️ Режим стійкості до яду</span>
                                            {playerParticipant?.hasPoisonResistActive && (
                                                <span className="text-[8px] bg-purple-400 text-stone-950 px-1 rounded font-black animate-pulse">АКТИВНИЙ</span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black opacity-80">
                                            {playerParticipant?.poisonResistUses}/1 флакон
                                        </span>
                                    </button>
                                )}

                                {/* 2. Drink Option */}
                                <button
                                    onClick={() => {
                                        const { bottle, listWithReducedUses } = givenPotionContext;
                                        setGivenPotionContext(null);
                                        handleDrinkPotion(bottle.id, playerParticipant!, listWithReducedUses, true);
                                    }}
                                    className={`py-2.5 rounded-xl text-stone-950 font-black transition text-xs uppercase tracking-wider cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                        playerParticipant?.hasSolventActive
                                            ? 'bg-amber-400 hover:bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                                            : playerParticipant?.hasSnakeEaterActive
                                            ? 'bg-green-500 hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                            : playerParticipant?.hasPoisonResistActive
                                            ? 'bg-purple-500 hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                            : 'bg-emerald-500 hover:bg-emerald-400'
                                    }`}
                                >
                                    <span>випити зілля</span>
                                    {playerParticipant?.hasSolventActive && (
                                        <span className="text-[8px] text-stone-950 font-black opacity-90">🧴 З розчинником (шкода -50%)</span>
                                    )}
                                    {playerParticipant?.hasSnakeEaterActive && (
                                        <span className="text-[8px] text-stone-950 font-black opacity-90">🐍 Поїдач змій (яд зцілить +20 HP!)</span>
                                    )}
                                    {playerParticipant?.hasPoisonResistActive && (
                                        <span className="text-[8px] text-stone-950 font-black opacity-90">🛡️ Стійкість (отрута не завдасть шкоди)</span>
                                    )}
                                </button>

                                {/* Tactical Alternatives */}
                                <div className="text-[9px] text-stone-500 uppercase tracking-wider font-bold mt-1.5 mb-0.5 text-center">
                                    Спеціальні тактики на вибір:
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Tactic A: Scan + Choose */}
                                    <button
                                        onClick={() => {
                                            const { bottle } = givenPotionContext;
                                            setGivenPotionContext(null);
                                            setScanChooseBottle(bottle);
                                        }}
                                        disabled={(playerParticipant?.scanAndChooseUses ?? 0) <= 0}
                                        className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                                            (playerParticipant?.scanAndChooseUses ?? 0) <= 0
                                                ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                                : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-purple-500 hover:text-purple-300 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[10px] font-bold">🔍 Скан+Вибір</span>
                                            <span className="text-[8px] bg-purple-950 text-purple-300 px-1 rounded font-black">
                                                {playerParticipant?.scanAndChooseUses ?? 2}/2
                                            </span>
                                        </div>
                                    </button>

                                    {/* Tactic B: Scan + Discard */}
                                    <button
                                        onClick={() => {
                                            const { bottle } = givenPotionContext;
                                            setGivenPotionContext(null);
                                            setScanDiscardBottle(bottle);
                                        }}
                                        disabled={(playerParticipant?.scanAndDiscardUses ?? 0) <= 0}
                                        className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                                            (playerParticipant?.scanAndDiscardUses ?? 0) <= 0
                                                ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                                : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-amber-500 hover:text-amber-300 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[10px] font-bold">🧪 Скан+Вилити</span>
                                            <span className="text-[8px] bg-amber-950 text-amber-300 px-1 rounded font-black">
                                                {playerParticipant?.scanAndDiscardUses ?? 3}/3
                                            </span>
                                        </div>
                                    </button>

                                    {/* Tactic C: Discard Blindly */}
                                    <button
                                        onClick={() => {
                                            const { bottle } = givenPotionContext;
                                            setGivenPotionContext(null);
                                            executeDiscardSecret(bottle);
                                        }}
                                        disabled={(playerParticipant?.discardSecretUses ?? 0) <= 0}
                                        className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                                            (playerParticipant?.discardSecretUses ?? 0) <= 0
                                                ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                                : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-fuchsia-500 hover:text-fuchsia-300 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[10px] font-bold">🗑️ Вилити наосліп</span>
                                            <span className="text-[8px] bg-fuchsia-950 text-fuchsia-300 px-1 rounded font-black">
                                                {playerParticipant?.discardSecretUses ?? 1}/1
                                            </span>
                                        </div>
                                    </button>

                                     {/* Tactic: Taster */}
                                    <button
                                        onClick={() => {
                                            const { bottle, listWithReducedUses, from } = givenPotionContext;
                                            const updatedList = listWithReducedUses.map(p => {
                                                if (p.isPlayer) {
                                                    return { ...p, tasterUses: Math.max(0, (p.tasterUses ?? 1) - 1) };
                                                }
                                                return p;
                                            });
                                            setParticipants(updatedList);
                                            setGivenPotionContext({
                                                bottle,
                                                from,
                                                listWithReducedUses: updatedList
                                            });
                                            const actionMsg = `👅 Дегустатор: Передана пляшечка #${potions.indexOf(bottle) + 1} — це "${bottle.name}" (${bottle.hpChange >= 0 ? '+' : ''}${bottle.hpChange} HP)!`;
                                            setLastActionText(actionMsg);
                                            setLog(prev => [actionMsg, ...prev.slice(0, 35)]);
                                        }}
                                        disabled={(playerParticipant?.tasterUses ?? 0) <= 0}
                                        className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                                            (playerParticipant?.tasterUses ?? 0) <= 0
                                                ? 'bg-stone-950/60 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                                                : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-emerald-500 hover:text-emerald-300 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[10px] font-bold">👅 Дегустатор</span>
                                            <span className="text-[8px] bg-emerald-950 text-emerald-300 px-1 rounded font-black">
                                                {playerParticipant?.tasterUses ?? 1}/1
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

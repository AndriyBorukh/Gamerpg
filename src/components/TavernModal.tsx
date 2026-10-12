import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TavernData, SettlementData, OpponentData, WorldProgress, TavernActivityType, HiredCompanion } from '../types';
import { GameVariant } from './ChessModal';
import { DurakGameMode } from './ClassicDurakModal';
import tavernInteriorImg from '../assets/images/tavern_interior_1789277109677.jpg';
import { getTavernAlcoholMenu, AlcoholDrink } from '../lib/alcoholData';
import { getTavernFoodMenu, FoodItem } from '../lib/foodData';
import { playDrinkSound, playGoldSound } from '../lib/soundEffects';
import { calculateTotalHealth } from '../lib/brawlEngine';
import { COMPANION_CLASSES } from '../lib/companionClasses';
import { getGenderForName } from '../lib/nameGenerator';
import { ViolinSynthPlayer, PRESET_MELODIES, parseNotes, noteToFrequency } from '../lib/musicSynth';
import { 
    isActivityOpponentDefeated, 
    isOpponentUnlocked, 
    getTavernActivityStatus,
    getTavernActivityRoster,
    isOpponentRetiredToNPC,
    getOpponentWinCount,
    getOpponentXpReward,
    getRetiredNpcDialogue,
    DEFAULT_PLAYER_STATS,
    saveWorldProgress
} from '../lib/worldData';
import { 
    Beer, 
    Trophy, 
    Swords, 
    Shield, 
    Lock, 
    CheckCircle2, 
    ArrowLeft, 
    Coins, 
    Zap, 
    Star, 
    Flame,
    Crown,
    Dices,
    Heart,
    Footprints,
    Sun,
    Scroll,
    MessageSquare,
    Users,
    Sparkles,
    Smile,
    X,
    Wine,
    Music,
    Volume2,
    Play,
    Square,
    Upload,
    Download,
    HelpCircle,
    Check,
    UserCheck,
    BookOpen
} from 'lucide-react';
import { ClassGuidebookModal } from './ClassGuidebookModal';
import { getFigurineRequirement, executeAutoPurchaseForActivity, FigurineRequirement } from '../lib/toyAutoPurchase';

interface TavernModalProps {
    settlement: SettlementData;
    tavern: TavernData;
    progress: WorldProgress;
    onUpdateProgress?: (updatedProgress: WorldProgress) => void;
    onChallengeOpponent: (opponent: OpponentData, activityType: TavernActivityType) => void;
    onChallengeBrawl: (opponent: OpponentData) => void;
    onChallengeClassicDurak?: (opponent: OpponentData, mode: DurakGameMode) => void;
    onChallengeDicePoker?: (opponent: OpponentData) => void;
    onChallengeTavernDice?: (opponent: OpponentData) => void;
    onChallengeCoinFlip?: (opponent: OpponentData) => void;
    onChallengeD20Dice?: (opponent: OpponentData) => void;
    onChallengePotionRoulette?: (opponent: OpponentData) => void;
    onChallengeLabyrinth?: (opponent: OpponentData) => void;
    onChallengeTreasureHunter?: (opponent: OpponentData) => void;
    onChallengeDiceDuel?: (opponent: OpponentData) => void;
    onChallengeDiceDuelTournament?: (opponent: OpponentData) => void;
    onChallengeCheckers?: (opponent: OpponentData) => void;
    onChallengeSenet?: (opponent: OpponentData) => void;
    onChallengeUr?: (opponent: OpponentData) => void;
    onChallengeMehen?: (opponent: OpponentData) => void;
    onChallengeAseb?: (opponent: OpponentData) => void;
    onChallengeFencingSwordShield?: (opponent: OpponentData) => void;
    onChallengeFencingSwordOnly?: (opponent: OpponentData) => void;
    onChallengeFrenchTarot?: (opponent: OpponentData) => void;
    onChallengeBlackjack?: (opponent: OpponentData) => void;
    onChallengeBlackjackDice?: (opponent: OpponentData) => void;
    onChallengeSteeplechase?: () => void;
    onChallengeFlatRace?: () => void;
    onChallengeMountedArchery?: () => void;
    onChallengeArchery?: (opponent: OpponentData) => void;
    onChallengeJousting?: (opponent: OpponentData) => void;
    onChallengeChess?: (variant: GameVariant, opponent: OpponentData) => void;
    onChallengeToySoldiers?: (opponent: OpponentData) => void;
    onChallengeArmyBattle?: (opponent: OpponentData) => void;
    onChallengeCheckersWar?: (opponent: OpponentData, variant?: 'checkers_war' | 'aranian_checkers_war' | 'military_checkers' | 'aranian_military_checkers') => void;
    onChallengeRpgArmyCheckers?: (opponent: OpponentData) => void;
    onChallengeToyCheckers?: (opponent: OpponentData, boardSize?: 8 | 10 | 12, movementMode?: 'combat' | 'checkers_classic') => void;
    onChallengeToyPawns?: (opponent: OpponentData, boardSize?: 8 | 10 | 12) => void;
    onChallengeWizardBattle?: (opponent: OpponentData) => void;
    onChallengeWizardTournament?: (opponent: OpponentData) => void;
    onChallengeFantasyAdventure?: (opponent: OpponentData) => void;
    onChallengeMagicPawns?: (opponent: OpponentData, boardSize?: 8 | 10 | 12) => void;
    onChallengeBattlePawns6x12?: (opponent: OpponentData) => void;
    onOpenToyShop?: () => void;
    onOpenDecompressionMaster?: () => void;
    onOpenCardMaster?: () => void;
    onOpenCharacterModal?: () => void;
    onOpenQuests?: () => void;
    onBackToSettlement: () => void;
    onCloseToMap: () => void;
}

interface ActivityConfig {
    id: TavernActivityType;
    codeName: string;
    label: string;
    icon: string;
    themeColor: string;
    badgeBg: string;
    borderActive: string;
    keeperQuote: string;
    btnLabel: string;
    btnColor: string;
}

const RAW_ACTIVITIES: Omit<ActivityConfig, 'codeName'>[] = [
    {
        id: 'rpg_cards',
        label: 'РПГ-Дуель',
        icon: '🎴',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#251d16]',
        keeperQuote: '«Шукаєш картярів-магів? Здолай вісімку місцевих тактиків, аби битися з володарями колоди!»',
        btnLabel: 'РПГ-Картярський бій',
        btnColor: 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-black'
    },
    {
        id: 'classic_durak_36',
        label: 'Дурень 36',
        icon: '🃏',
        themeColor: 'text-sky-300',
        badgeBg: 'bg-sky-950/40 border-sky-500/40',
        borderActive: 'border-sky-400 bg-[#16202b]',
        keeperQuote: '«Класичний стіл на 36 карт: прості та чесні правила без магії. Покажи хто тут не дурень!»',
        btnLabel: 'Зіграти в Дурня (36 карт)',
        btnColor: 'bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 text-white'
    },
    {
        id: 'classic_durak_52',
        label: 'Дурень 52',
        icon: '🎴',
        themeColor: 'text-indigo-300',
        badgeBg: 'bg-indigo-950/40 border-indigo-500/40',
        borderActive: 'border-indigo-400 bg-[#1a172c]',
        keeperQuote: '«Велика французька колода на 52 карти з двійками й трійками для справжніх гросмейстерів!»',
        btnLabel: 'Зіграти в Дурня (52 карти)',
        btnColor: 'bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 text-white'
    },
    {
        id: 'classic_durak_54',
        label: 'Дурень 54',
        icon: '🃏',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#251d16]',
        keeperQuote: '«Французька колода на 54 карти з двома джокерами для несподіваних повертів сили!»',
        btnLabel: 'Зіграти в Дурня (54 карти)',
        btnColor: 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-black'
    },
    {
        id: 'classic_durak_56',
        label: 'Дурень 56',
        icon: '🎴',
        themeColor: 'text-orange-300',
        badgeBg: 'bg-orange-950/40 border-orange-500/40',
        borderActive: 'border-orange-400 bg-[#2a1b12]',
        keeperQuote: '«Розширена колода на 56 карт з 52 стандартними картами та 4 джокерами для азартних тактиків!»',
        btnLabel: 'Зіграти в Дурня (56 карт)',
        btnColor: 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 text-white'
    },
    {
        id: 'classic_durak_minor_tarot',
        label: 'Молодші аркани (56)',
        icon: '🥖',
        themeColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/40 border-emerald-500/40',
        borderActive: 'border-emerald-400 bg-[#12281d]',
        keeperQuote: '«Містична колода на 56 Молодших арканів Таро (Жезли, Мечі, Кубки, Пентаклі) від Тузів до Королів!»',
        btnLabel: 'Зіграти в Дурня (Молодші аркани 56)',
        btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white'
    },
    {
        id: 'classic_durak_tarot',
        label: 'Колода Таро (78)',
        icon: '🔮',
        themeColor: 'text-purple-300',
        badgeBg: 'bg-purple-950/40 border-purple-500/40',
        borderActive: 'border-purple-400 bg-[#231533]',
        keeperQuote: '«Велична містична колода на 78 карт: 22 Старші аркани та 56 Молодших арканів для найглибших гросмейстерів!»',
        btnLabel: 'Зіграти в Дурня (Таро 78 карт)',
        btnColor: 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 text-white'
    },
    {
        id: 'dice_poker',
        label: 'Покер у кості',
        icon: '🎲',
        themeColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/40 border-emerald-500/40',
        borderActive: 'border-emerald-400 bg-[#14261d]',
        keeperQuote: '«П\'ять кубиків, два кидки: каре, фулл-хаус або покер! Хто збере сильнішу комбінацію?»',
        btnLabel: 'Кинути кості в Покер',
        btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white'
    },
    {
        id: 'tavern_dice',
        label: 'Прості кості',
        icon: '🥤',
        themeColor: 'text-yellow-300',
        badgeBg: 'bg-yellow-950/40 border-yellow-500/40',
        borderActive: 'border-yellow-400 bg-[#2b2514]',
        keeperQuote: '«Швидкі тавернні кидки на 3 раунди: сума граней вирішує долю монет у банку!»',
        btnLabel: 'Кидати тавернні кості',
        btnColor: 'bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 text-black'
    },
    {
        id: 'coin_flip',
        label: 'Гра в монетку',
        icon: '🪙',
        themeColor: 'text-yellow-300',
        badgeBg: 'bg-yellow-950/40 border-yellow-500/40',
        borderActive: 'border-yellow-400 bg-[#2b2514]',
        keeperQuote: '«Орел чи Решка? Класична тавернська гра на удачу до 3 перемог!»',
        btnLabel: 'Кинути золоту монетку',
        btnColor: 'bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-500 hover:from-yellow-400 text-stone-950 font-black'
    },
    {
        id: 'd20_dice',
        label: 'd20 Кості (High-Roll)',
        icon: '🎲',
        themeColor: 'text-indigo-300',
        badgeBg: 'bg-indigo-950/40 border-indigo-500/40',
        borderActive: 'border-indigo-400 bg-[#161224]',
        keeperQuote: '«Двадцятигранні кістки D20: хто викине вищу грань — забирає раунд! Остерігайтесь критичних одиниць та шукайте двадцятки!»',
        btnLabel: 'Кидати d20 кості',
        btnColor: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-400 text-white font-black'
    },
    {
        id: 'potion_roulette',
        label: 'Рулетка зілля (20-200 осіб)',
        icon: '🧪',
        themeColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/40 border-emerald-500/40',
        borderActive: 'border-emerald-400 bg-[#102417]',
        keeperQuote: '«Королівська рулетка зілля від 20 до 200 учасників! Виграш за 20 осіб — 20 золотих, а кожен наступний рівень подвоює куш (до 10 240 золота за 200 осіб)! Останній живий забирає весь банк!»',
        btnLabel: 'Сісти за стіл рулетки зілля',
        btnColor: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 hover:from-emerald-400 text-white font-black'
    },
    {
        id: 'tavern_labyrinth',
        label: 'Лабіринт (Вид зверху)',
        icon: '🧭',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#251d16]',
        keeperQuote: '«Таємничий кам’яний лабіринт підвалів таверни! Пройди його зверху за 3 хвилини, збери золото і скрині та знайди вихід неушкодженим!»',
        btnLabel: 'Увійти в Лабіринт (3 хвилини)',
        btnColor: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 text-stone-950 font-black'
    },
    {
        id: 'tavern_treasure_hunter',
        label: 'Шукач скарбів (Платформер)',
        icon: '🧢',
        themeColor: 'text-yellow-300',
        badgeBg: 'bg-yellow-950/40 border-yellow-500/40',
        borderActive: 'border-yellow-400 bg-[#252210]',
        keeperQuote: '«Класичний платформер у стилі ретро-класики! Стрибай по цегляних платформах, збирай діаманти, уникни пасток, знайди ключ і відчини двері до виходу!»',
        btnLabel: 'Грати в Шукача скарбів',
        btnColor: 'bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-500 hover:from-yellow-400 text-stone-950 font-black'
    },
    {
        id: 'dice_duel',
        label: 'Двобій на костях (2d20)',
        icon: '⚔️',
        themeColor: 'text-rose-300',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2b1210]',
        keeperQuote: '«Тактичний бій на двох d20: Атака проти Захисту! Якщо атака перевершує блок, наноситься 1 пошкодження. Бій триває до 3 поранень!»',
        btnLabel: 'Вийти на двобій (2d20)',
        btnColor: 'bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-500 text-white font-black'
    },
    {
        id: 'dice_duel_tournament',
        label: 'Турнір двобоїв (8 бійців)',
        icon: '👑',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2b1e10]',
        keeperQuote: '«Грандіозний турнір на 8 учасників! 1/4 фіналу, 1/2 фіналу та Гранд-Фінал за правилами двобою 2d20. Лише один стане Чемпіоном!»',
        btnLabel: 'Вступити в турнір 8 бійців',
        btnColor: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 text-stone-950 font-black'
    },
    {
        id: 'toy_soldiers',
        label: 'Гра в солдатики 15х15',
        icon: '💂‍♂️',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2b1f14]',
        keeperQuote: '«Тактичні баталії 15 на 15 клітинок! 5 солдатиків по 3 HP. Дальність руху: 4 клітинки для всіх, 6 для лицаря, 8 для кінотника! Бій за d20 та прокачка до 4 рівня!»',
        btnLabel: 'Грати в солдатики (15x15)',
        btnColor: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black'
    },
    {
        id: 'army_battle',
        label: 'Битва Армій (16 загонів)',
        icon: '🚩',
        themeColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2b1f14]',
        keeperQuote: '«Грандіозна Битва Армій! Замість одного солдатика ходить загін з 5 бійців. При битві кидок N кубів атаки проти M кубів захисту (за кількістю живих солдатів). Для битви необхідно 16 загонів!»',
        btnLabel: 'Розпочати Битву Армій (16 vs 16)',
        btnColor: 'bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 hover:from-red-500 text-stone-950 font-black'
    },
    {
        id: 'rpg_army_checkers',
        label: 'Рольові армійські шашки',
        icon: '⚔️🧙‍♂️👑',
        themeColor: 'text-purple-400',
        badgeBg: 'bg-purple-950/40 border-purple-500/40',
        borderActive: 'border-purple-400 bg-[#281024]',
        keeperQuote: '«Рольові армійські шашки: 12 загонів на 8х8 дошці! Кожен загін складається з 4 героїв — двох воїнів, мага та клірика. Бої проходять як у Фантастичних пригодах (G29)! Загиблі бійці вибувають до кінця гри. Прокачуйте бійців до 4-го рівня (20 → 40 → 80 → 160 XP) та відновлюйте полеглих у меню іграшок!»',
        btnLabel: 'Зіграти в Рольові Армійські Шашки',
        btnColor: 'bg-gradient-to-r from-purple-700 via-rose-600 to-amber-600 hover:from-purple-600 text-white font-black'
    },
    {
        id: 'checkers_war',
        label: 'Армійські шашки 8х8',
        icon: '⚔️🔴',
        themeColor: 'text-red-400',
        badgeBg: 'bg-red-950/40 border-red-500/40',
        borderActive: 'border-red-400 bg-[#2b1010]',
        keeperQuote: '«Армійські шашки: 12 армійських шашок-загонів на 8х8 дошці! При атаці загону відкривається друга 8х8 шахівниця для тактичної битви за правилами англійських шашок. Кожне взяття забирає 1 HP у бійця. Загони прокачуються та декомпресуються на 4+ рівні!»',
        btnLabel: 'Зіграти в Армійські шашки (8х8)',
        btnColor: 'bg-gradient-to-r from-red-600 via-rose-700 to-amber-600 hover:from-red-500 text-white font-black'
    },
    {
        id: 'aranian_checkers_war',
        label: 'Аранійські армійські шашки 8х8',
        icon: '⚔️👑',
        themeColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2b1808]',
        keeperQuote: '«Аранійські армійські шашки: шашки-загони на глобальній шахівниці ходять на 1 клітинку вліво, вправо, вперед та по діагоналі! Дамка ходить у всіх 8 напрямках. При перемозі загін стає на місце побитого ворога, а в битві розгортається тактична 8х8 шахівниця!»',
        btnLabel: 'Зіграти в Аранійські армійські шашки',
        btnColor: 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 text-white font-black'
    },
    {
        id: 'military_checkers',
        label: 'Військові шашки 8х8',
        icon: '🪙🛡️',
        themeColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/40 border-emerald-500/40',
        borderActive: 'border-emerald-400 bg-[#0d2618]',
        keeperQuote: '«Військові шашки: кожен загін — це армія зі 120 бійців! Хід за класичними шашковими правилами, а битва — через кидки монет: атакуючий кидає монети за бійців, а загін захисту кидає монети на блок за кількістю отриманих попадань! Втрати — незаблоковані удари. Загони прокачуються та мають контратаку!»',
        btnLabel: 'Зіграти у Військові шашки (120 бійців)',
        btnColor: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-500 text-white font-black'
    },
    {
        id: 'aranian_military_checkers',
        label: 'Аранійські військові шашки 8х8',
        icon: '👑🪙',
        themeColor: 'text-yellow-400',
        badgeBg: 'bg-yellow-950/40 border-yellow-500/40',
        borderActive: 'border-yellow-400 bg-[#282108]',
        keeperQuote: '«Аранійські військові шашки: найвеличніша тактична війна! Поєднання аранійських ходів (вліво, вправо, вперед і діагоналі, дамка у всіх 8 напрямках, загін стає на місце побитого ворога) та масштабної битви монет 120 бійців!»',
        btnLabel: 'Зіграти в Аранійські військові шашки',
        btnColor: 'bg-gradient-to-r from-yellow-500 via-amber-600 to-rose-600 hover:from-yellow-400 text-stone-950 font-black'
    },
    {
        id: 'toy_checkers',
        label: 'Бойові шашки 8х8',
        icon: '🔴',
        themeColor: 'text-rose-300',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2b1210]',
        keeperQuote: '«Бойові шашки 8х8: 12 шашок у війську, рух вперед та вбік, двобої на костях d20, прорив у дамки (+1 АТК/+1 ЗАХ) та декомпресія за 20 XP!»',
        btnLabel: 'Зіграти в Бойові Шашки (8х8)',
        btnColor: 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 text-white font-black'
    },
    {
        id: 'toy_checkers_10x10',
        label: 'Бойові шашки 10х10',
        icon: '🔴',
        themeColor: 'text-rose-400',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2b1210]',
        keeperQuote: '«Бойові шашки 10х10: 20 шашок у війську (4 ряди), розширений фронт, двобої на костях d20, прорив у дамки та декомпресія за 20 XP!»',
        btnLabel: 'Зіграти в Бойові Шашки (10х10)',
        btnColor: 'bg-gradient-to-r from-rose-600 via-red-700 to-amber-600 hover:from-rose-500 text-white font-black'
    },
    {
        id: 'toy_checkers_12x12',
        label: 'Бойові шашки 12х12',
        icon: '🔴',
        themeColor: 'text-rose-500',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2b1210]',
        keeperQuote: '«Бойові шашки 12х12: 30 шашок у війську (5 рядів), велика шашкова битва, двобої на костях d20, прорив у дамки та декомпресія за 20 XP!»',
        btnLabel: 'Зіграти в Бойові Шашки (12х12)',
        btnColor: 'bg-gradient-to-r from-rose-700 via-red-800 to-amber-700 hover:from-rose-600 text-white font-black'
    },
    {
        id: 'toy_checkers_classic',
        label: 'Шашкові бойові шашки 8х8',
        icon: '🔴',
        themeColor: 'text-rose-400',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2b1210]',
        keeperQuote: '«Гра бойовими шашками 8х8 за правилами класичних шашкових ходів та стрибків, але з кожним взяттям через двобій d20!»',
        btnLabel: 'Зіграти в Шашкові Бойові Шашки (8х8)',
        btnColor: 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 text-white font-black'
    },
    {
        id: 'toy_pawns',
        label: 'Бойові пішаки 8х8',
        icon: '♟️',
        themeColor: 'text-indigo-300',
        badgeBg: 'bg-indigo-950/40 border-indigo-500/40',
        borderActive: 'border-indigo-400 bg-[#1f1a2e]',
        keeperQuote: '«Бойові пішаки 8х8: 3 суцільні ряди (24 пішаки), двобої на костях d20, +1 XP за кожну перемогу, досягнення ліній ворога та декомпресія за 20 XP!»',
        btnLabel: 'Зіграти в Бойові Пішаки (8х8)',
        btnColor: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 text-white font-black'
    },
    {
        id: 'toy_pawns_10x10',
        label: 'Бойові пішаки 10х10',
        icon: '♟️',
        themeColor: 'text-indigo-400',
        badgeBg: 'bg-indigo-950/40 border-indigo-500/40',
        borderActive: 'border-indigo-400 bg-[#1f1a2e]',
        keeperQuote: '«Бойові пішаки 10х10: 4 суцільні ряди (40 пішаків), двобої на костях d20, прорив фронту та декомпресія за 20 XP!»',
        btnLabel: 'Зіграти в Бойові Пішаки (10х10)',
        btnColor: 'bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-600 hover:from-indigo-500 text-white font-black'
    },
    {
        id: 'toy_pawns_12x12',
        label: 'Бойові пішаки 12х12',
        icon: '♟️',
        themeColor: 'text-indigo-500',
        badgeBg: 'bg-indigo-950/40 border-indigo-500/40',
        borderActive: 'border-indigo-400 bg-[#1f1a2e]',
        keeperQuote: '«Бойові пішаки 12х12: 5 суцільних рядів (60 пішаків), грандіозна пішакова битва, d20 двобої та декомпресія за 20 XP!»',
        btnLabel: 'Зіграти в Бойові Пішаки (12х12)',
        btnColor: 'bg-gradient-to-r from-indigo-700 via-purple-800 to-pink-700 hover:from-indigo-600 text-white font-black'
    },
    {
        id: 'fantasy_adventure',
        label: 'Фантастичні пригоди',
        icon: '📜',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#251d16]',
        keeperQuote: '«Вирушайте у небезпечні таємничі землі, повні пригод та випробувань! Доля чекає на тих, хто не боїться ризикувати!»',
        btnLabel: 'Розпочати Фантастичні Пригоди',
        btnColor: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 text-stone-950 font-black'
    },
    {
        id: 'wizard_battle',
        label: 'Бій чаклунів',
        icon: '🧙‍♂️',
        themeColor: 'text-purple-300',
        badgeBg: 'bg-purple-950/40 border-purple-500/40',
        borderActive: 'border-purple-400 bg-[#241233]',
        keeperQuote: '«Бій чаклунів: 3 HP, магічний двобій всліпу! Обирайте атакуюче закляття (3 слабких, 1 середнє, 1 сильне) або захист. Переможе той, хто розрахує тактику заклять!»',
        btnLabel: 'Розпочати Бій Чаклунів',
        btnColor: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 text-white font-black'
    },
    {
        id: 'wizard_tournament',
        label: 'Турнір Чаклунів (16 магів)',
        icon: '🏆🧙‍♂️',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2b1f14]',
        keeperQuote: '«Грандіозний Кубок Архімага! 16 верховних магів у сітці на вибування (1/8, 1/4, півфінал, фінал) за правилами Бою Чаклунів. Здобудьте Кубок Архімага!»',
        btnLabel: 'Вступити в Турнір 16 Магів',
        btnColor: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-purple-600 hover:from-amber-400 text-stone-950 font-black'
    },
    {
        id: 'magic_pawns',
        label: 'Магічні бойові пішаки 8х8',
        icon: '🧙‍♂️♟️',
        themeColor: 'text-indigo-300',
        badgeBg: 'bg-indigo-950/40 border-indigo-500/40',
        borderActive: 'border-indigo-400 bg-[#1a172e]',
        keeperQuote: '«Магічні Бойові Пішаки 8х8: 24 магічні пішаки (3 ряди) по 2 HP! Двобої вирішуються за правилами Бою Чаклунів. Купуйте в магазині та декомпресуйте за 20 XP!»',
        btnLabel: 'Грати в Магічні Пішаки (8х8)',
        btnColor: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 text-white font-black'
    },
    {
        id: 'magic_pawns_10x10',
        label: 'Магічні бойові пішаки 10х10',
        icon: '🧙‍♂️♟️',
        themeColor: 'text-purple-400',
        badgeBg: 'bg-purple-950/40 border-purple-500/40',
        borderActive: 'border-purple-400 bg-[#1a172e]',
        keeperQuote: '«Магічні Бойові Пішаки 10х10: 40 магічних пішаків (4 ряди) по 2 HP! Грандіозні чаклунські дуелі на великій дошці!»',
        btnLabel: 'Грати в Магічні Пішаки (10х10)',
        btnColor: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 text-white font-black'
    },
    {
        id: 'magic_pawns_12x12',
        label: 'Магічні бойові пішаки 12х12',
        icon: '🧙‍♂️♟️',
        themeColor: 'text-purple-500',
        badgeBg: 'bg-purple-950/40 border-purple-500/40',
        borderActive: 'border-purple-400 bg-[#1a172e]',
        keeperQuote: '«Магічні Бойові Пішаки 12х12: 60 магічних пішаків (5 рядів) по 2 HP! Монументальна війна чаклунських орденів!»',
        btnLabel: 'Грати в Магічні Пішаки (12х12)',
        btnColor: 'bg-gradient-to-r from-purple-700 via-indigo-800 to-pink-700 hover:from-purple-600 text-white font-black'
    },
    {
        id: 'battle_pawns_6x12',
        label: 'Битва Пішаків 6х12: Мечі та Магія',
        icon: '⚔️🔮♟️',
        themeColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#261912]',
        keeperQuote: '«Шахівниця 6х12! Кожен виставляє по 6 бойових та 6 магічних пішаків (по 20 HP). Усі ходять прямо: бійці б\'ють по діагоналі, а маги — через одну клітинку! При атаці кидається 1d10 і стільки монет, а різниця орлів наносить пошкодження!»',
        btnLabel: 'Грати в Битву Пішаків (6х12)',
        btnColor: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-purple-700 hover:from-amber-500 text-stone-950 font-black'
    },
    {
        id: 'checkers',
        label: 'Шашки',
        icon: '♟️',
        themeColor: 'text-purple-300',
        badgeBg: 'bg-purple-950/40 border-purple-500/40',
        borderActive: 'border-purple-400 bg-[#25152b]',
        keeperQuote: '«Англійські класичні шашки (8x8): обов\'язкові взяття, прорив у дамки та бездоганний розрахунок!»',
        btnLabel: 'Сісти за шахівницю',
        btnColor: 'bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 text-white'
    },
    {
        id: 'senet',
        label: 'Сенет',
        icon: '🏺',
        themeColor: 'text-orange-300',
        badgeBg: 'bg-orange-950/40 border-orange-500/40',
        borderActive: 'border-orange-400 bg-[#2b1b14]',
        keeperQuote: '«Священна давньоєгипетська гра 30 клітинок: палички долі, Дім Краси та Дім Відродження!»',
        btnLabel: 'Зіграти в Сенет',
        btnColor: 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 text-white'
    },
    {
        id: 'ur',
        label: 'Гра Ур',
        icon: '👑',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#251d16]',
        keeperQuote: '«Королівська гра Ур: найдавніша гра шумерських царів! Чотири тетраедри, спільний міст і священні розетки!»',
        btnLabel: 'Зіграти в Королівську гру Ур',
        btnColor: 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-black'
    },
    {
        id: 'mehen',
        label: 'Мехен',
        icon: '🐍',
        themeColor: 'text-orange-300',
        badgeBg: 'bg-orange-950/40 border-orange-500/40',
        borderActive: 'border-orange-500 bg-[#2b1710]',
        keeperQuote: '«Священний змій Мехен: проведіть чотирьох соколів спіраллю з 36 кілець прямо до Голови Змія!»',
        btnLabel: 'Зіграти в Мехен',
        btnColor: 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 text-white'
    },
    {
        id: 'aseb',
        label: 'Асеб',
        icon: '📐',
        themeColor: 'text-yellow-300',
        badgeBg: 'bg-yellow-950/40 border-yellow-500/40',
        borderActive: 'border-yellow-400 bg-[#241c12]',
        keeperQuote: '«Асеб (Гра двадцяти клітинок): царська злітна смуга фараонів Нового Царства, розетки та вибивання!»',
        btnLabel: 'Зіграти в Асеб',
        btnColor: 'bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-500 hover:from-yellow-400 text-black'
    },
    {
        id: 'brawl',
        label: 'Кулачний бій',
        icon: '🥊',
        themeColor: 'text-rose-300',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-500 bg-[#2c1412]',
        keeperQuote: '«Справжній кулачний бій! Зони ударів, блоки, 1d20 + Спритність і чиста богатирська міць!»',
        btnLabel: 'Вийти на кулачний ринг',
        btnColor: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 text-white'
    },
    {
        id: 'fencing_sword_shield',
        label: 'Фехтування: Меч і щит',
        icon: '🛡️⚔️',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#251b14]',
        keeperQuote: '«Лицарський турнір з фехтування на мечах та щитах! Блокуйте удари щитом без втрати здоров\'я (+4 до шкоди клинка)!»',
        btnLabel: 'Турнір: Меч і щит',
        btnColor: 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 text-stone-950 font-bold'
    },
    {
        id: 'fencing_sword_only',
        label: 'Фехтування: Меч без щита',
        icon: '⚔️',
        themeColor: 'text-rose-300',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2c1412]',
        keeperQuote: '«Двобій на чистих мечах без щитів! Вища шкода (+5), але при блоці ви отримуєте половину шкоди!»',
        btnLabel: 'Турнір: Меч без щита',
        btnColor: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold'
    },
    {
        id: 'durak_52_2trumps',
        label: 'Дурень 52 (2 козирі)',
        icon: '🎴',
        themeColor: 'text-purple-300',
        badgeBg: 'bg-purple-950/40 border-purple-500/40',
        borderActive: 'border-purple-400 bg-[#25152b]',
        keeperQuote: '«Дурень на 52 карти з двома козирними мастями! Два козирі подвоюють тактичні комбінації!»',
        btnLabel: 'Зіграти (52 карти, 2 козирі)',
        btnColor: 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 text-white'
    },
    {
        id: 'durak_52_2trumps_plus1trump',
        label: 'Дурень 52 (2 козирі + 1 априорно козирна масть)',
        icon: '✨',
        themeColor: 'text-yellow-300',
        badgeBg: 'bg-yellow-950/40 border-yellow-500/40',
        borderActive: 'border-yellow-400 bg-[#2b2514]',
        keeperQuote: '«Дурень [g14]: 2 козирі обираються з 4 стандартних мастей, а до колоди додано 5-ту масть (⭐ Зірка, 65 карт), яка є апріорно козирною і у виборі козиря не бере участі!»',
        btnLabel: 'Зіграти в g14 (2 козирі + 1 априорно козирна масть)',
        btnColor: 'bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 text-black'
    },
    {
        id: 'durak_52_2trumps_plus2trumps',
        label: 'Дурень 52 (2 козирі + 2 априорно козирні масті)',
        icon: '🔥',
        themeColor: 'text-rose-300',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2c1412]',
        keeperQuote: '«Дурень [g15]: 2 козирі обираються з 4 стандартних мастей, а до колоди додано 2 нові масті (⭐ Зірка та 🌙 Місяць, 78 карт), які є апріорно козирними і у виборі козиря не беруть участі!»',
        btnLabel: 'Зіграти в g15 (2 козирі + 2 априорно козирні масті)',
        btnColor: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white'
    },
    {
        id: 'durak_52_2trumps_plus2suits',
        label: 'Дурень 52 (2 козирі + 2 масті)',
        icon: '🌟',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#251d16]',
        keeperQuote: '«Дурень на 52 карти з 2 козирями + 2 додаткові масті: 6 мастей (78 карт: ♠, ♥, ♦, ♣ + ⭐ Зірки + 🌙 Місяці) з двома козирями!»',
        btnLabel: 'Зіграти (2 козирі + 2 масті, 78 карт)',
        btnColor: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-500 hover:from-amber-500 text-black font-bold'
    },
    {
        id: 'durak_52_2trumps_plus1suit',
        label: 'Дурень 52 (2 козирі + 1 додаткова масть)',
        icon: '⭐',
        themeColor: 'text-cyan-300',
        badgeBg: 'bg-cyan-950/40 border-cyan-500/40',
        borderActive: 'border-cyan-400 bg-[#12252b]',
        keeperQuote: '«Дурень на 52 карти з 2 козирями + 1 додаткова масть: 5 мастей (65 карт: ♠, ♥, ♦, ♣ + ⭐ Зірки) з двома козирями!»',
        btnLabel: 'Зіграти (2 козирі + 1 масть, 65 карт)',
        btnColor: 'bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 text-white font-bold'
    },
    {
        id: 'french_tarot',
        label: 'Французьке Таро',
        icon: '🔮',
        themeColor: 'text-fuchsia-300',
        badgeBg: 'bg-fuchsia-950/40 border-fuchsia-500/40',
        borderActive: 'border-fuchsia-400 bg-[#2b1528]',
        keeperQuote: '«Класичне Французьке Таро на 78 карт (Jeu de Tarot): 21 козир, 3 Удлери (Кінці), торги за контракти Prise/Garde, прикуп "Собака" та розіграш взяток на 4 гравці!»',
        btnLabel: 'Зіграти у Французьке Таро',
        btnColor: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 text-white'
    },
    {
        id: 'blackjack',
        label: 'Блек Джек',
        icon: '🃏',
        themeColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/40 border-emerald-500/40',
        borderActive: 'border-emerald-400 bg-[#14261d]',
        keeperQuote: '«Класичний Блек Джек до 21! Зберіть двадцять одне очко або змусьте дилера перебрати!»',
        btnLabel: 'Зіграти в Блек Джек',
        btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white'
    },
    {
        id: 'blackjack_dice',
        label: 'Блек Джек на кубиках',
        icon: '🎲',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#251d16]',
        keeperQuote: '«Блек Джек на кубиках (Blackjack Dice): кидайте кістки, набирайте 21 очко без перебору!»',
        btnLabel: 'Зіграти в Blackjack Dice',
        btnColor: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-black'
    },
    {
        id: 'steeplechase',
        label: 'Перегони з перешкодами',
        icon: '🐎',
        themeColor: 'text-orange-300',
        badgeBg: 'bg-orange-950/40 border-orange-500/40',
        borderActive: 'border-orange-400 bg-[#2b1b14]',
        keeperQuote: '«Кінні перегони з перешкодами (Steeplechase) проти 8 супротивників! Кидки 1d20 + Спритність + їзда проти зростаючої складності кожні 100м!»',
        btnLabel: 'Почати Steeplechase (2000м)',
        btnColor: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white font-bold'
    },
    {
        id: 'flat_horse_race',
        label: 'Кінні скачки 2000м',
        icon: '🏇',
        themeColor: 'text-yellow-300',
        badgeBg: 'bg-yellow-950/40 border-yellow-500/40',
        borderActive: 'border-yellow-400 bg-[#2b2514]',
        keeperQuote: '«Кінні скачки (Flat Race) проти 8 супротивників! Кидки 1d20 + Спритність + їзда кожні 100м. Переможець той, хто за 2000м набрав більше очок!»',
        btnLabel: 'Почати кінні скачки (2000м)',
        btnColor: 'bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 text-black font-black'
    },
    {
        id: 'mounted_archery',
        label: 'Кінна стрільба',
        icon: '🏹',
        themeColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/40 border-emerald-500/40',
        borderActive: 'border-emerald-400 bg-[#122b1c]',
        keeperQuote: '«Кінні перегони зі стрільбою проти 8 супротивників! Кидки швидкості + стрільба в мішень кожні 100м (DC = 17 + N кроку + 1d4: влучання +10, промах -10 очок)!»',
        btnLabel: 'Почати кінну стрільбу (2000м)',
        btnColor: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-500 text-white font-black'
    },
    {
        id: 'archery',
        label: 'Стрільба з лука',
        icon: '🎯',
        themeColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/40 border-emerald-500/40',
        borderActive: 'border-emerald-400 bg-[#122b1c]',
        keeperQuote: '«Турнір стрільців таверни! Оберіть приціл 1-10: врахуйте похибку відстані 1d4, вітру 1d6 та вашу спритність! 1-12 очок!»',
        btnLabel: 'Стрілецький турнір',
        btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold'
    },
    {
        id: 'jousting',
        label: 'Лицарський Джостинг',
        icon: '🏇',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2c1d10]',
        keeperQuote: '«Лицарський турнір на конях та списах! 3 зіткнення: збийте суперника з коня або нанесіть більше нищівної шкоди!»',
        btnLabel: 'Лицарський Джостинг',
        btnColor: 'bg-gradient-to-r from-red-600 via-amber-600 to-yellow-600 hover:from-red-500 text-white font-black'
    },
    {
        id: 'chess_standard',
        label: 'Класичні Шахи',
        icon: '♔',
        themeColor: 'text-indigo-300',
        badgeBg: 'bg-indigo-950/40 border-indigo-500/40',
        borderActive: 'border-indigo-400 bg-[#171a2e]',
        keeperQuote: '«Класична Європейська шахівниця 8x8 з Ферзем, Турами, Слонами, Конями та рокіровками!»',
        btnLabel: 'Зіграти в Класичні Шахи',
        btnColor: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white font-bold'
    },
    {
        id: 'shatranj',
        label: 'Шатрандж',
        icon: '♚',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2b2114]',
        keeperQuote: '«Перський Шатрандж VI століття: Алфіл (Слон-стрибун на 2) та Фарзін (Візирь на 1) - прабатьки шахів!»',
        btnLabel: 'Зіграти в Шатрандж',
        btnColor: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-black font-bold'
    },
    {
        id: 'chaturanga',
        label: 'Чатуранга',
        icon: '🐘',
        themeColor: 'text-orange-300',
        badgeBg: 'bg-orange-950/40 border-orange-500/40',
        borderActive: 'border-orange-400 bg-[#2b1a14]',
        keeperQuote: '«Давньоіндійська Чатуранга V століття: Раджа, Гаджа (Слон), Ратха (Колісниця) та Ашва (Кінь)!»',
        btnLabel: 'Зіграти в Чатурангу',
        btnColor: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white font-bold'
    },
    {
        id: 'chaturaji',
        label: 'Чатураджі (Човни)',
        icon: '⛵',
        themeColor: 'text-sky-300',
        badgeBg: 'bg-sky-950/40 border-sky-500/40',
        borderActive: 'border-sky-400 bg-[#12232e]',
        keeperQuote: '«Індійські Чатураджі: гра з Наукою (Човном), що стрибає на 2 діагоналі через фігури!»',
        btnLabel: 'Зіграти в Чатураджі',
        btnColor: 'bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 text-white font-bold'
    },
    {
        id: 'tamerlane',
        label: 'Шахи Тамерлана',
        icon: '🦒',
        themeColor: 'text-yellow-300',
        badgeBg: 'bg-yellow-950/40 border-yellow-500/40',
        borderActive: 'border-yellow-400 bg-[#2a2412]',
        keeperQuote: '«Шахи Великого Тимура (10x11): 110 клітинок, Жирафи, Верблюди, Даббаби та Загубники!»',
        btnLabel: 'Зіграти в Шахи Тамерлана',
        btnColor: 'bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-600 hover:from-yellow-500 text-black font-extrabold'
    },
    {
        id: 'courier',
        label: 'Кур\'єрські Шахи',
        icon: '📜',
        themeColor: 'text-purple-300',
        badgeBg: 'bg-purple-950/40 border-purple-500/40',
        borderActive: 'border-purple-400 bg-[#20142b]',
        keeperQuote: '«Німецькі Кур\'єрські Шахи (12x8): надшвидкий Кур\'єр, Людина та Блазень на широкому полі!»',
        btnLabel: 'Зіграти в Кур\'єрські Шахи',
        btnColor: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 text-white font-bold'
    },
    {
        id: 'capablanca',
        label: 'Шахи Капабланки',
        icon: '🦄',
        themeColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/40 border-emerald-500/40',
        borderActive: 'border-emerald-400 bg-[#12281e]',
        keeperQuote: '«Шахи Капабланки 10x8: Архієпископ (Слон+Кінь) та Канцлер (Тура+Кінь)!»',
        btnLabel: 'Зіграти в Шахи Капабланки',
        btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold'
    },
    {
        id: 'carrera',
        label: 'Шахи Карери',
        icon: '🛡️',
        themeColor: 'text-rose-300',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#281318]',
        keeperQuote: '«Італійські Шахи П\'єтро Карери 1617 року (10x8): Центавр та Чемпіон!»',
        btnLabel: 'Зіграти в Шахи Карери',
        btnColor: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold'
    },
    {
        id: 'grasshopper',
        label: 'Шахи з Коником',
        icon: '🦗',
        themeColor: 'text-teal-300',
        badgeBg: 'bg-teal-950/40 border-teal-500/40',
        borderActive: 'border-teal-400 bg-[#122825]',
        keeperQuote: '«Казкові шахи з Кониками (Grasshopper Chess 8x8): Коники стрибають через 1 фігуру!»',
        btnLabel: 'Зіграти в Шахи з Коником',
        btnColor: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 text-white font-bold'
    },
    {
        id: 'cheskers',
        label: 'Шашмати (Cheskers)',
        icon: '🎲♟️',
        themeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2b1f14]',
        keeperQuote: '«Шашмати Соломона Голомба (1948 р.): унікальний гібрид шашок та шахів! Стрибки пішаків та королів разом із Верблюдами й Слонами!»',
        btnLabel: 'Зіграти в Шашмати',
        btnColor: 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 hover:from-amber-500 text-stone-950 font-black'
    },
    {
        id: 'archchess',
        label: 'Шахи Аркчес (Archchess)',
        icon: '⚔️♟️',
        themeColor: 'text-rose-400',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2d1b1f]',
        keeperQuote: '«Легендарні шахи Аркчес 10x10! Центуріони зі стрибками лицаря та подвійними кроками, спритні Декуріони та унікальні правила двокрокових пішаків!»',
        btnLabel: 'Зіграти в Аркчес',
        btnColor: 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 text-white font-black'
    },
    {
        id: 'archcourier',
        label: 'Шахи Архкур\'єр (ArchCourier Chess)',
        icon: '⚡♟️',
        themeColor: 'text-sky-400',
        badgeBg: 'bg-sky-950/40 border-sky-500/40',
        borderActive: 'border-sky-400 bg-[#16252d]',
        keeperQuote: '«Дивовижні шахи Архкур\'єр 12x8! Відчуйте міць нових величних фігур: Охоронця, Герцога, спритної Білки та винахідливого Архкур\'єра!»',
        btnLabel: 'Зіграти в Архкур\'єр',
        btnColor: 'bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 text-white font-bold'
    },
    {
        id: 'senterej',
        label: 'Сентереж (Ефіопські Шахи)',
        icon: '👑🇪🇹',
        themeColor: 'text-yellow-400',
        badgeBg: 'bg-yellow-950/40 border-yellow-500/40',
        borderActive: 'border-yellow-400 bg-[#2d2817]',
        keeperQuote: '«Ефіопський Сентереж: швидка фаза "верра" (мобілізації), де ходи робляться одночасно до першого взяття!»',
        btnLabel: 'Зіграти в Сентереж',
        btnColor: 'bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-500 hover:from-yellow-400 text-stone-950 font-bold'
    },
    {
        id: 'al_adli',
        label: 'Шахи Аль-Адлі',
        icon: '📜🇮🇳',
        themeColor: 'text-orange-400',
        badgeBg: 'bg-orange-950/40 border-orange-500/40',
        borderActive: 'border-orange-400 bg-[#2d1e17]',
        keeperQuote: '«Індійська версія шахів Аль-Адлі IX століття: Даббаби охороняють коней на флангах, а пішаки рухаються покроково!»',
        btnLabel: 'Зіграти в Аль-Адлі',
        btnColor: 'bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-600 hover:from-orange-500 text-white font-bold'
    },
    {
        id: 'sittuyin',
        label: 'Сіттуїн (Бірманські Шахи)',
        icon: '♟️🇲🇲',
        themeColor: 'text-rose-400',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2d1b1f]',
        keeperQuote: '«М\'янманські шахи Сіттуїн: пішаки розставлені на полі заздалегідь, а фігури розташовуються вільно позаду них!»',
        btnLabel: 'Зіграти в Сіттуїн',
        btnColor: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold'
    },
    {
        id: 'makruk',
        label: 'Макрук (Тайські Шахи)',
        icon: '♟️🇹🇭',
        themeColor: 'text-indigo-400',
        badgeBg: 'bg-indigo-950/40 border-indigo-500/40',
        borderActive: 'border-indigo-400 bg-[#161a2d]',
        keeperQuote: '«Тайський Макрук: пішаки стоять на третій лінії, а ферзі й слони мають витончені, але обмежені ходи!»',
        btnLabel: 'Зіграти в Макрук',
        btnColor: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white font-bold'
    },
    {
        id: 'shatar',
        label: 'Шатар (Монгольські Шахи)',
        icon: '🐎🇲🇳',
        themeColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#251d14]',
        keeperQuote: '«Монгольський Шатар: Берс (Король драконів) б\'ється на боці правителя, а верблюди стрибають замість слонів!»',
        btnLabel: 'Зіграти в Шатар',
        btnColor: 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 hover:from-amber-500 text-stone-950 font-black'
    },
    {
        id: 'xiangqi',
        label: 'Сянци (Китайські Шахи)',
        icon: '🏮🇨🇳',
        themeColor: 'text-red-400',
        badgeBg: 'bg-red-950/40 border-red-500/40',
        borderActive: 'border-red-400 bg-[#2d1416]',
        keeperQuote: '«Китайські Сянци: Гармати стріляють через фігури, Радники не виходять з палацу, а Слони не переходять річку!»',
        btnLabel: 'Зіграти в Сянци',
        btnColor: 'bg-gradient-to-r from-red-600 via-orange-600 to-rose-600 hover:from-red-500 text-white font-bold'
    },
    {
        id: 'janggi',
        label: 'Чангі (Корейські Шахи)',
        icon: '⚔️🇰🇷',
        themeColor: 'text-blue-400',
        badgeBg: 'bg-blue-950/40 border-blue-500/40',
        borderActive: 'border-blue-400 bg-[#141b2d]',
        keeperQuote: '«Корейські Чангі: величезні Слони з довгим стрибком, маневрені Генерали у палаці та відсутність річки!»',
        btnLabel: 'Зіграти в Чангі',
        btnColor: 'bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 text-white font-bold'
    },
    {
        id: 'heian_shogi',
        label: 'Хеян Сьогі (Давні Сьогі)',
        icon: '🏯🇯🇵',
        themeColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/40 border-emerald-500/40',
        borderActive: 'border-emerald-400 bg-[#12281c]',
        keeperQuote: '«Ранні японські Хеян Сьогі 8x8: Списи рвуться вперед, Срібні та Золоті генерали охороняють Імператора!»',
        btnLabel: 'Зіграти в Хеян Сьогі',
        btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold'
    },
    {
        id: 'sho_shogi',
        label: 'Шо Сьогі (Малі Сьогі)',
        icon: '🏮🇯🇵',
        themeColor: 'text-teal-400',
        badgeBg: 'bg-teal-950/40 border-teal-500/40',
        borderActive: 'border-teal-400 bg-[#122825]',
        keeperQuote: '«Шо Сьогі: історичний варіант з унікальним П\'яним Слоном, який при просуванні стає Кронпринцем!»',
        btnLabel: 'Зіграти в Шо Сьогі',
        btnColor: 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 text-white font-bold'
    },
    {
        id: 'shogi',
        label: 'Сьогі (Сучасні Японські Шахи)',
        icon: '🏯🎌',
        themeColor: 'text-cyan-400',
        badgeBg: 'bg-cyan-950/40 border-cyan-500/40',
        borderActive: 'border-cyan-400 bg-[#12252d]',
        keeperQuote: '«Класичні японські Сьогі 9x9: перетворюйте свої фігури на ворожій території та захоплюйте полонених!»',
        btnLabel: 'Зіграти в Сьогі',
        btnColor: 'bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 text-white font-bold'
    },
    {
        id: 'napoleonic',
        label: 'Класичні Наполеонівські Шахи (14x14)',
        icon: '🇫🇷♟️',
        themeColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2b1f14]',
        keeperQuote: '«Класичні Наполеонівські Шахи 14x14: 12 родів військ (Маршал, Гвардія, Драгуни, Артилерія, Беролінські пішаки) на тактичній карті з річкою та мостами!»',
        btnLabel: 'Зіграти в Наполеонівські Шахи 14x14',
        btnColor: 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 text-stone-950 font-black'
    },
    {
        id: 'fide_napoleonic',
        label: 'Наполеонівські Шахи FIDE (8x8)',
        icon: '🎖️♟️',
        themeColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/40 border-amber-500/40',
        borderActive: 'border-amber-400 bg-[#2b1f14]',
        keeperQuote: '«Класичний військово-тактичний варіант 8x8 з Артилерією, Кавалерією, Гвардією, Маршалом та Імператором!»',
        btnLabel: 'Зіграти в FIDE Наполеон',
        btnColor: 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 text-stone-950 font-black'
    },
    {
        id: 'napoleon_ottomans',
        label: 'Наполеон і Османи (10x10)',
        icon: '⚔️🕌',
        themeColor: 'text-rose-400',
        badgeBg: 'bg-rose-950/40 border-rose-500/40',
        borderActive: 'border-rose-400 bg-[#2d1b1f]',
        keeperQuote: '«Великі шахи 10x10: Французька імперська армія проти Османських військ Султана за правилами Великих Турецьких Шахів!»',
        btnLabel: 'Зіграти Наполеон vs Османи',
        btnColor: 'bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-500 text-white font-black'
    },
    {
        id: 'bachelor',
        label: 'Шахи Холостяка (Bachelor Chess 7x6)',
        icon: '💍♟️',
        themeColor: 'text-pink-400',
        badgeBg: 'bg-pink-950/40 border-pink-500/40',
        borderActive: 'border-pink-400 bg-[#2d1522]',
        keeperQuote: '«Шахи Холостяка 7x6: Король шукає собі наречену! Досягніть сусідньої клітинки з Королевою, щоб зіграти весілля та здобути миттєву перемогу!»',
        btnLabel: 'Зіграти в Шахи Холостяка',
        btnColor: 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 text-white font-black'
    }
];

export const ACTIVITIES: ActivityConfig[] = RAW_ACTIVITIES.map((act, idx) => ({
    ...act,
    codeName: `g${idx}`
}));

export function TavernModal({
    settlement,
    tavern,
    progress,
    onUpdateProgress,
    onChallengeOpponent,
    onChallengeBrawl,
    onChallengeClassicDurak,
    onChallengeDicePoker,
    onChallengeTavernDice,
    onChallengeCoinFlip,
    onChallengeD20Dice,
    onChallengePotionRoulette,
    onChallengeLabyrinth,
    onChallengeTreasureHunter,
    onChallengeDiceDuel,
    onChallengeDiceDuelTournament,
    onChallengeCheckers,
    onChallengeSenet,
    onChallengeUr,
    onChallengeMehen,
    onChallengeAseb,
    onChallengeFencingSwordShield,
    onChallengeFencingSwordOnly,
    onChallengeFrenchTarot,
    onChallengeBlackjack,
    onChallengeBlackjackDice,
    onChallengeSteeplechase,
    onChallengeFlatRace,
    onChallengeMountedArchery,
    onChallengeArchery,
    onChallengeJousting,
    onChallengeChess,
    onChallengeToySoldiers,
    onChallengeArmyBattle,
    onChallengeCheckersWar,
    onChallengeRpgArmyCheckers,
    onChallengeToyCheckers,
    onChallengeToyPawns,
    onChallengeWizardBattle,
    onChallengeWizardTournament,
    onChallengeMagicPawns,
    onChallengeBattlePawns6x12,
    onOpenToyShop,
    onOpenDecompressionMaster,
    onOpenCardMaster,
    onOpenCharacterModal,
    onOpenQuests,
    onBackToSettlement,
    onCloseToMap
}: TavernModalProps) {
    // Current active activity among 11 possibilities
    const [activeActivity, setActiveActivity] = useState<TavernActivityType>('rpg_cards');
    // Tier tab within the current activity: Contenders vs Champions vs Retired NPCs
    const [activeTier, setActiveTier] = useState<'contenders' | 'champions' | 'retired_npcs'>('contenders');
    // Primary tab: Alcohol Bar vs Games vs Food vs Rooms vs Music vs NPCs
    const [mainMode, setMainMode] = useState<'games' | 'bar' | 'food' | 'room' | 'music' | 'npcs'>('bar');
    // NPC Department category filter
    const [npcCategoryFilter, setNpcCategoryFilter] = useState<'all' | 'staff' | 'guests' | 'retired' | 'players'>('all');

    // Music & Violinist States
    const synthPlayer = useMemo(() => new ViolinSynthPlayer(), []);
    const [customNotes, setCustomNotes] = useState<string>('E4:0.5 G4:0.5 A4:0.5 B4:1.0 B4:0.5 A4:0.5 B4:0.5 C5:0.5 B4:1.5');
    const [musicBpm, setMusicBpm] = useState<number>(100);
    const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
    const [isPlayingMelody, setIsPlayingMelody] = useState<boolean>(false);
    const [playingMelodyId, setPlayingMelodyId] = useState<string | null>(null);
    const [pianoKeysHistory, setPianoKeysHistory] = useState<string[]>([]);
    const [showNotesHelper, setShowNotesHelper] = useState<boolean>(false);
    const [showClassGuideModal, setShowClassGuideModal] = useState<boolean>(false);

    const [drinkToast, setDrinkToast] = useState<{ message: string; type: 'success' | 'error'; icon: string } | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Alcohol category filter
    const [drinkCategoryFilter, setDrinkCategoryFilter] = useState<'all' | 'beer' | 'wine'>('all');
    // Player drunkenness meter (0-100%)
    const [drunkLevel, setDrunkLevel] = useState<number>(0);

    const showToast = useCallback((toast: { message: string; type: 'success' | 'error'; icon: string }) => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setDrinkToast(toast);
        toastTimerRef.current = setTimeout(() => {
            setDrinkToast(null);
            toastTimerRef.current = null;
        }, 4000);
    }, []);

    // Stop and dispose playback on unmount or mode switch
    useEffect(() => {
        return () => {
            synthPlayer.stop();
        };
    }, [synthPlayer, mainMode]);

    useEffect(() => {
        return () => {
            synthPlayer.dispose();
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, [synthPlayer]);

    // Get deterministic alcohol menu for this tavern (5-10 beers, 4-8 wines)
    const alcoholMenu = getTavernAlcoholMenu(tavern.id);
    const foodMenu = getTavernFoodMenu(tavern.id);

    // Active NPC dialogue state
    const [talkingNpc, setTalkingNpc] = useState<{
        opponent: any;
        dialogue: { quote: string; loreTip: string; toastQuote: string };
    } | null>(null);

    // NPC relationship states & helpers
    const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);

    // Auto-Purchase Prompt state for checkers & figurines
    const [autoPurchasePrompt, setAutoPurchasePrompt] = useState<{
        opp: OpponentData;
        activity: string;
        req: FigurineRequirement;
    } | null>(null);

    const getAttitudeDetails = (score: number) => {
        if (score < 20) return { text: 'Вороже', colorClass: 'text-red-400', barColorClass: 'bg-red-500', face: '😠' };
        if (score < 40) return { text: 'Прохолодне', colorClass: 'text-amber-500', barColorClass: 'bg-amber-600', face: '🤨' };
        if (score < 60) return { text: 'Нейтральне', colorClass: 'text-stone-400', barColorClass: 'bg-stone-500', face: '😐' };
        if (score < 80) return { text: 'Дружнє', colorClass: 'text-emerald-400', barColorClass: 'bg-emerald-500', face: '🙂' };
        return { text: 'Шанобливе', colorClass: 'text-yellow-400', barColorClass: 'bg-yellow-500', face: '🤩' };
    };

    const getCustomNpcDialogue = (
        opponent: OpponentData,
        tavernName: string,
        settlementName: string,
        activityType: TavernActivityType,
        score: number
    ) => {
        const activityNames: Record<TavernActivityType, string> = {
            rpg_cards: 'картярські дуелі',
            brawl: 'кулачні бої',
            classic_durak_36: 'класичного дурня на 36 карт',
            classic_durak_52: 'великого дурня на 52 карти',
            classic_durak_54: 'дурня на 54 карти (з 2 джокерами)',
            classic_durak_56: 'дурня на 56 карт (з 4 джокерами)',
            classic_durak_minor_tarot: 'дурня на 56 Молодших арканів Таро',
            classic_durak_tarot: 'дурня на повну колоду Таро (78 карт)',
            durak_52_2trumps: 'дурня на 52 карти з двома козирями',
            durak_52_2trumps_plus1trump: 'дурня на 52 карти (2 козирі + 1 козирна масть)',
            durak_52_2trumps_plus2trumps: 'дурня на 52 карти (2 козирі + 2 козирні масті)',
            durak_52_2trumps_plus2suits: 'дурня на 52 карти (2 козирі + 2 масті)',
            durak_52_2trumps_plus1suit: 'дурня на 52 карти (2 козирі + 1 масть)',
            durak_52_3trumps: 'дурня на 52 карти (+3 козирі)',
            durak_52_4trumps: 'дурня на 52 карти (+4 козирі)',
            durak_104_2trumps: 'великого дурня на 104 карти (+2 козирі)',
            french_tarot: 'французького таро',
            blackjack: 'бледжек',
            blackjack_dice: 'бледжек на кістках',
            steeplechase: 'перегони з перешкодами',
            flat_horse_race: 'кінні перегони',
            dice_poker: 'покер на кістках',
            tavern_dice: 'тавернські кості',
            coin_flip: 'гру в монетку',
            d20_dice: 'd20 кості',
            potion_roulette: 'рулетку зілля',
            tavern_labyrinth: 'підземний лабіринт на час',
            tavern_treasure_hunter: 'шукач скарбів (платформер)',
            dice_duel: 'двобій на костях',
            dice_duel_tournament: 'турнір двобоїв на костях',
            checkers: 'шашки',
            senet: 'давній сенет',
            ur: 'Королівську гру Ур',
            mehen: 'священний мехен',
            aseb: 'асеб',
            fencing_sword_shield: 'фехтування на мечах та щитах',
            fencing_sword_only: 'фехтування на мечах без щита',
            archery: 'стрільбу з лука',
            jousting: 'лицарський джостинг',
            mounted_archery: 'кінні перегони зі стрільбою',
            chess_standard: 'класичні шахи',
            shatranj: 'перський шатрандж',
            chaturanga: 'давньоіндійську чатурангу',
            chaturaji: 'чатураджі',
            tamerlane: 'шахи Тамерлана',
            courier: 'кур\'єрські шахи',
            capablanca: 'шахи Капабланки',
            carrera: 'шахи Карери',
            grasshopper: 'шахи з коником',
            cheskers: 'шашмати',
            archchess: 'шахи Аркчес',
            archcourier: 'шахи Архкур\'єр',
            senterej: 'ефіопський сентереж',
            al_adli: 'індійські шахи Аль-Адлі',
            sittuyin: 'бірманський сіттуїн',
            makruk: 'тайський макрук',
            shatar: 'монгольський шатар',
            xiangqi: 'китайські сянци',
            janggi: 'корейські чангі',
            heian_shogi: 'давні хеян сьогі',
            sho_shogi: 'японські малі шо сьогі',
            shogi: 'японські шахи сьогі',
            napoleonic: 'класичні наполеонівські шахи (14x14)',
            fide_napoleonic: 'наполеонівські шахи FIDE (8x8)',
            napoleon_ottomans: 'шахи Наполеон і Османи (10x10)',
            bachelor: 'шахи холостяка (Bachelor Chess 7x6)',
            toy_soldiers: 'тактичну гру в солдатики (15x15)',
            army_battle: 'битву армій (16 vs 16)',
            toy_checkers: 'бойові шашки (8x8)',
            toy_checkers_10x10: 'бойові шашки (10x10)',
            toy_checkers_12x12: 'бойові шашки (12x12)',
            toy_checkers_classic: 'шашкові бойові шашки (8x8)',
            toy_pawns: 'бойові пішаки (8x8)',
            toy_pawns_10x10: 'бойові пішаки (10x10)',
            toy_pawns_12x12: 'бойові пішаки (12x12)',
            wizard_battle: 'бій чаклунів',
            wizard_tournament: 'турнір чаклунів (16 магів)',
            magic_pawns: 'магічні бойові пішаки (8x8)',
            magic_pawns_10x10: 'магічні бойові пішаки (10x10)',
            magic_pawns_12x12: 'магічні бойові пішаки (12x12)',
            battle_pawns_6x12: 'битву пішаків 6х12 (мечі та магія)',
            checkers_war: 'армійські шашки (8x8)',
            aranian_checkers_war: 'аранійські армійські шашки (8x8)',
            military_checkers: 'військові шашки (120 бійців)',
            aranian_military_checkers: 'аранійські військові шашки (120 бійців)',
            fantasy_adventure: 'фантастичні пригоди (JRPG бій)',
            rpg_army_checkers: 'рольові армійські шашки (G29)'
        };

        const gameLabel = activityNames[activityType] || 'гру';

        if (score < 20) {
            return {
                quote: `Чого тобі треба, мандрівнику? Твої витівки в «${gameLabel}» викликають у мене лише роздратування. Облиш мене в спокої!`,
                loreTip: `Цей супротивник дивиться на вас вовком. Він не бажає ділитися чутками, поки ви не завоюєте хоча б крихту його поваги.`,
                toastQuote: `«Я не питиму з тобою...» — суворо бурмоче він, відсуваючи келих.`
            };
        } else if (score < 40) {
            return {
                quote: `А, це ти... Так, я знаю, що ти граєш тут у «${gameLabel}». Але не думай, що ми друзі. Для цього треба щось більше, ніж просто перемагати.`,
                loreTip: `Кажуть, у таверні «${tavernName}» цінують щедрих гостей. Можливо, смачна страва або кухоль меду розтоплять лід?`,
                toastQuote: `«Ну, за твою впертість, мабуть...» — неохоче бурмоче він.`
            };
        } else if (score < 60) {
            return {
                quote: `Вітаю! Таверна «${tavernName}» сьогодні надзвичайно затишна. Непогане місце, щоб відпочити після напружених випробувань у ${settlementName}. Чим займаєшся?`,
                loreTip: `Шинкар по секрету розповів, що кожен здоланий суперник наближає тебе до визнання серед лицарів регіону. Продовжуй рух уперед!`,
                toastQuote: `«Будьмо! За хорошу компанію та міцні нерви!»`
            };
        } else if (score < 80) {
            return {
                quote: `О, мій любий друже! Який приємний сюрприз! Наші розмови та твої частування піднімають мені настрій кожного разу. Як твої успіхи в мандрах по ${settlementName}?`,
                loreTip: `Краєм вуха чув, що якщо добре відпочити у кімнаті таверни «${tavernName}», це повністю відновить твоє здоров'я та дасть сили на нові бої!`,
                toastQuote: `«За твою щедрість і велику душу! Хай твій гаманець ніколи не буде порожнім!»`
            };
        } else {
            return {
                quote: `Мій найдорожчий союзнику! Для мене велика честь розділити з тобою цей стіл. Твоя майстерність у «${gameLabel}» та твоє благородство відомі по всій окрузі!`,
                loreTip: `У тавернах інших міст кажуть про неймовірні скарби, але з твоїм спорядженням та вірними друзями тобі підкоряться будь-які вершини!`,
                toastQuote: `«За легендарного героя Ельдрії! За твої славні перемоги та нашу вічну міцну дружбу!»`
            };
        }
    };

    const handleTreatNpc = (item: { name: string; price: number; boost: number; icon: string; type: 'drink' | 'food' }) => {
        if (!talkingNpc) return;
        const currentNpcId = talkingNpc.opponent.id;

        if (progress.playerGold < item.price) {
            showToast({
                message: `Шинкар ${tavern.keeperName}: «Для купівлі ${item.icon} ${item.name} бракує золота! Потрібно ${item.price} зол.»`,
                type: 'error',
                icon: '🪙'
            });
            return;
        }

        const newGold = progress.playerGold - item.price;
        const currentRelationships = { ...(progress.npcRelationships || {}) };
        const oldScore = currentRelationships[currentNpcId] !== undefined ? currentRelationships[currentNpcId] : 30;
        const newScore = Math.min(100, oldScore + item.boost);
        currentRelationships[currentNpcId] = newScore;

        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: newGold,
            npcRelationships: currentRelationships
        };

        if (onUpdateProgress) {
            onUpdateProgress(updatedProgress);
        }

        // Play feedback sounds
        playDrinkSound(item.type === 'drink' ? 'wine' : 'beer');
        playGoldSound();

        // Custom thank you text
        const isDrink = item.type === 'drink';
        const thanks = isDrink 
            ? `«О-о-о, розкішно! Дякую за ${item.icon} ${item.name}! За твоє здоров'я та велику удачу! Моя прихильність до тебе виросла на +${item.boost}!»`
            : `«М-м-м, яка неймовірна смакота! Дякую за ${item.icon} ${item.name}! Кухар у таверні «${tavern.name}» сьогодні перевершив себе! Моє ставлення тепер: +${item.boost}!»`;
        
        setThankYouMessage(thanks);
    };

    const handleHireNpc = (npc: OpponentData) => {
        const hireCost = 500;
        if (progress.playerGold < hireCost) {
            showToast({
                message: `Шинкар ${tavern.keeperName}: «Для найму ${npc.name} бракує золота! Потрібно ${hireCost} зол.»`,
                type: 'error',
                icon: '🪙'
            });
            return;
        }

        const updatedHiredNpcIds = [...(progress.hiredNpcIds || [])];
        if (!updatedHiredNpcIds.includes(npc.id)) {
            updatedHiredNpcIds.push(npc.id);
        }

        const companionClassKeys = Object.keys(COMPANION_CLASSES);
        const randomClassId = companionClassKeys[Math.floor(Math.random() * companionClassKeys.length)];

        const hiredGender = npc.gender || getGenderForName(npc.name);
        const companionMaxHp = Math.max(npc.baseHp || 100, npc.hp || 100);
        const hiredCompanion: HiredCompanion = {
            ...npc,
            gender: hiredGender,
            hp: companionMaxHp,
            baseHp: companionMaxHp,
            companionClassId: randomClassId,
            level: 0,
            xp: 0,
            xpToNextLevel: 100,
            maxAbilityCharges: 1, // level 0 + 1
            currentAbilityCharges: 1,
            survivalProbability: 98,
            isDead: false
        };

        const updatedHiredNpcs = [...(progress.hiredNpcs || [])];
        if (!updatedHiredNpcs.some(n => n.id === npc.id)) {
            updatedHiredNpcs.push(hiredCompanion);
        }

        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - hireCost,
            hiredNpcIds: updatedHiredNpcIds,
            hiredNpcs: updatedHiredNpcs
        };

        if (onUpdateProgress) {
            onUpdateProgress(updatedProgress);
        }

        playGoldSound();
        
        setThankYouMessage(`«Згода, мій друже! Твоє золото чесне, а серце сміливе. Відсьогодні я вступаю до твого лицарського загону! Разом ми подолаємо будь-які небезпеки!»`);
    };

    const curConfig = ACTIVITIES.find(a => a.id === activeActivity) || ACTIVITIES[0];
    const status = getTavernActivityStatus(progress, tavern, activeActivity);
    const { contenders, champions } = useMemo(() => {
        return getTavernActivityRoster(tavern, activeActivity);
    }, [tavern, activeActivity]);

    // Check if an NPC is already recruited into the player's squad
    const isNpcInSquad = useCallback((npcId: string) => {
        if (!npcId) return false;
        const hiredIds = progress.hiredNpcIds || [];
        const hiredList = progress.hiredNpcs || [];
        return hiredIds.includes(npcId) || hiredList.some(n => n.id === npcId);
    }, [progress.hiredNpcIds, progress.hiredNpcs]);

    // Filter opponents: after 3 victories they become normal NPCs
    const activeContenders = useMemo(() => {
        return contenders.filter(c => !isOpponentRetiredToNPC(progress, c.id, activeActivity));
    }, [contenders, progress, activeActivity]);

    const retiredContenders = useMemo(() => {
        return contenders.filter(c => isOpponentRetiredToNPC(progress, c.id, activeActivity));
    }, [contenders, progress, activeActivity]);

    const activeChampions = useMemo(() => {
        return champions.filter(c => !isOpponentRetiredToNPC(progress, c.id, activeActivity));
    }, [champions, progress, activeActivity]);

    const retiredChampions = useMemo(() => {
        return champions.filter(c => isOpponentRetiredToNPC(progress, c.id, activeActivity));
    }, [champions, progress, activeActivity]);

    const allRetiredInActivity = useMemo(() => {
        return [...retiredContenders, ...retiredChampions];
    }, [retiredContenders, retiredChampions]);

    // Generate non-playing tavern NPCs for this tavern (Keeper, Chef, Bard, Veteran, Merchant, Astrologer, Gossip, Monk, Hunter)
    const nonPlayingNpcs = useMemo(() => {
        const seed = tavern.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        
        const bards = ['Лютослав', 'Остап', 'Боян', 'Радомир', 'Мирослав', 'Зорян'];
        const chefs = ['Микита', 'Панкрат', 'Борис', 'Сава', 'Трохим', 'Антін'];
        const veterans = ['Гнат Вусач', 'Василь Залізняк', 'Святослав Загребельний', 'Ярослав Хоробрий', 'Дмитро Меч'];
        const merchants = ['Захарій', 'Богдан Шовковий', 'Теодор Заморський', 'Венедикт Купець', 'Марко Багач'];
        const astrologers = ['Опанас Віщий', 'Любомир Зоряний', 'Дарій Містик', 'Елеазар Ворожка', 'Касіян Аркан'];
        const gossips = ['Пані Горпина', 'Марина Соковита', 'Олена Казкарка', 'Соломія Хитрунка', 'Ярина Вушко'];
        const monks = ['Брат Тихон', 'Микола Мудрий', 'Анатолій Келійник', 'Георгій Святоуст', 'Серафим Літописець'];
        const hunters = ['Ярош Следопыт', 'Остап Сокіл', 'Тарас Стріла', 'Богдан Лісовик', 'Мирон Влучний'];

        return [
            {
                id: `${tavern.id}_keeper`,
                name: tavern.keeperName || 'Шинкар',
                title: `Шинкар та господaр «${tavern.name}»`,
                avatar: '🍺',
                gender: 'male' as const,
                category: 'staff' as const,
                badge: '🍺 Шинкар',
                quote: `«Вітаю у таверні «${tavern.name}» у поселенні ${settlement.name}! У нас затишно, на рожні смажиться соковите м'ясо, а медовуха та ель лиються рікою. Чим можу прислужитися мандрівнику?»`,
                loreTip: `«Місцеві відвідувачі полюбляють настільні ігри та кулачні бої. Якщо шукаєш найсильніших суперників — зазирни у гральний зал або спитай у ветеранів біля каміна.»`,
                toastQuote: `«За затишок нашої таверни «${tavern.name}» та за здоров'я добрих гостей!»`
            },
            {
                id: `${tavern.id}_chef`,
                name: `Кухар ${chefs[seed % chefs.length]}`,
                title: `Головний кухар таверни «${tavern.name}»`,
                avatar: '👨‍🍳',
                gender: 'male' as const,
                category: 'staff' as const,
                badge: '👨‍🍳 Кухар',
                quote: `«Справжня таверна тримається не лише на вині, а й на гарячій печені та духмяній юшці! Покуштуй мої страви, і твої сили одразу відновляться!»`,
                loreTip: `«Для кулачних боїв та важких дуелей потрібне міцне здоров'я. Не забудь добряче пообідати перед викликом на ринг!»`,
                toastQuote: `«За ситий шлунок та переможний дух!»`
            },
            {
                id: `${tavern.id}_bard`,
                name: `Бард ${bards[(seed + 1) % bards.length]}`,
                title: `Музикант та бард таверни`,
                avatar: '🎻',
                gender: 'male' as const,
                category: 'staff' as const,
                badge: '🎻 Бард',
                quote: `«Мої струни грають давні пісні про лицарів, зниклі королівства та азартні ігри. Музика розвіює сум і надихає на великі подвиги!»`,
                loreTip: `«У давнину біля багаття грали у Сенет, Чатурангу та Шахи Тамерлана. Ті ігри гартували розум полководців краще за будь-які книги.»`,
                toastQuote: `«За мелодії свободи та за гучні тавернські бенкети!»`,
                hirable: true
            },
            {
                id: `${tavern.id}_veteran`,
                name: `Ветеран ${veterans[(seed + 2) % veterans.length]}`,
                title: `Ветеран битв та лицарських турнірів`,
                avatar: '🛡️',
                gender: 'male' as const,
                category: 'guests' as const,
                badge: '🛡️ Ветеран',
                quote: `«Я пройшов десятки походів та лицарських турнірів. Тепер моє місце біля каміна з кухлем міцного елю, але око все ще гостре!»`,
                loreTip: `«У фехтуванні зі щитом головне — парирувати удар на початку замаху, а у Дурні на 56 карт з джокерами — завжди тримати контрольного козиря на фінал.»`,
                toastQuote: `«За славетні перемоги та за бойове братерство!»`,
                hirable: true
            },
            {
                id: `${tavern.id}_merchant`,
                name: `Купець ${merchants[(seed + 3) % merchants.length]}`,
                title: `Заїжджий торговець екзотичним крамом`,
                avatar: '⚖️',
                gender: 'male' as const,
                category: 'guests' as const,
                badge: '⚖️ Купець',
                quote: `«Торговельні каравани возять не лише прянощі та оксамит, а й давні настільні ігри. Я бачив, як у Вавилоні грали в Грати Ур, а в Єгипті — в священний Мехен!»`,
                loreTip: `«Східні купці грають у Перські шахи Шатрандж. Там немає рокіровки, зате кожен хід вимагає глибокої витримки.»`,
                toastQuote: `«За вдалі торговельні угоди та золоті монети у калиті!»`
            },
            {
                id: `${tavern.id}_tarot_master`,
                name: `Астролог ${astrologers[(seed + 4) % astrologers.length]}`,
                title: `Знавець карт Таро та таємних знань`,
                avatar: '🔮',
                gender: 'male' as const,
                category: 'guests' as const,
                badge: '🔮 Таролог',
                quote: `«Зірки та аркани Таро не брешуть. У картярській грі Дурень на 78 карт Таро Старші аркани вирішують долю так само, як вищі знамення на небі!»`,
                loreTip: `«22 Старші аркани Таро — це найсильніші козирі. Жодна звичайна карта Молодших арканів не годна подолати навіть найнижчий Старший аркан!»`,
                toastQuote: `«За таємниці всесвіту та прихильність Фортуни!»`
            },
            {
                id: `${tavern.id}_gossip`,
                name: gossips[(seed + 5) % gossips.length],
                title: `Міська пліткарка та знавиця таємниць`,
                avatar: '📜',
                gender: 'female' as const,
                category: 'guests' as const,
                badge: '📜 Пліткарка',
                quote: `«Ох, що я тільки-но дізналася біля криниці! Кажуть, місцеві чемпіони шукають гідного супротивника, який зможе подолати їх у турнірі!»`,
                loreTip: `«Якщо ти переможеш чемпіона тричі, він визнає твою вищість, завершить ігрову кар'єру та стане твоїм добрим другом у таверні!»`,
                toastQuote: `«За цікаві новини та свіжі тавернські плітки!»`
            },
            {
                id: `${tavern.id}_monk`,
                name: monks[(seed + 6) % monks.length],
                title: `Монах-хранитель давніх рукописів`,
                avatar: '📖',
                gender: 'male' as const,
                category: 'guests' as const,
                badge: '📖 Літописець',
                quote: `«У древніх монастирських сувоях записано історію багатьох століть. Настільні ігри — це дзеркало людського розуму та стратегії.»`,
                loreTip: `«Давньоіндійська Чатуранга була першоджерелом усіх сучасних шахів. У ній грали чотири гравці, використовуючи гральні кістки.»`,
                toastQuote: `«За світло знань та спокій у душі!»`
            },
            {
                id: `${tavern.id}_hunter`,
                name: `Мисливець ${hunters[(seed + 7) % hunters.length]}`,
                title: `Досвідчений лісовий мисливець`,
                avatar: '🏹',
                gender: 'male' as const,
                category: 'guests' as const,
                badge: '🏹 Мисливець',
                quote: `«У хащах потрібні терпіння та соколине око. У стрільбі з лука та кінній стрільбі головне — затамувати подих перед вистрілом!»`,
                loreTip: `«Турніри зі стрільби з лука проходять на свіжому повітрі. Там оцінюється не тільки влучність, а й швидкість спускання тятиви.»`,
                toastQuote: `«За влучне око та нехибну стрілу!»`,
                hirable: true
            }
        ].filter(npc => !isNpcInSquad(npc.id));
    }, [tavern.id, tavern.name, tavern.keeperName, settlement.name, isNpcInSquad]);

    // Aggregate all retired opponents in this tavern across all activities
    const allRetiredNpcsInTavern = useMemo(() => {
        const map = new Map<string, { opponent: OpponentData; activityType: TavernActivityType }>();
        ACTIVITIES.forEach(act => {
            const { contenders, champions } = getTavernActivityRoster(tavern, act.id);
            contenders?.forEach(c => {
                if (c && c.id && isOpponentRetiredToNPC(progress, c.id, act.id)) {
                    map.set(c.id, { opponent: c, activityType: act.id });
                }
            });
            champions?.forEach(c => {
                if (c && c.id && isOpponentRetiredToNPC(progress, c.id, act.id)) {
                    map.set(c.id, { opponent: c, activityType: act.id });
                }
            });
        });
        return Array.from(map.values());
    }, [tavern, progress]);

    // Aggregate all active players in this tavern across all activities
    const allActivePlayersInTavern = useMemo(() => {
        const map = new Map<string, { opponent: OpponentData; activityType: TavernActivityType; isChampion: boolean }>();
        ACTIVITIES.forEach(act => {
            const { contenders, champions } = getTavernActivityRoster(tavern, act.id);
            contenders?.forEach(c => {
                if (c && c.id && !isOpponentRetiredToNPC(progress, c.id, act.id)) {
                    map.set(c.id, { opponent: c, activityType: act.id, isChampion: false });
                }
            });
            champions?.forEach(c => {
                if (c && c.id && !isOpponentRetiredToNPC(progress, c.id, act.id)) {
                    map.set(c.id, { opponent: c, activityType: act.id, isChampion: true });
                }
            });
        });
        return Array.from(map.values());
    }, [tavern, progress]);

    const playerStats = progress.playerStats || DEFAULT_PLAYER_STATS;

    const handleBuyAndDrink = (drink: AlcoholDrink) => {
        if (progress.playerGold < drink.price) {
            showToast({
                message: "Шинкар " + tavern.keeperName + ": «Для купівлі " + drink.name + " бракує золота! Потрібно " + drink.price + " зол.»",
                type: 'error',
                icon: '🪙'
            });
            return;
        }

        const newGold = progress.playerGold - drink.price;
        const currentStats = { ...playerStats };

        currentStats.baseHp = Math.min(350, (currentStats.baseHp || 100) + drink.hpHeal);

        if (drink.buffStat === 'strength') {
            currentStats.strength = (currentStats.strength || 15) + (drink.buffValue || 1);
        } else if (drink.buffStat === 'agility') {
            currentStats.agility = (currentStats.agility || 10) + (drink.buffValue || 1);
        } else if (drink.buffStat === 'xp') {
            currentStats.xp = (currentStats.xp || 0) + (drink.buffValue || 20);
            if (currentStats.xp >= currentStats.xpToNextLevel) {
                currentStats.level += 1;
                currentStats.statPoints += 2;
                currentStats.xp -= currentStats.xpToNextLevel;
                currentStats.xpToNextLevel = Math.floor(currentStats.xpToNextLevel * 1.5);
            }
        } else if (drink.buffStat === 'hp') {
            currentStats.baseHp += (drink.buffValue || 15);
        }

        const newReputation = progress.playerReputation + (drink.buffStat === 'reputation' ? (drink.buffValue || 5) : 0);

        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: newGold,
            playerReputation: newReputation,
            playerStats: currentStats
        };

        if (onUpdateProgress) {
            onUpdateProgress(updatedProgress);
        }

        playDrinkSound(drink.type);
        playGoldSound();

        setDrunkLevel(prev => Math.min(100, prev + (drink.type === 'beer' ? 15 : 25)));

        const buffLabel = drink.buffStat === 'strength' ? 'Сила' :
            drink.buffStat === 'agility' ? 'Спритність' :
            drink.buffStat === 'reputation' ? 'Репутація' :
            drink.buffStat === 'xp' ? 'XP' : 'HP';

        const buffDesc = drink.buffStat ? (', +' + drink.buffValue + ' ' + buffLabel) : '';

        showToast({
            message: "Шинкар " + tavern.keeperName + ": «" + drink.flavorQuote + "» Ви випили " + drink.name + "! (+" + drink.hpHeal + " HP" + buffDesc + ")",
            type: 'success',
            icon: drink.icon
        });
    };

    const handleBuyFood = (food: FoodItem) => {
        if (progress.playerGold < food.cost) {
            showToast({
                message: "Шинкар " + tavern.keeperName + ": «У тебе не вистачає золота на " + food.name + ".»",
                type: 'error',
                icon: '🪙'
            });
            return;
        }

        const currentStats = { ...playerStats };
        currentStats.regenPoints = (currentStats.regenPoints || 0) + food.regenPoints;

        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - food.cost,
            playerStats: currentStats
        };

        if (onUpdateProgress) {
            onUpdateProgress(updatedProgress);
        }

        playGoldSound();
        showToast({
            message: `Ви з'їли ${food.name}! Отримано ${food.regenPoints} очок регенерації.`,
            type: 'success',
            icon: food.emoji
        });
    };

    const handleRest = (type: 'fireplace' | 'room' | 'deluxe' = 'room') => {
        const currentStats = { ...playerStats };
        const maxHp = calculateTotalHealth(currentStats.baseHp || 100, currentStats.strength || 15);
        const currentHp = currentStats.currentHp ?? maxHp;
        const regenPoints = currentStats.regenPoints || 0;

        if (type === 'fireplace') {
            const healAmount = Math.min(20, maxHp - currentHp);
            currentStats.currentHp = Math.min(maxHp, currentHp + healAmount);
            
            const updatedProgress: WorldProgress = {
                ...progress,
                playerStats: currentStats
            };

            if (onUpdateProgress) {
                onUpdateProgress(updatedProgress);
            }

            setDrunkLevel(0);
            playDrinkSound();
            showToast({
                message: healAmount > 0 
                    ? `☕ Ви затишно перепочили біля каміна. Відновлено ${healAmount} HP! Сп'яніння минуло.`
                    : `☕ Ви перепочили біля каміна. Втому та сп'яніння знято, сили відновлено!`,
                type: 'success',
                icon: '🔥'
            });
            return;
        }

        if (type === 'room') {
            const sleepCost = 10;
            if (progress.playerGold < sleepCost) {
                showToast({
                    message: "Шинкар " + tavern.keeperName + ": «Кімната коштує 10 золотих. Безкоштовно можна перепочити біля каміна!»",
                    type: 'error',
                    icon: '🪙'
                });
                return;
            }

            // Guaranteed base heal 35 HP even without food
            const baseHeal = 35;
            let pointsUsed = 0;
            let bonusHeal = 0;
            const remainingDeficit = Math.max(0, maxHp - (currentHp + baseHeal));

            if (regenPoints > 0 && remainingDeficit > 0) {
                pointsUsed = Math.min(regenPoints, 5, Math.ceil(remainingDeficit / 10));
                bonusHeal = pointsUsed * 10;
            }

            const totalHealed = Math.min(maxHp - currentHp, baseHeal + bonusHeal);
            currentStats.currentHp = Math.min(maxHp, currentHp + Math.max(0, totalHealed));
            currentStats.regenPoints = Math.max(0, regenPoints - pointsUsed);

            const updatedProgress: WorldProgress = {
                ...progress,
                playerGold: progress.playerGold - sleepCost,
                playerStats: currentStats
            };

            if (onUpdateProgress) {
                onUpdateProgress(updatedProgress);
            }

            playGoldSound();
            setDrunkLevel(0);
            showToast({
                message: totalHealed > 0
                    ? `🛏️ Ви чудово виспались у номері! Відновлено ${totalHealed} HP${pointsUsed > 0 ? ` (використано ${pointsUsed} очок регенерації)` : ''}. Сп'яніння минуло!`
                    : `🛏️ Ви відпочили у м'якому ліжку та набралися сил! Здоров'я повне.`,
                type: 'success',
                icon: '🛏️'
            });
            return;
        }

        if (type === 'deluxe') {
            const deluxeCost = 25;
            if (progress.playerGold < deluxeCost) {
                showToast({
                    message: "Шинкар " + tavern.keeperName + ": «Королівський люкс коштує 25 золотих.»",
                    type: 'error',
                    icon: '🪙'
                });
                return;
            }

            const healed = maxHp - currentHp;
            currentStats.currentHp = maxHp;
            currentStats.regenPoints = regenPoints + 3;

            const updatedProgress: WorldProgress = {
                ...progress,
                playerGold: progress.playerGold - deluxeCost,
                playerStats: currentStats
            };

            if (onUpdateProgress) {
                onUpdateProgress(updatedProgress);
            }

            playGoldSound();
            setDrunkLevel(0);
            showToast({
                message: `👑 Королівський відпочинок у люксі! Здоров'я повністю зцілено (+${healed} HP до 100%), додано +3 очки регенерації!`,
                type: 'success',
                icon: '👑'
            });
            return;
        }
    };

    const handleSleep = () => handleRest('room');

    const displayedDrinks = drinkCategoryFilter === 'beer'
        ? alcoholMenu.beers
        : drinkCategoryFilter === 'wine'
        ? alcoholMenu.wines
        : [...alcoholMenu.beers, ...alcoholMenu.wines];

    const getFigurineReadiness = (act: string): FigurineRequirement | null => {
        return getFigurineRequirement(act, progress);
    };

    const handleDirectAutoPurchase = (act: string) => {
        const res = executeAutoPurchaseForActivity(act, progress);
        if (res.success && res.updatedProgress) {
            onUpdateProgress(res.updatedProgress);
            saveWorldProgress(res.updatedProgress);
            showToast({
                message: res.message,
                type: 'success',
                icon: '⚡'
            });
        } else {
            showToast({
                message: res.message,
                type: 'error',
                icon: '⚠️'
            });
        }
    };

    const handleConfirmAutoPurchaseAndPlay = () => {
        if (!autoPurchasePrompt) return;
        const { opp, activity } = autoPurchasePrompt;
        const res = executeAutoPurchaseForActivity(activity, progress);
        if (res.success && res.updatedProgress) {
            onUpdateProgress(res.updatedProgress);
            saveWorldProgress(res.updatedProgress);
            showToast({
                message: res.message,
                type: 'success',
                icon: '⚡'
            });
            setAutoPurchasePrompt(null);
            executeChallenge(opp, activity);
        } else {
            showToast({
                message: res.message,
                type: 'error',
                icon: '⚠️'
            });
        }
    };

    const handleChallenge = (opp: OpponentData) => {
        const readiness = getFigurineReadiness(activeActivity);
        if (readiness && !readiness.ready) {
            setAutoPurchasePrompt({
                opp,
                activity: activeActivity,
                req: readiness
            });
            return;
        }
        executeChallenge(opp, activeActivity);
    };

    const executeChallenge = (opp: OpponentData, actToPlay: string = activeActivity) => {
        if (actToPlay === 'brawl') {
            onChallengeBrawl(opp);
        } else if (activeActivity === 'fencing_sword_shield' && onChallengeFencingSwordShield) {
            onChallengeFencingSwordShield(opp);
        } else if (activeActivity === 'fencing_sword_only' && onChallengeFencingSwordOnly) {
            onChallengeFencingSwordOnly(opp);
        } else if (activeActivity === 'classic_durak_36' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, '36');
        } else if (activeActivity === 'classic_durak_52' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, '52');
        } else if (activeActivity === 'classic_durak_54' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, '54');
        } else if (activeActivity === 'classic_durak_56' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, '56');
        } else if (activeActivity === 'classic_durak_minor_tarot' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, 'minor_tarot');
        } else if (activeActivity === 'classic_durak_tarot' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, 'tarot');
        } else if (activeActivity === 'durak_52_2trumps' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, 'durak_52_2trumps');
        } else if (activeActivity === 'durak_52_2trumps_plus1trump' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, 'durak_52_2trumps_plus1trump');
        } else if (activeActivity === 'durak_52_2trumps_plus2trumps' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, 'durak_52_2trumps_plus2trumps');
        } else if (activeActivity === 'durak_52_2trumps_plus2suits' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, 'durak_52_2trumps_plus2suits');
        } else if (activeActivity === 'durak_52_2trumps_plus1suit' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, 'durak_52_2trumps_plus1suit');
        } else if (activeActivity === 'durak_52_3trumps' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, 'durak_52_2trumps_plus1trump');
        } else if (activeActivity === 'durak_52_4trumps' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, 'durak_52_2trumps_plus2trumps');
        } else if (activeActivity === 'durak_104_2trumps' && onChallengeClassicDurak) {
            onChallengeClassicDurak(opp, '104_2trumps');
        } else if (activeActivity === 'french_tarot' && onChallengeFrenchTarot) {
            onChallengeFrenchTarot(opp);
        } else if (activeActivity === 'blackjack' && onChallengeBlackjack) {
            onChallengeBlackjack(opp);
        } else if (activeActivity === 'blackjack_dice' && onChallengeBlackjackDice) {
            onChallengeBlackjackDice(opp);
        } else if (activeActivity === 'steeplechase' && onChallengeSteeplechase) {
            onChallengeSteeplechase();
        } else if (activeActivity === 'flat_horse_race' && onChallengeFlatRace) {
            onChallengeFlatRace();
        } else if (activeActivity === 'mounted_archery' && onChallengeMountedArchery) {
            onChallengeMountedArchery();
        } else if (activeActivity === 'dice_poker' && onChallengeDicePoker) {
            onChallengeDicePoker(opp);
        } else if (activeActivity === 'tavern_dice' && onChallengeTavernDice) {
            onChallengeTavernDice(opp);
        } else if (activeActivity === 'coin_flip' && onChallengeCoinFlip) {
            onChallengeCoinFlip(opp);
        } else if (activeActivity === 'd20_dice' && onChallengeD20Dice) {
            onChallengeD20Dice(opp);
        } else if (activeActivity === 'potion_roulette' && onChallengePotionRoulette) {
            onChallengePotionRoulette(opp);
        } else if (activeActivity === 'tavern_labyrinth' && onChallengeLabyrinth) {
            onChallengeLabyrinth(opp);
        } else if (activeActivity === 'tavern_treasure_hunter' && onChallengeTreasureHunter) {
            onChallengeTreasureHunter(opp);
        } else if (activeActivity === 'dice_duel' && onChallengeDiceDuel) {
            onChallengeDiceDuel(opp);
        } else if (activeActivity === 'dice_duel_tournament' && onChallengeDiceDuelTournament) {
            onChallengeDiceDuelTournament(opp);
        } else if (activeActivity === 'toy_soldiers' && onChallengeToySoldiers) {
            onChallengeToySoldiers(opp);
        } else if (activeActivity === 'army_battle' && onChallengeArmyBattle) {
            onChallengeArmyBattle(opp);
        } else if (activeActivity === 'rpg_army_checkers' && onChallengeRpgArmyCheckers) {
            onChallengeRpgArmyCheckers(opp);
        } else if ((activeActivity === 'checkers_war' || activeActivity === 'aranian_checkers_war' || activeActivity === 'military_checkers' || activeActivity === 'aranian_military_checkers') && onChallengeCheckersWar) {
            onChallengeCheckersWar(opp, activeActivity);
        } else if (activeActivity === 'toy_checkers' && onChallengeToyCheckers) {
            onChallengeToyCheckers(opp, 8);
        } else if (activeActivity === 'toy_checkers_10x10' && onChallengeToyCheckers) {
            onChallengeToyCheckers(opp, 10);
        } else if (activeActivity === 'toy_checkers_12x12' && onChallengeToyCheckers) {
            onChallengeToyCheckers(opp, 12);
        } else if (activeActivity === 'toy_checkers_classic' && onChallengeToyCheckers) {
            onChallengeToyCheckers(opp, 8, 'checkers_classic');
        } else if (activeActivity === 'toy_pawns' && onChallengeToyPawns) {
            onChallengeToyPawns(opp, 8);
        } else if (activeActivity === 'toy_pawns_10x10' && onChallengeToyPawns) {
            onChallengeToyPawns(opp, 10);
        } else if (activeActivity === 'toy_pawns_12x12' && onChallengeToyPawns) {
            onChallengeToyPawns(opp, 12);
        } else if (activeActivity === 'wizard_battle' && onChallengeWizardBattle) {
            onChallengeWizardBattle(opp);
        } else if (activeActivity === 'wizard_tournament' && onChallengeWizardTournament) {
            onChallengeWizardTournament(opp);
        } else if (activeActivity === 'magic_pawns' && onChallengeMagicPawns) {
            onChallengeMagicPawns(opp, 8);
        } else if (activeActivity === 'magic_pawns_10x10' && onChallengeMagicPawns) {
            onChallengeMagicPawns(opp, 10);
        } else if (activeActivity === 'magic_pawns_12x12' && onChallengeMagicPawns) {
            onChallengeMagicPawns(opp, 12);
        } else if (activeActivity === 'battle_pawns_6x12' && onChallengeBattlePawns6x12) {
            onChallengeBattlePawns6x12(opp);
        } else if (activeActivity === 'checkers' && onChallengeCheckers) {
            onChallengeCheckers(opp);
        } else if (activeActivity === 'senet' && onChallengeSenet) {
            onChallengeSenet(opp);
        } else if (activeActivity === 'ur' && onChallengeUr) {
            onChallengeUr(opp);
        } else if (activeActivity === 'mehen' && onChallengeMehen) {
            onChallengeMehen(opp);
        } else if (activeActivity === 'aseb' && onChallengeAseb) {
            onChallengeAseb(opp);
        } else if (activeActivity === 'archery' && onChallengeArchery) {
            onChallengeArchery(opp);
        } else if (activeActivity === 'jousting' && onChallengeJousting) {
            onChallengeJousting(opp);
        } else if ((
            activeActivity === 'chess_standard' ||
            activeActivity === 'shatranj' ||
            activeActivity === 'chaturanga' ||
            activeActivity === 'chaturaji' ||
            activeActivity === 'tamerlane' ||
            activeActivity === 'courier' ||
            activeActivity === 'capablanca' ||
            activeActivity === 'carrera' ||
            activeActivity === 'grasshopper' ||
            activeActivity === 'cheskers' ||
            activeActivity === 'archchess' ||
            activeActivity === 'archcourier' ||
            activeActivity === 'senterej' ||
            activeActivity === 'al_adli' ||
            activeActivity === 'sittuyin' ||
            activeActivity === 'makruk' ||
            activeActivity === 'shatar' ||
            activeActivity === 'xiangqi' ||
            activeActivity === 'janggi' ||
            activeActivity === 'heian_shogi' ||
            activeActivity === 'sho_shogi' ||
            activeActivity === 'shogi' ||
            activeActivity === 'napoleonic' ||
            activeActivity === 'fide_napoleonic' ||
            activeActivity === 'napoleon_ottomans'
        ) && onChallengeChess) {
            const variantMap: Record<string, GameVariant> = {
                chess_standard: 'standard',
                shatranj: 'shatranj',
                chaturanga: 'chaturanga',
                chaturaji: 'chaturaji',
                tamerlane: 'tamerlane',
                courier: 'courier',
                capablanca: 'capablanca',
                carrera: 'carrera',
                grasshopper: 'grasshopper',
                cheskers: 'cheskers',
                archchess: 'archchess',
                archcourier: 'archcourier',
                senterej: 'senterej',
                al_adli: 'al_adli',
                sittuyin: 'sittuyin',
                makruk: 'makruk',
                shatar: 'shatar',
                xiangqi: 'xiangqi',
                janggi: 'janggi',
                heian_shogi: 'heian_shogi',
                sho_shogi: 'sho_shogi',
                shogi: 'shogi',
                napoleonic: 'napoleonic',
                fide_napoleonic: 'fide_napoleonic',
                napoleon_ottomans: 'napoleon_ottomans'
            };
            onChallengeChess(variantMap[actToPlay] || 'standard', opp);
        } else {
            onChallengeOpponent(opp, actToPlay as TavernActivityType);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="relative w-full max-w-5xl max-h-[95vh] bg-[#16120e] border-2 border-[#b8860b]/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Tavern Banner Artwork Header */}
                <div className="relative h-36 sm:h-44 w-full overflow-hidden border-b border-[#b8860b]/40">
                    <img 
                        src={tavernInteriorImg}
                        alt={tavern.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover filter brightness-75 contrast-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16120e] via-[#16120e]/60 to-transparent" />

                    {/* Navigation Buttons on Top of Header */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 flex-wrap gap-2">
                        <button
                            onClick={onBackToSettlement}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#17120e]/80 hover:bg-[#2b2118] border border-[#b8860b]/50 rounded-full text-xs font-bold text-[#f5ebd7] backdrop-blur-md transition-all shadow-md cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>До {settlement.name}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            {/* Rest Quick Action Button */}
                            <button
                                onClick={() => setMainMode('room')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black border border-yellow-300 rounded-full text-xs backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                                title="Кімната відпочинку: зняти втому та залікувати рани"
                            >
                                <span className="text-sm">🛏️</span>
                                <span>ВІДПОЧИТИ</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                                    (playerStats.currentHp ?? 100) < calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15)
                                        ? 'bg-red-700 text-white animate-pulse'
                                        : 'bg-stone-950/40 text-stone-950'
                                }`}>
                                    {playerStats.currentHp ?? calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15)}/{calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15)} HP
                                </span>
                            </button>

                            {/* Labyrinth 3-Minute Quick Action Button */}
                            {onChallengeLabyrinth && (
                                <button
                                    onClick={() => {
                                        setActiveActivity('tavern_labyrinth');
                                        setMainMode('games');
                                        const opp = (activeContenders && activeContenders[0]) || (tavern.contenders && tavern.contenders[0]);
                                        if (opp) {
                                            onChallengeLabyrinth(opp);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-400 text-stone-950 font-black border border-yellow-300 rounded-full text-xs backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                                    title="Таємничий кам'яний лабіринт підвалів таверни (вид зверху): пройдіть його за 3 хвилини!"
                                >
                                    <span className="text-sm">🧭</span>
                                    <span>ЛАБІРИНТ (3 ХВ)</span>
                                </button>
                            )}

                            {onChallengeTreasureHunter && (
                                <button
                                    onClick={() => {
                                        setActiveActivity('tavern_treasure_hunter');
                                        setMainMode('games');
                                        const opp = (activeContenders && activeContenders[0]) || (tavern.contenders && tavern.contenders[0]);
                                        if (opp) {
                                            onChallengeTreasureHunter(opp);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-700 via-amber-600 to-yellow-400 hover:from-yellow-600 hover:to-yellow-300 text-stone-950 font-black border border-yellow-300 rounded-full text-xs backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                                    title="Ретро-платформер Шукач скарбів: збирайте діаманти, знаходьте ключ та відчиняйте двері!"
                                >
                                    <span className="text-sm">🧢</span>
                                    <span>ШУКАЧ СКАРБІВ</span>
                                </button>
                            )}

                            {onOpenCharacterModal && (
                                <button
                                    onClick={onOpenCharacterModal}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-md transition shadow-md cursor-pointer ${
                                        playerStats.statPoints > 0
                                            ? 'bg-yellow-500/90 text-black border-2 border-yellow-300 animate-pulse'
                                            : 'bg-[#17120e]/80 hover:bg-[#2b2118] text-amber-300 border border-[#b8860b]/50'
                                    }`}
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>Рівень {playerStats.level}</span>
                                    {playerStats.statPoints > 0 && (
                                        <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px]">
                                            +{playerStats.statPoints}
                                        </span>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={onCloseToMap}
                                className="px-3 py-1.5 bg-[#17120e]/80 hover:bg-[#2b2118] border border-[#b8860b]/50 rounded-full text-xs font-bold text-[#f5ebd7] backdrop-blur-md transition-all shadow-md cursor-pointer"
                            >
                                🗺️ На карту
                            </button>
                        </div>
                    </div>

                    {/* Tavern Info Floating on Bottom */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between flex-wrap gap-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl p-1 bg-black/60 rounded-lg border border-[#b8860b]/50">
                                    {tavern.sign}
                                </span>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black font-serif text-[#f5ebd7] tracking-wide drop-shadow-md">
                                        {tavern.name}
                                    </h2>
                                    <div className="text-xs text-amber-200/90 font-medium">
                                        {settlement.name} • {settlement.type === 'graveyard' ? 'Повелитель склепу:' : 'Шинкар:'} {tavern.keeperName}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {status.isConquered && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/25 border border-yellow-400 rounded-full text-xs font-black text-yellow-300 shadow backdrop-blur-md">
                                    <Crown className="w-3.5 h-3.5 text-yellow-400" />
                                    <span>[{curConfig.codeName}] {curConfig.label.toUpperCase()}: {settlement.type === 'graveyard' ? 'ОЧИЩЕНО ВІД НЕЖИТІ 👑' : 'ЧЕМПІОН 👑'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Mode Navigation Bar: Bar & Alcohol vs Games & Duels */}
                <div className="flex items-center justify-center bg-[#100d0a] border-b border-[#b8860b]/40 px-3 py-2 gap-2 sm:gap-4 shrink-0 flex-wrap">
                    <button
                        onClick={() => setMainMode('bar')}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer border ${
                            mainMode === 'bar'
                                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 border-yellow-300 shadow-lg ring-2 ring-amber-400/40 scale-105'
                                : 'bg-[#1a140e] text-[#a89988] hover:text-[#f5ebd7] border-stone-800 hover:bg-[#251d15]'
                        }`}
                    >
                        <span className="text-base sm:text-lg">{settlement.type === 'graveyard' ? '🧪 🩸' : '🍷 🍺'}</span>
                        <span>{settlement.type === 'graveyard' ? 'ВІВТАР ВІДВАРІВ ТА ЗІЛЛЯ' : 'БАР ТАВЕРНИ (ПИВО & ВИНО)'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            mainMode === 'bar' ? 'bg-stone-950/40 text-stone-950' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        }`}>
                            {alcoholMenu.beers.length} пив / {alcoholMenu.wines.length} вин
                        </span>
                    </button>

                    <button
                        onClick={() => setMainMode('games')}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer border ${
                            mainMode === 'games'
                                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 border-yellow-300 shadow-lg ring-2 ring-amber-400/40 scale-105'
                                : 'bg-[#1a140e] text-[#a89988] hover:text-[#f5ebd7] border-stone-800 hover:bg-[#251d15]'
                        }`}
                    >
                        <span className="text-base sm:text-lg">{settlement.type === 'graveyard' ? '💀 🎲' : '🎴 🎲'}</span>
                        <span>{settlement.type === 'graveyard' ? 'БОЇ ТА ДУЕЛІ З НЕЖИТТЮ' : 'ІГРИ ТА ДУЕЛІ'}</span>
                    </button>

                    <button
                        onClick={() => setMainMode('npcs')}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer border ${
                            mainMode === 'npcs'
                                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 border-yellow-300 shadow-lg ring-2 ring-amber-400/40 scale-105'
                                : 'bg-[#1a140e] text-[#a89988] hover:text-[#f5ebd7] border-stone-800 hover:bg-[#251d15]'
                        }`}
                    >
                        <span className="text-base sm:text-lg">👥 🧙‍♂️</span>
                        <span>ВІДДІЛ НПЦ (ВІДВІДУВАЧІ)</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            mainMode === 'npcs' ? 'bg-stone-950/40 text-stone-950' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        }`}>
                            {nonPlayingNpcs.length + allRetiredNpcsInTavern.length + allActivePlayersInTavern.length} осіб
                        </span>
                    </button>

                    {onOpenQuests && (
                        <button
                            onClick={onOpenQuests}
                            className="px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-500 text-stone-950 border-yellow-300 shadow-md hover:scale-105 active:scale-95"
                            title="Дошка завдань та квести від НПЦ"
                        >
                            <span className="text-base sm:text-lg">📜</span>
                            <span>ДОШКА КВЕСТІВ</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-stone-950/50 text-amber-300">
                                {progress.activeQuests?.length || 0}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => setMainMode('food')}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer border ${
                            mainMode === 'food'
                                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 border-yellow-300 shadow-lg ring-2 ring-amber-400/40 scale-105'
                                : 'bg-[#1a140e] text-[#a89988] hover:text-[#f5ebd7] border-stone-800 hover:bg-[#251d15]'
                        }`}
                    >
                        <span className="text-base sm:text-lg">🍖</span>
                        <span>{settlement.type === 'graveyard' ? "М'ЯСО ЖЕРТВ" : 'КУХНЯ'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            mainMode === 'food' ? 'bg-stone-950/40 text-stone-950' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        }`}>
                            {foodMenu.length} страв
                        </span>
                    </button>

                    <button
                        onClick={() => setMainMode('room')}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer border ${
                            mainMode === 'room'
                                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 border-yellow-300 shadow-lg ring-2 ring-amber-400/40 scale-105'
                                : 'bg-[#1a140e] text-[#a89988] hover:text-[#f5ebd7] border-stone-800 hover:bg-[#251d15]'
                        }`}
                    >
                        <span className="text-base sm:text-lg">🛏️</span>
                        <span>ВІДПОЧИНОК (КІМНАТА)</span>
                        {(playerStats.currentHp ?? 100) < calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15) && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-600 text-white animate-pulse">
                                +HP
                            </span>
                        )}
                    </button>

                    {/* <button
                        onClick={() => setMainMode('music')}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer border ${
                            mainMode === 'music'
                                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 border-yellow-300 shadow-lg ring-2 ring-amber-400/40 scale-105'
                                : 'bg-[#1a140e] text-[#a89988] hover:text-[#f5ebd7] border-stone-800 hover:bg-[#251d15]'
                        }`}
                    >
                        <span className="text-base sm:text-lg">🎻</span>
                        <span>СКРИПАЛЬ</span>
                    </button> */}
                </div>

                {mainMode === 'bar' ? (
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#b8860b]/40 space-y-4">
                        {/* Bar Banner Header */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#221810] via-[#1a120c] to-[#221810] border border-[#b8860b]/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border-2 border-amber-500/60 flex items-center justify-center text-3xl shadow-inner shrink-0">
                                    {settlement.type === 'graveyard' ? '🧪' : '🍷'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-black font-serif text-[#f5ebd7]">
                                            {settlement.type === 'graveyard' ? `Вівтар Відварів та Льох «${tavern.name}»` : `Бар та Винний льох «${tavern.name}»`}
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                            {alcoholMenu.beers.length} сортів пива • {alcoholMenu.wines.length} сортів вин
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#c4b5a0] italic mt-0.5">
                                        {settlement.type === 'graveyard'
                                            ? `«${tavern.keeperName}: Тут варяться темні еліксири, зілля сили та відвари для відновлення сил воїнів перед боєм з нежиттю!»`
                                            : `«Шинкар ${tavern.keeperName}: Ласкаво прошу до моєї стійки! Купуй найкращий ель та витримані вина Ельдрії!»`}
                                    </p>
                                </div>
                            </div>

                            {/* Drunkenness Status & Sobriety Button */}
                            <div className="flex flex-col items-end gap-2 w-full md:w-auto shrink-0">
                                <div className="flex items-center gap-2 bg-[#120e0b] px-3 py-1.5 rounded-xl border border-amber-500/30 w-full md:w-auto justify-between">
                                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                                        🥴 Сп'яніння:
                                    </span>
                                    <span className="text-xs font-black font-mono text-yellow-400">
                                        {drunkLevel}%
                                    </span>
                                    {drunkLevel > 0 && (
                                        <button
                                            onClick={() => {
                                                setDrunkLevel(0);
                                                showToast({ message: 'Ви випили криничної води. Голова знову прояснилася! 🌿', type: 'success', icon: '💧' });
                                            }}
                                            className="ml-2 px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                        >
                                            💧 Протверезитись
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setMainMode('room')}
                                        className="ml-2 px-2.5 py-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-stone-950 font-black rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer shadow hover:scale-105"
                                        title="Відпочити та відновити сили"
                                    >
                                        <span>🛏️</span>
                                        <span>Відпочити</span>
                                    </button>
                                </div>
                                
                                <div className="w-full md:w-56 h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                                    <div 
                                        className={`h-full transition-all duration-300 ${
                                            drunkLevel > 75 ? 'bg-gradient-to-r from-amber-500 to-rose-600' :
                                            drunkLevel > 40 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                            'bg-gradient-to-r from-emerald-500 to-teal-400'
                                        }`}
                                        style={{ width: `${drunkLevel}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Filter & Gold Counter */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#b8860b]/30">
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setDrinkCategoryFilter('all')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                        drinkCategoryFilter === 'all'
                                            ? 'bg-amber-500 text-black font-black shadow-md'
                                            : 'bg-[#18130e] text-[#a89988] hover:text-white border border-stone-800'
                                    }`}
                                >
                                    🍷 🍺 Усі напої ({alcoholMenu.beers.length + alcoholMenu.wines.length})
                                </button>
                                <button
                                    onClick={() => setDrinkCategoryFilter('beer')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                        drinkCategoryFilter === 'beer'
                                            ? 'bg-amber-600 text-white font-black shadow-md'
                                            : 'bg-[#18130e] text-[#a89988] hover:text-white border border-stone-800'
                                    }`}
                                >
                                    🍺 Пиво ({alcoholMenu.beers.length} сортів)
                                </button>
                                <button
                                    onClick={() => setDrinkCategoryFilter('wine')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                        drinkCategoryFilter === 'wine'
                                            ? 'bg-rose-700 text-white font-black shadow-md'
                                            : 'bg-[#18130e] text-[#a89988] hover:text-white border border-stone-800'
                                    }`}
                                >
                                    🍷 Вино ({alcoholMenu.wines.length} сортів)
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-[#120e0b] px-3 py-1.5 rounded-xl border border-amber-500/30">
                                <Coins className="w-4 h-4 text-amber-400" />
                                <span>Ваше золото: <strong className="text-yellow-400 font-mono text-sm">{progress.playerGold}</strong> зол.</span>
                            </div>
                        </div>

                        {/* Toast notification overlay */}
                        <AnimatePresence>
                            {drinkToast && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 shadow-xl ${
                                        drinkToast.type === 'error'
                                            ? 'bg-rose-950/90 border-rose-500/80 text-rose-200'
                                            : 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-xl">{drinkToast.icon}</span>
                                        <span>{drinkToast.message}</span>
                                    </div>
                                    <button
                                        onClick={() => setDrinkToast(null)}
                                        className="p-1 hover:bg-black/30 rounded-lg text-stone-300 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Drinks Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {displayedDrinks.map((drink) => {
                                const canAfford = progress.playerGold >= drink.price;
                                const isBeer = drink.type === 'beer';

                                return (
                                    <div
                                        key={drink.id}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                            isBeer
                                                ? 'bg-gradient-to-b from-[#251d15] to-[#1a140e] border-amber-500/40 hover:border-amber-400'
                                                : 'bg-gradient-to-b from-[#25151c] to-[#1a0e14] border-rose-500/40 hover:border-rose-400'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="text-3xl p-2 rounded-xl bg-black/40 border border-stone-800">
                                                        {drink.icon}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                                                                isBeer 
                                                                    ? 'bg-amber-950 text-amber-300 border-amber-500/40' 
                                                                    : 'bg-rose-950 text-rose-300 border-rose-500/40'
                                                            }`}>
                                                                {drink.subtype}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-amber-200/70 bg-black/40 px-1.5 py-0.5 rounded">
                                                                Міцність {drink.strength}
                                                            </span>
                                                        </div>
                                                        <h4 className={`text-base font-black font-serif mt-0.5 ${drink.color}`}>
                                                            {drink.name}
                                                        </h4>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30 text-xs font-black text-amber-300 shrink-0">
                                                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                                                    <span>{drink.price} зол.</span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-[#c4b5a0] leading-relaxed mb-2">
                                                {drink.description}
                                            </p>

                                            <div className="text-[11px] text-amber-200/90 italic bg-black/30 p-2 rounded-xl border border-stone-800/80 mb-3">
                                                "{drink.flavorQuote}"
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 flex-wrap gap-2">
                                            <div className="flex items-center gap-2 text-[11px] flex-wrap">
                                                <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-lg font-bold flex items-center gap-1">
                                                    <Heart className="w-3 h-3 text-emerald-400" /> +{drink.hpHeal} HP
                                                </span>
                                                {drink.buffStat && (
                                                    <span className="px-2 py-0.5 bg-yellow-950/80 border border-yellow-500/50 text-yellow-300 rounded-lg font-bold flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-yellow-400" /> +{drink.buffValue} {
                                                            drink.buffStat === 'strength' ? 'Сила' :
                                                            drink.buffStat === 'agility' ? 'Спритність' :
                                                            drink.buffStat === 'reputation' ? 'Репутація' :
                                                            drink.buffStat === 'xp' ? 'XP' : 'HP'
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleBuyAndDrink(drink)}
                                                disabled={!canAfford}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                                                    canAfford
                                                        ? isBeer
                                                            ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-black'
                                                            : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 text-white'
                                                        : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                                                }`}
                                            >
                                                <span>{drink.icon}</span>
                                                <span>{canAfford ? `Випити (${drink.price} зол.)` : 'Бракує золота 🪙'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : mainMode === 'npcs' ? (
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#b8860b]/40 space-y-4">
                        {/* NPC Banner Header */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#221810] via-[#1a120c] to-[#221810] border border-[#b8860b]/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border-2 border-amber-500/60 flex items-center justify-center text-3xl shadow-inner shrink-0">
                                    🧙‍♂️
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-lg text-amber-300">
                                        Відділ НПЦ та Відвідувачів Таверни «{tavern.name}»
                                    </h3>
                                    <p className="text-xs text-[#a89988] mt-1 max-w-xl leading-relaxed">
                                        Тут зібрані всі мешканці та гості таверни: шинкар, кухар, бард, заїжджі купці, ветерани турнірів, знавці Таро, літописці та гравці за столами. 
                                        Поговорите з ними, дізнайтеся унікальні чутки або пригостіть келихом вина!
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 bg-stone-950/70 p-3 rounded-xl border border-stone-800 shrink-0">
                                <Users className="w-5 h-5 text-amber-400 shrink-0" />
                                <div className="text-left">
                                    <div className="text-[10px] text-stone-400 font-bold uppercase">Всього мешканців</div>
                                    <div className="text-sm font-black text-amber-300">
                                        {nonPlayingNpcs.length + allRetiredNpcsInTavern.length + allActivePlayersInTavern.length} осіб у залі
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NPC Category Filters */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
                            <button
                                onClick={() => setNpcCategoryFilter('all')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                                    npcCategoryFilter === 'all'
                                        ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow-md scale-105'
                                        : 'bg-[#18130e] text-[#a89988] border-stone-800 hover:text-white'
                                }`}
                            >
                                <span>🌐 Всі НПЦ ({nonPlayingNpcs.length + allRetiredNpcsInTavern.length + allActivePlayersInTavern.length})</span>
                            </button>
                            <button
                                onClick={() => setNpcCategoryFilter('staff')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                                    npcCategoryFilter === 'staff'
                                        ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow-md scale-105'
                                        : 'bg-[#18130e] text-[#a89988] border-stone-800 hover:text-white'
                                }`}
                            >
                                <span>🍺 Персонал таверни ({nonPlayingNpcs.filter(n => n.category === 'staff').length})</span>
                            </button>
                            <button
                                onClick={() => setNpcCategoryFilter('guests')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                                    npcCategoryFilter === 'guests'
                                        ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow-md scale-105'
                                        : 'bg-[#18130e] text-[#a89988] border-stone-800 hover:text-white'
                                }`}
                            >
                                <span>🧙‍♂️ Неігрові гості ({nonPlayingNpcs.filter(n => n.category === 'guests').length})</span>
                            </button>
                            <button
                                onClick={() => setNpcCategoryFilter('retired')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                                    npcCategoryFilter === 'retired'
                                        ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow-md scale-105'
                                        : 'bg-[#18130e] text-[#a89988] border-stone-800 hover:text-white'
                                }`}
                            >
                                <span>🏆 Завершили кар'єру ({allRetiredNpcsInTavern.length})</span>
                            </button>
                            <button
                                onClick={() => setNpcCategoryFilter('players')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                                    npcCategoryFilter === 'players'
                                        ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow-md scale-105'
                                        : 'bg-[#18130e] text-[#a89988] border-stone-800 hover:text-white'
                                }`}
                            >
                                <span>🎴 Гравці та дуелянти ({allActivePlayersInTavern.length})</span>
                            </button>

                            <button
                                onClick={() => setShowClassGuideModal(true)}
                                className="ml-auto px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 border border-yellow-300 shadow-md shrink-0"
                                title="Повний посібник з усіма 50+ класами, закляттями та здібностями"
                            >
                                <BookOpen className="w-4 h-4 text-stone-950" />
                                <span>📖 Посібник класів та заклять</span>
                            </button>
                        </div>

                        {/* Resting Caravan Guards Banner */}
                        {(() => {
                            const restingCompanionsHere = (progress.hiredNpcs || []).filter(
                                c => c.restingInTavernSettlementId === settlement.id
                            );
                            if (restingCompanionsHere.length === 0) return null;

                            return (
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-emerald-950/80 border-2 border-emerald-500 shadow-xl mb-4">
                                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-2">
                                        <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                                        <span>Союзники успішно повернулися з охорони торгового каравану та чекають на вас за кухлем медовухи!</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {restingCompanionsHere.map(comp => (
                                            <div key={comp.id} className="p-3 rounded-xl bg-black/60 border border-emerald-500/60 flex items-center justify-between gap-3 text-xs">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl p-2 bg-emerald-950/60 rounded-xl border border-emerald-500/40">
                                                        {comp.avatar || '⚔️'}
                                                    </span>
                                                    <div>
                                                        <div className="font-bold text-emerald-200 text-sm">{comp.name}</div>
                                                        <div className="text-[11px] text-stone-300">
                                                            {comp.title} • Рівень {comp.level || 1}
                                                        </div>
                                                        <div className="text-[10px] text-yellow-300 font-bold mt-0.5">
                                                            Зароблено за рейс: +{comp.guardRewardEarned || 80} золотих
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const bonusGold = comp.guardRewardEarned || 80;
                                                        const updatedHired = (progress.hiredNpcs || []).map(c => {
                                                            if (c.id === comp.id) {
                                                                return {
                                                                    ...c,
                                                                    isGuardingCaravan: false,
                                                                    currentCaravanId: undefined,
                                                                    restingInTavernSettlementId: undefined,
                                                                    guardRewardEarned: 0
                                                                };
                                                            }
                                                            return c;
                                                        });
                                                        const updatedProgress: WorldProgress = {
                                                            ...progress,
                                                            playerGold: (progress.playerGold || 0) + bonusGold,
                                                            hiredNpcs: updatedHired
                                                        };
                                                        playGoldSound();
                                                        onUpdateProgress(updatedProgress);
                                                        saveWorldProgress(updatedProgress);
                                                    }}
                                                    className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 text-stone-950 font-black rounded-xl text-xs transition shadow flex items-center gap-1.5 cursor-pointer shrink-0"
                                                >
                                                    <UserCheck className="w-4 h-4" />
                                                    <span>Забрати до загону (+{comp.guardRewardEarned || 80} зол)</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* NPC List Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                            {/* 1. Non-Playing Staff & Guests */}
                            {(npcCategoryFilter === 'all' || npcCategoryFilter === 'staff' || npcCategoryFilter === 'guests') &&
                                nonPlayingNpcs
                                    .filter(npc => npcCategoryFilter === 'all' || npc.category === npcCategoryFilter)
                                    .map((npc) => {
                                        const score = progress.npcRelationships?.[npc.id] !== undefined ? progress.npcRelationships[npc.id]! : 30;
                                        const att = getAttitudeDetails(score);
                                        const isHired = (progress.hiredNpcIds || []).includes(npc.id);

                                        return (
                                            <div key={npc.id} className="relative p-4 rounded-2xl border-2 border-[#b8860b]/40 bg-gradient-to-b from-[#1c1611] to-[#120e0b] shadow-xl flex flex-col justify-between hover:border-amber-400 transition-all group">
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border-2 border-amber-500/60 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                                                                {npc.avatar}
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/30 w-fit mb-0.5">
                                                                    {npc.badge}
                                                                </div>
                                                                <h4 className="font-serif font-black text-base text-[#f5ebd7]">
                                                                    {npc.name}
                                                                </h4>
                                                                <p className="text-[11px] text-[#a89988] italic">
                                                                    {npc.title}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Relationship Bar */}
                                                    <div className="bg-[#0b0806] p-2.5 rounded-xl border border-stone-800 my-2.5">
                                                        <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                                                            <span className="text-[#a89988] flex items-center gap-1">
                                                                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                                                                Ставлення:
                                                            </span>
                                                            <span className={`${att.colorClass} flex items-center gap-1`}>
                                                                <span>{att.face}</span>
                                                                <span>{att.text} ({score}/100)</span>
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 rounded-full bg-stone-900 overflow-hidden">
                                                            <div className={`h-full transition-all ${att.barColorClass}`} style={{ width: `${score}%` }} />
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-[#dcd1be] italic bg-[#0e0a07] p-2.5 rounded-xl border border-stone-800/80 mb-3 leading-relaxed">
                                                        "{npc.quote}"
                                                    </p>
                                                </div>

                                                <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setTalkingNpc({
                                                                opponent: {
                                                                    id: npc.id,
                                                                    name: npc.name,
                                                                    title: npc.title,
                                                                    avatar: npc.avatar,
                                                                    quote: npc.quote
                                                                },
                                                                dialogue: {
                                                                    quote: npc.quote,
                                                                    loreTip: npc.loreTip,
                                                                    toastQuote: npc.toastQuote
                                                                }
                                                            });
                                                        }}
                                                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-black text-xs transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                        <span>Поговорити</span>
                                                    </button>

                                                    {onOpenQuests && (
                                                        <button
                                                            onClick={onOpenQuests}
                                                            className="py-2 px-2.5 rounded-xl bg-[#281c13] hover:bg-[#382619] text-amber-300 font-bold text-xs border border-amber-600/40 transition shadow cursor-pointer flex items-center justify-center gap-1"
                                                            title="Переглянути або створити квести"
                                                        >
                                                            <Scroll className="w-3.5 h-3.5 text-amber-400" />
                                                            <span>Квест</span>
                                                        </button>
                                                    )}

                                                    {npc.hirable && (
                                                        <button
                                                            onClick={() => handleHireNpc({
                                                                id: npc.id,
                                                                name: npc.name,
                                                                title: npc.title,
                                                                avatar: npc.avatar,
                                                                quote: npc.quote,
                                                                type: 'contender',
                                                                rank: 1,
                                                                difficulty: 'easy',
                                                                flavorQuote: npc.quote,
                                                                description: npc.title,
                                                                hp: 100,
                                                                armor: 10,
                                                                powerPoints: 10,
                                                                baseHp: 100,
                                                                strength: 10,
                                                                agility: 10,
                                                                rewards: { gold: 50, powerPoints: 10, reputation: 5 }
                                                            })}
                                                            disabled={isHired}
                                                            className={`py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1 ${
                                                                isHired
                                                                    ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                                                            }`}
                                                        >
                                                            <Shield className="w-3.5 h-3.5" />
                                                            <span>{isHired ? 'В загоні' : 'Найняти (500 🪙)'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                            {/* 2. Retired Opponents */}
                            {(npcCategoryFilter === 'all' || npcCategoryFilter === 'retired') &&
                                allRetiredNpcsInTavern.map((ret) => {
                                    const score = progress.npcRelationships?.[ret.opponent.id] !== undefined ? progress.npcRelationships[ret.opponent.id]! : 30;
                                    const att = getAttitudeDetails(score);
                                    const isHired = (progress.hiredNpcIds || []).includes(ret.opponent.id);

                                    return (
                                        <div key={ret.opponent.id} className="relative p-4 rounded-2xl border-2 border-emerald-600/40 bg-gradient-to-b from-[#141d13] to-[#0c120c] shadow-xl flex flex-col justify-between hover:border-emerald-400 transition-all group">
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500/60 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                                                            {ret.opponent.avatar}
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40 w-fit mb-0.5 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                                <span>🏆 Завершив кар'єру</span>
                                                            </div>
                                                            <h4 className="font-serif font-black text-base text-[#f5ebd7]">
                                                                {ret.opponent.name}
                                                            </h4>
                                                            <p className="text-[11px] text-[#a89988] italic">
                                                                {ret.opponent.title}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Relationship Bar */}
                                                <div className="bg-[#080d07] p-2.5 rounded-xl border border-emerald-950/80 my-2.5">
                                                    <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                                                        <span className="text-[#a89988] flex items-center gap-1">
                                                            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                                                            Ставлення:
                                                        </span>
                                                        <span className={`${att.colorClass} flex items-center gap-1`}>
                                                            <span>{att.face}</span>
                                                            <span>{att.text} ({score}/100)</span>
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-stone-900 overflow-hidden">
                                                        <div className={`h-full transition-all ${att.barColorClass}`} style={{ width: `${score}%` }} />
                                                    </div>
                                                </div>

                                                <p className="text-xs text-[#dcd1be] italic bg-[#091008] p-2.5 rounded-xl border border-emerald-950 mb-3 leading-relaxed">
                                                    "{ret.opponent.quote}"
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-emerald-950 flex flex-wrap items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        const dialogue = getRetiredNpcDialogue(ret.opponent, tavern.name, settlement.name, ret.activityType);
                                                        setTalkingNpc({
                                                            opponent: ret.opponent,
                                                            dialogue
                                                        });
                                                    }}
                                                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-stone-950 font-black text-xs transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    <span>Поговорити</span>
                                                </button>

                                                <button
                                                    onClick={() => handleHireNpc(ret.opponent)}
                                                    disabled={isHired}
                                                    className={`py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1 ${
                                                        isHired
                                                            ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                                            : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md'
                                                    }`}
                                                >
                                                    <Shield className="w-3.5 h-3.5" />
                                                    <span>{isHired ? 'В загоні' : 'Найняти (500 🪙)'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                            {/* 3. Active Players & Opponents */}
                            {(npcCategoryFilter === 'all' || npcCategoryFilter === 'players') &&
                                allActivePlayersInTavern.map((act) => {
                                    const score = progress.npcRelationships?.[act.opponent.id] !== undefined ? progress.npcRelationships[act.opponent.id]! : 30;
                                    const att = getAttitudeDetails(score);

                                    return (
                                        <div key={act.opponent.id} className="relative p-4 rounded-2xl border-2 border-stone-800 bg-gradient-to-b from-[#18130e] to-[#100d0a] shadow-xl flex flex-col justify-between hover:border-amber-500/60 transition-all group">
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-stone-900 border-2 border-amber-500/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                                                            {act.opponent.avatar}
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30 w-fit mb-0.5 flex items-center gap-1">
                                                                <span>{act.isChampion ? '👑 Чемпіон' : '🃏 Претендент'}</span>
                                                            </div>
                                                            <h4 className="font-serif font-black text-base text-[#f5ebd7]">
                                                                {act.opponent.name}
                                                            </h4>
                                                            <p className="text-[11px] text-[#a89988] italic">
                                                                {act.opponent.title}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Relationship Bar */}
                                                <div className="bg-[#0b0806] p-2.5 rounded-xl border border-stone-800 my-2.5">
                                                    <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                                                        <span className="text-[#a89988] flex items-center gap-1">
                                                            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                                                            Ставлення:
                                                        </span>
                                                        <span className={`${att.colorClass} flex items-center gap-1`}>
                                                            <span>{att.face}</span>
                                                            <span>{att.text} ({score}/100)</span>
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-stone-900 overflow-hidden">
                                                        <div className={`h-full transition-all ${att.barColorClass}`} style={{ width: `${score}%` }} />
                                                    </div>
                                                </div>

                                                <p className="text-xs text-[#dcd1be] italic bg-[#0e0a07] p-2.5 rounded-xl border border-stone-800/80 mb-3 leading-relaxed">
                                                    "{act.opponent.quote}"
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        const dialogue = getCustomNpcDialogue(act.opponent, tavern.name, settlement.name, act.activityType, progress.npcRelationships?.[act.opponent.id] || 30);
                                                        setTalkingNpc({
                                                            opponent: act.opponent,
                                                            dialogue
                                                        });
                                                    }}
                                                    className="flex-1 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-[#f5ebd7] font-black text-xs transition border border-stone-700 cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                                    <span>Поговорити</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setActiveActivity(act.activityType);
                                                        setMainMode('games');
                                                        handleChallenge(act.opponent);
                                                    }}
                                                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-stone-950 font-black text-xs transition shadow-md cursor-pointer flex items-center gap-1 font-bold"
                                                >
                                                    <Swords className="w-3.5 h-3.5" />
                                                    <span>Викликати</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                ) : mainMode === 'food' ? (
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#b8860b]/40 space-y-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#221810] via-[#1a120c] to-[#221810] border border-[#b8860b]/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border-2 border-amber-500/60 flex items-center justify-center text-3xl shadow-inner shrink-0">
                                    🍖
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-lg text-amber-300">
                                        Кухня Таверни
                                    </h3>
                                    <p className="text-xs text-[#a89988] mt-1 max-w-sm">
                                        Ситна їжа додає очки регенерації, які потім можна витратити на відновлення сил під час сну.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0 bg-stone-950/60 p-2 rounded-xl border border-stone-800">
                                <span className="text-[10px] text-stone-400 font-bold mb-1">ОЧКИ РЕГЕНЕРАЦІЇ</span>
                                <div className="flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                    <span className="text-xl font-black text-red-400">
                                        {progress.playerStats?.regenPoints || 0}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setMainMode('room')}
                                    className="mt-2 px-2.5 py-1 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 text-stone-950 font-black rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shadow hover:scale-105"
                                    title="Перейти до відпочинку"
                                >
                                    <span>🛏️</span>
                                    <span>Відпочити</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                            {foodMenu.map((food) => (
                                <div key={food.id} className="relative p-3 rounded-xl border border-[#b8860b]/30 bg-[#16100b] hover:bg-[#1a120c] transition-all flex flex-col justify-between group">
                                    <div>
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
                                                    {food.emoji}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-[#f5ebd7] leading-tight">
                                                        {food.name}
                                                    </h4>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Heart className="w-3 h-3 text-red-500" />
                                                        <span className="text-[10px] text-red-400 font-bold">+{food.regenPoints} регенерації</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[#a89988] mb-3 line-clamp-3 italic">
                                            "{food.description}"
                                        </p>
                                    </div>
                                    <div className="pt-3 flex items-center justify-between border-t border-stone-800">
                                        <div className="flex items-center gap-1.5">
                                            <Coins className="w-4 h-4 text-yellow-400" />
                                            <span className="font-black text-yellow-400 text-sm">{food.cost}</span>
                                        </div>
                                        <button
                                            onClick={() => handleBuyFood(food)}
                                            disabled={progress.playerGold < food.cost}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all shadow-md flex items-center gap-1 ${
                                                progress.playerGold >= food.cost
                                                    ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-yellow-500 text-stone-950 border border-amber-400/50 hover:scale-105'
                                                    : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            <Coins className="w-3 h-3" />
                                            {progress.playerGold >= food.cost ? 'З\'ЇСТИ' : 'БРАКУЄ ЗОЛОТА'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : mainMode === 'room' ? (
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#b8860b]/40 space-y-6">
                        {/* Header Banner */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2a1a10] via-[#1a120c] to-[#2a1a10] border border-[#b8860b]/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-900/80 to-amber-950/90 border-2 border-amber-500/60 flex items-center justify-center text-4xl shadow-inner shrink-0">
                                    🛏️
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="font-serif font-bold text-xl sm:text-2xl text-amber-300">
                                            Відпочинок у Таверні «{tavern.name}»
                                        </h2>
                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                            Кімнати & Камін
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-[#c4b5a0] mt-1 max-w-2xl leading-relaxed">
                                        «Шинкар {tavern.keeperName}: Стомленому воїну та відважному гравцю потрібен міцний сон! 
                                        Перепочиньте біля теплого каміна або винайміть м'яку постіль, щоб повністю залікувати рани.»
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-stone-950/70 p-3 rounded-xl border border-stone-800 shrink-0">
                                <Coins className="w-5 h-5 text-amber-400 shrink-0" />
                                <div>
                                    <div className="text-[10px] text-stone-400 font-bold uppercase">Ваше золото</div>
                                    <div className="text-sm font-black text-amber-300">{progress.playerGold} 🪙</div>
                                </div>
                            </div>
                        </div>

                        {/* Player Condition Dashboard */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Health Card */}
                            <div className="bg-[#140e0a] border border-[#b8860b]/30 rounded-xl p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                                        Здоров'я героя
                                    </span>
                                    <span className="text-xs font-bold text-stone-300">
                                        {Math.round(((playerStats.currentHp ?? calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15)) / calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15)) * 100)}%
                                    </span>
                                </div>
                                <div className="text-lg font-black text-red-400 mb-2">
                                    {playerStats.currentHp ?? calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15)} / {calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15)} HP
                                </div>
                                <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                                    <div 
                                        className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-300"
                                        style={{ width: `${Math.min(100, Math.max(5, ((playerStats.currentHp ?? calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15)) / calculateTotalHealth(playerStats.baseHp || 100, playerStats.strength || 15)) * 100))}%` }}
                                    />
                                </div>
                            </div>

                            {/* Food Regen Points */}
                            <div className="bg-[#140e0a] border border-[#b8860b]/30 rounded-xl p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="text-sm">🍖</span>
                                        Очки регенерації від їжі
                                    </span>
                                    <span className="text-xs font-bold text-emerald-400">
                                        +{Math.min((playerStats.regenPoints || 0) * 10, 50)} HP бонусом
                                    </span>
                                </div>
                                <div className="text-lg font-black text-emerald-400 mb-1">
                                    {playerStats.regenPoints || 0} очок
                                </div>
                                <p className="text-[10px] text-stone-400 leading-snug">
                                    Ситні страви з Кухні таверни посилюють зцілення ран під час сну.
                                </p>
                            </div>

                            {/* Sobriety / Status */}
                            <div className="bg-[#140e0a] border border-[#b8860b]/30 rounded-xl p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="text-sm">🍺</span>
                                        Рівень сп'яніння
                                    </span>
                                    <span className="text-xs font-bold text-amber-300">
                                        {drunkLevel > 0 ? `${drunkLevel}%` : 'Тверезий'}
                                    </span>
                                </div>
                                <div className="text-lg font-black text-amber-300 mb-1">
                                    {drunkLevel > 0 ? 'Хмільний стан' : 'Повна бадьорість'}
                                </div>
                                <p className="text-[10px] text-stone-400 leading-snug">
                                    Будь-який обраний відпочинок миттєво знімає сп'яніння та втому.
                                </p>
                            </div>
                        </div>

                        {/* 3 Rest Option Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Option 1: Fireplace (Free) */}
                            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#1c140e] to-[#120e0a] border border-amber-600/30 hover:border-amber-500/60 shadow-xl flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
                                            🔥
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-950/70 border border-emerald-500/50 text-emerald-300">
                                            БЕЗКОШТОВНО
                                        </span>
                                    </div>
                                    <h3 className="font-serif font-bold text-lg text-amber-300 mb-1">
                                        Відпочинок біля каміна
                                    </h3>
                                    <p className="text-xs text-[#a89988] leading-relaxed mb-4">
                                        Присядьте у старе затишне крісло біля палаючого вогнища. Шинкар почастує гарячим трав'яним настоєм.
                                    </p>
                                    <div className="space-y-1.5 mb-5 bg-black/40 p-2.5 rounded-xl border border-stone-800 text-xs">
                                        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span>Відновлює +20 HP</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                            <span>Повне протверезіння</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-amber-200">
                                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                            <span>Не потребує золота</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRest('fireplace')}
                                    className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-yellow-500 text-stone-950 border border-amber-400/50 shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer transition"
                                >
                                    <Flame className="w-4 h-4 text-stone-950" />
                                    <span>ВІДПОЧИТИ БІЛЯ КАМІНА</span>
                                </button>
                            </div>

                            {/* Option 2: Standard Room (10 Gold) */}
                            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#221810] to-[#140e0a] border-2 border-amber-500/50 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-400/60 flex items-center justify-center text-2xl shadow-inner">
                                            🛏️
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-950/80 border border-amber-400/60 text-amber-300 flex items-center gap-1">
                                            <Coins className="w-3 h-3 text-amber-400" />
                                            10 ЗОЛОТИХ
                                        </span>
                                    </div>
                                    <h3 className="font-serif font-bold text-lg text-yellow-300 mb-1">
                                        Кімната на ніч
                                    </h3>
                                    <p className="text-xs text-[#a89988] leading-relaxed mb-4">
                                        Окремий теплий номер на другому поверсі з чистою білизною та пуховою ковдрою. Зцілює рани.
                                    </p>
                                    <div className="space-y-1.5 mb-5 bg-black/40 p-2.5 rounded-xl border border-stone-800 text-xs">
                                        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span>+35 HP гарантовано</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span>+10 HP за кожне очко їжі (до +50 HP)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                            <span>Повне протверезіння</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRest('room')}
                                    disabled={progress.playerGold < 10}
                                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                                        progress.playerGold >= 10
                                            ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 border border-yellow-300 hover:scale-[1.02] active:scale-95 cursor-pointer ring-2 ring-amber-400/30'
                                            : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    <Coins className="w-4 h-4 text-stone-950" />
                                    <span>{progress.playerGold >= 10 ? 'ВІДПОЧИТИ В КІМНАТІ (10 зол.)' : 'БРАКУЄ ЗОЛОТА (ТРЕБА 10)'}</span>
                                </button>
                            </div>

                            {/* Option 3: Deluxe Suite (25 Gold) */}
                            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#2a1b0d] to-[#160f0a] border border-yellow-500/40 hover:border-yellow-400/70 shadow-xl flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-28 h-28 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-yellow-400/60 flex items-center justify-center text-2xl shadow-inner">
                                            👑
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-950/80 border border-yellow-400/60 text-yellow-300 flex items-center gap-1">
                                            <Coins className="w-3 h-3 text-yellow-400" />
                                            25 ЗОЛОТИХ
                                        </span>
                                    </div>
                                    <h3 className="font-serif font-bold text-lg text-amber-200 mb-1">
                                        Королівський люкс
                                    </h3>
                                    <p className="text-xs text-[#a89988] leading-relaxed mb-4">
                                        Найкращі апартаменти: гаряча дерев'яна купіль з цілющими травами, шовкова постіль та вечеря.
                                    </p>
                                    <div className="space-y-1.5 mb-5 bg-black/40 p-2.5 rounded-xl border border-stone-800 text-xs">
                                        <div className="flex items-center gap-2 text-yellow-300 font-black">
                                            <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                            <span>100% ПОВНЕ ЗЦІЛЕННЯ (всі HP)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span>+3 бонусні очки регенерації</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                            <span>Повне очищення та бадьорість</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRest('deluxe')}
                                    disabled={progress.playerGold < 25}
                                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                                        progress.playerGold >= 25
                                            ? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:to-yellow-300 text-stone-950 border border-yellow-200 hover:scale-[1.02] active:scale-95 cursor-pointer ring-2 ring-yellow-400/40'
                                            : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    <Crown className="w-4 h-4 text-stone-950" />
                                    <span>{progress.playerGold >= 25 ? 'ВІДПОЧИТИ В ЛЮКСІ (25 зол.)' : 'БРАКУЄ ЗОЛОТА (ТРЕБА 25)'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Rest Lore Footer */}
                        <div className="p-3.5 rounded-xl bg-black/30 border border-stone-800/80 flex items-center gap-3 text-xs text-[#a89988]">
                            <span className="text-xl shrink-0">💡</span>
                            <div>
                                <span className="text-amber-300 font-bold">Порада мандрівнику: </span>
                                Щоб отримати максимальний ефект від відпочинку в кімнаті, завітайте на вкладку <strong className="text-amber-200 cursor-pointer underline" onClick={() => setMainMode('food')}>«КУХНЯ»</strong> та скуштуйте поживних страв. Кожна страва дарує очки регенерації, які під час сну додатково зцілюють важкі рани.
                            </div>
                        </div>
                    </div>
                ) : mainMode === 'music' ? (
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#b8860b]/40 space-y-6">
                        {/* Header Banner */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2c1d11] via-[#1b120a] to-[#2c1d11] border border-[#b8860b]/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border-2 border-amber-500/60 flex items-center justify-center text-3xl shadow-inner shrink-0 animate-pulse">
                                    🎻
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-lg text-amber-300">
                                        Мандрівний Скрипаль Остап
                                    </h3>
                                    <p className="text-xs text-[#c4b5a0] italic mt-0.5">
                                        «Музика гріє душу мандрівника краще за будь-який ель. Дай мені ноти — і я зіграю тобі будь-яку мелодію!»
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-[#120e0b] px-3 py-1.5 rounded-xl border border-amber-500/30">
                                    <Volume2 className="w-4 h-4 text-amber-500" /> Web Audio Synth
                                </span>
                            </div>
                        </div>

                        {/* Main Grid split */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Preset Melodies Playlist */}
                            <div className="bg-[#15110d] border border-[#b8860b]/30 rounded-2xl p-4 space-y-4">
                                <h4 className="font-serif font-bold text-amber-400 flex items-center gap-2 border-b border-stone-800 pb-2">
                                    <Music className="w-5 h-5 text-amber-500" /> Репертуар скрипаля
                                </h4>
                                <p className="text-xs text-stone-400 leading-relaxed">
                                    Оберіть одну з класичних чи народних українських мелодій, щоб скрипаль виконав її для вас наживо:
                                </p>

                                <div className="space-y-3">
                                    {PRESET_MELODIES.map((melody) => {
                                        const isPlayingThis = isPlayingMelody && playingMelodyId === melody.id;
                                        return (
                                            <div
                                                key={melody.id}
                                                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                                                    isPlayingThis
                                                        ? 'bg-amber-950/30 border-amber-500/50 shadow-inner'
                                                        : 'bg-[#0f0c09] border-stone-800 hover:border-amber-950'
                                                }`}
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-amber-200">{melody.name}</span>
                                                        <span className="text-[10px] bg-stone-900 text-stone-400 px-1.5 py-0.5 rounded font-mono">
                                                            {melody.bpm} BPM
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-stone-400 leading-normal">{melody.description}</p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        if (isPlayingThis) {
                                                            synthPlayer.stop();
                                                            setIsPlayingMelody(false);
                                                            setPlayingMelodyId(null);
                                                            setActiveNoteIndex(null);
                                                        } else {
                                                            setPlayingMelodyId(melody.id);
                                                            setIsPlayingMelody(true);
                                                            setMusicBpm(melody.bpm);
                                                            setCustomNotes(melody.notes);
                                                            synthPlayer.playMelody(
                                                                melody.notes,
                                                                melody.bpm,
                                                                (idx) => setActiveNoteIndex(idx),
                                                                () => {
                                                                    setIsPlayingMelody(false);
                                                                    setPlayingMelodyId(null);
                                                                    setActiveNoteIndex(null);
                                                                }
                                                            );
                                                        }
                                                    }}
                                                    className={`p-2.5 rounded-lg border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                                                        isPlayingThis
                                                            ? 'bg-red-950/40 text-red-400 border-red-500/40 hover:bg-red-900/30'
                                                            : 'bg-amber-950/40 text-amber-400 border-amber-500/40 hover:bg-amber-900/30'
                                                    }`}
                                                >
                                                    {isPlayingThis ? <Square className="w-5 h-5 fill-red-400" /> : <Play className="w-5 h-5 fill-amber-400" />}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Live Notes Visualizer */}
                                {isPlayingMelody && (
                                    <div className="p-3 bg-[#0a0806] border border-amber-500/20 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                                            <span>Скрипаль грає в реальному часі:</span>
                                            <span className="animate-ping w-2 h-2 rounded-full bg-emerald-500" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 text-xs font-mono">
                                            {parseNotes(customNotes, musicBpm).map((note, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`px-2 py-0.5 rounded transition-all ${
                                                        activeNoteIndex === idx
                                                            ? 'bg-amber-500 text-stone-950 font-black scale-110 shadow-lg ring-1 ring-amber-300'
                                                            : 'bg-stone-900 text-stone-500'
                                                    }`}
                                                >
                                                    {note.note}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Custom Note Composer & Visual Keyboard */}
                            <div className="bg-[#15110d] border border-[#b8860b]/30 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                                        <h4 className="font-serif font-bold text-amber-400 flex items-center gap-2">
                                            <Scroll className="w-5 h-5 text-amber-500" /> Створити власну мелодію
                                        </h4>
                                        <button
                                            onClick={() => setShowNotesHelper(!showNotesHelper)}
                                            className="text-stone-400 hover:text-amber-300 text-xs flex items-center gap-1 transition-all"
                                        >
                                            <HelpCircle className="w-4 h-4" /> Довідка з нот
                                        </button>
                                    </div>

                                    {showNotesHelper && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2 text-xs text-stone-400"
                                        >
                                            <p className="font-bold text-amber-200">🎵 Формат запису нот:</p>
                                            <p>Пишіть ноти через пробіл. Наприклад: <code className="text-amber-400 font-mono">E4 G4 A4 B4 C5</code></p>
                                            <p>Ви можете вказати тривалість через двокрапку. <code className="text-amber-400 font-mono">C4:0.5 D4:0.5 E4:1.0</code> (де 1.0 — 1 біт).</p>
                                            <p>Дозволені ноти: <code className="text-yellow-400 font-mono">C4, C#4, D4, D#4, E4, F4, F#4, G4, G#4, A4, A#4, B4, C5, C#5, D5, E5</code>. Також використовуйте <code className="text-amber-400 font-mono">P</code> або <code className="text-amber-400 font-mono">Rest</code> для пауз.</p>
                                        </motion.div>
                                    )}

                                    {/* BPM and Controls */}
                                    <div className="flex items-center gap-4 bg-[#0c0a08] p-3 rounded-xl border border-stone-900">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-stone-400">
                                                <span>Темп (BPM):</span>
                                                <span className="text-amber-300 font-mono font-black">{musicBpm}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="40"
                                                max="240"
                                                value={musicBpm}
                                                onChange={(e) => setMusicBpm(parseInt(e.target.value))}
                                                className="w-full accent-amber-500 bg-stone-800 h-1.5 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Custom Notes text area input */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-stone-400 font-bold block">Ваш нотний лист (Ноти):</label>
                                        <textarea
                                            value={customNotes}
                                            onChange={(e) => setCustomNotes(e.target.value)}
                                            rows={3}
                                            className="w-full p-3 rounded-xl bg-stone-950 border border-stone-800 text-amber-100 font-mono text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder-stone-600"
                                            placeholder="Введіть ноти сюди (напр. C4 D4 E4:2.0 F4 G4)"
                                        />
                                    </div>

                                    {/* Play / Stop for custom sheet */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (isPlayingMelody && playingMelodyId === 'custom') {
                                                    synthPlayer.stop();
                                                    setIsPlayingMelody(false);
                                                    setPlayingMelodyId(null);
                                                    setActiveNoteIndex(null);
                                                } else {
                                                    setPlayingMelodyId('custom');
                                                    setIsPlayingMelody(true);
                                                    synthPlayer.playMelody(
                                                        customNotes,
                                                        musicBpm,
                                                        (idx) => setActiveNoteIndex(idx),
                                                        () => {
                                                            setIsPlayingMelody(false);
                                                            setPlayingMelodyId(null);
                                                            setActiveNoteIndex(null);
                                                        }
                                                    );
                                                }
                                            }}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                                                isPlayingMelody && playingMelodyId === 'custom'
                                                    ? 'bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/30'
                                                    : 'bg-gradient-to-r from-amber-700 to-amber-600 text-stone-950 hover:from-amber-600 hover:to-yellow-500 border border-amber-400/40 hover:scale-[1.02]'
                                            }`}
                                        >
                                            {isPlayingMelody && playingMelodyId === 'custom' ? (
                                                <>
                                                    <Square className="w-4 h-4 fill-red-400" />
                                                    <span>Зупинити скрипку</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 fill-stone-950" />
                                                    <span>Зіграти ваші ноти</span>
                                                </>
                                            )}
                                        </button>

                                        {isPlayingMelody && playingMelodyId !== 'custom' && (
                                            <button
                                                onClick={() => {
                                                    synthPlayer.stop();
                                                    setIsPlayingMelody(false);
                                                    setPlayingMelodyId(null);
                                                    setActiveNoteIndex(null);
                                                }}
                                                className="px-4 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                                Зупинити
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Custom Upload & Download Panel */}
                                <div className="space-y-3 pt-4 border-t border-stone-800/80">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Файли нот:</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Download sheet */}
                                        <button
                                            onClick={() => {
                                                const element = document.createElement("a");
                                                const file = new Blob([customNotes], {type: 'text/plain'});
                                                element.href = URL.createObjectURL(file);
                                                element.download = "my_violin_notes.txt";
                                                document.body.appendChild(element);
                                                element.click();
                                                document.body.removeChild(element);
                                            }}
                                            className="py-2 px-3 rounded-xl border border-stone-800 hover:border-stone-700 bg-stone-950 hover:bg-stone-900 text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                        >
                                            <Download className="w-4 h-4 text-stone-400" /> Завантажити (.txt)
                                        </button>

                                        {/* Upload sheet */}
                                        <label className="py-2 px-3 rounded-xl border border-stone-800 hover:border-stone-700 bg-stone-950 hover:bg-stone-900 text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center">
                                            <Upload className="w-4 h-4 text-stone-400" /> Імпортувати (.txt)
                                            <input
                                                type="file"
                                                accept=".txt"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = (evt) => {
                                                        const result = evt.target?.result;
                                                        if (typeof result === 'string') {
                                                            setCustomNotes(result.trim());
                                                        }
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Visual Keyboard Pads */}
                                <div className="space-y-2 pt-4">
                                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Музичні клавіші (Створити в один клік):</span>
                                    <div className="flex flex-wrap gap-1">
                                        {['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'Rest'].map((noteName) => {
                                            return (
                                                <button
                                                    key={noteName}
                                                    onClick={() => {
                                                        // Play the note immediately on high-fidelity violin synth
                                                        synthPlayer.stop();
                                                        setIsPlayingMelody(false);
                                                        setPlayingMelodyId(null);
                                                        
                                                        if (noteName !== 'Rest') {
                                                            synthPlayer.playSingleNote(noteName, 0.55);
                                                        }

                                                        setCustomNotes(prev => {
                                                            const trimmed = prev.trim();
                                                            const addNote = noteName === 'Rest' ? 'Rest:0.5' : `${noteName}:0.5`;
                                                            return trimmed ? `${trimmed} ${addNote}` : addNote;
                                                        });
                                                    }}
                                                    className="px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 hover:border-amber-500/50 text-[#f5ebd7] text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
                                                >
                                                    {noteName}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => setCustomNotes('')}
                                            className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/30 border border-red-900/30 text-red-400 text-xs font-bold transition-all cursor-pointer"
                                        >
                                            Очистити
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                {/* All Tavern Activities Selector Carousel/Grid with Hover Tooltips */}
                <div className="flex items-center overflow-x-auto p-1.5 bg-[#100d0a] border-b-2 border-[#b8860b]/40 scrollbar-thin scrollbar-thumb-[#b8860b]/30 gap-1.5">
                    {ACTIVITIES.map((act) => {
                        const actStatus = getTavernActivityStatus(progress, tavern, act.id);
                        const isSelected = activeActivity === act.id;
                        const isConquered = actStatus.isConquered;

                        return (
                            <div key={act.id} className="relative group shrink-0">
                                <button
                                    onClick={() => {
                                        setActiveActivity(act.id);
                                        setActiveTier('contenders');
                                    }}
                                    title={`Код гри: ${act.codeName} (${act.label})`}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer border ${
                                        isSelected
                                            ? `${act.borderActive} ${act.themeColor} shadow-md ring-1 ring-amber-400/40`
                                            : 'border-stone-800 bg-[#171310] text-[#a89988] hover:text-[#f5ebd7] hover:bg-[#201a14]'
                                    }`}
                                >
                                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-black shadow-inner">
                                        {act.codeName}
                                    </span>
                                    <span className="text-base">{act.icon}</span>
                                    <span>{act.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                        isConquered 
                                            ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/50' 
                                            : 'bg-black/50 text-stone-300'
                                    }`}>
                                        {actStatus.contendersDefeated + actStatus.championsDefeated}/11
                                    </span>
                                    {isConquered && <span>👑</span>}
                                </button>

                                {/* Hover Tooltip Popup Overlay */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none drop-shadow-2xl">
                                    <div className="bg-[#1c1612] border-2 border-amber-400/90 text-amber-200 text-xs px-3 py-1.5 rounded-xl shadow-2xl font-bold whitespace-nowrap flex items-center gap-2 backdrop-blur-md">
                                        <span className="bg-amber-400 text-stone-950 px-1.5 py-0.5 rounded text-[11px] font-mono font-black shadow-sm">
                                            {act.codeName}
                                        </span>
                                        <span className="text-amber-100">{act.label}</span>
                                    </div>
                                    <div className="w-2.5 h-2.5 bg-[#1c1612] border-r-2 border-b-2 border-amber-400/90 rotate-45 -mt-1.5" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Keeper & Atmosphere Sub-Header */}
                <div className="px-4 py-2 bg-[#1b1510] border-b border-[#b8860b]/30 flex items-center justify-between text-xs text-[#c4b5a0] flex-wrap gap-2">
                    <div className="flex items-center gap-2 italic max-w-3xl">
                        <Beer className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="not-italic font-mono text-[11px] font-black text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 shrink-0">
                            {curConfig.codeName}
                        </span>
                        <span>{tavern.keeperName}: {curConfig.keeperQuote}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-bold ${curConfig.themeColor}`}>
                            Претенденти: {status.contendersDefeated}/8
                        </span>
                        <span className="text-stone-500">•</span>
                        <span className="text-xs font-bold text-yellow-300">
                            Чемпіони: {status.championsDefeated}/3
                        </span>
                    </div>
                </div>

                {/* Sub-Tier Tabs (Претенденти vs Чемпіони vs Мирні НПЦ) */}
                <div className="flex border-b border-[#b8860b]/30 bg-[#16110d] px-4 pt-2 overflow-x-auto scrollbar-none gap-1 items-center">
                    <button
                        onClick={() => setActiveTier('contenders')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer shrink-0 ${
                            activeTier === 'contenders'
                                ? `border-amber-400 ${curConfig.themeColor} bg-[#251d16]`
                                : 'border-transparent text-[#a89988] hover:text-[#f5ebd7]'
                        }`}
                    >
                        <Swords className="w-4 h-4" />
                        <span>
                            ПРЕТЕНДЕНТИ ({activeContenders.length})
                        </span>
                        {status.contendersDefeated === 8 && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTier('champions')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer shrink-0 ${
                            activeTier === 'champions'
                                ? 'border-yellow-400 text-yellow-300 bg-[#251d16]'
                                : 'border-transparent text-[#a89988] hover:text-[#f5ebd7]'
                        }`}
                    >
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span>
                            ЧЕМПІОНИ ({activeChampions.length})
                        </span>
                        {!status.canFightChampions ? (
                            <Lock className="w-3 h-3 text-red-400" />
                        ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                    </button>

                    {activeActivity === 'rpg_cards' && onOpenCardMaster && (
                        <div className="flex items-center gap-2 ml-auto pb-1 shrink-0">
                            <button
                                onClick={onOpenCardMaster}
                                className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                            >
                                <span>🧙‍♂️</span>
                                <span>Майстер Карт</span>
                            </button>
                        </div>
                    )}

                    {(activeActivity === 'toy_soldiers' || activeActivity === 'army_battle' || activeActivity.includes('toy_') || activeActivity.includes('magic_pawns') || activeActivity === 'battle_pawns_6x12' || activeActivity.includes('checkers_war') || activeActivity.includes('military_checkers')) && (
                        <div className="flex items-center gap-2 ml-auto pb-1 shrink-0 flex-wrap justify-end">
                            {(() => {
                                const r = getFigurineReadiness(activeActivity);
                                if (!r) return null;
                                return (
                                    <>
                                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 ${
                                            r.ready 
                                                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300' 
                                                : 'bg-rose-950/70 border-rose-500/60 text-rose-300'
                                        }`}>
                                            <span>{r.ready ? '✅' : '⚠️'}</span>
                                            <span>{r.text}</span>
                                        </span>
                                        {!r.ready && (
                                            <button
                                                onClick={() => handleDirectAutoPurchase(activeActivity)}
                                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 text-xs font-black flex items-center gap-1.5 transition shadow-lg hover:scale-105 cursor-pointer"
                                                title={`Автоматично купити: ${r.missingDescription}`}
                                            >
                                                <Zap className="w-3.5 h-3.5 fill-current" />
                                                <span>Автопокупка ({r.missingCost} 🪙)</span>
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                            {onOpenToyShop && (
                                <button
                                    onClick={onOpenToyShop}
                                    className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                                >
                                    <span>🏪</span>
                                    <span>Магазин іграшок</span>
                                </button>
                            )}
                            {onOpenDecompressionMaster && (
                                <button
                                    onClick={onOpenDecompressionMaster}
                                    className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                                >
                                    <span>✨</span>
                                    <span>Майстер розтискання</span>
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setActiveTier('retired_npcs')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer shrink-0 ${
                            activeTier === 'retired_npcs'
                                ? 'border-emerald-400 text-emerald-300 bg-[#16251b]'
                                : 'border-transparent text-[#a89988] hover:text-[#f5ebd7]'
                        }`}
                    >
                        <Beer className="w-4 h-4 text-amber-400" />
                        <span>
                            МИРНІ НПЦ ({allRetiredInActivity.length})
                        </span>
                        {allRetiredInActivity.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                                {allRetiredInActivity.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Opponents List Container */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#b8860b]/40">
                    {/* Contenders List (Tier 1) */}
                    {activeTier === 'contenders' && (
                        <div className="space-y-3">
                            <div className="text-xs text-[#a89988] flex items-center justify-between pb-1 flex-wrap gap-2">
                                <span>
                                    Перемагайте суперників по черзі від #{1} до #{8}. Після 3 перемог суперник іде на спокій і стає мирним НПЦ!
                                </span>
                                <span className="font-bold text-amber-300">
                                    Активних претендентів: {activeContenders.length}/8
                                </span>
                            </div>

                            {activeContenders.length === 0 ? (
                                <div className="p-8 rounded-2xl bg-[#1a1510] border border-amber-500/40 text-center space-y-3">
                                    <div className="text-4xl">🍺</div>
                                    <h3 className="text-base font-black text-amber-300 font-serif">
                                        Усі 8 претендентів стали мирними НПЦ!
                                    </h3>
                                    <p className="text-xs text-[#c4b5a0] max-w-md mx-auto">
                                        Ви здобули по 3 перемоги над кожним претендентом у «{curConfig.label}». Вони залишили гру та тепер мирно п'ють ель біля каміна.
                                    </p>
                                    <div className="flex items-center justify-center gap-3 pt-2">
                                        <button
                                            onClick={() => setActiveTier('retired_npcs')}
                                            className="px-4 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Beer className="w-3.5 h-3.5" />
                                            <span>Мирні жителі ({allRetiredInActivity.length})</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTier('champions')}
                                            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Trophy className="w-3.5 h-3.5" />
                                            <span>До Чемпіонів ({activeChampions.length})</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {activeContenders.map((opponent) => {
                                        const isDefeated = isActivityOpponentDefeated(progress, opponent.id, activeActivity);
                                        const isUnlocked = isOpponentUnlocked(progress, tavern, opponent, activeActivity);
                                        const winCount = getOpponentWinCount(progress, opponent.id, activeActivity);

                                        const isBrawl = activeActivity === 'brawl';
                                        const totalFistHp = (opponent.baseHp || 100) + (opponent.strength || 15);

                                        return (
                                            <div
                                                key={opponent.id}
                                                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                                                    isDefeated
                                                        ? 'bg-[#1a1c17] border-emerald-800/60 opacity-90'
                                                        : isUnlocked
                                                        ? isBrawl
                                                            ? 'bg-gradient-to-r from-[#291717] to-[#1f1212] border-rose-500/80 shadow-md ring-1 ring-rose-500/30'
                                                            : 'bg-gradient-to-r from-[#292017] to-[#1f1812] border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                                                        : 'bg-[#14100c] border-stone-800 opacity-60'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="text-2xl p-1.5 rounded-full bg-[#241c16] border border-[#b8860b]/40">
                                                                {opponent.avatar}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                                                                        isBrawl 
                                                                            ? 'bg-[#3b1c1c] text-rose-300 border-rose-500/30' 
                                                                            : 'bg-[#382b1f] text-amber-300 border-amber-500/30'
                                                                    }`}>
                                                                        #{opponent.rank} Претендент
                                                                    </span>
                                                                    <span className="text-[10px] text-[#a89988]">
                                                                        {opponent.title}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-sm font-black text-[#f5ebd7] font-serif mt-0.5">
                                                                    {opponent.name}
                                                                </h4>
                                                            </div>
                                                        </div>

                                                        {isDefeated ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                                Переможено
                                                            </span>
                                                        ) : isUnlocked ? (
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse ${
                                                                isBrawl 
                                                                    ? 'bg-rose-500/20 border border-rose-400/60 text-rose-300' 
                                                                    : 'bg-amber-500/20 border border-amber-400/60 text-amber-300'
                                                            }`}>
                                                                Готовий до гри
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-400 text-[10px] font-medium flex items-center gap-1">
                                                                <Lock className="w-3 h-3" />
                                                                Заблоковано
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Win Counter towards NPC Retirement */}
                                                    {winCount > 0 && (
                                                        <div className="flex items-center justify-between text-[11px] bg-[#120d09] px-2 py-1 rounded border border-amber-500/30 mb-2">
                                                            <div className="flex items-center gap-1 text-amber-300 font-bold">
                                                                <span>Перемог:</span>
                                                                <span className="text-yellow-400">
                                                                    {'★'.repeat(winCount)}{'☆'.repeat(3 - winCount)}
                                                                </span>
                                                                <span>({winCount}/3)</span>
                                                            </div>
                                                            <span className="text-[10px] text-amber-400/80">
                                                                {3 - winCount === 1 ? 'Ще 1 перемога — і НПЦ!' : `Ще ${3 - winCount} перемоги`}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <p className="text-xs text-[#c4b5a0] mb-2 italic bg-[#120e0b]/70 p-2 rounded border border-stone-800">
                                                        "{opponent.flavorQuote}"
                                                    </p>

                                                    {/* Stats & Rewards */}
                                                    <div className="space-y-1.5 mb-3 text-[11px] text-[#a89988]">
                                                        {isBrawl ? (
                                                            <div className="p-2 rounded bg-[#160e0e] border border-rose-900/50 space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                 <span className="text-rose-300 font-bold flex items-center gap-1">
                                                                        <Heart className="w-3 h-3 text-rose-400" />
                                                                        Кулачне HP: {totalFistHp}
                                                                    </span>
                                                                    <span className="text-amber-300 font-bold flex items-center gap-1">
                                                                        <Coins className="w-3 h-3 text-amber-400" />
                                                                        +{opponent.rewards.gold} зол.
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-[10px] text-[#c4b5a0]">
                                                                    <span>⚡ Сила: <strong>{opponent.strength || 15}</strong></span>
                                                                    <span>🎯 Спритність: <strong>+{opponent.agility || 10}</strong></span>
                                                                    <span>✨ Досвід: <strong>+{getOpponentXpReward(opponent, activeActivity, winCount + 1)} XP</strong></span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-2 rounded bg-[#16120e] border border-stone-800 space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-amber-300 font-bold">Рівень складності: {opponent.difficulty}</span>
                                                                    </div>
                                                                    <span className="text-amber-300 font-bold flex items-center gap-1">
                                                                        <Coins className="w-3 h-3 text-amber-400" />
                                                                        +{opponent.rewards.gold} зол.
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-[10px] text-[#c4b5a0]">
                                                                    <span>🛡️ Слава: <strong>+{opponent.rewards.reputation}</strong></span>
                                                                    <span>✨ Досвід: <strong>+{getOpponentXpReward(opponent, activeActivity, winCount + 1)} XP</strong></span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                {isUnlocked ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleChallenge(opponent)}
                                                            className={`flex-1 py-2 px-3 rounded-lg font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] cursor-pointer ${
                                                                isDefeated
                                                                    ? 'bg-[#29221b] hover:bg-[#3d3126] text-[#c4b5a0] border border-[#b8860b]/40'
                                                                    : curConfig.btnColor
                                                            }`}
                                                        >
                                                            <span>{curConfig.icon}</span>
                                                            <span>{isDefeated ? `${curConfig.label} (Реванш • ${winCount}/3)` : curConfig.btnLabel}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const attScore = progress.npcRelationships?.[opponent.id] ?? 30;
                                                                const dialogue = getCustomNpcDialogue(opponent, tavern.name, settlement.name, activeActivity, attScore);
                                                                setTalkingNpc({ opponent, dialogue });
                                                            }}
                                                            className="px-3 py-2 rounded-lg bg-[#243324] hover:bg-[#2d402d] border border-emerald-800 text-emerald-300 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                                                            title="Поговорити з НПЦ та пригостити"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Поговорити</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-full py-1.5 text-center text-stone-500 text-xs bg-stone-950/40 rounded border border-stone-800">
                                                        🔒 Переможіть попередника #{opponent.rank - 1} для відкриття
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Champions List (Tier 2) */}
                    {activeTier === 'champions' && (
                        <div className="space-y-4">
                            {/* Champions Locked Warning if Contenders not all defeated */}
                            {!status.canFightChampions && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/70 via-stone-900 to-red-950/70 border border-red-500/50 flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-red-900/50 border border-red-400 text-red-300">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-red-200">
                                            Чемпіонський ярус тимчасово заблоковано!
                                        </h4>
                                        <p className="text-xs text-[#c4b5a0] mt-0.5">
                                            Правила гри «{curConfig.label}» вимагають спершу перемогти всіх <strong>8 претендентів</strong>.
                                            Вам залишилося здолати: <strong className="text-amber-300">
                                                {8 - status.contendersDefeated} претендентів
                                            </strong>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeChampions.length === 0 ? (
                                <div className="p-8 rounded-2xl bg-[#1a1710] border border-yellow-500/50 text-center space-y-3">
                                    <div className="text-4xl">👑</div>
                                    <h3 className="text-base font-black text-yellow-300 font-serif">
                                        Усі чемпіони підкорені по 3 рази!
                                    </h3>
                                    <p className="text-xs text-[#c4b5a0] max-w-md mx-auto">
                                        Ви здобули абсолютну славу в грі «{curConfig.label}». Усі 3 чемпіони завершили кар'єру гравців і стали почесними гостями таверни!
                                    </p>
                                    <div className="flex items-center justify-center pt-2">
                                        <button
                                            onClick={() => setActiveTier('retired_npcs')}
                                            className="px-4 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Beer className="w-3.5 h-3.5" />
                                            <span>Побалакати з чемпіонами-НПЦ ({retiredChampions.length})</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {activeChampions.map((champion) => {
                                        const isDefeated = isActivityOpponentDefeated(progress, champion.id, activeActivity);
                                        const isUnlocked = isOpponentUnlocked(progress, tavern, champion, activeActivity);
                                        const winCount = getOpponentWinCount(progress, champion.id, activeActivity);

                                        const isBrawl = activeActivity === 'brawl';
                                        const totalFistHp = (champion.baseHp || 100) + (champion.strength || 15);

                                        return (
                                            <div
                                                key={champion.id}
                                                className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all relative ${
                                                    isDefeated
                                                        ? 'bg-[#181c16] border-emerald-500/70 shadow-lg'
                                                        : isUnlocked
                                                        ? isBrawl
                                                            ? 'bg-gradient-to-b from-[#2e1616] to-[#1c0f0e] border-rose-400 shadow-xl ring-2 ring-rose-500/40'
                                                            : 'bg-gradient-to-b from-[#2e2316] to-[#1c150e] border-amber-400 shadow-xl ring-2 ring-amber-500/40'
                                                        : 'bg-[#14100c] border-stone-800 opacity-60'
                                                }`}
                                            >
                                                {/* Rank 1 Crown Banner */}
                                                {champion.rank === 1 && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                                                        <Crown className="w-3 h-3" />
                                                        Гросмейстер: {curConfig.label}
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-3">
                                                        <span className="text-3xl p-2 rounded-xl bg-[#241c16] border border-[#b8860b]/40">
                                                            {champion.avatar}
                                                        </span>

                                                        {isDefeated ? (
                                                            <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-black flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                ЗДОЛАНО
                                                            </span>
                                                        ) : isUnlocked ? (
                                                            <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-400 text-yellow-300 text-xs font-black animate-pulse flex items-center gap-1">
                                                                <Flame className="w-3.5 h-3.5 text-yellow-400" />
                                                                ВІДКРИТО
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-full bg-stone-900 border border-stone-700 text-stone-400 text-xs font-medium flex items-center gap-1">
                                                                <Lock className="w-3 h-3" />
                                                                Заблоковано
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="text-[11px] font-bold text-amber-300/90">
                                                        {champion.title}
                                                    </div>
                                                    <h3 className="text-lg font-black text-[#f5ebd7] font-serif mb-2">
                                                        {champion.name}
                                                    </h3>

                                                    {/* Win Counter towards NPC Retirement */}
                                                    {winCount > 0 && (
                                                        <div className="flex items-center justify-between text-[11px] bg-[#140e0a] px-2.5 py-1 rounded-lg border border-yellow-500/30 mb-2.5">
                                                            <div className="flex items-center gap-1 text-yellow-300 font-bold">
                                                                <span>Перемог:</span>
                                                                <span className="text-yellow-400">
                                                                    {'★'.repeat(winCount)}{'☆'.repeat(3 - winCount)}
                                                                </span>
                                                                <span>({winCount}/3)</span>
                                                            </div>
                                                            <span className="text-[10px] text-yellow-400/80">
                                                                {3 - winCount === 1 ? 'Ще 1 перемога — і НПЦ!' : `Ще ${3 - winCount} перемоги`}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <p className="text-xs text-[#c4b5a0] mb-3 italic bg-[#120e0b]/80 p-2.5 rounded-lg border border-stone-800">
                                                        "{champion.flavorQuote}"
                                                    </p>

                                                    {/* Stats */}
                                                    <div className="space-y-1.5 bg-[#16110d] p-2.5 rounded-lg border border-[#3b2d1f] text-xs text-[#c4b5a0] mb-3">
                                                        {isBrawl ? (
                                                            <>
                                                                <div className="flex justify-between">
                                                                    <span>Кулачне Здоров'я:</span>
                                                                    <strong className="text-rose-400">{totalFistHp} HP</strong>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Сила удару:</span>
                                                                    <strong className="text-amber-300">{champion.strength || 20} ⚡</strong>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Спритність (1d20+):</span>
                                                                    <strong className="text-emerald-300">+{champion.agility || 14} 🎯</strong>
                                                                </div>
                                                                <div className="flex justify-between pt-1 border-t border-stone-800">
                                                                    <span>Нагорода:</span>
                                                                    <strong className="text-yellow-300">+{champion.rewards.gold} 🪙, +{getOpponentXpReward(champion, activeActivity, winCount + 1)} XP</strong>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between">
                                                                    <span>Ранг майстерності:</span>
                                                                    <strong className="text-yellow-400">#{champion.rank} Чемпіон</strong>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Складність:</span>
                                                                    <strong className="text-purple-300">{champion.difficulty}</strong>
                                                                </div>
                                                                <div className="flex justify-between pt-1 border-t border-stone-800">
                                                                    <span>Нагорода:</span>
                                                                    <strong className="text-yellow-300">+{champion.rewards.gold} 🪙, +{champion.rewards.reputation} 🛡️, +{getOpponentXpReward(champion, activeActivity, winCount + 1)} XP</strong>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                {isUnlocked ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleChallenge(champion)}
                                                            className={`flex-1 py-2.5 px-2 rounded-xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 hover:scale-[1.02] cursor-pointer ${
                                                                isDefeated
                                                                    ? 'bg-[#29221b] hover:bg-[#3d3126] text-[#c4b5a0] border border-[#b8860b]/40'
                                                                    : 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-black'
                                                            }`}
                                                        >
                                                            <Trophy className="w-3.5 h-3.5" />
                                                            <span>{isDefeated ? `${curConfig.label} (Реванш • ${winCount}/3)` : `Бій за титул Майстра ${curConfig.icon}`}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const attScore = progress.npcRelationships?.[champion.id] ?? 30;
                                                                const dialogue = getCustomNpcDialogue(champion, tavern.name, settlement.name, activeActivity, attScore);
                                                                setTalkingNpc({ opponent: champion, dialogue });
                                                            }}
                                                            className="px-3.5 py-2.5 rounded-xl bg-[#243324] hover:bg-[#2d402d] border border-emerald-800 text-emerald-300 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                                                            title="Поговорити з Чемпіоном та пригостити"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Поговорити</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-full py-2 text-center text-stone-500 text-xs bg-stone-950/40 rounded-xl border border-stone-800">
                                                        {!status.canFightChampions
                                                            ? `🔒 Спочатку здолайте 8 претендентів`
                                                            : `🔒 Здолайте попереднього чемпіона (${champion.rank === 2 ? '3-тє місце' : '2-ге місце'})`}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Retired NPCs List (Tier 3) */}
                    {activeTier === 'retired_npcs' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-[#171c15] border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs flex-wrap gap-2">
                                <div className="flex items-center gap-2 text-emerald-300">
                                    <Beer className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>
                                        <strong>Мирні жителі таверни (НПЦ):</strong> супротивники, яких ви перемогли 3 рази в «{curConfig.label}». Вони зникли зі списку гравців, відпочивають за келихом елю та охоче діляться чутками.
                                    </span>
                                </div>
                                <span className="font-bold text-emerald-400 shrink-0">
                                    Всього НПЦ: {allRetiredInActivity.length}
                                </span>
                            </div>

                            {allRetiredInActivity.length === 0 ? (
                                <div className="p-8 rounded-2xl bg-[#141210] border border-stone-800 text-center space-y-3">
                                    <div className="text-3xl opacity-60">🛋️</div>
                                    <h4 className="text-sm font-bold text-[#c4b5a0]">
                                        Поки що жоден суперник не став звичайним НПЦ
                                    </h4>
                                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                                        Здобудьте 3 перемоги над будь-яким супротивником у «{curConfig.label}», і він зникне зі списку гравців та приєднається до гостей таверни як мирний НПЦ!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {allRetiredInActivity.map((opp) => (
                                        <div
                                            key={opp.id}
                                            className="p-3.5 rounded-xl bg-gradient-to-r from-[#171c15] to-[#121611] border border-emerald-600/50 flex flex-col justify-between shadow-md"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="text-2xl p-1.5 rounded-full bg-[#1b261b] border border-emerald-500/40">
                                                            {opp.avatar}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                                                    Мирний НПЦ
                                                                </span>
                                                                <span className="text-[10px] text-[#a89988]">
                                                                    {opp.title}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-black text-[#f5ebd7] font-serif mt-0.5">
                                                                {opp.name}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                        3/3 перемог
                                                    </span>
                                                </div>

                                                <p className="text-xs text-[#c4b5a0] italic bg-[#0e140d]/80 p-2 rounded border border-emerald-900/40 mb-2">
                                                    «{opp.flavorQuote}»
                                                </p>

                                                {/* Relationship Badge */}
                                                {(() => {
                                                    const score = progress.npcRelationships?.[opp.id] ?? 30;
                                                    const attitude = getAttitudeDetails(score);
                                                    return (
                                                        <div className="text-[11px] bg-[#0d140c] p-2 rounded-lg border border-emerald-950/60 flex items-center justify-between mb-3">
                                                            <span className="text-[#a89988] flex items-center gap-1">
                                                                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                                                                Ставлення:
                                                            </span>
                                                            <span className={`font-black flex items-center gap-1 ${attitude.colorClass}`}>
                                                                <span>{attitude.face}</span>
                                                                <span>{attitude.text} ({score}/100)</span>
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            <button
                                                onClick={() => {
                                                    const attScore = progress.npcRelationships?.[opp.id] ?? 30;
                                                    const dialogue = getCustomNpcDialogue(opp, tavern.name, settlement.name, activeActivity, attScore);
                                                    setTalkingNpc({ opponent: opp, dialogue });
                                                }}
                                                className="w-full py-2 px-3 bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-700 hover:to-teal-600 text-white font-bold text-xs rounded-lg transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span>Поговорити з {opp.name}</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Status Bar */}
                <div className="p-3 sm:p-4 bg-[#140f0c] border-t border-[#b8860b]/40 flex justify-between items-center text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[#a89988]">Золото:</span>
                        <strong className="text-amber-300">{progress.playerGold} 🪙</strong>
                        <span className="text-stone-600">|</span>
                        <span className="text-[#a89988]">Слава:</span>
                        <strong className="text-amber-200">{progress.playerReputation} 🛡️</strong>
                        <span className="text-stone-600">|</span>
                        <span className="text-[#a89988]">Рівень:</span>
                        <strong className="text-yellow-300">{playerStats.level} ({playerStats.xp}/{playerStats.xpToNextLevel} XP)</strong>
                    </div>

                    <div className="flex items-center gap-2">
                        {onOpenCharacterModal && (
                            <button
                                onClick={onOpenCharacterModal}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black rounded-full flex items-center gap-1.5 transition shadow cursor-pointer"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                <span>Характеристики {playerStats.statPoints > 0 ? `(+${playerStats.statPoints})` : ''}</span>
                            </button>
                        )}

                        <button
                            onClick={onBackToSettlement}
                            className="px-4 py-1.5 bg-[#261f17] hover:bg-[#382b20] border border-[#b8860b]/50 rounded-full font-bold text-[#f5ebd7] transition-all cursor-pointer"
                        >
                            До будівель поселення
                        </button>
                    </div>
                </div>
                </>
                )}

                {/* NPC Dialogue Modal Overlay */}
                <AnimatePresence>
                    {talkingNpc && talkingNpc.opponent && (() => {
                        const opp = talkingNpc.opponent;
                        if (!opp) return null;
                        const score = (opp.id && progress.npcRelationships?.[opp.id] !== undefined) ? progress.npcRelationships[opp.id]! : 30;
                        const attDetails = getAttitudeDetails(score);
                        const currentDialogue = talkingNpc.dialogue || getCustomNpcDialogue(opp, tavern?.name || 'Таверна', settlement?.name || 'Поселення', activeActivity, score);

                        // Curated treats list
                        const treatBeer = alcoholMenu.beers[0];
                        const treatWine = alcoholMenu.wines[0];
                        const treatFood = foodMenu[0];

                        const treats = [
                            ...(treatBeer ? [{ name: treatBeer.name, price: treatBeer.price, boost: Math.ceil(treatBeer.price * 1.5) + 3, icon: '🍺', type: 'drink' as const }] : []),
                            ...(treatWine ? [{ name: treatWine.name, price: treatWine.price, boost: Math.ceil(treatWine.price * 1.5) + 5, icon: '🍷', type: 'drink' as const }] : []),
                            ...(treatFood ? [{ name: treatFood.name, price: treatFood.cost, boost: Math.ceil(treatFood.cost * 1.2) + 6, icon: treatFood.emoji || '🍲', type: 'food' as const }] : [])
                        ];

                        return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 15 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 15 }}
                                    className="relative w-full max-w-md bg-gradient-to-b from-[#1c221a] to-[#121611] border-2 border-emerald-500/70 rounded-2xl p-5 text-[#f5ebd7] shadow-2xl space-y-4"
                                >
                                    <button
                                        onClick={() => {
                                            setTalkingNpc(null);
                                            setThankYouMessage(null);
                                        }}
                                        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl p-2 rounded-full bg-[#243324] border border-emerald-500/50">
                                            {opp.avatar}
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                                                {opp.title}
                                            </div>
                                            <h3 className="text-base font-black font-serif text-[#f5ebd7]">
                                                {opp.name}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Relationship scale bar */}
                                    <div className="space-y-1 bg-[#0d130c] p-2.5 rounded-xl border border-emerald-950/60">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-[#a89988] flex items-center gap-1">
                                                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                                                Шкала ставлення:
                                            </span>
                                            <span className={`${attDetails.colorClass} flex items-center gap-1`}>
                                                <span>{attDetails.face}</span>
                                                <span>{attDetails.text} ({score}/100)</span>
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-stone-900 overflow-hidden border border-emerald-950">
                                            <div
                                                className={`h-full transition-all duration-500 ${attDetails.barColorClass}`}
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Dialogue Block */}
                                    {thankYouMessage ? (
                                        <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2.5 text-xs text-[#dcd1be]">
                                            <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                                                <span>Пригощання прийнято!</span>
                                            </div>
                                            <div className="italic text-amber-200">
                                                {thankYouMessage}
                                            </div>
                                            <button
                                                onClick={() => setThankYouMessage(null)}
                                                className="w-full mt-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] rounded-lg transition cursor-pointer"
                                            >
                                                Продовжити бесіду
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-3.5 bg-[#0e140d] rounded-xl border border-emerald-900/60 space-y-2.5 text-xs text-[#dcd1be]">
                                            <div className="italic text-emerald-200 leading-relaxed">
                                                "{currentDialogue.quote}"
                                            </div>
                                            <div className="text-[#c4b5a0] pt-2 border-t border-emerald-950/80">
                                                💡 <strong>Чутка з таверни:</strong> {currentDialogue.loreTip}
                                            </div>
                                            <div className="text-amber-300 pt-1.5 flex items-center gap-1.5 font-semibold">
                                                <Beer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                <span>"{currentDialogue.toastQuote}"</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Buy Food and Drink Options */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-black text-amber-300 flex items-center gap-1">
                                            <span>🎁 Пригостити супротивника випивкою чи стравою:</span>
                                        </h4>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {treats.map((t, idx) => {
                                                const canAfford = progress.playerGold >= t.price;
                                                return (
                                                    <button
                                                        key={idx}
                                                        disabled={!canAfford}
                                                        onClick={() => handleTreatNpc(t)}
                                                        className={`w-full p-2 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                                                            canAfford
                                                                ? 'bg-[#181d15] hover:bg-[#20271c] border-emerald-800/80 text-emerald-100 hover:scale-[1.01]'
                                                                : 'bg-[#1a1512] border-stone-800 text-stone-500 opacity-60 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{t.icon}</span>
                                                            <div className="text-left">
                                                                <div className="font-bold">{t.name}</div>
                                                                <div className="text-[10px] text-[#a89988]">Ставлення: +{t.boost}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-black text-amber-300">{t.price}</span>
                                                            <span className="text-amber-400 text-[11px]">🪙</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="text-[10px] text-stone-400 text-right">
                                            Ваш гаманець: <strong className="text-amber-300">{progress.playerGold} 🪙</strong>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2.5 pt-2.5 border-t border-emerald-950/60 mt-2">
                                        {score === 100 && (
                                            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                <div className="space-y-1">
                                                    <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs sm:text-sm">
                                                        <span>⚔️</span> Найняти {opp.name} в загін!
                                                    </div>
                                                    <div className="text-[#a89988] text-[10px]">
                                                        {opp.title} ({opp.difficulty} • HP: {opp.baseHp || opp.hp} • Сил: {opp.strength || 3} • Спр: {opp.agility || 3})
                                                    </div>
                                                </div>
                                                {progress.hiredNpcIds?.includes(opp.id) ? (
                                                    <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-black font-mono self-start sm:self-auto whitespace-nowrap">
                                                        ВЖЕ У ЗАГОНІ
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleHireNpc(opp)}
                                                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-[11px] rounded-lg transition shadow-md active:scale-95 cursor-pointer flex items-center gap-1 self-start sm:self-auto whitespace-nowrap"
                                                    >
                                                        <span>Найняти за 500</span>
                                                        <span className="text-xs">🪙</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setTalkingNpc(null);
                                                    setThankYouMessage(null);
                                                }}
                                                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
                                            >
                                                Подякувати та попрощатися
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })()}
                </AnimatePresence>
            </motion.div>

            {/* 🛒 Auto-Purchase Figurine / Checker Confirmation Modal */}
            <AnimatePresence>
                {autoPurchasePrompt && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md p-6 rounded-2xl bg-[#1a140f] border-2 border-amber-500/60 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-[#f5ebd7] space-y-4"
                        >
                            <div className="flex items-start justify-between gap-3 border-b border-amber-950/60 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
                                        ⚡
                                    </div>
                                    <div>
                                        <h3 className="font-serif font-black text-base text-amber-300">
                                            Автопокупка для гри
                                        </h3>
                                        <p className="text-xs text-stone-400">
                                            {autoPurchasePrompt.opp.name} ({autoPurchasePrompt.opp.title})
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAutoPurchasePrompt(null)}
                                    className="text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/60 space-y-1.5">
                                    <div className="flex items-center justify-between text-stone-300">
                                        <span className="font-bold">Потрібно для гри:</span>
                                        <span className="text-amber-200 font-semibold">{autoPurchasePrompt.req.req}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-rose-300">
                                        <span className="font-bold">Відсутньо:</span>
                                        <span className="font-black">{autoPurchasePrompt.req.missingDescription}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-yellow-300 pt-1 border-t border-amber-900/40">
                                        <span className="font-bold">Вартість автопокупки:</span>
                                        <span className="font-black text-sm flex items-center gap-1">
                                            {autoPurchasePrompt.req.missingCost} 🪙
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-stone-800">
                                    <span className="text-stone-400">Ваше золото:</span>
                                    <span className={`font-mono font-bold ${progress.playerGold >= autoPurchasePrompt.req.missingCost ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {progress.playerGold} 🪙
                                    </span>
                                </div>

                                {progress.playerGold < autoPurchasePrompt.req.missingCost && (
                                    <p className="text-[11px] text-rose-400 text-center font-semibold">
                                        ⚠️ Недостатньо золота для автопокупки (не вистачає {autoPurchasePrompt.req.missingCost - progress.playerGold} 🪙).
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                {progress.playerGold >= autoPurchasePrompt.req.missingCost ? (
                                    <button
                                        onClick={handleConfirmAutoPurchaseAndPlay}
                                        className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition hover:scale-[1.02]"
                                    >
                                        <Zap className="w-4 h-4 fill-current" />
                                        <span>Купити все необхідне та почати гру ({autoPurchasePrompt.req.missingCost} 🪙)</span>
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-2.5 px-4 bg-stone-800/80 text-stone-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <span>Недостатньо золота</span>
                                    </button>
                                )}

                                <div className="flex gap-2">
                                    {onOpenToyShop && (
                                        <button
                                            onClick={() => {
                                                setAutoPurchasePrompt(null);
                                                onOpenToyShop();
                                            }}
                                            className="flex-1 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                        >
                                            <span>🏪</span>
                                            <span>Магазин Іграшок</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setAutoPurchasePrompt(null)}
                                        className="flex-1 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition cursor-pointer"
                                    >
                                        Скасувати
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Class & Spells Comprehensive Guidebook Modal */}
            <ClassGuidebookModal
                isOpen={showClassGuideModal}
                onClose={() => setShowClassGuideModal(false)}
            />
        </div>
    );
}

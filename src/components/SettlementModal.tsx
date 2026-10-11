import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SettlementData, TavernData, WorldProgress, Card } from '../types';
import { getTavernStatus } from '../lib/worldData';
import { createDeck } from '../lib/gameLogic';
import { 
    Castle, 
    Home, 
    Beer, 
    Trophy, 
    CheckCircle2, 
    Lock, 
    ArrowLeft, 
    ShieldAlert, 
    Users, 
    Sparkles, 
    ChevronRight,
    Hammer,
    Landmark,
    Scissors,
    Coins,
    Heart,
    Briefcase,
    TrendingUp,
    Package,
    ShoppingBag
} from 'lucide-react';
import { calculateTotalHealth } from '../lib/brawlEngine';
import { MerchantGuildModal } from './MerchantGuildModal';

interface SettlementModalProps {
    settlement: SettlementData;
    progress: WorldProgress;
    onSelectTavern: (tavern: TavernData) => void;
    onClose: () => void;
    onCraftCard: (card: Card) => void;
    onProgressUpdate?: (progress: WorldProgress) => void;
    onOpenToyShop?: () => void;
}

export function SettlementModal({
    settlement,
    progress,
    onSelectTavern,
    onClose,
    onCraftCard,
    onProgressUpdate,
    onOpenToyShop
}: SettlementModalProps) {
    const [isCraftingOpen, setIsCraftingOpen] = useState(false);
    const [isGuildOpen, setIsGuildOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'hearts' | 'diamonds' | 'clubs' | 'spades' | 'special'>('hearts');

    const typeLabel = settlement.type === 'city' 
        ? 'Столиця / Велике Місто' 
        : (settlement.type === 'village' ? 'Село' : (settlement.type === 'graveyard' ? '🪦 Кладовище / Некрополь' : (settlement.type === 'ruins' ? '🏰 Стародавні Руїни' : 'Хутір')));

    const typeBadgeBg = settlement.type === 'city'
        ? 'bg-red-950/80 border-amber-400 text-amber-300'
        : (settlement.type === 'village' ? 'bg-amber-950/80 border-amber-600 text-amber-200' : (settlement.type === 'graveyard' ? 'bg-[#27152b]/90 border-purple-500 text-purple-200' : (settlement.type === 'ruins' ? 'bg-[#2b1e15]/90 border-amber-700 text-amber-300' : 'bg-stone-900/80 border-stone-600 text-stone-300')));

    // Generate unique card options
    const allCards = createDeck('classic');
    const uniqueCards: Card[] = [];
    const seen = new Set<string>();
    allCards.forEach(c => {
        const key = `${c.rank}:${c.suit}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueCards.push(c);
        }
    });

    // Filter cards based on active tab
    const filteredCards = uniqueCards.filter(c => {
        if (activeTab === 'hearts') return c.suit === '♥';
        if (activeTab === 'diamonds') return c.suit === '♦';
        if (activeTab === 'clubs') return c.suit === '♣';
        if (activeTab === 'spades') return c.suit === '♠';
        // Special cards (Jokers, Alchemists, Death, etc.)
        const standardSuits = ['♥', '♦', '♣', '♠'];
        return !standardSuits.includes(String(c.suit));
    });

    const playerGold = progress.playerGold;
    const playerPieces = progress.cardPieces || 0;
    const hasGold = playerGold >= 25;
    const hasPieces = playerPieces >= 20;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="relative w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[85vh] bg-[#171310] border-2 border-[#b8860b]/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header Banner */}
                <div className="relative p-5 sm:p-6 bg-gradient-to-b from-[#2d2218] to-[#1a1410] border-b border-[#b8860b]/40">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeBadgeBg} flex items-center gap-1`}>
                                    <span>{settlement.type === 'city' ? '🏰' : (settlement.type === 'village' ? '🏘️' : '🏡')}</span>
                                    <span>{typeLabel}</span>
                                </span>
                                <span className="text-xs text-[#a89988] bg-black/40 px-2.5 py-0.5 rounded-full border border-stone-800">
                                    Регіон: {settlement.region}
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#f5ebd7] tracking-wide flex items-center gap-2">
                                {settlement.name}
                            </h2>
                            <p className="text-xs sm:text-sm text-[#c4b5a0] mt-1 max-w-2xl leading-relaxed">
                                {settlement.description}
                            </p>
                        </div>

                        <button
                            onClick={isCraftingOpen ? () => setIsCraftingOpen(false) : onClose}
                            className="p-2 text-[#a89988] hover:text-[#f5ebd7] hover:bg-[#2e231b] rounded-full border border-stone-700 transition-colors"
                            title={isCraftingOpen ? "Повернутися до споруд" : "Повернутися на карту"}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#b8860b]/40">
                    {!isCraftingOpen ? (
                        <div className="space-y-4">
                            {/* Buildings / Graveyard Lairs Header */}
                            <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-2">
                                <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 font-serif">
                                    <span>{settlement.type === 'graveyard' ? '💀' : (settlement.type === 'ruins' ? '🗡️' : '🏛️')}</span> 
                                    {settlement.type === 'graveyard' 
                                        ? 'Лігва нежиті та склепи монстрів:' 
                                        : (settlement.type === 'ruins' ? 'Лігва розбійників та потвор:' : 'Будівлі населеного пункту:')}
                                </h3>
                                <span className="text-xs text-[#a89988]">
                                    {settlement.type === 'graveyard'
                                        ? 'Блукаючі монстри: скелети, зомбі, гулі, упирі, личі'
                                        : (settlement.type === 'ruins' ? 'Оберіть притулок для бою' : 'Оберіть заклад для відвідування')}
                                </span>
                            </div>

                            {/* Active Encounters List (Crypts/Taverns + Altar/Card Workshop) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Taverns / Graveyard Crypts in Settlement */}
                                {(settlement?.taverns || []).map((tavern) => {
                                    const status = getTavernStatus(progress, tavern);
                                    const isGrave = settlement.type === 'graveyard';

                                    return (
                                        <motion.div
                                            key={tavern.id}
                                            whileHover={{ scale: 1.01 }}
                                            className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                                status.isConquered
                                                    ? 'bg-gradient-to-br from-[#2b2214] to-[#1f1910] border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                                                    : isGrave
                                                        ? 'bg-[#1b1220] hover:bg-[#25182c] border-purple-800/50 hover:border-purple-500 shadow-lg'
                                                        : 'bg-[#201913] hover:bg-[#281f18] border-[#b8860b]/40 hover:border-[#d4af37]'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-2xl p-1.5 rounded-lg border ${isGrave ? 'bg-[#281630] border-purple-600/40 text-purple-300' : 'bg-[#2e2319] border-[#b8860b]/40'}`}>
                                                            {tavern.sign}
                                                        </span>
                                                        <div>
                                                            <h4 className="font-bold text-base text-[#f5ebd7] font-serif">
                                                                {tavern.name}
                                                            </h4>
                                                            <div className="text-[11px] text-[#a89988]">
                                                                {isGrave ? 'Повелитель / Вартовий:' : 'Шинкар:'} <span className={isGrave ? 'text-purple-300' : 'text-amber-200'}>{tavern.keeperName}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {status.isConquered ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/60 text-yellow-300 text-[10px] font-black flex items-center gap-1 shadow-sm">
                                                            <Trophy className="w-3 h-3 text-yellow-400" />
                                                            {isGrave ? 'Очищено!' : 'Підкорено!'}
                                                        </span>
                                                    ) : (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isGrave ? 'bg-purple-900/40 border-purple-500/40 text-purple-300' : 'bg-amber-600/20 border-amber-500/40 text-amber-300'}`}>
                                                            {isGrave ? 'Склеп відкрито' : 'Відкрито'}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-[#c4b5a0] mb-3 italic">
                                                    "{tavern.atmosphere}"
                                                </p>

                                                {/* Tournament Progress Meter */}
                                                <div className="space-y-1.5 bg-[#140f0c] p-2.5 rounded-lg border border-[#3d2f24] mb-3 text-xs">
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-[#a89988] flex items-center gap-1">
                                                            <span>{isGrave ? '💀' : '⚔️'}</span> {isGrave ? 'Блукаюча нежить:' : 'Претенденти:'}
                                                        </span>
                                                        <span className={`font-bold ${status.contendersDefeated === status.totalContenders ? 'text-emerald-400' : 'text-amber-300'}`}>
                                                            {status.contendersDefeated} / {status.totalContenders}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-[#241c16] rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className={isGrave ? "bg-purple-500 h-full rounded-full transition-all" : "bg-amber-500 h-full rounded-full transition-all"}
                                                            style={{ width: `${(status.contendersDefeated / status.totalContenders) * 100}%` }}
                                                        />
                                                    </div>

                                                    <div className="flex justify-between text-[11px] pt-1">
                                                        <span className="text-[#a89988] flex items-center gap-1">
                                                            <span>{isGrave ? '👑' : '🏆'}</span> {isGrave ? 'Володарі цвинтаря:' : 'Чемпіони:'}
                                                        </span>
                                                        <span className={`font-bold ${status.championsDefeated === status.totalChampions ? 'text-yellow-400' : 'text-amber-300'}`}>
                                                            {status.championsDefeated} / {status.totalChampions}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-[#241c16] rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className="bg-yellow-400 h-full rounded-full transition-all"
                                                            style={{ width: `${(status.championsDefeated / status.totalChampions) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Enter Button */}
                                            <button
                                                onClick={() => onSelectTavern(tavern)}
                                                className={`w-full py-2 font-black text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] ${
                                                    isGrave 
                                                        ? 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 hover:from-purple-600 hover:to-fuchsia-500 text-white'
                                                        : 'bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 hover:from-amber-600 hover:to-yellow-500 text-black'
                                                }`}
                                            >
                                                {isGrave ? (
                                                    <>
                                                        <span className="text-sm">💀</span>
                                                        <span>Битися з нежиттю у склепі</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Beer className="w-3.5 h-3.5" />
                                                        <span>Зайти в таверну</span>
                                                    </>
                                                )}
                                                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                                            </button>
                                        </motion.div>
                                    );
                                })}

                                {/* CARD MASTER WORKSHOP / ALTAR */}
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                        settlement.type === 'graveyard'
                                            ? 'border-purple-500/50 bg-[#1b1220] hover:bg-[#25182c] hover:border-purple-400'
                                            : 'border-amber-500/50 bg-[#1e1712] hover:bg-[#261d16] hover:border-amber-400'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl p-1.5 rounded-lg bg-[#2e2319] border border-amber-500/40">
                                                    🔮
                                                </span>
                                                <div>
                                                    <h4 className="font-bold text-base text-[#f5ebd7] font-serif flex items-center gap-1.5">
                                                        <span>{settlement.type === 'graveyard' ? 'Вівтар Некромантії' : 'Майстер Карток'}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">НПЦ</span>
                                                    </h4>
                                                    <div className="text-[11px] text-[#a89988]">
                                                        Спеціаліст: <span className="text-amber-200">{settlement.type === 'graveyard' ? 'Темний Некромант' : 'Майстер Тіней'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                                                {settlement.type === 'graveyard' ? 'Вівтар' : 'Майстерня'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-[#c4b5a0] mb-4 leading-relaxed">
                                            {settlement.type === 'graveyard'
                                                ? '"У мороці мого склепу за 25 золота та 20 шматочків карток я підніму темні сили та викую будь-яку унікальну карту для твоєї колоди!"'
                                                : '"За 25 золота та 20 шматочків карток я можу створити будь-яку унікальну карту для твоєї RPG колоди на твій вибір!"'}
                                        </p>

                                        <div className="flex gap-4 p-2.5 rounded-lg bg-[#140f0c] border border-stone-800 text-xs mb-4">
                                            <div className="flex items-center gap-1.5">
                                                <Coins className="w-4 h-4 text-yellow-400" />
                                                <span className="text-stone-400">Ціна:</span>
                                                <span className="font-black text-yellow-300">25</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Scissors className="w-4 h-4 text-amber-400" />
                                                <span className="text-stone-400">Шматочки:</span>
                                                <span className="font-black text-amber-300">20</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsCraftingOpen(true)}
                                        className={`w-full py-2 font-black text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] ${
                                            settlement.type === 'graveyard'
                                                ? 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 hover:from-purple-600 hover:to-fuchsia-500 text-white'
                                                : 'bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 hover:from-yellow-500 hover:to-amber-400 text-black'
                                        }`}
                                    >
                                        <Hammer className="w-3.5 h-3.5" />
                                        <span>{settlement.type === 'graveyard' ? 'Створити карту на Вівтарі' : 'Створити RPG Карту'}</span>
                                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                                    </button>
                                </motion.div>
                                
                                {/* HEALER / HOSPITAL */}
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                        settlement.type === 'graveyard'
                                            ? 'border-red-900/50 bg-[#251111] hover:bg-[#321616] hover:border-red-700'
                                            : 'border-red-900/50 bg-[#251816] hover:bg-[#2d1c1a] hover:border-red-700'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl p-1.5 rounded-lg bg-[#3a1a1a] border border-red-500/40">
                                                    ❤️‍🩹
                                                </span>
                                                <div>
                                                    <h4 className="font-bold text-base text-[#f5ebd7] font-serif flex items-center gap-1.5">
                                                        <span>{settlement.type === 'graveyard' ? 'Кривавий Знахар' : 'Міський Цілитель'}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">ЛІКАРНЯ</span>
                                                    </h4>
                                                    <div className="text-[11px] text-[#a89988]">
                                                        Послуги: <span className="text-red-300">Відновлення Здоров'я</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[#c4b5a0] mb-3 italic">
                                            {settlement.type === 'graveyard'
                                                ? '"Ти виглядаєш жахливо. Трохи моєї магії крові — і ти будеш як новенький. Всього 10 золотих."'
                                                : '"Лікування ран та зцілення травм. Повне відновлення за символічну плату в 10 золотих."'}
                                        </p>
                                        <div className="flex gap-4 p-2.5 rounded-lg bg-[#140f0c] border border-stone-800 text-xs mb-4">
                                            <div className="flex items-center gap-1.5">
                                                <Coins className="w-4 h-4 text-yellow-400" />
                                                <span className="text-stone-400">Ціна:</span>
                                                <span className="font-black text-yellow-300">10</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Heart className="w-4 h-4 text-red-500" />
                                                <span className="text-stone-400">Відновлення:</span>
                                                <span className="font-black text-red-400">Повне (Макс HP)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (progress.playerGold >= 10) {
                                                const maxHp = calculateTotalHealth(progress.playerStats?.baseHp ?? 100, progress.playerStats?.strength ?? 15);
                                                if ((progress.playerStats?.currentHp ?? maxHp) >= maxHp) {
                                                    alert("Ваше здоров'я вже на максимумі, лікування не потрібне!");
                                                    return;
                                                }
                                                const updated = {
                                                    ...progress,
                                                    playerGold: progress.playerGold - 10,
                                                    playerStats: {
                                                        ...progress.playerStats,
                                                        currentHp: maxHp
                                                    }
                                                };
                                                onProgressUpdate?.(updated);
                                                alert("Ви успішно вилікували всі рани!");
                                            } else {
                                                alert("Недостатньо золота для лікування!");
                                            }
                                        }}
                                        className={`w-full py-2 font-black text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] ${
                                            progress.playerGold >= 10
                                                ? 'bg-gradient-to-r from-red-700 via-rose-600 to-red-700 hover:from-red-600 hover:to-rose-500 text-white'
                                                : 'bg-[#2a2a2a] text-stone-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <Heart className="w-3.5 h-3.5" />
                                        <span>Відновити Здоров'я</span>
                                    </button>
                                </motion.div>

                                {/* TOY SHOP & 40 RPG CARDS STORE */}
                                {settlement.type !== 'graveyard' && settlement.type !== 'ruins' && (
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        className="p-4 rounded-xl border border-amber-500/60 bg-gradient-to-br from-[#2a1d15] via-[#1d1410] to-[#251711] hover:border-amber-400 shadow-xl flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl p-1.5 rounded-lg bg-[#3a2518] border border-amber-500/40">
                                                        🏪
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-base text-[#f5ebd7] font-serif flex items-center gap-1.5 flex-wrap">
                                                            <span>Магазин Іграшок та РПГ Карт</span>
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-sans font-bold">
                                                                ШАШКИ-ЗАГОНИ & 40 КАРТ
                                                            </span>
                                                        </h4>
                                                        <div className="text-[11px] text-[#a89988]">
                                                            Торговець: <span className="text-amber-200">Майстер Іграшок та Бойових Карт</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                                                    Крамниця
                                                </span>
                                            </div>

                                            <p className="text-xs text-[#c4b5a0] mb-3 leading-relaxed">
                                                «Придбайте армійські шашки-загони (12 бійців) та військові шашки-загони (120 бійців), повні комплекти із 40 випадкових бойових карт, а також набори бойових пішаків, шашок і солдатиків!»
                                            </p>

                                            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#140f0c] border border-stone-800 text-xs mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm">⚔️🔴</span>
                                                    <span className="text-stone-400">Шашки-Загони:</span>
                                                    <span className="font-black text-red-300">12 & 120 б.</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm">🎴📦</span>
                                                    <span className="text-stone-400">40 Карт РПГ:</span>
                                                    <span className="font-black text-yellow-300">60 зол</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onOpenToyShop?.()}
                                            className="w-full py-2 font-black text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 cursor-pointer"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            <span>Відкрити Магазин Іграшок (Шашки-Загони, Карти, Солдатики)</span>
                                            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* MERCHANT GUILD (AVAILABLE IN CITIES & CASTLES) */}
                                {settlement.type !== 'graveyard' && settlement.type !== 'ruins' && (
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        className="p-4 rounded-xl border border-amber-500/70 bg-gradient-to-br from-[#291821] via-[#1d1118] to-[#2b1713] hover:border-amber-400 shadow-xl flex flex-col justify-between col-span-1 sm:col-span-2"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-3xl p-2 rounded-xl bg-[#3c212a] border border-amber-500/50 shadow-inner">
                                                        🏛️
                                                    </span>
                                                    <div>
                                                        <h4 className="font-black text-base text-amber-100 font-serif flex items-center gap-2 flex-wrap">
                                                            <span>Торгова Гільдія Купців</span>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-sans font-black">
                                                                19 КАТЕГОРІЙ ТОВАРІВ
                                                            </span>
                                                        </h4>
                                                        <div className="text-[11px] text-[#cbb8a3]">
                                                            Магістрат: <span className="text-amber-300 font-bold">Гільдмейстер Товарної Біржі</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                                                    {(progress.guildInvestments || []).length > 0 
                                                        ? `📦 Активних угод: ${(progress.guildInvestments || []).length}` 
                                                        : 'Міська Гільдія'}
                                                </span>
                                            </div>

                                            <p className="text-xs text-[#e2d5c3] mb-3 leading-relaxed">
                                                «Вкладайте золото у 19 категорій міських товарів: від хліба, худоби, риби та прянощів до кованої зброї, металів, книг і коштовностей. Споряджайте каравани, заробляйте щоденні дивіденди та торгуйте на різниці цін між містами!»
                                            </p>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#120b0f] p-2.5 rounded-xl border border-stone-800 text-xs mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                                                    <span className="text-stone-400">Товари:</span>
                                                    <span className="font-black text-amber-300">19 категорій</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="text-stone-400">Дохід:</span>
                                                    <span className="font-black text-emerald-300">Дивіденди %</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                                    <span className="text-stone-400">Прибуток:</span>
                                                    <span className="font-black text-yellow-300">+{progress.guildTotalProfit || 0} зол</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Package className="w-3.5 h-3.5 text-cyan-400" />
                                                    <span className="text-stone-400">Репутація:</span>
                                                    <span className="font-black text-cyan-300">{progress.guildReputation || 0} XP</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setIsGuildOpen(true)}
                                            className="w-full py-2.5 font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 cursor-pointer"
                                        >
                                            <Landmark className="w-4 h-4" />
                                            <span>Увійти до Торгової Гільдії (Вкластися в товари)</span>
                                            <ChevronRight className="w-4 h-4 ml-auto" />
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Atmosphere / Graveyard note instead of town buildings */}
                            {settlement.type === 'graveyard' ? (
                                <div className="mt-6 border-t border-purple-900/40 pt-4">
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#221327] to-[#150a19] border border-purple-800/60 shadow-lg flex items-center gap-3.5 text-xs">
                                        <span className="text-3xl p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 shadow-inner">🪦</span>
                                        <div>
                                            <div className="font-bold text-purple-200 font-serif text-sm flex items-center gap-2">
                                                <span>На кладовищі немає мирних будівель</span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-900/60 border border-purple-400/40 text-purple-300 font-sans">Зона монстрів</span>
                                            </div>
                                            <div className="text-[11px] text-purple-300/80 mt-1 leading-relaxed">
                                                Тут не знайти ратуш чи торгових залів. На цьому цвинтарі блукають лише скелети, зомбі, гулі, упирі та прадавні личі. Очистіть усі склепи від нежиті!
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : settlement.type !== 'ruins' ? (
                                <div className="mt-6 border-t border-[#b8860b]/20 pt-4">
                                    <div className="text-xs text-[#a89988] font-bold uppercase tracking-wider mb-2">
                                        Інші будівлі поселення (в розробці):
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div className="p-3 rounded-xl bg-[#140f0c]/60 border border-stone-800 opacity-60 flex items-center gap-2 text-xs">
                                            <Landmark className="w-4 h-4 text-stone-500" />
                                            <div>
                                                <div className="font-bold text-stone-400">Ратуша & Скарбниця</div>
                                                <div className="text-[10px] text-stone-500">Зачинено</div>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-[#140f0c]/60 border border-stone-800 opacity-60 flex items-center gap-2 text-xs">
                                            <Sparkles className="w-4 h-4 text-stone-500" />
                                            <div>
                                                <div className="font-bold text-stone-400">Вежа Алхіміка</div>
                                                <div className="text-[10px] text-stone-500">Зачинено</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        // CRAFTING BOARD VIEW
                        <div className="space-y-4">
                            {/* Subheader and Resources */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#b8860b]/30 pb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2 font-serif">
                                        <span>🔮</span> Майстерня створення RPG карт:
                                    </h3>
                                    <p className="text-xs text-[#a89988] mt-0.5">
                                        Оберіть картку для створення. Кожен майстер у місті може зробити максимум 3 однакові карти.
                                    </p>
                                </div>

                                {/* Resource indicators */}
                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-stone-800">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs">
                                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                        <span className="text-stone-400">Золото:</span>
                                        <span className={`font-black ${hasGold ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {playerGold} / 25
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs">
                                        <Scissors className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-stone-400">Шматочки:</span>
                                        <span className={`font-black ${hasPieces ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {playerPieces} / 20
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Suit Tabs */}
                            <div className="flex flex-wrap gap-1.5 p-1 bg-black/30 rounded-xl border border-stone-800">
                                <button
                                    onClick={() => setActiveTab('hearts')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeTab === 'hearts' ? 'bg-red-950 text-red-300 border border-red-800' : 'text-stone-400 hover:text-stone-200'}`}
                                >
                                    <span>♥</span> Hearts (Черви)
                                </button>
                                <button
                                    onClick={() => setActiveTab('diamonds')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeTab === 'diamonds' ? 'bg-orange-950 text-orange-300 border border-orange-900' : 'text-stone-400 hover:text-stone-200'}`}
                                >
                                    <span>♦</span> Diamonds (Бубни)
                                </button>
                                <button
                                    onClick={() => setActiveTab('clubs')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeTab === 'clubs' ? 'bg-stone-800 text-stone-200 border border-stone-700' : 'text-stone-400 hover:text-stone-200'}`}
                                >
                                    <span>♣</span> Clubs (Трефи)
                                </button>
                                <button
                                    onClick={() => setActiveTab('spades')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeTab === 'spades' ? 'bg-stone-900 text-stone-100 border border-stone-700' : 'text-stone-400 hover:text-stone-200'}`}
                                >
                                    <span>♠</span> Spades (Піки)
                                </button>
                                <button
                                    onClick={() => setActiveTab('special')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeTab === 'special' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'text-stone-400 hover:text-stone-200'}`}
                                >
                                    <span>✨</span> Особливі / Спеціальні
                                </button>
                            </div>

                            {/* Card Crafting Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                                {filteredCards.map((card) => {
                                    const cardKey = `${card.rank}:${card.suit}`;
                                    const craftedCount = progress.craftedCardsCount?.[settlement.id]?.[cardKey] || 0;
                                    const isLocked = craftedCount >= 3;
                                    const canAfford = hasGold && hasPieces;

                                    return (
                                        <div 
                                            key={cardKey}
                                            className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${isLocked ? 'bg-stone-950/60 border-stone-900 opacity-50' : 'bg-[#1e1712] border-stone-800'}`}
                                        >
                                            {/* Card Preview Visuals */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl px-2 py-1 bg-stone-950 border border-stone-800 rounded-lg font-serif">
                                                    {card.suit}
                                                </span>
                                                <div className="text-left">
                                                    <div className="text-xs font-black text-stone-100 leading-tight">
                                                        {card.rank}
                                                    </div>
                                                    <div className="text-[10px] text-stone-400">
                                                        Сила: {card.value ?? 0}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Crafting progress & action */}
                                            <div className="border-t border-stone-800 pt-2 space-y-1.5">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-stone-400">Виготовлено тут:</span>
                                                    <span className={`font-black ${isLocked ? 'text-rose-500' : 'text-amber-400'}`}>
                                                        {craftedCount} / 3
                                                    </span>
                                                </div>

                                                <button
                                                    disabled={isLocked || !canAfford}
                                                    onClick={() => onCraftCard(card)}
                                                    className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm ${
                                                        isLocked
                                                            ? 'bg-rose-950/20 text-rose-500 border border-rose-950 cursor-not-allowed'
                                                            : !canAfford
                                                            ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black active:scale-95'
                                                    }`}
                                                >
                                                    {isLocked ? 'Вичерпано ✗' : 'Виготовити'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Back to buildings */}
                            <button
                                onClick={() => setIsCraftingOpen(false)}
                                className="w-full sm:w-auto px-5 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-xs font-bold text-stone-300 transition-all flex items-center justify-center gap-1.5"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Повернутися до вибору будівель</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Bar */}
                <div className="p-3 sm:p-4 bg-[#140f0c] border-t border-[#b8860b]/40 flex justify-between items-center text-xs">
                    <span className="text-[#a89988]">
                        {isCraftingOpen 
                            ? 'Створюйте сильні карти та посилюйте свою RPG колоду для поєдинків у тавернах!' 
                            : 'Порада: Перемагайте претендентів, щоб відкрити доступ до чемпіонів закладу!'}
                    </span>
                    <button
                        onClick={isCraftingOpen ? () => setIsCraftingOpen(false) : onClose}
                        className="px-4 py-1.5 bg-[#261f17] hover:bg-[#382b20] border border-[#b8860b]/50 rounded-full font-bold text-[#f5ebd7] transition-all cursor-pointer"
                    >
                        {isCraftingOpen ? 'Вийти з Майстерні' : 'Повернутися на карту світу'}
                    </button>
                </div>
            </motion.div>

            {/* Merchant Guild Modal */}
            <MerchantGuildModal
                isOpen={isGuildOpen}
                onClose={() => setIsGuildOpen(false)}
                settlement={settlement}
                progress={progress}
                onUpdateProgress={(updated) => {
                    onProgressUpdate?.(updated);
                }}
            />
        </div>
    );
}

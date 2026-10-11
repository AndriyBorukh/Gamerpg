import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorldProgress, CustomHeroCard, Card, Suit } from '../types';
import { saveWorldProgress } from '../lib/worldData';
import { playSparkleSound, playLevelUpSound, playGoldSound } from '../lib/soundEffects';
import { 
    Sparkles, 
    X, 
    Layers, 
    Award, 
    Plus, 
    Check, 
    Info, 
    Zap, 
    ArrowRight, 
    Shield, 
    Sword, 
    User,
    RefreshCw
} from 'lucide-react';

interface CardMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onOpenDecompressionMaster?: () => void;
}

const AVATAR_OPTIONS = [
    { icon: '⚔️', label: 'Лицар' },
    { icon: '🛡️', label: 'Паладин' },
    { icon: '🧙‍♂️', label: 'Маг' },
    { icon: '👑', label: 'Конунг' },
    { icon: '🏹', label: 'Лучник' },
    { icon: '🗡️', label: 'Убивця' },
    { icon: '🐺', label: 'Вовк' },
    { icon: '🦁', label: 'Лев' },
    { icon: '🐉', label: 'Дракон' },
    { icon: '⚡', label: 'Блискавка' },
    { icon: '🔮', label: 'Шаман' },
    { icon: '📜', label: 'Мудрець' }
];

const SUIT_OPTIONS: Suit[] = ['♠', '♥', '♦', '♣'];

export function CardMasterModal({
    isOpen,
    onClose,
    progress,
    onUpdateProgress,
    onOpenDecompressionMaster
}: CardMasterModalProps) {
    const [activeTab, setActiveTab] = useState<'create' | 'merge' | 'collection'>('create');
    const [heroName, setHeroName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('⚔️');
    const [selectedSuit, setSelectedSuit] = useState<Suit>('♠');
    const [successCreated, setSuccessCreated] = useState<CustomHeroCard | null>(null);

    if (!isOpen) return null;

    const blankCards = progress.blankCardsCount || 0;
    const unmergedDiscard = progress.unmergedDiscardCount || 0;
    const heroCards = progress.customHeroCards || [];

    // Merge 4 discarded cards into 1 Blank Card
    const handleMergeDiscardCards = (countToMerge: number = 4) => {
        if (unmergedDiscard < countToMerge) return;
        const newBlanks = Math.floor(countToMerge / 4);
        const remainingDiscard = unmergedDiscard - (newBlanks * 4);

        const updatedProgress: WorldProgress = {
            ...progress,
            blankCardsCount: blankCards + newBlanks,
            unmergedDiscardCount: remainingDiscard
        };

        playSparkleSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
    };

    // Create a new Hero Card using 1 Blank Card
    const handleCreateHeroCard = (e: React.FormEvent) => {
        e.preventDefault();
        if (blankCards < 1) return;

        const finalName = heroName.trim() || 'Безстрашний Герой';
        const newHeroId = `custom_hero_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const newHero: CustomHeroCard = {
            id: newHeroId,
            name: finalName,
            avatar: selectedAvatar,
            suit: selectedSuit,
            level: 0,
            experience: 0,
            maxXp: 20,
            condition: 10,
            maxCondition: 10,
            isCustomHeroCard: true,
            createdAt: new Date().toLocaleDateString('uk-UA')
        };

        const heroCardObj: Card = {
            id: Math.floor(Date.now() + Math.random() * 1000000),
            suit: selectedSuit,
            rank: `${selectedAvatar} ${finalName}` as any,
            value: 0,
            isCustomHeroCard: true,
            heroCardId: newHeroId,
            heroLevel: 0,
            heroXp: 0,
            heroMaxXp: 20,
            heroCondition: 10,
            heroMaxCondition: 10,
            heroName: finalName,
            heroAvatar: selectedAvatar
        };

        const currentRpgCards = progress.playerRpgCards || [];
        const currentRpgDeck = progress.playerRpgDeck || [];

        const updatedProgress: WorldProgress = {
            ...progress,
            blankCardsCount: blankCards - 1,
            customHeroCards: [newHero, ...heroCards],
            playerRpgCards: [...currentRpgCards, heroCardObj],
            playerRpgDeck: [...currentRpgDeck, heroCardObj]
        };

        playLevelUpSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);

        setSuccessCreated(newHero);
        setHeroName('');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-[#1c1815] border-2 border-[#b8860b] p-4 sm:p-6 rounded-3xl flex flex-col gap-4 shadow-2xl max-w-2xl w-full max-h-[90vh] text-[#f5ebd7] relative overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 text-2xl shadow-lg border border-amber-300">
                                🧙‍♂️
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-[#d4af37] font-serif tracking-wide uppercase">
                                    Майстер Карт
                                </h2>
                                <p className="text-xs text-[#a89988]">
                                    Переплавка відбою у Пусті Карти та створення Геройських Карт
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-[#2a2018] hover:bg-[#3d2e24] rounded-full text-[#c4b5a0] hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Resources Banner */}
                    <div className="grid grid-cols-3 gap-2 bg-[#120f0d] p-3 rounded-2xl border border-[#b8860b]/30 text-center">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase text-[#a89988] font-bold">Пусті Карти</span>
                            <span className="text-lg font-black text-amber-300 flex items-center gap-1">
                                📄 {blankCards}
                            </span>
                        </div>
                        <div className="flex flex-col items-center border-x border-[#b8860b]/20">
                            <span className="text-[10px] uppercase text-[#a89988] font-bold">Відбій (4 у 1)</span>
                            <span className="text-lg font-black text-amber-200 flex items-center gap-1">
                                🃏 {unmergedDiscard}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase text-[#a89988] font-bold">Геройські Карти</span>
                            <span className="text-lg font-black text-emerald-400 flex items-center gap-1">
                                🌟 {heroCards.length}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#b8860b]/20 gap-1">
                        <button
                            onClick={() => { setActiveTab('create'); setSuccessCreated(null); }}
                            className={`flex-1 py-2 rounded-t-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                                activeTab === 'create'
                                    ? 'bg-[#2a2018] text-[#d4af37] border-t-2 border-x border-[#b8860b]/50'
                                    : 'text-[#a89988] hover:text-[#f5ebd7] bg-black/20'
                            }`}
                        >
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Створити Героя
                        </button>

                        <button
                            onClick={() => { setActiveTab('merge'); setSuccessCreated(null); }}
                            className={`flex-1 py-2 rounded-t-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                                activeTab === 'merge'
                                    ? 'bg-[#2a2018] text-[#d4af37] border-t-2 border-x border-[#b8860b]/50'
                                    : 'text-[#a89988] hover:text-[#f5ebd7] bg-black/20'
                            }`}
                        >
                            <Layers className="w-4 h-4 text-amber-400" />
                            Переплавка (4 у 1)
                        </button>

                        <button
                            onClick={() => { setActiveTab('collection'); setSuccessCreated(null); }}
                            className={`flex-1 py-2 rounded-t-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                                activeTab === 'collection'
                                    ? 'bg-[#2a2018] text-[#d4af37] border-t-2 border-x border-[#b8860b]/50'
                                    : 'text-[#a89988] hover:text-[#f5ebd7] bg-black/20'
                            }`}
                        >
                            <Award className="w-4 h-4 text-emerald-400" />
                            Колекція ({heroCards.length})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 scrollbar-thin scrollbar-thumb-[#b8860b]/40">
                        {/* TAB 1: CREATE HERO CARD */}
                        {activeTab === 'create' && (
                            <div className="space-y-4">
                                {successCreated ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-amber-950/60 border-2 border-amber-500 rounded-2xl text-center space-y-3"
                                    >
                                        <div className="text-4xl">{successCreated.avatar}</div>
                                        <h3 className="text-lg font-black text-amber-300">
                                            Геройську карту створено!
                                        </h3>
                                        <p className="text-xs text-amber-100">
                                            «{successCreated.name}» (Масть: {successCreated.suit}, Рівень: 0, Сила: 0) додано у Вашу колоду!
                                        </p>
                                        <p className="text-[11px] text-[#a89988]">
                                            Перемагайте у РПГ-дуелях, щоб підвищувати рівень цієї карти від 0 до 99! На рівні 50+ вона може стати повноцінним союзником у Майстрі Декомпресії.
                                        </p>
                                        <button
                                            onClick={() => setSuccessCreated(null)}
                                            className="px-6 py-2 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-stone-950 font-black rounded-xl text-xs hover:brightness-110 shadow-lg"
                                        >
                                            Створити ще одну карту
                                        </button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleCreateHeroCard} className="space-y-4">
                                        {/* Blank card check */}
                                        {blankCards < 1 ? (
                                            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-center space-y-2">
                                                <p className="text-xs text-red-300 font-semibold">
                                                    ⚠️ Недостатньо Пустих Карт!
                                                </p>
                                                <p className="text-[11px] text-[#a89988]">
                                                    Для нанесення персонажа потрібна 1 Пуста карта. Перейдіть на вкладку «Переплавка», щоб створити Пусті Карти з карт відбою (4 карти = 1 Пуста карта).
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('merge')}
                                                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs"
                                                >
                                                    Перейти до Переплавки
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Hero Name */}
                                                <div>
                                                    <label className="block text-xs font-bold text-[#d4af37] mb-1">
                                                        Ім'я Героя / Назва Персонажа:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={heroName}
                                                        onChange={(e) => setHeroName(e.target.value)}
                                                        placeholder="напр. Ельфійський Страж"
                                                        maxLength={24}
                                                        className="w-full px-3 py-2 bg-[#120f0d] border border-[#b8860b]/40 rounded-xl text-sm text-[#f5ebd7] focus:outline-none focus:border-[#d4af37]"
                                                    />
                                                </div>

                                                {/* Avatar Selector */}
                                                <div>
                                                    <label className="block text-xs font-bold text-[#d4af37] mb-1">
                                                        Обрати Аватар / Символ Персонажа:
                                                    </label>
                                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                        {AVATAR_OPTIONS.map((opt) => (
                                                            <button
                                                                key={opt.icon}
                                                                type="button"
                                                                onClick={() => setSelectedAvatar(opt.icon)}
                                                                className={`p-2 rounded-xl border flex flex-col items-center transition ${
                                                                    selectedAvatar === opt.icon
                                                                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-105 shadow-md'
                                                                        : 'bg-[#120f0d] border-[#b8860b]/20 text-[#a89988] hover:border-[#b8860b]/50'
                                                                }`}
                                                            >
                                                                <span className="text-xl">{opt.icon}</span>
                                                                <span className="text-[9px] font-medium mt-1 truncate">{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Suit Selector */}
                                                <div>
                                                    <label className="block text-xs font-bold text-[#d4af37] mb-1">
                                                        Обрати Масть Карти:
                                                    </label>
                                                    <div className="flex gap-2">
                                                        {SUIT_OPTIONS.map((suit) => (
                                                            <button
                                                                key={suit}
                                                                type="button"
                                                                onClick={() => setSelectedSuit(suit)}
                                                                className={`flex-1 py-2 rounded-xl border font-bold text-lg transition flex items-center justify-center gap-1 ${
                                                                    selectedSuit === suit
                                                                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                                                                        : 'bg-[#120f0d] border-[#b8860b]/20 text-[#a89988] hover:border-[#b8860b]/50'
                                                                }`}
                                                            >
                                                                <span className={['♥', '♦'].includes(suit) ? 'text-red-400' : 'text-slate-200'}>
                                                                    {suit}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Start Preview */}
                                                <div className="p-3 bg-[#120f0d] rounded-2xl border border-[#b8860b]/30 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-14 bg-[#2a2018] border border-amber-500/50 rounded-lg flex flex-col items-center justify-center text-amber-300">
                                                            <span className="text-lg">{selectedAvatar}</span>
                                                            <span className="text-[9px] font-bold">{selectedSuit}</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-amber-300">
                                                                {heroName.trim() || 'Безстрашний Герой'}
                                                            </div>
                                                            <div className="text-[10px] text-[#a89988]">
                                                                Початковий рівень: <span className="text-emerald-400 font-bold">0</span> (Сила: 0)
                                                            </div>
                                                            <div className="text-[10px] text-amber-200/80">
                                                                Може бити будь-яку карту силою ≤ 0
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    className="w-full py-3 bg-gradient-to-r from-[#d4af37] via-amber-500 to-[#b8860b] text-stone-950 font-black rounded-2xl shadow-xl hover:brightness-110 transition flex justify-center items-center gap-2 text-sm"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    Нанести персонажа на Пусту карту (1 Пуста Карта)
                                                </button>
                                            </>
                                        )}
                                    </form>
                                )}
                            </div>
                        )}

                        {/* TAB 2: MERGE DISCARDED CARDS */}
                        {activeTab === 'merge' && (
                            <div className="space-y-4">
                                <div className="p-3 bg-[#120f0d] border border-[#b8860b]/30 rounded-2xl text-xs space-y-2">
                                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                                        <Info className="w-4 h-4 text-amber-400 shrink-0" />
                                        Правило переплавки карт з відбою:
                                    </div>
                                    <p className="text-[#a89988] leading-relaxed">
                                        Усі карти, що опинилися у звичайному відбої після дуелей, накопичуються. Кожні <span className="text-amber-300 font-bold">4 карти</span> об'єднуються в <span className="text-amber-300 font-bold">1 Пусту карту</span>.
                                    </p>
                                </div>

                                <div className="p-4 bg-[#2a2018]/60 border border-[#b8860b]/40 rounded-2xl flex flex-col items-center text-center gap-3">
                                    <div className="text-3xl">🃏 ➔ 📄</div>
                                    <div>
                                        <div className="text-sm font-bold text-amber-200">
                                            Накопичено у відбої: <span className="text-amber-300 font-black text-base">{unmergedDiscard}</span> карт
                                        </div>
                                        <div className="text-xs text-[#a89988] mt-0.5">
                                            Можна створити: <span className="text-emerald-400 font-bold">{Math.floor(unmergedDiscard / 4)}</span> Пустих Карт
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full pt-2">
                                        <button
                                            onClick={() => handleMergeDiscardCards(4)}
                                            disabled={unmergedDiscard < 4}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-amber-700 to-[#b8860b] disabled:opacity-40 text-stone-950 font-black rounded-xl text-xs hover:brightness-110 shadow-md transition"
                                        >
                                            Об'єднати 4 карти (1 Пуста)
                                        </button>

                                        <button
                                            onClick={() => handleMergeDiscardCards(unmergedDiscard)}
                                            disabled={unmergedDiscard < 4}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 disabled:opacity-40 text-white font-black rounded-xl text-xs hover:brightness-110 shadow-md transition"
                                        >
                                            Об'єднати ВСЕ доступне
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: HERO CARDS COLLECTION */}
                        {activeTab === 'collection' && (
                            <div className="space-y-3">
                                <div className="p-3 bg-[#120f0d] border border-amber-500/30 rounded-2xl text-xs space-y-1.5 shadow-inner">
                                    <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px]">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        Бойовий досвід та стан геройських карт:
                                    </div>
                                    <ul className="text-[10px] text-[#c4b5a3] space-y-0.5 leading-relaxed pl-3 list-disc">
                                        <li><strong className="text-emerald-400">+2 XP</strong> за кожне биття карти супротивника.</li>
                                        <li><strong className="text-yellow-400">+10 XP</strong> за невідбитий хід цією картою (якщо супротивник забрав).</li>
                                        <li><strong className="text-amber-400">+3 XP</strong> та <strong className="text-rose-400">-1 очко стану</strong>, якщо геройську карту побили.</li>
                                        <li>Всього в геройської карти <strong className="text-amber-300">10 очок стану</strong>. При <strong className="text-rose-400">0/10</strong> карта розвалюється на частини (дає <strong>2 уламки карт</strong>).</li>
                                    </ul>
                                </div>

                                {heroCards.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-[#a89988] bg-[#120f0d] rounded-2xl border border-[#b8860b]/20">
                                        У Вас ще немає створених Геройських карт. Нанесіть персонажа на Пусту карту на першій вкладці!
                                    </div>
                                ) : (
                                    heroCards.map((hero) => {
                                        const cond = hero.condition ?? 10;
                                        const maxCond = hero.maxCondition ?? 10;
                                        const isLowCond = cond <= 3;
                                        return (
                                        <div
                                            key={hero.id}
                                            className={`p-3 bg-[#120f0d] border ${isLowCond ? 'border-rose-500/60' : 'border-[#b8860b]/30'} rounded-2xl flex items-center justify-between flex-wrap gap-2 transition`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-16 bg-[#2a2018] border ${isLowCond ? 'border-rose-500' : 'border-amber-500/60'} rounded-xl flex flex-col items-center justify-center text-amber-300 shadow-md shrink-0 relative overflow-hidden`}>
                                                    <span className="text-xl">{hero.avatar}</span>
                                                    <span className="text-[10px] font-bold">{hero.suit}</span>
                                                    <span className={`absolute top-0.5 right-0.5 text-[8px] font-black px-1 rounded-sm ${cond <= 3 ? 'bg-rose-900 text-rose-200' : 'bg-black/60 text-amber-300'}`}>
                                                        {cond}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                                                        {hero.name}
                                                        {hero.level >= 50 && (
                                                            <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[9px] rounded-md">
                                                                🌟 50+
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-[#a89988] flex items-center gap-2 flex-wrap">
                                                        <span>Рівень: <span className="text-emerald-400 font-bold">{hero.level}</span> / 99</span>
                                                        <span>•</span>
                                                        <span>Сила: <span className="text-amber-300 font-bold">{hero.level}</span></span>
                                                        <span>•</span>
                                                        <span className={isLowCond ? 'text-rose-400 font-bold animate-pulse' : 'text-stone-300'}>
                                                            Стан: <span className={isLowCond ? 'text-rose-300 font-black' : 'text-emerald-400 font-bold'}>{cond}</span>/{maxCond}
                                                        </span>
                                                    </div>
                                                    {/* Condition & XP bars */}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="w-24 bg-black/60 rounded-full h-1.5 border border-stone-800 overflow-hidden" title={`Стан: ${cond}/${maxCond}`}>
                                                            <div
                                                                className={`h-full transition-all duration-300 ${isLowCond ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${Math.min(100, (cond / maxCond) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[8px] text-stone-400">🛡️ {cond}/{maxCond}</span>
                                                    </div>
                                                    {/* XP bar */}
                                                    <div className="w-36 bg-black/60 rounded-full h-1.5 mt-1 border border-[#b8860b]/30 overflow-hidden relative">
                                                        <div
                                                            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300"
                                                            style={{ width: `${Math.min(100, (hero.experience / hero.maxXp) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-[9px] text-[#a89988] mt-0.5">
                                                        Досвід: {hero.experience} / {hero.maxXp} XP
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action / Decompress callout */}
                                            {hero.level >= 50 && onOpenDecompressionMaster && (
                                                <button
                                                    onClick={() => {
                                                        onClose();
                                                        onOpenDecompressionMaster();
                                                    }}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs hover:brightness-110 shadow-md transition flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                                    Перетворити на Персонажа
                                                </button>
                                            )}
                                        </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

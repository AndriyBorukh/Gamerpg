import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, WorldProgress } from '../types';
import { 
    X, 
    Layers, 
    Plus, 
    Minus, 
    Trash2, 
    Sparkles, 
    ArrowUpDown, 
    Check, 
    ShieldAlert, 
    Coins,
    Sparkle
} from 'lucide-react';

interface DeckBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: WorldProgress;
    onSaveDeck: (newDeck: Card[]) => void;
}

export const DeckBuilderModal = ({ isOpen, onClose, progress, onSaveDeck }: DeckBuilderModalProps) => {
    const playerCollection = progress.playerRpgCards || [];
    const playerActiveDeck = progress.playerRpgDeck || [];

    // Local state for the deck being edited
    const [localDeck, setLocalDeck] = useState<Card[]>(() => [...playerActiveDeck]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'special'>('all');
    const [sortBy, setSortBy] = useState<'value-asc' | 'value-desc' | 'name'>('value-desc');

    if (!isOpen) return null;

    // Helper to identify if a specific card instance (by id) is currently in the active deck
    const deckCardIds = useMemo(() => new Set(localDeck.map(c => c.id)), [localDeck]);

    // Available cards in collection that are NOT in the local deck
    const availableCards = useMemo(() => {
        return playerCollection.filter(c => !deckCardIds.has(c.id));
    }, [playerCollection, deckCardIds]);

    // Grouping of cards in deck for convenient listing
    const deckCount = localDeck.length;

    // Calculations & stats
    const avgPower = useMemo(() => {
        if (localDeck.length === 0) return 0;
        const total = localDeck.reduce((acc, c) => acc + (c.value || 0), 0);
        return Math.round((total / localDeck.length) * 10) / 10;
    }, [localDeck]);

    const suitStats = useMemo(() => {
        const stats = { hearts: 0, diamonds: 0, clubs: 0, spades: 0, special: 0 };
        localDeck.forEach(c => {
            if (c.suit === '♥') stats.hearts++;
            else if (c.suit === '♦') stats.diamonds++;
            else if (c.suit === '♣') stats.clubs++;
            else if (c.suit === '♠') stats.spades++;
            else stats.special++;
        });
        return stats;
    }, [localDeck]);

    // Filter & Sort Available Collection
    const processedAvailableCards = useMemo(() => {
        let filtered = [...availableCards];

        // Apply Filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(c => {
                if (activeFilter === 'hearts') return c.suit === '♥';
                if (activeFilter === 'diamonds') return c.suit === '♦';
                if (activeFilter === 'clubs') return c.suit === '♣';
                if (activeFilter === 'spades') return c.suit === '♠';
                const standardSuits = ['♥', '♦', '♣', '♠'];
                return !standardSuits.includes(String(c.suit));
            });
        }

        // Apply Sort
        filtered.sort((a, b) => {
            if (sortBy === 'value-asc') return (a.value || 0) - (b.value || 0);
            if (sortBy === 'value-desc') return (b.value || 0) - (a.value || 0);
            return String(a.rank).localeCompare(String(b.rank));
        });

        return filtered;
    }, [availableCards, activeFilter, sortBy]);

    // Action Handlers
    const handleAddCard = (card: Card) => {
        setLocalDeck(prev => [...prev, card]);
    };

    const handleRemoveCard = (card: Card) => {
        setLocalDeck(prev => prev.filter(c => c.id !== card.id));
    };

    const handleAddAll = () => {
        setLocalDeck([...playerCollection]);
    };

    const handleClearDeck = () => {
        setLocalDeck([]);
    };

    const handleAutoFill = () => {
        // Sort entire collection descending and pick up to 36 strongest cards
        const sortedCollection = [...playerCollection].sort((a, b) => (b.value || 0) - (a.value || 0));
        const maxFill = Math.min(sortedCollection.length, 36);
        setLocalDeck(sortedCollection.slice(0, maxFill));
    };

    const handleSave = () => {
        if (localDeck.length < 15) {
            alert('Для гри у вашій активній RPG колоді повинно бути не менше 15 карт!');
            return;
        }
        onSaveDeck(localDeck);
    };

    const isValidDeck = localDeck.length >= 15;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-[#171310] border-2 border-[#b8860b]/60 rounded-3xl p-4 sm:p-6 w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#f5ebd7]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-[#b8860b]/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30">
                                <Layers className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black font-serif text-[#f5ebd7] tracking-wide flex items-center gap-2">
                                    <span>🃏</span> Дек-білдер: Моя RPG Колода
                                </h2>
                                <p className="text-xs text-[#a89988]">
                                    Збирайте та налаштовуйте свою індивідуальну колоду для дуелей у тавернах.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-1.5 text-[#a89988] hover:text-white hover:bg-stone-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/45 p-3 rounded-2xl border border-stone-800 my-4 text-xs">
                        <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                            <span className="text-stone-400 text-[11px] font-bold">Усього карт у колоді</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-xl font-black ${isValidDeck ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                                    {deckCount}
                                </span>
                                <span className="text-stone-500 font-bold">/ 15 мін.</span>
                            </div>
                            <div className="w-full bg-[#241c16] rounded-full h-1 mt-1 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all ${isValidDeck ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                    style={{ width: `${Math.min((deckCount / 15) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                            <span className="text-stone-400 text-[11px] font-bold">Середня сила карти</span>
                            <div className="text-xl font-black text-amber-300 mt-0.5 flex items-center gap-1">
                                <span>{avgPower}</span>
                                <Sparkle className="w-4 h-4 text-amber-400" />
                            </div>
                            <span className="text-[10px] text-stone-500 mt-1">Оптимально: &gt; 5.0</span>
                        </div>

                        <div className="col-span-2 flex flex-col gap-1.5 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 justify-center">
                            <span className="text-stone-400 text-[11px] font-bold">Баланс мастей у колоді</span>
                            <div className="grid grid-cols-5 gap-1.5 text-center font-black mt-0.5">
                                <div className="bg-red-950/40 p-1 rounded border border-red-900/50 text-red-400 text-[11px]">
                                    ♥ {suitStats.hearts}
                                </div>
                                <div className="bg-orange-950/40 p-1 rounded border border-orange-900/50 text-orange-400 text-[11px]">
                                    ♦ {suitStats.diamonds}
                                </div>
                                <div className="bg-stone-950 p-1 rounded border border-stone-800 text-stone-300 text-[11px]">
                                    ♣ {suitStats.clubs}
                                </div>
                                <div className="bg-stone-900/50 p-1 rounded border border-stone-800 text-stone-200 text-[11px]">
                                    ♠ {suitStats.spades}
                                </div>
                                <div className="bg-amber-950/30 p-1 rounded border border-amber-900/30 text-amber-400 text-[11px]">
                                    ✨ {suitStats.special}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Macro Controls (Action panel) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-[#231a14] p-3 rounded-2xl border border-[#b8860b]/30">
                        <div className="flex gap-2">
                            <button
                                onClick={handleAutoFill}
                                className="px-3.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/50 rounded-xl text-xs font-bold text-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Заповнити найсильнішими картами з вашої колекції"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>Авто-заповнення</span>
                            </button>
                            <button
                                onClick={handleAddAll}
                                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-bold text-stone-300 transition-all cursor-pointer"
                            >
                                Додати всі
                            </button>
                            <button
                                onClick={handleClearDeck}
                                className="px-3.5 py-1.5 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 rounded-xl text-xs font-bold text-rose-400 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Очистити</span>
                            </button>
                        </div>

                        {!isValidDeck && (
                            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold animate-pulse">
                                <ShieldAlert className="w-4 h-4 text-rose-400" />
                                <span>Потрібно ще {15 - deckCount} карт у колоду!</span>
                            </div>
                        )}
                    </div>

                    {/* Dual Columns layout */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden min-h-0">
                        {/* LEFT COLUMN: COLLECTION (AVAILABLE CARDS) */}
                        <div className="md:col-span-6 flex flex-col bg-black/25 rounded-2xl border border-stone-800 p-3 min-h-0">
                            {/* Search / Filter header */}
                            <div className="space-y-2 mb-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                                        <span>📂</span> Колекція ({availableCards.length} доступно)
                                    </h3>

                                    {/* Sort dropdown */}
                                    <div className="flex items-center gap-1.5 text-[10px] bg-stone-900 px-2 py-1 rounded-lg border border-stone-800">
                                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="bg-transparent border-none text-stone-300 font-bold focus:outline-none cursor-pointer"
                                        >
                                            <option value="value-desc" className="bg-stone-950">Сила спад.</option>
                                            <option value="value-asc" className="bg-stone-950">Сила зрост.</option>
                                            <option value="name" className="bg-stone-950">За назвою</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Filters Row */}
                                <div className="flex flex-wrap gap-1 p-1 bg-stone-950/70 rounded-xl border border-stone-900 text-[10px] font-bold">
                                    <button
                                        onClick={() => setActiveFilter('all')}
                                        className={`px-2 py-1 rounded transition-all ${activeFilter === 'all' ? 'bg-[#3b2d1d] text-amber-300 border border-[#b8860b]/40' : 'text-stone-500 hover:text-stone-300'}`}
                                    >
                                        Всі
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('hearts')}
                                        className={`px-2 py-1 rounded transition-all flex items-center gap-0.5 ${activeFilter === 'hearts' ? 'bg-red-950 text-red-300 border border-red-900' : 'text-stone-500 hover:text-stone-300'}`}
                                    >
                                        ♥ Черви
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('diamonds')}
                                        className={`px-2 py-1 rounded transition-all flex items-center gap-0.5 ${activeFilter === 'diamonds' ? 'bg-orange-950 text-orange-300 border border-orange-900' : 'text-stone-500 hover:text-stone-300'}`}
                                    >
                                        ♦ Бубни
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('clubs')}
                                        className={`px-2 py-1 rounded transition-all flex items-center gap-0.5 ${activeFilter === 'clubs' ? 'bg-stone-900 text-stone-200 border border-stone-800' : 'text-stone-500 hover:text-stone-300'}`}
                                    >
                                        ♣ Трефи
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('spades')}
                                        className={`px-2 py-1 rounded transition-all flex items-center gap-0.5 ${activeFilter === 'spades' ? 'bg-stone-900 text-stone-200 border border-stone-800' : 'text-stone-500 hover:text-stone-300'}`}
                                    >
                                        ♠ Піки
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('special')}
                                        className={`px-2 py-1 rounded transition-all flex items-center gap-0.5 ${activeFilter === 'special' ? 'bg-amber-950 text-amber-300 border border-amber-900/50' : 'text-stone-500 hover:text-stone-300'}`}
                                    >
                                        ✨ Спец.
                                    </button>
                                </div>
                            </div>

                            {/* Collection list scroll */}
                            <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-stone-800">
                                {processedAvailableCards.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 py-12 text-xs">
                                        <span>📭 Немає доступних карт з цим фільтром.</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {processedAvailableCards.map((card, idx) => {
                                            const isRed = card.suit === '♥' || card.suit === '♦';

                                            return (
                                                <div
                                                    key={`avail-card-${card.id}-${idx}`}
                                                    onClick={() => handleAddCard(card)}
                                                    className="p-2.5 rounded-xl border border-stone-800/80 bg-[#1e1712]/50 hover:bg-[#2c221a] hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between gap-2 text-left relative group active:scale-95"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-sm font-serif font-bold ${isRed ? 'text-red-500' : 'text-stone-300'}`}>
                                                            {card.suit}
                                                        </span>
                                                        <span className="text-[10px] text-stone-400 font-bold px-1.5 py-0.2 bg-stone-950 border border-stone-800 rounded">
                                                            {card.value}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] font-black leading-tight text-[#f5ebd7]">
                                                            {card.rank}
                                                        </div>
                                                        {card.cost && (
                                                            <div className="text-[9px] text-amber-400 mt-0.5">
                                                                Ціна: {card.cost} ⚡
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Hover plus overlay */}
                                                    <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
                                                        <Plus className="w-5 h-5 text-amber-400" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ACTIVE DECK */}
                        <div className="md:col-span-6 flex flex-col bg-black/25 rounded-2xl border border-amber-500/20 p-3 min-h-0">
                            {/* Active deck header */}
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                                    <span>⚔️</span> Активна RPG Колода ({deckCount} карт)
                                </h3>
                                <span className="text-[10px] text-stone-500 font-bold">
                                    Клікніть щоб прибрати
                                </span>
                            </div>

                            {/* Active Deck List scroll */}
                            <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-stone-800">
                                {localDeck.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 py-12 text-xs">
                                        <span>⚠️ Колода пуста. Додайте карти з колекції ліворуч!</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {localDeck.map((card, idx) => {
                                            const isRed = card.suit === '♥' || card.suit === '♦';

                                            return (
                                                <div
                                                    key={`active-card-${card.id}-${idx}`}
                                                    onClick={() => handleRemoveCard(card)}
                                                    className="p-2.5 rounded-xl border border-amber-500/30 bg-[#261f18] hover:bg-rose-950/20 hover:border-rose-500/50 transition-all cursor-pointer flex flex-col justify-between gap-2 text-left relative group active:scale-95 animate-fadeIn"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-sm font-serif font-bold ${isRed ? 'text-red-500' : 'text-stone-300'}`}>
                                                            {card.suit}
                                                        </span>
                                                        <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.2 bg-stone-950 border border-stone-800 rounded">
                                                            {card.value}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] font-black leading-tight text-amber-100">
                                                            {card.rank}
                                                        </div>
                                                        {card.cost && (
                                                            <div className="text-[9px] text-amber-400 mt-0.5">
                                                                Ціна: {card.cost} ⚡
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Hover minus overlay */}
                                                    <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
                                                        <Minus className="w-5 h-5 text-rose-500" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-4 border-t border-[#b8860b]/30 flex justify-between items-center gap-3">
                        <span className="text-[11px] text-[#a89988] hidden sm:inline">
                            Збережені зміни будуть автоматично використовуватися у поєдинках проти шинкарів та чемпіонів!
                        </span>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-xs font-bold text-stone-300 transition-all cursor-pointer flex-1 sm:flex-initial"
                            >
                                Скасувати
                            </button>
                            <button
                                disabled={!isValidDeck}
                                onClick={handleSave}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial ${
                                    isValidDeck 
                                        ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black shadow-lg shadow-yellow-500/10 hover:scale-105 active:scale-95'
                                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                }`}
                            >
                                <Check className="w-4 h-4" />
                                <span>Зберегти колоду</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

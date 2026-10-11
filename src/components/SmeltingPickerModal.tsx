import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_SMELTING_CARDS, SmeltingCategory } from '../lib/smeltingCards';

interface SmeltingPickerModalProps {
    isOpen: boolean;
    onSelectCard: (cardKey: string) => void;
}

const CATEGORY_TABS: { key: SmeltingCategory; label: string; icon: string }[] = [
    { key: 'all', label: 'Всі карти', icon: '🌐' },
    { key: 'hero', label: 'Герої та Легенди', icon: '🛡️' },
    { key: 'mage', label: 'Маги та Жерці', icon: '🔮' },
    { key: 'commander', label: 'Війська та Лідери', icon: '👑' },
    { key: 'defense', label: 'Захист та Споруди', icon: '🏰' },
    { key: 'economy', label: 'Ресурси та Економіка', icon: '🪙' },
    { key: 'spell', label: 'Бойові Закляття', icon: '✨' },
    { key: 'smelt_release', label: 'Переплавлення та Ресурси', icon: '⚒️' },
    { key: 'classic', label: 'Класичні та Джокери', icon: '🃏' },
    { key: 'tarot', label: 'Таро', icon: '🎴' },
];

export const SmeltingPickerModal: React.FC<SmeltingPickerModalProps> = ({ isOpen, onSelectCard }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<SmeltingCategory>('all');

    const filteredCards = useMemo(() => {
        return ALL_SMELTING_CARDS.filter(card => {
            const matchesCategory = activeCategory === 'all' || card.category === activeCategory;
            if (!matchesCategory) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            return (
                card.title.toLowerCase().includes(q) ||
                card.desc.toLowerCase().includes(q) ||
                (card.badge && card.badge.toLowerCase().includes(q)) ||
                (card.cardTemplate.rank && card.cardTemplate.rank.toString().toLowerCase().includes(q))
            );
        });
    }, [activeCategory, searchQuery]);

    const countsByCategory = useMemo(() => {
        const counts: Record<string, number> = { all: ALL_SMELTING_CARDS.length };
        ALL_SMELTING_CARDS.forEach(c => {
            counts[c.category] = (counts[c.category] || 0) + 1;
        });
        return counts;
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="w-full max-w-5xl bg-gradient-to-b from-[#1c1815] via-[#141210] to-[#0d0b0a] border-2 border-amber-500/80 rounded-2xl shadow-2xl p-4 sm:p-6 text-amber-100 flex flex-col max-h-[92vh] border-t-amber-400"
                >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-amber-500/30 gap-2">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">⚒️</span>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-amber-300 tracking-wide flex items-center gap-2">
                                    Переплавлення (Рівень 8)
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        Вибір карти
                                    </span>
                                </h2>
                                <p className="text-xs sm:text-sm text-amber-200/70">
                                    Оберіть будь-яку з доступних у грі карт (всього: {ALL_SMELTING_CARDS.length}):
                                </p>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="🔍 Пошук карти за назвою чи властивістю..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-stone-900/90 border border-amber-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 shadow-inner"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-amber-200 text-xs px-1.5 py-0.5 rounded bg-stone-800"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-thin border-b border-amber-500/20 scrollbar-thumb-amber-500/30">
                        {CATEGORY_TABS.map((tab) => {
                            const count = countsByCategory[tab.key] || 0;
                            const isActive = activeCategory === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveCategory(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                                        isActive 
                                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-bold' 
                                            : 'bg-stone-900/80 text-amber-200/80 border-amber-500/30 hover:bg-amber-950/40 hover:text-amber-100'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                        isActive ? 'bg-stone-950/30 text-stone-950 font-bold' : 'bg-stone-800 text-amber-400/70'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 my-3 overflow-y-auto pr-1 flex-1 max-h-[60vh]">
                        {filteredCards.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-amber-300/50 flex flex-col items-center justify-center gap-2">
                                <span className="text-4xl">🔍</span>
                                <p className="text-sm">Карту за запитом "{searchQuery}" не знайдено.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                                    className="text-xs text-amber-400 underline hover:text-amber-300"
                                >
                                    Скинути фільтри
                                </button>
                            </div>
                        ) : (
                            filteredCards.map((opt) => (
                                <motion.button
                                    key={opt.key}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelectCard(opt.key)}
                                    className="flex flex-col text-left p-3 rounded-xl border border-amber-500/30 bg-gradient-to-br from-stone-900/90 to-stone-950/90 hover:from-amber-950/50 hover:to-stone-900/90 hover:border-amber-400 transition-all cursor-pointer group shadow-md hover:shadow-amber-500/10 relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-2xl p-1 rounded-lg bg-stone-800/80 border border-amber-500/30 group-hover:border-amber-400/60 transition-colors">
                                                {opt.icon}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="font-bold text-xs sm:text-sm text-amber-200 group-hover:text-amber-100 transition-colors line-clamp-1">
                                                    {opt.title}
                                                </div>
                                                <div className="text-[10px] text-amber-400/60 uppercase tracking-wider font-mono">
                                                    {opt.cardTemplate.rank}
                                                </div>
                                            </div>
                                        </div>

                                        {opt.badge && (
                                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                                {opt.badge}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-[11px] text-amber-300/70 group-hover:text-amber-200/90 transition-colors leading-relaxed line-clamp-2 mt-auto">
                                        {opt.desc}
                                    </p>

                                    <div className="mt-2 pt-1.5 border-t border-amber-500/10 flex items-center justify-between text-[10px] text-amber-400/60 group-hover:text-amber-300">
                                        <span>Натисніть для вибору</span>
                                        <span className="font-bold text-amber-400">➔</span>
                                    </div>
                                </motion.button>
                            ))
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="pt-2.5 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-400/70">
                        <span>Показано: {filteredCards.length} з {ALL_SMELTING_CARDS.length} карт</span>
                        <span className="italic text-[11px] text-amber-300/60">* Переплавлення 8 рівень виключено</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

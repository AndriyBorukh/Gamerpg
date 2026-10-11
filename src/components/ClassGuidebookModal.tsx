import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    GUIDE_CATEGORIES, 
    ALL_CLASSES_DETAILED, 
    ALL_GAME_SPELLS, 
    DetailedClassGuideItem, 
    GameSpellGuideItem 
} from '../lib/classSpellsGuideData';
import { 
    BookOpen, 
    Search, 
    X, 
    Sparkles, 
    Swords, 
    Shield, 
    Zap, 
    Flame, 
    Heart, 
    Crosshair, 
    Users, 
    Skull, 
    Dices, 
    Layers, 
    Sliders,
    ChevronRight,
    Award,
    HelpCircle,
    CheckCircle2
} from 'lucide-react';

interface ClassGuidebookModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialClassId?: string;
}

type GuideTab = 'classes' | 'spells' | 'calculator' | 'synergies';

export function ClassGuidebookModal({
    isOpen,
    onClose,
    initialClassId
}: ClassGuidebookModalProps) {
    const [activeTab, setActiveTab] = useState<GuideTab>('classes');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedAbilityType, setSelectedAbilityType] = useState<string>('all');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<DetailedClassGuideItem | null>(() => {
        if (initialClassId) {
            return ALL_CLASSES_DETAILED.find(c => c.id === initialClassId) || ALL_CLASSES_DETAILED[0];
        }
        return ALL_CLASSES_DETAILED[0];
    });

    const [selectedSpell, setSelectedSpell] = useState<GameSpellGuideItem | null>(ALL_GAME_SPELLS[0]);
    const [spellSchoolFilter, setSpellSchoolFilter] = useState<string>('all');

    // Interactive Simulator State
    const [calcClassId, setCalcClassId] = useState<string>(initialClassId || 'elementalist');
    const [calcLevel, setCalcLevel] = useState<number>(3);
    const [calcSquadBuff, setCalcSquadBuff] = useState<boolean>(true);

    const activeCalcClass = useMemo(() => {
        return ALL_CLASSES_DETAILED.find(c => c.id === calcClassId) || ALL_CLASSES_DETAILED[0];
    }, [calcClassId]);

    // Filtered Classes
    const filteredClasses = useMemo(() => {
        return ALL_CLASSES_DETAILED.filter(cls => {
            if (selectedCategory !== 'all' && cls.category !== selectedCategory) return false;
            if (selectedAbilityType !== 'all' && cls.ability.type !== selectedAbilityType) return false;
            if (selectedRole !== 'all' && cls.role !== selectedRole) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = cls.name.toLowerCase().includes(q);
                const matchTitle = cls.title.toLowerCase().includes(q);
                const matchAbility = cls.ability.name.toLowerCase().includes(q);
                const matchDesc = cls.description.toLowerCase().includes(q);
                if (!matchName && !matchTitle && !matchAbility && !matchDesc) return false;
            }
            return true;
        });
    }, [selectedCategory, selectedAbilityType, selectedRole, searchQuery]);

    // Filtered Spells
    const filteredSpells = useMemo(() => {
        return ALL_GAME_SPELLS.filter(spell => {
            if (spellSchoolFilter !== 'all' && spell.school !== spellSchoolFilter) return false;
            return true;
        });
    }, [spellSchoolFilter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-[#140e0a] border-2 border-[#b8860b]/70 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-[#f5ebd7]"
            >
                {/* Header with Medieval Gold Trims */}
                <div className="relative px-6 py-4 bg-gradient-to-r from-[#2a1a10] via-[#1c120c] to-[#2a1a10] border-b-2 border-[#b8860b]/60 flex items-center justify-between shadow-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border-2 border-amber-500/80 flex items-center justify-center text-2xl shadow-inner text-amber-300">
                            📖
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-serif font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
                                    Посібник Класів, Здібностей та Гримуар Заклять
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    50+ Класів
                                </span>
                            </div>
                            <p className="text-xs text-[#a89988] mt-0.5">
                                Повний компендіум бойових архетипів, заклинань, розрахунків шкоди та тактичних синергій
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-black/40 hover:bg-red-950/80 border border-stone-700 hover:border-red-500 text-stone-300 hover:text-white transition cursor-pointer"
                        title="Закрити посібник"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Navigation Tabs */}
                <div className="px-6 py-2.5 bg-[#1a120b] border-b border-stone-800 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                    <button
                        onClick={() => setActiveTab('classes')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                            activeTab === 'classes'
                                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 border-yellow-300 shadow-lg scale-102'
                                : 'bg-[#120d09] text-stone-400 border-stone-800 hover:text-amber-200 hover:border-amber-700/50'
                        }`}
                    >
                        <Swords className="w-4 h-4" />
                        <span>🛡️ Класи та Здібності ({ALL_CLASSES_DETAILED.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('spells')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                            activeTab === 'spells'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-300 shadow-lg scale-102'
                                : 'bg-[#120d09] text-stone-400 border-stone-800 hover:text-indigo-200 hover:border-indigo-700/50'
                        }`}
                    >
                        <Zap className="w-4 h-4 text-cyan-300" />
                        <span>🔮 Гримуар Заклять ({ALL_GAME_SPELLS.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                            activeTab === 'calculator'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-stone-950 border-emerald-300 shadow-lg scale-102'
                                : 'bg-[#120d09] text-stone-400 border-stone-800 hover:text-emerald-200 hover:border-emerald-700/50'
                        }`}
                    >
                        <Sliders className="w-4 h-4 text-emerald-400" />
                        <span>⚡ Калькулятор Сили та Здібностей</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('synergies')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                            activeTab === 'synergies'
                                ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white border-amber-400 shadow-lg scale-102'
                                : 'bg-[#120d09] text-stone-400 border-stone-800 hover:text-amber-200 hover:border-amber-700/50'
                        }`}
                    >
                        <Users className="w-4 h-4 text-amber-300" />
                        <span>📜 Тактичні Синергії Загонів</span>
                    </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-amber-600/40">
                    {/* TAB 1: CLASSES & ABILITIES */}
                    {activeTab === 'classes' && (
                        <div className="space-y-6">
                            {/* Search & Filtering Bar */}
                            <div className="p-4 rounded-2xl bg-[#19110a] border border-[#b8860b]/40 shadow-md space-y-3">
                                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                                    {/* Search Input */}
                                    <div className="relative w-full md:w-80">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Пошук класу, здібності, титулу..."
                                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/60 border border-stone-700 focus:border-amber-400 text-sm text-[#f5ebd7] placeholder-stone-500 outline-none transition"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Quick Stats Summary */}
                                    <div className="flex items-center gap-2 text-xs text-stone-300 flex-wrap justify-end">
                                        <span className="bg-black/50 px-3 py-1 rounded-lg border border-stone-800">
                                            Знайдено: <strong className="text-amber-300">{filteredClasses.length}</strong> класів
                                        </span>
                                        <span className="bg-black/50 px-3 py-1 rounded-lg border border-stone-800">
                                            Категорій: <strong className="text-yellow-300">{GUIDE_CATEGORIES.length}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Category Badges */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                                            selectedCategory === 'all'
                                                ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow'
                                                : 'bg-black/40 text-stone-400 border-stone-800 hover:text-white'
                                        }`}
                                    >
                                        <span>🌐 Всі категорії</span>
                                    </button>
                                    {GUIDE_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
                                                selectedCategory === cat.id
                                                    ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow'
                                                    : 'bg-black/40 text-stone-400 border-stone-800 hover:text-amber-200'
                                            }`}
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Ability Type Secondary Filter */}
                                <div className="flex items-center gap-2 text-xs flex-wrap pt-1 border-t border-stone-800/80">
                                    <span className="text-[11px] text-stone-400 font-bold">Тип здібності:</span>
                                    {[
                                        { id: 'all', label: 'Усі типи' },
                                        { id: 'damage_single', label: '🎯 Одиночна шкода' },
                                        { id: 'damage_aoe', label: '💥 Масова шкода (AoE)' },
                                        { id: 'damage_multi', label: '⚔️ Серія атак (4 удари)' },
                                        { id: 'heal', label: '✨ Зцілення персонажа' },
                                        { id: 'buff_player', label: '🛡️ Підтримка та баф' },
                                        { id: 'summon', label: '👥 Призов створінь' },
                                        { id: 'raise_undead', label: '💀 Некромантія' }
                                    ].map(typeFilter => (
                                        <button
                                            key={typeFilter.id}
                                            onClick={() => setSelectedAbilityType(typeFilter.id)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                                                selectedAbilityType === typeFilter.id
                                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400'
                                                    : 'bg-black/30 text-stone-400 border-stone-800 hover:text-stone-200'
                                            }`}
                                        >
                                            {typeFilter.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Two-Column Grid: List on Left + Detailed Inspector on Right */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                {/* Left: Class Cards Grid (7 Cols) */}
                                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-700/40">
                                    {filteredClasses.map(cls => {
                                        const isSelected = selectedClass?.id === cls.id;

                                        return (
                                            <div
                                                key={cls.id}
                                                onClick={() => setSelectedClass(cls)}
                                                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                                                    isSelected
                                                        ? 'bg-gradient-to-b from-[#2e1d12] to-[#1c120a] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]'
                                                        : 'bg-[#18110b] border-stone-800/80 hover:border-amber-600/60 hover:bg-[#20160e]'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-10 h-10 rounded-xl bg-black/60 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                                                {cls.icon}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-serif font-black text-sm text-[#f5ebd7] group-hover:text-amber-300 transition">
                                                                    {cls.name}
                                                                </h4>
                                                                <span className="text-[10px] text-stone-400 italic">
                                                                    {cls.title}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider shrink-0 ${cls.badgeColor}`}>
                                                            {cls.categoryName}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] text-[#a89988] line-clamp-2 mb-2 leading-relaxed">
                                                        {cls.description}
                                                    </p>
                                                </div>

                                                {/* Ability Mini-Badge */}
                                                <div className="p-2 rounded-xl bg-black/50 border border-stone-800/80 flex items-center justify-between text-[10px]">
                                                    <div className="flex items-center gap-1 text-amber-300 font-bold truncate">
                                                        <span>{cls.ability.typeIcon}</span>
                                                        <span className="truncate">{cls.ability.name}</span>
                                                    </div>
                                                    <span className="text-yellow-400 font-mono font-black shrink-0 ml-1">
                                                        {cls.ability.power > 1 ? `+${cls.ability.power} сили` : 'Призов'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right: Class Detail Inspector (5 Cols) */}
                                {selectedClass && (
                                    <div className="lg:col-span-5 p-5 rounded-3xl bg-gradient-to-b from-[#22160d] via-[#1a100a] to-[#140b07] border-2 border-amber-500/70 shadow-2xl space-y-4 sticky top-0">
                                        {/* Inspector Header */}
                                        <div className="flex items-start justify-between gap-3 border-b border-amber-500/30 pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border-2 border-amber-500 flex items-center justify-center text-3xl shadow-inner shrink-0">
                                                    {selectedClass.icon}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-serif font-black text-xl text-amber-200">
                                                            {selectedClass.name}
                                                        </h3>
                                                        <span className="text-xs text-stone-400">({selectedClass.title})</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                                                        <span className="text-amber-400 font-bold">{selectedClass.role}</span>
                                                        <span className="text-stone-500">•</span>
                                                        <span className="text-stone-300">Складність: {selectedClass.difficulty}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lore & Description */}
                                        <p className="text-xs text-stone-300 leading-relaxed italic bg-black/40 p-3 rounded-xl border border-stone-800">
                                            «{selectedClass.description}»
                                        </p>

                                        {/* Ability / Spell Card Details */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-red-950/40 border-2 border-amber-500/60 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{selectedClass.ability.typeIcon}</span>
                                                    <span className="font-serif font-black text-base text-amber-300">
                                                        {selectedClass.ability.name}
                                                    </span>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-yellow-300 border border-amber-500/40">
                                                    {selectedClass.ability.typeName}
                                                </span>
                                            </div>

                                            <p className="text-xs text-stone-200 leading-relaxed">
                                                {selectedClass.ability.description}
                                            </p>

                                            <div className="pt-2 border-t border-amber-500/30 flex flex-col gap-1 text-[11px]">
                                                <div className="text-amber-300/90 font-medium">
                                                    💡 <strong>Тактична порада:</strong> {selectedClass.ability.tacticalNote}
                                                </div>
                                                <div className="text-stone-400">
                                                    ⏱️ <strong>Тригер застосування:</strong> {selectedClass.ability.cooldownOrTrigger}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Summon Details if class is a Summoner */}
                                        {selectedClass.summon && (
                                            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/50 space-y-2 text-xs">
                                                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                                                    <Users className="w-4 h-4 text-cyan-400" />
                                                    <span>Призвана істота: {selectedClass.summon.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-black/50 p-2 rounded-xl border border-indigo-900/60">
                                                    <span className="text-2xl">{selectedClass.summon.avatar}</span>
                                                    <div className="grid grid-cols-4 gap-2 flex-1 text-center font-mono text-[11px]">
                                                        <div className="bg-red-950/60 p-1 rounded border border-red-800/40">
                                                            <div className="text-[9px] text-stone-400">HP</div>
                                                            <div className="text-red-300 font-bold">{selectedClass.summon.hp}</div>
                                                        </div>
                                                        <div className="bg-amber-950/60 p-1 rounded border border-amber-800/40">
                                                            <div className="text-[9px] text-stone-400">Сила</div>
                                                            <div className="text-amber-300 font-bold">{selectedClass.summon.strength}</div>
                                                        </div>
                                                        <div className="bg-emerald-950/60 p-1 rounded border border-emerald-800/40">
                                                            <div className="text-[9px] text-stone-400">Спритн.</div>
                                                            <div className="text-emerald-300 font-bold">{selectedClass.summon.agility}</div>
                                                        </div>
                                                        <div className="bg-blue-950/60 p-1 rounded border border-blue-800/40">
                                                            <div className="text-[9px] text-stone-400">Броня</div>
                                                            <div className="text-blue-300 font-bold">{selectedClass.summon.armor}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Base Stats Bar */}
                                        <div className="space-y-1.5 bg-black/40 p-3 rounded-2xl border border-stone-800">
                                            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                                                Базові бойові параметри:
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                                                <div className="p-1.5 rounded-lg bg-red-950/40 border border-red-800/50">
                                                    <div className="text-[10px] text-red-300">Здоров'я</div>
                                                    <div className="font-black text-red-100">{selectedClass.baseStats.hp}</div>
                                                </div>
                                                <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50">
                                                    <div className="text-[10px] text-amber-300">Атака</div>
                                                    <div className="font-black text-amber-100">{selectedClass.baseStats.attack}</div>
                                                </div>
                                                <div className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-800/50">
                                                    <div className="text-[10px] text-blue-300">Захист</div>
                                                    <div className="font-black text-blue-100">{selectedClass.baseStats.defense}</div>
                                                </div>
                                                <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
                                                    <div className="text-[10px] text-emerald-300">Швидкість</div>
                                                    <div className="font-black text-emerald-100">{selectedClass.baseStats.speed}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Synergies & Counters */}
                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                                                <div className="text-emerald-300 font-bold mb-1">🤝 Найкраща синергія:</div>
                                                <div className="text-stone-300">{selectedClass.synergies.join(', ')}</div>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30">
                                                <div className="text-rose-300 font-bold mb-1">🎯 Ефективний проти:</div>
                                                <div className="text-stone-300">{selectedClass.counters.join(', ')}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: SPELLS & GRIMOIRE */}
                    {activeTab === 'spells' && (
                        <div className="space-y-6">
                            {/* Spells Filter */}
                            <div className="p-4 rounded-2xl bg-[#19110a] border border-[#b8860b]/40 flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-stone-400">Школа магії:</span>
                                    {['all', 'Некромантія та Тінь', 'Стихійна Магія', 'Священна Магія', 'Арканна та Захисна'].map(school => (
                                        <button
                                            key={school}
                                            onClick={() => setSpellSchoolFilter(school)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                                spellSchoolFilter === school
                                                    ? 'bg-indigo-600 text-white border-indigo-300 font-black shadow'
                                                    : 'bg-black/40 text-stone-400 border-stone-800 hover:text-white'
                                            }`}
                                        >
                                            {school === 'all' ? '✨ Усі школи' : school}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs text-indigo-300 font-mono">
                                    {filteredSpells.length} легендарних заклинань
                                </span>
                            </div>

                            {/* Spells Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredSpells.map(spell => (
                                    <div
                                        key={spell.id}
                                        className={`p-5 rounded-2xl border-2 bg-gradient-to-br ${spell.schoolColor} shadow-xl flex flex-col justify-between`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl p-2 rounded-xl bg-black/60 border border-white/20">
                                                        {spell.icon}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-serif font-black text-lg text-white">
                                                            {spell.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs opacity-80">
                                                            <span>{spell.school}</span>
                                                            <span>•</span>
                                                            <span className="font-bold">{spell.tier}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-black/60 border border-white/30 text-yellow-300">
                                                    {spell.manaCostOrReq}
                                                </span>
                                            </div>

                                            <p className="text-xs text-stone-200 mb-3 leading-relaxed">
                                                {spell.effectDescription}
                                            </p>

                                            {/* Rules in different modes */}
                                            <div className="space-y-2 text-xs bg-black/50 p-3 rounded-xl border border-white/10 mb-3">
                                                {spell.cardRule && (
                                                    <div className="flex items-start gap-1.5">
                                                        <span className="text-amber-400 font-bold shrink-0">🎴 У картах:</span>
                                                        <span className="text-stone-300">{spell.cardRule}</span>
                                                    </div>
                                                )}
                                                {spell.brawlRule && (
                                                    <div className="flex items-start gap-1.5">
                                                        <span className="text-red-400 font-bold shrink-0">⚔️ В автобоях:</span>
                                                        <span className="text-stone-300">{spell.brawlRule}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-[11px] italic text-stone-400 border-t border-white/10 pt-2">
                                            {spell.flavorQuote}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: INTERACTIVE POWER CALCULATOR */}
                    {activeTab === 'calculator' && (
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#2a1d12] via-[#1c120a] to-[#2a1d12] border border-[#b8860b]/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-serif font-black text-lg text-amber-200">
                                        ⚡ Симулятор та Калькулятор Здібностей
                                    </h3>
                                    <p className="text-xs text-stone-300 mt-1">
                                        Оберіть будь-який клас та рівень бійця, щоб розрахувати масштабування шкоди, захисту та призваних створінь
                                    </p>
                                </div>
                            </div>

                            {/* Calculator Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-[#19110a] border border-stone-800 space-y-2">
                                    <label className="text-xs text-stone-400 font-bold block">Оберіть клас:</label>
                                    <select
                                        value={calcClassId}
                                        onChange={(e) => setCalcClassId(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-black/60 border border-amber-600/50 text-sm text-amber-200 font-bold outline-none cursor-pointer"
                                    >
                                        {ALL_CLASSES_DETAILED.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.icon} {c.name} ({c.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#19110a] border border-stone-800 space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-stone-400 font-bold">Рівень бійця:</span>
                                        <span className="text-amber-300 font-black font-mono text-sm">Рівень {calcLevel}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={calcLevel}
                                        onChange={(e) => setCalcLevel(parseInt(e.target.value))}
                                        className="w-full accent-amber-500 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                                        <span>Рів. 1 (Новачок)</span>
                                        <span>Рів. 5 (Ветеран)</span>
                                        <span>Рів. 10 (Легенда)</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#19110a] border border-stone-800 space-y-2 flex flex-col justify-between">
                                    <label className="text-xs text-stone-400 font-bold block">Модифікатори загону:</label>
                                    <button
                                        onClick={() => setCalcSquadBuff(!calcSquadBuff)}
                                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                                            calcSquadBuff
                                                ? 'bg-amber-600 text-stone-950 border-amber-300 font-black shadow'
                                                : 'bg-black/50 text-stone-400 border-stone-800'
                                        }`}
                                    >
                                        <Award className="w-4 h-4" />
                                        <span>{calcSquadBuff ? 'Враховувати бафи лідера (+25% сили)' : 'Без бафів лідера'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Calculated Result Card */}
                            {(() => {
                                const levelMultiplier = 1 + (calcLevel - 1) * 0.2;
                                const buffMultiplier = calcSquadBuff ? 1.25 : 1.0;
                                const calculatedPower = Math.round(activeCalcClass.ability.power * levelMultiplier * buffMultiplier);
                                const calculatedHp = Math.round(activeCalcClass.baseStats.hp * levelMultiplier);
                                const calculatedAtk = Math.round(activeCalcClass.baseStats.attack * levelMultiplier * buffMultiplier);
                                const calculatedDef = Math.round(activeCalcClass.baseStats.defense * levelMultiplier);

                                return (
                                    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#25180f] via-[#1b1109] to-[#120a06] border-2 border-amber-500 shadow-2xl space-y-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/30 pb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-4xl p-3 bg-black/60 rounded-2xl border border-amber-500/60">
                                                    {activeCalcClass.icon}
                                                </span>
                                                <div>
                                                    <h3 className="font-serif font-black text-2xl text-amber-200">
                                                        {activeCalcClass.name}
                                                    </h3>
                                                    <div className="text-xs text-stone-400">
                                                        Розрахунок для Рівня {calcLevel} • {activeCalcClass.role}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-amber-950/60 rounded-2xl border border-amber-500/60 text-right">
                                                <div className="text-[10px] text-amber-300 uppercase font-bold">Потужність здібності:</div>
                                                <div className="text-2xl font-black text-yellow-300 font-mono">
                                                    {activeCalcClass.ability.type === 'summon' || activeCalcClass.ability.type === 'raise_undead'
                                                        ? 'Призов юніта'
                                                        : `+${calculatedPower} шкоди/бафу`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ability Result Details */}
                                        <div className="p-4 rounded-2xl bg-black/50 border border-stone-800 space-y-2">
                                            <div className="flex items-center gap-2 text-amber-300 font-bold">
                                                <span>{activeCalcClass.ability.typeIcon}</span>
                                                <span className="font-serif text-lg">{activeCalcClass.ability.name}</span>
                                                <span className="text-xs text-stone-400">({activeCalcClass.ability.typeName})</span>
                                            </div>
                                            <p className="text-xs text-stone-200">
                                                {activeCalcClass.ability.description}
                                            </p>
                                        </div>

                                        {/* Scaled Stats Matrix */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60">
                                                <div className="text-xs text-red-300 font-bold">Здоров'я (HP)</div>
                                                <div className="text-xl font-black text-red-100 font-mono mt-0.5">{calculatedHp}</div>
                                                <div className="text-[10px] text-stone-400">базове: {activeCalcClass.baseStats.hp}</div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60">
                                                <div className="text-xs text-amber-300 font-bold">Атака (ATK)</div>
                                                <div className="text-xl font-black text-amber-100 font-mono mt-0.5">{calculatedAtk}</div>
                                                <div className="text-[10px] text-stone-400">базове: {activeCalcClass.baseStats.attack}</div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60">
                                                <div className="text-xs text-blue-300 font-bold">Захист (DEF)</div>
                                                <div className="text-xl font-black text-blue-100 font-mono mt-0.5">{calculatedDef}</div>
                                                <div className="text-[10px] text-stone-400">базове: {activeCalcClass.baseStats.defense}</div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                                                <div className="text-xs text-emerald-300 font-bold">Швидкість (SPD)</div>
                                                <div className="text-xl font-black text-emerald-100 font-mono mt-0.5">{activeCalcClass.baseStats.speed}</div>
                                                <div className="text-[10px] text-stone-400">ініціатива ходу</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* TAB 4: SQUAD SYNERGIES & BEST FORMATIONS */}
                    {activeTab === 'synergies' && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-orange-950/40 border border-amber-500/50">
                                <h3 className="font-serif font-black text-lg text-amber-200">
                                    👑 Рекомендовані Бойові Формації Загонів
                                </h3>
                                <p className="text-xs text-stone-300 mt-1">
                                    Перевірені комбінації класів для охорони караванів, зачистки склепів від нежиті та турнірних дуелей
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Formation 1: Caravan Shield */}
                                <div className="p-5 rounded-2xl bg-[#19110a] border-2 border-amber-600/50 shadow-xl space-y-3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-amber-300 font-bold text-base mb-1">
                                            <span>🛒</span>
                                            <span>Охорона Караванів</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mb-3">
                                            Максимальний захист вантажу від засідок розбійників та вовкулак на трактах.
                                        </p>

                                        <div className="space-y-2 text-xs">
                                            <div className="p-2 bg-black/50 rounded-xl border border-stone-800 flex items-center gap-2">
                                                <span>🛡️</span>
                                                <div>
                                                    <strong className="text-amber-200">Гвардієць / Щитоносець</strong>
                                                    <div className="text-[10px] text-stone-400">Блокує до 20–40 першої шкоди</div>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-black/50 rounded-xl border border-stone-800 flex items-center gap-2">
                                                <span>🏹</span>
                                                <div>
                                                    <strong className="text-amber-200">Арбалетник / Снайпер</strong>
                                                    <div className="text-[10px] text-stone-400">Знищує ватажків грабіжників</div>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-black/50 rounded-xl border border-stone-800 flex items-center gap-2">
                                                <span>✨</span>
                                                <div>
                                                    <strong className="text-amber-200">Жрець / Друїд</strong>
                                                    <div className="text-[10px] text-stone-400">Відновлює здоров'я між боями</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-emerald-400 font-bold pt-2 border-t border-stone-800">
                                        Шанс збереження 100% вантажу: 96%
                                    </div>
                                </div>

                                {/* Formation 2: Undead Purge */}
                                <div className="p-5 rounded-2xl bg-[#19110a] border-2 border-yellow-600/50 shadow-xl space-y-3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-yellow-300 font-bold text-base mb-1">
                                            <span>✝️</span>
                                            <span>Очищення Цвинтарів</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mb-3">
                                            Спеціалізований загін святих воїнів для знищення скелетів, зомбі та прадавніх личів.
                                        </p>

                                        <div className="space-y-2 text-xs">
                                            <div className="p-2 bg-black/50 rounded-xl border border-stone-800 flex items-center gap-2">
                                                <span>⚔️</span>
                                                <div>
                                                    <strong className="text-yellow-200">Паладин / Святий Лицар</strong>
                                                    <div className="text-[10px] text-stone-400">Подвійна свята шкода по нежиті</div>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-black/50 rounded-xl border border-stone-800 flex items-center gap-2">
                                                <span>📜</span>
                                                <div>
                                                    <strong className="text-yellow-200">Екзорцист</strong>
                                                    <div className="text-[10px] text-stone-400">Миттєве розвіювання призваних духів</div>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-black/50 rounded-xl border border-stone-800 flex items-center gap-2">
                                                <span>🔥</span>
                                                <div>
                                                    <strong className="text-yellow-200">Інквізитор / Піромант</strong>
                                                    <div className="text-[10px] text-stone-400">Випалює мумій та склепи</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-yellow-400 font-bold pt-2 border-t border-stone-800">
                                        Бонус проти нежиті: +100% шкоди
                                    </div>
                                </div>

                                {/* Formation 3: Taverns & Boss Battles */}
                                <div className="p-5 rounded-2xl bg-[#19110a] border-2 border-purple-600/50 shadow-xl space-y-3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-purple-300 font-bold text-base mb-1">
                                            <span>👑</span>
                                            <span>Тавернні Чемпіонати</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mb-3">
                                            Швидкісний тактичний склад для перевершення супротивників у дуелях та турнірах.
                                        </p>

                                        <div className="space-y-2 text-xs">
                                            <div className="p-2 bg-black/50 rounded-xl border border-stone-800 flex items-center gap-2">
                                                <span>♟️</span>
                                                <div>
                                                    <strong className="text-purple-200">Тактик / Командир</strong>
                                                    <div className="text-[10px] text-stone-400">+30 сили та зміна порядку ходів</div>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-black/50 rounded-xl border border-stone-800 flex items-center gap-2">
                                                <span>🗡️</span>
                                                <div>
                                                    <strong className="text-purple-200">Асасин / Самурай</strong>
                                                    <div className="text-[10px] text-stone-400">50–70 критичної шкоди за 1 удар</div>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-black/50 rounded-xl border border-stone-800 flex items-center gap-2">
                                                <span>⏳</span>
                                                <div>
                                                    <strong className="text-purple-200">Хрономант</strong>
                                                    <div className="text-[10px] text-stone-400">Зупинка часу та додатковий хід</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-purple-400 font-bold pt-2 border-t border-stone-800">
                                        Ініціатива та раптовий удар: 100%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Bar */}
                <div className="px-6 py-3 bg-[#170f0a] border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Усі класи доступні для найму в міських тавернах та тренувальних залах королівства.</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black rounded-xl text-xs transition shadow cursor-pointer"
                    >
                        Зрозуміло
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

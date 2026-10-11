import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterGender } from '../types';
import { COMPANION_CLASSES } from '../lib/companionClasses';
import { getCompanionSprite } from '../lib/companionSprites';
import { generateRandomName } from '../lib/nameGenerator';
import { getGenderedCompanionTitle } from '../lib/toySoldiersData';
import { 
    Sparkles, 
    X, 
    Shield, 
    Sword, 
    Heart, 
    Zap, 
    Check, 
    Search, 
    Dice5, 
    User, 
    Crown,
    Crosshair,
    Wand2,
    Footprints,
    Flame
} from 'lucide-react';

export interface DecompressUnitInfo {
    name: string;
    avatar: string;
    level?: number;
    experience?: number;
    type?: string;
    gender?: CharacterGender;
    livingCount?: number;
    isSquad?: boolean;
    isMilitarySquad?: boolean;
}

export interface DecompressChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: DecompressUnitInfo | null;
    onConfirm: (options: {
        classId: string;
        gender: CharacterGender;
        name: string;
        avatar: string;
    }) => void;
}

type ClassCategory = 'popular' | 'melee' | 'heavy' | 'ranged' | 'magic' | 'stealth' | 'holy' | 'all';

const CATEGORIES: { id: ClassCategory; label: string; icon: string }[] = [
    { id: 'popular', label: '🌟 Обрані', icon: '⭐' },
    { id: 'melee', label: '⚔️ Воїни', icon: '⚔️' },
    { id: 'heavy', label: '🛡️ Танки', icon: '🛡️' },
    { id: 'ranged', label: '🏹 Стрільці', icon: '🏹' },
    { id: 'magic', label: '🔮 Маги', icon: '🔮' },
    { id: 'stealth', label: '🗡️ Спритність', icon: '🗡️' },
    { id: 'holy', label: '✝️ Підтримка', icon: '✝️' },
    { id: 'all', label: '📜 Всі', icon: '📜' }
];

const POPULAR_CLASSES = [
    'paladin',
    'swordsman',
    'hunter',
    'assassin',
    'sorcerer',
    'elementalist',
    'berserker',
    'guardian',
    'priest',
    'sniper',
    'druid',
    'commander'
];

const CATEGORY_CLASSES: Record<ClassCategory, string[]> = {
    popular: POPULAR_CLASSES,
    melee: ['swordsman', 'barbarian', 'berserker', 'pikeman', 'samurai', 'duelist', 'wandering_knight'],
    heavy: ['paladin', 'guardian', 'shieldbearer', 'cataphract', 'holy_knight'],
    ranged: ['hunter', 'sniper', 'crossbowman', 'ranger', 'musketeer', 'thrower'],
    magic: ['elementalist', 'pyromancer', 'cryomancer', 'necromancer', 'druid', 'shaman', 'warlock', 'alchemist', 'sorcerer'],
    stealth: ['assassin', 'ninja', 'thief', 'saboteur', 'spy', 'executioner'],
    holy: ['priest', 'exorcist', 'inquisitor', 'commander', 'tactician', 'banner_bearer', 'adventurer'],
    all: Object.keys(COMPANION_CLASSES)
};

const FEMALE_AVATARS = ['🧝‍♀️', '🧙‍♀️', '👸', '🦹‍♀️', '👩‍🎤', '👩', '🧚', '⚔️', '🛡️', '🏹', '🔮', '🗡️'];
const MALE_AVATARS = ['🧔', '👨‍✈️', '🤴', '🧝‍♂️', '🧙‍♂️', '🥷', '🦹‍♂️', '⚔️', '🛡️', '🏹', '🔮', '🗡️'];

export function DecompressChoiceModal({
    isOpen,
    onClose,
    unit,
    onConfirm
}: DecompressChoiceModalProps) {
    const [selectedGender, setSelectedGender] = useState<CharacterGender>('male');
    const [selectedClassId, setSelectedClassId] = useState<string>('paladin');
    const [customName, setCustomName] = useState<string>('');
    const [selectedAvatar, setSelectedAvatar] = useState<string>('⚔️');
    const [activeCategory, setActiveCategory] = useState<ClassCategory>('popular');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Reset when modal opens for a new unit
    useEffect(() => {
        if (unit && isOpen) {
            const initialGender: CharacterGender = unit.gender || 'male';
            setSelectedGender(initialGender);
            setCustomName(unit.name || 'Олов\'яний Воїн');

            // Select smart initial class based on unit type
            const unitType = (unit.type || '').toLowerCase();
            let initialClass = 'paladin';
            if (unitType.includes('маг')) initialClass = 'sorcerer';
            else if (unitType.includes('стрілець') || unitType.includes('арбалет') || unitType.includes('лучник')) initialClass = 'hunter';
            else if (unitType.includes('асасин') || unitType.includes('злодій')) initialClass = 'assassin';
            else if (unitType.includes('щит')) initialClass = 'shieldbearer';
            else if (unitType.includes('лицар')) initialClass = 'paladin';
            else if (unitType.includes('берсерк')) initialClass = 'berserker';
            else if (unitType.includes('шашк')) initialClass = 'paladin';
            else initialClass = 'swordsman';

            setSelectedClassId(initialClass);
            setSelectedAvatar(initialGender === 'female' ? '🧝‍♀️' : '⚔️');
        }
    }, [unit, isOpen]);

    // Update avatar and title when gender changes
    const handleGenderChange = (gender: CharacterGender) => {
        setSelectedGender(gender);
        // Default avatar for that gender if current avatar is gender-specific
        if (gender === 'female' && MALE_AVATARS.slice(0, 7).includes(selectedAvatar)) {
            setSelectedAvatar('🧝‍♀️');
        } else if (gender === 'male' && FEMALE_AVATARS.slice(0, 7).includes(selectedAvatar)) {
            setSelectedAvatar('🧔');
        }
    };

    const handleRandomName = () => {
        const generated = generateRandomName('any', selectedGender);
        if (generated) {
            setCustomName(generated);
        }
    };

    // Filter classes
    const availableClasses = useMemo(() => {
        const list = CATEGORY_CLASSES[activeCategory] || Object.keys(COMPANION_CLASSES);
        const query = searchQuery.trim().toLowerCase();

        return list.filter(classKey => {
            const def = COMPANION_CLASSES[classKey];
            if (!def) return false;
            if (!query) return true;
            return def.name.toLowerCase().includes(query) ||
                   def.description.toLowerCase().includes(query) ||
                   def.abilityName.toLowerCase().includes(query) ||
                   classKey.toLowerCase().includes(query);
        });
    }, [activeCategory, searchQuery]);

    if (!isOpen || !unit) return null;

    const currentClassDef = COMPANION_CLASSES[selectedClassId] || COMPANION_CLASSES['paladin'];
    const currentTitle = getGenderedCompanionTitle(selectedClassId, selectedGender);

    // Live sprite preview
    const spriteUrl = getCompanionSprite({
        companionClassId: selectedClassId,
        gender: selectedGender,
        avatar: selectedAvatar,
        name: customName
    });

    // Stats calculations
    let calculatedHp = 145;
    let calculatedArmor = 28;
    let calculatedStr = 20;
    let calculatedAgi = 16;
    let calculatedPower = 35;

    if (['guardian', 'paladin', 'shieldbearer', 'cataphract'].includes(selectedClassId)) {
        calculatedHp = 160;
        calculatedArmor = 32;
        calculatedStr = 22;
        calculatedAgi = 14;
    } else if (['hunter', 'sniper', 'crossbowman', 'ranger'].includes(selectedClassId)) {
        calculatedHp = 135;
        calculatedArmor = 22;
        calculatedStr = 17;
        calculatedAgi = 24;
    } else if (['assassin', 'ninja', 'thief', 'saboteur'].includes(selectedClassId)) {
        calculatedHp = 135;
        calculatedArmor = 20;
        calculatedStr = 19;
        calculatedAgi = 25;
    } else if (['sorcerer', 'wizard', 'elementalist', 'pyromancer', 'cryomancer', 'necromancer', 'druid', 'priest'].includes(selectedClassId)) {
        calculatedHp = 130;
        calculatedArmor = 18;
        calculatedPower = 55;
        calculatedStr = 14;
        calculatedAgi = 16;
    }

    const companionsCount = unit.livingCount || 1;

    const handleConfirm = () => {
        onConfirm({
            classId: selectedClassId,
            gender: selectedGender,
            name: customName.trim() || unit.name,
            avatar: selectedAvatar
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-5">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-[#181124] border-2 border-purple-500/70 rounded-3xl p-5 sm:p-6 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#f5ebd7]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-purple-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-2xl shadow-inner">
                                🔮
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-purple-300 font-serif flex items-center gap-2">
                                    <span>Оберіть клас і стать для декомпресії</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-sans font-bold">
                                        Вівтар Переродження
                                    </span>
                                </h2>
                                <p className="text-xs text-purple-200/75 mt-0.5">
                                    Перетворіть «{unit.name}» на повноцінного лицаря або майстра бойового загону
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-full transition-colors border border-stone-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Unit banner */}
                    <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-purple-950/60 border border-purple-700/40 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl p-2 bg-purple-900/50 rounded-xl border border-purple-500/40">
                                {unit.avatar}
                            </span>
                            <div>
                                <div className="font-bold text-sm text-yellow-300 font-serif">{unit.name}</div>
                                <div className="text-[11px] text-purple-200/80">
                                    Рівень: {unit.level ?? 4}★ {unit.experience !== undefined ? `• Досвід: ${unit.experience} XP` : ''}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs font-bold text-emerald-400">
                                {companionsCount > 1 
                                    ? `Буде створено: ${companionsCount} бійців!` 
                                    : 'Буде створено: 1 персонаж!'}
                            </div>
                            <div className="text-[10px] text-stone-400">
                                Всі отримають обрані клас і стать
                            </div>
                        </div>
                    </div>

                    {/* Main Split Grid */}
                    <div className="flex-1 overflow-y-auto mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 pr-1">
                        {/* Left column: Controls (Gender, Class Selection) */}
                        <div className="lg:col-span-7 space-y-4">
                            {/* STEP 1: GENDER SELECTION */}
                            <div className="bg-black/30 p-4 rounded-2xl border border-purple-800/40 space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-amber-400" />
                                    <span>1. Оберіть стать бійця:</span>
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleGenderChange('male')}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${
                                            selectedGender === 'male'
                                                ? 'bg-blue-950/70 border-blue-400 text-blue-200 shadow-md shadow-blue-900/30 ring-2 ring-blue-500/30'
                                                : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                                        }`}
                                    >
                                        <span className="text-2xl">♂️</span>
                                        <div className="text-left">
                                            <div className="font-black text-sm">Чоловіча стать</div>
                                            <div className="text-[10px] opacity-80">Мужній лицар / воїн</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleGenderChange('female')}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${
                                            selectedGender === 'female'
                                                ? 'bg-fuchsia-950/70 border-fuchsia-400 text-fuchsia-200 shadow-md shadow-fuchsia-900/30 ring-2 ring-fuchsia-500/30'
                                                : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                                        }`}
                                    >
                                        <span className="text-2xl">♀️</span>
                                        <div className="text-left">
                                            <div className="font-black text-sm">Жіноча стать</div>
                                            <div className="text-[10px] opacity-80">Велична лицарка / чарівниця</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* STEP 2: CLASS SELECTION */}
                            <div className="bg-black/30 p-4 rounded-2xl border border-purple-800/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                                        <span>2. Оберіть клас бійця:</span>
                                    </label>
                                    <span className="text-[11px] text-amber-300 font-bold">
                                        Обрано: {currentClassDef.name}
                                    </span>
                                </div>

                                {/* Category tabs */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                                                activeCategory === cat.id
                                                    ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                                                    : 'bg-stone-900/70 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Search bar */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                                    <input
                                        type="text"
                                        placeholder="Пошук класу за назвою чи вмінням..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-stone-950/80 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-purple-500"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-200 text-xs"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Class Cards List */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                    {availableClasses.map((classKey) => {
                                        const def = COMPANION_CLASSES[classKey];
                                        if (!def) return null;
                                        const isSelected = selectedClassId === classKey;

                                        return (
                                            <button
                                                key={classKey}
                                                type="button"
                                                onClick={() => setSelectedClassId(classKey)}
                                                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-purple-900/60 border-amber-400 text-purple-100 ring-2 ring-amber-400/30 shadow-md'
                                                        : 'bg-stone-900/50 border-stone-800 text-stone-300 hover:border-purple-700 hover:bg-stone-900/80'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="font-bold text-xs text-amber-200">
                                                        {def.name}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="p-0.5 rounded-full bg-amber-400 text-black">
                                                            <Check className="w-3 h-3 stroke-[3]" />
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-[10px] text-stone-400 line-clamp-2 leading-tight">
                                                    {def.description}
                                                </p>

                                                <div className="text-[9px] text-purple-300/90 font-mono mt-0.5 flex items-center gap-1 bg-purple-950/60 px-1.5 py-0.5 rounded">
                                                    <Zap className="w-2.5 h-2.5 text-amber-300" />
                                                    <span>{def.abilityName} ({def.abilityPower} сили)</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* STEP 3: NAME & AVATAR PICKER */}
                            <div className="bg-black/30 p-4 rounded-2xl border border-purple-800/40 space-y-3">
                                <label className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center justify-between">
                                    <span>3. Ім'я та Зовнішній вигляд:</span>
                                    <button
                                        type="button"
                                        onClick={handleRandomName}
                                        className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/50 transition-colors"
                                    >
                                        <Dice5 className="w-3 h-3" />
                                        <span>Випадкове ім'я</span>
                                    </button>
                                </label>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="Введіть ім'я..."
                                        className="flex-1 bg-stone-950/80 border border-stone-800 rounded-xl px-3 py-2 text-xs text-amber-100 font-bold focus:outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div>
                                    <div className="text-[11px] text-stone-400 mb-1.5">
                                        Оберіть аватар ({selectedGender === 'female' ? 'Жіночі варіанти' : 'Чоловічі варіанти'}):
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(selectedGender === 'female' ? FEMALE_AVATARS : MALE_AVATARS).map((av, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedAvatar(av)}
                                                className={`text-xl p-1.5 rounded-lg border transition-all ${
                                                    selectedAvatar === av
                                                        ? 'bg-purple-600 border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/40'
                                                        : 'bg-stone-900 border-stone-800 hover:border-purple-500'
                                                }`}
                                            >
                                                {av}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column: Live Character Preview & Ability Inspector */}
                        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                            {/* Card Preview */}
                            <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-950/70 via-indigo-950/50 to-stone-950 border-2 border-purple-500/70 shadow-xl space-y-4">
                                <div className="text-center space-y-1">
                                    <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest">
                                        Попередній перегляд
                                    </div>
                                    <h3 className="text-lg font-black text-amber-200 font-serif">
                                        {customName || unit.name}
                                    </h3>
                                    <div className="text-xs text-purple-300 font-bold">
                                        {currentTitle}
                                    </div>
                                </div>

                                {/* Portrait / Sprite Container */}
                                <div className="relative w-40 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-purple-500/80 shadow-2xl bg-stone-950">
                                    <img
                                        src={spriteUrl}
                                        alt={customName}
                                        className="w-full h-full object-cover object-top"
                                    />
                                    <div className="absolute top-2 left-2 text-2xl p-1 bg-black/60 backdrop-blur-sm rounded-lg border border-purple-400/50">
                                        {selectedAvatar}
                                    </div>
                                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-bold text-amber-300 border border-amber-500/40">
                                        {selectedGender === 'female' ? '♀ Жінка' : '♂ Чоловік'}
                                    </div>
                                </div>

                                {/* Class Ability Details */}
                                <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-700/50 space-y-1 text-xs">
                                    <div className="flex items-center justify-between text-amber-300 font-bold">
                                        <span className="flex items-center gap-1">
                                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Вміння: {currentClassDef.abilityName}</span>
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900 border border-purple-500/40 text-purple-200">
                                            {currentClassDef.abilityPower} сили
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-purple-200/80 leading-relaxed">
                                        {currentClassDef.abilityDescription}
                                    </p>
                                </div>

                                {/* Calculated Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2 rounded-lg bg-black/40 border border-purple-900/50 flex items-center justify-between">
                                        <span className="text-stone-400 flex items-center gap-1">
                                            <Heart className="w-3 h-3 text-red-400" />
                                            <span>Здоров'я:</span>
                                        </span>
                                        <span className="font-bold text-red-300">{calculatedHp} HP</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-black/40 border border-purple-900/50 flex items-center justify-between">
                                        <span className="text-stone-400 flex items-center gap-1">
                                            <Shield className="w-3 h-3 text-blue-400" />
                                            <span>Броня:</span>
                                        </span>
                                        <span className="font-bold text-blue-300">{calculatedArmor}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-black/40 border border-purple-900/50 flex items-center justify-between">
                                        <span className="text-stone-400 flex items-center gap-1">
                                            <Sword className="w-3 h-3 text-amber-400" />
                                            <span>Сила:</span>
                                        </span>
                                        <span className="font-bold text-amber-300">{calculatedStr}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-black/40 border border-purple-900/50 flex items-center justify-between">
                                        <span className="text-stone-400 flex items-center gap-1">
                                            <Footprints className="w-3 h-3 text-emerald-400" />
                                            <span>Спритність:</span>
                                        </span>
                                        <span className="font-bold text-emerald-300">{calculatedAgi}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-2">
                                <button
                                    onClick={handleConfirm}
                                    className="w-full py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-stone-950 active:scale-95 border border-amber-300 cursor-pointer"
                                >
                                    <Sparkles className="w-4 h-4 text-stone-950 animate-spin" />
                                    <span>Підтвердити Декомпресію ({customName || unit.name})</span>
                                </button>

                                <button
                                    onClick={onClose}
                                    className="w-full py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white bg-stone-900/80 hover:bg-stone-800 transition-colors border border-stone-800"
                                >
                                    Скасувати
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

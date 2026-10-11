import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorldProgress, HiredCompanion } from '../types';
import { COMPANION_CLASSES } from '../lib/companionClasses';
import { 
    getHeroCommanderSprite,
    getCompanionSprite,
    isCharacterFemale
} from '../lib/companionSprites';
import { 
    Shield, 
    Zap, 
    Heart, 
    Activity, 
    Award, 
    Crosshair, 
    Users, 
    Sparkles, 
    Info,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface SquadFormationViewProps {
    progress: WorldProgress;
    onHealCompanion?: (companionId: string) => void;
    compact?: boolean;
}

export const SquadFormationView: React.FC<SquadFormationViewProps> = ({
    progress,
    onHealCompanion,
    compact = false
}) => {
    const [selectedCompanion, setSelectedCompanion] = useState<HiredCompanion | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftPos, setScrollLeftPos] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeftPos(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollRef.current.scrollLeft = scrollLeftPos - walk;
    };

    const handleScrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
        }
    };

    const handleScrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
    };

    const stats = progress.playerStats;
    const heroGender = stats?.gender || 'male';
    const isFemaleCommander = heroGender === 'female';
    const heroHp = stats ? stats.baseHp + stats.strength : 100;
    const heroLevel = stats?.level ?? 0;
    const heroCommanderSprite = getHeroCommanderSprite(heroGender);
    const hiredCompanions = progress.hiredNpcs || [];

    return (
        <div className="space-y-4">
            {/* Squad Header Bar */}
            <div className="flex items-center justify-between border-b border-[#4a3520] pb-2.5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-serif font-black text-sm text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                            Бойовий Стрій Загону
                        </h3>
                        <p className="text-[11px] text-stone-400">
                            {isFemaleCommander ? 'Командирка' : 'Командир'} та вірні бійці лицарського підрозділу
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#241a12] border border-amber-600/40 text-amber-300 font-mono text-xs font-bold shadow-inner">
                        🛡️ {hiredCompanions.length + 1} воїнів у строю
                    </span>
                </div>
            </div>

            {/* Tactical Formation Stage */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#1c140d] via-[#140e09] to-[#0d0906] border-2 border-[#5c4028] p-3 sm:p-4 shadow-2xl overflow-hidden group">
                {/* Background decorative parchment grid / tactical line */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="absolute bottom-6 left-0 right-0 h-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                {/* Floating Scroll Arrows for easy navigation */}
                <button
                    onClick={handleScrollLeft}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/90 hover:bg-amber-600/90 text-amber-300 hover:text-stone-950 border-2 border-amber-500/70 shadow-[0_0_20px_rgba(0,0,0,0.9)] transition cursor-pointer active:scale-90 flex items-center justify-center"
                    title="Прокрутити загін вліво"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                    onClick={handleScrollRight}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/90 hover:bg-amber-600/90 text-amber-300 hover:text-stone-950 border-2 border-amber-500/70 shadow-[0_0_20px_rgba(0,0,0,0.9)] transition cursor-pointer active:scale-90 flex items-center justify-center"
                    title="Прокрутити загін вправо"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Squad Lineup Outer Scroll Container */}
                <div 
                    ref={scrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={`relative z-10 w-full overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-amber-600 scrollbar-track-stone-900/60 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                    {/* Inner flex container with min-w-max prevents negative overflow clipping */}
                    <div className="flex items-end justify-start gap-3 sm:gap-4 min-w-max px-6 sm:px-10 mx-auto">
                    {/* 1. Main Hero / Knight Commander */}
                    <div className="flex flex-col items-center flex-shrink-0 group">
                        {/* Commander Badge */}
                        <div className="mb-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 border border-yellow-300">
                            <span>👑</span>
                            <span>{isFemaleCommander ? 'Командирка ♀️' : 'Командир ♂️'}</span>
                        </div>

                        {/* Character Sprite Card */}
                        <motion.div 
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="relative w-28 sm:w-32 bg-[#2a1d13] border-2 border-amber-400/80 rounded-2xl p-2 shadow-xl shadow-amber-950/40 flex flex-col items-center"
                        >
                            {/* Sprite image container with realistic tactical pedestal */}
                            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-b from-[#3a281a] to-[#1a120b] border border-amber-500/40 flex items-center justify-center shadow-inner">
                                <img 
                                    src={heroCommanderSprite}
                                    alt={isFemaleCommander ? "Лицарка-Командирка" : "Лицар-Командир"}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover object-top filter contrast-105"
                                />
                                <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#140e09] to-transparent pointer-events-none" />
                                
                                {/* Level floating pill */}
                                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 border border-amber-500/60 text-amber-300 text-[10px] font-mono font-bold">
                                    Рів {heroLevel}
                                </div>
                            </div>

                            {/* Stone Pedestal Shadow under the warrior */}
                            <div className="w-20 h-2 mt-1 rounded-[100%] bg-black/60 blur-[1px]" />

                            {/* Name & Title */}
                            <div className="mt-1 text-center w-full">
                                <div className="font-serif font-black text-xs text-amber-200 truncate">
                                    {isFemaleCommander ? 'Головна Героїня' : 'Головний Герой'}
                                </div>
                                <div className="text-[10px] text-stone-400 truncate flex items-center justify-center gap-1">
                                    <span>{isFemaleCommander ? 'Лицарка-Командирка' : 'Лицар-Командир'}</span>
                                    <span className={isFemaleCommander ? 'text-pink-400 font-bold' : 'text-sky-400 font-bold'}>
                                        {isFemaleCommander ? '♀️' : '♂️'}
                                    </span>
                                </div>
                            </div>

                            {/* HP bar */}
                            <div className="w-full mt-2 space-y-1">
                                <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                                    <span>❤️ HP</span>
                                    <span className="text-emerald-300 font-bold">{heroHp}</span>
                                </div>
                                <div className="w-full h-1.5 bg-black/70 rounded-full overflow-hidden border border-emerald-950">
                                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                                </div>
                            </div>

                            {/* Stats Chips */}
                            <div className="flex items-center justify-around w-full mt-2 pt-1 border-t border-[#4a3520] text-[10px] font-mono text-stone-300">
                                <span title="Сила">⚔️ {stats?.strength || 5}</span>
                                <span title="Спритність">🎯 {stats?.agility || 5}</span>
                                <span title="Броня">🛡️ +{stats?.rangedShootingMod || 1}</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Divider Flag */}
                    {hiredCompanions.length > 0 && (
                        <div className="h-44 flex flex-col items-center justify-center text-stone-600 opacity-60">
                            <div className="w-px h-full bg-gradient-to-b from-transparent via-amber-600/40 to-transparent" />
                        </div>
                    )}

                    {/* 2. Companions Lineup */}
                    {hiredCompanions.map((comp) => {
                        const cClass = comp.companionClassId ? COMPANION_CLASSES[comp.companionClassId] : null;
                        const maxHp = Math.max(comp.baseHp || 100, comp.hp || 100);
                        const curHp = Math.min(maxHp, comp.hp ?? maxHp);
                        const isInjuredOrDead = curHp <= 0 || comp.isDead;
                        const spriteUrl = getCompanionSprite(comp);
                        const hpRatio = Math.max(0, Math.min(1, curHp / maxHp));

                        return (
                            <div key={comp.id} className="flex flex-col items-center flex-shrink-0 group">
                                {/* Role / Class Badge */}
                                <div className={`mb-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 border ${
                                    isInjuredOrDead 
                                        ? 'bg-red-950 text-red-300 border-red-700/60' 
                                        : 'bg-[#2b1f14] text-amber-300 border-amber-600/50'
                                }`}>
                                    <span>{comp.avatar || '⚔️'}</span>
                                    <span className="truncate max-w-[80px]">{cClass ? cClass.name.split(' ')[0] : 'Піхотинець'}</span>
                                </div>

                                {/* Soldier Card */}
                                <motion.div 
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    onClick={() => setSelectedCompanion(comp)}
                                    className={`relative w-28 sm:w-32 rounded-2xl p-2 shadow-xl flex flex-col items-center cursor-pointer transition border-2 ${
                                        isInjuredOrDead
                                            ? 'bg-[#1e1212] border-red-700/80 shadow-red-950/40'
                                            : 'bg-[#22170e] border-[#5a3f29] hover:border-amber-500/80 shadow-amber-950/30'
                                    }`}
                                >
                                    {/* Soldier Sprite Container */}
                                    <div className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden border flex items-center justify-center shadow-inner ${
                                        isInjuredOrDead 
                                            ? 'bg-red-950/30 border-red-800/40 grayscale contrast-125' 
                                            : 'bg-gradient-to-b from-[#2e2014] to-[#140e09] border-amber-700/30'
                                    }`}>
                                        <img 
                                            src={spriteUrl}
                                            alt={comp.name}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover object-top filter"
                                        />
                                        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#140e09] to-transparent pointer-events-none" />

                                        {/* Status / Level overlay */}
                                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 border border-stone-700 text-stone-200 text-[10px] font-mono font-bold">
                                            Рів {comp.level || 1}
                                        </div>

                                        {isInjuredOrDead && (
                                            <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-1 text-center">
                                                <span className="text-2xl">💔</span>
                                                <span className="text-[10px] font-black text-red-200 uppercase mt-0.5">Поранений</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stone Pedestal Shadow under the soldier */}
                                    <div className="w-20 h-2 mt-1 rounded-[100%] bg-black/60 blur-[1px]" />

                                    {/* Name & Class */}
                                    <div className="mt-1 text-center w-full">
                                        <div className={`font-serif font-black text-xs truncate flex items-center justify-center gap-1 ${isInjuredOrDead ? 'text-red-300' : 'text-stone-200'}`}>
                                            <span className="truncate">{comp.name}</span>
                                            {(() => {
                                                const compIsFemale = isCharacterFemale(comp);
                                                return (
                                                    <span className={`text-[10px] font-bold ${compIsFemale ? 'text-pink-400' : 'text-sky-400'}`} title={compIsFemale ? 'Жіноча стать' : 'Чоловіча стать'}>
                                                        {compIsFemale ? '♀️' : '♂️'}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div className="text-[10px] text-stone-400 truncate">
                                            {cClass ? cClass.abilityName : comp.title}
                                        </div>
                                    </div>

                                    {/* HP bar */}
                                    <div className="w-full mt-2 space-y-1">
                                        <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                                            <span>❤️ HP</span>
                                            <span className={isInjuredOrDead ? 'text-red-400 font-bold' : 'text-emerald-300 font-bold'}>
                                                {curHp} / {maxHp}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-black/70 rounded-full overflow-hidden border border-stone-800">
                                            <div 
                                                className={`h-full rounded-full transition-all ${isInjuredOrDead ? 'bg-red-600' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.round(hpRatio * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action: Heal button if wounded, or stats chips */}
                                    {isInjuredOrDead ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onHealCompanion) {
                                                    onHealCompanion(comp.id);
                                                }
                                            }}
                                            className="w-full mt-2 py-1 px-1.5 bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-700 hover:to-teal-600 text-teal-100 text-[10px] font-bold rounded-lg transition border border-teal-500/50 shadow flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <span>🩹</span>
                                            <span>Вилікувати (50🪙)</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-around w-full mt-2 pt-1 border-t border-[#3a281a] text-[10px] font-mono text-stone-300">
                                            <span title="Сила">⚔️ {comp.strength || 4}</span>
                                            <span title="Спритність">🎯 {comp.agility || 4}</span>
                                            <span title="Заряди здібності" className="text-blue-300 font-bold">
                                                ✨ {comp.currentAbilityCharges ?? 1}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        );
                    })}

                    {/* Empty Roster Hint when squad has no companions */}
                    {hiredCompanions.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-900/40 rounded-2xl bg-black/30 text-center max-w-xs">
                            <span className="text-3xl mb-2 opacity-50">🛡️</span>
                            <div className="font-bold text-amber-300 text-xs">
                                У загоні поки немає найманців
                            </div>
                            <p className="text-[11px] text-stone-400 mt-1">
                                Відвідайте таверни в містах та фортецях, щоб найняти лицарів, лучників та важких піхотинців!
                            </p>
                        </div>
                    )}
                    </div>
                </div>

                {/* Scroll hint helper */}
                {hiredCompanions.length > 2 && (
                    <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[11px] text-amber-300 font-bold bg-[#140e09]/90 py-1 px-3 rounded-lg border border-amber-800/40 w-fit mx-auto shadow">
                        <ChevronLeft className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Прокручуйте стрілочками ◀ ▶ або перетягуйте мишкою ({hiredCompanions.length + 1} воїнів)</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    </div>
                )}
            </div>

            {/* Selected Companion Inspector Modal */}
            <AnimatePresence>
                {selectedCompanion && (() => {
                    const comp = selectedCompanion;
                    const cClass = comp.companionClassId ? COMPANION_CLASSES[comp.companionClassId] : null;
                    const maxHp = Math.max(comp.baseHp || 100, comp.hp || 100);
                    const curHp = Math.min(maxHp, comp.hp ?? maxHp);
                    const isInjuredOrDead = curHp <= 0 || comp.isDead;
                    const spriteUrl = getCompanionSprite(comp);

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-md bg-[#18120c] border-2 border-amber-500/70 rounded-2xl p-5 text-[#f5ebd7] shadow-2xl space-y-4"
                            >
                                <div className="flex items-center justify-between border-b border-amber-900/50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl p-1 bg-amber-950/80 rounded-xl border border-amber-600/40">{comp.avatar || '⚔️'}</span>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-bold text-amber-200 text-base">{comp.name}</h3>
                                                {(() => {
                                                    const compIsFemale = isCharacterFemale(comp);
                                                    return (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                            compIsFemale 
                                                                ? 'bg-pink-950/80 border-pink-500/60 text-pink-300' 
                                                                : 'bg-sky-950/80 border-sky-500/60 text-sky-300'
                                                        }`}>
                                                            {compIsFemale ? 'Жінка ♀️' : 'Чоловік ♂️'}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <p className="text-xs text-stone-400">{cClass ? cClass.name : comp.title} • Рівень {comp.level || 1}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedCompanion(null)}
                                        className="p-1.5 text-stone-400 hover:text-white rounded-lg bg-stone-900 text-xs hover:bg-stone-800 transition cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex gap-4 items-start">
                                    {/* Big Character Sprite */}
                                    <div className="w-32 aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-b from-[#2e2014] to-[#140e09] border-2 border-amber-600/50 shadow-lg flex-shrink-0">
                                        <img 
                                            src={spriteUrl} 
                                            alt={comp.name}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover object-top" 
                                        />
                                    </div>

                                    {/* Stats and Info */}
                                    <div className="flex-1 space-y-2 text-xs">
                                        <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800 space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-stone-400">Здоров'я:</span>
                                                <span className={isInjuredOrDead ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                                    ❤️ {curHp} / {maxHp} {isInjuredOrDead ? '(Поранений)' : ''}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-stone-400">Сила атаки:</span>
                                                <span className="text-amber-300 font-bold">⚔️ {comp.strength || 4}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-stone-400">Спритність:</span>
                                                <span className="text-teal-300 font-bold">🎯 {comp.agility || 4}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-stone-400">Шанс виживання:</span>
                                                <span className={comp.survivalProbability < 50 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                                    🎲 {comp.survivalProbability}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-stone-400">Досвід (XP):</span>
                                                <span className="text-purple-300 font-mono">
                                                    {comp.xp || 0} / {comp.xpToNextLevel || 100}
                                                </span>
                                            </div>
                                        </div>

                                        {cClass && (
                                            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-700/40">
                                                <div className="font-bold text-amber-300 text-xs flex items-center gap-1">
                                                    <span>✨</span> {cClass.abilityName}
                                                </div>
                                                <p className="text-[11px] text-stone-300 mt-1">
                                                    {cClass.abilityDescription}
                                                </p>
                                                <div className="mt-1 text-[10px] text-blue-300 font-mono">
                                                    Заряди: {comp.currentAbilityCharges ?? 1} / {comp.maxAbilityCharges ?? 1}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-amber-900/40 flex justify-between items-center">
                                    {isInjuredOrDead ? (
                                        <button
                                            onClick={() => {
                                                if (onHealCompanion) {
                                                    onHealCompanion(comp.id);
                                                }
                                                setSelectedCompanion(null);
                                            }}
                                            className="px-4 py-1.5 bg-teal-800 hover:bg-teal-700 text-teal-100 text-xs font-bold rounded-xl cursor-pointer transition border border-teal-500/50 shadow"
                                        >
                                            🩹 Вилікувати пораненого (50 🪙)
                                        </button>
                                    ) : (
                                        <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Воїн готовий до бою
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setSelectedCompanion(null)}
                                        className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl cursor-pointer"
                                    >
                                        Закрити
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
};

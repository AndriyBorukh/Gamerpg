import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToySoldier, WorldProgress, HiredCompanion, ArmySquad, CustomHeroCard, CharacterGender } from '../types';
import { 
    decompressSoldierToCompanion, 
    decompressSquadToCompanions, 
    decompressMilitarySquadToCompanions, 
    getMilitarySquadDecompressionCount,
    getGenderedCompanionTitle,
    DecompressOptions
} from '../lib/toySoldiersData';
import { DecompressChoiceModal, DecompressUnitInfo } from './DecompressChoiceModal';
import { saveWorldProgress } from '../lib/worldData';
import { playLevelUpSound, playSparkleSound } from '../lib/soundEffects';
import { 
    Sparkles, 
    X, 
    Users, 
    Shield, 
    Sword, 
    Heart, 
    Zap, 
    Award, 
    Check, 
    Info, 
    ArrowRight,
    Flag
} from 'lucide-react';

interface DecompressionMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
}

export function DecompressionMasterModal({
    isOpen,
    onClose,
    progress,
    onUpdateProgress
}: DecompressionMasterModalProps) {
    const [selectedSoldier, setSelectedSoldier] = useState<ToySoldier | null>(null);
    const [isDecompressing, setIsDecompressing] = useState(false);
    const [decompressedSuccess, setDecompressedSuccess] = useState<HiredCompanion | null>(null);
    const [decompressedSquadSuccess, setDecompressedSquadSuccess] = useState<HiredCompanion[] | null>(null);
    const [choiceModalUnit, setChoiceModalUnit] = useState<DecompressUnitInfo | null>(null);
    const [targetItem, setTargetItem] = useState<{
        type: 'soldier' | 'squad' | 'hero';
        item: ToySoldier | ArmySquad | CustomHeroCard;
    } | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    if (!isOpen) return null;

    const soldiers: ToySoldier[] = progress.toySoldiers || [];
    const eligibleSoldiers = soldiers.filter(s => (s.level >= 4 || s.experience >= 20) && s.deaths < 3);

    const squads: ArmySquad[] = progress.armySquads || [];
    const eligibleSquads = squads.filter(s => (s.level >= 4 || s.experience >= 20));

    const customHeroCards: CustomHeroCard[] = progress.customHeroCards || [];
    const eligibleHeroCards = customHeroCards.filter(h => h.level >= 50);

    const openDecompressSoldier = (soldier: ToySoldier) => {
        const isMil = soldier.isMilitarySquad || soldier.type === 'військова_шашка_загін';
        const milCount = isMil ? getMilitarySquadDecompressionCount(soldier) : 1;
        setTargetItem({ type: 'soldier', item: soldier });
        setChoiceModalUnit({
            name: soldier.name,
            avatar: soldier.avatar,
            level: soldier.level,
            experience: soldier.experience,
            type: soldier.type,
            gender: soldier.gender,
            livingCount: milCount,
            isMilitarySquad: isMil
        });
    };

    const openDecompressSquad = (squad: ArmySquad) => {
        const alive = squad.soldiersCount ?? 5;
        setTargetItem({ type: 'squad', item: squad });
        setChoiceModalUnit({
            name: squad.name,
            avatar: squad.avatar,
            level: squad.level,
            experience: squad.experience,
            type: squad.type,
            livingCount: alive,
            isSquad: true
        });
    };

    const openDecompressHeroCard = (heroCard: CustomHeroCard) => {
        setTargetItem({ type: 'hero', item: heroCard });
        setChoiceModalUnit({
            name: heroCard.name,
            avatar: heroCard.avatar,
            level: heroCard.level,
            experience: heroCard.experience,
            livingCount: 1
        });
    };

    const handleChoiceConfirm = (choice: { classId: string; gender: CharacterGender; name: string; avatar: string }) => {
        if (!targetItem) return;
        const options: DecompressOptions = {
            chosenClassId: choice.classId,
            chosenGender: choice.gender,
            chosenName: choice.name,
            chosenAvatar: choice.avatar
        };

        if (targetItem.type === 'soldier') {
            executeDecompressSoldier(targetItem.item as ToySoldier, options);
        } else if (targetItem.type === 'squad') {
            executeDecompressSquad(targetItem.item as ArmySquad, options);
        } else if (targetItem.type === 'hero') {
            executeDecompressHeroCard(targetItem.item as CustomHeroCard, options);
        }

        setChoiceModalUnit(null);
        setTargetItem(null);
    };

    const executeDecompressHeroCard = (heroCard: CustomHeroCard, options: DecompressOptions) => {
        setIsDecompressing(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const classId = options.chosenClassId || 'paladin';
            const gender = options.chosenGender || 'male';
            const title = getGenderedCompanionTitle(classId, gender);
            const avatar = options.chosenAvatar || heroCard.avatar || '⚔️';
            const name = options.chosenName || heroCard.name;

            const newCompanion: HiredCompanion = {
                id: `companion_hero_${heroCard.id}_${Date.now()}`,
                name: name,
                title: `${title} (Lvl ${heroCard.level})`,
                avatar: avatar,
                gender: gender,
                companionClassId: classId,
                type: 'champion',
                rank: 1,
                difficulty: 'hard',
                flavorQuote: `Геройська карта Lvl ${heroCard.level}, задекомпресована у величного супутника!`,
                description: `Легендарний боєць, що розпочав свій шлях з картатого пергаменту і досяг рівню ${heroCard.level}.`,
                hp: 140 + heroCard.level * 6,
                baseHp: 140 + heroCard.level * 6,
                armor: 12 + Math.floor(heroCard.level * 0.3),
                powerPoints: 0,
                strength: 18 + Math.floor(heroCard.level * 0.6),
                agility: 15 + Math.floor(heroCard.level * 0.4),
                level: Math.max(1, Math.floor(heroCard.level / 5)),
                xp: 0,
                xpToNextLevel: 100,
                maxAbilityCharges: 3,
                currentAbilityCharges: 3,
                survivalProbability: 95,
                isDead: false,
                rewards: { gold: 50, powerPoints: 20, reputation: 10 }
            };

            const remainingHeroes = customHeroCards.filter(h => h.id !== heroCard.id);
            const remainingRpgCards = (progress.playerRpgCards || []).filter(c => c.heroCardId !== heroCard.id);
            const remainingRpgDeck = (progress.playerRpgDeck || []).filter(c => c.heroCardId !== heroCard.id);
            const currentCompanions = progress.hiredNpcs || [];
            const currentIds = progress.hiredNpcIds || [];

            const updatedProgress: WorldProgress = {
                ...progress,
                customHeroCards: remainingHeroes,
                playerRpgCards: remainingRpgCards,
                playerRpgDeck: remainingRpgDeck,
                hiredNpcs: [...currentCompanions, newCompanion],
                hiredNpcIds: [...currentIds, newCompanion.id]
            };

            playLevelUpSound();
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);

            setIsDecompressing(false);
            setDecompressedSuccess(newCompanion);
            setDecompressedSquadSuccess(null);
            setSelectedSoldier(null);
            timerRef.current = null;
        }, 1200);
    };

    const executeDecompressSoldier = (soldier: ToySoldier, options: DecompressOptions) => {
        setIsDecompressing(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const isMilitary = soldier.isMilitarySquad || soldier.type === 'військова_шашка_загін';
            const remainingSoldiers = soldiers.filter(s => s.id !== soldier.id);
            const currentCompanions = progress.hiredNpcs || [];
            const currentIds = progress.hiredNpcIds || [];

            if (isMilitary) {
                const newCompanions = decompressMilitarySquadToCompanions(soldier, options);
                const updatedProgress: WorldProgress = {
                    ...progress,
                    toySoldiers: remainingSoldiers,
                    hiredNpcs: [...currentCompanions, ...newCompanions],
                    hiredNpcIds: [...currentIds, ...newCompanions.map(c => c.id)]
                };
                playLevelUpSound();
                onUpdateProgress(updatedProgress);
                saveWorldProgress(updatedProgress);
                setIsDecompressing(false);
                setDecompressedSquadSuccess(newCompanions);
                setDecompressedSuccess(null);
            } else {
                const newCompanion = decompressSoldierToCompanion(soldier, options);
                const updatedProgress: WorldProgress = {
                    ...progress,
                    toySoldiers: remainingSoldiers,
                    hiredNpcs: [...currentCompanions, newCompanion],
                    hiredNpcIds: [...currentIds, newCompanion.id]
                };
                playLevelUpSound();
                onUpdateProgress(updatedProgress);
                saveWorldProgress(updatedProgress);
                setIsDecompressing(false);
                setDecompressedSuccess(newCompanion);
                setDecompressedSquadSuccess(null);
            }

            setSelectedSoldier(null);
            timerRef.current = null;
        }, 1200);
    };

    const executeDecompressSquad = (squad: ArmySquad, options: DecompressOptions) => {
        setIsDecompressing(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const newCompanions = decompressSquadToCompanions(squad, options);
            const remainingSquads = squads.filter(s => s.id !== squad.id);
            const currentCompanions = progress.hiredNpcs || [];
            const currentIds = progress.hiredNpcIds || [];

            const updatedProgress: WorldProgress = {
                ...progress,
                armySquads: remainingSquads,
                hiredNpcs: [...currentCompanions, ...newCompanions],
                hiredNpcIds: [...currentIds, ...newCompanions.map(c => c.id)]
            };

            playLevelUpSound();
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);

            setIsDecompressing(false);
            setDecompressedSquadSuccess(newCompanions);
            setDecompressedSuccess(null);
            timerRef.current = null;
        }, 1200);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-[#181124] border-2 border-purple-500/60 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#f5ebd7]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-purple-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-2xl shadow-inner">
                                🔮
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-purple-300 font-serif flex items-center gap-2">
                                    <span>Майстер Декомпресії</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/70 border border-purple-400/40 text-purple-200">
                                        Магічний вівтар
                                    </span>
                                </h2>
                                <p className="text-xs text-purple-300/70">
                                    Перетворення досвідчених олов'яних солдатиків 4-го рівня на справжніх супутників загону
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

                    {/* Ritual dialog / explanation */}
                    <div className="mt-3 p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs leading-relaxed text-purple-200/90 flex items-start gap-2.5">
                        <span className="text-xl">✨</span>
                        <div>
                            <span className="font-bold text-purple-200">Таємне мистецтво: </span>
                            Коли ваш олов'яний солдатик здобуває достатньо тактичного досвіду в боях 15x15 і досягає <span className="font-bold text-amber-300">4-го рівня (40+ XP)</span>, магічний резонатор може зняти мініатюризацію та декомпресувати його в реального повноцінного воїна вашого бойового загону!
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto pr-1 mt-4 space-y-3">
                        {decompressedSquadSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-6 rounded-2xl bg-gradient-to-b from-purple-950/80 to-indigo-950/70 border-2 border-purple-500/80 text-center space-y-4"
                            >
                                <div className="text-5xl animate-bounce">✨👥</div>
                                <div>
                                    <h3 className="text-xl font-black text-yellow-300 font-serif">
                                        Декомпресія Армійського Загону Успішна!
                                    </h3>
                                    <p className="text-sm text-purple-200 mt-1">
                                        Всі {decompressedSquadSuccess.length} живих солдатів загону перетворилися на повноцінних воїнів вашого загону:
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                                    {decompressedSquadSuccess.map((comp, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-black/50 border border-purple-500/40 flex items-center gap-3 text-left">
                                            <div className="text-3xl p-1.5 bg-purple-900/60 rounded-xl border border-purple-400">
                                                {comp.avatar}
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs text-purple-100">{comp.name}</div>
                                                <div className="text-[10px] text-amber-300">{comp.title}</div>
                                                <div className="text-[9px] text-stone-400 mt-0.5">❤️ {comp.hp} HP • 🛡️ {comp.armor} Броні</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setDecompressedSquadSuccess(null)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold rounded-xl text-xs shadow-lg"
                                >
                                    Чудово! Продовжити
                                </button>
                            </motion.div>
                        ) : decompressedSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-6 rounded-2xl bg-gradient-to-b from-purple-950/70 to-indigo-950/60 border-2 border-purple-500/80 text-center space-y-4"
                            >
                                <div className="text-5xl animate-bounce">✨</div>
                                <div>
                                    <h3 className="text-xl font-black text-yellow-300 font-serif">
                                        Декомпресія успішна!
                                    </h3>
                                    <p className="text-sm text-purple-200 mt-1">
                                        Солдатик розкрив усю свою велич і став новим компаньйоном вашого загону:
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-black/50 border border-purple-500/40 max-w-sm mx-auto flex items-center gap-4 text-left">
                                    <div className="text-4xl p-2 bg-purple-900/60 rounded-xl border border-purple-400">
                                        {decompressedSuccess.avatar}
                                    </div>
                                    <div>
                                        <div className="font-black text-base text-purple-100">
                                            {decompressedSuccess.name}
                                        </div>
                                        <div className="text-xs text-amber-300 font-bold">
                                            {decompressedSuccess.title}
                                        </div>
                                        <div className="text-[11px] text-stone-300 mt-1 flex gap-2">
                                            <span>❤️ {decompressedSuccess.hp} HP</span>
                                            <span>🛡️ {decompressedSuccess.armor} Броні</span>
                                            <span>⚔️ Рівень {decompressedSuccess.level}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setDecompressedSuccess(null)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                                >
                                    Чудово! Продовжити
                                </button>
                            </motion.div>
                        ) : eligibleSoldiers.length === 0 && eligibleSquads.length === 0 ? (
                            <div className="text-center py-12 text-stone-400 text-xs space-y-3">
                                <div className="text-4xl">🧸🔒</div>
                                <div className="font-bold text-sm text-stone-300">
                                    Немає бійців або загонів 4-го рівня для декомпресії
                                </div>
                                <p className="max-w-md mx-auto text-stone-500 text-[11px] leading-relaxed">
                                    Беріть участь у битвах армій або тактичних іграх солдатиків у тавернах, перемагайте та розвивайте свої загони (20+ XP дають готовність до декомпресії). При декомпресії армійського загону ви отримаєте рівно стільки супутників, скільки солдатів уціліло в загоні!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Eligible Army Squads */}
                                {eligibleSquads.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <Flag className="w-3.5 h-3.5" />
                                            <span>Армійські Загони, готові до декомпресії ({eligibleSquads.length}):</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {eligibleSquads.map((squad) => {
                                                const alive = squad.soldiersCount ?? 5;
                                                return (
                                                    <div
                                                        key={squad.id}
                                                        className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-purple-950/40 border border-amber-500/50 hover:border-amber-400 transition-all flex flex-col justify-between gap-3 shadow-md"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-3xl p-2.5 bg-amber-900/60 rounded-xl border border-amber-500/40">
                                                                {squad.avatar}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm text-amber-100 font-serif">
                                                                    {squad.name}
                                                                </h4>
                                                                <div className="text-[11px] text-amber-300 font-bold">
                                                                    Рівень {squad.level}★ ({squad.experience} XP)
                                                                </div>
                                                                <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                                                                    Живих солдатів: {alive}/5 → Отримаєте {alive} компаньйонів!
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => openDecompressSquad(squad)}
                                                            disabled={isDecompressing}
                                                            className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                                                                isDecompressing
                                                                    ? 'bg-purple-900 text-purple-400 cursor-wait'
                                                                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-stone-950 active:scale-95'
                                                            }`}
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            <span>{isDecompressing ? 'Здійснюється декомпресія...' : `Декомпресувати (${alive} супутників)`}</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                 {/* Eligible Hero Cards 50+ */}
                                {eligibleHeroCards.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-amber-400" />
                                            <span>🌟 Геройські Карти 50+ рівня, готові до перетворення:</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {eligibleHeroCards.map((hero) => (
                                                <div
                                                    key={hero.id}
                                                    className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/70 hover:border-amber-400 transition-all flex flex-col justify-between gap-3 shadow-lg"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-3xl p-2.5 bg-amber-900/60 rounded-xl border border-amber-400">
                                                            {hero.avatar}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-sm text-amber-200 font-serif">
                                                                {hero.name}
                                                            </h4>
                                                            <div className="text-[11px] text-emerald-400 font-bold">
                                                                Рівень {hero.level} / 99 (Сила: {hero.level})
                                                            </div>
                                                            <div className="text-[10px] text-amber-300/80 mt-0.5">
                                                                Масть {hero.suit} • Перетворення у повноцінного Персонажа
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => openDecompressHeroCard(hero)}
                                                        disabled={isDecompressing}
                                                        className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                                                            isDecompressing
                                                                ? 'bg-amber-900 text-amber-400 cursor-wait'
                                                                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-stone-950 active:scale-95'
                                                        }`}
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        <span>{isDecompressing ? 'Перетворення...' : 'Перетворити на Персонажа-Союзника'}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Eligible Toy Soldiers */}
                                {eligibleSoldiers.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                                            Одиночні солдатики 15х15, готові до перетворення:
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {eligibleSoldiers.map((soldier) => {
                                                const isMil = soldier.isMilitarySquad || soldier.type === 'військова_шашка_загін';
                                                const milCount = isMil ? getMilitarySquadDecompressionCount(soldier) : 1;

                                                return (
                                                    <div
                                                        key={soldier.id}
                                                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-md ${
                                                            isMil 
                                                                ? 'bg-gradient-to-br from-amber-950/40 to-teal-950/40 border-amber-500/50 hover:border-amber-400' 
                                                                : 'bg-purple-950/30 border-purple-500/40 hover:border-purple-400'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`text-3xl p-2.5 rounded-xl border ${
                                                                isMil ? 'bg-amber-900/60 border-amber-500/40' : 'bg-purple-900/60 border-purple-500/40'
                                                            }`}>
                                                                {soldier.avatar}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm text-purple-100 font-serif">
                                                                    {soldier.name}
                                                                </h4>
                                                                <div className="text-[11px] text-amber-300 font-bold">
                                                                    Рівень 4 (Досвід: {soldier.experience} XP)
                                                                </div>
                                                                {isMil ? (
                                                                    <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                                                                        Військова шашка ({soldier.soldiersCount ?? 120} бійців) → K = {milCount} союзників!
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-[10px] text-purple-300/70 mt-0.5">
                                                                        Поразок у боях: {soldier.deaths} / 4
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => openDecompressSoldier(soldier)}
                                                            disabled={isDecompressing}
                                                            className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                                                                isDecompressing
                                                                    ? 'bg-purple-900 text-purple-400 cursor-wait'
                                                                    : isMil 
                                                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-stone-950 active:scale-95'
                                                                    : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white active:scale-95'
                                                            }`}
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            <span>
                                                                {isDecompressing 
                                                                    ? 'Здійснюється декомпресія...' 
                                                                    : isMil 
                                                                    ? `Декомпресувати (${milCount} союзників)` 
                                                                    : 'Декомпресувати в компаньйона'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* All figurines XP progress breakdown */}
                        {soldiers.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-purple-900/40 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                        <span>Прогрес досвіду фігурок у колекції ({soldiers.length} шт):</span>
                                    </span>
                                    <span className="text-[10px] text-stone-400">Потрібно 20 XP або 4 рівень</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {soldiers
                                        .sort((a, b) => (b.experience || 0) - (a.experience || 0))
                                        .map(s => {
                                            const exp = s.experience || 0;
                                            const isReady = s.level >= 4 || exp >= 20;

                                            return (
                                                <div 
                                                    key={s.id} 
                                                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                                                        isReady 
                                                            ? 'bg-purple-950/60 border-purple-500/70' 
                                                            : 'bg-black/40 border-stone-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-xl shrink-0">{s.avatar || '🧸'}</span>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-stone-200 truncate text-[11px]">{s.name}</div>
                                                            <div className="text-[9px] text-stone-400 capitalize">
                                                                {s.type.replace('_', ' ')} • Рівень {s.level}★
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0 w-24">
                                                        <div className="font-extrabold text-[10px] text-amber-300">
                                                            ⭐ {exp} / 20 XP
                                                        </div>
                                                        <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden border border-stone-800 mt-0.5">
                                                            <div
                                                                className={`h-full ${isReady ? 'bg-amber-400' : 'bg-purple-500'}`}
                                                                style={{ width: `${Math.min(100, (exp / 20) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-[8px] font-bold ${isReady ? 'text-amber-300' : 'text-stone-400'}`}>
                                                            {isReady ? 'Готовий!' : `ще ${Math.max(0, 20 - exp)} XP`}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-purple-900/50 flex justify-between items-center text-xs">
                        <span className="text-purple-300/60 text-[11px]">
                            Декомпресований компаньйон назавжди стає членом вашого загону найманців.
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-200 rounded-xl font-bold border border-purple-800"
                        >
                            Закрити
                        </button>
                    </div>
                </motion.div>

                {/* Class & Gender Choice Modal */}
                <DecompressChoiceModal
                    isOpen={!!choiceModalUnit}
                    onClose={() => {
                        setChoiceModalUnit(null);
                        setTargetItem(null);
                    }}
                    unit={choiceModalUnit}
                    onConfirm={handleChoiceConfirm}
                />
            </div>
        </AnimatePresence>
    );
}

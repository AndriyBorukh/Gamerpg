import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToySoldier, ArmySquad, WorldProgress, CharacterGender } from '../types';
import { 
    getSoldierMaxHp, 
    getSoldierAttackBonus, 
    getSoldierDefenseBonus,
    decompressSquadToCompanions,
    createStarterArmy16Squads,
    getCheckersSquadMaxHp,
    getCheckersSquadMaxSoldiers,
    decompressCheckersSquadToCompanions,
    decompressMilitarySquadToCompanions,
    getMilitarySquadReplenishCost,
    getMilitarySquadDecompressionCount,
    DecompressOptions
} from '../lib/toySoldiersData';
import { DecompressChoiceModal, DecompressUnitInfo } from './DecompressChoiceModal';
import { ToySoldierFigurine } from './ToySoldierFigurine';
import { playGoldSound, playLevelUpSound } from '../lib/soundEffects';
import { saveWorldProgress } from '../lib/worldData';
import { 
    X, 
    Coins, 
    Shield, 
    Sword, 
    Heart, 
    Sparkles, 
    Info, 
    Trash2, 
    Wrench, 
    Award,
    Filter,
    Layers,
    Gift,
    Zap,
    AlertTriangle,
    Flag,
    Users,
    Swords,
    CheckCircle2,
    Plus
} from 'lucide-react';

interface ToyCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onOpenDecompressionMaster?: () => void;
    onOpenToyShop?: () => void;
}

export type GameCategoryTab = 'all' | 'pawns' | 'checkers' | 'army_checkers' | 'soldiers' | 'magic_pawns' | 'armies';

export function ToyCollectionModal({
    isOpen,
    onClose,
    progress,
    onUpdateProgress,
    onOpenDecompressionMaster,
    onOpenToyShop
}: ToyCollectionModalProps) {
    const [activeTab, setActiveTab] = useState<GameCategoryTab>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'broken'>('all');
    const [sortBy, setSortBy] = useState<'experience' | 'level' | 'name' | 'deaths'>('experience');
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [choiceModalUnit, setChoiceModalUnit] = useState<DecompressUnitInfo | null>(null);
    const [targetItem, setTargetItem] = useState<{
        type: 'checkers_squad' | 'army_squad';
        item: ToySoldier | ArmySquad;
    } | null>(null);

    if (!isOpen) return null;

    const allSoldiers: ToySoldier[] = progress.toySoldiers || [];
    const armySquads: ArmySquad[] = progress.armySquads || [];

    const showNotification = (msg: string) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(null), 3000);
    };

    // Filter by game tab category for figurines
    const filterByTab = (soldiers: ToySoldier[], tab: GameCategoryTab) => {
        switch (tab) {
            case 'pawns':
                return soldiers.filter(s => s.type === 'пішак');
            case 'checkers':
                return soldiers.filter(s => s.type === 'шашка' && !s.isCheckersSquad);
            case 'army_checkers':
                return soldiers.filter(s => s.isCheckersSquad || s.type === 'шашка_загін' || s.isMilitarySquad || s.type === 'військова_шашка_загін');
            case 'magic_pawns':
                return soldiers.filter(s => s.type === 'магічний_пішак');
            case 'soldiers':
                return soldiers.filter(s => ['солдатик', 'піхотинець', 'лучник', 'вершник', 'гармата', 'генерал'].includes(s.type));
            case 'all':
            default:
                return soldiers;
        }
    };

    const categorySoldiers = filterByTab(allSoldiers, activeTab);

    // Filter by health/readiness status for figurines
    const filteredSoldiers = categorySoldiers.filter(s => {
        const maxDeaths = 3;
        const isBroken = (s.deaths || 0) >= maxDeaths;
        if (statusFilter === 'ready') return !isBroken;
        if (statusFilter === 'broken') return isBroken;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'experience') return (b.experience || 0) - (a.experience || 0);
        if (sortBy === 'level') return (b.level || 1) - (a.level || 1);
        if (sortBy === 'deaths') return a.deaths - b.deaths;
        return a.name.localeCompare(b.name);
    });

    // Filter by status for army squads
    const filteredSquads = armySquads.filter(sq => {
        const alive = sq.soldiersCount ?? 5;
        const isWipedOrDamaged = alive < 5 || sq.deaths > 0;
        if (statusFilter === 'ready') return !isWipedOrDamaged;
        if (statusFilter === 'broken') return isWipedOrDamaged;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'experience') return (b.experience || 0) - (a.experience || 0);
        if (sortBy === 'level') return (b.level || 0) - (a.level || 0);
        if (sortBy === 'deaths') return a.deaths - b.deaths;
        return a.name.localeCompare(b.name);
    });

    // Counts for tabs
    const counts = {
        all: allSoldiers.length,
        pawns: filterByTab(allSoldiers, 'pawns').length,
        checkers: filterByTab(allSoldiers, 'checkers').length,
        army_checkers: filterByTab(allSoldiers, 'army_checkers').length,
        soldiers: filterByTab(allSoldiers, 'soldiers').length,
        magic_pawns: filterByTab(allSoldiers, 'magic_pawns').length,
        armies: armySquads.length
    };

    // Repairs a figurine (strictly 1 time per figurine lifetime)
    const handleRepairSoldier = (soldierId: string) => {
        const target = allSoldiers.find(s => s.id === soldierId);
        if (!target) return;

        const timesRepaired = target.repairsCount || 0;
        if (timesRepaired >= 1) {
            showNotification('Цю фігурку вже лагодили 1 раз! Більше ремонтувати не можна (фігурка зносилася назавжди).');
            return;
        }

        const repairCost = Math.max(10, target.level * 15 + 10);

        if (progress.playerGold < repairCost) {
            showNotification('Недостатньо золота для ремонту!');
            return;
        }

        const updated = allSoldiers.map(s => s.id === soldierId ? { 
            ...s, 
            deaths: 0, 
            repairsCount: (s.repairsCount || 0) + 1 
        } : s);
        playGoldSound();
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - repairCost,
            toySoldiers: updated
        };
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`Фігурку «${target.name}» відремонтовано за ${repairCost} золота! (Використано єдиний ремонт 1/1)`);
    };

    // Repairs any figurine using 8 repair parts, bypassing restrictions
    const handleRepairSoldierWithParts = (soldierId: string) => {
        const target = allSoldiers.find(s => s.id === soldierId);
        if (!target) return;

        const currentParts = progress.toyRepairParts || 0;
        if (currentParts < 8) {
            showNotification('Недостатньо ремонтних деталей! Потрібно 8 деталей.');
            return;
        }

        const updated = allSoldiers.map(s => s.id === soldierId ? { 
            ...s, 
            deaths: 0 
        } : s);

        playLevelUpSound();
        const updatedProgress: WorldProgress = {
            ...progress,
            toyRepairParts: currentParts - 8,
            toySoldiers: updated
        };
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`Фігурку «${target.name}» повністю відремонтовано за 8 деталей!`);
    };

    // Disassembles / exchanges a worn-out/damaged figurine for 2 repair parts
    const handleRecycleSoldier = (soldierId: string) => {
        const target = allSoldiers.find(s => s.id === soldierId);
        if (!target) return;

        if ((target.deaths || 0) <= 0) {
            showNotification('Тільки зношені фігурки (з поразками) можна розміняти на ремонтні деталі!');
            return;
        }

        const partsEarned = 2;
        const currentParts = progress.toyRepairParts || 0;
        const updated = allSoldiers.filter(s => s.id !== soldierId);

        playGoldSound();
        const updatedProgress: WorldProgress = {
            ...progress,
            toyRepairParts: currentParts + partsEarned,
            toySoldiers: updated
        };
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`Фігурку «${target.name}» розміняно на ${partsEarned} ремонтні деталі!`);
    };

    // Sells a figurine
    const handleSellSoldier = (soldierId: string) => {
        const target = allSoldiers.find(s => s.id === soldierId);
        if (!target) return;
        const sellValue = Math.max(5, (target.cost || 15) / 2 + target.level * 5);

        const updated = allSoldiers.filter(s => s.id !== soldierId);
        playGoldSound();
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold + sellValue,
            toySoldiers: updated
        };
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`Фігурку «${target.name}» продано за ${sellValue} золота!`);
    };

    // Recruit / add a soldier checker to a Checkers Squad or replenish military squad
    const handleRecruitCheckersSoldier = (soldierId: string) => {
        const target = allSoldiers.find(s => s.id === soldierId);
        if (!target) return;

        const isMilitary = target.isMilitarySquad || target.type === 'військова_шашка_загін';

        if (isMilitary) {
            const cost = getMilitarySquadReplenishCost(target);
            if (cost <= 0) {
                showNotification(`Загін «${target.name}» вже має повний склад бійців (120/120)!`);
                return;
            }
            if (progress.playerGold < cost) {
                showNotification(`Недостатньо золота! Потрібно ${cost} золота для поповнення.`);
                return;
            }
            const updated = allSoldiers.map(s => s.id === soldierId ? {
                ...s,
                soldiersCount: 120,
                soldierHps: Array(120).fill(1)
            } : s);
            playGoldSound();
            const updatedProgress: WorldProgress = {
                ...progress,
                playerGold: progress.playerGold - cost,
                toySoldiers: updated
            };
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification(`✅ Військовий загін «${target.name}» відновлено до 120 бійців за ${cost} монет!`);
            return;
        }

        const maxCapacity = getCheckersSquadMaxSoldiers(target);
        const currentCount = target.soldiersCount ?? (target.soldierHps?.length || 12);

        if (currentCount >= maxCapacity) {
            showNotification(`Загін «${target.name}» вже наповнено до максимуму (${maxCapacity} бійців)!`);
            return;
        }

        if (progress.playerGold < 40) {
            showNotification('Недостатньо золота! Потрібно 40 золота за нового бійця.');
            return;
        }

        if ((target.experience || 0) < 1) {
            showNotification('Недостатньо досвіду у загону! Потрібно мінімум 1 XP.');
            return;
        }

        const maxHpPerSoldier = getCheckersSquadMaxHp(target);
        const newHps = target.soldierHps ? [...target.soldierHps, maxHpPerSoldier] : Array(currentCount + 1).fill(maxHpPerSoldier);

        const updated = allSoldiers.map(s => s.id === soldierId ? {
            ...s,
            experience: Math.max(0, (s.experience || 0) - 1),
            soldiersCount: currentCount + 1,
            soldierHps: newHps
        } : s);

        playGoldSound();
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - 40,
            toySoldiers: updated
        };
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`Загін «${target.name}» поповнено новим бійцем (+1 бієць)! Списано 40 золотих та 1 XP.`);
    };

    // Decompress a Checkers Squad into companions
    const handleDecompressCheckersSquad = (squad: ToySoldier) => {
        const isMilitary = squad.isMilitarySquad || squad.type === 'військова_шашка_загін';
        const count = isMilitary 
            ? getMilitarySquadDecompressionCount(squad) 
            : (squad.soldiersCount ?? (squad.soldierHps?.length || 12));
        setTargetItem({ type: 'checkers_squad', item: squad });
        setChoiceModalUnit({
            name: squad.name,
            avatar: squad.avatar,
            level: squad.level,
            experience: squad.experience,
            type: squad.type,
            gender: squad.gender,
            livingCount: count,
            isMilitarySquad: isMilitary
        });
    };

    // Decompress an Army Squad into real companions
    const handleDecompressSquad = (squad: ArmySquad) => {
        const count = Math.max(1, Math.min(5, squad.soldiersCount));
        setTargetItem({ type: 'army_squad', item: squad });
        setChoiceModalUnit({
            name: squad.name,
            avatar: squad.avatar,
            level: squad.level,
            experience: squad.experience,
            type: squad.type,
            livingCount: count,
            isSquad: true
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

        if (targetItem.type === 'checkers_squad') {
            const squad = targetItem.item as ToySoldier;
            const isMilitary = squad.isMilitarySquad || squad.type === 'військова_шашка_загін';
            const companions = isMilitary 
                ? decompressMilitarySquadToCompanions(squad, options) 
                : decompressCheckersSquadToCompanions(squad, options);
            const remaining = allSoldiers.filter(s => s.id !== squad.id);
            const currentCompanions = progress.hiredNpcs || [];
            const currentIds = progress.hiredNpcIds || [];

            const updatedProgress: WorldProgress = {
                ...progress,
                toySoldiers: remaining,
                hiredNpcs: [...currentCompanions, ...companions],
                hiredNpcIds: [...currentIds, ...companions.map(c => c.id)]
            };

            playLevelUpSound();
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification(`✨ ${isMilitary ? 'Військова шашка' : 'Шашка-Загін'} «${squad.name}» успішно декомпресована у ${companions.length} супутників (${choice.gender === 'female' ? 'Жінка' : 'Чоловік'}, ${choice.classId})!`);
        } else if (targetItem.type === 'army_squad') {
            const squad = targetItem.item as ArmySquad;
            const newCompanions = decompressSquadToCompanions(squad, options);
            const remainingSquads = armySquads.filter(s => s.id !== squad.id);
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
            showNotification(`✨ Загін «${squad.name}» успішно декомпресовано у ${newCompanions.length} повноцінних супутників загону!`);
        }

        setChoiceModalUnit(null);
        setTargetItem(null);
    };

    // Repairs/Replenishes an Army Squad (restores living soldiers to 5 and resets deaths)
    const handleRepairSquad = (squadId: string) => {
        const target = armySquads.find(sq => sq.id === squadId);
        if (!target) return;

        const timesRepaired = target.repairsCount || 0;
        if (timesRepaired >= 1) {
            showNotification('Цей загін вже відновлювали в польовому шпиталі 1 раз! Ліміт відновлення вичерпано.');
            return;
        }

        const repairCost = Math.max(20, target.level * 15 + 20);

        if (progress.playerGold < repairCost) {
            showNotification('Недостатньо золота для поповнення загону!');
            return;
        }

        const updated = armySquads.map(sq => sq.id === squadId ? {
            ...sq,
            soldiersCount: 5,
            deaths: 0,
            repairsCount: (sq.repairsCount || 0) + 1
        } : sq);

        playGoldSound();
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - repairCost,
            armySquads: updated
        };
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`Загін «${target.name}» повністю поповнено до 5/5 бійців за ${repairCost} золота!`);
    };

    // Sells an Army Squad
    const handleSellSquad = (squadId: string) => {
        const target = armySquads.find(sq => sq.id === squadId);
        if (!target) return;

        const sellValue = Math.max(25, Math.floor((target.cost || 100) / 2 + (target.level || 0) * 15));
        const updated = armySquads.filter(sq => sq.id !== squadId);

        playGoldSound();
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold + sellValue,
            armySquads: updated
        };
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`Загін «${target.name}» продано за ${sellValue} золота!`);
    };

    // Acquire starter army if empty
    const handleGetStarterLegion = () => {
        const starter = createStarterArmy16Squads();
        const updatedProgress: WorldProgress = {
            ...progress,
            armySquads: [...armySquads, ...starter]
        };
        playLevelUpSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification('🎖️ Отримано повний королівський легіон з 16 армійських загонів!');
    };

    const totalSoldiersValue = allSoldiers.reduce((acc: number, s: ToySoldier) => acc + Math.max(5, (s.cost || 15) / 2 + s.level * 5), 0);
    const totalSquadsValue = armySquads.reduce((acc: number, sq: ArmySquad) => acc + Math.max(25, Math.floor((sq.cost || 100) / 2 + (sq.level || 0) * 15)), 0);
    const totalCollectionValue = totalSoldiersValue + totalSquadsValue;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 15 }}
                className="relative w-full max-w-5xl bg-[#181115] border-2 border-amber-500/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7] my-auto max-h-[92vh]"
            >
                {/* Header */}
                <div className="bg-[#21171d] border-b border-amber-500/30 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl p-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40">
                            🎎
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black font-serif text-amber-200 flex items-center gap-2">
                                <span>Колекція Іграшок та Армій</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-sans">
                                    Фігурок: {allSoldiers.length} • Загонів армії: {armySquads.length}/16
                                </span>
                            </h2>
                            <p className="text-xs text-amber-400/80">
                                Перегляд, прокачка, досвід (XP) та управління арміями для тактичних тавернських ігор
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Resources */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-stone-800 text-xs font-mono mr-2">
                            <div className="flex items-center gap-1 text-amber-400" title="Ваше золото">
                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-bold">{progress.playerGold}</span>
                            </div>
                            <div className="w-px h-3 bg-stone-800" />
                            <div className="flex items-center gap-1.5 text-amber-200" title="Ремонтні деталі">
                                <span className="text-sm">⚙️</span>
                                <span className="font-bold">{progress.toyRepairParts || 0}</span>
                            </div>
                        </div>

                        {onOpenToyShop && (
                            <button
                                onClick={() => { onClose(); onOpenToyShop(); }}
                                className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                                <span>Магазин фігурок та армій</span>
                            </button>
                        )}
                        {onOpenDecompressionMaster && (
                            <button
                                onClick={() => { onClose(); onOpenDecompressionMaster(); }}
                                className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/50 text-purple-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                <span>Майстер Декомпресії</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Notifications toast */}
                <AnimatePresence>
                    {actionMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 text-center flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>{actionMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs bar (Game Types & Armies) */}
                <div className="bg-[#1c1218] border-b border-stone-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-800">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            activeTab === 'all'
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md'
                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Всі фігурки</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-[10px] text-stone-300">{counts.all}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('pawns')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            activeTab === 'pawns'
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md'
                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <span>♟️</span>
                        <span>Бойові Пішаки</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-[10px] text-stone-300">{counts.pawns}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('checkers')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            activeTab === 'checkers'
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md'
                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <span>🔴</span>
                        <span>Бойові Шашки</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-[10px] text-stone-300">{counts.checkers}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('army_checkers')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            activeTab === 'army_checkers'
                                ? 'bg-red-950/80 border-red-500 text-red-200 shadow-md'
                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <span>⚔️🔴</span>
                        <span>Армійські шашки</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-[10px] text-stone-300">{counts.army_checkers}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('soldiers')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            activeTab === 'soldiers'
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md'
                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <span>⚔️</span>
                        <span>Олов'яні Солдатики</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-[10px] text-stone-300">{counts.soldiers}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('magic_pawns')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            activeTab === 'magic_pawns'
                                ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-md'
                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <span>🧙‍♂️♟️</span>
                        <span>Магічні Пішаки</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-[10px] text-stone-300">{counts.magic_pawns}</span>
                    </button>

                    {/* 🚩 Armies / Squads Tab */}
                    <button
                        onClick={() => setActiveTab('armies')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            activeTab === 'armies'
                                ? 'bg-red-950/90 border-red-500 text-red-200 shadow-lg shadow-red-950/50'
                                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <Flag className="w-3.5 h-3.5 text-red-400" />
                        <span>Армії (Битва 16х16)</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            counts.armies >= 16 
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                                : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                            {counts.armies}/16
                        </span>
                    </button>
                </div>

                {/* Sub-header & status filter + sort */}
                <div className="bg-[#150d12] border-b border-stone-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                        <div className="text-stone-400 flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5 text-amber-400" />
                            <span>Стан:</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                    statusFilter === 'all'
                                        ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                                        : 'bg-stone-900 border-stone-800 text-stone-400'
                                }`}
                            >
                                Всі ({activeTab === 'armies' ? armySquads.length : categorySoldiers.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter('ready')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                    statusFilter === 'ready'
                                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                                        : 'bg-stone-900 border-stone-800 text-stone-400'
                                }`}
                            >
                                Боєздатні ({
                                    activeTab === 'armies'
                                        ? armySquads.filter(sq => (sq.soldiersCount ?? 5) === 5 && sq.deaths === 0).length
                                        : categorySoldiers.filter(s => s.deaths < (s.type === 'пішак' || s.type === 'шашка' ? 3 : 4)).length
                                })
                            </button>
                            <button
                                onClick={() => setStatusFilter('broken')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                    statusFilter === 'broken'
                                        ? 'bg-rose-950 border-rose-500 text-rose-300'
                                        : 'bg-stone-900 border-stone-800 text-stone-400'
                                }`}
                            >
                                {activeTab === 'armies' ? 'Поранені / Втрати' : 'Зламані'} ({
                                    activeTab === 'armies'
                                        ? armySquads.filter(sq => (sq.soldiersCount ?? 5) < 5 || sq.deaths > 0).length
                                        : categorySoldiers.filter(s => s.deaths >= (s.type === 'пішак' || s.type === 'шашка' ? 3 : 4)).length
                                })
                            </button>
                        </div>
                    </div>

                    {/* Sorting selector */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Сортувати:</span>
                        </span>
                        <button
                            onClick={() => setSortBy('experience')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                sortBy === 'experience'
                                    ? 'bg-purple-900/80 border-purple-400 text-purple-200 shadow-sm'
                                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                            }`}
                        >
                            ⭐ За досвідом (XP)
                        </button>
                        <button
                            onClick={() => setSortBy('level')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                sortBy === 'level'
                                    ? 'bg-amber-900/80 border-amber-400 text-amber-200 shadow-sm'
                                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                            }`}
                        >
                            Рівень
                        </button>
                        <button
                            onClick={() => setSortBy('name')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                sortBy === 'name'
                                    ? 'bg-stone-700 border-stone-500 text-white shadow-sm'
                                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                            }`}
                        >
                            Ім'я
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-4 overflow-y-auto max-h-[55vh] flex-1">
                    {/* ARMIES VIEW */}
                    {activeTab === 'armies' ? (
                        <div className="space-y-4">
                            {/* Grand Army Battles Info Banner */}
                            <div className="p-3.5 bg-gradient-to-r from-red-950/60 via-[#26141b] to-amber-950/40 border border-red-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl p-2 bg-red-950 rounded-xl border border-red-500/50">
                                        🚩
                                    </div>
                                    <div>
                                        <div className="font-bold text-amber-200 text-sm flex items-center gap-2">
                                            <span>Армійські Загони для Грандіозної Битви (16 vs 16)</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                armySquads.length >= 16 
                                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' 
                                                    : 'bg-red-950 text-red-300 border border-red-600'
                                            }`}>
                                                {armySquads.length >= 16 ? '✅ Готові до Битви' : `Потрібно ще ${Math.max(0, 16 - armySquads.length)} заг.`}
                                            </span>
                                        </div>
                                        <p className="text-stone-300 text-[11px] mt-0.5">
                                            Кожен загін налічує <strong>5 олов'яних бійців</strong>. Загін отримує <strong>+1 XP</strong> за кожен успішний бій. На <strong>4-му рівні (20 XP)</strong> загін можна декомпресувати у <strong>5 реальних супутників</strong>!
                                        </p>
                                    </div>
                                </div>

                                {armySquads.length < 16 && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        {armySquads.length === 0 && (
                                            <button
                                                onClick={handleGetStarterLegion}
                                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Отримати легіон (16 заг.)</span>
                                            </button>
                                        )}
                                        {onOpenToyShop && (
                                            <button
                                                onClick={() => { onClose(); onOpenToyShop(); }}
                                                className="px-3 py-1.5 rounded-xl bg-amber-600/40 hover:bg-amber-600/60 border border-amber-500/60 text-amber-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                                                <span>Магазин Загонів</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Squads Grid */}
                            {filteredSquads.length === 0 ? (
                                <div className="p-8 text-center bg-[#140b10] border border-stone-800 rounded-2xl flex flex-col items-center justify-center gap-3">
                                    <div className="text-4xl opacity-40">🚩</div>
                                    <p className="text-sm text-stone-400 font-bold">
                                        {armySquads.length === 0 
                                            ? 'У вас ще немає сформованих армійських загонів.' 
                                            : 'За обраним фільтром загонів не знайдено.'}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={handleGetStarterLegion}
                                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span>Отримати стартовий Легіон (16 загонів)</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredSquads.map((squad, idx) => {
                                        const alive = squad.soldiersCount ?? 5;
                                        const exp = squad.experience || 0;
                                        const lvl = squad.level || 0;
                                        const isReadyForDecompression = lvl >= 4 || exp >= 20;
                                        const timesRepaired = squad.repairsCount || 0;
                                        const canRepair = timesRepaired < 1;
                                        const isDamaged = alive < 5 || squad.deaths > 0;
                                        const repairCost = Math.max(20, lvl * 15 + 20);
                                        const sellValue = Math.max(25, Math.floor((squad.cost || 100) / 2 + lvl * 15));

                                        // Movement & special rules by type
                                        const typeDetails: Record<ArmySquad['type'], { move: string; rule: string; color: string }> = {
                                            'піхота': { move: 'Рух 4 кл.', rule: 'Ближній бій • до 5 d6', color: 'text-amber-400' },
                                            'стрільці': { move: 'Рух 4 кл.', rule: 'Дальня атака 1-3 кл. • до 5 d6', color: 'text-emerald-400' },
                                            'щитоносці': { move: 'Рух 4 кл.', rule: 'Захист +1 до найвищого кубика', color: 'text-sky-400' },
                                            'лицарі': { move: 'Рух 6 кл.', rule: 'Атака +1 до найвищого кубика', color: 'text-yellow-400' },
                                            'маги': { move: 'Рух 4 кл.', rule: 'Магічна атака 1-3 кл. (ігнор щитів)', color: 'text-purple-400' },
                                            'вершники': { move: 'Рух 8 кл.', rule: 'Стрімкий фланговий удар', color: 'text-orange-400' }
                                        };

                                        const details = typeDetails[squad.type] || { move: 'Рух 4 кл.', rule: '5 бійців', color: 'text-stone-300' };

                                        return (
                                            <div
                                                key={squad.id || idx}
                                                className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all shadow-md relative ${
                                                    isDamaged && alive === 0
                                                        ? 'bg-[#180c10] border-rose-800/80 opacity-75'
                                                        : isReadyForDecompression
                                                        ? 'bg-gradient-to-b from-[#2e1828] to-[#180e1b] border-purple-400/80 shadow-purple-950/50 hover:border-purple-300'
                                                        : 'bg-gradient-to-b from-[#21141a] to-[#160d13] border-stone-800 hover:border-amber-500/50'
                                                }`}
                                            >
                                                <div>
                                                    {/* Squad Header */}
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="text-2xl p-2 bg-stone-950/80 rounded-xl border border-stone-800 shadow-inner">
                                                                {squad.avatar}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-xs text-amber-200 truncate max-w-[130px]">
                                                                    {squad.name}
                                                                </h4>
                                                                <div className="text-[10px] text-stone-400 flex items-center gap-1.5 capitalize">
                                                                    <span className={details.color}>{squad.type}</span>
                                                                    <span>•</span>
                                                                    <span>{details.move}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-0.5">
                                                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                                                                Рівень {lvl}★
                                                            </span>
                                                            <span className="px-1.5 py-0.2 rounded-md bg-purple-950/80 border border-purple-500/50 text-[9px] font-black text-purple-200 flex items-center gap-0.5">
                                                                <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                                                                <span>{exp} XP</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Living soldiers meter */}
                                                    <div className="bg-black/40 p-2 rounded-xl border border-stone-800/80 mb-2">
                                                        <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                                                            <span className="text-stone-400 flex items-center gap-1">
                                                                <Users className="w-3 h-3 text-amber-400" />
                                                                <span>Живих бійців у загоні:</span>
                                                            </span>
                                                            <span className={alive === 5 ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold'}>
                                                                {alive} / 5 бійців
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-5 gap-1">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <div 
                                                                    key={s}
                                                                    className={`h-2 rounded-md border transition-all ${
                                                                        s <= alive 
                                                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 border-emerald-400/80 shadow-sm' 
                                                                            : 'bg-stone-900 border-stone-800 opacity-40'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="text-[9px] text-stone-400 mt-1 flex items-center justify-between">
                                                            <span>{details.rule}</span>
                                                            <span className="text-amber-300 font-mono">🎲 {alive}d6</span>
                                                        </div>
                                                    </div>

                                                    {/* Dedicated Experience Progress Bar */}
                                                    <div className="mb-2 p-2 bg-purple-950/30 rounded-xl border border-purple-500/30 space-y-1">
                                                        <div className="flex justify-between items-center text-[9px] font-bold">
                                                            <span className="text-purple-300 flex items-center gap-1">
                                                                <Sparkles className="w-2.5 h-2.5 text-yellow-300 animate-pulse" />
                                                                <span>Досвід загону:</span>
                                                            </span>
                                                            <span className="text-amber-300 font-extrabold text-[10px]">
                                                                {exp} / 20 XP
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-purple-800/40">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 transition-all"
                                                                style={{ width: `${Math.min(100, (exp / 20) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center text-[8px]">
                                                            <span className={isReadyForDecompression ? 'text-amber-300 font-bold' : 'text-stone-400'}>
                                                                {isReadyForDecompression 
                                                                    ? '✨ Готовий до декомпресії у 5 супутників!' 
                                                                    : `До декомпресії: ще ${Math.max(0, 20 - exp)} XP`}
                                                            </span>
                                                            <span className="text-purple-300 font-bold">
                                                                {Math.round(Math.min(100, (exp / 20) * 100))}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Durability & Repairs info */}
                                                    <div className="mb-2 space-y-1">
                                                        <div className="flex justify-between text-[9px] font-bold text-stone-400">
                                                            <span>Поразки загону:</span>
                                                            <span className={squad.deaths > 0 ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}>
                                                                {squad.deaths} розгромів
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-[9px] font-bold text-stone-400 pt-0.5">
                                                            <span>Польовий шпиталь:</span>
                                                            <span className={timesRepaired >= 1 ? 'text-rose-400' : 'text-emerald-400'}>
                                                                {timesRepaired} / 1 {timesRepaired >= 1 ? '(Вичерпано ❌)' : '(Доступне поповнення)'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                                                    {isReadyForDecompression && (
                                                        <button
                                                            onClick={() => handleDecompressSquad(squad)}
                                                            className="w-full py-1.5 bg-gradient-to-r from-purple-700 via-indigo-600 to-amber-500 hover:from-purple-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg animate-pulse cursor-pointer"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                                            <span>Декомпресувати у {alive} компаньйони</span>
                                                        </button>
                                                    )}

                                                    <div className="flex items-center gap-1.5">
                                                        {isDamaged ? (
                                                            canRepair ? (
                                                                <button
                                                                    onClick={() => handleRepairSquad(squad.id)}
                                                                    className="flex-1 py-1 px-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-300 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                                                    title={`Поповнити до 5/5 бійців за ${repairCost} зол`}
                                                                >
                                                                    <Wrench className="w-3 h-3 text-emerald-400" />
                                                                    <span>Поповнити ({repairCost} зол)</span>
                                                                </button>
                                                            ) : (
                                                                <div 
                                                                    className="flex-1 py-1 px-2 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 text-[10px] font-bold text-center flex items-center justify-center gap-1"
                                                                    title="Цей загін уже поповнювали 1 раз. Повторне відновлення неможливе."
                                                                >
                                                                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                                                    <span>Шпиталь вичерпано</span>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span className="flex-1 py-1 px-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold text-center">
                                                                ✅ Повний стрій
                                                            </span>
                                                        )}

                                                        <button
                                                            onClick={() => handleSellSquad(squad.id)}
                                                            className="py-1 px-2 rounded-lg bg-stone-900 hover:bg-rose-950 border border-stone-800 hover:border-rose-800 text-stone-400 hover:text-rose-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                                            title={`Продати загін за ${sellValue} зол`}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            <span>+{sellValue} зол</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* FIGURINES VIEW (Pawns, Checkers, Soldiers, Magic Pawns, All) */
                        <div>
                            {/* Repair rules banner */}
                            <div className="mb-3 px-3 py-2 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center gap-2 text-xs text-amber-200">
                                <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>
                                    <strong>Правило майстерні:</strong> Кожну фігурку можна відремонтувати за золото лише <strong>1 раз</strong>. Зношені фігурки (з поразками) можна <strong>розміняти на ремонтні деталі (+2 ⚙️)</strong>. Будь-яку фігурку можна відремонтувати за <strong>8 деталей</strong> (це дозволяє обійти ліміт ремонту за золото!).
                                </span>
                            </div>

                            {filteredSoldiers.length === 0 ? (
                                <div className="p-8 text-center bg-[#140b10] border border-stone-800 rounded-2xl flex flex-col items-center justify-center gap-3">
                                    <div className="text-4xl opacity-40">🎎</div>
                                    <p className="text-sm text-stone-400 font-bold">
                                        {allSoldiers.length === 0 
                                            ? 'Ваша колекція іграшкових фігурок порожня.' 
                                            : 'У цієї категорії немає фігурок за обраним фільтром.'}
                                    </p>
                                    <p className="text-xs text-stone-500 max-w-sm">
                                        Купуйте набори в Магазині Фігурок або вигравайте скомпресовані іграшки в Рулетці Зілля!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {filteredSoldiers.map(soldier => {
                                        const maxDeaths = 3;
                                        const isBroken = (soldier.deaths || 0) >= maxDeaths;
                                        const maxHp = getSoldierMaxHp(soldier);
                                        const atkBonus = getSoldierAttackBonus(soldier);
                                        const defBonus = getSoldierDefenseBonus(soldier);
                                        const timesRepaired = soldier.repairsCount || 0;
                                        const canRepair = timesRepaired < 1;
                                        const repairCost = Math.max(10, soldier.level * 15 + 10);
                                        const sellValue = Math.max(5, (soldier.cost || 15) / 2 + soldier.level * 5);
                                        const exp = soldier.experience || 0;
                                        const isReadyForDecompression = soldier.level >= 4 || exp >= 20;

                                        return (
                                            <div
                                                key={soldier.id}
                                                className={`p-3 rounded-2xl border flex flex-col justify-between transition-all relative ${
                                                    isBroken 
                                                        ? 'bg-[#180d11] border-rose-800/80 opacity-70' 
                                                        : isReadyForDecompression
                                                        ? 'bg-gradient-to-b from-[#2a1727] to-[#180d1a] border-purple-400/70 shadow-lg shadow-purple-950/50 hover:border-purple-300'
                                                        : 'bg-gradient-to-b from-[#21151c] to-[#160d13] border-amber-500/40 hover:border-amber-400'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-0.5 bg-black/40 rounded-xl border border-stone-800 flex items-center justify-center">
                                                                <ToySoldierFigurine type={soldier.type} size="sm" level={soldier.level} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-xs text-amber-200 truncate max-w-[110px]">
                                                                    {soldier.name}
                                                                </h4>
                                                                <span className="text-[10px] text-stone-400 capitalize">
                                                                    {soldier.type.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-0.5">
                                                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                                                                Рівень {soldier.level}★
                                                            </span>
                                                            <span className="px-1.5 py-0.2 rounded-md bg-purple-950/80 border border-purple-500/50 text-[9px] font-black text-purple-200 flex items-center gap-0.5">
                                                                <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                                                                <span>{exp} XP</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Attributes Grid (HP, Attack, Defense, XP) */}
                                                    <div className="grid grid-cols-4 gap-1 bg-black/40 p-2 rounded-xl border border-stone-800/80 text-[10px] font-mono mb-2">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-stone-400 text-[9px]">HP</span>
                                                            <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                                                                <Heart className="w-2.5 h-2.5 text-emerald-400" />
                                                                {maxHp}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-stone-400 text-[9px]">Атака</span>
                                                            <span className="font-bold text-amber-400 flex items-center gap-0.5">
                                                                <Sword className="w-2.5 h-2.5 text-amber-400" />
                                                                +{atkBonus}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-stone-400 text-[9px]">Захист</span>
                                                            <span className="font-bold text-sky-400 flex items-center gap-0.5">
                                                                <Shield className="w-2.5 h-2.5 text-sky-400" />
                                                                +{defBonus}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-center bg-purple-950/50 rounded p-0.5 border border-purple-500/30">
                                                            <span className="text-purple-300 text-[9px] font-bold">XP</span>
                                                            <span className="font-black text-yellow-300 flex items-center gap-0.5">
                                                                ⭐ {exp}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Dedicated Experience Progress Bar */}
                                                    <div className="mb-2 p-2 bg-purple-950/30 rounded-xl border border-purple-500/30 space-y-1">
                                                        <div className="flex justify-between items-center text-[9px] font-bold">
                                                            <span className="text-purple-300 flex items-center gap-1">
                                                                <Sparkles className="w-2.5 h-2.5 text-yellow-300 animate-pulse" />
                                                                <span>Досвід фігурки:</span>
                                                            </span>
                                                            <span className="text-amber-300 font-extrabold text-[10px]">
                                                                {exp} / 20 XP
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-purple-800/40">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 transition-all"
                                                                style={{ width: `${Math.min(100, (exp / 20) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center text-[8px]">
                                                            <span className={isReadyForDecompression ? 'text-amber-300 font-bold' : 'text-stone-400'}>
                                                                {isReadyForDecompression 
                                                                    ? '✨ Готова до декомпресії в воїна!' 
                                                                    : `До 4-го рівня: ще ${Math.max(0, 20 - exp)} XP`}
                                                            </span>
                                                            <span className="text-purple-300 font-bold">
                                                                {Math.round(Math.min(100, (exp / 20) * 100))}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Durability status bar */}
                                                    <div className="mb-2 space-y-1">
                                                        <div className="flex justify-between text-[9px] font-bold text-stone-400">
                                                            <span>Зношеність / Поломки:</span>
                                                            <span className={isBroken ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}>
                                                                {soldier.deaths} / {maxDeaths}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                                                            <div
                                                                className={`h-full ${
                                                                    isBroken ? 'bg-rose-600' : soldier.deaths > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                                                                }`}
                                                                style={{ width: `${Math.min(100, (soldier.deaths / maxDeaths) * 100)}%` }}
                                                            />
                                                        </div>

                                                        <div className="flex justify-between text-[9px] font-bold text-stone-400 pt-0.5">
                                                            <span>Ліміт ремонту:</span>
                                                            <span className={timesRepaired >= 1 ? 'text-rose-400' : 'text-emerald-400'}>
                                                                {timesRepaired} / 1 {timesRepaired >= 1 ? '(Вичерпано ❌)' : '(Доступний 1 раз)'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800/80">
                                                    {(soldier.isCheckersSquad || soldier.type === 'шашка_загін') && (
                                                        <div className="bg-amber-950/30 p-1.5 rounded-xl border border-amber-500/30 space-y-1 mb-1">
                                                            <div className="flex justify-between text-[9px] font-bold text-amber-200">
                                                                <span>🔴 Армійська Шашка-Загін:</span>
                                                                <span>{soldier.soldiersCount ?? 12} / {getCheckersSquadMaxSoldiers(soldier)}</span>
                                                            </div>
                                                            <div className="text-[9px] text-red-300 font-medium">
                                                                *Тільки для Армійських шашок (12 бійців)
                                                            </div>
                                                            <button
                                                                onClick={() => handleRecruitCheckersSoldier(soldier.id)}
                                                                disabled={progress.playerGold < 40 || (soldier.experience || 0) < 1 || (soldier.soldiersCount ?? 12) >= getCheckersSquadMaxSoldiers(soldier)}
                                                                className={`w-full py-1 px-1.5 rounded-lg border text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                                                    progress.playerGold >= 40 && (soldier.experience || 0) >= 1 && (soldier.soldiersCount ?? 12) < getCheckersSquadMaxSoldiers(soldier)
                                                                        ? 'bg-amber-900/90 hover:bg-amber-800 border-amber-400 text-amber-100 shadow-sm'
                                                                        : 'bg-stone-900 border-stone-800 text-stone-500 opacity-60 cursor-not-allowed'
                                                                }`}
                                                                title="Доповнити загін шашкою-бійцем (40 золотих та -1 XP з загону)"
                                                            >
                                                                <Plus className="w-3 h-3 text-amber-400 shrink-0" />
                                                                <span>+1 Боєць (40 зол, -1 XP)</span>
                                                            </button>

                                                            {isReadyForDecompression && (
                                                                <button
                                                                    onClick={() => handleDecompressCheckersSquad(soldier)}
                                                                    className="w-full py-1 px-1.5 rounded-lg bg-gradient-to-r from-purple-700 via-indigo-600 to-amber-500 hover:from-purple-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-lg animate-pulse cursor-pointer"
                                                                >
                                                                    <Sparkles className="w-3 h-3 text-yellow-300" />
                                                                    <span>Декомпресувати у {soldier.soldiersCount ?? 12} союзників</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {(soldier.isMilitarySquad || soldier.type === 'військова_шашка_загін') && (
                                                        <div className="bg-emerald-950/30 p-1.5 rounded-xl border border-emerald-500/30 space-y-1 mb-1">
                                                            <div className="flex justify-between text-[9px] font-bold text-emerald-200">
                                                                <span>🪙 Військова Шашка-Загін:</span>
                                                                <span>{soldier.soldiersCount ?? 120} / 120</span>
                                                            </div>
                                                            <div className="text-[9px] text-emerald-400 font-medium">
                                                                *Для Військових шашок (120 бійців-монет)
                                                            </div>
                                                            {(() => {
                                                                const repCost = getMilitarySquadReplenishCost(soldier);
                                                                return repCost > 0 ? (
                                                                    <button
                                                                        onClick={() => handleRecruitCheckersSoldier(soldier.id)}
                                                                        disabled={progress.playerGold < repCost}
                                                                        className={`w-full py-1 px-1.5 rounded-lg border text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                                                            progress.playerGold >= repCost
                                                                                ? 'bg-emerald-900/90 hover:bg-emerald-800 border-emerald-400 text-emerald-100 shadow-sm'
                                                                                : 'bg-stone-900 border-stone-800 text-stone-500 opacity-60 cursor-not-allowed'
                                                                        }`}
                                                                        title={`Поповнити стрій до 120 бійців за ${repCost} зол`}
                                                                    >
                                                                        <Plus className="w-3 h-3 text-emerald-400 shrink-0" />
                                                                        <span>Поповнити до 120 ({repCost} зол)</span>
                                                                    </button>
                                                                ) : (
                                                                    <div className="text-[9px] text-emerald-400 font-bold text-center py-0.5">
                                                                        ✓ Повний стрій (120/120)
                                                                    </div>
                                                                );
                                                            })()}

                                                            {isReadyForDecompression && (
                                                                <button
                                                                    onClick={() => handleDecompressCheckersSquad(soldier)}
                                                                    className="w-full py-1 px-1.5 rounded-lg bg-gradient-to-r from-purple-700 via-indigo-600 to-amber-500 hover:from-purple-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-lg animate-pulse cursor-pointer"
                                                                >
                                                                    <Sparkles className="w-3 h-3 text-yellow-300" />
                                                                    <span>Декомпресувати у {getMilitarySquadDecompressionCount(soldier)} союзників</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {soldier.deaths > 0 && (
                                                        <div className="grid grid-cols-2 gap-1.5">
                                                            {/* Gold Repair */}
                                                            {canRepair ? (
                                                                <button
                                                                    onClick={() => handleRepairSoldier(soldier.id)}
                                                                    className="py-1.5 px-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-300 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                                                    title={`Відремонтувати за ${repairCost} зол (єдиний доступний ремонт 1/1 за золото)`}
                                                                >
                                                                    <Wrench className="w-3 h-3 text-emerald-400 shrink-0" />
                                                                    <span>За золото ({repairCost} з.)</span>
                                                                </button>
                                                            ) : (
                                                                <div 
                                                                    className="py-1.5 px-1.5 rounded-lg bg-rose-950/40 border border-rose-850 text-rose-400 text-[9px] font-bold text-center flex items-center justify-center gap-1"
                                                                    title="Цю фігурку вже ремонтували за золото. Повторний ремонт за золото неможливий."
                                                                >
                                                                    <AlertTriangle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                                                                    <span>Золото вичерпано</span>
                                                                </div>
                                                            )}

                                                            {/* Repair Parts Repair */}
                                                            <button
                                                                onClick={() => handleRepairSoldierWithParts(soldier.id)}
                                                                disabled={(progress.toyRepairParts || 0) < 8}
                                                                className={`py-1.5 px-1.5 rounded-lg border text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                                                    (progress.toyRepairParts || 0) >= 8
                                                                        ? 'bg-amber-950 hover:bg-amber-900 border-amber-500/80 text-amber-200'
                                                                        : 'bg-stone-900 border-stone-800/80 text-stone-500 opacity-60 cursor-not-allowed'
                                                                }`}
                                                                title={(progress.toyRepairParts || 0) >= 8 ? "Відремонтувати за 8 деталей (без ліміту ремонтів!)" : "Потрібно 8 деталей для ремонту"}
                                                            >
                                                                <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
                                                                <span>Деталями (8)</span>
                                                            </button>
                                                        </div>
                                                    )}

                                                    {soldier.deaths > 0 && (
                                                        <button
                                                            onClick={() => handleRecycleSoldier(soldier.id)}
                                                            className="w-full py-1.5 px-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200 text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                            title="Розібрати зношену фігурку на 2 ремонтні деталі"
                                                        >
                                                            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                                                            <span>Розміняти на деталі (+2 ⚙️)</span>
                                                        </button>
                                                    )}

                                                    {soldier.deaths === 0 && (
                                                        <span className="w-full py-1.5 px-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold text-center block">
                                                            ✅ Боєздатна
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={() => handleSellSoldier(soldier.id)}
                                                        className="w-full py-1 px-2 rounded-lg bg-stone-900 hover:bg-rose-950 border border-stone-800 hover:border-rose-800 text-stone-400 hover:text-rose-300 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                                        title={`Продати за ${sellValue} зол`}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        <span>Продати за +{sellValue} зол</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Info & Stats */}
                <div className="bg-[#140b10] border-t border-stone-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-stone-400">
                        <div className="flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-400" />
                            <span>Загальна цінність колекції: <strong className="text-amber-300">{totalCollectionValue} золота</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-purple-400" />
                            <span>Декомпресія у супутників доступна від 4 рівня або 20 XP!</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
                    >
                        Закрити
                    </button>
                </div>

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
            </motion.div>
        </div>
    );
}

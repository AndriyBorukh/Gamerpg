import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorldProgress, WeaponItem, ShieldItem, ArmorItem } from '../types';
import { WEAPONS_CATALOG, SHIELDS_CATALOG, ARMORS_CATALOG, getWeaponById, getShieldById, getArmorById } from '../lib/armoryData';
import { saveWorldProgress } from '../lib/worldData';
import { playGoldSound, playLevelUpSound, playSwordClashSound, playShieldBlockSound } from '../lib/soundEffects';
import { 
    Sword, 
    Shield, 
    Coins, 
    Sparkles, 
    Check, 
    X, 
    Zap, 
    Heart, 
    Flame, 
    ShieldAlert, 
    Award,
    Info,
    Users,
    Crosshair
} from 'lucide-react';

interface ArmoryModalProps {
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onClose: () => void;
    settlementName?: string;
}

export function ArmoryModal({
    progress,
    onUpdateProgress,
    onClose,
    settlementName = 'Міська Зброярня'
}: ArmoryModalProps) {
    const [activeTab, setActiveTab] = useState<'weapons' | 'shields' | 'armors' | 'inventory'>('weapons');
    const [selectedWeapon, setSelectedWeapon] = useState<WeaponItem | null>(WEAPONS_CATALOG[0]);
    const [selectedShield, setSelectedShield] = useState<ShieldItem | null>(SHIELDS_CATALOG[0]);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<string>('player');
    const [weaponSubtypeFilter, setWeaponSubtypeFilter] = useState<string>('all');

    const playerStats = progress.playerStats || {
        level: 0,
        xp: 0,
        xpToNextLevel: 300,
        statPoints: 0,
        baseHp: 100,
        strength: 15,
        agility: 10,
        equippedWeapon: 'wpn_iron_sword',
        equippedRangedWeapon: 'wpn_hunting_bow',
        equippedShield: 'shd_wood_buckler',
        equippedArmor: 'arm_leather',
        inventoryWeapons: ['wpn_iron_sword', 'wpn_hunting_bow'],
        inventoryShields: ['shd_wood_buckler'],
        inventoryArmors: ['arm_leather']
    };

    const ownedWeapons = playerStats.inventoryWeapons || ['wpn_iron_sword'];
    const ownedShields = playerStats.inventoryShields || ['shd_wood_buckler'];
    const ownedArmors = playerStats.inventoryArmors || [playerStats.equippedArmor || 'arm_leather'];

    // Determine currently selected party member
    const selectedCompanion = selectedMemberId !== 'player' 
        ? (progress.hiredNpcs || []).find(c => c.id === selectedMemberId) 
        : null;
    const isSelectedPlayer = selectedMemberId === 'player' || !selectedCompanion;

    const currentMemberName = isSelectedPlayer 
        ? 'Сир Ольгерд' 
        : selectedCompanion?.name || 'Супутник';

    const targetEquippedMeleeId = isSelectedPlayer 
        ? playerStats.equippedWeapon 
        : selectedCompanion?.equippedWeapon;

    const targetEquippedRangedId = isSelectedPlayer 
        ? playerStats.equippedRangedWeapon 
        : selectedCompanion?.equippedRangedWeapon;

    const currentWeapon = getWeaponById(targetEquippedMeleeId) || WEAPONS_CATALOG[0];
    const currentRangedWeapon = getWeaponById(targetEquippedRangedId);
    const currentShield = getShieldById(playerStats.equippedShield) || SHIELDS_CATALOG[0];
    const currentArmor = getArmorById(playerStats.equippedArmor || 'arm_leather') || ARMORS_CATALOG[0];

    const showNotification = (msg: string) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(null), 3000);
    };

    const handleBuyWeapon = (weapon: WeaponItem) => {
        if (progress.playerGold < weapon.cost) {
            showNotification('❌ Недостатньо золота для придбання цієї зброї!');
            return;
        }

        const newGold = progress.playerGold - weapon.cost;
        const newInventory = ownedWeapons.includes(weapon.id) ? ownedWeapons : [...ownedWeapons, weapon.id];

        if (isSelectedPlayer) {
            const updatedStats = {
                ...playerStats,
                inventoryWeapons: newInventory,
                ...(weapon.category === 'ranged' 
                    ? { equippedRangedWeapon: weapon.id } 
                    : { equippedWeapon: weapon.id })
            };
            const updatedProgress: WorldProgress = {
                ...progress,
                playerGold: newGold,
                playerStats: updatedStats
            };
            playGoldSound();
            playSwordClashSound();
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification(`⚔️ Куплено та екіпіровано для Сира Ольгерда: ${weapon.name}!`);
        } else if (selectedCompanion) {
            const updatedStats = {
                ...playerStats,
                inventoryWeapons: newInventory
            };
            const updatedHired = (progress.hiredNpcs || []).map(comp => {
                if (comp.id === selectedCompanion.id) {
                    return {
                        ...comp,
                        ...(weapon.category === 'ranged' 
                            ? { equippedRangedWeapon: weapon.id } 
                            : { equippedWeapon: weapon.id })
                    };
                }
                return comp;
            });
            const updatedProgress: WorldProgress = {
                ...progress,
                playerGold: newGold,
                playerStats: updatedStats,
                hiredNpcs: updatedHired
            };
            playGoldSound();
            playSwordClashSound();
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification(`⚔️ Куплено та екіпіровано для ${selectedCompanion.name}: ${weapon.name}!`);
        }
    };

    const handleEquipWeapon = (weaponId: string) => {
        const weapon = getWeaponById(weaponId);
        if (!weapon) return;

        if (isSelectedPlayer) {
            const updatedStats = {
                ...playerStats,
                ...(weapon.category === 'ranged' 
                    ? { equippedRangedWeapon: weaponId } 
                    : { equippedWeapon: weaponId })
            };
            const updatedProgress: WorldProgress = {
                ...progress,
                playerStats: updatedStats
            };
            playSwordClashSound();
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification(`⚔️ ${weapon.name} екіпіровано для Сира Ольгерда!`);
        } else if (selectedCompanion) {
            const updatedHired = (progress.hiredNpcs || []).map(comp => {
                if (comp.id === selectedCompanion.id) {
                    return {
                        ...comp,
                        ...(weapon.category === 'ranged' 
                            ? { equippedRangedWeapon: weaponId } 
                            : { equippedWeapon: weaponId })
                    };
                }
                return comp;
            });
            const updatedProgress: WorldProgress = {
                ...progress,
                hiredNpcs: updatedHired
            };
            playSwordClashSound();
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification(`⚔️ ${weapon.name} екіпіровано для ${selectedCompanion.name}!`);
        }
    };

    const handleUnequipRangedWeapon = () => {
        if (isSelectedPlayer) {
            const updatedStats = {
                ...playerStats,
                equippedRangedWeapon: undefined
            };
            const updatedProgress: WorldProgress = {
                ...progress,
                playerStats: updatedStats
            };
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification('🏹 Стрілкову зброю знято з Сира Ольгерда.');
        } else if (selectedCompanion) {
            const updatedHired = (progress.hiredNpcs || []).map(comp => {
                if (comp.id === selectedCompanion.id) {
                    return {
                        ...comp,
                        equippedRangedWeapon: undefined
                    };
                }
                return comp;
            });
            const updatedProgress: WorldProgress = {
                ...progress,
                hiredNpcs: updatedHired
            };
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification(`🏹 Стрілкову зброю знято з ${selectedCompanion.name}.`);
        }
    };

    const handleBuyShield = (shield: ShieldItem) => {
        if (progress.playerGold < shield.cost) {
            showNotification('❌ Недостатньо золота для придбання цього щита!');
            return;
        }

        if (ownedShields.includes(shield.id)) {
            handleEquipShield(shield.id);
            return;
        }

        const newGold = progress.playerGold - shield.cost;
        const newInventory = [...ownedShields, shield.id];
        const updatedStats = {
            ...playerStats,
            equippedShield: shield.id,
            inventoryShields: newInventory
        };

        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: newGold,
            playerStats: updatedStats
        };

        playGoldSound();
        playShieldBlockSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`🛡️ Куплено та екіпіровано: ${shield.name}!`);
    };

    const handleEquipShield = (shieldId: string) => {
        const updatedStats = {
            ...playerStats,
            equippedShield: shieldId
        };
        const updatedProgress: WorldProgress = {
            ...progress,
            playerStats: updatedStats
        };
        playShieldBlockSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification('🛡️ Щит успішно екіпіровано!');
    };

    const handleBuyArmor = (armor: ArmorItem) => {
        if (progress.playerGold < armor.cost) {
            showNotification('❌ Недостатньо золота для придбання цього обладунку!');
            return;
        }

        if (ownedArmors.includes(armor.id)) {
            handleEquipArmor(armor.id);
            return;
        }

        const newGold = progress.playerGold - armor.cost;
        const newInventory = [...ownedArmors, armor.id];
        const updatedStats = {
            ...playerStats,
            equippedArmor: armor.id,
            armorModifier: armor.armorModifier,
            inventoryArmors: newInventory
        };

        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: newGold,
            playerStats: updatedStats
        };

        playGoldSound();
        playShieldBlockSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`🦺 Куплено та одягнено: ${armor.name} (Мод. броні: +${armor.armorModifier})!`);
    };

    const handleEquipArmor = (armorId: string) => {
        const armor = getArmorById(armorId);
        const updatedStats = {
            ...playerStats,
            equippedArmor: armorId,
            armorModifier: armor ? armor.armorModifier : 1
        };
        const updatedProgress: WorldProgress = {
            ...progress,
            playerStats: updatedStats
        };
        playShieldBlockSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`🦺 Обладунок одягнено: ${armor?.name || ''} (Мод. броні: +${updatedStats.armorModifier})!`);
    };

    const getRarityBadge = (rarity: string) => {
        switch (rarity) {
            case 'legendary':
                return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black border-yellow-200 font-black';
            case 'epic':
                return 'bg-gradient-to-r from-purple-700 to-indigo-600 text-purple-100 border-purple-400 font-bold';
            case 'rare':
                return 'bg-gradient-to-r from-blue-700 to-cyan-600 text-blue-100 border-blue-400 font-bold';
            case 'uncommon':
                return 'bg-gradient-to-r from-emerald-700 to-green-600 text-emerald-100 border-emerald-400 font-bold';
            default:
                return 'bg-stone-800 text-stone-300 border-stone-600';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="relative w-full max-w-5xl bg-[#171310] border-2 border-[#b8860b] rounded-2xl shadow-[0_0_40px_rgba(184,134,11,0.35)] overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Header */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-[#2a1e14] via-[#3d2b1c] to-[#2a1e14] border-b border-[#b8860b]/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-2xl shadow-lg border border-yellow-300">
                            ⚒️
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-wide font-serif flex items-center gap-2">
                                <span>Королівська Зброярня та Арсенал</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/60 border border-amber-500/40 text-amber-300 font-sans">
                                    {settlementName}
                                </span>
                            </h2>
                            <p className="text-xs text-[#a89988]">
                                Купуйте гострі клинки та міцні щити для турнірів, фехтування та битв з чудовиськами
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#120e0b] border border-amber-500/50 rounded-xl">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="font-black text-amber-300 text-sm">{progress.playerGold}</span>
                            <span className="text-[10px] text-amber-400/70">золота</span>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                <AnimatePresence>
                    {actionMessage && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gradient-to-r from-amber-900/90 via-yellow-950/90 to-amber-900/90 px-4 py-2 border-b border-amber-500/40 text-center text-xs font-bold text-amber-200"
                        >
                            {actionMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Party Member Selector Bar */}
                <div className="px-4 py-2 bg-[#17110c] border-b border-[#3b2d1f] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                        <span className="text-xs font-bold text-stone-400 flex items-center gap-1 shrink-0">
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                            <span>Екіпірувати:</span>
                        </span>

                        {/* Player Hero Button */}
                        <button
                            onClick={() => setSelectedMemberId('player')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                isSelectedPlayer
                                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-yellow-300 shadow font-black scale-105'
                                    : 'bg-stone-900/90 text-stone-300 border-stone-700 hover:border-amber-500/60'
                            }`}
                        >
                            <span>👑</span>
                            <span>Сир Ольгерд (Ви)</span>
                        </button>

                        {/* Companion Buttons */}
                        {(progress.hiredNpcs || []).map((comp) => {
                            const isSelected = selectedMemberId === comp.id;
                            return (
                                <button
                                    key={comp.id}
                                    onClick={() => setSelectedMemberId(comp.id)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-yellow-300 shadow font-black scale-105'
                                            : comp.isDead
                                            ? 'bg-red-950/60 text-red-300 border-red-800/80 hover:border-red-500'
                                            : 'bg-stone-900/90 text-stone-300 border-stone-700 hover:border-amber-500/60'
                                    }`}
                                >
                                    <span>{comp.avatar || '⚔️'}</span>
                                    <span>{comp.name}</span>
                                    {comp.isDead && (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-red-900 border border-red-500 text-red-200 font-black">
                                            💀 ЗАГИБЛИЙ
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="text-[11px] text-stone-400">
                        Обраний боєць: <strong className="text-amber-300">{currentMemberName}</strong>
                    </div>
                </div>

                {/* Equipped Summary Bar */}
                <div className="px-4 py-2.5 bg-[#1f1711] border-b border-[#3b2d1f] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Melee Weapon */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-stone-400">Ближній бій:</span>
                            <span className="px-2 py-0.5 rounded bg-stone-900 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
                                <span>{currentWeapon.icon}</span>
                                <span>{currentWeapon.name}</span>
                                <span className="text-[10px] text-emerald-400 font-mono">(+{currentWeapon.damageBonus} урону)</span>
                                {currentWeapon.range > 1 && (
                                    <span className="text-[10px] text-cyan-300 font-mono">Дальн. {currentWeapon.range} кл.</span>
                                )}
                            </span>
                        </div>

                        {/* Ranged Weapon */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-stone-400">Стрільба:</span>
                            {currentRangedWeapon ? (
                                <span className="px-2 py-0.5 rounded bg-stone-900 border border-orange-500/60 text-orange-300 font-bold flex items-center gap-1.5">
                                    <span>{currentRangedWeapon.icon}</span>
                                    <span>{currentRangedWeapon.name}</span>
                                    <span className="text-[10px] text-emerald-400 font-mono">
                                        (Радіус {currentRangedWeapon.range} кл., +{currentRangedWeapon.damageBonus} урону)
                                    </span>
                                    <button
                                        onClick={handleUnequipRangedWeapon}
                                        title="Зняти стрілкову зброю"
                                        className="text-stone-400 hover:text-red-400 text-xs font-black ml-1 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded bg-red-950/70 border border-red-700 text-red-300 font-bold flex items-center gap-1 text-[11px]">
                                    <span>🚫</span>
                                    <span>Немає (Дальня атака неможлива)</span>
                                </span>
                            )}
                        </div>

                        {/* Shields & Armor (for Player) */}
                        {isSelectedPlayer && (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-stone-400">Щит:</span>
                                    <span className="px-2 py-0.5 rounded bg-stone-900 border border-blue-500/40 text-cyan-300 font-bold flex items-center gap-1">
                                        <span>{currentShield.icon}</span>
                                        <span>{currentShield.name}</span>
                                        <span className="text-[10px] text-emerald-400 font-mono">(+{currentShield.blockBonus} блоку)</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-stone-400">Обладунок:</span>
                                    <span className="px-2 py-0.5 rounded bg-stone-900 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                                        <span>{currentArmor.icon}</span>
                                        <span>{currentArmor.name}</span>
                                        <span className="text-[10px] text-amber-300 font-mono">(Броня: +{currentArmor.armorModifier})</span>
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="text-[11px] text-amber-300/80 font-semibold flex items-center gap-1">
                        <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                        <span>Дальня стрільба [S] у бою вимагає лук, арбалет або пращу!</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 pt-3 flex gap-2 border-b border-[#3b2d1f] bg-[#140f0c] overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('weapons')}
                        className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'weapons'
                                ? 'bg-[#221a13] text-amber-300 border-t-2 border-x border-[#b8860b] shadow-md'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-[#1a130e]'
                        }`}
                    >
                        <Sword className="w-4 h-4 text-amber-400" />
                        <span>Зброя ({WEAPONS_CATALOG.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('shields')}
                        className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'shields'
                                ? 'bg-[#221a13] text-cyan-300 border-t-2 border-x border-cyan-600 shadow-md'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-[#1a130e]'
                        }`}
                    >
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span>Щити ({SHIELDS_CATALOG.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('armors')}
                        className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'armors'
                                ? 'bg-[#221a13] text-emerald-300 border-t-2 border-x border-emerald-500 shadow-md'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-[#1a130e]'
                        }`}
                    >
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        <span>Обладунки ({ARMORS_CATALOG.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'inventory'
                                ? 'bg-[#221a13] text-yellow-300 border-t-2 border-x border-yellow-500 shadow-md'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-[#1a130e]'
                        }`}
                    >
                        <Award className="w-4 h-4 text-yellow-400" />
                        <span>Ваш Інвентар ({ownedWeapons.length + ownedShields.length + ownedArmors.length})</span>
                    </button>
                </div>

                {/* Main Content Body */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#140f0c]">
                    {/* Weapons Tab */}
                    {activeTab === 'weapons' && (
                        <div className="space-y-3">
                            {/* Weapon Subtype Filters */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                                {[
                                    { id: 'all', label: 'Всі види', icon: '🌟' },
                                    { id: 'sword', label: 'Мечі', icon: '⚔️' },
                                    { id: 'axe', label: 'Сокири', icon: '🪓' },
                                    { id: 'mace', label: 'Булави', icon: '🔨' },
                                    { id: 'dagger', label: 'Кинджали', icon: '🗡️' },
                                    { id: 'spear', label: 'Списи', icon: '🔱' },
                                    { id: 'halberd', label: 'Алебарди', icon: '🪓' },
                                    { id: 'staff', label: 'Посохи', icon: '🪄' },
                                    { id: 'ranged_all', label: '🎯 ВСІ СТРІЛКОВІ', icon: '🎯', highlight: true },
                                    { id: 'bow', label: 'Луки 🏹', icon: '🏹' },
                                    { id: 'crossbow', label: 'Арбалети 🎯', icon: '🎯' },
                                    { id: 'sling', label: 'Пращі 🪨', icon: '🪨' },
                                ].map((filter) => {
                                    const isCurrent = weaponSubtypeFilter === filter.id;
                                    return (
                                        <button
                                            key={filter.id}
                                            onClick={() => setWeaponSubtypeFilter(filter.id)}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition shrink-0 cursor-pointer flex items-center gap-1 ${
                                                isCurrent
                                                    ? 'bg-amber-500 text-black border-amber-300 font-black shadow'
                                                    : filter.highlight
                                                    ? 'bg-orange-950/80 text-orange-200 border-orange-600 hover:border-orange-400'
                                                    : 'bg-stone-900/90 text-stone-300 border-stone-700 hover:border-amber-500/50'
                                            }`}
                                        >
                                            <span>{filter.icon}</span>
                                            <span>{filter.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Ranged Requirement Banner */}
                            <div className="p-2.5 bg-gradient-to-r from-amber-950/70 via-stone-900/80 to-stone-900/90 border border-amber-600/40 rounded-xl flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🏹</span>
                                    <div>
                                        <div className="font-bold text-amber-200">
                                            Правило тактичної стрільби Gold Box:
                                        </div>
                                        <div className="text-stone-300 text-[11px]">
                                            Без екіпірованої стрілкової зброї (лука, арбалета чи пращі) дальня атака <strong>[S] СТРІЛЬБА</strong> неможлива. Стрілкова зброя екіпірується паралельно з холодною!
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[11px] text-amber-400 font-bold shrink-0">
                                    Для: {currentMemberName}
                                </div>
                            </div>

                            {/* Weapons Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {WEAPONS_CATALOG.filter((w) => {
                                    if (weaponSubtypeFilter === 'all') return true;
                                    if (weaponSubtypeFilter === 'ranged_all') return w.category === 'ranged';
                                    return w.weaponSubtype === weaponSubtypeFilter;
                                }).map((weapon) => {
                                    const isOwned = ownedWeapons.includes(weapon.id);
                                    const isEquipped = weapon.category === 'ranged'
                                        ? targetEquippedRangedId === weapon.id
                                        : targetEquippedMeleeId === weapon.id;
                                    const canAfford = progress.playerGold >= weapon.cost;

                                    return (
                                        <div
                                            key={weapon.id}
                                            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                                                isEquipped
                                                    ? 'bg-[#261f18] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                                                    : isOwned
                                                    ? 'bg-[#1c1612] border-stone-600'
                                                    : 'bg-[#17120e] border-[#382b1f] hover:border-[#6b533a]'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center text-xl">
                                                            {weapon.icon}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm text-[#f5ebd7] leading-tight">
                                                                {weapon.name}
                                                            </h4>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase border ${getRarityBadge(weapon.rarity)}`}>
                                                                    {weapon.rarity}
                                                                </span>
                                                                {weapon.category === 'ranged' ? (
                                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-950 border border-orange-500 text-orange-200 font-bold">
                                                                        🏹 СТРІЛКОВА
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-800 border border-stone-600 text-stone-300 font-bold">
                                                                        ⚔️ ХОЛОДНА
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        {isOwned ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold">
                                                                В арсеналі
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center gap-1 font-black text-amber-400 text-sm">
                                                                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                                                <span>{weapon.cost}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-xs text-stone-300 mb-2.5 italic">
                                                    «{weapon.flavorQuote}»
                                                </p>

                                                {/* Stats List */}
                                                <div className="space-y-1 bg-black/40 p-2 rounded-lg border border-stone-800 text-xs mb-3 font-mono">
                                                    <div className="flex justify-between text-amber-300">
                                                        <span>Шкода від удару:</span>
                                                        <strong className="text-emerald-400 font-bold">+{weapon.damageBonus} урону</strong>
                                                    </div>
                                                    {weapon.range && (
                                                        <div className="flex justify-between text-cyan-300">
                                                            <span>Радіус атаки:</span>
                                                            <strong className="text-cyan-300 font-bold">
                                                                {weapon.range} {weapon.range === 1 ? 'клітинка (впритул)' : 'клітинок (дальній бій)'}
                                                            </strong>
                                                        </div>
                                                    )}
                                                    {weapon.agilityBonus > 0 && (
                                                        <div className="flex justify-between text-cyan-300">
                                                            <span>Бонус до кидка (d20):</span>
                                                            <strong>+{weapon.agilityBonus} влучання</strong>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-purple-300">
                                                        <span>Критичний удар:</span>
                                                        <strong>+{Math.round(weapon.critChanceBonus * 100)}%</strong>
                                                    </div>
                                                    {weapon.specialPerk && (
                                                        <div className="text-[10px] text-yellow-200/90 pt-1 border-t border-stone-800 font-sans">
                                                            ⚡ {weapon.specialPerk}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div>
                                                {isEquipped ? (
                                                    <div className="w-full py-2 bg-amber-500/20 border border-amber-400/60 rounded-xl text-amber-300 font-black text-xs text-center flex items-center justify-center gap-1.5">
                                                        <Check className="w-4 h-4 text-amber-300" />
                                                        <span>Екіпіровано для {currentMemberName}</span>
                                                    </div>
                                                ) : isOwned ? (
                                                    <button
                                                        onClick={() => handleEquipWeapon(weapon.id)}
                                                        className="w-full py-2 bg-[#2d2218] hover:bg-[#423223] border border-amber-500/60 rounded-xl text-amber-200 font-bold text-xs transition cursor-pointer"
                                                    >
                                                        Екіпірувати для {currentMemberName}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBuyWeapon(weapon)}
                                                        disabled={!canAfford}
                                                        className={`w-full py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                                            canAfford
                                                                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black shadow-md'
                                                                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <Coins className="w-3.5 h-3.5" />
                                                        <span>Купити для {currentMemberName} ({weapon.cost} золота)</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Shields Tab */}
                    {activeTab === 'shields' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {SHIELDS_CATALOG.map((shield) => {
                                const isOwned = ownedShields.includes(shield.id);
                                const isEquipped = playerStats.equippedShield === shield.id;
                                const canAfford = progress.playerGold >= shield.cost;

                                return (
                                    <div
                                        key={shield.id}
                                        className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                                            isEquipped
                                                ? 'bg-[#182329] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                                                : isOwned
                                                ? 'bg-[#151c20] border-stone-600'
                                                : 'bg-[#12161a] border-[#222f38] hover:border-[#384e5c]'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-lg bg-stone-900 border border-cyan-800/60 flex items-center justify-center text-xl">
                                                        {shield.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-[#e0f2fe] leading-tight">
                                                            {shield.name}
                                                        </h4>
                                                        <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase border ${getRarityBadge(shield.rarity)}`}>
                                                            {shield.rarity}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    {isOwned ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold">
                                                            Придбано
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-1 font-black text-amber-400 text-sm">
                                                            <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                                            <span>{shield.cost}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-xs text-stone-300 mb-2.5 italic">
                                                «{shield.flavorQuote}»
                                            </p>

                                            {/* Stats List */}
                                            <div className="space-y-1 bg-black/40 p-2 rounded-lg border border-stone-800 text-xs mb-3 font-mono">
                                                <div className="flex justify-between text-cyan-300">
                                                    <span>Бонус до блоку (d20):</span>
                                                    <strong className="text-cyan-400 font-bold">+{shield.blockBonus} захисту</strong>
                                                </div>
                                                <div className="flex justify-between text-emerald-300">
                                                    <span>Поглинання шкоди:</span>
                                                    <strong>-{shield.damageReduction} урону</strong>
                                                </div>
                                                <div className="flex justify-between text-red-300">
                                                    <span>Бонус до здоров'я:</span>
                                                    <strong>+{shield.hpBonus} HP</strong>
                                                </div>
                                                {shield.parryCounterChance > 0 && (
                                                    <div className="flex justify-between text-yellow-300">
                                                        <span>Шанс контратаки:</span>
                                                        <strong>+{Math.round(shield.parryCounterChance * 100)}%</strong>
                                                    </div>
                                                )}
                                                {shield.specialPerk && (
                                                    <div className="text-[10px] text-cyan-200/90 pt-1 border-t border-stone-800 font-sans">
                                                        🛡️ {shield.specialPerk}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div>
                                            {isEquipped ? (
                                                <div className="w-full py-2 bg-cyan-500/20 border border-cyan-400/60 rounded-xl text-cyan-300 font-black text-xs text-center flex items-center justify-center gap-1.5">
                                                    <Check className="w-4 h-4 text-cyan-300" />
                                                    <span>Екіпіровано</span>
                                                </div>
                                            ) : isOwned ? (
                                                <button
                                                    onClick={() => handleEquipShield(shield.id)}
                                                    className="w-full py-2 bg-[#1b262c] hover:bg-[#25353d] border border-cyan-500/60 rounded-xl text-cyan-200 font-bold text-xs transition cursor-pointer"
                                                >
                                                    Екіпірувати
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBuyShield(shield)}
                                                    disabled={!canAfford}
                                                    className={`w-full py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                                        canAfford
                                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black shadow-md'
                                                            : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <Coins className="w-3.5 h-3.5" />
                                                    <span>Купити ({shield.cost} золота)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Armors Tab */}
                    {activeTab === 'armors' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {ARMORS_CATALOG.map((armor) => {
                                const isOwned = ownedArmors.includes(armor.id);
                                const isEquipped = (playerStats.equippedArmor || 'arm_leather') === armor.id;
                                const canAfford = progress.playerGold >= armor.cost;

                                return (
                                    <div
                                        key={armor.id}
                                        className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                                            isEquipped
                                                ? 'bg-[#1b261e] border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.25)]'
                                                : isOwned
                                                ? 'bg-[#152018] border-stone-600'
                                                : 'bg-[#141d16] border-[#223826] hover:border-[#385e3f]'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-lg bg-stone-900 border border-emerald-700/60 flex items-center justify-center text-xl">
                                                        {armor.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-[#f5ebd7] leading-tight">
                                                            {armor.name}
                                                        </h4>
                                                        <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase border ${getRarityBadge(armor.rarity)}`}>
                                                            {armor.rarity}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    {isOwned ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold">
                                                            Придбано
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-1 font-black text-amber-400 text-sm">
                                                            <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                                            <span>{armor.cost}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-xs text-stone-300 mb-2.5 italic">
                                                «{armor.flavorQuote}»
                                            </p>

                                            {/* Stats List */}
                                            <div className="space-y-1 bg-black/40 p-2 rounded-lg border border-stone-800 text-xs mb-3 font-mono">
                                                <div className="flex justify-between text-emerald-300">
                                                    <span>Модифікатор броні:</span>
                                                    <strong className="text-amber-300 font-bold">+{armor.armorModifier} (для джостингу)</strong>
                                                </div>
                                                {armor.hpBonus > 0 && (
                                                    <div className="flex justify-between text-rose-300">
                                                        <span>Бонус до здоров'я:</span>
                                                        <strong>+{armor.hpBonus} HP</strong>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-[11px] text-stone-400 mb-3 leading-relaxed">
                                                {armor.description}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div>
                                            {isEquipped ? (
                                                <div className="w-full py-2 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-inner">
                                                    <Check className="w-4 h-4 text-emerald-400" />
                                                    <span>Одягнено</span>
                                                </div>
                                            ) : isOwned ? (
                                                <button
                                                    onClick={() => handleEquipArmor(armor.id)}
                                                    className="w-full py-2 bg-[#1b2c20] hover:bg-[#253d2d] border border-emerald-500/60 rounded-xl text-emerald-200 font-bold text-xs transition cursor-pointer"
                                                >
                                                    Вдягти обладунок
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBuyArmor(armor)}
                                                    disabled={!canAfford}
                                                    className={`w-full py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                                        canAfford
                                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-md'
                                                            : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <Coins className="w-3.5 h-3.5" />
                                                    <span>Купити ({armor.cost} золота)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Inventory Tab */}
                    {activeTab === 'inventory' && (
                        <div className="space-y-6">
                            {/* Owned Armors */}
                            <div>
                                <h3 className="text-sm font-black text-emerald-300 mb-3 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                                    <span>Ваші обладунки ({ownedArmors.length}):</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {ownedArmors.map((id) => {
                                        const armor = getArmorById(id);
                                        if (!armor) return null;
                                        const isEquipped = (playerStats.equippedArmor || 'arm_leather') === armor.id;

                                        return (
                                            <div
                                                key={armor.id}
                                                className={`p-3 rounded-xl border flex items-center justify-between ${
                                                    isEquipped
                                                        ? 'bg-emerald-950/40 border-emerald-400'
                                                        : 'bg-stone-900/80 border-stone-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="text-2xl">{armor.icon}</div>
                                                    <div>
                                                        <div className="font-bold text-xs text-[#f5ebd7]">{armor.name}</div>
                                                        <div className="text-[10px] text-emerald-400">Мод. броні: +{armor.armorModifier} • +{armor.hpBonus} HP</div>
                                                    </div>
                                                </div>

                                                {isEquipped ? (
                                                    <span className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 rounded-lg font-bold">
                                                        Одягнено
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEquipArmor(armor.id)}
                                                        className="px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-xs text-stone-200 font-bold cursor-pointer"
                                                    >
                                                        Вдягти
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Owned Weapons */}
                            <div>
                                <h3 className="text-sm font-black text-amber-300 mb-3 flex items-center gap-2">
                                    <Sword className="w-4 h-4" />
                                    <span>Ваша зброя ({ownedWeapons.length}):</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {ownedWeapons.map((id) => {
                                        const weapon = getWeaponById(id);
                                        if (!weapon) return null;
                                        const isEquipped = weapon.category === 'ranged'
                                            ? targetEquippedRangedId === weapon.id
                                            : targetEquippedMeleeId === weapon.id;

                                        return (
                                            <div
                                                key={weapon.id}
                                                className={`p-3 rounded-xl border flex items-center justify-between ${
                                                    isEquipped
                                                        ? 'bg-amber-950/40 border-amber-400'
                                                        : 'bg-stone-900/80 border-stone-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="text-2xl">{weapon.icon}</div>
                                                    <div>
                                                        <div className="font-bold text-xs text-[#f5ebd7] flex items-center gap-1">
                                                            <span>{weapon.name}</span>
                                                            {weapon.category === 'ranged' && (
                                                                <span className="text-[9px] px-1 py-0.2 rounded bg-orange-950 text-orange-300 font-bold border border-orange-600">
                                                                    🏹 Дальність {weapon.range}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-emerald-400">+{weapon.damageBonus} урону • +{weapon.agilityBonus} d20</div>
                                                    </div>
                                                </div>

                                                {isEquipped ? (
                                                    <span className="text-[10px] px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/50 rounded-lg font-bold">
                                                        Активно для {currentMemberName}
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEquipWeapon(weapon.id)}
                                                        className="px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-xs text-stone-200 font-bold cursor-pointer"
                                                    >
                                                        Вдягти для {currentMemberName}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Owned Shields */}
                            <div>
                                <h3 className="text-sm font-black text-cyan-300 mb-3 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    <span>Ваші щити ({ownedShields.length}):</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {ownedShields.map((id) => {
                                        const shield = getShieldById(id);
                                        if (!shield) return null;
                                        const isEquipped = playerStats.equippedShield === shield.id;

                                        return (
                                            <div
                                                key={shield.id}
                                                className={`p-3 rounded-xl border flex items-center justify-between ${
                                                    isEquipped
                                                        ? 'bg-cyan-950/40 border-cyan-400'
                                                        : 'bg-stone-900/80 border-stone-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="text-2xl">{shield.icon}</div>
                                                    <div>
                                                        <div className="font-bold text-xs text-[#e0f2fe]">{shield.name}</div>
                                                        <div className="text-[10px] text-cyan-400">+{shield.blockBonus} блоку • -{shield.damageReduction} урону</div>
                                                    </div>
                                                </div>

                                                {isEquipped ? (
                                                    <span className="text-[10px] px-2 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 rounded-lg font-bold">
                                                        Активно
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEquipShield(shield.id)}
                                                        className="px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-xs text-stone-200 font-bold cursor-pointer"
                                                    >
                                                        Вдягти
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-[#120e0b] border-t border-[#3b2d1f] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                        Повернутися
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

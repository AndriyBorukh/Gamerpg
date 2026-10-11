import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToySoldier, WorldProgress, ArmySquad, HiredCompanion, Card, CharacterGender } from '../types';
import { createDeck } from '../lib/gameLogic';
import { 
    TOY_SHOP_CATALOG, 
    ARMY_SQUAD_CATALOG,
    createStarterArmy16Squads,
    decompressSquadToCompanions,
    getSoldierMaxHp, 
    getSoldierAttackBonus, 
    getSoldierDefenseBonus,
    createCheckersSquad,
    createStarterCheckersSquads12,
    createMilitarySquad,
    createStarterMilitarySquads12,
    decompressMilitarySquadToCompanions,
    decompressCheckersSquadToCompanions,
    getMilitarySquadReplenishCost,
    getMilitarySquadPerkLabel,
    getMilitarySquadDecompressionCount,
    DecompressOptions
} from '../lib/toySoldiersData';
import { DecompressChoiceModal, DecompressUnitInfo } from './DecompressChoiceModal';
import { ToySoldierFigurine } from './ToySoldierFigurine';
import { saveWorldProgress } from '../lib/worldData';
import { playGoldSound, playLevelUpSound } from '../lib/soundEffects';
import { 
    ShoppingBag, 
    X, 
    Coins, 
    Shield, 
    Sword, 
    Swords,
    Heart, 
    AlertTriangle, 
    Sparkles, 
    Check, 
    Trash2, 
    Plus, 
    Info,
    Flame,
    Flag,
    Users,
    Crown
} from 'lucide-react';

interface ToyShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onOpenDecompressionMaster?: () => void;
}

export function ToyShopModal({
    isOpen,
    onClose,
    progress,
    onUpdateProgress,
    onOpenDecompressionMaster
}: ToyShopModalProps) {
    const [selectedTab, setSelectedTab] = useState<'shop' | 'checkers_squads' | 'army_squads' | 'my_army'>('shop');
    const [shopCategory, setShopCategory] = useState<'all' | 'checkers_squads' | 'soldiers' | 'tokens' | 'cards'>('all');
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [decompressedCompanions, setDecompressedCompanions] = useState<HiredCompanion[] | null>(null);
    const [choiceModalUnit, setChoiceModalUnit] = useState<DecompressUnitInfo | null>(null);
    const [targetItem, setTargetItem] = useState<{
        type: 'military_squad' | 'checkers_squad' | 'army_squad';
        item: ToySoldier | ArmySquad;
    } | null>(null);

    if (!isOpen) return null;

    const soldiers: ToySoldier[] = progress.toySoldiers || [];
    const armySquads: ArmySquad[] = progress.armySquads || [];
    const checkersSquads = soldiers.filter(s => (s.isCheckersSquad || s.type === 'шашка_загін') && (s.deaths || 0) < 3);
    const militarySquads = soldiers.filter(s => (s.isMilitarySquad || s.type === 'військова_шашка_загін') && (s.deaths || 0) < 3);
    const hasMinSoldiers = soldiers.length >= 5;
    const hasEnoughArmySquads = armySquads.length >= 16;
    const hasLvl4Soldier = soldiers.some(s => s.level >= 4);

    const showNotification = (msg: string) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(null), 3500);
    };

    const handleBuySoldier = (item: typeof TOY_SHOP_CATALOG[0]) => {
        if (progress.playerGold < item.cost) {
            showNotification('Недостатньо золота для купівлі!');
            return;
        }

        if (item.type === 'рпг_карти_40') {
            const extendedDeck = createDeck('extended');
            const shuffled = [...extendedDeck].sort(() => Math.random() - 0.5);
            const newCards: Card[] = shuffled.slice(0, 40).map((c, idx) => ({
                ...c,
                id: Math.floor(Date.now() + Math.random() * 1000000 + idx)
            }));

            const existingRpgCards = progress.playerRpgCards || [];
            const existingRpgDeck = progress.playerRpgDeck || [];

            const updatedProgress: WorldProgress = {
                ...progress,
                playerGold: progress.playerGold - item.cost,
                playerRpgCards: [...existingRpgCards, ...newCards],
                playerRpgDeck: [...existingRpgDeck, ...newCards]
            };

            playGoldSound();
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification('🎴 Успішно отримано 40 випадкових карт для вашої РПГ колоди!');
            return;
        }

        let newItems: ToySoldier[] = [];
        if (item.type === 'шашка_набір') {
            for (let i = 0; i < 12; i++) {
                newItems.push({
                    id: `checker_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
                    name: `Бойова шашка #${i + 1}`,
                    avatar: '🔴',
                    level: 0,
                    experience: 0,
                    deaths: 0,
                    maxHp: 1,
                    type: 'шашка',
                    cost: 15
                });
            }
        } else if (item.type === 'пішак_набір') {
            for (let i = 0; i < 24; i++) {
                newItems.push({
                    id: `pawn_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
                    name: `Бойовий пішак #${i + 1}`,
                    avatar: '♟️',
                    level: 0,
                    experience: 0,
                    deaths: 0,
                    maxHp: 1,
                    type: 'пішак',
                    cost: 10
                });
            }
        } else if (item.type === 'магічний_пішак_набір') {
            for (let i = 0; i < 24; i++) {
                newItems.push({
                    id: `magic_pawn_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
                    name: `Магічний бойовий пішак #${i + 1}`,
                    avatar: '🧙‍♂️♟️',
                    level: 0,
                    experience: 0,
                    deaths: 0,
                    maxHp: 2,
                    type: 'магічний_пішак',
                    cost: 20
                });
            }
        } else if (item.type === 'шашка_загін') {
            newItems.push(createCheckersSquad(item.name, item.avatar, item.cost));
        } else if (item.type === 'шашка_загін_набір') {
            newItems = createStarterCheckersSquads12('Арсенал');
        } else if (item.type === 'військова_шашка_загін') {
            newItems.push(createMilitarySquad(item.name, item.avatar, item.cost));
        } else if (item.type === 'військова_шашка_загін_набір') {
            newItems = createStarterMilitarySquads12('Легіон');
        } else {
            newItems.push({
                id: `toy_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                name: item.name,
                avatar: item.avatar,
                level: 0,
                experience: 0,
                deaths: 0,
                maxHp: item.maxHp || 3,
                type: item.type,
                cost: item.cost
            });
        }

        const updatedSoldiers = [...soldiers, ...newItems];
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - item.cost,
            toySoldiers: updatedSoldiers
        };

        playGoldSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        if (item.type === 'шашка_загін' || item.type === 'шашка_загін_набір') {
            showNotification(`Успішно придбано: ${item.name}! (Призначено для Армійських шашок)`);
        } else if (item.type === 'військова_шашка_загін' || item.type === 'військова_шашка_загін_набір') {
            showNotification(`Успішно придбано: ${item.name}! (120 бійців у загоні для Військових шашок)`);
        } else {
            showNotification(`Успішно придбано: ${item.name}!`);
        }
    };

    const handleReplenishMilitarySquad = (squad: ToySoldier) => {
        const cost = getMilitarySquadReplenishCost(squad);
        if (cost <= 0) {
            showNotification('Загін вже має повний склад бійців (120/120)!');
            return;
        }
        if (progress.playerGold < cost) {
            showNotification(`Недостатньо золота! Потрібно ${cost} монет для поповнення.`);
            return;
        }

        const updatedSoldiers = (progress.toySoldiers || []).map(s => {
            if (s.id === squad.id) {
                return {
                    ...s,
                    soldiersCount: 120,
                    soldierHps: Array(120).fill(1)
                };
            }
            return s;
        });

        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - cost,
            toySoldiers: updatedSoldiers
        };

        playGoldSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`✅ Загін «${squad.name}» повністю відновлено до 120 бійців за ${cost} монет!`);
    };

    const handleReplenishCheckersSquad = (squad: ToySoldier) => {
        const maxSoldiers = 12;
        const currentCount = squad.soldiersCount ?? (squad.soldierHps?.length || 12);
        if (currentCount >= maxSoldiers) {
            showNotification('Загін вже має повний склад (12/12 бійців)!');
            return;
        }
        const missing = maxSoldiers - currentCount;
        const cost = missing * 5;
        if (progress.playerGold < cost) {
            showNotification(`Недостатньо золота! Потрібно ${cost} монет для поповнення.`);
            return;
        }
        const hp = squad.maxHp || 3;
        const updatedSoldiers = (progress.toySoldiers || []).map(s => {
            if (s.id === squad.id) {
                return {
                    ...s,
                    soldiersCount: maxSoldiers,
                    soldierHps: Array(maxSoldiers).fill(hp)
                };
            }
            return s;
        });
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - cost,
            toySoldiers: updatedSoldiers
        };
        playGoldSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`✅ Загін «${squad.name}» поповнено до 12 бійців за ${cost} монет!`);
    };

    const handleDecompressCheckersSquad = (squad: ToySoldier) => {
        if (squad.level < 4) {
            showNotification('Для декомпресії загін повинен досягти 4-го рівня!');
            return;
        }
        const living = squad.soldiersCount ?? (squad.soldierHps?.length || 12);
        setTargetItem({ type: 'checkers_squad', item: squad });
        setChoiceModalUnit({
            name: squad.name,
            avatar: squad.avatar,
            level: squad.level,
            experience: squad.experience,
            type: squad.type,
            gender: squad.gender,
            livingCount: living,
            isCheckersSquad: true
        });
    };

    const handleDecompressMilitarySquad = (squad: ToySoldier) => {
        if (squad.level < 4) {
            showNotification('Для декомпресії загін повинен досягти 4-го рівня!');
            return;
        }

        const decompCount = getMilitarySquadDecompressionCount(squad);
        setTargetItem({ type: 'military_squad', item: squad });
        setChoiceModalUnit({
            name: squad.name,
            avatar: squad.avatar,
            level: squad.level,
            experience: squad.experience,
            type: squad.type,
            gender: squad.gender,
            livingCount: decompCount,
            isMilitarySquad: true
        });
    };

    const handleDecompressSquad = (squad: ArmySquad) => {
        const alive = squad.soldiersCount ?? 5;
        setTargetItem({ type: 'army_squad', item: squad });
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

    const handleChoiceConfirm = (choice: { classId: string; gender: CharacterGender; name: string; avatar: string }) => {
        if (!targetItem) return;
        const options: DecompressOptions = {
            chosenClassId: choice.classId,
            chosenGender: choice.gender,
            chosenName: choice.name,
            chosenAvatar: choice.avatar
        };

        if (targetItem.type === 'military_squad') {
            const squad = targetItem.item as ToySoldier;
            const companions = decompressMilitarySquadToCompanions(squad, options);
            const updatedSoldiers = (progress.toySoldiers || []).filter(s => s.id !== squad.id);
            const currentCompanions = progress.hiredNpcs || [];
            const currentIds = progress.hiredNpcIds || [];

            const updatedProgress: WorldProgress = {
                ...progress,
                toySoldiers: updatedSoldiers,
                hiredNpcs: [...currentCompanions, ...companions],
                hiredNpcIds: [...currentIds, ...companions.map(c => c.id)]
            };

            playLevelUpSound();
            setDecompressedCompanions(companions);
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification(`🎉 Загін «${squad.name}» успішно декомпресовано у ${companions.length} союзників (${choice.gender === 'female' ? 'Жінка' : 'Чоловік'}, ${choice.classId})!`);
        } else if (targetItem.type === 'checkers_squad') {
            const squad = targetItem.item as ToySoldier;
            const companions = decompressCheckersSquadToCompanions(squad, options);
            const updatedSoldiers = (progress.toySoldiers || []).filter(s => s.id !== squad.id);
            const currentCompanions = progress.hiredNpcs || [];
            const currentIds = progress.hiredNpcIds || [];

            const updatedProgress: WorldProgress = {
                ...progress,
                toySoldiers: updatedSoldiers,
                hiredNpcs: [...currentCompanions, ...companions],
                hiredNpcIds: [...currentIds, ...companions.map(c => c.id)]
            };

            playLevelUpSound();
            setDecompressedCompanions(companions);
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            showNotification(`🎉 Армійську шашку-загін «${squad.name}» успішно декомпресовано у ${companions.length} бійців (${choice.gender === 'female' ? 'Жінка' : 'Чоловік'}, ${choice.classId})!`);
        } else if (targetItem.type === 'army_squad') {
            const squad = targetItem.item as ArmySquad;
            const companions = decompressSquadToCompanions(squad, options);
            const remainingSquads = armySquads.filter(s => s.id !== squad.id);
            const currentCompanions = progress.hiredNpcs || [];
            const currentIds = progress.hiredNpcIds || [];

            const updatedProgress: WorldProgress = {
                ...progress,
                armySquads: remainingSquads,
                hiredNpcs: [...currentCompanions, ...companions],
                hiredNpcIds: [...currentIds, ...companions.map(c => c.id)]
            };

            playLevelUpSound();
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            setDecompressedCompanions(companions);
            showNotification(`🎉 Армійський загін «${squad.name}» успішно декомпресовано у ${companions.length} супутників!`);
        }

        setChoiceModalUnit(null);
        setTargetItem(null);
    };

    const handleBuyArmySquad = (item: typeof ARMY_SQUAD_CATALOG[0]) => {
        if (progress.playerGold < item.cost) {
            showNotification('Недостатньо золота для купівлі загону!');
            return;
        }

        const newSquad: ArmySquad = {
            id: `army_squad_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            name: item.name,
            avatar: item.avatar,
            type: item.type,
            soldiersCount: 5,
            maxSoldiers: 5,
            level: 0,
            experience: 0,
            deaths: 0,
            cost: item.cost,
            description: item.description
        };

        const updatedArmy = [...armySquads, newSquad];
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - item.cost,
            armySquads: updatedArmy
        };

        playGoldSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`Придбано загін: ${item.name}! (Маєте ${updatedArmy.length}/16)`);
    };

    const handleBuyFullLegionBox = () => {
        const cost = 1200;
        if (progress.playerGold < cost) {
            showNotification('Недостатньо золота! Потрібно 1200 монет для Королівського Легіону.');
            return;
        }

        const legion = createStarterArmy16Squads();
        const updatedArmy = [...armySquads, ...legion];
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - cost,
            armySquads: updatedArmy
        };

        playGoldSound();
        playLevelUpSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`👑 Вітаємо! Придбано Королівський Легіон з 16 Загонів! (Тепер маєте ${updatedArmy.length})`);
    };

    const handleDismissBrokenSoldier = (soldierId: string) => {
        const updatedSoldiers = soldiers.filter(s => s.id !== soldierId);
        const updatedProgress: WorldProgress = {
            ...progress,
            toySoldiers: updatedSoldiers
        };
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification('Солдатика списано з вашої колекції.');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-[#1a1410] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#f5ebd7]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-amber-900/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-2xl">
                                🧸
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-amber-300 font-serif flex items-center gap-2">
                                    <span>Магазин Іграшок та Солдатиків</span>
                                </h2>
                                <p className="text-xs text-[#a89988]">
                                    Купуйте олов'яних бійців для тактичної гри 15x15 на дошці
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-300 font-bold text-sm">
                                <Coins className="w-4 h-4 text-yellow-400" />
                                <span>{progress.playerGold} Золота</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-full transition-colors border border-stone-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats / Info banner */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#120e0b] border border-stone-800 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-stone-400">Ваша армія солдатиків:</span>
                            <span className={`font-black px-2 py-0.5 rounded-full ${hasMinSoldiers ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                                {soldiers.length} / 5 мінімум для гри
                            </span>
                        </div>

                        {hasLvl4Soldier && onOpenDecompressionMaster && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenDecompressionMaster();
                                }}
                                className="px-3 py-1 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md animate-pulse"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Доступна декомпресія (Рівень 4)!</span>
                            </button>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-2 mt-3 border-b border-stone-800 pb-2">
                        <button
                            onClick={() => setSelectedTab('shop')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                selectedTab === 'shop'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                    : 'text-stone-400 hover:text-stone-200 bg-stone-900/50'
                            }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Магазин Фігурок</span>
                        </button>

                        <button
                            onClick={() => setSelectedTab('checkers_squads')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                selectedTab === 'checkers_squads'
                                    ? 'bg-gradient-to-r from-red-600/30 via-amber-600/30 to-emerald-600/30 text-amber-300 border border-amber-500/50 shadow-sm'
                                    : 'text-stone-400 hover:text-stone-200 bg-stone-900/50'
                            }`}
                        >
                            <Swords className="w-4 h-4 text-red-400" />
                            <span>Шашки-Загони (Армійські & Військові)</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-stone-950 text-[10px] text-amber-300 font-mono border border-stone-800">
                                {checkersSquads.length}/12 • {militarySquads.length}/12
                            </span>
                        </button>

                        <button
                            onClick={() => setSelectedTab('army_squads')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                selectedTab === 'army_squads'
                                    ? 'bg-gradient-to-r from-amber-600/30 to-red-600/30 text-amber-300 border border-amber-500/50 shadow-sm'
                                    : 'text-stone-400 hover:text-stone-200 bg-stone-900/50'
                            }`}
                        >
                            <Flag className="w-4 h-4 text-amber-400" />
                            <span>Загони Битви Армій ({armySquads.length}/16)</span>
                        </button>

                        <button
                            onClick={() => setSelectedTab('my_army')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                selectedTab === 'my_army'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                    : 'text-stone-400 hover:text-stone-200 bg-stone-900/50'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Моя Колекція ({soldiers.length} солд. / {armySquads.length} заг.)</span>
                        </button>
                    </div>

                    {/* Toast Notification */}
                    {actionMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="my-2 p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/50 text-amber-200 text-xs text-center font-bold"
                        >
                            {actionMessage}
                        </motion.div>
                    )}

                    {/* Decompressed Success Celebratory Notice */}
                    {decompressedCompanions && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="my-2 p-4 rounded-2xl bg-gradient-to-b from-purple-950/80 to-indigo-950/70 border-2 border-purple-500/70 text-center space-y-2"
                        >
                            <div className="text-3xl animate-bounce">✨👥</div>
                            <h4 className="text-sm font-black text-yellow-300 font-serif">
                                Декомпресія успішна: Отримано {decompressedCompanions.length} повноцінних супутників!
                            </h4>
                            <p className="text-[11px] text-purple-200">
                                Усі уцілілі солдати загону успішно збільшені та поповнили ряди вашого мандрівного загону!
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 pt-1">
                                {decompressedCompanions.map((comp, idx) => (
                                    <div key={idx} className="p-1.5 rounded-xl bg-purple-900/40 border border-purple-400/40 text-xs flex items-center gap-2 text-stone-200">
                                        <span className="text-base">{comp.avatar}</span>
                                        <div className="text-left">
                                            <div className="font-bold text-amber-300 text-[11px]">{comp.name}</div>
                                            <div className="text-[9px] text-purple-300">{comp.title} • {comp.hp} HP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setDecompressedCompanions(null)}
                                className="mt-1 px-3 py-1 bg-purple-800 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                            >
                                Чудово!
                            </button>
                        </motion.div>
                    )}

                    {/* Content Section */}
                    <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3">
                        {selectedTab === 'shop' ? (
                            <div className="space-y-3">
                                {/* Category Filter Tabs */}
                                <div className="flex flex-wrap gap-1.5 p-2 bg-[#120d09] rounded-xl border border-stone-800 text-xs">
                                    <button
                                        onClick={() => setShopCategory('all')}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                                            shopCategory === 'all'
                                                ? 'bg-amber-500 text-stone-950 shadow'
                                                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60'
                                        }`}
                                    >
                                        Усі товари ({TOY_SHOP_CATALOG.length})
                                    </button>
                                    <button
                                        onClick={() => setShopCategory('checkers_squads')}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                            shopCategory === 'checkers_squads'
                                                ? 'bg-red-600 text-white shadow'
                                                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60'
                                        }`}
                                    >
                                        <span>⚔️ Шашки-Загони (12 та 120)</span>
                                    </button>
                                    <button
                                        onClick={() => setShopCategory('soldiers')}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                            shopCategory === 'soldiers'
                                                ? 'bg-amber-600 text-white shadow'
                                                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60'
                                        }`}
                                    >
                                        <span>♟️ Солдатики 15х15</span>
                                    </button>
                                    <button
                                        onClick={() => setShopCategory('tokens')}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                            shopCategory === 'tokens'
                                                ? 'bg-purple-600 text-white shadow'
                                                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60'
                                        }`}
                                    >
                                        <span>🔴 Шашки та Пішаки</span>
                                    </button>
                                    <button
                                        onClick={() => setShopCategory('cards')}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                            shopCategory === 'cards'
                                                ? 'bg-blue-600 text-white shadow'
                                                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60'
                                        }`}
                                    >
                                        <span>🎴 Карти РПГ</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {TOY_SHOP_CATALOG.filter(item => {
                                        if (shopCategory === 'checkers_squads') {
                                            return item.type === 'шашка_загін' || item.type === 'шашка_загін_набір' || item.type === 'військова_шашка_загін' || item.type === 'військова_шашка_загін_набір';
                                        }
                                        if (shopCategory === 'soldiers') {
                                            return ['піхотинець', 'стрілець', 'щитоносець', 'важкий_лицар', 'гвардієць', 'вершник', 'арбалетник', 'асасин', 'алхімік', 'паладин'].includes(item.type);
                                        }
                                        if (shopCategory === 'tokens') {
                                            return ['шашка', 'шашка_набір', 'пішак', 'пішак_набір', 'магічний_пішак', 'магічний_пішак_набір'].includes(item.type);
                                        }
                                        if (shopCategory === 'cards') {
                                            return item.type === 'рпг_карти_40';
                                        }
                                        return true;
                                    }).map((item, idx) => {
                                        const canAfford = progress.playerGold >= item.cost;
                                        const isMilitarySquad = item.type === 'військова_шашка_загін' || item.type === 'військова_шашка_загін_набір';
                                        const isCheckersSquad = item.type === 'шашка_загін' || item.type === 'шашка_загін_набір';
                                        return (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-md ${
                                                    isMilitarySquad 
                                                        ? 'bg-gradient-to-r from-[#14120a] to-[#0e1610] border-emerald-900/50 hover:border-emerald-500/60'
                                                        : isCheckersSquad
                                                        ? 'bg-gradient-to-r from-[#170a0e] to-[#120a0d] border-red-900/50 hover:border-red-500/60'
                                                        : 'bg-[#140f0c] border-stone-800 hover:border-amber-500/40'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1 bg-stone-900/90 rounded-2xl border border-stone-800 shadow-inner flex items-center justify-center">
                                                        <ToySoldierFigurine type={item.type} size="md" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-[#f5ebd7] font-serif">
                                                            {item.name}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#a89988] mt-0.5">
                                                            <span className="px-1.5 py-0.2 bg-stone-800 rounded text-amber-300 font-mono text-[10px]">
                                                                {item.type}
                                                            </span>
                                                            {isMilitarySquad ? (
                                                                <span className="text-emerald-300 font-bold">🛡️ 120 бійців (монет)</span>
                                                            ) : isCheckersSquad ? (
                                                                <span className="text-red-300 font-bold">🔴 12 бійців • 3 HP</span>
                                                            ) : item.type === 'рпг_карти_40' ? (
                                                                <span className="text-purple-300 font-bold">🎴 40 карт</span>
                                                            ) : (
                                                                <span>❤️ {item.maxHp} HP</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-amber-400/80 mt-1 max-w-[210px] leading-tight">
                                                            {(item as any).description || 'Тактичний олов\'яний боєць'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleBuySoldier(item)}
                                                    disabled={!canAfford}
                                                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer shrink-0 ${
                                                        canAfford
                                                            ? isMilitarySquad
                                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white active:scale-95'
                                                                : isCheckersSquad
                                                                ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 text-white active:scale-95'
                                                                : 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 active:scale-95'
                                                            : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <Coins className="w-3.5 h-3.5" />
                                                    <span>{item.cost} з.</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : selectedTab === 'checkers_squads' ? (
                            <div className="space-y-4">
                                {/* Banner */}
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-stone-900 to-emerald-950/80 border-2 border-amber-500/70 shadow-xl flex flex-wrap items-center justify-between gap-4">
                                    <div className="space-y-1.5 max-w-xl">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">⚔️🛡️</span>
                                            <h4 className="font-black text-amber-200 font-serif text-base">
                                                Арсенал Шашок-Загонів (Армійські 8х8 та Військові 120 бійців)
                                            </h4>
                                        </div>
                                        <p className="text-xs text-stone-300 leading-relaxed">
                                            Тут ви можете придбати повноцінні шашки-загони для участі у великих шашкових війнах у тавернах!
                                            <span className="text-red-300 font-bold"> Армійські шашки (12 бійців)</span> ведуть тактичний бій на англійських шашках, а 
                                            <span className="text-emerald-300 font-bold"> Військові шашки (120 бійців)</span> ведуть масштабну битву монет із контратакою захисника!
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <span className="px-2.5 py-1 rounded-full bg-black/60 border border-red-500/50 text-[11px] text-red-200 font-mono font-bold flex items-center gap-1.5">
                                                <span>🔴 Армійські шашки:</span>
                                                <span className={checkersSquads.length >= 12 ? 'text-emerald-400' : 'text-amber-300'}>
                                                    {checkersSquads.length}/12
                                                </span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full bg-black/60 border border-emerald-500/50 text-[11px] text-emerald-200 font-mono font-bold flex items-center gap-1.5">
                                                <span>🪙 Військові шашки:</span>
                                                <span className={militarySquads.length >= 12 ? 'text-emerald-400' : 'text-amber-300'}>
                                                    {militarySquads.length}/12
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 1: Армійські Шашки-Загони (12 бійців) */}
                                <div className="p-4 rounded-2xl bg-[#140e10] border border-red-900/60 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-2.5 gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-xl bg-red-950/80 border border-red-600/50 text-2xl">
                                                🔴
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-red-300 font-serif">
                                                    Армійські Шашки-Загони (8х8 дошка • 12 бійців у загоні)
                                                </h4>
                                                <p className="text-[11px] text-stone-400">
                                                    Для гри в Армійські та Аранійські армійські шашки. Кожен бій шашок запускає тактичний двобій!
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                                            checkersSquads.length >= 12 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-red-950 text-red-300 border-red-700'
                                        }`}>
                                            {checkersSquads.length}/12 {checkersSquads.length >= 12 ? '✓ Готово до гри' : 'Потрібно для старту'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* 1. Single Army Checkers Squad */}
                                        <div className="p-4 rounded-xl bg-black/50 border border-stone-800 hover:border-red-500/40 transition flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-stone-900 rounded-xl border border-stone-800">
                                                    <ToySoldierFigurine type="шашка_загін" size="md" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-amber-100 font-serif">
                                                        Армійська Шашка-Загін
                                                    </div>
                                                    <div className="text-[11px] text-red-300 font-medium">
                                                        1 загін • 12 бійців • 3 HP кожен
                                                    </div>
                                                    <div className="text-[10px] text-stone-400 mt-0.5">
                                                        Прокачується до 4+ рівня та декомпресується в супутників
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleBuySoldier(TOY_SHOP_CATALOG.find(i => i.type === 'шашка_загін')!)}
                                                disabled={progress.playerGold < 120}
                                                className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                                    progress.playerGold >= 120
                                                        ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 text-white shadow-md active:scale-95'
                                                        : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
                                                }`}
                                            >
                                                <Coins className="w-3.5 h-3.5" />
                                                <span>120 з.</span>
                                            </button>
                                        </div>

                                        {/* 2. Bundle 12 Army Checkers Squads */}
                                        <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-black/60 to-red-950/30 border-2 border-red-500/60 hover:border-red-400 transition flex items-center justify-between gap-3 shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gradient-to-b from-amber-500/20 to-red-500/20 rounded-xl border border-amber-500/50 text-2xl">
                                                    👑
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-amber-200 font-serif flex items-center gap-1.5">
                                                        <span>Королівський Арсенал</span>
                                                        <span className="text-[9px] px-1.5 py-0.2 bg-yellow-400 text-stone-950 font-black rounded uppercase">12 загонів</span>
                                                    </div>
                                                    <div className="text-[11px] text-red-200 font-medium">
                                                        Повний комплект із 12 загонів (144 бійці!)
                                                    </div>
                                                    <div className="text-[10px] text-stone-300 mt-0.5">
                                                        Миттєвий повний комплект для гри на дошці 8х8!
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleBuySoldier(TOY_SHOP_CATALOG.find(i => i.type === 'шашка_загін_набір')!)}
                                                disabled={progress.playerGold < 600}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg ${
                                                    progress.playerGold >= 600
                                                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 text-stone-950 shadow-amber-500/30 active:scale-95'
                                                        : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
                                                }`}
                                            >
                                                <Coins className="w-3.5 h-3.5" />
                                                <span>600 з.</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: Військові Шашки-Загони (120 бійців) */}
                                <div className="p-4 rounded-2xl bg-[#0e1610] border border-emerald-900/60 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-2.5 gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-2xl">
                                                🛡️🪙
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-emerald-300 font-serif">
                                                    Військові Шашки-Загони (8х8 дошка • 120 бійців у загоні)
                                                </h4>
                                                <p className="text-[11px] text-stone-400">
                                                    Для гри у Військові та Аранійські військові шашки. Битва монет N vs M та обов'язкова контратака захисника!
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                                            militarySquads.length >= 12 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-amber-950 text-amber-300 border-amber-700'
                                        }`}>
                                            {militarySquads.length}/12 {militarySquads.length >= 12 ? '✓ Готово до гри' : 'Потрібно для старту'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* 1. Single Military Checkers Squad */}
                                        <div className="p-4 rounded-xl bg-black/50 border border-stone-800 hover:border-emerald-500/40 transition flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-stone-900 rounded-xl border border-stone-800">
                                                    <ToySoldierFigurine type="військова_шашка_загін" size="md" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-emerald-100 font-serif">
                                                        Військова Шашка-Загін
                                                    </div>
                                                    <div className="text-[11px] text-emerald-300 font-medium">
                                                        1 загін • 120 бійців • Кидки монет
                                                    </div>
                                                    <div className="text-[10px] text-stone-400 mt-0.5">
                                                        Перекидання монет на 1-2★, контратака та декомпресія на 4★
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleBuySoldier(TOY_SHOP_CATALOG.find(i => i.type === 'військова_шашка_загін')!)}
                                                disabled={progress.playerGold < 150}
                                                className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                                    progress.playerGold >= 150
                                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-md active:scale-95'
                                                        : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
                                                }`}
                                            >
                                                <Coins className="w-3.5 h-3.5" />
                                                <span>150 з.</span>
                                            </button>
                                        </div>

                                        {/* 2. Bundle 12 Military Checkers Squads */}
                                        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-black/60 to-emerald-950/30 border-2 border-emerald-500/60 hover:border-emerald-400 transition flex items-center justify-between gap-3 shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gradient-to-b from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/50 text-2xl">
                                                    🪙
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-emerald-200 font-serif flex items-center gap-1.5">
                                                        <span>Легіон Військових Шашок</span>
                                                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-400 text-stone-950 font-black rounded uppercase">12 загонів</span>
                                                    </div>
                                                    <div className="text-[11px] text-emerald-200 font-medium">
                                                        Повний легіон з 12 загонів (1440 бійців!)
                                                    </div>
                                                    <div className="text-[10px] text-stone-300 mt-0.5">
                                                        Повна дошка для миттєвої участі у Військових шашках!
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleBuySoldier(TOY_SHOP_CATALOG.find(i => i.type === 'військова_шашка_загін_набір')!)}
                                                disabled={progress.playerGold < 750}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg ${
                                                    progress.playerGold >= 750
                                                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 text-stone-950 shadow-emerald-500/30 active:scale-95'
                                                        : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
                                                }`}
                                            >
                                                <Coins className="w-3.5 h-3.5" />
                                                <span>750 з.</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : selectedTab === 'army_squads' ? (
                            <div className="space-y-4">
                                {/* Legion Banner */}
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-stone-900 to-red-950/60 border-2 border-amber-500/70 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                                    <div className="space-y-1 max-w-md">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">👑</span>
                                            <h4 className="font-black text-amber-300 font-serif text-base">
                                                Королівський Легіон (16 Загонів • 80 Солдатів!)
                                            </h4>
                                        </div>
                                        <p className="text-xs text-stone-300 leading-relaxed">
                                            Повний збалансований комплект з 16 армійських загонів (піхота, лучники, лицарі, вершники, маги, щитоносці).
                                            <span className="text-yellow-400 font-bold"> Рівно 16 загонів для миттєвої участі в Битві Армій!</span>
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleBuyFullLegionBox}
                                        disabled={progress.playerGold < 1200}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg ${
                                            progress.playerGold >= 1200
                                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-stone-950 active:scale-95'
                                                : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                                        }`}
                                    >
                                        <Coins className="w-4 h-4 text-yellow-500" />
                                        <span>Придбати Легіон (1200 з.)</span>
                                    </button>
                                </div>

                                {/* Squad Catalog Grid */}
                                <div className="space-y-2">
                                    <div className="text-xs text-stone-400 font-bold flex justify-between">
                                        <span>Окремі бойові загони (по 5 солдатів у кожному):</span>
                                        <span>У вас є: {armySquads.length} / 16 необхідних</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {ARMY_SQUAD_CATALOG.map((item, idx) => {
                                            const canAfford = progress.playerGold >= item.cost;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-3.5 rounded-2xl bg-[#140f0c] border border-stone-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 shadow-md"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-stone-900 rounded-2xl border border-stone-800 shadow-inner flex items-center justify-center text-2xl">
                                                            {item.avatar}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-xs text-[#f5ebd7] font-serif">
                                                                {item.name}
                                                            </h4>
                                                            <div className="text-[10px] text-amber-400 font-bold mt-0.5">
                                                                5 солдатів у загоні • {item.cost} золота
                                                            </div>
                                                            <div className="text-[10px] text-stone-400 mt-0.5 leading-tight">
                                                                {item.description}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleBuyArmySquad(item)}
                                                        disabled={!canAfford}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-md whitespace-nowrap ${
                                                            canAfford
                                                                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-stone-950 active:scale-95'
                                                                : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <Coins className="w-3 h-3" />
                                                        <span>{item.cost} з.</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Subsection 1: Army Squads */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                                        <div className="flex items-center gap-2">
                                            <Flag className="w-4 h-4 text-amber-400" />
                                            <h4 className="font-bold text-sm text-amber-300 font-serif">
                                                Армійські Загони для Битви Армій ({armySquads.length}/16)
                                            </h4>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                            hasEnoughArmySquads
                                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                                : 'bg-rose-950 text-rose-300 border border-rose-600'
                                        }`}>
                                            {hasEnoughArmySquads ? 'Готові до Битви 16 vs 16' : `Потрібно ще ${16 - armySquads.length} заг.`}
                                        </span>
                                    </div>

                                    {armySquads.length === 0 ? (
                                        <div className="text-center py-6 text-stone-500 text-xs bg-stone-900/30 rounded-xl border border-dashed border-stone-800">
                                            У вас ще немає бойових загонів. Перейдіть на вкладку "Загони Битви Армій", щоб придбати їх або отримати повний легіон!
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {armySquads.map((sq, idx) => {
                                                const isReadyToDecompress = (sq.level >= 4 || sq.experience >= 20);
                                                const alive = sq.soldiersCount ?? 5;
                                                return (
                                                    <div 
                                                        key={sq.id || idx}
                                                        className="p-3.5 rounded-2xl bg-[#140f0c] border border-stone-800 flex flex-col justify-between gap-2.5 shadow-md"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-2xl p-1.5 bg-stone-900 rounded-xl border border-stone-800">
                                                                    {sq.avatar}
                                                                </span>
                                                                <div>
                                                                    <div className="font-bold text-xs text-amber-200">
                                                                        {sq.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-stone-400 capitalize">
                                                                        Тип: {sq.type} • {sq.level}★ рівень ({sq.experience} XP)
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                                                {alive}/5 живих
                                                            </span>
                                                        </div>

                                                        {/* Living soldiers meter */}
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <div 
                                                                    key={s}
                                                                    className={`flex-1 h-1.5 rounded-full ${
                                                                        s <= alive ? 'bg-emerald-500' : 'bg-stone-800'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>

                                                        {isReadyToDecompress && (
                                                            <button
                                                                onClick={() => handleDecompressSquad(sq)}
                                                                className="w-full py-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-md animate-pulse"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                                <span>Декомпресувати у {alive} компаньйони</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Subsection 1.4: Army Checkers Squads (12 бійців) */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">🔴</span>
                                            <h4 className="font-bold text-sm text-red-300 font-serif">
                                                Армійські Шашки-Загони по 12 бійців ({checkersSquads.length}/12)
                                            </h4>
                                        </div>
                                        <span className="text-[10px] text-stone-400">
                                            Для Армійських та Аранійських армійських шашок (8х8)
                                        </span>
                                    </div>

                                    {checkersSquads.length === 0 ? (
                                        <div className="text-center py-4 text-stone-500 text-xs bg-stone-900/30 rounded-xl border border-dashed border-stone-800">
                                            У вас ще немає армійських шашок-загонів. Придбайте їх у вкладці «Шашки-Загони»!
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {checkersSquads.map((cs) => {
                                                const alive = cs.soldiersCount ?? (cs.soldierHps?.length || 12);
                                                const isDamaged = alive < 12;
                                                const repCost = (12 - alive) * 5;
                                                const isLvl4 = cs.level >= 4;

                                                return (
                                                    <div
                                                        key={cs.id}
                                                        className="p-3.5 rounded-2xl bg-[#140e10] border border-stone-800 flex flex-col justify-between gap-2.5 shadow-md"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-2xl p-1.5 bg-stone-900 rounded-xl border border-stone-800">
                                                                    {cs.avatar || '🔴'}
                                                                </span>
                                                                <div>
                                                                    <div className="font-bold text-xs text-red-200">
                                                                        {cs.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-stone-400">
                                                                        Рівень {cs.level}★ ({cs.experience || 0} XP) • {cs.maxHp || 3} HP/боєць
                                                                    </div>
                                                                    <div className="text-[10px] text-amber-300/90 font-medium">
                                                                        {cs.level >= 4 ? '👑 Доступна декомпресія' : `До 4-го рівня: ${Math.max(0, 20 - (cs.experience || 0))} XP`}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                                alive === 12 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-red-950 text-red-300 border-red-800'
                                                            }`}>
                                                                {alive} / 12 бійців
                                                            </span>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex flex-col gap-1.5 pt-1 border-t border-stone-900">
                                                            {isDamaged && (
                                                                <button
                                                                    onClick={() => handleReplenishCheckersSquad(cs)}
                                                                    className="w-full py-1.5 bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer"
                                                                >
                                                                    <Coins className="w-3.5 h-3.5" />
                                                                    <span>Відновити до 12 бійців ({repCost} з.)</span>
                                                                </button>
                                                            )}
                                                            {isLvl4 && (
                                                                <button
                                                                    onClick={() => handleDecompressCheckersSquad(cs)}
                                                                    className="w-full py-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-md animate-pulse cursor-pointer"
                                                                >
                                                                    <Sparkles className="w-3.5 h-3.5" />
                                                                    <span>Декомпресувати у {alive} бійців</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Subsection 1.5: Military Checkers Squads (120 бійців) */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-emerald-400" />
                                            <h4 className="font-bold text-sm text-emerald-300 font-serif">
                                                Військові Шашки-Загони по 120 бійців ({soldiers.filter(s => s.isMilitarySquad || s.type === 'військова_шашка_загін').length}/12)
                                            </h4>
                                        </div>
                                        <span className="text-[10px] text-stone-400">
                                            Для Військових та Аранійських військових шашок
                                        </span>
                                    </div>

                                    {soldiers.filter(s => s.isMilitarySquad || s.type === 'військова_шашка_загін').length === 0 ? (
                                        <div className="text-center py-4 text-stone-500 text-xs bg-stone-900/30 rounded-xl border border-dashed border-stone-800">
                                            У вас ще немає військових шашок-загонів. Придбайте їх у вкладці магазину!
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {soldiers.filter(s => s.isMilitarySquad || s.type === 'військова_шашка_загін').map((ms) => {
                                                const alive = ms.soldiersCount ?? 120;
                                                const repCost = getMilitarySquadReplenishCost(ms);
                                                const isDamaged = alive < 120;
                                                const isLvl4 = ms.level >= 4;
                                                const decompCount = Math.max(1, Math.floor(((alive / 10) / 2)));

                                                return (
                                                    <div
                                                        key={ms.id}
                                                        className="p-3.5 rounded-2xl bg-[#140f0c] border border-stone-800 flex flex-col justify-between gap-2.5 shadow-md"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-2xl p-1.5 bg-stone-900 rounded-xl border border-stone-800">
                                                                    {ms.avatar || '🛡️'}
                                                                </span>
                                                                <div>
                                                                    <div className="font-bold text-xs text-emerald-200">
                                                                        {ms.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-stone-400">
                                                                        Рівень {ms.level}★ ({ms.experience || 0} XP)
                                                                    </div>
                                                                    <div className="text-[10px] text-amber-300/90 font-medium">
                                                                        {getMilitarySquadPerkLabel(ms.level || 0)}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                                alive === 120 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                                                            }`}>
                                                                {alive} / 120 бійців
                                                            </span>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex flex-col gap-1.5 pt-1 border-t border-stone-900">
                                                            {isDamaged && (
                                                                <button
                                                                    onClick={() => handleReplenishMilitarySquad(ms)}
                                                                    className="w-full py-1.5 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer"
                                                                >
                                                                    <Coins className="w-3.5 h-3.5" />
                                                                    <span>Відновити до 120 бійців ({repCost} з.)</span>
                                                                </button>
                                                            )}
                                                            {isLvl4 && (
                                                                <button
                                                                    onClick={() => handleDecompressMilitarySquad(ms)}
                                                                    className="w-full py-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-md animate-pulse cursor-pointer"
                                                                >
                                                                    <Sparkles className="w-3.5 h-3.5" />
                                                                    <span>Декомпресувати у {decompCount} лицарів</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Subsection 2: Toy Soldiers */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                                        <div className="flex items-center gap-2">
                                            <span>💂‍♂️</span>
                                            <h4 className="font-bold text-sm text-stone-300 font-serif">
                                                Олов'яні Солдатики та Шашки для гри 15х15 ({soldiers.filter(s => !s.isCheckersSquad && s.type !== 'шашка_загін' && !s.isMilitarySquad && s.type !== 'військова_шашка_загін').length})
                                            </h4>
                                        </div>
                                    </div>

                                {soldiers.filter(s => !s.isCheckersSquad && s.type !== 'шашка_загін' && !s.isMilitarySquad && s.type !== 'військова_шашка_загін').length === 0 ? (
                                    <div className="text-center py-6 text-stone-500 text-xs">
                                        <div className="text-3xl mb-1">🧸</div>
                                        У вас ще немає одиночних солдатиків для дошки 15х15.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {soldiers.filter(s => !s.isCheckersSquad && s.type !== 'шашка_загін' && !s.isMilitarySquad && s.type !== 'військова_шашка_загін').map((soldier) => {
                                            const maxHp = getSoldierMaxHp(soldier);
                                            const atkBonus = getSoldierAttackBonus(soldier);
                                            const defBonus = getSoldierDefenseBonus(soldier);
                                            const isBroken = soldier.deaths >= 3;

                                            return (
                                                <div
                                                    key={soldier.id}
                                                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                                                        isBroken
                                                            ? 'bg-rose-950/20 border-rose-800/60 opacity-75'
                                                            : soldier.level >= 4
                                                            ? 'bg-purple-950/20 border-purple-500/50'
                                                            : 'bg-[#140f0c] border-stone-800'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1 bg-stone-900 rounded-2xl border border-stone-800 shadow-inner flex items-center justify-center">
                                                                <ToySoldierFigurine type={soldier.type} size="md" level={soldier.level} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm text-[#f5ebd7] font-serif flex items-center gap-1.5">
                                                                    <span>{soldier.name}</span>
                                                                    {soldier.level >= 4 && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900 border border-purple-500 text-purple-300 font-sans">
                                                                            Рівень 4 ★
                                                                        </span>
                                                                    )}
                                                                </h4>
                                                                <div className="text-[11px] text-[#a89988]">
                                                                    Рівень: <span className="text-amber-300 font-bold">{soldier.level}</span> • Досвід: <span className="text-amber-300 font-bold">{soldier.experience} XP</span> (кожні 10 XP = +1 Рівень)
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isBroken && (
                                                            <span className="px-2 py-0.5 rounded bg-rose-900/60 border border-rose-500/60 text-rose-300 text-[10px] font-black">
                                                                Зношений (3/3)
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Bonuses display */}
                                                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-black/40 border border-stone-850 text-[11px] text-center">
                                                        <div>
                                                            <span className="text-stone-400 block text-[10px]">Атака:</span>
                                                            <span className="font-bold text-amber-300">d20 {atkBonus > 0 ? `+${atkBonus}` : ''}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-stone-400 block text-[10px]">Захист:</span>
                                                            <span className="font-bold text-blue-300">d20 {defBonus > 0 ? `+${defBonus}` : ''}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-stone-400 block text-[10px]">Здоров'я:</span>
                                                            <span className="font-bold text-rose-400">{maxHp} HP</span>
                                                        </div>
                                                    </div>

                                                    {/* Durability / Deaths meter */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-stone-400">Зношеність (Поразки в бою):</span>
                                                            <span className={`font-bold ${soldier.deaths >= 3 ? 'text-rose-400' : 'text-stone-300'}`}>
                                                                {soldier.deaths} / 3 {soldier.deaths >= 3 ? '(Зношений 3/3 - не може грати)' : ''}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    soldier.deaths >= 3 ? 'bg-rose-600' : soldier.deaths >= 2 ? 'bg-amber-500' : 'bg-emerald-500'
                                                                }`}
                                                                style={{ width: `${Math.min(100, (soldier.deaths / 3) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-stone-500 italic">
                                                            *Побита фігурка повертається до вас. Зношені фігурки (3/3) не можуть брати участь у грі.
                                                        </p>
                                                    </div>

                                                    {isBroken && (
                                                        <button
                                                            onClick={() => handleDismissBrokenSoldier(soldier.id)}
                                                            className="w-full py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold border border-rose-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Списати зношену фігурку</span>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer note */}
                    <div className="mt-4 pt-3 border-t border-stone-800 flex justify-between items-center text-xs">
                        <span className="text-stone-400 text-[11px]">
                            Правила: 5 солдатиків на дошці 15х15, кожен має 3 HP та 1 зілля. Перемога дає +1 XP непобитим бійцям.
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl font-bold border border-stone-800"
                        >
                            Закрити
                        </button>
                    </div>
                </motion.div>

                {/* Class & Gender Choice Modal for Decompression */}
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

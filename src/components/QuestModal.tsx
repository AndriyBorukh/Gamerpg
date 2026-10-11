import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Scroll, 
    CheckCircle2, 
    Award, 
    Sparkles, 
    MapPin, 
    Trash2, 
    Coins, 
    Compass, 
    PlusCircle, 
    Target, 
    Star, 
    ChevronRight,
    Sword,
    Trophy,
    PackageCheck
} from 'lucide-react';
import { 
    Quest, 
    QuestType, 
    QuestDifficulty, 
    QuestObjective,
    QuestObjectiveType,
    ManualQuestInput, 
    ManualObjectiveInput,
    WorldProgress, 
    SettlementData, 
    TavernData 
} from '../types';
import { 
    createManualQuest, 
    generateNpcQuestsForSettlement, 
    acceptQuest, 
    abandonQuest, 
    claimQuestReward,
    normalizeQuestObjectives,
    setTrackedObjective,
    getRewardsByDifficulty, 
    QUEST_MANUAL_PRESETS 
} from '../lib/questSystem';
import { WORLD_SETTLEMENTS } from '../lib/worldData';

interface QuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    currentSettlement?: SettlementData | null;
    currentTavern?: TavernData | null;
    onTrackTargetOnMap?: (coords: { x: number; y: number }) => void;
}

type TabType = 'active' | 'board' | 'create' | 'completed';

export function QuestModal({
    isOpen,
    onClose,
    progress,
    onUpdateProgress,
    currentSettlement,
    currentTavern,
    onTrackTargetOnMap
}: QuestModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form state for Manual Quest Creation
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formType, setFormType] = useState<QuestType>('monster_hunt');
    const [formDifficulty, setFormDifficulty] = useState<QuestDifficulty>('medium');
    const [formGiverName, setFormGiverName] = useState('Староста Богдан');
    const [formGiverTitle, setFormGiverTitle] = useState('Сільський війт');
    const [formGiverAvatar, setFormGiverAvatar] = useState('🧔');
    const [formTargetSettlementId, setFormTargetSettlementId] = useState('');
    const [formGold, setFormGold] = useState<number>(250);
    const [formXp, setFormXp] = useState<number>(130);
    const [formReputation, setFormReputation] = useState<number>(20);
    const [formCardPieces, setFormCardPieces] = useState<number>(10);
    const [formItemReward, setFormItemReward] = useState('');

    // Dynamic Goals / Objectives List for Manual Quest Creator
    const [formObjectives, setFormObjectives] = useState<ManualObjectiveInput[]>([
        {
            text: 'Знищити загін небезпечних розбійників на карті',
            type: 'kill_monster',
            requiredCount: 1,
            isOptional: false
        },
        {
            text: 'Здобути тріумфальну перемогу в таверні в кулачному бою',
            type: 'win_duel',
            requiredCount: 1,
            isOptional: true,
            bonusGold: 60,
            bonusXp: 35
        }
    ]);

    const activeQuests = progress.activeQuests || [];
    const completedIds = progress.completedQuestIds || [];

    // Fallback settlement for generator
    const effectiveSettlement = currentSettlement || WORLD_SETTLEMENTS[0];

    // Local available NPC quests
    const availableNpcQuests = useMemo(() => {
        if (progress.availableNpcQuests && progress.availableNpcQuests.length > 0) {
            return progress.availableNpcQuests;
        }
        return generateNpcQuestsForSettlement(effectiveSettlement, currentTavern || undefined);
    }, [progress.availableNpcQuests, effectiveSettlement, currentTavern]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    // Apply difficulty preset to gold/xp
    const handleDifficultyChange = (diff: QuestDifficulty) => {
        setFormDifficulty(diff);
        const rew = getRewardsByDifficulty(diff);
        setFormGold(rew.gold);
        setFormXp(rew.xp);
        setFormReputation(rew.reputation);
        setFormCardPieces(rew.cardPieces);
    };

    // Apply quick preset to form
    const applyPreset = (presetInput: ManualQuestInput) => {
        setFormTitle(presetInput.title);
        setFormDescription(presetInput.description);
        setFormType(presetInput.type || 'monster_hunt');
        setFormDifficulty(presetInput.difficulty || 'medium');
        setFormGiverName(presetInput.giverName || 'Мандрівник');
        setFormGiverTitle(presetInput.giverTitle || 'Замовник');
        setFormGiverAvatar(presetInput.giverAvatar || '📜');
        setFormTargetSettlementId(presetInput.targetSettlementId || '');
        if (presetInput.goldReward !== undefined) setFormGold(presetInput.goldReward);
        if (presetInput.xpReward !== undefined) setFormXp(presetInput.xpReward);
        if (presetInput.reputationReward !== undefined) setFormReputation(presetInput.reputationReward);
        if (presetInput.cardPiecesReward !== undefined) setFormCardPieces(presetInput.cardPiecesReward);
        setFormItemReward(presetInput.itemRewardName || '');

        if (presetInput.objectives && presetInput.objectives.length > 0) {
            setFormObjectives(presetInput.objectives.map(o => ({ ...o })));
        } else {
            setFormObjectives([
                {
                    text: presetInput.title,
                    type: 'custom',
                    requiredCount: presetInput.requiredCount || 1,
                    isOptional: false
                }
            ]);
        }
        showToast('Шаблон із цілями успішно завантажено в форму!');
    };

    // Objective management helpers
    const handleAddObjective = () => {
        setFormObjectives(prev => [
            ...prev,
            {
                text: 'Нова додаткова ціль',
                type: 'win_duel',
                requiredCount: 1,
                isOptional: true,
                bonusGold: 50,
                bonusXp: 30
            }
        ]);
    };

    const handleUpdateObjective = (index: number, updates: Partial<ManualObjectiveInput>) => {
        setFormObjectives(prev => prev.map((obj, i) => i === index ? { ...obj, ...updates } : obj));
    };

    const handleRemoveObjective = (index: number) => {
        if (formObjectives.length <= 1) {
            showToast('Квест повинен містити хоча б одну ціль!');
            return;
        }
        setFormObjectives(prev => prev.filter((_, i) => i !== index));
    };

    // Submit manual quest
    const handleCreateManualQuest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim()) {
            showToast('Введіть назву завдання!');
            return;
        }

        const validObjectives = formObjectives.filter(o => o.text.trim().length > 0);
        if (validObjectives.length === 0) {
            showToast('Додайте хоча б одну чітку ціль завдання!');
            return;
        }

        const targetSettlement = WORLD_SETTLEMENTS.find(s => s.id === formTargetSettlementId);

        const newQuest = createManualQuest({
            title: formTitle,
            description: formDescription,
            type: formType,
            difficulty: formDifficulty,
            giverName: formGiverName,
            giverTitle: formGiverTitle,
            giverAvatar: formGiverAvatar,
            giverLocationName: effectiveSettlement.name,
            targetSettlementId: formTargetSettlementId || undefined,
            targetSettlementName: targetSettlement?.name || undefined,
            goldReward: formGold,
            xpReward: formXp,
            reputationReward: formReputation,
            cardPiecesReward: formCardPieces,
            itemRewardName: formItemReward || undefined,
            objectives: validObjectives
        });

        const updatedProgress = acceptQuest(progress, newQuest);
        onUpdateProgress(updatedProgress);

        showToast(`Квест «${newQuest.title}» із ${validObjectives.length} цілями успішно додано до журналу!`);
        setActiveTab('active');
    };

    // Accept quest from NPC Notice Board
    const handleAcceptQuest = (quest: Quest) => {
        const updated = acceptQuest(progress, quest);
        onUpdateProgress(updated);
        showToast(`Взято завдання: «${quest.title}»! Всі цілі активовано.`);
    };

    // Abandon quest
    const handleAbandonQuest = (questId: string) => {
        const updated = abandonQuest(progress, questId);
        onUpdateProgress(updated);
        showToast('Завдання скасовано та видалено з журналу.');
    };

    // Track specific objective or quest on map
    const handleTrackObjective = (questId: string, objective: QuestObjective) => {
        const updated = setTrackedObjective(progress, questId, objective.id);
        onUpdateProgress(updated);

        // Center on target coords if available
        const coords = objective.targetCoords || (
            objective.targetSettlementId 
                ? WORLD_SETTLEMENTS.find(s => s.id === objective.targetSettlementId)
                : undefined
        );

        if (coords && onTrackTargetOnMap) {
            onTrackTargetOnMap({ x: coords.x, y: coords.y });
            showToast(`Компас наведено на ціль: «${objective.text}»!`);
            onClose();
        } else {
            showToast(`Ціль встановлено як активну для відстеження: «${objective.text}»`);
        }
    };

    // Claim rewards
    const handleClaimReward = (questId: string) => {
        const result = claimQuestReward(progress, questId);
        onUpdateProgress(result.updatedProgress);
        showToast(result.rewardMessage);
    };

    if (!isOpen) return null;

    // Badges helpers
    const renderDifficultyBadge = (difficulty: QuestDifficulty) => {
        switch (difficulty) {
            case 'easy':
                return <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[10px] px-2 py-0.5 rounded-full font-bold">Легкий</span>;
            case 'medium':
                return <span className="bg-amber-950 text-amber-400 border border-amber-500/50 text-[10px] px-2 py-0.5 rounded-full font-bold">Середній</span>;
            case 'hard':
                return <span className="bg-orange-950 text-orange-400 border border-orange-500/50 text-[10px] px-2 py-0.5 rounded-full font-bold">Важкий</span>;
            case 'heroic':
                return <span className="bg-purple-950 text-purple-400 border border-purple-500/50 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">Героїчний</span>;
        }
    };

    const renderTypeBadge = (type: QuestType) => {
        switch (type) {
            case 'monster_hunt':
                return <span className="bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">⚔️ Полювання</span>;
            case 'delivery':
                return <span className="bg-sky-950 text-sky-300 border border-sky-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">📦 Доставка</span>;
            case 'duel_champion':
                return <span className="bg-amber-950 text-yellow-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">🃏 Дуель</span>;
            case 'visit_settlement':
                return <span className="bg-teal-950 text-teal-300 border border-teal-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">🧭 Розвідка</span>;
            case 'minigame_win':
                return <span className="bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">🎲 Мініігри</span>;
            default:
                return <span className="bg-stone-900 text-stone-300 border border-stone-600/50 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">📜 Пригода</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-5xl bg-[#140e0a] border-2 border-[#b8860b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#f5ebd7] relative"
            >
                {/* Toast Notification Banner */}
                <AnimatePresence>
                    {toastMessage && (
                        <motion.div 
                            initial={{ y: -40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -40, opacity: 0 }}
                            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-stone-950 px-5 py-2.5 rounded-full font-black text-xs shadow-2xl border border-yellow-200 flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-stone-950" />
                            <span>{toastMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-[#20150d] via-[#2c1d12] to-[#20150d] border-b-2 border-[#b8860b]/60 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-lg text-amber-300">
                            <Scroll className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-serif font-black text-amber-100 tracking-wide">
                                    Журнал Квестів та Система Цілей
                                </h2>
                                <span className="bg-amber-950 text-amber-400 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                                    {activeQuests.length} активних
                                </span>
                            </div>
                            <p className="text-xs text-stone-400">
                                Багатоетапні завдання, основні й бонусні цілі, дошка НПЦ та конструктор пригод
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-stone-900 border border-stone-700 hover:border-amber-400 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-[#b8860b]/40 bg-[#1a120c] px-4 gap-2 overflow-x-auto shrink-0">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 cursor-pointer transition flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'active'
                                ? 'border-amber-400 text-amber-300 bg-[#251a11]'
                                : 'border-transparent text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <Target className="w-4 h-4 text-amber-400" />
                        <span>Активні квести ({activeQuests.length})</span>
                        {activeQuests.some(q => q.status === 'completed') && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('board')}
                        className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 cursor-pointer transition flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'board'
                                ? 'border-amber-400 text-amber-300 bg-[#251a11]'
                                : 'border-transparent text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <Compass className="w-4 h-4 text-amber-300" />
                        <span>Дошка НПЦ ({availableNpcQuests.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('create')}
                        className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 cursor-pointer transition flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'create'
                                ? 'border-amber-400 text-amber-300 bg-[#251a11]'
                                : 'border-transparent text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <PlusCircle className="w-4 h-4 text-amber-400" />
                        <span>Конструктор квестів & цілей</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 cursor-pointer transition flex items-center gap-2 whitespace-nowrap ml-auto ${
                            activeTab === 'completed'
                                ? 'border-amber-400 text-amber-300 bg-[#251a11]'
                                : 'border-transparent text-stone-400 hover:text-stone-200'
                        }`}
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Подвиги ({completedIds.length})</span>
                    </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0f0b08]">
                    {/* TAB 1: ACTIVE QUESTS */}
                    {activeTab === 'active' && (
                        <div>
                            {activeQuests.length === 0 ? (
                                <div className="text-center py-16 px-4 bg-[#18110b] border border-[#b8860b]/30 rounded-2xl">
                                    <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-3xl">
                                        📜
                                    </div>
                                    <h3 className="text-lg font-serif font-black text-amber-200 mb-2">
                                        У вашому журналі поки немає активних квестів
                                    </h3>
                                    <p className="text-xs text-stone-400 max-w-md mx-auto mb-6">
                                        Візьміть колоритні багатоетапні завдання на Дошці Оголошень від жителів таверни або створіть власний квест із системою цілей!
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        <button
                                            onClick={() => setActiveTab('board')}
                                            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-stone-950 font-black text-xs rounded-xl shadow cursor-pointer transition"
                                        >
                                            Дошка оголошень НПЦ
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('create')}
                                            className="px-5 py-2.5 bg-[#251a11] hover:bg-[#342417] text-amber-300 font-bold text-xs rounded-xl border border-amber-600/50 cursor-pointer transition flex items-center gap-1.5"
                                        >
                                            <PlusCircle className="w-4 h-4 text-amber-400" />
                                            Створити квест із цілями
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {activeQuests.map((quest) => {
                                        const objectives = normalizeQuestObjectives(quest);
                                        const mandatoryObjectives = objectives.filter(o => !o.isOptional);
                                        const completedMandatory = mandatoryObjectives.filter(o => o.isCompleted).length;
                                        const isCompleted = quest.status === 'completed' || (mandatoryObjectives.length > 0 && completedMandatory >= mandatoryObjectives.length);
                                        const progressPercent = Math.min(100, Math.round((completedMandatory / Math.max(1, mandatoryObjectives.length)) * 100));

                                        return (
                                            <div 
                                                key={quest.id}
                                                className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all shadow-xl relative overflow-hidden ${
                                                    isCompleted 
                                                        ? 'bg-gradient-to-b from-emerald-950/40 via-[#16110c] to-[#100c09] border-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.2)]' 
                                                        : 'bg-gradient-to-b from-[#1c140e] via-[#140e0a] to-[#0f0a07] border-[#b8860b]/40 hover:border-amber-400'
                                                }`}
                                            >
                                                <div>
                                                    {/* Top Badges */}
                                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {renderTypeBadge(quest.type)}
                                                            {renderDifficultyBadge(quest.difficulty)}
                                                            {quest.isCustom && (
                                                                <span className="bg-amber-950 text-yellow-300 border border-yellow-500/30 text-[9px] px-1.5 py-0.5 rounded font-black">
                                                                    Власний
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-mono text-stone-400 shrink-0">
                                                            {isCompleted ? (
                                                                <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/50">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Виконано!
                                                                </span>
                                                            ) : (
                                                                <span className="bg-stone-900 px-2 py-0.5 rounded-full border border-stone-800 text-amber-300">
                                                                    Цілі: {completedMandatory} / {mandatoryObjectives.length}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* Title & Lore */}
                                                    <h3 className="font-serif font-black text-lg text-amber-100 mb-1 leading-snug">
                                                        {quest.title}
                                                    </h3>
                                                    <p className="text-xs text-stone-300 leading-relaxed mb-3">
                                                        {quest.description}
                                                    </p>

                                                    {/* Giver Details */}
                                                    <div className="flex items-center gap-2.5 bg-[#120d09] p-2.5 rounded-xl border border-stone-800/80 mb-4 text-[11px]">
                                                        <span className="text-2xl p-1 bg-black/40 rounded-lg">{quest.giverAvatar}</span>
                                                        <div className="truncate">
                                                            <div className="font-bold text-amber-200 truncate">{quest.giverName}</div>
                                                            <div className="text-[10px] text-stone-400 truncate">{quest.giverTitle} • {quest.giverLocationName}</div>
                                                        </div>
                                                    </div>

                                                    {/* 🎯 OBJECTIVES CHECKLIST (СИСТЕМА ЦІЛЕЙ КВЕСТУ) */}
                                                    <div className="space-y-2 mb-4 bg-[#110c08] p-3.5 rounded-xl border border-[#b8860b]/30">
                                                        <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5">
                                                                <Target className="w-3.5 h-3.5 text-amber-400" />
                                                                Цілі завдання ({objectives.filter(o => o.isCompleted).length}/{objectives.length}):
                                                            </span>
                                                            {objectives.some(o => o.isOptional) && (
                                                                <span className="text-[9px] text-purple-300 font-bold bg-purple-950/70 px-2 py-0.5 rounded-full border border-purple-500/40 flex items-center gap-1">
                                                                    <Star className="w-2.5 h-2.5" /> Є бонусні цілі
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="space-y-2 mt-2">
                                                            {objectives.map((obj, idx) => {
                                                                const isTracked = progress.trackedObjectiveId === obj.id || quest.trackedObjectiveId === obj.id;
                                                                const objProgress = Math.min(100, Math.round((obj.currentCount / Math.max(1, obj.requiredCount)) * 100));

                                                                return (
                                                                    <div 
                                                                        key={obj.id || idx}
                                                                        className={`p-2.5 rounded-lg border text-xs transition-all relative ${
                                                                            obj.isCompleted
                                                                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                                                                                : isTracked
                                                                                ? 'bg-amber-950/30 border-amber-400/90 shadow-[0_0_12px_rgba(245,158,11,0.25)] text-amber-100'
                                                                                : 'bg-stone-900/70 border-stone-800 text-stone-300'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                                                                <span className="mt-0.5 shrink-0">
                                                                                    {obj.isCompleted ? (
                                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                                                                                    ) : (
                                                                                        <span className="w-4 h-4 rounded-full border border-amber-500/60 flex items-center justify-center text-[9px] font-bold text-amber-400 bg-amber-950/30">
                                                                                            {idx + 1}
                                                                                        </span>
                                                                                    )}
                                                                                </span>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className={`leading-snug break-words ${obj.isCompleted ? 'line-through text-stone-400' : 'font-medium'}`}>
                                                                                        {obj.text}
                                                                                    </div>

                                                                                    {/* Optional objective tag & bonus */}
                                                                                    {obj.isOptional && (
                                                                                        <div className="text-[10px] text-purple-300 font-bold mt-1 flex items-center gap-1.5 flex-wrap">
                                                                                            <span className="bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
                                                                                                ⭐ Додаткова ціль:
                                                                                            </span>
                                                                                            {obj.bonusReward?.gold ? <span className="text-amber-300">+{obj.bonusReward.gold} 🪙</span> : null}
                                                                                            {obj.bonusReward?.xp ? <span className="text-sky-300">+{obj.bonusReward.xp} XP</span> : null}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Progress counter & Map Track button */}
                                                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                                                                    obj.isCompleted 
                                                                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' 
                                                                                        : 'bg-stone-950 text-amber-300 border-stone-800'
                                                                                }`}>
                                                                                    {obj.currentCount}/{obj.requiredCount}
                                                                                </span>

                                                                                {(obj.targetCoords || obj.targetSettlementId) && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleTrackObjective(quest.id, obj)}
                                                                                        title={isTracked ? "Ціль активна на компасі світової мапи" : "Відстежувати цю ціль на карті"}
                                                                                        className={`p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ${
                                                                                            isTracked 
                                                                                                ? 'bg-amber-500 text-stone-950 font-black shadow-md' 
                                                                                                : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/30'
                                                                                        }`}
                                                                                    >
                                                                                        <Compass className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Mini progress bar if requiredCount > 1 */}
                                                                        {obj.requiredCount > 1 && (
                                                                            <div className="w-full h-1.5 rounded-full bg-stone-950 border border-stone-800 overflow-hidden mt-2">
                                                                                <div 
                                                                                    style={{ width: `${objProgress}%` }}
                                                                                    className={`h-full transition-all duration-300 ${
                                                                                        obj.isCompleted ? 'bg-emerald-400' : 'bg-amber-500'
                                                                                    }`}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Overall Progress Bar */}
                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-[10px] font-bold text-stone-400 mb-1">
                                                            <span>Загальне виконання основних цілей:</span>
                                                            <span className="text-amber-300">{progressPercent}%</span>
                                                        </div>
                                                        <div className="w-full h-2 rounded-full bg-stone-900 border border-stone-800 overflow-hidden">
                                                            <div 
                                                                style={{ width: `${progressPercent}%` }}
                                                                className={`h-full transition-all duration-300 ${
                                                                    isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Rewards Box */}
                                                    <div className="bg-[#18110b] p-3 rounded-xl border border-[#b8860b]/30 mb-4 text-xs">
                                                        <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-1.5 flex items-center gap-1">
                                                            <Award className="w-3.5 h-3.5 text-amber-400" /> Винагорода за завдання:
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold">
                                                            <span className="text-amber-300 flex items-center gap-1">
                                                                <Coins className="w-3.5 h-3.5 text-amber-400" /> +{quest.reward.gold} 🪙
                                                            </span>
                                                            <span className="text-sky-300 flex items-center gap-1">
                                                                <Sparkles className="w-3.5 h-3.5 text-sky-400" /> +{quest.reward.xp} XP
                                                            </span>
                                                            <span className="text-purple-300 flex items-center gap-1">
                                                                <Award className="w-3.5 h-3.5 text-purple-400" /> +{quest.reward.reputation} слави
                                                            </span>
                                                            {quest.reward.cardPieces ? (
                                                                <span className="text-rose-300 flex items-center gap-1">
                                                                    🧩 +{quest.reward.cardPieces} уламків
                                                                </span>
                                                            ) : null}
                                                            {quest.reward.itemRewardName ? (
                                                                <span className="text-emerald-300 flex items-center gap-1">
                                                                    🎁 {quest.reward.itemRewardName}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom Action Buttons */}
                                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#b8860b]/20">
                                                    {isCompleted ? (
                                                        <button
                                                            onClick={() => handleClaimReward(quest.id)}
                                                            className="w-full py-3 bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-400 hover:from-emerald-400 text-stone-950 font-black text-sm rounded-xl shadow-lg border border-yellow-300 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                                                        >
                                                            <Sparkles className="w-4 h-4 text-stone-950" />
                                                            Забрати нагороду та бонуси!
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                {objectives[0]?.targetCoords && onTrackTargetOnMap && (
                                                                    <button
                                                                        onClick={() => {
                                                                            onTrackTargetOnMap(objectives[0].targetCoords!);
                                                                            onClose();
                                                                        }}
                                                                        className="px-3.5 py-1.5 bg-[#251a11] hover:bg-[#342417] text-amber-300 text-xs font-bold rounded-lg border border-amber-600/40 flex items-center gap-1.5 cursor-pointer transition"
                                                                    >
                                                                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                                                        Центрувати мапу
                                                                    </button>
                                                                )}
                                                                <div className="text-[11px] text-stone-400 italic">
                                                                    Виконуйте цілі на карті та в тавернах...
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleAbandonQuest(quest.id)}
                                                                className="p-2 text-stone-500 hover:text-red-400 transition cursor-pointer"
                                                                title="Скасувати завдання"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: NPC NOTICE BOARD */}
                    {activeTab === 'board' && (
                        <div>
                            {/* Board Banner */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-[#20150d] to-[#160f09] border border-[#b8860b]/50 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                                <div>
                                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-amber-400" /> {effectiveSettlement.name} • Дошка оголошень НПЦ
                                    </div>
                                    <h3 className="text-base font-serif font-black text-amber-100">
                                        Свіжі замовлення з системою основних і бонусних цілей
                                    </h3>
                                    <p className="text-xs text-stone-400">
                                        Виконання додаткових цілей дає щедрі бонуси до золота та досвіду!
                                    </p>
                                </div>
                                <span className="bg-amber-950 text-amber-300 border border-amber-600/40 px-3 py-1 rounded-full text-xs font-bold">
                                    {availableNpcQuests.length} доступно
                                </span>
                            </div>

                            {/* Quests Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableNpcQuests.map((quest) => {
                                    const isAlreadyAccepted = activeQuests.some(q => q.id === quest.id);
                                    const objectives = normalizeQuestObjectives(quest);

                                    return (
                                        <div 
                                            key={quest.id}
                                            className="p-4 rounded-2xl bg-[#18110b] border-2 border-[#b8860b]/40 hover:border-amber-400 transition-all shadow-xl flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {renderTypeBadge(quest.type)}
                                                        {renderDifficultyBadge(quest.difficulty)}
                                                    </div>
                                                </div>

                                                <h3 className="font-serif font-black text-base text-amber-100 mb-1 leading-snug">
                                                    {quest.title}
                                                </h3>
                                                <p className="text-xs text-stone-300 leading-relaxed mb-3">
                                                    {quest.description}
                                                </p>

                                                {/* Giver info */}
                                                <div className="flex items-center gap-2 bg-[#100b07] p-2 rounded-xl border border-stone-800 mb-3 text-[11px]">
                                                    <span className="text-xl">{quest.giverAvatar}</span>
                                                    <div className="truncate">
                                                        <div className="font-bold text-amber-200 truncate">{quest.giverName}</div>
                                                        <div className="text-[10px] text-stone-400 truncate">{quest.giverTitle}</div>
                                                    </div>
                                                </div>

                                                {/* Objectives Preview in Board Card */}
                                                <div className="bg-[#120d09] p-2.5 rounded-xl border border-stone-800/80 mb-3 space-y-1.5">
                                                    <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                                                        <Target className="w-3 h-3 text-amber-400" /> Цілі завдання ({objectives.length}):
                                                    </div>
                                                    {objectives.map((obj, i) => (
                                                        <div key={obj.id || i} className="text-[11px] text-stone-300 flex items-start gap-1.5 leading-tight">
                                                            <span className="text-amber-400 shrink-0 mt-0.5">
                                                                {obj.isOptional ? '⭐' : '•'}
                                                            </span>
                                                            <span className={obj.isOptional ? 'text-purple-300' : 'text-stone-200'}>
                                                                {obj.text}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Reward preview */}
                                                <div className="bg-[#120d08] p-2.5 rounded-xl border border-stone-800 text-xs mb-4">
                                                    <div className="text-[10px] font-bold text-stone-400 mb-1">Базова нагорода:</div>
                                                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                                        <span className="text-amber-300">+{quest.reward.gold} 🪙</span>
                                                        <span className="text-sky-300">+{quest.reward.xp} XP</span>
                                                        <span className="text-purple-300">+{quest.reward.reputation} слави</span>
                                                        {quest.reward.cardPieces ? <span className="text-rose-300">+{quest.reward.cardPieces} уламків</span> : null}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                disabled={isAlreadyAccepted}
                                                onClick={() => handleAcceptQuest(quest)}
                                                className={`w-full py-2.5 font-black text-xs rounded-xl shadow border transition flex items-center justify-center gap-2 ${
                                                    isAlreadyAccepted
                                                        ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-stone-950 border-yellow-300 cursor-pointer active:scale-95'
                                                }`}
                                            >
                                                <Scroll className="w-4 h-4" />
                                                <span>{isAlreadyAccepted ? 'Вже у журналі' : 'Взяти завдання в журнал'}</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: CONSTRUCTOR (CREATE MANUAL QUEST WITH MULTI-OBJECTIVES) */}
                    {activeTab === 'create' && (
                        <div>
                            {/* Preset Buttons */}
                            <div className="mb-6 p-4 rounded-2xl bg-[#160f09] border border-[#b8860b]/40">
                                <div className="text-xs font-black uppercase text-amber-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    Готові шаблони квестів із багатоетапними цілями:
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                    {QUEST_MANUAL_PRESETS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => applyPreset(preset.input)}
                                            className="p-3 rounded-xl bg-[#20150d] hover:bg-[#302014] border border-[#b8860b]/30 hover:border-amber-400 text-left cursor-pointer transition flex flex-col justify-between"
                                        >
                                            <div className="text-2xl mb-1">{preset.icon}</div>
                                            <div className="text-[11px] font-bold text-amber-200 line-clamp-2 leading-tight">
                                                {preset.label}
                                            </div>
                                            <div className="text-[9px] text-stone-400 mt-1 flex items-center gap-1">
                                                <Target className="w-2.5 h-2.5" />
                                                <span>{preset.input.objectives?.length || 1} цілі</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Manual Creation Form */}
                            <form onSubmit={handleCreateManualQuest} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Form Controls (2 Cols) */}
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Quest Title */}
                                    <div>
                                        <label className="block text-xs font-black text-amber-300 mb-1">
                                            Назва квесту *
                                        </label>
                                        <input 
                                            type="text"
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            placeholder="напр. Розвідка прадавнього бастіону"
                                            className="w-full px-3 py-2.5 bg-[#1b130c] border border-stone-700 focus:border-amber-400 rounded-xl text-sm text-stone-100 placeholder-stone-500 outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Quest Type & Difficulty */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-amber-300 mb-1">
                                                Тип завдання
                                            </label>
                                            <select
                                                value={formType}
                                                onChange={(e) => setFormType(e.target.value as QuestType)}
                                                className="w-full px-3 py-2 bg-[#1b130c] border border-stone-700 focus:border-amber-400 rounded-xl text-xs text-stone-100 outline-none"
                                            >
                                                <option value="monster_hunt">⚔️ Полювання на монстрів</option>
                                                <option value="delivery">📦 Доставка вантажу / депеші</option>
                                                <option value="duel_champion">🃏 Картярська чи бойова дуель</option>
                                                <option value="visit_settlement">🧭 Розвідка поселення / руїн</option>
                                                <option value="minigame_win">🎲 Перемога в мінііграх</option>
                                                <option value="custom">📜 Авторська пригода</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-amber-300 mb-1">
                                                Рівень складності (авторозрахунок)
                                            </label>
                                            <select
                                                value={formDifficulty}
                                                onChange={(e) => handleDifficultyChange(e.target.value as QuestDifficulty)}
                                                className="w-full px-3 py-2 bg-[#1b130c] border border-stone-700 focus:border-amber-400 rounded-xl text-xs text-stone-100 outline-none"
                                            >
                                                <option value="easy">🟢 Легкий (120 🪙, 60 XP)</option>
                                                <option value="medium">🟡 Середній (250 🪙, 130 XP)</option>
                                                <option value="hard">🟠 Важкий (450 🪙, 250 XP)</option>
                                                <option value="heroic">🟣 Героїчний (800 🪙, 500 XP)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* 🎯 СИСТЕМА ЦІЛЕЙ У КОНСТРУКТОРІ (OBJECTIVES BUILDER) */}
                                    <div className="p-4 bg-[#18110b] border-2 border-[#b8860b]/40 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                                                <Target className="w-4 h-4 text-amber-400" />
                                                Система цілей квесту ({formObjectives.length}):
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddObjective}
                                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-[11px] rounded-lg cursor-pointer transition flex items-center gap-1"
                                            >
                                                <PlusCircle className="w-3.5 h-3.5" />
                                                + Додати ціль
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {formObjectives.map((obj, index) => (
                                                <div 
                                                    key={index} 
                                                    className="p-3 bg-[#120d09] border border-stone-800 rounded-xl space-y-2 relative"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                                                            <span>Ціль #{index + 1}</span>
                                                            {obj.isOptional && (
                                                                <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/40">
                                                                    ⭐ Додаткова
                                                                </span>
                                                            )}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveObjective(index)}
                                                            className="text-stone-500 hover:text-rose-400 transition cursor-pointer p-1"
                                                            title="Видалити цю ціль"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Text description */}
                                                    <input 
                                                        type="text"
                                                        value={obj.text}
                                                        onChange={(e) => handleUpdateObjective(index, { text: e.target.value })}
                                                        placeholder="Опис цілі, напр. Знищити загін вовкулаків..."
                                                        className="w-full px-2.5 py-1.5 bg-[#1b130c] border border-stone-700 focus:border-amber-400 rounded-lg text-xs text-stone-100 outline-none"
                                                        required
                                                    />

                                                    {/* Type & Required count & Optional toggle */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="block text-[10px] text-stone-400 mb-0.5">Тип події:</label>
                                                            <select
                                                                value={obj.type || 'kill_monster'}
                                                                onChange={(e) => handleUpdateObjective(index, { type: e.target.value as QuestObjectiveType })}
                                                                className="w-full px-2 py-1 bg-[#1b130c] border border-stone-700 rounded-lg text-xs text-stone-200 outline-none"
                                                            >
                                                                <option value="kill_monster">⚔️ Бій з монстрами</option>
                                                                <option value="visit_settlement">🧭 Відвідати місто/руїни</option>
                                                                <option value="win_duel">🃏 Перемога в дуелі</option>
                                                                <option value="win_minigame">🎲 Виграш у мінііграх</option>
                                                                <option value="collect_card_pieces">🧩 Збір уламків карт</option>
                                                                <option value="deliver_cargo">📦 Доставка депеші</option>
                                                                <option value="custom">📜 Довільна дія</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] text-stone-400 mb-0.5">Кількість (разів/шт):</label>
                                                            <input 
                                                                type="number"
                                                                min={1}
                                                                max={50}
                                                                value={obj.requiredCount || 1}
                                                                onChange={(e) => handleUpdateObjective(index, { requiredCount: Number(e.target.value) })}
                                                                className="w-full px-2 py-1 bg-[#1b130c] border border-stone-700 rounded-lg text-xs text-stone-200 outline-none"
                                                            />
                                                        </div>

                                                        <div className="flex items-center pt-4">
                                                            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-stone-300">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={obj.isOptional || false}
                                                                    onChange={(e) => handleUpdateObjective(index, { 
                                                                        isOptional: e.target.checked,
                                                                        bonusGold: e.target.checked ? (obj.bonusGold || 50) : undefined,
                                                                        bonusXp: e.target.checked ? (obj.bonusXp || 30) : undefined
                                                                    })}
                                                                    className="accent-amber-500 rounded cursor-pointer"
                                                                />
                                                                <span className={obj.isOptional ? 'text-purple-300 font-bold' : ''}>
                                                                    ⭐ Додаткова ціль
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Optional Bonus fields if checked */}
                                                    {obj.isOptional && (
                                                        <div className="p-2 bg-purple-950/20 border border-purple-500/30 rounded-lg flex items-center gap-3 text-xs">
                                                            <span className="text-[10px] font-bold text-purple-300 shrink-0">Бонус за виконання:</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-stone-400 text-[10px]">🪙:</span>
                                                                <input 
                                                                    type="number"
                                                                    value={obj.bonusGold || 0}
                                                                    onChange={(e) => handleUpdateObjective(index, { bonusGold: Number(e.target.value) })}
                                                                    className="w-16 px-1.5 py-0.5 bg-[#100a06] border border-purple-500/40 rounded text-xs text-amber-300 text-center"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-stone-400 text-[10px]">XP:</span>
                                                                <input 
                                                                    type="number"
                                                                    value={obj.bonusXp || 0}
                                                                    onChange={(e) => handleUpdateObjective(index, { bonusXp: Number(e.target.value) })}
                                                                    className="w-16 px-1.5 py-0.5 bg-[#100a06] border border-purple-500/40 rounded text-xs text-sky-300 text-center"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quest Giver Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-black text-amber-300 mb-1">
                                                Ім'я замовника
                                            </label>
                                            <input 
                                                type="text"
                                                value={formGiverName}
                                                onChange={(e) => setFormGiverName(e.target.value)}
                                                className="w-full px-3 py-2 bg-[#1b130c] border border-stone-700 focus:border-amber-400 rounded-xl text-xs text-stone-100 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-amber-300 mb-1">
                                                Титул / Посада
                                            </label>
                                            <input 
                                                type="text"
                                                value={formGiverTitle}
                                                onChange={(e) => setFormGiverTitle(e.target.value)}
                                                className="w-full px-3 py-2 bg-[#1b130c] border border-stone-700 focus:border-amber-400 rounded-xl text-xs text-stone-100 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-amber-300 mb-1">
                                                Смайл-аватар
                                            </label>
                                            <input 
                                                type="text"
                                                value={formGiverAvatar}
                                                onChange={(e) => setFormGiverAvatar(e.target.value)}
                                                className="w-full px-3 py-2 bg-[#1b130c] border border-stone-700 focus:border-amber-400 rounded-xl text-xs text-stone-100 outline-none text-center"
                                            />
                                        </div>
                                    </div>

                                    {/* Target Settlement */}
                                    <div>
                                        <label className="block text-xs font-black text-amber-300 mb-1">
                                            Прив'язане поселення на мапі (необов'язково)
                                        </label>
                                        <select
                                            value={formTargetSettlementId}
                                            onChange={(e) => setFormTargetSettlementId(e.target.value)}
                                            className="w-full px-3 py-2 bg-[#1b130c] border border-stone-700 focus:border-amber-400 rounded-xl text-xs text-stone-100 outline-none"
                                        >
                                            <option value="">Не прив'язано (будь-яке)</option>
                                            {WORLD_SETTLEMENTS.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} ({s.type === 'city' ? 'Місто' : s.type === 'castle' ? 'Замок' : s.type === 'ruins' ? 'Руїни' : 'Село'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-black text-amber-300 mb-1">
                                            Художній опис / Літопис доручення
                                        </label>
                                        <textarea 
                                            rows={2}
                                            value={formDescription}
                                            onChange={(e) => setFormDescription(e.target.value)}
                                            placeholder="Опишіть історію та передісторію цього завдання..."
                                            className="w-full px-3 py-2 bg-[#1b130c] border border-stone-700 focus:border-amber-400 rounded-xl text-xs text-stone-100 outline-none"
                                        />
                                    </div>

                                    {/* Rewards Sliders/Inputs */}
                                    <div className="p-3 bg-[#160f0a] border border-stone-800 rounded-xl space-y-2">
                                        <div className="text-xs font-black text-amber-400 uppercase tracking-wide">
                                            Основна винагорода за квест
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <div>
                                                <span className="text-[10px] text-stone-400">Золото 🪙:</span>
                                                <input 
                                                    type="number" 
                                                    value={formGold} 
                                                    onChange={(e) => setFormGold(Number(e.target.value))}
                                                    className="w-full px-2 py-1 bg-[#100a06] border border-stone-700 rounded text-xs text-amber-300"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-stone-400">Досвід XP:</span>
                                                <input 
                                                    type="number" 
                                                    value={formXp} 
                                                    onChange={(e) => setFormXp(Number(e.target.value))}
                                                    className="w-full px-2 py-1 bg-[#100a06] border border-stone-700 rounded text-xs text-sky-300"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-stone-400">Слава 👑:</span>
                                                <input 
                                                    type="number" 
                                                    value={formReputation} 
                                                    onChange={(e) => setFormReputation(Number(e.target.value))}
                                                    className="w-full px-2 py-1 bg-[#100a06] border border-stone-700 rounded text-xs text-purple-300"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-stone-400">Уламки карт 🧩:</span>
                                                <input 
                                                    type="number" 
                                                    value={formCardPieces} 
                                                    onChange={(e) => setFormCardPieces(Number(e.target.value))}
                                                    className="w-full px-2 py-1 bg-[#100a06] border border-stone-700 rounded text-xs text-rose-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-sm rounded-xl shadow-xl border border-yellow-300 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                                    >
                                        <Sparkles className="w-5 h-5 text-stone-950" />
                                        Створити завдання та активувати його цілі!
                                    </button>
                                </div>

                                {/* Live Preview Card (1 Col) */}
                                <div>
                                    <div className="text-xs font-black uppercase text-amber-400 tracking-wider mb-2 flex items-center gap-1">
                                        <Scroll className="w-4 h-4 text-amber-400" />
                                        Живий попередній перегляд:
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#22170f] to-[#140e0a] border-2 border-amber-500/80 shadow-2xl text-stone-200">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            {renderTypeBadge(formType)}
                                            {renderDifficultyBadge(formDifficulty)}
                                        </div>

                                        <h3 className="font-serif font-black text-base text-amber-100 mb-1 leading-snug">
                                            {formTitle || 'Назва вашого квесту'}
                                        </h3>
                                        <p className="text-xs text-stone-300 leading-relaxed mb-3">
                                            {formDescription || 'Тут відображається художній опис завдання для мандрівника...'}
                                        </p>

                                        <div className="flex items-center gap-2 bg-[#120d08] p-2 rounded-xl border border-stone-800 mb-3 text-[11px]">
                                            <span className="text-xl">{formGiverAvatar || '📜'}</span>
                                            <div>
                                                <div className="font-bold text-amber-200">{formGiverName || 'Замовник'}</div>
                                                <div className="text-[10px] text-stone-400">{formGiverTitle || 'Шляхтич'} • {effectiveSettlement.name}</div>
                                            </div>
                                        </div>

                                        {/* Objectives preview */}
                                        <div className="bg-[#120d09] p-2.5 rounded-xl border border-stone-800 mb-3 space-y-1.5 text-xs">
                                            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                                                Цілі ({formObjectives.length}):
                                            </div>
                                            {formObjectives.map((obj, i) => (
                                                <div key={i} className="text-[11px] flex items-start gap-1.5 leading-tight">
                                                    <span className="text-amber-400 shrink-0 mt-0.5">
                                                        {obj.isOptional ? '⭐' : '•'}
                                                    </span>
                                                    <span className={obj.isOptional ? 'text-purple-300' : 'text-stone-300'}>
                                                        {obj.text || `Ціль ${i + 1}`} ({obj.requiredCount || 1} шт)
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-[#18110a] p-2.5 rounded-xl border border-amber-500/30 text-xs">
                                            <div className="text-[10px] font-bold text-amber-400 mb-1">Очікувана нагорода:</div>
                                            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                                <span className="text-amber-300">+{formGold} 🪙</span>
                                                <span className="text-sky-300">+{formXp} XP</span>
                                                <span className="text-purple-300">+{formReputation} слави</span>
                                                {formCardPieces > 0 && <span className="text-rose-300">+{formCardPieces} уламків</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 4: COMPLETED QUESTS HISTORY */}
                    {activeTab === 'completed' && (
                        <div>
                            {completedIds.length === 0 ? (
                                <div className="text-center py-16 px-4 bg-[#18110b] border border-[#b8860b]/30 rounded-2xl">
                                    <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center mx-auto mb-4 text-3xl">
                                        🏆
                                    </div>
                                    <h3 className="text-base font-serif font-black text-amber-200 mb-1">
                                        Список подвигів порожній
                                    </h3>
                                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                                        Виконуйте завдання жителів Елдрії та закривайте всі цілі, щоб увійти в літописи королівства!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-4 bg-[#19120c] border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-300 shadow-lg">
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            Всього виконано завдань та здобуто тріумфів:
                                        </span>
                                        <span className="text-base font-black text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/50">
                                            {completedIds.length} подвигів
                                        </span>
                                    </div>
                                    <div className="text-xs text-stone-400 p-2 italic">
                                        Всі нагороди й бонуси за виконані обов'язкові та додаткові цілі зараховано до вашої казни й досвіду.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

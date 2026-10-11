import React from 'react';
import { motion } from 'motion/react';
import { WorldProgress, PlayerRpgStats } from '../types';
import { spendStatPoint, resetPlayerStats, DEFAULT_PLAYER_STATS } from '../lib/worldData';
import { playLevelUpSound } from '../lib/soundEffects';
import { COMPANION_CLASSES } from '../lib/companionClasses';
import { SquadFormationView } from './SquadFormationView';
import { 
    Shield, 
    Zap, 
    Heart, 
    Activity, 
    Award, 
    Flame, 
    X, 
    Plus, 
    Sparkles, 
    HelpCircle,
    RotateCcw,
    Target,
    Crosshair,
    Users,
    LayoutGrid,
    List
} from 'lucide-react';

interface CharacterStatsModalProps {
    progress: WorldProgress;
    onUpdateProgress: (updated: WorldProgress) => void;
    onClose: () => void;
}

export function CharacterStatsModal({
    progress,
    onUpdateProgress,
    onClose
}: CharacterStatsModalProps) {
    const [squadViewMode, setSquadViewMode] = React.useState<'formation' | 'list'>('formation');
    const stats: PlayerRpgStats = progress.playerStats || DEFAULT_PLAYER_STATS;

    const totalHp = stats.baseHp + stats.strength;
    const xpPercent = Math.min(100, Math.round((stats.xp / Math.max(1, stats.xpToNextLevel)) * 100));

    const currentGender = stats.gender || 'male';

    const handleGenderChange = (newGender: 'male' | 'female') => {
        onUpdateProgress({
            ...progress,
            playerStats: {
                ...stats,
                gender: newGender
            }
        });
    };

    const handleUpgrade = (stat: 'baseHp' | 'strength' | 'agility') => {
        if (stats.statPoints <= 0) return;
        const updated = spendStatPoint(progress, stat);
        playLevelUpSound();
        onUpdateProgress(updated);
    };

    const handleHealNpc = (npcId: string) => {
        if (progress.playerGold < 50) {
            alert('Недостатньо золота для лікування! Потрібно 50 🪙');
            return;
        }
        const companions = [...(progress.hiredNpcs || [])];
        const cIdx = companions.findIndex(c => c.id === npcId);
        if (cIdx >= 0) {
            const maxHp = Math.max(companions[cIdx].baseHp || 100, companions[cIdx].hp || 100);
            companions[cIdx] = {
                ...companions[cIdx],
                baseHp: maxHp,
                hp: maxHp,
                isDead: false
            };
            onUpdateProgress({
                ...progress,
                playerGold: progress.playerGold - 50,
                hiredNpcs: companions
            });
        }
    };

    const handleReset = () => {
        if (window.confirm('Скинути рівень і всі характеристики лицаря до початкового 0 Рівня?')) {
            const updated = resetPlayerStats(progress);
            onUpdateProgress(updated);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-[#17120e] border-2 border-[#b8860b]/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7] max-h-[92vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-[#2a1e14] via-[#1d150e] to-[#2a1e14] border-b border-[#b8860b]/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black font-serif text-[#f5ebd7]">
                                Прокачка Характеристик Лицаря
                            </h2>
                            <div className="text-xs text-[#a89988]">
                                Досвід та параметри кулачного бою і пригод
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-[#251b13] hover:bg-[#382b20] border border-stone-700 text-stone-300 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Level & XP Bar */}
                <div className="p-4 bg-[#1e1711] border-b border-[#3b2d1f]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 text-black text-xs font-black shadow-md">
                                РІВЕНЬ {stats.level}
                            </span>
                            <span className="text-xs text-[#c4b5a0]">
                                Досвід: <strong className="text-amber-300">{stats.xp}</strong> / {stats.xpToNextLevel} XP
                            </span>
                        </div>

                        {stats.statPoints > 0 ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/25 border border-yellow-400 rounded-full text-xs font-black text-yellow-300 animate-pulse">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                <span>Очки прокачки: {stats.statPoints}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-stone-500">
                                Немає вільних очок
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-[#b8860b]/40">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPercent}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                        />
                    </div>
                </div>

                {/* Formula Callout & Gender Selector */}
                <div className="px-4 py-2 bg-[#140f0c] border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[#c4b5a0]">
                        <Heart className="w-4 h-4 text-red-400 shrink-0" />
                        <span>
                            <strong>HP:</strong> Базове (<span className="text-red-300">{stats.baseHp}</span>) + Сила (<span className="text-amber-300">{stats.strength}</span>) = <strong className="text-red-400">{totalHp} HP</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#1f1712] px-2 py-1 rounded-lg border border-[#3b2d1f]">
                        <span className="text-[11px] font-bold text-amber-200/80">Стать:</span>
                        <button
                            type="button"
                            onClick={() => handleGenderChange('male')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                                currentGender === 'male'
                                    ? 'bg-blue-600/60 text-blue-200 border border-blue-400/60 shadow-sm'
                                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                            }`}
                        >
                            <span>♂️</span> Чоловік
                        </button>
                        <button
                            type="button"
                            onClick={() => handleGenderChange('female')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                                currentGender === 'female'
                                    ? 'bg-pink-600/60 text-pink-200 border border-pink-400/60 shadow-sm'
                                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                            }`}
                        >
                            <span>♀️</span> Жінка
                        </button>
                    </div>
                </div>

                {/* Attributes List */}
                <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    {/* 1. Base HP */}
                    <div className="p-3 bg-[#201812] border border-[#3b2d1f] rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-xl text-red-400 shrink-0">
                                <Heart className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-[#f5ebd7]">Базове Здоров'я</h4>
                                    <span className="text-sm font-black text-red-400">{stats.baseHp}</span>
                                </div>
                                <p className="text-xs text-[#a89988] mt-0.5">
                                    Основа вашої живучості. Кожне очко дає <strong className="text-red-300">+10 HP</strong>.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleUpgrade('baseHp')}
                            disabled={stats.statPoints <= 0}
                            className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 transition shadow-md ${
                                stats.statPoints > 0
                                    ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white cursor-pointer active:scale-95'
                                    : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                            }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+10 HP</span>
                        </button>
                    </div>

                    {/* 2. Strength */}
                    <div className="p-3 bg-[#201812] border border-[#3b2d1f] rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-950/60 border border-amber-500/50 rounded-xl text-amber-400 shrink-0">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-[#f5ebd7]">Показник Сили</h4>
                                    <span className="text-sm font-black text-amber-300">{stats.strength}</span>
                                </div>
                                <p className="text-xs text-[#a89988] mt-0.5">
                                    Збільшує шкоду кулаків та додає <strong className="text-amber-300">+2 HP</strong> до здоров'я за кожне очко.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleUpgrade('strength')}
                            disabled={stats.statPoints <= 0}
                            className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 transition shadow-md ${
                                stats.statPoints > 0
                                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black cursor-pointer active:scale-95'
                                    : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                            }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+2 Сили</span>
                        </button>
                    </div>

                    {/* 3. Agility */}
                    <div className="p-3 bg-[#201812] border border-[#3b2d1f] rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-400 shrink-0">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-[#f5ebd7]">Спритність (d20)</h4>
                                    <span className="text-sm font-black text-emerald-300">+{stats.agility}</span>
                                </div>
                                <p className="text-xs text-[#a89988] mt-0.5">
                                    Додається до кидка 1d20 при атаці та ухилянні. <strong className="text-emerald-300">+1 до d20</strong> за очко.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleUpgrade('agility')}
                            disabled={stats.statPoints <= 0}
                            className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 transition shadow-md ${
                                stats.statPoints > 0
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black cursor-pointer active:scale-95'
                                    : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                            }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+1 Спритність</span>
                        </button>
                    </div>

                    {/* 4. Archery & Ranged Masteries */}
                    <div className="p-3 bg-[#19130d] border border-amber-500/30 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                                    Майстерність дальнього бою
                                </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono">
                                Кожні 60 пострілів +1
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {/* Bow Proficiency */}
                            <div className="p-2.5 rounded-lg bg-[#241a12] border border-[#3b2b1d] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                                        <span>🏹</span>
                                        <span>Володіння луком</span>
                                    </span>
                                    <span className="text-emerald-300 font-black font-serif text-sm">
                                        {stats.bowProficiency || 1}
                                    </span>
                                </div>
                                <div className="mt-1.5 space-y-1">
                                    <div className="flex justify-between text-[10px] text-stone-400">
                                        <span>Пострілів з лука:</span>
                                        <span className="text-amber-300 font-mono">{stats.totalBowShots || 0} шт ({(stats.totalBowShots || 0) % 60}/60)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-emerald-900/40">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full" 
                                            style={{ width: `${(((stats.totalBowShots || 0) % 60) / 60) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Ranged Shooting Modifier */}
                            <div className="p-2.5 rounded-lg bg-[#241a12] border border-[#3b2b1d] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                                        <Crosshair className="w-3.5 h-3.5 text-teal-400" />
                                        <span>Модифікатор стрільби</span>
                                    </span>
                                    <span className="text-teal-300 font-black font-serif text-sm">
                                        +{stats.rangedShootingMod || 1}
                                    </span>
                                </div>
                                <div className="mt-1.5 space-y-1">
                                    <div className="flex justify-between text-[10px] text-stone-400">
                                        <span>Усі далекобійні постріли:</span>
                                        <span className="text-teal-300 font-mono">{stats.totalRangedShots || 0} шт ({(stats.totalRangedShots || 0) % 60}/60)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-teal-900/40">
                                        <div 
                                            className="h-full bg-teal-500 rounded-full" 
                                            style={{ width: `${(((stats.totalRangedShots || 0) % 60) / 60) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Knight's Squad (Hired Companions & Tactial Formation) */}
                    <div className="p-3.5 bg-[#19130d] border border-amber-500/40 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                                    Ваш Лицарський Загін
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-[#4a3520]">
                                    <button
                                        onClick={() => setSquadViewMode('formation')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                                            squadViewMode === 'formation' 
                                                ? 'bg-amber-600 text-white shadow' 
                                                : 'text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        <LayoutGrid className="w-3 h-3" />
                                        <span>Стрій</span>
                                    </button>
                                    <button
                                        onClick={() => setSquadViewMode('list')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                                            squadViewMode === 'list' 
                                                ? 'bg-amber-600 text-white shadow' 
                                                : 'text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        <List className="w-3 h-3" />
                                        <span>Список</span>
                                    </button>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono">
                                    {progress.hiredNpcs?.length || 0} супутників
                                </span>
                            </div>
                        </div>

                        {squadViewMode === 'formation' ? (
                            <SquadFormationView
                                progress={progress}
                                onHealCompanion={handleHealNpc}
                            />
                        ) : (
                            progress.hiredNpcs && progress.hiredNpcs.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {progress.hiredNpcs.map((npc, idx) => {
                                        const cClass = npc.companionClassId ? COMPANION_CLASSES[npc.companionClassId] : null;
                                        const maxHp = Math.max(npc.baseHp || 100, npc.hp || 100);
                                        const curHp = Math.min(maxHp, npc.hp ?? maxHp);
                                        const isInjuredOrDead = curHp <= 0 || npc.isDead;

                                        return (
                                        <div 
                                            key={idx} 
                                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs ${isInjuredOrDead ? 'bg-[#1a1111] border-red-900/40' : 'bg-[#241a12] border-[#3b2b1d]'}`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-2xl p-1 bg-amber-950/40 border border-amber-500/20 rounded-full ${isInjuredOrDead ? 'grayscale' : ''}`}>
                                                        {isInjuredOrDead ? '💔' : npc.avatar}
                                                    </span>
                                                    <div>
                                                        <div className={`font-bold ${isInjuredOrDead ? 'text-red-400' : 'text-amber-200'}`}>
                                                            {npc.name} {isInjuredOrDead && '(Поранений / Недієздатний)'}
                                                        </div>
                                                        <div className="text-[10px] text-[#a89988]">
                                                            {cClass ? cClass.name : npc.title} • Рівень {npc.level || 1}
                                                        </div>
                                                        {!isInjuredOrDead && !npc.isSummon && (
                                                            <div className="text-[10px] text-stone-400">
                                                                Виживання: <span className={npc.survivalProbability < 50 ? 'text-red-400' : 'text-emerald-400'}>{npc.survivalProbability}%</span> | 
                                                                Заряди: <span className="text-blue-300">{npc.currentAbilityCharges}/{npc.maxAbilityCharges}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className="flex items-center gap-2 text-[11px] font-mono bg-[#140f0c] px-2 py-1 rounded border border-stone-800">
                                                    <span className={isInjuredOrDead ? 'text-red-400 font-bold' : 'text-emerald-400'} title="HP">
                                                        ❤️ {curHp} / {maxHp}
                                                    </span>
                                                    <span className="text-amber-400 flex items-center gap-0.5" title="Сила">
                                                        ⚔️ {npc.strength || 3}
                                                    </span>
                                                    <span className="text-emerald-400 flex items-center gap-0.5" title="Спритність">
                                                        🎯 {npc.agility || 3}
                                                    </span>
                                                </div>
                                                {isInjuredOrDead ? (
                                                    <button
                                                        onClick={() => handleHealNpc(npc.id)}
                                                        className="px-2 py-1 bg-teal-800 hover:bg-teal-700 text-teal-100 text-[10px] font-bold rounded cursor-pointer transition border border-teal-500/40"
                                                    >
                                                        🩹 Вилікувати (50 🪙)
                                                    </button>
                                                ) : (
                                                    <div className="text-[9px] text-stone-500 font-mono text-right">
                                                        XP: {npc.xp || 0} / {npc.xpToNextLevel || 100}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-[#140f0c] rounded-lg border border-stone-800 text-xs text-stone-500">
                                    У вас поки немає найнятих супутників. Подружіться з NPC у тавернах до максимального ставлення (100) та найміть їх у загін!
                                </div>
                            )
                        )}
                    </div>

                    {/* Combat Rules Reminder */}
                    <div className="p-3 bg-[#130e0b] border border-stone-800 rounded-xl text-xs space-y-1 text-[#a89988]">
                        <div className="font-bold text-amber-300 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Правила кулачних боїв у таверні:</span>
                        </div>
                        <div>• Влучання зараховується, коли <strong>1d20 + ваша спритність &gt; 1d20 + спритність суперника</strong>.</div>
                        <div>• Якщо суперник чи ви вгадали зону захисту (голова, тулуб, ноги) — завдається лише <strong>чверть шкоди (25%)</strong>.</div>
                        <div>• Удар у <strong>голову</strong> при влучанні завдає <strong>почетвірне пошкодження (4x)</strong>!</div>
                        <div>• Досвід (XP) нараховується за кожну партію в карти та кожен кулачний бій!</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 bg-[#120e0b] border-t border-[#3b2d1f] flex items-center justify-between">
                    <button
                        onClick={handleReset}
                        className="px-3 py-1.5 bg-stone-800/80 hover:bg-red-950/80 hover:border-red-600/60 border border-stone-700 text-stone-400 hover:text-red-300 font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        title="Скинути рівень та прокачку персонажа до 0 рівня"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Скинути до Рівня 0</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs rounded-xl shadow-md transition"
                    >
                        Готово
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

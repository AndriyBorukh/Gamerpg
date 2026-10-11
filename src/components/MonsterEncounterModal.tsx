import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonsterSquad } from '../lib/monsters/wanderingMonsters';
import { WorldProgress } from '../types';
import { DEFAULT_PLAYER_STATS } from '../lib/worldData';
import { 
    AlertTriangle, 
    Target, 
    Users, 
    Skull,
    Star,
    Coins,
    Sparkles,
    Footprints,
    Swords,
    Shield
} from 'lucide-react';

interface MonsterEncounterModalProps {
    squad: MonsterSquad;
    progress: WorldProgress;
    onUpdateProgress?: (updated: WorldProgress) => void;
    onSquadUpdate?: (squad: MonsterSquad) => void;
    onStartCombat: (squad: MonsterSquad, targetType: 'leader' | 'ally', allyIndex?: number, preemptiveDamage?: number) => void;
    onStartGoldBoxCombat?: (squad: MonsterSquad, preemptiveDamage?: number) => void;
    onSquadDefeated?: (squad: MonsterSquad) => void;
    onFleeSuccess: (squad: MonsterSquad) => void;
    onFleeFailed: () => void;
    onClose: () => void;
}

// Helper to resolve portrait images for any monster, leader, or ally
function getMonsterPortrait(avatar?: string, title?: string, category?: string, name?: string): string {
    const text = `${avatar || ''} ${title || ''} ${category || ''} ${name || ''}`.toLowerCase();

    if (text.includes('некромант') || text.includes('necromancer') || avatar === '🧙‍♂️' || avatar === '🔮') {
        return '/assets/images/card_necromancer_art_1787957120928.jpg';
    }
    if (text.includes('зомбі') || text.includes('zombie') || avatar === '🧟' || text.includes('мрець')) {
        return '/assets/images/card_death_knight_1787956814001.jpg';
    }
    if (text.includes('скелет') || text.includes('skeleton') || avatar === '💀') {
        return '/assets/images/pixel_death_knight_1788209864646.jpg';
    }
    if (text.includes('лучник') || text.includes('стрілець') || text.includes('арбалет') || avatar === '🏹') {
        return '/assets/images/pixel_ranger_archer_1788209997668.jpg';
    }
    if (text.includes('ассасін') || text.includes('грабіжник') || text.includes('розбійник') || text.includes('бандит') || avatar === '🥷' || avatar === '🗡️') {
        return '/assets/images/card_assassin_thief_art_1787957185780.jpg';
    }
    if (text.includes('головоріз') || text.includes('варвар') || avatar === '🪓') {
        return '/assets/images/card_barbarian_warrior_art_1787957196198.jpg';
    }
    if (text.includes('вершник') || text.includes('кінь') || avatar === '🐎') {
        return '/assets/images/pixel_commander_leader_1788210046612.jpg';
    }
    if (text.includes('чаклун') || text.includes('маг') || avatar === '🧙') {
        return '/assets/images/card_wizard_art_1787956829955.jpg';
    }
    return '/assets/images/card_assassin_thief_art_1787957185780.jpg';
}

export const MonsterEncounterModal: React.FC<MonsterEncounterModalProps> = ({
    squad,
    progress,
    onStartCombat,
    onStartGoldBoxCombat,
    onFleeSuccess,
    onFleeFailed,
    onSquadDefeated
}) => {
    const [fleeAttempted, setFleeAttempted] = useState(false);
    const [fleeResult, setFleeResult] = useState<'success' | 'failed' | null>(null);

    const playerStats = progress?.playerStats || DEFAULT_PLAYER_STATS;
    const playerAgility = playerStats.agility || 10;
    const fleeChance = Math.min(85, Math.max(35, Math.round(playerAgility * 3.5)));

    const livingAlliesCount = squad.allies.filter(a => !a.isDefeated).length;
    const totalAlive = (squad.leader.isDefeated ? 0 : 1) + livingAlliesCount;

    const handleAttemptFlee = () => {
        if (fleeAttempted && fleeResult === 'failed') return;
        setFleeAttempted(true);
        const roll = Math.random() * 100;
        if (roll < fleeChance) {
            setFleeResult('success');
            setTimeout(() => {
                onFleeSuccess(squad);
            }, 900);
        } else {
            setFleeResult('failed');
            onFleeFailed();
        }
    };

    const handleEnterTacticalBattle = () => {
        if (onStartGoldBoxCombat) {
            onStartGoldBoxCombat(squad, 0);
        } else {
            onStartCombat(squad, 'leader', undefined, 0);
        }
    };

    const partyMembers = [
        { 
            name: 'Сир Ольгерд', 
            role: 'Лицар (Гравець)', 
            avatar: '🛡️', 
            hp: playerStats.currentHp && playerStats.currentHp > 0 
                ? Math.min((playerStats.baseHp || 100) + (playerStats.strength || 15), playerStats.currentHp) 
                : ((playerStats.baseHp || 100) + (playerStats.strength || 15)), 
            maxHp: (playerStats.baseHp || 100) + (playerStats.strength || 15) 
        },
        ...(progress.hiredNpcs || []).filter(npc => !npc.isDead).map(npc => {
            const maxHp = Math.max(npc.baseHp || 100, npc.hp || 100);
            const curHp = Math.min(maxHp, npc.hp ?? maxHp);
            return {
                name: npc.name,
                role: npc.title || 'Соратник',
                avatar: npc.avatar || '⚔️',
                hp: curHp,
                maxHp: maxHp
            };
        })
    ];

    const isUndeadCategory = squad.category === 'undead' || squad.name.toLowerCase().includes('некромант') || squad.leader.title.toLowerCase().includes('некромант');
    const leaderPortrait = getMonsterPortrait(squad.leader.avatar, squad.leader.title, squad.category, squad.leader.name);

    // Leader special abilities list
    const leaderAbilities = isUndeadCategory 
        ? ['✨ Закляття Воскресіння', '✨ Володар Скелетів']
        : squad.leader.title.includes('Отаман') || squad.leader.title.includes('Ватажок')
            ? ['⚔️ Шквал Ударів', '🎯 Засідка на Тракту']
            : ['⚔️ Нищівний Удар', '🛡️ Незламна Броня'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md select-none overflow-y-auto">
            <motion.div 
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="relative w-full max-w-2xl bg-[#140c08] border-2 border-red-800/90 rounded-2xl shadow-[0_0_60px_rgba(220,38,38,0.4)] text-[#f5ebd7] p-4 sm:p-6 flex flex-col gap-3.5 max-h-[94vh] overflow-y-auto"
            >
                {/* Top Accent Ribbon */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-700 via-amber-500 to-purple-700 rounded-t-2xl" />

                {/* Header Title */}
                <div className="flex items-center justify-between border-b border-red-900/60 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-950/90 border border-red-500/70 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(239,68,68,0.5)] shrink-0 overflow-hidden">
                            {squad.avatar && (squad.avatar.startsWith('/') || squad.avatar.includes('.jpg') || squad.avatar.includes('.png')) ? (
                                <img src={squad.avatar} alt={squad.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                                <img src={leaderPortrait} alt={squad.name} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black tracking-widest uppercase text-red-400 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                    {isUndeadCategory ? 'ЗУСТРІЧ ІЗ ПРОКЛЯТИМИ' : 'ВОРОЖИЙ ЗАГІН НА ШЛЯХУ'}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                    squad.dangerRating === 'Елітний Вожак' ? 'bg-purple-950 text-purple-300 border border-purple-500/50' :
                                    squad.dangerRating === 'Смертельний' ? 'bg-red-950 text-red-300 border border-red-500/50' :
                                    squad.dangerRating === 'Небезпечний' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                                    'bg-stone-900 text-stone-300 border border-stone-600/50'
                                }`}>
                                    {squad.dangerRating}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black font-serif text-amber-200 tracking-wide">
                                {squad.name}
                            </h2>
                        </div>
                    </div>

                    <div className="text-[11px] font-bold text-red-400 bg-red-950/70 px-2.5 py-1 rounded-lg border border-red-700/60 flex items-center gap-1.5 shrink-0">
                        <Swords className="w-3.5 h-3.5 text-red-400" />
                        <span>БІЙ АБО ВТЕЧА</span>
                    </div>
                </div>

                {/* Squad Lore & Composition Subheader */}
                <div className="bg-[#1c120b] border border-[#b8860b]/30 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Target className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{squad.currentGoal.description}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#c4b5a0] text-xs font-bold">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                            {isUndeadCategory ? 'Сила нечисті:' : 'Сила банди:'}{' '}
                            <strong className="text-amber-300">
                                1 {squad.leader.title.split(' ')[0]}, {livingAlliesCount} {isUndeadCategory ? 'Undead' : 'Ворогів'}
                            </strong>
                        </span>
                    </div>
                </div>

                {/* Enemies Overview Section */}
                <div className="space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Skull className="w-3.5 h-3.5 text-red-400" />
                        <span>СУПРОТИВНИКИ У БИТВІ:</span>
                    </div>

                    {/* Leader Portrait Card (Matches Image 2) */}
                    <div className="p-3 bg-[#1e1115] border-2 border-amber-600/50 rounded-xl flex items-center justify-between gap-3.5 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center gap-3.5 z-10">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-black border-2 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0 overflow-hidden">
                                <img src={leaderPortrait} alt={squad.leader.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-600/50 flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-amber-400" />
                                        Рівень {squad.level}
                                    </span>
                                    {leaderAbilities.map((ab, aIdx) => (
                                        <span key={aIdx} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-600/40">
                                            {ab}
                                        </span>
                                    ))}
                                </div>

                                <div className="text-base sm:text-lg font-black text-amber-100 tracking-wide flex items-center gap-2">
                                    <span>{squad.leader.name}</span>
                                    <span className="text-xs text-[#a89988] font-normal">({squad.leader.title})</span>
                                </div>

                                <div className="text-xs text-[#c4b5a0] flex flex-wrap items-center gap-3 font-mono pt-0.5">
                                    <span className="text-red-400 font-bold flex items-center gap-1">
                                        ❤️ HP: {squad.leader.hp}
                                    </span>
                                    <span>•</span>
                                    <span className="text-amber-300 flex items-center gap-1">
                                        🛡️ Броня: {squad.leader.armor}
                                    </span>
                                    <span>•</span>
                                    <span className="text-orange-300 flex items-center gap-1">
                                        ⚔️ Сила: {squad.leader.strength}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-[11px] font-black uppercase text-red-300 bg-red-950/80 px-2.5 py-1 rounded-lg border border-red-700/60 shrink-0 self-start z-10">
                            Командир
                        </div>
                    </div>

                    {/* Allies Portrait Cards Grid (Matches Image 2) */}
                    {squad.allies.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                            {squad.allies.map((ally, idx) => {
                                const allyPortrait = getMonsterPortrait(ally.avatar, ally.title, squad.category, ally.name);

                                return (
                                    <div 
                                        key={ally.id}
                                        className="p-2.5 bg-[#170e0a] hover:bg-[#20130d] border border-amber-900/40 hover:border-amber-600/60 rounded-xl flex items-center gap-3 transition shadow"
                                    >
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-black border border-stone-700 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                                            <img src={allyPortrait} alt={ally.name} className="w-full h-full object-cover" />
                                        </div>

                                        <div className="overflow-hidden space-y-0.5">
                                            <div className="text-xs font-black text-amber-200 truncate tracking-wide">
                                                #{idx + 1} {ally.name}
                                            </div>
                                            <div className="text-[10px] text-stone-400 truncate">
                                                {ally.title}
                                            </div>
                                            <div className="text-[11px] text-stone-300 flex items-center gap-2 font-mono pt-0.5">
                                                <span className="text-red-400 font-bold">HP: {ally.hp}</span>
                                                <span>•</span>
                                                <span className="text-amber-300">Броня: {ally.armor}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Party Readiness Banner */}
                <div className="p-3 bg-[#111e15] border border-emerald-800/50 rounded-xl flex items-center justify-between gap-3 text-xs shadow-inner">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                            <span className="text-emerald-300 font-bold">Ваш загін готовий до бою:</span>
                            <span className="text-stone-300 ml-1.5">{partyMembers.map(p => p.name).join(', ')}</span>
                        </div>
                    </div>
                    <span className="text-emerald-400 font-black px-2.5 py-0.5 bg-emerald-950 border border-emerald-700/60 rounded-md shrink-0">
                        {partyMembers.length} бійців
                    </span>
                </div>

                {/* Flee Attempt Notification */}
                <AnimatePresence>
                    {fleeAttempted && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-xl border text-center font-bold text-xs ${
                                fleeResult === 'success' 
                                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300' 
                                    : 'bg-rose-950/90 border-rose-500 text-rose-300'
                            }`}
                        >
                            {fleeResult === 'success' ? (
                                <span>🎉 Вдалося втекти! Ви спритно відірвалися від банди.</span>
                            ) : (
                                <span>💥 Втеча провалилася! Вороги відрізали шлях. Доведеться битися!</span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Row with Rewards Included (Matches Image 2) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 border-t border-amber-950/60">
                    <button
                        onClick={handleAttemptFlee}
                        disabled={fleeAttempted && fleeResult === 'failed'}
                        className={`w-full sm:w-auto py-3 px-5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
                            fleeAttempted && fleeResult === 'failed'
                                ? 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'
                                : 'bg-[#221711] hover:bg-[#34241b] border-[#b8860b]/40 text-amber-300 hover:scale-105'
                        }`}
                    >
                        <Footprints className="w-4 h-4 text-amber-400" />
                        <span>Спробувати втекти ({fleeChance}%)</span>
                    </button>

                    {onSquadDefeated && (
                        <button
                            onClick={() => onSquadDefeated(squad)}
                            className="w-full sm:w-auto py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border border-emerald-400/50 shadow-lg hover:scale-105 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            <span>⚡ АВТОПЕРЕМОГА (ТЕСТ)</span>
                        </button>
                    )}

                    <button
                        onClick={handleEnterTacticalBattle}
                        className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-red-700 via-amber-600 to-red-700 hover:from-red-600 hover:via-amber-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(234,88,12,0.5)] border border-amber-400 transition hover:scale-105 cursor-pointer flex items-center justify-center gap-2.5"
                    >
                        <Swords className="w-4 h-4 text-amber-200" />
                        <span>ВСТУПИТИ В БІЙ (ТАКТИЧНИЙ БІЙ)</span>
                        <div className="flex items-center gap-2 ml-1 text-[11px] font-mono text-amber-200 bg-black/40 px-2 py-0.5 rounded border border-amber-400/40">
                            <span>+{squad.rewards.gold} 🪙</span>
                            <span>+{squad.rewards.cardPieces} уламків</span>
                            <span>+{squad.rewards.xp} XP</span>
                        </div>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

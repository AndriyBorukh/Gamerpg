import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WanderingGambler, WanderingGameType } from '../lib/wanderingGamblers';
import { getGamblerMapSprite } from './WanderingGamblerMapToken';
import { WorldProgress } from '../types';
import { 
    Sparkles, 
    Coins, 
    Compass, 
    Trophy, 
    Play, 
    X, 
    ShieldCheck, 
    Award,
    Flame,
    MapPin,
    Users,
    Swords,
    Skull,
    User
} from 'lucide-react';

interface WanderingGamblerModalProps {
    gambler: WanderingGambler;
    progress?: WorldProgress;
    playerGold?: number;
    onStartGame: (gambler: WanderingGambler, betAmount: number, targetType: 'leader' | 'ally', allyIndex?: number) => void;
    onClose: () => void;
}

export const WanderingGamblerModal: React.FC<WanderingGamblerModalProps> = ({
    gambler,
    progress,
    playerGold: playerGoldProp,
    onStartGame,
    onClose
}) => {
    const playerGold = playerGoldProp ?? progress?.playerGold ?? 0;
    const [selectedBet, setSelectedBet] = useState<number>(() => {
        if (playerGold <= 0) return 0;
        return Math.min(gambler.preferredBet, playerGold);
    });

    const betOptions = [
        { label: 'Дружня партія', amount: 0 },
        { label: '10 🪙', amount: 10 },
        { label: `${gambler.preferredBet} 🪙`, amount: gambler.preferredBet },
        { label: `${gambler.maxBet} 🪙`, amount: gambler.maxBet }
    ].filter((opt, idx, arr) => {
        return arr.findIndex(o => o.amount === opt.amount) === idx;
    });

    const aliveAlliesCount = gambler.allies.filter(a => !a.isDefeated).length;
    const totalAlive = ((gambler.opponent as any).isDefeated ? 0 : 1) + aliveAlliesCount;

    return (
        <div 
            id="modal-wandering-gambler"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c1813] via-[#14100c] to-[#0c0907] border-2 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] p-5 sm:p-7 text-stone-200 overflow-hidden max-h-[92vh] overflow-y-auto"
                style={{ borderColor: gambler.themeColor }}
            >
                {/* Background glow matching gambler theme color */}
                <div 
                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: gambler.themeColor }}
                />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-700/60 transition cursor-pointer z-10"
                    title="Закрити"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header: Avatar, Character Sprite, Name, Title */}
                <div className="flex items-start gap-4 mb-4 pr-10">
                    <div 
                        className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-2xl flex items-center justify-center shadow-xl border-2 shrink-0 bg-gradient-to-b from-[#221811] to-[#0d0906] overflow-hidden p-1"
                        style={{ borderColor: gambler.themeColor }}
                    >
                        <img 
                            src={getGamblerMapSprite(gambler)}
                            alt={gambler.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        />
                        <div 
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-stone-950 border border-amber-400 flex items-center justify-center text-xs shadow-md"
                            title={gambler.gameCategoryName}
                        >
                            {gambler.badgeIcon}
                        </div>
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span 
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                                style={{ 
                                    backgroundColor: `${gambler.themeColor}22`,
                                    borderColor: gambler.themeColor,
                                    color: gambler.themeColor
                                }}
                            >
                                Мандрівний Гравець та Свита
                            </span>
                            <span className="text-[10px] bg-stone-800/80 text-stone-300 px-2 py-0.5 rounded-full border border-stone-700/50 flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-400" />
                                {gambler.opponent.difficulty === 'master' ? 'Гросмейстер' :
                                 gambler.opponent.difficulty === 'expert' ? 'Експерт' :
                                 gambler.opponent.difficulty === 'hard' ? 'Майстер' : 'Досвідчений'}
                            </span>
                            <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/60 flex items-center gap-1 font-bold">
                                <Users className="w-3 h-3 text-amber-400" />
                                <span>Живих супротивників: {totalAlive} / {1 + gambler.allies.length}</span>
                            </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200 truncate mt-1">
                            {gambler.name}
                        </h2>
                        <p className="text-xs text-stone-400 font-medium italic">
                            {gambler.title}
                        </p>
                    </div>
                </div>

                {/* Traveling Status Banner */}
                <div className="mb-4 px-3 py-2 rounded-xl bg-stone-950/60 border border-stone-800/80 text-xs flex items-center gap-2 text-stone-300">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">
                        {gambler.currentGoal.description || `Подорожує трактами в пошуках гідних суперників`}
                    </span>
                </div>

                {/* Speech Bubble Greeting */}
                <div className="mb-4 relative p-3.5 bg-gradient-to-r from-amber-950/30 via-stone-900/60 to-amber-950/20 border-l-4 rounded-r-xl text-stone-200 text-xs sm:text-sm italic leading-relaxed"
                    style={{ borderLeftColor: gambler.themeColor }}
                >
                    <p>{gambler.greetingText}</p>
                </div>

                {/* Game Card Spotlight */}
                <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-b from-stone-900/80 to-stone-950/90 border border-stone-800">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{gambler.badgeIcon}</span>
                            <span className="font-serif font-bold text-amber-300 text-sm sm:text-base">
                                {gambler.gameName}
                            </span>
                        </div>
                        <span className="text-[11px] text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded border border-stone-700/50">
                            {gambler.gameCategoryName}
                        </span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed">
                        {gambler.gameDescription}
                    </p>
                </div>

                {/* Stake / Bet Selection */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            Оберіть ставку на гру:
                        </span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                            Ваше золото: {playerGold} 🪙
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {betOptions.map((opt) => {
                            const isSelected = selectedBet === opt.amount;
                            const canAfford = opt.amount <= playerGold;

                            return (
                                <button
                                    key={`bet-${opt.amount}`}
                                    type="button"
                                    disabled={!canAfford && opt.amount > 0}
                                    onClick={() => setSelectedBet(opt.amount)}
                                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                                        isSelected 
                                            ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                            : canAfford
                                            ? 'bg-stone-900/80 text-stone-300 border-stone-700/70 hover:bg-stone-800 hover:text-white'
                                            : 'bg-stone-950/40 text-stone-600 border-stone-800/40 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    <span className="text-[10px] font-normal opacity-80">
                                        {opt.amount === 0 ? 'Без ризику' : `Куш: ${opt.amount * 2} 🪙`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Opponents List: Leader + Allies */}
                <div className="space-y-3 mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Swords className="w-4 h-4 text-amber-400" /> Склад мандрівної компанії (Оберіть супротивника для партії):
                    </h3>

                    {/* Leader Card */}
                    <div className={`p-3.5 rounded-2xl border-2 transition flex items-center justify-between gap-3 ${
                        (gambler.opponent as any).isDefeated 
                            ? 'bg-black/30 border-stone-800 opacity-60' 
                            : 'bg-gradient-to-br from-[#241d13] to-[#17120a] border-amber-600/70 shadow-lg'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-black/70 border-2 border-amber-400 flex items-center justify-center text-2xl shrink-0">
                                {gambler.avatar}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40">
                                        МАЙСТР-ГРАВЕЦЬ
                                    </span>
                                    {(gambler.opponent as any).isDefeated && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-700 flex items-center gap-1">
                                            <Skull className="w-3 h-3 text-stone-500" /> Переможений
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-sm sm:text-base font-black text-amber-100 font-serif">
                                    {gambler.name}
                                </h4>
                                <p className="text-[11px] text-stone-400">{gambler.title} • HP: {gambler.opponent.hp}</p>
                            </div>
                        </div>

                        {!(gambler.opponent as any).isDefeated ? (
                            <button
                                onClick={() => onStartGame(gambler, selectedBet, 'leader')}
                                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold rounded-xl shadow border border-amber-300/60 flex items-center gap-1.5 transition hover:scale-105 cursor-pointer text-xs shrink-0"
                            >
                                <Play className="w-3.5 h-3.5 fill-black" />
                                <span>Зіграти з майстром</span>
                            </button>
                        ) : (
                            <div className="text-xs text-stone-500 italic pr-2">
                                Здолано
                            </div>
                        )}
                    </div>

                    {/* Allies List */}
                    {gambler.allies.length > 0 && (
                        <div className="space-y-2 pt-1">
                            <div className="text-xs font-bold text-amber-300/80 uppercase tracking-wide">
                                Союзники гравця ({gambler.allies.filter(a => !a.isDefeated).length} / {gambler.allies.length} активних):
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                                {gambler.allies.map((ally, idx) => (
                                    <div 
                                        key={ally.id}
                                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                                            ally.isDefeated 
                                                ? 'bg-black/20 border-stone-900 opacity-50' 
                                                : 'bg-[#1b150e] border-stone-800 hover:border-amber-600/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-black/60 border border-stone-700 flex items-center justify-center text-lg shrink-0">
                                                {ally.avatar}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-900 text-amber-300/80">
                                                        Союзник #{idx + 1}
                                                    </span>
                                                    {ally.isDefeated && (
                                                        <span className="text-[9px] text-stone-500 flex items-center gap-0.5">
                                                            <Skull className="w-3 h-3" /> Переможений
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold text-amber-100">
                                                    {ally.name} <span className="text-[10px] text-stone-400 font-normal">({ally.title})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!ally.isDefeated ? (
                                            <button
                                                onClick={() => onStartGame(gambler, selectedBet, 'ally', idx)}
                                                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold rounded-lg border border-amber-600/40 shadow text-xs flex items-center gap-1 transition hover:scale-105 cursor-pointer shrink-0"
                                            >
                                                <Play className="w-3 h-3 fill-amber-200" />
                                                <span>Зіграти</span>
                                            </button>
                                        ) : (
                                            <div className="text-xs text-stone-500 italic pr-2">
                                                Здолано
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-800 text-xs">
                    <span className="text-stone-400">
                        Переможіть усіх у компанії, щоб вони рушили до найближчого міста.
                    </span>
                    <button
                        onClick={onClose}
                        className="py-2 px-4 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-medium rounded-xl border border-stone-700 transition cursor-pointer"
                    >
                        Побажати щасливої дороги
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

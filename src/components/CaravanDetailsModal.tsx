import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TradeCaravan, WorldProgress } from '../types';
import { 
    X, 
    Shield, 
    Sword, 
    Coins, 
    TrendingUp, 
    Package, 
    MapPin, 
    ArrowRight, 
    CheckCircle, 
    AlertTriangle, 
    Heart, 
    Sparkles, 
    Compass, 
    Clock, 
    UserCheck, 
    Zap 
} from 'lucide-react';

interface CaravanDetailsModalProps {
    caravan: TradeCaravan | null;
    isOpen: boolean;
    onClose: () => void;
    progress: WorldProgress;
    onClaimPayout?: (caravan: TradeCaravan) => void;
}

export const CaravanDetailsModal: React.FC<CaravanDetailsModalProps> = ({
    caravan,
    isOpen,
    onClose,
    progress,
    onClaimPayout
}) => {
    if (!isOpen || !caravan) return null;

    const isInCombat = caravan.status === 'in_combat';
    const isCompleted = caravan.status === 'completed';
    const isOutbound = caravan.phase === 'outbound';
    const progressPercent = Math.round(caravan.progress * 100);

    const totalGuardStrength = caravan.guards.reduce((acc, g) => acc + (g.strength || 12), 0);
    const totalGuardArmor = caravan.guards.reduce((acc, g) => acc + (g.armor || 5), 0);
    const playerGuards = caravan.guards.filter(g => g.isPlayerCompanion);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 15 }}
                    className="relative w-full max-w-2xl bg-gradient-to-b from-[#211611] via-[#18110e] to-[#100b09] border-2 border-[#b8860b]/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-4 bg-[#140f0c] border-b border-[#b8860b]/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl p-2 rounded-xl bg-amber-950/80 border border-amber-500/50 shadow-inner">
                                {isInCombat ? '⚔️' : isCompleted ? '🎉' : '🛒'}
                            </span>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-amber-100 font-serif flex items-center gap-2 flex-wrap">
                                    <span>{caravan.name}</span>
                                    {caravan.isPlayerCaravan && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-sans font-black">
                                            ВАШ КАРАВАН
                                        </span>
                                    )}
                                </h3>
                                <div className="text-xs text-[#c5b5a2] flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                                        <MapPin className="w-3 h-3 text-amber-400" />
                                        {caravan.originCityName}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-stone-500" />
                                    <span className="flex items-center gap-1 text-emerald-300 font-bold">
                                        <MapPin className="w-3 h-3 text-emerald-400" />
                                        {caravan.destinationCityName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer border border-stone-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-amber-700/40">
                        {/* Status / Alert Banner */}
                        {isInCombat && caravan.combatState && (
                            <motion.div 
                                animate={{ scale: [1, 1.01, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="p-4 rounded-xl bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500/80 shadow-xl"
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 text-red-200 font-black text-sm">
                                        <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
                                        <span>Триває автобій з ворожим загоном: {caravan.combatState.opponentIcon} {caravan.combatState.opponentSquadName}!</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full bg-red-900/80 border border-red-400 text-red-200 text-xs font-black">
                                        Раунд {caravan.combatState.round}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 bg-black/50 p-3 rounded-lg border border-red-900/50 text-xs mb-3">
                                    <div>
                                        <div className="text-stone-400">🛡️ Здоров'я каравану й охорони:</div>
                                        <div className="font-bold text-emerald-400 text-sm mt-0.5">
                                            {caravan.combatState.caravanHp} / {caravan.combatState.caravanMaxHp} HP
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-stone-400">🗡️ Здоров'я ворожого загону:</div>
                                        <div className="font-bold text-red-400 text-sm mt-0.5">
                                            {caravan.combatState.opponentHp} / {caravan.combatState.opponentMaxHp} HP
                                        </div>
                                    </div>
                                </div>

                                {/* Live Combat Log */}
                                <div className="space-y-1 text-xs max-h-24 overflow-y-auto bg-black/40 p-2.5 rounded-lg border border-red-950">
                                    {caravan.combatState.combatLogs.map((lg, idx) => (
                                        <div key={idx} className="text-red-200 leading-snug">
                                            {lg}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Route & Progress Visualizer */}
                        <div className="p-4 rounded-xl bg-[#17110e] border border-[#b8860b]/40">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="font-bold text-stone-400 flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Фаза пересування:</span>
                                    <span className="text-amber-300 font-bold">
                                        {isCompleted 
                                            ? '✅ Завершено, караван повернувся' 
                                            : isOutbound 
                                            ? `Шлях туди: до ${caravan.destinationCityName}` 
                                            : `Зворотний шлях: повернення до ${caravan.originCityName}`}
                                    </span>
                                </span>
                                <span className="font-black text-amber-300">
                                    {isCompleted ? '100%' : `${progressPercent}% подолано`}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="relative w-full h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                                <motion.div
                                    className={`h-full ${
                                        isCompleted 
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                                            : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500'
                                    }`}
                                    style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center text-[11px] text-stone-400 mt-2 font-mono">
                                <span>🚩 {caravan.originCityName}</span>
                                <span>🎯 {caravan.destinationCityName}</span>
                                <span>🏁 {caravan.originCityName}</span>
                            </div>
                        </div>

                        {/* Cargo Carried */}
                        <div className="p-4 rounded-xl bg-[#17110e] border border-[#b8860b]/40">
                            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-amber-400" />
                                <span>Товари в обозі:</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {caravan.goods.map((item, idx) => (
                                    <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-stone-800 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{item.icon}</span>
                                            <div>
                                                <div className="font-bold text-stone-200">
                                                    {item.goodName}
                                                </div>
                                                <div className="text-[10px] text-stone-400">
                                                    {item.units} {item.unitName} • {item.categoryName}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-emerald-300 font-bold">
                                                ~{item.targetSellPrice * item.units} зол.
                                            </div>
                                            <div className="text-[10px] text-stone-400">
                                                +{Math.round((item.targetSellPrice - item.buyPrice) * item.units)} прибутку
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Guard Escort Squad */}
                        <div className="p-4 rounded-xl bg-[#17110e] border border-[#b8860b]/40">
                            <div className="flex items-center justify-between mb-2.5">
                                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Охорона каравану ({caravan.guards.length} бійців):</span>
                                </h4>
                                <div className="text-[11px] text-stone-400 flex items-center gap-2">
                                    <span>⚔️ Сила: <strong className="text-amber-300">{totalGuardStrength}</strong></span>
                                    <span>🛡️ Броня: <strong className="text-amber-300">{totalGuardArmor}</strong></span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {caravan.guards.map((guard, idx) => (
                                    <div 
                                        key={idx}
                                        className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                                            guard.isPlayerCompanion 
                                                ? 'bg-amber-950/40 border-amber-500/60 shadow-sm' 
                                                : 'bg-black/30 border-stone-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-xl p-1.5 bg-black/40 rounded-lg border border-stone-800">
                                                {guard.avatar}
                                            </span>
                                            <div>
                                                <div className="font-bold text-stone-200 flex items-center gap-1.5">
                                                    <span>{guard.name}</span>
                                                    {guard.isPlayerCompanion && (
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-sans font-bold">
                                                            Ваш союзник
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-stone-400">
                                                    {guard.title} • ❤️ {guard.hp}/{guard.maxHp} HP • ⚔️ {guard.strength} • 🛡️ {guard.armor}
                                                </div>
                                            </div>
                                        </div>

                                        {guard.isPlayerCompanion && (
                                            <div className="text-right">
                                                <div className="text-yellow-300 font-bold">
                                                    +{guard.rewardGold} зол.
                                                </div>
                                                <div className="text-[10px] text-emerald-400 font-sans">
                                                    плата за охорону
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Caravan Combat & Journey History Logs */}
                        <div className="p-3 rounded-xl bg-black/50 border border-stone-800 text-xs">
                            <h5 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-stone-400" />
                                <span>Журнал подорожі каравану:</span>
                            </h5>
                            <div className="space-y-1 max-h-28 overflow-y-auto text-stone-300 text-[11px] leading-relaxed">
                                {caravan.combatHistoryLogs.map((lg, i) => (
                                    <div key={i} className="border-b border-stone-800/50 pb-1 last:border-none">
                                        {lg}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-[#140f0c] border-t border-[#b8860b]/40 flex items-center justify-between gap-3 flex-wrap">
                        {isCompleted ? (
                            <button
                                onClick={() => {
                                    if (onClaimPayout) {
                                        onClaimPayout(caravan);
                                    }
                                    onClose();
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs sm:text-sm transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ml-auto"
                            >
                                <Coins className="w-4 h-4" />
                                <span>Забрати виторг (+{caravan.playerPayoutGold || (caravan.totalInvestedGold + caravan.totalExpectedProfit)} зол) та повернути союзників</span>
                            </button>
                        ) : (
                            <div className="w-full flex items-center justify-between text-xs">
                                <div className="text-stone-400">
                                    Очікуваний виторг по завершенню: <strong className="text-yellow-300">+{caravan.totalInvestedGold + caravan.totalExpectedProfit} зол</strong>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-xl font-bold text-stone-300 transition cursor-pointer"
                                >
                                    Закрити
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

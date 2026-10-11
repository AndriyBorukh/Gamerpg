import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SettlementData, WorldProgress, HiredCompanion, TradeCaravan } from '../types';
import { 
    GUILD_COMMODITY_CATEGORIES, 
    CommodityCategory, 
    CommoditySubGood, 
    GuildInvestmentPosition, 
    GUILD_RANKS, 
    getGuildRank, 
    getCommodityMarketPrice 
} from '../lib/tradeGuildData';
import { 
    createTradeCaravanFromInvestment, 
    collectCaravanPayout,
    pickRandomTradeDestination 
} from '../lib/tradeCaravans';
import { playGoldSound, playLevelUpSound } from '../lib/soundEffects';
import { saveWorldProgress } from '../lib/worldData';
import {
    X,
    Coins,
    TrendingUp,
    TrendingDown,
    Package,
    Landmark,
    Award,
    Sparkles,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRightLeft,
    SlidersHorizontal,
    Search,
    ShieldCheck,
    Briefcase,
    Zap,
    Scale,
    Info,
    RefreshCw,
    Shield,
    Compass,
    ArrowRight,
    UserCheck,
    Check,
    MapPin,
    AlertTriangle,
    Eye
} from 'lucide-react';
import { CaravanDetailsModal } from './CaravanDetailsModal';

interface MerchantGuildModalProps {
    isOpen: boolean;
    onClose: () => void;
    settlement: SettlementData;
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
}

export function MerchantGuildModal({
    isOpen,
    onClose,
    settlement,
    progress,
    onUpdateProgress
}: MerchantGuildModalProps) {
    const [activeTab, setActiveTab] = useState<'market' | 'caravans' | 'guards' | 'portfolio' | 'ranks'>('market');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('food');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedGood, setSelectedGood] = useState<{ category: CommodityCategory; good: CommoditySubGood } | null>(null);
    const [investQuantity, setInvestQuantity] = useState<number>(5);
    const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
    const [inspectCaravan, setInspectCaravan] = useState<TradeCaravan | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const timeSeed = progress.tradeTurnSeed || 0;
    const currentReputation = progress.guildReputation || 0;
    const currentRank = getGuildRank(currentReputation);
    const playerGold = progress.playerGold || 0;
    const totalProfit = progress.guildTotalProfit || 0;
    const activeInvestments: GuildInvestmentPosition[] = progress.guildInvestments || [];
    const activeCaravans: TradeCaravan[] = progress.activeCaravans || [];
    const companions: HiredCompanion[] = progress.hiredNpcs || [];

    const availableCompanions = useMemo(() => {
        return companions.filter(c => !c.isDead && !c.isGuardingCaravan && !c.restingInTavernSettlementId);
    }, [companions]);

    const guardingCompanions = useMemo(() => {
        return companions.filter(c => c.isGuardingCaravan);
    }, [companions]);

    const restingCompanions = useMemo(() => {
        return companions.filter(c => c.restingInTavernSettlementId);
    }, [companions]);

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 4000);
    };

    // Calculate total value of active investments at current local market prices
    const portfolioStats = useMemo(() => {
        let totalInvested = 0;
        let currentValue = 0;
        let totalDividends = 0;

        activeInvestments.forEach(inv => {
            totalInvested += inv.totalInvestedGold;
            totalDividends += inv.accumulatedDividends || 0;
            const category = GUILD_COMMODITY_CATEGORIES.find(c => c.id === inv.categoryId);
            const good = category?.goods.find(g => g.id === inv.goodId);
            if (good && category) {
                const market = getCommodityMarketPrice(settlement.id, good, category, timeSeed);
                currentValue += market.currentPrice * inv.unitsCount;
            } else {
                currentValue += inv.totalInvestedGold;
            }
        });

        const netProfit = (currentValue + totalDividends) - totalInvested;
        return {
            totalInvested,
            currentValue,
            totalDividends,
            netProfit
        };
    }, [activeInvestments, settlement.id, timeSeed]);

    // Active Category
    const activeCategory = useMemo(() => {
        return GUILD_COMMODITY_CATEGORIES.find(c => c.id === selectedCategoryId) || GUILD_COMMODITY_CATEGORIES[0];
    }, [selectedCategoryId]);

    // Filter goods by search query if present
    const displayedCategories = useMemo(() => {
        if (!searchQuery.trim()) return GUILD_COMMODITY_CATEGORIES;
        const query = searchQuery.toLowerCase();
        return GUILD_COMMODITY_CATEGORIES.filter(cat => 
            cat.name.toLowerCase().includes(query) || 
            cat.goods.some(g => g.name.toLowerCase().includes(query) || g.description.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    // Advance market cycle
    const handleAdvanceMarketTime = () => {
        const newSeed = timeSeed + 1;
        let dividendGained = 0;
        const updatedInvestments = activeInvestments.map(inv => {
            const cat = GUILD_COMMODITY_CATEGORIES.find(c => c.id === inv.categoryId);
            const good = cat?.goods.find(g => g.id === inv.goodId);
            if (!good || !cat) return inv;

            let divRate = 0.04;
            if (good.volatility === 'medium') divRate = 0.06;
            if (good.volatility === 'high') divRate = 0.09;
            if (good.volatility === 'extreme') divRate = 0.13;
            
            divRate += (currentRank.profitBonusPercent / 100);
            const payout = Math.max(1, Math.round(inv.totalInvestedGold * divRate));
            dividendGained += payout;

            return {
                ...inv,
                accumulatedDividends: (inv.accumulatedDividends || 0) + payout,
                daysActive: (inv.daysActive || 0) + 1
            };
        });

        const updatedProgress: WorldProgress = {
            ...progress,
            tradeTurnSeed: newSeed,
            guildInvestments: updatedInvestments
        };

        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        playLevelUpSound();
        showNotification(`⏳ Ринковий день минув! Ціни оновилися. Ваші каравани принесли +${dividendGained} зол дивідендів!`);
    };

    // Form and dispatch a caravan with the chosen goods
    const handleDispatchCaravan = (asCaravan: boolean = true) => {
        if (!selectedGood) return;
        const { category, good } = selectedGood;
        const market = getCommodityMarketPrice(settlement.id, good, category, timeSeed);
        
        const rawCost = market.currentPrice * investQuantity;
        const feePercent = Math.max(0, 8 - (currentRank.feeDiscountPercent / 100) * 8);
        const feeGold = Math.round(rawCost * (feePercent / 100));
        const totalCost = rawCost + feeGold;

        if (playerGold < totalCost) {
            showNotification('❌ Недостатньо золота для спорядження обозу!');
            return;
        }

        // Selected companion guards
        const chosenGuards = companions.filter(c => selectedGuardIds.includes(c.id));

        // Create caravan
        const newCaravan = createTradeCaravanFromInvestment(
            settlement,
            category,
            good,
            investQuantity,
            totalCost,
            timeSeed,
            chosenGuards
        );

        // Update companion states (mark as escorting)
        const updatedCompanions = companions.map(comp => {
            if (selectedGuardIds.includes(comp.id)) {
                return {
                    ...comp,
                    isGuardingCaravan: true,
                    currentCaravanId: newCaravan.id
                };
            }
            return comp;
        });

        // Award Guild Reputation
        const repGain = Math.max(15, Math.round(totalCost / 10));
        const updatedReputation = currentReputation + repGain;

        const updatedCaravans = [newCaravan, ...activeCaravans];
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: playerGold - totalCost,
            guildReputation: updatedReputation,
            activeCaravans: updatedCaravans,
            hiredNpcs: updatedCompanions
        };

        playGoldSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        setSelectedGood(null);
        setSelectedGuardIds([]);
        setInvestQuantity(5);
        showNotification(`🛒 Караван вирушив до міста «${newCaravan.destinationCityName}» з ${investQuantity} ${good.unitName} «${good.name}»! Охорона супроводжує обоз.`);
        setActiveTab('caravans');
    };

    // Collect payout from completed caravan
    const handleClaimCaravan = (caravan: TradeCaravan) => {
        const result = collectCaravanPayout(caravan, progress);
        playGoldSound();
        onUpdateProgress(result.updatedProgress);
        saveWorldProgress(result.updatedProgress);
        showNotification(`🎉 Отримано прибуток +${result.payoutGold} зол! ${result.returnedCompanionsCount} союзників повернено до таверни міста ${caravan.originCityName}!`);
        setInspectCaravan(null);
    };

    // Rejoin companion resting in tavern
    const handleRejoinRestingCompanion = (companionId: string) => {
        const comp = companions.find(c => c.id === companionId);
        if (!comp) return;

        const bonusGold = comp.guardRewardEarned || 80;
        const updatedHired = companions.map(c => {
            if (c.id === companionId) {
                return {
                    ...c,
                    isGuardingCaravan: false,
                    currentCaravanId: undefined,
                    restingInTavernSettlementId: undefined,
                    guardRewardEarned: 0
                };
            }
            return c;
        });

        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: (progress.playerGold || 0) + bonusGold,
            hiredNpcs: updatedHired
        };

        playGoldSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        showNotification(`🤝 Союзник ${comp.name} повернувся з таверни до вашого загону та передав зароблені +${bonusGold} золотих!`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 15 }}
                className="relative w-full max-w-6xl bg-[#140e11] border-2 border-amber-500/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7] my-auto max-h-[94vh]"
            >
                {/* Notification toast */}
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-xl border border-yellow-200 flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-stone-900 animate-pulse" />
                            <span>{notification}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="relative bg-gradient-to-r from-[#24171e] via-[#1c1217] to-[#2a1b15] border-b border-amber-500/40 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3 bg-black/40 rounded-2xl border border-amber-500/50 shadow-inner flex items-center justify-center text-3xl">
                            🏛️
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-bold text-amber-300 flex items-center gap-1">
                                    <Landmark className="w-3 h-3 text-amber-400" />
                                    <span>Торгова Гільдія Купців</span>
                                </span>
                                <span className="text-xs text-stone-400 bg-black/30 px-2 py-0.5 rounded-full border border-stone-800">
                                    Місто: <strong className="text-amber-200">{settlement.name}</strong> ({settlement.region})
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black font-serif text-amber-100 tracking-wide flex items-center gap-2">
                                <span>Купецький Двір та Товарна Біржа</span>
                            </h2>
                            <p className="text-xs text-stone-400 mt-0.5">
                                Вкладайтеся у 19 категорій товарів, споряджайте каравани по карті та відправляйте союзників в охорону за золото!
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats & Controls */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Gold */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-xl border border-amber-500/40 shadow-inner">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <div className="text-right">
                                <div className="text-[10px] text-stone-400 uppercase font-bold">Ваше золото</div>
                                <div className="text-sm font-black text-yellow-300 font-mono">{playerGold} зол</div>
                            </div>
                        </div>

                        {/* Rank Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 rounded-xl border border-amber-500/40 shadow-inner">
                            <span className="text-lg">{currentRank.badge}</span>
                            <div>
                                <div className="text-[10px] text-stone-400 uppercase font-bold">Ранг у гільдії</div>
                                <div className="text-xs font-black text-amber-200">{currentRank.title}</div>
                            </div>
                        </div>

                        {/* Advance time button */}
                        <button
                            onClick={handleAdvanceMarketTime}
                            className="px-3 py-2 bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            title="Оновити ринковий попит, цінові тренди та нарахувати дивіденди по вкладах"
                        >
                            <RefreshCw className="w-3.5 h-3.5 text-stone-950" />
                            <span>Оновити ринок</span>
                        </button>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-[#180f14] border-b border-stone-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                        <button
                            onClick={() => setActiveTab('market')}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'market'
                                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-md'
                                    : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                            <span>Товарні Ринки (19 категорій)</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('caravans')}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
                                activeTab === 'caravans'
                                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-md'
                                    : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            <Compass className="w-3.5 h-3.5 text-amber-400" />
                            <span>Активні Каравани на карті</span>
                            {activeCaravans.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-[10px] font-black text-stone-950">
                                    {activeCaravans.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('guards')}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
                                activeTab === 'guards'
                                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-md'
                                    : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            <span>Охорона Караванів (Союзники)</span>
                            {restingCompanions.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-[10px] font-black text-stone-950 animate-pulse">
                                    {restingCompanions.length} в таверні
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('ranks')}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'ranks'
                                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-md'
                                    : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>Гільдійські Ранги & Привілеї</span>
                        </button>
                    </div>

                    {/* Search Bar for goods */}
                    {activeTab === 'market' && (
                        <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Пошук товару (зерно, хутро, меч...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 py-1 bg-black/40 border border-stone-700/80 rounded-xl text-xs text-amber-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400 w-48 sm:w-64"
                            />
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-4 overflow-y-auto flex-1 max-h-[64vh]">
                    {/* TAB 1: COMMODITY MARKETS */}
                    {activeTab === 'market' && (
                        <div className="space-y-4">
                            {/* Category selector pills */}
                            <div>
                                <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                                    <span>Оберіть категорію товарів для інвестицій та спорядження каравану:</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                                    {displayedCategories.map(category => {
                                        const isSelected = selectedCategoryId === category.id;
                                        return (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategoryId(category.id)}
                                                className={`p-2 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-gradient-to-r from-amber-600/30 to-yellow-600/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                                                        : 'bg-black/30 border-stone-800 text-stone-300 hover:bg-stone-900/60 hover:border-stone-700'
                                                }`}
                                            >
                                                <span className="text-xl shrink-0">{category.icon}</span>
                                                <div className="truncate">
                                                    <div className="text-xs font-bold truncate">{category.name}</div>
                                                    <div className="text-[10px] text-stone-400 truncate">{category.goods.length} товарів</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Active Category Header */}
                            <div className="p-3 bg-gradient-to-r from-amber-950/40 via-stone-900/60 to-black/40 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-2xl">{activeCategory.icon}</span>
                                    <div>
                                        <h3 className="font-bold text-sm text-amber-200 font-serif">
                                            Категорія «{activeCategory.name}»
                                        </h3>
                                        <p className="text-[11px] text-stone-400 italic">
                                            {activeCategory.categoryQuote}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-xs text-stone-400">
                                    Товарів на біржі: <strong className="text-amber-300">{activeCategory.goods.length}</strong>
                                </div>
                            </div>

                            {/* Goods Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {activeCategory.goods.map(good => {
                                    const market = getCommodityMarketPrice(settlement.id, good, activeCategory, timeSeed);
                                    const isGoodSelected = selectedGood?.good.id === good.id;

                                    return (
                                        <div
                                            key={good.id}
                                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                                                isGoodSelected
                                                    ? 'bg-[#26171d] border-amber-400 shadow-lg ring-1 ring-amber-400'
                                                    : 'bg-[#181014] border-stone-800 hover:border-amber-500/50 hover:bg-[#1f141a]'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl p-1 bg-black/40 rounded-lg border border-stone-800">
                                                            {good.icon}
                                                        </span>
                                                        <div>
                                                            <div className="font-bold text-sm text-amber-100">
                                                                {good.name}
                                                            </div>
                                                            <div className="text-[10px] text-stone-400">
                                                                Одиниця: <span className="text-stone-300">{good.unitName}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Trend badge */}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                                                        market.trend === 'skyrocketing' || market.trend === 'rising'
                                                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60'
                                                            : market.trend === 'crashing' || market.trend === 'falling'
                                                            ? 'bg-rose-950/70 text-rose-300 border-rose-500/60'
                                                            : 'bg-stone-900/70 text-stone-300 border-stone-700/60'
                                                    }`}>
                                                        <span>{market.trendLabel}</span>
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-stone-400 mb-3 line-clamp-2">
                                                    {good.description}
                                                </p>

                                                {/* Price block */}
                                                <div className="bg-black/40 p-2.5 rounded-xl border border-stone-800/80 mb-3 flex items-center justify-between text-xs">
                                                    <div>
                                                        <div className="text-[10px] text-stone-400">Ціна закупівлі:</div>
                                                        <div className="font-black text-sm text-yellow-300 font-mono flex items-center gap-1">
                                                            <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                                            <span>{market.currentPrice} зол / {good.unitName}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-stone-400">Базова ціна:</div>
                                                        <div className="text-stone-400 font-mono">
                                                            {good.basePrice} зол
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={() => {
                                                    setSelectedGood({ category: activeCategory, good });
                                                    setInvestQuantity(5);
                                                }}
                                                className="w-full py-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <span>🛒 Спорядити Караван / Вкластися</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: ACTIVE CARAVANS */}
                    {activeTab === 'caravans' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div>
                                    <h3 className="font-bold text-base text-amber-200 font-serif flex items-center gap-2">
                                        <span>Обози та Торгові Каравани на карті</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                            {activeCaravans.length} активних
                                        </span>
                                    </h3>
                                    <p className="text-xs text-stone-400 mt-0.5">
                                        Каравани подорожують між містами по карті світу, продають вантаж та повертаються з прибутком. На шляху можливі сутички з бандитами в автобою!
                                    </p>
                                </div>
                            </div>

                            {activeCaravans.length === 0 ? (
                                <div className="p-8 text-center bg-black/40 rounded-2xl border border-stone-800 text-stone-400">
                                    <span className="text-4xl block mb-2">🛒</span>
                                    <div className="font-bold text-stone-300 text-sm mb-1">Наразі немає активних караванів у дорозі</div>
                                    <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
                                        Оберіть товар у вкладці «Товарні Ринки», сформуйте обоз та призначте охорону з ваших союзників!
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('market')}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl transition cursor-pointer"
                                    >
                                        Перейти до вибору товарів
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {activeCaravans.map(caravan => {
                                        const isInCombat = caravan.status === 'in_combat';
                                        const isCompleted = caravan.status === 'completed';
                                        const isOutbound = caravan.phase === 'outbound';
                                        const progressPercent = Math.round(caravan.progress * 100);

                                        return (
                                            <div
                                                key={caravan.id}
                                                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                                                    isInCombat 
                                                        ? 'bg-rose-950/40 border-red-500 shadow-lg' 
                                                        : isCompleted
                                                        ? 'bg-emerald-950/30 border-emerald-500/70'
                                                        : 'bg-[#181115] border-stone-800 hover:border-amber-500/50'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl p-1.5 bg-black/40 rounded-xl border border-stone-800">
                                                                {isInCombat ? '⚔️' : isCompleted ? '🎉' : '🛒'}
                                                            </span>
                                                            <div>
                                                                <h4 className="font-bold text-sm text-stone-200">
                                                                    {caravan.name}
                                                                </h4>
                                                                <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-amber-300 font-bold">{caravan.originCityName}</span>
                                                                    <ArrowRight className="w-3 h-3 text-stone-500" />
                                                                    <span className="text-emerald-300 font-bold">{caravan.destinationCityName}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isInCombat ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                                                                В АВТОБОЮ!
                                                            </span>
                                                        ) : isCompleted ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black">
                                                                ПОВЕРНУВСЯ!
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-300 text-[10px] font-bold">
                                                                {isOutbound ? 'До міста ➔' : 'Повернення 🔄'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="space-y-1 mb-3">
                                                        <div className="flex justify-between text-[10px] text-stone-400">
                                                            <span>{isOutbound ? `Шлях до ${caravan.destinationCityName}` : `Повернення до ${caravan.originCityName}`}</span>
                                                            <span className="font-bold text-amber-300">{isCompleted ? '100%' : `${progressPercent}%`}</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                                                            <div 
                                                                className={`h-full ${
                                                                    isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                                                }`}
                                                                style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Cargo & Guards Badges */}
                                                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-xl border border-stone-800 text-xs mb-3">
                                                        <div>
                                                            <div className="text-[10px] text-stone-400">Товари в обозі:</div>
                                                            <div className="font-bold text-stone-200 truncate mt-0.5">
                                                                {caravan.goods.map(g => `${g.icon} ${g.goodName} (${g.units})`).join(', ')}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-stone-400">Охорона:</div>
                                                            <div className="font-bold text-amber-300 mt-0.5">
                                                                🛡️ {caravan.guards.length} бійців ({caravan.guards.filter(g => g.isPlayerCompanion).length} ваших)
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setInspectCaravan(caravan)}
                                                        className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Оглянути / Журнал</span>
                                                    </button>

                                                    {isCompleted && (
                                                        <button
                                                            onClick={() => handleClaimCaravan(caravan)}
                                                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-stone-950 font-black rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Coins className="w-3.5 h-3.5" />
                                                            <span>Забрати виторг (+{caravan.playerPayoutGold || (caravan.totalInvestedGold + caravan.totalExpectedProfit)} зол)</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: ESCORT GUARDS & COMPANIONS */}
                    {activeTab === 'guards' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-base text-amber-200 font-serif flex items-center gap-2">
                                    <span>Охорона Караванів: Наймання ваших союзників</span>
                                </h3>
                                <p className="text-xs text-stone-400 mt-0.5">
                                    Відправляйте бійців вашого загону в охорону купецьких караванів за солідну плату золотом та бойовий досвід! По поверненні союзник чекатиме на вас у таверні.
                                </p>
                            </div>

                            {/* Resting Companions in Tavern notification banner */}
                            {restingCompanions.length > 0 && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/60 border border-emerald-500/70 shadow-lg">
                                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        <span>Союзники успішно повернулися з каравану та відпочивають у таверні!</span>
                                    </div>
                                    <div className="space-y-2">
                                        {restingCompanions.map(comp => (
                                            <div key={comp.id} className="p-2.5 rounded-lg bg-black/50 border border-emerald-700/50 flex items-center justify-between text-xs flex-wrap gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-xl p-1 bg-black/60 rounded-lg">{comp.avatar || '⚔️'}</span>
                                                    <div>
                                                        <div className="font-bold text-emerald-200">{comp.name}</div>
                                                        <div className="text-[10px] text-stone-400">
                                                            {comp.title} • Зароблена плата: <strong className="text-yellow-300">+{comp.guardRewardEarned || 80} зол</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRejoinRestingCompanion(comp.id)}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-stone-950 font-black rounded-lg text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                    <span>Повернути до загону (+{comp.guardRewardEarned || 80} зол)</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Companions Roster */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Ваші доступні союзники для охорони ({availableCompanions.length}):</span>
                                </h4>

                                {availableCompanions.length === 0 ? (
                                    <div className="p-6 text-center bg-black/30 rounded-xl border border-stone-800 text-stone-400 text-xs">
                                        Наразі у вас немає вільних союзників у загоні. Найміть NPC у тавернах або звільніть союзників з інших завдань!
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {availableCompanions.map(comp => (
                                            <div
                                                key={comp.id}
                                                className="p-3 rounded-xl bg-[#171014] border border-stone-800 flex flex-col justify-between"
                                            >
                                                <div className="flex items-start gap-2.5 mb-2">
                                                    <span className="text-2xl p-1.5 bg-black/40 rounded-xl border border-stone-800">
                                                        {comp.avatar || '⚔️'}
                                                    </span>
                                                    <div>
                                                        <div className="font-bold text-xs text-stone-200">
                                                            {comp.name}
                                                        </div>
                                                        <div className="text-[10px] text-amber-300 font-mono">
                                                            Рівень {comp.level || 1} • {comp.title}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-1 bg-black/40 p-2 rounded-lg text-[10px] text-stone-300 mb-2.5 text-center">
                                                    <div>❤️ {comp.hp || 100} HP</div>
                                                    <div>⚔️ {comp.strength || 15} Сил</div>
                                                    <div>🛡️ {comp.armor || 10} Брон</div>
                                                </div>

                                                <div className="text-[10px] text-emerald-400 text-center font-bold bg-emerald-950/40 py-1 rounded border border-emerald-900/50">
                                                    💰 Оплата за караван: ~80-150 зол
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: GUILD RANKS */}
                    {activeTab === 'ranks' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-amber-950/50 via-[#22171c] to-black/50 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl p-2 rounded-xl bg-black/40 border border-amber-500/40">
                                        {currentRank.badge}
                                    </span>
                                    <div>
                                        <div className="text-xs text-stone-400">Поточний купецький ранг:</div>
                                        <h3 className="font-black text-lg text-amber-200 font-serif">
                                            {currentRank.title}
                                        </h3>
                                        <div className="text-xs text-stone-300 mt-0.5">
                                            Репутація гільдії: <strong className="text-amber-300">{currentReputation} XP</strong> • Загальний прибуток: <strong className="text-yellow-300">{totalProfit} зол</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {GUILD_RANKS.map((rk, idx) => {
                                    const isCurrent = rk.rank === currentRank.rank;
                                    const isUnlocked = currentReputation >= rk.requiredReputation;

                                    return (
                                        <div
                                            key={rk.rank}
                                            className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 flex-wrap ${
                                                isCurrent 
                                                    ? 'bg-amber-950/50 border-amber-400 shadow-md ring-1 ring-amber-400/40' 
                                                    : isUnlocked 
                                                    ? 'bg-black/30 border-stone-800 opacity-90' 
                                                    : 'bg-stone-950/40 border-stone-900 opacity-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl p-2 rounded-xl bg-black/50 border border-stone-800">
                                                    {rk.badge}
                                                </span>
                                                <div>
                                                    <div className="font-bold text-sm text-stone-200 flex items-center gap-2">
                                                        <span>{rk.title}</span>
                                                        {isCurrent && (
                                                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500 text-stone-950 font-black">
                                                                ПОТОЧНИЙ
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-stone-400 mt-0.5">
                                                        Потрібно: <strong className="text-amber-300">{rk.requiredReputation} XP</strong> • Знижка мита: <strong className="text-emerald-300">{rk.feeDiscountPercent}%</strong> • Бонус доходу: <strong className="text-yellow-300">+{rk.profitBonusPercent}%</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL: INVESTMENT & CARAVAN DISPATCH SELECTOR */}
                <AnimatePresence>
                    {selectedGood && (
                        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative w-full max-w-lg bg-[#191014] border-2 border-amber-500 rounded-2xl p-5 shadow-2xl space-y-4 text-stone-200 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-3xl p-1.5 bg-black/40 rounded-xl border border-stone-800">
                                            {selectedGood.good.icon}
                                        </span>
                                        <div>
                                            <h3 className="font-bold text-base text-amber-100">
                                                Спорядити караван: «{selectedGood.good.name}»
                                            </h3>
                                            <div className="text-xs text-stone-400">
                                                Категорія: <span className="text-amber-300">{selectedGood.category.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedGood(null)}
                                        className="p-1.5 rounded-lg bg-stone-900 text-stone-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Quantity Slider */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1 font-bold">
                                        <span>Кількість товару:</span>
                                        <span className="text-amber-300">{investQuantity} {selectedGood.good.unitName}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={investQuantity}
                                        onChange={(e) => setInvestQuantity(parseInt(e.target.value) || 1)}
                                        className="w-full accent-amber-500 cursor-pointer"
                                    />
                                    <div className="flex gap-1.5 mt-2">
                                        {[1, 5, 10, 20, 35, 50].map(cnt => (
                                            <button
                                                key={cnt}
                                                onClick={() => setInvestQuantity(cnt)}
                                                className={`flex-1 py-1 rounded text-xs font-bold transition ${
                                                    investQuantity === cnt 
                                                        ? 'bg-amber-500 text-stone-950 font-black' 
                                                        : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                                                }`}
                                            >
                                                {cnt}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Companion Escort Selection */}
                                <div>
                                    <div className="flex justify-between items-center text-xs mb-1.5">
                                        <span className="font-bold text-stone-300 flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Оберіть союзників для охорони каравану:</span>
                                        </span>
                                        <span className="text-[10px] text-stone-400">
                                            ({selectedGuardIds.length} обрано)
                                        </span>
                                    </div>

                                    {availableCompanions.length === 0 ? (
                                        <div className="p-2.5 rounded-lg bg-black/40 border border-stone-800 text-[11px] text-stone-400 text-center">
                                            Немає вільних союзників. Гільдія додасть стандартних найманців.
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                            {availableCompanions.map(comp => {
                                                const isChosen = selectedGuardIds.includes(comp.id);
                                                return (
                                                    <button
                                                        key={comp.id}
                                                        onClick={() => {
                                                            if (isChosen) {
                                                                setSelectedGuardIds(prev => prev.filter(id => id !== comp.id));
                                                            } else {
                                                                setSelectedGuardIds(prev => [...prev, comp.id]);
                                                            }
                                                        }}
                                                        className={`w-full p-2 rounded-lg border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                                                            isChosen 
                                                                ? 'bg-amber-950/60 border-amber-400 text-amber-200' 
                                                                : 'bg-black/30 border-stone-800 text-stone-400 hover:border-stone-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>{comp.avatar || '⚔️'}</span>
                                                            <span className="font-bold">{comp.name}</span>
                                                            <span className="text-[10px] text-stone-400">({comp.title})</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-yellow-300 font-bold">~100 зол</span>
                                                            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${isChosen ? 'bg-amber-500 text-black' : 'border border-stone-700'}`}>
                                                                {isChosen ? '✓' : ''}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Price Summary */}
                                {(() => {
                                    const market = getCommodityMarketPrice(settlement.id, selectedGood.good, selectedGood.category, timeSeed);
                                    const rawCost = market.currentPrice * investQuantity;
                                    const feePercent = Math.max(0, 8 - (currentRank.feeDiscountPercent / 100) * 8);
                                    const feeGold = Math.round(rawCost * (feePercent / 100));
                                    const totalCost = rawCost + feeGold;

                                    return (
                                        <div className="p-3 bg-black/50 rounded-xl border border-stone-800 text-xs space-y-1">
                                            <div className="flex justify-between text-stone-400">
                                                <span>Вартість партії товару:</span>
                                                <span className="font-mono">{rawCost} зол</span>
                                            </div>
                                            <div className="flex justify-between text-stone-400">
                                                <span>Мито гільдії ({feePercent.toFixed(1)}%):</span>
                                                <span className="font-mono">+{feeGold} зол</span>
                                            </div>
                                            <div className="flex justify-between text-amber-200 font-bold border-t border-stone-800 pt-1 text-sm">
                                                <span>Разом до сплати:</span>
                                                <span className="font-mono text-yellow-300">{totalCost} зол</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <button
                                    onClick={() => handleDispatchCaravan(true)}
                                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Compass className="w-4 h-4" />
                                    <span>Спорядити караван та вирушити в путь</span>
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* INSPECT CARAVAN MODAL */}
                <CaravanDetailsModal
                    caravan={inspectCaravan}
                    isOpen={!!inspectCaravan}
                    onClose={() => setInspectCaravan(null)}
                    progress={progress}
                    onClaimPayout={(caravan) => handleClaimCaravan(caravan)}
                />
            </motion.div>
        </div>
    );
}

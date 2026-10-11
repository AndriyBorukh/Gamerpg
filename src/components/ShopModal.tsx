import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Zap, RefreshCw, Sparkles, CheckCircle2, Ticket, AlertCircle } from 'lucide-react';
import { ShopStock } from '../types';

interface ShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    powerPoints: number;
    shopStock: ShopStock;
    onBuy: (itemKey: keyof ShopStock) => void;
    opponentName?: string;
    opponentAvatar?: string;
    refreshTokens?: number;
    onRefreshShop?: () => void;
}

export const SHOP_ITEMS: { key: keyof ShopStock; name: string; cost: number; desc: string; icon: string; totalLimit: number }[] = [
    { key: 'weakStrengthBoost', name: 'Слабке підняття сили', cost: 1, desc: 'Будь-яка наступна карта битиме з силою +1 (триває 1 хід)', icon: '🗡️', totalLimit: 12 },
    { key: 'strengthBoost', name: 'Підняття сили', cost: 2, desc: 'Будь-яка наступна карта битиме з силою +3 (триває 1 хід)', icon: '⚔️', totalLimit: 10 },
    { key: 'strongStrengthBoost', name: 'Сильне підняття сили', cost: 4, desc: 'Будь-яка наступна карта битиме з силою +10 (триває 1 хід)', icon: '💥', totalLimit: 8 },
    { key: 'spells', name: 'Випадкове закляття', cost: 2, desc: 'Отримує 1 випадкове закляття в руку', icon: '🔮', totalLimit: 18 },
    { key: 'immortality', name: 'Безсмертя (3 ходи)', cost: 4, desc: 'Ваші карти зі столу повертаються в руку при бито', icon: '🛡️', totalLimit: 6 },
    { key: 'summonGhost', name: 'Виклик привида', cost: 2, desc: 'Забирає або закликає Привида з відбою', icon: '👻', totalLimit: 12 },
    { key: 'summonSkeletons', name: 'Виклик скелетів', cost: 2, desc: '3 карти з відбою у вічний відбій -> 3 Скелети', icon: '☠️', totalLimit: 10 },
    { key: 'summonZombies', name: 'Виклик зомбі', cost: 2, desc: '3 карти з відбою у вічний відбій -> 3 Зомбі', icon: '🧟', totalLimit: 8 },
    { key: 'illusionCopy', name: 'Ілюзорна копія', cost: 3, desc: 'Створює копію будь-якої вашої карти в руці', icon: '✨', totalLimit: 9 },
    { key: 'endTurn', name: 'Закінчити хід', cost: 3, desc: 'Моментально закінчує поточний кон (Бито)', icon: '⌛', totalLimit: 14 },
    { key: 'summonGolem', name: 'Виклик голема', cost: 1, desc: 'Отримує 1 Голема (сила 4, вічна)', icon: '🗿', totalLimit: 9 },
    { key: 'summonAnimatronic', name: 'Виклик аніматроніка', cost: 1, desc: 'Отримує 1 Аніматроніка (сила 3, вічна)', icon: '🤖', totalLimit: 9 },
    { key: 'summonAutomaton', name: 'Виклик автоматона', cost: 2, desc: 'Отримує 1 Автоматона (сила 5, вічна)', icon: '⚙️', totalLimit: 9 },
    { key: 'meteorSwarm', name: 'Метеоритний дощ', cost: 5, desc: 'Закляття: Знищує стіл та наносить урон супротивникам', icon: '☄️', totalLimit: 6 },
    { key: 'manaShield', name: 'Магічний Щит', cost: 3, desc: 'Закляття: Дає +60 Захисту та 2 карти заклять', icon: '🛡️', totalLimit: 8 },
    { key: 'chainLightning', name: 'Ланцюгова блискавка', cost: 4, desc: 'Закляття: Знищує карту на столі та відновлює хід', icon: '⚡', totalLimit: 10 },
    { key: 'massDeath', name: 'Масова смерть', cost: 6, desc: 'Закляття: Усі карти зі столу йдуть у вічний відбій, хід завершується', icon: '💀', totalLimit: 6 },
    { key: 'deathRay', name: 'Промінь смерті', cost: 4, desc: 'Закляття: Б’є карту зі столу у вічний відбій', icon: '🔮', totalLimit: 8 },
    { key: 'mindHeist', name: 'Викрадення розуму', cost: 5, desc: 'Закляття: Завершує хід і забирає карти зі столу без пошкодження', icon: '👁️', totalLimit: 8 },
    { key: 'conversion', name: 'Навернення до віри', cost: 5, desc: 'Закляття: Забирає карти зі столу без урону, перетворивши 1 на Священника', icon: '✨', totalLimit: 6 },
    { key: 'holyCathedral', name: 'Святий собор', cost: 6, desc: 'Закляття: Дає Клірика, Священника, Єпископа, Архієпископа й завершує хід', icon: '⛪', totalLimit: 5 },
    { key: 'northernWind', name: 'Вітер з півночі', cost: 5, desc: 'Закляття: Дає 3 карти Драккар (приводить вікінгів) і завершує хід', icon: '❄️', totalLimit: 6 },
    { key: 'horde', name: 'Орда', cost: 5, desc: 'Закляття: Дає 3 карти Орди (викликає ординців) і завершує хід', icon: '🪓', totalLimit: 6 },
    { key: 'undeadLord', name: 'Повелитель нежиті', cost: 6, desc: 'Закляття: Дає закляття призову привида, зомбі та скелетів', icon: '👑', totalLimit: 6 },
    { key: 'zombiePlague', name: 'Зомбі мор', cost: 5, desc: 'Закляття: Усі карти зі столу стають зомбі і йдуть до рук без пошкодження', icon: '🧟', totalLimit: 6 },
    { key: 'turnToSkeletons', name: 'Перетворити у скелетів', cost: 5, desc: 'Закляття: Усі карти зі столу стають скелетами і йдуть до рук без пошкодження', icon: '☠️', totalLimit: 6 },
    { key: 'pirateRaid', name: 'Піратський набіг', cost: 5, desc: 'Закляття: Дає 3 Піратські кораблі (дають екіпаж) і завершує хід', icon: '🏴‍☠️', totalLimit: 6 },
    { key: 'undeadLordSpell', name: 'Владика мертвих', cost: 8, desc: 'Закляття: Новий гравець з 20 картами Лицарів смерті', icon: '💀', totalLimit: 3 },
    { key: 'grandKonungSpell', name: 'Великий конунг', cost: 8, desc: 'Закляття: Новий гравець з 5 Драккарами та 8 Вікінгами', icon: '❄️', totalLimit: 3 },
    { key: 'greatKhanSpell', name: 'Великий хан', cost: 7, desc: 'Закляття: Новий гравець з 10 картами Кочівників', icon: '🐎', totalLimit: 3 },
    { key: 'zombieApocalypseSpell', name: 'Зомбі апокаліпсис', cost: 9, desc: 'Закляття: Усі карти гравця -> Зомбі, переходять до гравця Орда зомбі', icon: '🧟', totalLimit: 2 },
    { key: 'invadersSpell', name: 'Загарбники', cost: 7, desc: 'Закляття: Новий гравець Загарбник з 5 Королями та 5 Лицарями', icon: '⚔️', totalLimit: 3 },
    { key: 'stormOfSeasSpell', name: 'Гроза морів', cost: 8, desc: 'Закляття: Новий гравець з 8 Піратськими кораблями та 5 Піратами', icon: '🌊', totalLimit: 3 },
    { key: 'einherjarSpell', name: 'Ейнхерії', cost: 9, desc: 'Закляття: Усі карти з відбою -> новий гравець Ейнхерії (сила 10)', icon: '🛡️', totalLimit: 2 },
    { key: 'helArmySpell', name: 'Армія Хель', cost: 9, desc: 'Закляття: Усі карти з вічного відбою -> новий гравець Драугри (сила 8)', icon: '💀', totalLimit: 2 },
    { key: 'burnCardSpell', name: 'Спалити карту', cost: 3, desc: 'Закляття: Знищує будь-яку карту в руці, даючи її цінність ресурсами', icon: '🔥', totalLimit: 6 },
    { key: 'burnHandSpell', name: 'Спалити карти', cost: 5, desc: 'Закляття: Знищує усі карти в руці, даючи ресурси за кожну', icon: '🧨', totalLimit: 4 },
    { key: 'summonVampire', name: 'Виклик вампіра', cost: 4, desc: 'Отримує 1 карту Вампіра в руку', icon: '🦇', totalLimit: 8 },
    { key: 'summonVampireSpell', name: 'Закляття Вампіра', cost: 4, desc: 'Отримує 1 Закляття Вампіра (перетворює іншу карту в руці на Вампіра)', icon: '🔮', totalLimit: 8 },
    { key: 'smeltingLvl1', name: 'Переплавлення (1 рівень)', cost: 3, desc: 'Знищує 10 карт з вічного відбою -> 1 випадкова карта', icon: '⚒️', totalLimit: 6 },
    { key: 'smeltingLvl2', name: 'Переплавлення (2 рівень)', cost: 3, desc: 'Знищує 8 карт з вічного відбою -> 1 випадкова карта', icon: '⚒️', totalLimit: 5 },
    { key: 'smeltingLvl3', name: 'Переплавлення (3 рівень)', cost: 4, desc: 'Знищує 8 карт з вічного відбою -> 2 випадкові карти', icon: '⚒️', totalLimit: 5 },
    { key: 'smeltingLvl4', name: 'Переплавлення (4 рівень)', cost: 4, desc: 'Знищує 8 карт з вічного відбою -> 4 випадкові карти', icon: '⚒️', totalLimit: 5 },
    { key: 'smeltingLvl5', name: 'Переплавлення (5 рівень)', cost: 5, desc: 'Знищує 6 карт з вічного відбою -> 4 випадкові карти', icon: '⚒️', totalLimit: 5 },
    { key: 'smeltingLvl6', name: 'Переплавлення (6 рівень)', cost: 6, desc: 'Знищує 8 карт з вічного відбою -> 2 карти Героя', icon: '⚒️', totalLimit: 3 },
    { key: 'smeltingLvl7', name: 'Переплавлення (7 рівень)', cost: 6, desc: 'Знищує 4 карти з вічного відбою -> 12 карт Золота', icon: '⚒️', totalLimit: 3 },
    { key: 'smeltingLvl8', name: 'Переплавлення (8 рівень)', cost: 8, desc: 'Знищує 24 карти з вічного відбою -> 1 карта на вибір', icon: '⚒️', totalLimit: 4 },
    { key: 'resourceReleaseLvl1', name: 'Вивільнення ресурсів (1 рівень)', cost: 1, desc: 'Знищує 12 карт з вічного відбою -> +2 очка сили', icon: '💎', totalLimit: 6 },
    { key: 'resourceReleaseLvl2', name: 'Вивільнення ресурсів (2 рівень)', cost: 1, desc: 'Знищує 10 карт з вічного відбою -> +2 очка сили', icon: '💎', totalLimit: 5 },
    { key: 'resourceReleaseLvl3', name: 'Вивільнення ресурсів (3 рівень)', cost: 1, desc: 'Знищує 8 карт з вічного відбою -> +2 очка сили', icon: '💎', totalLimit: 5 },
    { key: 'resourceReleaseLvl4', name: 'Вивільнення ресурсів (4 рівень)', cost: 1, desc: 'Знищує 8 карт з вічного відбою -> +4 очка сили', icon: '💎', totalLimit: 5 },
    { key: 'resourceReleaseLvl5', name: 'Вивільнення ресурсів (5 рівень)', cost: 1, desc: 'Знищує 6 карт з вічного відбою -> +4 очка сили', icon: '💎', totalLimit: 5 },
    { key: 'resourceReleaseLvl6', name: 'Вивільнення ресурсів (6 рівень)', cost: 1, desc: 'Знищує 6 карт з вічного відбою -> +5 очок сили', icon: '💎', totalLimit: 3 },
    { key: 'resourceReleaseLvl7', name: 'Вивільнення ресурсів (7 рівень)', cost: 1, desc: 'Знищує 6 карт з вічного відбою -> +6 очок сили', icon: '💎', totalLimit: 3 },
];

export const ShopModal = ({ 
    isOpen, 
    onClose, 
    powerPoints, 
    shopStock, 
    onBuy,
    opponentName,
    opponentAvatar,
    refreshTokens = 0,
    onRefreshShop
}: ShopModalProps) => {
    const [refreshSuccessToast, setRefreshSuccessToast] = useState(false);

    if (!isOpen) return null;

    const handleDoRefresh = () => {
        if (!onRefreshShop || refreshTokens <= 0) return;
        onRefreshShop();
        setRefreshSuccessToast(true);
        setTimeout(() => setRefreshSuccessToast(false), 2500);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 text-2xl flex items-center justify-center">
                                {opponentAvatar ? opponentAvatar : <ShoppingBag className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-amber-300 flex items-center gap-2">
                                    <span>Магазин заклять{opponentName ? `: ${opponentName}` : ''}</span>
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Індивідуальний запас заклять супротивника. Не оновлюється автоматично між дуелями.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-300 font-bold text-xs sm:text-sm">
                                <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span>{powerPoints} Ресурсів</span>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Refresh Tokens Action Bar */}
                    <div className="mt-3 p-3 bg-gradient-to-r from-purple-950/60 via-slate-800/80 to-purple-950/60 border border-purple-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-2.5 text-xs text-purple-200">
                            <div className="p-1.5 bg-purple-500/20 border border-purple-400/40 rounded-xl text-purple-300">
                                <Ticket className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                                <div className="font-bold flex items-center gap-1.5">
                                    <span>Токени оновлення магазину:</span>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-900 border border-purple-400 text-purple-200 font-black text-xs">
                                        🎟️ {refreshTokens} шт.
                                    </span>
                                </div>
                                <div className="text-[10px] text-purple-300/80">
                                    Дається лише 1 раз за першу перемогу над кожним новим супротивником у карткових дуелях
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleDoRefresh}
                            disabled={refreshTokens <= 0 || !onRefreshShop}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                                refreshTokens > 0 && onRefreshShop
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                            }`}
                            title={refreshTokens > 0 ? "Списати 1 токен і повністю відновити початковий запас заклять цього супротивника" : "Потрібен 1 токен оновлення (перемагайте нових суперників)"}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshTokens > 0 ? 'text-purple-200' : 'text-slate-500'}`} />
                            <span>Оновити асортимент (1 🎟️)</span>
                        </button>
                    </div>

                    {/* Toast Alert on Refresh */}
                    {refreshSuccessToast && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-2 p-2 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 text-center"
                        >
                            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                            <span>✨ Асортимент магазину заклять супротивника успішно відновлено!</span>
                        </motion.div>
                    )}

                    {/* Stock Grid */}
                    <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700 mt-1">
                        {SHOP_ITEMS.map(item => {
                            const available = shopStock ? shopStock[item.key] : item.totalLimit;
                            const canAfford = powerPoints >= item.cost && available > 0;

                            return (
                                <div 
                                    key={`shop-item-${item.key}`}
                                    className={`p-3 rounded-2xl border flex flex-col justify-between gap-2.5 transition-all ${
                                        available > 0 
                                            ? 'bg-slate-800/80 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800' 
                                            : 'bg-slate-900/50 border-slate-800 opacity-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-2xl">{item.icon}</span>
                                            <div>
                                                <h3 className="font-bold text-slate-200 text-xs sm:text-sm">{item.name}</h3>
                                                <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                                        <div className="text-xs font-semibold text-slate-400">
                                            В наявності: <span className={available > 0 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>{available} / {item.totalLimit}</span>
                                        </div>

                                        <button
                                            disabled={!canAfford}
                                            onClick={() => onBuy(item.key)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                                                canAfford 
                                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 hover:scale-105 active:scale-95 cursor-pointer' 
                                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <Zap className="w-3.5 h-3.5 fill-current" />
                                            <span>{item.cost} {item.cost === 1 ? 'очко' : 'очки'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span className="text-[11px] italic flex items-center gap-1">
                            <span>💡 Купівля заклять витрачає товар саме у цього суперника.</span>
                        </span>
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                            Закрити
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
